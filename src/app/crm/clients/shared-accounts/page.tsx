"use client";

/**
 * Shared Accounts — 多客户共享同一支付方式（银行/钱包/卡）.
 */

import { useMemo } from "react";
import Link from "next/link";
import { CreditCard, Coins, Landmark, Wallet, ExternalLink } from "lucide-react";
import { Breadcrumb } from "@/components/crm/layout";
import { PageHeader, Card } from "@/components/crm/ui";
import { generateSharedAccounts, type SharedAccount } from "@/lib/crm/mock-collaboration";

const TYPE_META: Record<SharedAccount["type"], { label: string; icon: typeof CreditCard; bg: string; color: string }> = {
  bank:          { label: "银行账户",  icon: Landmark,    bg: "bg-blue-50",     color: "text-blue-700" },
  crypto_wallet: { label: "加密钱包",  icon: Coins,       bg: "bg-amber-50",    color: "text-amber-700" },
  credit_card:   { label: "信用卡",    icon: CreditCard,  bg: "bg-violet-50",   color: "text-violet-700" },
  e_wallet:      { label: "电子钱包",  icon: Wallet,      bg: "bg-emerald-50",  color: "text-emerald-700" },
};

export default function SharedAccountsPage() {
  const data = useMemo(() => generateSharedAccounts(), []);
  return (
    <>
      <Breadcrumb items={[{ label: "Clients", href: "/crm/clients" }, { label: "共享账户" }]} />
      <PageHeader
        title="共享账户"
        description="多个客户使用同一支付方式（银行卡 / 钱包地址 / 信用卡） — 多账户重要信号"
      />

      <div className="grid grid-cols-4 gap-3 mb-4">
        <Card className="!p-3">
          <p className="text-[10.5px] uppercase tracking-wider text-slate-500">共享条目</p>
          <p className="text-2xl font-bold tabular-nums">{data.length}</p>
        </Card>
        <Card className="!p-3">
          <p className="text-[10.5px] uppercase tracking-wider text-slate-500">涉及账户</p>
          <p className="text-2xl font-bold tabular-nums">
            {data.reduce((s, x) => s + x.members.length, 0)}
          </p>
        </Card>
        <Card className="!p-3">
          <p className="text-[10.5px] uppercase tracking-wider text-slate-500">累计流水</p>
          <p className="text-2xl font-bold text-emerald-700 tabular-nums">
            ${(data.reduce((s, x) => s + x.totalFlow, 0) / 1000).toFixed(0)}k
          </p>
        </Card>
        <Card className="!p-3">
          <p className="text-[10.5px] uppercase tracking-wider text-slate-500">银行 / 钱包 / 卡</p>
          <p className="text-2xl font-bold tabular-nums">
            {data.filter((d) => d.type === "bank").length} / {data.filter((d) => d.type === "crypto_wallet").length} / {data.filter((d) => d.type === "credit_card").length}
          </p>
        </Card>
      </div>

      <Card padding="none">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr className="text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              <th className="px-4 py-2">支付方式</th>
              <th className="px-4 py-2">类型</th>
              <th className="px-4 py-2">共享账户</th>
              <th className="px-4 py-2 text-right">累计流水</th>
              <th className="px-4 py-2 text-right">最近使用</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((s) => {
              const meta = TYPE_META[s.type];
              const Icon = meta.icon;
              return (
                <tr key={s.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-mono text-sm text-slate-800">{s.paymentMethod}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10.5px] ${meta.bg} ${meta.color}`}>
                      <Icon className="w-3 h-3" />
                      {meta.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {s.members.map((m) => (
                        <Link
                          key={m.id}
                          href={`/crm/clients/${m.id}`}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] bg-slate-100 hover:bg-blue-50 hover:text-primary"
                        >
                          {m.name}
                          <span className="text-[9px] text-slate-400">{m.usageCount}×</span>
                        </Link>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-sm font-semibold text-emerald-700">
                    ${(s.totalFlow / 1000).toFixed(0)}k
                  </td>
                  <td className="px-4 py-3 text-right text-[11px] text-slate-500 tabular-nums">
                    {new Date(s.lastUsedAt).toLocaleDateString("zh-CN")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </>
  );
}
