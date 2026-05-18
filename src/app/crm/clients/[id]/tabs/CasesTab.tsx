"use client";

/**
 * CasesTab — 客户「申请」记录（2026-05-16 重新定位）.
 *
 * 语义变化：从「运营审批任务」翻转为「客户主动发起的申请列表」。
 * 同一份 cases 数据，视角不同：
 *   - 旧：CRM 视角，"我需要审批哪些 Case"
 *   - 新：客户视角，"该客户向平台发起过哪些请求；哪些处理了，哪些没处理"
 *
 * 视图结构：
 *   - 顶部 KPI：未处理 / 已处理 / 类型分布
 *   - 分段切换 Pill：[未处理 (open)] [已处理 (closed)] [全部 (all)]
 *   - 列表用 divided rows（和资金/订单列表同风格）
 *
 * 状态分桶规则（见 `bucketOfStatus`）：
 *   - 未处理 (open)   = pending / in_review / escalated
 *   - 已处理 (closed) = approved / rejected
 *
 * 文件名仍叫 CasesTab，因为内部数据流 / Prisma 表名 / detail-mapper
 * 都还是 cases — 改文件名扩散面太大。导出给 OperationsWorkspace
 * 时已经把 label 改成「申请」。
 */

import { useMemo, useState } from "react";
import { Check, X, MessageSquare, ChevronDown, ChevronRight, Clock, ExternalLink } from "lucide-react";
import Link from "next/link";
import type { BaseTabProps } from "@/types/backoffice/client";
import type { CaseItem, CaseStatus, CaseType, ApplicationBucket } from "@/types/backoffice/client-detail";
import { bucketOfStatus } from "@/types/backoffice/client-detail";
import { useT } from "@/lib/i18n/LocaleProvider";

/* ─── 申请类型文案（独立维护，不依赖 i18n key — 避免大改 locale 文件） ─── */
const TYPE_LABEL: Record<CaseType, string> = {
  // 合规
  kyc_review:           "KYC 审核",
  resubmission_review:  "资料重交审核",
  video_verification:   "视频认证",
  kyc_upgrade:          "KYC 等级升级",
  // 资金
  deposit_request:      "入金申请",
  withdrawal_review:    "出金申请",
  // 账户
  leverage_change:      "杠杆调整",
  account_unfreeze:     "账户解冻",
  account_close:        "账户关闭",
  // 业务
  copy_trading_apply:   "跟单开通",
  signal_provider_apply:"信号提供者申请",
  ib_apply:             "IB 合作申请",
  // 营销
  bonus_claim:          "奖金领取",
  promo_claim:          "活动奖励",
  // 服务
  complaint:            "投诉",
  refund_request:       "退款申请",
};

const TYPE_GROUP: Record<CaseType, string> = {
  kyc_review: "合规", resubmission_review: "合规", video_verification: "合规", kyc_upgrade: "合规",
  deposit_request: "资金", withdrawal_review: "资金",
  leverage_change: "账户", account_unfreeze: "账户", account_close: "账户",
  copy_trading_apply: "业务", signal_provider_apply: "业务", ib_apply: "业务",
  bonus_claim: "营销", promo_claim: "营销",
  complaint: "服务", refund_request: "服务",
};

const STATUS_LABEL: Record<CaseStatus, string> = {
  pending:   "待处理",
  in_review: "审核中",
  approved:  "已通过",
  rejected:  "已拒绝",
  escalated: "已升级",
};

export default function CasesTab({ data }: BaseTabProps) {
  const { locale } = useT();
  const dateLocale =
    locale === "zh" ? "zh-CN" : locale === "ja" ? "ja-JP" : locale === "es" ? "es-ES" : "en-US";

  const { cases, user } = data;
  const [bucket, setBucket] = useState<ApplicationBucket | "all">("open");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [typeFilter, setTypeFilter] = useState<"all" | CaseType>("all");

  /* ─── 派生：分桶 + 类型分布 ─── */
  const { open, closed, byType } = useMemo(() => {
    const open: CaseItem[] = [];
    const closed: CaseItem[] = [];
    const byType: Partial<Record<CaseType, number>> = {};
    for (const c of cases) {
      (bucketOfStatus(c.status) === "open" ? open : closed).push(c);
      byType[c.type] = (byType[c.type] ?? 0) + 1;
    }
    return { open, closed, byType };
  }, [cases]);

  /* ─── 当前视图列表（先分桶后类型过滤） ─── */
  const list = useMemo(() => {
    const base = bucket === "open" ? open : bucket === "closed" ? closed : cases;
    if (typeFilter === "all") return base;
    return base.filter((c) => c.type === typeFilter);
  }, [bucket, open, closed, cases, typeFilter]);

  /* ─── 类型分布 — 顶部展示前 4 名 ─── */
  const topTypes = useMemo(() => {
    return (Object.entries(byType) as [CaseType, number][])
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);
  }, [byType]);

  const toggle = (id: string) =>
    setExpanded((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="space-y-5">
      {/* KPI 摘要 */}
      <section className="flex items-baseline justify-between gap-4 flex-wrap">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
          <Stat label="未处理" value={`${open.length}`} tone={open.length > 0 ? "warn" : "default"} />
          <Stat label="已处理" value={`${closed.length}`} tone="ok" />
          <Stat label="累计申请" value={`${cases.length}`} />
        </div>

        <Link
          href={`/crm/clm/cases?search=${encodeURIComponent(user.uid)}`}
          className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
        >
          <ExternalLink className="w-3 h-3" />
          在 CLM 中查看全部
        </Link>
      </section>

      {/* 类型分布 */}
      {topTypes.length > 0 && (
        <section className="flex items-center gap-1.5 flex-wrap text-[11px]">
          <span className="text-slate-400 mr-1">主要申请：</span>
          {topTypes.map(([type, count]) => (
            <button
              key={type}
              onClick={() => setTypeFilter((cur) => (cur === type ? "all" : type))}
              className={`inline-flex items-center gap-1 px-2 h-6 rounded-full border transition-colors ${
                typeFilter === type
                  ? "border-primary bg-blue-50 text-primary"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
              }`}
            >
              <span>{TYPE_LABEL[type]}</span>
              <span className="tabular-nums text-slate-400">{count}</span>
            </button>
          ))}
          {typeFilter !== "all" && (
            <button
              onClick={() => setTypeFilter("all")}
              className="text-[11px] text-slate-400 hover:text-slate-600 ml-1"
            >
              清除筛选
            </button>
          )}
        </section>
      )}

      {/* 分段 Toggle */}
      <section className="border-t border-slate-100 pt-4">
        <div className="flex items-center gap-2">
          {([
            ["open",   `未处理 · ${open.length}`],
            ["closed", `已处理 · ${closed.length}`],
            ["all",    `全部 · ${cases.length}`],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setBucket(key)}
              className={`h-7 px-3 text-xs font-medium rounded-md border transition-colors ${
                bucket === key
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {label}
            </button>
          ))}
          <span className="text-xs text-slate-400 ml-auto tabular-nums">
            {list.length} 条
          </span>
        </div>
      </section>

      {/* 列表 */}
      <section>
        {list.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-400">
            {bucket === "open"
              ? "当前没有未处理的申请"
              : bucket === "closed"
                ? "尚未有已处理的申请"
                : "该客户尚未发起任何申请"}
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {list.map((c) => (
              <ApplicationRow
                key={c.id}
                app={c}
                dateLocale={dateLocale}
                isOpen={expanded.has(c.id)}
                onToggle={() => toggle(c.id)}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

/* ============================================================== */
/* Row                                                            */
/* ============================================================== */

function ApplicationRow({
  app, dateLocale, isOpen, onToggle,
}: {
  app: CaseItem;
  dateLocale: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const isPending = bucketOfStatus(app.status) === "open";
  const ChevronIcon = isOpen ? ChevronDown : ChevronRight;
  const hasDetail = !!app.requestNote || !!app.resolution || app.comments.length > 0;

  return (
    <li className="py-3">
      <div className="flex items-center gap-3 text-sm">
        {/* 折叠箭头 */}
        <button
          onClick={hasDetail ? onToggle : undefined}
          className={`shrink-0 ${hasDetail ? "text-slate-400 hover:text-slate-700" : "text-slate-200 cursor-default"}`}
        >
          <ChevronIcon className="w-3.5 h-3.5" />
        </button>

        {/* 时间 */}
        <span className="shrink-0 w-28 text-xs text-slate-500 tabular-nums">
          {new Date(app.createdAt).toLocaleString(dateLocale, {
            month: "2-digit", day: "2-digit",
            hour: "2-digit", minute: "2-digit",
          })}
        </span>

        {/* 类型 + 分组 */}
        <span className="shrink-0 w-44">
          <div className="text-sm font-medium text-slate-800 truncate">
            {TYPE_LABEL[app.type]}
          </div>
          <div className="text-[10px] text-slate-400 uppercase tracking-wider">
            {TYPE_GROUP[app.type]} · {app.caseId}
          </div>
        </span>

        {/* 金额（如有） */}
        <span className="shrink-0 w-20 text-right text-sm font-medium tabular-nums text-slate-700">
          {app.amount != null
            ? `$${app.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
            : <span className="text-slate-300">—</span>}
        </span>

        {/* 状态 + 处理人 */}
        <span className="flex-1 min-w-0 flex items-center gap-2">
          <StatusBadge status={app.status} />
          <span className="text-xs text-slate-500 truncate">
            {app.reviewer
              ? <>处理人：<span className="text-slate-700">{app.reviewer}</span></>
              : <span className="text-slate-400">未分配</span>}
          </span>
        </span>

        {/* SLA */}
        <span className="shrink-0 text-[10.5px] text-slate-400 flex items-center gap-1 tabular-nums">
          <Clock className="w-3 h-3" />
          {app.sla}
        </span>

        {/* 操作 */}
        <span className="shrink-0 flex items-center gap-1">
          {isPending ? (
            <>
              <button
                className="inline-flex items-center gap-1 h-7 px-2 text-[11px] font-medium rounded-md text-emerald-700 hover:bg-emerald-50"
                title="通过"
              >
                <Check className="w-3 h-3" />
                通过
              </button>
              <button
                className="inline-flex items-center gap-1 h-7 px-2 text-[11px] font-medium rounded-md text-red-700 hover:bg-red-50"
                title="拒绝"
              >
                <X className="w-3 h-3" />
                拒绝
              </button>
            </>
          ) : (
            <span className="text-[10.5px] text-slate-400 tabular-nums">
              {app.closedAt && (
                <>
                  完成于{" "}
                  {new Date(app.closedAt).toLocaleString(dateLocale, {
                    month: "2-digit", day: "2-digit",
                    hour: "2-digit", minute: "2-digit",
                  })}
                </>
              )}
            </span>
          )}
        </span>
      </div>

      {/* 展开详情 */}
      {isOpen && hasDetail && (
        <div className="ml-8 mt-2 pl-3 border-l border-slate-100 space-y-2 text-xs">
          {app.requestNote && (
            <div>
              <span className="text-slate-400 uppercase text-[10px] tracking-wider mr-1.5">客户备注</span>
              <span className="text-slate-700">{app.requestNote}</span>
            </div>
          )}
          {app.resolution && (
            <div>
              <span className="text-slate-400 uppercase text-[10px] tracking-wider mr-1.5">处理结论</span>
              <span className="text-slate-700">{app.resolution}</span>
            </div>
          )}
          {app.comments.length > 0 && (
            <div className="space-y-1 pt-1">
              {app.comments.map((cm) => (
                <div key={cm.id} className="flex items-start gap-2">
                  <MessageSquare className="w-3 h-3 mt-0.5 text-slate-300 shrink-0" />
                  <div>
                    <span className="font-medium text-slate-700">{cm.author}</span>
                    <span className="text-slate-500 ml-1.5">{cm.content}</span>
                    <span className="text-slate-400 ml-1.5 tabular-nums">
                      {new Date(cm.createdAt).toLocaleString(dateLocale, {
                        month: "2-digit", day: "2-digit",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </li>
  );
}

/* ============================================================== */
/* Small components                                               */
/* ============================================================== */

function Stat({ label, value, tone }: {
  label: string;
  value: string;
  tone?: "default" | "ok" | "warn";
}) {
  const t = tone ?? "default";
  const cls = t === "warn" ? "text-amber-700"
    : t === "ok" ? "text-emerald-700"
    : "text-slate-900";
  return (
    <div>
      <div className="text-xs text-slate-500">{label}</div>
      <div className={`text-2xl font-semibold tabular-nums ${cls}`}>{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: CaseStatus }) {
  const config: Record<CaseStatus, { tone: string; label: string }> = {
    pending:   { tone: "bg-amber-50 text-amber-700",   label: STATUS_LABEL.pending   },
    in_review: { tone: "bg-blue-50 text-blue-700",     label: STATUS_LABEL.in_review },
    approved:  { tone: "bg-emerald-50 text-emerald-700", label: STATUS_LABEL.approved  },
    rejected:  { tone: "bg-red-50 text-red-700",       label: STATUS_LABEL.rejected  },
    escalated: { tone: "bg-violet-50 text-violet-700", label: STATUS_LABEL.escalated },
  };
  const c = config[status];
  return (
    <span className={`shrink-0 inline-flex items-center px-1.5 h-5 rounded text-[10.5px] font-medium ${c.tone}`}>
      {c.label}
    </span>
  );
}
