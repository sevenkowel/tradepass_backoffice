"use client";

import { Suspense } from "react";
import { SetPasswordContent } from "./SetPasswordContent";

export default function SetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-amber-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
      </div>
    }>
      <SetPasswordContent />
    </Suspense>
  );
}
