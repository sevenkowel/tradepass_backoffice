/**
 * 密码强度验证工具
 */

export interface PasswordStrength {
  score: number; // 0-100
  level: "weak" | "medium" | "strong" | "very_strong";
  label: string;
  color: string;
  errors: string[];
}

const MIN_LENGTH = 8;
const MAX_LENGTH = 128;

export function evaluatePasswordStrength(password: string): PasswordStrength {
  const errors: string[] = [];

  if (password.length < MIN_LENGTH) {
    errors.push(`密码长度至少 ${MIN_LENGTH} 位`);
  }
  if (password.length > MAX_LENGTH) {
    errors.push(`密码长度不能超过 ${MAX_LENGTH} 位`);
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("需包含至少一个大写字母");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("需包含至少一个小写字母");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("需包含至少一个数字");
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push("需包含至少一个特殊字符");
  }

  // Calculate score
  let score = 0;
  score += Math.min(password.length * 4, 40); // Length: up to 40 pts
  if (/[A-Z]/.test(password)) score += 10;
  if (/[a-z]/.test(password)) score += 10;
  if (/[0-9]/.test(password)) score += 15;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 15;
  if (password.length >= 12) score += 10;
  // Mix
  const types = [/[A-Z]/, /[a-z]/, /[0-9]/, /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/]
    .filter(r => r.test(password)).length;
  if (types >= 3) score += 10;

  score = Math.min(score, 100);

  let level: PasswordStrength["level"];
  let label: string;
  let color: string;

  if (score < 30) {
    level = "weak";
    label = "弱";
    color = "text-red-500";
  } else if (score < 60) {
    level = "medium";
    label = "中等";
    color = "text-amber-500";
  } else if (score < 80) {
    level = "strong";
    label = "强";
    color = "text-blue-500";
  } else {
    level = "very_strong";
    label = "非常强";
    color = "text-emerald-500";
  }

  return { score, level, label, color, errors };
}

export function isPasswordValid(password: string): boolean {
  return evaluatePasswordStrength(password).errors.length === 0;
}

export function generateTempPassword(): string {
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const digits = "0123456789";
  const special = "!@#$%&";
  const all = upper + lower + digits;

  let pw = "";
  pw += upper[Math.floor(Math.random() * upper.length)];
  pw += lower[Math.floor(Math.random() * lower.length)];
  pw += digits[Math.floor(Math.random() * digits.length)];
  pw += special[Math.floor(Math.random() * special.length)];

  for (let i = 0; i < 8; i++) {
    pw += all[Math.floor(Math.random() * all.length)];
  }

  return pw.split("").sort(() => Math.random() - 0.5).join("");
}

export function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}
