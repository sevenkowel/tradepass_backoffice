"use client";

import { Suspense } from "react";
import { Bind2faContent } from "./Bind2faContent";

export default function Bind2faPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-emerald-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    }>
      <Bind2faContent />
    </Suspense>
  );
}
