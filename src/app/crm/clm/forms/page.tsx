"use client";

/**
 * Forms & Fields — PRD §8 Dynamic Form Rendering Layer.
 *
 * The page now renders a tree of named **sections** (Personal Info /
 * Identity / Address / Financial / …) with fields nested inside. The
 * inline detail (when a form card is expanded) shows each section as a
 * group with its fields listed under it, including chips for required /
 * conditional / country-restricted / validated fields.
 *
 * The drawer's "Add field" / "Edit field" UX is unchanged for the
 * scalar-field bits; the section/condition/validation surfaces are kept
 * focused so the page stays fast to scan. A future iteration will turn
 * the field row into its own drawer for deeper editing.
 */

import { useEffect, useState } from "react";
import { FormInput, Plus, ChevronRight, Trash2, GitBranch, Globe2, ShieldCheck } from "lucide-react";
import { Card, PageHeader, Button } from "@/components/crm/ui";
import { Breadcrumb } from "@/components/crm/layout";
import { clmConfigService } from "@/lib/clm/services";
import { useCurrentStaffName } from "@/hooks/useCurrentStaff";
import {
  ConfigDrawer,
  Field,
  Select,
  TextInput,
} from "@/components/crm/clm/config/ConfigDrawer";
import type {
  ConfigStatus,
  KYCForm,
  KYCFormField,
  KYCFormFieldType,
  KYCFormSection,
} from "@/types/clm";

const STATUS_TONES: Record<ConfigStatus, string> = {
  active: "bg-emerald-100 text-emerald-700",
  draft: "bg-slate-100 text-slate-600",
  retired: "bg-slate-100 text-slate-400",
};

const FIELD_TYPE_OPTIONS: { label: string; value: KYCFormFieldType }[] = [
  { label: "Text", value: "text" },
  { label: "Select", value: "select" },
  { label: "Date", value: "date" },
  { label: "File", value: "file" },
  { label: "OCR Upload", value: "ocr_upload" },
  { label: "Boolean", value: "boolean" },
  { label: "Checkbox", value: "checkbox" },
  { label: "Number", value: "number" },
];

interface DraftForm {
  name: string;
  country: string;
  status: ConfigStatus;
  languages: string;
  sections: KYCFormSection[];
}

const EMPTY: DraftForm = {
  name: "",
  country: "Global",
  status: "draft",
  languages: "en",
  sections: [
    { key: "personal", label: "Personal Information", fields: [] },
  ],
};

function flatten(sections: KYCFormSection[]): KYCFormField[] {
  return sections.flatMap((s) => s.fields);
}

export default function FormsFieldsPage() {
  const actor = useCurrentStaffName();

  const [forms, setForms] = useState<KYCForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftForm>(EMPTY);
  const [saving, setSaving] = useState(false);

  const reload = async () => {
    setLoading(true);
    setForms(await clmConfigService.forms.list());
    setLoading(false);
  };

  useEffect(() => {
    reload();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setDraft(EMPTY);
    setDrawerOpen(true);
  };

  const openEdit = (f: KYCForm) => {
    setEditingId(f.id);
    setDraft({
      name: f.name,
      country: f.country,
      status: f.status,
      languages: f.languages.join(","),
      sections: f.sections.map((s) => ({ ...s, fields: s.fields.map((fld) => ({ ...fld })) })),
    });
    setDrawerOpen(true);
  };

  const save = async () => {
    if (!draft.name.trim()) return;
    setSaving(true);
    try {
      const payload = {
        name: draft.name,
        country: draft.country,
        status: draft.status,
        languages: draft.languages.split(",").map((s) => s.trim()).filter(Boolean),
        sections: draft.sections,
        fields: flatten(draft.sections),
      };
      if (editingId) {
        await clmConfigService.forms.update({ id: editingId, ...payload }, actor);
      } else {
        await clmConfigService.forms.create(payload, actor);
      }
      setDrawerOpen(false);
      await reload();
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this form? Fields and submissions are not affected.")) return;
    await clmConfigService.forms.remove(id, actor);
    setDrawerOpen(false);
    await reload();
  };

  const addSection = () => {
    setDraft((d) => ({
      ...d,
      sections: [
        ...d.sections,
        { key: `section_${d.sections.length + 1}`, label: "New Section", fields: [] },
      ],
    }));
  };
  const updateSection = (idx: number, patch: Partial<KYCFormSection>) => {
    setDraft((d) => ({
      ...d,
      sections: d.sections.map((s, i) => (i === idx ? { ...s, ...patch } : s)),
    }));
  };
  const removeSection = (idx: number) => {
    setDraft((d) => ({ ...d, sections: d.sections.filter((_, i) => i !== idx) }));
  };

  const addField = (sectionIdx: number) => {
    setDraft((d) => ({
      ...d,
      sections: d.sections.map((s, i) =>
        i === sectionIdx
          ? {
              ...s,
              fields: [
                ...s.fields,
                {
                  key: `field_${s.fields.length + 1}`,
                  label: "New Field",
                  type: "text",
                  required: false,
                },
              ],
            }
          : s
      ),
    }));
  };
  const updateField = (sIdx: number, fIdx: number, patch: Partial<KYCFormField>) => {
    setDraft((d) => ({
      ...d,
      sections: d.sections.map((s, i) =>
        i === sIdx
          ? {
              ...s,
              fields: s.fields.map((f, fi) => (fi === fIdx ? { ...f, ...patch } : f)),
            }
          : s
      ),
    }));
  };
  const removeField = (sIdx: number, fIdx: number) => {
    setDraft((d) => ({
      ...d,
      sections: d.sections.map((s, i) =>
        i === sIdx
          ? { ...s, fields: s.fields.filter((_, fi) => fi !== fIdx) }
          : s
      ),
    }));
  };

  return (
    <div className="space-y-3">
      <Breadcrumb items={[{ label: "CLM Center" }, { label: "Forms & Fields" }]} />
      <PageHeader
        title="Forms & Fields"
        actions={
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4" />
            New Form
          </Button>
        }
      />

      <div className="space-y-2">
        {loading && (
          <div className="text-sm text-slate-400 py-8 text-center">Loading forms…</div>
        )}
        {!loading && forms.length === 0 && (
          <div className="text-sm text-slate-400 py-8 text-center">No forms yet</div>
        )}
        {forms.map((form) => {
          const isOpen = expanded === form.id;
          const totalFields = form.sections.reduce((s, sec) => s + sec.fields.length, 0);
          return (
            <Card
              key={form.id}
              padding="md"
              className={`cursor-pointer transition-all ${isOpen ? "ring-2 ring-primary/30" : ""}`}
              onClick={() => setExpanded(isOpen ? null : form.id)}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                  <FormInput className="w-4 h-4 text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-slate-900 text-sm">{form.name}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${STATUS_TONES[form.status]}`}>
                      {form.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500 font-mono tabular-nums">
                    <span>{form.country}</span>
                    <span>· {form.sections.length} sections</span>
                    <span>· {totalFields} fields</span>
                    <span className="inline-flex items-center gap-1">
                      <Globe2 className="w-2.5 h-2.5" />
                      {form.languages.join(", ") || "—"}
                    </span>
                    <span>· {new Date(form.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <ChevronRight className={`w-4 h-4 text-slate-300 transition-transform ${isOpen ? "rotate-90" : ""}`} />
              </div>

              {isOpen && (
                <div
                  className="mt-3 pt-3 border-t border-slate-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="space-y-3 mb-3">
                    {form.sections.map((section) => (
                      <div key={section.key}>
                        <p className="text-xs font-semibold text-slate-700 mb-1.5">
                          {section.label}{" "}
                          <span className="font-mono tabular-nums text-slate-400 font-normal">
                            ({section.fields.length})
                          </span>
                        </p>
                        <div className="space-y-1">
                          {section.fields.map((f) => (
                            <div
                              key={f.key}
                              className="flex items-center gap-2 text-xs px-2.5 py-1.5 bg-slate-50 rounded-md"
                            >
                              <span className="font-mono text-slate-500 w-32 truncate">{f.key}</span>
                              <span className="text-slate-700 flex-1 truncate">{f.label}</span>
                              <span className="text-slate-400 text-[10px] uppercase">{f.type}</span>
                              {f.required && (
                                <span className="text-red-500 text-[10px] font-semibold">REQUIRED</span>
                              )}
                              {f.conditions?.length ? (
                                <span className="inline-flex items-center gap-0.5 text-amber-600 text-[10px]" title="Conditional">
                                  <GitBranch className="w-2.5 h-2.5" />
                                  {f.conditions.length}
                                </span>
                              ) : null}
                              {f.countries?.length ? (
                                <span className="inline-flex items-center gap-0.5 text-violet-600 text-[10px]" title={f.countries.join(",")}>
                                  <Globe2 className="w-2.5 h-2.5" />
                                  {f.countries.join(",")}
                                </span>
                              ) : null}
                              {f.validation && (
                                <ShieldCheck className="w-2.5 h-2.5 text-emerald-600" />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button size="sm" onClick={() => openEdit(form)}>
                    Edit Form
                  </Button>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <ConfigDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSave={save}
        title={editingId ? "Edit Form" : "New Form"}
        subtitle={editingId ? `Editing ${editingId}` : "Build a per-country KYC form"}
        saving={saving}
        saveDisabled={!draft.name.trim()}
        width={620}
        destructive={
          editingId ? { label: "Delete form", onClick: () => remove(editingId) } : undefined
        }
      >
        <Field label="Name" required>
          <TextInput
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            placeholder="e.g. New KYC - Thailand"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Country" required>
            <TextInput
              value={draft.country}
              onChange={(e) => setDraft({ ...draft, country: e.target.value })}
              placeholder="ID, VN, AE, or Global"
            />
          </Field>
          <Field label="Status">
            <Select
              value={draft.status}
              onChange={(e) =>
                setDraft({ ...draft, status: e.target.value as ConfigStatus })
              }
              options={[
                { label: "Active", value: "active" },
                { label: "Draft", value: "draft" },
                { label: "Retired", value: "retired" },
              ]}
            />
          </Field>
        </div>
        <Field
          label="Languages"
          hint="Comma-separated ISO codes (e.g. en, id, vi, th)"
        >
          <TextInput
            value={draft.languages}
            onChange={(e) => setDraft({ ...draft, languages: e.target.value })}
          />
        </Field>

        <div className="pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-700">
              Sections ({draft.sections.length})
            </span>
            <Button variant="secondary" size="sm" onClick={addSection}>
              <Plus className="w-3 h-3" />
              Add Section
            </Button>
          </div>
          <div className="space-y-3">
            {draft.sections.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-4">
                No sections. Add one to start.
              </p>
            )}
            {draft.sections.map((section, sIdx) => (
              <div key={sIdx} className="p-2.5 bg-slate-50 rounded-md">
                <div className="flex items-center gap-2 mb-2">
                  <input
                    className="h-7 px-2 rounded border border-slate-200 bg-white text-xs flex-1 font-medium"
                    value={section.label}
                    onChange={(e) => updateSection(sIdx, { label: e.target.value })}
                    placeholder="Section label"
                  />
                  <input
                    className="h-7 px-2 rounded border border-slate-200 bg-white text-xs w-32 font-mono"
                    value={section.key}
                    onChange={(e) => updateSection(sIdx, { key: e.target.value })}
                    placeholder="key"
                  />
                  <button
                    onClick={() => removeSection(sIdx)}
                    className="p-1 text-red-500 hover:bg-red-100 rounded"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="space-y-1.5">
                  {section.fields.map((field, fIdx) => (
                    <div key={fIdx} className="p-2 bg-white rounded space-y-1.5 border border-slate-100">
                      <div className="grid grid-cols-2 gap-1.5">
                        <input
                          className="h-7 px-2 rounded border border-slate-200 bg-white text-xs font-mono"
                          value={field.key}
                          onChange={(e) => updateField(sIdx, fIdx, { key: e.target.value })}
                          placeholder="key"
                        />
                        <input
                          className="h-7 px-2 rounded border border-slate-200 bg-white text-xs"
                          value={field.label}
                          onChange={(e) => updateField(sIdx, fIdx, { label: e.target.value })}
                          placeholder="Label"
                        />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <select
                          className="h-7 px-2 rounded border border-slate-200 bg-white text-xs flex-1"
                          value={field.type}
                          onChange={(e) =>
                            updateField(sIdx, fIdx, { type: e.target.value as KYCFormFieldType })
                          }
                        >
                          {FIELD_TYPE_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                        <label className="inline-flex items-center gap-1 text-[10px] text-slate-600">
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={(e) => updateField(sIdx, fIdx, { required: e.target.checked })}
                          />
                          Required
                        </label>
                        <input
                          className="h-7 px-2 rounded border border-slate-200 bg-white text-[10px] w-24"
                          placeholder="countries"
                          value={field.countries?.join(",") ?? ""}
                          onChange={(e) =>
                            updateField(sIdx, fIdx, {
                              countries: e.target.value
                                .split(",")
                                .map((s) => s.trim())
                                .filter(Boolean),
                            })
                          }
                        />
                        <button
                          onClick={() => removeField(sIdx, fIdx)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded"
                          aria-label="Delete field"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => addField(sIdx)}
                  >
                    <Plus className="w-3 h-3" />
                    Add field
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </ConfigDrawer>
    </div>
  );
}
