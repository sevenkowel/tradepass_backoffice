"use client";

/**
 * SignFlowPreview — operator-facing modal that simulates exactly what a
 * customer sees when signing this agreement version.
 *
 * Layout:
 *   ┌──────────────────────────────────────────────┐
 *   │ Header: agreement + version + lang switcher  │
 *   ├──────────────────────────────────────────────┤
 *   │ AgreementReader (body + reading-control bar) │
 *   ├──────────────────────────────────────────────┤
 *   │ Signing panel (checkbox / typed name / pad)  │
 *   │ — gated by reader's unlock state            │
 *   ├──────────────────────────────────────────────┤
 *   │ Footer: Cancel / Sign                        │
 *   └──────────────────────────────────────────────┘
 *
 * On submit, calls `clmConfigService.agreements.recordSignature(...)`
 * with the captured proof (typed name + handwritten PNG + reading
 * seconds + scrolled-bottom flag) so the Signatures tab updates live.
 *
 * The same component would be reusable inside a real client-facing
 * forced-popup flow — its only outward dependency is the service call,
 * which can be swapped to call the customer-side endpoint.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { X, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AgreementReader } from "./AgreementReader";
import { SignaturePad, type SignaturePadHandle } from "./SignaturePad";
import { clmConfigService } from "@/lib/clm/services";
import { useCurrentStaff } from "@/hooks/useCurrentStaff";
import type { AgreementVersion, ConfigAgreement } from "@/types/clm";

interface Props {
  open: boolean;
  onClose: () => void;
  agreement: ConfigAgreement;
  version: AgreementVersion;
  /** Default language to show — falls back to the first available. */
  defaultLanguage?: string;
  /** Called when a synthetic signature has been recorded. */
  onSigned?: () => void;
}

export function SignFlowPreview({
  open,
  onClose,
  agreement,
  version,
  defaultLanguage,
  onSigned,
}: Props) {
  const staff = useCurrentStaff();
  const [language, setLanguage] = useState<string>(
    defaultLanguage ?? version.contents[0]?.language ?? "en"
  );
  const [readSeconds, setReadSeconds] = useState(0);
  const [scrolledBottom, setScrolledBottom] = useState(
    !version.reading.requireScrollToBottom
  );
  const [unlocked, setUnlocked] = useState(false);
  const [checkbox, setCheckbox] = useState(false);
  const [typedName, setTypedName] = useState("");
  const [signatureEmpty, setSignatureEmpty] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const padRef = useRef<SignaturePadHandle>(null);

  // Reset whenever the modal re-opens or the version flips.
  useEffect(() => {
    if (!open) return;
    setLanguage(defaultLanguage ?? version.contents[0]?.language ?? "en");
    setReadSeconds(0);
    setScrolledBottom(!version.reading.requireScrollToBottom);
    setUnlocked(false);
    setCheckbox(false);
    setTypedName("");
    setSignatureEmpty(true);
    padRef.current?.clear();
  }, [open, version, defaultLanguage]);

  const content = useMemo(
    () =>
      version.contents.find((c) => c.language === language) ??
      version.contents[0],
    [version, language]
  );

  const requirements = version.signing;
  const validForSubmit =
    unlocked &&
    (!requirements.checkbox || checkbox) &&
    (!requirements.typedName || typedName.trim().length > 0) &&
    (!requirements.handwrittenSignature || !signatureEmpty);

  const submit = async () => {
    if (!validForSubmit || !content) return;
    setSubmitting(true);
    try {
      const signaturePng = requirements.handwrittenSignature
        ? padRef.current?.getDataURL() ?? undefined
        : undefined;
      await clmConfigService.agreements.recordSignature({
        agreementId: agreement.id,
        versionId: version.id,
        userId: `preview-${Date.now()}`,
        userUid: staff?.id ? `staff-${staff.id}` : "preview-user",
        userName: staff?.username ?? "Preview Operator",
        language,
        signedAt: new Date().toISOString(),
        checkboxChecked: checkbox,
        typedName: requirements.typedName ? typedName : undefined,
        signaturePngBase64: signaturePng?.replace(/^data:image\/png;base64,/, ""),
        readSeconds,
        scrolledToBottom: scrolledBottom,
        ipAddress: "127.0.0.1",
        userAgent:
          typeof navigator !== "undefined" ? navigator.userAgent : "preview",
        geoCountry: requirements.captureGeo ? "—" : undefined,
        documentHash: `sha256-preview-${Date.now()}`,
      });
      onSigned?.();
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  if (!open || !content) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center bg-black/40 px-4 py-6 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[calc(100vh-3rem)]">
        {/* Header */}
        <header className="flex items-center justify-between gap-3 px-5 py-3 border-b border-slate-200">
          <div className="min-w-0">
            <p className="text-base font-semibold text-slate-900 truncate">
              {agreement.name}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs font-mono tabular-nums text-blue-600">
                {version.version}
              </span>
              <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-semibold">
                Preview Mode
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="h-8 px-2 rounded-md border border-slate-200 bg-white text-xs"
            >
              {version.contents.map((c) => (
                <option key={c.language} value={c.language}>
                  {c.language.toUpperCase()}
                </option>
              ))}
            </select>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          <AgreementReader
            body={content.body}
            controls={version.reading}
            language={content.language}
            onUnlocked={() => setUnlocked(true)}
            onTimeUpdate={setReadSeconds}
            onScrolledBottom={setScrolledBottom}
          />

          {/* Signing panel — visually dimmed until reader unlocks. */}
          <div
            className={`border border-slate-200 rounded-lg p-4 transition-opacity ${
              unlocked ? "opacity-100" : "opacity-50 pointer-events-none"
            }`}
          >
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <p className="text-sm font-semibold text-slate-900">Confirm signing</p>
            </div>

            <div className="space-y-3">
              {requirements.checkbox && (
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checkbox}
                    onChange={(e) => setCheckbox(e.target.checked)}
                    className="mt-0.5"
                  />
                  <span className="text-sm text-slate-700 leading-snug">
                    I have read and agree to be bound by every provision of <strong>{agreement.name}</strong> ({version.version}).
                  </span>
                </label>
              )}

              {requirements.typedName && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Type your full legal name
                  </label>
                  <input
                    type="text"
                    value={typedName}
                    onChange={(e) => setTypedName(e.target.value)}
                    placeholder="e.g. Zhang Wei"
                    className="w-full h-9 px-3 rounded-md border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Must match the full name on your KYC record.
                  </p>
                </div>
              )}

              {requirements.handwrittenSignature && (
                <div>
                  <p className="text-xs font-medium text-slate-700 mb-1">
                    Handwritten signature
                  </p>
                  <SignaturePad
                    ref={padRef}
                    width={520}
                    height={140}
                    onChange={(empty) => setSignatureEmpty(empty)}
                  />
                </div>
              )}

              {/* Capture summary — what will be persisted on the audit row. */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                {requirements.captureIp && (
                  <Capture label="IP" value="will be captured" />
                )}
                {requirements.captureGeo && (
                  <Capture label="Geo" value="will be captured" />
                )}
                <Capture label="Read" value={`${readSeconds}s`} />
                {version.reading.requireScrollToBottom && (
                  <Capture
                    label="Scrolled"
                    value={scrolledBottom ? "yes" : "no"}
                    tone={scrolledBottom ? "ok" : "warn"}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="flex items-center justify-between gap-2 px-5 py-3 border-t border-slate-200">
          <p className="text-[11px] text-slate-400">
            Submitting records a synthetic signature visible in the Signatures tab.
          </p>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button size="sm" onClick={submit} disabled={!validForSubmit || submitting}>
              {submitting ? "Signing…" : "Sign"}
            </Button>
          </div>
        </footer>
      </div>
    </div>
  );
}

function Capture({
  label,
  value,
  tone = "info",
}: {
  label: string;
  value: string;
  tone?: "ok" | "warn" | "info";
}) {
  const cls =
    tone === "ok" ? "bg-emerald-50 text-emerald-700" :
    tone === "warn" ? "bg-amber-50 text-amber-700" :
    "bg-slate-100 text-slate-600";
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] ${cls}`}>
      <span className="uppercase tracking-wider font-semibold">{label}</span>
      <span className="font-mono tabular-nums">{value}</span>
    </span>
  );
}
