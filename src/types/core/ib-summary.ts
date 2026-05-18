/**
 * IBSummary — minimal "Introducing Broker" card for hover popovers
 * and inline citations.
 *
 * Used by:
 *   - CLM Case Detail customer card → hover IB name → tier + KYC pass rate.
 *   - Clients Detail left rail → "Referred by" row with IB chip.
 *   - Clients Relationships Tab → IB invitation tree node.
 *
 * The full IB profile lives in /crm/ib (its own module). This summary is
 * a lightweight projection intended for embedded display.
 */

export type IBTier = "standard" | "gold" | "platinum";
export type IBStatus = "active" | "suspended";

export interface IBSummary {
  /** IB's internal id (matches a BackofficeUser id when IB is also a client). */
  id: string;
  /** IB's user-visible UID (10 digits). */
  uid: string;
  /** Display name. */
  name: string;
  tier: IBTier;
  status: IBStatus;
  /** Total clients this IB has ever referred. */
  totalReferred: number;
  /** Active (not closed/frozen) clients referred. */
  activeReferred: number;
  /** Of referred clients, how many passed KYC (0–1). */
  kycPassRate: number;
  /** Of referred clients, how many flagged for fraud (0–1). */
  fraudRate: number;
  /** ISO timestamp the IB joined. */
  joinedAt: string;
  /** Optional: country of the IB */
  country?: string;
}
