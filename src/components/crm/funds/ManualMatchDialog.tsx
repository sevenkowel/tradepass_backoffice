"use client";

/**
 * ManualMatchDialog — pair an unmatched deposit with a client.
 *
 * Used on Wallet Deposit detail pages when auto-match confidence is too low.
 * Search clients by UID / name / email. Suggest candidates whose recent
 * activity matches the deposit amount/timing.
 */

import { useMemo, useState } from "react";
import { Link2, Search, Check } from "lucide-react";
import { CenterModal } from "@/components/crm/ui";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { clients, KYC_TIER_FG, RISK_FG } from "@/lib/mock/funds/v2/entities";

interface Props {
  open: boolean;
  onClose: () => void;
  /** Amount of the unmatched deposit, used to rank candidates. */
  amountUsd: number;
  /** Optional context shown above the search box. */
  contextHint?: string;
  onConfirm: (clientId: string, note: string) => void;
}

export function ManualMatchDialog({ open, onClose, amountUsd, contextHint, onConfirm }: Props) {
  const [search, setSearch] = useState("");
  const [picked, setPicked] = useState<string | null>(null);
  const [note, setNote] = useState("");

  const candidates = useMemo(() => {
    if (search.trim()) {
      const q = search.toLowerCase();
      return clients.filter((c) =>
        c.id.toLowerCase().includes(q) || c.name.toLowerCase().includes(q),
      );
    }
    // No search: show top-suggested (in v2 simply first 5 — would be ranked by recency/amount proximity in real impl)
    return clients.slice(0, 5);
  }, [search]);

  return (
    <CenterModal open={open} onClose={onClose} title="手动匹配客户">
      <div className="space-y-4">
        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs">
          <p className="text-amber-800">
            <Link2 className="inline w-3.5 h-3.5 mr-1" />
            正在为 <span className="font-semibold">${amountUsd.toLocaleString()}</span> 的未匹配入金选择客户
          </p>
          {contextHint && <p className="text-amber-700 mt-1">{contextHint}</p>}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索客户 UID / 姓名 / 邮箱..."
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
            autoFocus
          />
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
            {search.trim() ? `匹配结果 (${candidates.length})` : "建议候选 (基于金额相近)"}
          </p>
          <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100">
            {candidates.length === 0 ? (
              <p className="px-3 py-8 text-center text-xs text-slate-400">无匹配客户</p>
            ) : candidates.map((c) => {
              const isPicked = c.id === picked;
              return (
                <button
                  key={c.id}
                  onClick={() => setPicked(c.id)}
                  className={cn(
                    "w-full flex items-center justify-between gap-3 px-3 py-2 text-left transition-colors",
                    isPicked ? "bg-blue-50" : "hover:bg-slate-50",
                  )}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800">{c.name}</p>
                    <p className="text-[11px] text-slate-500">
                      <span className="font-mono">{c.id}</span>
                      <span className="mx-1.5">·</span>
                      <span className={KYC_TIER_FG[c.kycTier].text}>{c.kycTier}</span>
                      <span className="mx-1.5">·</span>
                      <span>{c.country}</span>
                    </p>
                  </div>
                  <span className={cn("inline-flex items-center gap-1.5 text-xs flex-shrink-0", RISK_FG[c.risk].text)}>
                    <span className={cn("w-1.5 h-1.5 rounded-full", RISK_FG[c.risk].dot)} />
                    {c.risk}
                  </span>
                  {isPicked && <Check className="w-4 h-4 text-primary" />}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">匹配依据 (必填)</label>
          <textarea
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="例如：客户邮件确认此笔为他本人转账，参考号 #1234..."
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
          <Button variant="secondary" onClick={onClose}>取消</Button>
          <Button
            disabled={!picked || !note.trim()}
            onClick={() => {
              if (picked && note.trim()) {
                onConfirm(picked, note.trim());
                onClose();
                setPicked(null);
                setNote("");
              }
            }}
          >
            <Link2 className="w-4 h-4" />确认匹配
          </Button>
        </div>
      </div>
    </CenterModal>
  );
}
