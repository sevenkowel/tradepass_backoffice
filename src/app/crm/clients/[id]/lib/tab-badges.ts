/**
 * deriveTabBadges — 给每个一级 Tab 派生「需要关注」的徽章数。
 *
 * 设计原则：
 *   - 只显示 actionable 数量（pending KYC / critical risk / 待审申请 等）
 *   - 不显示纯量化指标（账户数 / 历史交易数 / 设备数）—— 那些是详情，不是告警
 *   - tone 反映紧迫度：danger（必须立刻处理）/ warning（关注）/ info（提示）
 *   - 优先级：同 Tab 多个信号叠加时取最高 tone
 */

import type { ClientDetailData } from "@/types/backoffice/client-detail";
import type { TabBadges } from "../ClientDetailTabBar";
import { bucketOfStatus } from "@/types/backoffice/client-detail";

export function deriveTabBadges(data: ClientDetailData): TabBadges {
  const badges: TabBadges = {};
  const { user, accounts, kycDocuments, kycRiskIndicators, cases, tickets, riskRelationships, tradingStats, riskFactors } = data;

  /* ────────── 概览 Tab ────────── */
  // 概览的徽章 = "需要关注事项"总数，按整体最高 tone
  const overviewDanger = user.status === "frozen"
    || user.kycStatus === "rejected"
    || user.riskLevel === "critical"
    || (kycRiskIndicators?.some((k) => k.level === "high") ?? false);
  const overviewWarning = user.kycStatus === "pending"
    || user.riskLevel === "high"
    || (riskRelationships?.some((r) => r.strength >= 0.7) ?? false);

  // 总数 = 各模块未处理项数之和
  const overviewCount = countOverviewSignals(data);
  if (overviewCount > 0) {
    badges.overview = {
      count: overviewCount,
      tone: overviewDanger ? "danger" : overviewWarning ? "warning" : "info",
      title: `${overviewCount} 项待关注事项`,
    };
  }

  /* ────────── 账户 Tab ────────── */
  // 风险账户（受限/禁用/保证金 < 300%）
  const riskyAccounts = accounts.filter((a) => {
    if (a.status !== "active") return true;
    const ml = parseFloat(a.marginLevel);
    return !isNaN(ml) && ml < 300;
  }).length;
  if (riskyAccounts > 0) {
    badges.accounts = {
      count: riskyAccounts,
      tone: riskyAccounts >= 2 ? "danger" : "warning",
      title: `${riskyAccounts} 个账户需关注`,
    };
  }

  /* ────────── 订单 Tab ────────── */
  // 持仓中的"高风险订单"（暂用浮亏超过 -500 的）
  const dangerousPositions = data.trades.filter(
    (t) => !t.closeTime && (t.profit ?? 0) < -500,
  ).length;
  if (dangerousPositions > 0) {
    badges.trading = {
      count: dangerousPositions,
      tone: dangerousPositions >= 3 ? "danger" : "warning",
      title: `${dangerousPositions} 笔持仓浮亏 > $500`,
    };
  }

  /* ────────── 资金 Tab ────────── */
  // 待审核的资金记录（pending / manual_review 的入金 + 出金）
  const pendingFunds = data.funds.filter(
    (f) => f.status === "pending" || f.status === "manual_review",
  ).length;
  if (pendingFunds > 0) {
    badges.funds = {
      count: pendingFunds,
      tone: "warning",
      title: `${pendingFunds} 笔资金记录待审核`,
    };
  }

  /* ────────── 档案与合规 Tab ────────── */
  // KYC pending + 即将过期文档
  let profileCount = 0;
  if (user.kycStatus === "pending" || user.kycStatus === "rejected") profileCount += 1;
  const expiringDocs = (kycDocuments ?? []).filter((doc) => {
    if (!doc.expiryDate) return false;
    const days = (new Date(doc.expiryDate).getTime() - Date.now()) / 86400_000;
    return days > 0 && days < 30;
  }).length;
  profileCount += expiringDocs;
  if (profileCount > 0) {
    badges.profile = {
      count: profileCount,
      tone: user.kycStatus === "rejected" ? "danger" : "warning",
      title: `${profileCount} 项合规事项`,
    };
  }

  /* ────────── 风险与安全 Tab ────────── */
  // 高风险因子 + 强关联客户 + 交易行为告警
  let riskCount = 0;
  riskCount += (riskFactors ?? []).filter((f) => f.level === "high").length;
  riskCount += (riskRelationships ?? []).filter((r) => r.strength >= 0.7).length;
  riskCount += (tradingStats?.riskBehaviors ?? []).filter((b) => b.level === "high").length;
  if (riskCount > 0) {
    badges.risk = {
      count: riskCount,
      tone: user.riskLevel === "critical" ? "danger" : "warning",
      title: `${riskCount} 项高风险信号`,
    };
  }

  /* ────────── 运营 Tab ────────── */
  // 未处理申请 + open 工单
  let opsCount = 0;
  opsCount += (cases ?? []).filter((c) => bucketOfStatus(c.status) === "open").length;
  opsCount += (tickets ?? []).filter((t) => t.status === "open" || t.status === "in_progress").length;
  if (opsCount > 0) {
    badges.operations = {
      count: opsCount,
      tone: opsCount >= 5 ? "warning" : "info",
      title: `${opsCount} 项待运营处理`,
    };
  }

  return badges;
}

/** 计算「概览」Tab 上整体待关注事项数。 */
function countOverviewSignals(data: ClientDetailData): number {
  let n = 0;
  const { user, kycDocuments, riskFactors, riskRelationships, cases, funds } = data;

  if (user.status === "frozen") n += 1;
  if (user.kycStatus === "pending" || user.kycStatus === "rejected") n += 1;
  if (user.riskLevel === "critical" || user.riskLevel === "high") n += 1;
  n += (riskFactors ?? []).filter((f) => f.level === "high").length;
  n += (riskRelationships ?? []).filter((r) => r.strength >= 0.7).length;
  n += (kycDocuments ?? []).filter((doc) => {
    if (!doc.expiryDate) return false;
    const days = (new Date(doc.expiryDate).getTime() - Date.now()) / 86400_000;
    return days > 0 && days < 30;
  }).length;
  n += (cases ?? []).filter((c) => bucketOfStatus(c.status) === "open").length;
  n += (funds ?? []).filter((f) => f.status === "pending" || f.status === "manual_review").length;

  return n;
}
