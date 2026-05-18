"use client";

import { useEffect } from "react";
import { useToastStore } from "@/store/crm";
import { useToast } from "@/components/ui/use-toast";

/**
 * Bridges the legacy Zustand `useToastStore` (used by `system-modules` and
 * other pages) into the shadcn-style `ToastContextProvider` that actually
 * renders the visual toasts. Without this bridge, `addToast(...)` calls
 * push records into the store but no UI ever surfaces them.
 *
 * Render once inside `ToastContextProvider` (see `app/crm/ClientLayout`).
 */
export function ToastBridge() {
  const toast = useToast();
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  useEffect(() => {
    if (toasts.length === 0) return;
    for (const t of toasts) {
      toast.toast({
        variant: t.type,
        title: t.title,
        description: t.message,
        duration: t.duration,
      });
      removeToast(t.id);
    }
  }, [toasts, toast, removeToast]);

  return null;
}
