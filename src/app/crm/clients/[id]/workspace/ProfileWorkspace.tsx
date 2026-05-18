"use client";

/**
 * ProfileWorkspace — 「档案与合规」一级 Tab 容器（2026-05-17 精简）.
 *
 * 重组前 (7 sub-tabs)：
 *   profile / kyc / agreements / bank / wallet / tax / permissions
 *
 * 重组后 (4 sub-tabs)：
 *   - profile      资料
 *   - compliance   合规（KYC + 协议 + 税务，分区展示）
 *   - payments     收付方式（银行账户 + 钱包地址，分区展示）
 *   - permissions  权限与状态
 *
 * 改动原因：
 *   - 之前 7 个 sub-tab 切来切去太碎，多数模块本身又不长
 *   - 合并后单 sub-tab 内信息更集中，scroll 一次看完
 *   - 内容子组件 (KYCTab/AgreementsTab/...) 完全复用，无需重写
 */

import type { ClientDetailData } from "@/types/backoffice/client-detail";
import ProfileInfoTab from "../tabs/ProfileInfoTab";
import KYCTab from "../tabs/KYCTab";
import AgreementsTab from "../tabs/AgreementsTab";
import BankAccountsTab from "../tabs/BankAccountsTab";
import WalletAddressesTab from "../tabs/WalletAddressesTab";
import TaxInfoTab from "../tabs/TaxInfoTab";
import PermissionsTab from "../tabs/PermissionsTab";
import { SubTabBar, useSubTab } from "./SubTabBar";

const SUBS = [
  { key: "profile",     label: "资料" },
  { key: "compliance",  label: "合规" },
  { key: "payments",    label: "收付方式" },
  { key: "permissions", label: "权限与状态" },
] as const;

const VALID = SUBS.map((s) => s.key);

export default function ProfileWorkspace({ data }: { data: ClientDetailData }) {
  const [active, setActive] = useSubTab("profile", VALID);

  return (
    <div>
      <SubTabBar primaryTab="profile" subs={[...SUBS]} active={active} onChange={setActive} />

      {active === "profile"     && <ProfileInfoTab data={data} />}
      {active === "compliance"  && <ComplianceSection data={data} />}
      {active === "payments"    && <PaymentsSection data={data} />}
      {active === "permissions" && <PermissionsTab data={data} />}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Compliance — KYC + 协议 + 税务                                              */
/* ─────────────────────────────────────────────────────────────────────────── */

function ComplianceSection({ data }: { data: ClientDetailData }) {
  return (
    <div className="space-y-8">
      <SectionAnchor id="kyc"        title="实名认证 (KYC)" />
      <KYCTab data={data} />

      <SectionAnchor id="agreements" title="协议文档" />
      <AgreementsTab data={data} />

      <SectionAnchor id="tax"        title="税务信息" />
      <TaxInfoTab data={data} />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Payments — 银行 + 钱包                                                      */
/* ─────────────────────────────────────────────────────────────────────────── */

function PaymentsSection({ data }: { data: ClientDetailData }) {
  return (
    <div className="space-y-8">
      <SectionAnchor id="bank"   title="银行账户" />
      <BankAccountsTab data={data} />

      <SectionAnchor id="wallet" title="加密钱包地址" />
      <WalletAddressesTab data={data} />
    </div>
  );
}

/* ─── Section divider — 让长 scroll 也能看到分组边界 ──────────────────── */

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
