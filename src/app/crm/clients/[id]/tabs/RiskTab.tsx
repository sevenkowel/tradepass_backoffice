"use client";

import { useEffect, useRef } from "react";
import { AlertTriangle, Network, Shield } from "lucide-react";
import type { ClientDetailData } from "@/types/backoffice/client-detail";
import * as echarts from "echarts";

interface Props {
  data: ClientDetailData;
}

export default function RiskTab({ data }: Props) {
  const { user, riskFactors, riskRelationships } = data;
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  // ECharts 关系图谱
  useEffect(() => {
    if (!chartRef.current) return;

    if (chartInstance.current) {
      chartInstance.current.dispose();
    }

    const chart = echarts.init(chartRef.current);
    chartInstance.current = chart;

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
          color: rel.relationshipType === "shared_ip" ? "#EF4444" : rel.relationshipType === "shared_device" ? "#F59E0B" : "#8B5CF6",
        },
        label: { fontSize: 12 },
      })),
    ];

    const links = riskRelationships.map((rel) => ({
      source: "current",
      target: rel.targetClientId,
      label: {
        show: true,
        formatter: rel.relationshipType === "shared_ip" ? "共享IP" : rel.relationshipType === "shared_device" ? "共享设备" : rel.relationshipType === "shared_bank" ? "共享银行卡" : "共享钱包",
        fontSize: 10,
      },
      lineStyle: {
        width: rel.strength * 5,
        curveness: 0.2,
      },
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
          links: links,
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
  }, [riskRelationships, user.name]);

  const riskColor = user.riskScore && user.riskScore >= 70 ? "text-red-600" : user.riskScore && user.riskScore >= 40 ? "text-amber-600" : "text-emerald-600";
  const riskBg = user.riskScore && user.riskScore >= 70 ? "bg-red-50" : user.riskScore && user.riskScore >= 40 ? "bg-amber-50" : "bg-emerald-50";

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-slate-900">风险分析</h3>

      {/* 风险评分 */}
      <div className={`${riskBg} rounded-xl p-6 text-center`}>
        <p className="text-sm text-slate-500 mb-1">风险评分</p>
        <p className={`text-5xl font-bold ${riskColor}`}>{user.riskScore}</p>
        <p className={`text-sm font-medium mt-1 ${riskColor}`}>
          {user.riskLevel === "low" ? "低风险" : user.riskLevel === "medium" ? "中风险" : user.riskLevel === "high" ? "高风险" : "极高风险"}
        </p>
      </div>

      {/* 风险因子 */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h4 className="text-sm font-semibold text-slate-700 mb-3">风险因子</h4>
        <div className="space-y-3">
          {riskFactors.map((factor) => (
            <div key={factor.name} className="flex items-center gap-3">
              <span className="text-sm text-slate-700 w-32 flex-shrink-0">{factor.name}</span>
              <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    factor.level === "low" ? "bg-emerald-500" : factor.level === "medium" ? "bg-amber-500" : "bg-red-500"
                  }`}
                  style={{ width: `${(factor.score / factor.maxScore) * 100}%` }}
                />
              </div>
              <span className="text-xs text-slate-500 w-8 text-right">{factor.score}</span>
              <span className={`text-xs w-12 text-right ${factor.level === "low" ? "text-emerald-600" : factor.level === "medium" ? "text-amber-600" : "text-red-600"}`}>
                {factor.level === "low" ? "低" : factor.level === "medium" ? "中" : "高"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 用户关系图谱 */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Network className="w-4 h-4 text-slate-500" />
          <h4 className="text-sm font-semibold text-slate-700">关联用户图谱</h4>
        </div>
        <div ref={chartRef} style={{ width: "100%", height: "320px" }} />
        {riskRelationships.length === 0 && (
          <div className="text-center py-10 text-slate-400 text-sm">未发现关联用户</div>
        )}
      </div>
    </div>
  );
}
