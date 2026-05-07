"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Search,
  Filter,
  AlertTriangle,
  User,
  FileText,
  MapPin,
  RefreshCw,
  Loader2,
  ChevronDown,
  AlertCircle,
  Fingerprint,
  BadgeCheck,
  CircleDashed,
  MessageSquarePlus,
  ClipboardCheck,
  BarChart3,
  Download,
  X,
} from "lucide-react";
import {
  Button,
  PageHeader,
  Card,
  Drawer,
  DrawerFooter,
  EmptyState,
} from "@/components/crm/ui";
import { Breadcrumb } from "@/components/crm/layout";

// ─── Types ────────────────────────────────────────────────────────────────────

interface KYCReviewRecord {
  id: string;
  userId: string;
  userName: string;
  email: string;
  phone: string;
  regionCode: string;
  country: string;
  kycLevel: "basic" | "standard" | "enhanced";
  status: "submitted" | "under_review" | "approved" | "rejected";
  riskLevel: "low" | "medium" | "high";
  documentType: string;
  documentFrontUrl: string;
  documentBackUrl?: string;
  selfieUrl?: string;
  ocrConfidence: number;
  livenessPassed: boolean;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
  personalInfo?: {
    fullName: string;
    dateOfBirth: string;
    nationality: string;
    address: string;
    city: string;
    country: string;
  };
  amlPassed: boolean;
  amlRiskScore: number;
  flags: string[];
}

interface ApiStats {
  total: number;
  submitted: number;
  under_review: number;
  approved: number;
  rejected: number;
  high_risk: number;
}

// ─── Config Maps ──────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  submitted: {
    label: "待审核",
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
    icon: CircleDashed,
  },
  under_review: {
    label: "审核中",
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    icon: Eye,
  },
  approved: {
    label: "已通过",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    icon: CheckCircle2,
  },
  rejected: {
    label: "已拒绝",
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-200",
    icon: XCircle,
  },
};

const RISK_CONFIG = {
  low: { label: "低风险", color: "text-emerald-700", bg: "bg-emerald-100" },
  medium: { label: "中风险", color: "text-amber-700", bg: "bg-amber-100" },
  high: { label: "高风险", color: "text-red-700", bg: "bg-red-100" },
};

const LEVEL_CONFIG = {
  basic: { label: "Basic KYC", color: "text-slate-600", bg: "bg-slate-100" },
  standard: { label: "Standard KYC", color: "text-blue-700", bg: "bg-blue-100" },
  enhanced: { label: "Enhanced KYC", color: "text-purple-700", bg: "bg-purple-100" },
};

const DOC_TYPE_LABELS: Record<string, string> = {
  id_card: "身份证",
  passport: "护照",
  driving_license: "驾照",
};

const REGION_FLAGS: Record<string, string> = {
  VN: "🇻🇳", TH: "🇹🇭", IN: "🇮🇳", AE: "🇦🇪",
  KR: "🇰🇷", JP: "🇯🇵", FR: "🇫🇷", ES: "🇪🇸", BR: "🇧🇷",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: KYCReviewRecord["status"] }) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
        ${cfg.bg} ${cfg.color} border ${cfg.border}`}
    >
      <Icon className="w-3.5 h-3.5" />
      {cfg.label}
    </span>
  );
}

function RiskBadge({ level }: { level: KYCReviewRecord["riskLevel"] }) {
  const cfg = RISK_CONFIG[level];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cfg.bg} ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color = pct >= 90 ? "bg-emerald-500" : pct >= 80 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-xs font-mono font-medium ${pct >= 90 ? "text-emerald-600" : pct >= 80 ? "text-amber-600" : "text-red-600"}`}>
        {pct}%
      </span>
    </div>
  );
}

// ─── Review Drawer ────────────────────────────────────────────────────────────

function ReviewDrawer({
  record,
  onClose,
  onAction,
}: {
  record: KYCReviewRecord;
  onClose: () => void;
  onAction: (action: "approve" | "reject" | "request_info" | "start_review", reason?: string) => Promise<void>;
}) {
  const [actionMode, setActionMode] = useState<"idle" | "reject" | "request_info">("idle");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const canAct = ["submitted", "under_review"].includes(record.status);

  const handleAction = async (action: "approve" | "reject" | "request_info" | "start_review") => {
    setLoading(true);
    try {
      await onAction(action, reason || undefined);
      setActionMode("idle");
      setReason("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer
      isOpen
      onClose={onClose}
      size="lg"
      title={`KYC 审核 · ${record.id}`}
      description={`${record.userName} · ${REGION_FLAGS[record.regionCode] ?? ""} ${record.country}`}
      footer={
        canAct ? (
          actionMode === "idle" ? (
            <div className="w-full">
              {record.status === "submitted" && (
                <div className="flex gap-3 mb-3">
                  <Button
                    variant="secondary"
                    className="flex-1"
                    onClick={() => handleAction("start_review")}
                    disabled={loading}
                  >
                    <Eye className="w-4 h-4" />
                    接单审核
                  </Button>
                </div>
              )}
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  className="flex-1 text-amber-700 border-amber-300 hover:bg-amber-50"
                  onClick={() => setActionMode("request_info")}
                  disabled={loading}
                >
                  <MessageSquarePlus className="w-4 h-4" />
                  要求补充
                </Button>
                <Button
                  variant="secondary"
                  className="flex-1 text-red-700 border-red-300 hover:bg-red-50"
                  onClick={() => setActionMode("reject")}
                  disabled={loading}
                >
                  <XCircle className="w-4 h-4" />
                  拒绝
                </Button>
                <Button
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => handleAction("approve")}
                  disabled={loading}
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  通过审核
                </Button>
              </div>
            </div>
          ) : (
            <div className="w-full space-y-3">
              <p className="text-sm font-medium text-slate-700">
                {actionMode === "reject" ? "拒绝原因（必填）" : "补充材料说明（必填）"}
              </p>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={
                  actionMode === "reject"
                    ? "请填写拒绝原因，此信息将发送给用户..."
                    : "请说明需要补充的材料或信息..."
                }
                rows={3}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <DrawerFooter>
                <Button variant="ghost" onClick={() => { setActionMode("idle"); setReason(""); }} disabled={loading}>
                  取消
                </Button>
                <Button
                  variant={actionMode === "reject" ? "danger" : undefined}
                  onClick={() => handleAction(actionMode === "reject" ? "reject" : "request_info")}
                  disabled={!reason.trim() || loading}
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {actionMode === "reject" ? "确认拒绝" : "确认发送"}
                </Button>
              </DrawerFooter>
            </div>
          )
        ) : null
      }
    >
      <div className="space-y-6">
        {/* Status Header */}
        <div className="flex items-center justify-between">
          <StatusBadge status={record.status} />
          <div className="flex items-center gap-2">
            <RiskBadge level={record.riskLevel} />
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                ${LEVEL_CONFIG[record.kycLevel].bg} ${LEVEL_CONFIG[record.kycLevel].color}`}
            >
              {LEVEL_CONFIG[record.kycLevel].label}
            </span>
          </div>
        </div>

        {/* Risk Flags */}
        {record.flags.length > 0 && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="text-sm font-medium text-red-700">风险标记</span>
            </div>
            <div className="flex flex-col gap-1">
              {record.flags.map((flag, i) => (
                <p key={i} className="text-xs text-red-600">• {flag}</p>
              ))}
            </div>
          </div>
        )}

        {/* User Info */}
        <section>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">用户信息</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "用户 ID", value: record.userId, mono: true },
              { label: "姓名", value: record.userName },
              { label: "邮箱", value: record.email },
              { label: "手机", value: record.phone },
              { label: "地区", value: `${REGION_FLAGS[record.regionCode] ?? ""} ${record.country}` },
              { label: "提交时间", value: new Date(record.submittedAt).toLocaleString("zh-CN") },
            ].map(({ label, value, mono }) => (
              <div key={label} className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-400 mb-0.5">{label}</p>
                <p className={`text-sm font-medium text-slate-900 ${mono ? "font-mono" : ""}`}>{value}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Personal Info */}
        {record.personalInfo && (
          <section>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">个人信息</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "全名", value: record.personalInfo.fullName },
                { label: "出生日期", value: record.personalInfo.dateOfBirth },
                { label: "国籍", value: record.personalInfo.nationality },
                { label: "城市", value: record.personalInfo.city },
              ].map(({ label, value }) => (
                <div key={label} className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-400 mb-0.5">{label}</p>
                  <p className="text-sm font-medium text-slate-900">{value}</p>
                </div>
              ))}
              <div className="col-span-2 p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-400 mb-0.5">地址</p>
                <p className="text-sm font-medium text-slate-900">{record.personalInfo.address}</p>
              </div>
            </div>
          </section>
        )}

        {/* Document Verification */}
        <section>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">证件验证</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-700">证件类型</span>
              </div>
              <span className="text-sm font-medium">{DOC_TYPE_LABELS[record.documentType] ?? record.documentType}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <BadgeCheck className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-700">OCR 识别置信度</span>
                </div>
              </div>
              <ConfidenceBar value={record.ocrConfidence} />
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Fingerprint className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-700">活体检测</span>
              </div>
              {record.livenessPassed ? (
                <span className="flex items-center gap-1 text-emerald-600 text-sm font-medium">
                  <CheckCircle2 className="w-4 h-4" /> 通过
                </span>
              ) : (
                <span className="flex items-center gap-1 text-red-600 text-sm font-medium">
                  <XCircle className="w-4 h-4" /> 未通过
                </span>
              )}
            </div>
          </div>
        </section>

        {/* Document Images */}
        <section>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">证件图片</h3>
          <DocumentImages
            frontUrl={record.documentFrontUrl}
            backUrl={record.documentBackUrl}
            selfieUrl={record.selfieUrl}
          />
        </section>

        {/* AML Check */}
        <section>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">AML 合规筛查</h3>
            <div
              className={`p-4 rounded-lg border ${
                record.amlPassed
                  ? "border-emerald-200 bg-emerald-50"
                  : "border-red-200 bg-red-50"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`text-sm font-medium ${
                    record.amlPassed ? "text-emerald-700" : "text-red-700"
                  }`}
                >
                  {record.amlPassed ? "✓ AML 筛查通过" : "✗ AML 筛查异常"}
                </span>
                <span
                  className={`text-xs font-mono font-medium px-2 py-0.5 rounded ${
                    record.amlRiskScore < 30
                      ? "bg-emerald-100 text-emerald-700"
                      : record.amlRiskScore < 60
                      ? "bg-amber-100 text-amber-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  Risk Score: {record.amlRiskScore}
                </span>
              </div>
              <div className="h-2 bg-white/60 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    record.amlRiskScore < 30
                      ? "bg-emerald-500"
                      : record.amlRiskScore < 60
                      ? "bg-amber-500"
                      : "bg-red-500"
                  }`}
                  style={{ width: `${record.amlRiskScore}%` }}
                />
              </div>
            </div>
        </section>

        {/* Rejection Reason */}
        {record.rejectionReason && (
          <section>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">拒绝原因</h3>
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{record.rejectionReason}</p>
              {record.reviewedAt && (
                <p className="text-xs text-red-500 mt-2">
                  {record.reviewedBy} · {new Date(record.reviewedAt).toLocaleString("zh-CN")}
                </p>
              )}
            </div>
          </section>
        )}

        {/* Approved Info */}
        {record.status === "approved" && record.reviewedAt && (
          <section>
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-emerald-700">审核已通过</p>
                <p className="text-xs text-emerald-600">
                  {record.reviewedBy} · {new Date(record.reviewedAt).toLocaleString("zh-CN")}
                </p>
              </div>
            </div>
          </section>
        )}
      </div>
    </Drawer>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type FilterStatus = "all" | KYCReviewRecord["status"];
type FilterRisk = "all" | KYCReviewRecord["riskLevel"];

export default function KYCReviewPage() {
  const [records, setRecords] = useState<KYCReviewRecord[]>([]);
  const [stats, setStats] = useState<ApiStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<KYCReviewRecord | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [filterRisk, setFilterRisk] = useState<FilterRisk>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus !== "all") params.append("status", filterStatus);
      if (filterRisk !== "all") params.append("risk", filterRisk);
      if (searchQuery) params.append("search", searchQuery);

      const res = await fetch(`/api/crm/kyc/review?${params}`);
      const data = await res.json();
      if (data.success) {
        setRecords(data.items);
        setStats(data.stats);
      }
    } catch {
      showToast("error", "获取数据失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterRisk, searchQuery]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleAction = async (
    action: "approve" | "reject" | "request_info" | "start_review",
    reason?: string
  ) => {
    if (!selectedRecord) return;
    try {
      const res = await fetch("/api/crm/kyc/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedRecord.id, action, reason }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("success", data.message);
        setSelectedRecord(data.record);
        fetchRecords();
      } else {
        showToast("error", data.error || "操作失败");
      }
    } catch {
      showToast("error", "网络错误，请重试");
    }
  };

  const pendingCount = stats ? stats.submitted + stats.under_review : 0;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb items={[{ label: "合规" }, { label: "KYC 审核" }]} />

      {/* Page Header */}
      <PageHeader
        title="KYC 审核"
        description="审核用户身份认证材料，确保合规要求"
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={fetchRecords}>
              <RefreshCw className="w-4 h-4" />
              刷新
            </Button>
            <Button variant="secondary">
              <Download className="w-4 h-4" />
              导出
            </Button>
          </div>
        }
      />

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          {[
            { label: "总申请", value: stats.total, icon: BarChart3, color: "text-slate-600", bg: "bg-slate-100" },
            { label: "待审核", value: stats.submitted, icon: CircleDashed, color: "text-amber-600", bg: "bg-amber-100" },
            { label: "审核中", value: stats.under_review, icon: Eye, color: "text-blue-600", bg: "bg-blue-100" },
            { label: "已通过", value: stats.approved, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-100" },
            { label: "已拒绝", value: stats.rejected, icon: XCircle, color: "text-red-600", bg: "bg-red-100" },
            { label: "高风险", value: stats.high_risk, icon: AlertTriangle, color: "text-orange-600", bg: "bg-orange-100" },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <Card key={label} className="!p-4">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <div>
                  <p className={`text-xl font-bold ${color}`}>{value}</p>
                  <p className="text-xs text-slate-500">{label}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pending Alert */}
      {pendingCount > 0 && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-700">
            当前有 <span className="font-bold">{pendingCount}</span> 份申请待处理，请及时审核
          </p>
        </div>
      )}

      {/* Filters */}
      <Card className="!p-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="搜索用户名、邮箱、申请 ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 h-9 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-sm">
            {(["all", "submitted", "under_review", "approved", "rejected"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                  filterStatus === s
                    ? "bg-white shadow-sm text-slate-900"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {s === "all" ? "全部" : STATUS_CONFIG[s].label}
              </button>
            ))}
          </div>

          {/* Risk Filter */}
          <select
            value={filterRisk}
            onChange={(e) => setFilterRisk(e.target.value as FilterRisk)}
            className="h-9 px-3 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">全部风险</option>
            <option value="low">低风险</option>
            <option value="medium">中风险</option>
            <option value="high">高风险</option>
          </select>
        </div>
      </Card>

      {/* Table */}
      <Card className="!p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : records.length === 0 ? (
          <EmptyState
            icon={<Shield className="w-12 h-12 text-slate-300" />}
            title="暂无申请记录"
            description="所有 KYC 申请均已处理完毕"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {["申请 ID / 用户", "地区", "证件", "风险评估", "状态", "提交时间", "操作"].map((h) => (
                    <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <AnimatePresence initial={false}>
                  {records.map((record) => (
                    <motion.tr
                      key={record.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors cursor-pointer"
                      onClick={() => setSelectedRecord(record)}
                    >
                      {/* ID / User */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {record.userName.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900">{record.userName}</p>
                            <p className="text-xs text-slate-400 font-mono">{record.id}</p>
                          </div>
                        </div>
                      </td>

                      {/* Region */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="text-base">{REGION_FLAGS[record.regionCode] ?? "🌐"}</span>
                          <span className="text-sm text-slate-600">{record.regionCode}</span>
                        </div>
                      </td>

                      {/* Document */}
                      <td className="py-3.5 px-4">
                        <div>
                          <p className="text-sm text-slate-700">{DOC_TYPE_LABELS[record.documentType] ?? record.documentType}</p>
                          <ConfidenceBar value={record.ocrConfidence} />
                        </div>
                      </td>

                      {/* Risk */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-1">
                          <RiskBadge level={record.riskLevel} />
                          {record.flags.length > 0 && (
                            <span className="text-xs text-red-500">
                              {record.flags.length} 项标记
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <StatusBadge status={record.status} />
                      </td>

                      {/* Time */}
                      <td className="py-3.5 px-4">
                        <p className="text-sm text-slate-700">
                          {new Date(record.submittedAt).toLocaleDateString("zh-CN")}
                        </p>
                        <p className="text-xs text-slate-400">
                          {new Date(record.submittedAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedRecord(record)}
                        >
                          <ClipboardCheck className="w-4 h-4" />
                          审核
                        </Button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Review Drawer */}
      {selectedRecord && (
        <ReviewDrawer
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
          onAction={handleAction}
        />
      )}

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-[9999]"
          >
            <div
              className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${
                toast.type === "success"
                  ? "bg-emerald-600 text-white"
                  : "bg-red-600 text-white"
              }`}
            >
              {toast.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
              )}
              {toast.message}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Document Images Component with preview
function DocumentImages({
  frontUrl,
  backUrl,
  selfieUrl,
}: {
  frontUrl?: string;
  backUrl?: string;
  selfieUrl?: string;
}) {
  const [preview, setPreview] = useState<string | null>(null);

  const images = [
    { url: frontUrl, label: "正面", icon: FileText },
    { url: backUrl, label: "反面", icon: FileText },
    { url: selfieUrl, label: "自拍认证", icon: User },
  ].filter((i) => i.url) as { url: string; label: string; icon: typeof FileText }[];

  if (images.length === 0) {
    return (
      <div className="aspect-video bg-slate-100 rounded-lg flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-200">
        <FileText className="w-8 h-8 text-slate-300" />
        <span className="text-xs text-slate-400">暂无证件图片</span>
      </div>
    );
  }

  return (
    <>
      <div className={`grid gap-3 ${images.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
        {images.map((img) => (
          <button
            key={img.label}
            onClick={() => setPreview(img.url)}
            className="aspect-video bg-slate-100 rounded-lg overflow-hidden border border-slate-200 hover:border-blue-400 transition-colors relative group"
          >
            <img
              src={img.url}
              alt={img.label}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-100 group-hover:bg-slate-50 transition-colors">
              <img.icon className="w-8 h-8 text-slate-300" />
              <span className="text-xs text-slate-400">{img.label}</span>
            </div>
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/10 transition-colors">
              <Eye className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </button>
        ))}
      </div>

      {/* Image Preview Modal */}
      {preview && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-8"
          onClick={() => setPreview(null)}
        >
          <button
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
            onClick={() => setPreview(null)}
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={preview}
            alt="Preview"
            className="max-w-full max-h-full rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
