"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Newspaper, Plus, Eye, Edit, Send, ChevronRight,
  Clock, CheckCircle, FileText, Tag, Globe, Search,
  BookOpen, TrendingUp, Star, Archive, Pin, User,
  Calendar,
} from "lucide-react";
import { Button, PageHeader, Card, EmptyState } from "@/components/crm/ui/PageHeader";
import { Drawer, DrawerFooter } from "@/components/crm/ui/Drawer";

// ─── Types ────────────────────────────────────────────────────────────────────

type NewsStatus = "draft" | "published" | "scheduled" | "archived";
type NewsCategory = "market_news" | "platform_update" | "education" | "announcement" | "promotion";
type NewsLang = "zh" | "en" | "multi";

interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: NewsCategory;
  lang: NewsLang;
  status: NewsStatus;
  isPinned: boolean;
  isFeatured: boolean;
  author: string;
  targetRegions: string[];
  tags: string[];
  publishedAt?: string;
  scheduledAt?: string;
  stats: {
    views: number;
    likes: number;
    shares: number;
  };
  createdAt: string;
  updatedAt: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_ARTICLES: NewsArticle[] = [
  {
    id: "NEWS001",
    title: "美联储维持利率不变，美元指数短线震荡",
    summary: "美联储在最新议息会议上决定维持联邦基金利率目标区间不变，美元指数在消息公布后出现短线震荡，EUR/USD 汇率随后回落至 1.0820 附近。",
    content: "...",
    category: "market_news",
    lang: "zh",
    status: "published",
    isPinned: true,
    isFeatured: true,
    author: "市场分析团队",
    targetRegions: ["ALL"],
    tags: ["美联储", "美元", "利率", "外汇"],
    publishedAt: "2026-04-05T08:00:00Z",
    stats: { views: 3842, likes: 124, shares: 56 },
    createdAt: "2026-04-04T22:00:00Z",
    updatedAt: "2026-04-05T08:00:00Z",
  },
  {
    id: "NEWS002",
    title: "TradePass 平台新功能发布：一键跟单交易正式上线",
    summary: "TradePass 正式推出「智能跟单」功能，用户可以选择跟随优秀交易员的策略自动复制交易，无需主动操盘即可参与市场。",
    content: "...",
    category: "platform_update",
    lang: "multi",
    status: "published",
    isPinned: false,
    isFeatured: true,
    author: "产品团队",
    targetRegions: ["ALL"],
    tags: ["新功能", "跟单", "产品更新"],
    publishedAt: "2026-04-03T10:00:00Z",
    stats: { views: 5213, likes: 287, shares: 134 },
    createdAt: "2026-04-02T14:00:00Z",
    updatedAt: "2026-04-03T10:00:00Z",
  },
  {
    id: "NEWS003",
    title: "初学者指南：如何读懂外汇 K 线图",
    summary: "本文将从最基础的 K 线形态入手，介绍日线、周线、月线的分析方法，并结合真实案例讲解如何利用技术分析辅助交易决策。",
    content: "...",
    category: "education",
    lang: "zh",
    status: "published",
    isPinned: false,
    isFeatured: false,
    author: "教育内容团队",
    targetRegions: ["VN", "TH", "IN"],
    tags: ["K线", "技术分析", "外汇入门", "图表"],
    publishedAt: "2026-04-01T09:00:00Z",
    stats: { views: 2156, likes: 98, shares: 43 },
    createdAt: "2026-03-30T16:00:00Z",
    updatedAt: "2026-04-01T09:00:00Z",
  },
  {
    id: "NEWS004",
    title: "关于修订《用户服务协议》的通知",
    summary: "根据相关法规要求，我们对《用户服务协议》部分条款进行了修订，主要涉及数据隐私保护和交易纠纷处理机制，修订版将于 2026 年 5 月 1 日正式生效。",
    content: "...",
    category: "announcement",
    lang: "multi",
    status: "scheduled",
    isPinned: false,
    isFeatured: false,
    author: "法务合规部",
    targetRegions: ["ALL"],
    tags: ["公告", "协议更新", "合规"],
    scheduledAt: "2026-04-10T09:00:00Z",
    stats: { views: 0, likes: 0, shares: 0 },
    createdAt: "2026-04-04T11:00:00Z",
    updatedAt: "2026-04-04T11:00:00Z",
  },
  {
    id: "NEWS005",
    title: "四月入金奖励活动规则说明",
    summary: "四月入金奖励活动现已开启，所有通过 KYC 认证的用户均可参与。入金达到指定门槛后，奖励资金将在 T+1 个工作日内自动发放至账户。",
    content: "...",
    category: "promotion",
    lang: "multi",
    status: "published",
    isPinned: false,
    isFeatured: false,
    author: "营销团队",
    targetRegions: ["ALL"],
    tags: ["促销", "入金奖励", "活动"],
    publishedAt: "2026-04-01T00:00:00Z",
    stats: { views: 4128, likes: 201, shares: 88 },
    createdAt: "2026-03-31T18:00:00Z",
    updatedAt: "2026-04-01T00:00:00Z",
  },
  {
    id: "NEWS006",
    title: "2026 年第一季度市场回顾与展望",
    summary: "回顾 Q1 2026 年全球外汇市场的主要走势，分析美元、欧元、英镑、日元等主要货币的表现，并对 Q2 的市场趋势进行前瞻性研判。",
    content: "...",
    category: "market_news",
    lang: "zh",
    status: "archived",
    isPinned: false,
    isFeatured: false,
    author: "研究部",
    targetRegions: ["ALL"],
    tags: ["季度报告", "市场分析", "Q1 2026"],
    publishedAt: "2026-03-31T10:00:00Z",
    stats: { views: 1876, likes: 72, shares: 29 },
    createdAt: "2026-03-29T14:00:00Z",
    updatedAt: "2026-03-31T10:00:00Z",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<NewsCategory, { label: string; color: string; icon: React.ReactNode }> = {
  market_news: { label: "市场资讯", color: "bg-blue-100 text-blue-700", icon: <TrendingUp className="w-3.5 h-3.5" /> },
  platform_update: { label: "平台更新", color: "bg-purple-100 text-purple-700", icon: <Star className="w-3.5 h-3.5" /> },
  education: { label: "教育内容", color: "bg-indigo-100 text-indigo-700", icon: <BookOpen className="w-3.5 h-3.5" /> },
  announcement: { label: "公告通知", color: "bg-orange-100 text-orange-700", icon: <FileText className="w-3.5 h-3.5" /> },
  promotion: { label: "活动促销", color: "bg-pink-100 text-pink-700", icon: <Tag className="w-3.5 h-3.5" /> },
};

const STATUS_CONFIG: Record<NewsStatus, { label: string; color: string; dot: string }> = {
  draft: { label: "草稿", color: "bg-gray-100 text-gray-600", dot: "bg-gray-400" },
  published: { label: "已发布", color: "bg-green-100 text-green-700", dot: "bg-green-500" },
  scheduled: { label: "已计划", color: "bg-blue-100 text-blue-700", dot: "bg-blue-500" },
  archived: { label: "已归档", color: "bg-gray-100 text-gray-500", dot: "bg-gray-300" },
};

const LANG_LABELS: Record<NewsLang, string> = { zh: "中文", en: "English", multi: "多语言" };
const fmt = (n: number) => n.toLocaleString();

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: NewsStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function ArticleDrawer({ article, onClose, onPublish, onArchive }: {
  article: NewsArticle;
  onClose: () => void;
  onPublish: () => void;
  onArchive: () => void;
}) {
  const cat = CATEGORY_CONFIG[article.category];
  return (
    <Drawer isOpen onClose={onClose} title={article.title} size="lg"
        footer={<DrawerFooter>
        <Button variant="secondary" onClick={onClose}>关闭</Button>
        <Button variant="secondary"><Edit className="w-4 h-4" />编辑</Button>
        {article.status === "draft" && (
          <Button variant="primary" onClick={onPublish}><Send className="w-4 h-4" />发布</Button>
        )}
        {article.status === "published" && (
          <Button variant="secondary" onClick={onArchive}><Archive className="w-4 h-4" />归档</Button>
        )}
      </DrawerFooter>}
      >
      <div className="p-6 space-y-6">
        {/* Meta */}
        <div className="flex flex-wrap gap-2">
          <StatusBadge status={article.status} />
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cat.color}`}>
            {cat.icon}{cat.label}
          </span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-[var(--tp-surface-2)] text-[var(--tp-fg-muted)]">
            {LANG_LABELS[article.lang]}
          </span>
          {article.isPinned && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-700">
              <Pin className="w-3 h-3" />置顶
            </span>
          )}
          {article.isFeatured && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-700">
              <Star className="w-3 h-3" />精选
            </span>
          )}
        </div>

        {/* Summary */}
        <div>
          <p className="text-xs text-[var(--tp-fg-muted)] mb-2">文章摘要</p>
          <p className="text-sm text-[var(--tp-fg)] leading-relaxed bg-[var(--tp-surface-2)] rounded-xl p-4">
            {article.summary}
          </p>
        </div>

        {/* Author & region */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-[var(--tp-fg-muted)] mb-1">作者</p>
            <div className="flex items-center gap-1.5">
              <User className="w-4 h-4 text-[var(--tp-fg-muted)]" />
              <span className="text-sm text-[var(--tp-fg)]">{article.author}</span>
            </div>
          </div>
          <div>
            <p className="text-xs text-[var(--tp-fg-muted)] mb-1">目标地区</p>
            <div className="flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-[var(--tp-fg-muted)]" />
              <span className="text-sm text-[var(--tp-fg)]">{article.targetRegions.join(", ")}</span>
            </div>
          </div>
          {article.publishedAt && (
            <div>
              <p className="text-xs text-[var(--tp-fg-muted)] mb-1">发布时间</p>
              <p className="text-sm text-[var(--tp-fg)]">{new Date(article.publishedAt).toLocaleString("zh-CN")}</p>
            </div>
          )}
          {article.scheduledAt && (
            <div>
              <p className="text-xs text-[var(--tp-fg-muted)] mb-1">计划发布</p>
              <p className="text-sm text-[var(--tp-fg)]">{new Date(article.scheduledAt).toLocaleString("zh-CN")}</p>
            </div>
          )}
        </div>

        {/* Tags */}
        <div>
          <p className="text-xs text-[var(--tp-fg-muted)] mb-2">标签</p>
          <div className="flex flex-wrap gap-1.5">
            {article.tags.map(tag => (
              <span key={tag} className="px-2 py-0.5 rounded-md text-xs bg-[var(--tp-surface-2)] text-[var(--tp-fg)] border border-[var(--tp-border)]">
                # {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Stats */}
        {article.stats.views > 0 && (
          <div>
            <p className="text-xs text-[var(--tp-fg-muted)] mb-3">阅读数据</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "阅读量", value: fmt(article.stats.views), icon: <Eye className="w-4 h-4" />, color: "text-blue-600 bg-blue-50" },
                { label: "点赞", value: fmt(article.stats.likes), icon: <Star className="w-4 h-4" />, color: "text-yellow-600 bg-yellow-50" },
                { label: "分享", value: fmt(article.stats.shares), icon: <TrendingUp className="w-4 h-4" />, color: "text-green-600 bg-green-50" },
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

export default function NewsPage() {
  const [articles, setArticles] = useState<NewsArticle[]>(MOCK_ARTICLES);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<NewsStatus | "all">("all");
  const [filterCategory, setFilterCategory] = useState<NewsCategory | "all">("all");
  const [selected, setSelected] = useState<NewsArticle | null>(null);

  const filtered = articles.filter(a => {
    if (filterStatus !== "all" && a.status !== filterStatus) return false;
    if (filterCategory !== "all" && a.category !== filterCategory) return false;
    if (search && !a.title.toLowerCase().includes(search.toLowerCase()) &&
        !a.summary.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const publishedCount = articles.filter(a => a.status === "published").length;
  const totalViews = articles.reduce((s, a) => s + a.stats.views, 0);
  const draftCount = articles.filter(a => a.status === "draft").length;

  const handlePublish = () => {
    if (!selected) return;
    const now = new Date().toISOString();
    setArticles(prev => prev.map(a =>
      a.id === selected.id ? { ...a, status: "published", publishedAt: now, updatedAt: now } : a
    ));
    setSelected(prev => prev ? { ...prev, status: "published", publishedAt: now } : null);
  };

  const handleArchive = () => {
    if (!selected) return;
    const now = new Date().toISOString();
    setArticles(prev => prev.map(a =>
      a.id === selected.id ? { ...a, status: "archived", updatedAt: now } : a
    ));
    setSelected(null);
  };

  const breadcrumbs = [{ label: "后台管理" }, { label: "营销管理" }, { label: "资讯管理" }];

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
        title="资讯管理"
        description="发布市场资讯、平台公告、教育内容等多类型文章"
        actions={
          <Button variant="primary"><Plus className="w-4 h-4" />写文章</Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "文章总数", value: articles.length, icon: <Newspaper className="w-5 h-5" />, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "已发布", value: publishedCount, icon: <CheckCircle className="w-5 h-5" />, color: "text-green-600", bg: "bg-green-50" },
          { label: "草稿", value: draftCount, icon: <FileText className="w-5 h-5" />, color: "text-orange-600", bg: "bg-orange-50" },
          { label: "总阅读量", value: fmt(totalViews), icon: <Eye className="w-5 h-5" />, color: "text-purple-600", bg: "bg-purple-50" },
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
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--tp-fg-muted)]" />
            <input
              type="text"
              placeholder="搜索文章标题或内容..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-[var(--tp-surface-2)] border border-[var(--tp-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--tp-primary)]/30 text-[var(--tp-fg)]"
            />
          </div>
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value as NewsCategory | "all")}
            className="px-3 py-2 text-sm bg-[var(--tp-surface-2)] border border-[var(--tp-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--tp-primary)]/30 text-[var(--tp-fg)]"
          >
            <option value="all">全部分类</option>
            {(Object.keys(CATEGORY_CONFIG) as NewsCategory[]).map(c => (
              <option key={c} value={c}>{CATEGORY_CONFIG[c].label}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as NewsStatus | "all")}
            className="px-3 py-2 text-sm bg-[var(--tp-surface-2)] border border-[var(--tp-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--tp-primary)]/30 text-[var(--tp-fg)]"
          >
            <option value="all">全部状态</option>
            {(Object.keys(STATUS_CONFIG) as NewsStatus[]).map(s => (
              <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
            ))}
          </select>
        </div>
      </Card>

      {/* Article list */}
      {filtered.length === 0 ? (
        <EmptyState icon={<Newspaper className="w-12 h-12" />} title="暂无文章" description="调整筛选条件或创建新文章" />
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filtered.map((article, i) => {
              const cat = CATEGORY_CONFIG[article.category];
              return (
                <motion.div
                  key={article.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Card className="p-5 hover:shadow-md transition-all cursor-pointer group" onClick={() => setSelected(article)}>
                    <div className="flex items-start gap-4">
                      {/* Category icon */}
                      <div className={`p-2.5 rounded-xl flex-shrink-0 ${cat.color}`}>
                        {cat.icon}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2 mb-1 flex-wrap">
                          <h3 className="font-semibold text-[var(--tp-fg)] group-hover:text-[var(--tp-primary)] transition-colors">
                            {article.isPinned && <Pin className="w-3.5 h-3.5 inline mr-1 text-yellow-500" />}
                            {article.isFeatured && <Star className="w-3.5 h-3.5 inline mr-1 text-amber-500" />}
                            {article.title}
                          </h3>
                          <StatusBadge status={article.status} />
                        </div>
                        <p className="text-sm text-[var(--tp-fg-muted)] line-clamp-2 mb-3">{article.summary}</p>

                        <div className="flex items-center gap-4 text-xs text-[var(--tp-fg-muted)] flex-wrap">
                          <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${cat.color}`}>{cat.label}</span>
                          <span className="flex items-center gap-1"><User className="w-3 h-3" />{article.author}</span>
                          {article.publishedAt && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(article.publishedAt).toLocaleDateString("zh-CN")}
                            </span>
                          )}
                          {article.stats.views > 0 && (
                            <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{fmt(article.stats.views)} 阅读</span>
                          )}
                          <div className="flex gap-1">
                            {article.tags.slice(0, 3).map(tag => (
                              <span key={tag} className="px-1.5 py-0 rounded bg-[var(--tp-surface-2)] text-[var(--tp-fg-muted)]"># {tag}</span>
                            ))}
                            {article.tags.length > 3 && (
                              <span className="text-[var(--tp-fg-muted)]">+{article.tags.length - 3}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <button className="p-1.5 rounded-lg hover:bg-[var(--tp-surface-2)] text-[var(--tp-fg-muted)]">
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {selected && (
        <ArticleDrawer
          article={selected}
          onClose={() => setSelected(null)}
          onPublish={handlePublish}
          onArchive={handleArchive}
        />
      )}
    </div>
  );
}
