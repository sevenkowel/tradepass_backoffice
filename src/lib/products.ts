/**
 * TradePass 产品体系配置
 * 统一的产品-模块映射，支撑 Console 产品管理和 Backoffice 模块控制台
 */

export const PRODUCT_CODES = [
  "trade_pass_business",
  "trade_pass_growth",
  "trade_pass_engine",
  "trade_pass_edge",
  "trade_pass_media",
  "trade_pass_ai",
] as const;

export type ProductCode = (typeof PRODUCT_CODES)[number];

export interface ProductModule {
  id: string;
  name: string;
  description: string;
  icon: string; // lucide icon name
  route?: string; // backoffice route prefix
  isAddOn?: boolean; // 是否可单独作为 Add-on 购买
  addOnPrice?: number; // Add-on 单独价格（USD/月）
}

export interface ProductConfig {
  code: ProductCode;
  name: string;
  shortName: string;
  description: string;
  basePrice: number;
  seatPrice: number;
  currency: string;
  isBaseLayer: boolean;
  modules: ProductModule[];
}

export const PRODUCT_CONFIG: Record<ProductCode, ProductConfig> = {
  trade_pass_business: {
    code: "trade_pass_business",
    name: "TradePass Business",
    shortName: "Business",
    description: "外汇经纪商业务系统基础层，包含 Portal、Backoffice 和核心运营功能",
    basePrice: 7000,
    seatPrice: 29,
    currency: "USD",
    isBaseLayer: true,
    modules: [
      { id: "portal_access", name: "客户门户 Portal", description: "终端客户交易与账户管理门户", icon: "Globe", route: "/portal" },
      { id: "backoffice_access", name: "运营后台 Backoffice", description: "经纪商运营管理后台", icon: "LayoutDashboard", route: "/backoffice" },
      { id: "kyc_system", name: "KYC 身份认证", description: "多地区多级别身份验证系统", icon: "ShieldCheck", route: "/backoffice/compliance/kyc-review" },
      { id: "funds_management", name: "资金管理", description: "USDT/银行/信用卡多渠道出入金", icon: "Wallet", route: "/backoffice/funds" },
      { id: "trading_accounts", name: "交易账户", description: "MT5 账户分组、杠杆配置", icon: "Briefcase", route: "/backoffice/accounts" },
      { id: "user_management", name: "用户管理", description: "用户列表、等级、标签管理", icon: "Users", route: "/backoffice/users" },
      { id: "reports_basic", name: "基础报表", description: "财务、交易、用户基础报表", icon: "BarChart3", route: "/backoffice/reports" },
      { id: "crm_support", name: "CRM / 客服", description: "工单、反馈、交互记录", icon: "Headphones", route: "/backoffice/crm" },
    ],
  },

  trade_pass_growth: {
    code: "trade_pass_growth",
    name: "TradePass Growth",
    shortName: "Growth",
    description: "增长营销引擎，包含多级 IB、营销自动化、CDP",
    basePrice: 5000,
    seatPrice: 19,
    currency: "USD",
    isBaseLayer: false,
    modules: [
      { id: "ib_referral", name: "IB & 推荐系统", description: "多级代理佣金分层与推荐体系", icon: "Network", route: "/backoffice/ib" },
      { id: "cdp", name: "客户数据平台 CDP", description: "客户画像、分群、行为分析", icon: "Database", route: "/backoffice/marketing" },
      { id: "marketing_automation", name: "营销自动化", description: "活动、Banner、消息推送管理", icon: "Megaphone", route: "/backoffice/marketing/campaigns" },
      { id: "promotions", name: "促销活动", description: "优惠券、返佣、积分活动", icon: "Gift", route: "/backoffice/marketing" },
    ],
  },

  trade_pass_engine: {
    code: "trade_pass_engine",
    name: "TradePass Engine",
    shortName: "Engine",
    description: "交易基础设施，包含 MT5 终端、订单持仓、跟单交易、API",
    basePrice: 10000,
    seatPrice: 0,
    currency: "USD",
    isBaseLayer: false,
    modules: [
      { id: "mt5_web_terminal", name: "MT5 Web 终端", description: "网页版 MT5 交易终端", icon: "Monitor", route: "/backoffice/trading" },
      { id: "order_management", name: "订单管理", description: "订单审核、持仓、交易品种管理", icon: "TrendingUp", route: "/backoffice/trading/orders" },
      { id: "copy_trading", name: "Copy Trading", description: "社交跟单交易与分润体系", icon: "Copy", route: "/backoffice/copy-trading", isAddOn: true, addOnPrice: 3000 },
      { id: "api_integration", name: "API 集成", description: "REST API、Webhooks、第三方对接", icon: "Plug", route: "/backoffice/system/api", isAddOn: true, addOnPrice: 2000 },
      { id: "social_trading", name: "Social Trading", description: "交易员排行榜与信号分享", icon: "Users", route: "/backoffice/copy-trading" },
    ],
  },

  trade_pass_edge: {
    code: "trade_pass_edge",
    name: "TradePass Edge",
    shortName: "Edge",
    description: "风控与流动性层，包含风控引擎、保证金告警、黑名单、LP 聚合",
    basePrice: 9000,
    seatPrice: 0,
    currency: "USD",
    isBaseLayer: false,
    modules: [
      { id: "risk_engine", name: "风控引擎", description: "实时风控规则、告警、NBP 保护", icon: "Shield", route: "/backoffice/risk" },
      { id: "lp_management", name: "LP 管理", description: "流动性提供商聚合与路由", icon: "Route", route: "/backoffice/risk" },
      { id: "margin_management", name: "保证金管理", description: "保证金监控、强平、追加通知", icon: "AlertTriangle", route: "/backoffice/risk/margin" },
      { id: "blacklist", name: "黑名单", description: "黑名单管理、自动拦截、AML", icon: "Ban", route: "/backoffice/compliance/blacklist" },
    ],
  },

  trade_pass_media: {
    code: "trade_pass_media",
    name: "TradePass Media",
    shortName: "Media",
    description: "媒体资讯服务，包含财经日历、新闻快讯、市场评论",
    basePrice: 2000,
    seatPrice: 0,
    currency: "USD",
    isBaseLayer: false,
    modules: [
      { id: "economic_calendar", name: "财经日历", description: "全球经济事件与市场影响", icon: "Calendar", route: "/backoffice/marketing/news" },
      { id: "news_feed", name: "新闻快讯", description: "实时财经新闻与快讯推送", icon: "Newspaper", route: "/backoffice/marketing/news" },
      { id: "market_commentary", name: "市场评论", description: "专业市场分析与评论", icon: "MessageSquare", route: "/backoffice/marketing/news" },
      { id: "data_visualization", name: "数据可视化", description: "行情图表、热力图、数据面板", icon: "BarChart3", route: "/backoffice/reports" },
    ],
  },

  trade_pass_ai: {
    code: "trade_pass_ai",
    name: "TradePass AI",
    shortName: "AI",
    description: "AI 智能服务，包含 AI 交易信号、策略、订单分析、日报周报月报",
    basePrice: 5000,
    seatPrice: 0,
    currency: "USD",
    isBaseLayer: false,
    modules: [
      { id: "ai_signals", name: "AI 交易信号", description: "AI 驱动的交易信号推送", icon: "Brain", route: "/backoffice/ai-signals", isAddOn: true, addOnPrice: 2000 },
      { id: "ai_strategies", name: "AI 交易策略", description: "AI 生成的量化交易策略", icon: "Cpu", route: "/backoffice/ai-signals" },
      { id: "ai_order_analysis", name: "AI 订单分析", description: "历史订单深度分析与洞察", icon: "Search", route: "/backoffice/reports/trading" },
      { id: "ai_reports", name: "AI 报告", description: "AI 日报、周报、月报自动生成", icon: "FileText", route: "/backoffice/reports" },
      { id: "ai_risk_alerts", name: "AI 风控预警", description: "AI 驱动的异常检测与预警", icon: "AlertTriangle", route: "/backoffice/risk" },
    ],
  },
};

/** 基础层产品代码 */
export const BASE_LAYER_CODE: ProductCode = "trade_pass_business";

/** 扩展产品代码列表 */
export const EXTENSION_CODES: ProductCode[] = PRODUCT_CODES.filter(
  (c) => c !== BASE_LAYER_CODE
);

/** 获取产品的中文简称 */
export function getProductShortName(code: ProductCode): string {
  return PRODUCT_CONFIG[code]?.shortName || code;
}

/** 获取所有模块（按产品分组） */
export function getAllModules(): { product: ProductConfig; modules: ProductModule[] }[] {
  return PRODUCT_CODES.map((code) => ({
    product: PRODUCT_CONFIG[code],
    modules: PRODUCT_CONFIG[code].modules,
  }));
}

/** 判断产品代码是否有效 */
export function isValidProductCode(code: string): code is ProductCode {
  return PRODUCT_CODES.includes(code as ProductCode);
}

/** 获取可作为 Add-on 单独购买的模块 */
export function getAddOnModules(): { product: ProductConfig; module: ProductModule }[] {
  const result: { product: ProductConfig; module: ProductModule }[] = [];
  for (const code of EXTENSION_CODES) {
    const config = PRODUCT_CONFIG[code];
    for (const mod of config.modules) {
      if (mod.isAddOn) {
        result.push({ product: config, module: mod });
      }
    }
  }
  return result;
}
