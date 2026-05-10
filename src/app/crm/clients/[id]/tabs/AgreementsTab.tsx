"use client";

import { FileText, Eye, Download, RefreshCw, CheckCircle, Clock } from "lucide-react";
import type { BaseTabProps } from "@/types/backoffice/client";


export default function AgreementsTab({ data }: BaseTabProps) {
  const { agreements } = data;

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-slate-900">协议管理</h3>

      <div className="space-y-3">
        {agreements.map((agr) => (
          <div key={agr.id} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">{agr.agreementType}</span>
                    <AgreementStatusBadge status={agr.status} />
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    版本 {agr.version} · 签署于 {new Date(agr.signedAt).toLocaleString("zh-CN")} · IP: {agr.signedIp}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-200 transition-colors">
                  <Eye className="w-3.5 h-3.5" />
                  查看
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-200 transition-colors">
                  <Download className="w-3.5 h-3.5" />
                  下载 PDF
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-medium hover:bg-red-200 transition-colors">
                  <RefreshCw className="w-3.5 h-3.5" />
                  强制重签
                </button>
              </div>
            </div>
          </div>
        ))}

        {agreements.length === 0 && (
          <div className="text-center py-10 text-slate-400 text-sm">暂无协议记录</div>
        )}
      </div>
    </div>
  );
}

function AgreementStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; color: string; bg: string }> = {
    signed: { label: "已签署", color: "text-emerald-700", bg: "bg-emerald-100" },
    pending: { label: "待签署", color: "text-amber-700", bg: "bg-amber-100" },
    expired: { label: "已过期", color: "text-red-700", bg: "bg-red-100" },
  };

  const c = config[status] || config.pending;
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${c.bg} ${c.color}`}>
    {status === "signed" ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
    {c.label}
  </span>;
}
