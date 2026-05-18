"use client";

/**
 * Relationship Kanban board (v2) rooted at one client.
 *
 * v2 reorganises the 5-kind column layout into the **6 factor categories**
 * (Identity / Contact / Network / Device / Payment / Business) that the
 * relationship engine reports. Each card now also shows per-edge
 * evidence-strength badges (HARD / MEDIUM / SOFT / INFO).
 *
 * Data: GET /api/crm/clients/[id]/graph (real) or `mockData` prop (demo).
 */

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  ArrowUpRight,
  Loader2,
  Mail,
  Phone,
  Globe,
  Shield,
  Fingerprint,
  Wifi,
  CreditCard,
  UserCheck,
  Smartphone,
  Building,
  AtSign,
  Network as NetworkIcon,
  Coins,
  GitBranch,
  Briefcase,
  Users,
  ArrowDownUp,
  type LucideIcon,
} from "lucide-react";
import { useT } from "@/lib/i18n/LocaleProvider";
import type {
  ClientGraph,
  ClientGraphEdge,
  ClientGraphEdgeKind,
  ClientGraphNode,
  EdgeCategory,
  EvidenceStrength,
} from "@/types/core";
import {
  EDGE_CATEGORY,
  EDGE_STRENGTH,
  edgeKindLabel,
  pairScore,
} from "@/lib/risk-engine/graph";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

interface GraphResponse extends ClientGraph {
  success: boolean;
  error?: string;
}

interface RelationshipGraphProps {
  clientId?: string;
  onPickClient?: () => void;
  mockData?: ClientGraph;
}

/* -------------------------------------------------------------------------- */
/* API wire formats                                                           */
/* -------------------------------------------------------------------------- */

interface ApiNode {
  id: string;
  uid: string;
  name: string;
  email: string;
  phone: string;
  country?: string;
  kycStatus: string;
  riskLevel: string;
  riskScore: number;
  lastLoginAt: string;
  createdAt: string;
  type: ClientGraphNode["kind"];
}

interface ApiEdge {
  source: string;
  target: string;
  type: ClientGraphEdgeKind;
  label: string;
  /** v2 — server may now include strength + lastSeenAt. */
  strength?: EvidenceStrength;
  detectedAt?: string;
  lastSeenAt?: string;
}

interface ApiResponse {
  success: boolean;
  center: ApiNode;
  nodes: ApiNode[];
  edges: ApiEdge[];
  error?: string;
}

function apiNodeToCore(n: ApiNode): ClientGraphNode {
  return {
    id: n.id, uid: n.uid, name: n.name, email: n.email, phone: n.phone,
    country: n.country, kycStatus: n.kycStatus,
    riskLevel: (n.riskLevel as ClientGraphNode["riskLevel"]) ?? "low",
    riskScore: n.riskScore,
    lastLoginAt: n.lastLoginAt, createdAt: n.createdAt,
    kind: n.type,
  };
}

function apiEdgeToCore(e: ApiEdge): ClientGraphEdge {
  return {
    source: e.source, target: e.target, kind: e.type, label: e.label,
    strength: e.strength ?? EDGE_STRENGTH[e.type] ?? "soft",
    detectedAt: e.detectedAt,
    lastSeenAt: e.lastSeenAt,
  };
}

/* -------------------------------------------------------------------------- */
/* Tokens                                                                     */
/* -------------------------------------------------------------------------- */

const KYC_ICONS: Record<string, LucideIcon> = {
  verified: CheckCircle, pending: Clock, rejected: XCircle, not_submitted: AlertTriangle,
};
const KYC_COLORS: Record<string, string> = {
  verified: "text-emerald-600", pending: "text-amber-600",
  rejected: "text-red-600", not_submitted: "text-slate-400",
};
const RISK_BADGE: Record<string, string> = {
  low: "bg-emerald-50 text-emerald-700 border-emerald-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  high: "bg-orange-50 text-orange-700 border-orange-200",
  critical: "bg-red-50 text-red-700 border-red-200",
};

const STRENGTH_PILL: Record<EvidenceStrength, string> = {
  hard:   "bg-red-100 text-red-700 border-red-200",
  medium: "bg-amber-100 text-amber-700 border-amber-200",
  soft:   "bg-slate-100 text-slate-600 border-slate-200",
  info:   "bg-sky-50 text-sky-700 border-sky-200",
};
const STRENGTH_LABEL: Record<EvidenceStrength, string> = {
  hard: "HARD", medium: "MED", soft: "SOFT", info: "INFO",
};

/** Lucide icon per edge kind. Partial lookup with fallback handled below. */
const KIND_ICON: Partial<Record<ClientGraphEdgeKind, LucideIcon>> = {
  // Identity
  same_id_document: Shield, same_passport: Shield, same_tax_id: Shield,
  same_name_dob: Users, same_id: Shield,
  // Contact
  same_email: AtSign, same_phone: Phone, email_pattern_sim: AtSign,
  // Network
  shared_ip: Wifi, same_ip_subnet: NetworkIcon, same_isp_geo: Globe,
  // Device
  shared_device: Fingerprint, shared_browser_fp: Fingerprint, shared_mobile_id: Smartphone,
  // Payment
  shared_payment: CreditCard, shared_bank_account: Building,
  shared_crypto_wallet: Coins, shared_e_wallet: CreditCard,
  fund_flow_link: ArrowDownUp,
  // Business
  ib_invited: UserCheck, referral_chain: GitBranch, copy_trading: Briefcase,
};

/* -------------------------------------------------------------------------- */
/* Category columns                                                           */
/* -------------------------------------------------------------------------- */

interface CategoryDef {
  cat: EdgeCategory;
  labelKey: string;        // i18n key
  fallback: string;        // display fallback if i18n missing
  icon: LucideIcon;
  pill: string;
  dot: string;
  border: string;
  headerBg: string;
}

const CATEGORIES: CategoryDef[] = [
  { cat: "identity", labelKey: "clients.relationships.cat.identity", fallback: "Identity",
    icon: Shield,
    pill: "bg-red-100 text-red-700 border-red-200",
    dot: "bg-red-500", border: "border-red-200", headerBg: "bg-red-50" },
  { cat: "payment",  labelKey: "clients.relationships.cat.payment",  fallback: "Payment",
    icon: CreditCard,
    pill: "bg-violet-100 text-violet-700 border-violet-200",
    dot: "bg-violet-500", border: "border-violet-200", headerBg: "bg-violet-50" },
  { cat: "device",   labelKey: "clients.relationships.cat.device",   fallback: "Device",
    icon: Fingerprint,
    pill: "bg-emerald-100 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500", border: "border-emerald-200", headerBg: "bg-emerald-50" },
  { cat: "network",  labelKey: "clients.relationships.cat.network",  fallback: "Network",
    icon: Wifi,
    pill: "bg-amber-100 text-amber-700 border-amber-200",
    dot: "bg-amber-500", border: "border-amber-200", headerBg: "bg-amber-50" },
  { cat: "contact",  labelKey: "clients.relationships.cat.contact",  fallback: "Contact",
    icon: AtSign,
    pill: "bg-orange-100 text-orange-700 border-orange-200",
    dot: "bg-orange-500", border: "border-orange-200", headerBg: "bg-orange-50" },
  { cat: "business", labelKey: "clients.relationships.cat.business", fallback: "Business",
    icon: UserCheck,
    pill: "bg-sky-100 text-sky-700 border-sky-200",
    dot: "bg-sky-500", border: "border-sky-200", headerBg: "bg-sky-50" },
];

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export default function RelationshipGraph({ clientId, onPickClient, mockData }: RelationshipGraphProps) {
  const { t } = useT();
  const [data, setData] = useState<GraphResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (mockData) {
      setData({ success: true, ...mockData });
      setLoading(false);
      setError("");
      return;
    }
    if (!clientId) {
      setData(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError("");
    fetch(`/api/crm/clients/${encodeURIComponent(clientId)}/graph`, {
      credentials: "include", cache: "no-store",
    })
      .then((r) => r.json())
      .then((d: ApiResponse) => {
        if (cancelled) return;
        if (d.success) {
          setData({
            success: true,
            center: apiNodeToCore(d.center),
            nodes: d.nodes.map(apiNodeToCore),
            edges: d.edges.map(apiEdgeToCore),
          });
        } else setError(d.error || "Failed to load");
      })
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : String(e)))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [clientId, mockData]);

  /* Derived: edges grouped by (target, category). */
  const nodeMap = useMemo(() => {
    const map = new Map<string, ClientGraphNode>();
    if (!data) return map;
    for (const n of data.nodes) map.set(n.id, n);
    return map;
  }, [data]);

  const edgesByTargetCategory = useMemo(() => {
    const map = new Map<string, Map<EdgeCategory, ClientGraphEdge[]>>();
    if (!data) return map;
    for (const e of data.edges) {
      const cat = EDGE_CATEGORY[e.kind];
      if (!cat) continue;
      const byCat = map.get(e.target) ?? new Map<EdgeCategory, ClientGraphEdge[]>();
      const list = byCat.get(cat) ?? [];
      list.push(e);
      byCat.set(cat, list);
      map.set(e.target, byCat);
    }
    return map;
  }, [data]);

  /* Category counts — unique-target per category. */
  const categoryCounts: Record<EdgeCategory, number> = useMemo(() => {
    const c: Record<EdgeCategory, number> = {
      identity: 0, contact: 0, network: 0, device: 0, payment: 0, business: 0,
    };
    for (const byCat of edgesByTargetCategory.values()) {
      for (const cat of byCat.keys()) c[cat] += 1;
    }
    return c;
  }, [edgesByTargetCategory]);

  /* Strength counts across the whole graph. */
  const strengthCounts: Record<EvidenceStrength, number> = useMemo(() => {
    const c: Record<EvidenceStrength, number> = { hard: 0, medium: 0, soft: 0, info: 0 };
    if (!data) return c;
    for (const e of data.edges) {
      const s = e.strength ?? EDGE_STRENGTH[e.kind] ?? "soft";
      c[s] += 1;
    }
    return c;
  }, [data]);

  const searchQ = searchTerm.trim().toLowerCase();
  const matchesSearch = (n: ClientGraphNode) => {
    if (!searchQ) return true;
    return (
      n.name.toLowerCase().includes(searchQ) ||
      n.uid.toLowerCase().includes(searchQ) ||
      n.email.toLowerCase().includes(searchQ)
    );
  };

  /* Per-column items: each node appears in every category it has edges in. */
  const boardColumns = useMemo(() => {
    if (!data) return [];
    return CATEGORIES.map((col) => {
      const items: { node: ClientGraphNode; edges: ClientGraphEdge[]; score: number }[] = [];
      for (const [targetId, byCat] of edgesByTargetCategory.entries()) {
        const edges = byCat.get(col.cat);
        if (!edges?.length) continue;
        const node = nodeMap.get(targetId);
        if (!node) continue;
        if (!matchesSearch(node)) continue;
        // Score across ALL edges for this pair, not just this category.
        const allEdges = [...byCat.values()].flat();
        items.push({ node, edges, score: pairScore(allEdges) });
      }
      items.sort((a, b) => b.score - a.score);
      return { ...col, items };
    });
  }, [data, edgesByTargetCategory, nodeMap, searchQ]);

  if (!clientId) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
        <p className="text-slate-700 font-medium mb-2">{t("clients.relationships.pickPrompt")}</p>
        <p className="text-sm text-slate-500 mb-4">{t("clients.relationships.pickHint")}</p>
        {onPickClient && (
          <button
            onClick={onPickClient}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
          >
            <Search className="w-4 h-4" />
            {t("clients.relationships.pickAction")}
          </button>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-[400px] flex items-center justify-center bg-slate-50 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-3 text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          {t("clients.relationships.loading")}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-700">
        <span className="font-medium">Error:</span> {error}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="flex-1 max-w-md relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={t("clients.relationships.searchPlaceholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        {searchQ && (
          <span className="text-xs text-slate-500">
            {boardColumns.reduce((sum, c) => sum + c.items.length, 0)} results
          </span>
        )}
      </div>

      <CenterSummary
        center={data.center}
        categoryCounts={categoryCounts}
        strengthCounts={strengthCounts}
      />

      {/* Kanban */}
      {data.nodes.length === 0 ? (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-12 text-center text-slate-500">
          <p className="font-medium mb-1">{t("clients.relationships.empty.title")}</p>
          <p className="text-sm">{t("clients.relationships.empty.desc")}</p>
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-2 -mx-2 px-2">
          {CATEGORIES.map((col) => {
            const column = boardColumns.find((c) => c.cat === col.cat);
            const items = column?.items ?? [];
            const count = categoryCounts[col.cat];
            if (searchQ && items.length === 0) return null;
            const ColIcon = col.icon;

            return (
              <div key={col.cat} className="w-[300px] shrink-0 flex flex-col max-h-[calc(100vh-280px)]">
                <div className={`rounded-t-xl border ${col.border} ${col.headerBg} px-3 py-2.5 flex items-center justify-between`}>
                  <div className="flex items-center gap-2">
                    <ColIcon className="w-3.5 h-3.5 text-slate-700" />
                    <span className="text-sm font-semibold text-slate-800">
                      {t(col.labelKey) || col.fallback}
                    </span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${col.pill}`}>
                      {searchQ ? items.length : count}
                    </span>
                  </div>
                </div>

                <div className={`flex-1 overflow-y-auto border-x border-b ${col.border} rounded-b-xl bg-slate-50/50 p-2.5 space-y-2.5`}>
                  {items.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-400">
                      {t("clients.relationships.noRelated") || "No related clients"}
                    </div>
                  ) : (
                    items.map(({ node, edges, score }) => (
                      <RelationCard
                        key={`${col.cat}-${node.id}`}
                        node={node}
                        edges={edges}
                        col={col}
                        pairScoreVal={score}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Center summary                                                             */
/* -------------------------------------------------------------------------- */

function CenterSummary({
  center, categoryCounts, strengthCounts,
}: {
  center: ClientGraphNode;
  categoryCounts: Record<EdgeCategory, number>;
  strengthCounts: Record<EvidenceStrength, number>;
}) {
  const total = Object.values(categoryCounts).reduce((a, b) => a + b, 0);
  const riskClass = RISK_BADGE[center.riskLevel] ?? RISK_BADGE.low;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center text-sm font-bold shrink-0">
          {center.name.slice(0, 1).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-slate-900">{center.name}</span>
            <span className="text-[11px] text-slate-400 font-mono">{center.uid}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${riskClass}`}>
              {center.riskLevel} {center.riskScore}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-0.5 text-[11px] text-slate-500">
            <span>{center.email}</span>
            {center.phone && <span>{center.phone}</span>}
          </div>
        </div>
        <div className="text-right shrink-0 hidden sm:flex gap-3">
          {(["hard", "medium", "soft"] as const).map((s) => (
            strengthCounts[s] > 0 && (
              <div key={s} className="text-center">
                <div className={`text-lg font-bold ${
                  s === "hard" ? "text-red-600" : s === "medium" ? "text-amber-600" : "text-slate-500"
                }`}>
                  {strengthCounts[s]}
                </div>
                <div className="text-[9px] text-slate-500 uppercase tracking-wider">{STRENGTH_LABEL[s]}</div>
              </div>
            )
          ))}
          <div className="text-center border-l border-slate-200 pl-3">
            <div className="text-lg font-bold text-slate-900">{total}</div>
            <div className="text-[9px] text-slate-500 uppercase tracking-wider">Links</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Relation card                                                              */
/* -------------------------------------------------------------------------- */

function RelationCard({
  node, edges, col, pairScoreVal,
}: {
  node: ClientGraphNode;
  edges: ClientGraphEdge[];
  col: CategoryDef;
  pairScoreVal: number;
}) {
  const KycIcon = KYC_ICONS[node.kycStatus] ?? AlertTriangle;
  const kycColor = KYC_COLORS[node.kycStatus] ?? "text-slate-400";
  const riskClass = RISK_BADGE[node.riskLevel] ?? RISK_BADGE.low;
  const [showAll, setShowAll] = useState(false);

  const visibleEdges = showAll ? edges : edges.slice(0, 2);
  const hasMore = edges.length > 2;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900 truncate">{node.name}</p>
          <p className="text-[10px] text-slate-400 font-mono truncate">{node.uid}</p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className={`text-[10px] px-1.5 py-0.5 rounded border ${riskClass}`}>
            {node.riskScore}
          </span>
          {/* Pair score badge — composite from all categories. */}
          <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
            pairScoreVal >= 80 ? "bg-red-600 text-white"
            : pairScoreVal >= 60 ? "bg-orange-500 text-white"
            : pairScoreVal >= 30 ? "bg-amber-400 text-amber-900"
            : "bg-slate-200 text-slate-700"
          }`}>
            link {pairScoreVal}
          </span>
        </div>
      </div>

      {/* Contact info */}
      <div className="space-y-1 text-[11px] text-slate-600 mb-2">
        <div className="flex items-center gap-1.5">
          <Mail className="w-3 h-3 text-slate-400 shrink-0" />
          <span className="truncate">{node.email}</span>
        </div>
        {node.phone && (
          <div className="flex items-center gap-1.5">
            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
            <span>{node.phone}</span>
          </div>
        )}
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`inline-flex items-center gap-1 ${kycColor}`}>
            <KycIcon className="w-3 h-3" />
            {node.kycStatus}
          </span>
          {node.country && (
            <span className="inline-flex items-center gap-1 text-slate-500">
              <Globe className="w-3 h-3" />
              {node.country}
            </span>
          )}
        </div>
      </div>

      {/* Evidence */}
      <div className="border-t border-slate-100 pt-2 mb-2">
        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide mb-1">
          Evidence
        </p>
        <div className="space-y-1.5">
          {visibleEdges.map((e, i) => {
            const KindIcon = KIND_ICON[e.kind] ?? Shield;
            const strength = e.strength ?? EDGE_STRENGTH[e.kind] ?? "soft";
            return (
              <div key={i} className="flex items-start gap-1.5 text-[11px]">
                <KindIcon className="w-3 h-3 text-slate-400 mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="text-[10px] font-semibold text-slate-700">
                      {edgeKindLabel(e.kind)}
                    </span>
                    <span className={`text-[9px] px-1 py-px rounded border ${STRENGTH_PILL[strength]}`}>
                      {STRENGTH_LABEL[strength]}
                    </span>
                  </div>
                  <p className="text-slate-500 leading-snug">{e.label}</p>
                </div>
              </div>
            );
          })}
          {hasMore && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="text-[10px] text-blue-600 hover:underline mt-0.5"
            >
              {showAll ? "Show less" : `+${edges.length - 2} more`}
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        <span className="text-[10px] text-slate-400">
          {new Date(node.createdAt).toLocaleDateString()}
        </span>
        <Link
          href={`/crm/clients/${node.id}`}
          className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-700 font-medium"
        >
          View
          <ArrowUpRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}
