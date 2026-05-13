"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Image, Plus, Eye, Edit, ToggleLeft, ToggleRight,
  ChevronRight, TrendingUp, MousePointerClick, Monitor,
  Smartphone, Tablet, Globe, Calendar, BarChart2, X,
  ArrowUpRight, ExternalLink, Tag, Layers,
} from "lucide-react";
import { Button, PageHeader, Card, EmptyState } from "@/components/crm/ui/PageHeader";
import { Drawer, DrawerFooter } from "@/components/crm/ui/Drawer";

// ─── Types ────────────────────────────────────────────────────────────────────

type BannerStatus = "active" | "inactive" | "scheduled" | "expired";
type BannerPosition = "homepage_hero" | "homepage_mid" | "portal_top" | "portal_sidebar" | "login_page";
type BannerDevice = "all" | "desktop" | "mobile" | "tablet";

interface Banner {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  linkUrl: string;
  position: BannerPosition;
  device: BannerDevice;
  status: BannerStatus;
  priority: number;
  targetRegions: string[];
  startDate?: string;
  endDate?: string;
  stats: {
    impressions: number;
    clicks: number;
    ctr: number;
  };
  createdAt: string;
  updatedAt: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_BANNERS: Banner[] = [
  {
    id: "BNR001",
    title: "首页英雄横幅 - Q2 入金促销",
    description: "首次入金享 20% 奖励，最高 $500。立即开户交易！",
    imageUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=300&fit=crop",
    linkUrl: "/portal/deposit",
    position: "homepage_hero",
    device: "all",
    status: "active",
    priority: 1,
    targetRegions: ["VN", "TH", "IN", "AE"],
    startDate: "2026-04-01T00:00:00Z",
    endDate: "2026-06-30T23:59:59Z",
    stats: { impressions: 48320, clicks: 2891, ctr: 5.98 },
    createdAt: "2026-03-28T10:00:00Z",
    updatedAt: "2026-04-01T00:00:00Z",
  },
  {
    id: "BNR002",
    title: "门户顶部 - 交易大赛",
    description: "参加本月交易大赛，赢取 $10,000 现金大奖！",
    imageUrl: "https://images.unsplash.com/photo-1642543348745-03b1219733d9?w=800&h=200&fit=crop",
    linkUrl: "/portal/contest",
    position: "portal_top",
    device: "desktop",
    status: "active",
    priority: 1,
    targetRegions: ["KR", "JP", "VN", "TH"],
    startDate: "2026-04-01T00:00:00Z",
    endDate: "2026-04-30T23:59:59Z",
    stats: { impressions: 31200, clicks: 1560, ctr: 5.0 },
    createdAt: "2026-03-30T14:00:00Z",
    updatedAt: "2026-04-01T00:00:00Z",
  },
  {
    id: "BNR003",
    title: "登录页 - MT5 推广",
    description: "现已支持 MetaTrader 5，更强大的交易体验等您来",
    imageUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=240&fit=crop",
    linkUrl: "/downloads/mt5",
    position: "login_page",
    device: "all",
    status: "inactive",
    priority: 2,
    targetRegions: ["ALL"],
    stats: { impressions: 8920, clicks: 312, ctr: 3.5 },
    createdAt: "2026-03-15T09:00:00Z",
    updatedAt: "2026-03-31T18:00:00Z",
  },
  {
    id: "BNR004",
    title: "首页中段 - 推荐好友",
    description: "推荐朋友注册交易，双方各得 $50 奖励金",
    imageUrl: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=200&fit=crop",
    linkUrl: "/referral",
    position: "homepage_mid",
    device: "mobile",
    status: "scheduled",
    priority: 2,
    targetRegions: ["ALL"],
    startDate: "2026-04-10T00:00:00Z",
    endDate: "2026-05-31T23:59:59Z",
    stats: { impressions: 0, clicks: 0, ctr: 0 },
    createdAt: "2026-04-04T11:00:00Z",
    updatedAt: "2026-04-04T11:00:00Z",
  },
  {
    id: "BNR005",
    title: "门户侧边栏 - 教育中心",
    description: "免费外汇交易课程，帮助新手快速上手",
    imageUrl: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=600&fit=crop",
    linkUrl: "/education",
    position: "portal_sidebar",
    device: "desktop",
    status: "expired",
    priority: 3,
    targetRegions: ["ALL"],
    endDate: "2026-03-31T23:59:59Z",
    stats: { impressions: 15400, clicks: 462, ctr: 3.0 },
    createdAt: "2026-03-01T09:00:00Z",
    updatedAt: "2026-03-31T23:59:59Z",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const POSITION_LABELS: Record<BannerPosition, string> = {
  homepage_hero: "首页主横幅",
  homepage_mid: "首页中段",
  portal_top: "门户顶部",
  portal_sidebar: "门户侧边栏",
  login_page: "登录页",
};

const DEVICE_CONFIG: Record<BannerDevice, { label: string; icon: React.ReactNode }> = {
  all: { label: "全平台", icon: <Globe className="w-3.5 h-3.5" /> },
  desktop: { label: "桌面端", icon: <Monitor className="w-3.5 h-3.5" /> },
  mobile: { label: "移动端", icon: <Smartphone className="w-3.5 h-3.5" /> },
  tablet: { label: "平板", icon: <Tablet className="w-3.5 h-3.5" /> },
};

const STATUS_CONFIG: Record<BannerStatus, { label: string; color: string; dot: string }> = {
  active: { label: "上线中", color: "bg-green-100 text-green-700", dot: "bg-green-500 animate-pulse" },
  inactive: { label: "已下线", color: "bg-gray-100 text-gray-600", dot: "bg-gray-400" },
  scheduled: { label: "待上线", color: "bg-blue-100 text-blue-700", dot: "bg-blue-500" },
  expired: { label: "已过期", color: "bg-orange-100 text-orange-700", dot: "bg-orange-500" },
};

const fmt = (n: number) => n.toLocaleString();

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: BannerStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function BannerDetailDrawer({ banner, onClose, onToggle }: { banner: Banner; onClose: () => void; onToggle: () => void }) {
  return (
    <Drawer isOpen onClose={onClose} title={banner.title} size="lg"
        footer={<DrawerFooter>
        <Button variant="secondary" onClick={onClose}>关闭</Button>
        <Button variant="secondary"><Edit className="w-4 h-4" />编辑</Button>
        {(banner.status === "active") ? (
          <Button variant="danger" onClick={onToggle}><ToggleLeft className="w-4 h-4" />下线</Button>
        ) : banner.status === "inactive" ? (
          <Button variant="primary" onClick={onToggle}><ToggleRight className="w-4 h-4" />上线</Button>
        ) : null}
      </DrawerFooter>}
      >
      <div className="p-6 space-y-6">
        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          <StatusBadge status={banner.status} />
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-[var(--tp-surface-2)] text-[var(--tp-fg-muted)]">
            <Layers className="w-3 h-3" />{POSITION_LABELS[banner.position]}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-[var(--tp-surface-2)] text-[var(--tp-fg-muted)]">
            {DEVICE_CONFIG[banner.device].icon}{DEVICE_CONFIG[banner.device].label}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-purple-100 text-purple-700">
            <Tag className="w-3 h-3" />优先级 P{banner.priority}
          </span>
        </div>

        {/* Preview image placeholder */}
        <div className="rounded-xl overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 h-40 flex items-center justify-center">
          <div className="text-center text-white/50">
            <Image className="w-10 h-10 mx-auto mb-2" />
            <p className="text-sm">Banner 预览区</p>
          </div>
        </div>

        {/* Description */}
        <div>
          <p className="text-xs text-[var(--tp-fg-muted)] mb-1">Banner 描述</p>
          <p className="text-sm text-[var(--tp-fg)]">{banner.description}</p>
        </div>

        {/* Link */}
        <div>
          <p className="text-xs text-[var(--tp-fg-muted)] mb-1">跳转链接</p>
          <a href={banner.linkUrl} className="text-sm text-[var(--tp-primary)] flex items-center gap-1 hover:underline">
            {banner.linkUrl}<ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Date range */}
        {(banner.startDate || banner.endDate) && (
          <div className="grid grid-cols-2 gap-3">
            {banner.startDate && (
              <div>
                <p className="text-xs text-[var(--tp-fg-muted)] mb-1">开始日期</p>
                <p className="text-sm text-[var(--tp-fg)]">{new Date(banner.startDate).toLocaleDateString("zh-CN")}</p>
              </div>
            )}
            {banner.endDate && (
              <div>
                <p className="text-xs text-[var(--tp-fg-muted)] mb-1">结束日期</p>
                <p className="text-sm text-[var(--tp-fg)]">{new Date(banner.endDate).toLocaleDateString("zh-CN")}</p>
              </div>
            )}
          </div>
        )}

        {/* Target regions */}
        <div>
          <p className="text-xs text-[var(--tp-fg-muted)] mb-2">目标地区</p>
          <div className="flex flex-wrap gap-1.5">
            {banner.targetRegions.map(r => (
              <span key={r} className="px-2 py-0.5 rounded-md text-xs bg-[var(--tp-surface-2)] text-[var(--tp-fg)]">{r}</span>
            ))}
          </div>
        </div>

        {/* Stats */}
        {banner.stats.impressions > 0 && (
          <div>
            <p className="text-xs text-[var(--tp-fg-muted)] mb-3">展示统计</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "曝光次数", value: fmt(banner.stats.impressions), icon: <Eye className="w-4 h-4" />, color: "text-blue-600 bg-blue-50" },
                { label: "点击次数", value: fmt(banner.stats.clicks), icon: <MousePointerClick className="w-4 h-4" />, color: "text-green-600 bg-green-50" },
                { label: "点击率", value: banner.stats.ctr.toFixed(2) + "%", icon: <TrendingUp className="w-4 h-4" />, color: "text-purple-600 bg-purple-50" },
              ].map(s => (
                <div key={s.label} className={`rounded-xl p-3 text-center ${s.color.split(" ")[1]}`}>
                  <div className={`flex justify-center mb-1 ${s.color.split(" ")[0]}`}>{s.icon}</div>
                  <div className="text-lg font-bold text-[var(--tp-fg)]">{s.value}</div>
                  <div className="text-xs text-[var(--tp-fg-muted)]">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

          </Drawer>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>(MOCK_BANNERS);
  const [filterStatus, setFilterStatus] = useState<BannerStatus | "all">("all");
  const [filterPosition, setFilterPosition] = useState<BannerPosition | "all">("all");
  const [selected, setSelected] = useState<Banner | null>(null);

  const filtered = banners.filter(b => {
    if (filterStatus !== "all" && b.status !== filterStatus) return false;
    if (filterPosition !== "all" && b.position !== filterPosition) return false;
    return true;
  });

  const activeCount = banners.filter(b => b.status === "active").length;
  const totalImpressions = banners.reduce((s, b) => s + b.stats.impressions, 0);
  const totalClicks = banners.reduce((s, b) => s + b.stats.clicks, 0);
  const avgCtr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : "0.00";

  const handleToggle = () => {
    if (!selected) return;
    setBanners(prev => prev.map(b =>
      b.id === selected.id
        ? { ...b, status: b.status === "active" ? "inactive" : "active", updatedAt: new Date().toISOString() }
        : b
    ));
    setSelected(prev => prev ? { ...prev, status: prev.status === "active" ? "inactive" : "active" } : null);
  };

  const breadcrumbs = [{ label: "后台管理" }, { label: "营销管理" }, { label: "Banner 管理" }];

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-[var(--tp-fg-muted)]">
        {breadcrumbs.map((b, i) => (
          <React.Fragment key={i}>
            {i > 0 && <ChevronRight className="w-3.5 h-3.5" />}
            <span className={i === breadcrumbs.length - 1 ? "text-[var(--tp-fg)] font-medium" : ""}>{b.label}</span>
          </React.Fragment>
        ))}
      </nav>

      <PageHeader
        title="Banner 管理"
        description="管理首页、门户及登录页的 Banner 展示与统计"
        actions={
          <Button variant="primary"><Plus className="w-4 h-4" />上传 Banner</Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "上线中", value: activeCount, icon: <ToggleRight className="w-5 h-5" />, color: "text-green-600", bg: "bg-green-50" },
          { label: "总曝光", value: fmt(totalImpressions), icon: <Eye className="w-5 h-5" />, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "总点击", value: fmt(totalClicks), icon: <MousePointerClick className="w-5 h-5" />, color: "text-purple-600", bg: "bg-purple-50" },
          { label: "平均点击率", value: avgCtr + "%", icon: <TrendingUp className="w-5 h-5" />, color: "text-orange-600", bg: "bg-orange-50" },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${s.bg} ${s.color}`}>{s.icon}</div>
                <div>
                  <p className="text-2xl font-bold text-[var(--tp-fg)]">{s.value}</p>
                  <p className="text-xs text-[var(--tp-fg-muted)]">{s.label}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-3">
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as BannerStatus | "all")}
            className="px-3 py-2 text-sm bg-[var(--tp-surface-2)] border border-[var(--tp-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--tp-primary)]/30 text-[var(--tp-fg)]"
          >
            <option value="all">全部状态</option>
            {(Object.keys(STATUS_CONFIG) as BannerStatus[]).map(s => (
              <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
            ))}
          </select>
          <select
            value={filterPosition}
            onChange={e => setFilterPosition(e.target.value as BannerPosition | "all")}
            className="px-3 py-2 text-sm bg-[var(--tp-surface-2)] border border-[var(--tp-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--tp-primary)]/30 text-[var(--tp-fg)]"
          >
            <option value="all">全部位置</option>
            {(Object.keys(POSITION_LABELS) as BannerPosition[]).map(p => (
              <option key={p} value={p}>{POSITION_LABELS[p]}</option>
            ))}
          </select>
        </div>
      </Card>

      {/* Banner Grid */}
      {filtered.length === 0 ? (
        <EmptyState icon={<Image className="w-12 h-12" />} title="暂无 Banner" description="调整筛选条件或上传新 Banner" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <AnimatePresence>
            {filtered.map((banner, i) => (
              <motion.div
                key={banner.id}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="overflow-hidden hover:shadow-md transition-all group cursor-pointer" onClick={() => setSelected(banner)}>
                  {/* Image placeholder */}
                  <div className="h-32 bg-gradient-to-br from-slate-700 via-slate-600 to-slate-800 flex items-center justify-center relative">
                    <div className="text-white/40 flex flex-col items-center gap-1">
                      <Image className="w-8 h-8" />
                      <span className="text-xs">{POSITION_LABELS[banner.position]}</span>
                    </div>
                    <div className="absolute top-2 right-2 flex gap-1.5">
                      <StatusBadge status={banner.status} />
                    </div>
                    <div className="absolute top-2 left-2">
                      <span className="px-2 py-0.5 rounded-md text-xs bg-black/50 text-white">
                        {DEVICE_CONFIG[banner.device].label}
                      </span>
                    </div>
                  </div>

                  <div className="p-4">
                    <h3 className="font-semibold text-[var(--tp-fg)] mb-1 group-hover:text-[var(--tp-primary)] transition-colors text-sm">{banner.title}</h3>
                    <p className="text-xs text-[var(--tp-fg-muted)] mb-3 line-clamp-2">{banner.description}</p>

                    {/* Stats row */}
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3 text-[var(--tp-fg-muted)]">
                        <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{fmt(banner.stats.impressions)}</span>
                        <span className="flex items-center gap-1"><MousePointerClick className="w-3 h-3" />{fmt(banner.stats.clicks)}</span>
                        {banner.stats.impressions > 0 && (
                          <span className="flex items-center gap-1 text-green-600 font-medium">
                            <TrendingUp className="w-3 h-3" />{banner.stats.ctr.toFixed(1)}%
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          className="p-1.5 rounded-lg hover:bg-[var(--tp-surface-2)] text-[var(--tp-fg-muted)]"
                          onClick={e => { e.stopPropagation(); }}
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        {banner.status === "active" ? (
                          <button
                            className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"
                            onClick={e => {
                              e.stopPropagation();
                              setBanners(prev => prev.map(b => b.id === banner.id ? { ...b, status: "inactive" } : b));
                            }}
                          >
                            <ToggleLeft className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            className="p-1.5 rounded-lg hover:bg-green-50 text-green-600"
                            onClick={e => {
                              e.stopPropagation();
                              setBanners(prev => prev.map(b => b.id === banner.id ? { ...b, status: "active" } : b));
                            }}
                          >
                            <ToggleRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Date range */}
                    {(banner.startDate || banner.endDate) && (
                      <div className="mt-2 pt-2 border-t border-[var(--tp-border)] flex items-center gap-1 text-xs text-[var(--tp-fg-muted)]">
                        <Calendar className="w-3 h-3" />
                        {banner.startDate && new Date(banner.startDate).toLocaleDateString("zh-CN", { month: "short", day: "numeric" })}
                        {banner.startDate && banner.endDate && " → "}
                        {banner.endDate && new Date(banner.endDate).toLocaleDateString("zh-CN", { month: "short", day: "numeric" })}
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {selected && (
        <BannerDetailDrawer
          banner={selected}
          onClose={() => setSelected(null)}
          onToggle={handleToggle}
        />
      )}
    </div>
  );
}
