"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Building2,
  Globe,
  ExternalLink,
  Users,
  Package,
  Settings,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { OverviewCard } from "@/components/console/tenant/OverviewCard";
import { SubscriptionsPanel } from "@/components/console/tenant/SubscriptionsPanel";
import { MembersPanel } from "@/components/console/tenant/MembersPanel";
import { ConfigPanel } from "@/components/console/tenant/ConfigPanel";

interface TenantDetail {
  id: string;
  name: string;
  slug: string;
  subdomain: string;
  status: string;
  plan: string;
  createdAt: string;
  brand: {
    brandName: string;
    logoUrl: string | null;
    primaryColor: string;
  };
  stats: {
    members: number;
    subscriptions: number;
  };
  subscriptions: Array<{
    id: string;
    productCode: string;
    productName: string;
    plan: string;
    status: string;
    startsAt: string;
    endsAt: string | null;
    autoRenew: boolean;
  }>;
}

export default function TenantDetailPage() {
  const params = useParams();
  const tenantId = params.id as string;

  const [tenant, setTenant] = useState<TenantDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tenantId) return;

    fetch(`/api/console/tenants/${tenantId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setTenant(data.tenant);
        } else {
          setError(data.error || "加载失败");
        }
        setLoading(false);
      })
      .catch(() => {
        setError("网络错误");
        setLoading(false);
      });
  }, [tenantId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400 mr-2" />
        <span className="text-sm text-slate-500">加载中...</span>
      </div>
    );
  }

  if (error || !tenant) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-500">
        <AlertCircle className="w-8 h-8 mb-2" />
        <p>{error || "租户不存在"}</p>
        <Link href="/console/tenants" className="mt-4">
          <Button variant="outline">返回租户列表</Button>
        </Link>
      </div>
    );
  }

  // 构建业务系统链接（纯路径路由格式）
  const brokerUrl = `/broker?t=${tenant.id}`;
  const portalUrl = `/portal?t=${tenant.id}`;
  const crmUrl = `/crm?t=${tenant.id}`;

  return (
    <div className="space-y-6 w-full">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/console" className="hover:text-blue-600 transition-colors">仪表盘</Link>
        <span>/</span>
        <Link href="/console/tenants" className="hover:text-blue-600 transition-colors">租户管理</Link>
        <span>/</span>
        <span className="text-slate-900 font-medium">{tenant.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
          {tenant.name.slice(0, 2).toUpperCase()}
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900">{tenant.name}</h1>
          <p className="text-sm text-slate-500">{tenant.slug} · {tenant.subdomain}</p>
        </div>
        <span
          className={`text-xs px-3 py-1.5 rounded-full font-medium border ${
            tenant.status === "active"
              ? "bg-emerald-50 text-emerald-600 border-emerald-200"
              : tenant.status === "trial"
              ? "bg-blue-50 text-blue-600 border-blue-200"
              : "bg-slate-100 text-slate-600 border-slate-200"
          }`}
        >
          {tenant.status === "active" ? "运行中" : tenant.status === "trial" ? "试用中" : tenant.status}
        </span>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Business System Links */}
        <Card className="border-slate-200/60 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <Globe className="w-4 h-4" /> 业务系统入口
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link
              href={brokerUrl}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-blue-50 hover:text-blue-600 transition-all group"
            >
              <span className="text-sm font-medium">Broker 交易端</span>
              <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
            </Link>
            <Link
              href={portalUrl}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-blue-50 hover:text-blue-600 transition-all group"
            >
              <span className="text-sm font-medium">Portal 用户门户</span>
              <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
            </Link>
            <Link
              href={crmUrl}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-blue-50 hover:text-blue-600 transition-all group"
            >
              <span className="text-sm font-medium">CRM 运营后台</span>
              <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
            </Link>
          </CardContent>
        </Card>

        {/* Subscription Status */}
        <Card className="border-slate-200/60 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <Package className="w-4 h-4" /> 订阅状态
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">当前套餐</span>
                <span className="font-medium text-slate-900">{tenant.plan || "未订阅"}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">产品数量</span>
                <span className="font-medium text-slate-900">{tenant.stats.subscriptions} 个</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">创建时间</span>
                <span className="font-medium text-slate-900">{new Date(tenant.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card className="border-slate-200/60 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <Building2 className="w-4 h-4" /> 快速统计
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-slate-50 rounded-xl">
                <div className="text-2xl font-bold text-slate-900">{tenant.stats.members}</div>
                <div className="text-xs text-slate-500 mt-1">成员</div>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-xl">
                <div className="text-2xl font-bold text-slate-900">{tenant.stats.subscriptions}</div>
                <div className="text-xs text-slate-500 mt-1">产品</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="subscriptions" className="w-full">
        <TabsList className="bg-slate-100/80 p-1 rounded-xl">
          <TabsTrigger
            value="subscriptions"
            className="flex items-center gap-2 px-4 py-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600"
          >
            <Package className="w-4 h-4" /> 产品订阅
          </TabsTrigger>
          <TabsTrigger
            value="members"
            className="flex items-center gap-2 px-4 py-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600"
          >
            <Users className="w-4 h-4" /> 成员管理
          </TabsTrigger>
          <TabsTrigger
            value="config"
            className="flex items-center gap-2 px-4 py-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600"
          >
            <Settings className="w-4 h-4" /> 业务配置
          </TabsTrigger>
        </TabsList>

        <TabsContent value="subscriptions" className="mt-6">
          <SubscriptionsPanel tenantId={tenantId} subscriptions={tenant.subscriptions} />
        </TabsContent>

        <TabsContent value="members" className="mt-6">
          <MembersPanel tenantId={tenantId} />
        </TabsContent>

        <TabsContent value="config" className="mt-6">
          <ConfigPanel tenantId={tenantId} subdomain={tenant.subdomain} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
