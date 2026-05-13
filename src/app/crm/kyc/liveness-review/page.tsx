"use client";

import { useState } from "react";
import { Play, Check, X, AlertTriangle } from "lucide-react";
import { Card, PageHeader, Button } from "@/components/crm/ui";
import { Breadcrumb } from "@/components/crm/layout";

const mockLivenessData = [
  { id: "lv-001", userId: "user-001", name: "NGUYEN VAN A", region: "VN", actions: "Blink + Turn", confidence: 0.92, status: "pending", videoUrl: "/mock/liveness-001.mp4", timestamp: "2026-05-07" },
  { id: "lv-002", userId: "user-003", name: "TRAN THI B", region: "VN", actions: "Blink + Turn", confidence: 0.68, status: "pending", videoUrl: "/mock/liveness-003.mp4", timestamp: "2026-05-06" },
  { id: "lv-003", userId: "user-002", name: "RAJESH KUMAR", region: "IN", actions: "Blink + Turn", confidence: 0.85, status: "passed", videoUrl: "/mock/liveness-002.mp4", timestamp: "2026-05-05" },
];

export default function LivenessReviewPage() {
  const [records] = useState(mockLivenessData);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      <Breadcrumb items={[{ label: "KYC Center" }, { label: "Liveness Review" }]} />
      <PageHeader title="Liveness Review" description="Review liveness detection results and video recordings" />

      <div className="grid grid-cols-3 gap-3">
        <Card className="!p-4"><p className="text-sm text-slate-500">Total</p><p className="text-2xl font-bold mt-1">{records.length}</p></Card>
        <Card className="!p-4"><p className="text-sm text-slate-500">Pending</p><p className="text-2xl font-bold text-amber-600 mt-1">{records.filter(r => r.status === "pending").length}</p></Card>
        <Card className="!p-4"><p className="text-sm text-slate-500">Passed</p><p className="text-2xl font-bold text-emerald-600 mt-1">{records.filter(r => r.status === "passed").length}</p></Card>
      </div>

      <div className="space-y-3">
        {records.map(r => (
          <Card key={r.id} className="!p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                <Play className="w-5 h-5 text-slate-500" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-slate-900">{r.name}</p>
                <p className="text-xs text-slate-500">{r.userId} · {r.region} · {r.actions} · {r.timestamp}</p>
              </div>
              <div className="text-right">
                <p className={`text-sm font-bold ${r.confidence >= 0.9 ? "text-emerald-600" : r.confidence >= 0.7 ? "text-amber-600" : "text-red-600"}`}>{(r.confidence*100).toFixed(0)}%</p>
                <p className="text-xs text-slate-400">confidence</p>
              </div>
              <div className="flex gap-2">
                <Button className="!px-3 !py-1.5 text-xs"><Check size={14} /> Pass</Button>
                <Button variant="secondary" className="!px-3 !py-1.5 text-xs text-red-700"><X size={14} /> Reject</Button>
              </div>
            </div>
            {selectedId === r.id && (
              <div className="mt-4 p-4 bg-slate-900 rounded-lg text-center text-slate-300 text-sm">
                [Video Player Placeholder] — {r.videoUrl}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
