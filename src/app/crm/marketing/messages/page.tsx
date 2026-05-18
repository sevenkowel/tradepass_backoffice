"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare, Send, Users, CheckCircle, Clock,
  AlertCircle, Search, Filter, Plus, Eye, Edit,
  Trash2, Mail, Bell, Smartphone, ChevronRight,
  TrendingUp, BarChart2, RefreshCw, X, Calendar,
} from "lucide-react";
import { Button, PageHeader, Card, EmptyState } from "@/components/crm/ui/PageHeader";
import { Drawer, DrawerFooter } from "@/components/crm/ui/Drawer";
import { Breadcrumb } from "@/components/crm/layout";

// ─── Types ────────────────────────────────────────────────────────────────────

type MsgChannel = "email" | "push" | "sms" | "in_app";
type MsgStatus = "draft" | "scheduled" | "sending" | "sent" | "failed";
type MsgType = "promotional" | "transactional" | "system" | "educational";

interface MessageCampaign {
  id: string;
  title: string;
  subject?: string;
  body: string;
  channel: MsgChannel;
  type: MsgType;
  status: MsgStatus;
  targetSegment: string;
  scheduledAt?: string;
  sentAt?: string;
  stats: {
    recipients: number;
    delivered: number;
    opened: number;
    clicked: number;
    failed: number;
  };
  createdAt: string;
  updatedAt: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_MESSAGES: MessageCampaign[] = [
  {
    id: "MSG001",
    title: "首次入金奖励通知",
    subject: "🎁 专属欢迎礼包已为您准备好！",
    body: "尊敬的用户，完成首次入金即可获得 20% 的入金奖励，最高 $500。活动有效期至本月底，点击下方按钮立即开始交易。",
    channel: "email",
    type: "promotional",
    status: "sent",
    targetSegment: "新注册用户（未入金）",
    sentAt: "2026-04-01T09:00:00Z",
    stats: { recipients: 2847, delivered: 2801, opened: 1124, clicked: 387, failed: 46 },
    createdAt: "2026-03-30T14:22:00Z",
    updatedAt: "2026-04-01T09:05:00Z",
  },
  {
    id: "MSG002",
    title: "KYC 审核通过提醒",
    subject: "✅ 您的身份认证已通过",
    body: "恭喜您！您的 KYC 身份认证已成功通过审核。您现在可以使用全部交易功能，包括出入金等。如有疑问请联系客服。",
    channel: "push",
    type: "transactional",
    status: "sent",
    targetSegment: "KYC 审核通过用户",
    sentAt: "2026-04-02T10:30:00Z",
    stats: { recipients: 156, delivered: 154, opened: 148, clicked: 92, failed: 2 },
    createdAt: "2026-04-02T10:28:00Z",
    updatedAt: "2026-04-02T10:35:00Z",
  },
  {
    id: "MSG003",
    title: "系统维护公告",
    subject: "⚙️ 计划维护通知 - 4月6日 02:00-04:00 UTC",
    body: "我们将于北京时间 4月6日 10:00-12:00 进行系统例行维护。维护期间平台将暂停服务，请提前做好仓位管理。给您带来的不便敬请谅解。",
    channel: "in_app",
    type: "system",
    status: "scheduled",
    targetSegment: "全部活跃用户",
    scheduledAt: "2026-04-05T22:00:00Z",
    stats: { recipients: 0, delivered: 0, opened: 0, clicked: 0, failed: 0 },
    createdAt: "2026-04-04T16:00:00Z",
    updatedAt: "2026-04-04T16:00:00Z",
  },
  {
    id: "MSG004",
    title: "外汇交易入门指南",
    subject: "📚 从零开始学外汇交易",
    body: "新手交易者必读！本期教育系列将带您了解外汇市场基础知识，包括主要货币对、点差概念、风险管理策略等核心内容。",
    channel: "email",
    type: "educational",
    status: "draft",
    targetSegment: "KYC 通过但未成交用户",
    stats: { recipients: 0, delivered: 0, opened: 0, clicked: 0, failed: 0 },
    createdAt: "2026-04-03T11:00:00Z",
    updatedAt: "2026-04-04T09:30:00Z",
  },
  {
    id: "MSG005",
    title: "账户异常登录提醒",
    subject: "🔐 检测到异常登录活动",
    body: "我们检测到您的账户在异常地点登录。如非本人操作，请立即修改密码并联系客服冻结账户。安全提示：请勿向任何人透露您的账户信息。",
    channel: "sms",
    type: "system",
    status: "sent",
    targetSegment: "触发风控规则用户",
    sentAt: "2026-04-03T08:15:00Z",
    stats: { recipients: 23, delivered: 23, opened: 23, clicked: 18, failed: 0 },
    createdAt: "2026-04-03T08:14:00Z",
    updatedAt: "2026-04-03T08:16:00Z",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CHANNEL_CONFIG: Record<MsgChannel, { label: string; icon: React.ReactNode; color: string }> = {
  email: { label: "邮件", icon: <Mail className="w-3.5 h-3.5" />, color: "bg-blue-100 text-blue-700" },
  push: { label: "推送通知", icon: <Bell className="w-3.5 h-3.5" />, color: "bg-purple-100 text-purple-700" },
  sms: { label: "短信", icon: <Smartphone className="w-3.5 h-3.5" />, color: "bg-green-100 text-green-700" },
  in_app: { label: "站内信", icon: <MessageSquare className="w-3.5 h-3.5" />, color: "bg-orange-100 text-orange-700" },
};

const STATUS_CONFIG: Record<MsgStatus, { label: string; color: string; dot: string }> = {
  draft: { label: "草稿", color: "bg-gray-100 text-gray-600", dot: "bg-gray-400" },
  scheduled: { label: "已计划", color: "bg-blue-100 text-blue-700", dot: "bg-blue-500" },
  sending: { label: "发送中", color: "bg-yellow-100 text-yellow-700", dot: "bg-yellow-500" },
  sent: { label: "已发送", color: "bg-green-100 text-green-700", dot: "bg-green-500" },
  failed: { label: "发送失败", color: "bg-red-100 text-red-700", dot: "bg-red-500" },
};

const TYPE_CONFIG: Record<MsgType, { label: string; color: string }> = {
  promotional: { label: "营销", color: "bg-pink-100 text-pink-700" },
  transactional: { label: "事务", color: "bg-blue-100 text-blue-700" },
  system: { label: "系统", color: "bg-gray-100 text-gray-600" },
  educational: { label: "教育", color: "bg-indigo-100 text-indigo-700" },
};

const fmt = (n: number) => n.toLocaleString();
const pct = (a: number, b: number) => b > 0 ? ((a / b) * 100).toFixed(1) + "%" : "—";

// ─── Sub-components ───────────────────────────────────────────────────────────

function ChannelBadge({ channel }: { channel: MsgChannel }) {
  const cfg = CHANNEL_CONFIG[channel];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
      {cfg.icon}{cfg.label}
    </span>
  );
}

function StatusBadge({ status }: { status: MsgStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function StatBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pctVal = total > 0 ? (value / total) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-[var(--tp-fg-muted)]">{label}</span>
        <span className="font-medium text-[var(--tp-fg)]">{fmt(value)} <span className="text-[var(--tp-fg-muted)]">({pct(value, total)})</span></span>
      </div>
      <div className="h-1.5 bg-[var(--tp-surface-2)] rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${pctVal}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

function MessageDetailDrawer({ msg, onClose }: { msg: MessageCampaign; onClose: () => void }) {
  const ch = CHANNEL_CONFIG[msg.channel];
  const st = STATUS_CONFIG[msg.status];
  const tp = TYPE_CONFIG[msg.type];
  const openRate = pct(msg.stats.opened, msg.stats.delivered);
  const clickRate = pct(msg.stats.clicked, msg.stats.opened);

  return (
    <Drawer isOpen onClose={onClose} title={msg.title} size="lg"
        footer={<DrawerFooter>
        {msg.status === "draft" && (
          <>
            <Button variant="secondary" onClick={onClose}>关闭</Button>
            <Button variant="primary"><Send className="w-4 h-4" />立即发送</Button>
          </>
        )}
        {msg.status === "scheduled" && (
          <>
            <Button variant="secondary" onClick={onClose}>关闭</Button>
            <Button variant="danger"><X className="w-4 h-4" />取消计划</Button>
          </>
        )}
        {(msg.status === "sent" || msg.status === "failed") && (
          <Button variant="secondary" onClick={onClose}>关闭</Button>
        )}
      </DrawerFooter>}
      >
      <div className="p-6 space-y-6">
        {/* Meta badges */}
        <div className="flex flex-wrap gap-2">
          <ChannelBadge channel={msg.channel} />
          <StatusBadge status={msg.status} />
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${tp.color}`}>{tp.label}</span>
        </div>

        {/* Subject */}
        {msg.subject && (
          <div>
            <p className="text-xs text-[var(--tp-fg-muted)] mb-1">邮件主题</p>
            <p className="font-medium text-[var(--tp-fg)]">{msg.subject}</p>
          </div>
        )}

        {/* Body */}
        <div>
          <p className="text-xs text-[var(--tp-fg-muted)] mb-2">消息内容</p>
          <div className="bg-[var(--tp-surface-2)] rounded-xl p-4 text-sm text-[var(--tp-fg)] leading-relaxed">
            {msg.body}
          </div>
        </div>

        {/* Target */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-[var(--tp-fg-muted)] mb-1">目标用户群</p>
            <p className="text-sm text-[var(--tp-fg)] font-medium">{msg.targetSegment}</p>
          </div>
          <div>
            <p className="text-xs text-[var(--tp-fg-muted)] mb-1">发送渠道</p>
            <p className="text-sm font-medium text-[var(--tp-fg)]">{ch.label}</p>
          </div>
          {msg.scheduledAt && (
            <div>
              <p className="text-xs text-[var(--tp-fg-muted)] mb-1">计划发送时间</p>
              <p className="text-sm text-[var(--tp-fg)]">{new Date(msg.scheduledAt).toLocaleString("zh-CN")}</p>
            </div>
          )}
          {msg.sentAt && (
            <div>
              <p className="text-xs text-[var(--tp-fg-muted)] mb-1">实际发送时间</p>
              <p className="text-sm text-[var(--tp-fg)]">{new Date(msg.sentAt).toLocaleString("zh-CN")}</p>
            </div>
          )}
        </div>

        {/* Stats */}
        {msg.stats.recipients > 0 && (
          <div>
            <p className="text-xs text-[var(--tp-fg-muted)] mb-3">发送统计</p>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: "发送总量", value: msg.stats.recipients, icon: <Users className="w-4 h-4" />, color: "text-blue-600" },
                { label: "已送达", value: msg.stats.delivered, icon: <CheckCircle className="w-4 h-4" />, color: "text-green-600" },
                { label: "发送失败", value: msg.stats.failed, icon: <AlertCircle className="w-4 h-4" />, color: "text-red-600" },
              ].map(s => (
                <div key={s.label} className="bg-[var(--tp-surface-2)] rounded-xl p-3 text-center">
                  <div className={`flex justify-center mb-1 ${s.color}`}>{s.icon}</div>
                  <div className="text-lg font-bold text-[var(--tp-fg)]">{fmt(s.value)}</div>
                  <div className="text-xs text-[var(--tp-fg-muted)]">{s.label}</div>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              <StatBar label="打开率" value={msg.stats.opened} total={msg.stats.delivered} color="bg-blue-500" />
              <StatBar label="点击率" value={msg.stats.clicked} total={msg.stats.opened} color="bg-green-500" />
            </div>
          </div>
        )}

        {/* Timestamps */}
        <div className="text-xs text-[var(--tp-fg-muted)] space-y-1 border-t border-[var(--tp-border)] pt-4">
          <div>创建时间：{new Date(msg.createdAt).toLocaleString("zh-CN")}</div>
          <div>最后更新：{new Date(msg.updatedAt).toLocaleString("zh-CN")}</div>
        </div>
      </div>

          </Drawer>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MessagesPage() {
  const [messages] = useState<MessageCampaign[]>(MOCK_MESSAGES);
  const [search, setSearch] = useState("");
  const [filterChannel, setFilterChannel] = useState<MsgChannel | "all">("all");
  const [filterStatus, setFilterStatus] = useState<MsgStatus | "all">("all");
  const [selected, setSelected] = useState<MessageCampaign | null>(null);

  const filtered = messages.filter(m => {
    if (filterChannel !== "all" && m.channel !== filterChannel) return false;
    if (filterStatus !== "all" && m.status !== filterStatus) return false;
    if (search && !m.title.toLowerCase().includes(search.toLowerCase()) &&
        !m.targetSegment.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Aggregate stats
  const totalSent = messages.filter(m => m.status === "sent").reduce((s, m) => s + m.stats.recipients, 0);
  const totalDelivered = messages.filter(m => m.status === "sent").reduce((s, m) => s + m.stats.delivered, 0);
  const totalOpened = messages.filter(m => m.status === "sent").reduce((s, m) => s + m.stats.opened, 0);

  const breadcrumbs = [
    { label: "后台管理" },
    { label: "营销管理" },
    { label: "消息推送" },
  ];

  return (
    <div className="p-6 space-y-6">
      <Breadcrumb items={[{ label: "Marketing" }, { label: "Messages" }]} />

      <PageHeader
        title="消息推送"
        description="管理邮件、推送通知、短信及站内信等多渠道消息"
        actions={
          <Button variant="primary"><Plus className="w-4 h-4" />新建消息</Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "消息总数", value: messages.length, icon: <MessageSquare className="w-5 h-5" />, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "已发送", value: fmt(totalSent), icon: <Send className="w-5 h-5" />, color: "text-green-600", bg: "bg-green-50" },
          { label: "送达量", value: fmt(totalDelivered), icon: <CheckCircle className="w-5 h-5" />, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "总打开量", value: fmt(totalOpened), icon: <TrendingUp className="w-5 h-5" />, color: "text-purple-600", bg: "bg-purple-50" },
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
              placeholder="搜索消息标题或目标群..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-[var(--tp-surface-2)] border border-[var(--tp-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--tp-primary)]/30 text-[var(--tp-fg)]"
            />
          </div>
          <select
            value={filterChannel}
            onChange={e => setFilterChannel(e.target.value as MsgChannel | "all")}
            className="px-3 py-2 text-sm bg-[var(--tp-surface-2)] border border-[var(--tp-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--tp-primary)]/30 text-[var(--tp-fg)]"
          >
            <option value="all">全部渠道</option>
            {(Object.keys(CHANNEL_CONFIG) as MsgChannel[]).map(c => (
              <option key={c} value={c}>{CHANNEL_CONFIG[c].label}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as MsgStatus | "all")}
            className="px-3 py-2 text-sm bg-[var(--tp-surface-2)] border border-[var(--tp-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--tp-primary)]/30 text-[var(--tp-fg)]"
          >
            <option value="all">全部状态</option>
            {(Object.keys(STATUS_CONFIG) as MsgStatus[]).map(s => (
              <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
            ))}
          </select>
        </div>
      </Card>

      {/* Message list */}
      {filtered.length === 0 ? (
        <EmptyState icon={<MessageSquare className="w-12 h-12" />} title="暂无消息" description="调整筛选条件或创建新消息" />
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filtered.map((msg, i) => {
              const ch = CHANNEL_CONFIG[msg.channel];
              const tp = TYPE_CONFIG[msg.type];
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Card className="p-5 hover:shadow-md transition-all cursor-pointer group" onClick={() => setSelected(msg)}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div className={`p-2.5 rounded-xl ${ch.color} flex-shrink-0`}>
                          {ch.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-semibold text-[var(--tp-fg)] group-hover:text-[var(--tp-primary)] transition-colors">{msg.title}</h3>
                            <StatusBadge status={msg.status} />
                            <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${tp.color}`}>{tp.label}</span>
                          </div>
                          <p className="text-sm text-[var(--tp-fg-muted)] truncate mb-2">{msg.body}</p>
                          <div className="flex items-center gap-4 text-xs text-[var(--tp-fg-muted)]">
                            <span className="flex items-center gap-1"><Users className="w-3 h-3" />{msg.targetSegment}</span>
                            {msg.scheduledAt && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(msg.scheduledAt).toLocaleDateString("zh-CN")}</span>}
                            {msg.sentAt && <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-green-500" />已于 {new Date(msg.sentAt).toLocaleDateString("zh-CN")} 发送</span>}
                          </div>
                        </div>
                      </div>

                      {/* Stats preview */}
                      {msg.stats.recipients > 0 && (
                        <div className="hidden md:flex items-center gap-6 text-center flex-shrink-0">
                          {[
                            { label: "发送", value: fmt(msg.stats.recipients) },
                            { label: "打开率", value: pct(msg.stats.opened, msg.stats.delivered) },
                            { label: "点击率", value: pct(msg.stats.clicked, msg.stats.opened) },
                          ].map(s => (
                            <div key={s.label}>
                              <div className="text-sm font-bold text-[var(--tp-fg)]">{s.value}</div>
                              <div className="text-xs text-[var(--tp-fg-muted)]">{s.label}</div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1.5 rounded-lg hover:bg-[var(--tp-surface-2)] text-[var(--tp-fg-muted)]"><Eye className="w-4 h-4" /></button>
                        <button className="p-1.5 rounded-lg hover:bg-[var(--tp-surface-2)] text-[var(--tp-fg-muted)]"><Edit className="w-4 h-4" /></button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Detail Drawer */}
      {selected && <MessageDetailDrawer msg={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
