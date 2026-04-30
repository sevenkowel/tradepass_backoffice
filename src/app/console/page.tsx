"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Building2, Package, CreditCard, Plus, Loader2, ArrowUpRight } from "lucide-react";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: string;
  createdAt: string;
}

export default function ConsoleDashboard() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  useEffect(() => {
    fetch("/api/console/tenants")
      .then((r) => r.json())
      .then((data) => {
        const list = data.tenants || [];
        setTenants(list);
        setLoading(false);

        // 没有租户 → 引导创建
        if (list.length === 0) {
          router.replace("/console/tenants/new");
        }
      });
  }, []);

  return (
    <div className="space-y-6 w-full">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">仪表盘</h1>
          <p className="text-sm text-slate-500 mt-1">管理您的租户和产品订阅</p>
        </div>
        <Link href="/console/tenants/new">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="w-4 h-4 mr-2" /> 创建租户
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-slate-200/60 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">租户数量</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{tenants.length}</p>
              </div>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <Building2 className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/60 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">已订阅产品</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">0</p>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <Package className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/60 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">待支付账单</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">0</p>
              </div>
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <CreditCard className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tenants Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">我的租户</h2>
          <Link
            href="/console/tenants"
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            查看全部 <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400 mr-2" />
            <span className="text-sm text-slate-500">加载中...</span>
          </div>
        ) : tenants.length === 0 ? (
          <Card className="border-slate-200/60">
            <EmptyState
              title="暂无租户"
              description="您还没有创建任何租户，创建后即可订阅产品和管理业务。"
              action={
                <Link href="/console/tenants/new">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Plus className="w-4 h-4 mr-2" /> 创建租户
                  </Button>
                </Link>
              }
            />
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tenants.map((t) => (
              <Link key={t.id} href={`/console/tenants/${t.id}`}>
                <Card className="border-slate-200/60 shadow-sm hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                          {t.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {t.name}
                          </h3>
                          <p className="text-sm text-slate-500">{t.slug}</p>
                        </div>
                      </div>
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                          t.status === "active"
                            ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                            : t.status === "trial"
                            ? "bg-blue-50 text-blue-600 border border-blue-200"
                            : "bg-slate-100 text-slate-600 border border-slate-200"
                        }`}
                      >
                        {t.status === "active" ? "运行中" : t.status === "trial" ? "试用中" : t.status}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
