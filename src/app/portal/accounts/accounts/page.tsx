"use client";

import { motion } from "framer-motion";
import { BarChart2, Plus, TrendingUp, TrendingDown, Eye, RefreshCw, Wallet } from "lucide-react";
import { StatCard } from "@/components/portal/widgets/StatCard";
import { PageHeader } from "@/components/portal/widgets/PageHeader";
import { formatCurrency, formatPercent, cn } from "@/lib/utils";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

const mockAccounts = [
  { id: "MT5-8843201", type: "Real", balance: 28400.5, equity: 29100.2, margin: 4200, freeMargin: 24900, marginLevel: 692.86, server: "TradePass-Live", leverage: "1:100", currency: "USD", profit: 2.46, openTrades: 3 },
  { id: "MT5-8843202", type: "Real", balance: 15200.0, equity: 15080.5, margin: 800, freeMargin: 14280.5, marginLevel: 1885.06, server: "TradePass-Live", leverage: "1:200", currency: "USD", profit: -0.79, openTrades: 1 },
  { id: "MT5-0099013", type: "Demo", balance: 100000, equity: 102450, margin: 0, freeMargin: 102450, marginLevel: 0, server: "TradePass-Demo", leverage: "1:500", currency: "USD", profit: 2.45, openTrades: 0 },
];

function AccountCard({ account }: { account: (typeof mockAccounts)[0] }) {
  const isProfit = account.profit >= 0;
  const isReal = account.type === "Real";
  
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
        <CardContent className="p-0">
          {/* Header */}
          <div className={cn(
            "px-5 pt-5 pb-4",
            isReal 
              ? "bg-gradient-to-r from-[var(--tp-accent)]/5 to-transparent" 
              : "bg-[var(--tp-bg)]"
          )}>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={cn(
                    "text-[10px] font-bold px-2.5 py-1 rounded-full",
                    isReal
                      ? "bg-emerald-500/10 text-emerald-600"
                      : "bg-violet-500/10 text-violet-600"
                  )}>
                    {account.type}
                  </span>
                  <span className="text-xs text-[var(--tp-muted)] font-medium">{account.leverage}</span>
                  {account.openTrades > 0 && (
                    <span className="text-[10px] bg-amber-500/10 text-amber-600 px-2 py-1 rounded-full font-bold">
                      {account.openTrades} open
                    </span>
                  )}
                </div>
                <p className="font-mono font-bold text-[var(--tp-fg)] text-lg">{account.id}</p>
                <p className="text-xs text-[var(--tp-muted)] mt-0.5">{account.server}</p>
              </div>
              <div className={cn(
                "text-right px-3 py-2 rounded-xl",
                isProfit ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"
              )}>
                <div className="text-sm font-bold">{isProfit ? "+" : ""}{formatPercent(account.profit)}</div>
                <div className="flex items-center gap-1 justify-end text-xs mt-0.5 opacity-80">
                  {isProfit ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                  <span>Today</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats grid */}
          <div className="px-5 pb-4 grid grid-cols-2 gap-3 mt-1">
            {[
              { label: "Balance", value: formatCurrency(account.balance), icon: Wallet },
              { label: "Equity", value: formatCurrency(account.equity), icon: TrendingUp },
              { label: "Margin", value: formatCurrency(account.margin), icon: BarChart2 },
              { label: "Free Margin", value: formatCurrency(account.freeMargin), icon: RefreshCw },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="bg-[var(--tp-bg)] rounded-xl p-3 border border-[var(--tp-border)]">
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="w-3.5 h-3.5 text-[var(--tp-muted)]" />
                  <p className="text-[10px] text-[var(--tp-muted)] font-medium uppercase tracking-wide">{label}</p>
                </div>
                <p className="text-sm font-bold text-[var(--tp-fg)]">{value}</p>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="px-5 pb-5 flex gap-2">
            <Link href={`/portal/fund/deposit?account=${account.id}`} className="flex-1">
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full text-xs font-bold py-2.5 px-4 rounded-xl bg-[var(--tp-accent)] text-white hover:opacity-90 transition-all shadow-lg shadow-[var(--tp-accent)]/20"
              >
                Deposit
              </motion.button>
            </Link>
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 text-xs font-bold py-2.5 px-4 rounded-xl bg-[var(--tp-bg)] text-[var(--tp-fg)] border border-[var(--tp-border)] hover:border-[var(--tp-accent)]/30 transition-all"
            >
              Withdraw
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2.5 rounded-xl bg-[var(--tp-bg)] text-[var(--tp-muted)] hover:text-[var(--tp-accent)] border border-[var(--tp-border)] hover:border-[var(--tp-accent)]/30 transition-all"
            >
              <Eye size={14} />
            </motion.button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function TradingAccountsPage() {
  const realAccounts = mockAccounts.filter((a) => a.type === "Real");
  const demoAccounts = mockAccounts.filter((a) => a.type === "Demo");

  const totalBalance = realAccounts.reduce((s, a) => s + a.balance, 0);
  const totalEquity = realAccounts.reduce((s, a) => s + a.equity, 0);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Trading Accounts"
        description="Manage your MT5 real and demo trading accounts."
        actions={
          <Link href="/portal/accounts/open-account">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--tp-accent)] text-white text-sm font-bold hover:opacity-90 transition-all shadow-lg shadow-[var(--tp-accent)]/20"
            >
              <Plus size={16} />
              Open Account
            </motion.button>
          </Link>
        }
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Balance" value={formatCurrency(totalBalance)} change={1.82} icon={BarChart2} delay={0} />
        <StatCard title="Total Equity" value={formatCurrency(totalEquity)} change={2.31} icon={TrendingUp} delay={0.05} />
        <StatCard title="Real Accounts" value={String(realAccounts.length)} icon={BarChart2} delay={0.1} />
        <StatCard title="Demo Accounts" value={String(demoAccounts.length)} icon={RefreshCw} delay={0.15} />
      </div>

      {/* Real accounts */}
      <div>
        <h2 className="text-sm font-bold text-[var(--tp-muted)] uppercase tracking-widest mb-4">
          Real Accounts
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {realAccounts.map((acc) => <AccountCard key={acc.id} account={acc} />)}
          {/* Add account card */}
          <Link href="/portal/accounts/open-account">
            <motion.div
              whileHover={{ y: -4, scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="h-full min-h-[240px] rounded-2xl border-2 border-dashed border-[var(--tp-border)] hover:border-[var(--tp-accent)] hover:bg-[var(--tp-accent)]/5 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all duration-300 group"
            >
              <div className="w-14 h-14 rounded-2xl bg-[var(--tp-bg)] group-hover:bg-[var(--tp-accent)]/10 border-2 border-[var(--tp-border)] group-hover:border-[var(--tp-accent)]/30 flex items-center justify-center transition-all">
                <Plus size={24} className="text-[var(--tp-muted)] group-hover:text-[var(--tp-accent)] transition-colors" />
              </div>
              <p className="text-sm font-semibold text-[var(--tp-muted)] group-hover:text-[var(--tp-accent)] transition-colors">
                Open Real Account
              </p>
            </motion.div>
          </Link>
        </div>
      </div>

      {/* Demo accounts */}
      <div>
        <h2 className="text-sm font-bold text-[var(--tp-muted)] uppercase tracking-widest mb-4">
          Demo Accounts
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {demoAccounts.map((acc) => <AccountCard key={acc.id} account={acc} />)}
        </div>
      </div>
    </div>
  );
}
