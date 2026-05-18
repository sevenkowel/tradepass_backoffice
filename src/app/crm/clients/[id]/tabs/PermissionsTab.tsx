"use client";

/**
 * PermissionsTab — v2 客户级控制中心 (2026-05-15).
 *
 * 区别于交易账户工作台的「Risk & Controls Tab」（账户级控制），
 * 这里管理的是**客户级**全局控制，影响该客户的**所有**交易账户：
 *
 *   - Access Control（访问）：登录 / 交易 / 数据可见性
 *   - Fund Permissions（资金）：入金 / 出金 / 转账
 *   - Compliance Requirements（合规）：只读 / 重审 KYC / AML 升级
 *
 * 每个开关都跟账户级 Controls 一致的 UX：
 *   - 右侧显示当前状态 + 最近改动者/时间（hover 看完整原因）
 *   - 切换前弹强制确认 dialog（≥5 字符原因 + 写入操作日志）
 *   - 危险操作（禁用登录/交易/出金/AML）红色按钮
 */

import { useState } from "react";
import { createPortal } from "react-dom";
import {
  Lock, ShieldCheck, Wallet, Users, AlertTriangle,
  Check, X, History, type LucideIcon,
} from "lucide-react";
import type { BaseTabProps } from "@/types/backoffice/client";

/* ===================================================================== */
/* 数据模型（内联 — P1 阶段快速落地，P2 阶段可提到类型层）                */
/* ===================================================================== */

type Category = "access" | "fund" | "compliance";

interface ClientControl {
  key: string;
  label: string;
  desc: string;
  value: boolean;
  category: Category;
  /** 是否破坏性 — 切换弹红色按钮 */
  danger?: boolean;
  /** 最近审计 */
  changedBy?: string;
  changedAt?: string;
  reason?: string;
}

interface ControlLog {
  id: string;
  controlKey: string;
  controlLabel: string;
  operator: string;
  operatorRole: string;
  oldValue: string;
  newValue: string;
  reason: string;
  timestamp: string;
}

/** 演示用 — 实际从 session 取 */
const CURRENT_OPERATOR = "Alice Chen";
const CURRENT_ROLE = "Risk Officer";

/* ===================================================================== */
/* 初始 6 个 critical 客户级开关                                          */
/* ===================================================================== */

function initialControls(opts: { kycStatus: string; status: string }): ClientControl[] {
  const isActive = opts.status === "active";
  return [
    {
      key: "loginAllowed",
      label: "允许登录",
      desc: "禁用后客户无法登录任何前端入口（Web / App / MT 终端）",
      value: isActive,
      category: "access",
      danger: true,
    },
    {
      key: "tradingAllowed",
      label: "允许交易",
      desc: "全局交易开关 — 影响该客户所有交易账户。账户级仍可独立关闭",
      value: isActive,
      category: "access",
      danger: true,
    },
    {
      key: "depositAllowed",
      label: "允许入金",
      desc: "禁用后客户无法发起任何入金请求",
      value: true,
      category: "fund",
    },
    {
      key: "withdrawalAllowed",
      label: "允许出金",
      desc: "禁用后所有出金请求被拒绝（含已审批未到账的）",
      value: isActive,
      category: "fund",
      danger: true,
    },
    {
      key: "readonlyMode",
      label: "只读模式",
      desc: "客户能登录查看数据，但所有操作按钮被禁用",
      value: false,
      category: "compliance",
    },
    {
      key: "kycReviewRequired",
      label: "强制重审 KYC",
      desc: "客户下次登录时被强制重新提交 KYC 资料",
      value: opts.kycStatus === "rejected",
      category: "compliance",
    },
  ];
}

const CATEGORY_META: Record<Category, { label: string; icon: LucideIcon; tone: string }> = {
  access:     { label: "访问控制", icon: Users,       tone: "text-blue-600" },
  fund:       { label: "资金权限", icon: Wallet,      tone: "text-emerald-600" },
  compliance: { label: "合规要求", icon: ShieldCheck, tone: "text-violet-600" },
};

/* ===================================================================== */
/* 主组件                                                                 */
/* ===================================================================== */

export default function PermissionsTab({ data }: BaseTabProps) {
  const { user } = data;

  const [controls, setControls] = useState<ClientControl[]>(() =>
    initialControls({ kycStatus: user.kycStatus, status: user.status }),
  );
  const [logs, setLogs] = useState<ControlLog[]>([]);
  const [showLog, setShowLog] = useState(false);
  const [pending, setPending] = useState<{
    control: ClientControl;
    newValue: boolean;
  } | null>(null);

  const applyChange = (control: ClientControl, newValue: boolean, reason: string) => {
    const updated: ClientControl = {
      ...control,
      value: newValue,
      changedBy: CURRENT_OPERATOR,
      changedAt: new Date().toISOString(),
      reason,
    };
    setControls((prev) => prev.map((c) => (c.key === control.key ? updated : c)));
    setLogs((prev) => [
      {
        id: `log_${Date.now()}`,
        controlKey: control.key,
        controlLabel: control.label,
        operator: CURRENT_OPERATOR,
        operatorRole: CURRENT_ROLE,
        oldValue: String(control.value),
        newValue: String(newValue),
        reason,
        timestamp: new Date().toISOString(),
      },
      ...prev,
    ]);
  };

  const triggerToggle = (control: ClientControl) => {
    setPending({ control, newValue: !control.value });
  };

  // 按 category 分组
  const grouped: Record<Category, ClientControl[]> = {
    access: controls.filter((c) => c.category === "access"),
    fund: controls.filter((c) => c.category === "fund"),
    compliance: controls.filter((c) => c.category === "compliance"),
  };

  return (
    <div>
      {/* Header — 说明 + 操作日志按钮 */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900 mb-1">客户级权限与状态</h3>
          <p className="text-xs text-slate-500">
            所有变更需填写原因，自动写入审计日志。
            <span className="text-slate-400 ml-1">操作员：</span>
            <span className="font-medium text-slate-700 ml-1">{CURRENT_OPERATOR}</span>
            <span className="text-slate-400 ml-1">/ {CURRENT_ROLE}</span>
          </p>
        </div>
        <button
          onClick={() => setShowLog((v) => !v)}
          className="h-7 px-2.5 text-xs font-medium rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 inline-flex items-center gap-1.5"
        >
          <History className="w-3.5 h-3.5" />
          操作日志 ({logs.length})
        </button>
      </div>

      {/* 3 个 category 卡片 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {(Object.keys(grouped) as Category[]).map((cat) => {
          const meta = CATEGORY_META[cat];
          const Icon = meta.icon;
          return (
            <div key={cat} className="rounded-xl border border-slate-200 bg-white">
              <div className="px-4 py-2.5 border-b border-slate-100 flex items-center gap-2">
                <Icon className={`w-4 h-4 ${meta.tone}`} />
                <h4 className="text-sm font-semibold text-slate-800">{meta.label}</h4>
              </div>
              <div className="p-1">
                {grouped[cat].map((c) => (
                  <ControlRow key={c.key} control={c} onToggle={() => triggerToggle(c)} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* 操作日志 — 可展开 */}
      {showLog && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-white">
          <div className="px-4 py-2.5 border-b border-slate-100">
            <h4 className="text-sm font-semibold text-slate-800">操作日志</h4>
          </div>
          {logs.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-400">暂无变更记录</div>
          ) : (
            <ul className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
              {logs.map((log) => (
                <li key={log.id} className="px-4 py-2.5 flex items-start gap-3 text-xs">
                  <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="font-medium text-slate-800">{log.controlLabel}</span>
                      <span className="text-slate-400">·</span>
                      <span className="text-slate-600">
                        <span className="font-mono">{log.oldValue}</span>
                        <span className="text-slate-400 mx-1">→</span>
                        <span className="font-mono font-semibold">{log.newValue}</span>
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      <span className="text-slate-700">{log.operator}</span>
                      <span className="text-slate-400"> · {log.operatorRole}</span>
                      <span className="text-slate-400"> · {timeAgo(log.timestamp)}</span>
                    </div>
                    <div className="text-[11px] text-slate-600 italic mt-0.5">「{log.reason}」</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* 二次确认 dialog */}
      {pending && (
        <ConfirmDialog
          control={pending.control}
          newValue={pending.newValue}
          onCancel={() => setPending(null)}
          onConfirm={(reason) => {
            applyChange(pending.control, pending.newValue, reason);
            setPending(null);
          }}
        />
      )}
    </div>
  );
}

/* ===================================================================== */
/* 子组件                                                                 */
/* ===================================================================== */

function ControlRow({
  control, onToggle,
}: {
  control: ClientControl;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3 px-3 py-2.5 hover:bg-slate-50 rounded-md transition-colors">
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-medium text-slate-700">{control.label}</span>
          {control.changedBy && (
            <span
              className="text-[10px] text-slate-400"
              title={control.reason ? `原因：${control.reason}` : ""}
            >
              {control.changedBy} 改于 {timeAgo(control.changedAt ?? new Date().toISOString())}
            </span>
          )}
        </div>
        <div className="text-[11px] text-slate-500 mt-0.5">{control.desc}</div>
      </div>
      <button
        onClick={onToggle}
        className={`shrink-0 mt-1 relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
          control.value
            ? control.danger
              ? "bg-red-500"
              : "bg-blue-600"
            : "bg-slate-200"
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

function ConfirmDialog({
  control, newValue, onCancel, onConfirm,
}: {
  control: ClientControl;
  newValue: boolean;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");
  const valid = reason.trim().length >= 5;
  const willDisable = !newValue;
  const isDanger = control.danger && willDisable;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            isDanger ? "bg-red-100" : "bg-amber-100"
          }`}>
            <AlertTriangle className={`w-4 h-4 ${isDanger ? "text-red-600" : "text-amber-600"}`} />
          </div>
          <h3 className="text-base font-semibold text-slate-900">
            {willDisable ? "禁用" : "启用"} {control.label}？
          </h3>
        </div>

        <div className="bg-slate-50 rounded-lg px-3 py-2.5 mb-4">
          <div className="text-xs text-slate-500">{control.label}</div>
          <div className="text-sm font-medium text-slate-800 mt-0.5">
            <span className="font-mono">{control.value ? "开" : "关"}</span>
            <span className="text-slate-400 mx-2">→</span>
            <span className={`font-mono font-bold ${isDanger ? "text-red-700" : "text-blue-700"}`}>
              {newValue ? "开" : "关"}
            </span>
          </div>
          <div className="text-[11px] text-slate-500 mt-2">{control.desc}</div>
        </div>

        <label className="block">
          <div className="text-xs font-medium text-slate-700 mb-1.5">
            变更原因 <span className="text-red-500">*</span>
            <span className="text-[10px] text-slate-400 ml-1">（至少 5 个字符，写入审计日志）</span>
          </div>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="例：合规审核要求 / 客户邮件申请 / 风控告警触发 / ..."
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
            取消
          </button>
          <button
            onClick={() => valid && onConfirm(reason.trim())}
            disabled={!valid}
            className={`h-8 px-3 text-sm font-semibold rounded-md inline-flex items-center gap-1.5 transition-colors ${
              !valid ? "bg-slate-200 text-slate-400 cursor-not-allowed"
              : isDanger ? "bg-red-600 text-white hover:bg-red-700"
              : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            <Check className="w-3.5 h-3.5" />
            确认提交
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/* ===================================================================== */
/* Helpers                                                                */
/* ===================================================================== */

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return "刚刚";
  if (min < 60) return `${min} 分钟前`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} 小时前`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} 天前`;
  return new Date(iso).toLocaleDateString("zh-CN");
}

// silence unused lock import (kept for future P2 features)
void Lock;
