"use client";

/**
 * GrowthWorkspace — 「增长」一级 Tab 容器（2026-05-17 精简）.
 *
 * 重组前 (4 sub-tabs)：
 *   promotions / ib / referrals / copyTrading
 *
 * 重组后 (2 sub-tabs)：
 *   - partnerships  IB 与推荐（IB + 推荐合并，本质上都是"客户为他人引流"的关系）
 *   - copyTrading   跟单（业务独立，保留）
 *   - marketing 已并入「IB 与推荐」顶部活动区
 *
 * 改动原因：IBTab / ReferralsTab / MarketingTab 三个文件都不长（~40-230 行），
 * 但每个都是独立 sub-tab 切换成本高。合并后用 anchor 分区，scroll 一次看完。
 */

import type { ClientDetailData } from "@/types/backoffice/client-detail";
import MarketingTab from "../tabs/MarketingTab";
import IBTab from "../tabs/IBTab";
import ReferralsTab from "../tabs/ReferralsTab";
import CopyTradingTab from "../tabs/CopyTradingTab";
import { SubTabBar, useSubTab } from "./SubTabBar";

const SUBS = [
  { key: "partnerships",  label: "IB 与推荐" },
  { key: "copyTrading",   label: "跟单" },
] as const;

const VALID = SUBS.map((s) => s.key);

export default function GrowthWorkspace({ data }: { data: ClientDetailData }) {
  const [active, setActive] = useSubTab("partnerships", VALID);

  return (
    <div>
      <SubTabBar primaryTab="growth" subs={[...SUBS]} active={active} onChange={setActive} />

      {active === "partnerships" && <PartnershipsSection data={data} />}
      {active === "copyTrading"  && <CopyTradingTab data={data} />}
    </div>
  );
}

function PartnershipsSection({ data }: { data: ClientDetailData }) {
  return (
    <div className="space-y-8">
      <SectionAnchor id="ib"          title="IB 合作伙伴" />
      <IBTab data={data} />

      <SectionAnchor id="referrals"   title="推荐客户" />
      <ReferralsTab data={data} />

      <SectionAnchor id="promotions"  title="活动与营销" />
      <MarketingTab data={data} />
    </div>
  );
}

function SectionAnchor({ id, title }: { id: string; title: string }) {
  return (
    <div id={id} className="flex items-center gap-2 pb-2 border-b border-slate-100">
      <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
        {title}
      </span>
      <span className="flex-1 h-px bg-slate-100" />
    </div>
  );
}
