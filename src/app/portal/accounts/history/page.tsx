"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp, TrendingDown, Download, Calendar, Filter,
  ChevronDown, ArrowUpDown, FileText
} from "lucide-react";
import { PageHeader } from "@/components/portal/widgets/PageHeader";
import { cn } from "@/lib/utils";

const mockHistory = [
  { id: "T001", symbol: "XAUUSD", type: "BUY",  volume: 0.50, openPrice: 2310.20, closePrice: 2334.60, sl: 2300, tp: 2360, pnl: 1220,  commission: 5, swap: -8,   openTime: "2025-03-25 09:15", closeTime: "2025-03-27 14:30", account: "MT5-001" },
  { id: "T002", symbol: "EURUSD", type: "SELL", volume: 1.00, openPrice: 1.09250, closePrice: 1.08820, sl: 1.095, tp: 1.082, pnl: 430,   commission: 7, swap: -12,  openTime: "2025-03-24 11:00", closeTime: "2025-03-26 16:45", account: "MT5-001" },
  { id: "T003", symbol: "BTCUSDT",type: "BUY",  volume: 0.02, openPrice: 64500,   closePrice: 68250,   sl: 62000, tp: 72000, pnl: 750,   commission: 10, swap: 0,    openTime: "2025-03-20 08:00", closeTime: "2025-03-25 10:20", account: "MT5-002" },
  { id: "T004", symbol: "GBPUSD", type: "SELL", volume: 0.30, openPrice: 1.27500, closePrice: 1.26850, sl: 1.280, tp: 1.260, pnl: 195,   commission: 3, swap: -4,   openTime: "2025-03-22 14:30", closeTime: "2025-03-24 09:00", account: "MT5-001" },
  { id: "T005", symbol: "USDJPY", type: "BUY",  volume: 0.50, openPrice: 149.500, closePrice: 151.820, sl: 148,   tp: 153,   pnl: 773,   commission: 5, swap: 15,   openTime: "2025-03-18 10:00", closeTime: "2025-03-22 11:30", account: "MT5-002" },
  { id: "T006", symbol: "XAUUSD", type: "SELL", volume: 0.25, openPrice: 2350.00, closePrice: 2315.00, sl: 2370,  tp: 2280,  pnl: 875,   commission: 3, swap: -5,   openTime: "2025-03-15 16:00", closeTime: "2025-03-18 08:15", account: "MT5-001" },
  { id: "T007", symbol: "EURUSD", type: "BUY",  volume: 0.80, openPrice: 1.08500, closePrice: 1.09100, sl: 1.080, tp: 1.095, pnl: 480,   commission: 6, swap: -8,   openTime: "2025-03-10 09:30", closeTime: "2025-03-14 14:00", account: "MT5-001" },
];

const totalPnL = mockHistory.reduce((sum, t) => sum + t.pnl, 0);
const totalCommission = mockHistory.reduce((sum, t) => sum + t.commission, 0);
const winCount = mockHistory.filter(t => t.pnl > 0).length;

export default function HistoryPage() {
  const [sortField, setSortField] = useState<string>("closeTime");
  const [sortDir, setSortDir]   = useState<"asc" | "desc">("desc");

  const sorted = [...mockHistory].sort((a, b) => {
    const av = (a as Record<string, unknown>)[sortField] as number;
    const bv = (b as Record<string, unknown>)[sortField] as number;
    return sortDir === "desc" ? (bv > av ? 1 : -1) : (av > bv ? 1 : -1);
  });

  const handleSort = (field: string) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("desc"); }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Trade History" description="Review your closed trades and performance." />

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Trades",    value: mockHistory.length, color: "blue" },
          { label: "Win Rate",        value: `${Math.round((winCount / mockHistory.length) * 100)}%`, color: "emerald" },
          { label: "Net P&L",         value: `${totalPnL >= 0 ? "+" : ""}$${totalPnL.toLocaleString()}`, color: totalPnL >= 0 ? "emerald" : "red" },
          { label: "Total Commission",value: `$${totalCommission}`, color: "amber" },
        ].map(({ label, value, color }) => (
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
            )}>{value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <button className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 bg-white border-2 border-gray-200 px-3 py-2 rounded-xl hover:border-gray-300 transition-colors">
          <Calendar size={14} /> Last 30 Days
        </button>
        <button className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 bg-white border-2 border-gray-200 px-3 py-2 rounded-xl hover:border-gray-300 transition-colors">
          <Filter size={14} /> Filter
        </button>
        <button className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 bg-white border-2 border-gray-200 px-3 py-2 rounded-xl hover:border-gray-300 transition-colors">
          <ChevronDown size={14} /> All Accounts
        </button>
        <button className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-blue-600 bg-blue-50 border-2 border-blue-200 px-3 py-2 rounded-xl hover:bg-blue-100 transition-colors">
          <Download size={14} /> Export CSV
        </button>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white border-2 border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {[
                  { label: "Symbol",      field: "symbol" },
                  { label: "Type",        field: "type" },
                  { label: "Volume",      field: "volume" },
                  { label: "Open Price",  field: "openPrice" },
                  { label: "Close Price", field: "closePrice" },
                  { label: "P&L",         field: "pnl" },
                  { label: "Closed",      field: "closeTime" },
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
              {sorted.map((trade, i) => {
                const isBuy = trade.type === "BUY";
                const isProfit = trade.pnl > 0;
                return (
                  <motion.tr
                    key={trade.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors"
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold",
                          isBuy ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-red-50 text-red-700 border border-red-200"
                        )}>
                          {trade.symbol.slice(0, 2)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{trade.symbol}</p>
                          <p className="text-[10px] text-gray-400">{trade.account}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={cn(
                        "text-xs font-bold px-2 py-1 rounded-lg border",
                        isBuy ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-red-50 text-red-700 border-red-200"
                      )}>
                        {trade.type}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-sm font-mono font-semibold text-gray-800">{trade.volume}</td>
                    <td className="px-4 py-3.5 text-sm font-mono text-gray-600">{trade.openPrice}</td>
                    <td className="px-4 py-3.5 text-sm font-mono font-semibold text-gray-900">{trade.closePrice}</td>
                    <td className="px-4 py-3.5">
                      <div className={cn(
                        "inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-sm font-bold",
                        isProfit
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-red-50 text-red-700 border-red-200"
                      )}>
                        {isProfit ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {isProfit ? "+" : ""}${trade.pnl}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-gray-500">{trade.closeTime}</td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
