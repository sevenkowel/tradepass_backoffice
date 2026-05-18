"use client";

/**
 * useTabReadState (P1-18) — Tab 未读指示.
 *
 * 思路：
 *   - 每个 Tab 的徽章数字（来自 tab-badges.ts）是 "actionable 条数"
 *   - 第一次进入 Tab 时，把"当前徽章数 + 时间戳"写入 localStorage 作为 baseline
 *   - 下次再进来时，如果当前徽章 ≤ baseline → 该 Tab "已读"（变灰 / 隐藏小红点）
 *   - 如果当前徽章 > baseline（出现新告警） → 显示"+N 新告警" 指示
 *
 * 优势：纯前端，不依赖后端 read-state；运营每个人维护自己的"看过没看过"。
 */

import { useCallback, useEffect, useState } from "react";
import type { ClientTabKey } from "../ClientDetailTabBar";

interface ReadState {
  /** 记录"看过时的徽章数"为基准。当前徽章 > 基准 → 显示 +N 新增。 */
  baseline: number;
  /** 上次查看时间戳。 */
  lastVisitedAt: string;
}

const STORAGE_KEY_PREFIX = "crm:client-detail:tab-read:";

function storageKey(clientId: string): string {
  return `${STORAGE_KEY_PREFIX}${clientId}`;
}

function readAll(clientId: string): Partial<Record<ClientTabKey, ReadState>> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(storageKey(clientId));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeAll(clientId: string, data: Partial<Record<ClientTabKey, ReadState>>): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey(clientId), JSON.stringify(data));
  } catch {
    /* quota exceeded — ignore */
  }
}

/**
 * 返回每个 Tab 的"新增告警数"。当前徽章 - baseline，> 0 表示有新增。
 * 还返回 markRead(tabKey, currentCount) 用于在 Tab 切换/访问时更新 baseline。
 */
export function useTabReadState(clientId: string, currentBadges: Partial<Record<ClientTabKey, number>>) {
  const [readState, setReadState] = useState<Partial<Record<ClientTabKey, ReadState>>>({});

  // 客户切换时加载该客户的 read-state
  useEffect(() => {
    setReadState(readAll(clientId));
  }, [clientId]);

  const markRead = useCallback((tabKey: ClientTabKey) => {
    const count = currentBadges[tabKey] ?? 0;
    setReadState((prev) => {
      const next: typeof prev = {
        ...prev,
        [tabKey]: {
          baseline: count,
          lastVisitedAt: new Date().toISOString(),
        },
      };
      writeAll(clientId, next);
      return next;
    });
  }, [clientId, currentBadges]);

  /** 派生"每个 Tab 的新增告警数"。 */
  const deltas: Partial<Record<ClientTabKey, number>> = {};
  for (const key of Object.keys(currentBadges) as ClientTabKey[]) {
    const cur = currentBadges[key] ?? 0;
    const baseline = readState[key]?.baseline;
    if (baseline === undefined) {
      // 从未访问过 → 全部视为新
      if (cur > 0) deltas[key] = cur;
    } else if (cur > baseline) {
      deltas[key] = cur - baseline;
    }
  }

  return { deltas, markRead };
}
