"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function KycPoaReviewRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/crm/clm/cases");
  }, [router]);
  return (
    <div className="flex items-center gap-2 text-sm text-slate-500 py-12 justify-center">
      <Loader2 className="w-4 h-4 animate-spin" />
      Redirecting to Review Queue…
    </div>
  );
}
