"use client";

import { useState } from "react";
import { FileText, Check, X, AlertTriangle, Clock } from "lucide-react";
import { Card, PageHeader, Button } from "@/components/crm/ui";
import { Breadcrumb } from "@/components/crm/layout";

const mockPOAData = [
  { id: "poa-001", userId: "user-002", name: "RAJESH KUMAR", region: "IN", type: "Bank Statement", fileName: "bank-statement.pdf", uploadDate: "2026-05-08", valid: true, status: "pending", address: "Mumbai, Maharashtra" },
  { id: "poa-002", userId: "user-006", name: "ANAND PATEL", region: "IN", type: "Utility Bill", fileName: "electricity-bill.pdf", uploadDate: "2026-05-06", valid: false, status: "pending", address: "Delhi, India" },
];

export default function POAReviewPage() {
  const [records] = useState(mockPOAData);

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: "KYC Center" }, { label: "POA Review" }]} />
      <PageHeader title="Address Proof Review" description="Review proof of address documents (utility bills, bank statements, government letters)" />

      <div className="grid grid-cols-3 gap-4">
        <Card className="!p-4"><p className="text-sm text-slate-500">Total</p><p className="text-2xl font-bold mt-1">{records.length}</p></Card>
        <Card className="!p-4"><p className="text-sm text-slate-500">Pending</p><p className="text-2xl font-bold text-amber-600 mt-1">{records.filter(r => r.status === "pending").length}</p></Card>
        <Card className="!p-4"><p className="text-sm text-slate-500">Expired</p><p className="text-2xl font-bold text-red-600 mt-1">{records.filter(r => !r.valid).length}</p></Card>
      </div>

      <div className="space-y-3">
        {records.map(r => (
          <Card key={r.id} className={`!p-4 ${!r.valid ? "border-red-300" : ""}`}>
            <div className="flex items-center gap-4">
              <FileText className="w-8 h-8 text-slate-400" />
              <div className="flex-1">
                <p className="font-medium text-slate-900">{r.name} <span className="text-sm text-slate-400">({r.userId})</span></p>
                <p className="text-xs text-slate-500">{r.type} · {r.fileName} · {r.region} · {r.uploadDate}</p>
                {!r.valid && <p className="text-xs text-red-500 mt-1"><Clock size={12} className="inline mr-1" />Document older than 3 months</p>}
              </div>
              <p className="text-sm text-slate-600">{r.address}</p>
              <div className="flex gap-2">
                <Button className="!px-3 !py-1.5 text-xs"><Check size={14} /> Approve</Button>
                <Button variant="secondary" className="!px-3 !py-1.5 text-xs text-red-700"><X size={14} /> Reject</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
