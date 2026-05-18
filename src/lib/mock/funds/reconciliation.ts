/**
 * Mock data — Reconciliation
 *
 * Four reconciliation streams (Bank / PSP / Crypto / Wallet), each
 * compared against an external statement. Each row is either an
 * auto-matched line, a manual match, or an unmatched discrepancy.
 *
 * Spec: `docscc/产品文档/2026-05-17-funds-module-design.md` §7.6
 */

export type ReconStream = "Bank" | "PSP" | "Crypto" | "Wallet";

export type ReconStatus = "Auto Matched" | "Manual Matched" | "Unmatched" | "Disputed";

export interface ReconRow {
  id: string;
  stream: ReconStream;
  externalRef: string;       // ID from the source system
  externalAmount: number;
  systemRef?: string;        // internal txn id, if matched
  systemAmount?: number;
  status: ReconStatus;
  delta: number;             // externalAmount - systemAmount (0 when perfect)
  bookedDate: string;        // ISO YYYY-MM-DD
  note?: string;
  matchedBy?: string;        // operator id, only for Manual Matched
}

export const RECON_STATUS_FG: Record<ReconStatus, { text: string; dot: string }> = {
  "Auto Matched":   { text: "text-emerald-700", dot: "bg-emerald-500" },
  "Manual Matched": { text: "text-blue-700",    dot: "bg-blue-500"    },
  "Unmatched":      { text: "text-red-700",     dot: "bg-red-500"     },
  "Disputed":       { text: "text-amber-700",   dot: "bg-amber-500"   },
};

export const mockReconciliation: ReconRow[] = [
  // Bank
  { id: "RCN-1001", stream: "Bank", externalRef: "BCA-20260517-001", externalAmount: 5_000, systemRef: "DEP-00004", systemAmount: 5_000,
    status: "Auto Matched",   delta: 0,    bookedDate: "2026-05-17" },
  { id: "RCN-1002", stream: "Bank", externalRef: "BCA-20260517-002", externalAmount: 1_200, systemRef: "DEP-00009", systemAmount: 1_200,
    status: "Manual Matched", delta: 0,    bookedDate: "2026-05-17", matchedBy: "ops_001" },
  { id: "RCN-1003", stream: "Bank", externalRef: "CHASE-99201",      externalAmount: 4_800,
    status: "Unmatched",      delta: 4_800, bookedDate: "2026-05-17",
    note: "Bank credit with reference 'transfer', no UID match in last 7d" },
  // PSP
  { id: "RCN-2001", stream: "PSP",  externalRef: "DOKU-X1A29",       externalAmount: 412,   systemRef: "DEP-00010", systemAmount: 412,
    status: "Auto Matched",   delta: 0,    bookedDate: "2026-05-17" },
  { id: "RCN-2002", stream: "PSP",  externalRef: "DOKU-X1A30",       externalAmount: 1_200, systemRef: "DEP-00004", systemAmount: 1_300,
    status: "Disputed",       delta: -100, bookedDate: "2026-05-17",
    note: "PSP statement shows $100 less than internal record · raised ticket DOKU-#2244" },
  // Crypto
  { id: "RCN-3001", stream: "Crypto", externalRef: "0xabc12...8821", externalAmount: 2_500, systemRef: "DEP-00001", systemAmount: 2_500,
    status: "Auto Matched",   delta: 0,    bookedDate: "2026-05-17" },
  { id: "RCN-3002", stream: "Crypto", externalRef: "0xff992...77cc", externalAmount: 80_000,systemRef: "DEP-00006", systemAmount: 80_000,
    status: "Auto Matched",   delta: 0,    bookedDate: "2026-05-17" },
  { id: "RCN-3003", stream: "Crypto", externalRef: "0xee011...44bb", externalAmount: 2_000,
    status: "Unmatched",      delta: 2_000, bookedDate: "2026-05-17",
    note: "Confirmed on chain but client deposit DEP-00005 marked failed; investigating" },
  // Wallet
  { id: "RCN-4001", stream: "Wallet", externalRef: "MT5-100012-WD",  externalAmount: 500,   systemRef: "TRF-001", systemAmount: 500,
    status: "Auto Matched",   delta: 0,    bookedDate: "2026-05-17" },
];

export function reconStats(rows: ReconRow[]) {
  return {
    autoMatched:   rows.filter((r) => r.status === "Auto Matched").length,
    manualMatched: rows.filter((r) => r.status === "Manual Matched").length,
    unmatched:     rows.filter((r) => r.status === "Unmatched").length,
    disputed:      rows.filter((r) => r.status === "Disputed").length,
    netDelta:      rows.reduce((s, r) => s + r.delta, 0),
  };
}
