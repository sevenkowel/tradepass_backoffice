"use client";

/**
 * Compliance → Audit Logs.
 *
 * After Phase 3 / M6, the legacy local AuditLog shape and its inline mock
 * data have been replaced by the cross-domain GlobalAuditLog. This page is
 * effectively a redirect to `/crm/clm/audit-trail` — kept around so the old
 * Sidebar entries don't 404. Operators expect to land on the same unified
 * timeline regardless of which navigation entry they used.
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function ComplianceAuditRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/crm/clm/audit-trail");
  }, [router]);
  return (
    <div className="flex items-center gap-2 text-sm text-slate-500 py-12 justify-center">
      <Loader2 className="w-4 h-4 animate-spin" />
      Redirecting to unified Audit Trail…
    </div>
  );
}
