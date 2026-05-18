"use client";

/**
 * Settings Tab — Account Administration
 *
 * 4 个分区，按用途归类（不再是「编辑表单」而是「账户行政中心」）：
 *   1. Configuration — 杠杆 / 交易模式 / 账户组 / 服务器 / 主货币
 *   2. Permissions   — 绑定 IB / 销售 / 可见团队 / 客户自助权限
 *   3. Security      — 2FA / IP 白名单 / API Keys / 密码 / 登录失败
 *   4. Lifecycle     — 创建时间 / 最后交易 / 归档 / 转移 / 销户
 *
 * 注意：风控类开关（出金锁、AML 升级、只读）放在 Risk & Controls Tab，
 * 不放这里。这里只放「相对静态」的账户元数据。
 */

import { useState } from "react";
import {
  Archive, ArrowLeftRight, KeyRound, Shield, Trash2, UserCog,
} from "lucide-react";
import type {
  TradingAccount, AccountPermissions, AccountSecurity,
} from "@/types/backoffice/client-detail";
import { Card, KVRow, Section, timeAgo } from "../primitives";

// React 19 的 react-hooks/purity 规则禁止在组件 body 里直接调用 `Date.now()`。
// 把所有「当下时间」相关的派生函数放在模块作用域，组件只调用纯函数。
function isPasswordStale(iso: string | undefined): boolean {
  if (!iso) return false;
  return Date.now() - new Date(iso).getTime() > 180 * 86400_000;
}
function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400_000);
}

interface Props {
  account: TradingAccount;
  permissions: AccountPermissions;
  security: AccountSecurity;
}

export function SettingsTab({ account, permissions, security }: Props) {
  return (
    <div className="space-y-4">
      <ConfigurationSection account={account} />
      <PermissionsSection permissions={permissions} />
      <SecuritySection security={security} />
      <LifecycleSection account={account} />
    </div>
  );
}

/* ===================================================================== */
/* 1. Configuration                                                       */
/* ===================================================================== */

function ConfigurationSection({ account }: { account: TradingAccount }) {
  const [leverage, setLeverage] = useState(account.leverage);
  const [mode, setMode] = useState(account.tradingMode);
  const [group, setGroup] = useState(account.group);

  const dirty = leverage !== account.leverage || mode !== account.tradingMode || group !== account.group;

  return (
    <Section title="Configuration" action={<UserCog className="w-3.5 h-3.5 text-slate-300" />}>
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
          <Field label="Leverage">
            <select
              value={leverage}
              onChange={(e) => setLeverage(e.target.value)}
              className="h-8 px-2 text-sm border border-slate-200 rounded-md bg-white w-full"
            >
              {["1:50", "1:100", "1:200", "1:500", "1:1000"].map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </Field>
          <Field label="Trading Mode">
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as TradingAccount["tradingMode"])}
              className="h-8 px-2 text-sm border border-slate-200 rounded-md bg-white w-full"
            >
              <option value="hedging">Hedging</option>
              <option value="netting">Netting</option>
            </select>
          </Field>
          <Field label="Account Group">
            <input
              value={group}
              onChange={(e) => setGroup(e.target.value)}
              className="h-8 px-2 text-sm border border-slate-200 rounded-md bg-white font-mono w-full"
            />
          </Field>
          <Field label="Server">
            <input
              value={account.server}
              readOnly
              className="h-8 px-2 text-sm border border-slate-200 rounded-md bg-slate-50 font-mono text-slate-500 w-full"
            />
          </Field>
          <Field label="Base Currency">
            <input
              value={account.currency}
              readOnly
              className="h-8 px-2 text-sm border border-slate-200 rounded-md bg-slate-50 font-mono text-slate-500 w-full"
            />
          </Field>
          <Field label="Platform">
            <input
              value={account.platform}
              readOnly
              className="h-8 px-2 text-sm border border-slate-200 rounded-md bg-slate-50 font-mono text-slate-500 w-full"
            />
          </Field>
        </div>
        <div className="flex items-center gap-2 pt-3 mt-3 border-t border-slate-100">
          <button
            disabled={!dirty}
            className="h-8 px-3 text-sm font-semibold rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
          >
            Save changes
          </button>
          <button
            onClick={() => {
              setLeverage(account.leverage);
              setMode(account.tradingMode);
              setGroup(account.group);
            }}
            disabled={!dirty}
            className="h-8 px-3 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-md disabled:text-slate-300 disabled:cursor-not-allowed"
          >
            Reset
          </button>
          <span className="text-[11px] text-slate-400 ml-auto">
            Leverage / group changes take effect immediately and may impact open positions. Server changes require IT ticket.
          </span>
        </div>
      </Card>
    </Section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-[11px] font-medium text-slate-600 mb-1">{label}</div>
      {children}
    </label>
  );
}

/* ===================================================================== */
/* 2. Permissions                                                         */
/* ===================================================================== */

function PermissionsSection({ permissions }: { permissions: AccountPermissions }) {
  return (
    <Section title="Permissions" action={<KeyRound className="w-3.5 h-3.5 text-slate-300" />}>
      <Card>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
          <KVRow label="IB Agent"
                 value={permissions.ibCode ?? <span className="text-slate-300">Unassigned</span>} />
          <KVRow label="Sales Owner"
                 value={permissions.salesAgent ?? <span className="text-slate-300">Unassigned</span>} />
          <KVRow label="Visible to Teams"
                 value={
                   <div className="flex gap-1 flex-wrap justify-end">
                     {permissions.visibleToTeams.map((t) => (
                       <span key={t} className="px-1.5 py-0.5 text-[10.5px] bg-slate-100 text-slate-700 rounded">{t}</span>
                     ))}
                   </div>
                 } />
          <KVRow label="Self-service Withdrawal"
                 value={permissions.selfServiceWithdrawal ? <Yes /> : <No />} />
          <KVRow label="Self-service Transfer"
                 value={permissions.selfServiceTransfer ? <Yes /> : <No />} />
          <KVRow label="Self-service Leverage"
                 value={permissions.selfServiceLeverageChange ? <Yes /> : <No />} />
        </dl>
      </Card>
    </Section>
  );
}

function Yes() {
  return <span className="text-emerald-700 font-medium">Allowed</span>;
}
function No() {
  return <span className="text-slate-400">Denied</span>;
}

/* ===================================================================== */
/* 3. Security                                                            */
/* ===================================================================== */

function SecuritySection({ security }: { security: AccountSecurity }) {
  const pwdStale = isPasswordStale(security.passwordLastChangedAt);
  return (
    <Section title="Security" action={<Shield className="w-3.5 h-3.5 text-slate-300" />}>
      <Card>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
          <KVRow label="Two-Factor Auth (2FA)"
                 value={security.twoFactorEnabled
                   ? <span className="text-emerald-700 font-medium">Enabled</span>
                   : <span className="text-amber-700 font-medium">Disabled</span>}
                 tone={security.twoFactorEnabled ? "ok" : "warn"} />
          <KVRow label="API Keys"
                 value={security.apiKeysCount > 0
                   ? <span>{security.apiKeysCount}</span>
                   : <span className="text-slate-300">None</span>} />
          <KVRow
            label="IP Whitelist"
            value={security.ipWhitelist.length === 0
              ? <span className="text-slate-300">Not enforced</span>
              : <div className="flex gap-1 flex-wrap justify-end">
                  {security.ipWhitelist.map((ip) => (
                    <span key={ip} className="px-1.5 py-0.5 text-[10.5px] bg-slate-100 text-slate-700 rounded font-mono">{ip}</span>
                  ))}
                </div>}
          />
          <KVRow label="Password Last Changed"
                 value={security.passwordLastChangedAt
                   ? <span>{timeAgo(security.passwordLastChangedAt)}</span>
                   : <span className="text-slate-300">Never</span>}
                 tone={pwdStale ? "warn" : "neutral"}
          />
          <KVRow label="Failed Logins (24h)"
                 value={<span className={security.failedLoginsLast24h >= 3 ? "text-red-700 font-medium" : "text-slate-700"}>
                   {security.failedLoginsLast24h}
                 </span>}
                 tone={security.failedLoginsLast24h >= 3 ? "danger" : "neutral"} />
        </dl>
      </Card>
    </Section>
  );
}

/* ===================================================================== */
/* 4. Lifecycle                                                           */
/* ===================================================================== */

function LifecycleSection({ account }: { account: TradingAccount }) {
  const ageDays = daysSince(account.createdAt);
  return (
    <Section title="Lifecycle" action={<Archive className="w-3.5 h-3.5 text-slate-300" />}>
      <Card>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
          <KVRow label="Created" value={new Date(account.createdAt).toLocaleString("en-US")} />
          <KVRow label="Last Trade"
                 value={account.lastTradeAt
                   ? new Date(account.lastTradeAt).toLocaleString("en-US")
                   : <span className="text-slate-300">Never</span>} />
          <KVRow label="Current Status" value={
            <span className={
              account.status === "active" ? "text-emerald-700 font-medium"
              : account.status === "restricted" ? "text-amber-700 font-medium"
              : "text-red-700 font-medium"
            }>
              {{ active: "Active", restricted: "Restricted", disabled: "Disabled" }[account.status]}
            </span>
          } />
          <KVRow label="Account Age" value={`${ageDays} days`} />
        </dl>

        <div className="flex items-center gap-2 pt-3 mt-3 border-t border-slate-100">
          <button
            className="h-8 px-3 text-xs font-medium rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 inline-flex items-center gap-1.5"
          >
            <Archive className="w-3.5 h-3.5" />
            Archive
          </button>
          <button
            className="h-8 px-3 text-xs font-medium rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 inline-flex items-center gap-1.5"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            Transfer to another client
          </button>
          <button
            className="h-8 px-3 text-xs font-medium rounded-md border border-red-200 text-red-700 hover:bg-red-50 inline-flex items-center gap-1.5 ml-auto"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Close account…
          </button>
        </div>
        <p className="text-[11px] text-slate-400 mt-2">
          Archive: account becomes read-only, retained 7 years for audit. Close: zero balance and permanently terminate — cannot be undone.
        </p>
      </Card>
    </Section>
  );
}
