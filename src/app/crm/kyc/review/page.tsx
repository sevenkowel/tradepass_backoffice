"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function KycReviewRedirect() {
  const router = useRouter();
  useEffect(() => {
    // CLM Workspace was retired in the v2 refactor; the Approval Inbox
    // is now the primary entry. See docs/Approval-Center-v2-Architecture.md.
    router.replace("/crm/approvals/inbox?type=kyc");
  }, [router]);
  return (
    <div className="flex items-center gap-2 text-sm text-slate-500 py-12 justify-center">
      <Loader2 className="w-4 h-4 animate-spin" />
      Redirecting to Approval Inbox…
    </div>
  );
}
