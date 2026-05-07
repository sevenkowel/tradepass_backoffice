// ===================== Types =====================

export type CalculationMode = "deposit_first" | "payment_first";

export interface DepositAccount {
  id: string;
  platform: string;
  accountType: string;
  currency: string;
  equity: number;
}

export interface PaymentMethod {
  id: string;
  name: string;
  category: "crypto" | "card" | "bank" | "ewallet";
  desc?: string;
  feeType: "percentage" | "fixed";
  feeValue: number;
  calculationMode: CalculationMode;
  paymentCurrency: string;
  supportedCurrencies: string[];
  exchangeRate: number;
  kycRequired: number;
  estimatedTime?: string;
}

export interface CalculationResult {
  depositAmount: number;
  paymentAmount: number;
  exchangeAmount: number;
  fee: number;
  rate: number;
  rateDisplay: string;
}
