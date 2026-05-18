"use client";

/**
 * Dynamic Rules 页 — 客户自动化规则 (P0-5).
 *
 * 配置「触发事件 → 条件 → 自动动作」的规则。例如：
 *   - 客户净入金 > $50k → 加 VIP 标签 + 通知销售
 *   - 90 天未登录 → 发留存邮件 + 创建跟进任务
 *   - 风险评分 > 70 → 加 HighRisk 标签 + 通知风控
 *
 * 与 Lifecycle 模板的区别：
 *   - Milestone Template：客户旅程节点，达成一次（多数）
 *   - Dynamic Rule：业务事件触发，可重复运行（每次出金都检查）
 */

import { useEffect, useState } from "react";
import {
  Zap, Plus, Power, Edit2, Trash2, Tag, Mail, Bell,
  ListChecks, Users, Lock, Unlock, Webhook, X,
  type LucideIcon,
} from "lucide-react";
import { PageHeader, Card } from "@/components/crm/ui";
import { Breadcrumb } from "@/components/crm/layout";
import type {
  DynamicRule, DynamicRuleEvent, AutoAction, AutoActionType,
} from "@/types/backoffice/lifecycle-templates";
import {
  loadDynamicRules, saveDynamicRules,
} from "@/lib/crm/mock-lifecycle-templates";

const EVENT_META: Record<DynamicRuleEvent, { label: string; color: string }> = {
  client_created:      { label: "客户注册",        color: "bg-blue-100 text-blue-700" },
  kyc_status_changed:  { label: "KYC 状态变更",    color: "bg-violet-100 text-violet-700" },
  deposit_completed:   { label: "入金完成",        color: "bg-emerald-100 text-emerald-700" },
  withdrawal_requested:{ label: "提款申请",        color: "bg-amber-100 text-amber-700" },
  trade_executed:      { label: "交易执行",        color: "bg-indigo-100 text-indigo-700" },
  login_detected:      { label: "登录检测",        color: "bg-slate-100 text-slate-700" },
  risk_score_changed:  { label: "风险评分变化",    color: "bg-red-100 text-red-700" },
  scheduled:           { label: "定时（每天/周）",  color: "bg-rose-100 text-rose-700" },
};

const ACTION_ICON: Record<AutoActionType, LucideIcon> = {
  add_tag:         Tag,
  remove_tag:      Tag,
  send_email:      Mail,
  send_sms:        Mail,
  notify_staff:    Bell,
  create_followup: ListChecks,
  assign_to_team:  Users,
  unlock_feature:  Unlock,
  lock_feature:    Lock,
  trigger_webhook: Webhook,
};

const ACTION_LABEL: Record<AutoActionType, string> = {
  add_tag: "加标签",
  remove_tag: "移除标签",
  send_email: "发邮件",
  send_sms: "发短信",
  notify_staff: "通知员工",
  create_followup: "创建跟进",
  assign_to_team: "分配团队",
  unlock_feature: "解锁功能",
  lock_feature: "锁定功能",
  trigger_webhook: "Webhook",
};

export default function DynamicRulesPage() {
  const [rules, setRules] = useState<DynamicRule[]>([]);
  const [editing, setEditing] = useState<DynamicRule | null>(null);

  useEffect(() => {
    setRules(loadDynamicRules());
  }, []);

  const toggle = (id: string) => {
    setRules((prev) => {
      const next = prev.map((r) => r.id === id ? { ...r, enabled: !r.enabled } : r);
      saveDynamicRules(next);
      return next;
    });
  };

  const remove = (id: string) => {
    if (!confirm("确认删除此规则？删除后不再触发自动动作。")) return;
    setRules((prev) => {
      const next = prev.filter((r) => r.id !== id);
      saveDynamicRules(next);
      return next;
    });
  };

  const addRule = () => {
    const blank: DynamicRule = {
      id: `rule_${Date.now()}`,
      name: "新规则",
      description: "",
      triggerEvent: "deposit_completed",
      conditions: [],
      actions: [],
      enabled: false,
      runCount: 0,
      createdAt: new Date().toISOString(),
      createdBy: "Admin",
    };
    setEditing(blank);
  };

  const save = (rule: DynamicRule) => {
    const exists = rules.some((r) => r.id === rule.id);
    const next = exists ? rules.map((r) => r.id === rule.id ? rule : r) : [...rules, rule];
    setRules(next);
    saveDynamicRules(next);
    setEditing(null);
  };

  const totalRuns = rules.reduce((s, r) => s + r.runCount, 0);
  const enabledCount = rules.filter((r) => r.enabled).length;

  return (
    <>
      <Breadcrumb items={[{ label: "Clients", href: "/crm/clients" }, { label: "动态规则" }]} />

      <PageHeader
        title="动态规则"
        description="基于业务事件触发的自动化规则：加标签 / 发邮件 / 通知员工 / 创建任务"
        actions={
          <button
            onClick={addRule}
            className="inline-flex items-center gap-1.5 px-3 h-9 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold"
          >
            <Plus className="w-4 h-4" />
            新建规则
          </button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <Card className="!p-3">
          <p className="text-[10.5px] uppercase tracking-wider text-slate-500">总规则数</p>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">{rules.length}</p>
        </Card>
        <Card className="!p-3">
          <p className="text-[10.5px] uppercase tracking-wider text-slate-500">已启用</p>
          <p className="text-2xl font-bold text-emerald-700 tabular-nums">{enabledCount}</p>
        </Card>
        <Card className="!p-3">
          <p className="text-[10.5px] uppercase tracking-wider text-slate-500">累计触发</p>
          <p className="text-2xl font-bold text-blue-700 tabular-nums">{totalRuns}</p>
        </Card>
      </div>

      {/* Rules list */}
      <div className="space-y-2">
        {rules.map((rule) => (
          <RuleRow
            key={rule.id}
            rule={rule}
            onToggle={() => toggle(rule.id)}
            onEdit={() => setEditing(rule)}
            onDelete={() => remove(rule.id)}
          />
        ))}
      </div>

      {editing && (
        <RuleEditDialog
          rule={editing}
          onSave={save}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}

function RuleRow({
  rule, onToggle, onEdit, onDelete,
}: {
  rule: DynamicRule;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const meta = EVENT_META[rule.triggerEvent];
  return (
    <div className={`rounded-xl border bg-white p-4 transition-opacity ${rule.enabled ? "border-slate-200" : "border-slate-100 opacity-60"}`}>
      <div className="flex items-start gap-3">
        <button
          onClick={onToggle}
          className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center ${
            rule.enabled ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-slate-100 text-slate-400 hover:bg-slate-200"
          }`}
        >
          <Power className="w-3.5 h-3.5" />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h4 className="text-sm font-semibold text-slate-900">{rule.name}</h4>
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${meta.color}`}>
              {meta.label}
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-2">{rule.description}</p>

          <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
            <Zap className="w-3 h-3 text-amber-500" />
            <span className="text-[10.5px] text-slate-400">条件:</span>
            {rule.conditions.length === 0 ? (
              <span className="text-[10.5px] text-slate-400 italic">无（每次事件都触发）</span>
            ) : rule.conditions.map((c, i) => (
              <span key={i} className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-50 text-amber-700 border border-amber-100">
                {c.field} {c.op} {JSON.stringify(c.value ?? "")}
              </span>
            ))}
          </div>

          {rule.actions.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
              <span className="text-[10.5px] text-slate-400">动作:</span>
              {rule.actions.map((a, i) => {
                const Icon = ACTION_ICON[a.type];
                return (
                  <span key={i} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-slate-50 text-slate-700">
                    <Icon className="w-2.5 h-2.5" />
                    {ACTION_LABEL[a.type]}
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

          <p className="text-[10.5px] text-slate-400 mt-1.5">
            触发 <b>{rule.runCount}</b> 次
            {rule.lastRunAt && ` · 最近 ${new Date(rule.lastRunAt).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}`}
            {rule.createdBy && ` · 创建者 ${rule.createdBy}`}
          </p>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={onEdit} className="p-1.5 rounded hover:bg-slate-100 text-slate-500" title="编辑">
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={onDelete} className="p-1.5 rounded hover:bg-red-50 text-slate-300 hover:text-red-600" title="删除">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function RuleEditDialog({
  rule, onSave, onClose,
}: {
  rule: DynamicRule;
  onSave: (r: DynamicRule) => void;
  onClose: () => void;
}) {
  const [edited, setEdited] = useState<DynamicRule>(rule);

  const addAction = (type: AutoActionType) => {
    setEdited({ ...edited, actions: [...edited.actions, { type, params: {} }] });
  };
  const removeAction = (idx: number) => {
    setEdited({ ...edited, actions: edited.actions.filter((_, i) => i !== idx) });
  };

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm" />
      <div className="fixed left-1/2 top-[5vh] -translate-x-1/2 z-50 w-[640px] max-w-[92vw] bg-white rounded-xl border border-slate-200 shadow-2xl max-h-[90vh] flex flex-col">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">编辑规则</h3>
          <button onClick={onClose}><X className="w-4 h-4 text-slate-400" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="名称">
              <input
                value={edited.name}
                onChange={(e) => setEdited({ ...edited, name: e.target.value })}
                className="w-full h-8 px-2 border border-slate-200 rounded-md text-sm"
              />
            </Field>
            <Field label="触发事件">
              <select
                value={edited.triggerEvent}
                onChange={(e) => setEdited({ ...edited, triggerEvent: e.target.value as DynamicRuleEvent })}
                className="w-full h-8 px-2 border border-slate-200 rounded-md text-sm bg-white"
              >
                {(Object.keys(EVENT_META) as DynamicRuleEvent[]).map((e) => (
                  <option key={e} value={e}>{EVENT_META[e].label}</option>
                ))}
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
            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1.5">过滤条件</p>
            <div className="space-y-1.5">
              {edited.conditions.map((c, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <input
                    value={c.field}
                    onChange={(e) => {
                      const next = [...edited.conditions];
                      next[idx] = { ...next[idx], field: e.target.value };
                      setEdited({ ...edited, conditions: next });
                    }}
                    placeholder="字段路径"
                    className="flex-1 h-7 px-2 border border-slate-200 rounded text-xs font-mono"
                  />
                  <select
                    value={c.op}
                    onChange={(e) => {
                      const next = [...edited.conditions];
                      next[idx] = { ...next[idx], op: e.target.value as typeof c.op };
                      setEdited({ ...edited, conditions: next });
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
                      const next = [...edited.conditions];
                      next[idx] = { ...next[idx], value: e.target.value };
                      setEdited({ ...edited, conditions: next });
                    }}
                    placeholder="值"
                    className="flex-1 h-7 px-2 border border-slate-200 rounded text-xs font-mono"
                  />
                  <button
                    onClick={() => setEdited({ ...edited, conditions: edited.conditions.filter((_, i) => i !== idx) })}
                    className="p-1 text-slate-400 hover:text-red-600"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => setEdited({ ...edited, conditions: [...edited.conditions, { field: "", op: "eq", value: "" }] })}
                className="text-[11px] text-primary hover:underline"
              >
                + 添加条件
              </button>
            </div>
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1.5">自动动作</p>
            <div className="space-y-1.5">
              {edited.actions.map((a, idx) => {
                const Icon = ACTION_ICON[a.type];
                return (
                  <div key={idx} className="flex items-center gap-1.5 p-2 rounded border border-slate-200 bg-slate-50/50">
                    <Icon className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                    <span className="text-xs font-medium text-slate-700 w-20 flex-shrink-0">{ACTION_LABEL[a.type]}</span>
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
                {(Object.keys(ACTION_LABEL) as AutoActionType[]).map((typ) => (
                  <button
                    key={typ}
                    onClick={() => addAction(typ)}
                    className="text-[11px] px-1.5 py-0.5 rounded text-primary hover:bg-blue-50 border border-blue-200"
                  >
                    + {ACTION_LABEL[typ]}
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
