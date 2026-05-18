"use client";

/**
 * Segments — saved filter presets that materialise into shareable user
 * lists. Phase-4 upgrade:
 *   - Live `userCount` computed from `mockClients` via the segment
 *     evaluator (no more stale persisted numbers).
 *   - Structured filter builder (status / kycStatus / level /
 *     riskLevel / lifecycleStage / hasFtd / country / minAccountCount)
 *     replaces the v1 raw-JSON textarea — only "Filter (JSON)" expert
 *     mode is kept as a fold-out for the "I know what I want" case.
 *   - Edit / delete / view-members / open-in-list actions per segment.
 *
 * Persistence strategy:
 *   - Initial seed is `clientService.listSegments()` (hits the prisma
 *     mock).
 *   - User edits / deletes / new segments live in localStorage:
 *       `crm:clients:segments:custom`    — array of net-new segments
 *       `crm:clients:segments:overrides` — { [id]: Partial<Segment> }
 *       `crm:clients:segments:deleted`   — string[] of hidden ids
 *     so the page survives a refresh without a backend round-trip.
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Plus,
  ArrowRight,
  Pencil,
  Trash2,
  Users as UsersIcon,
  ExternalLink,
} from "lucide-react";
import { Card, PageHeader, Button, Drawer, DrawerFooter } from "@/components/crm/ui";
import { Breadcrumb } from "@/components/crm/layout";
import {
  ConfigDrawer,
  Field,
  TextArea,
  TextInput,
} from "@/components/crm/clm/config/ConfigDrawer";
import { clientService } from "@/lib/crm/services/client.service";
import { mockClients } from "@/lib/crm/mock-clients";
import {
  countSegmentMembers,
  evaluateSegment,
  isEmptyFilter,
  type SegmentFilter,
} from "@/lib/crm/segment-evaluator";
import { useT } from "@/lib/i18n/LocaleProvider";
import type {
  BackofficeUser,
  ClientSegment,
  KYCStatus,
  LifecycleStage,
  RiskLevel,
  UserLevel,
  UserStatus,
} from "@/types/backoffice/user";

// ─── localStorage keys ──────────────────────────────────────────────
const LS_CUSTOM    = "crm:clients:segments:custom";
const LS_OVERRIDES = "crm:clients:segments:overrides";
const LS_DELETED   = "crm:clients:segments:deleted";

// ─── Pill option tables ─────────────────────────────────────────────
const STATUS_OPTS: { value: UserStatus; label: string }[] = [
  { value: "active",  label: "活跃"   },
  { value: "frozen",  label: "冻结"   },
  { value: "pending", label: "待激活" },
  { value: "closed",  label: "已关闭" },
];
const KYC_OPTS: { value: KYCStatus; label: string }[] = [
  { value: "not_submitted", label: "未提交" },
  { value: "pending",       label: "待审核" },
  { value: "verified",      label: "已认证" },
  { value: "rejected",      label: "已拒绝" },
];
const LEVEL_OPTS: { value: UserLevel; label: string; tone: string }[] = [
  { value: "standard",   label: "Standard",   tone: "bg-slate-100 text-slate-700"   },
  { value: "vip",        label: "VIP",        tone: "bg-blue-100 text-blue-700"     },
  { value: "premium",    label: "Premium",    tone: "bg-amber-100 text-amber-700"   },
  { value: "enterprise", label: "Enterprise", tone: "bg-violet-100 text-violet-700" },
];
const RISK_OPTS: { value: RiskLevel; label: string; tone: string }[] = [
  { value: "low",      label: "Low",      tone: "bg-emerald-100 text-emerald-700" },
  { value: "medium",   label: "Medium",   tone: "bg-blue-100 text-blue-700"       },
  { value: "high",     label: "High",     tone: "bg-amber-100 text-amber-700"     },
  { value: "critical", label: "Critical", tone: "bg-red-100 text-red-700"         },
];
const LIFECYCLE_OPTS: { value: LifecycleStage; label: string }[] = [
  { value: "registered", label: "已注册" },
  { value: "verified",   label: "已认证" },
  { value: "ftd",        label: "首存"   },
  { value: "active",     label: "活跃"   },
  { value: "inactive",   label: "不活跃" },
  { value: "churn",      label: "流失"   },
];
const COUNTRY_OPTS = ["CN", "HK", "TW", "SG", "JP", "DE", "GB", "AE", "SA", "VN"];

// ─── Helpers ────────────────────────────────────────────────────────
function readLS<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function writeLS<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota / private mode — ignore */
  }
}

type DraftSegment = {
  id?: string;
  name: string;
  description: string;
  isDynamic: boolean;
  filter: SegmentFilter;
};
const EMPTY_DRAFT: DraftSegment = {
  name: "",
  description: "",
  isDynamic: true,
  filter: {},
};

// ─── Page ───────────────────────────────────────────────────────────
export default function SegmentsPage() {
  const { t } = useT();
  const [serverSegments, setServerSegments] = useState<ClientSegment[]>([]);
  const [customSegments, setCustomSegments] = useState<ClientSegment[]>([]);
  const [overrides, setOverrides]           = useState<Record<string, Partial<ClientSegment>>>({});
  const [deleted, setDeleted]               = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  // Edit / create drawer
  const [editorOpen, setEditorOpen] = useState(false);
  const [draft, setDraft] = useState<DraftSegment>(EMPTY_DRAFT);
  const [saving, setSaving] = useState(false);

  // Members drawer
  const [membersForSeg, setMembersForSeg] = useState<ClientSegment | null>(null);

  // ─── Initial load ─────────────────────────────────────────────────
  useEffect(() => {
    setCustomSegments(readLS<ClientSegment[]>(LS_CUSTOM, []));
    setOverrides(readLS<Record<string, Partial<ClientSegment>>>(LS_OVERRIDES, {}));
    setDeleted(readLS<string[]>(LS_DELETED, []));
    (async () => {
      try {
        const data = await clientService.listSegments();
        setServerSegments(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ─── Materialised list ────────────────────────────────────────────
  const segments = useMemo<ClientSegment[]>(() => {
    const merged = [...serverSegments, ...customSegments]
      .filter((s) => !deleted.includes(s.id))
      .map((s) => ({ ...s, ...(overrides[s.id] ?? {}) }));
    // Recompute live userCount for every entry — overrides legacy values.
    return merged.map((s) => ({
      ...s,
      userCount: countSegmentMembers(s.filter, mockClients),
    }));
  }, [serverSegments, customSegments, overrides, deleted]);

  // ─── Stats ────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const totalUsers = new Set<string>();
    for (const s of segments) {
      for (const m of evaluateSegment(s.filter, mockClients)) totalUsers.add(m.id);
    }
    return {
      total:       segments.length,
      dynamic:     segments.filter((s) => s.isDynamic).length,
      static:      segments.filter((s) => !s.isDynamic).length,
      uniqueUsers: totalUsers.size,
    };
  }, [segments]);

  // ─── Mutation helpers ─────────────────────────────────────────────
  const openCreate = () => {
    setDraft(EMPTY_DRAFT);
    setEditorOpen(true);
  };
  const openEdit = (s: ClientSegment) => {
    setDraft({
      id:          s.id,
      name:        s.name,
      description: s.description ?? "",
      isDynamic:   s.isDynamic,
      filter:      s.filter,
    });
    setEditorOpen(true);
  };

  const persistCustom = (list: ClientSegment[]) => {
    setCustomSegments(list);
    writeLS(LS_CUSTOM, list);
  };
  const persistOverrides = (map: Record<string, Partial<ClientSegment>>) => {
    setOverrides(map);
    writeLS(LS_OVERRIDES, map);
  };
  const persistDeleted = (ids: string[]) => {
    setDeleted(ids);
    writeLS(LS_DELETED, ids);
  };

  const save = () => {
    if (!draft.name.trim()) return;
    setSaving(true);
    if (draft.id) {
      // Editing existing — write to overrides
      const patch: Partial<ClientSegment> = {
        name:        draft.name.trim(),
        description: draft.description.trim() || undefined,
        isDynamic:   draft.isDynamic,
        filter:      draft.filter,
      };
      persistOverrides({ ...overrides, [draft.id]: { ...(overrides[draft.id] ?? {}), ...patch } });
    } else {
      const id = `seg-custom-${Date.now()}`;
      const newSeg: ClientSegment = {
        id,
        name:        draft.name.trim(),
        description: draft.description.trim() || undefined,
        filter:      draft.filter,
        userCount:   countSegmentMembers(draft.filter, mockClients),
        isDynamic:   draft.isDynamic,
        createdAt:   new Date().toISOString(),
      };
      persistCustom([newSeg, ...customSegments]);
    }
    setSaving(false);
    setEditorOpen(false);
  };

  const removeSegment = (s: ClientSegment) => {
    if (!confirm(`确定删除分组 "${s.name}"?`)) return;
    // If it's a custom one — drop from custom list. Otherwise mark deleted.
    if (customSegments.some((c) => c.id === s.id)) {
      persistCustom(customSegments.filter((c) => c.id !== s.id));
    } else {
      persistDeleted([...deleted, s.id]);
    }
  };

  const resetAllOverrides = () => {
    if (!confirm("重置所有本地修改？这将恢复服务端原始 segments。")) return;
    persistCustom([]);
    persistOverrides({});
    persistDeleted([]);
  };

  // ─── Render ───────────────────────────────────────────────────────
  return (
    <div className="space-y-3">
      <Breadcrumb items={[{ label: "Clients" }, { label: t("clients.crumb.segments") }]} />

      <PageHeader
        title={t("clients.segments.title")}
        description="保存的筛选条件 / 客群组合 — 跨员工共享的可复用客户列表"
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={resetAllOverrides}
              className="text-[11px] text-slate-500 hover:text-slate-700 underline-offset-2 hover:underline"
            >
              重置本地修改
            </button>
            <Button onClick={openCreate}>
              <Plus className="w-4 h-4" />
              {t("clients.segments.create")}
            </Button>
          </div>
        }
      />

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          Error: {error}
        </div>
      )}

      {/* ─── KPI strip ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label={t("clients.segments.stat.total")}   value={stats.total} />
        <StatCard label={t("clients.segments.stat.dynamic")} value={stats.dynamic} tone="info" />
        <StatCard label={t("clients.segments.stat.static")}  value={stats.static}  tone="ok" />
        <StatCard label="覆盖客户（去重）"                    value={stats.uniqueUsers} tone="violet" />
      </div>

      {/* ─── Segments grid ───────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {loading && (
          <div className="col-span-full text-sm text-slate-400 py-8 text-center">
            Loading segments…
          </div>
        )}
        {!loading && segments.length === 0 && (
          <div className="col-span-full text-sm text-slate-400 py-8 text-center">
            No segments yet
          </div>
        )}
        {!loading && segments.map((s) => (
          <SegmentCard
            key={s.id}
            segment={s}
            onView={() => setMembersForSeg(s)}
            onEdit={() => openEdit(s)}
            onDelete={() => removeSegment(s)}
          />
        ))}
      </div>

      {/* ─── Create / Edit drawer ────────────────────────────── */}
      <ConfigDrawer
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        onSave={save}
        title={draft.id ? "编辑分组" : "新建分组"}
        subtitle="基于条件筛选客户的可复用集合"
        saving={saving}
        saveDisabled={!draft.name.trim()}
        width={560}
      >
        <SegmentEditor draft={draft} onChange={setDraft} />
      </ConfigDrawer>

      {/* ─── Members drawer ──────────────────────────────────── */}
      <MembersDrawer
        segment={membersForSeg}
        onClose={() => setMembersForSeg(null)}
      />
    </div>
  );
}

// ─── Segment card ────────────────────────────────────────────────────
function SegmentCard({
  segment, onView, onEdit, onDelete,
}: {
  segment: ClientSegment;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const queryString = useMemo(() => filterToQueryString(segment.filter), [segment.filter]);
  return (
    <Card padding="md" className="hover:border-primary/30 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-slate-900 text-sm flex items-center gap-2">
            {segment.name}
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                segment.isDynamic
                  ? "bg-blue-100 text-blue-700"
                  : "bg-emerald-100 text-emerald-700"
              }`}
            >
              {segment.isDynamic ? "动态" : "静态"}
            </span>
          </h3>
          {segment.description && (
            <p className="text-xs text-slate-500 mt-1">{segment.description}</p>
          )}

          {/* Filter chips */}
          <FilterChips filter={segment.filter} />

          <div className="mt-2.5 flex items-center gap-3 text-xs">
            <span className="inline-flex items-center gap-1 text-slate-700">
              <UsersIcon className="w-3.5 h-3.5" />
              <span className="font-semibold tabular-nums">{segment.userCount}</span>
              <span className="text-slate-500">名客户</span>
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-[11px] text-slate-400">
              创建于 {new Date(segment.createdAt).toLocaleDateString("zh-CN")}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-1.5 items-end flex-shrink-0">
          <button
            onClick={onView}
            className="text-[11px] text-blue-600 hover:underline inline-flex items-center gap-1"
          >
            查看成员
            <ArrowRight className="w-3 h-3" />
          </button>
          <Link
            href={queryString ? `/crm/clients?${queryString}` : "/crm/clients"}
            className="text-[11px] text-slate-500 hover:text-slate-700 inline-flex items-center gap-1"
          >
            在列表中打开
            <ExternalLink className="w-3 h-3" />
          </Link>
          <div className="flex items-center gap-1 mt-1">
            <button
              onClick={onEdit}
              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded"
              aria-label="Edit"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onDelete}
              className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
              aria-label="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}

// ─── Filter chips (compact summary on each card) ─────────────────────
function FilterChips({ filter }: { filter: SegmentFilter }) {
  if (isEmptyFilter(filter)) {
    return (
      <p className="text-[11px] text-slate-400 mt-2 italic">无筛选条件（匹配所有客户）</p>
    );
  }
  const chips: { key: string; label: string }[] = [];
  if (filter.status)   chips.push({ key: "status",   label: `状态: ${labelOf(STATUS_OPTS, filter.status)}` });
  if (filter.kycStatus) chips.push({ key: "kyc",     label: `KYC: ${labelOf(KYC_OPTS, filter.kycStatus)}` });
  if (filter.level)    chips.push({ key: "level",    label: `等级: ${labelOf(LEVEL_OPTS, filter.level)}` });
  if (filter.riskLevel) chips.push({ key: "risk",    label: `风险: ${labelOf(RISK_OPTS, filter.riskLevel)}` });
  if (filter.lifecycleStage) chips.push({ key: "ls", label: `生命周期: ${labelOf(LIFECYCLE_OPTS, filter.lifecycleStage)}` });
  if (typeof filter.hasFtd === "boolean") chips.push({ key: "ftd", label: filter.hasFtd ? "已首存" : "未首存" });
  if (filter.country && filter.country.length > 0) chips.push({ key: "country", label: `地区: ${filter.country.join(",")}` });
  if (filter.role) chips.push({ key: "role", label: `角色: ${filter.role}` });
  if (typeof filter.minAccountCount === "number") chips.push({ key: "minA", label: `账户≥${filter.minAccountCount}` });
  if (typeof filter.maxAccountCount === "number") chips.push({ key: "maxA", label: `账户≤${filter.maxAccountCount}` });
  return (
    <div className="mt-2 flex flex-wrap gap-1">
      {chips.map((c) => (
        <span
          key={c.key}
          className="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-100 text-[10px] text-slate-700"
        >
          {c.label}
        </span>
      ))}
    </div>
  );
}

function labelOf<T extends { value: string; label: string }>(opts: T[], v: string): string {
  return opts.find((o) => o.value === v)?.label ?? v;
}

// ─── Editor body ─────────────────────────────────────────────────────
function SegmentEditor({
  draft, onChange,
}: {
  draft: DraftSegment;
  onChange: (next: DraftSegment) => void;
}) {
  const f = draft.filter;
  const setFilter = (patch: Partial<SegmentFilter>) =>
    onChange({ ...draft, filter: { ...f, ...patch } });

  const livePreviewCount = useMemo(
    () => countSegmentMembers(f, mockClients),
    [f]
  );

  return (
    <>
      <Field label="名称" required>
        <TextInput
          value={draft.name}
          onChange={(e) => onChange({ ...draft, name: e.target.value })}
          placeholder="e.g. High Risk + UAE"
        />
      </Field>

      <Field label="描述">
        <TextArea
          value={draft.description}
          onChange={(e) => onChange({ ...draft, description: e.target.value })}
          rows={2}
          placeholder="这个分组的用途..."
        />
      </Field>

      <Field label="类型">
        <div className="flex gap-2">
          <TypeChip
            label="动态 · 每次重新评估"
            active={draft.isDynamic}
            onClick={() => onChange({ ...draft, isDynamic: true })}
          />
          <TypeChip
            label="静态 · 固定名单快照"
            active={!draft.isDynamic}
            onClick={() => onChange({ ...draft, isDynamic: false })}
          />
        </div>
      </Field>

      <div className="border-t border-slate-200 pt-3 mt-1">
        <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-500 mb-2">
          筛选条件
        </p>

        <Field label="账户状态">
          <PillPicker
            options={STATUS_OPTS}
            value={f.status}
            onChange={(v) => setFilter({ status: v as UserStatus | undefined })}
          />
        </Field>

        <Field label="KYC 状态">
          <PillPicker
            options={KYC_OPTS}
            value={f.kycStatus}
            onChange={(v) => setFilter({ kycStatus: v as KYCStatus | undefined })}
          />
        </Field>

        <Field label="客户等级">
          <PillPicker
            options={LEVEL_OPTS}
            value={f.level}
            onChange={(v) => setFilter({ level: v as UserLevel | undefined })}
          />
        </Field>

        <Field label="风险等级">
          <PillPicker
            options={RISK_OPTS}
            value={f.riskLevel}
            onChange={(v) => setFilter({ riskLevel: v as RiskLevel | undefined })}
          />
        </Field>

        <Field label="生命周期阶段">
          <PillPicker
            options={LIFECYCLE_OPTS}
            value={f.lifecycleStage}
            onChange={(v) => setFilter({ lifecycleStage: v as LifecycleStage | undefined })}
          />
        </Field>

        <Field label="首存状态">
          <div className="flex gap-2">
            <TypeChip
              label="不限"
              active={f.hasFtd === undefined}
              onClick={() => setFilter({ hasFtd: undefined })}
            />
            <TypeChip
              label="已首存"
              active={f.hasFtd === true}
              onClick={() => setFilter({ hasFtd: true })}
            />
            <TypeChip
              label="未首存"
              active={f.hasFtd === false}
              onClick={() => setFilter({ hasFtd: false })}
            />
          </div>
        </Field>

        <Field label="国家 / 地区（多选）">
          <div className="flex flex-wrap gap-1.5">
            {COUNTRY_OPTS.map((c) => {
              const selected = (f.country ?? []).includes(c);
              return (
                <button
                  type="button"
                  key={c}
                  onClick={() => {
                    const cur = new Set(f.country ?? []);
                    if (selected) cur.delete(c); else cur.add(c);
                    setFilter({ country: cur.size === 0 ? undefined : Array.from(cur) });
                  }}
                  className={`px-2 h-7 rounded-md text-xs border ${
                    selected
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </Field>

        <Field label="最少交易账户数">
          <input
            type="number"
            min={0}
            value={f.minAccountCount ?? ""}
            onChange={(e) => {
              const n = e.target.value === "" ? undefined : Number(e.target.value);
              setFilter({ minAccountCount: Number.isFinite(n as number) ? (n as number) : undefined });
            }}
            placeholder="留空 = 不限"
            className="w-32 h-9 px-3 rounded-md border border-slate-200 text-sm tabular-nums"
          />
        </Field>
      </div>

      <div className="mt-2 p-2.5 rounded-md bg-blue-50 border border-blue-100 text-xs text-blue-700">
        实时预估命中：<span className="font-bold tabular-nums">{livePreviewCount}</span> 名客户
        {isEmptyFilter(f) && <span className="ml-2 text-blue-500">（当前无任何筛选条件 → 全量匹配）</span>}
      </div>
    </>
  );
}

function TypeChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 h-8 rounded-md text-xs font-medium border ${
        active
          ? "bg-blue-600 text-white border-blue-600"
          : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
      }`}
    >
      {label}
    </button>
  );
}

function PillPicker<T extends string>({
  options, value, onChange,
}: {
  options: { value: T; label: string; tone?: string }[];
  value: T | undefined;
  onChange: (v: T | undefined) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <button
        type="button"
        onClick={() => onChange(undefined)}
        className={`px-2 h-7 rounded-md text-xs border ${
          value === undefined
            ? "bg-slate-800 text-white border-slate-800"
            : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
        }`}
      >
        不限
      </button>
      {options.map((o) => (
        <button
          type="button"
          key={o.value}
          onClick={() => onChange(o.value === value ? undefined : o.value)}
          className={`px-2 h-7 rounded-md text-xs border ${
            value === o.value
              ? "bg-blue-600 text-white border-blue-600"
              : `bg-white text-slate-700 border-slate-200 hover:border-slate-300 ${o.tone ?? ""}`
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ─── Members drawer ──────────────────────────────────────────────────
function MembersDrawer({
  segment, onClose,
}: {
  segment: ClientSegment | null;
  onClose: () => void;
}) {
  const members: BackofficeUser[] = useMemo(
    () => (segment ? evaluateSegment(segment.filter, mockClients) : []),
    [segment]
  );
  const queryString = segment ? filterToQueryString(segment.filter) : "";
  return (
    <Drawer
      open={!!segment}
      onClose={onClose}
      title={segment ? `分组成员 · ${segment.name}` : ""}
      description={segment ? `匹配 ${members.length} 名客户` : ""}
      size="lg"
      footer={
        segment && (
          <DrawerFooter>
            <Link
              href={queryString ? `/crm/clients?${queryString}` : "/crm/clients"}
              className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1"
            >
              在客户列表中查看完整版
              <ExternalLink className="w-3 h-3" />
            </Link>
          </DrawerFooter>
        )
      }
    >
      {segment && members.length === 0 && (
        <p className="text-sm text-slate-400 py-8 text-center">当前条件未匹配任何客户</p>
      )}
      {segment && members.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 sticky top-0">
              <tr className="text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-3 py-2">UID</th>
                <th className="px-3 py-2">姓名</th>
                <th className="px-3 py-2">国家</th>
                <th className="px-3 py-2">等级</th>
                <th className="px-3 py-2">KYC</th>
                <th className="px-3 py-2">风险</th>
                <th className="px-3 py-2 text-right">余额 (USD)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {members.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="px-3 py-2 font-mono text-[11px] text-slate-500">{m.uid}</td>
                  <td className="px-3 py-2">
                    <Link href={`/crm/clients/${m.id}`} className="text-blue-600 hover:underline">
                      {m.name}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-600">{m.country ?? "—"}</td>
                  <td className="px-3 py-2">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${labelOf(LEVEL_OPTS, m.level).length ? LEVEL_OPTS.find((o) => o.value === m.level)?.tone ?? "" : ""}`}>
                      {labelOf(LEVEL_OPTS, m.level)}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs">{labelOf(KYC_OPTS, m.kycStatus)}</td>
                  <td className="px-3 py-2">
                    {m.riskLevel ? (
                      <span className={`px-1.5 py-0.5 rounded text-[10px] ${RISK_OPTS.find((o) => o.value === m.riskLevel)?.tone ?? ""}`}>
                        {labelOf(RISK_OPTS, m.riskLevel)}
                      </span>
                    ) : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">${m.balance.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Drawer>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────
function filterToQueryString(f: SegmentFilter): string {
  const sp = new URLSearchParams();
  if (f.status)            sp.set("status",         f.status);
  if (f.kycStatus)         sp.set("kycStatus",      f.kycStatus);
  if (f.level)             sp.set("level",          f.level);
  if (f.riskLevel)         sp.set("riskLevel",      f.riskLevel);
  if (f.lifecycleStage)    sp.set("lifecycleStage", f.lifecycleStage);
  if (typeof f.hasFtd === "boolean") sp.set("hasFtd", String(f.hasFtd));
  if (f.country && f.country.length > 0) sp.set("country", f.country.join(","));
  if (typeof f.minAccountCount === "number") sp.set("minAccountCount", String(f.minAccountCount));
  if (typeof f.maxAccountCount === "number") sp.set("maxAccountCount", String(f.maxAccountCount));
  if (f.role)              sp.set("role",           f.role);
  if (f.tag)               sp.set("tag",            f.tag);
  return sp.toString();
}

function StatCard({
  label, value, tone,
}: {
  label: string;
  value: number;
  tone?: "info" | "ok" | "violet";
}) {
  const cls = tone === "info" ? "text-blue-600"
    : tone === "ok" ? "text-emerald-600"
    : tone === "violet" ? "text-violet-600"
    : "text-slate-900";
  return (
    <Card padding="sm">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`text-xl font-bold mt-0.5 tabular-nums ${cls}`}>{value}</p>
    </Card>
  );
}
