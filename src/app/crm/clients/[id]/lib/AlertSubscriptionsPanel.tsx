"use client";

/**
 * AlertSubscriptionsPanel — 阈值订阅 + SLA 提醒 (P1-N4 + P2-N10).
 *
 * 让运营给单个客户设置「关键事件触发我」的订阅规则：
 *   - 阈值类（N4）：单笔出金 > $10k / 持仓浮亏 > $1k / 日交易量 > N 手
 *   - SLA 类（N10）：客户 30 / 60 / 90 天未登录时提醒
 *   - 状态类：账户被冻结 / KYC 即将过期 / AML 命中
 *
 * 数据持久化用 localStorage（演示阶段）；接入后端时 swap 成
 * `clientService.upsertSubscription(...)`。
 */

import { useEffect, useState } from "react";
import { Bell, BellOff, AlertTriangle, X } from "lucide-react";

interface AlertSub {
  id: string;
  /** label for UI display. */
  label: string;
  enabled: boolean;
  /** Optional threshold value (USD amount, days, etc). */
  threshold?: number;
}

const STORAGE_PREFIX = "crm:client-detail:alerts:";

function loadSubs(clientId: string): AlertSub[] {
  if (typeof window === "undefined") return DEFAULT_SUBS;
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + clientId);
    return raw ? (JSON.parse(raw) as AlertSub[]) : DEFAULT_SUBS;
  } catch {
    return DEFAULT_SUBS;
  }
}

function saveSubs(clientId: string, subs: AlertSub[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_PREFIX + clientId, JSON.stringify(subs));
  } catch { /* ignore */ }
}

const DEFAULT_SUBS: AlertSub[] = [
  { id: "withdrawal-large",  label: "单笔出金 > $X",    enabled: false, threshold: 10_000 },
  { id: "trading-volume",    label: "日交易量 > N 手",  enabled: false, threshold: 50 },
  { id: "floating-loss",     label: "持仓浮亏 > $X",    enabled: false, threshold: 1_000 },
  { id: "inactive-30d",      label: "30 天未登录",      enabled: false },
  { id: "inactive-90d",      label: "90 天未登录",      enabled: false },
  { id: "kyc-expiring",      label: "KYC 文档即将过期",  enabled: true },
  { id: "account-frozen",    label: "账户被冻结",        enabled: true },
  { id: "aml-hit",           label: "AML 名单命中",     enabled: true },
];

export function AlertSubscriptionsPanel({ clientId }: { clientId: string }) {
  const [subs, setSubs] = useState<AlertSub[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setSubs(loadSubs(clientId));
  }, [clientId]);

  const activeCount = subs.filter((s) => s.enabled).length;

  const toggle = (id: string) => {
    setSubs((prev) => {
      const next = prev.map((s) => s.id === id ? { ...s, enabled: !s.enabled } : s);
      saveSubs(clientId, next);
      return next;
    });
  };

  const updateThreshold = (id: string, value: number) => {
    setSubs((prev) => {
      const next = prev.map((s) => s.id === id ? { ...s, threshold: value } : s);
      saveSubs(clientId, next);
      return next;
    });
  };

  return (
    <div className="text-xs">
      <button
        onClick={() => setOpen(true)}
        className="w-full inline-flex items-center justify-between gap-2 px-2.5 h-7 rounded-md border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
        title="管理该客户的告警订阅"
      >
        <span className="flex items-center gap-1.5">
          {activeCount > 0 ? (
            <Bell className="w-3 h-3 text-amber-500" />
          ) : (
            <BellOff className="w-3 h-3 text-slate-300" />
          )}
          <span className="text-slate-700">告警订阅</span>
        </span>
        <span className="text-[10.5px] tabular-nums text-slate-400">{activeCount} / {subs.length}</span>
      </button>

      {open && (
        <SubsDialog
          subs={subs}
          onToggle={toggle}
          onChangeThreshold={updateThreshold}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}

function SubsDialog({
  subs, onToggle, onChangeThreshold, onClose,
}: {
  subs: AlertSub[];
  onToggle: (id: string) => void;
  onChangeThreshold: (id: string, v: number) => void;
  onClose: () => void;
}) {
  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm" />
      <div className="fixed left-1/2 top-[15vh] -translate-x-1/2 z-50 w-[480px] max-w-[90vw] bg-white rounded-xl border border-slate-200 shadow-2xl">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
              <Bell className="w-4 h-4 text-amber-500" />
              告警订阅
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">触发任一规则时，您会收到内部通知</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>

        <ul className="max-h-[60vh] overflow-y-auto divide-y divide-slate-100">
          {subs.map((s) => (
            <li key={s.id} className="px-5 py-3 flex items-center gap-3">
              <input
                type="checkbox"
                checked={s.enabled}
                onChange={() => onToggle(s.id)}
                className="rounded"
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm text-slate-800">{s.label}</div>
                {s.threshold !== undefined && s.enabled && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[10.5px] text-slate-400">阈值</span>
                    <input
                      type="number"
                      value={s.threshold}
                      onChange={(e) => onChangeThreshold(s.id, Number(e.target.value))}
                      className="h-6 px-1.5 w-24 text-xs border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    />
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>

        <div className="px-5 py-3 border-t border-slate-100 flex items-center gap-2 bg-amber-50/40">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
          <p className="text-[11px] text-amber-700">
            订阅仅对当前账号（你自己）生效，团队级订阅请到 设置 → 团队通知中心。
          </p>
        </div>

        <div className="px-5 py-3 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="h-8 px-4 bg-slate-900 text-white text-xs font-medium rounded-md hover:bg-slate-800"
          >
            完成
          </button>
        </div>
      </div>
    </>
  );
}
