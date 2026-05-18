"use client";

/**
 * Case 内容渲染器 — 根据 case.type 路由到对应的内容视图。
 *
 *   - KYC / EDD / 其他   → 文档列表 + 共享底部区（experience / agreements / declarations）
 *   - Liveness           → 活体识别结果 + 选拍对比
 *   - POA                → 地址证明（地址对比 + 文档预览）
 *   - Video verification → 视频回放 + checklist
 *   - Agreement signing  → 协议签署明细
 *
 * 2026-05-17 (P1-G2/G3)：每种 case.type 顶部增加 ReviewHintBanner，
 * 提醒审核员"这一类 case 主要看什么"——经验沉淀，避免新人遗漏。
 */

import { useState } from "react";
import {
  ChevronDown, ChevronRight, CheckCircle2, XCircle, Play, User, Info,
} from "lucide-react";
import type {
  CLMCase, CaseDetail, CLMCaseType,
  LivenessResult, POADetail, VideoVerificationDetail,
} from "@/types/clm";
import { DocumentPreview } from "@/components/crm/clm/DocumentPreview";
import { ExperienceSection } from "@/components/crm/clm/ExperienceSection";
import { AgreementSection } from "@/components/crm/clm/AgreementSection";
import { DisclaimerSection } from "@/components/crm/clm/DisclaimerSection";
import { VerificationChip } from "@/components/crm/clm/popovers/VerificationChip";
import { InfoRow, Collapsible, fmtDate } from "@/components/crm/clm/case-detail/bits";

export type DocMaterials = NonNullable<CaseDetail["submittedMaterials"]>;

/* ─────────────────────────────────────────────────────────────────────────── */
/* Review hint banner — per case.type "what to check" reminder                 */
/* ─────────────────────────────────────────────────────────────────────────── */

const REVIEW_HINTS: Record<CLMCaseType, { title: string; points: string[] }> = {
  kyc: {
    title: "KYC review checklist",
    points: [
      "证件正反面是否清晰，四角完整、无遮挡",
      "OCR 字段（姓名 / DOB / 证件号）与用户提交一致",
      "证件未过期，签发国与申报国一致",
      "活体 / 自拍与证件人像匹配",
    ],
  },
  poa: {
    title: "Proof-of-address checklist",
    points: [
      "文档日期在最近 3 个月内",
      "提取的地址与用户申报地址一致",
      "证件类型在白名单（水电账单 / 银行月结单 / 政府信函）",
    ],
  },
  liveness: {
    title: "Liveness review checklist",
    points: [
      "Confidence ≥ 80 通常可直接通过",
      "确认是真实活体而非照片 / 视频回放",
      "面部与证件照人像匹配",
    ],
  },
  video_verification: {
    title: "Video verification checklist",
    points: [
      "完整观看视频，每项 checklist 都要标记",
      "口语提问回答一致，无照本宣科迹象",
      "证件实物与上传文件吻合",
    ],
  },
  edd: {
    title: "Enhanced Due Diligence (EDD)",
    points: [
      "审核资金来源 / 财富来源是否合理",
      "核查实益拥有人、PEP 关系",
      "高净值客户需补充评估职业 / 行业风险",
    ],
  },
  source_of_wealth: {
    title: "Source of Wealth (SoW)",
    points: [
      "资金来源说明与申报职业 / 收入一致",
      "如有大额一次性入金，需要佐证文件",
      "审核近 3-6 个月资金流向有无异常",
    ],
  },
  agreement_signing: {
    title: "Agreement signing",
    points: [
      "确认所有协议条目已签署",
      "签署时间合理，IP / 设备来源可信",
      "如有修订条款，确认签署版本是最新",
    ],
  },
  manual_review: {
    title: "Manual review",
    points: [
      "查看 Timeline 中本案的触发原因（自动流程为何升级到人工）",
      "重点核对触发节点对应的字段或材料",
      "决策时附说明，便于回溯",
    ],
  },
  re_verification: {
    title: "Re-Verification",
    points: [
      "对比客户上一次通过审核时提交的材料",
      "本次重新提交的材料只覆盖发生变化的字段",
      "如为系统强制重新认证，关注触发规则（如证件过期 / 风险评分变化）",
    ],
  },
};

export function ReviewHintBanner({ type }: { type: CLMCaseType }) {
  const hint = REVIEW_HINTS[type];
  if (!hint) return null;
  return (
    <details className="group rounded-lg border border-blue-200 bg-blue-50/60 overflow-hidden">
      <summary className="px-3 py-2 cursor-pointer list-none flex items-center gap-2 text-xs text-blue-800 hover:bg-blue-100/60">
        <Info className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
        <span className="font-semibold">{hint.title}</span>
        <span className="ml-auto text-[10.5px] text-blue-600/80 group-open:hidden">展开提示</span>
        <span className="ml-auto text-[10.5px] text-blue-600/80 hidden group-open:inline">收起</span>
      </summary>
      <ul className="px-3 pb-2.5 pt-1 text-[11.5px] text-blue-800/90 space-y-0.5 leading-relaxed">
        {hint.points.map((p, i) => (
          <li key={i} className="flex gap-1.5">
            <span className="text-blue-400 flex-shrink-0">•</span>
            <span>{p}</span>
          </li>
        ))}
      </ul>
    </details>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Public — dispatch on case.type                                              */
/* ─────────────────────────────────────────────────────────────────────────── */

export function TypeBasedContent({
  caseItem, docMaterials, isKYC,
}: {
  caseItem: CLMCase & Partial<CaseDetail>;
  docMaterials: DocMaterials;
  isKYC: boolean;
}) {
  const [videoChecks, setVideoChecks] = useState<Record<string, boolean | null>>(() => {
    const init: Record<string, boolean | null> = {};
    if (caseItem.videoVerification?.checklist) {
      for (const ch of caseItem.videoVerification.checklist) init[ch.id] = ch.passed;
    }
    return init;
  });

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    experience: true,
    agreements: true,
    declarations: true,
  });
  const allExpanded = Object.values(expandedSections).every(Boolean);
  const toggleAll = () => {
    const v = !allExpanded;
    setExpandedSections({ experience: v, agreements: v, declarations: v });
  };

  const hint = <ReviewHintBanner type={caseItem.type} />;

  switch (caseItem.type) {
    case "liveness":
      return (
        <div className="space-y-3">
          {hint}
          <LivenessContent result={caseItem.livenessResult} />
        </div>
      );

    case "poa":
      return (
        <div className="space-y-3">
          {hint}
          <POAContent detail={caseItem.poaDetail} materials={docMaterials} />
        </div>
      );

    case "video_verification":
      return (
        <div className="space-y-3">
          {hint}
          <VideoContent
            detail={caseItem.videoVerification}
            checks={videoChecks}
            onCheck={(id, v) => setVideoChecks((p) => ({ ...p, [id]: v }))}
          />
        </div>
      );

    case "agreement_signing":
      return caseItem.agreements && caseItem.agreements.length > 0 ? (
        <div className="space-y-3">
          {hint}
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Agreement Signing Detail</h2>
            <AgreementSection data={caseItem.agreements} />
          </section>
        </div>
      ) : null;

    default: // kyc, edd, source_of_wealth, manual_review, re_verification
      return (
        <>
          {hint}
          {docMaterials.length > 0 && (
            <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Submitted Documents</h2>
              <div className="space-y-3">
                {docMaterials.map(m => (
                  <div key={m.id} className="space-y-2">
                    <div className="flex items-baseline justify-between gap-2 flex-wrap">
                      <div className="flex items-baseline gap-2 flex-wrap min-w-0">
                        <p className="text-sm font-semibold text-slate-800">{m.label}</p>
                        <p className="text-[11px] text-slate-400 font-mono tabular-nums">
                          Submitted {new Date(m.submittedAt).toLocaleDateString()}
                        </p>
                      </div>
                      {m.verification && <VerificationChip verification={m.verification} />}
                    </div>
                    <DocumentPreview material={m} showUserComparison={!!m.userSubmittedFields} />
                  </div>
                ))}
              </div>
            </section>
          )}

          <SharedBottomSections
            caseItem={caseItem}
            expandedSections={expandedSections}
            setExpandedSections={setExpandedSections}
            allSectionsExpanded={allExpanded}
            toggleAllSections={toggleAll}
            showExperience={isKYC}
            showAgreements={isKYC}
            showDeclarations={isKYC}
          />
        </>
      );
  }
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Bottom collapsibles (experience / agreements / declarations)                */
/* ─────────────────────────────────────────────────────────────────────────── */

function SharedBottomSections({
  caseItem, expandedSections, setExpandedSections, allSectionsExpanded, toggleAllSections,
  showExperience, showAgreements, showDeclarations,
}: {
  caseItem: CLMCase & Partial<CaseDetail>;
  expandedSections: Record<string, boolean>;
  setExpandedSections: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  allSectionsExpanded: boolean;
  toggleAllSections: () => void;
  showExperience: boolean;
  showAgreements: boolean;
  showDeclarations: boolean;
}) {
  const tog = (key: string) =>
    setExpandedSections((p) => ({ ...p, [key]: !p[key] }));

  const hasSections =
    (showExperience && !!caseItem.experience) ||
    (showAgreements && !!caseItem.agreements?.length) ||
    (showDeclarations && !!caseItem.disclaimer);

  if (!hasSections) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Review Details</span>
        <button onClick={toggleAllSections}
          className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors">
          {allSectionsExpanded ? "Collapse All" : "Expand All"}
          {allSectionsExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </button>
      </div>
      <div className="space-y-3">
        {showExperience && caseItem.experience && (
          <Collapsible title="Experience Questionnaire" open={expandedSections.experience} onToggle={() => tog("experience")}>
            <ExperienceSection data={caseItem.experience} />
          </Collapsible>
        )}
        {showAgreements && caseItem.agreements && caseItem.agreements.length > 0 && (
          <Collapsible title="Agreements" open={expandedSections.agreements} onToggle={() => tog("agreements")}>
            <AgreementSection data={caseItem.agreements} />
          </Collapsible>
        )}
        {showDeclarations && caseItem.disclaimer && (
          <Collapsible title="Declarations" open={expandedSections.declarations} onToggle={() => tog("declarations")}>
            <DisclaimerSection data={caseItem.disclaimer} />
          </Collapsible>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Liveness                                                                    */
/* ─────────────────────────────────────────────────────────────────────────── */

function LivenessContent({ result }: { result?: LivenessResult }) {
  if (!result) return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
      <p className="text-sm text-slate-400 text-center py-6">Loading liveness result…</p>
    </section>
  );

  const passed = result.confidenceScore >= 80;
  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
      <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Liveness Result</h2>
      <div className="flex items-start gap-6">
        <div className="text-center shrink-0">
          <div className={`w-20 h-20 rounded-full border-4 flex flex-col items-center justify-center ${
            passed ? "border-emerald-400 bg-emerald-50" : "border-red-400 bg-red-50"
          }`}>
            <span className={`text-2xl font-bold ${passed ? "text-emerald-700" : "text-red-700"}`}>
              {result.confidenceScore}
            </span>
            <span className={`text-[10px] font-medium ${passed ? "text-emerald-600" : "text-red-600"}`}>/ 100</span>
          </div>
          <p className={`text-xs font-semibold mt-2 ${passed ? "text-emerald-600" : "text-red-600"}`}>
            {passed ? "✓ Passed" : "✗ Failed"}
          </p>
        </div>
        <div className="flex-1 space-y-2 text-xs">
          <InfoRow label="Provider" value={result.provider} />
          <InfoRow label="Attempts" value={`${result.attemptCount}`} />
          <InfoRow label="Completed" value={fmtDate(result.completedAt)} />
          <InfoRow label="Pass threshold" value="80" />
        </div>
      </div>

      {(result.selfieImageUrl || result.documentFaceImageUrl) && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <p className="text-xs font-semibold text-slate-600 mb-3">Face Match</p>
          <div className="grid grid-cols-2 gap-3">
            {result.selfieImageUrl && (
              <div>
                <p className="text-[11px] text-slate-500 mb-1.5">Liveness Selfie</p>
                <div className="aspect-square rounded-lg bg-slate-100 flex items-center justify-center text-slate-300 overflow-hidden">
                  <User className="w-12 h-12" />
                </div>
              </div>
            )}
            {result.documentFaceImageUrl && (
              <div>
                <p className="text-[11px] text-slate-500 mb-1.5">ID Photo</p>
                <div className="aspect-square rounded-lg bg-slate-100 flex items-center justify-center text-slate-300 overflow-hidden">
                  <User className="w-12 h-12" />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* POA (Proof of Address)                                                      */
/* ─────────────────────────────────────────────────────────────────────────── */

function POAContent({ detail, materials }: {
  detail?: POADetail;
  materials: DocMaterials;
}) {
  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
      <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Proof of Address Review</h2>
      {detail && (
        <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
          <InfoRow label="Document Type" value={detail.submittedDocumentType} />
          {detail.documentIssuedDate && (
            <InfoRow label="Issued" value={fmtDate(detail.documentIssuedDate)} />
          )}
          <div className="col-span-2">
            <InfoRow label="Declared Address" value={detail.declaredAddress} />
          </div>
          {detail.extractedAddress && (
            <div className="col-span-2">
              <InfoRow label="Extracted Address" value={detail.extractedAddress} />
            </div>
          )}
          {detail.addressMatch !== null && detail.addressMatch !== undefined && (
            <div className="col-span-2">
              <InfoRow label="Address Match" value={
                <span className={`font-semibold ${detail.addressMatch ? "text-emerald-600" : "text-red-600"}`}>
                  {detail.addressMatch ? "✓ Matches" : "✗ Mismatch"}
                </span>
              } />
            </div>
          )}
        </div>
      )}
      {materials.length > 0 && (
        <div className="space-y-3 border-t border-slate-100 pt-3">
          {materials.map(m => (
            <div key={m.id} className="space-y-2">
              <div className="flex items-baseline justify-between gap-2 flex-wrap">
                <p className="text-sm font-semibold text-slate-800">{m.label}</p>
                {m.verification && <VerificationChip verification={m.verification} />}
              </div>
              <DocumentPreview material={m} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Video verification                                                          */
/* ─────────────────────────────────────────────────────────────────────────── */

function VideoContent({ detail, checks, onCheck }: {
  detail?: VideoVerificationDetail;
  checks: Record<string, boolean | null>;
  onCheck: (id: string, v: boolean | null) => void;
}) {
  const allDone = detail?.checklist.every((c) => checks[c.id] !== null) ?? false;
  const allPassed = allDone && detail?.checklist.every((c) => checks[c.id] === true);

  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
      <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Video Verification Review</h2>
      <div className="rounded-lg bg-slate-900 aspect-video flex items-center justify-center mb-4 relative overflow-hidden">
        <div className="text-center">
          <Play className="w-10 h-10 text-white/40 mx-auto mb-2" />
          <p className="text-xs text-white/40">
            {detail?.durationSeconds
              ? `${Math.floor(detail.durationSeconds / 60)}:${String(detail.durationSeconds % 60).padStart(2, "0")}`
              : "—"}
          </p>
        </div>
        {detail?.recordedAt && (
          <p className="absolute bottom-2 right-3 text-[10px] text-white/30">
            Recorded {fmtDate(detail.recordedAt)}
          </p>
        )}
      </div>
      {detail?.checklist && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-slate-700">Review Checklist</p>
            {allDone && (
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                allPassed ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
              }`}>
                {allPassed ? "✓ All passed" : "✗ Issues found"}
              </span>
            )}
          </div>
          <div className="space-y-1.5">
            {detail.checklist.map((item) => {
              const v = checks[item.id] ?? null;
              return (
                <div key={item.id} className="flex items-center gap-3 py-1.5 px-2 rounded-lg hover:bg-slate-50">
                  <span className="text-xs text-slate-700 flex-1">{item.label}</span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => onCheck(item.id, true)}
                      className={`p-1 rounded ${v === true ? "text-emerald-600" : "text-slate-300 hover:text-emerald-500"}`}
                      title="Pass">
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => onCheck(item.id, false)}
                      className={`p-1 rounded ${v === false ? "text-red-600" : "text-slate-300 hover:text-red-500"}`}
                      title="Fail">
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          {!allDone && (
            <p className="text-[11px] text-slate-400 mt-2">Mark each item before making a decision.</p>
          )}
        </div>
      )}
    </section>
  );
}
