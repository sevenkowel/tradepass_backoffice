"use client";

import { cn } from "@/lib/utils";
import { GraduationCap, Briefcase, TrendingUp, DollarSign, Users, CheckCircle } from "lucide-react";
import type { ExperienceInfo } from "@/types/clm";

interface ExperienceSectionProps {
  data: ExperienceInfo;
  className?: string;
}

export function ExperienceSection({ data, className }: ExperienceSectionProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {/* Family */}
      <SectionCard icon={<Users className="w-4 h-4" />} title="Family Information">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Marital Status" value={data.family.maritalStatus} />
          <Field label="Dependents" value={String(data.family.dependents)} />
        </div>
      </SectionCard>

      {/* Education & Employment */}
      <SectionCard icon={<GraduationCap className="w-4 h-4" />} title="Education & Employment">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Education Level" value={data.education.level} />
          {data.education.field && <Field label="Field of Study" value={data.education.field} />}
          <Field label="Employment Status" value={data.employment.status} />
          <Field label="Occupation" value={data.employment.occupation} />
          {data.employment.employer && <Field label="Employer" value={data.employment.employer} />}
          {data.employment.position && <Field label="Position" value={data.employment.position} />}
        </div>
      </SectionCard>

      {/* Financial */}
      <SectionCard icon={<DollarSign className="w-4 h-4" />} title="Financial Status">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Annual Income" value={data.financial.annualIncome} />
          <Field label="Net Worth" value={data.financial.netWorth} />
          {data.financial.sourceOfFunds && <Field label="Source of Funds" value={data.financial.sourceOfFunds} />}
        </div>
      </SectionCard>

      {/* Trading Experience */}
      <SectionCard icon={<TrendingUp className="w-4 h-4" />} title="Trading Experience">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Years of Experience" value={data.trading.years} />
          <Field label="Products Traded" value={data.trading.products.join(", ")} />
          {data.trading.tradingFrequency && <Field label="Trading Frequency" value={data.trading.tradingFrequency} />}
          {data.trading.riskTolerance && <Field label="Risk Tolerance" value={data.trading.riskTolerance} />}
          <div className="col-span-2 grid grid-cols-2 gap-2">
            <CheckField label="Leverage Understanding" checked={data.trading.leverageUnderstanding} />
            <CheckField label="Risk Understanding" checked={data.trading.riskUnderstanding} />
          </div>
        </div>
      </SectionCard>

      {/* Declarations */}
      {data.declarations && (
        <SectionCard icon={<CheckCircle className="w-4 h-4" />} title="Declarations">
          <div className="grid grid-cols-2 gap-2">
            <CheckField label="US Person" checked={!data.declarations.isUSPerson} negative />
            <CheckField label="PEP" checked={!data.declarations.isPEP} negative />
            <CheckField label="Military" checked={!data.declarations.isMilitary} negative />
            <CheckField label="Financial Professional" checked={!data.declarations.isFinancialProfessional} negative />
            <CheckField label="Criminal Record" checked={!data.declarations.hasCriminalRecord} negative />
          </div>
        </SectionCard>
      )}
    </div>
  );
}

function SectionCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-gray-500">{icon}</span>
        <h4 className="text-sm font-medium text-gray-700">{title}</h4>
      </div>
      {children}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-lg p-2.5 border border-gray-100">
      <p className="text-[10px] text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="text-sm text-gray-900 font-medium capitalize">{value}</p>
    </div>
  );
}

function CheckField({ label, checked, negative }: { label: string; checked: boolean; negative?: boolean }) {
  return (
    <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-100">
      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
        checked ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
      }`}>
        {checked ? "✓" : "✗"}
      </span>
      <span className="text-xs text-gray-700">{label}</span>
      <span className="text-xs text-gray-400 ml-auto">{checked ? (negative ? "No" : "Yes") : (negative ? "Yes" : "No")}</span>
    </div>
  );
}
