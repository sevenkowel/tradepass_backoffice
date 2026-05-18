"use client";

/**
 * ClientAiAdviceCard — 概览 Tab 顶部的"下一步建议"卡片 (P1-8).
 *
 * 与 case detail 的 AiAdviceCard 同款思路：基于现有信号 deterministic 派生
 * 一条「该客户最值得做的下一步动作」。未来对接 LLM / 推荐引擎时只换内部
 * `deriveAdvice` 实现即可。
 *
 * 不替代审核员决策 —— 只是给"打开就知道做什么"的便捷提示。
 */

import { Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";
import type { ClientDetailData } from "@/types/backoffice/client-detail";

type AdviceTone = "danger" | "warning" | "info" | "success";

interface Advice {
  tone: AdviceTone;
  title: string;
  reasoning: string[];
  cta?: { label: string; href: string };
}

export function ClientAiAdviceCard({ data }: { data: ClientDetailData }) {
  const advice = deriveAdvice(data);
  if (!advice) return null;

  const tone = advice.tone === "danger"  ? "bg-red-50 border-red-200 text-red-700"
    :         advice.tone === "warning"  ? "bg-amber-50 border-amber-200 text-amber-700"
    :         advice.tone === "success"  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
    :                                       "bg-blue-50 border-blue-200 text-blue-700";

  return (
    <div className={`rounded-xl border p-3 ${tone}`}>
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-3.5 h-3.5" />
        <span className="text-[10px] uppercase tracking-wider font-bold">下一步建议</span>
        <span className="ml-auto text-xs font-semibold">{advice.title}</span>
      </div>
      <ul className="text-[11px] space-y-1 leading-relaxed mb-2">
        {advice.reasoning.map((r, i) => (
          <li key={i} className="flex gap-1">
            <span className="opacity-60">•</span>
            <span>{r}</span>
          </li>
        ))}
      </ul>
      {advice.cta && (
        <Link
          href={advice.cta.href}
          className="inline-flex items-center gap-1 text-[11px] font-semibold hover:underline"
        >
          {advice.cta.label}
          <ArrowRight className="w-3 h-3" />
        </Link>
      )}
      <p className="text-[10px] opacity-60 italic mt-2">
        AI 建议仅供参考，最终决策由运营负责。
      </p>
    </div>
  );
}

/** 推断引擎（mock）—— 按"紧急 → 留存 → 价值挖掘"优先级返回一条最佳建议。 */
function deriveAdvice(data: ClientDetailData): Advice | null {
  const { user, kycDocuments, riskFactors, riskRelationships, cases, funds, valueMetrics } = data;

  // ① 紧急 — 风险 / 冻结 / KYC 被拒
  if (user.status === "frozen") {
    return {
      tone: "danger",
      title: "客户账户已冻结",
      reasoning: [
        "客户当前为 frozen 状态，所有交易和资金操作被锁定",
        "建议核对冻结原因并跟进下一步：解冻 / 升级到合规复审 / 关闭账户",
      ],
      cta: { label: "查看权限管理", href: `/crm/clients/${user.id}?tab=profile&sub=permissions` },
    };
  }
  if ((riskFactors ?? []).some((f) => f.level === "high") || user.riskLevel === "critical") {
    return {
      tone: "danger",
      title: "高风险客户需立即审查",
      reasoning: [
        `风险评分 ${user.riskScore ?? "—"} 触发 critical 阈值`,
        "建议先确认风险因子来源（AML / 多账户 / 设备异常），再决定限制策略",
      ],
      cta: { label: "查看风险信号", href: `/crm/clients/${user.id}?tab=risk` },
    };
  }
  if ((riskRelationships ?? []).filter((r) => r.strength >= 0.8).length >= 2) {
    return {
      tone: "warning",
      title: "存在多个强关联账户",
      reasoning: [
        `检测到 ${riskRelationships?.filter((r) => r.strength >= 0.8).length ?? 0} 条强关联（同 IP/设备/银行）`,
        "建议查看关系网络 + 在图谱中确认是否为农场账户群",
      ],
      cta: { label: "查看关系网络", href: `/crm/clients/${user.id}?tab=risk&sub=relationships` },
    };
  }

  // ② 合规 — KYC pending / 即将过期
  if (user.kycStatus === "pending") {
    return {
      tone: "warning",
      title: "KYC 审核积压",
      reasoning: [
        "客户已提交 KYC 资料，正在等待合规审核",
        "建议优先处理避免转化漏斗流失",
      ],
      cta: { label: "审核 KYC", href: `/crm/clients/${user.id}?tab=profile&sub=kyc` },
    };
  }
  const expiringDocs = (kycDocuments ?? []).filter((d) => {
    if (!d.expiryDate) return false;
    const days = (new Date(d.expiryDate).getTime() - Date.now()) / 86400_000;
    return days > 0 && days < 30;
  }).length;
  if (expiringDocs > 0) {
    return {
      tone: "warning",
      title: "KYC 文档即将过期",
      reasoning: [
        `${expiringDocs} 份证件将在 30 天内过期`,
        "建议提前发起 Re-KYC，避免到期后被强制冻结",
      ],
      cta: { label: "查看 KYC", href: `/crm/clients/${user.id}?tab=profile&sub=kyc` },
    };
  }

  // ③ 运营 — 待审申请 / 待审资金
  const pendingApps = (cases ?? []).filter(
    (c) => c.status === "pending" || c.status === "in_review",
  ).length;
  const pendingFunds = (funds ?? []).filter(
    (f) => f.status === "pending" || f.status === "manual_review",
  ).length;
  if (pendingFunds > 0) {
    return {
      tone: "warning",
      title: "有资金记录待审核",
      reasoning: [
        `${pendingFunds} 笔资金记录处于 pending / 人工审核状态`,
        "建议先处理出金审核，避免客户体验问题",
      ],
      cta: { label: "查看资金流水", href: `/crm/clients/${user.id}?tab=funds&sub=transactions` },
    };
  }
  if (pendingApps > 0) {
    return {
      tone: "info",
      title: "有客户申请待处理",
      reasoning: [
        `${pendingApps} 项申请未处理`,
        "建议及时回应避免客户流失",
      ],
      cta: { label: "查看申请", href: `/crm/clients/${user.id}?tab=operations&sub=applications` },
    };
  }

  // ④ 价值挖掘 — 长时间未交易 / 高价值客户
  const lastTradeTs = user.lastLoginAt ? new Date(user.lastLoginAt).getTime() : null;
  const daysSinceLogin = lastTradeTs ? Math.floor((Date.now() - lastTradeTs) / 86400_000) : null;
  if (daysSinceLogin != null && daysSinceLogin > 30) {
    return {
      tone: "info",
      title: "客户处于沉默期",
      reasoning: [
        `距上次登录 ${daysSinceLogin} 天，可能在流失边缘`,
        "建议留存团队主动接触：发送活动邀请 / 一对一沟通",
      ],
      cta: { label: "查看沟通记录", href: `/crm/clients/${user.id}?tab=operations&sub=communications` },
    };
  }
  // 高价值客户可升级 — 用 netDeposit + currentBalance 做近似判断
  const totalValue = (valueMetrics?.netDeposit ?? 0) + (valueMetrics?.currentBalance ?? 0);
  if (totalValue > 50000 && user.level !== "enterprise") {
    return {
      tone: "success",
      title: "高价值客户可升级",
      reasoning: [
        `净入金 + 余额 $${Math.round(totalValue / 1000)}k，已超 VIP 门槛`,
        "建议联系 VIP 客户经理为客户开通专属服务",
      ],
      cta: { label: "查看价值指标", href: `/crm/clients/${user.id}?tab=growth` },
    };
  }

  // ⑤ 兜底：客户状态健康
  return {
    tone: "success",
    title: "客户状态良好",
    reasoning: [
      "无紧急告警 · 无待处理任务 · 风险评分正常",
      "可以做常规跟进或挖掘升级机会",
    ],
  };
}
