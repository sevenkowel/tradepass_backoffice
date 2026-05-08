"use client";

import { useState, useEffect, useCallback } from "react";
import { Eye, Clock, AlertTriangle, Check, RotateCcw } from "lucide-react";
import { Card, PageHeader } from "@/components/crm/ui";
import { Breadcrumb } from "@/components/crm/layout";
import { kycService } from "@/lib/crm/services/kyc.service";
import type { UserKYC } from "@/lib/kyc/types";

export default function ResubmissionPage() {
  const [records, setRecords] = useState<UserKYC[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await kycService.list({ status: "submitted" });
    setRecords(res.items.filter(r => r.status === "supplemental_required"));
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAction = async (id: string, action: "approve" | "resubmit") => {
    if (action === "approve") await kycService.approve(id, "staff-001");
    else await kycService.requestResubmit(id, "staff-001", "Additional documents needed");
    fetchData();
    setSelectedId(null);
  };

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: "KYC Center" }, { label: "Resubmission" }]} />
      <PageHeader title="Resubmission Center" description="Review supplemental document submissions" />

      <div className="grid grid-cols-3 gap-4">
        <Card className="!p-4"><p className="text-sm text-slate-500">Pending</p><p className="text-2xl font-bold text-amber-600 mt-1">{records.length}</p></Card>
        <Card className="!p-4"><p className="text-sm text-slate-500">Overdue</p><p className="text-2xl font-bold text-red-600 mt-1">{records.filter(r => !!r.submittedAt && (Date.now() - new Date(r.submittedAt).getTime()) > 72*3600000).length}</p></Card>
        <Card className="!p-4"><p className="text-sm text-slate-500">Avg Response</p><p className="text-2xl font-bold mt-1">-</p></Card>
      </div>

      <Card padding="none">
        <table className="w-full">
          <thead className="bg-slate-50 border-b text-left">
            <tr>
              {["UID","Client","Reason","Requested","Status",""].map(h => (
                <th key={h} className="px-4 py-3 text-xs font-medium text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {records.map(r => (
              <tr key={r.id} className="border-b hover:bg-slate-50 cursor-pointer" onClick={() => setSelectedId(selectedId === r.id ? null : r.id)}>
                <td className="px-4 py-3 font-mono text-sm text-blue-600">{r.userId}</td>
                <td className="px-4 py-3 text-sm font-medium">{r.ocrData?.fullName || "-"}</td>
                <td className="px-4 py-3 text-sm text-orange-600">{r.rejectionReason || "-"}</td>
                <td className="px-4 py-3 text-sm text-slate-500">{r.submittedAt ? new Date(r.submittedAt).toLocaleDateString() : "-"}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs">Resubmit</span>
                </td>
                <td className="px-4 py-3"><Eye className="w-4 h-4 text-slate-400" /></td>
              </tr>
            ))}
            {records.length === 0 && <tr><td colSpan={6} className="py-12 text-center text-slate-400">No resubmissions pending</td></tr>}
          </tbody>
        </table>
      </Card>

      {selectedId && (
        <Card className="!p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          <span className="text-sm">Reviewing: {records.find(r => r.id === selectedId)?.userId}</span>
          <div className="flex-1" />
          <button onClick={() => handleAction(selectedId, "approve")} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm flex items-center gap-1">
            <Check size={16} /> Approve
          </button>
          <button onClick={() => handleAction(selectedId, "resubmit")} className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm flex items-center gap-1">
            <RotateCcw size={16} /> Request Again
          </button>
        </Card>
      )}
    </div>
  );
}
