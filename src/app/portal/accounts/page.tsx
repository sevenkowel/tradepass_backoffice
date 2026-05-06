"use client";

import { motion } from "framer-motion";
import {
  BarChart2,
  Plus,
  TrendingUp,
  TrendingDown,
  Wallet,
  History,
  ListTodo,
  Briefcase,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  CreditCard,
  Settings,
} from "lucide-react";
import { StatCard } from "@/components/portal/widgets/StatCard";
import { PageHeader } from "@/components/portal/widgets/PageHeader";
import { formatCurrency, formatPercent, cn } from "@/lib/utils";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/Button";

// Mock data
const mockAccounts = [
  { id: "MT5-8843201", type: "Real", balance: 28400.5, equity: 29100.2, margin: 4200, freeMargin: 24900, marginLevel: 692.86, server: "TradePass-Live", leverage: "1:100", currency: "USD", profit: 2.46, openTrades: 3 },
  { id: "MT5-8843202", type: "Real", balance: 15200.0, equity: 15080.5, margin: 800, freeMargin: 14280.5, marginLevel: 1885.06, server: "TradePass-Live", leverage: "1:200", currency: "USD", profit: -0.79, openTrades: 1 },
  { id: "MT5-0099013", type: "Demo", balance: 100000, equity: 102450, margin: 0, freeMargin: 102450, marginLevel: 0, server: "TradePass-Demo", leverage: "1:500", currency: "USD", profit: 2.45, openTrades: 0 },
];

const mockPositions = [
  { symbol: "XAUUSD", type: "Buy", volume: 0.5, openPrice: 2340.5, currentPrice: 2345.6, profit: 255, profitPercent: 2.18 },
  { symbol: "EURUSD", type: "Buy", volume: 1.0, openPrice: 1.0820, currentPrice: 1.0856, profit: 36, profitPercent: 0.33 },
  { symbol: "US30", type: "Sell", volume: 0.1, openPrice: 38600, currentPrice: 38500, profit: 100, profitPercent: 0.26 },
];

const mockRecentOrders = [
  { symbol: "GBPUSD", type: "Limit Buy", volume: 0.5, price: 1.2650, status: "Pending", time: "2 mins ago" },
  { symbol: "USDJPY", type: "Stop Sell", volume: 1.0, price: 151.2, status: "Pending", time: "15 mins ago" },
];

function AccountCard({ account }: { account: (typeof mockAccounts)[0] }) {
  const isProfit = account.profit >= 0;
  const isReal = account.type === "Real";

  return (
    <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
      <Card className="overflow-hidden border border-[var(--tp-border)] hover:border-[var(--tp-accent)]/30 transition-all">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={cn(
                  "text-[10px] font-bold px-2 py-0.5 rounded-full",
                  isReal ? "bg-emerald-500/10 text-emerald-600" : "bg-violet-500/10 text-violet-600"
                )}>
                  {account.type}
                </span>
                {account.openTrades > 0 && (
                  <span className="text-[10px] bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-full font-bold">
                    {account.openTrades} open
                  </span>
                )}
              </div>
              <p className="font-mono font-bold text-[var(--tp-fg)]">{account.id}</p>
              <p className="text-xs text-[var(--tp-muted)]">{account.server} · {account.leverage}</p>
            </div>
            <div className={cn(
              "text-right px-2 py-1 rounded-lg",
              isProfit ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"
            )}>
              <div className="text-xs font-bold">{isProfit ? "+" : ""}{formatPercent(account.profit)}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-[10px] text-[var(--tp-muted)] uppercase">Balance</p>
              <p className="font-bold text-[var(--tp-fg)]">{formatCurrency(account.balance)}</p>
            </div>
            <div>
              <p className="text-[10px] text-[var(--tp-muted)] uppercase">Equity</p>
              <p className="font-bold text-[var(--tp-fg)]">{formatCurrency(account.equity)}</p>
            </div>
          </div>

          <div className="flex gap-2 mt-3">
            <Button size="sm" variant="outline" className="flex-1 text-xs h-8">
              <DollarSign className="w-3 h-3 mr-1" />
              Deposit
            </Button>
            <Button size="sm" variant="outline" className="flex-1 text-xs h-8">
              <CreditCard className="w-3 h-3 mr-1" />
              Withdraw
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function PositionRow({ position }: { position: (typeof mockPositions)[0] }) {
  const isProfit = position.profit >= 0;
  const isBuy = position.type === "Buy";

  return (
    <div className="flex items-center justify-between py-2 border-b border-[var(--tp-border)] last:border-0">
      <div className="flex items-center gap-3">
        <div className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold",
          isBuy ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"
        )}>
          {isBuy ? "B" : "S"}
        </div>
        <div>
          <p className="font-bold text-sm text-[var(--tp-fg)]">{position.symbol}</p>
          <p className="text-xs text-[var(--tp-muted)]">{position.volume} lot @ {position.openPrice}</p>
        </div>
      </div>
      <div className="text-right">
        <p className={cn(
          "font-bold text-sm",
          isProfit ? "text-emerald-600" : "text-rose-600"
        )}>
          {isProfit ? "+" : ""}{formatCurrency(position.profit)}
        </p>
        <p className="text-xs text-[var(--tp-muted)]">{position.currentPrice}</p>
      </div>
    </div>
  );
}

export default function AccountsDashboardPage() {
  const realAccounts = mockAccounts.filter((a) => a.type === "Real");
  const totalBalance = realAccounts.reduce((s, a) => s + a.balance, 0);
  const totalEquity = realAccounts.reduce((s, a) => s + a.equity, 0);
  const totalMargin = realAccounts.reduce((s, a) => s + a.margin, 0);
  const totalProfit = mockPositions.reduce((s, p) => s + p.profit, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Account Center"
        description="Manage your trading accounts, positions, and orders."
        actions={
          <Link href="/portal/accounts/open-account">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--tp-accent)] text-white text-sm font-bold hover:opacity-90 transition-all"
            >
              <Plus size={16} />
              Open Account
            </motion.button>
          </Link>
        }
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Balance" value={formatCurrency(totalBalance)} change={1.82} icon={Wallet} delay={0} />
        <StatCard title="Total Equity" value={formatCurrency(totalEquity)} change={2.31} icon={TrendingUp} delay={0.05} />
        <StatCard title="Used Margin" value={formatCurrency(totalMargin)} icon={BarChart2} delay={0.1} />
        <StatCard
          title="Open P&L"
          value={formatCurrency(totalProfit)}
          change={totalProfit >= 0 ? 3.45 : -1.23}
          icon={totalProfit >= 0 ? TrendingUp : TrendingDown}
          delay={0.15}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* My Accounts */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-[var(--tp-accent)]" />
                  My Accounts
                </CardTitle>
                <Link href="/portal/accounts/accounts" className="text-xs text-[var(--tp-accent)] hover:underline">
                  View All
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {realAccounts.map((acc) => (
                  <AccountCard key={acc.id} account={acc} />
                ))}
                <Link href="/portal/accounts/open-account">
                  <motion.div
                    whileHover={{ y: -2 }}
                    className="h-full min-h-[160px] rounded-xl border-2 border-dashed border-[var(--tp-border)] hover:border-[var(--tp-accent)] hover:bg-[var(--tp-accent)]/5 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <Plus size={20} className="text-[var(--tp-muted)]" />
                    <p className="text-xs font-medium text-[var(--tp-muted)]">Open New Account</p>
                  </motion.div>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "Deposit", icon: ArrowDownRight, href: "/portal/fund/deposit", color: "text-emerald-600" },
                  { label: "Withdraw", icon: ArrowUpRight, href: "#", color: "text-rose-600" },
                  { label: "Positions", icon: Briefcase, href: "/portal/accounts/positions", color: "text-blue-600" },
                  { label: "History", icon: History, href: "/portal/accounts/history", color: "text-violet-600" },
                ].map((action) => (
                  <Link key={action.label} href={action.href}>
                    <motion.div
                      whileHover={{ y: -2 }}
                      className="p-4 rounded-xl bg-[var(--tp-bg)] border border-[var(--tp-border)] hover:border-[var(--tp-accent)]/30 transition-all text-center"
                    >
                      <action.icon className={cn("w-5 h-5 mx-auto mb-2", action.color)} />
                      <p className="text-xs font-medium text-[var(--tp-fg)]">{action.label}</p>
                    </motion.div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Open Positions */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-[var(--tp-accent)]" />
                  Open Positions
                </CardTitle>
                <span className="text-xs text-[var(--tp-muted)]">{mockPositions.length} active</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {mockPositions.map((pos) => (
                  <PositionRow key={pos.symbol} position={pos} />
                ))}
              </div>
              <Link href="/portal/accounts/positions">
                <Button variant="ghost" size="sm" className="w-full mt-3 text-xs">
                  View All Positions
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Pending Orders */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <ListTodo className="w-4 h-4 text-[var(--tp-accent)]" />
                  Pending Orders
                </CardTitle>
                <span className="text-xs text-[var(--tp-muted)]">{mockRecentOrders.length}</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockRecentOrders.map((order, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2 border-b border-[var(--tp-border)] last:border-0">
                    <div>
                      <p className="font-medium text-sm text-[var(--tp-fg)]">{order.symbol}</p>
                      <p className="text-xs text-[var(--tp-muted)]">{order.type} {order.volume} lot</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm text-[var(--tp-fg)]">{order.price}</p>
                      <p className="text-xs text-amber-600">{order.status}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/portal/accounts/orders">
                <Button variant="ghost" size="sm" className="w-full mt-3 text-xs">
                  View All Orders
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
