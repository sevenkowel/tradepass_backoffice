"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowDownLeft, ChevronRight, CheckCircle2, MessageCircle } from "lucide-react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { CalculationResult } from "./types";
import { allAccounts, paymentMethods, KYC_LIMITS, steps, faqItems, recommendedAccount } from "./data";
import { currencySymbol, calculateOrder } from "./utils";
import { OrderSummary } from "./components/OrderSummary";
import { Step1AccountAmount } from "./components/Step1AccountAmount";
import { Step2PaymentMethod } from "./components/Step2PaymentMethod";
import { Step3Confirm } from "./components/Step3Confirm";
import { SubmittedSuccess } from "./components/SubmittedSuccess";

export default function DepositPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [targetAccount, setTargetAccount] = useState(recommendedAccount.id);
  const [amount, setAmount] = useState("");
  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [orderDetails, setOrderDetails] = useState<CalculationResult | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [showCryptoConfirm, setShowCryptoConfirm] = useState(false);

  const userKyc = 1;
  const limits = KYC_LIMITS[userKyc] || KYC_LIMITS[0];
  const todayUsed = 2500;
  const selectedAccount = useMemo(() => allAccounts.find(a => a.id === targetAccount) || null, [targetAccount]);
  const accountSymbolStr = currencySymbol(selectedAccount?.currency || "USD");
  const selectedMethod = useMemo(() => paymentMethods.find(m => m.id === selectedMethodId) || null, [selectedMethodId]);
  const isAmountValid = !!amount && parseFloat(amount) > 0 && parseFloat(amount) >= limits.min;
  const isSuspicious = !!amount && parseFloat(amount) > 0 && parseFloat(amount) < 10;
  const quickAmounts = useMemo(() => accountSymbolStr === "¥" ? ["10000", "50000", "100000", "500000"] : ["100", "500", "1000", "5000"], [accountSymbolStr]);

  async function handleConfirmMethod() {
    if (!selectedMethod || !selectedAccount || !isAmountValid) return;
    setIsCalculating(true);
    await new Promise(r => setTimeout(r, 600));
    const result = calculateOrder(selectedMethod.calculationMode, parseFloat(amount), selectedMethod, selectedAccount.currency);
    setOrderDetails(result);
    setIsCalculating(false);
    setStep(3);
  }

  function handleSubmit() { setSubmitted(true); }

  async function copyText(text: string) {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {}
  }

  useEffect(() => {
    if (selectedMethod?.category === "crypto") {
      const addr = selectedMethod.id.includes("btc") ? "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh"
        : selectedMethod.id.includes("eth") ? "0xA1B2C3D4E5F6789012345678901234567890ABCD" : "0xA1B2C3D4E5F6";
      QRCode.toDataURL(addr, { width: 160, margin: 1, color: { dark: "#0f172a", light: "#ffffff" } }).then(setQrDataUrl).catch(() => setQrDataUrl(null));
    } else setQrDataUrl(null);
  }, [selectedMethod]);

  if (submitted) return <SubmittedSuccess onReset={() => { setStep(1); setTargetAccount(recommendedAccount.id); setAmount(""); setSelectedMethodId(null); setOrderDetails(null); setSubmitted(false); setAgreed(false); setReceiptFile(null); }} />;

  const buttonText = step === 3 ? (selectedMethod?.category === "card" || selectedMethod?.category === "ewallet" ? "前往支付" : "确认存款") : "下一步";
  const canProceed = step === 1 ? (!!selectedAccount && isAmountValid) : step === 2 ? (!!selectedMethod && !isCalculating) : (agreed && !(selectedMethod?.category === "bank" && !receiptFile));

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2.5 rounded-xl bg-emerald-500/10"><ArrowDownLeft className="w-6 h-6 text-emerald-500" /></div>
          <div><h1 className="text-2xl font-bold text-slate-900">充值</h1><p className="text-sm text-slate-500">快速安全的充值服务</p></div>
        </div>
      </motion.div>

      <div className="flex items-center gap-2">
        {steps.map((s, idx) => {
          const isActive = step === s.id; const isDone = step > s.id;
          return (
            <div key={s.id} className="flex items-center gap-2">
              <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors", isActive ? "bg-slate-900 text-white" : isDone ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500")}>
                <span className={cn("w-5 h-5 rounded-full flex items-center justify-center text-xs", isActive ? "bg-white text-slate-900" : isDone ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500")}>
                  {isDone ? <CheckCircle2 className="w-3 h-3" /> : s.id}
                </span>
                {s.name}
              </div>
              {idx < steps.length - 1 && <ChevronRight className={cn("w-4 h-4", isDone ? "text-emerald-500" : "text-slate-300")} />}
            </div>
          );
        })}
      </div>

      <div className="flex gap-8 items-start">
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            {step === 1 && <Step1AccountAmount targetAccount={targetAccount} onTargetAccountChange={setTargetAccount} amount={amount} onAmountChange={setAmount} accountSymbolStr={accountSymbolStr} quickAmounts={quickAmounts} limits={limits} todayUsed={todayUsed} isSuspicious={isSuspicious} />}
            {step === 2 && <Step2PaymentMethod selectedMethodId={selectedMethodId} onSelectMethod={setSelectedMethodId} selectedAccount={selectedAccount} userKyc={userKyc} />}
            {step === 3 && selectedAccount && selectedMethod && orderDetails && <Step3Confirm selectedAccount={selectedAccount} selectedMethod={selectedMethod} orderDetails={orderDetails} copied={copied} onCopy={copyText} qrDataUrl={qrDataUrl} receiptFile={receiptFile} onReceiptChange={setReceiptFile} />}
          </AnimatePresence>
        </div>
        <OrderSummary step={step} selectedAccount={selectedAccount} amount={amount} selectedMethod={selectedMethod} orderDetails={orderDetails} agreed={agreed} onAgreedChange={setAgreed} onNext={step === 1 ? () => setStep(2) : step === 2 ? handleConfirmMethod : () => { if (selectedMethod?.category === "crypto") setShowCryptoConfirm(true); else handleSubmit(); }} onBack={() => setStep((step - 1) as 1 | 2)} isCalculating={isCalculating} canProceed={canProceed} buttonText={buttonText} />
      </div>

      <div className="max-w-6xl mx-auto pt-8 border-t border-slate-200">
        <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-4">
          <MessageCircle className="w-4 h-4 text-slate-500" />常见问题
        </h3>
        <div className="space-y-0">
          {faqItems.map((item, i) => (
            <div key={i} className="border-b border-slate-100 last:border-0 py-3">
              <p className="text-sm font-medium text-slate-700 mb-1">{item.q}</p>
              <p className="text-sm text-slate-500 leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </div>

      {showCryptoConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">确认已完成转账？</h3>
            <p className="text-sm text-slate-600 leading-relaxed">加密货币转账需要您在钱包中手动完成链上支付。请确认您已向上述地址完成转账后再提交。</p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={() => setShowCryptoConfirm(false)} className="h-11 px-5 rounded-xl">还未转账，稍后再说</Button>
              <Button onClick={() => { setShowCryptoConfirm(false); handleSubmit(); }} className="h-11 px-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">已完成转账，确认提交</Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
