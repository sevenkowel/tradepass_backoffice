"use client";

import { ShieldCheck, XCircle, RefreshCw, ArrowUpRight, AlertTriangle, CheckCircle } from "lucide-react";
import type { ClientDetailData, KYCDocument, KYCRiskIndicator } from "@/types/backoffice/client-detail";

interface Props {
  data: ClientDetailData;
}

export default function KYCTab({ data }: Props) {
  const { kycDocuments, kycRiskIndicators } = data;

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-slate-900">KYC 身份验证</h3>

      {kycDocuments.map((doc) => (
        <DocumentCard key={doc.id} doc={doc} riskIndicators={kycRiskIndicators} />
      ))}
    </div>
  );
}

function DocumentCard({ doc, riskIndicators }: { doc: KYCDocument; riskIndicators: KYCRiskIndicator[] }) {
  const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
    verified: { label: "已验证", color: "text-emerald-700", bg: "bg-emerald-50", icon: CheckCircle },
    pending: { label: "待审核", color: "text-amber-700", bg: "bg-amber-50", icon: ShieldCheck },
    rejected: { label: "已拒绝", color: "text-red-700", bg: "bg-red-50", icon: XCircle },
    not_submitted: { label: "未提交", color: "text-slate-600", bg: "bg-slate-50", icon: ShieldCheck },
  };

  const config = statusConfig[doc.status] || statusConfig.not_submitted;
  const StatusIcon = config.icon;

  return (
    <div className="space-y-4">
      {/* 文档信息与 OCR 对比 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 左侧：文档图片占位 */}
        <div className="bg-slate-100 rounded-xl p-4 flex flex-col items-center justify-center min-h-[280px]">
          <div className="w-full h-48 bg-slate-200 rounded-lg flex items-center justify-center border-2 border-dashed border-slate-300">
            <div className="text-center">
              <ShieldCheck className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <span className="text-sm text-slate-500">KYC 证件图片占位</span>
              <p className="text-xs text-slate-400 mt-1">{doc.type === "id_card" ? "身份证" : doc.type === "passport" ? "护照" : "驾驶证"}</p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <StatusIcon className={`w-4 h-4 ${config.color}`} />
            <span className={`text-sm font-medium ${config.color}`}>{config.label}</span>
          </div>
        </div>

        {/* 右侧：OCR 提取结果 */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h4 className="text-sm font-semibold text-slate-700 mb-3">OCR 提取结果</h4>
          <div className="space-y-3">
            <OcrField label="姓名" value={doc.ocrResult?.extractedName || doc.fullName} confidence={doc.ocrResult?.confidence} />
            <OcrField label="证件号码" value={doc.ocrResult?.extractedNumber || doc.documentNumber} />
            <OcrField label="国籍" value={doc.ocrResult?.extractedNationality || doc.nationality} />
            <OcrField label="出生日期" value={doc.ocrResult?.extractedDateOfBirth || doc.dateOfBirth} />
            <OcrField label="有效期至" value={doc.ocrResult?.extractedExpiryDate || doc.expiryDate} />
          </div>

          {doc.ocrResult && doc.ocrResult.mismatches.length > 0 && (
            <div className="mt-3 p-2 bg-red-50 rounded-lg">
              <div className="flex items-center gap-1 text-red-600 text-xs">
                <AlertTriangle className="w-3 h-3" />
                <span>检测到 {doc.ocrResult.mismatches.length} 处不一致</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 风险指标 */}
      {riskIndicators.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h4 className="text-sm font-semibold text-slate-700 mb-3">风险指标</h4>
          <div className="space-y-2">
            {riskIndicators.map((indicator, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <AlertTriangle className={`w-4 h-4 ${indicator.level === "high" ? "text-red-500" : indicator.level === "medium" ? "text-amber-500" : "text-emerald-500"}`} />
                <span className="text-slate-700">{indicator.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 审核操作 */}
      {doc.status === "pending" && (
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors">
            <CheckCircle className="w-4 h-4" />
            通过验证
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors">
            <XCircle className="w-4 h-4" />
            拒绝验证
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors">
            <RefreshCw className="w-4 h-4" />
            要求重新提交
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-600 text-white rounded-lg text-sm font-medium hover:bg-slate-700 transition-colors">
            <ArrowUpRight className="w-4 h-4" />
            升级审核
          </button>
        </div>
      )}
    </div>
  );
}

function OcrField({ label, value, confidence }: { label: string; value: string; confidence?: number }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
      <span className="text-xs text-slate-500">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-slate-900">{value}</span>
        {confidence !== undefined && (
          <span className={`text-xs px-1.5 py-0.5 rounded ${confidence >= 0.9 ? "bg-emerald-100 text-emerald-700" : confidence >= 0.7 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
            {(confidence * 100).toFixed(0)}%
          </span>
        )}
      </div>
    </div>
  );
}
