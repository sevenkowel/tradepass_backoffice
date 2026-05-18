"use client";

/**
 * Lifecycle 页面 — 客户生命周期管理（2026-05-17 重构）.
 *
 * 包含三个区域：
 *   1. 顶部 KPI: 各阶段客户数（registered / verified / ftd / active / inactive / churn）
 *   2. 客户在各阶段的分布（小卡）
 *   3. 里程碑模板配置（核心新功能 — 替代之前只有分桶展示的版本）
 *      - 14 个内置模板（注册 / KYC / FTD / VIP / 沉默 / 冻结 等）
 *      - 每个模板可配置：title / 触发条件 / 自动动作（加标签 / 发邮件 / 通知 / 解锁功能）
 *      - 启用 / 禁用开关
 *      - 系统模板不能删除，用户可自定义新增
 *
 * 与客户详情页里程碑数据流：
 *   Lifecycle 页面 → 定义 MilestoneTemplate (含 key)
 *                ↓
 *   客户详情 → ClientMilestone (key 来自模板) → 渲染时关联到模板的 title/icon
 */

import { useEffect, useMemo, useState } from "react";
import {
  Users, TrendingUp, UserX, Clock, Settings as SettingsIcon,
  Plus, Tag, Mail, Bell, ListChecks, Zap, Lock, Unlock, Webhook,
  Edit2, Trash2, X, Power, type LucideIcon,
} from "lucide-react";
import { Card, PageHeader } from "@/components/crm/ui";
import { Breadcrumb } from "@/components/crm/layout";
import { clientService } from "@/lib/crm/services/client.service";
import { useT } from "@/lib/i18n/LocaleProvider";
import type { BackofficeUser } from "@/types/backoffice/user";
import type {
  MilestoneTemplate, MilestoneCategory, AutoActionType,
} from "@/types/backoffice/lifecycle-templates";
import {
  loadMilestoneTemplates, saveMilestoneTemplates, MOCK_MILESTONE_TEMPLATES,
} from "@/lib/crm/mock-lifecycle-templates";

const stageColors: Record<string, string> = {
  registered: "bg-slate-100 text-slate-700",
  verified:   "bg-blue-100 text-blue-700",
  ftd:        "bg-emerald-100 text-emerald-700",
  active:     "bg-violet-100 text-violet-700",
  inactive:   "bg-amber-100 text-amber-700",
  churn:      "bg-red-100 text-red-700",
};

const stageIcons: Record<string, LucideIcon> = {
  registered: Users,
  verified: Users,
  ftd: TrendingUp,
  active: TrendingUp,
  inactive: Clock,
  churn: UserX,
};

const CATEGORY_META: Record<MilestoneCategory, { label: string; color: string }> = {
  onboarding:  { label: "入门",  color: "bg-blue-100 text-blue-700" },
  compliance:  { label: "合规",  color: "bg-violet-100 text-violet-700" },
  funding:     { label: "资金",  color: "bg-emerald-100 text-emerald-700" },
  trading:     { label: "交易",  color: "bg-indigo-100 text-indigo-700" },
  growth:      { label: "增长",  color: "bg-amber-100 text-amber-700" },
  retention:   { label: "留存",  color: "bg-rose-100 text-rose-700" },
  risk:        { label: "风险",  color: "bg-red-100 text-red-700" },
};

const ACTION_META: Record<AutoActionType, { label: string; icon: LucideIcon; tone: string }> = {
  add_tag:         { label: "加标签",      icon: Tag,       tone: "text-blue-700" },
  remove_tag:      { label: "移除标签",    icon: Tag,       tone: "text-slate-500" },
  send_email:      { label: "发邮件",      icon: Mail,      tone: "text-emerald-700" },
  send_sms:        { label: "发短信",      icon: Mail,      tone: "text-emerald-700" },
  notify_staff:    { label: "通知员工",    icon: Bell,      tone: "text-amber-700" },
  create_followup: { label: "创建跟进任务", icon: ListChecks, tone: "text-violet-700" },
  assign_to_team:  { label: "分配团队",    icon: Users,     tone: "text-violet-700" },
  unlock_feature:  { label: "解锁功能",    icon: Unlock,    tone: "text-emerald-700" },
  lock_feature:    { label: "锁定功能",    icon: Lock,      tone: "text-red-700" },
  trigger_webhook: { label: "触发 Webhook", icon: Webhook,  tone: "text-slate-700" },
};

export default function LifecyclePage() {
  const { t } = useT();
  const [clients, setClients] = useState<BackofficeUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [templates, setTemplates] = useState<MilestoneTemplate[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<MilestoneTemplate | null>(null);
  const [activeTab, setActiveTab] = useState<"templates" | "stages">("templates");

  const stageKeys = ["registered", "verified", "ftd", "active", "inactive", "churn"];
  const labelOf = (key: string) =>
    key === "ftd" ? t("clients.lifecycle.ftd") : t(`clients.lifecycle.${key}`) ?? key;

  // 加载客户 + 模板
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    clientService.list({ pageSize: 500 })
      .then((res) => {
        if (!cancelled) setClients(res.items ?? []);
      })
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    setTemplates(loadMilestoneTemplates());
    return () => { cancelled = true; };
  }, []);

  const stageCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of clients) {
      const stage = c.lifecycleStage ?? "registered";
      counts[stage] = (counts[stage] ?? 0) + 1;
    }
    return counts;
  }, [clients]);

  const templatesByCategory = useMemo(() => {
    const map: Partial<Record<MilestoneCategory, MilestoneTemplate[]>> = {};
    for (const tpl of templates) {
      if (!map[tpl.category]) map[tpl.category] = [];
      map[tpl.category]!.push(tpl);
    }
    return map;
  }, [templates]);

  const updateTemplate = (next: MilestoneTemplate) => {
    setTemplates((prev) => {
      const updated = prev.map((tpl) => tpl.id === next.id ? next : tpl);
      saveMilestoneTemplates(updated);
      return updated;
    });
  };

  const toggleEnabled = (id: string) => {
    setTemplates((prev) => {
      const next = prev.map((tpl) => tpl.id === id ? { ...tpl, enabled: !tpl.enabled } : tpl);
      saveMilestoneTemplates(next);
      return next;
    });
  };

  const deleteTemplate = (id: string) => {
    if (!confirm("确认删除该里程碑模板？关联的客户里程碑显示将受影响。")) return;
    setTemplates((prev) => {
      const next = prev.filter((tpl) => tpl.id !== id);
      saveMilestoneTemplates(next);
      return next;
    });
  };

  const resetToDefaults = () => {
    if (!confirm("恢复全部内置模板到出厂状态？你自定义的模板会保留，但内置模板的修改会丢失。")) return;
    const customs = templates.filter((tpl) => !tpl.builtIn);
    const next = [...MOCK_MILESTONE_TEMPLATES, ...customs];
    setTemplates(next);
    saveMilestoneTemplates(next);
  };

  const addCustomTemplate = () => {
    const blank: MilestoneTemplate = {
      id: `tpl_custom_${Date.now()}`,
      key: `custom_${Date.now()}`,
      title: "新里程碑",
      description: "",
      category: "growth",
      icon: "rocket",
      weight: "medium",
      trigger: { conditions: [], once: true },
      actions: [],
      enabled: false,
      order: templates.length + 1,
      builtIn: false,
    };
    setEditingTemplate(blank);
  };

  return (
    <>
      <Breadcrumb items={[
        { label: "Clients", href: "/crm/clients" },
        { label: t("clients.lifecycle.title") ?? "生命周期" },
      ]} />

      <PageHeader
        title="客户生命周期"
        description="管理客户旅程的关键节点 + 触发条件 + 自动动作"
      />

      {/* Tab 切换 */}
      <div className="bg-white rounded-xl border border-slate-200 p-1 mb-3 inline-flex">
        <button
          onClick={() => setActiveTab("templates")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "templates" ? "bg-blue-50 text-primary" : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <SettingsIcon className="w-4 h-4 inline-block mr-1.5 -mt-0.5" />
          里程碑模板
          <span className="ml-2 text-[10px] tabular-nums text-slate-400">{templates.length}</span>
        </button>
        <button
          onClick={() => setActiveTab("stages")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "stages" ? "bg-blue-50 text-primary" : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Users className="w-4 h-4 inline-block mr-1.5 -mt-0.5" />
          客户阶段分布
        </button>
      </div>

      {activeTab === "stages" && (
        <Card>
          {loading ? (
            <p className="text-slate-400 text-sm py-8 text-center">加载中…</p>
          ) : error ? (
            <p className="text-red-600 text-sm py-8 text-center">{error}</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {stageKeys.map((key) => {
                const Icon = stageIcons[key];
                const count = stageCounts[key] ?? 0;
                const total = clients.length;
                const pct = total === 0 ? 0 : Math.round((count / total) * 100);
                return (
                  <div key={key} className={`rounded-xl border border-slate-200 p-3 ${stageColors[key]}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="w-3.5 h-3.5" />
                      <span className="text-xs font-semibold">{labelOf(key)}</span>
                    </div>
                    <div className="text-2xl font-bold tabular-nums">{count}</div>
                    <div className="text-[10.5px] opacity-70 mt-0.5">{pct}% of total</div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {activeTab === "templates" && (
        <>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-slate-500">
              {templates.filter((tpl) => tpl.enabled).length} 启用 · {templates.length} 总数 ·
              {" "}{templates.filter((tpl) => tpl.builtIn).length} 内置 · {templates.filter((tpl) => !tpl.builtIn).length} 自定义
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={resetToDefaults}
                className="h-8 px-3 text-xs font-medium rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              >
                恢复默认
              </button>
              <button
                onClick={addCustomTemplate}
                className="h-8 px-3 text-xs font-bold rounded-md bg-blue-600 text-white hover:bg-blue-700 inline-flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                自定义里程碑
              </button>
            </div>
          </div>

          {(Object.keys(CATEGORY_META) as MilestoneCategory[]).map((cat) => {
            const inCat = templatesByCategory[cat] ?? [];
            if (inCat.length === 0) return null;
            const meta = CATEGORY_META[cat];
            return (
              <div key={cat} className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${meta.color}`}>
                    {meta.label}
                  </span>
                  <span className="text-[10.5px] text-slate-400 tabular-nums">{inCat.length} 项</span>
                </div>
                <div className="space-y-2">
                  {inCat.sort((a, b) => a.order - b.order).map((tpl) => (
                    <TemplateRow
                      key={tpl.id}
                      template={tpl}
                      onEdit={() => setEditingTemplate(tpl)}
                      onToggle={() => toggleEnabled(tpl.id)}
                      onDelete={tpl.builtIn ? undefined : () => deleteTemplate(tpl.id)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </>
      )}

      {/* 编辑 Dialog */}
      {editingTemplate && (
        <TemplateEditDialog
          template={editingTemplate}
          onSave={(next) => {
            if (templates.some((tpl) => tpl.id === next.id)) {
              updateTemplate(next);
            } else {
              const list = [...templates, next];
              setTemplates(list);
              saveMilestoneTemplates(list);
            }
            setEditingTemplate(null);
          }}
          onClose={() => setEditingTemplate(null)}
        />
      )}
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Template row                                                                 */
/* ─────────────────────────────────────────────────────────────────────────── */

function TemplateRow({
  template, onEdit, onToggle, onDelete,
}: {
  template: MilestoneTemplate;
  onEdit: () => void;
  onToggle: () => void;
  onDelete?: () => void;
}) {
  const tpl = template;
  return (
    <div className={`rounded-lg border bg-white p-3 transition-opacity ${tpl.enabled ? "border-slate-200" : "border-slate-100 opacity-60"}`}>
      <div className="flex items-start gap-3">
        <button
          onClick={onToggle}
          className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
            tpl.enabled ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-slate-100 text-slate-400 hover:bg-slate-200"
          }`}
          title={tpl.enabled ? "禁用此里程碑" : "启用此里程碑"}
        >
          <Power className="w-3.5 h-3.5" />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-sm font-semibold text-slate-900">{tpl.title}</h4>
            <span className="text-[10px] font-mono text-slate-400">{tpl.key}</span>
            {tpl.builtIn && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-500">内置</span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{tpl.description}</p>

          <div className="mt-2 flex items-center gap-1.5 flex-wrap">
            <Zap className="w-3 h-3 text-amber-500 flex-shrink-0" />
            <span className="text-[10.5px] text-slate-400">触发:</span>
            {tpl.trigger.conditions.length === 0 ? (
              <span className="text-[10.5px] text-slate-400 italic">未配置</span>
            ) : tpl.trigger.conditions.map((c, i) => (
              <span key={i} className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-50 text-amber-700 border border-amber-100">
                {c.field} {c.op} {c.value === undefined ? "" : JSON.stringify(c.value)}
              </span>
            ))}
          </div>

          {tpl.actions.length > 0 && (
            <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
              <span className="text-[10.5px] text-slate-400">动作:</span>
              {tpl.actions.map((a, i) => {
                const meta = ACTION_META[a.type];
                const Icon = meta.icon;
                return (
                  <span key={i} className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-slate-50 ${meta.tone}`}>
                    <Icon className="w-2.5 h-2.5" />
                    {meta.label}
                    {Object.keys(a.params).length > 0 && (
                      <span className="text-slate-400 font-mono ml-0.5">
                        {Object.entries(a.params).map(([k, v]) => `${k}=${v}`).join(",")}
                      </span>
                    )}
                  </span>
                );
              })}
            </div>
          )}

          {(tpl.recentTriggers != null || tpl.lastTriggeredAt) && (
            <p className="text-[10.5px] text-slate-400 mt-2">
              {tpl.recentTriggers ?? 0} 次命中
              {tpl.lastTriggeredAt && ` · 最近 ${new Date(tpl.lastTriggeredAt).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}`}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={onEdit}
            className="p-1.5 rounded hover:bg-slate-100 text-slate-500"
            title="编辑"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          {onDelete && (
            <button
              onClick={onDelete}
              className="p-1.5 rounded hover:bg-red-50 text-slate-300 hover:text-red-600"
              title="删除"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Template edit dialog                                                         */
/* ─────────────────────────────────────────────────────────────────────────── */

function TemplateEditDialog({
  template, onSave, onClose,
}: {
  template: MilestoneTemplate;
  onSave: (next: MilestoneTemplate) => void;
  onClose: () => void;
}) {
  const [edited, setEdited] = useState<MilestoneTemplate>(template);

  const addAction = (type: AutoActionType) => {
    setEdited({
      ...edited,
      actions: [...edited.actions, { type, params: {} }],
    });
  };
  const removeAction = (idx: number) => {
    setEdited({
      ...edited,
      actions: edited.actions.filter((_, i) => i !== idx),
    });
  };

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm" />
      <div className="fixed left-1/2 top-[5vh] -translate-x-1/2 z-50 w-[640px] max-w-[92vw] bg-white rounded-xl border border-slate-200 shadow-2xl max-h-[90vh] flex flex-col">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">
            {template.builtIn ? "编辑内置里程碑" : "编辑自定义里程碑"}
          </h3>
          <button onClick={onClose}><X className="w-4 h-4 text-slate-400" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="名称 (title)">
              <input
                value={edited.title}
                onChange={(e) => setEdited({ ...edited, title: e.target.value })}
                className="w-full h-8 px-2 border border-slate-200 rounded-md text-sm"
              />
            </Field>
            <Field label="Key (技术 ID)">
              <input
                value={edited.key}
                disabled={template.builtIn}
                onChange={(e) => setEdited({ ...edited, key: e.target.value })}
                className="w-full h-8 px-2 border border-slate-200 rounded-md text-sm font-mono disabled:bg-slate-50 disabled:text-slate-500"
              />
            </Field>
            <Field label="分类">
              <select
                value={edited.category}
                onChange={(e) => setEdited({ ...edited, category: e.target.value as MilestoneCategory })}
                className="w-full h-8 px-2 border border-slate-200 rounded-md text-sm bg-white"
              >
                {(Object.keys(CATEGORY_META) as MilestoneCategory[]).map((c) => (
                  <option key={c} value={c}>{CATEGORY_META[c].label}</option>
                ))}
              </select>
            </Field>
            <Field label="权重">
              <select
                value={edited.weight}
                onChange={(e) => setEdited({ ...edited, weight: e.target.value as "low" | "medium" | "high" })}
                className="w-full h-8 px-2 border border-slate-200 rounded-md text-sm bg-white"
              >
                <option value="low">low</option>
                <option value="medium">medium</option>
                <option value="high">high</option>
              </select>
            </Field>
          </div>

          <Field label="描述">
            <textarea
              value={edited.description}
              onChange={(e) => setEdited({ ...edited, description: e.target.value })}
              rows={2}
              className="w-full px-2 py-1.5 border border-slate-200 rounded-md text-sm resize-none"
            />
          </Field>

          <div>
            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1.5">
              触发条件 — 满足全部即视为达成
            </p>
            <div className="space-y-1.5">
              {edited.trigger.conditions.map((c, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <input
                    value={c.field}
                    onChange={(e) => {
                      const next = [...edited.trigger.conditions];
                      next[idx] = { ...next[idx], field: e.target.value };
                      setEdited({ ...edited, trigger: { ...edited.trigger, conditions: next } });
                    }}
                    placeholder="字段 (user.kycStatus)"
                    className="flex-1 h-7 px-2 border border-slate-200 rounded text-xs font-mono"
                  />
                  <select
                    value={c.op}
                    onChange={(e) => {
                      const next = [...edited.trigger.conditions];
                      next[idx] = { ...next[idx], op: e.target.value as typeof c.op };
                      setEdited({ ...edited, trigger: { ...edited.trigger, conditions: next } });
                    }}
                    className="h-7 px-1.5 border border-slate-200 rounded text-xs bg-white"
                  >
                    {["eq", "ne", "gt", "gte", "lt", "lte", "in", "exists", "elapsed_days"].map((op) => (
                      <option key={op} value={op}>{op}</option>
                    ))}
                  </select>
                  <input
                    value={c.value == null ? "" : String(c.value)}
                    onChange={(e) => {
                      const next = [...edited.trigger.conditions];
                      next[idx] = { ...next[idx], value: e.target.value };
                      setEdited({ ...edited, trigger: { ...edited.trigger, conditions: next } });
                    }}
                    placeholder="值"
                    className="flex-1 h-7 px-2 border border-slate-200 rounded text-xs font-mono"
                  />
                  <button
                    onClick={() => {
                      const next = edited.trigger.conditions.filter((_, i) => i !== idx);
                      setEdited({ ...edited, trigger: { ...edited.trigger, conditions: next } });
                    }}
                    className="p-1 text-slate-400 hover:text-red-600"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => setEdited({
                  ...edited,
                  trigger: { ...edited.trigger, conditions: [...edited.trigger.conditions, { field: "", op: "eq", value: "" }] },
                })}
                className="text-[11px] text-primary hover:underline"
              >
                + 添加条件
              </button>
            </div>
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1.5">
              自动动作 — 达成时触发
            </p>
            <div className="space-y-1.5">
              {edited.actions.map((a, idx) => {
                const meta = ACTION_META[a.type];
                const Icon = meta.icon;
                return (
                  <div key={idx} className="flex items-center gap-1.5 p-2 rounded border border-slate-200 bg-slate-50/50">
                    <Icon className={`w-3.5 h-3.5 ${meta.tone} flex-shrink-0`} />
                    <span className="text-xs font-medium text-slate-700 w-20 flex-shrink-0">{meta.label}</span>
                    <input
                      value={Object.entries(a.params).map(([k, v]) => `${k}=${v}`).join(", ")}
                      onChange={(e) => {
                        const params: Record<string, string> = {};
                        e.target.value.split(",").forEach((pair) => {
                          const [k, v] = pair.split("=").map((s) => s.trim());
                          if (k) params[k] = v ?? "";
                        });
                        const next = [...edited.actions];
                        next[idx] = { ...next[idx], params };
                        setEdited({ ...edited, actions: next });
                      }}
                      placeholder="key=value, key2=value2"
                      className="flex-1 h-6 px-1.5 border border-slate-200 rounded text-xs font-mono bg-white"
                    />
                    <button onClick={() => removeAction(idx)} className="p-1 text-slate-400 hover:text-red-600">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-[11px] text-slate-400">添加动作：</span>
                {(Object.keys(ACTION_META) as AutoActionType[]).map((typ) => (
                  <button
                    key={typ}
                    onClick={() => addAction(typ)}
                    className="text-[11px] px-1.5 py-0.5 rounded text-primary hover:bg-blue-50 border border-blue-200"
                  >
                    + {ACTION_META[typ].label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-end gap-2">
          <button onClick={onClose} className="h-8 px-3 text-xs font-medium rounded-md text-slate-600 hover:bg-slate-50">
            取消
          </button>
          <button
            onClick={() => onSave(edited)}
            className="h-8 px-4 text-xs font-bold rounded-md bg-blue-600 text-white hover:bg-blue-700"
          >
            保存
          </button>
        </div>
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}
