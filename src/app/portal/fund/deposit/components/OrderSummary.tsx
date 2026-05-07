"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, ChevronRight, Loader2, CheckCircle2 } from "lucide-react";
import type { DepositAccount, PaymentMethod, CalculationResult } from "../types";
import { formatAccountLabel, formatMoney } from "../utils";

interface OrderSummaryProps {
  step: number;
  selectedAccount: DepositAccount | null;
  amount: string;
  selectedMethod: PaymentMethod | null;
  orderDetails: CalculationResult | null;
  agreed: boolean;
  onAgreedChange: (v: boolean) => void;
  onNext: () => void;
  onBack: () => void;
  isCalculating: boolean;
  canProceed: boolean;
  buttonText: string;
}

export function OrderSummary({
  step, selectedAccount, amount, selectedMethod, orderDetails,
  agreed, onAgreedChange, onNext, onBack, isCalculating, canProceed, buttonText,
}: OrderSummaryProps) {
  const numAmount = parseFloat(amount);
  const displayAmount = !isNaN(numAmount) && numAmount > 0 ? numAmount : null;

  const estimatedArrival = displayAmount
    ? (selectedMethod?.calculationMode === "deposit_first"
      ? orderDetails?.depositAmount
      : orderDetails?.depositAmount)
    : null;

  return (
    <div className="w-[380px] shrink-0">
      <Card className="sticky top-6 border-slate-200 shadow-sm">
        <CardContent className="p-6 space-y-5">
          <h3 className="text-base font-bold text-slate-900">存款摘要</h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">交易账户</span>
              <span className="font-medium text-slate-900 truncate max-w-[180px]">
                {selectedAccount ? formatAccountLabel(selectedAccount) : "--"}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">存款金额</span>
              <span className="font-medium text-slate-900">
                {displayAmount ? formatMoney(displayAmount, selectedAccount?.currency || "USD") : "--"}
              </span>
            </div>

            {step >= 2 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">支付方式</span>
                <span className="font-medium text-slate-900">{selectedMethod?.name ?? "--"}</span>
              </div>
            )}

            {step >= 2 && selectedMethod && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">预计到账</span>
                <span className="font-medium text-slate-900">{selectedMethod.estimatedTime}</span>
              </div>
            )}

            <div className="h-px bg-slate-200" />

            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-900">预计到账</span>
              <span className="text-xl font-bold text-slate-900">
                {estimatedArrival !== null ? formatMoney(estimatedArrival, selectedAccount?.currency || "USD") : "--"}
              </span>
            </div>
          </div>

          <AnimatePresence>
            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="flex items-start gap-2.5 pt-1">
                  <Checkbox id="agreement" checked={agreed} onCheckedChange={(v) => onAgreedChange(v as boolean)} />
                  <label htmlFor="agreement" className="text-xs text-slate-600 leading-relaxed cursor-pointer select-none -mt-0.5">
                    我已阅读并同意
                    <Link href="#" className="text-blue-600 hover:underline">入金条款</Link>
                    与<Link href="#" className="text-blue-600 hover:underline">风险提示</Link>
                  </label>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-2">
            <Button onClick={onNext} disabled={!canProceed}
              className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl disabled:bg-slate-300 disabled:text-slate-500 transition-all">
              {isCalculating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> 计算中...</> : <>{buttonText} <ChevronRight className="w-4 h-4 ml-1.5" /></>}
            </Button>
            {step > 1 && (
              <button onClick={onBack}
                className="w-full h-10 text-sm text-slate-500 hover:text-slate-700 transition-colors flex items-center justify-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" /> 返回上一步
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
