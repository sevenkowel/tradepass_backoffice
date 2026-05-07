"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Copy, AlertTriangle, ArrowUpRight, Landmark } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { DepositAccount, PaymentMethod, CalculationResult } from "../types";
import { currencySymbol, formatAccountLabel } from "../utils";

interface Step3Props {
  selectedAccount: DepositAccount;
  selectedMethod: PaymentMethod;
  orderDetails: CalculationResult;
  copied: boolean;
  onCopy: (text: string) => void;
  qrDataUrl: string | null;
  receiptFile: File | null;
  onReceiptChange: (file: File | null) => void;
}

export function Step3Confirm({ selectedAccount, selectedMethod, orderDetails, copied, onCopy, qrDataUrl, receiptFile, onReceiptChange }: Step3Props) {
  return (
    <motion.div key="step3" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }} className="space-y-5">
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-6 space-y-5">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-slate-600" />确认存款订单
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-xs text-slate-500 mb-1">存入账户</p>
              <p className="text-sm font-medium text-slate-900">{formatAccountLabel(selectedAccount)}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-xs text-slate-500 mb-1">支付方式</p>
              <p className="text-sm font-medium text-slate-900">{selectedMethod.name}</p>
              <p className="text-xs text-slate-400 mt-0.5">{selectedMethod.estimatedTime}</p>
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl p-5 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">{selectedMethod.calculationMode === "deposit_first" ? "存款金额" : "付款金额"}</span>
              <span className="font-medium text-slate-900">
                {currencySymbol(selectedMethod.calculationMode === "deposit_first" ? selectedAccount.currency : selectedMethod.paymentCurrency)}
                {(selectedMethod.calculationMode === "deposit_first" ? orderDetails.depositAmount : orderDetails.paymentAmount).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">参考汇率</span>
              <span className="font-medium text-slate-900">{orderDetails.rateDisplay}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">换汇金额</span>
              <span className="font-medium text-slate-900">{currencySymbol(selectedMethod.paymentCurrency)}{orderDetails.exchangeAmount.toLocaleString(undefined, { maximumFractionDigits: 4 })}</span>
            </div>
            <div className="border-t border-slate-200 pt-3 flex justify-between items-center">
              <span className="font-semibold text-slate-900">{selectedMethod.calculationMode === "deposit_first" ? "预计付款金额" : "预计到账金额"}</span>
              <span className="text-2xl font-bold text-slate-900">
                {currencySymbol(selectedMethod.calculationMode === "deposit_first" ? selectedMethod.paymentCurrency : selectedAccount.currency)}
                {(selectedMethod.calculationMode === "deposit_first" ? orderDetails.paymentAmount : orderDetails.depositAmount).toLocaleString(undefined, { maximumFractionDigits: selectedMethod.calculationMode === "deposit_first" ? 4 : 2 })}
              </span>
            </div>
          </div>

          {/* Crypto */}
          {selectedMethod.category === "crypto" && (
            <div className="p-5 border border-dashed border-slate-300 rounded-xl bg-slate-50/50 space-y-5">
              <div className="flex items-start gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center mt-0.5">1</span>
                <div>
                  <p className="text-base font-semibold text-slate-900">存款地址</p>
                  <p className="text-sm text-slate-500 mt-0.5">复制 {selectedMethod.name} 钱包地址并将其粘贴到您的个人加密货币钱包中作为收件人地址。</p>
                </div>
              </div>

              <div className="flex flex-col items-center gap-4">
                <div className="w-36 h-36 bg-white rounded-xl border border-slate-200 p-2 flex items-center justify-center overflow-hidden">
                  {qrDataUrl ? <img src={qrDataUrl} alt="QR Code" className="w-full h-full object-contain rounded-lg" /> : <div className="w-full h-full bg-slate-100 rounded-lg animate-pulse" />}
                </div>
                <div className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-slate-100 rounded-xl">
                  <p className="font-medium text-slate-900 font-mono tracking-wide break-all text-sm leading-relaxed">
                    {mockAddress(selectedMethod.id)}
                  </p>
                  <button onClick={() => onCopy(mockAddress(selectedMethod.id))} className="shrink-0 p-2 hover:bg-white rounded-lg text-slate-500 transition-colors" title="复制地址">
                    {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                <p className="text-sm font-semibold text-amber-800 flex items-center gap-2"><AlertTriangle className="w-4 h-4" />重要</p>
                <ol className="text-xs text-amber-700 space-y-1.5 list-decimal list-inside leading-relaxed">
                  <li>请确保支付金额超过 5 USDT。低于此阈值的金额将不会被记入。</li>
                  <li>USDT-BEP20 转账分为交易和内部交易。使用内部交易进行转账可能会导致交易丢失。请避免使用这种方法。</li>
                  <li>请注意，我们无法通过 BUSDT 存款或取款，请确保地址和加密货币与我们接受的链和货币匹配，否则您可能会丢失资金。</li>
                  <li>请注意支付区块链转账手续费，以免导致入金到账金额不同。</li>
                </ol>
              </div>
            </div>
          )}

          {/* Bank */}
          {selectedMethod.category === "bank" && (
            <div className="p-5 border border-dashed border-slate-300 rounded-xl bg-slate-50/50 space-y-4">
              <p className="text-sm font-medium text-slate-900 flex items-center gap-2"><Landmark className="w-4 h-4 text-slate-500" />收款账户信息</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                {[
                  { label: "账户名称", value: "TradePass Global Ltd" },
                  { label: "银行账号", value: "8823-1100-4455-9921" },
                  { label: "开户银行", value: "Standard Chartered Bank" },
                  { label: "SWIFT", value: "SCBLUS33" },
                ].map((item) => (
                  <div key={item.label} className="p-3 bg-white rounded-lg border border-slate-200">
                    <p className="text-xs text-slate-500">{item.label}</p>
                    {item.label === "银行账号" || item.label === "SWIFT" ? (
                      <div className="flex items-center justify-between gap-2 mt-1">
                        <p className="font-medium text-slate-900 truncate">{item.value}</p>
                        <button onClick={() => onCopy(item.value)} className="p-1.5 hover:bg-slate-100 rounded text-slate-500">
                          {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    ) : (
                      <p className="font-medium text-slate-900 mt-1">{item.value}</p>
                    )}
                  </div>
                ))}
              </div>

              <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
                <p className="text-sm font-medium text-slate-900">转账截图 <span className="text-red-500">*</span></p>
                <p className="text-xs text-slate-500">请上传转账成功截图，完成后才可提交存款订单</p>
                <label className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer transition-colors">
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => onReceiptChange(e.target.files?.[0] || null)} />
                  选择文件
                </label>
                {receiptFile ? (
                  <div className="flex items-center gap-2 text-sm text-emerald-700"><CheckCircle2 className="w-4 h-4" /><span className="truncate max-w-[240px]">{receiptFile.name}</span></div>
                ) : (
                  <p className="text-xs text-red-500">必须上传转账截图</p>
                )}
              </div>
            </div>
          )}

          {/* Card / eWallet */}
          {(selectedMethod.category === "card" || selectedMethod.category === "ewallet") && (
            <div className="p-5 border border-dashed border-slate-300 rounded-xl bg-slate-50/50 space-y-2">
              <p className="text-sm font-medium text-slate-900 flex items-center gap-2"><ArrowUpRight className="w-4 h-4 text-slate-500" />第三方支付</p>
              <p className="text-sm text-slate-600">确认订单后，我们将跳转至 {selectedMethod.name} 的安全支付页面完成付款。</p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function mockAddress(methodId: string): string {
  if (methodId.includes("btc")) return "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh";
  if (methodId.includes("eth")) return "0xA1B2C3D4E5F6789012345678901234567890ABCD";
  return "0xA1B2C3D4E5F6";
}
