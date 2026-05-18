"use client";

/**
 * AuditWorkspace — 「审计」一级 Tab 容器（2026-05-17 重新组织）.
 *
 * 子 Tab 5 个，按"由近及远 / 由细到粗"组织：
 *   - login        登录历史   (24h 热力图 + 完整记录)
 *   - milestones   里程碑     (客户生命周期关键节点 + 未达成的 placeholder) ★ 新
 *   - activity     活动       (客户身上所有事件流 + filter chips)             ★ 重写
 *   - logs         操作日志   (运营对客户做了什么 · 跨域 GlobalAuditLog)
 *   - changes      变更记录   (字段级 before/after diff)                       ★ 改名
 *
 * 重组背景：
 *   - 原「时间线」与「事件流」严重重叠（同一组业务事件不同分类粒度）。
 *     合并后：里程碑（mock 派生 ~10 个关键节点）+ 活动（真实 timeline + 7 个分类 chip）。
 *   - 「审计追踪」(AuditTrailTab) 改名「变更记录」(changes)，与"操作日志"对照更清晰。
 */

import type { ClientDetailData } from "@/types/backoffice/client-detail";
import MilestonesTab from "../tabs/MilestonesTab";
import LogsTab from "../tabs/LogsTab";
import LoginHistoryTab from "../tabs/LoginHistoryTab";
import EventStreamTab from "../tabs/EventStreamTab";
import AuditTrailTab from "../tabs/AuditTrailTab";
import { SubTabBar, useSubTab } from "./SubTabBar";

const SUBS = [
  { key: "login",      label: "登录历史" },
  { key: "milestones", label: "里程碑" },
  { key: "activity",   label: "活动" },
  { key: "logs",       label: "操作日志" },
  { key: "changes",    label: "变更记录" },
] as const;

const VALID = SUBS.map((s) => s.key);

export default function AuditWorkspace({ data }: { data: ClientDetailData }) {
  const [active, setActive] = useSubTab("login", VALID);

  return (
    <div>
      <SubTabBar primaryTab="audit" subs={[...SUBS]} active={active} onChange={setActive} />

      {active === "login"      && <LoginHistoryTab data={data} />}
      {active === "milestones" && <MilestonesTab data={data} />}
      {active === "activity"   && <EventStreamTab data={data} />}
      {active === "logs"       && <LogsTab data={data} />}
      {active === "changes"    && <AuditTrailTab data={data} />}
    </div>
  );
}
