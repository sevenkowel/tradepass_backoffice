"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Eye, Check, X, AlertCircle, RotateCcw,
  Clock, Search, ChevronLeft, ShieldCheck,
} from "lucide-react";
import { Card, PageHeader, Button, StatusBadge } from "@/components/crm/ui";
import { Breadcrumb } from "@/components/crm/layout";
import { kycService } from "@/lib/crm/services/kyc.service";
import type { UserKYC, KYCStatus } from "@/lib/kyc/types";
import { useCurrentStaffId } from "@/hooks/useCurrentStaff";

type Tab = "pending" | "approved" | "rejected";

export default function ReviewQueuePage() {
  const [records, setRecords] = useState<UserKYC[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [activeTab, setActiveTab] = useState<Tab>("pending");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const fetchData = useCallback(async (status?: KYCStatus) => {
    setLoading(true);
    const res = await kycService.list({ status: status || "submitted", search });
    setRecords(res.items);
    setStats({ total: res.total, pending: res.pending, approved: res.approved, rejected: res.rejected });
    setLoading(false);
  }, [search]);

  useEffect(() => { fetchData(); }, [fetchData, activeTab]);

  const handleTabChange = (tab: Tab) => { setActiveTab(tab); setSelectedId(null); };

  const selected = selectedId ? records.find(r => r.id === selectedId) : null;

  return (
    <div className="space-y-3">
      <Breadcrumb items={[{ label: "KYC Center" }, { label: "Review Queue" }]} />
      <PageHeader title="KYC Review Queue" description="Review and approve KYC submissions" />

      <div className="grid grid-cols-4 gap-3">
        <Card className="!p-4"><p className="text-sm text-slate-500">Total</p><p className="text-2xl font-bold mt-1">{stats.total}</p></Card>
        <Card className="!p-4"><p className="text-sm text-slate-500">Pending</p><p className="text-2xl font-bold text-amber-600 mt-1">{stats.pending}</p></Card>
        <Card className="!p-4"><p className="text-sm text-slate-500">Approved</p><p className="text-2xl font-bold text-emerald-600 mt-1">{stats.approved}</p></Card>
        <Card className="!p-4"><p className="text-sm text-slate-500">Rejected</p><p className="text-2xl font-bold text-red-600 mt-1">{stats.rejected}</p></Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex bg-slate-100 rounded-lg p-1">
          {(["pending","approved","rejected"] as Tab[]).map(tab => (
            <button key={tab} onClick={() => handleTabChange(tab)}
              className={`px-4 py-2 rounded-md text-sm font-medium capitalize ${activeTab === tab ? "bg-white shadow text-blue-700" : "text-slate-600"}`}>
              {tab}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 border rounded-lg text-sm w-64" />
        </div>
      </div>

      {selected ? (
        <ReviewDetail record={selected} onBack={() => setSelectedId(null)} onAction={fetchData} />
      ) : (
        <Card padding="none">
          <table className="w-full">
            <thead className="bg-slate-50 border-b text-left">
              <tr>
                {["UID","Client","Region","Doc Type","Confidence","Risk","SLA","Submitted",""].map(h => (
                  <th key={h} className="px-4 py-3 text-xs font-medium text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.map(r => (
                <tr key={r.id} className="border-b hover:bg-slate-50 cursor-pointer" onClick={() => setSelectedId(r.id)}>
                  <td className="px-4 py-3 font-mono text-sm text-blue-600">{r.userId}</td>
                  <td className="px-4 py-3 text-sm font-medium">{r.ocrData?.fullName || "-"}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{r.regionCode}</td>
                  <td className="px-4 py-3 text-sm capitalize">{(r.documentType || "").replace("_"," ")}</td>
                  <td className="px-4 py-3">
                    <span className={`text-sm font-medium ${(r.ocrConfidence || 0) >= 0.9 ? "text-emerald-600" : (r.ocrConfidence || 0) >= 0.7 ? "text-amber-600" : "text-red-600"}`}>
                      {r.ocrConfidence ? `${(r.ocrConfidence * 100).toFixed(0)}%` : "-"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {r.status === "supplemental_required" ? <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs">Resubmit</span> : "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500">
                    {r.submittedAt ? <Clock className="w-3 h-3 inline mr-1" /> : null}
                    {r.submittedAt ? new Date(r.submittedAt).toLocaleDateString() : "-"}
                  </td>
                  <td className="px-4 py-3">
                    <Eye className="w-4 h-4 text-slate-400" />
                  </td>
                </tr>
              ))}
              {records.length === 0 && <tr><td colSpan={8} className="py-12 text-center text-slate-400">No records</td></tr>}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

function ReviewDetail({ record, onBack, onAction }: { record: UserKYC; onBack: () => void; onAction: () => void }) {
  const [notes, setNotes] = useState("");
  const staffId = useCurrentStaffId();

  const handleAction = async (action: "approve" | "reject" | "resubmit") => {
    if (action === "approve") await kycService.approve(record.id, staffId, notes);
    else if (action === "reject") await kycService.reject(record.id, staffId, notes || "Review rejected");
    else await kycService.requestResubmit(record.id, staffId, notes || "Please resubmit documents");
    onAction();
    onBack();
  };

  return (
    <div className="flex gap-4">
      <div className="w-72 flex-shrink-0 space-y-3">
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-blue-600 mb-2"><ChevronLeft size={16} /> Back</button>
        <Card className="!p-4">
          <h3 className="font-medium text-slate-900 text-sm mb-3">Client Info</h3>
          <div className="space-y-2 text-sm">
            <div><span className="text-slate-500">UID:</span> <span className="font-mono">{record.userId}</span></div>
            <div><span className="text-slate-500">Name:</span> <span className="font-medium">{record.ocrData?.fullName || "-"}</span></div>
            <div><span className="text-slate-500">Region:</span> {record.regionCode}</div>
            <div><span className="text-slate-500">Level:</span> {record.kycLevel}</div>
            <div><span className="text-slate-500">Doc Type:</span> {(record.documentType || "").replace("_"," ")}</div>
            <div><span className="text-slate-500">Submitted:</span> {record.submittedAt ? new Date(record.submittedAt).toLocaleDateString() : "-"}</div>
          </div>
        </Card>
        <Card className="!p-4">
          <h3 className="font-medium text-slate-900 text-sm mb-3">Actions</h3>
          <div className="space-y-2">
            <textarea placeholder="Review notes..." value={notes} onChange={e => setNotes(e.target.value)}
              className="w-full p-2 border rounded-lg text-sm h-20" />
            <Button className="w-full" onClick={() => handleAction("approve")}><Check size={16} /> Approve</Button>
            <Button variant="secondary" className="w-full text-orange-700" onClick={() => handleAction("resubmit")}><RotateCcw size={16} /> Request Resubmit</Button>
            <Button variant="secondary" className="w-full text-red-700" onClick={() => handleAction("reject")}><X size={16} /> Reject</Button>
          </div>
        </Card>
      </div>
      <div className="flex-1 space-y-3">
        <Card className="!p-4">
          <h3 className="font-medium text-slate-900 text-sm mb-3">OCR Result</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              ["Full Name", record.ocrData?.fullName],
              ["ID Number", record.ocrData?.idNumber],
              ["DOB", record.ocrData?.dateOfBirth],
              ["Nationality", record.ocrData?.nationality],
              ["Gender", record.ocrData?.gender],
              ["Address", record.ocrData?.address],
              ["Confidence", record.ocrConfidence ? `${(record.ocrConfidence*100).toFixed(0)}%` : "-"],
            ].map(([k, v]) => (
              <div key={k}><span className="text-slate-500">{k}:</span> <span className="font-medium">{v || "-"}</span></div>
            ))}
          </div>
        </Card>
        <div className="grid grid-cols-2 gap-3">
          <Card className="!p-4">
            <h3 className="font-medium text-sm mb-2 text-slate-700">Liveness</h3>
            <p className={`text-sm font-medium ${record.livenessPassed ? "text-emerald-600" : "text-red-600"}`}>
              {record.livenessPassed ? "Passed" : "Not Passed"} ({record.livenessAttempts || 0} attempts)
            </p>
          </Card>
          {record.addressProofUrl ? (
            <Card className="!p-4">
              <h3 className="font-medium text-sm mb-2 text-slate-700">Address Proof</h3>
              <p className="text-sm text-emerald-600">Uploaded ✅</p>
            </Card>
          ) : (
            <Card className="!p-4"><h3 className="font-medium text-sm mb-2 text-slate-700">Address Proof</h3><p className="text-sm text-slate-400">Not required</p></Card>
          )}
        </div>
        {record.experienceInfo?.declarations && (
          <Card className="!p-4">
            <h3 className="font-medium text-sm mb-2 text-slate-700">Declarations</h3>
            <div className="grid grid-cols-3 gap-2 text-sm">
              {Object.entries(record.experienceInfo.declarations).map(([k, v]) => (
                <div key={k} className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${v ? "bg-red-500" : "bg-emerald-500"}`} />
                  <span className="text-slate-600 capitalize">{k.replace(/([A-Z])/g, " $1")}</span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
