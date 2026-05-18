/**
 * Funds module toast helpers
 *
 * Each placeholder action in the funds module pages calls one of these
 * to give the operator immediate feedback (instead of dead buttons).
 * This is intentional for the v2.2 demo state — when real services
 * land, swap each call for the real API.
 */

"use client";

import { toast } from "@/components/ui/use-toast";

/** Action that's wired only as a UI demo for now. */
export function demoAction(action: string) {
  toast.info(action, { duration: 2500 });
}

/** Generic success after a local state mutation. */
export function actionDone(message: string) {
  toast.success(message, { duration: 2500 });
}

/** Export stub. */
export function demoExport(what: string) {
  toast.info(`正在导出 ${what}…`, { duration: 2500 });
}

/** Create stub (for "+ New ..." buttons). */
export function demoCreate(what: string) {
  toast.info(`新建 ${what}`, { duration: 2500 });
}

/** Edit stub (for "Edit" buttons inside config panels). */
export function demoEdit(what: string) {
  toast.info(`编辑 ${what}`, { duration: 2500 });
}
