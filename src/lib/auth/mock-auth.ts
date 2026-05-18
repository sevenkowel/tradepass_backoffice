/**
 * Mock 认证服务 — 纯前端模拟
 */

import type { Staff, LoginRequest, LoginResponse, SetPasswordRequest } from "@/types/backoffice/staff";
import { evaluatePasswordStrength, generateTempPassword, generateOtp } from "./password";
import { mockStaff } from "@/lib/backoffice/mock-staff";

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MS = 30 * 60 * 1000; // 30 min
const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 min
const OTP_COOLDOWN_MS = 60 * 1000; // 1 min

// In-memory OTP store (simulated)
const otpStore: Record<string, { code: string; expiresAt: number }> = {};
// In-memory session
let currentToken: string | null = null;

function delay(ms = 500): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export async function login(req: LoginRequest): Promise<LoginResponse> {
  await delay(800);

  const staff = mockStaff.find((s) => s.email === req.email);
  if (!staff) {
    return { success: false, error: "邮箱或密码错误" };
  }

  // Check lock
  if (staff.lockedUntil && new Date(staff.lockedUntil) > new Date()) {
    const remaining = Math.ceil(
      (new Date(staff.lockedUntil).getTime() - Date.now()) / 60000
    );
    return {
      success: false,
      error: `账户已被锁定，请 ${remaining} 分钟后再试`,
      lockedUntil: staff.lockedUntil,
    };
  }

  // Check if first login (has temp password)
  if (staff.tempPassword) {
    if (req.password === staff.tempPassword) {
      return {
        success: true,
        token: "mock-token-first-login",
        staff,
        requiresPasswordChange: true,
      };
    }
    // Temp password wrong
    staff.failedLoginAttempts = (staff.failedLoginAttempts || 0) + 1;
    const remaining = MAX_LOGIN_ATTEMPTS - staff.failedLoginAttempts;
    if (remaining <= 0) {
      staff.lockedUntil = new Date(Date.now() + LOCK_DURATION_MS).toISOString();
      staff.failedLoginAttempts = 0;
      return { success: false, error: "登录失败次数过多，账户已被锁定 30 分钟", lockedUntil: staff.lockedUntil };
    }
    return { success: false, error: `邮箱或密码错误（剩余 ${remaining} 次机会）`, remainingAttempts: remaining };
  }

  // Normal password check (mock: use "Pass1234!" as default normal password)
  if (req.password !== "Pass1234!") {
    staff.failedLoginAttempts = (staff.failedLoginAttempts || 0) + 1;
    const remaining = MAX_LOGIN_ATTEMPTS - staff.failedLoginAttempts;
    if (remaining <= 0) {
      staff.lockedUntil = new Date(Date.now() + LOCK_DURATION_MS).toISOString();
      staff.failedLoginAttempts = 0;
      return { success: false, error: "登录失败次数过多，账户已被锁定 30 分钟", lockedUntil: staff.lockedUntil };
    }
    return { success: false, error: `邮箱或密码错误（剩余 ${remaining} 次机会）`, remainingAttempts: remaining };
  }

  // Success: reset fail count
  staff.failedLoginAttempts = 0;

  return {
    success: true,
    token: "mock-token-" + Date.now(),
    staff,
    requiresOtp: true,
  };
}

export async function setPassword(req: SetPasswordRequest): Promise<LoginResponse> {
  await delay(600);

  const staff = mockStaff.find((s) => s.email === req.email);
  if (!staff) {
    return { success: false, error: "用户不存在" };
  }

  if (staff.tempPassword !== req.tempPassword) {
    return { success: false, error: "临时密码错误" };
  }

  const strength = evaluatePasswordStrength(req.newPassword);
  if (strength.errors.length > 0) {
    return { success: false, error: strength.errors[0] };
  }

  // Clear temp password, update status
  staff.tempPassword = undefined;
  staff.tempPasswordExpiresAt = undefined;
  staff.status = "active";
  staff.passwordChangedAt = new Date().toISOString();
  staff.failedLoginAttempts = 0;

  return {
    success: true,
    token: "mock-token-pwd-set-" + Date.now(),
    staff,
    requiresOtp: true,
  };
}

export async function sendOtp(email: string): Promise<{ success: boolean; error?: string }> {
  await delay(300);

  const staff = mockStaff.find((s) => s.email === email);
  if (!staff) return { success: false, error: "用户不存在" };

  // Rate limit check
  if (staff.lastOtpSentAt) {
    const elapsed = Date.now() - new Date(staff.lastOtpSentAt).getTime();
    if (elapsed < OTP_COOLDOWN_MS) {
      const remaining = Math.ceil((OTP_COOLDOWN_MS - elapsed) / 1000);
      return { success: false, error: `请在 ${remaining} 秒后重新发送验证码` };
    }
  }

  const code = generateOtp();
  otpStore[email] = { code, expiresAt: Date.now() + OTP_EXPIRY_MS };
  staff.lastOtpSentAt = new Date().toISOString();

  // Mock: return OTP code for demo display
  return { success: true, mockOtp: code } as any;
}

export async function verifyOtp(email: string, code: string): Promise<LoginResponse> {
  await delay(400);

  const stored = otpStore[email];
  if (!stored) {
    return { success: false, error: "验证码已过期，请重新发送" };
  }
  if (Date.now() > stored.expiresAt) {
    delete otpStore[email];
    return { success: false, error: "验证码已过期，请重新发送" };
  }
  if (stored.code !== code) {
    return { success: false, error: "验证码错误" };
  }

  delete otpStore[email];

  const staff = mockStaff.find((s) => s.email === email);
  if (!staff) return { success: false, error: "用户不存在" };

  // Check if 2FA is already bound
  if (!staff.twoFactorEnabled) {
    return {
      success: true,
      token: "mock-token-otp-verified-" + Date.now(),
      staff,
      requires2faBinding: true,
    };
  }

  return {
    success: true,
    token: "mock-token-final-" + Date.now(),
    staff,
    requires2faCode: true,
  };
}

export async function bind2fa(email: string, code: string, secret: string): Promise<LoginResponse> {
  await delay(500);

  const staff = mockStaff.find((s) => s.email === email);
  if (!staff) return { success: false, error: "用户不存在" };

  // Mock 2FA validation: code "123456" always works for demo
  if (code !== "123456") {
    return { success: false, error: "验证码错误，请重试" };
  }

  staff.twoFactorSecret = secret;
  staff.twoFactorEnabled = true;

  return {
    success: true,
    token: "mock-token-2fa-bound-" + Date.now(),
    staff,
  };
}

export async function verify2fa(email: string, code: string): Promise<LoginResponse> {
  await delay(400);

  const staff = mockStaff.find((s) => s.email === email);
  if (!staff) return { success: false, error: "用户不存在" };

  if (code !== "123456") {
    return { success: false, error: "验证码错误" };
  }

  staff.lastLoginAt = new Date().toISOString();
  currentToken = "mock-token-" + Date.now();

  return {
    success: true,
    token: currentToken,
    staff,
  };
}

export function getCurrentToken(): string | null {
  return currentToken;
}

export function logout(): void {
  currentToken = null;
}
