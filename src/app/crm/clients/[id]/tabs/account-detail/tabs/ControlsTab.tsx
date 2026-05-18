"use client";

/**
 * Risk & Controls Tab — 账户运营工作台的灵魂模块
 *
 * 4 个分组：
 *   1. Trading Controls    交易控制 — 总闸 / EA / Hedging / 白名单 / 单笔上限
 *   2. Financial Controls  财务控制 — 入金 / 出金 / 转账 / 日上限
 *   3. Risk Controls       风险控制 — 自定义保证金阈值 / 最大持仓 / 强平规则
 *   4. Compliance Controls 合规控制 — 只读 / AML / KYC 重审
 *
 * 交互机制：
 *   - 每个开关右侧显示「最近改动者 + 时间」，鼠标 hover 提示原因。
 *   - 切换前弹出 ConfirmDialog，强制填写「变更原因」才允许提交。
 *   - 提交后追加一条 AccountControlLog 到操作日志，UI 立刻刷新。
 *
 * 一切都是「写操作 + 审计」，这就是运营和客户端 UI 的核心差别。
 */

import { useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle, Check, ChevronDown, History, Lock, Settings as Cog,
  ShieldCheck, X,
} from "lucide-react";
import type {
  TradingAccount, AccountControls, AccountControlLog,
  ControlToggle, ControlValue, RiskAlert,
} from "@/types/backoffice/client-detail";
import { Card, Section, Empty, timeAgo } from "../primitives";

interface Props {
  account: TradingAccount;
  controls: AccountControls;
  logs: AccountControlLog[];
  riskAlerts: RiskAlert[];
  onChange: (
    next: AccountControls,
    log: Omit<AccountControlLog, "id" | "timestamp" | "accountId">,
  ) => void;
}

/** 当前操作员（演示用 — 实际应来自 session）。 */
const CURRENT_OPERATOR = "Alice Chen";
const CURRENT_ROLE = "Risk Officer";

type PendingChange = {
  controlKey: keyof AccountControls;
  controlLabel: string;
  oldValue: string;
  newValue: string;
  /** 用户最终提交时调用，把新的 controls 给父组件。 */
  commit: (reason: string) => void;
  /** 是否危险操作（红色按钮）。 */
  danger?: boolean;
};

export function ControlsTab({ account, controls, logs, riskAlerts, onChange }: Props) {
  const [pending, setPending] = useState<PendingChange | null>(null);
  const [showLog, setShowLog] = useState(false);

  /** 工具：切换布尔开关。 */
  const toggleControl = (
    key: keyof AccountControls,
    label: string,
    danger?: boolean,
  ) => {
    const current = controls[key] as ControlToggle;
    const newVal = !current.value;
    setPending({
      controlKey: key,
      controlLabel: label,
      oldValue: current.value ? "开" : "关",
      newValue: newVal ? "开" : "关",
      danger,
      commit: (reason) => {
        const updated: AccountControls = {
          ...controls,
          [key]: {
            value: newVal,
            changedBy: CURRENT_OPERATOR,
            changedAt: new Date().toISOString(),
            reason,
          } as ControlToggle,
        };
        onChange(updated, {
          controlKey: String(key),
          operator: CURRENT_OPERATOR,
          operatorRole: CURRENT_ROLE,
          oldValue: String(current.value),
          newValue: String(newVal),
          reason,
        });
        setPending(null);
      },
    });
  };

  /** 工具：更新带值的开关（如 dailyWithdrawalCap）。 */
  const updateValue = <T,>(
    key: keyof AccountControls,
    label: string,
    newVal: T,
  ) => {
    const current = controls[key] as ControlValue<T>;
    setPending({
      controlKey: key,
      controlLabel: label,
      oldValue: String(current.value ?? "—"),
      newValue: String(newVal ?? "—"),
      commit: (reason) => {
        const updated: AccountControls = {
          ...controls,
          [key]: {
            value: newVal,
            changedBy: CURRENT_OPERATOR,
            changedAt: new Date().toISOString(),
            reason,
          } as ControlValue<T>,
        };
        onChange(updated, {
          controlKey: String(key),
          operator: CURRENT_OPERATOR,
          operatorRole: CURRENT_ROLE,
          oldValue: String(current.value),
          newValue: String(newVal),
          reason,
        });
        setPending(null);
      },
    });
  };

  return (
    <div>
      {/* Top alert banner */}
      {riskAlerts.length > 0 && (
        <div className="mb-4 px-3 py-2.5 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
          <div className="flex-1 text-xs">
            <div className="font-semibold text-red-800">
              {riskAlerts.length} active risk alert{riskAlerts.length > 1 ? "s" : ""} — review before changing controls.
            </div>
            <div className="text-red-700 mt-1 space-y-0.5">
              {riskAlerts.map((a) => (
                <div key={a.id}>· {a.message}</div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Header with operation log toggle */}
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs text-slate-500">
          All control changes require a reason and are written to the audit log.
          <span className="text-slate-400 ml-1">Operator:</span>
          <span className="font-medium text-slate-700 ml-1">{CURRENT_OPERATOR}</span>
          <span className="text-slate-400 ml-1">/ {CURRENT_ROLE}</span>
        </div>
        <button
          onClick={() => setShowLog((v) => !v)}
          className="h-7 px-2.5 text-xs font-medium rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 inline-flex items-center gap-1.5"
        >
          <History className="w-3.5 h-3.5" />
          Operation Log ({logs.length})
        </button>
      </div>

      {/* 4 control groups in a 2x2 grid on wide, 1 col on narrow */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TradingControlsCard
          controls={controls}
          toggle={toggleControl}
          setValue={updateValue}
        />
        <FinancialControlsCard
          controls={controls}
          toggle={toggleControl}
          setValue={updateValue}
          accountCurrency={account.currency}
        />
        <RiskControlsCard
          controls={controls}
          setValue={updateValue}
        />
        <ComplianceControlsCard
          controls={controls}
          toggle={toggleControl}
        />
      </div>

      {/* Operation log drawer */}
      {showLog && (
        <Card className="mt-4">
          <Section title="Operation Log">
            {logs.length === 0 ? <Empty>No control changes yet</Empty> : (
              <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
                {logs.map((l) => (
                  <div key={l.id} className="flex items-start gap-2 py-2 border-b border-slate-100 last:border-b-0 text-xs">
                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                      <Cog className="w-3 h-3 text-slate-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-1.5 flex-wrap">
                        <span className="font-medium text-slate-800">{l.controlKey}</span>
                        <span className="text-slate-400">·</span>
                        <span className="text-slate-600">
                          <span className="font-mono">{l.oldValue}</span>
                          <span className="text-slate-400 mx-1">→</span>
                          <span className="font-mono font-semibold">{l.newValue}</span>
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        <span className="text-slate-700">{l.operator}</span>
                        {l.operatorRole && <span className="text-slate-400"> · {l.operatorRole}</span>}
                        <span className="text-slate-400"> · {timeAgo(l.timestamp)}</span>
                      </div>
                      <div className="text-[11px] text-slate-600 italic mt-0.5">「{l.reason}」</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>
        </Card>
      )}

      {pending && (
        <ConfirmDialog
          pending={pending}
          onCancel={() => setPending(null)}
        />
      )}
    </div>
  );
}

/* ===================================================================== */
/* Group cards                                                            */
/* ===================================================================== */

function TradingControlsCard({
  controls, toggle, setValue,
}: {
  controls: AccountControls;
  toggle: (key: keyof AccountControls, label: string, danger?: boolean) => void;
  setValue: <T>(key: keyof AccountControls, label: string, val: T) => void;
}) {
  const [lotInput, setLotInput] = useState(controls.maxLotSize.value.toString());
  const [whitelistOpen, setWhitelistOpen] = useState(false);

  return (
    <Card>
      <CardHeader icon={<Cog className="w-4 h-4 text-blue-600" />} title="Trading Controls" />
      <div className="space-y-1">
        <ToggleRow
          label="Trading Enabled"
          desc="When off, client cannot open or close positions. Existing positions remain."
          control={controls.tradingEnabled}
          danger
          onChange={() => toggle("tradingEnabled", "Trading Enabled", true)}
        />
        <ToggleRow
          label="Allow EA / Automation"
          desc="When off, all expert advisor orders are rejected."
          control={controls.allowEA}
          onChange={() => toggle("allowEA", "Allow EA / Automation")}
        />
        <ToggleRow
          label="Allow Hedging"
          desc="When off, the account can only hold netted positions."
          control={controls.allowHedging}
          onChange={() => toggle("allowHedging", "Allow Hedging")}
        />
        <ValueRow
          label="Max Lot Size per Order"
          desc={controls.maxLotSize.value === 0 ? "Unlimited" : `Cap: ${controls.maxLotSize.value} lots`}
          control={controls.maxLotSize}
        >
          <div className="flex items-center gap-1">
            <input
              type="number"
              value={lotInput}
              onChange={(e) => setLotInput(e.target.value)}
              className="h-7 w-20 px-2 text-xs border border-slate-200 rounded text-right tabular-nums"
              placeholder="0=∞"
            />
            <button
              onClick={() => setValue("maxLotSize", "Max Lot Size per Order", Number(lotInput) || 0)}
              disabled={Number(lotInput) === controls.maxLotSize.value}
              className="h-7 px-2 text-xs bg-slate-100 text-slate-700 rounded hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Update
            </button>
          </div>
        </ValueRow>
        <div className="py-2 border-b border-slate-100 last:border-b-0">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium text-slate-700">Symbol Whitelist</div>
              <div className="text-[11px] text-slate-500">
                {controls.symbolWhitelist.length === 0
                  ? "Not enforced — all symbols allowed"
                  : `${controls.symbolWhitelist.length} symbols allowed`}
              </div>
            </div>
            <button
              onClick={() => setWhitelistOpen((v) => !v)}
              className="h-7 px-2 text-xs text-slate-600 hover:bg-slate-100 rounded inline-flex items-center gap-1"
            >
              <ChevronDown className={`w-3 h-3 transition-transform ${whitelistOpen ? "rotate-180" : ""}`} />
              {whitelistOpen ? "Hide" : "View"}
            </button>
          </div>
          {whitelistOpen && controls.symbolWhitelist.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {controls.symbolWhitelist.map((s) => (
                <span key={s} className="px-1.5 py-0.5 text-[11px] bg-slate-100 text-slate-700 rounded font-mono">
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

function FinancialControlsCard({
  controls, toggle, setValue, accountCurrency,
}: {
  controls: AccountControls;
  toggle: (key: keyof AccountControls, label: string, danger?: boolean) => void;
  setValue: <T>(key: keyof AccountControls, label: string, val: T) => void;
  accountCurrency: string;
}) {
  const [capInput, setCapInput] = useState(controls.dailyWithdrawalCap.value.toString());
  return (
    <Card>
      <CardHeader icon={<Cog className="w-4 h-4 text-emerald-600" />} title="Financial Controls" />
      <div className="space-y-1">
        <ToggleRow
          label="Deposit Enabled"
          desc="When off, client cannot initiate deposits."
          control={controls.depositEnabled}
          onChange={() => toggle("depositEnabled", "Deposit Enabled")}
        />
        <ToggleRow
          label="Withdrawal Enabled"
          desc="When off, all withdrawal requests are rejected."
          control={controls.withdrawalEnabled}
          danger
          onChange={() => toggle("withdrawalEnabled", "Withdrawal Enabled", true)}
        />
        <ToggleRow
          label="Internal Transfer Enabled"
          desc="When off, the client cannot transfer between their own accounts."
          control={controls.transferEnabled}
          onChange={() => toggle("transferEnabled", "Internal Transfer Enabled")}
        />
        <ValueRow
          label="Daily Withdrawal Cap"
          desc={controls.dailyWithdrawalCap.value === 0 ? "No cap" : `${controls.dailyWithdrawalCap.value.toLocaleString()} ${accountCurrency} / day`}
          control={controls.dailyWithdrawalCap}
        >
          <div className="flex items-center gap-1">
            <input
              type="number"
              value={capInput}
              onChange={(e) => setCapInput(e.target.value)}
              className="h-7 w-24 px-2 text-xs border border-slate-200 rounded text-right tabular-nums"
              placeholder="0=∞"
            />
            <button
              onClick={() => setValue("dailyWithdrawalCap", "Daily Withdrawal Cap", Number(capInput) || 0)}
              disabled={Number(capInput) === controls.dailyWithdrawalCap.value}
              className="h-7 px-2 text-xs bg-slate-100 text-slate-700 rounded hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Update
            </button>
          </div>
        </ValueRow>
      </div>
    </Card>
  );
}

function RiskControlsCard({
  controls, setValue,
}: {
  controls: AccountControls;
  setValue: <T>(key: keyof AccountControls, label: string, val: T) => void;
}) {
  const [marginInput, setMarginInput] = useState(controls.customMarginCallLevel.value?.toString() ?? "");
  const [stopoutInput, setStopoutInput] = useState(controls.customStopoutLevel.value?.toString() ?? "");
  const [maxPosInput, setMaxPosInput] = useState(controls.maxOpenPositions.value?.toString() ?? "");

  return (
    <Card>
      <CardHeader icon={<ShieldCheck className="w-4 h-4 text-amber-600" />} title="Risk Controls" />
      <div className="space-y-1">
        <ValueRow
          label="Custom Margin Call Level (%)"
          desc={controls.customMarginCallLevel.value == null
            ? "Using system default 100%"
            : `Override active at ${controls.customMarginCallLevel.value}%`}
          control={controls.customMarginCallLevel}
        >
          <div className="flex items-center gap-1">
            <input
              type="number"
              value={marginInput}
              onChange={(e) => setMarginInput(e.target.value)}
              className="h-7 w-20 px-2 text-xs border border-slate-200 rounded text-right tabular-nums"
              placeholder="100"
            />
            <button
              onClick={() => setValue<number | null>("customMarginCallLevel", "Custom Margin Call Level",
                marginInput === "" ? null : Number(marginInput),
              )}
              className="h-7 px-2 text-xs bg-slate-100 text-slate-700 rounded hover:bg-slate-200"
            >
              Update
            </button>
          </div>
        </ValueRow>
        <ValueRow
          label="Custom Stopout Level (%)"
          desc={controls.customStopoutLevel.value == null
            ? "Using system default 50%"
            : `Override active at ${controls.customStopoutLevel.value}%`}
          control={controls.customStopoutLevel}
        >
          <div className="flex items-center gap-1">
            <input
              type="number"
              value={stopoutInput}
              onChange={(e) => setStopoutInput(e.target.value)}
              className="h-7 w-20 px-2 text-xs border border-slate-200 rounded text-right tabular-nums"
              placeholder="50"
            />
            <button
              onClick={() => setValue<number | null>("customStopoutLevel", "Custom Stopout Level",
                stopoutInput === "" ? null : Number(stopoutInput),
              )}
              className="h-7 px-2 text-xs bg-slate-100 text-slate-700 rounded hover:bg-slate-200"
            >
              Update
            </button>
          </div>
        </ValueRow>
        <ValueRow
          label="Max Open Positions"
          desc={controls.maxOpenPositions.value == null ? "No limit" : `Cap: ${controls.maxOpenPositions.value} positions`}
          control={controls.maxOpenPositions}
        >
          <div className="flex items-center gap-1">
            <input
              type="number"
              value={maxPosInput}
              onChange={(e) => setMaxPosInput(e.target.value)}
              className="h-7 w-20 px-2 text-xs border border-slate-200 rounded text-right tabular-nums"
              placeholder="∞"
            />
            <button
              onClick={() => setValue<number | null>("maxOpenPositions", "Max Open Positions",
                maxPosInput === "" ? null : Number(maxPosInput),
              )}
              className="h-7 px-2 text-xs bg-slate-100 text-slate-700 rounded hover:bg-slate-200"
            >
              Update
            </button>
          </div>
        </ValueRow>
        <ValueRow
          label="Liquidation Policy"
          desc={controls.liquidationPolicy.value === "fifo" ? "FIFO — close oldest first"
              : controls.liquidationPolicy.value === "largest_first" ? "Largest position first"
              : "Manual selection"}
          control={controls.liquidationPolicy}
        >
          <select
            value={controls.liquidationPolicy.value}
            onChange={(e) => setValue<"fifo" | "largest_first" | "manual">(
              "liquidationPolicy", "Liquidation Policy",
              e.target.value as "fifo" | "largest_first" | "manual",
            )}
            className="h-7 px-2 text-xs border border-slate-200 rounded bg-white"
          >
            <option value="fifo">FIFO</option>
            <option value="largest_first">Largest first</option>
            <option value="manual">Manual</option>
          </select>
        </ValueRow>
      </div>
    </Card>
  );
}

function ComplianceControlsCard({
  controls, toggle,
}: {
  controls: AccountControls;
  toggle: (key: keyof AccountControls, label: string, danger?: boolean) => void;
}) {
  return (
    <Card>
      <CardHeader icon={<Lock className="w-4 h-4 text-violet-600" />} title="Compliance Controls" />
      <div className="space-y-1">
        <ToggleRow
          label="Read-only Mode"
          desc="Client can log in and view, but cannot initiate any action."
          control={controls.readonly}
          onChange={() => toggle("readonly", "Read-only Mode")}
        />
        <ToggleRow
          label="AML Elevated"
          desc="Flag as high-risk — all withdrawals require Compliance review."
          control={controls.amlElevated}
          danger
          onChange={() => toggle("amlElevated", "AML Elevated", true)}
        />
        <ToggleRow
          label="Force KYC Re-review"
          desc="Client will be required to resubmit KYC documents on next login."
          control={controls.kycReviewRequired}
          onChange={() => toggle("kycReviewRequired", "Force KYC Re-review")}
        />
      </div>
    </Card>
  );
}

/* ===================================================================== */
/* Row primitives                                                         */
/* ===================================================================== */

function CardHeader({
  icon, title,
}: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-3">
      {icon}
      <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
    </div>
  );
}

function ToggleRow({
  label, desc, control, onChange, danger = false,
}: {
  label: string;
  desc?: string;
  control: ControlToggle;
  onChange: () => void;
  danger?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3 py-2 border-b border-slate-100 last:border-b-0">
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-medium text-slate-700">{label}</span>
          {control.changedBy && (
            <span
              className="text-[10px] text-slate-400"
              title={control.reason ? `Reason: ${control.reason}` : ""}
            >
              by {control.changedBy}, {timeAgo(control.changedAt ?? new Date().toISOString())}
            </span>
          )}
        </div>
        {desc && <div className="text-[11px] text-slate-500 mt-0.5">{desc}</div>}
      </div>
      <button
        onClick={onChange}
        className={`shrink-0 relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
          control.value ? (danger ? "bg-red-500" : "bg-blue-600") : "bg-slate-200"
        }`}
        role="switch"
        aria-checked={control.value}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            control.value ? "translate-x-4" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}

function ValueRow({
  label, desc, control, children,
}: {
  label: string;
  desc?: string;
  control: ControlValue<unknown>;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 py-2 border-b border-slate-100 last:border-b-0">
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-medium text-slate-700">{label}</span>
          {control.changedBy && (
            <span
              className="text-[10px] text-slate-400"
              title={control.reason ? `Reason: ${control.reason}` : ""}
            >
              by {control.changedBy}, {timeAgo(control.changedAt ?? new Date().toISOString())}
            </span>
          )}
        </div>
        {desc && <div className="text-[11px] text-slate-500 mt-0.5">{desc}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

/* ===================================================================== */
/* ConfirmDialog — 二次确认 + 必填原因                                    */
/* ===================================================================== */

function ConfirmDialog({
  pending, onCancel,
}: {
  pending: PendingChange;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState("");
  const valid = reason.trim().length >= 5;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            pending.danger ? "bg-red-100" : "bg-amber-100"
          }`}>
            <AlertTriangle className={`w-4 h-4 ${pending.danger ? "text-red-600" : "text-amber-600"}`} />
          </div>
          <h3 className="text-base font-semibold text-slate-900">Confirm change</h3>
        </div>

        <div className="bg-slate-50 rounded-lg px-3 py-2.5 mb-4">
          <div className="text-xs text-slate-500">{pending.controlLabel}</div>
          <div className="text-sm font-medium text-slate-800 mt-0.5">
            <span className="font-mono">{pending.oldValue}</span>
            <span className="text-slate-400 mx-2">→</span>
            <span className={`font-mono font-bold ${pending.danger ? "text-red-700" : "text-blue-700"}`}>
              {pending.newValue}
            </span>
          </div>
        </div>

        <label className="block">
          <div className="text-xs font-medium text-slate-700 mb-1.5">
            Reason <span className="text-red-500">*</span>
            <span className="text-[10px] text-slate-400 ml-1">(min. 5 characters — written to audit log)</span>
          </div>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="e.g. Client emailed to disable withdrawals / Risk alert #1234 triggered / …"
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            autoFocus
          />
        </label>

        <div className="flex items-center justify-end gap-2 mt-4">
          <button
            onClick={onCancel}
            className="h-8 px-3 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-md inline-flex items-center gap-1.5"
          >
            <X className="w-3.5 h-3.5" />
            Cancel
          </button>
          <button
            onClick={() => valid && pending.commit(reason.trim())}
            disabled={!valid}
            className={`h-8 px-3 text-sm font-semibold rounded-md inline-flex items-center gap-1.5 transition-colors ${
              !valid ? "bg-slate-200 text-slate-400 cursor-not-allowed"
              : pending.danger ? "bg-red-600 text-white hover:bg-red-700"
              : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            <Check className="w-3.5 h-3.5" />
            Confirm
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
