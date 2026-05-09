"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Edit3 } from "lucide-react";
import { Card, PageHeader, Button } from "@/components/crm/ui";
import { Breadcrumb } from "@/components/crm/layout";
import { EnhancedDataTable, type Column, type RowAction } from "@/components/crm/ui/EnhancedDataTable";
import { clientService } from "@/lib/crm/services/client.service";
import { useT } from "@/lib/i18n/LocaleProvider";
import type { ClientTag } from "@/types/backoffice/user";

export default function TagsPage() {
  const { t } = useT();
  const [tags, setTags] = useState<ClientTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    clientService
      .listTags()
      .then((data) => !cancelled && setTags(data))
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : String(e)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const columns: Column<ClientTag>[] = [
    {
      key: "name",
      title: t("clients.tags.col.name"),
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: row.color }} />
          <span className="font-medium text-slate-900">{row.name}</span>
          {row.isSystem && (
            <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px]">
              {t("clients.tags.system")}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "description",
      title: t("clients.tags.col.description"),
      render: (row) => <span className="text-sm text-slate-500">{row.description || "-"}</span>,
    },
    {
      key: "userCount",
      title: t("clients.tags.col.users"),
      width: "100px",
      align: "right",
      render: (row) => <span className="font-medium text-slate-900">{row.userCount}</span>,
    },
    {
      key: "createdAt",
      title: t("clients.tags.col.created"),
      width: "140px",
      render: (row) => (
        <span className="text-xs text-slate-500">{new Date(row.createdAt).toLocaleDateString()}</span>
      ),
    },
  ];

  const rowActions: RowAction<ClientTag>[] = [
    {
      label: t("clients.tags.action.edit"),
      icon: <Edit3 className="w-4 h-4" />,
      onClick: () => {},
    },
    {
      label: t("clients.tags.action.delete"),
      icon: <Trash2 className="w-4 h-4" />,
      onClick: () => {},
      variant: "danger",
      disabled: (row) => row.isSystem,
    },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: t("clients.crumb.root") }, { label: t("clients.crumb.tags") }]} />

      <PageHeader
        title={t("clients.tags.title")}
        description={t("clients.tags.subtitle")}
        actions={
          <Button>
            <Plus className="w-4 h-4" />
            {t("clients.tags.create")}
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
          <p className="text-sm text-slate-500">{t("clients.tags.stat.total")}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{tags.length}</p>
        </Card>
        <Card className="!p-4">
          <p className="text-sm text-slate-500">{t("clients.tags.stat.system")}</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {tags.filter((t) => t.isSystem).length}
          </p>
        </Card>
        <Card className="!p-4">
          <p className="text-sm text-slate-500">{t("clients.tags.stat.custom")}</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">
            {tags.filter((t) => !t.isSystem).length}
          </p>
        </Card>
        <Card className="!p-4">
          <p className="text-sm text-slate-500">{t("clients.tags.stat.tagged")}</p>
          <p className="text-2xl font-bold text-violet-600 mt-1">
            {tags.reduce((sum, t) => sum + t.userCount, 0)}
          </p>
        </Card>
      </div>

      <Card padding="none">
        <EnhancedDataTable<ClientTag>
          columns={columns}
          data={tags}
          keyExtractor={(row) => row.id}
          rowActions={rowActions}
          emptyText={loading ? "" : t("clients.tags.empty")}
          loading={loading}
        />
      </Card>
    </div>
  );
}
