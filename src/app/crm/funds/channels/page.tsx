"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Diamond,
  CreditCard,
  Landmark,
  Wallet,
  Settings,
  Power,
  PowerOff,
  Wrench,
  Globe,
  DollarSign,
  Percent,
  CheckCircle,
  X,
} from "lucide-react";
import { Card, PageHeader, Button, StatusBadge } from "@/components/crm/ui";
import { EnhancedDataTable, type Column, type RowAction } from "@/components/crm/ui";
import { Breadcrumb } from "@/components/crm/layout";

// Types
interface PaymentChannel {
  id: string;
  name: string;
  type: "crypto" | "card" | "bank" | "ewallet";
  status: "active" | "inactive" | "maintenance";
  feeType: "percentage" | "fixed";
  feeValue: number;
  minAmount: number;
  maxAmount: number;
  currencies: string[];
  processingTime: string;
  region: string;
  provider?: string;
  dailyLimit?: number;
  monthlyLimit?: number;
}

// Mock data
const mockChannels: PaymentChannel[] = [
  {
    id: "CH001",
    name: "USDT-TRC20",
    type: "crypto",
    status: "active",
    feeType: "percentage",
    feeValue: 0,
    minAmount: 10,
    maxAmount: 100000,
    currencies: ["USDT"],
    processingTime: "即时到账",
    region: "Global",
    provider: "Tron Network",
    dailyLimit: 500000,
    monthlyLimit: 5000000,
  },
  {
    id: "CH002",
    name: "USDT-ERC20",
    type: "crypto",
    status: "active",
    feeType: "percentage",
    feeValue: 0,
    minAmount: 10,
    maxAmount: 100000,
    currencies: ["USDT"],
    processingTime: "即时到账",
    region: "Global",
    provider: "Ethereum Network",
    dailyLimit: 500000,
    monthlyLimit: 5000000,
  },
  {
    id: "CH003",
    name: "BTC",
    type: "crypto",
    status: "active",
    feeType: "percentage",
    feeValue: 0.5,
    minAmount: 50,
    maxAmount: 50000,
    currencies: ["BTC"],
    processingTime: "约10分钟",
    region: "Global",
    provider: "Bitcoin Network",
    dailyLimit: 200000,
    monthlyLimit: 2000000,
  },
  {
    id: "CH004",
    name: "Visa",
    type: "card",
    status: "active",
    feeType: "percentage",
    feeValue: 2.5,
    minAmount: 10,
    maxAmount: 10000,
    currencies: ["USD", "EUR"],
    processingTime: "即时到账",
    region: "Global",
    provider: "Stripe",
    dailyLimit: 50000,
    monthlyLimit: 500000,
  },
  {
    id: "CH005",
    name: "Mastercard",
    type: "card",
    status: "active",
    feeType: "percentage",
    feeValue: 2.5,
    minAmount: 10,
    maxAmount: 10000,
    currencies: ["USD", "EUR"],
    processingTime: "即时到账",
    region: "Global",
    provider: "Stripe",
    dailyLimit: 50000,
    monthlyLimit: 500000,
  },
  {
    id: "CH006",
    name: "SWIFT",
    type: "bank",
    status: "active",
    feeType: "fixed",
    feeValue: 25,
    minAmount: 500,
    maxAmount: 100000,
    currencies: ["USD", "EUR", "JPY"],
    processingTime: "1-3个工作日",
    region: "Global",
    provider: "Standard Chartered",
    dailyLimit: 500000,
    monthlyLimit: 5000000,
  },
  {
    id: "CH007",
    name: "SEPA",
    type: "bank",
    status: "maintenance",
    feeType: "fixed",
    feeValue: 15,
    minAmount: 100,
    maxAmount: 50000,
    currencies: ["EUR"],
    processingTime: "1-2个工作日",
    region: "EU",
    provider: "Deutsche Bank",
    dailyLimit: 200000,
    monthlyLimit: 2000000,
  },
  {
    id: "CH008",
    name: "PayPal",
    type: "ewallet",
    status: "active",
    feeType: "percentage",
    feeValue: 1.5,
    minAmount: 10,
    maxAmount: 5000,
    currencies: ["USD", "EUR", "JPY"],
    processingTime: "即时到账",
    region: "Global",
    provider: "PayPal Inc.",
    dailyLimit: 25000,
    monthlyLimit: 250000,
  },
  {
    id: "CH009",
    name: "Skrill",
    type: "ewallet",
    status: "inactive",
    feeType: "percentage",
    feeValue: 1.5,
    minAmount: 10,
    maxAmount: 5000,
    currencies: ["USD", "EUR", "JPY"],
    processingTime: "即时到账",
    region: "Global",
    provider: "Skrill Ltd.",
    dailyLimit: 25000,
    monthlyLimit: 250000,
  },
  {
    id: "CH010",
    name: "ETH",
    type: "crypto",
    status: "active",
    feeType: "percentage",
    feeValue: 0.5,
    minAmount: 50,
    maxAmount: 50000,
    currencies: ["ETH"],
    processingTime: "约5分钟",
    region: "Global",
    provider: "Ethereum Network",
    dailyLimit: 200000,
    monthlyLimit: 2000000,
  },
];

const typeIcons = {
  crypto: Diamond,
  card: CreditCard,
  bank: Landmark,
  ewallet: Wallet,
};

const typeLabels: Record<string, string> = {
  crypto: "加密货币",
  card: "银行卡",
  bank: "银行转账",
  ewallet: "电子钱包",
};

export default function PaymentChannelsPage() {
  const [channels, setChannels] = useState<PaymentChannel[]>(mockChannels);
  const [editingChannel, setEditingChannel] = useState<PaymentChannel | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const stats = useMemo(() => {
    return {
      total: channels.length,
      active: channels.filter((c) => c.status === "active").length,
      inactive: channels.filter((c) => c.status === "inactive").length,
      maintenance: channels.filter((c) => c.status === "maintenance").length,
    };
  }, [channels]);

  const handleToggleStatus = (channel: PaymentChannel) => {
    setChannels((prev) =>
      prev.map((c) =>
        c.id === channel.id
          ? {
              ...c,
              status: c.status === "active" ? "inactive" : "active" as "active" | "inactive" | "maintenance",
            }
          : c
      )
    );
  };

  const handleSetMaintenance = (channel: PaymentChannel) => {
    setChannels((prev) =>
      prev.map((c) =>
        c.id === channel.id ? { ...c, status: "maintenance" as const } : c
      )
    );
  };

  const handleSave = (updated: PaymentChannel) => {
    setChannels((prev) => {
      const exists = prev.find((c) => c.id === updated.id);
      if (exists) {
        return prev.map((c) => (c.id === updated.id ? updated : c));
      }
      return [...prev, updated];
    });
    setEditingChannel(null);
    setIsCreating(false);
  };

  const columns: Column<PaymentChannel>[] = [
    {
      key: "name",
      title: "渠道名称",
      render: (row) => {
        const Icon = typeIcons[row.type];
        return (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
              <Icon className="w-4 h-4 text-slate-600" />
            </div>
            <div>
              <p className="text-sm font-medium">{row.name}</p>
              <p className="text-xs text-slate-500">{typeLabels[row.type]}</p>
            </div>
          </div>
        );
      },
    },
    {
      key: "status",
      title: "状态",
      width: "100px",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "fee",
      title: "费率",
      width: "120px",
      render: (row) => (
        <span className="text-sm font-medium">
          {row.feeValue === 0
            ? "免费"
            : row.feeType === "percentage"
              ? `${row.feeValue}%`
              : `$${row.feeValue}`}
        </span>
      ),
    },
    {
      key: "limits",
      title: "限额",
      width: "180px",
      render: (row) => (
        <div className="text-sm">
          <p className="text-slate-700">
            ${row.minAmount.toLocaleString()} - ${row.maxAmount.toLocaleString()}
          </p>
          {row.dailyLimit && (
            <p className="text-xs text-slate-400">
              日限 ${row.dailyLimit.toLocaleString()}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "currencies",
      title: "支持币种",
      width: "140px",
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.currencies.map((c) => (
            <span
              key={c}
              className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-xs rounded font-medium"
            >
              {c}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: "processingTime",
      title: "处理时间",
      width: "120px",
      render: (row) => <span className="text-sm text-slate-600">{row.processingTime}</span>,
    },
    {
      key: "provider",
      title: "提供商",
      width: "140px",
      render: (row) => <span className="text-sm text-slate-500">{row.provider || "-"}</span>,
    },
  ];

  const rowActions: RowAction<PaymentChannel>[] = [
    {
      label: "编辑",
      icon: <Settings className="w-4 h-4" />,
      onClick: (row) => setEditingChannel(row),
    },
    {
      label: "启用",
      icon: <Power className="w-4 h-4" />,
      onClick: (row) => handleToggleStatus(row),
      disabled: (row) => row.status === "active" || row.status === "maintenance",
    },
    {
      label: "禁用",
      icon: <PowerOff className="w-4 h-4" />,
      onClick: (row) => handleToggleStatus(row),
      disabled: (row) => row.status === "inactive",
      variant: "danger",
    },
    {
      label: "维护模式",
      icon: <Wrench className="w-4 h-4" />,
      onClick: (row) => handleSetMaintenance(row),
      disabled: (row) => row.status === "maintenance",
    },
  ];

  const emptyChannel: PaymentChannel = {
    id: `CH${String(channels.length + 1).padStart(3, "0")}`,
    name: "",
    type: "crypto",
    status: "inactive",
    feeType: "percentage",
    feeValue: 0,
    minAmount: 10,
    maxAmount: 10000,
    currencies: ["USD"],
    processingTime: "即时到账",
    region: "Global",
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb items={[{ label: "资金管理" }, { label: "支付渠道" }]} />

      {/* Page Header */}
      <PageHeader
        title="支付渠道"
        description="管理支付渠道配置，包括费率、限额和启用状态"
        actions={
          <Button onClick={() => { setIsCreating(true); setEditingChannel(emptyChannel); }}>
            <Plus className="w-4 h-4" />
            添加渠道
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
              <Globe className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
              <p className="text-sm text-slate-500">总渠道数</p>
            </div>
          </div>
        </Card>
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-600">{stats.active}</p>
              <p className="text-sm text-slate-500">已启用</p>
            </div>
          </div>
        </Card>
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
              <PowerOff className="w-5 h-5 text-slate-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-600">{stats.inactive}</p>
              <p className="text-sm text-slate-500">已禁用</p>
            </div>
          </div>
        </Card>
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <Wrench className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-600">{stats.maintenance}</p>
              <p className="text-sm text-slate-500">维护中</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Data Table */}
      <EnhancedDataTable
        columns={columns}
        data={channels}
        keyExtractor={(row) => row.id}
        searchable
        searchKeys={["name", "provider", "region"]}
        searchPlaceholder="搜索渠道名称、提供商..."
        pagination
        pageSize={10}
        rowActions={rowActions}
        emptyText="暂无支付渠道"
        emptyIcon={<Globe className="w-12 h-12" />}
      />

      {/* Edit Drawer */}
      <AnimatePresence>
        {(editingChannel || isCreating) && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setEditingChannel(null); setIsCreating(false); }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 h-full w-full max-w-lg bg-white dark:bg-slate-800 shadow-2xl z-50 flex flex-col"
            >
              <ChannelEditForm
                channel={editingChannel || emptyChannel}
                isCreating={isCreating}
                onSave={handleSave}
                onCancel={() => { setEditingChannel(null); setIsCreating(false); }}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// Channel Edit Form Component
function ChannelEditForm({
  channel,
  isCreating,
  onSave,
  onCancel,
}: {
  channel: PaymentChannel;
  isCreating: boolean;
  onSave: (ch: PaymentChannel) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<PaymentChannel>({ ...channel });

  const updateField = <K extends keyof PaymentChannel>(key: K, value: PaymentChannel[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          {isCreating ? "添加支付渠道" : "编辑支付渠道"}
        </h2>
        <button onClick={onCancel} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
          <X className="w-5 h-5 text-slate-400" />
        </button>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">渠道名称</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
            className="w-full h-10 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:border-blue-300"
            placeholder="例如：USDT-TRC20"
          />
        </div>

        {/* Type & Status */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">类型</label>
            <select
              value={form.type}
              onChange={(e) => updateField("type", e.target.value as PaymentChannel["type"])}
              className="w-full h-10 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:border-blue-300"
            >
              <option value="crypto">加密货币</option>
              <option value="card">银行卡</option>
              <option value="bank">银行转账</option>
              <option value="ewallet">电子钱包</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">状态</label>
            <select
              value={form.status}
              onChange={(e) => updateField("status", e.target.value as PaymentChannel["status"])}
              className="w-full h-10 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:border-blue-300"
            >
              <option value="active">启用</option>
              <option value="inactive">禁用</option>
              <option value="maintenance">维护</option>
            </select>
          </div>
        </div>

        {/* Fee */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">费率类型</label>
            <select
              value={form.feeType}
              onChange={(e) => updateField("feeType", e.target.value as PaymentChannel["feeType"])}
              className="w-full h-10 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:border-blue-300"
            >
              <option value="percentage">百分比</option>
              <option value="fixed">固定金额</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">费率</label>
            <div className="relative">
              <input
                type="number"
                step={form.feeType === "percentage" ? 0.01 : 1}
                value={form.feeValue}
                onChange={(e) => updateField("feeValue", parseFloat(e.target.value) || 0)}
                className="w-full h-10 pl-3 pr-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:border-blue-300"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                {form.feeType === "percentage" ? "%" : "$"}
              </span>
            </div>
          </div>
        </div>

        {/* Limits */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">单笔限额</label>
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
              <input
                type="number"
                value={form.minAmount}
                onChange={(e) => updateField("minAmount", parseFloat(e.target.value) || 0)}
                className="w-full h-10 pl-7 pr-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:border-blue-300"
                placeholder="最小金额"
              />
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
              <input
                type="number"
                value={form.maxAmount}
                onChange={(e) => updateField("maxAmount", parseFloat(e.target.value) || 0)}
                className="w-full h-10 pl-7 pr-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:border-blue-300"
                placeholder="最大金额"
              />
            </div>
          </div>
        </div>

        {/* Daily/Monthly Limits */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">日限额</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
              <input
                type="number"
                value={form.dailyLimit || ""}
                onChange={(e) => updateField("dailyLimit", e.target.value ? parseFloat(e.target.value) : undefined)}
                className="w-full h-10 pl-7 pr-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:border-blue-300"
                placeholder="可选"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">月限额</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
              <input
                type="number"
                value={form.monthlyLimit || ""}
                onChange={(e) => updateField("monthlyLimit", e.target.value ? parseFloat(e.target.value) : undefined)}
                className="w-full h-10 pl-7 pr-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:border-blue-300"
                placeholder="可选"
              />
            </div>
          </div>
        </div>

        {/* Currencies */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">支持币种（逗号分隔）</label>
          <input
            type="text"
            value={form.currencies.join(", ")}
            onChange={(e) => updateField("currencies", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
            className="w-full h-10 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:border-blue-300"
            placeholder="USD, EUR, JPY"
          />
        </div>

        {/* Processing Time & Provider */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">处理时间</label>
            <input
              type="text"
              value={form.processingTime}
              onChange={(e) => updateField("processingTime", e.target.value)}
              className="w-full h-10 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:border-blue-300"
              placeholder="即时到账"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">提供商</label>
            <input
              type="text"
              value={form.provider || ""}
              onChange={(e) => updateField("provider", e.target.value || undefined)}
              className="w-full h-10 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:border-blue-300"
              placeholder="提供商名称"
            />
          </div>
        </div>

        {/* Region */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">适用地区</label>
          <input
            type="text"
            value={form.region}
            onChange={(e) => updateField("region", e.target.value)}
            className="w-full h-10 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:border-blue-300"
            placeholder="Global"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
        <Button className="flex-1" onClick={() => onSave(form)}>
          <CheckCircle className="w-4 h-4" />
          保存
        </Button>
        <Button variant="secondary" className="flex-1" onClick={onCancel}>
          取消
        </Button>
      </div>
    </>
  );
}
