"use client";

/**
 * ChannelEligibilityDrawer — edit a channel's 7-dim eligibility matrix.
 *
 * Region / KYC Tier / User Tag / User Role / MT Account Type /
 * IB Affiliation (direct OR full subtree) / Registration Source +
 * per-individual Whitelist / Blacklist override.
 *
 * Used on Wallet Channels & Trading Channels list pages.
 */

import { useState } from "react";
import { Drawer, DrawerFooter, Card } from "@/components/crm/ui";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { ibTree, registrationSources } from "@/lib/mock/funds/v2/entities";
import { type Channel } from "@/lib/mock/funds/v2/channels";

const REGIONS = ["US", "GB", "JP", "ID", "MY", "VN", "RU", "AE", "BR", "MX", "TW", "AU"] as const;
const KYC_TIERS = ["Tier1", "Tier2", "Tier3"] as const;
const TAGS = ["VIP", "scalper", "newbie", "high-volume", "high-risk"] as const;
const ROLES = ["Standard Client", "VIP", "IB"] as const;
const MT_TYPES = ["Standard", "Cents", "ECN", "VIP"] as const;

interface Eligibility {
  regions: string[];          // empty = all
  kycTiers: string[];
  tags: string[];
  roles: string[];
  mtTypes: string[];
  ibs: { id: string; mode: "direct" | "full" }[];
  sources: string[];
  whitelist: string[];        // client ids
  blacklist: string[];
}

const DEFAULT_E: Eligibility = {
  regions: [], kycTiers: [], tags: [], roles: [], mtTypes: [], ibs: [], sources: [],
  whitelist: [], blacklist: [],
};

interface Props {
  open: boolean;
  onClose: () => void;
  channel: Channel | null;
}

export function ChannelEligibilityDrawer({ open, onClose, channel }: Props) {
  const [e, setE] = useState<Eligibility>(DEFAULT_E);

  if (!channel) return null;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={`${channel.name} — Eligibility`}
      description="7 维准入矩阵 · 空 = 不限"
      size="lg"
      footer={
        <DrawerFooter>
          <Button variant="secondary" onClick={() => setE(DEFAULT_E)}>清除全部</Button>
          <Button onClick={onClose}>保存</Button>
        </DrawerFooter>
      }
    >
      <div className="space-y-4">
        <ChipGroup label="1. Region (国家/地区)" hint="空 = 全球开放" options={[...REGIONS]}
          values={e.regions} onChange={(v) => setE({ ...e, regions: v })} />

        <ChipGroup label="2. KYC Tier" options={[...KYC_TIERS]}
          values={e.kycTiers} onChange={(v) => setE({ ...e, kycTiers: v })} />

        <ChipGroup label="3. User Tag" options={[...TAGS]}
          values={e.tags} onChange={(v) => setE({ ...e, tags: v })} />

        <ChipGroup label="4. User Role" options={[...ROLES]}
          values={e.roles} onChange={(v) => setE({ ...e, roles: v })} />

        <ChipGroup label="5. MT Account Type" options={[...MT_TYPES]}
          values={e.mtTypes} onChange={(v) => setE({ ...e, mtTypes: v })} />

        {/* IB tree — special: each IB has direct / full toggle */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1.5">6. IB Affiliation</p>
          <p className="text-[10px] text-slate-400 mb-2">每个 IB 选择"直系"或"全树（含子 IB）"</p>
          <div className="space-y-1.5">
            {ibTree.filter((n) => !n.parent).map((root) => {
              const picked = e.ibs.find((x) => x.id === root.id);
              return (
                <div key={root.id} className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-white">
                  <span className="text-xs font-medium flex-1">{root.id} · {root.name}</span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setE({
                        ...e,
                        ibs: picked?.mode === "direct"
                          ? e.ibs.filter((x) => x.id !== root.id)
                          : [...e.ibs.filter((x) => x.id !== root.id), { id: root.id, mode: "direct" }],
                      })}
                      className={cn(
                        "text-[10px] px-2 py-0.5 rounded border",
                        picked?.mode === "direct"
                          ? "bg-blue-50 text-primary border-blue-300"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50",
                      )}
                    >
                      直系
                    </button>
                    <button
                      onClick={() => setE({
                        ...e,
                        ibs: picked?.mode === "full"
                          ? e.ibs.filter((x) => x.id !== root.id)
                          : [...e.ibs.filter((x) => x.id !== root.id), { id: root.id, mode: "full" }],
                      })}
                      className={cn(
                        "text-[10px] px-2 py-0.5 rounded border",
                        picked?.mode === "full"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50",
                      )}
                    >
                      全树
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <ChipGroup label="7. Registration Source" hint="混合：自动聚合 + 营销审批后才入选"
          options={registrationSources.map((s) => s.id)}
          values={e.sources} onChange={(v) => setE({ ...e, sources: v })} />

        {/* Override section */}
        <Card className="!p-3 bg-slate-50/40">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-2">个体 Override</p>
          <div className="space-y-2">
            <div>
              <p className="text-xs text-slate-700 mb-1">Whitelist (强制启用 · {e.whitelist.length})</p>
              <input
                type="text"
                placeholder="USR-12345, USR-23456..."
                className="w-full h-8 px-2 rounded border border-slate-200 text-xs"
                onBlur={(ev) => {
                  const list = ev.currentTarget.value.split(/[,\s]+/).filter(Boolean);
                  setE({ ...e, whitelist: list });
                }}
              />
            </div>
            <div>
              <p className="text-xs text-slate-700 mb-1">Blacklist (强制禁用 · {e.blacklist.length})</p>
              <input
                type="text"
                placeholder="USR-99999..."
                className="w-full h-8 px-2 rounded border border-slate-200 text-xs"
                onBlur={(ev) => {
                  const list = ev.currentTarget.value.split(/[,\s]+/).filter(Boolean);
                  setE({ ...e, blacklist: list });
                }}
              />
            </div>
          </div>
        </Card>
      </div>
    </Drawer>
  );
}

function ChipGroup({ label, hint, options, values, onChange }: {
  label: string; hint?: string; options: string[]; values: string[]; onChange: (v: string[]) => void;
}) {
  const toggle = (v: string) => {
    if (values.includes(v)) onChange(values.filter((x) => x !== v));
    else onChange([...values, v]);
  };
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">{label}</p>
        {hint && <span className="text-[10px] text-slate-400">{hint}</span>}
        {values.length > 0 && <span className="text-[10px] text-primary font-semibold">{values.length} 选中</span>}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => {
          const active = values.includes(o);
          return (
            <button
              key={o}
              onClick={() => toggle(o)}
              className={cn(
                "inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-md border transition-colors",
                active ? "bg-blue-50 text-primary border-blue-300" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50",
              )}
            >
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}
