"use client";

import { motion } from "framer-motion";
import { Star, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { allAccounts, walletAccounts, mt4Accounts, mt5Accounts, tpAccounts, recommendedAccount } from "../data";
import { formatAccountLabel, currencySymbol } from "../utils";

interface Step1Props {
  targetAccount: string;
  onTargetAccountChange: (v: string) => void;
  amount: string;
  onAmountChange: (v: string) => void;
  accountSymbolStr: string;
  quickAmounts: string[];
  limits: { min: number; max: number; daily: number; monthly: number };
  todayUsed: number;
  isSuspicious: boolean;
}

export function Step1AccountAmount({
  targetAccount, onTargetAccountChange, amount, onAmountChange,
  accountSymbolStr, quickAmounts, limits, todayUsed, isSuspicious,
}: Step1Props) {
  const usageRatio = todayUsed / limits.daily;
  const remaining = limits.daily - todayUsed;

  return (
    <motion.div key="step1" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }}>
      <Card className="overflow-hidden border-slate-200">
        <CardContent className="p-0">
          <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100">
            <h2 className="text-lg font-semibold text-slate-900">存款</h2>
          </div>

          <div className="p-6 space-y-6">
            {/* ① 选择存入账户 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 text-xs flex items-center justify-center">1</span>
                选择存入账户
              </div>
              <Select value={targetAccount} onValueChange={onTargetAccountChange}>
                <SelectTrigger className="h-12 border-slate-200"><SelectValue placeholder="选择账户" /></SelectTrigger>
                <SelectContent className="max-h-[320px] w-[520px]">
                  {recommendedAccount && (
                    <>
                      <div className="px-2 py-1.5 text-xs font-medium text-amber-600 flex items-center gap-1">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> 推荐账户
                      </div>
                      <SelectItem value={recommendedAccount.id}>
                        <span className="font-mono text-sm text-slate-900">{formatAccountLabel(recommendedAccount)}</span>
                      </SelectItem>
                      <div className="h-px bg-slate-100 mx-2 my-1" />
                      <div className="px-2 py-1.5 text-xs font-medium text-slate-500">其他账户</div>
                    </>
                  )}
                  {walletAccounts.length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-xs font-medium text-slate-500">钱包</div>
                      {walletAccounts.map(acc => (
                        <SelectItem key={acc.id} value={acc.id}><span className="font-mono text-sm text-slate-700">{formatAccountLabel(acc)}</span></SelectItem>
                      ))}
                    </>
                  )}
                  {mt4Accounts.filter(a => a.id !== recommendedAccount?.id).length > 0 && (
                    <>
                      <div className="h-px bg-slate-100 mx-2 my-1" />
                      <div className="px-2 py-1.5 text-xs font-medium text-slate-500 flex justify-between">
                        MT4 <span className="font-normal text-slate-400">({mt4Accounts.filter(a => a.id !== recommendedAccount?.id).length})</span>
                      </div>
                      {mt4Accounts.filter(a => a.id !== recommendedAccount?.id).map(acc => (
                        <SelectItem key={acc.id} value={acc.id}><span className="font-mono text-sm text-slate-700">{formatAccountLabel(acc)}</span></SelectItem>
                      ))}
                    </>
                  )}
                  {mt5Accounts.filter(a => a.id !== recommendedAccount?.id).length > 0 && (
                    <>
                      <div className="h-px bg-slate-100 mx-2 my-1" />
                      <div className="px-2 py-1.5 text-xs font-medium text-slate-500 flex justify-between">
                        MT5 <span className="font-normal text-slate-400">({mt5Accounts.filter(a => a.id !== recommendedAccount?.id).length})</span>
                      </div>
                      {mt5Accounts.filter(a => a.id !== recommendedAccount?.id).map(acc => (
                        <SelectItem key={acc.id} value={acc.id}><span className="font-mono text-sm text-slate-700">{formatAccountLabel(acc)}</span></SelectItem>
                      ))}
                    </>
                  )}
                  {tpAccounts.length > 0 && (
                    <>
                      <div className="h-px bg-slate-100 mx-2 my-1" />
                      <div className="px-2 py-1.5 text-xs font-medium text-slate-500 flex justify-between">
                        TP <span className="font-normal text-slate-400">({tpAccounts.length})</span>
                      </div>
                      {tpAccounts.map(acc => (
                        <SelectItem key={acc.id} value={acc.id}><span className="font-mono text-sm text-slate-700">{formatAccountLabel(acc)}</span></SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="h-px bg-slate-100" />

            {/* ② 输入存款金额 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 text-xs flex items-center justify-center">2</span>
                输入存款金额
              </div>

              <div className="flex flex-wrap gap-2">
                {quickAmounts.map(preset => (
                  <button key={preset} onClick={() => onAmountChange(preset)}
                    className="px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 transition-colors">
                    {accountSymbolStr}{parseInt(preset).toLocaleString()}
                  </button>
                ))}
              </div>

              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-3xl font-bold text-slate-500">
                  {accountSymbolStr}
                </span>
                <Input type="number" placeholder="0.00" value={amount} onChange={e => onAmountChange(e.target.value)}
                  className="pl-14 h-16 text-3xl font-bold font-variant-numeric tabular-nums border-slate-200" />
              </div>

              {/* 限额提示 */}
              {usageRatio >= 0.85 ? (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-800">今日额度紧张</p>
                    <p className="text-xs text-red-600 mt-0.5">已用 {accountSymbolStr}{todayUsed.toLocaleString()} / 限额 {accountSymbolStr}{limits.daily.toLocaleString()}，剩余 {accountSymbolStr}{remaining.toLocaleString()}</p>
                    <button className="mt-2 text-xs font-medium text-red-700 hover:underline">申请提升额度 →</button>
                  </div>
                </div>
              ) : usageRatio >= 0.6 ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-amber-800">今日额度已用 {Math.round(usageRatio * 100)}%</p>
                    <p className="text-xs text-amber-600 mt-0.5">剩余 {accountSymbolStr}{remaining.toLocaleString()}，单笔限额 {accountSymbolStr}{limits.min.toLocaleString()} - {accountSymbolStr}{limits.max.toLocaleString()}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>单笔 {accountSymbolStr}{limits.min.toLocaleString()} - {accountSymbolStr}{limits.max.toLocaleString()}</span>
                  <span>今日剩余 {accountSymbolStr}{remaining.toLocaleString()}</span>
                </div>
              )}

              {isSuspicious && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">小额充值频繁</p>
                    <p className="text-xs text-amber-600 mt-0.5">检测到连续小额充值，请确认是否本人操作</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
