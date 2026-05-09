"use client";

import {
  Ban,
  Lock,
  RefreshCw,
  Settings,
  Shield,
  MessageSquare,
  Ticket,
  Bell,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Link2,
} from "lucide-react";
import type { BackofficeUser } from "@/types/backoffice/user";

interface Props {
  user: BackofficeUser;
}

export default function ClientDetailHeader({ user }: Props) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
      {/* 基础信息 */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
        <InfoItem icon={Mail} label="邮箱" value={user.email} />
        <InfoItem icon={Phone} label="手机" value={user.phone} />
        <InfoItem icon={MapPin} label="国家" value={user.country || "-"} />
        <InfoItem icon={Calendar} label="注册时间" value={new Date(user.createdAt).toLocaleDateString("zh-CN")} />
        <InfoItem icon={Link2} label="IB" value={user.ibId || "-"} />
        <span className="font-mono text-xs text-slate-500">UID: {user.uid}</span>
      </div>

      {/* 状态徽章 */}
      <div className="flex flex-wrap gap-2">
        <Badge label="KYC" value={kycLabel(user.kycStatus)} color={kycColor(user.kycStatus)} />
        <Badge label="风险" value={riskLabel(user.riskLevel)} color={riskColor(user.riskLevel)} />
        <Badge label="状态" value={statusLabel(user.status)} color={statusColor(user.status)} />
        <Badge label="FTD" value={user.ftdDate ? "已完成" : "未完成"} color={user.ftdDate ? "emerald" : "slate"} />
        <Badge label="等级" value={user.level.toUpperCase()} color="blue" />
      </div>

      {/* 快捷操作 */}
      <div className="flex flex-wrap gap-2">
        <ActionButton icon={Ban} label={user.status === "frozen" ? "解冻账户" : "冻结账户"} variant="danger" />
        <ActionButton icon={Lock} label="限制出金" variant="warning" />
        <ActionButton icon={RefreshCw} label="要求重传" variant="default" />
        <ActionButton icon={Settings} label="调整杠杆" variant="default" />
        <ActionButton icon={Shield} label="修改权限" variant="default" />
        <ActionButton icon={MessageSquare} label="添加备注" variant="default" />
        <ActionButton icon={Ticket} label="创建工单" variant="default" />
        <ActionButton icon={Bell} label="发送通知" variant="default" />
      </div>
    </div>
  );
}

function InfoItem({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5 text-slate-600">
      <Icon className="w-3.5 h-3.5 text-slate-400" />
      <span className="text-xs text-slate-400">{label}:</span>
      <span className="font-medium text-slate-700">{value}</span>
    </div>
  );
}

function Badge({ label, value, color }: { label: string; value: string; color: string }) {
  const colorMap: Record<string, string> = {
    emerald: "bg-emerald-100 text-emerald-700",
    blue: "bg-blue-100 text-blue-700",
    amber: "bg-amber-100 text-amber-700",
    red: "bg-red-100 text-red-700",
    slate: "bg-slate-100 text-slate-600",
    violet: "bg-violet-100 text-violet-700",
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${colorMap[color] || colorMap.slate}`}>
      <span className="opacity-70">{label}</span>
      <span>{value}</span>
    </span>
  );
}

function ActionButton({
  icon: Icon,
  label,
  variant,
}: {
  icon: React.ElementType;
  label: string;
  variant: "default" | "danger" | "warning";
}) {
  const variantMap = {
    default: "bg-slate-100 text-slate-700 hover:bg-slate-200",
    danger: "bg-red-100 text-red-700 hover:bg-red-200",
    warning: "bg-amber-100 text-amber-700 hover:bg-amber-200",
  };

  return (
    <button className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${variantMap[variant]}`}>
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  );
}

// Helpers
function kycLabel(status: string): string {
  const labels: Record<string, string> = {
    not_submitted: "未提交",
    pending: "待审核",
    verified: "已验证",
    rejected: "已拒绝",
  };
  return labels[status] || status;
}

function kycColor(status: string): string {
  const colors: Record<string, string> = {
    not_submitted: "slate",
    pending: "amber",
    verified: "emerald",
    rejected: "red",
  };
  return colors[status] || "slate";
}

function riskLabel(level?: string): string {
  if (!level) return "-";
  const labels: Record<string, string> = { low: "低", medium: "中", high: "高", critical: "极高" };
  return labels[level] || level;
}

function riskColor(level?: string): string {
  if (!level) return "slate";
  const colors: Record<string, string> = { low: "emerald", medium: "amber", high: "red", critical: "red" };
  return colors[level] || "slate";
}

function statusLabel(status: string): string {
  const labels: Record<string, string> = { active: "正常", frozen: "已冻结", pending: "待激活", closed: "已关闭" };
  return labels[status] || status;
}

function statusColor(status: string): string {
  const colors: Record<string, string> = { active: "emerald", frozen: "red", pending: "amber", closed: "slate" };
  return colors[status] || "slate";
}
