"use client";

/**
 * Agreement detail page — four-tab editor for one agreement.
 *
 * Tabs:
 *   - Overview    metadata, force re-sign toggle
 *   - Versions    version timeline + body editor per language; draft → publish
 *   - Signing     reading-controls + signing-requirements config + Preview button
 *   - Signatures  audit table of captured signing events
 *
 * The list-page card opens this; from here the operator can author /
 * publish a new version, configure how end users see + sign, and
 * inspect what was actually captured.
 */

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  ClipboardList,
  Eye,
  FileText,
  GitBranch,
  ListChecks,
  Plus,
  Trash2,
  Globe2,
} from "lucide-react";
import { Card, PageHeader, Button } from "@/components/crm/ui";
import { Breadcrumb } from "@/components/crm/layout";
import { Field, TextArea, TextInput } from "@/components/crm/clm/config/ConfigDrawer";
import { clmConfigService } from "@/lib/clm/services";
import { useCurrentStaffName } from "@/hooks/useCurrentStaff";
import { SignFlowPreview } from "@/components/crm/clm/agreements/SignFlowPreview";
import type {
  AgreementContent,
  AgreementVersion,
  ConfigAgreement,
  ReadingControls,
  SignatureRecord,
  SigningRequirements,
} from "@/types/clm";

type TabKey = "overview" | "versions" | "signing" | "signatures";

const TAB_META: Record<
  TabKey,
  { label: string; icon: typeof ListChecks }
> = {
  overview:   { label: "Overview",   icon: ListChecks },
  versions:   { label: "Versions",   icon: GitBranch },
  signing:    { label: "Signing",    icon: ClipboardList },
  signatures: { label: "Signatures", icon: FileText },
};

const VERSION_STATUS_TONES = {
  draft:    "bg-slate-100 text-slate-600",
  active:   "bg-emerald-100 text-emerald-700",
  retired:  "bg-slate-200 text-slate-500",
} as const;

export default function AgreementDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const actor = useCurrentStaffName();

  const [agreement, setAgreement] = useState<ConfigAgreement | null>(null);
  const [signatures, setSignatures] = useState<SignatureRecord[]>([]);
  const [activeVersionId, setActiveVersionId] = useState<string | null>(null);
  const [activeLanguage, setActiveLanguage] = useState<string>("en");
  const [tab, setTab] = useState<TabKey>("overview");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const reload = async () => {
    setLoading(true);
    const list = await clmConfigService.agreements.list();
    const found = list.find((a) => a.id === id) ?? null;
    setAgreement(found);
    if (found) {
      const target =
        found.activeVersionId ?? found.versions[0]?.id ?? null;
      setActiveVersionId((cur) => cur ?? target);
      const sigs = await clmConfigService.agreements.listSignatures({ agreementId: id });
      setSignatures(sigs);
    }
    setLoading(false);
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const activeVersion = useMemo(
    () =>
      agreement?.versions.find((v) => v.id === activeVersionId) ??
      agreement?.versions[0],
    [agreement, activeVersionId]
  );

  // Keep `activeLanguage` valid as the version flips.
  useEffect(() => {
    if (!activeVersion) return;
    const langs = activeVersion.contents.map((c) => c.language);
    if (!langs.includes(activeLanguage)) {
      setActiveLanguage(langs[0] ?? "en");
    }
  }, [activeVersion, activeLanguage]);

  if (loading || !agreement) {
    return (
      <div className="p-6 text-sm text-slate-400">Loading agreement…</div>
    );
  }

  const totalsByVersion = signatures.reduce<Record<string, number>>((acc, s) => {
    acc[s.versionId] = (acc[s.versionId] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-3">
      <Breadcrumb
        items={[
          { label: "CLM Center" },
          { label: "Agreements", href: "/crm/clm/agreements" },
          { label: agreement.name },
        ]}
      />
      <PageHeader
        title={agreement.name}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/crm/clm/agreements")}
              className="inline-flex items-center gap-1 px-2.5 h-9 text-sm text-slate-500 hover:text-slate-900"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            {activeVersion && (
              <Button onClick={() => setPreviewOpen(true)}>
                <Eye className="w-4 h-4" />
                Preview signing flow
              </Button>
            )}
          </div>
        }
      />

      {/* Tabs */}
      <Card padding="none">
        <div className="flex border-b border-slate-100">
          {(Object.entries(TAB_META) as [TabKey, (typeof TAB_META)[TabKey]][]).map(([key, meta]) => {
            const Icon = meta.icon;
            const isActive = tab === key;
            return (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`px-4 py-2.5 text-xs font-medium inline-flex items-center gap-1.5 border-b-2 transition-colors ${
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {meta.label}
                {key === "versions" && (
                  <span className="text-[10px] font-mono tabular-nums text-slate-400 ml-0.5">
                    {agreement.versions.length}
                  </span>
                )}
                {key === "signatures" && (
                  <span className="text-[10px] font-mono tabular-nums text-slate-400 ml-0.5">
                    {signatures.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="p-4">
          {tab === "overview" && (
            <OverviewTab agreement={agreement} actor={actor} onChange={reload} />
          )}
          {tab === "versions" && (
            <VersionsTab
              agreement={agreement}
              activeVersion={activeVersion}
              activeLanguage={activeLanguage}
              setActiveLanguage={setActiveLanguage}
              setActiveVersionId={setActiveVersionId}
              totalsByVersion={totalsByVersion}
              actor={actor}
              saving={saving}
              setSaving={setSaving}
              onChange={reload}
            />
          )}
          {tab === "signing" && activeVersion && (
            <SigningTab
              agreement={agreement}
              version={activeVersion}
              actor={actor}
              onChange={reload}
              openPreview={() => setPreviewOpen(true)}
            />
          )}
          {tab === "signatures" && (
            <SignaturesTab
              agreement={agreement}
              signatures={signatures}
            />
          )}
        </div>
      </Card>

      {activeVersion && (
        <SignFlowPreview
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
          agreement={agreement}
          version={activeVersion}
          defaultLanguage={activeLanguage}
          onSigned={() => {
            reload();
            setTab("signatures");
          }}
        />
      )}
    </div>
  );
}

/* ======================================================================== */
/* Tab: Overview                                                            */
/* ======================================================================== */

function OverviewTab({
  agreement,
  actor,
  onChange,
}: {
  agreement: ConfigAgreement;
  actor: string;
  onChange: () => void;
}) {
  const [forceResign, setForceResign] = useState(agreement.forceResign);
  const [saving, setSaving] = useState(false);

  const toggleForceResign = async () => {
    setSaving(true);
    try {
      const next = !forceResign;
      await clmConfigService.agreements.update(
        { id: agreement.id, forceResign: next },
        actor
      );
      setForceResign(next);
      onChange();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card padding="md">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Metadata
        </h3>
        <dl className="text-sm space-y-1.5">
          <Row label="Type">{agreement.type.replace(/_/g, " ")}</Row>
          <Row label="Country">{agreement.country}</Row>
          <Row label="Active version">
            <span className="font-mono text-blue-600">{agreement.currentVersion}</span>
          </Row>
          <Row label="Languages">
            <span className="inline-flex items-center gap-1 text-slate-600">
              <Globe2 className="w-3 h-3 text-slate-400" />
              {agreement.languages.join(", ") || "—"}
            </span>
          </Row>
          <Row label="Signed">
            <span className="font-mono tabular-nums">{agreement.signedCount}</span>
          </Row>
        </dl>
      </Card>

      <Card padding="md">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Force re-sign
        </h3>
        <p className="text-xs text-slate-500 mb-3 leading-relaxed">
          When enabled, every user who has previously signed an older
          version sees a re-sign banner on next login until they re-sign
          the current active version.
        </p>
        <Button
          variant="secondary"
          size="sm"
          onClick={toggleForceResign}
          disabled={saving}
        >
          {forceResign ? "Disable force re-sign" : "Enable force re-sign"}
        </Button>
        {forceResign && (
          <p className="text-[11px] text-amber-700 mt-2">
            Force re-sign is currently active. Active users see a banner on next login.
          </p>
        )}
      </Card>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <dt className="text-[11px] uppercase tracking-wider text-slate-400 w-28 shrink-0">
        {label}
      </dt>
      <dd className="text-sm text-slate-700">{children}</dd>
    </div>
  );
}

/* ======================================================================== */
/* Tab: Versions                                                            */
/* ======================================================================== */

function VersionsTab({
  agreement,
  activeVersion,
  activeLanguage,
  setActiveLanguage,
  setActiveVersionId,
  totalsByVersion,
  actor,
  saving,
  setSaving,
  onChange,
}: {
  agreement: ConfigAgreement;
  activeVersion?: AgreementVersion;
  activeLanguage: string;
  setActiveLanguage: (lang: string) => void;
  setActiveVersionId: (id: string) => void;
  totalsByVersion: Record<string, number>;
  actor: string;
  saving: boolean;
  setSaving: (b: boolean) => void;
  onChange: () => void;
}) {
  const [body, setBody] = useState<string>("");
  const [versionLabel, setVersionLabel] = useState("v1.0");
  const [changelog, setChangelog] = useState("");
  const [creatingDraft, setCreatingDraft] = useState(false);
  const [newLang, setNewLang] = useState("");

  // Mirror local state to the active version + language whenever they change.
  useEffect(() => {
    if (!activeVersion) return;
    const c = activeVersion.contents.find((x) => x.language === activeLanguage);
    setBody(c?.body ?? "");
    setVersionLabel(activeVersion.version);
    setChangelog(activeVersion.changelog ?? "");
  }, [activeVersion, activeLanguage]);

  if (!activeVersion) return null;

  const isDraft = activeVersion.status === "draft";

  const updateContent = (next: string) => {
    if (!isDraft) return;
    setBody(next);
  };

  const saveDraft = async () => {
    if (!isDraft) return;
    // Uniqueness check — labels must not collide with another version
    // of the same agreement. Operators editing the label by hand can
    // otherwise accidentally create two "v1.1"s in a row.
    const trimmed = versionLabel.trim();
    if (!trimmed) {
      alert("Version label can't be empty.");
      return;
    }
    const collision = agreement.versions.find(
      (v) => v.id !== activeVersion.id && v.version === trimmed
    );
    if (collision) {
      alert(
        `Version "${trimmed}" already exists on this agreement (status: ${collision.status}). Pick a different label.`
      );
      return;
    }
    setSaving(true);
    try {
      const contents: AgreementContent[] = activeVersion.contents.map((c) =>
        c.language === activeLanguage ? { ...c, body } : c
      );
      await clmConfigService.agreements.updateVersion(
        agreement.id,
        activeVersion.id,
        { version: trimmed, changelog, contents },
        actor
      );
      onChange();
    } finally {
      setSaving(false);
    }
  };

  const publish = async () => {
    if (!isDraft) return;
    if (!confirm(`Publish ${versionLabel}? The currently active version (if any) will be retired and signedCount resets.`)) return;

    // Detect major bump: compare the to-be-published label's major
    // number to the currently active version's. Per the convention, a
    // major bump means substantive content changes; prompt the operator
    // to enable force re-sign so existing signers re-acknowledge.
    const activeVer = agreement.versions.find((v) => v.status === "active");
    const targetMajor = Number(versionLabel.match(/^v(\d+)/)?.[1] ?? "0");
    const activeMajor = Number(activeVer?.version.match(/^v(\d+)/)?.[1] ?? "0");
    const isMajorBump = activeVer != null && targetMajor > activeMajor;
    const wantForceResign =
      isMajorBump &&
      !agreement.forceResign &&
      confirm(
        `${versionLabel} is a major bump over ${activeVer!.version}. Enable Force Re-sign so existing signers must re-acknowledge?`
      );

    setSaving(true);
    try {
      // Persist any in-flight edits first.
      const contents: AgreementContent[] = activeVersion.contents.map((c) =>
        c.language === activeLanguage ? { ...c, body } : c
      );
      await clmConfigService.agreements.updateVersion(
        agreement.id,
        activeVersion.id,
        { version: versionLabel, changelog, contents },
        actor
      );
      await clmConfigService.agreements.publishVersion(
        agreement.id,
        activeVersion.id,
        actor
      );
      if (wantForceResign) {
        await clmConfigService.agreements.update(
          { id: agreement.id, forceResign: true },
          actor
        );
      }
      onChange();
    } finally {
      setSaving(false);
    }
  };

  const addLanguage = () => {
    if (!newLang.trim() || !isDraft) return;
    const lang = newLang.trim().toLowerCase();
    if (activeVersion.contents.some((c) => c.language === lang)) return;
    const contents = [...activeVersion.contents, { language: lang, body: "" }];
    clmConfigService.agreements
      .updateVersion(agreement.id, activeVersion.id, { contents }, actor)
      .then(() => {
        setNewLang("");
        setActiveLanguage(lang);
        onChange();
      });
  };

  const removeLanguage = (lang: string) => {
    if (!isDraft) return;
    if (activeVersion.contents.length <= 1) return;
    const contents = activeVersion.contents.filter((c) => c.language !== lang);
    clmConfigService.agreements
      .updateVersion(agreement.id, activeVersion.id, { contents }, actor)
      .then(() => {
        if (activeLanguage === lang) {
          setActiveLanguage(contents[0].language);
        }
        onChange();
      });
  };

  /**
   * Versioning convention (per the simplification PRD):
   *   - **Minor bump** (default): wording / translation fixes. No force re-sign.
   *   - **Major bump** (operator choice): substantive change. The new draft
   *     auto-suggests `forceResign: true` at publish time.
   *   - Operators can still hand-edit the label inside the editor — this
   *     is just a sensible default, not a lock.
   *   - Labels must be unique across the agreement's `versions[]` so two
   *     drafts can't both call themselves `v1.1`.
   */
  function suggestNextLabel(
    existing: string[],
    kind: "minor" | "major"
  ): string {
    // Pull the highest numeric (major, minor) tuple seen across all
    // versions (active, draft, retired) — not just array order.
    let best: { major: number; minor: number } | null = null;
    for (const v of existing) {
      const m = v.match(/^v(\d+)\.(\d+)$/);
      if (!m) continue;
      const t = { major: Number(m[1]), minor: Number(m[2]) };
      if (!best || t.major > best.major || (t.major === best.major && t.minor > best.minor)) {
        best = t;
      }
    }
    if (!best) return "v1.0";
    const candidate =
      kind === "major"
        ? `v${best.major + 1}.0`
        : `v${best.major}.${best.minor + 1}`;
    // Defensive: if the candidate already exists (someone hand-edited a
    // future label), keep bumping the minor until we find a free slot.
    let label = candidate;
    let n = best.minor + (kind === "major" ? 0 : 1);
    while (existing.includes(label)) {
      n += 1;
      label = kind === "major" ? `v${best.major + 1}.${n}` : `v${best.major}.${n}`;
    }
    return label;
  }

  const newDraft = async (kind: "minor" | "major" = "minor") => {
    setCreatingDraft(true);
    try {
      const labels = agreement.versions.map((v) => v.version);
      const nextLabel = suggestNextLabel(labels, kind);
      // Clone the most-recent version as a starting point so the editor
      // isn't empty. Major bumps don't reset content — only the label.
      const last = agreement.versions[0];
      const draft = await clmConfigService.agreements.createVersion(
        agreement.id,
        {
          version: nextLabel,
          contents: last?.contents.map((c) => ({ ...c })) ?? [{ language: "en", body: "" }],
          reading: last?.reading ?? { minReadSeconds: 30, requireScrollToBottom: true },
          signing:
            last?.signing ?? {
              checkbox: true,
              typedName: true,
              handwrittenSignature: true,
              captureIp: true,
              captureGeo: true,
            },
          changelog: kind === "major"
            ? "Major version — substantive change; expect force re-sign on publish."
            : "",
        },
        actor
      );
      setActiveVersionId(draft.id);
      onChange();
    } finally {
      setCreatingDraft(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[260px,1fr] gap-3">
      {/* Left rail — versions timeline */}
      <Card padding="none" className="overflow-hidden h-fit">
        <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 bg-slate-50">
          <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
            History
          </p>
          {/* Two-button split: Minor (default — translation / wording)
              and Major (substantive — auto-suggests force re-sign).
              Hover tooltips show what label will be created. */}
          <div className="inline-flex rounded-md overflow-hidden border border-slate-200">
            <button
              type="button"
              onClick={() => newDraft("minor")}
              disabled={creatingDraft}
              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-white disabled:opacity-50"
              title={`Next: ${suggestNextLabel(
                agreement.versions.map((v) => v.version),
                "minor"
              )} — wording / translation. No force re-sign.`}
            >
              <Plus className="w-3 h-3" />
              Minor
            </button>
            <span className="w-px bg-slate-200" />
            <button
              type="button"
              onClick={() => newDraft("major")}
              disabled={creatingDraft}
              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-amber-700 hover:bg-amber-50 disabled:opacity-50"
              title={`Next: ${suggestNextLabel(
                agreement.versions.map((v) => v.version),
                "major"
              )} — substantive change; expect force re-sign on publish.`}
            >
              Major
            </button>
          </div>
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          {agreement.versions.map((v) => {
            const isActive = v.id === activeVersion.id;
            const total = totalsByVersion[v.id] ?? 0;
            return (
              <button
                key={v.id}
                onClick={() => setActiveVersionId(v.id)}
                className={`w-full text-left px-3 py-2 border-b border-slate-50 transition-colors ${
                  isActive ? "bg-blue-50/60" : "hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono tabular-nums text-blue-600">{v.version}</span>
                  <span className={`text-[9px] uppercase tracking-wider px-1 py-0.5 rounded ${VERSION_STATUS_TONES[v.status]}`}>
                    {v.status}
                  </span>
                  {total > 0 && (
                    <span className="text-[10px] font-mono tabular-nums text-slate-400 ml-auto">
                      {total} sig
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                  {v.changelog || (v.publishedAt ? `Published ${new Date(v.publishedAt).toLocaleDateString()}` : "Draft")}
                </p>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Right pane — body editor */}
      <div className="space-y-3">
        <Card padding="md">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              {isDraft ? (
                <TextInput
                  value={versionLabel}
                  onChange={(e) => setVersionLabel(e.target.value)}
                  className="!h-8 !w-24 font-mono"
                />
              ) : (
                <span className="text-base font-mono tabular-nums text-blue-600">
                  {activeVersion.version}
                </span>
              )}
              <span className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded ${VERSION_STATUS_TONES[activeVersion.status]}`}>
                {activeVersion.status}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {isDraft && (
                <>
                  <Button variant="secondary" size="sm" onClick={saveDraft} disabled={saving}>
                    Save draft
                  </Button>
                  <Button size="sm" onClick={publish} disabled={saving}>
                    <Check className="w-3 h-3" />
                    Publish
                  </Button>
                </>
              )}
            </div>
          </div>

          {!isDraft && (
            <p className="text-[11px] text-slate-500 mb-3 px-2 py-1.5 bg-slate-50 rounded">
              {activeVersion.status === "active"
                ? "Active versions are immutable. Create a new draft to make changes."
                : "Retired versions are immutable for audit; draft a new version to revise."}
            </p>
          )}

          {/* Language tabs */}
          <div className="flex items-center gap-1 mb-2 flex-wrap">
            {activeVersion.contents.map((c) => {
              const isLangActive = c.language === activeLanguage;
              return (
                <span
                  key={c.language}
                  className={`inline-flex items-center gap-1 rounded-md text-xs font-medium border ${
                    isLangActive
                      ? "bg-primary text-white border-primary"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <button
                    onClick={() => setActiveLanguage(c.language)}
                    className="px-2 py-1 uppercase tracking-wider"
                  >
                    {c.language}
                  </button>
                  {isDraft && activeVersion.contents.length > 1 && (
                    <button
                      onClick={() => removeLanguage(c.language)}
                      className={`px-1 py-1 rounded-r ${
                        isLangActive
                          ? "hover:bg-white/20 text-white/80"
                          : "hover:bg-red-50 hover:text-red-600 text-slate-400"
                      }`}
                      title="Remove language"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </span>
              );
            })}
            {isDraft && (
              <span className="inline-flex items-center gap-1 ml-1">
                <input
                  value={newLang}
                  onChange={(e) => setNewLang(e.target.value)}
                  placeholder="ISO"
                  className="h-7 w-14 px-1.5 text-xs font-mono uppercase rounded border border-slate-200"
                  maxLength={3}
                />
                <button
                  onClick={addLanguage}
                  className="h-7 px-2 text-xs text-blue-600 border border-blue-200 rounded hover:bg-blue-50"
                >
                  Add
                </button>
              </span>
            )}
          </div>

          <Field label="Body" hint="Lines starting with `# ` / `## ` are headings.">
            <TextArea
              value={body}
              onChange={(e) => updateContent(e.target.value)}
              rows={18}
              className="font-mono text-xs"
              disabled={!isDraft}
            />
          </Field>

          {isDraft && (
            <div className="mt-3">
              <Field label="Changelog" hint="Shown to operators on the version timeline.">
                <TextArea
                  value={changelog}
                  onChange={(e) => setChangelog(e.target.value)}
                  rows={2}
                />
              </Field>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

/* ======================================================================== */
/* Tab: Signing                                                             */
/* ======================================================================== */

function SigningTab({
  agreement,
  version,
  actor,
  onChange,
  openPreview,
}: {
  agreement: ConfigAgreement;
  version: AgreementVersion;
  actor: string;
  onChange: () => void;
  openPreview: () => void;
}) {
  const isDraft = version.status === "draft";
  const [reading, setReading] = useState<ReadingControls>(version.reading);
  const [signing, setSigning] = useState<SigningRequirements>(version.signing);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setReading(version.reading);
    setSigning(version.signing);
  }, [version]);

  const save = async () => {
    setSaving(true);
    try {
      await clmConfigService.agreements.updateVersion(
        agreement.id,
        version.id,
        { reading, signing },
        actor
      );
      onChange();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card padding="md">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Reading controls
        </h3>
        <div className="space-y-3">
          <Field label="Minimum read time" hint="Seconds before Sign enables. 0 = no countdown.">
            <TextInput
              type="number"
              value={reading.minReadSeconds}
              onChange={(e) =>
                setReading({ ...reading, minReadSeconds: Number(e.target.value) || 0 })
              }
              disabled={!isDraft}
            />
          </Field>
          <label className="inline-flex items-center gap-2 text-xs text-slate-700">
            <input
              type="checkbox"
              checked={reading.requireScrollToBottom}
              onChange={(e) =>
                setReading({ ...reading, requireScrollToBottom: e.target.checked })
              }
              disabled={!isDraft}
            />
            Require user to scroll to the end before signing
          </label>
        </div>
      </Card>

      <Card padding="md">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Signing requirements
        </h3>
        <div className="space-y-2">
          <Toggle
            label="Confirmation checkbox"
            description="“I have read and agree…”"
            checked={signing.checkbox}
            onChange={(v) => setSigning({ ...signing, checkbox: v })}
            disabled={!isDraft}
          />
          <Toggle
            label="Typed name"
            description="User must type their full legal name; matched against KYC."
            checked={signing.typedName}
            onChange={(v) => setSigning({ ...signing, typedName: v })}
            disabled={!isDraft}
          />
          <Toggle
            label="Handwritten signature"
            description="Mouse / touch / stylus capture saved as PNG."
            checked={signing.handwrittenSignature}
            onChange={(v) => setSigning({ ...signing, handwrittenSignature: v })}
            disabled={!isDraft}
          />
          <Toggle
            label="Capture IP"
            description="Stored on the audit row. Required by most regulators."
            checked={signing.captureIp}
            onChange={(v) => setSigning({ ...signing, captureIp: v })}
            disabled={!isDraft}
          />
          <Toggle
            label="Capture geo"
            description="Country derived from the IP."
            checked={signing.captureGeo}
            onChange={(v) => setSigning({ ...signing, captureGeo: v })}
            disabled={!isDraft}
          />
        </div>
      </Card>

      <div className="md:col-span-2 flex items-center justify-between gap-2 px-1">
        <Button variant="secondary" size="sm" onClick={openPreview}>
          <Eye className="w-3 h-3" />
          Preview signing flow
          <ArrowUpRight className="w-3 h-3" />
        </Button>
        {isDraft ? (
          <Button size="sm" onClick={save} disabled={saving}>
            <Check className="w-3 h-3" />
            {saving ? "Saving…" : "Save changes"}
          </Button>
        ) : (
          <p className="text-[11px] text-slate-500">
            This version is {version.status}. Draft a new version to change reading or signing rules.
          </p>
        )}
      </div>
    </div>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label
      className={`flex items-start gap-3 p-2.5 rounded-md border ${
        checked ? "border-primary/40 bg-primary/5" : "border-slate-200 bg-white"
      } ${disabled ? "opacity-60" : "cursor-pointer"}`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="mt-0.5"
      />
      <span className="min-w-0">
        <span className="block text-xs font-semibold text-slate-900">{label}</span>
        <span className="block text-[11px] text-slate-500">{description}</span>
      </span>
    </label>
  );
}

/* ======================================================================== */
/* Tab: Signatures                                                          */
/* ======================================================================== */

function SignaturesTab({
  agreement,
  signatures,
}: {
  agreement: ConfigAgreement;
  signatures: SignatureRecord[];
}) {
  if (signatures.length === 0) {
    return (
      <p className="text-sm text-slate-400 text-center py-12">
        No signatures captured for this agreement yet.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left border-b border-slate-100 text-slate-500">
            <th className="py-2 px-2 font-medium">User</th>
            <th className="py-2 px-2 font-medium">Version</th>
            <th className="py-2 px-2 font-medium">Lang</th>
            <th className="py-2 px-2 font-medium">Signed at</th>
            <th className="py-2 px-2 font-medium">Reading</th>
            <th className="py-2 px-2 font-medium">Captured</th>
            <th className="py-2 px-2 font-medium">IP / Geo</th>
            <th className="py-2 px-2 font-medium">Hash</th>
          </tr>
        </thead>
        <tbody>
          {signatures.map((s) => {
            const v = agreement.versions.find((x) => x.id === s.versionId);
            return (
              <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50/40">
                <td className="py-2 px-2">
                  <p className="text-sm text-slate-900 font-medium">{s.userName}</p>
                  <p className="text-[10px] font-mono text-slate-400">{s.userUid}</p>
                </td>
                <td className="py-2 px-2 font-mono text-blue-600 tabular-nums">
                  {v?.version ?? s.versionId.slice(0, 8)}
                </td>
                <td className="py-2 px-2 uppercase tracking-wider text-[11px]">
                  {s.language}
                </td>
                <td className="py-2 px-2 font-mono tabular-nums text-slate-600">
                  {new Date(s.signedAt).toLocaleString("en-US", {
                    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                  })}
                </td>
                <td className="py-2 px-2">
                  <span className="font-mono tabular-nums text-slate-700">
                    {s.readSeconds}s
                  </span>
                  <span className={`ml-1.5 text-[10px] ${s.scrolledToBottom ? "text-emerald-600" : "text-amber-600"}`}>
                    {s.scrolledToBottom ? "scrolled" : "no scroll"}
                  </span>
                </td>
                <td className="py-2 px-2">
                  <div className="flex flex-wrap items-center gap-1">
                    {s.checkboxChecked && (
                      <span className="px-1 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-medium">☑ checkbox</span>
                    )}
                    {s.typedName && (
                      <span className="px-1 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-medium" title={s.typedName}>
                        typed
                      </span>
                    )}
                    {s.signaturePngBase64 && (
                      <span className="px-1 py-0.5 rounded bg-violet-50 text-violet-700 text-[10px] font-medium">
                        ✎ sign
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-2 px-2">
                  <p className="font-mono text-[10px] text-slate-600 tabular-nums">{s.ipAddress}</p>
                  {s.geoCountry && <p className="text-[10px] text-slate-400">{s.geoCountry}</p>}
                </td>
                <td className="py-2 px-2">
                  <span className="font-mono text-[10px] text-slate-400" title={s.documentHash}>
                    {s.documentHash.slice(0, 14)}…
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
