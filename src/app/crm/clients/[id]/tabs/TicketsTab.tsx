"use client";

import { useState } from "react";
import { Ticket, MessageSquare, Send, User, Headphones } from "lucide-react";
import type { Ticket as TicketType } from "@/types/backoffice/client-detail";
import type { BaseTabProps } from "@/types/backoffice/client";
import { useT } from "@/lib/i18n/LocaleProvider";

export default function TicketsTab({ data }: BaseTabProps) {
  const { t } = useT();
  const { tickets } = data;
  const [selectedTicket, setSelectedTicket] = useState<TicketType | null>(tickets[0] ?? null);

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-slate-900">{t("clients.detail.tickets.title")}</h3>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Ticket list */}
        <div className="lg:col-span-1 space-y-2">
          {tickets.map((tk) => (
            <button
              key={tk.id}
              onClick={() => setSelectedTicket(tk)}
              className={`w-full text-left p-3 rounded-xl border transition-colors ${
                selectedTicket?.id === tk.id
                  ? "border-blue-300 bg-blue-50"
                  : "border-slate-200 bg-white hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Ticket className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-medium text-slate-900">{tk.ticketId}</span>
                <TicketStatusBadge status={tk.status} />
              </div>
              <p className="text-xs text-slate-600 line-clamp-1">{tk.subject}</p>
              <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                <span>{new Date(tk.createdAt).toLocaleDateString()}</span>
                <PriorityLabel priority={tk.priority} />
              </div>
            </button>
          ))}
          {tickets.length === 0 && (
            <div className="text-center py-6 text-slate-400 text-sm">{t("clients.detail.tickets.empty")}</div>
          )}
        </div>

        {/* Ticket detail + messages */}
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
                  <span>{t(`clients.detail.tickets.type.${selectedTicket.type}`) ?? selectedTicket.type}</span>
                  <span>
                    {t("clients.detail.tickets.assignedTo")}: {selectedTicket.assignedTo || t("clients.detail.tickets.unassigned")}
                  </span>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {selectedTicket.messages.map((msg) => (
                  <div key={msg.id} className={`flex gap-3 ${msg.isStaff ? "flex-row" : "flex-row-reverse"}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      msg.isStaff ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-600"
                    }`}>
                      {msg.isStaff ? <Headphones className="w-4 h-4" /> : <User className="w-4 h-4" />}
                    </div>
                    <div className={`max-w-[80%] rounded-xl p-3 text-sm ${
                      msg.isStaff ? "bg-blue-50 text-slate-800" : "bg-slate-100 text-slate-800"
                    }`}>
                      <p>{msg.content}</p>
                      <span className="text-xs text-slate-400 mt-1 block">
                        {new Date(msg.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Reply */}
              <div className="px-4 py-3 border-t border-slate-200">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder={t("clients.detail.tickets.replyPlaceholder")}
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
              <p className="text-slate-400 text-sm">{t("clients.detail.tickets.selectHint")}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TicketStatusBadge({ status }: { status: string }) {
  const { t } = useT();
  const config: Record<string, { color: string; bg: string }> = {
    open:             { color: "text-amber-700",   bg: "bg-amber-100" },
    in_progress:      { color: "text-blue-700",    bg: "bg-blue-100" },
    waiting_customer: { color: "text-violet-700",  bg: "bg-violet-100" },
    resolved:         { color: "text-emerald-700", bg: "bg-emerald-100" },
    closed:           { color: "text-slate-600",   bg: "bg-slate-100" },
  };
  const c = config[status] ?? config.open;
  return (
    <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${c.bg} ${c.color}`}>
      {t(`clients.detail.tickets.status.${status}`) ?? status}
    </span>
  );
}

function PriorityLabel({ priority }: { priority: string }) {
  const { t } = useT();
  const colors: Record<string, string> = {
    low:    "text-slate-500",
    medium: "text-blue-600",
    high:   "text-amber-600",
    urgent: "text-red-600",
  };
  return (
    <span className={`text-xs ${colors[priority] ?? colors.low}`}>
      {t(`clients.detail.tickets.priority.${priority}`) ?? priority}
    </span>
  );
}
