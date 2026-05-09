"use client";

import { useState, useEffect } from "react";
import { Users, Filter, ArrowRight } from "lucide-react";
import { Card, PageHeader, Button } from "@/components/crm/ui";
import { Breadcrumb } from "@/components/crm/layout";
import { clientService } from "@/lib/crm/services/client.service";
import { useT } from "@/lib/i18n/LocaleProvider";
import type { ClientSegment } from "@/types/backoffice/user";

export default function SegmentsPage() {
  const { t } = useT();
  const [segments, setSegments] = useState<ClientSegment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    clientService
      .listSegments()
      .then((data) => !cancelled && setSegments(data))
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : String(e)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: t("clients.crumb.root") }, { label: t("clients.crumb.segments") }]} />

      <PageHeader
        title={t("clients.segments.title")}
        description={t("clients.segments.subtitle")}
        actions={
          <Button>
            <Filter className="w-4 h-4" />
            {t("clients.segments.create")}
          </Button>
        }
      />

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          Error: {error}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="!p-4">
          <p className="text-sm text-slate-500">{t("clients.segments.stat.total")}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{segments.length}</p>
        </Card>
        <Card className="!p-4">
          <p className="text-sm text-slate-500">{t("clients.segments.stat.dynamic")}</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {segments.filter((s) => s.isDynamic).length}
          </p>
        </Card>
        <Card className="!p-4">
          <p className="text-sm text-slate-500">{t("clients.segments.stat.static")}</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">
            {segments.filter((s) => !s.isDynamic).length}
          </p>
        </Card>
        <Card className="!p-4">
          <p className="text-sm text-slate-500">{t("clients.segments.stat.users")}</p>
          <p className="text-2xl font-bold text-violet-600 mt-1">
            {segments.reduce((sum, s) => sum + s.userCount, 0)}
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {loading && (
          <div className="col-span-full text-sm text-slate-400 py-8 text-center">
            {t("clients.relationships.loading")}
          </div>
        )}
        {!loading &&
          segments.map((segment) => (
            <Card key={segment.id} className="!p-5 hover:border-blue-300 transition-colors cursor-pointer">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-slate-900">{segment.name}</h3>
                  <p className="text-sm text-slate-500 mt-1">{segment.description}</p>
                  <div className="mt-3 flex items-center gap-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                        segment.isDynamic
                          ? "bg-blue-100 text-blue-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {segment.isDynamic
                        ? t("clients.segments.dynamic")
                        : t("clients.segments.static")}
                    </span>
                    <span className="flex items-center gap-1 text-sm text-slate-600">
                      <Users className="w-4 h-4" />
                      {segment.userCount} {t("clients.segments.users")}
                    </span>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400" />
              </div>
            </Card>
          ))}
      </div>
    </div>
  );
}
