"use client";

/**
 * useSessionTimer (P2-25) — 决策耗时追踪.
 *
 * 在客户详情页打开时启动计时；当运营触发关键决策（approve / reject /
 * 重设权限 等）时调用 `markAction(name)`，记录从打开到操作的耗时。
 *
 * 当前实现：纯前端 mock，只 console.log + 暴露给页面显示。
 * 接入后端时把 markAction 改成 `auditService.logActionLatency(...)`。
 */

import { useEffect, useRef, useState } from "react";

export interface ActionTiming {
  /** 动作名（"approve" / "reject" / "freeze" 等）。 */
  name: string;
  /** 距打开页面的毫秒数。 */
  elapsedMs: number;
  timestamp: string;
}

export function useSessionTimer(clientId: string) {
  // ref 初值用 0 占位；真正赋值在 effect 中（避免 react-hooks/purity 警告）。
  const startRef = useRef<number>(0);
  const [actions, setActions] = useState<ActionTiming[]>([]);

  // 客户切换时（含首次 mount）重置计时；effect 触发的 setState 是「响应
  // 输入变化的状态重置」用途，React 19 推荐的"set state during render"
  // 在这里反而需要操作 ref，会触发另一条 react-hooks/refs 规则。两害取轻：
  // 保留 effect + setState 的写法。
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    startRef.current = Date.now();
    setActions([]);
  }, [clientId]);

  const markAction = (name: string) => {
    const elapsed = Date.now() - startRef.current;
    const action: ActionTiming = {
      name,
      elapsedMs: elapsed,
      timestamp: new Date().toISOString(),
    };
    setActions((prev) => [...prev, action]);
    // 接入后端时换 service call
    console.info(
      `[decision-timing] client=${clientId} action=${name} elapsed=${Math.round(elapsed / 1000)}s`,
    );
  };

  // 不直接 expose startRef.current（react-hooks/refs 规则：ref 不应在 render 时读取）。
  // 调用方需要起始时间时，通过 actions[0]?.timestamp - actions[0]?.elapsedMs 反推即可。
  return {
    actions,
    markAction,
  };
}

/** 把毫秒格式化为 "2m 15s" / "45s" / "1h 5m"。 */
export function formatElapsed(ms: number): string {
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${s % 60}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}
