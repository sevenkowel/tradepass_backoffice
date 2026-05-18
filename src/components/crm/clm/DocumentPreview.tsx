"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ZoomIn, X, FileImage, RotateCw, Download, CheckCircle, AlertCircle, Eye } from "lucide-react";
import type { SubmittedMaterial, OCRResult } from "@/types/clm";

interface DocumentPreviewProps {
  material: SubmittedMaterial;
  className?: string;
  /** When provided, replaces the single-column OCR table with a 3-column OCR vs user comparison. */
  showUserComparison?: boolean;
}

export function DocumentPreview({ material, className, showUserComparison = false }: DocumentPreviewProps) {
  const [enlarged, setEnlarged] = useState(false);
  const [rotated, setRotated] = useState(0);
  // The mock thumbnail URLs (e.g. `/mock/id-front.jpg`) don't resolve; we
  // also defensively flip to the placeholder when a real URL fails to load
  // so the page doesn't show a broken-image icon.
  const [imageBroken, setImageBroken] = useState(false);
  const ocr = material.ocrResult;
  const hasImage = !!material.thumbnailUrl && !imageBroken;

  return (
    <>
      <div className={cn("space-y-3", className)}>
        {/* Header used to render its own `material.label` + status pill,
            but the parent page (Case Detail) already owns the title and
            shows a richer VerificationChip — duplicating both made each
            card show "Passport (Identity)" twice. The component is now
            preview-body only; if a future caller needs the title here,
            wrap with a small header outside. */}

        {/* Document Image Preview */}
        {hasImage ? (
          <div
            className="relative bg-slate-100 rounded-xl border border-slate-200 overflow-hidden group cursor-pointer"
            onClick={() => setEnlarged(true)}
          >
            {/* Watermarked Image */}
            <div className="relative w-full aspect-[3/2] max-h-80">
              <img
                src={material.thumbnailUrl}
                alt={material.label}
                className="w-full h-full object-contain"
                draggable={false}
                onError={() => setImageBroken(true)}
              />
              {/* Watermark Overlay */}
              <Watermark />
            </div>

            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
              <span className="flex items-center gap-2 px-4 py-2 bg-white/90 shadow-lg rounded-xl text-xs font-medium text-slate-700 backdrop-blur-sm">
                <Eye className="w-4 h-4" /> View Document
              </span>
            </div>

            {/* Top-right actions */}
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                className="p-1.5 bg-white/90 shadow-sm rounded-lg text-slate-500 hover:text-slate-800 backdrop-blur-sm"
                title="Rotate"
                onClick={(e) => { e.stopPropagation(); setRotated((r) => (r + 90) % 360); }}
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
              <button
                className="p-1.5 bg-white/90 shadow-sm rounded-lg text-slate-500 hover:text-slate-800 backdrop-blur-sm"
                title="Download"
                onClick={(e) => e.stopPropagation()}
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="relative bg-slate-50 rounded-xl border border-dashed border-slate-200 overflow-hidden">
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
                <FileImage className="w-8 h-8 text-slate-300" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-slate-500">
                  {imageBroken ? "Preview failed to load" : "Document preview not available"}
                </p>
                <p className="text-xs text-slate-400 mt-1">Original file stored securely</p>
              </div>
            </div>
            <Watermark />
          </div>
        )}

        {/* OCR / comparison table */}
        {ocr && (
          showUserComparison && material.userSubmittedFields
            ? <OcrCompareTable ocr={ocr} userFields={material.userSubmittedFields} />
            : <OcrTable ocr={ocr} />
        )}

        {/* Mismatch warning */}
        {ocr && ocr.mismatches.length > 0 && (
          <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg border border-red-100">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-xs text-red-700 font-medium">
              {ocr.mismatches.length} mismatch(es): {ocr.mismatches.join(", ")}
            </p>
          </div>
        )}
      </div>

      {/* Enlarged Lightbox Modal */}
      {enlarged && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setEnlarged(false)}
        >
          {/* Close button */}
          <button className="absolute top-4 right-4 z-10 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors">
            <X className="w-6 h-6" />
          </button>

          {/* Image container */}
          <div
            className="relative max-w-[90vw] max-h-[90vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {material.thumbnailUrl && !imageBroken ? (
              <div className="relative">
                <img
                  src={material.thumbnailUrl}
                  alt={material.label}
                  className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
                  style={{ transform: `rotate(${rotated}deg)` }}
                  draggable={false}
                  onError={() => setImageBroken(true)}
                />
                <Watermark large />
              </div>
            ) : (
              <div className="bg-slate-800 rounded-2xl h-[70vh] w-[50vw] flex flex-col items-center justify-center gap-3">
                <FileImage className="w-12 h-12 text-slate-500" />
                <span className="text-slate-400 text-sm">Full-resolution document not available in this preview</span>
              </div>
            )}
          </div>

          {/* Bottom toolbar */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full">
            <button
              onClick={(e) => { e.stopPropagation(); setRotated((r) => (r - 90) % 360); }}
              className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="Rotate Left"
            >
              <RotateCw className="w-4 h-4" style={{ transform: "scaleX(-1)" }} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setRotated((r) => (r + 90) % 360); }}
              className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="Rotate Right"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-white/20" />
            <button
              className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="Download"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * Watermark overlay component
 *
 * v2: the diagonal CONFIDENTIAL text + diagonal stripe pattern was
 * removed. The watermark added an "AI / digital vault" feel without
 * carrying real compliance value (a watermark printed on screen is
 * trivially defeated). The component is kept as a no-op so existing
 * call sites don't need to be touched; if a genuine document-stamping
 * requirement comes up, this is the place to put it back.
 */
function Watermark(_props: { large?: boolean }) {
  return null;
}

const OCR_FIELD_DEFS: { key: keyof OCRResult; label: string }[] = [
  { key: "extractedName",        label: "姓名" },
  { key: "extractedNumber",      label: "证件号码" },
  { key: "extractedNationality", label: "国籍" },
  { key: "extractedDateOfBirth", label: "出生日期" },
  { key: "extractedExpiryDate",  label: "有效期至" },
];

function OcrCompareTable({ ocr, userFields }: { ocr: OCRResult; userFields: Record<string, string> }) {
  /* v3 (P1-B2)：差异更醒目
   *   - 顶部 banner 显示差异字段数
   *   - 差异行 red-50 背景 + 左侧 red 4px border
   *   - OCR 列差异值显示删除线 + slate-400
   *   - 用户列差异值红粗 + → 箭头
   *   - 已修改 chip 改红色，更刺眼
   */
  const diffs = OCR_FIELD_DEFS.filter(({ key }) => {
    const ocrVal  = String(ocr[key] ?? "—");
    const userVal = userFields[key] ?? ocrVal;
    return ocrVal !== userVal;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
        <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Extracted Data</h5>
        <span className="text-[11px] text-slate-500">
          OCR 系统识别 · 置信度 <span className="tabular-nums font-medium text-slate-700">{(ocr.confidence * 100).toFixed(0)}%</span>
        </span>
      </div>

      {/* Diff banner */}
      {diffs.length > 0 && (
        <div className="mb-2 px-3 py-2 rounded-md bg-red-50 border border-red-200 flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
          <p className="text-[11px] text-red-700 leading-tight">
            <b>{diffs.length}</b> 个字段在 OCR 和用户填写之间存在差异 —— 请逐条核对
            {diffs.length > 0 && <span className="text-red-500"> · {diffs.map((d) => d.label).join(" / ")}</span>}
          </p>
        </div>
      )}

      <div className="rounded-lg border border-slate-200 overflow-hidden text-xs">
        {/* Header */}
        <div className="grid grid-cols-[5rem_1fr_1fr] bg-slate-50 border-b border-slate-200">
          <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider" />
          <div className="px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-l border-slate-200">
            OCR 提取
          </div>
          <div className="px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-l border-slate-200">
            用户提交
          </div>
        </div>
        {OCR_FIELD_DEFS.map(({ key, label }) => {
          const ocrVal  = String(ocr[key] ?? "—");
          const userVal = userFields[key] ?? ocrVal;
          const differs = ocrVal !== userVal;
          return (
            <div
              key={key}
              className={`grid grid-cols-[5rem_1fr_1fr] border-b last:border-b-0 border-slate-100 ${
                differs ? "bg-red-50/60 border-l-4 border-l-red-500" : ""
              }`}
            >
              <div className={`px-3 py-2 font-medium ${differs ? "text-red-700" : "text-slate-500"}`}>
                {label}
              </div>
              <div className="px-3 py-2 border-l border-slate-100 font-mono">
                {differs
                  ? <span className="text-slate-400 line-through" title="OCR 原始识别">{ocrVal}</span>
                  : <span className="text-slate-700">{ocrVal}</span>}
              </div>
              <div className="px-3 py-2 border-l border-slate-100 flex items-center gap-2">
                {differs && <span className="text-red-400 text-xs">→</span>}
                <span className={`font-mono ${differs ? "text-red-700 font-bold" : "text-slate-700"}`}>
                  {userVal}
                </span>
                {differs && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-red-200 text-red-800 flex-shrink-0">
                    已修改
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex items-center gap-1.5 text-[10px] text-slate-400">
        {ocr.confidence >= 0.9 ? (
          <><CheckCircle className="w-3 h-3 text-emerald-500" /> High confidence</>
        ) : ocr.confidence >= 0.7 ? (
          <><AlertCircle className="w-3 h-3 text-amber-500" /> Review recommended</>
        ) : (
          <><AlertCircle className="w-3 h-3 text-red-500" /> Low confidence</>
        )}
      </div>
    </div>
  );
}

function OcrTable({ ocr }: { ocr: OCRResult }) {
  const fields = [
    { label: "Name", value: ocr.extractedName },
    { label: "Number", value: ocr.extractedNumber },
    { label: "Nationality", value: ocr.extractedNationality },
    { label: "DOB", value: ocr.extractedDateOfBirth },
    { label: "Expiry", value: ocr.extractedExpiryDate },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Extracted Data</h5>
        <span className="text-[11px] text-slate-500">
          OCR 系统识别 · 置信度 <span className="tabular-nums font-medium text-slate-700">{(ocr.confidence * 100).toFixed(0)}%</span>
        </span>
      </div>
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-xs">
          <tbody>
            {fields.map((f) => (
              <tr key={f.label} className="border-b border-slate-100 last:border-b-0">
                <td className="px-3 py-2 text-slate-400 w-28 bg-slate-50 font-medium">{f.label}</td>
                <td className="px-3 py-2 font-semibold text-slate-900">{f.value || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-2 flex items-center gap-1.5 text-[10px] text-slate-400">
        {ocr.confidence >= 0.9 ? (
          <><CheckCircle className="w-3 h-3 text-emerald-500" /> High confidence</>
        ) : ocr.confidence >= 0.7 ? (
          <><AlertCircle className="w-3 h-3 text-amber-500" /> Review recommended</>
        ) : (
          <><AlertCircle className="w-3 h-3 text-red-500" /> Low confidence</>
        )}
      </div>
    </div>
  );
}
