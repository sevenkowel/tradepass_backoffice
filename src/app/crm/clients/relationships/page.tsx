"use client";

import dynamic from "next/dynamic";
import { Breadcrumb } from "@/components/crm/layout";
import { PageHeader } from "@/components/crm/ui";

// 禁用 SSR，因为 react-force-graph-2d 需要 window 对象
const RelationshipGraph = dynamic(
  () => import("@/components/crm/relationships/RelationshipGraph"),
  { ssr: false, loading: () => <div className="h-[700px] flex items-center justify-center text-slate-400">Loading graph...</div> }
);

export default function RelationshipsPage() {
  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "Clients" }, { label: "Relationships" }]} />

      <PageHeader
        title="Client Relationship Graph"
        description="Visualize multi-account associations via shared IP, device, or ID documents"
      />

      {/* 关系图谱 */}
      <RelationshipGraph />
    </div>
  );
}
