"use client";

/**
 * Re-Verification → Templates.
 *
 * One template per `(verificationType, channel)` slot. The trigger
 * drawer auto-suggests templates that match the chosen type, so the
 * filter on this page is just for the operator browsing in isolation.
 */

import { useEffect, useState } from "react";
import { Plus, Trash2, Edit3, Mail, Inbox, Bell, AlertTriangle } from "lucide-react";
import { Card, PageHeader, Button } from "@/components/crm/ui";
import { Breadcrumb } from "@/components/crm/layout";
import {
  ConfigDrawer,
  Field,
  Select,
  TextArea,
  TextInput,
} from "@/components/crm/clm/config/ConfigDrawer";
import { reVerificationService } from "@/lib/clm/services";
import { useCurrentStaffName } from "@/hooks/useCurrentStaff";
import {
  CHANNEL_META,
  CHANNEL_ORDER,
  TYPE_META,
  TYPE_ORDER,
  TypePill,
} from "@/components/crm/clm/re-verification/bits";
import type {
  NotificationChannel,
  ReVerificationTemplate,
  ReVerificationType,
} from "@/types/clm";

const CHANNEL_ICONS = { email: Mail, inbox: Inbox, push: Bell, login_popup: AlertTriangle } as const;

interface DraftTemplate {
  name: string;
  verificationType: ReVerificationType;
  channel: NotificationChannel;
  subject: string;
  body: string;
  languages: string;
  active: boolean;
}

const EMPTY: DraftTemplate = {
  name: "",
  verificationType: "re_identity",
  channel: "email",
  subject: "",
  body: "",
  languages: "en",
  active: true,
};

export default function ReVerificationTemplatesPage() {
  const actor = useCurrentStaffName();

  const [rows, setRows] = useState<ReVerificationTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<"all" | ReVerificationType>("all");
  const [channelFilter, setChannelFilter] = useState<"all" | NotificationChannel>("all");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftTemplate>(EMPTY);
  const [saving, setSaving] = useState(false);

  const reload = async () => {
    setLoading(true);
    setRows(await reVerificationService.templates.list());
    setLoading(false);
  };

  useEffect(() => {
    reload();
  }, []);

  const filtered = rows.filter(
    (t) =>
      (typeFilter === "all" || t.verificationType === typeFilter) &&
      (channelFilter === "all" || t.channel === channelFilter)
  );

  const openCreate = () => {
    setEditingId(null);
    setDraft(EMPTY);
    setDrawerOpen(true);
  };

  const openEdit = (t: ReVerificationTemplate) => {
    setEditingId(t.id);
    setDraft({
      name: t.name,
      verificationType: t.verificationType,
      channel: t.channel,
      subject: t.subject ?? "",
      body: t.body,
      languages: t.languages.join(","),
      active: t.active,
    });
    setDrawerOpen(true);
  };

  const save = async () => {
    if (!draft.name.trim() || !draft.body.trim()) return;
    setSaving(true);
    try {
      const payload = {
        name: draft.name,
        verificationType: draft.verificationType,
        channel: draft.channel,
        subject: draft.channel === "email" ? draft.subject : undefined,
        body: draft.body,
        languages: draft.languages.split(",").map((s) => s.trim()).filter(Boolean),
        active: draft.active,
      };
      if (editingId) {
        await reVerificationService.templates.update(editingId, payload, actor);
      } else {
        await reVerificationService.templates.create(payload, actor);
      }
      setDrawerOpen(false);
      await reload();
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this template? Existing requests that referenced it keep their inline copy.")) return;
    await reVerificationService.templates.remove(id);
    setDrawerOpen(false);
    await reload();
  };

  return (
    <div className="space-y-3">
      <Breadcrumb
        items={[
          { label: "CLM Center" },
          { label: "Re-Verification", href: "/crm/clm/re-verification/requests" },
          { label: "Templates" },
        ]}
      />
      <PageHeader
        title="Re-Verification Templates"
        actions={
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4" />
            New Template
          </Button>
        }
      />

      <div className="flex items-center gap-2 flex-wrap">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
          className="h-8 px-2 rounded-md border border-slate-200 bg-white text-xs"
        >
          <option value="all">All types</option>
          {TYPE_ORDER.map((t) => (
            <option key={t} value={t}>
              {TYPE_META[t].label}
            </option>
          ))}
        </select>
        <select
          value={channelFilter}
          onChange={(e) => setChannelFilter(e.target.value as typeof channelFilter)}
          className="h-8 px-2 rounded-md border border-slate-200 bg-white text-xs"
        >
          <option value="all">All channels</option>
          {CHANNEL_ORDER.map((c) => (
            <option key={c} value={c}>
              {CHANNEL_META[c].label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {loading && (
          <div className="col-span-full text-sm text-slate-400 py-8 text-center">
            Loading templates…
          </div>
        )}
        {!loading && filtered.length === 0 && (
          <div className="col-span-full text-sm text-slate-400 py-8 text-center">
            No templates match this filter
          </div>
        )}
        {filtered.map((t) => {
          const ChannelIcon = CHANNEL_ICONS[t.channel];
          return (
            <Card key={t.id} padding="md">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-slate-900 truncate">{t.name}</h3>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <TypePill type={t.verificationType} />
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${CHANNEL_META[t.channel].tone}`}>
                      <ChannelIcon className="w-3 h-3" />
                      {CHANNEL_META[t.channel].label}
                    </span>
                    {!t.active && (
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 text-[10px] font-medium">
                        inactive
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => openEdit(t)}
                    className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded"
                    aria-label="Edit"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => remove(t.id)}
                    className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded"
                    aria-label="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {t.subject && (
                <p className="text-xs text-slate-700 mt-2 font-medium">{t.subject}</p>
              )}
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed line-clamp-3 whitespace-pre-wrap">
                {t.body}
              </p>
              <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-100 text-[11px]">
                <span className="text-slate-500">
                  {t.languages.length} language{t.languages.length === 1 ? "" : "s"}
                </span>
                <span className="text-slate-300">·</span>
                <span className="text-slate-400">Updated by {t.updatedBy}</span>
              </div>
            </Card>
          );
        })}
      </div>

      <ConfigDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSave={save}
        title={editingId ? "Edit Template" : "New Template"}
        subtitle={editingId ? `Editing ${editingId}` : "Reusable notification body"}
        saving={saving}
        saveDisabled={!draft.name.trim() || !draft.body.trim()}
        destructive={
          editingId ? { label: "Delete template", onClick: () => remove(editingId) } : undefined
        }
      >
        <Field label="Name" required>
          <TextInput
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            placeholder="e.g. ID Expiration — Email"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Verification type" required>
            <Select
              value={draft.verificationType}
              onChange={(e) =>
                setDraft({ ...draft, verificationType: e.target.value as ReVerificationType })
              }
              options={TYPE_ORDER.map((t) => ({
                label: TYPE_META[t].label,
                value: t,
              }))}
            />
          </Field>
          <Field label="Channel" required>
            <Select
              value={draft.channel}
              onChange={(e) =>
                setDraft({ ...draft, channel: e.target.value as NotificationChannel })
              }
              options={CHANNEL_ORDER.map((c) => ({
                label: CHANNEL_META[c].label,
                value: c,
              }))}
            />
          </Field>
        </div>
        {draft.channel === "email" && (
          <Field label="Subject">
            <TextInput
              value={draft.subject}
              onChange={(e) => setDraft({ ...draft, subject: e.target.value })}
            />
          </Field>
        )}
        <Field
          label="Body"
          required
          hint="Tokens: {userName}, {deadline}, {ctaUrl}"
        >
          <TextArea
            value={draft.body}
            onChange={(e) => setDraft({ ...draft, body: e.target.value })}
            rows={8}
          />
        </Field>
        <Field
          label="Languages"
          hint="Comma-separated ISO codes (e.g. en, id, vi)"
        >
          <TextInput
            value={draft.languages}
            onChange={(e) => setDraft({ ...draft, languages: e.target.value })}
          />
        </Field>
        <label className="inline-flex items-center gap-2 text-xs text-slate-700">
          <input
            type="checkbox"
            checked={draft.active}
            onChange={(e) => setDraft({ ...draft, active: e.target.checked })}
          />
          Active — available for selection in the trigger drawer
        </label>
      </ConfigDrawer>
    </div>
  );
}
