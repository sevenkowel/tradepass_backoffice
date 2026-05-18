/**
 * Product Module Constants
 * Defines all product engine modules available in the SaaS platform.
 */

export const MODULE_CODES = ["growth_engine", "trade_engine", "trading_engine"] as const;
export type ModuleCode = (typeof MODULE_CODES)[number];

export interface ModuleDef {
  code: ModuleCode;
  name: string;
  shortName: string;
  description: string;
  icon: string; // lucide icon name
  features: string[];
  plans: ModulePlanDef[];
}

export interface ModulePlanDef {
  code: string;
  name: string;
  description: string;
  seatLimit: number;
  priceMonthlyUSD: number;
  priceYearlyUSD: number;
  featureFlags: Record<string, boolean>;
}

export const MODULES: Record<ModuleCode, ModuleDef> = {
  growth_engine: {
    code: "growth_engine",
    name: "Growth Engine",
    shortName: "增长引擎",
    description: "客户获取、转化优化、营销自动化与数据分析",
    icon: "TrendingUp",
    features: [
      "CDP 客户数据平台",
      "营销自动化工作流",
      "A/B 测试框架",
      "客户生命周期管理",
      "推荐奖励系统",
    ],
    plans: [
      {
        code: "basic",
        name: "基础版",
        description: "适合初创团队",
        seatLimit: 3,
        priceMonthlyUSD: 49,
        priceYearlyUSD: 499,
        featureFlags: {
          cdp: true,
          marketingAutomation: false,
          abTesting: false,
          lifecycleManagement: true,
          referralSystem: false,
        },
      },
      {
        code: "pro",
        name: "专业版",
        description: "适合成长型企业",
        seatLimit: 10,
        priceMonthlyUSD: 149,
        priceYearlyUSD: 1499,
        featureFlags: {
          cdp: true,
          marketingAutomation: true,
          abTesting: true,
          lifecycleManagement: true,
          referralSystem: true,
        },
      },
      {
        code: "enterprise",
        name: "企业版",
        description: "适合大型企业",
        seatLimit: 50,
        priceMonthlyUSD: 399,
        priceYearlyUSD: 3999,
        featureFlags: {
          cdp: true,
          marketingAutomation: true,
          abTesting: true,
          lifecycleManagement: true,
          referralSystem: true,
          customIntegration: true,
          dedicatedSupport: true,
        },
      },
    ],
  },
  trade_engine: {
    code: "trade_engine",
    name: "Trade Engine",
    shortName: "交易引擎",
    description: "风险管理、流动性接入、订单路由与合规监控",
    icon: "Shield",
    features: [
      "风险引擎",
      "LP 流动性接入",
      "订单路由",
      "合规监控",
      "保证金管理",
    ],
    plans: [
      {
        code: "basic",
        name: "基础版",
        description: "标准风险管理",
        seatLimit: 2,
        priceMonthlyUSD: 99,
        priceYearlyUSD: 999,
        featureFlags: {
          riskEngine: true,
          lpAccess: false,
          orderRouting: false,
          complianceMonitoring: true,
          marginManagement: true,
        },
      },
      {
        code: "pro",
        name: "专业版",
        description: "多 LP 接入",
        seatLimit: 5,
        priceMonthlyUSD: 299,
        priceYearlyUSD: 2999,
        featureFlags: {
          riskEngine: true,
          lpAccess: true,
          orderRouting: true,
          complianceMonitoring: true,
          marginManagement: true,
        },
      },
      {
        code: "enterprise",
        name: "企业版",
        description: "定制化 LP 与 API",
        seatLimit: 20,
        priceMonthlyUSD: 799,
        priceYearlyUSD: 7999,
        featureFlags: {
          riskEngine: true,
          lpAccess: true,
          orderRouting: true,
          complianceMonitoring: true,
          marginManagement: true,
          customLp: true,
          apiAccess: true,
        },
      },
    ],
  },
  trading_engine: {
    code: "trading_engine",
    name: "Trading Engine",
    shortName: "交易平台",
    description: "Web 终端、社交跟单、API 集成与移动交易",
    icon: "Globe",
    features: [
      "Web 交易终端",
      "社交跟单交易",
      "API 集成",
      "移动端交易",
      "多语言支持",
    ],
    plans: [
      {
        code: "basic",
        name: "基础版",
        description: "Web 终端",
        seatLimit: 5,
        priceMonthlyUSD: 29,
        priceYearlyUSD: 299,
        featureFlags: {
          webTerminal: true,
          socialCopy: false,
          apiIntegration: false,
          mobileTrading: false,
          multiLanguage: true,
        },
      },
      {
        code: "pro",
        name: "专业版",
        description: "社交跟单 + API",
        seatLimit: 20,
        priceMonthlyUSD: 99,
        priceYearlyUSD: 999,
        featureFlags: {
          webTerminal: true,
          socialCopy: true,
          apiIntegration: true,
          mobileTrading: true,
          multiLanguage: true,
        },
      },
      {
        code: "enterprise",
        name: "企业版",
        description: "白标 + 移动端定制",
        seatLimit: 100,
        priceMonthlyUSD: 249,
        priceYearlyUSD: 2499,
        featureFlags: {
          webTerminal: true,
          socialCopy: true,
          apiIntegration: true,
          mobileTrading: true,
          multiLanguage: true,
          whiteLabel: true,
          customBranding: true,
        },
      },
    ],
  },
};

export function getModuleDef(code: ModuleCode): ModuleDef | undefined {
  return MODULES[code];
}

export function getModulePlan(code: ModuleCode, planCode: string): ModulePlanDef | undefined {
  return MODULES[code]?.plans.find((p) => p.code === planCode);
}

export function getAllModules(): ModuleDef[] {
  return Object.values(MODULES);
}
