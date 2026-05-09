"use client";

import { useState, useEffect } from "react";
import { Users, TrendingUp, UserX, Clock, type LucideIcon } from "lucide-react";
import { Card, PageHeader } from "@/components/crm/ui";
import { Breadcrumb } from "@/components/crm/layout";
import { clientService } from "@/lib/crm/services/client.service";
import { useT } from "@/lib/i18n/LocaleProvider";
import type { BackofficeUser } from "@/types/backoffice/user";

const stageColors: Record<string, string> = {
  registered: "bg-slate-100 text-slate-700",
  verified: "bg-blue-100 text-blue-700",
  ftd: "bg-emerald-100 text-emerald-700",
  active: "bg-violet-100 text-violet-700",
  inactive: "bg-amber-100 text-amber-700",
  churn: "bg-red-100 text-red-700",
};

const stageIcons: Record<string, LucideIcon> = {
  registered: Users,
  verified: Users,
  ftd: TrendingUp,
  active: TrendingUp,
  inactive: Clock,
  churn: UserX,
};

export default function LifecyclePage() {
  const { t } = useT();
  const [clients, setClients] = useState<BackofficeUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const stageKeys: Array<keyof typeof stageIcons> = ["registered", "verified", "ftd", "active", "inactive", "churn"];
  const labelOf = (key: string) =>
    key === "ftd" ? t("clients.lifecycle.ftd") : t(`clients.lifecycle.${key}`);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    // Pull a wider sample so the funnel reflects the whole base, not the first page.
    clientService
      .list({ pageSize: 500, page: 1 })
      .then((res) => {
        if (!cancelled) setClients(res.items);
      })
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : String(e)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const stageCounts = clients.reduce((acc, client) => {
    const stage = client.lifecycleStage || "registered";
    acc[stage] = (acc[stage] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: t("clients.crumb.root") }, { label: t("clients.crumb.lifecycle") }]} />

      <PageHeader
        title={t("clients.lifecyclePage.title")}
        description={t("clients.lifecyclePage.subtitle")}
      />

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          Error: {error}
        </div>
      )}

      {loading && (
        <div className="p-3 text-sm text-slate-500">{t("clients.relationships.loading")}</div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {stageKeys.map((key) => {
          const Icon = stageIcons[key];
          const colorClass = stageColors[key];
          const count = stageCounts[key] || 0;
          return (
            <Card key={key} className="!p-5">
              <div className="flex items-start justify-between">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClass.split(" ")[0]}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-2xl font-bold text-slate-900">{count}</span>
              </div>
              <p className="mt-3 text-sm font-medium text-slate-700">{labelOf(key)}</p>
              <p className="text-xs text-slate-500">
                {clients.length > 0 ? `${((count / clients.length) * 100).toFixed(1)}%` : "0%"}
              </p>
            </Card>
          );
        })}
      </div>

      <Card className="!p-6">
        <h3 className="text-sm font-medium text-slate-700 mb-4">{t("clients.lifecyclePage.funnel")}</h3>
        <div className="space-y-3">
          {(["registered", "verified", "ftd", "active"] as const).map((stage, index) => {
            const count = stageCounts[stage] || 0;
            const prevStages = ["registered", "verified", "ftd", "active"] as const;
            const prevCount = index === 0 ? count : stageCounts[prevStages[index - 1]] || 1;
            const conversion = index === 0 ? "100" : ((count / prevCount) * 100).toFixed(1);
            const colorClass = stageColors[stage];

            return (
              <div key={stage} className="flex items-center gap-4">
                <span className="w-24 text-sm text-slate-600">{labelOf(stage)}</span>
                <div className="flex-1 h-8 bg-slate-100 rounded-lg overflow-hidden relative">
                  <div
                    className={`h-full ${colorClass.split(" ")[0]} transition-all`}
                    style={{
                      width: `${Math.min((count / (clients.length || 1)) * 100 * 4, 100)}%`,
                    }}
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
