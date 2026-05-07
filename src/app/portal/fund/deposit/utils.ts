import type { CalculationMode, PaymentMethod, CalculationResult, DepositAccount } from "./types";

export function currencySymbol(currency: string) {
  if (currency === "JPY") return "¥";
  if (currency === "EUR") return "€";
  if (currency === "BTC") return "₿";
  if (currency === "ETH") return "Ξ";
  if (currency === "USDT") return "₮";
  return "$";
}

export function fmtEquity(acc: DepositAccount): string {
  const sym = currencySymbol(acc.currency);
  return `${sym}${acc.equity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatAccountLabel(a: DepositAccount): string {
  if (a.platform) return `${a.platform}-${a.id}-${a.accountType}-${fmtEquity(a)}`;
  return `${a.accountType}-Wallet-${a.currency}-${fmtEquity(a)}`;
}

export function accountLabel(id: string, accounts: DepositAccount[]): string {
  const a = accounts.find(x => x.id === id);
  if (!a) return "选择账户";
  return formatAccountLabel(a);
}

export function calculateOrder(
  mode: CalculationMode,
  inputAmount: number,
  method: PaymentMethod,
  accountCurrency: string
): CalculationResult | null {
  if (isNaN(inputAmount) || inputAmount <= 0) return null;

  const rate = method.exchangeRate || 1;
  const rateDisplay = rate < 0.0001
    ? `1 ${method.paymentCurrency} = ${rate.toPrecision(6)} ${accountCurrency}`
    : `1 ${method.paymentCurrency} = ${rate.toLocaleString(undefined, { maximumFractionDigits: 4 })} ${accountCurrency}`;

  if (mode === "deposit_first") {
    const exchangeAmount = inputAmount / rate;
    let fee = 0;
    if (method.feeType === "percentage") {
      fee = exchangeAmount * (method.feeValue / 100);
    } else {
      fee = method.feeValue;
    }
    const paymentAmount = exchangeAmount + fee;
    return { depositAmount: inputAmount, paymentAmount, exchangeAmount, fee, rate, rateDisplay };
  } else {
    let fee = 0;
    if (method.feeType === "percentage") {
      fee = inputAmount * (method.feeValue / 100) * rate;
    } else {
      fee = method.feeValue;
    }
    const exchangeAmount = inputAmount * rate;
    const depositAmount = Math.max(0, exchangeAmount - fee);
    return { depositAmount, paymentAmount: inputAmount, exchangeAmount, fee, rate, rateDisplay };
  }
}

export function formatMoney(amount: number | null | undefined, currency: string = "USD"): string {
  if (amount === null || amount === undefined || isNaN(amount)) return "--";
  const sym = currencySymbol(currency);
  return `${sym}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
