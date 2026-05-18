"use client";

import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Plus } from "lucide-react";
import { PageHeader, Button, StatusBadge } from "@/components/crm/ui";
import { EnhancedDataTable } from "@/components/crm/ui/EnhancedDataTable";
import { FilterBar } from "@/components/crm/ui/FilterBar";
// import { AccountDetailDrawer } from "@/components/crm/users/AccountDetailDrawer";
import { MTAccount } from "@/types/backoffice/account";
import type { StatusType } from "@/types/backoffice";

const statusColors: Record<string, StatusType> = {
  active: "success",
  frozen: "warning",
  closed: "default",
};

export default function AccountsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedAccount, setSelectedAccount] = useState<MTAccount | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [accounts, setAccounts] = useState<MTAccount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/backoffice/accounts")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setAccounts(data.items);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredAccounts = accounts.filter((account) => {
    const matchesSearch =
      account.accountId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.userId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || account.status === statusFilter;
    const matchesType = typeFilter === "all" || account.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const columns = [
    {
      key: "accountId",
      title: "Account ID",
      render: (row: MTAccount) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <span className="text-xs font-bold text-blue-600">
              {row.type.toUpperCase()}
            </span>
          </div>
          <div>
            <div className="font-medium text-gray-900">{row.accountId}</div>
            <div className="text-xs text-gray-500">{row.group || "No Group"}</div>
          </div>
        </div>
      ),
    },
    {
      key: "username",
      title: "Username",
      render: (row: MTAccount) => (
        <div>
          <div className="font-medium text-gray-900">{row.username}</div>
          <div className="text-xs text-gray-500">ID: {row.userId}</div>
        </div>
      ),
    },
    {
      key: "balance",
      title: "Balance",
      render: (row: MTAccount) => (
        <div>
          <div className="font-medium text-gray-900">
            ${row.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-gray-500">
            Equity: ${row.equity.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
        </div>
      ),
    },
    {
      key: "equity",
      title: "Equity / Margin",
      render: (row: MTAccount) => {
        const profit = row.equity - row.balance;
        const isProfit = profit >= 0;
        return (
          <div>
            <div className="flex items-center gap-1">
              {isProfit ? (
                <TrendingUp className="w-3 h-3 text-green-600" />
              ) : (
                <TrendingDown className="w-3 h-3 text-red-600" />
              )}
              <span
                className={`font-medium ${isProfit ? "text-green-600" : "text-red-600"}`}
              >
                {isProfit ? "+" : ""}
                {profit.toLocaleString("en-US", {
                  style: "currency",
                  currency: "USD",
                })}
              </span>
            </div>
            <div className="text-xs text-gray-500">
              Margin: ${row.margin.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
          </div>
        );
      },
    },
    {
      key: "leverage",
      title: "Leverage",
      render: (row: MTAccount) => (
        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-orange-100 text-orange-700">
          1:{row.leverage}
        </span>
      ),
    },
    {
      key: "status",
      title: "Status",
      render: (row: MTAccount) => (
        <StatusBadge status={row.status} type={statusColors[row.status]} />
      ),
    },
    {
      key: "lastTrade",
      title: "Last Trade",
      render: (row: MTAccount) =>
        row.lastTradeAt ? (
          <div className="text-sm text-gray-600">
            {new Date(row.lastTradeAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        ) : (
          <span className="text-gray-400">Never</span>
        ),
    },
  ];

  const handleViewDetail = (account: MTAccount) => {
    setSelectedAccount(account);
    setDrawerOpen(true);
  };

  const statsCards = [
    {
      label: "Total Accounts",
      value: accounts.length.toString(),
      change: "+0",
      changeType: "positive" as const,
    },
    {
      label: "Active Accounts",
      value: accounts.filter((a) => a.status === "active").length.toString(),
      change: "+0",
      changeType: "positive" as const,
    },
    {
      label: "Total Equity",
      value: `$${accounts.reduce((sum, a) => sum + a.equity, 0).toLocaleString("en-US", { maximumFractionDigits: 0 })}`,
      change: "+0%",
      changeType: "positive" as const,
    },
    {
      label: "Total Margin Used",
      value: `$${accounts.reduce((sum, a) => sum + a.margin, 0).toLocaleString("en-US", { maximumFractionDigits: 0 })}`,
      change: "+0%",
      changeType: "neutral" as const,
    },
  ];

  return (
    <div className="p-6">
      <PageHeader
        title="MT Accounts"
        description="Manage MetaTrader 4/5 trading accounts"
        actions={
          <>
            <Button
              onClick={() => {}}
              variant="primary"
            >
              <Plus className="w-4 h-4 mr-1" />
              Create Account
            </Button>
          </>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {statsCards.map((card) => (
          <div
            key={card.label}
            className="bg-white border border-gray-200 rounded-xl p-4"
          >
            <div className="text-sm text-gray-500 mb-1">{card.label}</div>
            <div className="text-2xl font-semibold text-gray-900">
              {card.value}
            </div>
            <div
              className={`text-xs mt-1 ${
                card.changeType === "positive"
                  ? "text-green-600"
                  : "text-gray-500"
              }`}
            >
              {card.change} from last month
            </div>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <FilterBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search accounts..."
        filters={[
          {
            key: "status",
            label: "Status",
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { value: "all", label: "All Status" },
              { value: "active", label: "Active" },
              { value: "frozen", label: "Frozen" },
              { value: "closed", label: "Closed" },
            ],
          },
          {
            key: "type",
            label: "Platform",
            value: typeFilter,
            onChange: setTypeFilter,
            options: [
              { value: "all", label: "All Platforms" },
              { value: "mt4", label: "MT4" },
              { value: "mt5", label: "MT5" },
            ],
          },
        ]}
        onRefresh={() => {}}
      />

      {/* Data Table */}
      <EnhancedDataTable<MTAccount>
        columns={columns}
        data={filteredAccounts}
        keyExtractor={(row) => row.id}
        onRowClick={handleViewDetail}
        emptyText="No accounts found"
      />

      {/* Detail Drawer - TODO: Implement AccountDetailDrawer */}
      {/* <AccountDetailDrawer
        account={selectedAccount}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      /> */}
    </div>
  );
}
