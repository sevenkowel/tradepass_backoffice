/**
 * Mock data — MT Bridge (forex-specific)
 *
 * Tracks fund movement between client wallets and MT4/MT5 accounts
 * (and between MT accounts). Each row carries an `mtSync` status
 * because the MT Manager API call is async and can fail.
 *
 * Spec: `docscc/产品文档/2026-05-17-funds-module-design.md` §6.5
 */

export type BridgeDirection = "Wallet→MT" | "MT→Wallet" | "MT→MT" | "Bonus Injection";

export type MtSyncStatus = "Synced" | "Syncing" | "Failed";

export interface BridgeRow {
  id: string;
  userId: string;
  userName: string;
  direction: BridgeDirection;
  from: string;
  to: string;
  amount: number;
  currency: string;
  status: "Completed" | "Pending" | "Failed";
  mtSync: MtSyncStatus;
  mtSyncDetail?: string;
  createdAt: string;
  reason?: string;          // for Bonus injections etc.
}

const NOW = new Date("2026-05-17T14:30:00.000Z");
const isoMinusMin = (m: number) => new Date(NOW.getTime() - m * 60_000).toISOString();

export const MT_SYNC_FG: Record<MtSyncStatus, { text: string; dot: string }> = {
  Synced:  { text: "text-emerald-700", dot: "bg-emerald-500" },
  Syncing: { text: "text-blue-700",    dot: "bg-blue-500"    },
  Failed:  { text: "text-red-700",     dot: "bg-red-500"     },
};

export const BRIDGE_STATUS_FG: Record<BridgeRow["status"], { text: string; dot: string }> = {
  Completed: { text: "text-emerald-700", dot: "bg-emerald-500" },
  Pending:   { text: "text-amber-700",   dot: "bg-amber-500"   },
  Failed:    { text: "text-red-700",     dot: "bg-red-500"     },
};

export const mockMtBridge: BridgeRow[] = [
  { id: "TRF-001", userId: "USR-12345", userName: "John Smith", direction: "Wallet→MT", from: "Real Wallet", to: "MT5-100012",
    amount: 500, currency: "USD", status: "Completed", mtSync: "Synced", createdAt: isoMinusMin(8) },
  { id: "TRF-002", userId: "USR-23456", userName: "Sarah Johnson", direction: "Wallet→MT", from: "Real Wallet", to: "MT5-100013",
    amount: 1200, currency: "USD", status: "Pending", mtSync: "Syncing", mtSyncDetail: "Waiting MT5 Manager confirmation", createdAt: isoMinusMin(3) },
  { id: "TRF-003", userId: "USR-34567", userName: "Michael Brown", direction: "MT→Wallet", from: "MT5-100014", to: "Real Wallet",
    amount: 800, currency: "USD", status: "Failed", mtSync: "Failed", mtSyncDetail: "MT rejected: margin level after = 78%, below 100% threshold", createdAt: isoMinusMin(25) },
  { id: "TRF-004", userId: "USR-78901", userName: "Yuki Tanaka", direction: "MT→MT", from: "MT5-100017A", to: "MT5-100017B",
    amount: 3000, currency: "USD", status: "Completed", mtSync: "Synced", createdAt: isoMinusMin(60) },
  { id: "TRF-005", userId: "USR-67890", userName: "Vu Nguyen", direction: "Bonus Injection", from: "Bonus Pool", to: "Bonus Wallet",
    amount: 100, currency: "USD", status: "Completed", mtSync: "Synced", createdAt: isoMinusMin(120),
    reason: "Welcome bonus campaign · NEWYR2026" },
  { id: "TRF-006", userId: "USR-45678", userName: "Emma Wilson", direction: "Wallet→MT", from: "Real Wallet", to: "MT5-100015",
    amount: 2500, currency: "USD", status: "Failed", mtSync: "Failed", mtSyncDetail: "MT account suspended (regulatory hold)", createdAt: isoMinusMin(180) },
  { id: "TRF-007", userId: "USR-56789", userName: "Carlos Mendez", direction: "Wallet→MT", from: "Real Wallet", to: "MT5-100016",
    amount: 4000, currency: "USD", status: "Completed", mtSync: "Synced", createdAt: isoMinusMin(240) },
  { id: "TRF-008", userId: "USR-89012", userName: "Lisa Chen", direction: "MT→Wallet", from: "MT5-100018", to: "Real Wallet",
    amount: 200, currency: "USD", status: "Pending", mtSync: "Syncing", createdAt: isoMinusMin(2) },
];

export function bridgeStats(rows: BridgeRow[]) {
  return {
    syncing: rows.filter((r) => r.mtSync === "Syncing").length,
    failed:  rows.filter((r) => r.mtSync === "Failed").length,
    today:   rows.filter((r) => (Date.now() - new Date(r.createdAt).getTime()) < 24 * 3600_000).length,
    volume:  rows.filter((r) => r.status === "Completed").reduce((s, r) => s + r.amount, 0),
  };
}
