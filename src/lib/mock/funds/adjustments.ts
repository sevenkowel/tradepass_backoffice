/**
 * Mock data — Adjustments
 *
 * Manual ledger entries: corrections, bonus grants, IB commission
 * deposits. Every adjustment requires approval before posting (so
 * each row references an approval task id).
 *
 * Spec: `docscc/产品文档/2026-05-17-funds-module-design.md` §7.2
 */

export type AdjustmentKind = "Manual" | "IB Commission" | "Bonus Grant" | "Correction";
export type AdjustmentStatus = "Pending" | "Approved" | "Rejected" | "Posted";
export type AdjustmentDirection = "Credit" | "Debit";

export interface AdjustmentRow {
  id: string;
  userId: string;
  userName: string;
  kind: AdjustmentKind;
  direction: AdjustmentDirection;
  wallet: "Real" | "Bonus" | "Credit" | "Reward";
  amount: number;
  currency: string;
  status: AdjustmentStatus;
  approvalTaskId?: string;
  reason: string;
  createdAt: string;
  createdBy: string;
  postedAt?: string;
}

const NOW = new Date("2026-05-17T14:30:00.000Z");
const isoMinusH = (h: number) => new Date(NOW.getTime() - h * 3600_000).toISOString();

export const ADJ_KIND_FG: Record<AdjustmentKind, { text: string; dot: string }> = {
  "Manual":        { text: "text-slate-700",   dot: "bg-slate-400"   },
  "IB Commission": { text: "text-blue-700",    dot: "bg-blue-500"    },
  "Bonus Grant":   { text: "text-violet-700",  dot: "bg-violet-500"  },
  "Correction":    { text: "text-amber-700",   dot: "bg-amber-500"   },
};

export const ADJ_STATUS_FG: Record<AdjustmentStatus, { text: string; dot: string }> = {
  Pending:  { text: "text-amber-700",   dot: "bg-amber-500"   },
  Approved: { text: "text-blue-700",    dot: "bg-blue-500"    },
  Rejected: { text: "text-red-700",     dot: "bg-red-500"     },
  Posted:   { text: "text-emerald-700", dot: "bg-emerald-500" },
};

export const mockAdjustments: AdjustmentRow[] = [
  { id: "ADJ-001", userId: "USR-12345", userName: "John Smith",     kind: "Correction",     direction: "Credit", wallet: "Real",   amount: 250,  currency: "USD",
    status: "Posted",   approvalTaskId: "TASK-1101", reason: "Refund · system charged 2× for deposit DEP-00002",
    createdAt: isoMinusH(24), createdBy: "ops_001", postedAt: isoMinusH(23) },
  { id: "ADJ-002", userId: "USR-67890", userName: "Vu Nguyen",      kind: "IB Commission",  direction: "Credit", wallet: "Real",   amount: 145,  currency: "USD",
    status: "Pending",  approvalTaskId: "TASK-1102", reason: "IB rebate · May 2026 · settlement run #042",
    createdAt: isoMinusH(2),  createdBy: "system" },
  { id: "ADJ-003", userId: "USR-23456", userName: "Sarah Johnson",  kind: "Bonus Grant",    direction: "Credit", wallet: "Bonus",  amount: 100,  currency: "USD",
    status: "Posted",   approvalTaskId: "TASK-1099", reason: "Welcome bonus · campaign NEWYR2026",
    createdAt: isoMinusH(48), createdBy: "marketing_001", postedAt: isoMinusH(47) },
  { id: "ADJ-004", userId: "USR-34567", userName: "Michael Brown",  kind: "Manual",         direction: "Debit",  wallet: "Real",   amount: 5000, currency: "USD",
    status: "Pending",  approvalTaskId: "TASK-1103", reason: "Chargeback · disputed Visa charge 2026-05-12",
    createdAt: isoMinusH(0.5),createdBy: "ops_002" },
  { id: "ADJ-005", userId: "USR-78901", userName: "Yuki Tanaka",    kind: "IB Commission",  direction: "Credit", wallet: "Real",   amount: 320,  currency: "USD",
    status: "Posted",   approvalTaskId: "TASK-1098", reason: "IB rebate · April 2026 · settlement #041",
    createdAt: isoMinusH(720),createdBy: "system", postedAt: isoMinusH(719) },
  { id: "ADJ-006", userId: "USR-45678", userName: "Emma Wilson",    kind: "Correction",     direction: "Debit",  wallet: "Bonus",  amount: 50,   currency: "USD",
    status: "Rejected", approvalTaskId: "TASK-1100", reason: "Bonus reversal · violation of bonus terms (FYI: client withdrew before turnover)",
    createdAt: isoMinusH(48), createdBy: "ops_001" },
  { id: "ADJ-007", userId: "USR-01234", userName: "Andre Silva",    kind: "Bonus Grant",    direction: "Credit", wallet: "Bonus",  amount: 200,  currency: "USD",
    status: "Approved", approvalTaskId: "TASK-1104", reason: "Loyalty reward · Q2 retention campaign",
    createdAt: isoMinusH(8),  createdBy: "marketing_002" },
];

export function adjStats(rows: AdjustmentRow[]) {
  return {
    pending:  rows.filter((r) => r.status === "Pending").length,
    posted:   rows.filter((r) => r.status === "Posted" && new Date(r.postedAt!).getTime() > Date.now() - 86_400_000).length,
    ibToday:  rows.filter((r) => r.kind === "IB Commission" && new Date(r.createdAt).getTime() > Date.now() - 86_400_000).length,
    rejected: rows.filter((r) => r.status === "Rejected").length,
  };
}
