"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { CreditCard, Diamond, Landmark, Wallet, CircleDot, Circle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { paymentMethods, paymentCategories } from "../data";
import type { DepositAccount } from "../types";

interface Step2Props {
  selectedMethodId: string | null;
  onSelectMethod: (id: string) => void;
  selectedAccount: DepositAccount | null;
  userKyc: number;
}

export function Step2PaymentMethod({ selectedMethodId, onSelectMethod, selectedAccount, userKyc }: Step2Props) {
  const [activeCategory, setActiveCategory] = useState<string>("crypto");

  const filteredMethods = useMemo(() =>
    paymentMethods.filter(m => m.category === activeCategory), [activeCategory]
  );

  const categoryIcon = (cat: string) => {
    switch (cat) {
      case "crypto": return Diamond;
      case "card": return CreditCard;
      case "bank": return Landmark;
      case "ewallet": return Wallet;
      default: return CreditCard;
    }
  };

  return (
    <motion.div key="step2" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }} className="space-y-5">
      <Card className="overflow-hidden border-slate-200">
        <CardContent className="p-6 space-y-5">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-slate-600" />选择支付方式
          </h2>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {paymentCategories.map(cat => {
              const Icon = categoryIcon(cat.id);
              const isActive = activeCategory === cat.id;
              return (
                <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                  className={cn("flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all",
                    isActive ? "bg-slate-900 text-white shadow-sm" : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700"
                  )}>
                  <Icon className="w-4 h-4" /> {cat.name}
                </button>
              );
            })}
          </div>

          <div className="space-y-2.5">
            {filteredMethods.map(item => {
              const isLocked = item.kycRequired > userKyc;
              const isSelected = selectedMethodId === item.id;
              const unsupported = selectedAccount ? !item.supportedCurrencies.includes(selectedAccount.currency) : false;
              const disabled = isLocked || unsupported;
              const Icon = categoryIcon(item.category);

              return (
                <button key={item.id} disabled={disabled}
                  onClick={() => !disabled && onSelectMethod(item.id)}
                  className={cn("w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all",
                    isSelected ? "border-slate-900 bg-slate-50 shadow-sm"
                      : disabled ? "border-slate-100 bg-slate-50/50 cursor-not-allowed opacity-60"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                  )}>
                  <div className="shrink-0">
                    {isSelected ? <CircleDot className="w-5 h-5 text-slate-900" /> : <Circle className={cn("w-5 h-5", disabled ? "text-slate-300" : "text-slate-300")} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn("font-medium", isSelected ? "text-slate-900" : disabled ? "text-slate-400" : "text-slate-700")}>{item.name}</span>
                      {item.desc && !disabled && (
                        <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium", isSelected ? "bg-slate-200 text-slate-700" : "bg-emerald-100 text-emerald-700")}>{item.desc}</span>
                      )}
                      {isLocked && <span className="text-[10px] px-1.5 py-0.5 bg-slate-200 text-slate-500 rounded-full">需 L{item.kycRequired}</span>}
                      {unsupported && <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full">不支持 {selectedAccount?.currency}</span>}
                    </div>
                    <p className={cn("text-xs mt-0.5", isSelected ? "text-slate-500" : "text-slate-400")}>
                      {item.estimatedTime} · {item.feeValue === 0 ? "免费" : `${item.feeType === "percentage" ? `${item.feeValue}%` : `$${item.feeValue}`}`}
                    </p>
                  </div>
                  <div className="shrink-0 w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-slate-500" />
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
