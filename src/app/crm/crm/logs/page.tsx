"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Phone, Mail, MessageSquare, Video, ChevronRight,
  Search, User, Clock, CheckCircle, Eye, ArrowUpRight,
  Calendar, Tag, Filter, ExternalLink, Star,
  MessageCircle, Users,
} from "lucide-react";
import { Button, PageHeader, Card, EmptyState } from "@/components/crm/ui/PageHeader";
import { Drawer, DrawerFooter } from "@/components/crm/ui/Drawer";

// ─── Types ────────────────────────────────────────────────────────────────────

type LogChannel = "email" | "phone" | "live_chat" | "ticket" | "video_call";
type LogType = "inbound" | "outbound";
type LogOutcome = "resolved" | "escalated" | "follow_up" | "no_action" | "callback";

interface CommunicationLog {
  id: string;
  userId: string;
  userName: string;
  userRegion: string;
  agentName: string;
  channel: LogChannel;
  type: LogType;
  outcome: LogOutcome;
  subject: string;
  summary: string;
  duration?: number; // minutes
  satisfaction?: number; // 1-5
  tags: string[];
  relatedTicket?: string;
  followUpDate?: string;
  createdAt: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_LOGS: CommunicationLog[] = [
  {
    id: "LOG001",
    userId: "U045",
    userName: "Somchai P.",
    userRegion: "TH",
    agentName: "陈小明",
    channel: "live_chat",
    type: "inbound",
    outcome: "resolved",
    subject: "出金申请状态查询",
    summary: "用户询问 3 日前提交的 $500 出金申请进度。经查系统，申请已于当日上午处理完毕，提醒用户 T+2 个工作日到账。用户确认收悉，满意度较高。",
    duration: 12,
    satisfaction: 5,
    tags: ["出金", "状态查询"],
    createdAt: "2026-04-05T10:30:00Z",
  },
  {
    id: "LOG002",
    userId: "U112",
    userName: "Rajesh K.",
    userRegion: "IN",
    agentName: "李雪",
    channel: "email",
    type: "inbound",
    outcome: "follow_up",
    subject: "KYC 文件重新提交说明",
    summary: "用户询问 KYC 审核被拒原因。经审核，系统显示地址证明文件清晰度不足。已通过邮件向用户说明具体要求，并提供重新提交指引。设置 24 小时跟进提醒。",
    duration: undefined,
    satisfaction: 3,
    tags: ["KYC", "文件审核"],
    followUpDate: "2026-04-06T09:00:00Z",
    createdAt: "2026-04-04T15:20:00Z",
  },
  {
    id: "LOG003",
    userId: "U078",
    userName: "김민준",
    userRegion: "KR",
    agentName: "王芳",
    channel: "phone",
    type: "inbound",
    outcome: "escalated",
    subject: "账户异常锁定投诉",
    summary: "用户反映账户被意外锁定，无法登录。经初步排查，触发了多次失败登录风控规则。本次联系暂未能直接解锁，已升级至安全团队处理，承诺 2 小时内回复。",
    duration: 18,
    satisfaction: 2,
    tags: ["账户锁定", "风控", "升级"],
    relatedTicket: "TKT-2026-0047",
    createdAt: "2026-04-04T11:05:00Z",
  },
  {
    id: "LOG004",
    userId: "U203",
    userName: "田中 一郎",
    userRegion: "JP",
    agentName: "陈小明",
    channel: "ticket",
    type: "outbound",
    outcome: "resolved",
    subject: "点差优化计划说明（主动沟通）",
    summary: "根据运营团队指示，主动联系高频交易用户，告知下月点差调整计划及新的 VIP 优惠政策。用户对新政策表示满意，询问了 VIP 晋级条件，已完整解答。",
    duration: undefined,
    satisfaction: 5,
    tags: ["VIP", "点差", "主动沟通"],
    createdAt: "2026-04-03T14:00:00Z",
  },
  {
    id: "LOG005",
    userId: "U156",
    userName: "Carlos M.",
    userRegion: "BR",
    agentName: "李雪",
    channel: "video_call",
    type: "inbound",
    outcome: "resolved",
    subject: "MT5 平台使用教学",
    summary: "用户刚开始使用 MT5，对基本操作不熟悉，申请视频辅导。通过 30 分钟屏幕分享，演示了账户连接、创建订单、设置止损止盈等核心功能。用户反馈学习效果很好。",
    duration: 30,
    satisfaction: 5,
    tags: ["MT5", "新手教学", "视频"],
    createdAt: "2026-04-03T09:00:00Z",
  },
  {
    id: "LOG006",
    userId: "U001",
    userName: "Nguyen Van A",
    userRegion: "VN",
    agentName: "王芳",
    channel: "live_chat",
    type: "inbound",
    outcome: "no_action",
    subject: "入金方式咨询",
    summary: "用户询问是否支持本地越南银行直接转账（VietcomBank）。确认目前支持 VietcomBank 本地转账入金，提供了详细的操作步骤和注意事项。用户无需进一步跟进。",
    duration: 8,
    satisfaction: 4,
    tags: ["入金", "越南", "银行转账"],
    createdAt: "2026-04-02T16:45:00Z",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CHANNEL_CONFIG: Record<LogChannel, { label: string; icon: React.ReactNode; color: string }> = {
  email: { label: "邮件", icon: <Mail className="w-3.5 h-3.5" />, color: "bg-blue-100 text-blue-700" },
  phone: { label: "电话", icon: <Phone className="w-3.5 h-3.5" />, color: "bg-green-100 text-green-700" },
  live_chat: { label: "在线客服", icon: <MessageSquare className="w-3.5 h-3.5" />, color: "bg-purple-100 text-purple-700" },
  ticket: { label: "工单", icon: <FileText className="w-3.5 h-3.5" />, color: "bg-orange-100 text-orange-700" },
  video_call: { label: "视频通话", icon: <Video className="w-3.5 h-3.5" />, color: "bg-indigo-100 text-indigo-700" },
};

const OUTCOME_CONFIG: Record<LogOutcome, { label: string; color: string }> = {
  resolved: { label: "已解决", color: "bg-green-100 text-green-700" },
  escalated: { label: "已升级", color: "bg-red-100 text-red-700" },
  follow_up: { label: "跟进中", color: "bg-yellow-100 text-yellow-700" },
  no_action: { label: "无需跟进", color: "bg-gray-100 text-gray-600" },
  callback: { label: "待回电", color: "bg-blue-100 text-blue-700" },
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(n => (
        <Star key={n} className={`w-3 h-3 ${n <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`} />
      ))}
    </div>
  );
}

function LogDetailDrawer({ log, onClose }: { log: CommunicationLog; onClose: () => void }) {
  const ch = CHANNEL_CONFIG[log.channel];
  const oc = OUTCOME_CONFIG[log.outcome];
  return (
    <Drawer isOpen onClose={onClose} title={log.subject} size="lg"
        footer={<DrawerFooter>
        <Button variant="secondary" onClick={onClose}>关闭</Button>
        <Button variant="primary"><ArrowUpRight className="w-4 h-4" />查看用户详情</Button>
      </DrawerFooter>}
      >
      <div className="p-6 space-y-6">
        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${ch.color}`}>
            {ch.icon}{ch.label}
          </span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${oc.color}`}>{oc.label}</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-[var(--tp-surface-2)] text-[var(--tp-fg-muted)]">
            {log.type === "inbound" ? "用户主动联系" : "客服主动联系"}
          </span>
        </div>

        {/* Parties */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[var(--tp-surface-2)] rounded-xl p-3">
            <p className="text-xs text-[var(--tp-fg-muted)] mb-1">用户</p>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
                {log.userName.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--tp-fg)]">{log.userName}</p>
                <p className="text-xs text-[var(--tp-fg-muted)]">{log.userId} · {log.userRegion}</p>
              </div>
            </div>
          </div>
          <div className="bg-[var(--tp-surface-2)] rounded-xl p-3">
            <p className="text-xs text-[var(--tp-fg-muted)] mb-1">客服专员</p>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center text-white text-xs font-bold">
                {log.agentName.charAt(0)}
              </div>
              <p className="text-sm font-medium text-[var(--tp-fg)]">{log.agentName}</p>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div>
          <p className="text-xs text-[var(--tp-fg-muted)] mb-2">沟通摘要</p>
          <p className="text-sm text-[var(--tp-fg)] leading-relaxed bg-[var(--tp-surface-2)] rounded-xl p-4">{log.summary}</p>
        </div>

        {/* Details */}
        <div className="grid grid-cols-2 gap-3">
          {log.duration && (
            <div>
              <p className="text-xs text-[var(--tp-fg-muted)] mb-1">沟通时长</p>
              <p className="text-sm text-[var(--tp-fg)] flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[var(--tp-fg-muted)]" />
                {log.duration} 分钟
              </p>
            </div>
          )}
          {log.satisfaction && (
            <div>
              <p className="text-xs text-[var(--tp-fg-muted)] mb-1">满意度评分</p>
              <StarRating rating={log.satisfaction} />
            </div>
          )}
          {log.relatedTicket && (
            <div>
              <p className="text-xs text-[var(--tp-fg-muted)] mb-1">关联工单</p>
              <span className="text-sm text-[var(--tp-primary)] flex items-center gap-1">
                {log.relatedTicket}<ExternalLink className="w-3 h-3" />
              </span>
            </div>
          )}
          {log.followUpDate && (
            <div>
              <p className="text-xs text-[var(--tp-fg-muted)] mb-1">跟进时间</p>
              <p className="text-sm text-yellow-600 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(log.followUpDate).toLocaleString("zh-CN")}
              </p>
            </div>
          )}
        </div>

        {/* Tags */}
        {log.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {log.tags.map(tag => (
              <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs bg-[var(--tp-surface-2)] text-[var(--tp-fg-muted)]">
                <Tag className="w-3 h-3" />{tag}
              </span>
            ))}
          </div>
        )}

        <div className="text-xs text-[var(--tp-fg-muted)] border-t border-[var(--tp-border)] pt-4">
          记录时间：{new Date(log.createdAt).toLocaleString("zh-CN")}
        </div>
      </div>
          </Drawer>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CommunicationLogsPage() {
  const [logs] = useState<CommunicationLog[]>(MOCK_LOGS);
  const [search, setSearch] = useState("");
  const [filterChannel, setFilterChannel] = useState<LogChannel | "all">("all");
  const [filterOutcome, setFilterOutcome] = useState<LogOutcome | "all">("all");
  const [selected, setSelected] = useState<CommunicationLog | null>(null);

  const filtered = logs.filter(l => {
    if (filterChannel !== "all" && l.channel !== filterChannel) return false;
    if (filterOutcome !== "all" && l.outcome !== filterOutcome) return false;
    if (search && !l.userName.toLowerCase().includes(search.toLowerCase()) &&
        !l.subject.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const resolvedCount = logs.filter(l => l.outcome === "resolved").length;
  const avgDuration = Math.round(logs.filter(l => l.duration).reduce((s, l) => s + (l.duration || 0), 0) / logs.filter(l => l.duration).length);
  const avgSat = (logs.filter(l => l.satisfaction).reduce((s, l) => s + (l.satisfaction || 0), 0) / logs.filter(l => l.satisfaction).length).toFixed(1);

  const breadcrumbs = [{ label: "后台管理" }, { label: "CRM" }, { label: "沟通记录" }];

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
        title="沟通记录"
        description="追踪客服团队与用户的全渠道沟通历史"
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "记录总数", value: logs.length, icon: <FileText className="w-5 h-5" />, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "已解决", value: resolvedCount, icon: <CheckCircle className="w-5 h-5" />, color: "text-green-600", bg: "bg-green-50" },
          { label: "平均时长", value: avgDuration + " 分钟", icon: <Clock className="w-5 h-5" />, color: "text-purple-600", bg: "bg-purple-50" },
          { label: "平均满意度", value: avgSat + " ★", icon: <Star className="w-5 h-5" />, color: "text-yellow-600", bg: "bg-yellow-50" },
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
              placeholder="搜索用户名或主题..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-[var(--tp-surface-2)] border border-[var(--tp-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--tp-primary)]/30 text-[var(--tp-fg)]"
            />
          </div>
          <select
            value={filterChannel}
            onChange={e => setFilterChannel(e.target.value as LogChannel | "all")}
            className="px-3 py-2 text-sm bg-[var(--tp-surface-2)] border border-[var(--tp-border)] rounded-lg focus:outline-none text-[var(--tp-fg)]"
          >
            <option value="all">全部渠道</option>
            {(Object.keys(CHANNEL_CONFIG) as LogChannel[]).map(c => (
              <option key={c} value={c}>{CHANNEL_CONFIG[c].label}</option>
            ))}
          </select>
          <select
            value={filterOutcome}
            onChange={e => setFilterOutcome(e.target.value as LogOutcome | "all")}
            className="px-3 py-2 text-sm bg-[var(--tp-surface-2)] border border-[var(--tp-border)] rounded-lg focus:outline-none text-[var(--tp-fg)]"
          >
            <option value="all">全部结果</option>
            {(Object.keys(OUTCOME_CONFIG) as LogOutcome[]).map(o => (
              <option key={o} value={o}>{OUTCOME_CONFIG[o].label}</option>
            ))}
          </select>
        </div>
      </Card>

      {/* Log list */}
      {filtered.length === 0 ? (
        <EmptyState icon={<FileText className="w-12 h-12" />} title="暂无记录" description="调整筛选条件查看沟通记录" />
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filtered.map((log, i) => {
              const ch = CHANNEL_CONFIG[log.channel];
              const oc = OUTCOME_CONFIG[log.outcome];
              return (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Card
                    className="p-5 hover:shadow-md transition-all cursor-pointer group"
                    onClick={() => setSelected(log)}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-2.5 rounded-xl flex-shrink-0 ${ch.color}`}>{ch.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-semibold text-sm text-[var(--tp-fg)] group-hover:text-[var(--tp-primary)] transition-colors">{log.subject}</span>
                          <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${oc.color}`}>{oc.label}</span>
                          <span className="px-1.5 py-0.5 rounded text-xs bg-[var(--tp-surface-2)] text-[var(--tp-fg-muted)]">
                            {log.type === "inbound" ? "入站" : "出站"}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-[var(--tp-fg-muted)] mb-2">
                          <span className="flex items-center gap-1"><User className="w-3 h-3" />{log.userName} ({log.userRegion})</span>
                          <span>→ {log.agentName}</span>
                          {log.duration && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{log.duration} 分钟</span>}
                        </div>
                        <p className="text-sm text-[var(--tp-fg-muted)] line-clamp-2">{log.summary}</p>
                        {log.satisfaction && (
                          <div className="mt-2">
                            <StarRating rating={log.satisfaction} />
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-[var(--tp-fg-muted)] flex-shrink-0 text-right">
                        <div>{new Date(log.createdAt).toLocaleDateString("zh-CN")}</div>
                        <div>{new Date(log.createdAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}</div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {selected && <LogDetailDrawer log={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
