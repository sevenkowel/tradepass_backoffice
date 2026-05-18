"use client";

import { Suspense } from "react";
import { CrmLoginForm } from "./LoginForm";

export default function CrmLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900" /></div>}>
      <CrmLoginForm />
    </Suspense>
  );
}
