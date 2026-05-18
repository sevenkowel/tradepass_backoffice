/**
 * TradePass Feature Flag 默认值矩阵
 * 系统级默认值，按套餐定义功能权限
 * 优先级：Tenant 覆盖 > 系统默认值
 */

export type Plan = "free" | "starter" | "professional" | "enterprise" | "ultimate";

export interface FeatureFlag {
  key: string;
  category: string;
  name: string;
  description: string;
  plan: Plan; // 最低可用套餐
  enabled: boolean;
  requiresUpgrade: boolean;
  upgradeTarget?: Plan;
}

/**
 * 套餐优先级（用于权限比较）
 */
export const PLAN_PRIORITY: Record<Plan, number> = {
  free: 0,
  starter: 1,
  professional: 2,
  enterprise: 3,
  ultimate: 4,
};

/**
 * 系统默认 Feature Flags
 */
export const DEFAULT_FEATURE_FLAGS: FeatureFlag[] = [
  // === TradePass Business ===
  {
    key: "portal_access",
    category: "business",
    name: "Portal 访问",
    description: "终端客户门户访问",
    plan: "free",
    enabled: true,
    requiresUpgrade: false,
  },
  {
    key: "backoffice_access",
    category: "business",
    name: "Backoffice 访问",
    description: "经纪人后台管理系统",
    plan: "starter",
    enabled: false,
    requiresUpgrade: true,
    upgradeTarget: "starter",
  },
  {
    key: "kyc_basic",
    category: "business",
    name: "基础 KYC",
    description: "基础身份验证（1个地区）",
    plan: "free",
    enabled: true,
    requiresUpgrade: false,
  },
  {
    key: "kyc_standard",
    category: "business",
    name: "标准 KYC",
    description: "标准身份验证（多地区）",
    plan: "starter",
    enabled: false,
    requiresUpgrade: true,
    upgradeTarget: "starter",
  },
  {
    key: "kyc_enhanced",
    category: "business",
    name: "增强 KYC",
    description: "增强身份验证 + AML",
    plan: "professional",
    enabled: false,
    requiresUpgrade: true,
    upgradeTarget: "professional",
  },
  {
    key: "funds_usdt",
    category: "business",
    name: "USDT 存取款",
    description: "USDT-TRC20 存款和提款",
    plan: "free",
    enabled: true,
    requiresUpgrade: false,
  },
  {
    key: "funds_bank",
    category: "business",
    name: "银行转账",
    description: "SWIFT / 电汇存取款",
    plan: "starter",
    enabled: false,
    requiresUpgrade: true,
    upgradeTarget: "starter",
  },
  {
    key: "funds_card",
    category: "business",
    name: "信用卡支付",
    description: "Visa / Mastercard 支付",
    plan: "professional",
    enabled: false,
    requiresUpgrade: true,
    upgradeTarget: "professional",
  },
  {
    key: "user_management",
    category: "business",
    name: "用户管理",
    description: "用户列表、等级、标签管理",
    plan: "starter",
    enabled: false,
    requiresUpgrade: true,
    upgradeTarget: "starter",
  },
  {
    key: "reports_basic",
    category: "business",
    name: "基础报表",
    description: "基础财务和交易报表",
    plan: "starter",
    enabled: false,
    requiresUpgrade: true,
    upgradeTarget: "starter",
  },
  {
    key: "reports_advanced",
    category: "business",
    name: "高级报表",
    description: "自定义报表、数据导出",
    plan: "professional",
    enabled: false,
    requiresUpgrade: true,
    upgradeTarget: "professional",
  },

  // === TradePass Growth ===
  {
    key: "ib_l1",
    category: "growth",
    name: "L1 IB 代理",
    description: "一级代理佣金体系",
    plan: "starter",
    enabled: false,
    requiresUpgrade: true,
    upgradeTarget: "starter",
  },
  {
    key: "ib_l2_l3",
    category: "growth",
    name: "L2/L3 IB 代理",
    description: "多级代理佣金分层",
    plan: "professional",
    enabled: false,
    requiresUpgrade: true,
    upgradeTarget: "professional",
  },
  {
    key: "ib_commission_withdraw",
    category: "growth",
    name: "IB 佣金提现",
    description: "代理佣金提现功能",
    plan: "professional",
    enabled: false,
    requiresUpgrade: true,
    upgradeTarget: "professional",
  },
  {
    key: "marketing_campaigns",
    category: "growth",
    name: "营销活动管理",
    description: "活动创建、Banner、消息推送",
    plan: "professional",
    enabled: false,
    requiresUpgrade: true,
    upgradeTarget: "professional",
  },
  {
    key: "cdp",
    category: "growth",
    name: "客户数据平台",
    description: "客户画像、分群、行为分析",
    plan: "enterprise",
    enabled: false,
    requiresUpgrade: true,
    upgradeTarget: "enterprise",
  },

  // === TradePass Engine ===
  {
    key: "mt5_web_terminal",
    category: "engine",
    name: "MT5 Web 终端",
    description: "MT5 网页交易终端",
    plan: "professional",
    enabled: false,
    requiresUpgrade: true,
    upgradeTarget: "professional",
  },
  {
    key: "order_management",
    category: "engine",
    name: "订单管理",
    description: "订单审核、持仓管理",
    plan: "professional",
    enabled: false,
    requiresUpgrade: true,
    upgradeTarget: "professional",
  },
  {
    key: "social_copy_trading",
    category: "engine",
    name: "跟单交易",
    description: "信号复制、分润体系",
    plan: "enterprise",
    enabled: false,
    requiresUpgrade: true,
    upgradeTarget: "enterprise",
  },
  {
    key: "api_integration",
    category: "engine",
    name: "API 集成",
    description: "REST API、Webhooks",
    plan: "enterprise",
    enabled: false,
    requiresUpgrade: true,
    upgradeTarget: "enterprise",
  },
  {
    key: "ai_signals",
    category: "engine",
    name: "AI 交易信号",
    description: "AI 驱动的交易信号推送",
    plan: "enterprise",
    enabled: false,
    requiresUpgrade: true,
    upgradeTarget: "enterprise",
  },

  // === TradePass Edge ===
  {
    key: "risk_engine",
    category: "edge",
    name: "风控引擎",
    description: "实时风控规则、告警",
    plan: "professional",
    enabled: false,
    requiresUpgrade: true,
    upgradeTarget: "professional",
  },
  {
    key: "lp_management",
    category: "edge",
    name: "LP 管理",
    description: "流动性提供商聚合管理",
    plan: "enterprise",
    enabled: false,
    requiresUpgrade: true,
    upgradeTarget: "enterprise",
  },
  {
    key: "blacklist",
    category: "edge",
    name: "黑名单",
    description: "黑名单管理、自动拦截",
    plan: "starter",
    enabled: false,
    requiresUpgrade: true,
    upgradeTarget: "starter",
  },

  // === TradePass Media ===
  {
    key: "economic_calendar",
    category: "media",
    name: "财经日历",
    description: "全球经济事件日历",
    plan: "starter",
    enabled: false,
    requiresUpgrade: true,
    upgradeTarget: "starter",
  },
  {
    key: "news_feed",
    category: "media",
    name: "新闻快讯",
    description: "实时财经新闻推送",
    plan: "starter",
    enabled: false,
    requiresUpgrade: true,
    upgradeTarget: "starter",
  },
  {
    key: "market_commentary",
    category: "media",
    name: "市场评论",
    description: "专业市场分析和评论",
    plan: "professional",
    enabled: false,
    requiresUpgrade: true,
    upgradeTarget: "professional",
  },

  // === TradePass AI ===
  {
    key: "ai_strategies",
    category: "ai",
    name: "AI 交易策略",
    description: "AI 生成的交易策略",
    plan: "enterprise",
    enabled: false,
    requiresUpgrade: true,
    upgradeTarget: "enterprise",
  },
  {
    key: "ai_order_analysis",
    category: "ai",
    name: "AI 订单分析",
    description: "AI 历史订单深度分析",
    plan: "enterprise",
    enabled: false,
    requiresUpgrade: true,
    upgradeTarget: "enterprise",
  },
  {
    key: "ai_reports",
    category: "ai",
    name: "AI 报告",
    description: "AI 日报、周报、月报",
    plan: "enterprise",
    enabled: false,
    requiresUpgrade: true,
    upgradeTarget: "enterprise",
  },
  {
    key: "ai_risk_alerts",
    category: "ai",
    name: "AI 风控预警",
    description: "AI 驱动的风控预警",
    plan: "enterprise",
    enabled: false,
    requiresUpgrade: true,
    upgradeTarget: "enterprise",
  },

  // === Whitelabel & Infrastructure ===
  {
    key: "custom_domain",
    category: "infrastructure",
    name: "自定义域名",
    description: "使用自有域名替代子域名",
    plan: "starter",
    enabled: false,
    requiresUpgrade: true,
    upgradeTarget: "starter",
  },
  {
    key: "white_label",
    category: "infrastructure",
    name: "白标定制",
    description: "完全去除 TradePass 品牌标识",
    plan: "enterprise",
    enabled: false,
    requiresUpgrade: true,
    upgradeTarget: "enterprise",
  },
  {
    key: "api_webhooks",
    category: "infrastructure",
    name: "Webhooks",
    description: "自定义事件回调",
    plan: "enterprise",
    enabled: false,
    requiresUpgrade: true,
    upgradeTarget: "enterprise",
  },
  {
    key: "sla_support",
    category: "infrastructure",
    name: "SLA 支持",
    description: "99.9% SLA + 优先技术支持",
    plan: "enterprise",
    enabled: false,
    requiresUpgrade: true,
    upgradeTarget: "enterprise",
  },
  {
    key: "dedicated_infra",
    category: "infrastructure",
    name: "专属基础设施",
    description: "独立部署、专属服务器",
    plan: "ultimate",
    enabled: false,
    requiresUpgrade: true,
    upgradeTarget: "ultimate",
  },
];

/**
 * 获取指定套餐下所有可用的功能
 */
export function getFeaturesForPlan(plan: Plan): FeatureFlag[] {
  const planPriority = PLAN_PRIORITY[plan];
  return DEFAULT_FEATURE_FLAGS.filter(
    (f) => PLAN_PRIORITY[f.plan] <= planPriority
  );
}

/**
 * 检查功能是否对指定套餐可用
 */
export function isFeatureAvailable(featureKey: string, plan: Plan): boolean {
  const feature = DEFAULT_FEATURE_FLAGS.find((f) => f.key === featureKey);
  if (!feature) return false;
  return PLAN_PRIORITY[plan] >= PLAN_PRIORITY[feature.plan];
}

/**
 * 获取功能升级目标套餐
 */
export function getUpgradeTarget(featureKey: string): Plan | undefined {
  const feature = DEFAULT_FEATURE_FLAGS.find((f) => f.key === featureKey);
  return feature?.upgradeTarget;
}
