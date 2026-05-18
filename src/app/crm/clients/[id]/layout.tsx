"use client";

/**
 * Layout for `/crm/clients/[id]` — owns the data fetch (via
 * `ClientDetailProvider`) and the breadcrumb. Nothing else.
 *
 * The full client sidebar lives in `page.tsx` → `ClientDetailSidebar`.
 * Earlier this file rendered its own 320 px sidebar with avatar / risk /
 * lifecycle / value / contact cards — same intent as the new sidebar,
 * but in the parent layout, which produced **two sidebars side-by-side**
 * when the v2 page-level sidebar landed. Removing the layout-level
 * sidebar fixes that.
 *
 * If you need persistent chrome that survives across tab navigation,
 * extend the page-level sidebar — not this layout — so the contracts
 * stay simple (one place owns the data shape, one place owns the chrome).
 */
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { ClientDetailProvider, useClientDetail } from "./ClientDetailContext";
import { Breadcrumb } from "@/components/crm/layout";

export default function ClientProfileLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const clientId = params.id as string;

  return (
    <ClientDetailProvider clientId={clientId}>
      <ClientProfileShell>{children}</ClientProfileShell>
    </ClientDetailProvider>
  );
}

function ClientProfileShell({ children }: { children: React.ReactNode }) {
  const { detail, loading } = useClientDetail();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-slate-500">客户不存在</p>
      </div>
    );
  }

  return (
    <>
      <Breadcrumb
        items={[
          { label: "Clients", href: "/crm/clients" },
          { label: detail.user.name },
        ]}
      />
      {children}
    </>
  );
}
