"use client";

/**
 * OperationsWorkspace — 「运营」一级 Tab 的容器。
 */

import type { ClientDetailData } from "@/types/backoffice/client-detail";
import CasesTab from "../tabs/CasesTab";
import TicketsTab from "../tabs/TicketsTab";
import CommunicationsTab from "../tabs/CommunicationsTab";
import RewardsTab from "../tabs/RewardsTab";
import NotesTab from "../tabs/NotesTab";
import FollowupsTab from "../tabs/FollowupsTab";
import { SubTabBar, useSubTab } from "./SubTabBar";

// 2026-05-16：「审批任务」更名为「申请」，视角从"运营要处理什么 Case"
// 翻转为"客户向平台发起过哪些申请"。底层数据仍是 cases / CaseItem。
const SUBS = [
  { key: "applications",   label: "申请" },
  { key: "tickets",        label: "工单" },
  { key: "communications", label: "沟通记录" },
  { key: "rewards",        label: "奖励" },
  { key: "notes",          label: "备注" },
  { key: "followups",      label: "跟进" },
] as const;

const VALID = SUBS.map((s) => s.key);

export default function OperationsWorkspace({ data }: { data: ClientDetailData }) {
  const [active, setActive] = useSubTab("applications", VALID);

  return (
    <div>
      <SubTabBar primaryTab="operations" subs={[...SUBS]} active={active} onChange={setActive} />

      {active === "applications"   && <CasesTab data={data} />}
      {active === "tickets"        && <TicketsTab data={data} />}
      {active === "communications" && <CommunicationsTab data={data} />}
      {active === "rewards"        && <RewardsTab data={data} />}
      {active === "notes"          && <NotesTab data={data} />}
      {active === "followups"      && <FollowupsTab data={data} />}
    </div>
  );
}
