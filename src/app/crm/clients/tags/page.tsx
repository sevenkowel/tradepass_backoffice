"use client";

import { useState, useEffect } from "react";
import { Tag, Plus, Search, Trash2, Edit3, Hash } from "lucide-react";
import { Card, PageHeader, Button } from "@/components/crm/ui";
import { Breadcrumb } from "@/components/crm/layout";
import { EnhancedDataTable, type Column, type RowAction } from "@/components/crm/ui/EnhancedDataTable";
import { clientService } from "@/lib/crm/services/client.service";
import type { ClientTag } from "@/types/backoffice/user";

export default function TagsPage() {
  const [tags, setTags] = useState<ClientTag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    clientService.listTags().then((data) => {
      setTags(data);
      setLoading(false);
    });
  }, []);

  const columns: Column<ClientTag>[] = [
    {
      key: "name",
      title: "Tag Name",
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: row.color }} />
          <span className="font-medium text-slate-900">{row.name}</span>
          {row.isSystem && (
            <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px]">System</span>
          )}
        </div>
      ),
    },
    {
      key: "description",
      title: "Description",
      render: (row) => <span className="text-sm text-slate-500">{row.description || "-"}</span>,
    },
    {
      key: "userCount",
      title: "Users",
      width: "80px",
      align: "right",
      render: (row) => <span className="font-medium text-slate-900">{row.userCount}</span>,
    },
    {
      key: "createdAt",
      title: "Created",
      width: "120px",
      render: (row) => <span className="text-xs text-slate-500">{new Date(row.createdAt).toLocaleDateString()}</span>,
    },
  ];

  const rowActions: RowAction<ClientTag>[] = [
    {
      label: "Edit",
      icon: <Edit3 className="w-4 h-4" />,
      onClick: () => {},
    },
    {
      label: "Delete",
      icon: <Trash2 className="w-4 h-4" />,
      onClick: () => {},
      variant: "danger",
      disabled: (row) => row.isSystem,
    },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "Clients" }, { label: "Tags" }]} />

      <PageHeader
        title="Client Tags"
        description="Manage client tags and auto-tagging rules"
        actions={
          <Button>
            <Plus className="w-4 h-4" />
            Create Tag
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="!p-4">
          <p className="text-sm text-slate-500">Total Tags</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{tags.length}</p>
        </Card>
        <Card className="!p-4">
          <p className="text-sm text-slate-500">System Tags</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{tags.filter((t) => t.isSystem).length}</p>
        </Card>
        <Card className="!p-4">
          <p className="text-sm text-slate-500">Custom Tags</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{tags.filter((t) => !t.isSystem).length}</p>
        </Card>
        <Card className="!p-4">
          <p className="text-sm text-slate-500">Total Tagged Users</p>
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
          emptyText={loading ? "" : "No tags found"}
          loading={loading}
        />
      </Card>
    </div>
  );
}
