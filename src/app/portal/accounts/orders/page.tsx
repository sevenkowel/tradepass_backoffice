"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Clock, AlertCircle, CheckCircle2, XCircle, ArrowUpDown, Filter,
  ChevronDown, Edit3, Trash2, Play, Pause
} from "lucide-react";
import { PageHeader } from "@/components/portal/widgets/PageHeader";
import { cn } from "@/lib/utils";

const mockOrders = [
  { id: "ORD001", symbol: "XAUUSD", type: "BUY LIMIT",  volume: 0.50, price: 2300.00, current: 2334.60, sl: 2280.00, tp: 2360.00, status: "pending", expire: "GTC", placed: "2025-03-28 08:00", account: "MT5-001" },
  { id: "ORD002", symbol: "EURUSD", type: "SELL STOP", volume: 1.00, price: 1.09500, current: 1.08820, sl: 1.09800, tp: 1.08200, status: "pending", expire: "GTC", placed: "2025-03-28 10:30", account: "MT5-001" },
  { id: "ORD003", symbol: "BTCUSDT",type: "BUY STOP",  volume: 0.02, price: 69000,   current: 68250,   sl: 67000,   tp: 72000,   status: "triggered", expire: "Day", placed: "2025-03-27 14:00", account: "MT5-002" },
  { id: "ORD004", symbol: "GBPUSD", type: "SELL LIMIT",volume: 0.30, price: 1.27000, current: 1.26850, sl: 1.27500, tp: 1.25200, status: "cancelled", expire: "GTC", placed: "2025-03-27 09:15", account: "MT5-001" },
  { id: "ORD005", symbol: "USDJPY", type: "BUY LIMIT", volume: 0.50, price: 150.500, current: 151.820, sl: 149.500, tp: 153.500, status: "pending", expire: "GTC", placed: "2025-03-26 16:20", account: "MT5-002" },
];

const statusConfig: Record<string, { icon: any; label: string; className: string }> = {
  pending:   { icon: Clock,        label: "Pending",   className: "text-amber-700 bg-amber-50 border-amber-200" },
  triggered: { icon: Play,         label: "Triggered", className: "text-blue-700 bg-blue-50 border-blue-200" },
  filled:    { icon: CheckCircle2, label: "Filled",    className: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  cancelled: { icon: XCircle,      label: "Cancelled", className: "text-gray-700 bg-gray-100 border-gray-200" },
  expired:   { icon: AlertCircle,  label: "Expired",   className: "text-red-700 bg-red-50 border-red-200" },
};

export default function OrdersPage() {
  const [filter, setFilter] = useState<"all" | "pending" | "filled" | "cancelled">("all");

  const filtered = mockOrders.filter((o) => filter === "all" ? true : o.status === filter);

  return (
    <div className="space-y-6">
      <PageHeader title="Pending Orders" description="Manage your limit, stop and pending orders." />

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Orders", value: mockOrders.length, color: "blue" },
          { label: "Pending",      value: mockOrders.filter(o => o.status === "pending").length, color: "amber" },
          { label: "Triggered",    value: mockOrders.filter(o => o.status === "triggered").length, color: "indigo" },
          { label: "Cancelled",    value: mockOrders.filter(o => o.status === "cancelled").length, color: "gray" },
        ].map(({ label, value, color }) => (
          <div key={label} className={cn(
            "rounded-2xl bg-white border-2 p-4",
            color === "blue"    && "border-blue-200",
            color === "amber"   && "border-amber-200",
            color === "indigo"  && "border-indigo-200",
            color === "gray"    && "border-gray-200",
          )}>
            <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
            <p className={cn(
              "text-xl font-bold",
              color === "blue"    && "text-blue-700",
              color === "amber"   && "text-amber-700",
              color === "indigo"  && "text-indigo-700",
              color === "gray"    && "text-gray-700",
            )}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2">
        {(["all", "pending", "filled", "cancelled"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-4 py-1.5 rounded-xl text-sm font-semibold transition-all border-2",
              filter === f
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
            )}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <button className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 bg-white border-2 border-gray-200 px-3 py-1.5 rounded-xl hover:border-gray-300 transition-colors">
            <Filter size={12} /> Filter
          </button>
          <button className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 bg-white border-2 border-gray-200 px-3 py-1.5 rounded-xl hover:border-gray-300 transition-colors">
            <ChevronDown size={12} /> All Accounts
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white border-2 border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Symbol", "Type", "Volume", "Price", "Current", "SL / TP", "Status", "Placed", ""].map((h) => (
                  <th key={h} className="text-xs font-bold text-gray-400 px-4 py-3 text-left uppercase tracking-wide">
                    <span className="flex items-center gap-1">{h}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((order, i) => {
                const isBuy = order.type.includes("BUY");
                const status = statusConfig[order.status];
                const StatusIcon = status.icon;
                return (
                  <motion.tr
                    key={order.id}
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
                          {order.symbol.slice(0, 2)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{order.symbol}</p>
                          <p className="text-[10px] text-gray-400">{order.account}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={cn(
                        "text-xs font-bold px-2 py-1 rounded-lg border",
                        isBuy ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-red-50 text-red-700 border-red-200"
                      )}>
                        {order.type}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-sm font-mono font-semibold text-gray-800">{order.volume}</td>
                    <td className="px-4 py-3.5 text-sm font-mono font-bold text-gray-900">{order.price}</td>
                    <td className="px-4 py-3.5 text-sm font-mono text-gray-600">{order.current}</td>
                    <td className="px-4 py-3.5">
                      <div className="text-[11px] space-y-0.5">
                        <div className="flex items-center gap-1 text-red-600">
                          <span className="font-bold">SL</span>
                          <span className="font-mono">{order.sl}</span>
                        </div>
                        <div className="flex items-center gap-1 text-emerald-600">
                          <span className="font-bold">TP</span>
                          <span className="font-mono">{order.tp}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={cn(
                        "inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold border",
                        status.className
                      )}>
                        <StatusIcon size={11} />
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-gray-500">{order.placed}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1">
                        {order.status === "pending" && (
                          <>
                            <button className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-colors">
                              <Edit3 size={14} />
                            </button>
                            <button className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors">
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
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
