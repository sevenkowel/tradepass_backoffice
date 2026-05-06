"use client";

import { Suspense } from "react";
import { VerifyOtpContent } from "./VerifyOtpContent";

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    }>
      <VerifyOtpContent />
    </Suspense>
  );
}
