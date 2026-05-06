"use client";

import { motion } from "framer-motion";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowLeftRight,
  BarChart3,
  Users,
  History,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface QuickAction {
  id: string;
  icon: React.ElementType;
  label: string;
  href: string;
  color: string;
  bgColor: string;
}

const quickActions: QuickAction[] = [
  {
    id: "deposit",
    icon: ArrowDownToLine,
    label: "入金",
    href: "/portal/fund/deposit",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  {
    id: "withdraw",
    icon: ArrowUpFromLine,
    label: "出金",
    href: "/portal/wallet/withdraw",
    color: "text-purple-600",
    bgColor: "bg-purple-50",
  },
  {
    id: "transfer",
    icon: ArrowLeftRight,
    label: "划转",
    href: "/portal/wallet/transfer",
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
  },
  {
    id: "trade",
    icon: BarChart3,
    label: "交易",
    href: "/portal/accounts/accounts",
    color: "text-amber-600",
    bgColor: "bg-amber-50",
  },
  {
    id: "copy",
    icon: Users,
    label: "跟单",
    href: "/portal/copy-trading/discover",
    color: "text-pink-600",
    bgColor: "bg-pink-50",
  },
  {
    id: "history",
    icon: History,
    label: "记录",
    href: "/portal/wallet/transactions",
    color: "text-gray-600",
    bgColor: "bg-gray-50",
  },
];

export function QuickActionsGrid() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.35 }}
      className="bg-white rounded-2xl border-2 border-gray-200 p-5"
    >
      <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-4">
        <span className="text-lg">⚡</span>
        快速操作
      </h2>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link key={action.id} href={action.href}>
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gray-50 hover:bg-white border-2 border-transparent hover:border-gray-200 transition-all cursor-pointer group"
              >
                <div
                  className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                    action.bgColor,
                    "group-hover:scale-110"
                  )}
                >
                  <Icon size={22} className={action.color} />
                </div>
                <span className="text-xs font-semibold text-gray-700">
                  {action.label}
                </span>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </motion.div>
  );
}
