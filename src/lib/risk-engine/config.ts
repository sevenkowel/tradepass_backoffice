/**
 * Risk Engine — composite scoring configuration.
 *
 * Single source of weights and thresholds for the 6-axis composite
 * risk score. The Risk Center "Scoring Policy" page reads from this
 * file to render the weight table; the engine itself reads it when
 * computing a profile.
 *
 * Production note: this is intentionally hard-coded for now. The
 * eventual admin UI will write to a versioned policy table; the
 * engine and the UI will both move from this constant to that table.
 * Until then, every change here is a code change and goes through
 * code review.
 */

import type { RiskFactorKey } from "@/types/core";
import type { RiskLevel } from "@/types/clm";

export interface FactorWeight {
  key: RiskFactorKey;
  label: string;
  weight: number;     // sum of weights = 1.0
  rationale: string;
}

export const FACTOR_WEIGHTS: FactorWeight[] = [
  {
    key: "aml",
    label: "AML",
    weight: 0.30,
    rationale: "AML watchlist matches are the strongest single risk signal — a confirmed hit usually means manual review or rejection regardless of other factors.",
  },
  {
    key: "country",
    label: "Country",
    weight: 0.15,
    rationale: "FATF rating + internal monitoring list. Higher weight than identity because country risk is structural and rarely false-positive.",
  },
  {
    key: "identity",
    label: "Identity",
    weight: 0.15,
    rationale: "OCR confidence + face match + liveness. Document fraud is rare in our pipeline (Sumsub catches most), so weight is moderate.",
  },
  {
    key: "device_ip",
    label: "Device / IP",
    weight: 0.15,
    rationale: "VPN / proxy / Tor / shared device. Important but noisier — many legitimate users hit a VPN by accident on mobile.",
  },
  {
    key: "blacklist",
    label: "Internal Blacklist",
    weight: 0.15,
    rationale: "Internal fraud / chargeback / litigation matches. Lower than AML weight because internal lists are smaller and shorter-lived.",
  },
  {
    key: "ib_source",
    label: "IB Source",
    weight: 0.10,
    rationale: "Referring IB's historical KYC pass rate vs peer median. Soft signal — used as tiebreaker, not a primary driver.",
  },
];

/** Weight sum sanity-check; throws at module-load if drifted. */
const WEIGHT_SUM = FACTOR_WEIGHTS.reduce((s, f) => s + f.weight, 0);
if (Math.abs(WEIGHT_SUM - 1.0) > 0.001) {
  // eslint-disable-next-line no-console
  console.warn(
    `[risk-engine] FACTOR_WEIGHTS sum to ${WEIGHT_SUM.toFixed(3)}, expected 1.000`
  );
}

export interface LevelThreshold {
  level: RiskLevel;
  min: number;
  max: number;
  action: string;
}

export const LEVEL_THRESHOLDS: LevelThreshold[] = [
  { level: "low",      min: 0,  max: 29,  action: "Auto-approve eligible (subject to AML pass)" },
  { level: "medium",   min: 30, max: 59,  action: "Manual review by standard reviewer" },
  { level: "high",     min: 60, max: 79,  action: "Manual review by senior reviewer" },
  { level: "critical", min: 80, max: 100, action: "Senior review + dual sign-off required" },
];
