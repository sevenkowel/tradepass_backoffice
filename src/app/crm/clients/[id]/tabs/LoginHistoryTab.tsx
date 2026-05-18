"use client";

/**
 * LoginHistoryTab — 客户登录历史 + 24h 热力图 (2026-05-15).
 *
 * 提供 Compliance / Risk 团队需要的客户登录可视化：
 *
 *   1. 顶部 24h 热力图        — 24 个 bar，每个 bar 表示该小时登录次数
 *   2. 时间范围切换            — 24h / 7d / 30d / All
 *   3. 风险/状态筛选 chips     — All / VPN / Failed / Risky
 *   4. 完整记录列表            — 时间 / 国家·城市 / IP / 设备 / VPN / 状态
 *
 * 数据：deterministic mock seeded by `user.id` — 同一客户每次刷新拿到
 * 一致的数据，方便演示和回归测试。
 */

import { useMemo, useState } from "react";
import { Activity, Shield, AlertTriangle, Globe } from "lucide-react";
import type { BaseTabProps } from "@/types/backoffice/client";
import * as CountryFlags from "country-flag-icons/react/3x2";

/* ===================================================================== */
/* 数据模型 (inline — P1 阶段)                                            */
/* ===================================================================== */

interface LoginRecord {
  id: string;
  timestamp: string;          // ISO
  ipAddress: string;
  country: string;            // ISO-2 country code
  city: string;
  browser: string;
  os: string;
  isVpn: boolean;
  success: boolean;
  failureReason?: string;
}

/* ===================================================================== */
/* Mock 生成 — deterministic per user.id                                  */
/* ===================================================================== */

function hashSeed(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h = (h ^ str.charCodeAt(i)) >>> 0;
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

function mulberry32(seed: number): () => number {
  return function () {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const BROWSER_OS: [string, string, number][] = [
  ["Chrome 124",    "macOS 14",   18],
  ["Chrome 124",    "Windows 11", 22],
  ["Chrome Mobile", "Android 14", 16],
  ["Safari 17",     "macOS 14",   10],
  ["Safari Mobile", "iOS 17",     14],
  ["Edge 124",      "Windows 11",  8],
  ["Firefox 125",   "Windows 11",  4],
];

const CITY_BY_COUNTRY: Record<string, string[]> = {
  CN: ["Shenzhen", "Shanghai", "Beijing"],
  HK: ["Hong Kong"],
  SG: ["Singapore"],
  JP: ["Tokyo"],
  KR: ["Seoul"],
  TW: ["Taipei"],
  VN: ["Hanoi"],
  TH: ["Bangkok"],
  MY: ["Kuala Lumpur"],
  ID: ["Jakarta"],
  US: ["New York", "Los Angeles", "Chicago"],
  GB: ["London"],
  DE: ["Berlin"],
  FR: ["Paris"],
  AU: ["Sydney"],
};

const FAILURE_REASONS = [
  "Wrong password",
  "2FA code expired",
  "IP not whitelisted",
  "Account temporarily locked",
];

function generateMockLogins(userId: string, mainCountry: string | null): LoginRecord[] {
  const r = mulberry32(hashSeed(`${userId}:logins`));
  const ri = (min: number, max: number) => Math.floor(r() * (max - min + 1)) + min;
  const pick = <T,>(arr: readonly T[]) => arr[Math.floor(r() * arr.length)];

  const count = 80 + Math.floor(r() * 80); // 80-160 条
  const now = Date.now();
  const out: LoginRecord[] = [];

  for (let i = 0; i < count; i++) {
    // === 时间戳生成（分两步：先选日期、再选 hour-of-day）===
    //   v1 的 bug 是把"天数偏移"和"小时偏移"作为毫秒数混合计算，导致
    //   hour-of-day 跟设计意图脱钩；改成先选 daysAgo 再用 setHours()
    //   拼合，保证每小时分桶分布正确。

    // 1. 日期偏移：70% 在最近 7 天均匀分布（填满 7 行热力图）+ 30% 在 7-30d
    const dayBias = r();
    const daysAgo = dayBias < 0.70
      ? r() * 7                       // 0-7 天均匀
      : 7 + r() * 23;                 // 7-30 天

    // 2. hour-of-day（按真实交易客户作息加权）：
    //    深夜 0-5  10% / 早晨 6-11 25% / 下午 12-17 40% / 晚上 18-23 25%
    const hourBias = r();
    const hour: number =
      hourBias < 0.10 ? Math.floor(r() * 6)            // 0-5
      : hourBias < 0.35 ? 6 + Math.floor(r() * 6)      // 6-11
      : hourBias < 0.75 ? 12 + Math.floor(r() * 6)     // 12-17
      : 18 + Math.floor(r() * 6);                       // 18-23

    // 3. 拼合：日期取 daysAgo 那天，时分秒用本地时区 setHours 写入
    const tsDate = new Date(now - daysAgo * 86400_000);
    tsDate.setHours(hour, Math.floor(r() * 60), Math.floor(r() * 60), 0);
    const timestamp = tsDate.toISOString();

    // 主要国家 70% 概率，其它国家 30%（潜在异常）
    const useMain = mainCountry && r() < 0.7;
    const country = useMain
      ? mainCountry
      : pick(["US", "GB", "SG", "HK", "JP", "CN", "DE", "AE"]);

    const cities = CITY_BY_COUNTRY[country] ?? ["Unknown"];
    const city = pick(cities);
    const [browser, os] = (() => {
      const totalW = BROWSER_OS.reduce((s, [, , w]) => s + w, 0);
      let p = r() * totalW;
      for (const [b, o, w] of BROWSER_OS) {
        p -= w;
        if (p <= 0) return [b, o];
      }
      return BROWSER_OS[0];
    })();

    const isVpn = r() < 0.08;
    const success = r() < 0.92;

    out.push({
      id: `login_${userId.slice(-6)}_${i}`,
      timestamp,
      ipAddress: `${ri(1, 223)}.${ri(0, 255)}.${ri(0, 255)}.${ri(1, 254)}`,
      country,
      city,
      browser,
      os,
      isVpn,
      success,
      failureReason: success ? undefined : pick(FAILURE_REASONS),
    });
  }

  return out.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

/* ===================================================================== */
/* 时间派生纯函数 — 提到模块作用域规避 React 19 react-hooks/purity 规则   */
/* ===================================================================== */

function isWithinRange(timestamp: string, rangeMs: number): boolean {
  return Date.now() - new Date(timestamp).getTime() <= rangeMs;
}

/**
 * 7×24 网格热力图分桶 — 行 = 最近 7 天的某一天（今天在第 6 行），列 = hour-of-day。
 * 每天对应日历日（不是滚动 24h），这样跨午夜的登录会被正确归到所属那一天。
 */
function bucketByDayAndHour(logins: LoginRecord[]): number[][] {
  // 7 行 × 24 列
  const grid: number[][] = Array.from({ length: 7 }, () => new Array(24).fill(0));

  // 今天的 00:00:00（本地时区）作为最右下角的"基准日 0"
  const now = new Date();
  const today0 = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const cutoff = today0 - 6 * 86400_000; // 6 天前 00:00（共 7 天窗口）

  for (const rec of logins) {
    const t = new Date(rec.timestamp).getTime();
    if (t < cutoff) continue;
    const recDate = new Date(rec.timestamp);
    const recDay0 = new Date(recDate.getFullYear(), recDate.getMonth(), recDate.getDate()).getTime();
    const daysFromCutoff = Math.floor((recDay0 - cutoff) / 86400_000);
    if (daysFromCutoff < 0 || daysFromCutoff > 6) continue;
    const hour = recDate.getHours();
    grid[daysFromCutoff][hour]++;
  }
  return grid;
}

/* ===================================================================== */
/* 主组件                                                                 */
/* ===================================================================== */

type TimeRange = "24h" | "7d" | "30d" | "all";
type FilterKind = "all" | "vpn" | "failed";

export default function LoginHistoryTab({ data }: BaseTabProps) {
  const { user } = data;

  const allLogins = useMemo(
    () => generateMockLogins(user.id, user.country ?? null),
    [user.id, user.country],
  );

  const [range, setRange] = useState<TimeRange>("7d");
  const [filter, setFilter] = useState<FilterKind>("all");

  /* ── 派生筛选后的记录 ───────────────────────────────────────────── */
  const filtered = useMemo(() => {
    const cutoff = range === "24h" ? 1 * 86400_000
                : range === "7d"  ? 7 * 86400_000
                : range === "30d" ? 30 * 86400_000
                : Infinity;

    return allLogins.filter((rec) => {
      if (!isWithinRange(rec.timestamp, cutoff)) return false;
      if (filter === "vpn" && !rec.isVpn) return false;
      if (filter === "failed" && rec.success) return false;
      return true;
    });
  }, [allLogins, range, filter]);

  /* ── 7×24 网格热力图数据 ─────────────────────────────────────────── */
  const heatmap = useMemo(() => bucketByDayAndHour(allLogins), [allLogins]);
  const maxHeat = useMemo(() => {
    let m = 0;
    for (const row of heatmap) for (const v of row) if (v > m) m = v;
    return m || 1;
  }, [heatmap]);
  const last7dTotal = useMemo(
    () => heatmap.reduce((s, row) => s + row.reduce((a, b) => a + b, 0), 0),
    [heatmap],
  );

  // 行 label：今天在最下面，上面依次是 -1d, -2d... -6d
  const dayLabels = useMemo(() => {
    const labels: string[] = [];
    const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      labels.push(weekdays[d.getDay()]);
    }
    return labels;
  }, []);

  /* ── 概览统计 ───────────────────────────────────────────────────── */
  const stats = useMemo(() => {
    const total = filtered.length;
    const failed = filtered.filter((r) => !r.success).length;
    const vpn = filtered.filter((r) => r.isVpn).length;
    const countries = new Set(filtered.map((r) => r.country)).size;
    return { total, failed, vpn, countries };
  }, [filtered]);

  return (
    <div className="space-y-5">
      {/* 近 7 天 × 24 小时 登录热力图（GitHub 风格） */}
      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 inline-flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-slate-400" />
            近 7 天 × 24 小时登录热力图
          </h3>
          <span className="text-xs text-slate-500 tabular-nums">
            {last7dTotal} 次登录
          </span>
        </div>

        {/* Grid：左侧日期 label，中间 7×24 单元格，下方小时刻度 */}
        <div className="inline-block min-w-full overflow-x-auto">
          {/* 顶部小时刻度（每 3 小时一个） */}
          <div className="flex items-center pl-9 mb-1">
            {Array.from({ length: 24 }).map((_, h) => (
              <div key={h} className="flex-1 min-w-[16px] text-center">
                <span className={`text-[9px] tabular-nums ${h % 3 === 0 ? "text-slate-400" : "text-transparent"}`}>
                  {h.toString().padStart(2, "0")}
                </span>
              </div>
            ))}
          </div>

          {/* 7 行 × 24 列 */}
          <div className="space-y-[3px]">
            {heatmap.map((row, dayIdx) => (
              <div key={dayIdx} className="flex items-center">
                <div className="w-9 pr-2 text-right text-[10px] text-slate-400 tabular-nums shrink-0">
                  {dayLabels[dayIdx]}
                </div>
                <div className="flex-1 flex gap-[3px]">
                  {row.map((count, hour) => {
                    const intensity = count / maxHeat;
                    const tone =
                      count === 0       ? "bg-slate-100"
                      : intensity > 0.75 ? "bg-blue-700"
                      : intensity > 0.50 ? "bg-blue-500"
                      : intensity > 0.25 ? "bg-blue-300"
                      : "bg-blue-100";
                    const ago = 6 - dayIdx;
                    const agoLabel = ago === 0 ? "今天" : ago === 1 ? "昨天" : `${ago} 天前`;
                    return (
                      <div
                        key={hour}
                        className={`flex-1 min-w-[14px] aspect-square rounded-sm ${tone} transition-all hover:ring-2 hover:ring-blue-400 hover:ring-offset-1`}
                        title={`${agoLabel} ${hour.toString().padStart(2, "0")}:00 — ${count} 次登录`}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* 图例 */}
          <div className="flex items-center justify-end gap-1.5 mt-3 text-[10px] text-slate-400">
            <span>少</span>
            <div className="w-3 h-3 rounded-sm bg-slate-100" />
            <div className="w-3 h-3 rounded-sm bg-blue-100" />
            <div className="w-3 h-3 rounded-sm bg-blue-300" />
            <div className="w-3 h-3 rounded-sm bg-blue-500" />
            <div className="w-3 h-3 rounded-sm bg-blue-700" />
            <span>多</span>
          </div>
        </div>
      </section>

      {/* 统计卡 + 筛选 */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="登录总数"   value={stats.total}     icon={Activity} tone="neutral" />
        <StatCard label="失败次数"   value={stats.failed}    icon={AlertTriangle} tone={stats.failed > 0 ? "warn" : "neutral"} />
        <StatCard label="VPN 登录"   value={stats.vpn}       icon={Shield} tone={stats.vpn > 0 ? "warn" : "neutral"} />
        <StatCard label="覆盖国家"   value={stats.countries} icon={Globe} tone={stats.countries > 3 ? "warn" : "neutral"} />
      </section>

      {/* 筛选器 */}
      <section className="flex items-center gap-3 flex-wrap">
        {/* 时间范围 */}
        <div className="inline-flex bg-slate-100 rounded-lg p-0.5">
          {(["24h", "7d", "30d", "all"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 h-7 text-xs font-medium rounded-md transition-all ${
                range === r ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              {r === "24h" ? "24 小时"
                : r === "7d"  ? "7 天"
                : r === "30d" ? "30 天"
                : "全部"}
            </button>
          ))}
        </div>

        {/* 筛选 */}
        <div className="inline-flex bg-slate-100 rounded-lg p-0.5">
          {([
            { key: "all" as FilterKind, label: "全部" },
            { key: "vpn" as FilterKind, label: "VPN" },
            { key: "failed" as FilterKind, label: "失败" },
          ]).map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 h-7 text-xs font-medium rounded-md transition-all ${
                filter === f.key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <span className="text-xs text-slate-400 ml-auto tabular-nums">
          共 {filtered.length} 条
        </span>
      </section>

      {/* 完整记录列表 */}
      <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-400">无符合条件的登录记录</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-4 py-2">时间</th>
                <th className="px-4 py-2">地点</th>
                <th className="px-4 py-2">IP 地址</th>
                <th className="px-4 py-2">设备</th>
                <th className="px-4 py-2 text-right">标记</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.slice(0, 200).map((rec) => (
                <tr key={rec.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2 text-xs text-slate-700 tabular-nums whitespace-nowrap">
                    {fmtFullTime(rec.timestamp)}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-1.5">
                      <CountryFlag cc={rec.country} />
                      <span className="text-xs text-slate-700">{rec.country}</span>
                      <span className="text-xs text-slate-400">{rec.city}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2 text-xs font-mono text-slate-600 tabular-nums">
                    {rec.ipAddress}
                  </td>
                  <td className="px-4 py-2 text-xs text-slate-600">
                    {rec.browser} <span className="text-slate-400">·</span> {rec.os}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <div className="inline-flex items-center gap-1">
                      {rec.isVpn && (
                        <span className="px-1.5 py-0.5 text-[10px] font-medium bg-amber-50 text-amber-700 rounded">
                          VPN
                        </span>
                      )}
                      {!rec.success ? (
                        <span
                          className="px-1.5 py-0.5 text-[10px] font-medium bg-red-50 text-red-700 rounded"
                          title={rec.failureReason}
                        >
                          失败
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 text-[10px] font-medium bg-emerald-50 text-emerald-700 rounded">
                          成功
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {filtered.length > 200 && (
          <div className="px-4 py-2 text-[11px] text-slate-400 text-center border-t border-slate-100">
            仅显示最新 200 条 · 共 {filtered.length} 条
          </div>
        )}
      </section>
    </div>
  );
}

/* ===================================================================== */
/* 小组件                                                                 */
/* ===================================================================== */

function StatCard({
  label, value, icon: Icon, tone,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  tone: "neutral" | "warn";
}) {
  const toneCls = tone === "warn" ? "text-amber-700" : "text-slate-900";
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-[11px] text-slate-500">{label}</span>
      </div>
      <div className={`text-lg font-bold tabular-nums ${toneCls}`}>{value}</div>
    </div>
  );
}

function CountryFlag({ cc }: { cc: string }) {
  const Comp = (CountryFlags as unknown as Record<string, React.ComponentType<{ className?: string }>>)[cc];
  if (!Comp) return null;
  return <Comp className="w-3.5 h-2.5 rounded-sm overflow-hidden" />;
}

function fmtFullTime(iso: string): string {
  return new Date(iso).toLocaleString("zh-CN", {
    month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}
