"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Globe,
  Loader2,
  AlertCircle,
} from "lucide-react";
import {
  Button,
  PageHeader,
  Card,
  EmptyState,
  FilterBar,
  EnhancedDataTable,
  type Column,
  type RowAction,
} from "@/components/crm/ui";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Input,
  Label,
  useToast,
} from "@/components/ui";
import { useSecurityStore } from "@/store/crm/securityStore";
import type { IpRule } from "@/types/backoffice/security";

export default function IpRestrictionPage() {
  const { toast } = useToast();
  const { ipRules, isLoadingRules, isSubmitting, fetchIpRules, createIpRule, deleteIpRule } = useSecurityStore();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<IpRule | null>(null);
  const [filterType, setFilterType] = useState<"all" | "whitelist" | "blacklist">("all");

  // Form state
  const [formData, setFormData] = useState({
    type: "blacklist" as "whitelist" | "blacklist",
    ipRange: "",
    description: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load data
  useEffect(() => {
    fetchIpRules();
  }, [fetchIpRules]);

  // Validate CIDR
  const isValidCIDR = (cidr: string): boolean => {
    const cidrRegex = /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(\/(3[0-2]|[1-2][0-9]|[0-9]))$/;
    const ipRegex = /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return cidrRegex.test(cidr) || ipRegex.test(cidr);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.ipRange.trim()) {
      newErrors.ipRange = "请输入 IP 地址或网段";
    } else if (!isValidCIDR(formData.ipRange)) {
      newErrors.ipRange = "请输入有效的 IP 地址或 CIDR 格式（如 192.168.1.0/24）";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const result = await createIpRule({
      type: formData.type,
      ipRange: formData.ipRange,
      description: formData.description || undefined,
    });

    if (result) {
      toast({
        title: "规则已创建",
        description: `IP ${formData.ipRange} 已添加到${formData.type === "whitelist" ? "白名单" : "黑名单"}`,
      });
      setIsCreateDialogOpen(false);
      setFormData({ type: "blacklist", ipRange: "", description: "" });
    }
  };

  const handleDeleteClick = (rule: IpRule) => {
    setRuleToDelete(rule);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!ruleToDelete) return;

    const success = await deleteIpRule(ruleToDelete.id);
    if (success) {
      toast({
        title: "规则已删除",
        description: `IP 规则 "${ruleToDelete.ipRange}" 已删除`,
      });
      setIsDeleteDialogOpen(false);
      setRuleToDelete(null);
    }
  };

  // Filter rules
  const filteredRules = filterType === "all" ? ipRules : ipRules.filter((r) => r.type === filterType);

  // Table columns
  const columns: Column<IpRule>[] = [
    {
      key: "type",
      title: "类型",
      width: "100px",
      render: (row) =>
        row.type === "whitelist" ? (
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-700">白名单</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-red-600" />
            <span className="text-sm font-medium text-red-700">黑名单</span>
          </div>
        ),
    },
    {
      key: "ipRange",
      title: "IP 地址/网段",
      width: "180px",
      render: (row) => <span className="font-mono text-sm text-slate-700">{row.ipRange}</span>,
    },
    {
      key: "description",
      title: "描述",
      render: (row) => <span className="text-sm text-slate-600">{row.description || "-"}</span>,
    },
    {
      key: "createdBy",
      title: "创建人",
      width: "120px",
      render: (row) => <span className="text-sm text-slate-600">{row.createdBy}</span>,
    },
    {
      key: "createdAt",
      title: "创建时间",
      width: "150px",
      render: (row) => (
        <span className="text-sm text-slate-600">{new Date(row.createdAt).toLocaleDateString("zh-CN")}</span>
      ),
    },
  ];

  // Row actions
  const rowActions: RowAction<IpRule>[] = [
    {
      label: "删除",
      icon: <Trash2 className="w-4 h-4" />,
      onClick: handleDeleteClick,
      variant: "danger",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link href="/crm/system/security" className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900">
        <ArrowLeft className="w-4 h-4 mr-1" />
        返回安全管理
      </Link>

      {/* Page Header */}
      <PageHeader
        title="IP 围栏管理"
        description="配置允许或禁止访问系统的 IP 地址和网段"
        actions={
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="w-4 h-4" />
            添加规则
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-slate-100">
              <Shield className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">总规则数</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{ipRules.length}</p>
            </div>
          </div>
        </Card>
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100">
              <ShieldCheck className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">白名单</p>
              <p className="text-2xl font-bold text-green-600">{ipRules.filter((r) => r.type === "whitelist").length}</p>
            </div>
          </div>
        </Card>
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-100">
              <ShieldAlert className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">黑名单</p>
              <p className="text-2xl font-bold text-red-600">{ipRules.filter((r) => r.type === "blacklist").length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filter Bar */}
      <FilterBar
        filters={[
          {
            key: "type",
            label: "规则类型",
            type: "select",
            options: [
              { label: "全部", value: "all" },
              { label: "白名单", value: "whitelist" },
              { label: "黑名单", value: "blacklist" },
            ],
            value: filterType,
            onChange: (value) => setFilterType(value as "all" | "whitelist" | "blacklist"),
          },
        ]}
        searchable
        searchKeys={["ipRange", "description"]}
        searchPlaceholder="搜索 IP 或描述..."
      />

      {/* Data Table */}
      <Card padding="none">
        {isLoadingRules ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : filteredRules.length === 0 ? (
          <EmptyState
            icon={<Globe className="w-6 h-6" />}
            title="暂无 IP 规则"
            description="点击上方按钮添加第一个 IP 规则"
          />
        ) : (
          <EnhancedDataTable<IpRule>
            columns={columns}
            data={filteredRules}
            keyExtractor={(row) => row.id}
            rowActions={rowActions}
            emptyText="暂无 IP 规则"
          />
        )}
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>添加 IP 规则</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-3 mt-4">
            <div className="space-y-2">
              <Label>规则类型</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="type"
                    value="whitelist"
                    checked={formData.type === "whitelist"}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as "whitelist" })}
                    className="text-blue-600"
                  />
                  <span className="text-sm">白名单（允许）</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="type"
                    value="blacklist"
                    checked={formData.type === "blacklist"}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as "blacklist" })}
                    className="text-blue-600"
                  />
                  <span className="text-sm">黑名单（禁止）</span>
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ipRange">
                IP 地址/网段 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="ipRange"
                value={formData.ipRange}
                onChange={(e) => setFormData({ ...formData, ipRange: e.target.value })}
                placeholder="例如: 192.168.1.0/24 或 10.0.0.1"
                className={errors.ipRange ? "border-red-500" : ""}
              />
              {errors.ipRange && <p className="text-sm text-red-500">{errors.ipRange}</p>}
              <p className="text-xs text-slate-500">支持单个 IP 或 CIDR 格式（如 192.168.1.0/24）</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">描述</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="可选：添加规则说明"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="secondary" onClick={() => setIsCreateDialogOpen(false)}>
                取消
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                创建规则
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              确认删除规则
            </DialogTitle>
            <DialogDescription className="pt-4">
              您确定要删除 IP 规则 <strong>&quot;{ruleToDelete?.ipRange}&quot;</strong> 吗？
              <p className="mt-2 text-sm text-slate-500">此操作不可撤销。</p>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="secondary" onClick={() => setIsDeleteDialogOpen(false)} disabled={isSubmitting}>
              取消
            </Button>
            <Button variant="danger" onClick={confirmDelete} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              确认删除
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
