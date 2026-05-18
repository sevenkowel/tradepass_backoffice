"use client";

/**
 * AiAdviceCard (P2-B1) — AI 辅助建议卡（mock）.
 *
 * 当前是基于风险因子的 deterministic 推断，未来接 LLM 服务时只需要
 * 替换 deriveAdvice 内部实现即可。给审核员"第二意见"参考，不替代决策。
 */

import { Sparkles, ThumbsUp, ThumbsDown, MinusCircle } from "lucide-react";
import type { CLMCase, CaseDetail } from "@/types/clm";

type Verdict = "approve" | "resubmit" | "reject";

interface Advice {
  verdict: Verdict;
  confidence: number; // 0..1
  reasoning: string[];
}

export function AiAdviceCard({ caseItem }: { caseItem: CLMCase & Partial<CaseDetail> }) {
  const advice = deriveAdvice(caseItem);
  if (!advice) return null;

  const tone =
    advice.verdict === "approve" ? "bg-emerald-50 border-emerald-200 text-emerald-700"
    : advice.verdict === "reject" ? "bg-red-50 border-red-200 text-red-700"
    : "bg-amber-50 border-amber-200 text-amber-700";

  const Icon =
    advice.verdict === "approve" ? ThumbsUp
    : advice.verdict === "reject" ? ThumbsDown
    : MinusCircle;

  const label =
    advice.verdict === "approve" ? "Lean Approve"
    : advice.verdict === "reject" ? "Lean Reject"
    : "Suggest Resubmit";

  return (
    <div className={`rounded-lg border p-3 ${tone}`}>
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-3.5 h-3.5" />
        <span className="text-[10px] uppercase tracking-wider font-bold">AI Advice</span>
        <span className="ml-auto inline-flex items-center gap-1 text-[11px] font-semibold">
          <Icon className="w-3 h-3" />
          {label}
          <span className="opacity-70 tabular-nums ml-0.5">
            · {Math.round(advice.confidence * 100)}%
          </span>
        </span>
      </div>
      <ul className="text-[11px] space-y-1 leading-relaxed">
        {advice.reasoning.map((r, i) => (
          <li key={i} className="flex gap-1">
            <span className="opacity-60">•</span>
            <span>{r}</span>
          </li>
        ))}
      </ul>
      <p className="text-[10px] opacity-60 mt-2 italic">
        AI 建议仅供参考，最终决策由审核员负责。
      </p>
    </div>
  );
}

/** Mock 决策引擎 — 完全基于现有风险因子，可被未来真 AI 服务替换。 */
function deriveAdvice(c: CLMCase & Partial<CaseDetail>): Advice | null {
  const score = c.riskAssessment?.riskScore ?? 0;
  const aml = c.riskAssessment?.amlStatus ?? c.amlStatus;
  const factors = c.riskAssessment?.factors ?? [];
  // RiskFactor.level is high/critical/low/medium 等
  const highFactors = factors.filter((f) => f.level === "high" || f.level === "critical");

  const reasoning: string[] = [];

  // 拒绝场景
  if (aml === "hit") {
    reasoning.push("AML 筛查命中名单，按合规策略不予办理");
    return { verdict: "reject", confidence: 0.92, reasoning };
  }
  if (score >= 80) {
    reasoning.push(`综合风险评分 ${score} ≥ 80（critical）`);
    if (highFactors.length > 0) {
      reasoning.push(`命中 ${highFactors.length} 项 high/critical 因子：${highFactors.slice(0, 2).map((f) => f.key).join(" / ")}`);
    }
    return { verdict: "reject", confidence: 0.82, reasoning };
  }

  // 重交场景
  const submitted = c.submittedMaterials ?? [];
  // ThirdPartyVerification.status: "pass" | "review" | "fail"
  const hasFailedDoc = submitted.some((m) => m.verification?.status === "fail");
  const hasReviewDoc = submitted.some((m) => m.verification?.status === "review");
  if (hasFailedDoc || hasReviewDoc) {
    reasoning.push("检测到至少一份证件验证未通过 / 需人工复核");
    reasoning.push("建议要求客户重新提交相关证件，而非直接拒绝");
    return { verdict: "resubmit", confidence: 0.78, reasoning };
  }

  if (score >= 60) {
    reasoning.push(`风险评分 ${score}（high）— 建议人工补充审核或重交`);
    return { verdict: "resubmit", confidence: 0.62, reasoning };
  }

  // 通过场景
  reasoning.push(`风险评分 ${score}（${score < 30 ? "low" : "medium"}），主要信号正常`);
  if (aml === "pass") reasoning.push("AML 筛查通过");
  if (submitted.length > 0 && submitted.every((m) => m.verification?.status === "pass" || !m.verification)) {
    reasoning.push("证件验证未发现异常");
  }
  const confidence = score < 30 ? 0.88 : score < 50 ? 0.74 : 0.65;
  return { verdict: "approve", confidence, reasoning };
}
