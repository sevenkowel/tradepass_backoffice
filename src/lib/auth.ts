import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// 延迟到运行时校验，避免 next build 静态分析阶段报错
function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      "FATAL: JWT_SECRET environment variable is not set. " +
      "The application cannot start without a secure JWT secret."
    );
  }
  return secret;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: { userId: string; email: string }): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: "7d" });
}

export function verifyToken(token: string): { userId: string; email: string } {
  return jwt.verify(token, getJwtSecret()) as { userId: string; email: string };
}

export function generateVerificationToken(): string {
  return crypto.randomUUID();
}
