"use client";

import { useState } from "react";
import { Ticket, MessageSquare, Send, User, Headphones } from "lucide-react";
import type { ClientDetailData, Ticket as TicketType } from "@/types/backoffice/client-detail";
import type { BaseTabProps } from "@/types/backoffice/client";


export default function TicketsTab({ data }: BaseTabProps) {
  const { tickets } = data;
  const [selectedTicket, setSelectedTicket] = useState<TicketType | null>(tickets[0] || null);

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-slate-900">客服工单</h3>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* 工单列表 */}
        <div className="lg:col-span-1 space-y-2">
          {tickets.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedTicket(t)}
              className={`w-full text-left p-3 rounded-xl border transition-colors ${
                selectedTicket?.id === t.id ? "border-blue-300 bg-blue-50" : "border-slate-200 bg-white hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Ticket className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-medium text-slate-900">{t.ticketId}</span>
                <TicketStatusBadge status={t.status} />
              </div>
              <p className="text-xs text-slate-600 line-clamp-1">{t.subject}</p>
              <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                <span>{new Date(t.createdAt).toLocaleDateString("zh-CN")}</span>
                <PriorityBadge priority={t.priority} />
              </div>
            </button>
          ))}
          {tickets.length === 0 && (
            <div className="text-center py-6 text-slate-400 text-sm">暂无工单</div>
          )}
        </div>

        {/* 工单详情与对话 */}
        <div className="lg:col-span-2">
          {selectedTicket ? (
            <div className="bg-white rounded-xl border border-slate-200 flex flex-col h-[480px]">
              {/* Header */}
              <div className="px-4 py-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <Ticket className="w-4 h-4 text-blue-600" />
                  <span className="font-semibold text-slate-900">{selectedTicket.subject}</span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                  <span>类型: {typeLabel(selectedTicket.type)}</span>
                  <span>指派: {selectedTicket.assignedTo || "未指派"}</span>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {selectedTicket.messages.map((msg) => (
                  <div key={msg.id} className={`flex gap-3 ${msg.isStaff ? "flex-row" : "flex-row-reverse"}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.isStaff ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-600"}`}>
                      {msg.isStaff ? <Headphones className="w-4 h-4" /> : <User className="w-4 h-4" />}
                    </div>
                    <div className={`max-w-[80%] rounded-xl p-3 text-sm ${msg.isStaff ? "bg-blue-50 text-slate-800" : "bg-slate-100 text-slate-800"}`}>
                      <p>{msg.content}</p>
                      <span className="text-xs text-slate-400 mt-1 block">{new Date(msg.createdAt).toLocaleString("zh-CN")}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Reply */}
              <div className="px-4 py-3 border-t border-slate-200">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="回复工单..."
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 flex items-center justify-center h-[480px]">
              <p className="text-slate-400 text-sm">选择工单查看详情</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TicketStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; color: string; bg: string }> = {
    open: { label: "待处理", color: "text-amber-700", bg: "bg-amber-100" },
    in_progress: { label: "处理中", color: "text-blue-700", bg: "bg-blue-100" },
    waiting_customer: { label: "待回复", color: "text-violet-700", bg: "bg-violet-100" },
    resolved: { label: "已解决", color: "text-emerald-700", bg: "bg-emerald-100" },
    closed: { label: "已关闭", color: "text-slate-600", bg: "bg-slate-100" },
  };

  const c = config[status] || config.open;
  return <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${c.bg} ${c.color}`}>{c.label}</span>;
}

function PriorityBadge({ priority }: { priority: string }) {
  const config: Record<string, string> = {
    low: "text-slate-500",
    medium: "text-blue-600",
    high: "text-amber-600",
    urgent: "text-red-600",
  };
  return <span className={`text-xs ${config[priority] || config.low}`}>{priority === "urgent" ? "紧急" : priority === "high" ? "高" : priority === "medium" ? "中" : "低"}</span>;
}

function typeLabel(type: string): string {
  const labels: Record<string, string> = {
    financial: "财务问题",
    kyc: "KYC 问题",
    withdrawal: "出金问题",
    complaint: "投诉",
    risk_appeal: "风控申诉",
    technical: "技术问题",
  };
  return labels[type] || type;
}
