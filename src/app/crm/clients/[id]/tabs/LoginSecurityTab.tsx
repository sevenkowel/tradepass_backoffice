"use client";

/**
 * LoginSecurityTab — 登录安全 (P1, 2026-05-15).
 *
 * 客户的账号安全设置：2FA / IP 白名单 / 密码状态 / 异常登录响应。
 */

import { useMemo, useState } from "react";
import {
  Lock, Smartphone, Key, ShieldCheck, ShieldAlert, Plus, Trash2,
} from "lucide-react";
import type { BaseTabProps } from "@/types/backoffice/client";
import { seededRng, rngHelpers, timeAgo } from "./_shared/mock-prng";

interface SecuritySettings {
  twoFactorEnabled: boolean;
  twoFactorMethod: "totp" | "sms" | null;
  passwordLastChangedAt: string;
  failedLoginsLast24h: number;
  failedLoginsLast7d: number;
  ipWhitelist: string[];
  trustedDevicesCount: number;
  apiKeysCount: number;
  recoveryEmailSet: boolean;
  recoveryPhoneSet: boolean;
}

function generateMockSecurity(userId: string): SecuritySettings {
  const r = seededRng(`${userId}:sec`);
  const h = rngHelpers(r);
  const has2FA = h.bool(0.55);

  return {
    twoFactorEnabled: has2FA,
    twoFactorMethod: has2FA ? (h.bool(0.7) ? "totp" : "sms") : null,
    passwordLastChangedAt: new Date(Date.now() - h.int(7, 365) * 86400_000).toISOString(),
    failedLoginsLast24h: h.bool(0.7) ? 0 : h.int(1, 8),
    failedLoginsLast7d: h.int(0, 12),
    ipWhitelist: h.bool(0.2)
      ? Array.from({ length: h.int(1, 3) }, () => `${h.int(1, 223)}.${h.int(0, 255)}.${h.int(0, 255)}.0/24`)
      : [],
    trustedDevicesCount: h.int(1, 5),
    apiKeysCount: h.bool(0.2) ? h.int(1, 4) : 0,
    recoveryEmailSet: h.bool(0.85),
    recoveryPhoneSet: h.bool(0.65),
  };
}

export default function LoginSecurityTab({ data }: BaseTabProps) {
  const { user } = data;
  const security = useMemo(() => generateMockSecurity(user.id), [user.id]);
  const [editingWhitelist, setEditingWhitelist] = useState(false);

  const pwdAgeDays = daysSince(security.passwordLastChangedAt);
  const pwdStale = pwdAgeDays > 180;

  const overallScore = computeSecurityScore(security);

  return (
    <div className="space-y-4">
      {/* Security score banner */}
      <div className={`rounded-xl border p-4 flex items-start gap-3 ${
        overallScore >= 80 ? "bg-emerald-50 text-emerald-800 border-emerald-200"
        : overallScore >= 50 ? "bg-amber-50 text-amber-800 border-amber-200"
        : "bg-red-50 text-red-800 border-red-200"
      }`}>
        {overallScore >= 80 ? <ShieldCheck className="w-5 h-5 mt-0.5" /> : <ShieldAlert className="w-5 h-5 mt-0.5" />}
        <div className="flex-1">
          <div className="text-sm font-semibold">
            安全评分 <span className="text-xl font-bold tabular-nums">{overallScore}</span> / 100
          </div>
          <div className="text-xs opacity-80 mt-0.5">
            {overallScore >= 80 ? "安全配置良好"
              : overallScore >= 50 ? "存在风险点，建议加强"
              : "安全级别偏低，强烈建议提示客户启用 2FA / 更新密码"}
          </div>
        </div>
      </div>

      {/* 2FA & 认证 */}
      <Section title="二次验证 (2FA)" icon={<Smartphone className="w-4 h-4 text-slate-500" />}>
        <Row label="2FA 状态" value={
          security.twoFactorEnabled
            ? <span className="text-emerald-700 font-medium text-xs">已启用</span>
            : <span className="text-red-700 font-medium text-xs">未启用</span>
        } />
        {security.twoFactorEnabled && (
          <Row label="2FA 方式" value={security.twoFactorMethod === "totp" ? "TOTP（Google Authenticator）" : "短信验证码"} />
        )}
        <Row label="备用邮箱" value={
          security.recoveryEmailSet
            ? <span className="text-emerald-700 font-medium text-xs">已设置</span>
            : <span className="text-amber-700 font-medium text-xs">未设置</span>
        } />
        <Row label="备用手机" value={
          security.recoveryPhoneSet
            ? <span className="text-emerald-700 font-medium text-xs">已设置</span>
            : <span className="text-slate-400 text-xs">未设置</span>
        } />
        <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
          {security.twoFactorEnabled ? (
            <button className="h-7 px-2.5 text-xs font-medium rounded-md border border-red-200 text-red-700 hover:bg-red-50">
              强制重置 2FA
            </button>
          ) : (
            <button className="h-7 px-2.5 text-xs font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700">
              要求客户启用 2FA
            </button>
          )}
        </div>
      </Section>

      {/* 密码 */}
      <Section title="密码" icon={<Key className="w-4 h-4 text-slate-500" />}>
        <Row label="上次修改" value={
          <span className={pwdStale ? "text-amber-700 font-medium text-xs" : "text-slate-700 text-xs"}>
            {timeAgo(security.passwordLastChangedAt)}
            <span className="text-slate-400 ml-1">（{pwdAgeDays} 天前）</span>
          </span>
        } />
        <Row label="状态" value={
          pwdStale
            ? <span className="text-amber-700 font-medium text-xs">⚠ 超过 6 个月未更新</span>
            : <span className="text-emerald-700 font-medium text-xs">正常</span>
        } />
        <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
          <button className="h-7 px-2.5 text-xs font-medium rounded-md border border-amber-200 text-amber-700 hover:bg-amber-50">
            发送密码重置邮件
          </button>
          <button className="h-7 px-2.5 text-xs font-medium rounded-md border border-red-200 text-red-700 hover:bg-red-50">
            强制重置密码
          </button>
        </div>
      </Section>

      {/* 登录失败 */}
      <Section title="登录失败统计" icon={<ShieldAlert className="w-4 h-4 text-slate-500" />}>
        <Row label="24 小时内" value={
          <span className={security.failedLoginsLast24h >= 3 ? "text-red-700 font-medium" : "text-slate-700"}>
            {security.failedLoginsLast24h} 次
          </span>
        } />
        <Row label="7 天内" value={
          <span className={security.failedLoginsLast7d >= 8 ? "text-amber-700 font-medium" : "text-slate-700"}>
            {security.failedLoginsLast7d} 次
          </span>
        } />
      </Section>

      {/* IP 白名单 */}
      <Section title="IP 白名单" icon={<Lock className="w-4 h-4 text-slate-500" />}>
        {security.ipWhitelist.length === 0 ? (
          <p className="text-xs text-slate-400">未配置 IP 白名单 — 客户可从任意 IP 登录</p>
        ) : (
          <ul className="space-y-1">
            {security.ipWhitelist.map((ip) => (
              <li key={ip} className="flex items-center justify-between py-1 px-2 rounded bg-slate-50">
                <span className="text-xs font-mono text-slate-700">{ip}</span>
                {editingWhitelist && (
                  <button className="text-red-500 hover:text-red-700">
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
        <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
          <button
            onClick={() => setEditingWhitelist((v) => !v)}
            className="h-7 px-2.5 text-xs font-medium rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 inline-flex items-center gap-1"
          >
            <Plus className="w-3 h-3" />
            {editingWhitelist ? "完成编辑" : "管理白名单"}
          </button>
        </div>
      </Section>

      {/* API Keys & 受信设备 */}
      <div className="grid grid-cols-2 gap-3">
        <Section title="API Keys" icon={<Key className="w-4 h-4 text-slate-500" />}>
          <div className="text-2xl font-bold tabular-nums text-slate-900">{security.apiKeysCount}</div>
          <div className="text-[11px] text-slate-500">个生效的 API key</div>
        </Section>
        <Section title="受信设备" icon={<Smartphone className="w-4 h-4 text-slate-500" />}>
          <div className="text-2xl font-bold tabular-nums text-slate-900">{security.trustedDevicesCount}</div>
          <div className="text-[11px] text-slate-500">个受信任的设备</div>
        </Section>
      </div>
    </div>
  );
}

function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400_000);
}

function computeSecurityScore(s: SecuritySettings): number {
  let score = 0;
  if (s.twoFactorEnabled) score += 35;
  if (s.twoFactorMethod === "totp") score += 10; // TOTP 更安全
  if (s.recoveryEmailSet) score += 10;
  if (s.recoveryPhoneSet) score += 10;
  if (s.ipWhitelist.length > 0) score += 10;
  const pwdAgeDays = daysSince(s.passwordLastChangedAt);
  if (pwdAgeDays <= 90) score += 15;
  else if (pwdAgeDays <= 180) score += 10;
  else if (pwdAgeDays <= 365) score += 5;
  if (s.failedLoginsLast24h === 0) score += 10;
  else if (s.failedLoginsLast24h < 3) score += 5;
  return Math.min(100, score);
}

function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 inline-flex items-center gap-1.5">
        {icon}
        {title}
      </h4>
      <div>{children}</div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5 border-b border-slate-100 last:border-b-0">
      <dt className="text-xs text-slate-500 shrink-0">{label}</dt>
      <dd className="text-sm text-slate-800 font-medium text-right tabular-nums truncate">{value}</dd>
    </div>
  );
}
