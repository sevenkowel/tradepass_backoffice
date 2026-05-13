"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import {
  Tag,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Loader2,
  Percent,
  DollarSign,
  Calendar,
} from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";

interface PromoCodeItem {
  id: string;
  code: string;
  description?: string;
  discountType: string;
  discountValue: number;
  maxUses: number;
  usedCount: number;
  validFrom: string;
  validUntil: string | null;
  applicablePlans: string[];
  applicableModules: string[];
  minAmount?: number;
  currency: string;
  isActive: boolean;
  createdAt: string;
}

export default function PromoManagementPage() {
  const [promos, setPromos] = useState<PromoCodeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    description: "",
    discountType: "percentage",
    discountValue: 10,
    maxUses: 100,
    validFrom: new Date().toISOString().slice(0, 10),
    validUntil: "",
    minAmount: "",
    currency: "USD",
  });

  useEffect(() => {
    fetchPromos();
  }, []);

  async function fetchPromos() {
    setLoading(true);
    const res = await fetch("/api/admin/promo");
    const data = await res.json();
    setPromos(data.promos || []);
    setLoading(false);
  }

  async function createPromo() {
    setCreating(true);
    const res = await fetch("/api/admin/promo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...formData,
        discountValue: Number(formData.discountValue),
        maxUses: Number(formData.maxUses),
        minAmount: formData.minAmount ? Number(formData.minAmount) : undefined,
      }),
    });

    if (res.ok) {
      setShowForm(false);
      setFormData({
        code: "",
        description: "",
        discountType: "percentage",
        discountValue: 10,
        maxUses: 100,
        validFrom: new Date().toISOString().slice(0, 10),
        validUntil: "",
        minAmount: "",
        currency: "USD",
      });
      await fetchPromos();
    }
    setCreating(false);
  }

  async function togglePromo(id: string, isActive: boolean) {
    await fetch(`/api/admin/promo/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    await fetchPromos();
  }

  async function deletePromo(id: string) {
    if (!confirm("确认删除此优惠码？")) return;
    await fetch(`/api/admin/promo/${id}`, { method: "DELETE" });
    await fetchPromos();
  }

  function getDiscountLabel(type: string, value: number) {
    switch (type) {
      case "percentage":
        return `${value}% 折扣`;
      case "fixed_amount":
        return `$${value} 减免`;
      case "free_months":
        return `${value} 个月免费`;
      default:
        return `${value}`;
    }
  }

  function getTypeIcon(type: string) {
    switch (type) {
      case "percentage":
        return <Percent className="w-3.5 h-3.5" />;
      case "fixed_amount":
        return <DollarSign className="w-3.5 h-3.5" />;
      default:
        return <Calendar className="w-3.5 h-3.5" />;
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[rgb(var(--tp-fg-rgb))]">优惠码管理</h1>
          <p className="text-sm text-[rgba(var(--tp-fg-rgb),0.6)] mt-1">创建和管理促销活动优惠码</p>
        </div>
        <Button variant="default" onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-1.5" />
          {showForm ? "取消" : "创建优惠码"}
        </Button>
      </div>

      {/* Create Form */}
      {showForm && (
        <Card className="mb-6">
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold mb-4 text-[rgb(var(--tp-fg-rgb))]">新建优惠码</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-[rgba(var(--tp-fg-rgb),0.5)] mb-1 block">优惠码 *</label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="SUMMER2025"
                />
              </div>
              <div>
                <label className="text-xs text-[rgba(var(--tp-fg-rgb),0.5)] mb-1 block">描述</label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="夏季促销活动"
                />
              </div>
              <div>
                <label className="text-xs text-[rgba(var(--tp-fg-rgb),0.5)] mb-1 block">折扣类型</label>
                <select
                  value={formData.discountType}
                  onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                  className="w-full h-10 px-3 rounded-md border border-[var(--tp-border)] bg-[var(--tp-surface)] text-sm text-[rgb(var(--tp-fg-rgb))]"
                >
                  <option value="percentage">百分比折扣 (%)</option>
                  <option value="fixed_amount">固定金额减免 ($)</option>
                  <option value="free_months">免费月数</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-[rgba(var(--tp-fg-rgb),0.5)] mb-1 block">折扣值 *</label>
                <Input
                  type="number"
                  value={formData.discountValue}
                  onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-xs text-[rgba(var(--tp-fg-rgb),0.5)] mb-1 block">最大使用次数</label>
                <Input
                  type="number"
                  value={formData.maxUses}
                  onChange={(e) => setFormData({ ...formData, maxUses: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-xs text-[rgba(var(--tp-fg-rgb),0.5)] mb-1 block">有效期至</label>
                <Input
                  type="date"
                  value={formData.validUntil}
                  onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-[rgba(var(--tp-fg-rgb),0.5)] mb-1 block">最低消费金额</label>
                <Input
                  type="number"
                  value={formData.minAmount}
                  onChange={(e) => setFormData({ ...formData, minAmount: e.target.value })}
                  placeholder="可选"
                />
              </div>
              <div>
                <label className="text-xs text-[rgba(var(--tp-fg-rgb),0.5)] mb-1 block">货币</label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full h-10 px-3 rounded-md border border-[var(--tp-border)] bg-[var(--tp-surface)] text-sm text-[rgb(var(--tp-fg-rgb))]"
                >
                  <option value="USD">USD</option>
                  <option value="CNY">CNY</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                取消
              </Button>
              <Button variant="default" size="sm" onClick={createPromo} disabled={creating}>
                {creating ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
                创建
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Promo List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-[rgb(var(--tp-accent-rgb))]" />
        </div>
      ) : promos.length === 0 ? (
        <EmptyState
          icon={<Tag className="w-8 h-8" />}
          title="暂无优惠码"
          description="点击上方按钮创建第一个优惠码"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {promos.map((promo) => (
            <Card key={promo.id} className={cn("overflow-hidden", !promo.isActive && "opacity-60")}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[rgba(var(--tp-accent-rgb),0.1)] flex items-center justify-center">
                      {getTypeIcon(promo.discountType)}
                    </div>
                    <div>
                      <h3 className="font-bold text-[rgb(var(--tp-fg-rgb))] text-sm">{promo.code}</h3>
                      {promo.description && (
                        <p className="text-xs text-[rgba(var(--tp-fg-rgb),0.5)]">{promo.description}</p>
                      )}
                    </div>
                  </div>
                  <span
                    className={cn(
                      "text-xs px-2 py-0.5 rounded-full font-medium",
                      promo.isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
                    )}
                  >
                    {promo.isActive ? "生效中" : "已停用"}
                  </span>
                </div>

                <div className="space-y-1.5 mb-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-[rgba(var(--tp-fg-rgb),0.5)]">折扣</span>
                    <span className="font-medium text-[rgb(var(--tp-fg-rgb))]">
                      {getDiscountLabel(promo.discountType, promo.discountValue)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[rgba(var(--tp-fg-rgb),0.5)]">使用</span>
                    <span className="text-[rgb(var(--tp-fg-rgb))]">
                      {promo.usedCount} / {promo.maxUses || "∞"}
                    </span>
                  </div>
                  {promo.validUntil && (
                    <div className="flex justify-between text-sm">
                      <span className="text-[rgba(var(--tp-fg-rgb),0.5)]">有效期</span>
                      <span className="text-[rgb(var(--tp-fg-rgb))]">
                        {new Date(promo.validUntil).toLocaleDateString("zh-CN")}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-[var(--tp-border)]">
                  <button
                    onClick={() => togglePromo(promo.id, promo.isActive)}
                    className="flex items-center gap-1 text-xs text-[rgba(var(--tp-fg-rgb),0.6)] hover:text-[rgb(var(--tp-accent-rgb))] transition-colors"
                  >
                    {promo.isActive ? (
                      <ToggleRight className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <ToggleLeft className="w-4 h-4 text-gray-400" />
                    )}
                    {promo.isActive ? "停用" : "启用"}
                  </button>
                  <button
                    onClick={() => deletePromo(promo.id)}
                    className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600 transition-colors ml-auto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    删除
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
