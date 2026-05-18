"use client";

import { useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DrawerProps {
  isOpen?: boolean;
  /** Alias for isOpen */
  open?: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  /** Width preset — sm 28rem / md 32rem / lg 42rem / xl 60rem (~960px). */
  size?: "sm" | "md" | "lg" | "xl";
  showClose?: boolean;
  footer?: React.ReactNode;
  /**
   * Full-bleed mode: children fill the drawer body without internal padding
   * or scroll wrapping. Use when the inner component owns its own layout
   * (e.g. a multi-tab workspace with its own scrolling region).
   */
  fullBleed?: boolean;
}

export function Drawer({
  isOpen,
  open,
  onClose,
  title,
  description,
  children,
  size = "md",
  showClose = true,
  footer,
  fullBleed = false,
}: DrawerProps) {
  // support both `isOpen` and `open` prop aliases
  const resolvedOpen = isOpen ?? open ?? false;
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (resolvedOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [resolvedOpen, handleEscape]);

  // Width tokens — `w-` (fixed) for the wide variant so the drawer
  // doesn't shrink-to-fit when its inner content gets narrower (e.g.
  // switching to a single-column settings tab inside an account detail).
  // The narrower sizes keep `max-w-` because their content is usually
  // a single-column form that never causes layout jumps.
  const sizes = {
    sm: "max-w-md",      // 28rem (~448px)
    md: "max-w-lg",      // 32rem (~512px)
    lg: "max-w-2xl",     // 42rem (~672px)
    xl: "w-[60rem]",     // 60rem (~960px) — fixed width
  };

  return (
    <AnimatePresence>
      {resolvedOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className={cn(
              "fixed right-0 top-0 h-full bg-white shadow-xl z-50 flex flex-col",
              sizes[size]
            )}
          >
            {/* Header — only render when there is something to show.
             *  fullBleed 用法（如账户工作台）会传 showClose={false} 且
             *  无 title/description，这种情况完全不渲染 header 行，
             *  让 children 自己处理顶栏（含关闭按钮）。
             */}
            {(title || description || (showClose && !fullBleed)) && (
              <div className="flex items-start justify-between p-6 border-b border-gray-100">
                <div>
                  {title && (
                    <h2 className="text-lg font-semibold text-gray-900">
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p className="mt-1 text-sm text-gray-500">{description}</p>
                  )}
                </div>
                {showClose && (
                  <button
                    onClick={onClose}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            )}

            {/* Content — fullBleed 模式让 children 完全控制内边距和滚动，
             *  否则保持默认 p-6 + 自动滚动。
             */}
            <div className={cn(
              "flex-1 min-h-0",
              fullBleed ? "overflow-hidden" : "overflow-y-auto p-6",
            )}>
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className="border-t border-gray-100 p-6 bg-gray-50">
                {footer}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Drawer Footer Helper
interface DrawerFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function DrawerFooter({ children, className }: DrawerFooterProps) {
  return (
    <div className={cn("flex items-center justify-end gap-3", className)}>
      {children}
    </div>
  );
}
