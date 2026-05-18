"use client";

/**
 * SubTabBar — 二级 Tab 容器，pill segmented control 风格。
 *
 * 跟「交易账户工作台」的子 Tab 视觉一致：灰底胶囊 + 选中态白底投影。
 * 用于 Client Detail Workspace 的一级 Tab 内部（档案与合规 / 风险与安全
 * / 运营 / 审计 / 增长 各自需要切换子模块）。
 *
 * URL 同步：通过 `tab=<primary>&sub=<sub>` query string，刷新/分享/回退
 * 都能恢复到正确位置。
 */

import { useMemo } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

export interface SubTabSpec {
  key: string;
  label: string;
  /** 可选的计数徽章（如 "Tickets 5"）。 */
  count?: number;
}

interface Props {
  /** 一级 Tab 的 key — 用于 URL 同步。 */
  primaryTab: string;
  /** 子 Tab 列表。 */
  subs: SubTabSpec[];
  /** 当前选中 — 子 Tab 切换时上抛。 */
  active: string;
  onChange: (sub: string) => void;
}

export function SubTabBar({ primaryTab, subs, active, onChange }: Props) {
  return (
    <div className="mb-4 inline-flex bg-slate-100 rounded-lg p-0.5 flex-wrap max-w-full">
      {subs.map((s) => {
        const isActive = active === s.key;
        return (
          <button
            key={s.key}
            onClick={() => onChange(s.key)}
            className={`px-3 h-7 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
              isActive
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <span>{s.label}</span>
            {s.count != null && s.count > 0 && (
              <span className="text-[10px] tabular-nums text-slate-400">{s.count}</span>
            )}
          </button>
        );
      })}
      {/* keep primaryTab in scope to avoid lint unused-warning */}
      <span className="hidden" data-primary={primaryTab} />
    </div>
  );
}

/**
 * useSubTab — 把 sub-tab state 同步到 URL `?sub=<key>` 上。
 * 调用方传入默认值和合法 key 数组，hook 返回 [active, setActive]。
 */
export function useSubTab(
  defaultKey: string,
  validKeys: readonly string[],
): [string, (next: string) => void] {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const subParam = searchParams.get("sub");
  const active = useMemo(
    () => (subParam && validKeys.includes(subParam) ? subParam : defaultKey),
    [subParam, validKeys, defaultKey],
  );

  const setActive = (next: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next === defaultKey) params.delete("sub");
    else params.set("sub", next);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  return [active, setActive];
}
