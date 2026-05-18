import { prisma } from "../src/lib/prisma";

async function main() {
  // ===================== Products =====================
  const products = [
    {
      code: "trade_pass_business",
      name: "TradePass Business",
      description: "外汇经纪商业务系统基础层，包含 Portal、Backoffice 和核心运营功能",
      basePrice: 7000,
      seatPrice: 29,
      currency: "USD",
      isActive: true,
      features: JSON.stringify({
        modules: [
          "portal",
          "backoffice",
          "mobile_app",
          "kyc",
          "funds",
          "trading_accounts",
        ],
        plans: {
          free: { maxUsers: 10, maxAccounts: 5, maxDeposits: 100 },
          starter: { maxUsers: 50, maxAccounts: 100 },
          professional: { maxUsers: 200, maxAccounts: 500 },
          enterprise: { maxUsers: 1000, maxAccounts: 2000 },
          ultimate: { maxUsers: -1, maxAccounts: -1 },
        },
      }),
    },
    {
      code: "trade_pass_growth",
      name: "TradePass Growth",
      description: "增长营销引擎，包含多级 IB、营销自动化、转化漏斗、CDP",
      basePrice: 5000,
      seatPrice: 19,
      currency: "USD",
      isActive: true,
      features: JSON.stringify({
        modules: ["ib_system", "cdp", "marketing_automation", "ad_analytics", "promotion"],
      }),
    },
    {
      code: "trade_pass_engine",
      name: "TradePass Engine",
      description: "交易基础设施，包含 MT5 终端、订单持仓、跟单交易、API、AI 信号",
      basePrice: 10000,
      seatPrice: 0,
      currency: "USD",
      isActive: true,
      features: JSON.stringify({
        modules: ["mt5_web_terminal", "order_management", "social_copy_trading", "api_integration", "ai_signals"],
      }),
    },
    {
      code: "trade_pass_edge",
      name: "TradePass Edge",
      description: "风控与流动性层，包含风控引擎、保证金告警、黑名单、LP 聚合",
      basePrice: 9000,
      seatPrice: 0,
      currency: "USD",
      isActive: true,
      features: JSON.stringify({
        modules: ["risk_engine", "lp_management", "margin_management", "blacklist"],
      }),
    },
    {
      code: "trade_pass_media",
      name: "TradePass Media",
      description: "媒体资讯服务，包含财经日历、新闻快讯、财经头条、市场评论",
      basePrice: 2000,
      seatPrice: 0,
      currency: "USD",
      isActive: true,
      features: JSON.stringify({
        modules: ["economic_calendar", "news_feed", "market_commentary", "data_visualization"],
      }),
    },
    {
      code: "trade_pass_ai",
      name: "TradePass AI",
      description: "AI 智能服务，包含 AI 交易信号、策略、订单分析、日报周报月报",
      basePrice: 5000,
      seatPrice: 0,
      currency: "USD",
      isActive: true,
      features: JSON.stringify({
        modules: ["ai_signals", "ai_strategies", "ai_order_analysis", "ai_reports", "ai_risk_alerts"],
      }),
    },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { code: p.code },
      update: {},
      create: p,
    });
  }

  console.log("Seeded products successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
