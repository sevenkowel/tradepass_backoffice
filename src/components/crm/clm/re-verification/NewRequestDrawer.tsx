"use client";

/**
 * Manual-trigger drawer for Re-Verification.
 *
 * One drawer that condenses PRD §10's six-step flow into a single,
 * scrollable form. The choices are still six logical sections — type,
 * targets, reason, restriction, notification, review — but a stepper
 * adds friction without information density. Reviewers want to see
 * everything at once and scroll back to tweak.
 *
 * Pre-selected users (passed by the caller from a multi-select on a
 * list page) appear as removable chips. The drawer is **self-sufficient**:
 * when no pre-selection exists, the operator can search and add users
 * by UID / name / email inline — `clientService.getByUid` validates the
 * input so an invalid UID can't slip into the request.
 */

import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Eye,
  Loader2,
  Plus,
  Search,
  X,
} from "lucide-react";
import {
  ConfigDrawer,
  Field,
  Select,
  TextArea,
  TextInput,
} from "@/components/crm/clm/config/ConfigDrawer";
import { reVerificationService } from "@/lib/clm/services";
import { clientService } from "@/lib/crm/services/client.service";
import { useCurrentStaff, useCurrentStaffId } from "@/hooks/useCurrentStaff";
import {
  CHANNEL_META,
  CHANNEL_ORDER,
  REASON_LABELS,
  REASON_ORDER,
  RESTRICTION_LEVEL_META,
  RESTRICTION_SCOPE_LABELS,
  RESTRICTION_SCOPE_ORDER,
  TYPE_META,
  TYPE_ORDER,
} from "./bits";
import type {
  NotificationChannel,
  PopupSeverity,
  ReVerificationTemplate,
  ReVerificationType,
  RestrictionLevel,
  RestrictionScope,
  ReVerificationTriggerReason,
} from "@/types/clm";

interface UserPick {
  id: string;
  uid: string;
  name: string;
  email: string;
  country: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  /** Pre-selected users; the drawer will render them as removable chips. */
  preselectedUsers?: UserPick[];
  /** Called after a successful submit — receives the count of created
   *  requests so the page can announce "Created N re-verifications". */
  onCreated?: (count: number) => void;
}

interface DraftState {
  type: ReVerificationType;
  triggerReason: ReVerificationTriggerReason;
  reasonText: string;
  restriction: {
    level: RestrictionLevel;
    scopes: RestrictionScope[];
    effectiveKind: "immediate" | "delayed_hours" | "scheduled_iso";
    delayHours: number;
    scheduledAt: string;
    validityHours: number;
    expirationEscalationLevel: RestrictionLevel | "";
  };
  notification: {
    channels: NotificationChannel[];
    popupSeverity: PopupSeverity;
    noticeFrequency: "once" | "every_login";
    mustAcknowledge: boolean;
    templateId: string;
    customMessage: string;
    ctaUrl: string;
  };
}

const EMPTY_DRAFT: DraftState = {
  type: "re_identity",
  triggerReason: "manual_request",
  reasonText: "",
  restriction: {
    level: "restrict",
    scopes: ["withdrawal"],
    effectiveKind: "immediate",
    delayHours: 24,
    scheduledAt: "",
    validityHours: 24 * 7,
    expirationEscalationLevel: "suspend",
  },
  notification: {
    channels: ["email", "inbox", "login_popup"],
    popupSeverity: "restrict",
    noticeFrequency: "every_login",
    mustAcknowledge: false,
    templateId: "",
    customMessage: "",
    ctaUrl: "/account/verification",
  },
};

export function NewRequestDrawer({
  open,
  onClose,
  preselectedUsers = [],
  onCreated,
}: Props) {
  const staff = useCurrentStaff();
  const staffId = useCurrentStaffId();

  const [users, setUsers] = useState<UserPick[]>(preselectedUsers);
  const [draft, setDraft] = useState<DraftState>(EMPTY_DRAFT);
  const [templates, setTemplates] = useState<ReVerificationTemplate[]>([]);
  const [saving, setSaving] = useState(false);

  // ── Inline user picker state ────────────────────────────────────────
  // The drawer can now be opened with no users; operators type a UID /
  // name / email and we validate it against the client directory before
  // letting the chip land. Suggestions are debounced lookups; pressing
  // Enter on a free-form UID resolves it directly via `getByUid` so
  // operators who already know the UID don't need to wait for a suggestion.
  const [pickerQuery, setPickerQuery] = useState("");
  const [pickerSuggestions, setPickerSuggestions] = useState<UserPick[]>([]);
  const [pickerError, setPickerError] = useState<string | null>(null);
  const [pickerLoading, setPickerLoading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const searchSeq = useRef(0);

  // Preview panel for the popup severity tiers — collapsed by default.
  const [severityPreviewOpen, setSeverityPreviewOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    setUsers(preselectedUsers);
    setDraft(EMPTY_DRAFT);
    setPickerQuery("");
    setPickerSuggestions([]);
    setPickerError(null);
    setSeverityPreviewOpen(false);
    reVerificationService.templates.list().then(setTemplates);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Debounced search — fires for queries ≥ 2 chars.
  useEffect(() => {
    if (!open) return;
    const q = pickerQuery.trim();
    if (q.length < 2) {
      setPickerSuggestions([]);
      setPickerLoading(false);
      return;
    }
    setPickerLoading(true);
    setPickerError(null);
    const seq = ++searchSeq.current;
    const handle = setTimeout(() => {
      clientService
        .list({ search: q, page: 1, pageSize: 8 })
        .then((res) => {
          if (seq !== searchSeq.current) return;
          const already = new Set(users.map((u) => u.id));
          const items: UserPick[] = res.items
            .filter((u) => !already.has(u.id))
            .map((u) => ({
              id: u.id,
              uid: u.uid,
              name: u.name,
              email: u.email,
              country: u.country ?? "—",
            }));
          setPickerSuggestions(items);
          setPickerLoading(false);
        })
        .catch(() => {
          if (seq !== searchSeq.current) return;
          setPickerSuggestions([]);
          setPickerLoading(false);
        });
    }, 220);
    return () => clearTimeout(handle);
  }, [pickerQuery, open, users]);

  const addUser = (u: UserPick) => {
    setUsers((arr) => (arr.some((x) => x.id === u.id) ? arr : [...arr, u]));
    setPickerQuery("");
    setPickerSuggestions([]);
    setPickerError(null);
    setPickerOpen(false);
  };

  const resolveAndAdd = async () => {
    const q = pickerQuery.trim();
    if (!q) return;
    setPickerLoading(true);
    setPickerError(null);
    try {
      // Try UID match first (exact, faster path), fall back to free-text search.
      const byUid = /^\d{4,}$/.test(q) ? await clientService.getByUid(q) : null;
      if (byUid) {
        addUser({
          id: byUid.id,
          uid: byUid.uid,
          name: byUid.name,
          email: byUid.email,
          country: byUid.country ?? "—",
        });
        return;
      }
      const res = await clientService.list({ search: q, page: 1, pageSize: 1 });
      if (res.items.length === 0) {
        setPickerError(`No user matches "${q}".`);
        return;
      }
      const u = res.items[0];
      addUser({
        id: u.id,
        uid: u.uid,
        name: u.name,
        email: u.email,
        country: u.country ?? "—",
      });
    } catch (err) {
      setPickerError(err instanceof Error ? err.message : String(err));
    } finally {
      setPickerLoading(false);
    }
  };

  const removeUser = (id: string) =>
    setUsers((arr) => arr.filter((u) => u.id !== id));

  const toggleScope = (scope: RestrictionScope) =>
    setDraft((d) => ({
      ...d,
      restriction: {
        ...d.restriction,
        scopes: d.restriction.scopes.includes(scope)
          ? d.restriction.scopes.filter((s) => s !== scope)
          : [...d.restriction.scopes, scope],
      },
    }));

  const toggleChannel = (channel: NotificationChannel) =>
    setDraft((d) => ({
      ...d,
      notification: {
        ...d.notification,
        channels: d.notification.channels.includes(channel)
          ? d.notification.channels.filter((c) => c !== channel)
          : [...d.notification.channels, channel],
      },
    }));

  const matchingTemplates = templates.filter(
    (t) => t.verificationType === draft.type && t.active
  );

  const submit = async () => {
    if (users.length === 0 || !draft.reasonText.trim()) return;
    setSaving(true);
    try {
      const userMeta = Object.fromEntries(
        users.map((u) => [u.id, { uid: u.uid, name: u.name, email: u.email, country: u.country }])
      );
      const created = await reVerificationService.requests.create(
        {
          userIds: users.map((u) => u.id),
          type: draft.type,
          triggerReason: draft.triggerReason,
          reasonText: draft.reasonText,
          restriction: {
            level: draft.restriction.level,
            scopes: draft.restriction.scopes,
            effective:
              draft.restriction.effectiveKind === "immediate"
                ? { kind: "immediate" }
                : draft.restriction.effectiveKind === "delayed_hours"
                ? { kind: "delayed_hours", hours: draft.restriction.delayHours }
                : { kind: "scheduled_iso", at: draft.restriction.scheduledAt },
            validityHours: draft.restriction.validityHours,
            expirationEscalation:
              draft.restriction.expirationEscalationLevel
                ? { toLevel: draft.restriction.expirationEscalationLevel as RestrictionLevel }
                : undefined,
          },
          notification: {
            channels: draft.notification.channels,
            popupSeverity: draft.notification.channels.includes("login_popup")
              ? draft.notification.popupSeverity
              : undefined,
            noticeFrequency:
              draft.notification.channels.includes("login_popup") &&
              draft.notification.popupSeverity === "notice"
                ? draft.notification.noticeFrequency
                : undefined,
            mustAcknowledge:
              draft.notification.channels.includes("login_popup") &&
              draft.notification.popupSeverity === "notice"
                ? draft.notification.mustAcknowledge
                : undefined,
            templateId: draft.notification.templateId || undefined,
            customMessage: draft.notification.templateId
              ? undefined
              : draft.notification.customMessage || undefined,
            ctaUrl: draft.notification.ctaUrl || undefined,
          },
        },
        { id: staffId, name: staff?.username ?? "Operator" },
        userMeta
      );
      onCreated?.(created.length);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const valid = users.length > 0 && draft.reasonText.trim().length > 0;
  const summary =
    users.length === 0
      ? "Add at least one user below"
      : users.length === 1
      ? users[0].name
      : `${users.length} users`;

  return (
    <ConfigDrawer
      open={open}
      onClose={onClose}
      onSave={submit}
      saving={saving}
      saveDisabled={!valid}
      saveLabel={
        users.length > 1 ? `Send to ${users.length} users` : "Send"
      }
      title="New Re-Verification"
      subtitle={summary}
      width={560}
    >
      {/* §10.1 — targets */}
      <div>
        <div className="flex items-baseline justify-between mb-2">
          <p className="text-xs font-semibold text-slate-700">
            Targets
            {users.length > 0 && (
              <span className="ml-1.5 text-[10px] font-mono tabular-nums text-slate-400">
                ({users.length})
              </span>
            )}
          </p>
          {users.length === 0 && (
            <span className="text-[10px] text-slate-400">
              Add at least one user
            </span>
          )}
        </div>

        {/* Chip list (existing selections) */}
        {users.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {users.map((u) => (
              <span
                key={u.id}
                className="inline-flex items-center gap-1.5 pl-2 pr-1 py-1 bg-slate-100 rounded-md text-xs"
              >
                <span className="text-slate-700 font-medium truncate max-w-[140px]">
                  {u.name}
                </span>
                <span className="text-[10px] font-mono text-slate-400">{u.uid}</span>
                <button
                  onClick={() => removeUser(u.id)}
                  className="p-0.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                  aria-label={`Remove ${u.name}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Inline picker — search + add */}
        <div className="relative">
          <div className="flex items-center gap-1.5">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={pickerQuery}
                onChange={(e) => {
                  setPickerQuery(e.target.value);
                  setPickerError(null);
                  setPickerOpen(true);
                }}
                onFocus={() => setPickerOpen(true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    // If a suggestion is highlighted / present, prefer it.
                    if (pickerSuggestions.length > 0) {
                      addUser(pickerSuggestions[0]);
                    } else {
                      void resolveAndAdd();
                    }
                  } else if (e.key === "Escape") {
                    setPickerOpen(false);
                  }
                }}
                placeholder="Add by UID, name, or email…"
                className="w-full h-8 pl-8 pr-3 rounded-md border border-slate-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              />
              {pickerLoading && (
                <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 animate-spin" />
              )}
            </div>
            <button
              type="button"
              onClick={() => void resolveAndAdd()}
              disabled={!pickerQuery.trim() || pickerLoading}
              className="h-8 px-2.5 rounded-md text-xs font-medium bg-primary text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              Add
            </button>
          </div>

          {/* Suggestion dropdown */}
          {pickerOpen && pickerQuery.trim().length >= 2 && pickerSuggestions.length > 0 && (
            <div className="absolute z-10 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-56 overflow-y-auto">
              {pickerSuggestions.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => addUser(s)}
                  className="w-full text-left px-3 py-2 hover:bg-blue-50 border-b border-slate-50 last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-900 truncate">{s.name}</span>
                    <span className="text-[10px] font-mono text-slate-400">{s.uid}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate">
                    {s.email} · {s.country}
                  </p>
                </button>
              ))}
            </div>
          )}

          {pickerError && (
            <p className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-red-600">
              <AlertTriangle className="w-3 h-3" />
              {pickerError}
            </p>
          )}
          {pickerQuery.trim().length >= 2 && !pickerLoading && pickerSuggestions.length === 0 && !pickerError && (
            <p className="mt-1.5 text-[11px] text-slate-500">
              No match. Press <kbd className="px-1 py-0.5 bg-slate-100 rounded text-[10px] font-mono">Enter</kbd> to try as an exact UID.
            </p>
          )}
        </div>
      </div>

      {/* §10.2 — type */}
      <div>
        <p className="text-xs font-semibold text-slate-700 mb-2">Verification type</p>
        <div className="grid grid-cols-2 gap-1.5">
          {TYPE_ORDER.map((t) => {
            const meta = TYPE_META[t];
            const Icon = meta.icon;
            const active = draft.type === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setDraft({ ...draft, type: t })}
                className={`flex items-start gap-2 p-2.5 rounded-md border text-left transition-all ${
                  active
                    ? "border-primary bg-primary/5 ring-1 ring-primary/40"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <span className={`w-6 h-6 rounded inline-flex items-center justify-center shrink-0 ${meta.tone}`}>
                  <Icon className="w-3.5 h-3.5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-xs font-semibold text-slate-900">{meta.label}</span>
                  <span className="block text-[10px] text-slate-500 leading-tight">
                    {meta.description}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* §10.3 — reason */}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Trigger reason" required>
          <Select
            value={draft.triggerReason}
            onChange={(e) =>
              setDraft({ ...draft, triggerReason: e.target.value as ReVerificationTriggerReason })
            }
            options={REASON_ORDER.map((r) => ({ label: REASON_LABELS[r], value: r }))}
          />
        </Field>
        <Field label="Validity" hint="Hours the user has to act before escalation">
          <TextInput
            type="number"
            value={draft.restriction.validityHours}
            onChange={(e) =>
              setDraft({
                ...draft,
                restriction: {
                  ...draft.restriction,
                  validityHours: Number(e.target.value) || 0,
                },
              })
            }
          />
        </Field>
      </div>
      <Field label="Justification" required hint="Free text — appears in the audit trail">
        <TextArea
          value={draft.reasonText}
          onChange={(e) => setDraft({ ...draft, reasonText: e.target.value })}
          rows={3}
          placeholder="e.g. Pending withdrawal of $18,000 — video confirmation needed before release."
        />
      </Field>

      {/* §10.4 — restriction */}
      <div className="pt-3 border-t border-slate-100">
        <p className="text-xs font-semibold text-slate-700 mb-2">Restriction</p>
        <div className="grid grid-cols-2 gap-1.5 mb-2">
          {(Object.entries(RESTRICTION_LEVEL_META) as [RestrictionLevel, typeof RESTRICTION_LEVEL_META[RestrictionLevel]][]).map(
            ([level, meta]) => {
              const active = draft.restriction.level === level;
              return (
                <button
                  key={level}
                  type="button"
                  onClick={() =>
                    setDraft({
                      ...draft,
                      restriction: { ...draft.restriction, level },
                    })
                  }
                  className={`p-2 rounded-md border text-left transition-all ${
                    active ? "border-primary bg-primary/5" : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <span className="text-xs font-semibold text-slate-900">
                    {meta.label}
                  </span>
                  <span className="block text-[10px] text-slate-500 mt-0.5">
                    {meta.description}
                  </span>
                </button>
              );
            }
          )}
        </div>
        <p className="text-[10px] text-slate-500 mb-1">Restricted scopes</p>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {RESTRICTION_SCOPE_ORDER.map((s) => {
            const active = draft.restriction.scopes.includes(s);
            return (
              <button
                key={s}
                type="button"
                onClick={() => toggleScope(s)}
                className={`px-2 py-0.5 rounded-md text-[10px] font-medium border transition-colors ${
                  active
                    ? "border-orange-300 bg-orange-50 text-orange-700"
                    : "border-slate-200 text-slate-500 hover:bg-slate-50"
                }`}
              >
                {RESTRICTION_SCOPE_LABELS[s]}
              </button>
            );
          })}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Effective">
            <Select
              value={draft.restriction.effectiveKind}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  restriction: {
                    ...draft.restriction,
                    effectiveKind: e.target.value as DraftState["restriction"]["effectiveKind"],
                  },
                })
              }
              options={[
                { label: "Immediate", value: "immediate" },
                { label: "Delayed (hours)", value: "delayed_hours" },
                { label: "Scheduled (date)", value: "scheduled_iso" },
              ]}
            />
          </Field>
          {draft.restriction.effectiveKind === "delayed_hours" && (
            <Field label="Delay (hours)">
              <TextInput
                type="number"
                value={draft.restriction.delayHours}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    restriction: {
                      ...draft.restriction,
                      delayHours: Number(e.target.value) || 0,
                    },
                  })
                }
              />
            </Field>
          )}
          {draft.restriction.effectiveKind === "scheduled_iso" && (
            <Field label="Effective at">
              <TextInput
                type="datetime-local"
                value={draft.restriction.scheduledAt}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    restriction: { ...draft.restriction, scheduledAt: e.target.value },
                  })
                }
              />
            </Field>
          )}
        </div>
        <div className="mt-3">
          <Field label="Auto-escalation on expiry" hint="Level applied when the validity window lapses">
            <Select
              value={draft.restriction.expirationEscalationLevel}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  restriction: {
                    ...draft.restriction,
                    expirationEscalationLevel: e.target.value as RestrictionLevel | "",
                  },
                })
              }
              options={[
                { label: "(none)",     value: "" },
                { label: "Restrict",   value: "restrict" },
                { label: "Suspend",    value: "suspend" },
              ]}
            />
          </Field>
        </div>
      </div>

      {/* §10.5 — notifications */}
      <div className="pt-3 border-t border-slate-100">
        <p className="text-xs font-semibold text-slate-700 mb-2">Notifications</p>
        <div className="grid grid-cols-2 gap-1.5 mb-3">
          {CHANNEL_ORDER.map((c) => {
            const meta = CHANNEL_META[c];
            const Icon = meta.icon;
            const active = draft.notification.channels.includes(c);
            return (
              <button
                key={c}
                type="button"
                onClick={() => toggleChannel(c)}
                className={`flex items-center gap-2 p-2 rounded-md border text-left transition-all ${
                  active
                    ? "border-primary bg-primary/5"
                    : "border-slate-200 text-slate-500 hover:border-slate-300"
                }`}
              >
                <span className={`w-6 h-6 rounded inline-flex items-center justify-center shrink-0 ${meta.tone}`}>
                  <Icon className="w-3.5 h-3.5" />
                </span>
                <span className="text-xs font-medium text-slate-900">{meta.label}</span>
              </button>
            );
          })}
        </div>
        {draft.notification.channels.includes("login_popup") && (
          <>
            <Field
              label={
                <span className="inline-flex items-center gap-2">
                  Popup severity
                  <button
                    type="button"
                    onClick={() => setSeverityPreviewOpen(true)}
                    className="inline-flex items-center gap-1 text-[10px] font-medium text-blue-600 hover:underline"
                  >
                    <Eye className="w-3 h-3" />
                    View examples
                  </button>
                </span>
              }
              hint="Three-tier ladder — Notice is dismissable, Suspend locks the whole app."
            >
              <Select
                value={draft.notification.popupSeverity}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    notification: {
                      ...draft.notification,
                      popupSeverity: e.target.value as PopupSeverity,
                    },
                  })
                }
                options={[
                  { label: "Notice — dismissable reminder",            value: "notice"   },
                  { label: "Restrict — locks selected scopes",         value: "restrict" },
                  { label: "Suspend — full app lock until verified",   value: "suspend"  },
                ]}
              />
            </Field>
            {/* Sub-knobs only show for the Notice tier — they replace the
                old Warning / Important tiers without adding new ones. */}
            {draft.notification.popupSeverity === "notice" && (
              <div className="grid grid-cols-2 gap-3 mt-2 pl-3 border-l-2 border-blue-100">
                <Field label="Frequency" hint="How often the banner reappears.">
                  <Select
                    value={draft.notification.noticeFrequency}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        notification: {
                          ...draft.notification,
                          noticeFrequency: e.target.value as "once" | "every_login",
                        },
                      })
                    }
                    options={[
                      { label: "Once — dismiss and gone",       value: "once" },
                      { label: "Every login — reminder banner", value: "every_login" },
                    ]}
                  />
                </Field>
                <Field label="Dismiss mode" hint="Acknowledge button preserves the old Important behaviour.">
                  <Select
                    value={draft.notification.mustAcknowledge ? "ack" : "x"}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        notification: {
                          ...draft.notification,
                          mustAcknowledge: e.target.value === "ack",
                        },
                      })
                    }
                    options={[
                      { label: "× — passive close",          value: "x" },
                      { label: "Must click \"I understand\"", value: "ack" },
                    ]}
                  />
                </Field>
              </div>
            )}
          </>
        )}
        <div className="grid grid-cols-2 gap-3 mt-3">
          <Field label="Template" hint="Filter by chosen verification type">
            <Select
              value={draft.notification.templateId}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  notification: { ...draft.notification, templateId: e.target.value },
                })
              }
              options={[
                { label: "(custom message)", value: "" },
                ...matchingTemplates.map((t) => ({
                  label: `${t.name} · ${CHANNEL_META[t.channel].label}`,
                  value: t.id,
                })),
              ]}
            />
          </Field>
          <Field label="CTA URL" hint="{userId} is replaced server-side">
            <TextInput
              value={draft.notification.ctaUrl}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  notification: { ...draft.notification, ctaUrl: e.target.value },
                })
              }
            />
          </Field>
        </div>
        {!draft.notification.templateId && (
          <div className="mt-3">
            <Field label="Custom message">
              <TextArea
                value={draft.notification.customMessage}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    notification: { ...draft.notification, customMessage: e.target.value },
                  })
                }
                rows={3}
                placeholder="e.g. Your ID expires in 5 days. Please update it within 7 days."
              />
            </Field>
          </div>
        )}
      </div>

      {/* §10.6 — review */}
      <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500">
        On submit:
        <ul className="mt-1 space-y-0.5 list-disc pl-4">
          <li>{users.length} user{users.length === 1 ? "" : "s"} notified across {draft.notification.channels.length} channel{draft.notification.channels.length === 1 ? "" : "s"}</li>
          <li>Restriction <strong>{RESTRICTION_LEVEL_META[draft.restriction.level].label}</strong> applied for {draft.restriction.validityHours}h</li>
          <li>A Re-Verification Case opens automatically when each user submits</li>
        </ul>
      </div>

      {/* Severity preview — rendered as a sibling of the drawer body so
          its centered modal isn't visually constrained to the drawer's
          560px width. Mounted only when needed; closes on backdrop click
          / ESC / explicit Close button. */}
      <SeverityPreviewModal
        open={severityPreviewOpen}
        selected={draft.notification.popupSeverity}
        onClose={() => setSeverityPreviewOpen(false)}
      />
    </ConfigDrawer>
  );
}

/** Convenience for triggering the drawer with a single user pre-selected,
 *  used by the floating button on Client Detail / Cases pages. */
export type { UserPick };

/* ─── Severity preview modal ─────────────────────────────────────────────
 *
 * The 5 popup-severity tiers are easy to write down but hard to picture.
 * The modal renders a small mock of what the end user sees at each tier
 * so operators can pick the right one without trial-and-error. The
 * currently selected tier is highlighted so the panel doubles as a
 * confirmation of "yes, this is the look I want".
 *
 * Why a centered modal (vs. inline in the drawer):
 *   - The drawer is 560 px; 5 stacked mocks felt cramped
 *   - A modal lets us go 2-col on wider screens, side-by-side mocks
 *   - Backdrop dismisses cleanly; ESC also works
 */

type FrictionKind = "low" | "medium" | "high";

interface SeverityExample {
  value: PopupSeverity;
  label: string;
  /** Single-line summary: "Can ___" / "Must ___" / "Cannot ___". */
  summary: string;
  /** Coarse friction tier — drives the ✅ / ⚠️ / ❌ icon + colour. */
  friction: FrictionKind;
  tone: string;       // pill background+text
  ring: string;       // selected ring class
  mockTone: string;   // the mocked popup card background
  mockIcon: string;   // small leading icon character
}

const SEVERITY_EXAMPLES: SeverityExample[] = [
  {
    value: "notice",
    label: "Notice",
    summary: "Can dismiss and keep using the app. Frequency + acknowledge are sub-knobs.",
    friction: "low",
    tone: "bg-slate-100 text-slate-700",
    ring: "ring-slate-300",
    mockTone: "bg-white border-slate-200",
    mockIcon: "ℹ",
  },
  {
    value: "restrict",
    label: "Restrict",
    summary: "Selected scopes (deposit / withdrawal / …) are locked. App stays usable.",
    friction: "medium",
    tone: "bg-orange-100 text-orange-700",
    ring: "ring-orange-400",
    mockTone: "bg-orange-50 border-orange-300",
    mockIcon: "🔒",
  },
  {
    value: "suspend",
    label: "Suspend",
    summary: "Cannot use any part of the app until verification is submitted.",
    friction: "high",
    tone: "bg-red-100 text-red-700",
    ring: "ring-red-400",
    mockTone: "bg-red-50 border-red-300",
    mockIcon: "⛔",
  },
];

const FRICTION_META: Record<
  FrictionKind,
  { icon: string; label: string; tone: string }
> = {
  low:    { icon: "✓", label: "Dismissable",      tone: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  medium: { icon: "!", label: "Requires action",  tone: "text-amber-700 bg-amber-50 border-amber-200" },
  high:   { icon: "✕", label: "Hard locked",      tone: "text-red-700 bg-red-50 border-red-200" },
};

/** Mocked scope chips for the Blocking tier — match the language users
 *  see in the actual popup. */
const MOCK_LOCKED_SCOPES = ["Deposit", "Withdrawal"];

function SeverityPreviewModal({
  open,
  selected,
  onClose,
}: {
  open: boolean;
  selected: PopupSeverity;
  onClose: () => void;
}) {
  // ESC closes the modal — matches the drawer's own dismiss behaviour.
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    // z-[90] sits above the drawer panel (z-[80]) so the modal lands on
    // top of it instead of being clipped by the drawer's stacking context.
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Popup severity preview"
      className="fixed inset-0 z-[90] flex items-center justify-center px-4"
    >
      {/* Backdrop — click to close */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close preview"
        className="absolute inset-0 bg-black/40"
      />

      <div className="relative w-full max-w-3xl max-h-[calc(100vh-3rem)] bg-white rounded-xl shadow-2xl flex flex-col">
        <header className="flex items-start justify-between gap-3 px-5 py-3 border-b border-slate-200">
          <div className="min-w-0">
            <p className="text-base font-semibold text-slate-900">
              Popup severity examples
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              What each tier looks like to the end user. The tier you currently
              have selected is highlighted.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 -mr-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {/* Escalation strip — visualises that the tiers are an ordered
              friction ladder, not a free set of choices. The current
              selection gets a marker so the user immediately sees
              "where they are" on that ladder. */}
          <FrictionLadder selected={selected} />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {SEVERITY_EXAMPLES.map((ex) => {
              const isSelected = ex.value === selected;
              const friction = FRICTION_META[ex.friction];
              return (
                <div
                  key={ex.value}
                  className={`rounded-lg border p-3 transition-all ${
                    isSelected
                      ? `border-transparent ring-2 ${ex.ring} bg-white shadow-sm`
                      : "border-slate-200 bg-slate-50/40"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="inline-flex items-center gap-1.5">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${ex.tone}`}>
                        {ex.label}
                      </span>
                      {isSelected && (
                        <span className="text-[10px] text-blue-600 font-semibold uppercase tracking-wider">
                          current
                        </span>
                      )}
                    </span>
                    {/* Friction chip — replaces the cryptic "close: ✕ disabled"
                        with a positive "what the user can do" phrase. */}
                    <span
                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-semibold ${friction.tone}`}
                    >
                      <span className="font-mono leading-none">{friction.icon}</span>
                      {friction.label}
                    </span>
                  </div>

                  {/* Mini popup mock — varies per tier so the user sees
                      the actual UX, not a generic banner with a faded ×. */}
                  <SeverityMock example={ex} />

                  <p className="text-[11px] text-slate-600 leading-relaxed mt-2">
                    {ex.summary}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <footer className="flex items-center justify-end gap-2 px-5 py-3 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="h-8 px-3 rounded-md border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Close
          </button>
        </footer>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Friction Ladder — single-row visualiser of the five tiers                   */
/* ─────────────────────────────────────────────────────────────────────────── */

function FrictionLadder({ selected }: { selected: PopupSeverity }) {
  const selectedIdx = SEVERITY_EXAMPLES.findIndex((e) => e.value === selected);

  return (
    <div className="rounded-lg border border-slate-200 bg-gradient-to-r from-slate-50 via-white to-slate-50 px-3 py-2.5">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
        Friction Ladder · low → high
      </p>
      <div className="flex items-stretch gap-1">
        {SEVERITY_EXAMPLES.map((ex, idx) => {
          const isSelected = idx === selectedIdx;
          const reached = idx <= selectedIdx;
          // Three-tier palette: green → orange → red. Reads as a single
          // progression instead of a 5-step gradient that requires the
          // operator to memorise where the threshold is.
          const reachedTone =
            idx === 0 ? "bg-emerald-300" : idx === 1 ? "bg-orange-400" : "bg-red-500";
          return (
            <div key={ex.value} className="flex-1 min-w-0">
              <div
                className={`h-2 rounded-full ${reached ? reachedTone : "bg-slate-200"}`}
              />
              <div className="mt-1.5 text-center">
                <p
                  className={`text-xs truncate ${
                    isSelected
                      ? "font-bold text-slate-900"
                      : reached
                      ? "text-slate-600"
                      : "text-slate-400"
                  }`}
                >
                  {ex.label}
                </p>
                {isSelected && (
                  <p className="text-[10px] text-blue-600 font-semibold mt-0.5 uppercase tracking-wider">
                    ▲ you are here
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Tier-specific popup mocks                                                   */
/* ─────────────────────────────────────────────────────────────────────────── */

function SeverityMock({ example }: { example: SeverityExample }) {
  const { value, mockTone, mockIcon } = example;

  // Notice — closable banner with a real × icon. Sub-knobs (frequency,
  // mustAcknowledge) are shown as small badges in the corner.
  if (value === "notice") {
    return (
      <div className={`relative rounded-md border px-3 py-2.5 ${mockTone}`}>
        <div className="flex items-start gap-2">
          <span className="text-base leading-none mt-0.5">{mockIcon}</span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-900 truncate">
              Verification required
            </p>
            <p className="text-[11px] text-slate-600 leading-relaxed mt-0.5">
              Please complete the re-verification step.
            </p>
          </div>
          <span className="text-slate-400 text-sm leading-none select-none">×</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-1 text-[10px]">
          <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
            Optional: every login
          </span>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
            Optional: "I understand" CTA
          </span>
        </div>
      </div>
    );
  }

  // Restrict — show the locked scopes as chips so the consequence is concrete.
  if (value === "restrict") {
    return (
      <div className={`relative rounded-md border px-3 py-2.5 ${mockTone}`}>
        <div className="flex items-start gap-2">
          <span className="text-base leading-none mt-0.5">{mockIcon}</span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-900 truncate">
              Verification required
            </p>
            <p className="text-[11px] text-slate-600 leading-relaxed mt-0.5">
              These actions are locked until you verify:
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {MOCK_LOCKED_SCOPES.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-orange-200/60 text-orange-800 text-[10px] font-medium line-through"
                >
                  <span className="font-mono">🔒</span>
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Suspend — full-screen lock overlay. Stretches a backdrop on top of
  // the mock to evoke "the whole app is gated" without rendering a real
  // full-screen modal inside the modal we're already in.
  return (
    <div className={`relative rounded-md border px-3 py-2.5 overflow-hidden ${mockTone}`}>
      {/* Fake dark overlay representing "app locked" */}
      <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-[1px] z-0 pointer-events-none" />
      <div className="relative z-10 flex flex-col items-center text-center py-1">
        <span className="text-xl leading-none">{mockIcon}</span>
        <p className="text-xs font-semibold text-white mt-1">
          Verification required
        </p>
        <p className="text-[11px] text-white/80 leading-relaxed mt-0.5">
          App is locked until you submit verification.
        </p>
        <span className="mt-1.5 inline-flex items-center px-2 py-0.5 rounded-md bg-white text-red-700 text-[10px] font-bold uppercase tracking-wider">
          Submit verification
        </span>
      </div>
    </div>
  );
}
