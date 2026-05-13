"use client";

import { useEffect, useMemo, useRef } from "react";
import { Network } from "lucide-react";
import * as echarts from "echarts";
import { useT } from "@/lib/i18n/LocaleProvider";
import type { BaseTabProps } from "@/types/backoffice/client";
import type { RiskRelationship } from "@/types/backoffice/client-detail";
import { RiskScoreRing } from "@/components/crm/clm/risk/RiskScoreRing";
import { RiskFactorList } from "@/components/crm/clm/risk/RiskFactorList";
import { lookupRiskProfile } from "@/lib/risk-engine/mock-risk-profiles";
import { NODE_COLOR, EDGE_COLOR } from "@/lib/risk-engine/graph";
import type { ClientGraphEdgeKind, ClientGraphNodeKind } from "@/types/core";

/** Pair an edge kind with the node kind to colour the connected node. */
const EDGE_TO_NODE_KIND: Record<ClientGraphEdgeKind, ClientGraphNodeKind> = {
  shared_ip: "shared_ip",
  shared_device: "shared_device",
  same_id: "same_id",
  shared_payment: "shared_payment",
  ib_invited: "ib_relation",
};

/** Map the legacy `RiskRelationship.relationshipType` enum onto the unified
 *  `ClientGraphEdgeKind`. The two enums share the first three values; the
 *  remaining ones (bank/wallet) collapse onto `shared_payment`. */
function relTypeToEdgeKind(type: RiskRelationship["relationshipType"]): ClientGraphEdgeKind {
  switch (type) {
    case "shared_ip":
    case "shared_device":
      return type;
    case "same_name":
      return "same_id";
    case "shared_bank":
    case "shared_crypto_wallet":
      return "shared_payment";
  }
}

/**
 * RiskTab — client-level view of the SAME RiskProfile the CLM Case
 * Detail consumes. We synthesise a profile from the user's flat
 * `riskScore`/`riskLevel` (kept for list-page convenience) so this tab
 * can render the explainable 6-axis breakdown identical to Case Detail.
 *
 * When the backend Risk Engine lands, swap `lookupRiskProfile(...)`
 * with `riskService.getProfile(clientId)` — UI doesn't change.
 */
export default function RiskTab({ data }: BaseTabProps) {
  const { t } = useT();
  const { user, riskRelationships } = data;
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  const riskProfile = useMemo(
    () => lookupRiskProfile(user.id, user.riskScore ?? 0, deriveAmlStatus(user.riskScore ?? 0)),
    [user.id, user.riskScore]
  );

  useEffect(() => {
    if (!chartRef.current) return;

    if (chartInstance.current) {
      chartInstance.current.dispose();
    }

    const chart = echarts.init(chartRef.current);
    chartInstance.current = chart;

    const relTypeLabel = (type: RiskRelationship["relationshipType"]) =>
      t(`clients.detail.risk.relType.${type}`);

    const nodes = [
      {
        id: "current",
        name: user.name,
        symbolSize: 60,
        itemStyle: { color: NODE_COLOR.center },
        label: { fontSize: 14, fontWeight: "bold" },
      },
      ...riskRelationships.map((rel) => {
        const kind = relTypeToEdgeKind(rel.relationshipType);
        const nodeKind = EDGE_TO_NODE_KIND[kind];
        return {
          id: rel.targetClientId,
          name: rel.targetClientName,
          symbolSize: 40,
          itemStyle: { color: NODE_COLOR[nodeKind] ?? NODE_COLOR.mixed },
          label: { fontSize: 12 },
        };
      }),
    ];

    const links = riskRelationships.map((rel) => {
      const kind = relTypeToEdgeKind(rel.relationshipType);
      return {
        source: "current",
        target: rel.targetClientId,
        label: { show: true, formatter: relTypeLabel(rel.relationshipType), fontSize: 10 },
        lineStyle: {
          width: rel.strength * 5,
          curveness: 0.2,
          color: EDGE_COLOR[kind] ?? EDGE_COLOR.shared_ip,
        },
      };
    });

    chart.setOption({
      tooltip: {},
      animationDurationUpdate: 1500,
      animationEasingUpdate: "quinticInOut",
      series: [
        {
          type: "graph",
          layout: "force",
          symbolSize: 50,
          roam: true,
          label: { show: true, position: "bottom" },
          edgeSymbol: ["none", "arrow"],
          edgeSymbolSize: [4, 10],
          data: nodes,
          links,
          force: { repulsion: 300, edgeLength: 150 },
          lineStyle: { opacity: 0.9, width: 2, curveness: 0.2 },
        },
      ],
    });

    const handleResize = () => chart.resize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.dispose();
    };
  }, [riskRelationships, user.name, t]);

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-slate-900">
        {t("clients.detail.risk.title")}
      </h3>

      {/* Composite + 6-axis breakdown — same component the CLM Case
          Detail uses, so a high-risk client looks the same wherever
          it's shown. */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="flex items-center gap-4 px-4 py-3 border-b border-slate-100">
          <RiskScoreRing
            score={riskProfile.overallScore}
            level={riskProfile.riskLevel}
            size={72}
            strokeWidth={6}
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {t("clients.detail.risk.score")}
            </p>
            <p className="text-sm font-semibold text-slate-900 mt-0.5">
              Click any factor to see reasoning
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              AML status:{" "}
              <span
                className={
                  riskProfile.amlStatus === "hit"
                    ? "text-red-600 font-semibold"
                    : riskProfile.amlStatus === "pass"
                      ? "text-emerald-600 font-semibold"
                      : "text-slate-700"
                }
              >
                {riskProfile.amlStatus.replace(/_/g, " ")}
              </span>
              <span className="text-slate-300 mx-1.5">·</span>
              <span className="text-slate-400">
                evaluated {new Date(riskProfile.calculatedAt).toLocaleString("en-US", {
                  month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                })}
              </span>
            </p>
          </div>
        </div>
        <RiskFactorList factors={riskProfile.factors} />
      </div>

      {/* Relationship graph — kept from the previous design (echarts
          force layout). Future: merge into ClientGraph in M7. */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Network className="w-4 h-4 text-slate-500" />
          <h4 className="text-sm font-semibold text-slate-700">
            {t("clients.detail.risk.relatedGraph")}
          </h4>
        </div>
        <div ref={chartRef} style={{ width: "100%", height: "320px" }} />
        {riskRelationships.length === 0 && (
          <div className="text-center py-10 text-slate-400 text-sm">
            {t("clients.detail.risk.noRelations")}
          </div>
        )}
      </div>
    </div>
  );
}

/** Trivial heuristic: high-end scores assume a watchlist hit is what
 *  drove them. Real engine returns this directly. */
function deriveAmlStatus(score: number): "pass" | "hit" | "pending" | "not_checked" {
  if (score >= 70) return "hit";
  if (score >= 30) return "pending";
  return "pass";
}
