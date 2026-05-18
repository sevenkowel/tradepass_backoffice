"use client";

/**
 * CommunicationsTab — 沟通记录 (P1, 2026-05-15).
 *
 * 跟该客户的所有沟通：邮件 / IM / 电话 / 短信。统一时间轴展示，支持
 * 按渠道筛选 + 一键发起新沟通。
 */

import { useMemo, useState } from "react";
import {
  Mail, MessageCircle, Phone, MessageSquare, Plus,
  ChevronRight, FileText, type LucideIcon,
} from "lucide-react";
import type { BaseTabProps } from "@/types/backoffice/client";
import { seededRng, rngHelpers, timeAgo } from "./_shared/mock-prng";

type Channel = "email" | "im" | "phone" | "sms";
type Direction = "outbound" | "inbound";

interface Communication {
  id: string;
  channel: Channel;
  direction: Direction;
  staff: string;
  subject: string;
  preview: string;
  timestamp: string;
  durationMin?: number;          // for phone
  attachmentCount?: number;
  hasReply: boolean;
}

const CHANNEL_META: Record<Channel, { label: string; icon: LucideIcon; tone: string }> = {
  email: { label: "邮件",   icon: Mail,          tone: "bg-blue-50 text-blue-700" },
  im:    { label: "在线",   icon: MessageCircle, tone: "bg-emerald-50 text-emerald-700" },
  phone: { label: "电话",   icon: Phone,         tone: "bg-violet-50 text-violet-700" },
  sms:   { label: "短信",   icon: MessageSquare, tone: "bg-slate-100 text-slate-700" },
};

const SUBJECTS: Record<Channel, string[]> = {
  email: [
    "Re: 出金延迟查询",
    "您的 KYC 已通过",
    "Q1 交易报表",
    "迎新福利活动通知",
    "杠杆调整确认",
  ],
  im:    [
    "你好，我想了解最低入金",
    "你能帮我查下我的订单吗",
    "我的密码忘了怎么办",
    "为什么我点差变大了",
  ],
  phone: [
    "客户主动来电询问出金",
    "客户经理主动跟进",
    "技术问题 — 无法登录",
    "VIP 客户回访",
    "投诉处理",
  ],
  sms:   [
    "您的验证码是 XXX",
    "出金已到账提醒",
    "新交易品种上线通知",
  ],
};

const STAFF = ["Alice Chen", "Bob Martin", "Carol Wong", "David Liu", "Emma Park"];

function generateMockCommunications(userId: string): Communication[] {
  const r = seededRng(`${userId}:comms`);
  const h = rngHelpers(r);
  const count = h.int(8, 30);
  const out: Communication[] = [];
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    const channel = h.weighted<Channel>([
      ["email", 40], ["im", 30], ["phone", 15], ["sms", 15],
    ]);
    const direction: Direction = h.weighted([
      ["outbound", 60], ["inbound", 40],
    ]);
    const subject = h.pick(SUBJECTS[channel]);

    out.push({
      id: `comm_${userId.slice(-6)}_${i}`,
      channel,
      direction,
      staff: h.pick(STAFF),
      subject,
      preview:
        channel === "email" ? "Dear customer, we are writing to inform you that…"
        : channel === "im" ? "Yes I can help you with that, let me check your account…"
        : channel === "phone" ? `通话时长 ${h.int(2, 25)} 分钟，记录已存档`
        : "您的验证码 / 通知短信",
      timestamp: new Date(now - h.int(1, 90) * 86400_000 - h.int(0, 86400_000)).toISOString(),
      durationMin: channel === "phone" ? h.int(2, 30) : undefined,
      attachmentCount: channel === "email" && h.bool(0.3) ? h.int(1, 3) : undefined,
      hasReply: h.bool(0.7),
    });
  }

  return out.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

/* ─── 沟通模板（N3）— 内置高频话术 ─────────────────────────────────── */

interface CommTemplate {
  id: string;
  category: "kyc" | "deposit" | "withdrawal" | "retention" | "compliance" | "marketing";
  channel: Channel;
  subject: string;
  body: string;
}

const COMM_TEMPLATES: CommTemplate[] = [
  {
    id: "kyc-pending",
    category: "kyc", channel: "email",
    subject: "请尽快完成 KYC 实名认证",
    body: "尊敬的 {{name}}：\n您的账户尚未完成 KYC 实名认证。为了保护您的资金安全，请在 7 天内提交身份证 + 自拍以解锁完整交易权限。\n\n— TradePass 合规团队",
  },
  {
    id: "kyc-expiring",
    category: "kyc", channel: "email",
    subject: "证件即将过期 — 请重新上传",
    body: "您的身份证件即将在 30 天内过期。请提前更新以避免账户被限制。",
  },
  {
    id: "first-deposit",
    category: "deposit", channel: "email",
    subject: "欢迎入金 — 解锁交易权限",
    body: "您的 KYC 已审核通过！欢迎使用 TradePass，最低入金 $100 即可开始交易。",
  },
  {
    id: "withdrawal-delayed",
    category: "withdrawal", channel: "email",
    subject: "您的出金正在加急处理",
    body: "我们已收到您的出金申请。由于风控复核，正在加急处理，预计 24 小时内完成。如有疑问请联系客服。",
  },
  {
    id: "retention-dormant",
    category: "retention", channel: "phone",
    subject: "客户经理回访 — 30 天未交易",
    body: "客户最近 30 天未登录 / 未交易。建议主动电话回访，了解原因，推荐当前活动。",
  },
  {
    id: "vip-upgrade",
    category: "retention", channel: "email",
    subject: "您已升级 VIP — 专属服务上线",
    body: "恭喜！您已升级 VIP 客户，将获得专属客户经理、点差优惠、优先出金等专属权益。",
  },
  {
    id: "compliance-resubmit",
    category: "compliance", channel: "email",
    subject: "请重新提交 KYC 资料",
    body: "您提交的证件不清晰，无法识别关键信息。请重新拍摄一张清晰、四角完整的照片再次提交。",
  },
  {
    id: "promo-festival",
    category: "marketing", channel: "email",
    subject: "节日活动 — 双倍返佣",
    body: "{{festival}} 期间，所有交易享受 2 倍返佣，活动截止 {{endDate}}。",
  },
];

const CATEGORY_LABEL: Record<CommTemplate["category"], string> = {
  kyc: "合规 / KYC",
  deposit: "入金",
  withdrawal: "出金",
  retention: "留存",
  compliance: "合规",
  marketing: "营销活动",
};

export default function CommunicationsTab({ data }: BaseTabProps) {
  const { user } = data;
  const comms = useMemo(() => generateMockCommunications(user.id), [user.id]);

  const [channelFilter, setChannelFilter] = useState<"all" | Channel>("all");
  const [composeOpen, setComposeOpen] = useState(false);

  const filtered = channelFilter === "all" ? comms : comms.filter((c) => c.channel === channelFilter);

  const counts: Record<Channel | "all", number> = {
    all: comms.length,
    email: comms.filter((c) => c.channel === "email").length,
    im:    comms.filter((c) => c.channel === "im").length,
    phone: comms.filter((c) => c.channel === "phone").length,
    sms:   comms.filter((c) => c.channel === "sms").length,
  };

  return (
    <div className="space-y-4">
      {/* Header + 主操作 */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900 mb-0.5">沟通记录</h3>
          <p className="text-xs text-slate-500">{comms.length} 条记录 · 覆盖邮件 / IM / 电话 / 短信</p>
        </div>
        <button
          onClick={() => setComposeOpen(true)}
          className="h-8 px-3 text-sm font-medium rounded-md bg-slate-900 text-white hover:bg-slate-800 inline-flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          发起沟通
        </button>
      </div>

      {composeOpen && (
        <ComposeDialog
          customerName={user.name}
          onClose={() => setComposeOpen(false)}
          onSent={(channel, subject) => {
            console.info(`[comm] sent ${channel}: ${subject}`);
            setComposeOpen(false);
          }}
        />
      )}

      {/* Channel filter */}
      <div className="inline-flex bg-slate-100 rounded-lg p-0.5 flex-wrap max-w-full">
        <FilterButton label="全部" count={counts.all} active={channelFilter === "all"} onClick={() => setChannelFilter("all")} />
        {(["email", "im", "phone", "sms"] as Channel[]).map((c) => (
          <FilterButton
            key={c}
            label={CHANNEL_META[c].label}
            count={counts[c]}
            active={channelFilter === c}
            onClick={() => setChannelFilter(c)}
          />
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white py-16 text-center text-sm text-slate-400">
          无沟通记录
        </div>
      ) : (
        <ul className="rounded-xl border border-slate-200 bg-white overflow-hidden divide-y divide-slate-100">
          {filtered.map((c) => <CommRow key={c.id} comm={c} />)}
        </ul>
      )}
    </div>
  );
}

function FilterButton({ label, count, active, onClick }: {
  label: string; count: number; active: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 h-7 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
        active ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
      }`}
    >
      <span>{label}</span>
      {count > 0 && <span className="text-[10px] tabular-nums text-slate-400">{count}</span>}
    </button>
  );
}

function CommRow({ comm }: { comm: Communication }) {
  const meta = CHANNEL_META[comm.channel];
  const Icon = meta.icon;
  const isInbound = comm.direction === "inbound";

  return (
    <li className="px-4 py-3 hover:bg-slate-50 cursor-pointer">
      <div className="flex items-start gap-3">
        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full shrink-0 ${meta.tone}`}>
          <Icon className="w-4 h-4" />
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className={`text-[10.5px] font-medium uppercase tracking-wider ${isInbound ? "text-blue-700" : "text-slate-500"}`}>
              {isInbound ? "客户 →" : "→ 客户"}
            </span>
            <h4 className="text-sm font-semibold text-slate-800 truncate">{comm.subject}</h4>
            {comm.attachmentCount && (
              <span className="text-[10px] text-slate-400">📎 {comm.attachmentCount}</span>
            )}
            <span className="ml-auto text-[11px] text-slate-400 tabular-nums shrink-0">{timeAgo(comm.timestamp)}</span>
          </div>
          <p className="text-xs text-slate-500 mt-1 truncate">{comm.preview}</p>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
            <span>{isInbound ? "由" : "由"} {comm.staff}</span>
            {comm.durationMin && <span>· 时长 {comm.durationMin} 分钟</span>}
            {comm.hasReply && <span className="text-emerald-600">· 已回复</span>}
          </div>
        </div>
        <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0 mt-2" />
      </div>
    </li>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Compose dialog with templates                                              */
/* ─────────────────────────────────────────────────────────────────────────── */

function ComposeDialog({
  customerName, onClose, onSent,
}: {
  customerName: string;
  onClose: () => void;
  onSent: (channel: Channel, subject: string) => void;
}) {
  const [channel, setChannel] = useState<Channel>("email");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  const templates = COMM_TEMPLATES.filter((tpl) => tpl.channel === channel);

  const applyTemplate = (tpl: CommTemplate) => {
    setSubject(tpl.subject);
    setBody(tpl.body.replace("{{name}}", customerName));
  };

  const send = async () => {
    if (!subject.trim() && !body.trim()) return;
    setSending(true);
    // Mock 延迟
    await new Promise((r) => setTimeout(r, 400));
    setSending(false);
    onSent(channel, subject);
  };

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm" />
      <div className="fixed left-1/2 top-[10vh] -translate-x-1/2 z-50 w-[720px] max-w-[92vw] bg-white rounded-xl border border-slate-200 shadow-2xl flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-semibold text-slate-900">发起沟通</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">✕</button>
        </div>

        <div className="flex-1 overflow-hidden grid grid-cols-[200px_1fr]">
          {/* Sidebar — channel + template picker */}
          <aside className="border-r border-slate-100 bg-slate-50/40 overflow-y-auto">
            <div className="p-2.5">
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1.5">渠道</p>
              <div className="grid grid-cols-2 gap-1">
                {(["email", "im", "phone", "sms"] as Channel[]).map((c) => (
                  <button
                    key={c}
                    onClick={() => setChannel(c)}
                    className={`h-7 px-2 text-xs rounded-md transition-colors flex items-center gap-1.5 ${
                      channel === c
                        ? "bg-blue-50 text-primary border border-blue-200"
                        : "text-slate-600 hover:bg-slate-100 border border-transparent"
                    }`}
                  >
                    <ChannelIcon channel={c} />
                    {CHANNEL_META[c].label}
                  </button>
                ))}
              </div>
            </div>
            <div className="border-t border-slate-100 p-2.5">
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1.5">模板</p>
              {templates.length === 0 ? (
                <p className="text-[11px] text-slate-400 py-2">该渠道暂无模板</p>
              ) : (
                <ul className="space-y-0.5">
                  {templates.map((t) => (
                    <li key={t.id}>
                      <button
                        onClick={() => applyTemplate(t)}
                        className="w-full text-left px-2 py-1.5 rounded hover:bg-blue-50 hover:text-primary text-[11px] text-slate-700 group"
                      >
                        <div className="flex items-center gap-1.5">
                          <FileText className="w-3 h-3 text-slate-400 group-hover:text-primary" />
                          <span className="font-medium truncate">{t.subject}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">{CATEGORY_LABEL[t.category]}</p>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>

          {/* Compose area */}
          <div className="flex flex-col p-4 space-y-3 overflow-y-auto">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">主题</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder={channel === "phone" ? "通话主题（内部记录）" : "邮件 / 消息主题"}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>
            <div className="flex-1 min-h-0 flex flex-col">
              <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">内容</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="从左侧选个模板，或自己写…"
                className="flex-1 min-h-[200px] mt-1 px-3 py-2 border border-slate-200 rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>
            <p className="text-[10px] text-slate-400">
              占位符: <code className="font-mono bg-slate-100 px-1">{`{{name}}`}</code> = {customerName} ·
              <code className="font-mono bg-slate-100 px-1 ml-1">{`{{festival}}`}</code> / <code className="font-mono bg-slate-100 px-1">{`{{endDate}}`}</code> 等会自动替换
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-end gap-2">
          <button onClick={onClose} className="h-8 px-3 text-xs font-medium text-slate-600 hover:bg-slate-50 rounded-md">取消</button>
          <button
            onClick={send}
            disabled={sending || (!subject.trim() && !body.trim())}
            className="h-8 px-4 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {sending ? "发送中…" : "发送"}
          </button>
        </div>
      </div>
    </>
  );
}

function ChannelIcon({ channel }: { channel: Channel }) {
  const Icon = CHANNEL_META[channel].icon;
  return <Icon className="w-3 h-3" />;
}
