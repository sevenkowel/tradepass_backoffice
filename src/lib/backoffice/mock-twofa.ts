/**
 * 2FA Mock API
 * 模拟后端 2FA 相关接口
 */

import { mockStaff } from "./mock-staff";
import {
  TwoFactorStatus,
  Enable2FAInitResponse,
  Enable2FAVerifyResponse,
  ViewBackupCodesResponse,
  RegenerateBackupCodesResponse,
  TwoFactorError,
} from "@/types/backoffice/twofa";
import {
  generateSecret,
  generateQRCode,
  generateBackupCodes,
  verifyToken,
  normalizeBackupCode,
} from "./twofa-utils";

// 模拟存储（实际应在数据库中）
interface Stored2FAConfig {
  enabled: boolean;
  secret?: string;
  backupCodeHashes: string[];
  usedBackupCodes: string[];
  createdAt?: string;
  lastUsedAt?: string;
}

// 内存存储
const twoFAStore = new Map<string, Stored2FAConfig>();

// 登录失败计数（防暴力破解）
const loginAttempts = new Map<string, { count: number; lockedUntil?: number }>();

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 30 * 60 * 1000; // 30 分钟

/**
 * 获取当前用户（模拟）
 */
function getCurrentUser() {
  return mockStaff[0]; // 默认返回 admin
}

/**
 * 验证密码（模拟）
 */
function verifyPassword(password: string): boolean {
  // 模拟验证，实际应使用 bcrypt.compare
  return password === "password" || password.length >= 6;
}

/**
 * 获取 2FA 状态
 */
export async function getTwoFactorStatus(): Promise<TwoFactorStatus> {
  const user = getCurrentUser();
  const config = twoFAStore.get(user.id);

  if (!config || !config.enabled) {
    return { enabled: false };
  }

  return {
    enabled: true,
    createdAt: config.createdAt,
    backupCodesRemaining: config.backupCodeHashes.length,
  };
}

/**
 * 初始化启用 2FA
 */
export async function initEnableTwoFactor(
  password: string
): Promise<{ success: boolean; data?: Enable2FAInitResponse; error?: TwoFactorError }> {
  const user = getCurrentUser();

  // 验证密码
  if (!verifyPassword(password)) {
    return {
      success: false,
      error: {
        type: "INVALID_PASSWORD",
        message: "密码错误",
      },
    };
  }

  // 生成 Secret 和二维码
  const secret = generateSecret();
  const qrCodeUrl = await generateQRCode(secret, user.email);
  // 临时存储（等待验证）
  const tempKey = `temp_${user.id}`;
  twoFAStore.set(tempKey, {
    enabled: false,
    secret,
    backupCodeHashes: [],
    usedBackupCodes: [],
  });

  return {
    success: true,
    data: {
      secret,
      qrCodeUrl,
    },
  };
}

/**
 * 完成启用 2FA（验证 TOTP）
 */
export async function verifyAndEnableTwoFactor(
  code: string
): Promise<{ success: boolean; data?: Enable2FAVerifyResponse; error?: TwoFactorError }> {
  const user = getCurrentUser();
  const tempKey = `temp_${user.id}`;
  const tempConfig = twoFAStore.get(tempKey);

  if (!tempConfig?.secret) {
    return {
      success: false,
      error: {
        type: "NOT_ENABLED",
        message: "请先开始 2FA 配置流程",
      },
    };
  }

  // 验证 TOTP
  if (!verifyToken(code, tempConfig.secret)) {
    return {
      success: false,
      error: {
        type: "INVALID_CODE",
        message: "验证码错误，请重试",
      },
    };
  }

  // 生成备份码
  const backupCodes = generateBackupCodes();
  const backupCodeHashes = backupCodes.map((code) =>
    Buffer.from(normalizeBackupCode(code)).toString("base64")
  );

  // 保存配置
  twoFAStore.set(user.id, {
    enabled: true,
    secret: tempConfig.secret,
    backupCodeHashes,
    usedBackupCodes: [],
    createdAt: new Date().toISOString(),
  });

  // 清理临时数据
  twoFAStore.delete(tempKey);

  return {
    success: true,
    data: { backupCodes },
  };
}

/**
 * 禁用 2FA
 */
export async function disableTwoFactor(
  password: string,
  code: string
): Promise<{ success: boolean; error?: TwoFactorError }> {
  const user = getCurrentUser();
  const config = twoFAStore.get(user.id);

  if (!config?.enabled || !config.secret) {
    return {
      success: false,
      error: {
        type: "NOT_ENABLED",
        message: "2FA 未启用",
      },
    };
  }

  // 验证密码
  if (!verifyPassword(password)) {
    return {
      success: false,
      error: {
        type: "INVALID_PASSWORD",
        message: "密码错误",
      },
    };
  }

  // 验证 TOTP
  if (!verifyToken(code, config.secret)) {
    return {
      success: false,
      error: {
        type: "INVALID_CODE",
        message: "验证码错误",
      },
    };
  }

  // 禁用 2FA
  twoFAStore.delete(user.id);

  return { success: true };
}

/**
 * 查看备份码
 */
export async function viewBackupCodes(
  password: string
): Promise<{ success: boolean; data?: ViewBackupCodesResponse; error?: TwoFactorError }> {
  const user = getCurrentUser();
  const config = twoFAStore.get(user.id);

  if (!config?.enabled) {
    return {
      success: false,
      error: {
        type: "NOT_ENABLED",
        message: "2FA 未启用",
      },
    };
  }

  // 验证密码
  if (!verifyPassword(password)) {
    return {
      success: false,
      error: {
        type: "INVALID_PASSWORD",
        message: "密码错误",
      },
    };
  }

  // 解密备份码（模拟）
  const backupCodes = config.backupCodeHashes.map((hash) => {
    const clean = Buffer.from(hash, "base64").toString();
    return clean.match(/.{1,4}/g)?.join("-") || clean;
  });

  return {
    success: true,
    data: { backupCodes },
  };
}

/**
 * 重新生成备份码
 */
export async function regenerateBackupCodes(
  password: string,
  code: string
): Promise<{ success: boolean; data?: RegenerateBackupCodesResponse; error?: TwoFactorError }> {
  const user = getCurrentUser();
  const config = twoFAStore.get(user.id);

  if (!config?.enabled || !config.secret) {
    return {
      success: false,
      error: {
        type: "NOT_ENABLED",
        message: "2FA 未启用",
      },
    };
  }

  // 验证密码
  if (!verifyPassword(password)) {
    return {
      success: false,
      error: {
        type: "INVALID_PASSWORD",
        message: "密码错误",
      },
    };
  }

  // 验证 TOTP
  if (!verifyToken(code, config.secret)) {
    return {
      success: false,
      error: {
        type: "INVALID_CODE",
        message: "验证码错误",
      },
    };
  }

  // 生成新备份码
  const backupCodes = generateBackupCodes();
  const backupCodeHashes = backupCodes.map((code) =>
    Buffer.from(normalizeBackupCode(code)).toString("base64")
  );

  // 更新配置（旧备份码全部失效）
  config.backupCodeHashes = backupCodeHashes;
  config.usedBackupCodes = [];
  twoFAStore.set(user.id, config);

  return {
    success: true,
    data: { backupCodes },
  };
}

/**
 * 验证 2FA 登录
 */
export async function verifyTwoFactorLogin(
  code: string,
  useBackupCode: boolean = false
): Promise<{ success: boolean; error?: TwoFactorError }> {
  const user = getCurrentUser();
  const config = twoFAStore.get(user.id);

  if (!config?.enabled) {
    return {
      success: false,
      error: {
        type: "NOT_ENABLED",
        message: "2FA 未启用",
      },
    };
  }

  // 检查是否被锁定
  const attemptKey = `2fa_${user.id}`;
  const attempts = loginAttempts.get(attemptKey);
  if (attempts?.lockedUntil && Date.now() < attempts.lockedUntil) {
    const remainingSeconds = Math.ceil((attempts.lockedUntil - Date.now()) / 1000);
    return {
      success: false,
      error: {
        type: "TOO_MANY_ATTEMPTS",
        message: `尝试次数过多，请 ${Math.ceil(remainingSeconds / 60)} 分钟后重试`,
        lockoutSeconds: remainingSeconds,
      },
    };
  }

  let valid = false;

  if (useBackupCode) {
    // 验证备份码
    const cleanCode = normalizeBackupCode(code);
    const codeHash = Buffer.from(cleanCode).toString("base64");
    const index = config.backupCodeHashes.indexOf(codeHash);

    if (index !== -1 && !config.usedBackupCodes.includes(codeHash)) {
      valid = true;
      // 标记备份码为已使用
      config.usedBackupCodes.push(codeHash);
      twoFAStore.set(user.id, config);
    }
  } else {
    // 验证 TOTP
    if (config.secret) {
      valid = verifyToken(code, config.secret);
    }
  }

  if (!valid) {
    // 增加失败计数
    const current = loginAttempts.get(attemptKey) || { count: 0 };
    current.count += 1;

    if (current.count >= MAX_ATTEMPTS) {
      current.lockedUntil = Date.now() + LOCKOUT_DURATION;
      loginAttempts.set(attemptKey, current);
      return {
        success: false,
        error: {
          type: "TOO_MANY_ATTEMPTS",
          message: "尝试次数过多，账户已锁定 30 分钟",
          lockoutSeconds: LOCKOUT_DURATION / 1000,
        },
      };
    }

    loginAttempts.set(attemptKey, current);

    return {
      success: false,
      error: {
        type: useBackupCode ? "BACKUP_CODE_USED" : "INVALID_CODE",
        message: useBackupCode ? "备份码无效或已使用" : "验证码错误",
        remainingAttempts: MAX_ATTEMPTS - current.count,
      },
    };
  }

  // 验证成功，重置计数
  loginAttempts.delete(attemptKey);
  config.lastUsedAt = new Date().toISOString();
  twoFAStore.set(user.id, config);

  return { success: true };
}

/**
 * 重新配置 2FA（生成新的 Secret）
 */
export async function reconfigureTwoFactor(
  password: string,
  code: string
): Promise<{ success: boolean; data?: Enable2FAInitResponse; error?: TwoFactorError }> {
  const user = getCurrentUser();
  const config = twoFAStore.get(user.id);

  if (!config?.enabled || !config.secret) {
    return {
      success: false,
      error: {
        type: "NOT_ENABLED",
        message: "2FA 未启用",
      },
    };
  }

  // 验证密码
  if (!verifyPassword(password)) {
    return {
      success: false,
      error: {
        type: "INVALID_PASSWORD",
        message: "密码错误",
      },
    };
  }

  // 验证当前 TOTP
  if (!verifyToken(code, config.secret)) {
    return {
      success: false,
      error: {
        type: "INVALID_CODE",
        message: "验证码错误",
      },
    };
  }

  // 生成新的 Secret 和二维码
  const secret = generateSecret();
  const qrCodeUrl = await generateQRCode(secret, user.email);

  // 临时存储新配置
  const tempKey = `temp_${user.id}`;
  twoFAStore.set(tempKey, {
    enabled: false,
    secret,
    backupCodeHashes: [],
    usedBackupCodes: [],
  });

  return {
    success: true,
    data: {
      secret,
      qrCodeUrl,
    },
  };
}
