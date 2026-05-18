"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  X,
  ExternalLink,
  ChevronRight,
} from "lucide-react";

// Types
type AlertLevel = "critical" | "warning" | "info" | "resolved";

interface RiskAlert {
  id: string;
  level: AlertLevel;
  title: string;
  description: string;
  user?: string;
  amount?: string;
  time: string;
  action?: string;
}

interface RiskAlertsProps {
  className?: string;
  alerts?: RiskAlert[];
}

// Mock data
const mockAlerts: RiskAlert[] = [
  {
    id: "ALT001",
    level: "critical",
    title: "账户余额为负",
    description: "用户账户余额低于零，触发负余额保护",
    user: "user_4827",
    amount: "-$2,847.50",
    time: "2分钟前",
    action: "待处理",
  },
  {
    id: "ALT002",
    level: "warning",
    title: "保证金不足预警",
    description: "账户保证金比例接近警戒线",
    user: "user_3156",
    amount: "$124.30",
    time: "5分钟前",
    action: "通知用户",
  },
  {
    id: "ALT003",
    level: "warning",
    title: "大额出金申请",
    description: "单笔出金超过 $50,000",
    user: "user_7291",
    amount: "$78,500.00",
    time: "8分钟前",
    action: "人工审核",
  },
  {
    id: "ALT004",
    level: "info",
    title: "异常登录告警",
    description: "检测到异常 IP 登录",
    user: "user_1847",
    time: "12分钟前",
    action: "已发送验证码",
  },
  {
    id: "ALT005",
    level: "resolved",
    title: "杠杆比例异常",
    description: "杠杆设置异常，已自动调整",
    user: "user_5293",
    time: "15分钟前",
    action: "已解决",
  },
  {
    id: "ALT006",
    level: "critical",
    title: "强制平仓预警",
    description: "账户即将触发强制平仓",
    user: "user_6284",
    amount: "$89.20",
    time: "1分钟前",
    action: "紧急通知",
  },
];

const levelConfig = {
  critical: {
    icon: AlertTriangle,
    color: "text-red-500",
    bgColor: "bg-red-50 dark:bg-red-950/20",
    borderColor: "border-red-200 dark:border-red-800",
    badge: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    pulse: true,
  },
  warning: {
    icon: AlertCircle,
    color: "text-amber-500",
    bgColor: "bg-amber-50 dark:bg-amber-950/20",
    borderColor: "border-amber-200 dark:border-amber-800",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    pulse: false,
  },
  info: {
    icon: Info,
    color: "text-blue-500",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
    borderColor: "border-blue-200 dark:border-blue-800",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    pulse: false,
  },
  resolved: {
    icon: CheckCircle2,
    color: "text-emerald-500",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/20",
    borderColor: "border-emerald-200 dark:border-emerald-800",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    pulse: false,
  },
};

export function RiskAlerts({ className = "", alerts = mockAlerts }: RiskAlertsProps) {
  const [filter, setFilter] = useState<AlertLevel | "all">("all");
  const [dismissed, setDismissed] = useState<string[]>([]);

  const filteredAlerts = alerts
    .filter((a) => filter === "all" || a.level === filter)
    .filter((a) => !dismissed.includes(a.id));

  const alertCounts = {
    critical: alerts.filter((a) => a.level === "critical").length,
    warning: alerts.filter((a) => a.level === "warning").length,
    info: alerts.filter((a) => a.level === "info").length,
    resolved: alerts.filter((a) => a.level === "resolved").length,
  };

  return (
    <div
      className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <h3 className="font-semibold text-slate-900 dark:text-white">
            风控预警
          </h3>
          {alertCounts.critical > 0 && (
            <span className="px-1.5 py-0.5 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded text-xs font-medium">
              {alertCounts.critical} 紧急
            </span>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1">
          {(["all", "critical", "warning", "info"] as const).map((level) => (
            <button
              key={level}
              onClick={() => setFilter(level)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                filter === level
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                  : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
              }`}
            >
              {level === "all" ? "全部" : level === "critical" ? "紧急" : level === "warning" ? "警告" : "通知"}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts List */}
      <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
        <AnimatePresence mode="popLayout">
          {filteredAlerts.map((alert, index) => {
            const config = levelConfig[alert.level];
            const Icon = config.icon;

            return (
              <motion.div
                key={alert.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className={`flex items-start gap-3 px-4 py-3 ${config.bgColor} hover:bg-opacity-60 transition-colors`}
              >
                {/* Icon */}
                <div className={`relative flex-shrink-0 ${config.color}`}>
                  <Icon className="w-5 h-5" />
                  {config.pulse && (
                    <span className="absolute -inset-1 bg-red-500 rounded-full animate-ping opacity-20" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-medium text-slate-900 dark:text-white">
                          {alert.title}
                        </h4>
                        <span
                          className={`px-1.5 py-0.5 ${config.badge} rounded text-xs`}
                        >
                          {alert.level === "critical"
                            ? "紧急"
                            : alert.level === "warning"
                            ? "警告"
                            : alert.level === "info"
                            ? "通知"
                            : "已解决"}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        {alert.description}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {alert.action && (
                        <span className="text-xs text-slate-400 dark:text-slate-500">
                          {alert.action}
                        </span>
                      )}
                      <button className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </button>
                      <button
                        onClick={() => setDismissed([...dismissed, alert.id])}
                        className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                      >
                        <X className="w-4 h-4 text-slate-400" />
                      </button>
                    </div>
                  </div>

                  {/* Meta */}
                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-500 dark:text-slate-400">
                    {alert.user && (
                      <span className="flex items-center gap-1">
                        <span className="font-mono">{alert.user}</span>
                        <ExternalLink className="w-3 h-3 opacity-50" />
                      </span>
                    )}
                    {alert.amount && (
                      <span
                        className={`font-mono font-medium ${
                          alert.amount.startsWith("-")
                            ? "text-red-600 dark:text-red-400"
                            : "text-emerald-600 dark:text-emerald-400"
                        }`}
                      >
                        {alert.amount}
                      </span>
                    )}
                    <span>{alert.time}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filteredAlerts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-slate-400">
            <CheckCircle2 className="w-8 h-8 mb-2 opacity-50" />
            <span>暂无预警</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700">
        <button className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
          查看全部预警记录 →
        </button>
      </div>
    </div>
  );
}
