"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ZoomIn, X, FileImage, RotateCw, Download, CheckCircle, AlertCircle, Eye } from "lucide-react";
import type { SubmittedMaterial, OCRResult } from "@/types/clm";

interface DocumentPreviewProps {
  material: SubmittedMaterial;
  className?: string;
}

export function DocumentPreview({ material, className }: DocumentPreviewProps) {
  const [enlarged, setEnlarged] = useState(false);
  const [rotated, setRotated] = useState(0);
  const ocr = material.ocrResult;
  const hasImage = !!material.thumbnailUrl;

  return (
    <>
      <div className={cn("space-y-4", className)}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-900">{material.label}</h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Submitted {new Date(material.submittedAt).toLocaleDateString()}
            </p>
          </div>
          <span
            className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider", {
              "bg-emerald-100 text-emerald-700": material.status === "verified",
              "bg-amber-100 text-amber-700": material.status === "submitted",
              "bg-red-100 text-red-700": material.status === "rejected",
            })}
          >
            {material.status}
          </span>
        </div>

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
                <p className="text-sm font-medium text-slate-500">Document preview not available</p>
                <p className="text-xs text-slate-400 mt-1">Original file stored securely</p>
              </div>
            </div>
            <Watermark />
          </div>
        )}

        {/* OCR Table */}
        {ocr && <OcrTable ocr={ocr} />}

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
            {material.thumbnailUrl ? (
              <div className="relative">
                <img
                  src={material.thumbnailUrl}
                  alt={material.label}
                  className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
                  style={{ transform: `rotate(${rotated}deg)` }}
                  draggable={false}
                />
                <Watermark large />
              </div>
            ) : (
              <div className="bg-slate-800 rounded-2xl h-[70vh] w-[50vw] flex items-center justify-center">
                <span className="text-slate-500 text-lg">Full Resolution Document</span>
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
