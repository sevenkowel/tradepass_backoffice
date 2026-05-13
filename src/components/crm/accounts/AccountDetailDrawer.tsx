"use client";

import { Drawer } from "@/components/crm/ui/Drawer";
import { StatusBadge } from "@/components/crm/ui/StatusBadge";
import { TrendingUp, TrendingDown, CreditCard, Activity } from "lucide-react";
import type { MTAccount } from "@/types/backoffice";

interface AccountDetailDrawerProps {
  account: MTAccount | null;
  open: boolean;
  onClose: () => void;
}

export function AccountDetailDrawer({ account, open, onClose }: AccountDetailDrawerProps) {
  if (!account) return null;

  const profit = account.equity - account.balance;
  const marginLevel = account.margin > 0 ? (account.equity / account.margin) * 100 : 0;
  const isProfit = profit >= 0;

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "orders", label: "Recent Orders" },
    { id: "history", label: "Balance History" },
  ];

  return (
    <Drawer
      isOpen={open}
      onClose={onClose}
      title={`Account ${account.accountId}`}
      description={account.username}
    >
      <div className="space-y-6">
        {/* Account Status */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-500">Status</div>
            <div className="mt-1">
              <StatusBadge
                status={account.status}
                type={
                  account.status === "active"
                    ? "success"
                    : account.status === "frozen"
                      ? "warning"
                      : "default"
                }
              />
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Platform</div>
            <div className="mt-1">
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${
                  account.type === "mt5"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-green-100 text-green-700"
                }`}
              >
                MetaTrader {account.type.toUpperCase()}
              </span>
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Leverage</div>
            <div className="mt-1 text-lg font-bold text-gray-900">1:{account.leverage}</div>
          </div>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
              <CreditCard className="w-4 h-4" />
              Balance
            </div>
            <div className="text-2xl font-bold text-gray-900">
              ${account.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
              <Activity className="w-4 h-4" />
              Equity
            </div>
            <div className="text-2xl font-bold text-gray-900">
              ${account.equity.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {/* P&L */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500">Unrealized P&L</div>
              <div
                className={`text-2xl font-bold ${
                  isProfit ? "text-green-600" : "text-red-600"
                }`}
              >
                {isProfit ? "+" : ""}$
                {profit.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div className={`p-3 rounded-full ${isProfit ? "bg-green-100" : "bg-red-100"}`}>
              {isProfit ? (
                <TrendingUp className={`w-6 h-6 text-green-600`} />
              ) : (
                <TrendingDown className={`w-6 h-6 text-red-600`} />
              )}
            </div>
          </div>
        </div>

        {/* Margin Info */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Margin Information</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Used Margin</span>
              <span className="text-sm font-medium text-gray-900">
                ${account.margin.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Free Margin</span>
              <span className="text-sm font-medium text-gray-900">
                ${account.freeMargin.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Margin Level</span>
              <span
                className={`text-sm font-medium ${
                  marginLevel < 150
                    ? "text-red-600"
                    : marginLevel < 200
                      ? "text-yellow-600"
                      : "text-green-600"
                }`}
              >
                {marginLevel.toFixed(1)}%
              </span>
            </div>
            {/* Margin Level Progress */}
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    marginLevel < 100
                      ? "bg-red-500"
                      : marginLevel < 150
                        ? "bg-yellow-500"
                        : marginLevel < 200
                          ? "bg-orange-500"
                          : "bg-green-500"
                  }`}
                  style={{ width: `${Math.min(marginLevel, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Account Details */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Account Details</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Account ID</span>
              <span className="font-medium text-gray-900">{account.accountId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">User ID</span>
              <span className="font-medium text-gray-900">{account.userId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Currency</span>
              <span className="font-medium text-gray-900">{account.currency}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Group</span>
              <span className="font-medium text-gray-900">{account.group || "N/A"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Created</span>
              <span className="font-medium text-gray-900">
                {new Date(account.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Last Trade</span>
              <span className="font-medium text-gray-900">
                {account.lastTradeAt
                  ? new Date(account.lastTradeAt).toLocaleDateString()
                  : "Never"}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t">
          <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
            Edit Account
          </button>
          <button className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">
            Freeze Account
          </button>
        </div>
      </div>
    </Drawer>
  );
}
