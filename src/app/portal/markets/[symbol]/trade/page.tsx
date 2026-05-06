"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Wallet,
  Settings,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn, formatCurrency } from "@/lib/utils";

// Mock data - 实际应从API获取
const mockAccounts = [
  { id: "MT5-8843201", type: "Real", balance: 28400.5, equity: 29100.2, freeMargin: 24900, currency: "USD" },
  { id: "MT5-0099013", type: "Demo", balance: 100000, equity: 102450, freeMargin: 102450, currency: "USD" },
];

const mockProduct = {
  symbol: "XAUUSD",
  name: "Gold / US Dollar",
  bid: 2345.60,
  ask: 2345.80,
  spread: 20,
  digits: 2,
  change: 12.5,
  changePercent: 0.53,
};

export default function TradePage() {
  const params = useParams();
  const symbol = decodeURIComponent(params.symbol as string);

  const [selectedAccount, setSelectedAccount] = useState(mockAccounts[0]);
  const [orderType, setOrderType] = useState<"market" | "limit" | "stop">("market");
  const [volume, setVolume] = useState("0.1");
  const [limitPrice, setLimitPrice] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [takeProfit, setTakeProfit] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [orderSide, setOrderSide] = useState<"buy" | "sell" | null>(null);

  const currentPrice = orderSide === "buy" ? mockProduct.ask : mockProduct.bid;
  const estimatedMargin = parseFloat(volume) * currentPrice * 100 / 100; // Simplified calc

  const handleTrade = (side: "buy" | "sell") => {
    setOrderSide(side);
    setShowConfirm(true);
  };

  const confirmOrder = () => {
    // TODO: Submit order to API
    console.log("Order submitted:", {
      symbol,
      side: orderSide,
      volume: parseFloat(volume),
      type: orderType,
      price: orderType === "market" ? currentPrice : parseFloat(limitPrice),
      stopLoss: stopLoss ? parseFloat(stopLoss) : undefined,
      takeProfit: takeProfit ? parseFloat(takeProfit) : undefined,
      account: selectedAccount.id,
    });
    setShowConfirm(false);
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/portal/markets/${symbol}`}>
          <motion.button
            whileHover={{ x: -2 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 rounded-xl bg-[var(--tp-bg)] border border-[var(--tp-border)] hover:border-[var(--tp-accent)]/30"
          >
            <ArrowLeft className="w-5 h-5 text-[var(--tp-muted)]" />
          </motion.button>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-[var(--tp-fg)]">Trade {symbol}</h1>
          <p className="text-sm text-[var(--tp-muted)]">{mockProduct.name}</p>
        </div>
      </div>

      {/* Price Display */}
      <Card className="mb-6 border-[var(--tp-border)]">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="text-center flex-1">
              <p className="text-xs text-[var(--tp-muted)] uppercase mb-1">Bid</p>
              <p className="text-2xl font-bold text-rose-500">{mockProduct.bid.toFixed(mockProduct.digits)}</p>
            </div>
            <div className="px-4">
              <span className="text-xs bg-[var(--tp-bg)] px-2 py-1 rounded-full text-[var(--tp-muted)]">
                Spread: {mockProduct.spread}
              </span>
            </div>
            <div className="text-center flex-1">
              <p className="text-xs text-[var(--tp-muted)] uppercase mb-1">Ask</p>
              <p className="text-2xl font-bold text-emerald-500">{mockProduct.ask.toFixed(mockProduct.digits)}</p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 mt-4 text-sm">
            <span className={cn(
              "flex items-center gap-1",
              mockProduct.change >= 0 ? "text-emerald-600" : "text-rose-600"
            )}>
              {mockProduct.change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {mockProduct.change >= 0 ? "+" : ""}{mockProduct.change} ({mockProduct.changePercent}%)
            </span>
            <span className="text-[var(--tp-muted)]">Today</span>
          </div>
        </CardContent>
      </Card>

      {/* Account Selector */}
      <Card className="mb-6 border-[var(--tp-border)]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Wallet className="w-4 h-4 text-[var(--tp-accent)]" />
            Trading Account
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockAccounts.map((account) => (
              <motion.div
                key={account.id}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => setSelectedAccount(account)}
                className={cn(
                  "p-3 rounded-xl border cursor-pointer transition-all",
                  selectedAccount.id === account.id
                    ? "border-[var(--tp-accent)] bg-[var(--tp-accent)]/5"
                    : "border-[var(--tp-border)] hover:border-[var(--tp-accent)]/30"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                      selectedAccount.id === account.id
                        ? "border-[var(--tp-accent)]"
                        : "border-[var(--tp-border)]"
                    )}>
                      {selectedAccount.id === account.id && (
                        <div className="w-2 h-2 rounded-full bg-[var(--tp-accent)]" />
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-[var(--tp-fg)]">{account.id}</p>
                      <p className="text-xs text-[var(--tp-muted)]">{account.type} · {account.currency}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm text-[var(--tp-fg)]">{formatCurrency(account.equity)}</p>
                    <p className="text-xs text-emerald-600">Free: {formatCurrency(account.freeMargin)}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Order Form */}
      <Card className="mb-6 border-[var(--tp-border)]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Settings className="w-4 h-4 text-[var(--tp-accent)]" />
            Order Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Order Type */}
          <Tabs value={orderType} onValueChange={(v) => setOrderType(v as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="market">Market</TabsTrigger>
              <TabsTrigger value="limit">Limit</TabsTrigger>
              <TabsTrigger value="stop">Stop</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Volume */}
          <div className="space-y-2">
            <Label className="text-xs text-[var(--tp-muted)]">Volume (Lots)</Label>
            <div className="flex gap-2">
              {["0.01", "0.1", "0.5", "1.0"].map((v) => (
                <Button
                  key={v}
                  type="button"
                  variant={volume === v ? "default" : "outline"}
                  size="sm"
                  onClick={() => setVolume(v)}
                  className="flex-1"
                >
                  {v}
                </Button>
              ))}
            </div>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              value={volume}
              onChange={(e) => setVolume(e.target.value)}
              className="mt-2"
            />
          </div>

          {/* Limit/Stop Price */}
          {orderType !== "market" && (
            <div className="space-y-2">
              <Label className="text-xs text-[var(--tp-muted)]">
                {orderType === "limit" ? "Limit Price" : "Stop Price"}
              </Label>
              <Input
                type="number"
                step="0.01"
                value={limitPrice}
                onChange={(e) => setLimitPrice(e.target.value)}
                placeholder={`Current: ${currentPrice}`}
              />
            </div>
          )}

          {/* SL/TP */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs text-[var(--tp-muted)]">Stop Loss</Label>
              <Input
                type="number"
                step="0.01"
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
                placeholder="Optional"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-[var(--tp-muted)]">Take Profit</Label>
              <Input
                type="number"
                step="0.01"
                value={takeProfit}
                onChange={(e) => setTakeProfit(e.target.value)}
                placeholder="Optional"
              />
            </div>
          </div>

          {/* Margin Info */}
          <div className="p-3 rounded-lg bg-[var(--tp-bg)] border border-[var(--tp-border)]">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--tp-muted)]">Estimated Margin:</span>
              <span className="font-bold text-[var(--tp-fg)]">~{formatCurrency(estimatedMargin)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trade Buttons */}
      <div className="grid grid-cols-2 gap-4">
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            onClick={() => handleTrade("sell")}
            className="w-full h-16 text-lg font-bold bg-rose-500 hover:bg-rose-600 text-white"
          >
            <TrendingDown className="w-5 h-5 mr-2" />
            SELL {mockProduct.bid.toFixed(mockProduct.digits)}
          </Button>
        </motion.div>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            onClick={() => handleTrade("buy")}
            className="w-full h-16 text-lg font-bold bg-emerald-500 hover:bg-emerald-600 text-white"
          >
            <TrendingUp className="w-5 h-5 mr-2" />
            BUY {mockProduct.ask.toFixed(mockProduct.digits)}
          </Button>
        </motion.div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-[var(--tp-card)] rounded-2xl p-6 max-w-md w-full border border-[var(--tp-border)]"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center",
                orderSide === "buy" ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
              )}>
                {orderSide === "buy" ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="font-bold text-lg text-[var(--tp-fg)]">Confirm Order</h3>
                <p className="text-sm text-[var(--tp-muted)]">
                  {orderSide === "buy" ? "Buy" : "Sell"} {symbol}
                </p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-[var(--tp-muted)]">Account:</span>
                <span className="font-medium text-[var(--tp-fg)]">{selectedAccount.id}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--tp-muted)]">Volume:</span>
                <span className="font-medium text-[var(--tp-fg)]">{volume} lots</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--tp-muted)]">Type:</span>
                <span className="font-medium text-[var(--tp-fg)] capitalize">{orderType}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--tp-muted)]">Price:</span>
                <span className="font-medium text-[var(--tp-fg)]">
                  {orderType === "market" ? currentPrice.toFixed(mockProduct.digits) : limitPrice || "-"}
                </span>
              </div>
              {(stopLoss || takeProfit) && (
                <div className="pt-2 border-t border-[var(--tp-border)]">
                  {stopLoss && (
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--tp-muted)]">Stop Loss:</span>
                      <span className="font-medium text-rose-600">{stopLoss}</span>
                    </div>
                  )}
                  {takeProfit && (
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--tp-muted)]">Take Profit:</span>
                      <span className="font-medium text-emerald-600">{takeProfit}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                className={cn(
                  "flex-1",
                  orderSide === "buy" ? "bg-emerald-500 hover:bg-emerald-600" : "bg-rose-500 hover:bg-rose-600"
                )}
                onClick={confirmOrder}
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Confirm
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Risk Warning */}
      <div className="mt-6 flex items-start gap-2 text-xs text-[var(--tp-muted)]">
        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <p>
          CFD trading carries a high risk of losing money rapidly due to leverage.
          Please ensure you understand the risks before trading.
        </p>
      </div>
    </div>
  );
}
