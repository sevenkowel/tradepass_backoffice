"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowUpCircle,
  Search,
  Filter,
  Plus,
  User,
  ChevronRight,
  Send,
  Paperclip,
  Tag,
  RefreshCw,
  Loader2,
  AlertCircle,
  MessageSquare,
  Headphones,
  MoreHorizontal,
  Circle,
  CheckCheck,
} from "lucide-react";
import { Button, PageHeader, Card, Drawer, DrawerFooter, EmptyState } from "@/components/crm/ui";
import { Breadcrumb } from "@/components/crm/layout";

// ─── Types ────────────────────────────────────────────────────────────────────

type TicketStatus = "open" | "pending" | "replied" | "resolved" | "closed";
type TicketPriority = "low" | "normal" | "high" | "urgent";
type TicketCategory =
  | "account"
  | "deposit"
  | "withdrawal"
  | "trading"
  | "kyc"
  | "technical"
  | "other";

interface TicketMessage {
  id: string;
  sender: "user" | "agent";
  senderName: string;
  content: string;
  timestamp: string;
  attachments?: string[];
}

interface Ticket {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  subject: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  messages: TicketMessage[];
  tags: string[];
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_TICKETS: Ticket[] = [
  {
    id: "TKT-2024-0891",
    userId: "USR-001",
    userName: "Nguyen Van An",
    userEmail: "nguyen.van.an@gmail.com",
    subject: "Withdrawal not received after 3 days",
    category: "withdrawal",
    priority: "urgent",
    status: "open",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    tags: ["withdrawal", "urgent"],
    messages: [
      {
        id: "msg-1",
        sender: "user",
        senderName: "Nguyen Van An",
        content: "I requested a withdrawal of $5,000 on Monday but have not received it yet. My wallet shows it was processed but the funds haven't arrived.",
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "msg-2",
        sender: "agent",
        senderName: "Sarah (Support)",
        content: "Thank you for reaching out. I'm checking your withdrawal request now. Could you please provide your transaction ID?",
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "msg-3",
        sender: "user",
        senderName: "Nguyen Van An",
        content: "The transaction ID is TXN-20240312-8847. I've been waiting 3 days now, this is really stressful.",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
  {
    id: "TKT-2024-0890",
    userId: "USR-002",
    userName: "Maria Garcia",
    userEmail: "maria.garcia@gmail.es",
    subject: "Unable to complete KYC verification",
    category: "kyc",
    priority: "high",
    status: "pending",
    assignedTo: "Agent Lee",
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    tags: ["kyc", "verification"],
    messages: [
      {
        id: "msg-4",
        sender: "user",
        senderName: "Maria Garcia",
        content: "I keep getting an error when uploading my passport. The system says 'Image quality too low' but I've tried multiple times with a high quality scan.",
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
  {
    id: "TKT-2024-0887",
    userId: "USR-004",
    userName: "Tanaka Hiroshi",
    userEmail: "tanaka@yahoo.co.jp",
    subject: "Wrong exchange rate applied",
    category: "trading",
    priority: "normal",
    status: "replied",
    assignedTo: "Agent Kim",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    tags: ["trading", "rate"],
    messages: [
      {
        id: "msg-5",
        sender: "user",
        senderName: "Tanaka Hiroshi",
        content: "The rate for my USD/JPY trade was 148.2 but the market rate was 149.1. This difference resulted in a loss of $120.",
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "msg-6",
        sender: "agent",
        senderName: "Agent Kim",
        content: "We've reviewed your trade. The rate 148.2 reflects the spread and was within our standard range at the time of execution. I'll send you a detailed breakdown.",
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
  {
    id: "TKT-2024-0883",
    userId: "USR-005",
    userName: "Ahmed Al-Rashid",
    userEmail: "ahmed@gmail.ae",
    subject: "Two-factor authentication not working",
    category: "account",
    priority: "high",
    status: "resolved",
    assignedTo: "Agent Sarah",
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    resolvedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ["2fa", "security", "account"],
    messages: [
      {
        id: "msg-7",
        sender: "user",
        senderName: "Ahmed Al-Rashid",
        content: "I can't log in because my 2FA codes are not working. I changed my phone recently.",
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "msg-8",
        sender: "agent",
        senderName: "Agent Sarah",
        content: "I understand. I've sent a 2FA reset link to your registered email. Please check and follow the instructions.",
        timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "msg-9",
        sender: "user",
        senderName: "Ahmed Al-Rashid",
        content: "It worked! Thank you so much!",
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
  {
    id: "TKT-2024-0880",
    userId: "USR-006",
    userName: "Jin-ho Kim",
    userEmail: "jinho@naver.com",
    subject: "Deposit not credited to account",
    category: "deposit",
    priority: "normal",
    status: "closed",
    assignedTo: "Agent Lee",
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ["deposit"],
    messages: [
      {
        id: "msg-10",
        sender: "user",
        senderName: "Jin-ho Kim",
        content: "I deposited $1,000 via bank transfer 2 days ago but it's not in my account.",
        timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "msg-11",
        sender: "agent",
        senderName: "Agent Lee",
        content: "The deposit has been manually credited to your account. There was a delay from the payment processor. Sorry for the inconvenience.",
        timestamp: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
];

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<TicketStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  open: { label: "待处理", color: "text-red-600", bg: "bg-red-50", icon: Circle },
  pending: { label: "处理中", color: "text-amber-600", bg: "bg-amber-50", icon: Clock },
  replied: { label: "已回复", color: "text-blue-600", bg: "bg-blue-50", icon: MessageCircle },
  resolved: { label: "已解决", color: "text-emerald-600", bg: "bg-emerald-50", icon: CheckCircle2 },
  closed: { label: "已关闭", color: "text-slate-500", bg: "bg-slate-50", icon: CheckCheck },
};

const PRIORITY_CONFIG: Record<TicketPriority, { label: string; color: string; bg: string }> = {
  low: { label: "低", color: "text-slate-600", bg: "bg-slate-100" },
  normal: { label: "普通", color: "text-blue-600", bg: "bg-blue-100" },
  high: { label: "高", color: "text-orange-600", bg: "bg-orange-100" },
  urgent: { label: "紧急", color: "text-red-600", bg: "bg-red-100" },
};

const CATEGORY_LABELS: Record<TicketCategory, string> = {
  account: "账户问题",
  deposit: "入金",
  withdrawal: "出金",
  trading: "交易",
  kyc: "KYC 认证",
  technical: "技术问题",
  other: "其他",
};

// ─── Ticket Detail Drawer ────────────────────────────────────────────────────

function TicketDetailDrawer({
  ticket,
  onClose,
  onReply,
  onStatusChange,
}: {
  ticket: Ticket;
  onClose: () => void;
  onReply: (id: string, content: string) => void;
  onStatusChange: (id: string, status: TicketStatus) => void;
}) {
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);

  const handleSendReply = async () => {
    if (!replyText.trim()) return;
    setSending(true);
    await new Promise((r) => setTimeout(r, 500));
    onReply(ticket.id, replyText);
    setReplyText("");
    setSending(false);
  };

  const statusCfg = STATUS_CONFIG[ticket.status];
  const StatusIcon = statusCfg.icon;

  return (
    <Drawer
      isOpen
      onClose={onClose}
      size="lg"
      title={ticket.subject}
      description={`${ticket.id} · ${ticket.userName}`}
      footer={
        !["resolved", "closed"].includes(ticket.status) ? (
          <div className="w-full space-y-3">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="输入回复内容..."
              rows={3}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <DrawerFooter>
              <Button variant="ghost" size="sm">
                <Paperclip className="w-4 h-4" />
                附件
              </Button>
              <div className="flex-1" />
              {ticket.status !== "resolved" && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onStatusChange(ticket.id, "resolved")}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  标记解决
                </Button>
              )}
              <Button
                size="sm"
                onClick={handleSendReply}
                disabled={!replyText.trim() || sending}
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                发送回复
              </Button>
            </DrawerFooter>
          </div>
        ) : null
      }
    >
      <div className="space-y-6">
        {/* Meta */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="text-xs text-slate-400 mb-1">状态</p>
            <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${statusCfg.color}`}>
              <StatusIcon className="w-4 h-4" />
              {statusCfg.label}
            </span>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="text-xs text-slate-400 mb-1">优先级</p>
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
              ${PRIORITY_CONFIG[ticket.priority].bg} ${PRIORITY_CONFIG[ticket.priority].color}`}>
              {PRIORITY_CONFIG[ticket.priority].label}
            </span>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="text-xs text-slate-400 mb-1">分类</p>
            <p className="text-sm font-medium text-slate-700">{CATEGORY_LABELS[ticket.category]}</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="text-xs text-slate-400 mb-1">负责人</p>
            <p className="text-sm font-medium text-slate-700">{ticket.assignedTo ?? "未分配"}</p>
          </div>
          <div className="col-span-2 p-3 bg-slate-50 rounded-lg">
            <p className="text-xs text-slate-400 mb-1">创建时间</p>
            <p className="text-sm font-medium text-slate-700">
              {new Date(ticket.createdAt).toLocaleString("zh-CN")}
            </p>
          </div>
        </div>

        {/* Tags */}
        {ticket.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {ticket.tags.map((tag) => (
              <span key={tag} className="flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-xs">
                <Tag className="w-3 h-3" />
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Conversation */}
        <div>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">
            对话记录（{ticket.messages.length} 条）
          </h3>
          <div className="space-y-3">
            {ticket.messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.sender === "agent" ? "flex-row-reverse" : ""}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    msg.sender === "agent"
                      ? "bg-blue-600 text-white"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {msg.senderName.slice(0, 2).toUpperCase()}
                </div>
                <div className={`max-w-[75%] ${msg.sender === "agent" ? "items-end" : "items-start"} flex flex-col gap-1`}>
                  <p className={`text-xs text-slate-400 ${msg.sender === "agent" ? "text-right" : ""}`}>
                    {msg.senderName} · {new Date(msg.timestamp).toLocaleString("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                  <div
                    className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                      msg.sender === "agent"
                        ? "bg-blue-600 text-white rounded-tr-sm"
                        : "bg-slate-100 text-slate-800 rounded-tl-sm"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        {!["resolved", "closed"].includes(ticket.status) && (
          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">快速操作</h3>
            <div className="flex flex-wrap gap-2">
              <Button variant="ghost" size="sm" onClick={() => onStatusChange(ticket.id, "closed")}>
                <XCircle className="w-4 h-4" />
                关闭工单
              </Button>
              <Button variant="ghost" size="sm">
                <ArrowUpCircle className="w-4 h-4" />
                升级处理
              </Button>
              <Button variant="ghost" size="sm">
                <User className="w-4 h-4" />
                转交
              </Button>
            </div>
          </div>
        )}
      </div>
    </Drawer>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>(MOCK_TICKETS);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [filterStatus, setFilterStatus] = useState<TicketStatus | "all">("all");
  const [filterPriority, setFilterPriority] = useState<TicketPriority | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, message: msg });
    setTimeout(() => setToast(null), 3000);
  };

  const filtered = tickets.filter((t) => {
    if (filterStatus !== "all" && t.status !== filterStatus) return false;
    if (filterPriority !== "all" && t.priority !== filterPriority) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        t.subject.toLowerCase().includes(q) ||
        t.userName.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const stats = {
    open: tickets.filter((t) => t.status === "open").length,
    pending: tickets.filter((t) => t.status === "pending").length,
    replied: tickets.filter((t) => t.status === "replied").length,
    urgent: tickets.filter((t) => t.priority === "urgent").length,
  };

  const handleReply = (id: string, content: string) => {
    setTickets((prev) =>
      prev.map((t) =>
        t.id !== id
          ? t
          : {
              ...t,
              status: "replied" as TicketStatus,
              updatedAt: new Date().toISOString(),
              messages: [
                ...t.messages,
                {
                  id: `msg-${Date.now()}`,
                  sender: "agent",
                  senderName: "You (Agent)",
                  content,
                  timestamp: new Date().toISOString(),
                },
              ],
            }
      )
    );
    if (selectedTicket?.id === id) {
      setSelectedTicket((prev) =>
        prev
          ? {
              ...prev,
              status: "replied",
              messages: [
                ...prev.messages,
                {
                  id: `msg-${Date.now()}`,
                  sender: "agent",
                  senderName: "You (Agent)",
                  content,
                  timestamp: new Date().toISOString(),
                },
              ],
            }
          : null
      );
    }
    showToast("success", "回复已发送");
  };

  const handleStatusChange = (id: string, status: TicketStatus) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status, updatedAt: new Date().toISOString() } : t))
    );
    if (selectedTicket?.id === id) {
      setSelectedTicket((prev) => (prev ? { ...prev, status } : null));
    }
    showToast("success", `工单状态已更新为「${STATUS_CONFIG[status].label}」`);
  };

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "客服" }, { label: "工单管理" }]} />

      <PageHeader
        title="工单管理"
        description="处理用户支持工单，追踪解决进度"
        actions={
          <Button>
            <Plus className="w-4 h-4" />
            新建工单
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "待处理", value: stats.open, color: "text-red-600", bg: "bg-red-100", icon: Circle },
          { label: "处理中", value: stats.pending, color: "text-amber-600", bg: "bg-amber-100", icon: Clock },
          { label: "已回复", value: stats.replied, color: "text-blue-600", bg: "bg-blue-100", icon: MessageCircle },
          { label: "紧急工单", value: stats.urgent, color: "text-orange-600", bg: "bg-orange-100", icon: AlertTriangle },
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
              placeholder="搜索工单号、用户名、主题..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 h-9 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-sm">
            {(["all", "open", "pending", "replied", "resolved", "closed"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                  filterStatus === s ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {s === "all" ? "全部" : STATUS_CONFIG[s].label}
              </button>
            ))}
          </div>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value as TicketPriority | "all")}
            className="h-9 px-3 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">全部优先级</option>
            <option value="urgent">紧急</option>
            <option value="high">高</option>
            <option value="normal">普通</option>
            <option value="low">低</option>
          </select>
        </div>
      </Card>

      {/* Ticket List */}
      <Card className="!p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Headphones className="w-10 h-10 text-slate-300" />}
            title="暂无工单"
            description="当前筛选条件下没有工单记录"
          />
        ) : (
          <div className="divide-y divide-slate-50">
            {filtered.map((ticket) => {
              const statusCfg = STATUS_CONFIG[ticket.status];
              const priorityCfg = PRIORITY_CONFIG[ticket.priority];
              const StatusIcon = statusCfg.icon;
              const lastMsg = ticket.messages[ticket.messages.length - 1];

              return (
                <motion.div
                  key={ticket.id}
                  layout
                  className="p-4 hover:bg-slate-50/60 transition-colors cursor-pointer"
                  onClick={() => setSelectedTicket(ticket)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {ticket.userName.slice(0, 2).toUpperCase()}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-semibold text-slate-900 truncate">{ticket.subject}</p>
                          {ticket.priority === "urgent" && (
                            <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                          <span className="font-mono">{ticket.id}</span>
                          <span>·</span>
                          <span>{ticket.userName}</span>
                          <span>·</span>
                          <span>{CATEGORY_LABELS[ticket.category]}</span>
                        </div>
                        {lastMsg && (
                          <p className="text-xs text-slate-500 truncate">
                            <span className="font-medium">{lastMsg.senderName}:</span> {lastMsg.content}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${priorityCfg.bg} ${priorityCfg.color}`}>
                          {priorityCfg.label}
                        </span>
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${statusCfg.color}`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {statusCfg.label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        {new Date(ticket.updatedAt).toLocaleString("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Drawer */}
      {selectedTicket && (
        <TicketDetailDrawer
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onReply={handleReply}
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
            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${
              toast.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
            }`}>
              {toast.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {toast.message}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
