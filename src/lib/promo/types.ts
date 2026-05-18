/**
 * Promo Code System Types
 */

export type DiscountType = "percentage" | "fixed_amount" | "free_months";

export interface PromoCode {
  id: string;
  code: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number; // percentage: 0-100, fixed: amount, free_months: months
  maxUses: number;
  usedCount: number;
  validFrom: string;
  validUntil: string;
  applicablePlans: string[]; // empty = all plans
  applicableModules: string[]; // empty = all modules
  minAmount?: number; // minimum order amount
  currency: string;
  isActive: boolean;
  createdAt: string;
}

export interface PromoValidationResult {
  valid: boolean;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  message?: string;
  appliedAmount: number; // how much discount is applied
  finalAmount: number;
}

export function calculateDiscount(
  amount: number,
  discountType: DiscountType,
  discountValue: number
): number {
  switch (discountType) {
    case "percentage":
      return Math.round(amount * (discountValue / 100) * 100) / 100;
    case "fixed_amount":
      return Math.min(discountValue, amount);
    case "free_months":
      // For free months, discount the monthly amount * months
      return Math.round(amount * discountValue * 100) / 100;
    default:
      return 0;
  }
}
