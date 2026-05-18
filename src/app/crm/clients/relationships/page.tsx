"use client";

/**
 * Relationships 页面 — 客户关系网络（2026-05-17 三视图整合）.
 *
 * 三个 View：
 *   1. 列表视图 (table)    — 行展示，与客户详情页同款风格，逐条审查
 *   2. 图谱视图 (graph)     — 力导图，全局或单客户 1 跳
 *   3. 团伙视图 (clusters)  — 按集群分组的卡片，每个团伙一张
 *
 * URL `?view=list|graph|clusters`、`?clientId=xxx`（图谱视图聚焦某客户）。
 *
 * 这里把原来 /relationships + /clusters 两个独立页合并 — 共享同一数据底层，
 * 只是不同的渲染方式。/clusters 路径在 Phase 4 通过 redirect 兼容。
 */

import { Suspense, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ListChecks, Network, Users, Search, X, AlertTriangle, ChevronRight,
  ExternalLink,
} from "lucide-react";
import { Breadcrumb } from "@/components/crm/layout";
import { PageHeader, Card } from "@/components/crm/ui";
import { useT } from "@/lib/i18n/LocaleProvider";
import { clientService } from "@/lib/crm/services/client.service";
import { buildMockGraph } from "@/lib/risk-engine/graph";
import type { BackofficeUser } from "@/types/backoffice/user";
import type { ClientGraphNode } from "@/types/core";
import {
  generateEdges, generateClusters, EDGE_KIND_META,
  type GlobalRelationshipEdge, type RelCluster, type RelEdgeKind,
} from "@/lib/crm/mock-relationship-data";

const RelationshipGraph = dynamic(
  () => import("@/components/crm/relationships/RelationshipGraph"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[700px] flex items-center justify-center text-slate-400">
        Loading graph…
      </div>
    ),
  }
);

type ViewMode = "list" | "graph" | "clusters";

function isView(v: string | null): v is ViewMode {
  return v === "list" || v === "graph" || v === "clusters";
}

function RelationshipsPageInner() {
  const router = useRouter();
  const params = useSearchParams();
  const viewParam = params.get("view");
  const view: ViewMode = isView(viewParam) ? viewParam : "list";
  const clientId = params.get("clientId") || undefined;

  const [pickerOpen, setPickerOpen] = useState(false);
  const [centerLabel, setCenterLabel] = useState("");

  // Resolve label for centered client
  useEffect(() => {
    if (!clientId) { setCenterLabel(""); return; }
    let cancelled = false;
    clientService.getById(clientId)
      .then((u) => !cancelled && setCenterLabel(u ? `${u.name} (${u.uid})` : clientId))
      .catch(() => !cancelled && setCenterLabel(clientId));
    return () => { cancelled = true; };
  }, [clientId]);

  const setView = (next: ViewMode) => {
    const sp = new URLSearchParams(params.toString());
    sp.set("view", next);
    router.replace(`/crm/clients/relationships?${sp.toString()}`, { scroll: false });
  };

  const setClientId = (id: string | undefined) => {
    const sp = new URLSearchParams(params.toString());
    if (id) sp.set("clientId", id); else sp.delete("clientId");
    router.replace(`/crm/clients/relationships${sp.toString() ? `?${sp.toString()}` : ""}`, { scroll: false });
  };

  // Mock data
  const edges = useMemo(() => generateEdges(), []);
  const clusters = useMemo(() => generateClusters(), []);

  // Build mock graph for graph view（暂时用 demo 客户，未来接真实 graphService）
  const mockGraph = useMemo(() => {
    if (view !== "graph" || !clientId) return undefined;
    const center: ClientGraphNode = {
      id: clientId,
      uid: "U10007",
      name: centerLabel.split(" (")[0] || "Demo User",
      email: "demo@example.com",
      phone: "+86 138-0000-0000",
      country: "CN",
      kycStatus: "verified",
      riskLevel: "critical",
      riskScore: 92,
      lastLoginAt: "2026-05-10T10:00:00Z",
      createdAt: "2025-01-01T00:00:00Z",
      kind: "center",
    };
    return buildMockGraph(center);
  }, [view, clientId, centerLabel]);

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: "Clients", href: "/crm/clients" }, { label: "关系网络" }]} />

      <PageHeader
        title="关系网络"
        description="同设备 / IP / 银行 / 钱包 / 同名 等关联客户的统一视图"
      />

      {/* View toggle */}
      <div className="bg-white rounded-xl border border-slate-200 p-1 inline-flex">
        <ViewTab
          icon={ListChecks}
          label="列表视图"
          count={edges.length}
          active={view === "list"}
          onClick={() => setView("list")}
        />
        <ViewTab
          icon={Network}
          label="图谱视图"
          active={view === "graph"}
          onClick={() => setView("graph")}
        />
        <ViewTab
          icon={Users}
          label="团伙视图"
          count={clusters.length}
          active={view === "clusters"}
          onClick={() => setView("clusters")}
        />
      </div>

      {/* View content */}
      {view === "list" && <ListView edges={edges} />}
      {view === "graph" && (
        <GraphView
          clientId={clientId}
          centerLabel={centerLabel}
          mockGraph={mockGraph}
          onSetClient={setClientId}
          onPickClient={() => setPickerOpen(true)}
        />
      )}
      {view === "clusters" && <ClustersView clusters={clusters} />}

      {pickerOpen && (
        <ClientPickerDialog
          onPick={(id) => { setClientId(id); setPickerOpen(false); }}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
}

export default function RelationshipsPage() {
  return (
    <Suspense fallback={<div className="h-96 flex items-center justify-center text-slate-400">Loading…</div>}>
      <RelationshipsPageInner />
    </Suspense>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* View tabs                                                                   */
/* ─────────────────────────────────────────────────────────────────────────── */

function ViewTab({
  icon: Icon, label, count, active, onClick,
}: {
  icon: typeof ListChecks;
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        active ? "bg-blue-50 text-primary" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
      }`}
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
      {count != null && (
        <span className={`text-[10px] tabular-nums ${active ? "text-primary" : "text-slate-400"}`}>{count}</span>
      )}
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* List view — 全平台所有关联边                                                */
/* ─────────────────────────────────────────────────────────────────────────── */

function ListView({ edges }: { edges: GlobalRelationshipEdge[] }) {
  const [kindFilter, setKindFilter] = useState<"all" | RelEdgeKind>("all");
  const [minWeight, setMinWeight] = useState(0);

  const filtered = useMemo(() => {
    return edges
      .filter((e) => kindFilter === "all" || e.kind === kindFilter)
      .filter((e) => e.weight >= minWeight);
  }, [edges, kindFilter, minWeight]);

  const counts = useMemo(() => {
    const m: Partial<Record<RelEdgeKind, number>> = {};
    for (const e of edges) m[e.kind] = (m[e.kind] ?? 0) + 1;
    return m;
  }, [edges]);

  return (
    <div className="space-y-3">
      {/* Filter row */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="inline-flex bg-slate-100 rounded-lg p-0.5 flex-wrap">
          <FilterBtn
            label="全部"
            count={edges.length}
            active={kindFilter === "all"}
            onClick={() => setKindFilter("all")}
          />
          {(Object.keys(EDGE_KIND_META) as RelEdgeKind[]).map((k) => {
            const c = counts[k] ?? 0;
            if (c === 0) return null;
            return (
              <FilterBtn
                key={k}
                label={EDGE_KIND_META[k].label}
                count={c}
                active={kindFilter === k}
                onClick={() => setKindFilter(k)}
              />
            );
          })}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <span className="text-[11px] text-slate-500">最低强度 {(minWeight * 100).toFixed(0)}%</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={minWeight}
            onChange={(e) => setMinWeight(Number(e.target.value))}
            className="w-32"
          />
        </div>
      </div>

      {/* Table */}
      <Card padding="none">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 sticky top-0">
            <tr className="text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              <th className="px-4 py-2">客户 A</th>
              <th className="px-4 py-2">关联类型</th>
              <th className="px-4 py-2 text-right">强度</th>
              <th className="px-4 py-2">客户 B</th>
              <th className="px-4 py-2">详情</th>
              <th className="px-4 py-2 text-right">发现于</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.slice(0, 200).map((e) => (
              <EdgeRow key={e.id} edge={e} />
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="text-sm text-slate-400 py-12 text-center">无匹配的关联记录</p>
        )}
        {filtered.length > 200 && (
          <p className="text-[11px] text-slate-400 text-center py-2 border-t border-slate-100">
            显示前 200 条 · 共 {filtered.length} 条
          </p>
        )}
      </Card>
    </div>
  );
}

function EdgeRow({ edge }: { edge: GlobalRelationshipEdge }) {
  const meta = EDGE_KIND_META[edge.kind];
  return (
    <tr className="hover:bg-slate-50/60">
      <td className="px-4 py-2">
        <Link href={`/crm/clients/${edge.sourceId}`} className="flex items-center gap-2 group">
          <RiskDot level={edge.sourceRiskLevel} />
          <div className="min-w-0">
            <div className="text-sm font-medium text-slate-800 group-hover:text-primary truncate">
              {edge.sourceName}
            </div>
            <div className="text-[10px] text-slate-400 font-mono">{edge.sourceUid}</div>
          </div>
        </Link>
      </td>
      <td className="px-4 py-2">
        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10.5px] font-medium ${meta.bg} ${meta.color}`}>
          {meta.label}
        </span>
      </td>
      <td className="px-4 py-2 text-right">
        <div className="inline-flex items-center gap-1.5">
          <div className="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div
              className={`h-full rounded-full ${
                edge.weight >= 0.8 ? "bg-red-500"
                  : edge.weight >= 0.5 ? "bg-amber-500"
                  : "bg-slate-400"
              }`}
              style={{ width: `${edge.weight * 100}%` }}
            />
          </div>
          <span className={`text-xs tabular-nums font-mono ${edge.weight >= 0.8 ? "text-red-700 font-semibold" : "text-slate-600"}`}>
            {(edge.weight * 100).toFixed(0)}%
          </span>
        </div>
      </td>
      <td className="px-4 py-2">
        <Link href={`/crm/clients/${edge.targetId}`} className="flex items-center gap-2 group">
          <RiskDot level={edge.targetRiskLevel} />
          <div className="min-w-0">
            <div className="text-sm font-medium text-slate-800 group-hover:text-primary truncate">
              {edge.targetName}
            </div>
            <div className="text-[10px] text-slate-400 font-mono">{edge.targetUid}</div>
          </div>
        </Link>
      </td>
      <td className="px-4 py-2 text-xs text-slate-600 truncate max-w-xs">{edge.details}</td>
      <td className="px-4 py-2 text-[11px] text-slate-500 tabular-nums text-right">
        {new Date(edge.detectedAt).toLocaleDateString("zh-CN")}
      </td>
    </tr>
  );
}

function RiskDot({ level }: { level: "low" | "medium" | "high" | "critical" }) {
  const tone = level === "critical" ? "bg-red-500" : level === "high" ? "bg-orange-500" : level === "medium" ? "bg-amber-500" : "bg-emerald-500";
  return <span className={`w-1.5 h-1.5 rounded-full ${tone} flex-shrink-0`} title={level} />;
}

function FilterBtn({ label, count, active, onClick }: { label: string; count: number; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 h-7 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
        active ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
      }`}
    >
      <span>{label}</span>
      <span className="text-[10px] tabular-nums text-slate-400">{count}</span>
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Graph view                                                                  */
/* ─────────────────────────────────────────────────────────────────────────── */

function GraphView({
  clientId, centerLabel, mockGraph, onSetClient, onPickClient,
}: {
  clientId: string | undefined;
  centerLabel: string;
  mockGraph: ReturnType<typeof buildMockGraph> | undefined;
  onSetClient: (id: string | undefined) => void;
  onPickClient: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center gap-3 flex-wrap">
        <span className="text-sm text-slate-500">中心客户:</span>
        {clientId ? (
          <>
            <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium">
              {centerLabel || clientId}
            </span>
            <button
              onClick={() => onSetClient(undefined)}
              className="text-xs text-slate-500 hover:text-slate-700 inline-flex items-center gap-1"
            >
              <X className="w-3 h-3" /> 清除
            </button>
          </>
        ) : (
          <button
            onClick={onPickClient}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium inline-flex items-center gap-1.5"
          >
            <Search className="w-3.5 h-3.5" />
            选择中心客户
          </button>
        )}
      </div>

      {clientId && mockGraph ? (
        <Card padding="none">
          <RelationshipGraph clientId={clientId} mockData={mockGraph} onPickClient={onPickClient} />
        </Card>
      ) : (
        <Card>
          <div className="py-16 text-center">
            <Network className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-sm text-slate-500 mb-1">选择一个中心客户开始</p>
            <p className="text-[11px] text-slate-400">力导图显示该客户 1 跳 / N 跳关联，可缩放、节点点击跳详情</p>
          </div>
        </Card>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Clusters view                                                               */
/* ─────────────────────────────────────────────────────────────────────────── */

function ClustersView({ clusters }: { clusters: RelCluster[] }) {
  const critical = clusters.filter((c) => c.riskLevel === "critical").length;
  const high = clusters.filter((c) => c.riskLevel === "high").length;
  return (
    <div className="space-y-3">
      {/* Summary */}
      <div className="grid grid-cols-4 gap-3">
        <SummaryCard label="总团伙数" value={clusters.length} />
        <SummaryCard label="Critical 团伙" value={critical} tone="danger" />
        <SummaryCard label="High 团伙" value={high} tone="warn" />
        <SummaryCard
          label="累计成员"
          value={clusters.reduce((s, c) => s + c.members.length, 0)}
        />
      </div>

      {/* Cluster cards */}
      <div className="space-y-2">
        {clusters.map((c) => (
          <ClusterCard key={c.id} cluster={c} />
        ))}
      </div>
    </div>
  );
}

function SummaryCard({ label, value, tone }: { label: string; value: number; tone?: "danger" | "warn" }) {
  const cls = tone === "danger" ? "text-red-700" : tone === "warn" ? "text-amber-700" : "text-slate-900";
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-3">
      <div className="text-[10.5px] uppercase tracking-wider text-slate-500">{label}</div>
      <div className={`text-2xl font-bold tabular-nums ${cls}`}>{value}</div>
    </div>
  );
}

function ClusterCard({ cluster }: { cluster: RelCluster }) {
  const toneBorder = cluster.riskLevel === "critical" ? "border-l-red-500"
    : cluster.riskLevel === "high" ? "border-l-orange-500"
    : "border-l-amber-400";
  return (
    <div className={`bg-white rounded-xl border border-slate-200 border-l-4 p-4 ${toneBorder}`}>
      <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="text-sm font-bold text-slate-900">
            团伙 #{cluster.id.replace("cluster_", "")}
          </h4>
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
            cluster.riskLevel === "critical" ? "bg-red-100 text-red-700" :
            cluster.riskLevel === "high" ? "bg-orange-100 text-orange-700" :
            "bg-amber-100 text-amber-700"
          }`}>
            {cluster.riskLevel.toUpperCase()}
          </span>
          <span className="text-xs text-slate-500">·</span>
          <span className="text-xs text-slate-700">
            <b>{cluster.members.length}</b> 成员
          </span>
          <span className="text-xs text-slate-500">·</span>
          <span className="text-xs text-slate-700">
            平均风险评分 <b>{cluster.avgRiskScore}</b>
          </span>
        </div>
        <Link
          href={`/crm/clients/relationships?view=graph&clientId=${cluster.memberIds[0]}`}
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
        >
          在图谱中查看
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      <p className="text-xs text-slate-600 mb-2 leading-relaxed">{cluster.notes}</p>

      <div className="flex items-center gap-1.5 flex-wrap mb-2">
        <span className="text-[10.5px] uppercase tracking-wider text-slate-400 font-bold">共同信号:</span>
        {cluster.signals.map((s) => {
          const meta = EDGE_KIND_META[s];
          return (
            <span key={s} className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${meta.bg} ${meta.color}`}>
              {meta.label}
            </span>
          );
        })}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[11px] text-slate-500 mb-2">
        <Stat label="累计净入金" value={`$${(cluster.totalNetDeposit / 1000).toFixed(0)}k`} />
        <Stat label="累计出金"  value={`$${(cluster.totalWithdrawal / 1000).toFixed(0)}k`} />
        <Stat label="发现于"   value={new Date(cluster.detectedAt).toLocaleDateString("zh-CN")} />
        <Stat label="最近活动" value={new Date(cluster.lastActivityAt).toLocaleDateString("zh-CN")} />
      </div>

      <details className="border-t border-slate-100 pt-2">
        <summary className="cursor-pointer text-xs text-slate-500 hover:text-slate-700 inline-flex items-center gap-1">
          <ChevronRight className="w-3 h-3 transition-transform group-open:rotate-90" />
          展开成员（{cluster.members.length}）
        </summary>
        <ul className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2">
          {cluster.members.map((m) => (
            <li key={m.id}>
              <Link
                href={`/crm/clients/${m.id}`}
                className="block px-2.5 py-1.5 rounded border border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 transition-colors"
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-medium text-slate-800 truncate">{m.name}</span>
                  <span className="text-[10px] font-mono tabular-nums text-slate-400">{m.uid}</span>
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-[10px] text-slate-500">风险评分</span>
                  <span className={`text-[10px] font-semibold tabular-nums ${
                    m.riskScore >= 70 ? "text-red-700" : m.riskScore >= 40 ? "text-amber-700" : "text-emerald-700"
                  }`}>{m.riskScore}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-slate-400">{label}</div>
      <div className="text-xs font-semibold text-slate-800 tabular-nums">{value}</div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Client picker (for graph view center selection)                             */
/* ─────────────────────────────────────────────────────────────────────────── */

function ClientPickerDialog({ onPick, onClose }: { onPick: (id: string) => void; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [clients, setClients] = useState<BackofficeUser[]>([]);

  useEffect(() => {
    const handle = setTimeout(() => {
      clientService.list({ search: query, pageSize: 20 }).then((res) => setClients(res.items ?? []));
    }, 200);
    return () => clearTimeout(handle);
  }, [query]);

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm" />
      <div className="fixed left-1/2 top-[15vh] -translate-x-1/2 z-50 w-[480px] max-w-[90vw] bg-white rounded-xl border border-slate-200 shadow-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索客户姓名 / UID / 邮箱…"
            className="flex-1 outline-none text-sm"
            autoFocus
          />
          <button onClick={onClose}><X className="w-4 h-4 text-slate-400" /></button>
        </div>
        <ul className="max-h-[50vh] overflow-y-auto">
          {clients.map((c) => (
            <li key={c.id}>
              <button
                onClick={() => onPick(c.id)}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 text-left"
              >
                <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
                  {c.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-900 truncate">{c.name}</div>
                  <div className="text-[11px] text-slate-500 font-mono">{c.uid}</div>
                </div>
                {c.riskLevel === "critical" && <AlertTriangle className="w-3 h-3 text-red-500" />}
              </button>
            </li>
          ))}
          {clients.length === 0 && <li className="px-4 py-6 text-center text-sm text-slate-400">无结果</li>}
        </ul>
      </div>
    </>
  );
}
