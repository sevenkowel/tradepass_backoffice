"use client";

/**
 * usePermission — declarative permission gating for the CRM.
 *
 * Reads from the existing `useAuthStore.hasPermission(module, action)`
 * so role / RBAC logic stays in one place. The hook is a thin wrapper
 * that gives us a stable, idiomatic API for components and conditional
 * rendering helpers.
 *
 * Usage:
 *
 *   const canApprove = usePermission("clm.cases", "approve");
 *
 *   {canApprove && <Button onClick={approve}>Approve</Button>}
 *
 *   <PermissionGate module="clients" action="freeze">
 *     <Button variant="destructive">Freeze account</Button>
 *   </PermissionGate>
 */

import { useAuthStore } from "@/store/crm/authStore";
import type { ReactNode } from "react";

/**
 * @param module dotted path of the feature, e.g. `"clm.cases"` or `"clients"`.
 *               Defined ad-hoc by feature owners; document new modules in
 *               docs/05-UI-System/Usage-Guidelines.md when added.
 * @param action verb to gate, e.g. `"view"`, `"approve"`, `"freeze"`.
 *               Default `"view"`.
 */
export function usePermission(module: string, action: string = "view"): boolean {
  return useAuthStore((s) => s.hasPermission(module, action));
}

/**
 * Convenience component: renders children only when the current user
 * has the given permission. `fallback` (optional) is rendered otherwise.
 */
export function PermissionGate({
  module,
  action = "view",
  fallback = null,
  children,
}: {
  module: string;
  action?: string;
  fallback?: ReactNode;
  children: ReactNode;
}) {
  const allowed = usePermission(module, action);
  return <>{allowed ? children : fallback}</>;
}
