"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp, TrendingDown, ArrowUpDown, Filter,
  ChevronDown, X, AlertTriangle, BarChart2,
} from "lucide-react";
import { PageHeader } from "@/components/portal/widgets/PageHeader";
import { cn } from "@/lib/utils";

const mockPositions = [
  { id: "P001", symbol: "XAUUSD", type: "BUY",  volume: 0.50, openPrice: 2318.40, currentPrice: 2334.60, sl: 2300.00, tp: 2360.00, pnl: 810.0,  pnlPct: 3.49,  swap: -12.5,  openTime: "2025-03-28 09:15", account: "MT5-001" },
  { id: "P002", symbol: "EURUSD", type: "SELL", volume: 1.00, openPrice: 1.09120, currentPrice: 1.08820, sl: 1.09500, tp: 1.08200, pnl: 300.0,  pnlPct: 2.75,  swap: -5.2,   openTime: "2025-03-28 11:30", account: "MT5-001" },
  { id: "P003", symbol: "BTCUSDT",type: "BUY",  volume: 0.02, openPrice: 66800,   currentPrice: 68250,   sl: 64000,   tp: 72000,   pnl: 290.0,  pnlPct: 2.17,  swap: 0,      openTime: "2025-03-27 14:00", account: "MT5-002" },
  { id: "P004", symbol: "GBPUSD", type: "SELL", volume: 0.30, openPrice: 1.26100, currentPrice: 1.26850, sl: 1.27200, tp: 1.25200, pnl: -225.0, pnlPct: -1.98, swap: -3.8,   openTime: "2025-03-27 16:45", account: "MT5-001" },
  { id: "P005", symbol: "USDJPY", type: "BUY",  volume: 0.50, openPrice: 151.200, currentPrice: 151.820, sl: 150.500, tp: 153.500, pnl: 204.5,  pnlPct: 1.35,  swap: 8.2,    openTime: "2025-03-26 08:20", account: "MT5-002" },
];

const totalPnL = mockPositions.reduce((sum, p) => sum + p.pnl, 0);
const totalPositions = mockPositions.length;
const profitCount = mockPositions.filter((p) => p.pnl > 0).length;

export default function PositionsPage() {
  const [sortField, setSortField] = useState<string>("pnl");
  const [sortDir, setSortDir]   = useState<"asc" | "desc">("desc");

  const sorted = [...mockPositions].sort((a, b) => {
    const av = (a as Record<string, unknown>)[sortField] as number;
    const bv = (b as Record<string, unknown>)[sortField] as number;
    return sortDir === "desc" ? bv - av : av - bv;
  });

  const handleSort = (field: string) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("desc"); }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Open Positions" description="Monitor and manage your live trading positions." />

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Positions", value: totalPositions, suffix: "", color: "blue" },
          { label: "In Profit",       value: profitCount,    suffix: ` / ${totalPositions}`, color: "emerald" },
          { label: "Floating P&L",    value: `${totalPnL >= 0 ? "+" : ""}$${totalPnL.toFixed(2)}`, suffix: "", color: totalPnL >= 0 ? "emerald" : "red" },
          { label: "Exposure",        value: "$38,420", suffix: " notional", color: "amber" },
        ].map(({ label, value, suffix, color }) => (
          <div key={label} className={cn(
            "rounded-2xl bg-white border-2 p-4",
            color === "blue"    && "border-blue-200",
            color === "emerald" && "border-emerald-200",
            color === "red"     && "border-red-200",
            color === "amber"   && "border-amber-200",
          )}>
            <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
            <p className={cn(
              "text-xl font-bold",
              color === "blue"    && "text-blue-700",
              color === "emerald" && "text-emerald-700",
              color === "red"     && "text-red-700",
              color === "amber"   && "text-amber-700",
            )}>
              {value}<span className="text-xs font-normal text-gray-400 ml-0.5">{suffix}</span>
            </p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white border-2 border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-800">Live Positions</h3>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-xl hover:border-gray-300 transition-colors">
              <Filter size={12} /> Filter
            </button>
            <button className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-xl hover:border-gray-300 transition-colors">
              <ChevronDown size={12} /> All Accounts
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {[
                  { label: "Symbol",        field: "symbol"       },
                  { label: "Type",          field: "type"         },
                  { label: "Volume",        field: "volume"       },
                  { label: "Open Price",    field: "openPrice"    },
                  { label: "Current",       field: "currentPrice" },
                  { label: "SL / TP",       field: null           },
                  { label: "Swap",          field: "swap"         },
                  { label: "P&L",           field: "pnl"          },
                  { label: "",              field: null           },
                ].map(({ label, field }) => (
                  <th
                    key={label}
                    className={cn(
                      "text-xs font-bold text-gray-400 px-4 py-3 text-left uppercase tracking-wide",
                      field && "cursor-pointer hover:text-gray-600 select-none"
                    )}
                    onClick={() => field && handleSort(field)}
                  >
                    <span className="flex items-center gap-1">
                      {label}
                      {field && <ArrowUpDown size={10} className="opacity-40" />}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((pos, i) => {
                const isBuy  = pos.type === "BUY";
                const isProfit = pos.pnl >= 0;
                return (
                  <motion.tr
                    key={pos.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors"
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold",
                          isBuy ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-red-50 text-red-700 border border-red-200"
                        )}>
                          {pos.symbol.slice(0, 2)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{pos.symbol}</p>
                          <p className="text-[10px] text-gray-400">{pos.account}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={cn(
                        "text-xs font-bold px-2 py-1 rounded-lg border",
                        isBuy ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-red-50 text-red-700 border-red-200"
                      )}>
                        {pos.type}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-sm font-mono font-semibold text-gray-800">{pos.volume}</td>
                    <td className="px-4 py-3.5 text-sm font-mono text-gray-700">{pos.openPrice}</td>
                    <td className="px-4 py-3.5 text-sm font-mono font-semibold text-gray-900">{pos.currentPrice}</td>
                    <td className="px-4 py-3.5">
                      <div className="text-[11px] space-y-0.5">
                        <div className="flex items-center gap-1 text-red-600">
                          <span className="font-bold">SL</span>
                          <span className="font-mono">{pos.sl}</span>
                        </div>
                        <div className="flex items-center gap-1 text-emerald-600">
                          <span className="font-bold">TP</span>
                          <span className="font-mono">{pos.tp}</span>
                        </div>
                      </div>
                    </td>
                    <td className={cn(
                      "px-4 py-3.5 text-sm font-mono",
                      pos.swap >= 0 ? "text-emerald-600" : "text-red-500"
                    )}>
                      {pos.swap >= 0 ? "+" : ""}{pos.swap}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className={cn(
                        "inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-sm font-bold",
                        isProfit
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-red-50 text-red-700 border-red-200"
                      )}>
                        {isProfit ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {isProfit ? "+" : ""}${pos.pnl.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <button className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors border border-transparent hover:border-red-200">
                        <X size={14} />
                      </button>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl">
            <AlertTriangle size={12} />
            Prices update every 5 seconds
          </div>
          <button className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-xl hover:bg-blue-100 transition-colors">
            <BarChart2 size={12} /> View Analytics
          </button>
        </div>
      </div>
    </div>
  );
}
