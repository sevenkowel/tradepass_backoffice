"use client";

/**
 * ClientDetailSidebar — Client Status Console.
 *
 * 不是用户资料卡，是「客户状态控制台」。目标：让运营/客服/风控/合规
 * 3 秒内知道客户是谁、是否正常、有没有风险、有没有价值、当前阶段、
 * 是否需要处理。
 *
 * 5 模块结构（自上而下，2026-05-16 简化版）：
 *   1. ClientInfoCard     身份 + 徽标行 + 联系 + 归属
 *   2. ActionItemsCard    待处理事项（有事项才显示）
 *   3. BusinessMetricsCard 客户价值（分组：资金 / 交易 / 推荐 / 价值）
 *   4. RiskComplianceCard 风险与合规中心
 *   5. LifecycleCard      生命周期（横向 step + 下一目标进度）
 */

import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Eye, EyeOff, ChevronRight,
  ShieldCheck, TrendingUp, ArrowDownLeft, ArrowUpRight,
  Power, Wallet, BarChart3, Crown, Users,
  AlertTriangle, Shield, Globe, Target,
  X as XIcon,
  Mail, Phone, Pencil, Save, UserCircle, Network, Award,
  type LucideIcon,
} from "lucide-react";
import type { BackofficeUser } from "@/types/backoffice/user";
import type {
  LifecycleStageInfo, UserValueMetrics,
} from "@/types/backoffice/client-detail";
import { useT } from "@/lib/i18n/LocaleProvider";
import { useAuthStore } from "@/store/crm";
import * as CountryFlags from "country-flag-icons/react/3x2";
import type { ActionItem, ActionSeverity } from "./lib/action-items";
import { ClientTagsPanel } from "./lib/ClientTagsPanel";
import { AlertSubscriptionsPanel } from "./lib/AlertSubscriptionsPanel";
import { IBSummaryHover } from "@/components/crm/clm/popovers/IBSummaryHover";
import type { IBSummary, IBTier } from "@/types/core";

interface Props {
  user: BackofficeUser;
  valueMetrics: UserValueMetrics;
  lifecycleStages: LifecycleStageInfo[];
  actionItems: ActionItem[];
}

export default function ClientDetailSidebar({
  user, valueMetrics, lifecycleStages, actionItems,
}: Props) {
  return (
    <aside className="w-72 flex-shrink-0 space-y-3 self-start">
      <ClientInfoCard user={user} />
      <TagsCard user={user} />
      <ActionItemsCard items={actionItems} />
      <BusinessMetricsCard user={user} metrics={valueMetrics} />
      <RiskComplianceCard user={user} />
      <LifecycleCard stages={lifecycleStages} />
    </aside>
  );
}

/** 标签管理 + 告警订阅小卡 — N2 + N4/N10 */
function TagsCard({ user }: { user: BackofficeUser }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-3 space-y-3">
      <ClientTagsPanel
        clientId={user.id}
        initialTags={user.tags ?? []}
      />
      <div className="h-px bg-slate-100" />
      <AlertSubscriptionsPanel clientId={user.id} />
    </div>
  );
}

/* --------------------------------------------------------------------- */
/* 共享 helpers                                                          */
/* --------------------------------------------------------------------- */

type Tone = "neutral" | "ok" | "warn" | "danger" | "info" | "violet";

const TEXT: Record<Tone, string> = {
  neutral: "text-slate-700",
  ok:      "text-emerald-700",
  warn:    "text-amber-700",
  danger:  "text-red-700",
  info:    "text-blue-700",
  violet:  "text-violet-700",
};

// Seeded helpers — 同一 userId 永远生成相同数据，演示稳定。
function hashSeed(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h = (h ^ str.charCodeAt(i)) >>> 0;
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}
function rngFor(seed: string) {
  let s = hashSeed(seed);
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function fmtUsd(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 10_000)    return `$${(n / 1000).toFixed(1)}k`;
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 p-4 ${className}`}>
      {children}
    </div>
  );
}

function CardTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-3">
      {children}
    </h3>
  );
}

/* ===================================================================== */
/* 1. Client Info Card — 身份 / 徽标 / 联系 / 归属                         */
/* ===================================================================== */

type ClientRole = "trader" | "partner" | "affiliate";
/** Partner 子等级 — IB 体系内的级别。real 数据应该从 IB 系统读取。 */
type PartnerTier = "junior" | "senior";

function deriveRole(user: BackofficeUser, ibName: string | null): ClientRole {
  const tags = user.tags ?? [];
  if (tags.includes("ib") || tags.includes("partner")) return "partner";
  if (tags.includes("affiliate")) return "affiliate";
  if (ibName) {
    const r = rngFor(`${user.id}:role-derive`);
    return r() < 0.3 ? "partner" : "trader";
  }
  return "trader";
}

function derivePartnerTier(user: BackofficeUser): PartnerTier {
  const tags = user.tags ?? [];
  if (tags.includes("senior")) return "senior";
  if (tags.includes("junior")) return "junior";
  // 默认派生：等级越高 / 老客户更可能是 senior
  const r = rngFor(`${user.id}:partner-tier`);
  return r() < 0.4 ? "senior" : "junior";
}

const PARTNER_TIER_META: Record<PartnerTier, { label: string; fullText: string }> = {
  junior: { label: "初级 IB",      fullText: "初级 IB — 30 天内邀请 ≥ 5 个 FTD 客户可升级" },
  senior: { label: "高级合作伙伴", fullText: "高级合作伙伴 — 顶级 IB 等级" },
};

interface StatusBadge {
  key: string;
  label: string;            // chip 上的短文字
  fullText: string;         // hover/明细的完整文字
  tone: "ok" | "warn" | "danger" | "info" | "violet";
  icon: LucideIcon;
}

function ClientInfoCard({ user }: { user: BackofficeUser }) {
  const { t, locale } = useT();
  const authUser = useAuthStore((s) => s.user);
  const canReveal = !!authUser && (
    authUser.role.id === "admin" ||
    authUser.role.id === "super_admin" ||
    authUser.role.id === "compliance_officer"
  );
  const dateLocale =
    locale === "zh" ? "zh-CN" : locale === "ja" ? "ja-JP" : locale === "es" ? "es-ES" : "en-US";

  // 派生 IB referrer + 注册来源
  const meta = useMemo(() => {
    const r = rngFor(`${user.id}:identity-meta`);
    return {
      ibName: r() < 0.4 ? `IB-${Math.floor(r() * 9000 + 1000)}` : null,
      sourceChannel: user.registrationSource ?? (
        r() < 0.4 ? "Web Portal" : r() < 0.7 ? "Mobile App" : "IB Referral"
      ),
    };
  }, [user.id, user.registrationSource]);

  // 派生 IB 完整 summary（mock — 给 hover popover 用）。同 ibName 永远生成同样数据。
  const ibSummary: IBSummary | null = useMemo(() => {
    if (!meta.ibName) return null;
    const r = rngFor(`${meta.ibName}:ib-summary`);
    const tiers: IBTier[] = ["standard", "gold", "platinum"];
    return {
      id: meta.ibName,
      uid: `${Math.floor(r() * 9000000000 + 1000000000)}`,
      name: meta.ibName,
      tier: tiers[Math.floor(r() * 3)],
      status: "active",
      totalReferred: Math.floor(r() * 200) + 10,
      activeReferred: Math.floor(r() * 80) + 5,
      kycPassRate: 0.7 + r() * 0.3,
      fraudRate: r() * 0.06,
      // IB 在客户之前加入，用 user.createdAt 作 anchor（避免 Date.now() purity 警告）
      joinedAt: new Date(new Date(user.createdAt).getTime() - Math.floor(r() * 365) * 86400_000).toISOString(),
      country: user.country,
    };
  }, [meta.ibName, user.country, user.createdAt]);

  // 派生 Role（优先级单选: Partner > Affiliate > Trader）
  // 派生是 pure function（seeded by user.id），直接调用即可。
  const role = deriveRole(user, meta.ibName);

  // 派生 6 个徽标的状态
  const badges = useMemo<StatusBadge[]>(() => {
    const r = rngFor(`${user.id}:status-overview`);
    const isActive = user.status === "active";
    const trading = isActive;
    const deposit = isActive;
    const withdrawal = isActive && r() > 0.2;

    const kycLevel = user.kycStatus === "verified"
      ? (r() < 0.4 ? "Tier 2" : "Tier 1")
      : user.kycStatus === "pending" ? "Pending"
      : "未通过";

    // Role 徽标 — partner 时显示具体 IB 等级（Junior IB / Senior Partner）。
    // Senior 用 violet 醒目色，Junior 用 info 蓝色，跟普通 trader 区分。
    const partnerTier = role === "partner" ? derivePartnerTier(user) : null;
    const roleMeta = role === "partner" && partnerTier
      ? {
          label:    PARTNER_TIER_META[partnerTier].label,
          fullText: `角色：Partner · ${PARTNER_TIER_META[partnerTier].fullText}`,
          tone:     (partnerTier === "senior" ? "violet" : "info") as StatusBadge["tone"],
          icon:     Network,
        }
      : role === "affiliate"
      ? { label: "Affiliate", fullText: "角色：Affiliate（推广联盟）", tone: "info" as const, icon: Award }
      : { label: "Trader", fullText: "角色：Trader（普通交易客户）", tone: "info" as const, icon: UserCircle };

    const list: StatusBadge[] = [
      {
        key: "role",
        label: roleMeta.label,
        fullText: roleMeta.fullText,
        tone: roleMeta.tone,
        icon: roleMeta.icon,
      },
      {
        key: "kyc",
        label: `KYC ${kycLevel}`,
        fullText: `KYC 状态：${kycLevel}（${user.kycStatus}）`,
        tone: user.kycStatus === "verified" ? "ok"
            : user.kycStatus === "pending" ? "warn" : "danger",
        icon: ShieldCheck,
      },
      {
        key: "deposit",
        label: deposit ? "入金" : "入金禁",
        fullText: deposit ? "入金：允许" : "入金：已禁止",
        tone: deposit ? "ok" : "danger",
        icon: ArrowDownLeft,
      },
      {
        key: "withdrawal",
        label: withdrawal ? "出金" : "出金限",
        fullText: withdrawal ? "出金：允许" : "出金：已限制（日上限 $5,000）",
        tone: withdrawal ? "ok" : "warn",
        icon: ArrowUpRight,
      },
      {
        key: "account",
        label: user.status === "active" ? "活跃"
             : user.status === "frozen" ? "已冻结"
             : user.status === "closed" ? "已关闭" : user.status,
        fullText: `账户状态：${user.status}`,
        tone: user.status === "active" ? "ok"
            : user.status === "frozen" || user.status === "closed" ? "danger" : "warn",
        icon: Power,
      },
      {
        key: "trading",
        label: trading ? "交易" : "交易禁",
        fullText: trading ? "交易：已启用" : "交易：已禁用",
        tone: trading ? "ok" : "danger",
        icon: TrendingUp,
      },
    ];
    return list;
  }, [user, role]);

  // 状态明细面板折叠
  const [detailsOpen, setDetailsOpen] = useState(false);
  // 编辑抽屉
  const [editOpen, setEditOpen] = useState(false);

  return (
    <Card>
      {/* ── Section 1: 身份 + 编辑入口 ───────────────────────────── */}
      <div className="flex items-start gap-3 mb-2.5">
        <div className="w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center text-sm font-semibold text-slate-600 shrink-0">
          {user.name.slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-slate-900 truncate">{user.name}</p>
          <p className="font-mono text-[11px] text-slate-400 tabular-nums">UID {user.uid}</p>
        </div>
        <button
          onClick={() => setEditOpen(true)}
          className="shrink-0 -mt-1 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
          aria-label="Edit profile"
          title="编辑客户资料"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 注册国家 + 注册时间 */}
      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-3">
        {user.country && <CountryFlag cc={user.country} />}
        {user.country && <span className="font-mono text-slate-600">{user.country}</span>}
        <span className="text-slate-300">·</span>
        <span>{t("clients.detail.header.joined")} {new Date(user.createdAt).toLocaleDateString(dateLocale)}</span>
      </div>

      {/* 徽标行 — hover tooltip + 点击展开明细 */}
      <div className="flex flex-wrap gap-1">
        {badges.map((b) => <BadgeChip key={b.key} badge={b} onClick={() => setDetailsOpen((v) => !v)} />)}
      </div>

      {detailsOpen && (
        <div className="mt-3 rounded-md bg-slate-50 px-3 py-2.5 text-[11px] space-y-1.5 border border-slate-100">
          <div className="flex items-center justify-between gap-2 -mb-0.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              状态明细
            </span>
            <button
              onClick={() => setDetailsOpen(false)}
              className="text-slate-400 hover:text-slate-700"
              aria-label="Close details"
            >
              <XIcon className="w-3 h-3" strokeWidth={2.5} />
            </button>
          </div>
          {badges.map((b) => {
            const Icon = b.icon;
            return (
              <div key={b.key} className="flex items-baseline gap-1.5">
                <Icon className={`w-3 h-3 mt-0.5 ${TEXT[b.tone]} shrink-0`} />
                <span className={`${TEXT[b.tone]}`}>{b.fullText}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* ── 分隔线 1：身份 / 联系 ──────────────────────────────── */}
      <div className="border-t border-slate-100 my-3" />

      <dl className="space-y-1.5">
        <MaskedRow icon={Mail}  label={t("clients.detail.sidebar.email")} value={user.email} kind="email" canReveal={canReveal} />
        <MaskedRow icon={Phone} label={t("clients.detail.sidebar.phone")} value={user.phone} kind="phone" canReveal={canReveal} />
      </dl>

      {/* ── 分隔线 2：联系 / 归属 ──────────────────────────────── */}
      <div className="border-t border-slate-100 my-3" />

      <dl className="space-y-1.5">
        <AttrRow
          icon={Network}
          label="IB 归属"
          value={
            ibSummary
              ? <IBSummaryHover ib={ibSummary} className="text-xs font-medium" />
              : <span className="text-slate-300">无</span>
          }
        />
        <AttrRow
          icon={Globe}
          label="注册来源"
          value={<span className="text-slate-700 font-medium">{meta.sourceChannel}</span>}
        />
      </dl>

      {/* 编辑抽屉 */}
      {editOpen && <EditProfileDrawer user={user} onClose={() => setEditOpen(false)} />}
    </Card>
  );
}

/* --- Badge Chip --- */

const BADGE_TONE: Record<StatusBadge["tone"], string> = {
  ok:    "bg-emerald-50 text-emerald-700 border-emerald-200",
  warn:  "bg-amber-50 text-amber-700 border-amber-200",
  danger: "bg-red-50 text-red-700 border-red-200",
  info:  "bg-blue-50 text-blue-700 border-blue-200",
  violet: "bg-violet-50 text-violet-700 border-violet-200",
};

function BadgeChip({ badge, onClick }: { badge: StatusBadge; onClick: () => void }) {
  const Icon = badge.icon;
  return (
    <button
      onClick={onClick}
      title={badge.fullText}
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10.5px] font-medium border transition-colors cursor-pointer ${BADGE_TONE[badge.tone]}`}
    >
      <Icon className="w-3 h-3" strokeWidth={2.25} />
      {badge.label}
    </button>
  );
}

/* --- Attribute Row (IB 归属 / 注册来源 共用) --- */

function AttrRow({ label, value, icon: Icon }: { label: string; value: React.ReactNode; icon: LucideIcon }) {
  return (
    <div className="flex items-center justify-between gap-2 text-xs">
      <dt className="flex items-center gap-1.5 text-slate-500 shrink-0">
        <Icon className="w-3 h-3 text-slate-400" />
        {label}
      </dt>
      <dd className="text-right truncate">{value}</dd>
    </div>
  );
}

/* --- Country Flag --- */

function CountryFlag({ cc }: { cc: string }) {
  const Flag = (CountryFlags as Record<string, React.FC<{ style?: React.CSSProperties }>>)[cc.toUpperCase()];
  if (!Flag) return null;
  return (
    <span
      className="inline-flex shrink-0 overflow-hidden rounded-[1px] shadow-[0_0_0_1px_rgba(0,0,0,0.08)]"
      aria-hidden
    >
      <Flag style={{ display: "block", height: 12, width: "auto" }} />
    </span>
  );
}

/* --- Masked Row (邮箱 / 手机) --- */

function MaskedRow({
  label, value, kind, canReveal, icon: Icon,
}: {
  label: string; value: string;
  kind: "email" | "phone";
  canReveal: boolean;
  icon?: LucideIcon;
}) {
  const [revealed, setRevealed] = useState(false);
  const masked = kind === "email" ? maskEmail(value) : maskPhone(value);
  const shown = revealed && canReveal ? value : masked;

  return (
    <div className="flex items-center justify-between gap-2 text-xs">
      <dt className="flex items-center gap-1.5 text-slate-500 shrink-0">
        {Icon && <Icon className="w-3 h-3 text-slate-400" />}
        {label}
      </dt>
      <dd className="flex items-center gap-1 min-w-0">
        <span className="font-mono tabular-nums text-slate-800 truncate">{shown}</span>
        {canReveal && (
          <button
            onClick={() => setRevealed((v) => !v)}
            className="shrink-0 p-0.5 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-50"
            title={revealed ? "Hide" : "Reveal"}
          >
            {revealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          </button>
        )}
      </dd>
    </div>
  );
}

function maskEmail(e: string): string {
  if (!e || !e.includes("@")) return e;
  const [local, domain] = e.split("@");
  const visible = local.slice(0, 2);
  return `${visible}${"*".repeat(Math.max(2, local.length - 2))}@${domain}`;
}

function maskPhone(p: string): string {
  if (!p) return p;
  const digits = p.replace(/\D/g, "");
  if (digits.length < 4) return p;
  const last4 = digits.slice(-4);
  const plusMatch = p.match(/^\+\d{1,3}/);
  if (plusMatch) {
    return `${plusMatch[0]} *** *** ${last4}`;
  }
  return `*** *** ${last4}`;
}

/* ===================================================================== */
/* Edit Profile Drawer                                                    */
/* ===================================================================== */

function EditProfileDrawer({ user, onClose }: { user: BackofficeUser; onClose: () => void }) {
  const [draft, setDraft] = useState({
    name: user.name,
    email: user.email,
    phone: user.phone,
    country: user.country ?? "",
  });

  return createPortal(
    <div className="fixed inset-0 z-[100] flex">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative ml-auto w-[28rem] h-full bg-white shadow-2xl flex flex-col">
        <header className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">编辑客户资料</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* 不可编辑字段 */}
          <section>
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
              系统信息（只读）
            </h3>
            <dl className="space-y-1.5 text-xs">
              <Row label="UID" value={<span className="font-mono">{user.uid}</span>} />
              <Row label="注册时间" value={new Date(user.createdAt).toLocaleString("zh-CN")} />
            </dl>
          </section>

          {/* 可编辑字段 */}
          <section>
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
              基础信息
            </h3>
            <div className="space-y-3">
              <Field label="显示名">
                <input
                  type="text"
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  className="w-full h-8 px-2.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </Field>
              <Field label="邮箱">
                <input
                  type="email"
                  value={draft.email}
                  onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                  className="w-full h-8 px-2.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </Field>
              <Field label="手机">
                <input
                  type="tel"
                  value={draft.phone}
                  onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
                  className="w-full h-8 px-2.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </Field>
              <Field label="国家（ISO-2）">
                <input
                  type="text"
                  value={draft.country}
                  onChange={(e) => setDraft({ ...draft, country: e.target.value.toUpperCase() })}
                  maxLength={2}
                  className="w-full h-8 px-2.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono uppercase"
                />
              </Field>
            </div>
          </section>

          {/* 管理动作 */}
          <section>
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
              管理动作
            </h3>
            <div className="space-y-1.5">
              <ManageActionLink label="重置密码" desc="发送密码重置邮件" />
              <ManageActionLink label="解除 2FA" desc="客户丢失认证设备时使用" />
              <ManageActionLink label="转移到其它销售" desc="变更客户归属销售员" />
              <ManageActionLink label="合并重复客户" desc="把另一个 UID 合并到当前客户" danger />
            </div>
          </section>
        </div>

        <footer className="px-5 py-3 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="h-8 px-3 text-sm text-slate-600 hover:bg-slate-100 rounded-md"
          >
            取消
          </button>
          <button
            onClick={onClose}
            className="h-8 px-3 text-sm font-semibold rounded-md bg-blue-600 text-white hover:bg-blue-700 inline-flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            保存修改
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1 border-b border-slate-100 last:border-b-0">
      <dt className="text-xs text-slate-500 shrink-0">{label}</dt>
      <dd className="text-sm text-slate-800 font-medium text-right tabular-nums truncate">{value}</dd>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-[11px] font-medium text-slate-600 mb-1">{label}</div>
      {children}
    </label>
  );
}

function ManageActionLink({ label, desc, danger }: { label: string; desc: string; danger?: boolean }) {
  return (
    <button
      className={`w-full text-left px-3 py-2 rounded-md border transition-colors ${
        danger
          ? "border-red-200 hover:bg-red-50"
          : "border-slate-200 hover:bg-slate-50"
      }`}
    >
      <div className={`text-sm font-medium ${danger ? "text-red-700" : "text-slate-800"}`}>{label}</div>
      <div className="text-[11px] text-slate-500 mt-0.5">{desc}</div>
    </button>
  );
}

/* ===================================================================== */
/* 2. Action Items — 待处理事项                                           */
/* ===================================================================== */

function ActionItemsCard({ items }: { items: ActionItem[] }) {
  const { t } = useT();
  const pathname = usePathname();

  if (items.length === 0) return null;

  const resolveHref = (href?: string): string => {
    if (!href) return "#";
    if (href.startsWith("?")) return `${pathname}${href}`;
    return href;
  };

  const overallSeverity: ActionSeverity = items.some((i) => i.severity === "danger")
    ? "danger"
    : items.some((i) => i.severity === "warning")
    ? "warning"
    : "info";

  const accentMap: Record<ActionSeverity, string> = {
    danger:  "border-l-red-500",
    warning: "border-l-amber-500",
    info:    "border-l-blue-500",
  };

  return (
    <div className={`bg-white rounded-xl border border-slate-200 border-l-2 ${accentMap[overallSeverity]} p-4`}>
      <CardTitle>{t("clients.detail.header.attention")} · {items.length}</CardTitle>
      <ul className="space-y-2">
        {items.map((it) => (
          <li key={it.id} className="text-sm">
            <div className="flex items-baseline gap-1.5">
              <span className={`shrink-0 w-1.5 h-1.5 rounded-full mt-1.5 ${
                it.severity === "danger" ? "bg-red-500"
                : it.severity === "warning" ? "bg-amber-500"
                : "bg-blue-500"
              }`} />
              <div className="min-w-0 flex-1">
                <div className="text-slate-800 leading-snug">{it.title}</div>
                {it.meta && <div className="text-[11px] text-slate-400 mt-0.5">{it.meta}</div>}
                {it.href && (
                  <Link
                    href={resolveHref(it.href)}
                    className="inline-flex items-center gap-0.5 text-[11px] font-medium text-blue-600 hover:text-blue-700 mt-0.5"
                  >
                    {it.cta ?? t("clients.detail.header.view")}
                    <ChevronRight className="w-3 h-3" />
                  </Link>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ===================================================================== */
/* 3. Business Metrics — 分组（资金 / 交易 / 推荐 / 价值）                 */
/* ===================================================================== */

function BusinessMetricsCard({
  user, metrics,
}: { user: BackofficeUser; metrics: UserValueMetrics }) {
  const vipLevel = useMemo(() => {
    if (user.level === "enterprise") return "Enterprise";
    if (user.level === "premium") return "Premium";
    if (user.level === "vip") return "Gold";
    const net = metrics.netDeposit;
    if (net >= 100000) return "Gold";
    if (net >= 50000) return "Silver";
    if (net >= 10000) return "Bronze";
    return "—";
  }, [user.level, metrics.netDeposit]);

  const revenue = useMemo(() => {
    const r = rngFor(`${user.id}:revenue`);
    return Math.round(metrics.netDeposit * (0.015 + r() * 0.025));
  }, [user.id, metrics.netDeposit]);

  // 推荐相关 mock 字段（IB / Partner 客户必有数据）
  const referral = useMemo(() => {
    const tags = user.tags ?? [];
    const isPartner = tags.includes("partner") || tags.includes("ib");
    const isSenior = tags.includes("senior");
    const r = rngFor(`${user.id}:referral`);
    // 非 partner 客户 70% 跳过
    if (!isPartner && r() > 0.3) return null;
    // Senior IB 数据量更高
    const sizeBoost = isSenior ? 3 : isPartner ? 1.5 : 1;
    return {
      count: Math.floor((Math.floor(r() * 30) + (isPartner ? 20 : 1)) * sizeBoost),
      netDeposit: Math.floor((Math.floor(r() * 200000) + (isPartner ? 80000 : 0)) * (isSenior ? 2 : 1)),
      volume: Math.floor((Math.floor(r() * 800) + (isPartner ? 300 : 0)) * (isSenior ? 1.8 : 1)),
    };
  }, [user.id, user.tags]);

  return (
    <Card>
      <CardTitle>客户价值</CardTitle>

      {/* 资金 */}
      <Group label="资金">
        <MetricRow icon={Wallet}    label="净入金" value={fmtUsd(metrics.netDeposit)} bold />
        <MetricRow icon={BarChart3} label="净值"   value={fmtUsd(metrics.equity)} />
      </Group>

      <GroupDivider />

      {/* 交易 */}
      <Group label="交易">
        <MetricRow icon={TrendingUp} label="交易量" value={`${(metrics.totalLots ?? user.tradingVolume ?? 0).toLocaleString()} lots`} />
        <MetricRow icon={Wallet}     label="账户数" value={String(user.accountCount ?? 0)} />
      </Group>

      <GroupDivider />

      {/* 推荐（仅 IB / Partner 客户显示） */}
      {referral && (
        <>
          <Group label="推荐">
            <MetricRow icon={Users}     label="邀请人数"     value={String(referral.count)} />
            <MetricRow icon={Wallet}    label="邀请净存款"   value={fmtUsd(referral.netDeposit)} />
            <MetricRow icon={TrendingUp} label="邀请交易量"  value={`${referral.volume.toLocaleString()} lots`} />
          </Group>
          <GroupDivider />
        </>
      )}

      {/* 价值 */}
      <Group label="价值">
        <MetricRow icon={BarChart3} label="贡献佣金" value={fmtUsd(revenue)} tone="ok" />
        <MetricRow icon={Crown}     label="VIP 等级"  value={vipLevel} tone={vipLevel === "—" ? "neutral" : "info"} />
      </Group>
    </Card>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section>
      <h4 className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
        {label}
      </h4>
      <dl className="space-y-1.5">{children}</dl>
    </section>
  );
}

function GroupDivider() {
  return <div className="border-t border-slate-100 my-3" />;
}

function MetricRow({
  label, value, tone = "neutral", bold = false, icon: Icon,
}: {
  label: string; value: string; tone?: Tone; bold?: boolean; icon?: LucideIcon;
}) {
  const cls = TEXT[tone];
  return (
    <div className="flex items-center justify-between gap-2 text-xs">
      <dt className="flex items-center gap-1.5 text-slate-500">
        {Icon && <Icon className="w-3 h-3 text-slate-400" />}
        {label}
      </dt>
      <dd className={`tabular-nums truncate ${bold ? "font-semibold" : "font-medium"} ${cls}`}>{value}</dd>
    </div>
  );
}

/* ===================================================================== */
/* 4. Risk & Compliance                                                   */
/* ===================================================================== */

function RiskComplianceCard({ user }: { user: BackofficeUser }) {
  const data = useMemo(() => {
    const r = rngFor(`${user.id}:risk-compliance`);
    const riskScore = user.riskScore ?? Math.floor(r() * 100);
    const riskLabel =
      riskScore >= 80 ? "CRITICAL"
      : riskScore >= 60 ? "HIGH"
      : riskScore >= 30 ? "MEDIUM"
      : "LOW";
    const riskTone: Tone =
      riskScore >= 60 ? "danger"
      : riskScore >= 30 ? "warn"
      : "ok";

    const tagPool = ["VPN", "Scalper", "Multi-Device", "High Withdrawal", "Toxic Flow", "First-Time"];
    const tagCount = riskScore >= 60 ? 3 : riskScore >= 30 ? 2 : 1;
    const tags: string[] = [];
    for (let i = 0; i < tagCount; i++) {
      const tag = tagPool[Math.floor(r() * tagPool.length)];
      if (!tags.includes(tag)) tags.push(tag);
    }

    return {
      riskScore,
      riskLabel,
      riskTone,
      aml: r() < 0.9 ? "已通过" : "命中",
      amlTone: (r() < 0.9 ? "ok" : "danger") as Tone,
      vpn: r() < 0.15,
      pep: r() < 0.05,
      restrictions: r() < 0.25 ? "Withdrawal Hold" : null,
      tags,
    };
  }, [user.id, user.riskScore]);

  return (
    <Card>
      <CardTitle>风险与合规</CardTitle>
      <dl className="space-y-2">
        <StatusRow
          label="风险评分"
          value={`${data.riskScore} · ${data.riskLabel}`}
          tone={data.riskTone}
          icon={Shield}
        />
        <StatusRow
          label="AML"
          value={data.aml}
          tone={data.amlTone}
          icon={ShieldCheck}
        />
        <StatusRow
          label="VPN"
          value={data.vpn ? "检测到" : "未检测"}
          tone={data.vpn ? "warn" : "ok"}
          icon={Globe}
        />
        <StatusRow
          label="PEP"
          value={data.pep ? "命中" : "否"}
          tone={data.pep ? "danger" : "ok"}
          icon={AlertTriangle}
        />
        {data.restrictions && (
          <StatusRow
            label="限制"
            value={data.restrictions}
            tone="warn"
            icon={Power}
          />
        )}
      </dl>

      {data.tags.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-1.5">风险标签</div>
          <div className="flex flex-wrap gap-1">
            {data.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

/* --- Status Row (Risk & Compliance 内用，已不再用于身份卡) --- */

function StatusRow({
  label, value, tone = "neutral", icon: Icon,
}: {
  label: string;
  value: React.ReactNode;
  tone?: Tone;
  icon?: LucideIcon;
}) {
  return (
    <div className="flex items-center justify-between gap-2 text-xs">
      <dt className="flex items-center gap-1.5 text-slate-500 shrink-0">
        {Icon && <Icon className="w-3 h-3 text-slate-400" />}
        {label}
      </dt>
      <dd className="flex items-center gap-1.5">
        {typeof value === "string" ? (
          <>
            <span className={`w-1.5 h-1.5 rounded-full ${dotForTone(tone)}`} />
            <span className={`font-medium tabular-nums ${TEXT[tone]}`}>{value}</span>
          </>
        ) : (
          value
        )}
      </dd>
    </div>
  );
}

function dotForTone(t: Tone): string {
  return ({
    neutral: "bg-slate-400",
    ok:      "bg-emerald-500",
    warn:    "bg-amber-500",
    danger:  "bg-red-500",
    info:    "bg-blue-500",
    violet:  "bg-violet-500",
  } as const)[t];
}

/* ===================================================================== */
/* 5. Lifecycle — 横向 step indicator + 当前进度                          */
/* ===================================================================== */

function LifecycleCard({ stages }: { stages: LifecycleStageInfo[] }) {
  const { t } = useT();
  const currentIndex = stages.findIndex((s) => s.isCurrent);
  const nextStage = currentIndex >= 0
    ? stages.slice(currentIndex + 1).find((s) => !s.reachedAt)
    : undefined;
  const nextGoalHint = nextStage ? lifecycleNextHint(nextStage.stage) : null;

  // 当前阶段距下一阶段的"进度"（mock — 实际应该来自业务规则）
  const progress = useMemo(() => {
    if (!nextStage) return null;
    const r = rngFor(`lifecycle:${currentIndex}`);
    return Math.floor(r() * 60 + 25);  // 25% - 85%
  }, [currentIndex, nextStage]);

  return (
    <Card>
      <CardTitle>{t("clients.detail.sidebar.lifecycle")}</CardTitle>

      {/* 横向 step indicator */}
      <div className="relative">
        <div className="flex items-center justify-between">
          {stages.map((s, i) => {
            const reached = !!s.reachedAt;
            const isCurrent = s.isCurrent;
            return (
              <div key={s.stage} className="flex-1 flex flex-col items-center min-w-0 relative">
                {/* 横线 (从第二个开始向左连) */}
                {i > 0 && (
                  <div
                    className={`absolute top-1.5 right-1/2 h-px ${
                      reached || isCurrent ? "bg-slate-400" : "bg-slate-200"
                    }`}
                    style={{ width: "100%" }}
                  />
                )}
                {/* 圆点 */}
                <div
                  className={`relative z-10 rounded-full transition-all ${
                    isCurrent
                      ? "w-3 h-3 bg-blue-500 ring-2 ring-blue-200"
                      : reached
                      ? "w-2 h-2 bg-slate-700"
                      : "w-2 h-2 bg-white border border-slate-300"
                  }`}
                  title={`${s.label}${s.reachedAt ? " · " + new Date(s.reachedAt).toLocaleDateString("zh-CN") : ""}`}
                />
              </div>
            );
          })}
        </div>

        {/* 阶段名（仅当前阶段显示完整文字，其它显示简短） */}
        <div className="flex items-start justify-between mt-2">
          {stages.map((s) => (
            <div
              key={s.stage}
              className={`flex-1 text-[9px] text-center px-0.5 leading-tight ${
                s.isCurrent ? "text-slate-900 font-semibold" : "text-slate-400"
              }`}
            >
              {s.label}
            </div>
          ))}
        </div>
      </div>

      {/* 下一目标 + 进度条 */}
      {nextStage && progress !== null && (
        <div className="mt-4 pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between text-[11px] mb-1.5">
            <div className="inline-flex items-center gap-1 text-slate-500">
              <Target className="w-3 h-3 text-blue-500" />
              <span>下一阶段</span>
              <span className="text-slate-800 font-semibold">{nextStage.label}</span>
            </div>
            <span className="text-slate-700 font-semibold tabular-nums">{progress}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          {nextGoalHint && (
            <div className="text-[10.5px] text-slate-500 mt-1.5 leading-snug">{nextGoalHint}</div>
          )}
        </div>
      )}
    </Card>
  );
}

function lifecycleNextHint(stage: string): string {
  switch (stage) {
    case "verified":      return "客户完成 KYC 后进入";
    case "ftd":           return "客户完成首次入金后达成";
    case "active_trader": return "近 30 天有交易即可触发";
    case "vip":           return "净入金 $50k+ 或月交易量 100 lots+";
    case "inactive":      return "30 天无交易将进入此阶段";
    case "churn":         return "90 天无任何活动将判定流失";
    default:              return "持续运营客户可推进至下一阶段";
  }
}
