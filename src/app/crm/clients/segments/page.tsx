"use client";

/**
 * Segments — saved filter sets that materialise into shareable user lists.
 *
 * Static vs dynamic:
 *   - **Static**  — manually curated UID list (the membership is frozen).
 *   - **Dynamic** — every load re-evaluates `filter` against the live data.
 *
 * The create modal here only sets the metadata + a JSON-encoded filter
 * (free-text for now); the structured filter builder is left for a future
 * pass once segment usage proves out.
 */

import { useEffect, useState } from "react";
import { Users, Plus, ArrowRight } from "lucide-react";
import { Card, PageHeader, Button } from "@/components/crm/ui";
import { Breadcrumb } from "@/components/crm/layout";
import {
  ConfigDrawer,
  Field,
  Select,
  TextArea,
  TextInput,
} from "@/components/crm/clm/config/ConfigDrawer";
import { clientService } from "@/lib/crm/services/client.service";
import { useT } from "@/lib/i18n/LocaleProvider";
import type { ClientListParams, ClientSegment } from "@/types/backoffice/user";

interface DraftSegment {
  name: string;
  description: string;
  isDynamic: boolean;
  filterJson: string;
}

const EMPTY: DraftSegment = {
  name: "",
  description: "",
  isDynamic: true,
  filterJson: '{\n  "riskLevel": "high"\n}',
};

export default function SegmentsPage() {
  const { t } = useT();
  const [segments, setSegments] = useState<ClientSegment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [draft, setDraft] = useState<DraftSegment>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [filterError, setFilterError] = useState("");

  const reload = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await clientService.listSegments();
      setSegments(data);
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
    setDraft(EMPTY);
    setFilterError("");
    setDrawerOpen(true);
  };

  const save = async () => {
    if (!draft.name.trim()) return;
    let filter: Partial<ClientListParams> = {};
    if (draft.filterJson.trim()) {
      try {
        filter = JSON.parse(draft.filterJson);
      } catch {
        setFilterError("Filter must be valid JSON");
        return;
      }
    }
    setFilterError("");
    setSaving(true);
    try {
      await clientService.createSegment({
        name: draft.name,
        description: draft.description,
        filter,
        isDynamic: draft.isDynamic,
      });
      setDrawerOpen(false);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <Breadcrumb items={[{ label: t("clients.crumb.root") }, { label: t("clients.crumb.segments") }]} />

      <PageHeader
        title={t("clients.segments.title")}
        actions={
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4" />
            {t("clients.segments.create")}
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
          <p className="text-xs text-slate-500">{t("clients.segments.stat.total")}</p>
          <p className="text-xl font-bold text-slate-900 mt-0.5 tabular-nums">{segments.length}</p>
        </Card>
        <Card padding="sm">
          <p className="text-xs text-slate-500">{t("clients.segments.stat.dynamic")}</p>
          <p className="text-xl font-bold text-blue-600 mt-0.5 tabular-nums">
            {segments.filter((s) => s.isDynamic).length}
          </p>
        </Card>
        <Card padding="sm">
          <p className="text-xs text-slate-500">{t("clients.segments.stat.static")}</p>
          <p className="text-xl font-bold text-emerald-600 mt-0.5 tabular-nums">
            {segments.filter((s) => !s.isDynamic).length}
          </p>
        </Card>
        <Card padding="sm">
          <p className="text-xs text-slate-500">{t("clients.segments.stat.users")}</p>
          <p className="text-xl font-bold text-violet-600 mt-0.5 tabular-nums">
            {segments.reduce((sum, s) => sum + s.userCount, 0)}
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {loading && (
          <div className="col-span-full text-sm text-slate-400 py-8 text-center">
            Loading segments…
          </div>
        )}
        {!loading && segments.length === 0 && (
          <div className="col-span-full text-sm text-slate-400 py-8 text-center">
            No segments yet
          </div>
        )}
        {!loading &&
          segments.map((segment) => (
            <Card key={segment.id} padding="md" className="hover:border-primary/30 transition-colors cursor-pointer">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <h3 className="font-medium text-slate-900 text-sm">{segment.name}</h3>
                  {segment.description && (
                    <p className="text-xs text-slate-500 mt-1">{segment.description}</p>
                  )}
                  <div className="mt-2 flex items-center gap-2">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        segment.isDynamic
                          ? "bg-blue-100 text-blue-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {segment.isDynamic
                        ? t("clients.segments.dynamic")
                        : t("clients.segments.static")}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs text-slate-600">
                      <Users className="w-3.5 h-3.5" />
                      <span className="font-mono tabular-nums">{segment.userCount}</span>
                      {t("clients.segments.users")}
                    </span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
              </div>
            </Card>
          ))}
      </div>

      <ConfigDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSave={save}
        title="New Segment"
        subtitle="Define a saved filter or curated user list"
        saving={saving}
        saveDisabled={!draft.name.trim()}
      >
        <Field label="Name" required>
          <TextInput
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            placeholder="e.g. High Risk + UAE"
          />
        </Field>
        <Field label="Description">
          <TextArea
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            rows={2}
            placeholder="What this segment is used for"
          />
        </Field>
        <Field label="Type">
          <Select
            value={draft.isDynamic ? "dynamic" : "static"}
            onChange={(e) => setDraft({ ...draft, isDynamic: e.target.value === "dynamic" })}
            options={[
              { label: "Dynamic — re-evaluates each time", value: "dynamic" },
              { label: "Static — frozen membership snapshot", value: "static" },
            ]}
          />
        </Field>
        <Field
          label="Filter (JSON)"
          hint='Subset of ClientListParams — e.g. {"riskLevel":"high","country":"AE"}'
        >
          <TextArea
            value={draft.filterJson}
            onChange={(e) => {
              setDraft({ ...draft, filterJson: e.target.value });
              setFilterError("");
            }}
            rows={5}
            className="font-mono text-xs"
          />
        </Field>
        {filterError && (
          <p className="text-xs text-red-600">{filterError}</p>
        )}
      </ConfigDrawer>
    </div>
  );
}
