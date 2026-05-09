"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ZoomIn, X, FileImage, RotateCw, Download, CheckCircle, AlertCircle } from "lucide-react";
import type { SubmittedMaterial, OCRResult } from "@/types/clm";

interface DocumentPreviewProps {
  material: SubmittedMaterial;
  className?: string;
}

export function DocumentPreview({ material, className }: DocumentPreviewProps) {
  const [enlarged, setEnlarged] = useState(false);
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

        {/* Document Image — limited height, centered */}
        {hasImage ? (
          <div
            className="relative bg-slate-100 rounded-xl border border-slate-200 overflow-hidden group cursor-pointer max-h-80"
            onClick={() => setEnlarged(true)}
          >
            <img
              src={material.thumbnailUrl}
              alt={material.label}
              className="w-full h-full object-contain max-h-80"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
              <span className="flex items-center gap-2 px-4 py-2 bg-white shadow-lg rounded-xl text-xs font-medium text-slate-700">
                <ZoomIn className="w-4 h-4" /> Enlarge
              </span>
            </div>
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="p-1.5 bg-white shadow-sm rounded-lg text-slate-400 hover:text-slate-600" title="Rotate">
                <RotateCw className="w-3.5 h-3.5" />
              </button>
              <button className="p-1.5 bg-white shadow-sm rounded-lg text-slate-400 hover:text-slate-600" title="Download">
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <FileImage className="w-5 h-5 text-slate-300" />
            <span className="text-xs text-slate-400">Document preview not available</span>
          </div>
        )}

        {/* OCR Table — full width below image */}
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

      {/* Enlarged Modal */}
      {enlarged && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-8" onClick={() => setEnlarged(false)}>
          <button className="absolute top-4 right-4 text-white hover:text-gray-300">
            <X className="w-8 h-8" />
          </button>
          <div className="bg-white rounded-2xl max-w-4xl max-h-[90vh] overflow-auto p-4" onClick={(e) => e.stopPropagation()}>
            {material.thumbnailUrl ? (
              <img src={material.thumbnailUrl} alt={material.label} className="max-w-full max-h-[80vh] object-contain" />
            ) : (
              <div className="bg-slate-200 rounded-lg h-[70vh] flex items-center justify-center">
                <span className="text-slate-500">Full Resolution Document</span>
              </div>
            )}
          </div>
        </div>
      )}
    </>
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
