"use client";

import { ShieldCheck, XCircle, RefreshCw, ArrowUpRight, AlertTriangle, CheckCircle } from "lucide-react";
import type { KYCDocument, KYCRiskIndicator, DocumentType } from "@/types/backoffice/client-detail";
import type { BaseTabProps } from "@/types/backoffice/client";
import { useT } from "@/lib/i18n/LocaleProvider";

export default function KYCTab({ data }: BaseTabProps) {
  const { t } = useT();
  const { kycDocuments, kycRiskIndicators } = data;

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-slate-900">{t("clients.detail.kyc.title")}</h3>

      {kycDocuments.map((doc) => (
        <DocumentCard key={doc.id} doc={doc} riskIndicators={kycRiskIndicators} />
      ))}
    </div>
  );
}

function DocumentCard({ doc, riskIndicators }: { doc: KYCDocument; riskIndicators: KYCRiskIndicator[] }) {
  const { t } = useT();

  const statusConfig: Record<
    string,
    { label: string; color: string; bg: string; icon: React.ElementType }
  > = {
    verified: { label: t("clients.detail.kyc.status.verified"), color: "text-emerald-700", bg: "bg-emerald-50", icon: CheckCircle },
    pending: { label: t("clients.detail.kyc.status.pending"), color: "text-amber-700", bg: "bg-amber-50", icon: ShieldCheck },
    rejected: { label: t("clients.detail.kyc.status.rejected"), color: "text-red-700", bg: "bg-red-50", icon: XCircle },
    not_submitted: { label: t("clients.detail.kyc.status.notSubmitted"), color: "text-slate-600", bg: "bg-slate-50", icon: ShieldCheck },
  };

  const config = statusConfig[doc.status] || statusConfig.not_submitted;
  const StatusIcon = config.icon;
  const docTypeLabel = (type: DocumentType) => t(`clients.detail.kyc.docType.${type}`);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="bg-slate-100 rounded-xl p-4 flex flex-col items-center justify-center min-h-[280px]">
          <div className="w-full h-48 bg-slate-200 rounded-lg flex items-center justify-center border-2 border-dashed border-slate-300">
            <div className="text-center">
              <ShieldCheck className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <span className="text-sm text-slate-500">{t("clients.detail.kyc.docPlaceholder")}</span>
              <p className="text-xs text-slate-400 mt-1">{docTypeLabel(doc.type)}</p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <StatusIcon className={`w-4 h-4 ${config.color}`} />
            <span className={`text-sm font-medium ${config.color}`}>{config.label}</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h4 className="text-sm font-semibold text-slate-700 mb-3">{t("clients.detail.kyc.ocrResult")}</h4>
          <div className="space-y-3">
            <OcrField label={t("clients.detail.kyc.fullName")} value={doc.ocrResult?.extractedName || doc.fullName} confidence={doc.ocrResult?.confidence} />
            <OcrField label={t("clients.detail.kyc.documentNumber")} value={doc.ocrResult?.extractedNumber || doc.documentNumber} />
            <OcrField label={t("clients.detail.kyc.nationality")} value={doc.ocrResult?.extractedNationality || doc.nationality} />
            <OcrField label={t("clients.detail.kyc.dateOfBirth")} value={doc.ocrResult?.extractedDateOfBirth || doc.dateOfBirth} />
            <OcrField label={t("clients.detail.kyc.expiryDate")} value={doc.ocrResult?.extractedExpiryDate || doc.expiryDate} />
          </div>

          {doc.ocrResult && doc.ocrResult.mismatches.length > 0 && (
            <div className="mt-3 p-2 bg-red-50 rounded-lg">
              <div className="flex items-center gap-1 text-red-600 text-xs">
                <AlertTriangle className="w-3 h-3" />
                <span>{t("clients.detail.kyc.mismatch", { n: String(doc.ocrResult.mismatches.length) })}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {riskIndicators.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h4 className="text-sm font-semibold text-slate-700 mb-3">{t("clients.detail.kyc.riskIndicators")}</h4>
          <div className="space-y-2">
            {riskIndicators.map((indicator, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <AlertTriangle
                  className={`w-4 h-4 ${
                    indicator.level === "high"
                      ? "text-red-500"
                      : indicator.level === "medium"
                        ? "text-amber-500"
                        : "text-emerald-500"
                  }`}
                />
                <span className="text-slate-700">{indicator.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {doc.status === "pending" && (
        <div className="flex items-center gap-3 flex-wrap">
          <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors">
            <CheckCircle className="w-4 h-4" />
            {t("clients.detail.kyc.action.approveLong")}
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors">
            <XCircle className="w-4 h-4" />
            {t("clients.detail.kyc.action.rejectLong")}
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors">
            <RefreshCw className="w-4 h-4" />
            {t("clients.detail.kyc.action.requestResubmitLong")}
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-600 text-white rounded-lg text-sm font-medium hover:bg-slate-700 transition-colors">
            <ArrowUpRight className="w-4 h-4" />
            {t("clients.detail.kyc.action.escalateLong")}
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
          <span
            className={`text-xs px-1.5 py-0.5 rounded ${
              confidence >= 0.9
                ? "bg-emerald-100 text-emerald-700"
                : confidence >= 0.7
                  ? "bg-amber-100 text-amber-700"
                  : "bg-red-100 text-red-700"
            }`}
          >
            {(confidence * 100).toFixed(0)}%
          </span>
        )}
      </div>
    </div>
  );
}
