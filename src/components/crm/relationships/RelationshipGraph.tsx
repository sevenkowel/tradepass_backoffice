"use client";

/**
 * Force-directed relationship graph rooted at one client.
 *
 * Real data via `/api/crm/clients/[id]/graph`. Rendering via
 * `react-force-graph-2d` (loaded through ForceGraphWrapper, which keeps
 * the canvas off the SSR pass).
 */

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import {
  Search,
  Filter,
  Maximize2,
  Minimize2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  ArrowUpRight,
  Loader2,
  type LucideIcon,
} from "lucide-react";
import { useT } from "@/lib/i18n/LocaleProvider";
import ForceGraph2D from "./ForceGraphWrapper";
import type {
  ClientGraph,
  ClientGraphEdge,
  ClientGraphEdgeKind,
  ClientGraphNode,
} from "@/types/core";
import {
  EDGE_COLOR,
  EDGE_DASH,
  NODE_COLOR,
  countEdgesByKind,
} from "@/lib/risk-engine/graph";

interface GraphResponse extends ClientGraph {
  success: boolean;
  error?: string;
}

interface RelationshipGraphProps {
  clientId?: string;
  onPickClient?: () => void;
}

/** Wire format from `/api/crm/clients/[id]/graph` still uses the legacy
 *  `type` (node) and `type` (edge) field names. Convert on read so the
 *  component itself only operates on the unified `kind` shape. */
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
    id: n.id,
    uid: n.uid,
    name: n.name,
    email: n.email,
    phone: n.phone,
    country: n.country,
    kycStatus: n.kycStatus,
    riskLevel: (n.riskLevel as ClientGraphNode["riskLevel"]) ?? "low",
    riskScore: n.riskScore,
    lastLoginAt: n.lastLoginAt,
    createdAt: n.createdAt,
    kind: n.type,
  };
}

function apiEdgeToCore(e: ApiEdge): ClientGraphEdge {
  return {
    source: e.source,
    target: e.target,
    kind: e.type,
    label: e.label,
  };
}

const KYC_ICONS: Record<string, LucideIcon> = {
  verified: CheckCircle,
  pending: Clock,
  rejected: XCircle,
  not_submitted: AlertTriangle,
};

const KYC_COLORS: Record<string, string> = {
  verified: "text-emerald-600",
  pending: "text-amber-600",
  rejected: "text-red-600",
  not_submitted: "text-slate-400",
};

const RISK_COLORS: Record<string, string> = {
  low: "bg-emerald-100 text-emerald-700",
  medium: "bg-amber-100 text-amber-700",
  high: "bg-orange-100 text-orange-700",
  critical: "bg-red-100 text-red-700",
};

const GRAPH_W = 1200;
const GRAPH_H = 700;

export default function RelationshipGraph({ clientId, onPickClient }: RelationshipGraphProps) {
  const { t } = useT();
  const [data, setData] = useState<GraphResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedKinds, setSelectedKinds] = useState<Set<ClientGraphEdgeKind>>(
    new Set(["shared_ip", "shared_device", "same_id", "shared_payment", "ib_invited"])
  );
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hoveredNode, setHoveredNode] = useState<ClientGraphNode | null>(null);
  const [selectedNode, setSelectedNode] = useState<ClientGraphNode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch graph
  useEffect(() => {
    if (!clientId) {
      setData(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError("");
    fetch(`/api/crm/clients/${encodeURIComponent(clientId)}/graph`, {
      credentials: "include",
      cache: "no-store",
    })
      .then((r) => r.json())
      .then((d: ApiResponse) => {
        if (cancelled) return;
        if (d.success) {
          const core: GraphResponse = {
            success: true,
            center: apiNodeToCore(d.center),
            nodes: d.nodes.map(apiNodeToCore),
            edges: d.edges.map(apiEdgeToCore),
          };
          setData(core);
        } else setError(d.error || "Failed to load");
      })
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : String(e)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [clientId]);

  const filteredEdges = useMemo(() => {
    if (!data) return [];
    return data.edges.filter((e) => selectedKinds.has(e.kind));
  }, [data, selectedKinds]);

  const visibleNodeIds = useMemo(() => {
    if (!data) return new Set<string>();
    const ids = new Set<string>([data.center.id]);
    for (const e of filteredEdges) {
      ids.add(e.source);
      ids.add(e.target);
    }
    return ids;
  }, [data, filteredEdges]);

  /**
   * Force-graph data. Each node carries `__center` so we can size/colour
   * it differently. Links keep their type so the link painter can pick a
   * stroke colour. The center node is fixed at the canvas centre via
   * `fx/fy` so the focus client doesn't drift.
   */
  const graphData = useMemo(() => {
    if (!data) return { nodes: [], links: [] };
    const centerFx = GRAPH_W / 2;
    const centerFy = GRAPH_H / 2;
    const nodes = [
      { ...data.center, __center: true, fx: centerFx, fy: centerFy },
      ...data.nodes
        .filter((n) => visibleNodeIds.has(n.id))
        .map((n) => ({ ...n, __center: false })),
    ];
    return { nodes, links: filteredEdges };
  }, [data, filteredEdges, visibleNodeIds]);

  const matchesSearch = (n: ClientGraphNode) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      n.name.toLowerCase().includes(q) ||
      n.uid.toLowerCase().includes(q) ||
      n.email.toLowerCase().includes(q)
    );
  };

  const counts = useMemo(
    () =>
      data
        ? countEdgesByKind(data.edges)
        : { shared_ip: 0, shared_device: 0, same_id: 0, shared_payment: 0, ib_invited: 0 },
    [data]
  );

  const toggleKind = (kind: ClientGraphEdgeKind) => {
    setSelectedKinds((prev) => {
      const next = new Set(prev);
      if (next.has(kind)) next.delete(kind);
      else next.add(kind);
      return next;
    });
  };

  const toggleFullscreen = async () => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      await el.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Empty / picker state
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
      <div className="h-[700px] flex items-center justify-center bg-slate-50 rounded-2xl border border-slate-200">
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
    <div className="space-y-3" ref={containerRef}>
      {/* Controls */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={t("clients.relationships.searchPlaceholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-slate-500" />
          {(
            [
              { key: "shared_ip" as const, label: t("clients.relationships.filter.sharedIp"), color: "bg-amber-100 text-amber-700", count: counts.shared_ip },
              { key: "shared_device" as const, label: t("clients.relationships.filter.sharedDevice"), color: "bg-emerald-100 text-emerald-700", count: counts.shared_device },
              { key: "same_id" as const, label: t("clients.relationships.filter.sameId"), color: "bg-red-100 text-red-700", count: counts.same_id },
            ]
          ).map(({ key, label, color, count }) => (
            <button
              key={key}
              onClick={() => toggleKind(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedKinds.has(key) ? color : "bg-slate-100 text-slate-400"
              }`}
            >
              {label} ({count})
            </button>
          ))}
        </div>

        <button
          onClick={toggleFullscreen}
          className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
          title={t("clients.relationships.fullscreen")}
        >
          {isFullscreen ? (
            <Minimize2 className="w-4 h-4 text-slate-600" />
          ) : (
            <Maximize2 className="w-4 h-4 text-slate-600" />
          )}
        </button>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 text-xs text-slate-500 flex-wrap">
        <Legend color={NODE_COLOR.center} label={t("clients.relationships.legend.center")} />
        <Legend color={NODE_COLOR.shared_ip} label={`${t("clients.relationships.legend.sharedIp")} (${counts.shared_ip})`} />
        <Legend color={NODE_COLOR.shared_device} label={`${t("clients.relationships.legend.sharedDevice")} (${counts.shared_device})`} />
        <Legend color={NODE_COLOR.same_id} label={`${t("clients.relationships.legend.sameId")} (${counts.same_id})`} />
        <Legend color={NODE_COLOR.mixed} label={t("clients.relationships.legend.mixed")} />
        <div className="ml-auto flex items-center gap-2">
          <span className="font-medium">{t("clients.relationships.totals.label")}</span>
          <span>
            {graphData.nodes.length} {t("clients.relationships.totals.nodes")}
          </span>
          <span className="mx-1">|</span>
          <span>
            {filteredEdges.length} {t("clients.relationships.totals.links")}
          </span>
        </div>
      </div>

      {/* Force-directed graph */}
      <div className="relative bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden">
        {data.nodes.length === 0 ? (
          <div className="h-[700px] flex flex-col items-center justify-center text-slate-500">
            <p className="font-medium mb-1">{t("clients.relationships.empty.title")}</p>
            <p className="text-sm">{t("clients.relationships.empty.desc")}</p>
          </div>
        ) : (
          <ForceGraph2D
            graphData={graphData}
            width={GRAPH_W}
            height={GRAPH_H}
            backgroundColor="#f8fafc"
            cooldownTicks={120}
            nodeLabel={(node) => (node as unknown as ClientGraphNode).name}
            nodeRelSize={8}
            nodeVal={(node) => ((node as unknown as { __center: boolean }).__center ? 30 : 12)}
            nodeColor={(node) => NODE_COLOR[(node as unknown as ClientGraphNode).kind]}
            nodeCanvasObjectMode={() => "after"}
            nodeCanvasObject={(node, ctx, scale) => {
              const n = node as unknown as ClientGraphNode & { x?: number; y?: number; __center?: boolean };
              if (n.x == null || n.y == null) return;
              const fontSize = Math.max(10, 12 / scale);
              const isHighlighted = searchTerm.trim().length > 0 && matchesSearch(n);
              const isDimmed = searchTerm.trim().length > 0 && !matchesSearch(n);
              ctx.globalAlpha = isDimmed ? 0.25 : 1;
              if (isHighlighted) {
                ctx.strokeStyle = "#0ea5e9";
                ctx.lineWidth = 3 / scale;
                ctx.beginPath();
                ctx.arc(n.x, n.y, (n.__center ? 14 : 10) + 4 / scale, 0, Math.PI * 2);
                ctx.stroke();
              }
              ctx.font = `${n.__center ? 600 : 500} ${fontSize}px sans-serif`;
              ctx.fillStyle = "#1e293b";
              ctx.textAlign = "center";
              ctx.textBaseline = "top";
              ctx.fillText(truncate(n.name, 18), n.x, n.y + (n.__center ? 18 : 14));
              ctx.font = `${Math.max(8, 9 / scale)}px sans-serif`;
              ctx.fillStyle = "#94a3b8";
              ctx.fillText(n.uid, n.x, n.y + (n.__center ? 32 : 26));
              ctx.globalAlpha = 1;
            }}
            linkColor={(link) => EDGE_COLOR[(link as unknown as ClientGraphEdge).kind]}
            linkWidth={1.6}
            linkDirectionalParticles={(link) =>
              (link as unknown as ClientGraphEdge).kind === "same_id" ? 2 : 0
            }
            linkDirectionalParticleSpeed={0.006}
            linkLineDash={(link) => EDGE_DASH[(link as unknown as ClientGraphEdge).kind]}
            onNodeHover={(node) => setHoveredNode((node as ClientGraphNode | null) ?? null)}
            onNodeClick={(node) => setSelectedNode(node as unknown as ClientGraphNode)}
          />
        )}

        {/* Hover tooltip */}
        {hoveredNode && (
          <div className="absolute top-4 right-4 max-w-xs bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-xs pointer-events-none">
            <NodeSummary node={hoveredNode} />
          </div>
        )}
      </div>

      {/* Selected node detail panel */}
      {selectedNode && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <NodeSummary node={selectedNode} verbose />
            </div>
            <div className="flex flex-col items-end gap-2">
              <Link
                href={`/crm/clients/${selectedNode.id}`}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700"
              >
                {t("clients.relationships.openDetail")}
                <ArrowUpRight className="w-3 h-3" />
              </Link>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-xs text-slate-500 hover:text-slate-700"
              >
                {t("clients.relationships.close")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function NodeSummary({ node, verbose = false }: { node: ClientGraphNode; verbose?: boolean }) {
  const KycIcon = KYC_ICONS[node.kycStatus] ?? AlertTriangle;
  const kycColor = KYC_COLORS[node.kycStatus] ?? "text-slate-400";
  const riskClass = RISK_COLORS[node.riskLevel] ?? RISK_COLORS.low;
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full" style={{ background: NODE_COLOR[node.kind] }} />
        <p className="font-semibold text-slate-900">{node.name}</p>
        <span className="text-[10px] text-slate-400">{node.uid}</span>
      </div>
      <p className="text-slate-600">{node.email}</p>
      {verbose && <p className="text-slate-500 text-xs">{node.phone}</p>}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] ${kycColor} bg-white border border-slate-100`}>
          <KycIcon className="w-3 h-3" />
          {node.kycStatus}
        </span>
        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${riskClass}`}>
          {node.riskLevel} ({node.riskScore})
        </span>
        {node.country && (
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600">
            {node.country}
          </span>
        )}
      </div>
      {verbose && (
        <p className="text-[11px] text-slate-400">
          Registered {new Date(node.createdAt).toLocaleDateString()} · Last login{" "}
          {new Date(node.lastLoginAt).toLocaleDateString()}
        </p>
      )}
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-3 h-3 rounded-full" style={{ background: color }} />
      <span>{label}</span>
    </div>
  );
}

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max - 1) + "…" : str;
}
