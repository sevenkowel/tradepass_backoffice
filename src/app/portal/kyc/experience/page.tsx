"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronLeft, Briefcase, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useKYCStore } from "@/lib/kyc/store";
import { useKYCGuard } from "@/lib/kyc/guard-client";
import { getRegionConfig } from "@/lib/kyc/region-config";
import type { ExperienceInfo, EmploymentInfo, EducationInfo, InvestmentExperience, FinancialStatus, ProfessionalKnowledge, Declarations } from "@/lib/kyc/types";

export default function ExperiencePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { setExperienceInfo, kycData, regionCode } = useKYCStore();
  const { checking } = useKYCGuard("experience");

  // Basic form state - quick inline form
  const [employmentStatus, setEmploymentStatus] = useState<string>("employed");
  const [occupation, setOccupation] = useState("");
  const [tradingExperience, setTradingExperience] = useState<string>("less_than_1");
  const [annualIncome, setAnnualIncome] = useState<string>("below_25k");
  const [sourceOfFunds, setSourceOfFunds] = useState("salary");
  const [riskTolerance, setRiskTolerance] = useState<string>("medium");

  if (checking) {
    return <div className="min-h-screen bg-[rgb(var(--tp-bg-rgb))] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[rgb(var(--tp-accent-rgb))]" /></div>;
  }

  const cfg = regionCode ? getRegionConfig(regionCode) : null;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const info: ExperienceInfo = {
      employment: { employmentStatus: employmentStatus as EmploymentInfo["employmentStatus"], occupation },
      education: { highestLevel: "bachelor" },
      investmentExperience: {
        yearsOfExperience: tradingExperience as InvestmentExperience["yearsOfExperience"],
        tradingFrequency: "monthly",
        productsTraded: ["forex"],
        riskTolerance: riskTolerance as InvestmentExperience["riskTolerance"],
      },
      financialStatus: {
        annualIncome: annualIncome as FinancialStatus["annualIncome"],
        netWorth: "below_50k",
        sourceOfFunds,
        investmentObjectives: ["growth"],
      },
      professionalKnowledge: { financeKnowledge: "basic", tradingKnowledge: "basic", hasProfessionalCertification: false, investmentGoal: "growth" },
      declarations: { isUSPerson: false, isPEP: false, isMilitary: false, isFinancialProfessional: false, hasCriminalRecord: false },
    };

    setExperienceInfo(info);
    setIsSubmitting(false);
    router.push("/portal/kyc/agreements");
  };

  return (
    <div className="min-h-screen bg-[rgb(var(--tp-bg-rgb))] py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <Button variant="ghost" onClick={() => router.back()} className="mb-4 -ml-4 text-[rgba(var(--tp-fg-rgb),0.7)]"><ChevronLeft className="w-4 h-4 mr-1" />Back</Button>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-[rgba(var(--tp-accent-rgb),0.1)]"><Briefcase className="w-6 h-6 text-[rgb(var(--tp-accent-rgb))]" /></div>
            <div><h1 className="text-2xl font-bold text-[rgb(var(--tp-fg-rgb))]">个人经验</h1><p className="text-sm text-[rgba(var(--tp-fg-rgb),0.6)]">Step 5 • 填写您的经验和财务状况</p></div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-4">
          {/* Employment */}
          <div className="p-4 rounded-xl bg-[rgba(var(--tp-fg-rgb),0.03)] border border-[rgba(var(--tp-fg-rgb),0.08)] space-y-3">
            <h3 className="text-sm font-medium text-[rgb(var(--tp-fg-rgb))]">就业信息</h3>
            <select value={employmentStatus} onChange={e => setEmploymentStatus(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-[rgba(var(--tp-fg-rgb),0.15)] bg-[rgb(var(--tp-surface-rgb))] text-sm">
              <option value="employed">在职</option><option value="self_employed">自雇</option><option value="retired">退休</option><option value="student">学生</option><option value="unemployed">无业</option>
            </select>
            <input value={occupation} onChange={e => setOccupation(e.target.value)} placeholder="职业/职位" className="w-full h-10 px-3 rounded-lg border border-[rgba(var(--tp-fg-rgb),0.15)] bg-[rgb(var(--tp-surface-rgb))] text-sm" />
          </div>

          {/* Trading Experience */}
          <div className="p-4 rounded-xl bg-[rgba(var(--tp-fg-rgb),0.03)] border border-[rgba(var(--tp-fg-rgb),0.08)] space-y-3">
            <h3 className="text-sm font-medium text-[rgb(var(--tp-fg-rgb))]">交易经验</h3>
            <select value={tradingExperience} onChange={e => setTradingExperience(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-[rgba(var(--tp-fg-rgb),0.15)] bg-[rgb(var(--tp-surface-rgb))] text-sm">
              <option value="none">无经验</option><option value="less_than_1">1年以下</option><option value="1_to_3">1-3年</option><option value="3_to_5">3-5年</option><option value="more_than_5">5年以上</option>
            </select>
            <select value={riskTolerance} onChange={e => setRiskTolerance(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-[rgba(var(--tp-fg-rgb),0.15)] bg-[rgb(var(--tp-surface-rgb))] text-sm">
              <option value="low">低风险</option><option value="medium">中等风险</option><option value="high">高风险</option>
            </select>
          </div>

          {/* Financial */}
          <div className="p-4 rounded-xl bg-[rgba(var(--tp-fg-rgb),0.03)] border border-[rgba(var(--tp-fg-rgb),0.08)] space-y-3">
            <h3 className="text-sm font-medium text-[rgb(var(--tp-fg-rgb))]">财务状况</h3>
            <select value={annualIncome} onChange={e => setAnnualIncome(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-[rgba(var(--tp-fg-rgb),0.15)] bg-[rgb(var(--tp-surface-rgb))] text-sm">
              <option value="below_25k">$25,000 以下</option><option value="25k_to_50k">$25,000-$50,000</option><option value="50k_to_100k">$50,000-$100,000</option><option value="100k_to_250k">$100,000-$250,000</option><option value="above_250k">$250,000 以上</option>
            </select>
            <input value={sourceOfFunds} onChange={e => setSourceOfFunds(e.target.value)} placeholder="资金来源（如：工资、投资收益）" className="w-full h-10 px-3 rounded-lg border border-[rgba(var(--tp-fg-rgb),0.15)] bg-[rgb(var(--tp-surface-rgb))] text-sm" />
          </div>

          <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full h-11 bg-[var(--tp-accent)] text-white">
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "继续 →"}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
