"use client";

/**
 * CenterModal — full-screen dim + centered 1000px wide modal.
 *
 * Complementary to `<Drawer>` which slides in from the right. Use this
 * for richer "row detail" workflows where you want maximum width without
 * the drawer's anchor to the right edge.
 *
 * The modal uses ESC + backdrop click to close, traps body scroll, and
 * is portal-rendered to escape the table's overflow context.
 */

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  /** Override default width (1000px). */
  width?: number | string;
  /** Footer node (e.g. action buttons). Optional. */
  footer?: React.ReactNode;
  /** Header right-aligned slot (e.g. row action dropdown). Optional. */
  headerActions?: React.ReactNode;
  showClose?: boolean;
  className?: string;
  children: React.ReactNode;
  /**
   * Full-bleed mode: children fill the body with no inner scroll wrapping,
   * letting the inner component own its own layout and scrolling regions.
   */
  fullBleed?: boolean;
}

export function CenterModal({
  open, onClose, title, description, width = 1000,
  footer, headerActions, showClose = true, className, children,
  fullBleed = false,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ type: "spring", damping: 24, stiffness: 320 }}
            className={cn(
              "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50",
              "bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden",
              // Fixed footprint — switching tabs inside must not resize the
              // container. Short content gets internal whitespace; long
              // content scrolls within the body.
              "h-[85vh] max-w-[calc(100vw-2rem)]",
              className,
            )}
            style={{ width: typeof width === "number" ? `${width}px` : width }}
          >
            {(title || description || headerActions || showClose) && (
              <div className="flex items-start justify-between gap-3 px-6 py-4 border-b border-slate-100">
                <div className="min-w-0 flex-1">
                  {title && <h2 className="text-lg font-semibold text-slate-900 truncate">{title}</h2>}
                  {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {headerActions}
                  {showClose && (
                    <button
                      onClick={onClose}
                      className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                      aria-label="Close"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className={cn(
              "flex-1 min-h-0",
              fullBleed ? "overflow-hidden" : "overflow-y-auto",
            )}>
              {children}
            </div>

            {footer && (
              <div className="border-t border-slate-100 px-6 py-3 bg-slate-50">
                {footer}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
