"use client";

/**
 * Tags catalog — create / edit / delete user tags. The list itself is
 * read via `clientService.listTags()`; mutations route through the
 * `/api/crm/tags*` endpoints.
 */

import { useEffect, useState } from "react";
import { Plus, Trash2, Edit3 } from "lucide-react";
import { Card, PageHeader, Button } from "@/components/crm/ui";
import { Breadcrumb } from "@/components/crm/layout";
import { EnhancedDataTable, type Column, type RowAction } from "@/components/crm/ui/EnhancedDataTable";
import {
  ConfigDrawer,
  Field,
  TextInput,
  TextArea,
} from "@/components/crm/clm/config/ConfigDrawer";
import { clientService } from "@/lib/crm/services/client.service";
import { useT } from "@/lib/i18n/LocaleProvider";
import type { ClientTag } from "@/types/backoffice/user";

const COLOR_PRESETS = [
  "#3B82F6", // blue
  "#10B981", // emerald
  "#F59E0B", // amber
  "#EF4444", // red
  "#8B5CF6", // violet
  "#06B6D4", // cyan
  "#64748B", // slate
];

interface DraftTag {
  name: string;
  color: string;
  description: string;
  isSystem: boolean;
}

const EMPTY: DraftTag = {
  name: "",
  color: COLOR_PRESETS[0],
  description: "",
  isSystem: false,
};

export default function TagsPage() {
  const { t } = useT();
  const [tags, setTags] = useState<ClientTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftTag>(EMPTY);
  const [saving, setSaving] = useState(false);

  const reload = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await clientService.listTags();
      setTags(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setDraft(EMPTY);
    setDrawerOpen(true);
  };

  const openEdit = (tag: ClientTag) => {
    setEditingId(tag.id);
    setDraft({
      name: tag.name,
      color: tag.color,
      description: tag.description ?? "",
      isSystem: tag.isSystem,
    });
    setDrawerOpen(true);
  };

  const save = async () => {
    if (!draft.name.trim()) return;
    setSaving(true);
    try {
      if (editingId) {
        await clientService.updateTag(editingId, draft);
      } else {
        await clientService.createTag({ ...draft, createdAt: new Date().toISOString() });
      }
      setDrawerOpen(false);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this tag? It will be removed from every assigned user.")) return;
    try {
      await clientService.deleteTag(id);
      setDrawerOpen(false);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const columns: Column<ClientTag>[] = [
    {
      key: "name",
      title: t("clients.tags.col.name"),
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: row.color }} />
          <span className="font-medium text-slate-900">{row.name}</span>
          {row.isSystem && (
            <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px]">
              {t("clients.tags.system")}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "description",
      title: t("clients.tags.col.description"),
      render: (row) => (
        <span className="text-sm text-slate-500">{row.description || "—"}</span>
      ),
    },
    {
      key: "userCount",
      title: t("clients.tags.col.users"),
      width: "100px",
      align: "right",
      sortable: true,
      render: (row) => (
        <span className="font-medium text-slate-900 font-mono tabular-nums">
          {row.userCount}
        </span>
      ),
    },
    {
      key: "createdAt",
      title: t("clients.tags.col.created"),
      width: "140px",
      sortable: true,
      render: (row) => (
        <span className="text-xs text-slate-500 font-mono tabular-nums">
          {new Date(row.createdAt).toLocaleDateString()}
        </span>
      ),
    },
  ];

  const rowActions: RowAction<ClientTag>[] = [
    {
      label: t("clients.tags.action.edit"),
      icon: <Edit3 className="w-4 h-4" />,
      onClick: (row) => openEdit(row),
    },
    {
      label: t("clients.tags.action.delete"),
      icon: <Trash2 className="w-4 h-4" />,
      onClick: (row) => remove(row.id),
      variant: "danger",
      disabled: (row) => row.isSystem,
    },
  ];

  return (
    <div className="space-y-3">
      <Breadcrumb items={[{ label: t("clients.crumb.root") }, { label: t("clients.crumb.tags") }]} />

      <PageHeader
        title={t("clients.tags.title")}
        actions={
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4" />
            {t("clients.tags.create")}
          </Button>
        }
      />

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          Error: {error}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card padding="sm">
          <p className="text-xs text-slate-500">{t("clients.tags.stat.total")}</p>
          <p className="text-xl font-bold text-slate-900 mt-0.5 tabular-nums">{tags.length}</p>
        </Card>
        <Card padding="sm">
          <p className="text-xs text-slate-500">{t("clients.tags.stat.system")}</p>
          <p className="text-xl font-bold text-blue-600 mt-0.5 tabular-nums">
            {tags.filter((tag) => tag.isSystem).length}
          </p>
        </Card>
        <Card padding="sm">
          <p className="text-xs text-slate-500">{t("clients.tags.stat.custom")}</p>
          <p className="text-xl font-bold text-emerald-600 mt-0.5 tabular-nums">
            {tags.filter((tag) => !tag.isSystem).length}
          </p>
        </Card>
        <Card padding="sm">
          <p className="text-xs text-slate-500">{t("clients.tags.stat.tagged")}</p>
          <p className="text-xl font-bold text-violet-600 mt-0.5 tabular-nums">
            {tags.reduce((sum, tag) => sum + tag.userCount, 0)}
          </p>
        </Card>
      </div>

      <Card padding="none">
        <EnhancedDataTable<ClientTag>
          tableId="clients-tags"
          columns={columns}
          data={tags}
          keyExtractor={(row) => row.id}
          rowActions={rowActions}
          emptyText={loading ? "" : t("clients.tags.empty")}
          loading={loading}
          searchable
          searchKeys={["name", "description"]}
        />
      </Card>

      <ConfigDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSave={save}
        title={editingId ? "Edit Tag" : "New Tag"}
        subtitle={editingId ? "Edit a user tag" : "Add a new user tag"}
        saving={saving}
        saveDisabled={!draft.name.trim()}
        destructive={
          editingId
            ? { label: "Delete tag", onClick: () => remove(editingId) }
            : undefined
        }
      >
        <Field label="Name" required>
          <TextInput
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            placeholder="e.g. High Net Worth"
          />
        </Field>
        <Field label="Description">
          <TextArea
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            rows={2}
            placeholder="When to apply this tag"
          />
        </Field>
        <Field label="Colour">
          <div className="flex items-center gap-2 flex-wrap">
            {COLOR_PRESETS.map((c) => (
              <button
                key={c}
                onClick={() => setDraft({ ...draft, color: c })}
                aria-label={`colour ${c}`}
                className={`w-8 h-8 rounded-full transition-all border-2 ${
                  draft.color === c ? "border-slate-900 scale-110" : "border-transparent"
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
            <input
              type="color"
              value={draft.color}
              onChange={(e) => setDraft({ ...draft, color: e.target.value })}
              className="w-8 h-8 rounded cursor-pointer border border-slate-200"
              aria-label="Custom colour"
            />
          </div>
        </Field>
        <label className="inline-flex items-center gap-2 text-xs text-slate-700">
          <input
            type="checkbox"
            checked={draft.isSystem}
            onChange={(e) => setDraft({ ...draft, isSystem: e.target.checked })}
            disabled={editingId !== null && draft.isSystem}
          />
          System tag (cannot be deleted by other operators)
        </label>
      </ConfigDrawer>
    </div>
  );
}
