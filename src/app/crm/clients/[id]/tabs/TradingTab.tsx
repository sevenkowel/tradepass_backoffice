"use client";

import { TrendingUp, BarChart3, Cpu, Zap, AlertTriangle, ArrowUpDown } from "lucide-react";
import type { ClientDetailData, TradeRecord } from "@/types/backoffice/client-detail";

interface Props {
  data: ClientDetailData;
}

export default function TradingTab({ data }: Props) {
  const { trades, tradingStats } = data;

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-slate-900">交易分析</h3>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="总手数" value={`${tradingStats.totalLots} Lots`} icon={BarChart3} color="blue" />
        <StatCard label="胜率" value={`${tradingStats.winRate}%`} icon={TrendingUp} color="emerald" />
        <StatCard label="EA 交易" value={tradingStats.isEATrading ? "是" : "否"} icon={Cpu} color="violet" />
        <StatCard label="高频交易" value={tradingStats.isHighFrequency ? "是" : "否"} icon={Zap} color="amber" />
      </div>

      {/* 风险行为 */}
      {tradingStats.riskBehaviors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h4 className="font-semibold text-red-800">风险行为检测</h4>
          </div>
          <div className="space-y-2">
            {tradingStats.riskBehaviors.map((behavior, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${behavior.level === "high" ? "bg-red-500" : behavior.level === "medium" ? "bg-amber-500" : "bg-emerald-500"}`} />
                <div>
                  <span className="font-medium text-red-700">
                    {behavior.type === "arbitrage" && "套利交易"}
                    {behavior.type === "tick_scalping" && "Tick 剥头皮"}
                    {behavior.type === "latency_arbitrage" && "延迟套利"}
                    {behavior.type === "high_frequency_abuse" && "高频滥用"}
                  </span>
                  <span className="text-red-600 ml-1">{behavior.description}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 交易记录表格 */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200">
          <h4 className="text-sm font-semibold text-slate-700">最近交易</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-500">
                <th className="px-4 py-2 text-left font-medium">时间</th>
                <th className="px-4 py-2 text-left font-medium">品种</th>
                <th className="px-4 py-2 text-left font-medium">方向</th>
                <th className="px-4 py-2 text-right font-medium">手数</th>
                <th className="px-4 py-2 text-right font-medium">开仓价</th>
                <th className="px-4 py-2 text-right font-medium">平仓价</th>
                <th className="px-4 py-2 text-right font-medium">盈亏</th>
              </tr>
            </thead>
            <tbody>
              {trades.map((trade) => (
                <TradeRow key={trade.id} trade={trade} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function TradeRow({ trade }: { trade: TradeRecord }) {
  return (
    <tr className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
      <td className="px-4 py-3 text-slate-500">{new Date(trade.openTime).toLocaleTimeString("zh-CN")}</td>
      <td className="px-4 py-3 font-medium text-slate-900">{trade.symbol}</td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${trade.type === "buy" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
          <ArrowUpDown className="w-3 h-3" />
          {trade.type === "buy" ? "买入" : "卖出"}
        </span>
      </td>
      <td className="px-4 py-3 text-right">{trade.volume}</td>
      <td className="px-4 py-3 text-right font-mono">{trade.openPrice}</td>
      <td className="px-4 py-3 text-right font-mono">{trade.closePrice || "—"}</td>
      <td className={`px-4 py-3 text-right font-medium ${trade.profit && trade.profit >= 0 ? "text-emerald-600" : "text-red-600"}`}>
        {trade.profit !== undefined ? `${trade.profit >= 0 ? "+" : ""}$${trade.profit}` : "持仓中"}
      </td>
    </tr>
  );
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string; icon: React.ElementType; color: string }) {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 text-blue-700",
    emerald: "bg-emerald-50 text-emerald-700",
    violet: "bg-violet-50 text-violet-700",
    amber: "bg-amber-50 text-amber-700",
  };

  return (
    <div className={`p-4 rounded-xl ${colorMap[color] || colorMap.blue}`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-4 h-4 opacity-70" />
        <span className="text-xs opacity-70">{label}</span>
      </div>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}
