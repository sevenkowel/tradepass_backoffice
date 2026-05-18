/**
 * OTP 验证码服务 —— MVP Demo 专用
 *
 * 规则：
 * - 邮箱/手机 OTP（4位）：MMDD，如 4月28日 → "0428"
 * - 2FA / 敏感操作（6位）：YYMMDD，如 2026年4月28日 → "260428"
 *
 * 生产环境替换：将 generateTodayCode 和 verifyCode 替换为真实 SMS/邮件网关调用
 */

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/**
 * 生成今天的 OTP 验证码（4位 MMDD）
 */
export function generateOTPCode(date = new Date()): string {
  const month = pad2(date.getMonth() + 1);
  const day = pad2(date.getDate());
  return `${month}${day}`;
}

/**
 * 生成今天的 2FA 验证码（6位 YYMMDD）
 */
export function generate2FACode(date = new Date()): string {
  const year = String(date.getFullYear()).slice(-2);
  const month = pad2(date.getMonth() + 1);
  const day = pad2(date.getDate());
  return `${year}${month}${day}`;
}

/**
 * 验证 OTP 码（4位 MMDD）
 */
export function verifyOTPCode(input: string, date = new Date()): boolean {
  return input === generateOTPCode(date);
}

/**
 * 验证 2FA 码（6位 YYMMDD）
 */
export function verify2FACode(input: string, date = new Date()): boolean {
  return input === generate2FACode(date);
}

/**
 * 获取今天的验证码提示文本（用于前端 placeholder）
 */
export function getOTPHint(date = new Date()): string {
  return `Demo 验证码：${generateOTPCode(date)}`;
}

export function get2FAHint(date = new Date()): string {
  return `Demo 验证码：${generate2FACode(date)}`;
}
