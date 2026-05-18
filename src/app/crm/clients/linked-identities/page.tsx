"use client";

/**
 * Linked Identities — 同名 / 同证件 / 同 DOB 的关联账户.
 */

import { useMemo } from "react";
import Link from "next/link";
import { Fingerprint, ExternalLink } from "lucide-react";
import { Breadcrumb } from "@/components/crm/layout";
import { PageHeader, Card } from "@/components/crm/ui";
import { generateLinkedIdentities } from "@/lib/crm/mock-collaboration";

export default function LinkedIdentitiesPage() {
  const data = useMemo(() => generateLinkedIdentities(), []);
  return (
    <>
      <Breadcrumb items={[{ label: "Clients", href: "/crm/clients" }, { label: "关联身份" }]} />
      <PageHeader
        title="关联身份"
        description="同名 / 同生日 / 同证件号 的账户关联 — 多账户重复注册嫌疑"
      />

      <div className="grid grid-cols-4 gap-3 mb-4">
        <Card className="!p-3">
          <p className="text-[10.5px] uppercase tracking-wider text-slate-500">关联组数</p>
          <p className="text-2xl font-bold tabular-nums">{data.length}</p>
        </Card>
        <Card className="!p-3">
          <p className="text-[10.5px] uppercase tracking-wider text-slate-500">涉及账户</p>
          <p className="text-2xl font-bold tabular-nums">
            {data.reduce((s, d) => s + d.members.length, 0)}
          </p>
        </Card>
        <Card className="!p-3">
          <p className="text-[10.5px] uppercase tracking-wider text-slate-500">高置信度（&gt;80%）</p>
          <p className="text-2xl font-bold text-red-700 tabular-nums">
            {data.filter((d) => d.confidence > 0.8).length}
          </p>
        </Card>
        <Card className="!p-3">
          <p className="text-[10.5px] uppercase tracking-wider text-slate-500">证件号一致</p>
          <p className="text-2xl font-bold tabular-nums">
            {data.filter((d) => d.signal === "same_id_number").length}
          </p>
        </Card>
      </div>

      <div className="space-y-2">
        {data.map((d) => (
          <div key={d.id} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
              <div className="flex items-center gap-2">
                <Fingerprint className="w-4 h-4 text-violet-500" />
                <h4 className="text-sm font-bold text-slate-900">{d.signalLabel}</h4>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  d.confidence > 0.85 ? "bg-red-100 text-red-700" :
                  d.confidence > 0.7 ? "bg-amber-100 text-amber-700" :
                  "bg-slate-100 text-slate-600"
                }`}>
                  置信度 {(d.confidence * 100).toFixed(0)}%
                </span>
              </div>
              <span className="text-[11px] text-slate-500">
                检测于 {new Date(d.detectedAt).toLocaleDateString("zh-CN")}
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {d.members.map((m) => (
                <Link
                  key={m.id}
                  href={`/crm/clients/${m.id}`}
                  className="block p-2 rounded border border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 text-xs"
                >
                  <div className="font-medium text-slate-800">{m.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{m.uid} · {m.country}</div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
