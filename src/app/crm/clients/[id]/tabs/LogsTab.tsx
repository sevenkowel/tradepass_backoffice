"use client";

import { ClipboardList, ArrowRight } from "lucide-react";
import type { ClientDetailData } from "@/types/backoffice/client-detail";

interface Props {
  data: ClientDetailData;
}

export default function LogsTab({ data }: Props) {
  const { auditLogs } = data;

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-slate-900">审计日志</h3>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-slate-500">
              <th className="px-4 py-3 text-left font-medium">时间</th>
              <th className="px-4 py-3 text-left font-medium">操作人</th>
              <th className="px-4 py-3 text-left font-medium">操作</th>
              <th className="px-4 py-3 text-left font-medium">字段</th>
              <th className="px-4 py-3 text-left font-medium">旧值</th>
              <th className="px-4 py-3 text-left font-medium">新值</th>
              <th className="px-4 py-3 text-left font-medium">IP</th>
            </tr>
          </thead>
          <tbody>
            {auditLogs.map((log) => (
              <tr key={log.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{new Date(log.timestamp).toLocaleString("zh-CN")}</td>
                <td className="px-4 py-3 font-medium text-slate-900">{log.operator}</td>
                <td className="px-4 py-3 text-slate-700">{log.action}</td>
                <td className="px-4 py-3 text-slate-600">{log.targetField}</td>
                <td className="px-4 py-3 text-slate-500 max-w-[120px] truncate">{log.oldValue || "—"}</td>
                <td className="px-4 py-3 text-slate-700 max-w-[120px] truncate">
                  <div className="flex items-center gap-1">
                    <ArrowRight className="w-3 h-3 text-blue-500 flex-shrink-0" />
                    <span className="truncate">{log.newValue || "—"}</span>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-slate-500">{log.ipAddress}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {auditLogs.length === 0 && (
        <div className="text-center py-10 text-slate-400 text-sm">暂无审计日志</div>
      )}
    </div>
  );
}
