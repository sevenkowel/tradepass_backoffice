"use client";

/**
 * RiskWorkspace — 「风险与安全」一级 Tab 的容器。
 */

import type { ClientDetailData } from "@/types/backoffice/client-detail";
import RiskTab from "../tabs/RiskTab";
import DevicesTab from "../tabs/DevicesTab";
import AMLScreeningTab from "../tabs/AMLScreeningTab";
import LoginSecurityTab from "../tabs/LoginSecurityTab";
import RelationshipNetworkTab from "../tabs/RelationshipNetworkTab";
import RestrictionsTab from "../tabs/RestrictionsTab";
import RiskEventsTab from "../tabs/RiskEventsTab";
import TradingBehaviorsTab from "../tabs/TradingBehaviorsTab";
import { SubTabBar, useSubTab } from "./SubTabBar";

// 2026-05-16：「交易行为」从订单 Tab 迁移到这里。交易风险行为本质是
// 风控判定（套利 / scalping / 高频滥用），归属风险与安全更合理。
const SUBS = [
  { key: "overview",         label: "风险概览" },
  { key: "tradingBehaviors", label: "交易行为" },
  { key: "aml",              label: "反洗钱" },
  { key: "devices",          label: "设备" },
  { key: "login",            label: "登录安全" },
  { key: "relationships",    label: "关系网络" },
  { key: "restrictions",     label: "限制汇总" },
  { key: "events",           label: "风险事件" },
] as const;

const VALID = SUBS.map((s) => s.key);

export default function RiskWorkspace({ data }: { data: ClientDetailData }) {
  const [active, setActive] = useSubTab("overview", VALID);

  return (
    <div>
      <SubTabBar primaryTab="risk" subs={[...SUBS]} active={active} onChange={setActive} />

      {active === "overview"         && <RiskTab data={data} />}
      {active === "tradingBehaviors" && <TradingBehaviorsTab data={data} />}
      {active === "aml"              && <AMLScreeningTab data={data} />}
      {active === "devices"          && <DevicesTab data={data} />}
      {active === "login"            && <LoginSecurityTab data={data} />}
      {active === "relationships"    && <RelationshipNetworkTab data={data} />}
      {active === "restrictions"     && <RestrictionsTab data={data} />}
      {active === "events"           && <RiskEventsTab data={data} />}
    </div>
  );
}
