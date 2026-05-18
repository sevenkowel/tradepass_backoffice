/**
 * Mock lifecycle milestone templates + dynamic rules.
 *
 * 这些模板是 broker 内置的"里程碑模板库"，客户详情页的里程碑显示
 * 都关联到这里的 key。运营在 /crm/clients/lifecycle 页面可以编辑
 * 这些模板（暂用 localStorage 持久化，演示阶段）。
 */

import type {
  MilestoneTemplate, DynamicRule,
} from "@/types/backoffice/lifecycle-templates";

/* ─────────────────────────────────────────────────────────────────────────── */
/* 12 个内置里程碑模板                                                          */
/* ─────────────────────────────────────────────────────────────────────────── */

export const MOCK_MILESTONE_TEMPLATES: MilestoneTemplate[] = [
  {
    id: "tpl_registered",
    key: "registered",
    title: "账户注册",
    description: "客户在平台完成注册",
    category: "onboarding",
    icon: "user-plus",
    weight: "high",
    trigger: {
      conditions: [{ field: "user.createdAt", op: "exists" }],
      once: true,
    },
    actions: [
      { type: "add_tag", params: { tag: "New" } },
      { type: "send_email", params: { template: "welcome" } },
    ],
    enabled: true,
    order: 1,
    builtIn: true,
    recentTriggers: 124,
    lastTriggeredAt: new Date(Date.now() - 2 * 3600_000).toISOString(),
  },
  {
    id: "tpl_email_verified",
    key: "email_verified",
    title: "邮箱验证",
    description: "客户点击邮件验证链接",
    category: "onboarding",
    icon: "mail-check",
    weight: "medium",
    trigger: {
      conditions: [{ field: "user.emailVerified", op: "eq", value: true }],
      once: true,
    },
    actions: [
      { type: "add_tag", params: { tag: "Email Verified" } },
    ],
    enabled: true,
    order: 2,
    builtIn: true,
    recentTriggers: 98,
    lastTriggeredAt: new Date(Date.now() - 5 * 3600_000).toISOString(),
  },
  {
    id: "tpl_first_login",
    key: "first_login",
    title: "首次登录",
    description: "客户首次成功登录平台",
    category: "onboarding",
    icon: "log-in",
    weight: "medium",
    trigger: {
      conditions: [{ field: "user.firstLoginAt", op: "exists" }],
      once: true,
    },
    actions: [
      { type: "notify_staff", params: { team: "sales" } },
    ],
    enabled: true,
    order: 3,
    builtIn: true,
    recentTriggers: 105,
    lastTriggeredAt: new Date(Date.now() - 8 * 3600_000).toISOString(),
  },
  {
    id: "tpl_kyc_l1",
    key: "kyc_l1_verified",
    title: "KYC Level 1 通过",
    description: "合规审核通过基础 KYC",
    category: "compliance",
    icon: "shield-check",
    weight: "high",
    trigger: {
      conditions: [
        { field: "user.kycStatus", op: "eq", value: "verified" },
        { field: "user.kycLevel", op: "in", value: ["L1", "L2", "L3"] },
      ],
      once: true,
    },
    actions: [
      { type: "add_tag", params: { tag: "KYC L1" } },
      { type: "unlock_feature", params: { feature: "trading" } },
      { type: "send_email", params: { template: "kyc-approved" } },
    ],
    enabled: true,
    order: 4,
    builtIn: true,
    recentTriggers: 76,
    lastTriggeredAt: new Date(Date.now() - 12 * 3600_000).toISOString(),
  },
  {
    id: "tpl_agreement_signed",
    key: "agreement_signed",
    title: "用户协议签署",
    description: "签署用户协议 + 风险披露书",
    category: "compliance",
    icon: "file-signature",
    weight: "low",
    trigger: {
      conditions: [{ field: "agreements.completed", op: "eq", value: true }],
      once: true,
    },
    actions: [],
    enabled: true,
    order: 5,
    builtIn: true,
    recentTriggers: 72,
  },
  {
    id: "tpl_ftd",
    key: "ftd",
    title: "首次入金 (FTD)",
    description: "客户完成首笔入金，转化为付费用户",
    category: "funding",
    icon: "arrow-down",
    weight: "high",
    trigger: {
      conditions: [
        { field: "valueMetrics.netDeposit", op: "gt", value: 0 },
      ],
      once: true,
    },
    actions: [
      { type: "add_tag", params: { tag: "Funded" } },
      { type: "notify_staff", params: { team: "sales" } },
      { type: "send_email", params: { template: "ftd-welcome" } },
    ],
    enabled: true,
    order: 6,
    builtIn: true,
    recentTriggers: 58,
    lastTriggeredAt: new Date(Date.now() - 3 * 3600_000).toISOString(),
  },
  {
    id: "tpl_first_trade",
    key: "first_trade",
    title: "首次交易",
    description: "客户在 MT 终端完成首笔交易",
    category: "trading",
    icon: "trending-up",
    weight: "high",
    trigger: {
      conditions: [{ field: "trades.count", op: "gt", value: 0 }],
      once: true,
    },
    actions: [
      { type: "add_tag", params: { tag: "Active Trader" } },
    ],
    enabled: true,
    order: 7,
    builtIn: true,
    recentTriggers: 52,
    lastTriggeredAt: new Date(Date.now() - 1 * 3600_000).toISOString(),
  },
  {
    id: "tpl_first_withdrawal",
    key: "first_withdrawal",
    title: "首次出金",
    description: "客户完成首笔出金（验证资金可退）",
    category: "funding",
    icon: "arrow-up",
    weight: "medium",
    trigger: {
      conditions: [{ field: "withdrawals.completed", op: "gt", value: 0 }],
      once: true,
    },
    actions: [
      { type: "notify_staff", params: { team: "retention" } },
    ],
    enabled: true,
    order: 8,
    builtIn: true,
    recentTriggers: 32,
  },
  {
    id: "tpl_kyc_l2",
    key: "kyc_l2_verified",
    title: "KYC Level 2 升级",
    description: "完成地址证明 + 视频认证，解锁高级权限",
    category: "compliance",
    icon: "shield-check",
    weight: "high",
    trigger: {
      conditions: [
        { field: "user.kycLevel", op: "in", value: ["L2", "L3"] },
      ],
      once: true,
    },
    actions: [
      { type: "add_tag", params: { tag: "KYC L2" } },
      { type: "unlock_feature", params: { feature: "high_leverage" } },
    ],
    enabled: true,
    order: 9,
    builtIn: true,
    recentTriggers: 28,
  },
  {
    id: "tpl_vip_promote",
    key: "vip_promoted",
    title: "VIP 升级",
    description: "累计入金达到 VIP 门槛，解锁专属客户经理",
    category: "growth",
    icon: "crown",
    weight: "high",
    trigger: {
      conditions: [{ field: "valueMetrics.netDeposit", op: "gte", value: 25000 }],
      once: true,
    },
    actions: [
      { type: "add_tag", params: { tag: "VIP" } },
      { type: "assign_to_team", params: { team: "vip-management" } },
      { type: "send_email", params: { template: "vip-upgrade" } },
    ],
    enabled: true,
    order: 10,
    builtIn: true,
    recentTriggers: 14,
    lastTriggeredAt: new Date(Date.now() - 24 * 3600_000).toISOString(),
  },
  {
    id: "tpl_referral_first",
    key: "referral_first",
    title: "首个被推荐客户 FTD",
    description: "IB / Affiliate 推荐的第一位客户完成首存",
    category: "growth",
    icon: "users",
    weight: "medium",
    trigger: {
      conditions: [
        { field: "user.role", op: "in", value: ["partner", "affiliate"] },
        { field: "referrals.ftdCount", op: "gte", value: 1 },
      ],
      once: true,
    },
    actions: [
      { type: "add_tag", params: { tag: "Active IB" } },
      { type: "send_email", params: { template: "ib-first-referral" } },
    ],
    enabled: true,
    order: 11,
    builtIn: true,
    recentTriggers: 6,
  },
  {
    id: "tpl_one_year",
    key: "one_year_anniv",
    title: "注册一周年",
    description: "客户在平台已满一年",
    category: "retention",
    icon: "calendar-clock",
    weight: "low",
    trigger: {
      conditions: [{ field: "user.createdAt", op: "elapsed_days", value: 365 }],
      once: true,
    },
    actions: [
      { type: "send_email", params: { template: "anniversary" } },
    ],
    enabled: true,
    order: 12,
    builtIn: true,
    recentTriggers: 3,
  },
  {
    id: "tpl_dormant_30",
    key: "dormant_30d",
    title: "30 天沉默",
    description: "客户 30 天未登录 — 留存团队介入",
    category: "retention",
    icon: "calendar-clock",
    weight: "medium",
    trigger: {
      conditions: [{ field: "user.lastLoginAt", op: "elapsed_days", value: 30 }],
      once: false,
    },
    actions: [
      { type: "create_followup", params: { team: "retention", priority: "medium" } },
      { type: "send_email", params: { template: "we-miss-you" } },
    ],
    enabled: true,
    order: 13,
    builtIn: true,
    recentTriggers: 47,
    lastTriggeredAt: new Date(Date.now() - 4 * 3600_000).toISOString(),
  },
  {
    id: "tpl_account_frozen",
    key: "account_frozen",
    title: "账户冻结",
    description: "风控触发账户冻结",
    category: "risk",
    icon: "ban",
    weight: "high",
    trigger: {
      conditions: [{ field: "user.status", op: "eq", value: "frozen" }],
      once: false,
    },
    actions: [
      { type: "add_tag", params: { tag: "Frozen" } },
      { type: "notify_staff", params: { team: "risk" } },
      { type: "lock_feature", params: { feature: "trading" } },
      { type: "lock_feature", params: { feature: "withdrawal" } },
    ],
    enabled: true,
    order: 14,
    builtIn: true,
    recentTriggers: 9,
    lastTriggeredAt: new Date(Date.now() - 18 * 3600_000).toISOString(),
  },
];

/* ─────────────────────────────────────────────────────────────────────────── */
/* 8 条 Dynamic Rules                                                         */
/* ─────────────────────────────────────────────────────────────────────────── */

const STAFF_NAMES = ["Alice Chen", "Bob Martin", "Carol Wong", "David Liu"];

export const MOCK_DYNAMIC_RULES: DynamicRule[] = [
  {
    id: "rule_high_deposit_vip",
    name: "高净值识别",
    description: "客户净入金超 $50k 自动加 VIP 标签 + 通知客户经理",
    triggerEvent: "deposit_completed",
    conditions: [{ field: "valueMetrics.netDeposit", op: "gte", value: 50_000 }],
    actions: [
      { type: "add_tag", params: { tag: "VIP" } },
      { type: "assign_to_team", params: { team: "vip-management" } },
      { type: "notify_staff", params: { team: "sales-lead" } },
    ],
    enabled: true,
    runCount: 23,
    lastRunAt: new Date(Date.now() - 3 * 3600_000).toISOString(),
    createdAt: new Date(Date.now() - 90 * 86400_000).toISOString(),
    createdBy: STAFF_NAMES[0],
  },
  {
    id: "rule_dormant_90",
    name: "90 天沉默 — 留存活动",
    description: "客户 90 天未登录，自动发留存活动邮件并创建任务",
    triggerEvent: "scheduled",
    conditions: [{ field: "user.lastLoginAt", op: "elapsed_days", value: 90 }],
    actions: [
      { type: "send_email", params: { template: "we-miss-you-90d" } },
      { type: "create_followup", params: { team: "retention", priority: "high" } },
    ],
    enabled: true,
    runCount: 156,
    lastRunAt: new Date(Date.now() - 12 * 3600_000).toISOString(),
    createdAt: new Date(Date.now() - 180 * 86400_000).toISOString(),
    createdBy: STAFF_NAMES[1],
  },
  {
    id: "rule_high_risk_score",
    name: "高风险标记",
    description: "风险评分 > 70 自动加 HighRisk 标签",
    triggerEvent: "risk_score_changed",
    conditions: [{ field: "user.riskScore", op: "gt", value: 70 }],
    actions: [
      { type: "add_tag", params: { tag: "High Risk" } },
      { type: "notify_staff", params: { team: "risk" } },
    ],
    enabled: true,
    runCount: 18,
    lastRunAt: new Date(Date.now() - 8 * 3600_000).toISOString(),
    createdAt: new Date(Date.now() - 60 * 86400_000).toISOString(),
    createdBy: STAFF_NAMES[2],
  },
  {
    id: "rule_kyc_expiring",
    name: "KYC 即将过期提醒",
    description: "证件 30 天内过期，发送续期提醒邮件",
    triggerEvent: "scheduled",
    conditions: [{ field: "kycDocuments.expiryDate", op: "elapsed_days", value: -30 }],
    actions: [
      { type: "send_email", params: { template: "kyc-renewal" } },
      { type: "create_followup", params: { team: "compliance", priority: "medium" } },
    ],
    enabled: true,
    runCount: 41,
    lastRunAt: new Date(Date.now() - 24 * 3600_000).toISOString(),
    createdAt: new Date(Date.now() - 120 * 86400_000).toISOString(),
    createdBy: STAFF_NAMES[0],
  },
  {
    id: "rule_large_withdrawal",
    name: "大额出金审核",
    description: "单笔出金 > $10k 自动通知风控人工复审",
    triggerEvent: "withdrawal_requested",
    conditions: [{ field: "withdrawal.amount", op: "gt", value: 10_000 }],
    actions: [
      { type: "notify_staff", params: { team: "risk" } },
      { type: "create_followup", params: { team: "risk", priority: "high" } },
    ],
    enabled: true,
    runCount: 87,
    lastRunAt: new Date(Date.now() - 2 * 3600_000).toISOString(),
    createdAt: new Date(Date.now() - 200 * 86400_000).toISOString(),
    createdBy: STAFF_NAMES[3],
  },
  {
    id: "rule_first_login_welcome",
    name: "首登欢迎",
    description: "客户首次登录后 1 小时发送新手引导邮件",
    triggerEvent: "login_detected",
    conditions: [{ field: "user.loginCount", op: "eq", value: 1 }],
    actions: [
      { type: "send_email", params: { template: "first-login-guide", delay: "1h" } },
    ],
    enabled: true,
    runCount: 312,
    lastRunAt: new Date(Date.now() - 1 * 3600_000).toISOString(),
    createdAt: new Date(Date.now() - 240 * 86400_000).toISOString(),
    createdBy: STAFF_NAMES[1],
  },
  {
    id: "rule_high_freq_trader",
    name: "高频交易者识别",
    description: "日均交易 > 50 笔，标记为高频交易者，转交风险评估",
    triggerEvent: "trade_executed",
    conditions: [{ field: "tradingStats.daily", op: "gt", value: 50 }],
    actions: [
      { type: "add_tag", params: { tag: "High Frequency" } },
      { type: "notify_staff", params: { team: "risk" } },
    ],
    enabled: false,
    runCount: 4,
    createdAt: new Date(Date.now() - 30 * 86400_000).toISOString(),
    createdBy: STAFF_NAMES[2],
  },
  {
    id: "rule_referral_bonus",
    name: "推荐奖励触发",
    description: "IB 客户每完成 5 个推荐 FTD，自动派发奖金",
    triggerEvent: "deposit_completed",
    conditions: [
      { field: "user.role", op: "eq", value: "partner" },
      { field: "referrals.ftdCount", op: "elapsed_days", value: 5 },
    ],
    actions: [
      { type: "trigger_webhook", params: { url: "/internal/ib/bonus", action: "pay" } },
      { type: "send_email", params: { template: "ib-bonus-paid" } },
    ],
    enabled: true,
    runCount: 12,
    lastRunAt: new Date(Date.now() - 48 * 3600_000).toISOString(),
    createdAt: new Date(Date.now() - 90 * 86400_000).toISOString(),
    createdBy: STAFF_NAMES[3],
  },
];

/* ─────────────────────────────────────────────────────────────────────────── */
/* localStorage 持久化（用户编辑模板时落地）                                    */
/* ─────────────────────────────────────────────────────────────────────────── */

const LS_TEMPLATES_KEY = "crm:lifecycle:templates";
const LS_RULES_KEY = "crm:lifecycle:rules";

export function loadMilestoneTemplates(): MilestoneTemplate[] {
  if (typeof window === "undefined") return MOCK_MILESTONE_TEMPLATES;
  try {
    const raw = window.localStorage.getItem(LS_TEMPLATES_KEY);
    return raw ? (JSON.parse(raw) as MilestoneTemplate[]) : MOCK_MILESTONE_TEMPLATES;
  } catch {
    return MOCK_MILESTONE_TEMPLATES;
  }
}

export function saveMilestoneTemplates(templates: MilestoneTemplate[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LS_TEMPLATES_KEY, JSON.stringify(templates));
  } catch { /* quota — ignore */ }
}

export function loadDynamicRules(): DynamicRule[] {
  if (typeof window === "undefined") return MOCK_DYNAMIC_RULES;
  try {
    const raw = window.localStorage.getItem(LS_RULES_KEY);
    return raw ? (JSON.parse(raw) as DynamicRule[]) : MOCK_DYNAMIC_RULES;
  } catch {
    return MOCK_DYNAMIC_RULES;
  }
}

export function saveDynamicRules(rules: DynamicRule[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LS_RULES_KEY, JSON.stringify(rules));
  } catch { /* ignore */ }
}
