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
      <div className={cn("space-y-4", className)}>
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
 * Uses CSS to render a diagonal repeating watermark pattern
 */
function Watermark({ large = false }: { large?: boolean }) {
  return (
    <div
      className="absolute inset-0 pointer-events-none select-none overflow-hidden"
      style={{ zIndex: 10 }}
    >
      <div
        className={cn(
          "absolute inset-0 flex items-center justify-center",
          large ? "opacity-[0.12]" : "opacity-[0.08]"
        )}
      >
        <span
          className={cn(
            "font-bold tracking-widest uppercase text-slate-900 whitespace-nowrap",
            large ? "text-6xl" : "text-2xl"
          )}
          style={{ transform: "rotate(-30deg)" }}
        >
          CONFIDENTIAL
        </span>
      </div>
      {/* Additional scattered watermarks for density */}
      <div className="absolute inset-0 opacity-[0.06]" style={{
        backgroundImage: `repeating-linear-gradient(
          -30deg,
          transparent,
          transparent 80px,
          rgba(0,0,0,0.03) 80px,
          rgba(0,0,0,0.03) 82px
        )`,
      }} />
    </div>
  );
}

const OCR_FIELD_DEFS: { key: keyof OCRResult; label: string }[] = [
  { key: "extractedName",        label: "姓名" },
  { key: "extractedNumber",      label: "证件号码" },
  { key: "extractedNationality", label: "国籍" },
  { key: "extractedDateOfBirth", label: "出生日期" },
  { key: "extractedExpiryDate",  label: "有效期至" },
];

function OcrCompareTable({ ocr, userFields }: { ocr: OCRResult; userFields: Record<string, string> }) {
  const confidenceColor = ocr.confidence >= 0.9 ? "text-emerald-600" : ocr.confidence >= 0.7 ? "text-amber-600" : "text-red-600";
  const confidenceBg   = ocr.confidence >= 0.9 ? "bg-emerald-50"    : ocr.confidence >= 0.7 ? "bg-amber-50"    : "bg-red-50";

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Extracted Data</h5>
        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${confidenceBg} ${confidenceColor}`}>
          {(ocr.confidence * 100).toFixed(0)}%
        </span>
      </div>
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
            <div key={key} className={`grid grid-cols-[5rem_1fr_1fr] border-b last:border-b-0 border-slate-100 ${differs ? "bg-amber-50/60" : ""}`}>
              <div className="px-3 py-2 text-slate-500 font-medium">{label}</div>
              <div className="px-3 py-2 border-l border-slate-100 text-slate-700 font-mono">{ocrVal}</div>
              <div className="px-3 py-2 border-l border-slate-100 flex items-center gap-2">
                <span className={`font-mono ${differs ? "text-amber-800 font-semibold" : "text-slate-700"}`}>{userVal}</span>
                {differs && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-200 text-amber-800 flex-shrink-0">
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

  const confidenceColor = ocr.confidence >= 0.9 ? "text-emerald-600" : ocr.confidence >= 0.7 ? "text-amber-600" : "text-red-600";
  const confidenceBg = ocr.confidence >= 0.9 ? "bg-emerald-50" : ocr.confidence >= 0.7 ? "bg-amber-50" : "bg-red-50";

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Extracted Data</h5>
        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${confidenceBg} ${confidenceColor}`}>
          {(ocr.confidence * 100).toFixed(0)}%
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
