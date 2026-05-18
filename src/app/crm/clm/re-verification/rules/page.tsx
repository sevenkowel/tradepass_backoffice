"use client";

/**
 * The standalone Re-Verification Rules page has been merged into
 * Configuration → Routing & Rules (a 4th tab next to Routing /
 * Auto-Review / Auto-Upgrade). This route stays around as a redirect
 * so existing bookmarks land on the new home with the right tab open.
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function ReVerificationRulesRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/crm/clm/rules?tab=re-verification");
  }, [router]);
  return (
    <div className="flex items-center gap-2 text-sm text-slate-500 py-12 justify-center">
      <Loader2 className="w-4 h-4 animate-spin" />
      Re-Verification Rules moved → Configuration · Routing & Rules
    </div>
  );
}
