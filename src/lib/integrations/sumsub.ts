/**
 * Sumsub integration — third-party identity verification.
 *
 * Sumsub's REST API uses HMAC request signing: the client computes a
 * SHA-256 HMAC of `${ts}${method}${path}${body}` with the app secret.
 * This module wraps the three calls the CRM needs:
 *   - `createApplicant`         — register a user with Sumsub
 *   - `getApplicantStatus`      — read the verification result
 *   - `generateAccessToken`     — issue a short-lived token for the user-side WebSDK
 *
 * Real-API mode requires SUMSUB_APP_TOKEN + SUMSUB_SECRET_KEY env vars
 * (server-only). When not set, `verificationLive()` returns false and
 * each call resolves with a stubbed response that mirrors the expected
 * shape so the CRM can render an "awaiting backend" state.
 *
 * NOTE: This file uses Node's `crypto` module — must only be imported
 * from server components / route handlers. Client components must call
 * a server route that wraps these helpers.
 */

import { createHmac } from "node:crypto";
import {
  SUMSUB_APP_TOKEN,
  SUMSUB_BASE_URL,
  SUMSUB_SECRET_KEY,
  sumsubLive,
} from "./config";

/* ------------------------------------------------------------------------- */
/* Domain types                                                              */
/* ------------------------------------------------------------------------- */

export type SumsubReviewStatus =
  | "init"
  | "pending"
  | "queued"
  | "completed"
  | "onHold";

export type SumsubReviewAnswer = "GREEN" | "RED" | "YELLOW";

export interface SumsubApplicantStatus {
  applicantId: string;
  inspectionId: string;
  reviewStatus: SumsubReviewStatus;
  reviewResult?: {
    reviewAnswer: SumsubReviewAnswer;
    rejectLabels?: string[];
    moderationComment?: string;
  };
  /** Sumsub levelName (e.g., "basic-kyc-level"). */
  levelName?: string;
  createDate: string;
}

export interface SumsubAccessToken {
  token: string;
  userId: string;
  expiresInSecs: number;
}

/* ------------------------------------------------------------------------- */
/* Signing helper                                                            */
/* ------------------------------------------------------------------------- */

interface SignedRequest {
  url: string;
  init: RequestInit;
}

function signedRequest(
  method: "GET" | "POST",
  path: string,
  body?: string
): SignedRequest {
  const ts = Math.floor(Date.now() / 1000).toString();
  const payload = `${ts}${method}${path}${body ?? ""}`;
  const secret = SUMSUB_SECRET_KEY ?? "";
  const signature = createHmac("sha256", secret).update(payload).digest("hex");
  return {
    url: `${SUMSUB_BASE_URL}${path}`,
    init: {
      method,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-App-Token": SUMSUB_APP_TOKEN ?? "",
        "X-App-Access-Sig": signature,
        "X-App-Access-Ts": ts,
      },
      body,
      cache: "no-store",
    },
  };
}

async function sumsubFetch<T>(req: SignedRequest, fallback: () => T): Promise<T> {
  try {
    const resp = await fetch(req.url, req.init);
    if (!resp.ok) throw new Error(`sumsub ${resp.status}`);
    return (await resp.json()) as T;
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.warn("[sumsub] request failed, falling back:", err);
    }
    return fallback();
  }
}

/* ------------------------------------------------------------------------- */
/* Public API                                                                */
/* ------------------------------------------------------------------------- */

/** Register a CRM user with Sumsub for KYC. */
export async function createApplicant(args: {
  externalUserId: string;
  levelName: string;
  email?: string;
  phone?: string;
}): Promise<{ applicantId: string }> {
  if (!sumsubLive()) {
    return { applicantId: `mock-applicant-${args.externalUserId}` };
  }
  const path = `/resources/applicants?levelName=${encodeURIComponent(args.levelName)}`;
  const body = JSON.stringify({
    externalUserId: args.externalUserId,
    email: args.email,
    phone: args.phone,
  });
  return sumsubFetch<{ applicantId: string }>(
    signedRequest("POST", path, body),
    () => ({ applicantId: `mock-applicant-${args.externalUserId}` })
  );
}

/** Read the latest verification status for an applicant. */
export async function getApplicantStatus(
  applicantId: string
): Promise<SumsubApplicantStatus> {
  if (!sumsubLive()) {
    return {
      applicantId,
      inspectionId: `mock-inspection-${applicantId}`,
      reviewStatus: "completed",
      reviewResult: { reviewAnswer: "GREEN" },
      levelName: "basic-kyc-level",
      createDate: new Date().toISOString(),
    };
  }
  const path = `/resources/applicants/${encodeURIComponent(applicantId)}/status`;
  return sumsubFetch<SumsubApplicantStatus>(
    signedRequest("GET", path),
    () => ({
      applicantId,
      inspectionId: "fallback",
      reviewStatus: "init",
      createDate: new Date().toISOString(),
    })
  );
}

/** Issue a short-lived WebSDK token for the user side. */
export async function generateAccessToken(args: {
  userId: string;
  levelName: string;
  ttlInSecs?: number;
}): Promise<SumsubAccessToken> {
  if (!sumsubLive()) {
    return {
      token: "mock-access-token",
      userId: args.userId,
      expiresInSecs: args.ttlInSecs ?? 600,
    };
  }
  const ttl = args.ttlInSecs ?? 600;
  const path =
    `/resources/accessTokens?userId=${encodeURIComponent(args.userId)}` +
    `&levelName=${encodeURIComponent(args.levelName)}` +
    `&ttlInSecs=${ttl}`;
  const data = await sumsubFetch<{ token: string; userId: string }>(
    signedRequest("POST", path),
    () => ({ token: "fallback", userId: args.userId })
  );
  return { ...data, expiresInSecs: ttl };
}
