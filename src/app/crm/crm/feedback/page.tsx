"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle, Star, ThumbsUp, ThumbsDown, Minus,
  ChevronRight, Search, Filter, Eye, CheckCircle,
  AlertCircle, Clock, TrendingUp, BarChart2, Tag,
  User, Calendar, Flag,
} from "lucide-react";
import { Button, PageHeader, Card, EmptyState } from "@/components/crm/ui/PageHeader";
import { Drawer, DrawerFooter } from "@/components/crm/ui/Drawer";

// ─── Types ────────────────────────────────────────────────────────────────────

type FeedbackType = "suggestion" | "bug" | "compliment" | "complaint" | "question";
type FeedbackStatus = "new" | "reviewing" | "resolved" | "closed";
type FeedbackSentiment = "positive" | "neutral" | "negative";

interface Feedback {
  id: string;
  userId: string;
  userName: string;
  userRegion: string;
  type: FeedbackType;
  status: FeedbackStatus;
  sentiment: FeedbackSentiment;
  subject: string;
  content: string;
  rating?: number; // 1-5
  tags: string[];
  assignedTo?: string;
  response?: string;
  respondedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_FEEDBACK: Feedback[] = [
  {
    id: "FB001",
    userId: "U001",
    userName: "Nguyen Van A",
    userRegion: "VN",
    type: "compliment",
    status: "resolved",
    sentiment: "positive",
    subject: "入金速度非常快！",
    content: "上个月开始使用 TradePass，出入金速度比之前用的平台快很多，客服响应也很及时。希望继续保持！",
    rating: 5,
    tags: ["入金", "客服", "用户体验"],
    response: "感谢您的认可！我们会继续努力为您提供更好的服务。",
    respondedAt: "2026-04-02T14:00:00Z",
    createdAt: "2026-04-01T09:30:00Z",
    updatedAt: "2026-04-02T14:00:00Z",
  },
  {
    id: "FB002",
    userId: "U045",
    userName: "Somchai P.",
    userRegion: "TH",
    type: "bug",
    status: "reviewing",
    sentiment: "negative",
    subject: "移动端 K 线图加载缓慢",
    content: "在 iPhone 14 上使用移动端 App，打开 K 线图时经常卡顿，有时候要等 5-10 秒才能加载出来。桌面端没有这个问题。请尽快修复。",
    rating: 2,
    tags: ["移动端", "K线图", "性能"],
    assignedTo: "技术团队",
    createdAt: "2026-04-03T11:20:00Z",
    updatedAt: "2026-04-03T15:00:00Z",
  },
  {
    id: "FB003",
    userId: "U112",
    userName: "Rajesh K.",
    userRegion: "IN",
    type: "suggestion",
    status: "reviewing",
    sentiment: "neutral",
    subject: "希望增加 UPI 支付方式",
    content: "目前平台支持的印度支付方式比较少，希望能增加 UPI（统一支付接口）支持，这样印度用户入金会方便很多。",
    rating: 3,
    tags: ["支付", "印度", "功能请求"],
    assignedTo: "产品团队",
    createdAt: "2026-04-02T16:45:00Z",
    updatedAt: "2026-04-03T09:00:00Z",
  },
  {
    id: "FB004",
    userId: "U078",
    userName: "김민준",
    userRegion: "KR",
    type: "complaint",
    status: "new",
    sentiment: "negative",
    subject: "KYC 审核等待时间过长",
    content: "我已经提交了 KYC 申请 3 天了，还没有收到任何回复。客服说 1-2 个工作日内处理，但已经超时了。希望尽快处理我的申请。",
    rating: 1,
    tags: ["KYC", "审核速度", "客服"],
    createdAt: "2026-04-04T08:10:00Z",
    updatedAt: "2026-04-04T08:10:00Z",
  },
  {
    id: "FB005",
    userId: "U203",
    userName: "田中 一郎",
    userRegion: "JP",
    type: "suggestion",
    status: "closed",
    sentiment: "positive",
    subject: "建议增加日语客服支持",
    content: "目前平台的日语翻译不太准确，有些专业术语翻译有误。建议招募日语母语客服，或者邀请专业翻译机构合作优化平台日语内容。",
    rating: 4,
    tags: ["多语言", "日语", "客服"],
    response: "感谢您的建议！我们已将此反馈提交给产品团队，正在评估日语支持方案。",
    respondedAt: "2026-04-01T11:00:00Z",
    createdAt: "2026-03-31T14:30:00Z",
    updatedAt: "2026-04-01T11:00:00Z",
  },
  {
    id: "FB006",
    userId: "U156",
    userName: "Carlos M.",
    userRegion: "BR",
    type: "question",
    status: "resolved",
    sentiment: "neutral",
    subject: "关于杠杆倍数的设置",
    content: "我想了解如何修改账户的杠杆倍数。目前我的账户是 1:100，我需要调低到 1:50 以更好地管理风险。请问应该在哪里操作？",
    rating: 4,
    tags: ["账户设置", "杠杆", "风险管理"],
    response: "您可以在账户设置 → 交易设置 → 杠杆管理中修改杠杆倍数。如需进一步帮助请联系在线客服。",
    respondedAt: "2026-04-03T10:30:00Z",
    createdAt: "2026-04-03T09:00:00Z",
    updatedAt: "2026-04-03T10:30:00Z",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<FeedbackType, { label: string; color: string; icon: React.ReactNode }> = {
  suggestion: { label: "建议", color: "bg-blue-100 text-blue-700", icon: <TrendingUp className="w-3.5 h-3.5" /> },
  bug: { label: "Bug", color: "bg-red-100 text-red-700", icon: <AlertCircle className="w-3.5 h-3.5" /> },
  compliment: { label: "表扬", color: "bg-green-100 text-green-700", icon: <ThumbsUp className="w-3.5 h-3.5" /> },
  complaint: { label: "投诉", color: "bg-orange-100 text-orange-700", icon: <ThumbsDown className="w-3.5 h-3.5" /> },
  question: { label: "咨询", color: "bg-purple-100 text-purple-700", icon: <MessageCircle className="w-3.5 h-3.5" /> },
};

const STATUS_CONFIG: Record<FeedbackStatus, { label: string; color: string; dot: string }> = {
  new: { label: "新建", color: "bg-blue-100 text-blue-700", dot: "bg-blue-500 animate-pulse" },
  reviewing: { label: "处理中", color: "bg-yellow-100 text-yellow-700", dot: "bg-yellow-500" },
  resolved: { label: "已解决", color: "bg-green-100 text-green-700", dot: "bg-green-500" },
  closed: { label: "已关闭", color: "bg-gray-100 text-gray-500", dot: "bg-gray-300" },
};

const SENTIMENT_CONFIG: Record<FeedbackSentiment, { icon: React.ReactNode; color: string }> = {
  positive: { icon: <ThumbsUp className="w-3.5 h-3.5" />, color: "text-green-600" },
  neutral: { icon: <Minus className="w-3.5 h-3.5" />, color: "text-gray-500" },
  negative: { icon: <ThumbsDown className="w-3.5 h-3.5" />, color: "text-red-600" },
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(n => (
        <Star key={n} className={`w-3.5 h-3.5 ${n <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`} />
      ))}
    </div>
  );
}

function FeedbackDetailDrawer({ fb, onClose }: { fb: Feedback; onClose: () => void }) {
  const tp = TYPE_CONFIG[fb.type];
  const st = STATUS_CONFIG[fb.status];
  const sm = SENTIMENT_CONFIG[fb.sentiment];
  const [reply, setReply] = useState("");

  return (
    <Drawer isOpen onClose={onClose} title={fb.subject} size="lg"
        footer={<DrawerFooter>
        <Button variant="secondary" onClick={onClose}>关闭</Button>
        {(fb.status === "new" || fb.status === "reviewing") && (
          <>
            {!fb.response && reply && (
              <Button variant="primary"><CheckCircle className="w-4 h-4" />回复并解决</Button>
            )}
            {fb.status === "reviewing" && (
              <Button variant="secondary"><CheckCircle className="w-4 h-4" />标记已解决</Button>
            )}
          </>
        )}
      </DrawerFooter>}
      >
      <div className="p-6 space-y-6">
        {/* Meta */}
        <div className="flex flex-wrap gap-2">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${tp.color}`}>
            {tp.icon}{tp.label}
          </span>
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${st.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />{st.label}
          </span>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${sm.color} bg-[var(--tp-surface-2)]`}>
            {sm.icon}
          </span>
        </div>

        {/* User info */}
        <div className="flex items-center gap-3 bg-[var(--tp-surface-2)] rounded-xl p-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--tp-primary)] to-[var(--tp-accent)] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {fb.userName.charAt(0)}
          </div>
          <div>
            <p className="font-medium text-[var(--tp-fg)] text-sm">{fb.userName}</p>
            <p className="text-xs text-[var(--tp-fg-muted)]">{fb.userId} · {fb.userRegion}</p>
          </div>
          {fb.rating && (
            <div className="ml-auto">
              <StarRating rating={fb.rating} />
            </div>
          )}
        </div>

        {/* Content */}
        <div>
          <p className="text-xs text-[var(--tp-fg-muted)] mb-2">反馈内容</p>
          <p className="text-sm text-[var(--tp-fg)] leading-relaxed bg-[var(--tp-surface-2)] rounded-xl p-4">{fb.content}</p>
        </div>

        {/* Tags */}
        {fb.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {fb.tags.map(tag => (
              <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs bg-[var(--tp-surface-2)] text-[var(--tp-fg-muted)]">
                <Tag className="w-3 h-3" />{tag}
              </span>
            ))}
          </div>
        )}

        {/* Existing response */}
        {fb.response && (
          <div>
            <p className="text-xs text-[var(--tp-fg-muted)] mb-2">官方回复</p>
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-sm text-[var(--tp-fg)] leading-relaxed">{fb.response}</p>
              {fb.respondedAt && (
                <p className="text-xs text-[var(--tp-fg-muted)] mt-2">{new Date(fb.respondedAt).toLocaleString("zh-CN")}</p>
              )}
            </div>
          </div>
        )}

        {/* Reply box (for new/reviewing) */}
        {(fb.status === "new" || fb.status === "reviewing") && !fb.response && (
          <div>
            <p className="text-xs text-[var(--tp-fg-muted)] mb-2">回复用户</p>
            <textarea
              value={reply}
              onChange={e => setReply(e.target.value)}
              rows={3}
              placeholder="输入回复内容..."
              className="w-full px-3 py-2 text-sm bg-[var(--tp-surface-2)] border border-[var(--tp-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--tp-primary)]/30 text-[var(--tp-fg)] resize-none"
            />
          </div>
        )}

        <div className="text-xs text-[var(--tp-fg-muted)] border-t border-[var(--tp-border)] pt-4">
          <div>提交时间：{new Date(fb.createdAt).toLocaleString("zh-CN")}</div>
          {fb.assignedTo && <div className="mt-1">分配给：{fb.assignedTo}</div>}
        </div>
      </div>

          </Drawer>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function FeedbackPage() {
  const [feedbacks] = useState<Feedback[]>(MOCK_FEEDBACK);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<FeedbackType | "all">("all");
  const [filterStatus, setFilterStatus] = useState<FeedbackStatus | "all">("all");
  const [selected, setSelected] = useState<Feedback | null>(null);

  const filtered = feedbacks.filter(f => {
    if (filterType !== "all" && f.type !== filterType) return false;
    if (filterStatus !== "all" && f.status !== filterStatus) return false;
    if (search && !f.subject.toLowerCase().includes(search.toLowerCase()) &&
        !f.userName.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const newCount = feedbacks.filter(f => f.status === "new").length;
  const negativeCount = feedbacks.filter(f => f.sentiment === "negative").length;
  const avgRating = feedbacks.filter(f => f.rating).reduce((s, f) => s + (f.rating || 0), 0) / feedbacks.filter(f => f.rating).length;

  const breadcrumbs = [{ label: "后台管理" }, { label: "CRM" }, { label: "用户反馈" }];

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
        title="用户反馈"
        description="收集、分析并回应用户的建议、投诉与表扬"
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "总反馈数", value: feedbacks.length, icon: <MessageCircle className="w-5 h-5" />, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "待处理", value: newCount, icon: <Clock className="w-5 h-5" />, color: newCount > 0 ? "text-red-600" : "text-green-600", bg: newCount > 0 ? "bg-red-50" : "bg-green-50" },
          { label: "负面反馈", value: negativeCount, icon: <ThumbsDown className="w-5 h-5" />, color: "text-orange-600", bg: "bg-orange-50" },
          { label: "平均评分", value: avgRating.toFixed(1) + " ★", icon: <Star className="w-5 h-5" />, color: "text-yellow-600", bg: "bg-yellow-50" },
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
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--tp-fg-muted)]" />
            <input
              type="text"
              placeholder="搜索反馈内容或用户..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-[var(--tp-surface-2)] border border-[var(--tp-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--tp-primary)]/30 text-[var(--tp-fg)]"
            />
          </div>
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value as FeedbackType | "all")}
            className="px-3 py-2 text-sm bg-[var(--tp-surface-2)] border border-[var(--tp-border)] rounded-lg focus:outline-none text-[var(--tp-fg)]"
          >
            <option value="all">全部类型</option>
            {(Object.keys(TYPE_CONFIG) as FeedbackType[]).map(t => (
              <option key={t} value={t}>{TYPE_CONFIG[t].label}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as FeedbackStatus | "all")}
            className="px-3 py-2 text-sm bg-[var(--tp-surface-2)] border border-[var(--tp-border)] rounded-lg focus:outline-none text-[var(--tp-fg)]"
          >
            <option value="all">全部状态</option>
            {(Object.keys(STATUS_CONFIG) as FeedbackStatus[]).map(s => (
              <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
            ))}
          </select>
        </div>
      </Card>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState icon={<MessageCircle className="w-12 h-12" />} title="暂无反馈" description="调整筛选条件查看反馈" />
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filtered.map((fb, i) => {
              const tp = TYPE_CONFIG[fb.type];
              const sm = SENTIMENT_CONFIG[fb.sentiment];
              return (
                <motion.div
                  key={fb.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Card
                    className={`p-5 hover:shadow-md transition-all cursor-pointer group ${fb.status === "new" ? "border-l-4 border-l-blue-500" : ""}`}
                    onClick={() => setSelected(fb)}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {fb.userName.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <span className="font-semibold text-[var(--tp-fg)] text-sm group-hover:text-[var(--tp-primary)] transition-colors">{fb.subject}</span>
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium ${tp.color}`}>{tp.label}</span>
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium ${STATUS_CONFIG[fb.status].color}`}>
                            {STATUS_CONFIG[fb.status].label}
                          </span>
                          <span className={`${sm.color}`}>{sm.icon}</span>
                        </div>
                        <p className="text-xs text-[var(--tp-fg-muted)] mb-2">{fb.userName} · {fb.userRegion}</p>
                        <p className="text-sm text-[var(--tp-fg-muted)] line-clamp-2">{fb.content}</p>
                        {fb.rating && (
                          <div className="mt-2">
                            <StarRating rating={fb.rating} />
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-[var(--tp-fg-muted)] flex-shrink-0 text-right">
                        <div>{new Date(fb.createdAt).toLocaleDateString("zh-CN")}</div>
                        {fb.assignedTo && <div className="mt-1 text-blue-600">{fb.assignedTo}</div>}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {selected && <FeedbackDetailDrawer fb={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
