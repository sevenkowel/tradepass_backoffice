"use client";

import { useEffect, useRef } from "react";
import { Network } from "lucide-react";
import type { BaseTabProps } from "@/types/backoffice/client";
import * as echarts from "echarts";
import { useT } from "@/lib/i18n/LocaleProvider";
import type { RiskRelationship } from "@/types/backoffice/client-detail";

export default function RiskTab({ data }: BaseTabProps) {
  const { t } = useT();
  const { user, riskFactors, riskRelationships } = data;
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

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
        itemStyle: { color: "#3B82F6" },
        label: { fontSize: 14, fontWeight: "bold" },
      },
      ...riskRelationships.map((rel) => ({
        id: rel.targetClientId,
        name: rel.targetClientName,
        symbolSize: 40,
        itemStyle: {
          color:
            rel.relationshipType === "shared_ip"
              ? "#EF4444"
              : rel.relationshipType === "shared_device"
                ? "#F59E0B"
                : "#8B5CF6",
        },
        label: { fontSize: 12 },
      })),
    ];

    const links = riskRelationships.map((rel) => ({
      source: "current",
      target: rel.targetClientId,
      label: { show: true, formatter: relTypeLabel(rel.relationshipType), fontSize: 10 },
      lineStyle: { width: rel.strength * 5, curveness: 0.2 },
    }));

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

  const riskColor =
    user.riskScore && user.riskScore >= 70
      ? "text-red-600"
      : user.riskScore && user.riskScore >= 40
        ? "text-amber-600"
        : "text-emerald-600";
  const riskBg =
    user.riskScore && user.riskScore >= 70
      ? "bg-red-50"
      : user.riskScore && user.riskScore >= 40
        ? "bg-amber-50"
        : "bg-emerald-50";

  const riskLevelLabel = user.riskLevel ? t(`clients.risk.${user.riskLevel}`) : "";

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-slate-900">{t("clients.detail.risk.title")}</h3>

      <div className={`${riskBg} rounded-xl p-6 text-center`}>
        <p className="text-sm text-slate-500 mb-1">{t("clients.detail.risk.score")}</p>
        <p className={`text-5xl font-bold ${riskColor}`}>{user.riskScore}</p>
        <p className={`text-sm font-medium mt-1 ${riskColor}`}>{riskLevelLabel}</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h4 className="text-sm font-semibold text-slate-700 mb-3">{t("clients.detail.risk.factors")}</h4>
        <div className="space-y-3">
          {riskFactors.map((factor) => (
            <div key={factor.name} className="flex items-center gap-3">
              <span className="text-sm text-slate-700 w-32 flex-shrink-0">{factor.name}</span>
              <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    factor.level === "low"
                      ? "bg-emerald-500"
                      : factor.level === "medium"
                        ? "bg-amber-500"
                        : "bg-red-500"
                  }`}
                  style={{ width: `${(factor.score / factor.maxScore) * 100}%` }}
                />
              </div>
              <span className="text-xs text-slate-500 w-8 text-right">{factor.score}</span>
              <span
                className={`text-xs w-12 text-right ${
                  factor.level === "low"
                    ? "text-emerald-600"
                    : factor.level === "medium"
                      ? "text-amber-600"
                      : "text-red-600"
                }`}
              >
                {t(`clients.detail.risk.short.${factor.level}`)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Network className="w-4 h-4 text-slate-500" />
          <h4 className="text-sm font-semibold text-slate-700">{t("clients.detail.risk.relatedGraph")}</h4>
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
