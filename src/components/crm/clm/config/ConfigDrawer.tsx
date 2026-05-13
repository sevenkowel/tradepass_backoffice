"use client";

/**
 * Right-side drawer used by every CLM Configuration screen for create/edit
 * forms. Shared so the six pages don't each invent their own modal.
 *
 * Layout:
 *   ─────────────────────────────────────────────
 *   [Title]                    [×]
 *   [Subtitle]
 *   ─────────────────────────────────────────────
 *   <children — page-specific form>
 *   ─────────────────────────────────────────────
 *   [Cancel]              [Save]
 *   ─────────────────────────────────────────────
 *
 * Pages own the form layout itself — this component only standardises the
 * chrome (overlay, ESC-to-close, sticky header / footer, loading state on
 * the save button).
 */
import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface ConfigDrawerProps {
  open: boolean;
  title: string;
  subtitle?: string;
  /** Optional CTA label override — defaults to "Save". */
  saveLabel?: string;
  /** Disabled when the form is invalid; visually dimmed. */
  saveDisabled?: boolean;
  /** Loading flag on the Save button. */
  saving?: boolean;
  /** Marks the form as having unsaved changes. When `true`, attempts to
   *  close the drawer (Cancel / ESC / backdrop / X) prompt for confirmation
   *  before discarding. */
  dirty?: boolean;
  onClose: () => void;
  onSave: () => void;
  /** Form body. */
  children: React.ReactNode;
  /** Optional left-side action — typically a "Delete" button when editing. */
  destructive?: { label: string; onClick: () => void };
  /** Drawer width in px; defaults to 480. */
  width?: number;
}

export function ConfigDrawer({
  open,
  title,
  subtitle,
  saveLabel = "Save",
  saveDisabled,
  saving,
  dirty,
  onClose,
  onSave,
  children,
  destructive,
  width = 480,
}: ConfigDrawerProps) {
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  // Always reset the confirm dialog whenever the drawer transitions to
  // closed — keeps the next open cycle clean.
  useEffect(() => {
    if (!open) setConfirmDiscard(false);
  }, [open]);

  const requestClose = useCallback(() => {
    if (dirty) setConfirmDiscard(true);
    else onClose();
  }, [dirty, onClose]);

  // ESC closes the drawer (with confirmation when dirty).
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") requestClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, requestClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex">
      {/* Backdrop */}
      <button
        className="flex-1 bg-black/40"
        aria-label="Close"
        onClick={requestClose}
      />
      {/* Panel */}
      <aside
        className="bg-white shadow-2xl flex flex-col h-full"
        style={{ width }}
      >
        <header className="flex items-start justify-between gap-3 px-5 py-4 border-b border-slate-200 sticky top-0 bg-white z-10">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-slate-900">{title}</h2>
            {subtitle && (
              <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
            )}
          </div>
          <button
            onClick={requestClose}
            aria-label="Close"
            className="p-1 -mr-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {children}
        </div>
        <footer className="px-5 py-3 border-t border-slate-200 flex items-center justify-between gap-2 sticky bottom-0 bg-white">
          {destructive ? (
            <button
              onClick={destructive.onClick}
              className="text-xs text-red-600 hover:text-red-700 hover:underline"
            >
              {destructive.label}
            </button>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={requestClose}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={onSave}
              disabled={saveDisabled || saving}
            >
              {saving ? "Saving…" : saveLabel}
            </Button>
          </div>
        </footer>

        {/* Discard-changes confirmation */}
        {confirmDiscard && (
          <div className="absolute inset-0 z-10 bg-slate-900/30 flex items-center justify-center px-5">
            <div className="w-full max-w-sm rounded-lg bg-white shadow-xl border border-slate-200 overflow-hidden">
              <div className="px-5 py-4 flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900">Discard changes?</p>
                  <p className="text-xs text-slate-500 mt-1">
                    You have unsaved edits. Closing this drawer will throw them away.
                  </p>
                </div>
              </div>
              <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setConfirmDiscard(false)}
                >
                  Keep editing
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    setConfirmDiscard(false);
                    onClose();
                  }}
                >
                  Discard
                </Button>
              </div>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}

/* ------------------------------------------------------------------------- */
/* Form field primitives — shared across all CLM config drawers              */
/* ------------------------------------------------------------------------- */

export function Field({
  label,
  hint,
  required,
  children,
}: {
  /** Plain string or a React node (lets callers inline a small action
   *  like a "View examples" toggle next to the field name). */
  label: React.ReactNode;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </span>
      <div className="mt-1">{children}</div>
      {hint && <p className="text-[11px] text-slate-400 mt-1">{hint}</p>}
    </label>
  );
}

const inputCls =
  "w-full h-9 px-3 rounded-md border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400";

export function TextInput(
  props: React.InputHTMLAttributes<HTMLInputElement>
) {
  return <input {...props} className={`${inputCls} ${props.className ?? ""}`} />;
}

export function TextArea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>
) {
  return (
    <textarea
      {...props}
      className={`${inputCls} h-auto min-h-[72px] py-2 ${props.className ?? ""}`}
    />
  );
}

export function Select(
  props: React.SelectHTMLAttributes<HTMLSelectElement> & {
    options: { label: string; value: string }[];
  }
) {
  const { options, ...rest } = props;
  return (
    <select {...rest} className={`${inputCls} ${rest.className ?? ""}`}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
