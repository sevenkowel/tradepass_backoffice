import { NextRequest, NextResponse } from "next/server";

// ─── Cookie Helpers ───────────────────────────────────────────────────────────

/**
 * 判断当前环境是否应该使用 Secure 标志
 * production 模式且不是本地 localhost 时才启用 Secure
 */
export function shouldSecureCookie(): boolean {
  return process.env.NODE_ENV === "production" && !process.env.DEV_HTTP;
}

export function setSecureCookie(
  res: NextResponse,
  name: string,
  value: string,
  options: {
    httpOnly?: boolean;
    sameSite?: "lax" | "strict" | "none";
    maxAge?: number;
    path?: string;
    domain?: string;
  } = {}
): void {
  res.cookies.set(name, value, {
    httpOnly: options.httpOnly ?? false,
    secure: shouldSecureCookie(),
    sameSite: options.sameSite ?? "lax",
    maxAge: options.maxAge ?? 60 * 60 * 24 * 7,
    path: options.path ?? "/",
    ...(options.domain ? { domain: options.domain } : {}),
  });
}

// ─── CSRF Protection ──────────────────────────────────────────────────────────

const CSRF_COOKIE = "csrf_token";
const CSRF_HEADER = "x-csrf-token";

export function generateCsrfToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function setCsrfCookie(res: NextResponse, token: string): void {
  res.cookies.set(CSRF_COOKIE, token, {
    httpOnly: false,
    secure: shouldSecureCookie(),
    sameSite: "strict",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
}

export function validateCsrf(req: NextRequest): boolean {
  const safe = ["GET", "HEAD", "OPTIONS"];
  if (safe.includes(req.method.toUpperCase())) return true;

  const cookie = req.cookies.get(CSRF_COOKIE)?.value;
  const header = req.headers.get(CSRF_HEADER);
  if (!cookie || !header || cookie.length !== header.length) return false;

  let diff = 0;
  for (let i = 0; i < cookie.length; i++) {
    diff |= cookie.charCodeAt(i) ^ header.charCodeAt(i);
  }
  return diff === 0;
}

export function requireCsrf(req: NextRequest): NextResponse | null {
  if (!validateCsrf(req)) {
    return NextResponse.json(
      { success: false, error: "Invalid or missing CSRF token" },
      { status: 403 }
    );
  }
  return null;
}

// ─── Idempotency Key ──────────────────────────────────────────────────────────

const idempotencyStore = new Map<string, { response: unknown; expiresAt: number }>();
const IDEMP_TTL = 24 * 60 * 60 * 1000;

export function checkIdempotency(req: NextRequest): NextResponse | null {
  const key = req.headers.get("x-idempotency-key");
  if (!key) return null;

  const entry = idempotencyStore.get(key);
  if (entry && entry.expiresAt > Date.now()) {
    return NextResponse.json(entry.response);
  }
  return null;
}

export function storeIdempotency(req: NextRequest, response: unknown): void {
  const key = req.headers.get("x-idempotency-key");
  if (!key) return;
  idempotencyStore.set(key, { response, expiresAt: Date.now() + IDEMP_TTL });
}

export function clearExpiredIdempotency(): void {
  const now = Date.now();
  for (const [key, entry] of idempotencyStore) {
    if (entry.expiresAt < now) idempotencyStore.delete(key);
  }
}

// ─── Token Blacklist (S9: Session Revocation) ─────────────────────────────────

const tokenBlacklist = new Set<string>();

export function revokeToken(token: string): void {
  tokenBlacklist.add(token);
}

export function isTokenRevoked(token: string): boolean {
  return tokenBlacklist.has(token);
}

export function clearRevokedTokens(): void {
  tokenBlacklist.clear();
}
