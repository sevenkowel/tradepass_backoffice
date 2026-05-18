"use client";

/**
 * RelationshipNetworkTab — 客户关系网络（2026-05-17 重写）.
 *
 * 定位：
 *   - 这里是「列表化关系视图」—— 跟该客户有关联的其它客户（同 IP / 设备 /
 *     银行 / 钱包 / 同名 / 同证件 / IB 邀请 等）
 *   - 数据底层与「全局用户图谱」(/crm/clients/relationships) 完全一致 —
 *     都基于 RiskRelationship / ClientGraphEdge 概念，只是这里更聚焦"该
 *     客户为中心"的 1 跳关系，且渲染为可排序列表，方便逐条复核
 *   - 完整的可视化图谱（多跳节点 + 力导图）请走右上「在图谱中查看 →」按钮
 *
 * 与图谱页的功能分工：
 *   ┌────────────────┬────────────────────────────────────────────┐
 *   │ 本 Tab         │ 列表 · 单客户视角 · 1 跳关系 · 表格排序        │
 *   │ 图谱页         │ 力导图 · 多客户集群 · N 跳关系 · 节点点击导航 │
 *   └────────────────┴────────────────────────────────────────────┘
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Users, AlertTriangle, Wifi, CreditCard, Coins, Fingerprint, Smartphone,
  Network, ExternalLink,
  type LucideIcon,
} from "lucide-react";
import type { BaseTabProps } from "@/types/backoffice/client";
import type { RiskRelationship } from "@/types/backoffice/client-detail";

const KIND_META: Record<RiskRelationship["relationshipType"], { label: string; icon: LucideIcon; tone: string }> = {
  shared_ip:            { label: "共享 IP",      icon: Wifi,        tone: "bg-amber-50 text-amber-700" },
  shared_device:        { label: "共享设备",     icon: Smartphone,  tone: "bg-amber-50 text-amber-700" },
  shared_bank:          { label: "共享银行卡",   icon: CreditCard,  tone: "bg-red-50 text-red-700" },
  shared_crypto_wallet: { label: "共享钱包",     icon: Coins,       tone: "bg-red-50 text-red-700" },
  same_name:            { label: "同名",         icon: Fingerprint, tone: "bg-slate-100 text-slate-700" },
};

export default function RelationshipNetworkTab({ data }: BaseTabProps) {
  const { riskRelationships, user } = data;

  const [filter, setFilter] = useState<"all" | RiskRelationship["relationshipType"]>("all");

  const filtered = useMemo(
    () => filter === "all" ? riskRelationships : riskRelationships.filter((r) => r.relationshipType === filter),
    [riskRelationships, filter],
  );

  const grouped = useMemo(() => {
    const m = new Map<RiskRelationship["relationshipType"], number>();
    for (const r of riskRelationships) {
      m.set(r.relationshipType, (m.get(r.relationshipType) ?? 0) + 1);
    }
    return m;
  }, [riskRelationships]);

  const highStrength = riskRelationships.filter((r) => r.strength >= 0.7).length;

  return (
    <div className="space-y-4">
      {/* 标题 + 跳转图谱 */}
      <div className="flex items-baseline justify-between gap-4 flex-wrap">
        <div>
          <h3 className="text-base font-semibold text-slate-900 mb-0.5">关系网络</h3>
          <p className="text-xs text-slate-500">
            {riskRelationships.length === 0
              ? "该客户与平台其它账户未检测到关联"
              : <>
                  共 {riskRelationships.length} 个 1 跳关联
                  {highStrength > 0 && (
                    <span className="text-red-700"> · {highStrength} 个强关联（≥70%）</span>
                  )}
                </>
            }
          </p>
        </div>
        <Link
          href={`/crm/clients/relationships?clientId=${user.id}`}
          className="inline-flex items-center gap-1.5 px-3 h-8 rounded-md text-xs font-medium text-primary border border-blue-200 hover:bg-blue-50 transition-colors"
          title="打开力导图查看多跳关系网络"
        >
          <Network className="w-3.5 h-3.5" />
          在图谱中查看
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      {/* 帮助说明 */}
      <details className="rounded-lg border border-slate-100 bg-slate-50/60 overflow-hidden">
        <summary className="px-3 py-1.5 cursor-pointer text-[11px] text-slate-500 hover:bg-slate-100/60 list-none">
          这个 Tab 跟「图谱」是什么关系？
        </summary>
        <div className="px-3 pb-2 pt-1 text-[11px] text-slate-600 leading-relaxed space-y-1">
          <p>
            <b>本 Tab（列表）</b>：以当前客户为中心，1 跳直接关联的账户。表格化呈现，
            方便逐条审查关联类型、强度、检测时间。
          </p>
          <p>
            <b>图谱页</b>：跨客户的多跳网络力导图，能看到关联客户的关联客户，
            适合发现农场账户群 / 资金洗钱链路。
          </p>
          <p className="text-slate-400">
            两者数据来源一致（RiskRelationship · ClientGraphEdge），是同一引擎的不同视图。
          </p>
        </div>
      </details>

      {riskRelationships.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white py-16 text-center text-sm text-slate-400">
          未检测到关联客户 — 该客户独立无网络关联
        </div>
      ) : (
        <>
          {/* 关系类型 chips */}
          <div className="inline-flex bg-slate-100 rounded-lg p-0.5 flex-wrap max-w-full">
            <FilterButton label="全部" count={riskRelationships.length} active={filter === "all"} onClick={() => setFilter("all")} />
            {(Array.from(grouped.entries())).map(([kind, count]) => (
              <FilterButton
                key={kind}
                label={KIND_META[kind].label}
                count={count}
                active={filter === kind}
                onClick={() => setFilter(kind)}
              />
            ))}
          </div>

          {/* 关系列表 */}
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-2">关联客户</th>
                  <th className="px-4 py-2">关联类型</th>
                  <th className="px-4 py-2 text-right">关联强度</th>
                  <th className="px-4 py-2">详情</th>
                  <th className="px-4 py-2 text-right">检测时间</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((rel) => {
                  const meta = KIND_META[rel.relationshipType];
                  const Icon = meta.icon;
                  const isStrong = rel.strength >= 0.7;
                  return (
                    <tr key={`${rel.targetClientId}-${rel.relationshipType}`} className="hover:bg-slate-50">
                      <td className="px-4 py-2.5">
                        <Link
                          href={`/crm/clients/${rel.targetClientId}`}
                          className="flex items-center gap-2 group"
                          title="打开关联客户详情"
                        >
                          <Users className="w-3.5 h-3.5 text-slate-400 group-hover:text-primary shrink-0" />
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-slate-800 group-hover:text-primary truncate">
                              {rel.targetClientName}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">{rel.targetClientId}</div>
                          </div>
                        </Link>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10.5px] font-medium ${meta.tone}`}>
                          <Icon className="w-3 h-3" />
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <div className="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${isStrong ? "bg-red-500" : rel.strength >= 0.4 ? "bg-amber-500" : "bg-slate-400"}`}
                              style={{ width: `${rel.strength * 100}%` }}
                            />
                          </div>
                          <span className={`text-xs tabular-nums font-mono ${isStrong ? "text-red-700 font-semibold" : "text-slate-600"}`}>
                            {(rel.strength * 100).toFixed(0)}%
                          </span>
                          {isStrong && <AlertTriangle className="w-3 h-3 text-red-500" />}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-slate-600 truncate max-w-xs">{rel.details}</td>
                      <td className="px-4 py-2.5 text-xs text-slate-500 text-right tabular-nums">
                        {new Date(rel.detectedAt).toLocaleDateString("zh-CN")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function FilterButton({ label, count, active, onClick }: {
  label: string; count: number; active: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 h-7 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
        active ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
      }`}
    >
      <span>{label}</span>
      <span className="text-[10px] tabular-nums text-slate-400">{count}</span>
    </button>
  );
}
