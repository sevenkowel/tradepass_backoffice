"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/portal/widgets/PageHeader";
import { Monitor, Loader2 } from "lucide-react";

/**
 * T1: MT5 WebTerminal iframe 嵌入
 * 生产环境应通过 MT5 Manager API 获取 SSO token
 * 这里使用 MetaQuotes 官方 WebTerminal URL 作为最小实现
 */
export default function TradingTerminalPage() {
  const [loading, setLoading] = useState(true);
  const [server, setServer] = useState("TradePass-Live");

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  // MetaQuotes WebTerminal URL format
  // Replace with your broker's server name and actual login flow
  const terminalUrl = `https://trade.mql5.com/trade?servers=${encodeURIComponent(server)}&amp;startup_mode=open_demo&amp;lang=zh`;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <PageHeader
        title="交易终端"
        description="MT5 WebTerminal — 无需下载，浏览器直接交易"
      />

      <div className="flex items-center gap-3 px-6 py-3 bg-[var(--tp-surface)] border-b border-[var(--tp-border)]">
        <span className="text-sm text-[var(--tp-fg-muted)]">服务器:</span>
        <select
          value={server}
          onChange={(e) => {
            setServer(e.target.value);
            setLoading(true);
            setTimeout(() => setLoading(false), 1000);
          }}
          className="text-sm px-3 py-1.5 rounded-md border border-[var(--tp-border)] bg-[var(--tp-bg)]"
        >
          <option value="TradePass-Live">TradePass-Live</option>
          <option value="TradePass-Demo">TradePass-Demo</option>
        </select>
      </div>

      <div className="flex-1 relative">
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--tp-bg)] z-10">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--tp-accent)] mb-3" />
            <p className="text-sm text-[var(--tp-fg-muted)]">正在连接交易服务器...</p>
          </div>
        )}
        <iframe
          src={terminalUrl}
          className="w-full h-full border-0"
          title="MT5 WebTerminal"
          allow="fullscreen"
        />
      </div>

      <div className="px-6 py-2 text-xs text-[var(--tp-fg-muted)] border-t border-[var(--tp-border)] bg-[var(--tp-surface)]">
        提示: 首次使用需要输入您的 MT5 账号和密码。如需开通真实账户，请先完成 KYC 认证。
      </div>
    </div>
  );
}
