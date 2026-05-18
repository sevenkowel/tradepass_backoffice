"use client";

/**
 * AgreementsTab — 客户协议文档（2026-05-17 与 CLM 风格对齐）.
 *
 * 视觉与 `@/components/crm/clm/AgreementSection` 保持一致：
 *   - 卡片紧凑、左侧图标 + 名称 / 状态 chip / 元信息（版本 / 语言 / 签署方式）
 *   - 右侧时间 + IP + 「预览」按钮（点击弹出 PDF Dialog）
 *   - `forceResign` 时显示 amber 警告条
 *
 * 与 CLM 的差异：
 *   - 这里是 CRM 客户详情视图，多了「强制重签」操作按钮
 *   - 卡片顶部 stats：已签署 / 待签署 / 已过期 / 需重签
 */

import { useMemo, useState } from "react";
import {
  FileText, Globe, Monitor, AlertTriangle, Eye, RefreshCw,
  CheckCircle, Clock, XCircle,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import type { ClientAgreement } from "@/types/backoffice/client-detail";
import type { BaseTabProps } from "@/types/backoffice/client";
import { useT } from "@/lib/i18n/LocaleProvider";

export default function AgreementsTab({ data }: BaseTabProps) {
  const { t, locale } = useT();
  const { agreements } = data;
  const dateLocale =
    locale === "zh" ? "zh-CN" : locale === "ja" ? "ja-JP" : locale === "es" ? "es-ES" : "en-US";

  const [preview, setPreview] = useState<ClientAgreement | null>(null);

  const stats = useMemo(() => {
    const s = { signed: 0, pending: 0, expired: 0, forceResign: 0 };
    for (const a of agreements) {
      s[a.status] += 1;
      if (a.forceResign) s.forceResign += 1;
    }
    return s;
  }, [agreements]);

  return (
    <div className="space-y-4">
      {/* 顶部：标题 + stats */}
      <div className="flex items-baseline justify-between gap-4 flex-wrap">
        <div>
          <h3 className="text-base font-semibold text-slate-900">
            {t("clients.detail.agreements.title")}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            共 {agreements.length} 份协议
            {stats.forceResign > 0 && (
              <span className="text-amber-700 ml-1.5">· {stats.forceResign} 份需重新签署</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-5 text-xs">
          <Stat label="已签署" value={stats.signed} tone="ok" />
          {stats.pending > 0 && <Stat label="待签署" value={stats.pending} tone="warn" />}
          {stats.expired > 0 && <Stat label="已过期" value={stats.expired} tone="danger" />}
        </div>
      </div>

      {/* 协议卡片 */}
      {agreements.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white py-16 text-center text-sm text-slate-400">
          {t("clients.detail.agreements.empty")}
        </div>
      ) : (
        <ul className="space-y-2">
          {agreements.map((agr) => (
            <AgreementCard
              key={agr.id}
              agr={agr}
              dateLocale={dateLocale}
              onPreview={() => setPreview(agr)}
            />
          ))}
        </ul>
      )}

      {/* PDF 预览 Dialog（与 CLM AgreementSection 一致） */}
      <Dialog open={!!preview} onOpenChange={(open) => { if (!open) setPreview(null); }}>
        <DialogContent className="max-w-3xl w-full h-[80vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-5 py-4 border-b border-slate-200 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-base font-semibold text-slate-900">
                  {preview?.name}
                </DialogTitle>
                <p className="text-xs text-slate-500 mt-0.5 font-mono">
                  {preview?.version} · {preview?.language} ·
                  签署于 {preview ? new Date(preview.signedAt).toLocaleString(dateLocale) : ""}
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
    </div>
  );
}

function AgreementCard({
  agr, dateLocale, onPreview,
}: {
  agr: ClientAgreement;
  dateLocale: string;
  onPreview: () => void;
}) {
  return (
    <li className="bg-white rounded-xl border border-slate-200 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-semibold text-slate-900 truncate">{agr.name}</h4>
              <StatusChip status={agr.status} />
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 flex-wrap">
              <span className="font-mono text-blue-600">{agr.version}</span>
              <span className="flex items-center gap-1">
                <Globe className="w-3 h-3" />{agr.language}
              </span>
              <span className="flex items-center gap-1">
                <Monitor className="w-3 h-3" />
                {agr.signatureType === "handwritten" ? "手写电子签" : "文字签"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <p className="text-[11px] text-slate-400 whitespace-nowrap tabular-nums">
            {new Date(agr.signedAt).toLocaleString(dateLocale, {
              year: "numeric", month: "2-digit", day: "2-digit",
              hour: "2-digit", minute: "2-digit",
            })}
          </p>
          <p className="text-[11px] text-slate-400 font-mono tabular-nums">IP: {agr.signedIp}</p>
          <div className="flex items-center gap-1">
            {agr.pdfUrl && (
              <button
                onClick={onPreview}
                className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium text-blue-600 hover:bg-blue-50 transition-colors"
              >
                <Eye className="w-3 h-3" />
                预览
              </button>
            )}
            <button
              className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium text-amber-600 hover:bg-amber-50 transition-colors"
              title="要求客户重新签署"
            >
              <RefreshCw className="w-3 h-3" />
              重签
            </button>
          </div>
        </div>
      </div>

      {/* 强制重签警告 */}
      {agr.forceResign && (
        <div className="mt-2.5 flex items-center gap-2 p-2 bg-amber-50 rounded-lg border border-amber-200">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
          <span className="text-xs text-amber-700">
            协议已更新，客户需重新签署。
          </span>
        </div>
      )}
    </li>
  );
}

function StatusChip({ status }: { status: ClientAgreement["status"] }) {
  const cfg: Record<ClientAgreement["status"], { tone: string; Icon: typeof Clock; label: string }> = {
    signed:  { tone: "bg-emerald-100 text-emerald-700", Icon: CheckCircle, label: "已签署" },
    pending: { tone: "bg-amber-100 text-amber-700",     Icon: Clock,       label: "待签署" },
    expired: { tone: "bg-red-100 text-red-700",         Icon: XCircle,     label: "已过期" },
  };
  const c = cfg[status];
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0 ${c.tone}`}>
      <c.Icon className="w-2.5 h-2.5" />
      {c.label}
    </span>
  );
}

function Stat({ label, value, tone }: {
  label: string;
  value: number;
  tone: "ok" | "warn" | "danger";
}) {
  const cls = tone === "ok" ? "text-emerald-700"
    : tone === "warn" ? "text-amber-700"
    : "text-red-700";
  return (
    <div className="text-center">
      <div className={`text-lg font-bold tabular-nums ${cls}`}>{value}</div>
      <div className="text-[10.5px] text-slate-500 uppercase tracking-wider mt-0.5">{label}</div>
    </div>
  );
}
