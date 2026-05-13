"use client";

import { useState } from "react";
import { FileText, Download, Clock, User, Search } from "lucide-react";
import { Card, PageHeader, Button } from "@/components/crm/ui";
import { Breadcrumb } from "@/components/crm/layout";

const timeline = [
  { userId: "user-001", name: "NGUYEN VAN A", event: "KYC Approved", date: "2026-05-07T10:00:00Z", type: "approved" },
  { userId: "user-001", name: "NGUYEN VAN A", event: "Submitted for Review", date: "2026-05-07T10:05:00Z", type: "submitted" },
  { userId: "user-002", name: "RAJESH KUMAR", event: "Submitted for Review", date: "2026-05-08T09:05:00Z", type: "submitted" },
  { userId: "user-004", name: "LE VAN C", event: "Resubmission Requested", date: "2026-05-04T09:00:00Z", type: "rejected" },
  { userId: "user-005", name: "PHAM THI D", event: "KYC Approved", date: "2026-05-03T10:00:00Z", type: "approved" },
];

const typeStyles: Record<string, string> = {
  approved: "bg-emerald-100 text-emerald-700",
  submitted: "bg-blue-100 text-blue-700",
  rejected: "bg-red-100 text-red-700",
};

export default function ComplianceArchivePage() {
  const [search, setSearch] = useState("");

  const filtered = timeline.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.userId.toLowerCase().includes(search)
  );

  return (
    <div className="space-y-3">
      <Breadcrumb items={[{ label: "KYC Center" }, { label: "Compliance Archive" }]} />
      <PageHeader title="Compliance Archive" description="KYC records timeline with full export"
        actions={<Button variant="secondary"><Download size={16} /> Export PDF</Button>}
      />

      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input placeholder="Search by UID or name..." value={search} onChange={e => setSearch(e.target.value)}
          className="pl-10 pr-4 py-2 border rounded-lg text-sm w-80" />
      </div>

      <div className="space-y-3">
        {filtered.map((item, i) => (
          <Card key={i} className="!p-4 flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
              <User size={14} className="text-slate-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-900">{item.name} <span className="text-slate-400 font-mono">({item.userId})</span></p>
              <p className="text-xs text-slate-500">{item.event}</p>
            </div>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${typeStyles[item.type]}`}>{item.type}</span>
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <Clock size={12} /> {new Date(item.date).toLocaleDateString()}
            </div>
          </Card>
        ))}
        {filtered.length === 0 && <div className="py-12 text-center text-slate-400">No records found</div>}
      </div>
    </div>
  );
}
