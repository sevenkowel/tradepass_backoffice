"use client";

import { cn } from "@/lib/utils";
import { FileText, Globe, Monitor, Download, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import type { AgreementRecord } from "@/types/clm";

interface AgreementSectionProps {
  data: AgreementRecord[];
  className?: string;
}

export function AgreementSection({ data, className }: AgreementSectionProps) {
  if (data.length === 0) return null;

  return (
    <div className={cn("space-y-4", className)}>
      <div className="space-y-2">
        {data.map((agr) => (
          <div key={agr.id} className="bg-gray-50 rounded-xl border border-gray-100 p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-gray-900">{agr.name}</h4>
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                      agr.status === "signed" ? "bg-emerald-100 text-emerald-700" :
                      agr.status === "expired" ? "bg-red-100 text-red-700" :
                      "bg-amber-100 text-amber-700"
                    }`}>
                      {agr.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    <span className="font-mono text-blue-600">{agr.version}</span>
                    <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> {agr.language}</span>
                    <span className="flex items-center gap-1"><Monitor className="w-3 h-3" /> {agr.signatureType}</span>
                  </div>
                </div>
              </div>
              <div className="text-right text-xs text-gray-400">
                <p>{new Date(agr.signedAt).toLocaleString()}</p>
                <p className="mt-0.5">IP: {agr.ipAddress}</p>
              </div>
            </div>

            {agr.forceResign && (
              <div className="mt-3 flex items-center gap-2 p-2 bg-amber-50 rounded-lg border border-amber-200">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span className="text-xs text-amber-700">
                  Agreement updated — user must re-sign. New approval workflow triggered.
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
