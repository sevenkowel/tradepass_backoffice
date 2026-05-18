"use client";

import { useState } from "react";
import { Clock, CheckCircle2, XCircle, Loader2, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/crm/ui";
import type { LoginHistory as LoginHistoryType } from "@/types/backoffice/profile";

interface LoginHistoryProps {
  history: LoginHistoryType[];
  isLoading?: boolean;
  maxDisplay?: number;
}

export function LoginHistory({ history, isLoading, maxDisplay = 5 }: LoginHistoryProps) {
  const [showAll, setShowAll] = useState(false);

  const displayHistory = showAll ? history : history.slice(0, maxDisplay);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusIcon = (status: LoginHistoryType["status"]) => {
    if (status === "success") {
      return <CheckCircle2 className="w-4 h-4 text-green-600" />;
    }
    return <XCircle className="w-4 h-4 text-red-600" />;
  };

  const getStatusText = (status: LoginHistoryType["status"], failReason?: string) => {
    if (status === "success") return "成功";
    return failReason || "失败";
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          登录历史
        </h3>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          登录历史
        </h3>
        {history.length > maxDisplay && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? "收起" : "查看全部"}
            <ChevronRight
              className={cn("w-4 h-4 ml-1 transition-transform", showAll && "rotate-90")}
            />
          </Button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-slate-400">
          <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>暂无登录记录</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayHistory.map((log) => (
            <div
              key={log.id}
              className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-900/50 rounded-lg"
            >
              {getStatusIcon(log.status)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatDate(log.createdAt)}
                  </span>
                  <span
                    className={cn(
                      "text-xs px-1.5 py-0.5 rounded",
                      log.status === "success"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    )}
                  >
                    {getStatusText(log.status, log.failReason)}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                  {log.ip} · {log.browser} · {log.os}
                </p>
                {log.location && (
                  <p className="text-xs text-gray-400 dark:text-slate-500">
                    {log.location}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
