/**
 * ThirdPartyVerification — generic envelope for KYC verification results
 * coming back from external providers (Sumsub, Onfido, Jumio, internal).
 *
 * Attached to a `SubmittedMaterial` (CLM) or a `KYCDocument` (Clients).
 * UI renders a chip + popover; reviewers can drill into the reasons array
 * to understand why a document passed / failed / went to manual review.
 */

export type VerificationProvider =
  | "sumsub"
  | "onfido"
  | "jumio"
  | "internal";

export type VerificationStatus = "pass" | "review" | "fail";

export interface ThirdPartyVerification {
  provider: VerificationProvider;
  /** 0–100 confidence score reported by the provider. */
  score: number;
  status: VerificationStatus;
  /**
   * Human-readable reasons. For `pass` these are typically empty or
   * informational; for `review`/`fail` they list the checks that
   * triggered the outcome.
   */
  reasons: string[];
  /**
   * Provider-specific raw response, for the deepest-dive review.
   * UI shows this collapsed by default.
   */
  rawJson?: Record<string, unknown>;
  /** ISO timestamp the result was returned. */
  verifiedAt: string;
  /** Provider's reference id for audit. */
  externalId?: string;
}
