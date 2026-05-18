/**
 * CRM Shell — sidebar + topbar translations.
 *
 * Why a dedicated module instead of extending `config.ts`?
 *
 *   `config.ts` is a 1.6k-line monolith for the **platform** dictionary
 *   (auth, tenants, products, billing, client detail tabs, …). The CRM
 *   shell labels are a self-contained surface — they only ship as
 *   sidebar group / sidebar item / topbar control labels — and live
 *   better as a focused module so editing them doesn't require
 *   scrolling past unrelated copy.
 *
 * Lookup contract:
 *
 *   `shellLabel(locale, label)` is keyed by the **English label string
 *   itself**, not by a synthetic key like `sidebar.dashboard`. Reasons:
 *
 *     1. The menu config in `Sidebar.tsx` already names items by their
 *        English label. Reusing that label as the dict key means we
 *        don't need to add `i18nKey` fields to MenuItem / MenuGroup or
 *        keep two parallel naming schemes in sync.
 *     2. Fallback path is trivial: dict[locale][label] ?? label. Any
 *        missing entry renders the literal English label, so a
 *        half-translated locale degrades gracefully instead of
 *        printing `sidebar.unknown_key`.
 *     3. Adding a new menu item only needs a single change: append the
 *        label to the relevant locale block here. No code-side wiring.
 *
 * Scope:
 *
 *   - Sidebar group names + items + section labels
 *   - TopBar microcopy (notifications header, user menu items, etc.)
 *
 *   Mock content (user names, task subjects, audit notes) is **not**
 *   translated here. Those live in the mock generators and stay
 *   English-only until we wire a proper localized mock layer.
 */

import type { Locale } from "./config";

/* Identity dict (English) — listed for typing-completeness only.
 * Lookup always falls back to the raw label if a locale entry is
 * missing, so we don't actually need to enumerate every English label
 * here. We keep the comment list as documentation. */

const zh: Record<string, string> = {
  /* ── TopNav (see docs/Top-Plus-Side-Nav.md) ─────────────────── */
  "More":                                  "更多",
  "Choose a section from the top menu":    "从顶部菜单选择一个模块",
  "Collapse sidebar":                      "收起侧栏",
  "Expand sidebar":                        "展开侧栏",

  /* ── Sidebar groups (v2 — see docs/Sidebar-IA-v2.md) ────────── */
  "Workspace":        "工作台",
  "Clients":          "客户",
  "Approvals":        "审批",
  "Trading":          "交易",
  "Growth":           "增长",
  "Reports":          "报表",
  "Settings":         "设置",
  /* legacy group names (still referenced by some detail-page
   * breadcrumbs that haven't been migrated yet): */
  "Home":             "主页",
  "Dashboard":        "仪表盘",
  "Approval Center":  "审批中心",
  "CLM Center":       "CLM 合规中心",
  "Risk Center":      "风控中心",
  "Funds":            "资金",
  "Support":          "客服支持",
  "Marketing":        "营销",
  "IB":               "IB 代理",
  "Setup Guide":      "入门指引",
  "System":           "系统设置",
  "Apps":             "应用中心",
  /* Section labels inside groups */
  "Compliance":       "合规",
  "Risk":             "风控",

  /* ── Sidebar items — Dashboard ──────────────────────────────── */
  "Overview":           "概览",
  "Real-time Monitor":  "实时监控",
  "Conversion Funnel":  "转化漏斗",
  "Client 360":         "客户全景",

  /* ── Sidebar items — Approval Center (v3) ───────────────────── */
  "Inbox":             "收件箱",
  "All":               "全部审批",
  "Analytics":         "分析报表",
  "Workflows":         "工作流",
  "Routing Rules":     "路由规则",
  /* "Configuration" + "Notifications" reuse the existing CLM-section
   * translations below, and "SLA" stays as the English acronym. */
  /* legacy entries kept for any deep links: */
  "All Tasks":         "全部任务",
  "My Tasks":          "我的任务",
  "Pending Queue":     "待领取队列",
  "SLA Warning":       "SLA 预警",
  "High Risk":         "高风险",
  "Escalated":         "已升级",
  "Re-Verification":   "重新认证",
  "Audit Trail":       "审计日志",
  "Workflow Config":   "工作流配置",

  /* ── Sidebar items — Clients ────────────────────────────────── */
  "Client List":     "客户列表",
  "Tags":            "标签",
  "Segments":        "分群",
  "Lifecycle":       "生命周期",
  "Notes":           "备注",
  "Relationships":   "关系网络",

  /* ── Sidebar items — CLM (now under Clients in v2 IA) ───────── */
  "Review Queue":              "审核队列",
  "Cases":                     "案件",
  "KYC Cases":                 "KYC 案件",
  "Requests":                  "重审请求",
  "Re-Verification Requests":  "重新认证请求",
  "Re-Verification History":   "重新认证历史",
  "Templates":                 "模板",
  "History":                   "历史记录",
  "SLA & Monitoring":     "SLA 监控",
  "KYC Flows":            "KYC 流程",
  "Routing & Rules":      "路由与规则",
  "Agreement Documents":  "协议文档",
  "System Modules":       "系统模块",
  /* CLM section labels */
  "Operations":      "运营",
  "Configuration":   "配置",

  /* ── Sidebar items — Risk Center ────────────────────────────── */
  "Risk Dashboard":      "风控仪表盘",
  "High-Risk Clients":   "高风险客户",
  "AML Hits":            "AML 命中",
  "Relationship Graph":  "关系图谱",
  "Anomaly Detection":   "异常检测",
  "Device & Security":   "设备与安全",
  "Blacklist":           "黑名单",
  "Whitelist":           "白名单",
  "Scoring Policy":      "评分策略",
  "Risk Rules":          "风控规则",
  "Margin Alerts":       "保证金告警",
  "NBP Protection":      "NBP 保护",

  /* ── Sidebar items — Funds (v2.2 推倒重建) ──────────────────── */
  /* Money Flow */
  "Transactions":           "资金流水",
  "Wallet Deposits":        "钱包入金",
  "Wallet Withdrawals":     "钱包出金",
  "Trading Deposits":       "交易账户存款",
  "Trading Withdrawals":    "交易账户提款",
  /* Internal Transfer */
  "Internal Transfer":      "内部转账",
  "Transfers":              "转账",
  /* Money Assets */
  "Money Assets":           "资金资产",
  "Wallets":                "钱包",
  "Beneficiaries":          "收款方式",
  "Treasury":               "资金池",
  /* Channels */
  "Wallet Channels":        "钱包通道",
  "Trading Channels":       "交易账户通道",
  /* "Routing & Rules" already declared in CLM section above */
  "Fees & Pricing":         "手续费",
  "Bank Master Data":       "银行数据",
  "Payment Channels":       "支付通道",     // legacy
  /* Rate Center */
  "Rate Center":            "汇率中心",
  /* Monitor & Recon */
  "Monitor & Recon":        "监控与对账",
  "Fund Monitoring":        "资金监控",
  "Reconciliation":         "对账",
  "Adjustments":            "调账",
  /* Governance */
  "Governance":             "治理",
  "Policies & Limits":      "策略与限额",
  "Risk & Compliance":      "风控与合规",
  "Approval Workflow":      "审批流程",
  /* Section labels (v2.2 IA) */
  "Money Flow":             "资金流水",
  /* Legacy (kept for back-compat 重定向页) */
  "Deposits":               "入金",
  "Withdrawals":            "出金",
  "Withdrawal Review":      "出金审核",
  "MT Bridge":              "MT 桥接",
  "Money flow":             "资金流水",
  "Money assets":           "资金资产",
  "Channels":               "通道",
  "Fund Policy":            "资金策略",

  /* ── Sidebar items — Trading ────────────────────────────────── */
  "Orders":              "订单",
  "Positions":           "持仓",
  "Instruments":         "交易品种",
  "Accounts":            "账户",            // section label
  "Account List":        "账户列表",
  "Account Groups":      "账户分组",
  "Leverage Config":     "杠杆配置",
  "Trading Settings":    "交易设置",
  "Product Config":      "品种配置",

  /* ── Sidebar items — Support ────────────────────────────────── */
  "Tickets":         "工单",
  "Email Log":       "邮件日志",
  "SMS Log":         "短信日志",
  "Push Log":        "推送日志",
  "Chat History":    "聊天记录",

  /* ── Sidebar items — Marketing ──────────────────────────────── */
  "Campaigns":         "活动",
  "Messages":          "消息",
  "Banners":           "横幅",
  "News / Insights":   "资讯 / 洞察",

  /* ── Sidebar items — Reports ────────────────────────────────── */
  "Financial Reports":   "财务报表",
  "Trading Reports":     "交易报表",
  "User Reports":        "用户报表",
  "Conversion Reports":  "转化报表",
  "Compliance Reports":  "合规报表",

  /* ── Sidebar items — IB ─────────────────────────────────────── */
  "IB Dashboard":   "IB 仪表盘",
  "IB Tree":        "IB 层级",
  "Commissions":    "佣金",
  "IB Settings":    "IB 设置",

  /* ── Sidebar items — Setup Guide ────────────────────────────── */
  "Setup Checklist":  "配置清单",
  "Manuals & Docs":   "手册与文档",

  /* ── Sidebar items — System ─────────────────────────────────── */
  "Staff Management":      "员工管理",
  "Departments":           "部门",
  "Roles & Permissions":   "角色与权限",
  "Security Settings":     "安全设置",
  "Operation Logs":        "操作日志",
  "API Management":        "API 管理",

  /* ── Sidebar items — Apps ───────────────────────────────────── */
  "App Center":   "应用商店",

  /* ── Sidebar badge fragments ────────────────────────────────── */
  "overdue":         "逾期",

  /* ── Sidebar footer ─────────────────────────────────────────── */
  "Need help?":      "需要帮助？",
  "Contact support": "联系客服",

  /* ── TopBar microcopy ───────────────────────────────────────── */
  "Language":            "语言",
  "LIVE":                "线上",
  "Search users, orders, MT accounts... (Ctrl+K)":  "搜索客户 / 订单 / MT 账号… (Ctrl+K)",
  "Search...":           "搜索…",
  "Notifications":       "通知",
  "View All Notifications":  "查看全部通知",
  "Profile":             "个人资料",
  /* "Settings" is defined above in the sidebar-groups block */
  "Sign Out":            "退出登录",
  "Cancel":              "取消",
  "Admin":               "管理员",
};

/* ja and es intentionally empty — they fall back to the English label
 * via the lookup helper. Populate when those locales are prioritized. */
const ja: Record<string, string> = {};
const es: Record<string, string> = {};

const SHELL_DICT: Record<Locale, Record<string, string>> = {
  en: {}, // identity (key === label)
  zh,
  ja,
  es,
};

/** Resolve a CRM shell label to the given locale. Falls back to the
 *  literal English label if the locale doesn't have an entry — never
 *  prints a synthetic key. */
export function shellLabel(locale: Locale, label: string): string {
  return SHELL_DICT[locale]?.[label] ?? label;
}
