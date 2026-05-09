"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  Wallet,
  BarChart3,
  Tag,
  Loader2,
  TrendingUp,
  CircleDot,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { clientService } from "@/lib/crm/services/client.service";
import type { ClientDetailData } from "@/types/backoffice/client-detail";

export default function ClientProfileLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const clientId = params.id as string;
  const [detail, setDetail] = useState<ClientDetailData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clientId) return;
    clientService.getDetail(clientId).then((data) => {
      setDetail(data);
      setLoading(false);
    });
  }, [clientId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-slate-500">客户不存在</p>
      </div>
    );
  }

  const { user, valueMetrics, lifecycleStages, riskFactors } = detail;

  return (
    <div className="flex gap-6 h-[calc(100vh-80px)]">
      {/* Left Sidebar */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-80 flex-shrink-0 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div className="space-y-4">
          {/* Avatar & Name */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex flex-col items-center">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-20 h-20 rounded-full" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold">
                  {user.name.slice(0, 2).toUpperCase()}
                </div>
              )}
              <h2 className="mt-3 text-lg font-semibold text-slate-900">{user.name}</h2>
              <p className="text-sm text-slate-500 font-mono">{user.uid}</p>
              <div className="mt-2 flex gap-2">
                <StatusBadge status={user.status} />
                <KycBadge status={user.kycStatus} />
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-4 flex gap-2">
              <button className="flex-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium text-slate-700 transition-colors">
                {user.status === "frozen" ? "解冻" : "冻结"}
              </button>
              <button className="flex-1 px-3 py-2 bg-blue-100 hover:bg-blue-200 rounded-lg text-sm font-medium text-blue-700 transition-colors">
                发消息
              </button>
            </div>
          </div>

          {/* Risk Score Card */}
          <div className={`rounded-xl border p-4 ${
            user.riskScore && user.riskScore >= 70 ? "bg-red-50 border-red-200" :
            user.riskScore && user.riskScore >= 40 ? "bg-amber-50 border-amber-200" :
            "bg-emerald-50 border-emerald-200"
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className={`w-4 h-4 ${
                user.riskScore && user.riskScore >= 70 ? "text-red-600" :
                user.riskScore && user.riskScore >= 40 ? "text-amber-600" :
                "text-emerald-600"
              }`} />
              <span className="text-sm font-medium text-slate-700">风险评分</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl font-bold ${
                user.riskScore && user.riskScore >= 70 ? "text-red-600" :
                user.riskScore && user.riskScore >= 40 ? "text-amber-600" :
                "text-emerald-600"
              }`}>
                {user.riskScore ?? 0}
              </span>
              <span className={`text-sm font-medium ${
                user.riskScore && user.riskScore >= 70 ? "text-red-600" :
                user.riskScore && user.riskScore >= 40 ? "text-amber-600" :
                "text-emerald-600"
              }`}>
                {user.riskLevel === "low" ? "低风险" : user.riskLevel === "medium" ? "中风险" : user.riskLevel === "high" ? "高风险" : user.riskLevel === "critical" ? "极高风险" : "-"}
              </span>
            </div>
            {/* 风险因子简览 */}
            {riskFactors.length > 0 && (
              <div className="mt-2 space-y-1">
                {riskFactors.slice(0, 3).map((factor) => (
                  <div key={factor.name} className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-white/60 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          factor.level === "low" ? "bg-emerald-400" : factor.level === "medium" ? "bg-amber-400" : "bg-red-400"
                        }`}
                        style={{ width: `${(factor.score / factor.maxScore) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-500 w-16 text-right">{factor.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Lifecycle Stage */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h3 className="text-sm font-medium text-slate-700 mb-3">生命周期</h3>
            <div className="space-y-0">
              {lifecycleStages.map((stage, index) => (
                <div key={stage.stage} className="flex items-center gap-3 py-2">
                  <div className="flex flex-col items-center">
                    {stage.isCurrent ? (
                      <CircleDot className="w-4 h-4 text-blue-600" />
                    ) : stage.reachedAt ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-slate-300" />
                    )}
                    {index < lifecycleStages.length - 1 && (
                      <div className={`w-px h-5 ${stage.reachedAt ? "bg-emerald-300" : "bg-slate-200"}`} />
                    )}
                  </div>
                  <div className="flex-1">
                    <span className={`text-sm ${stage.isCurrent ? "font-medium text-blue-700" : stage.reachedAt ? "text-slate-700" : "text-slate-400"}`}>
                      {stage.label}
                    </span>
                    {stage.reachedAt && (
                      <span className="text-xs text-slate-400 ml-2">{new Date(stage.reachedAt).toLocaleDateString("zh-CN")}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* User Value Info */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
            <h3 className="text-sm font-medium text-slate-700">用户价值</h3>
            <ValueRow icon={Wallet} label="净入金" value={`$${valueMetrics.netDeposit.toLocaleString()}`} />
            <ValueRow icon={BarChart3} label="当前余额" value={`$${valueMetrics.currentBalance.toLocaleString()}`} />
            <ValueRow icon={TrendingUp} label="净值" value={`$${valueMetrics.equity.toLocaleString()}`} />
            <ValueRow icon={Shield} label="总手数" value={`${valueMetrics.totalLots} Lots`} />
            <ValueRow icon={CircleDot} label="持仓" value={`${valueMetrics.openPositions} 笔`} />
            <ValueRow
              icon={TrendingUp}
              label="总盈亏"
              value={`${valueMetrics.totalProfit >= 0 ? "+" : ""}$${valueMetrics.totalProfit.toLocaleString()} (${valueMetrics.totalProfitPercent}%)`}
              positive={valueMetrics.totalProfit >= 0}
            />
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
            <ValueRow icon={Wallet} label="账户余额" value={`$${user.balance.toLocaleString()}`} />
            <ValueRow icon={BarChart3} label="账户净值" value={`$${user.equity.toLocaleString()}`} />
            <ValueRow icon={Shield} label="风险等级" value={`${user.riskLevel || "-"} ${user.riskScore !== undefined ? `(${user.riskScore})` : ""}`} />
            <ValueRow icon={Shield} label="KYC 状态" value={user.kycStatus} />
          </div>

          {/* Basic Info */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
            <h3 className="text-sm font-medium text-slate-700">基础信息</h3>
            <InfoRow icon={Mail} value={user.email} />
            <InfoRow icon={Phone} value={user.phone} />
            <InfoRow icon={MapPin} value={user.country || "-"} />
            <InfoRow icon={Calendar} value={new Date(user.createdAt).toLocaleDateString("zh-CN")} />
          </div>

          {/* Tags */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h3 className="text-sm font-medium text-slate-700 mb-3">标签</h3>
            <div className="flex flex-wrap gap-2">
              {user.tags.map((tag) => (
                <span key={tag} className="px-2 py-1 bg-slate-100 text-slate-600 rounded-full text-xs">
                  {tag}
                </span>
              ))}
              <button className="px-2 py-1 border border-dashed border-slate-300 text-slate-400 rounded-full text-xs hover:border-slate-400 transition-colors">
                + 添加
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Right Content */}
      <div className="flex-1 overflow-y-auto min-w-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {children}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; bg: string; text: string }> = {
    active: { label: "正常", bg: "bg-emerald-100", text: "text-emerald-700" },
    frozen: { label: "已冻结", bg: "bg-red-100", text: "text-red-700" },
    pending: { label: "待激活", bg: "bg-amber-100", text: "text-amber-700" },
    closed: { label: "已关闭", bg: "bg-slate-100", text: "text-slate-600" },
  };
  const c = config[status] || config.active;
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>{c.label}</span>;
}

function KycBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; bg: string; text: string }> = {
    verified: { label: "KYC 已验证", bg: "bg-emerald-100", text: "text-emerald-700" },
    pending: { label: "KYC 待审", bg: "bg-amber-100", text: "text-amber-700" },
    rejected: { label: "KYC 拒绝", bg: "bg-red-100", text: "text-red-700" },
    not_submitted: { label: "KYC 未提交", bg: "bg-slate-100", text: "text-slate-600" },
  };
  const c = config[status] || config.not_submitted;
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>{c.label}</span>;
}

function ValueRow({
  icon: Icon,
  label,
  value,
  positive,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Icon className="w-4 h-4" />
        {label}
      </div>
      <span className={`text-sm font-semibold ${positive !== undefined ? (positive ? "text-emerald-600" : "text-red-600") : "text-slate-900"}`}>
        {value}
      </span>
    </div>
  );
}

function InfoRow({ icon: Icon, value }: { icon: React.ElementType; value: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon className="w-4 h-4 text-slate-400" />
      <span className="text-slate-600">{value}</span>
    </div>
  );
}
