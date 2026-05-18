/**
 * Client summary formatter (P1-N5) — 把客户关键信息组装成可复制的纯文本，
 * 方便发到 Slack / 邮件 / Telegram 内部群协作。
 */

import type { ClientDetailData } from "@/types/backoffice/client-detail";

export interface SummaryFormat {
  format: "plain" | "slack" | "markdown";
}

/** 派生客户摘要文本。 */
export function buildClientSummary(
  data: ClientDetailData,
  fmt: SummaryFormat = { format: "plain" },
): string {
  const { user, valueMetrics, accounts, riskFactors, riskRelationships } = data;
  const lines: string[] = [];

  // Header
  const country = user.country?.toUpperCase() ?? "—";
  const headerName = fmt.format === "slack"
    ? `*${user.name}* \`${user.uid}\``
    : fmt.format === "markdown"
      ? `**${user.name}** \`${user.uid}\``
      : `${user.name} (${user.uid})`;
  lines.push(`👤 ${headerName} · ${country} · KYC ${user.kycStatus.toUpperCase()} · ${user.level.toUpperCase()}`);

  // Status row
  const statusLine = [
    `Status: ${user.status}`,
    `Risk: ${user.riskLevel} (${user.riskScore ?? "—"}/100)`,
    user.lastLoginAt ? `Last login: ${new Date(user.lastLoginAt).toLocaleDateString()}` : null,
  ].filter(Boolean).join(" · ");
  lines.push(statusLine);

  // Value
  if (valueMetrics) {
    lines.push("");
    lines.push("💰 Value");
    lines.push(`  Net deposit: $${formatNum(valueMetrics.netDeposit)}`);
    lines.push(`  Balance:     $${formatNum(valueMetrics.currentBalance)}`);
    lines.push(`  Equity:      $${formatNum(valueMetrics.equity)}`);
    if (valueMetrics.totalProfit != null) {
      lines.push(`  Total PnL:   $${formatNum(valueMetrics.totalProfit)} (${valueMetrics.totalProfitPercent?.toFixed(1) ?? "—"}%)`);
    }
  }

  // Accounts
  if (accounts.length > 0) {
    lines.push("");
    lines.push(`🏦 Accounts (${accounts.length})`);
    for (const a of accounts.slice(0, 5)) {
      lines.push(`  MT ${a.mtAccount} · ${a.accountType} · ${a.status} · equity $${formatNum(a.equity)}`);
    }
    if (accounts.length > 5) lines.push(`  …+ ${accounts.length - 5} more`);
  }

  // Risk — backoffice RiskFactor.level 仅 low/medium/high
  const highFactors = (riskFactors ?? []).filter((f) => f.level === "high");
  const strongRels = (riskRelationships ?? []).filter((r) => r.strength >= 0.7);
  if (highFactors.length > 0 || strongRels.length > 0) {
    lines.push("");
    lines.push("⚠️ Risk signals");
    for (const f of highFactors.slice(0, 5)) {
      lines.push(`  [${f.level}] ${f.name}`);
    }
    if (strongRels.length > 0) {
      lines.push(`  ${strongRels.length} strong relationship(s)`);
    }
  }

  // Footer
  lines.push("");
  lines.push(
    fmt.format === "slack" || fmt.format === "markdown"
      ? `<${origin()}/crm/clients/${user.id}|Open in CRM →>`
      : `Open in CRM: ${origin()}/crm/clients/${user.id}`,
  );

  return lines.join("\n");
}

function formatNum(n: number | null | undefined): string {
  if (n == null) return "—";
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toLocaleString();
}

function origin(): string {
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}

/** 复制到剪贴板。返回是否成功。 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.clipboard) return false;
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
