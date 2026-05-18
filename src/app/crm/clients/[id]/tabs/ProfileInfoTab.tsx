"use client";

/**
 * ProfileInfoTab — 注册信息 + 个人资料合并视图 (P1, 2026-05-15).
 *
 * 把"注册时填写的不可改基本信息"和"客户后期更新的个人资料"合并到
 * 一个视图里，左右两栏并列展示：
 *
 *   - Registration（注册）   只读 — UID / 注册邮箱 / 注册时间 / 注册渠道 / 推荐人
 *   - Personal Profile（资料） 可编辑 — 显示名 / 语言 / 时区 / 通讯偏好 / 头像 等
 *
 * 注：实际编辑动作会触发审计日志（P2 接入），目前 UI 只展示。
 */

import { useMemo, useState } from "react";
import { UserCircle, ClipboardCheck, Edit3, Save, X } from "lucide-react";
import type { BaseTabProps } from "@/types/backoffice/client";
import { seededRng, rngHelpers } from "./_shared/mock-prng";

interface PersonalProfile {
  displayName: string;
  language: "zh" | "en" | "ja" | "es" | "ar";
  timezone: string;
  communicationPref: ("email" | "sms" | "push")[];
  marketingOptIn: boolean;
  preferredCurrency: string;
}

function generateMockProfile(userId: string, fallbackName: string): PersonalProfile {
  const r = seededRng(`${userId}:profile`);
  const h = rngHelpers(r);
  return {
    displayName: fallbackName,
    language: h.weighted([
      ["zh", 30], ["en", 50], ["ja", 8], ["es", 7], ["ar", 5],
    ]),
    timezone: h.pick(["Asia/Shanghai", "Asia/Tokyo", "Europe/London", "America/New_York", "Asia/Dubai"]),
    communicationPref: [
      ...(h.bool(0.95) ? ["email" as const] : []),
      ...(h.bool(0.6)  ? ["sms" as const] : []),
      ...(h.bool(0.4)  ? ["push" as const] : []),
    ],
    marketingOptIn: h.bool(0.7),
    preferredCurrency: h.weighted([["USD", 70], ["EUR", 15], ["GBP", 8], ["USDT", 7]]),
  };
}

const REGISTRATION_CHANNELS = ["Web Portal", "Mobile App", "IB Referral", "Marketing Campaign"];

export default function ProfileInfoTab({ data }: BaseTabProps) {
  const { user } = data;

  const profile = useMemo(() => generateMockProfile(user.id, user.name), [user.id, user.name]);
  const registration = useMemo(() => {
    const r = seededRng(`${user.id}:reg`);
    const h = rngHelpers(r);
    return {
      registrationChannel: h.pick(REGISTRATION_CHANNELS),
      referredBy: h.bool(0.4) ? `IB-${h.int(1000, 9999)}` : null,
      registeredIp: `${h.int(1, 223)}.${h.int(0, 255)}.${h.int(0, 255)}.${h.int(1, 254)}`,
      verifiedAt: h.bool(0.6)
        ? new Date(new Date(user.createdAt).getTime() + h.int(1, 7) * 86400_000).toISOString()
        : null,
    };
  }, [user.id, user.createdAt]);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(profile);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* 注册信息 — 只读 */}
      <section className="rounded-xl border border-slate-200 bg-white">
        <header className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
          <ClipboardCheck className="w-4 h-4 text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-800">注册信息</h3>
          <span className="text-[10px] text-slate-400 ml-1">只读</span>
        </header>
        <dl className="px-4 py-3">
          <Row label="UID" value={<span className="font-mono">{user.uid}</span>} />
          <Row label="注册邮箱" value={user.email} />
          <Row label="注册时间" value={new Date(user.createdAt).toLocaleString("zh-CN")} />
          <Row label="注册渠道" value={registration.registrationChannel} />
          <Row label="注册 IP" value={<span className="font-mono">{registration.registeredIp}</span>} />
          <Row label="推荐人" value={registration.referredBy ?? <span className="text-slate-300">无</span>} />
          <Row
            label="首次验证"
            value={registration.verifiedAt
              ? new Date(registration.verifiedAt).toLocaleDateString("zh-CN")
              : <span className="text-slate-300">未验证</span>}
          />
        </dl>
      </section>

      {/* 个人资料 — 可编辑 */}
      <section className="rounded-xl border border-slate-200 bg-white">
        <header className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
          <UserCircle className="w-4 h-4 text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-800">个人资料</h3>
          <span className="text-[10px] text-slate-400 ml-1">可编辑</span>
          <button
            onClick={() => { setEditing((v) => !v); setDraft(profile); }}
            className="ml-auto h-7 px-2.5 text-xs rounded-md text-slate-600 hover:bg-slate-100 inline-flex items-center gap-1"
          >
            {editing ? <X className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
            {editing ? "取消" : "编辑"}
          </button>
        </header>
        <dl className="px-4 py-3">
          {editing ? (
            <>
              <EditableRow label="显示名">
                <input
                  type="text"
                  value={draft.displayName}
                  onChange={(e) => setDraft({ ...draft, displayName: e.target.value })}
                  className="h-7 px-2 text-xs border border-slate-200 rounded w-full"
                />
              </EditableRow>
              <EditableRow label="语言">
                <select
                  value={draft.language}
                  onChange={(e) => setDraft({ ...draft, language: e.target.value as PersonalProfile["language"] })}
                  className="h-7 px-2 text-xs border border-slate-200 rounded bg-white"
                >
                  <option value="zh">中文</option>
                  <option value="en">English</option>
                  <option value="ja">日本語</option>
                  <option value="es">Español</option>
                  <option value="ar">العربية</option>
                </select>
              </EditableRow>
              <EditableRow label="时区">
                <select
                  value={draft.timezone}
                  onChange={(e) => setDraft({ ...draft, timezone: e.target.value })}
                  className="h-7 px-2 text-xs border border-slate-200 rounded bg-white"
                >
                  {["Asia/Shanghai", "Asia/Tokyo", "Europe/London", "America/New_York", "Asia/Dubai"].map((tz) => (
                    <option key={tz} value={tz}>{tz}</option>
                  ))}
                </select>
              </EditableRow>
              <EditableRow label="主货币">
                <select
                  value={draft.preferredCurrency}
                  onChange={(e) => setDraft({ ...draft, preferredCurrency: e.target.value })}
                  className="h-7 px-2 text-xs border border-slate-200 rounded bg-white"
                >
                  {["USD", "EUR", "GBP", "USDT"].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </EditableRow>
              <EditableRow label="营销订阅">
                <input
                  type="checkbox"
                  checked={draft.marketingOptIn}
                  onChange={(e) => setDraft({ ...draft, marketingOptIn: e.target.checked })}
                  className="w-4 h-4"
                />
              </EditableRow>
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={() => setEditing(false)}
                  className="h-8 px-3 text-xs font-semibold bg-blue-600 text-white rounded-md hover:bg-blue-700 inline-flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  保存
                </button>
              </div>
            </>
          ) : (
            <>
              <Row label="显示名" value={profile.displayName} />
              <Row label="语言" value={
                { zh: "中文", en: "English", ja: "日本語", es: "Español", ar: "العربية" }[profile.language]
              } />
              <Row label="时区" value={<span className="font-mono text-xs">{profile.timezone}</span>} />
              <Row label="主货币" value={<span className="font-mono">{profile.preferredCurrency}</span>} />
              <Row label="通讯偏好" value={
                <div className="flex gap-1 justify-end">
                  {profile.communicationPref.map((c) => (
                    <span key={c} className="px-1.5 py-0.5 text-[10px] bg-slate-100 text-slate-700 rounded uppercase">{c}</span>
                  ))}
                  {profile.communicationPref.length === 0 && <span className="text-slate-300 text-xs">无</span>}
                </div>
              } />
              <Row label="营销订阅" value={
                profile.marketingOptIn
                  ? <span className="text-emerald-700 font-medium text-xs">已订阅</span>
                  : <span className="text-slate-400 text-xs">未订阅</span>
              } />
            </>
          )}
        </dl>
      </section>
    </div>
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

function EditableRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 border-b border-slate-100 last:border-b-0">
      <label className="text-xs text-slate-500 shrink-0">{label}</label>
      <div className="text-right">{children}</div>
    </div>
  );
}
