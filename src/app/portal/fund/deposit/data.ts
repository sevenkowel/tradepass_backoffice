import type { DepositAccount, PaymentMethod } from "./types";

export const allAccounts: DepositAccount[] = [
  { id: "wallet-usd", platform: "", accountType: "Wallet", currency: "USD", equity: 12500 },
  { id: "7845321", platform: "MT4", accountType: "Standard", currency: "USD", equity: 8200 },
  { id: "7845322", platform: "MT4", accountType: "Raw", currency: "JPY", equity: 920000 },
  { id: "7845323", platform: "MT4", accountType: "ECN", currency: "EUR", equity: 5200 },
  { id: "7845324", platform: "MT4", accountType: "Pro", currency: "USD", equity: 3500 },
  { id: "7845325", platform: "MT4", accountType: "ECN", currency: "EUR", equity: 2800 },
  { id: "8999999", platform: "MT5", accountType: "Standard", currency: "USD", equity: 1000 },
  { id: "8999998", platform: "MT5", accountType: "Pro", currency: "JPY", equity: 1500000 },
  { id: "8999997", platform: "MT5", accountType: "ECN", currency: "EUR", equity: 8500 },
  { id: "8999996", platform: "MT5", accountType: "Pro", currency: "USD", equity: 5200 },
  { id: "8999995", platform: "MT5", accountType: "ECN", currency: "JPY", equity: 850000 },
  { id: "2000001", platform: "TP", accountType: "Classic", currency: "USD", equity: 15800 },
  { id: "2000002", platform: "TP", accountType: "VIP", currency: "JPY", equity: 2200000 },
  { id: "2000003", platform: "TP", accountType: "Pro", currency: "EUR", equity: 4200 },
  { id: "2000004", platform: "TP", accountType: "Classic", currency: "USD", equity: 9500 },
  { id: "2000005", platform: "TP", accountType: "ECN", currency: "EUR", equity: 3100 },
];

export const walletAccounts = allAccounts.filter(a => a.platform === "");
export const mt4Accounts = allAccounts.filter(a => a.platform === "MT4");
export const mt5Accounts = allAccounts.filter(a => a.platform === "MT5");
export const tpAccounts = allAccounts.filter(a => a.platform === "TP");
export const recommendedAccount = mt5Accounts.find(a => a.currency === "JPY") || mt5Accounts[0];

export const paymentMethods: PaymentMethod[] = [
  { id: "usdt-trc20", name: "USDT-TRC20", category: "crypto", desc: "推荐", feeType: "percentage", feeValue: 0, calculationMode: "deposit_first", paymentCurrency: "USDT", supportedCurrencies: ["USD","EUR","JPY"], exchangeRate: 1.0, kycRequired: 0, estimatedTime: "即时到账" },
  { id: "usdt-erc20", name: "USDT-ERC20", category: "crypto", desc: "推荐", feeType: "percentage", feeValue: 0, calculationMode: "deposit_first", paymentCurrency: "USDT", supportedCurrencies: ["USD","EUR","JPY"], exchangeRate: 1.0, kycRequired: 0, estimatedTime: "即时到账" },
  { id: "btc", name: "BTC", category: "crypto", feeType: "percentage", feeValue: 0.5, calculationMode: "deposit_first", paymentCurrency: "BTC", supportedCurrencies: ["USD","EUR","JPY"], exchangeRate: 8333333, kycRequired: 1, estimatedTime: "约10分钟" },
  { id: "eth", name: "ETH", category: "crypto", feeType: "percentage", feeValue: 0.5, calculationMode: "deposit_first", paymentCurrency: "ETH", supportedCurrencies: ["USD","EUR","JPY"], exchangeRate: 285714, kycRequired: 1, estimatedTime: "约5分钟" },
  { id: "visa", name: "Visa", category: "card", feeType: "percentage", feeValue: 2.5, calculationMode: "deposit_first", paymentCurrency: "USD", supportedCurrencies: ["USD","EUR"], exchangeRate: 1.0, kycRequired: 0, estimatedTime: "即时到账" },
  { id: "mastercard", name: "Mastercard", category: "card", feeType: "percentage", feeValue: 2.5, calculationMode: "deposit_first", paymentCurrency: "USD", supportedCurrencies: ["USD","EUR"], exchangeRate: 1.0, kycRequired: 0, estimatedTime: "即时到账" },
  { id: "swift", name: "SWIFT", category: "bank", desc: "大额", feeType: "fixed", feeValue: 25, calculationMode: "payment_first", paymentCurrency: "USD", supportedCurrencies: ["USD","EUR","JPY"], exchangeRate: 1.0, kycRequired: 1, estimatedTime: "1-3个工作日" },
  { id: "sepa", name: "SEPA", category: "bank", feeType: "fixed", feeValue: 15, calculationMode: "payment_first", paymentCurrency: "EUR", supportedCurrencies: ["EUR"], exchangeRate: 1.0, kycRequired: 1, estimatedTime: "1-2个工作日" },
  { id: "paypal", name: "PayPal", category: "ewallet", desc: "推荐", feeType: "percentage", feeValue: 1.5, calculationMode: "deposit_first", paymentCurrency: "USD", supportedCurrencies: ["USD","EUR","JPY"], exchangeRate: 1.0, kycRequired: 0, estimatedTime: "即时到账" },
  { id: "skrill", name: "Skrill", category: "ewallet", feeType: "percentage", feeValue: 1.5, calculationMode: "deposit_first", paymentCurrency: "USD", supportedCurrencies: ["USD","EUR","JPY"], exchangeRate: 1.0, kycRequired: 1, estimatedTime: "即时到账" },
];

export const paymentCategories = [
  { id: "crypto" as const, name: "加密货币", icon: "Diamond" },
  { id: "card" as const, name: "银行卡", icon: "CreditCard" },
  { id: "bank" as const, name: "银行转账", icon: "Landmark" },
  { id: "ewallet" as const, name: "电子钱包", icon: "Wallet" },
] as const;

export const faqItems = [
  { q: "如何进行充值？", a: "选择充值方式 → 输入金额 → 完成支付 → 自动到账" },
  { q: "充值需要多久到账？", a: "加密货币即时到账，银行转账 1-3 个工作日" },
  { q: "充值限额是多少？", a: "L0: 单笔$1,000/L1: 单笔$10,000/L2: 单笔$50,000" },
  { q: "充值失败怎么办？", a: "联系客服或提交工单，提供转账凭证" },
];

export const KYC_LIMITS: Record<number, { min: number; max: number; daily: number; monthly: number }> = {
  0: { min: 10, max: 1000, daily: 5000, monthly: 20000 },
  1: { min: 10, max: 10000, daily: 50000, monthly: 200000 },
  2: { min: 10, max: 50000, daily: 200000, monthly: 1000000 },
  3: { min: 10, max: 100000, daily: 500000, monthly: 5000000 },
};

export const steps = [
  { id: 1, name: "账户与金额" },
  { id: 2, name: "支付方式" },
  { id: 3, name: "确认订单" },
];
