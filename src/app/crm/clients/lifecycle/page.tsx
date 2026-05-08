"use client";

import { useState, useEffect } from "react";
import { Users, PieChart, TrendingUp, UserX, Clock } from "lucide-react";
import { Card, PageHeader } from "@/components/crm/ui";
import { Breadcrumb } from "@/components/crm/layout";
import { clientService } from "@/lib/crm/services/client.service";
import type { BackofficeUser } from "@/types/backoffice/user";

const stageConfig = {
  registered: { label: "Registered", color: "bg-slate-100 text-slate-700", icon: Users },
  verified: { label: "Verified", color: "bg-blue-100 text-blue-700", icon: Users },
  ftd: { label: "First Deposit", color: "bg-emerald-100 text-emerald-700", icon: TrendingUp },
  active: { label: "Active", color: "bg-violet-100 text-violet-700", icon: TrendingUp },
  inactive: { label: "Inactive", color: "bg-amber-100 text-amber-700", icon: Clock },
  churn: { label: "Churn", color: "bg-red-100 text-red-700", icon: UserX },
};

export default function LifecyclePage() {
  const [clients, setClients] = useState<BackofficeUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    clientService.list().then((res) => {
      setClients(res.items);
      setLoading(false);
    });
  }, []);

  const stageCounts = clients.reduce((acc, client) => {
    const stage = client.lifecycleStage || "registered";
    acc[stage] = (acc[stage] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "Clients" }, { label: "Lifecycle" }]} />

      <PageHeader
        title="Client Lifecycle"
        description="Track client journey from registration to active trading"
      />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(stageConfig).map(([key, config]) => {
          const Icon = config.icon;
          const count = stageCounts[key] || 0;
          return (
            <Card key={key} className="!p-5">
              <div className="flex items-start justify-between">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${config.color.split(" ")[0]}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-2xl font-bold text-slate-900">{count}</span>
              </div>
              <p className="mt-3 text-sm font-medium text-slate-700">{config.label}</p>
              <p className="text-xs text-slate-500">
                {clients.length > 0 ? `${((count / clients.length) * 100).toFixed(1)}%` : "0%"}
              </p>
            </Card>
          );
        })}
      </div>

      <Card className="!p-6">
        <h3 className="text-sm font-medium text-slate-700 mb-4">Lifecycle Funnel</h3>
        <div className="space-y-3">
          {["registered", "verified", "ftd", "active"].map((stage, index) => {
            const count = stageCounts[stage] || 0;
            const prevCount = index === 0 ? count : stageCounts[["registered", "verified", "ftd", "active"][index - 1]] || 1;
            const conversion = index === 0 ? 100 : ((count / prevCount) * 100).toFixed(1);
            const config = stageConfig[stage as keyof typeof stageConfig];

            return (
              <div key={stage} className="flex items-center gap-4">
                <span className="w-24 text-sm text-slate-600">{config.label}</span>
                <div className="flex-1 h-8 bg-slate-100 rounded-lg overflow-hidden relative">
                  <div
                    className={`h-full ${config.color.split(" ")[0]} transition-all`}
                    style={{ width: `${Math.min((count / (clients.length || 1)) * 100 * 4, 100)}%` }}
                  />
                  <span className="absolute inset-0 flex items-center px-3 text-sm font-medium text-slate-700">
                    {count} ({conversion}%)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
