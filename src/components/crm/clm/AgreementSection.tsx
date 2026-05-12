"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { FileText, Globe, Monitor, AlertTriangle, Eye, X } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import type { AgreementRecord } from "@/types/clm";

interface AgreementSectionProps {
  data: AgreementRecord[];
  className?: string;
}

export function AgreementSection({ data, className }: AgreementSectionProps) {
  const [preview, setPreview] = useState<AgreementRecord | null>(null);

  if (data.length === 0) return null;

  return (
    <>
      <div className={cn("space-y-2", className)}>
        {data.map((agr) => (
          <div key={agr.id} className="bg-slate-50 rounded-xl border border-slate-100 p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-semibold text-slate-900 truncate">{agr.name}</h4>
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0 ${
                      agr.status === "signed"  ? "bg-emerald-100 text-emerald-700" :
                      agr.status === "expired" ? "bg-red-100 text-red-700" :
                      "bg-amber-100 text-amber-700"
                    }`}>
                      {agr.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 flex-wrap">
                    <span className="font-mono text-blue-600">{agr.version}</span>
                    <span className="flex items-center gap-1"><Globe className="w-3 h-3" />{agr.language}</span>
                    <span className="flex items-center gap-1"><Monitor className="w-3 h-3" />{agr.signatureType}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                <p className="text-[11px] text-slate-400 whitespace-nowrap">
                  {new Date(agr.signedAt).toLocaleString()}
                </p>
                <p className="text-[11px] text-slate-400">IP: {agr.ipAddress}</p>
                {agr.pdfUrl && (
                  <button
                    onClick={() => setPreview(agr)}
                    className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium text-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    <Eye className="w-3 h-3" />
                    预览
                  </button>
                )}
              </div>
            </div>

            {agr.forceResign && (
              <div className="mt-2.5 flex items-center gap-2 p-2 bg-amber-50 rounded-lg border border-amber-200">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                <span className="text-xs text-amber-700">
                  协议已更新，用户需重新签署。
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Preview Dialog */}
      <Dialog open={!!preview} onOpenChange={(open) => { if (!open) setPreview(null); }}>
        <DialogContent className="max-w-3xl w-full h-[80vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-5 py-4 border-b border-slate-200 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-base font-semibold text-slate-900">
                  {preview?.name}
                </DialogTitle>
                <p className="text-xs text-slate-500 mt-0.5 font-mono">
                  {preview?.version} · {preview?.language} · 签署于 {preview ? new Date(preview.signedAt).toLocaleString() : ""}
                </p>
              </div>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-hidden bg-slate-100">
            {preview?.pdfUrl ? (
              <iframe
                src={preview.pdfUrl}
                className="w-full h-full border-0"
                title={preview.name}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400">
                <div className="text-center">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">暂无可预览的文件</p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
