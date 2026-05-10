/**
 * Mock risk-profile catalogue.
 *
 * For development we synthesize a `RiskProfile` from a client's flat
 * `riskScore` rather than maintaining a parallel hand-crafted record
 * per client. Production wires `lookupRiskProfile(clientId)` to a real
 * Risk Engine endpoint that returns the same shape.
 *
 * Templates roughly track FATF / industry benchmarks but values are
 * illustrative — every reasoning sentence is plain English so reviewers
 * can read the engine's logic without docs.
 */

import type { RiskProfile, RiskFactor } from "@/types/core";
import type { RiskLevel } from "@/types/clm";

const NOW = new Date().toISOString();

/** Bucket score (0–100) into a RiskLevel using the same thresholds as
 *  the rest of the CRM (Clients list / Review Queue). */
function bucketLevel(score: number): RiskLevel {
  if (score >= 80) return "critical";
  if (score >= 60) return "high";
  if (score >= 30) return "medium";
  return "low";
}

/** Synthesize a 6-axis breakdown from an overall score. The breakdown
 *  is opinionated: AML weight is the heaviest and dominates high-end
 *  scores; identity is usually a low risk for verified clients. */
function makeFactors(overall: number): RiskFactor[] {
  const high = overall >= 60;
  const medium = overall >= 30;
  return [
    {
      key: "country",
      label: "Country",
      score: medium ? 55 : 25,
      weight: 0.15,
      level: medium ? "medium" : "low",
      reasoning: medium
        ? "Country on internal monitoring list. Higher caution recommended."
        : "Country is FATF-compliant with no recent advisories.",
      evidence: { fatfRating: "compliant", monitored: medium },
    },
    {
      key: "identity",
      label: "Identity",
      score: 90,
      weight: 0.15,
      level: "low",
      reasoning: "Document, face match and liveness all passed.",
      evidence: { ocrConfidence: 0.94, faceMatchScore: 0.96, livenessPass: true },
    },
    {
      key: "device_ip",
      label: "Device / IP",
      score: high ? 60 : medium ? 35 : 15,
      weight: 0.15,
      level: high ? "high" : medium ? "medium" : "low",
      reasoning: high
        ? "VPN detected on registration; device fingerprint matches related accounts."
        : medium
          ? "Some device-sharing observed but no VPN/proxy detected."
          : "No anomalies on device or IP.",
      evidence: { isVpn: high, sharedDeviceCount: high ? 2 : medium ? 1 : 0 },
    },
    {
      key: "ib_source",
      label: "IB Source",
      score: medium ? 55 : 25,
      weight: 0.10,
      level: medium ? "medium" : "low",
      reasoning: medium
        ? "Referring IB has below-peer KYC pass rate."
        : "Referring IB has historical performance at or above peer median.",
      evidence: { ibKycPassRate: medium ? 0.78 : 0.91, peerMedian: 0.88 },
    },
    {
      key: "aml",
      label: "AML",
      score: overall >= 70 ? 88 : overall >= 40 ? 50 : 10,
      // AML is the heaviest single factor — this is what tips a profile
      // into "high" / "critical" buckets.
      weight: 0.30,
      level: overall >= 70 ? "high" : overall >= 40 ? "medium" : "low",
      reasoning:
        overall >= 70
          ? "Partial name match on AML watchlist. Manual review required."
          : overall >= 40
            ? "Watchlist partial-pattern match — score below auto-fail threshold."
            : "No matches against any AML watchlist.",
      evidence: {
        listsHit: overall >= 70 ? ["UN Sanctions"] : [],
        matchScore: overall >= 70 ? 0.62 : null,
      },
    },
    {
      key: "blacklist",
      label: "Internal Blacklist",
      score: 8,
      weight: 0.15,
      level: "low",
      reasoning: "No match against internal fraud / chargeback / litigation blacklist.",
      evidence: { hits: [] },
    },
  ];
}

/** Look up a profile for a given client id. Returns a synthesized
 *  profile if no override is registered. */
export function lookupRiskProfile(
  clientId: string,
  baseScore: number,
  amlStatus: RiskProfile["amlStatus"] = "pass"
): RiskProfile {
  const factors = makeFactors(baseScore);
  return {
    clientId,
    version: 1,
    overallScore: baseScore,
    riskLevel: bucketLevel(baseScore),
    amlStatus,
    factors,
    calculatedAt: NOW,
    evaluatedBy: "risk-engine@mock",
  };
}
