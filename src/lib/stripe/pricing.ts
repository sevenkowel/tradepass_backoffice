/**
 * Multi-currency pricing for TradePass plans
 * Base prices are in USD, converted for other currencies
 */

export type Currency = "USD" | "CNY" | "EUR" | "GBP" | "JPY" | "HKD";

export const SUPPORTED_CURRENCIES: Currency[] = [
  "USD",
  "CNY",
  "EUR",
  "GBP",
  "JPY",
  "HKD",
];

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD: "$",
  CNY: "¥",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  HKD: "HK$",
};

export const CURRENCY_LOCALES: Record<Currency, string> = {
  USD: "en-US",
  CNY: "zh-CN",
  EUR: "de-DE",
  GBP: "en-GB",
  JPY: "ja-JP",
  HKD: "zh-HK",
};

// Base prices in USD (monthly)
const BASE_PRICES_USD: Record<string, number> = {
  free: 0,
  starter: 99,
  professional: 299,
  enterprise: 799,
  ultimate: 1999,
};

// Conversion rates (approximate, should be updated periodically)
const CONVERSION_RATES: Record<Currency, number> = {
  USD: 1,
  CNY: 7.25,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 151.5,
  HKD: 7.82,
};

export function getPlanPrice(
  plan: string,
  currency: Currency = "USD",
  yearly: boolean = false
): { monthly: number; yearly: number; yearlyDiscount: number } {
  const baseUsd = BASE_PRICES_USD[plan] || 0;
  const rate = CONVERSION_RATES[currency];

  const monthlyRaw = Math.round(baseUsd * rate);
  const yearlyRaw = Math.round(monthlyRaw * 12 * 0.85); // 15% yearly discount

  return {
    monthly: monthlyRaw,
    yearly: yearlyRaw,
    yearlyDiscount: 15,
  };
}

export function formatPrice(
  amount: number,
  currency: Currency = "USD"
): string {
  const locale = CURRENCY_LOCALES[currency];
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getStripeAmount(
  amount: number,
  currency: Currency
): { amount: number; currency: string } {
  // Stripe uses smallest currency unit (cents)
  const zeroDecimal = ["JPY"];
  const multiplier = zeroDecimal.includes(currency) ? 1 : 100;
  return {
    amount: Math.round(amount * multiplier),
    currency: currency.toLowerCase(),
  };
}

export const PLAN_LIMITS: Record<string, { maxUsers: number; maxAccounts: number }> = {
  free: { maxUsers: 10, maxAccounts: 5 },
  starter: { maxUsers: 50, maxAccounts: 100 },
  professional: { maxUsers: 200, maxAccounts: 500 },
  enterprise: { maxUsers: 1000, maxAccounts: 2000 },
  ultimate: { maxUsers: -1, maxAccounts: -1 },
};

export function getModulesForPlan(plan: string): string[] {
  switch (plan) {
    case "free":
      return ["portal", "kyc_basic", "funds_usdt"];
    case "starter":
      return [
        "portal", "backoffice", "kyc_standard", "funds_usdt", "funds_bank",
        "ib_l1", "blacklist", "economic_calendar", "news_feed", "custom_domain",
      ];
    case "professional":
      return [
        "portal", "backoffice", "kyc_enhanced", "funds_usdt", "funds_bank",
        "funds_card", "ib_l1", "ib_l2_l3", "ib_commission_withdraw",
        "mt5_web_terminal", "order_management", "risk_engine", "blacklist",
        "economic_calendar", "news_feed", "market_commentary", "reports_advanced",
      ];
    case "enterprise":
    case "ultimate":
      return ["all"];
    default:
      return ["portal"];
  }
}
