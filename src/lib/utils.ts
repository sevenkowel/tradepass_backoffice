import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(
  value: number,
  currency = "USD",
  options?: Intl.NumberFormatOptions
): string {
  // Handle crypto currencies that are not valid ISO codes
  const validCurrencies = ["USD", "EUR", "GBP", "JPY", "CNY", "SGD", "AUD", "CAD", "CHF"];
  const isValidCurrency = validCurrencies.includes(currency.toUpperCase());
  
  if (!isValidCurrency) {
    // For crypto, just format the number and append the symbol
    const formatted = new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8,
      ...options,
    }).format(value);
    return `${formatted} ${currency}`;
  }
  
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  }).format(value);
}

export function formatNumber(value: number, decimals = 2): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatPercent(value: number, decimals = 2): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(decimals)}%`;
}

export function shortenAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * 延迟指定毫秒数（用于 mock API 模拟网络延迟）
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 生成品牌首字母缩写
 */
export function getBrandInitials(brandName: string): string {
  return brandName
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
