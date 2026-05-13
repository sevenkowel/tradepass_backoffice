"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Megaphone,
  Plus,
  Edit2,
  Trash2,
  Play,
  Pause,
  Eye,
  Users,
  Calendar,
  TrendingUp,
  Gift,
  Target,
  CheckCircle2,
  Clock,
  XCircle,
  Search,
  BarChart3,
} from "lucide-react";
import { Button, PageHeader, Card, Drawer, DrawerFooter, EmptyState } from "@/components/crm/ui";
import { Breadcrumb } from "@/components/crm/layout";

// ─── Types ────────────────────────────────────────────────────────────────────

type CampaignStatus = "draft" | "scheduled" | "active" | "paused" | "ended";
type CampaignType = "deposit_bonus" | "referral" | "rebate" | "contest" | "promotion";

interface Campaign {
  id: string;
  name: string;
  type: CampaignType;
  status: CampaignStatus;
  description: string;
  startDate: string;
  endDate: string;
  budget: number;
  spent: number;
  participants: number;
  conversions: number;
  targetRegions: string[];
  createdBy: string;
  createdAt: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_CAMPAIGNS: Campaign[] = [
  {
    id: "CAM-001",
    name: "Spring Deposit Bonus 2024",
    type: "deposit_bonus",
    status: "active",
    description: "Earn 20% bonus on first deposit this spring. Limited to new accounts only.",
    startDate: "2026-03-15",
    endDate: "2026-04-30",
    budget: 50000,
    spent: 18240,
    participants: 1243,
    conversions: 892,
    targetRegions: ["VN", "TH", "IN"],
    createdBy: "admin",
    createdAt: "2026-03-10",
  },
  {
    id: "CAM-002",
    name: "Refer a Friend Program",
    type: "referral",
    status: "active",
    description: "Get $50 for every verified friend you refer. Both parties receive bonuses.",
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    budget: 100000,
    spent: 34500,
    participants: 2840,
    conversions: 690,
    targetRegions: ["VN", "TH", "IN", "AE", "KR", "JP", "FR", "ES", "BR"],
    createdBy: "marketing",
    createdAt: "2025-12-28",
  },
  {
    id: "CAM-003",
    name: "Zero Commission Week",
    type: "rebate",
    status: "ended",
    description: "Zero commission on all forex trades for one week.",
    startDate: "2026-02-01",
    endDate: "2026-02-07",
    budget: 30000,
    spent: 29800,
    participants: 3241,
    conversions: 3241,
    targetRegions: ["VN", "TH"],
    createdBy: "admin",
    createdAt: "2026-01-25",
  },
  {
    id: "CAM-004",
    name: "Trading Champion May",
    type: "contest",
    status: "scheduled",
    description: "Monthly trading contest. Top 10 traders win cash prizes totaling $10,000.",
    startDate: "2026-05-01",
    endDate: "2026-05-31",
    budget: 15000,
    spent: 0,
    participants: 0,
    conversions: 0,
    targetRegions: ["JP", "KR"],
    createdBy: "marketing",
    createdAt: "2026-04-01",
  },
  {
    id: "CAM-005",
    name: "Welcome Back Bonus",
    type: "promotion",
    status: "paused",
    description: "Special offer for users who haven't traded in 90+ days.",
    startDate: "2026-03-01",
    endDate: "2026-04-30",
    budget: 20000,
    spent: 6800,
    participants: 456,
    conversions: 189,
    targetRegions: ["FR", "ES", "BR"],
    createdBy: "crm",
    createdAt: "2026-02-25",
  },
];

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_CFG: Record<CampaignStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  draft: { label: "草稿", color: "text-slate-600", bg: "bg-slate-100", icon: Edit2 },
  scheduled: { label: "待启动", color: "text-blue-600", bg: "bg-blue-100", icon: Clock },
  active: { label: "进行中", color: "text-emerald-600", bg: "bg-emerald-100", icon: Play },
  paused: { label: "已暂停", color: "text-amber-600", bg: "bg-amber-100", icon: Pause },
  ended: { label: "已结束", color: "text-slate-500", bg: "bg-slate-100", icon: CheckCircle2 },
};

const TYPE_CFG: Record<CampaignType, { label: string; icon: React.ElementType; color: string }> = {
  deposit_bonus: { label: "存款奖励", icon: Gift, color: "text-emerald-600" },
  referral: { label: "推荐计划", icon: Users, color: "text-blue-600" },
  rebate: { label: "返佣活动", icon: TrendingUp, color: "text-purple-600" },
  contest: { label: "交易竞赛", icon: Target, color: "text-orange-600" },
  promotion: { label: "促销活动", icon: Megaphone, color: "text-pink-600" },
};

const REGION_FLAGS: Record<string, string> = {
  VN: "🇻🇳", TH: "🇹🇭", IN: "🇮🇳", AE: "🇦🇪",
  KR: "🇰🇷", JP: "🇯🇵", FR: "🇫🇷", ES: "🇪🇸", BR: "🇧🇷",
};

const fmt = (n: number) => `$${n.toLocaleString()}`;

// ─── Campaign Detail Drawer ──────────────────────────────────────────────────

function CampaignDrawer({
  campaign,
  onClose,
  onStatusChange,
}: {
  campaign: Campaign;
  onClose: () => void;
  onStatusChange: (id: string, status: CampaignStatus) => void;
}) {
  const cfg = STATUS_CFG[campaign.status];
  const typeCfg = TYPE_CFG[campaign.type];
  const TypeIcon = typeCfg.icon;

  const progressPct = Math.round((campaign.spent / campaign.budget) * 100);
  const convRate = campaign.participants > 0 ? Math.round((campaign.conversions / campaign.participants) * 100) : 0;

  return (
    <Drawer
      isOpen
      onClose={onClose}
      size="lg"
      title={campaign.name}
      description={`${campaign.id} · ${typeCfg.label}`}
      footer={
        <DrawerFooter>
          {campaign.status === "active" && (
            <Button variant="secondary" size="sm" onClick={() => onStatusChange(campaign.id, "paused")}>
              <Pause className="w-4 h-4" />
              暂停活动
            </Button>
          )}
          {campaign.status === "paused" && (
            <Button size="sm" onClick={() => onStatusChange(campaign.id, "active")}>
              <Play className="w-4 h-4" />
              恢复活动
            </Button>
          )}
          {campaign.status === "scheduled" && (
            <Button size="sm" onClick={() => onStatusChange(campaign.id, "active")}>
              <Play className="w-4 h-4" />
              立即启动
            </Button>
          )}
          <Button variant="ghost" size="sm">
            <Edit2 className="w-4 h-4" />
            编辑
          </Button>
        </DrawerFooter>
      }
    >
      <div className="space-y-6">
        {/* Status & Type */}
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${cfg.bg} ${cfg.color}`}>
            <cfg.icon className="w-4 h-4" />
            {cfg.label}
          </span>
          <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${typeCfg.color}`}>
            <TypeIcon className="w-4 h-4" />
            {typeCfg.label}
          </span>
        </div>

        {/* Description */}
        <div className="p-4 bg-slate-50 rounded-xl">
          <p className="text-sm text-slate-700 leading-relaxed">{campaign.description}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "参与用户", value: campaign.participants.toLocaleString(), icon: Users },
            { label: "转化用户", value: campaign.conversions.toLocaleString(), icon: CheckCircle2 },
            { label: "预算", value: fmt(campaign.budget), icon: BarChart3 },
            { label: "已消耗", value: fmt(campaign.spent), icon: TrendingUp },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="p-3 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-400 mb-1">{label}</p>
              <p className="text-lg font-bold text-slate-900">{value}</p>
            </div>
          ))}
        </div>

        {/* Budget Progress */}
        <div>
          <div className="flex justify-between text-xs text-slate-500 mb-1.5">
            <span>预算使用</span>
            <span className="font-medium">{progressPct}%</span>
          </div>
          <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${progressPct > 80 ? "bg-red-500" : progressPct > 60 ? "bg-amber-500" : "bg-emerald-500"}`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-400 mt-1">
            <span>{fmt(campaign.spent)} 已使用</span>
            <span>剩余 {fmt(campaign.budget - campaign.spent)}</span>
          </div>
        </div>

        {/* Conversion Rate */}
        <div className="p-4 bg-indigo-50 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-indigo-700">转化率</span>
            <span className="text-2xl font-bold text-indigo-700">{convRate}%</span>
          </div>
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="text-xs text-slate-400 mb-1 flex items-center gap-1"><Calendar className="w-3 h-3" />开始日期</p>
            <p className="text-sm font-medium text-slate-900">{campaign.startDate}</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="text-xs text-slate-400 mb-1 flex items-center gap-1"><Calendar className="w-3 h-3" />结束日期</p>
            <p className="text-sm font-medium text-slate-900">{campaign.endDate}</p>
          </div>
        </div>

        {/* Target Regions */}
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">目标地区</p>
          <div className="flex flex-wrap gap-2">
            {campaign.targetRegions.map((r) => (
              <span key={r} className="px-2 py-1 bg-slate-100 text-slate-700 rounded-lg text-sm">
                {REGION_FLAGS[r]} {r}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Drawer>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>(MOCK_CAMPAIGNS);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [filterStatus, setFilterStatus] = useState<CampaignStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const filtered = campaigns.filter((c) => {
    if (filterStatus !== "all" && c.status !== filterStatus) return false;
    if (searchQuery && !c.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const stats = {
    active: campaigns.filter((c) => c.status === "active").length,
    totalBudget: campaigns.reduce((s, c) => s + c.budget, 0),
    totalParticipants: campaigns.reduce((s, c) => s + c.participants, 0),
    totalConversions: campaigns.reduce((s, c) => s + c.conversions, 0),
  };

  const handleStatusChange = (id: string, status: CampaignStatus) => {
    setCampaigns((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
    if (selectedCampaign?.id === id) {
      setSelectedCampaign((prev) => (prev ? { ...prev, status } : null));
    }
    showToast(`活动状态已更新为「${STATUS_CFG[status].label}」`);
  };

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "营销" }, { label: "活动管理" }]} />

      <PageHeader
        title="活动管理"
        description="创建和管理营销活动，追踪参与和转化数据"
        actions={
          <Button>
            <Plus className="w-4 h-4" />
            新建活动
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "进行中活动", value: stats.active, color: "text-emerald-600", bg: "bg-emerald-100", icon: Play },
          { label: "总预算", value: fmt(stats.totalBudget), color: "text-blue-600", bg: "bg-blue-100", icon: BarChart3 },
          { label: "参与用户", value: stats.totalParticipants.toLocaleString(), color: "text-purple-600", bg: "bg-purple-100", icon: Users },
          { label: "总转化", value: stats.totalConversions.toLocaleString(), color: "text-amber-600", bg: "bg-amber-100", icon: Target },
        ].map(({ label, value, color, bg, icon: Icon }) => (
          <Card key={label} className="!p-4">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center`}>
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

      {/* Filters */}
      <Card className="!p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="搜索活动名称..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 h-9 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-sm">
            {(["all", "active", "scheduled", "paused", "ended", "draft"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                  filterStatus === s ? "bg-white shadow-sm text-slate-900" : "text-slate-500"
                }`}
              >
                {s === "all" ? "全部" : STATUS_CFG[s].label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Campaign Cards */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Megaphone className="w-10 h-10 text-slate-300" />}
          title="暂无活动"
          description="还没有营销活动，点击右上角新建第一个"
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {filtered.map((campaign) => {
            const cfg = STATUS_CFG[campaign.status];
            const typeCfg = TYPE_CFG[campaign.type];
            const TypeIcon = typeCfg.icon;
            const progressPct = Math.round((campaign.spent / campaign.budget) * 100);
            const convRate = campaign.participants > 0
              ? Math.round((campaign.conversions / campaign.participants) * 100) : 0;

            return (
              <motion.div
                key={campaign.id}
                layout
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all cursor-pointer"
                onClick={() => setSelectedCampaign(campaign)}
              >
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center`}>
                        <TypeIcon className={`w-4 h-4 ${typeCfg.color}`} />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">{typeCfg.label}</p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}>
                      <cfg.icon className="w-3 h-3" />
                      {cfg.label}
                    </span>
                  </div>

                  <h3 className="font-semibold text-slate-900 mb-2 line-clamp-1">{campaign.name}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mb-4">{campaign.description}</p>

                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="text-center p-2 bg-slate-50 rounded-lg">
                      <p className="text-xs text-slate-400">参与</p>
                      <p className="text-sm font-bold text-slate-800">{campaign.participants.toLocaleString()}</p>
                    </div>
                    <div className="text-center p-2 bg-slate-50 rounded-lg">
                      <p className="text-xs text-slate-400">转化率</p>
                      <p className="text-sm font-bold text-indigo-600">{convRate}%</p>
                    </div>
                    <div className="text-center p-2 bg-slate-50 rounded-lg">
                      <p className="text-xs text-slate-400">预算余额</p>
                      <p className="text-sm font-bold text-slate-800">{fmt(campaign.budget - campaign.spent)}</p>
                    </div>
                  </div>

                  {/* Budget bar */}
                  <div>
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>预算使用 {progressPct}%</span>
                      <span>{fmt(campaign.spent)} / {fmt(campaign.budget)}</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${progressPct > 80 ? "bg-red-500" : progressPct > 60 ? "bg-amber-500" : "bg-emerald-500"}`}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Date + Regions */}
                  <div className="flex items-center justify-between mt-4 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {campaign.startDate} → {campaign.endDate}
                    </span>
                    <div className="flex gap-0.5">
                      {campaign.targetRegions.slice(0, 4).map((r) => (
                        <span key={r} className="text-sm">{REGION_FLAGS[r]}</span>
                      ))}
                      {campaign.targetRegions.length > 4 && (
                        <span>+{campaign.targetRegions.length - 4}</span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Campaign Drawer */}
      {selectedCampaign && (
        <CampaignDrawer
          campaign={selectedCampaign}
          onClose={() => setSelectedCampaign(null)}
          onStatusChange={handleStatusChange}
        />
      )}

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 z-[9999]"
          >
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium bg-emerald-600 text-white">
              <CheckCircle2 className="w-4 h-4" />
              {toast}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
