/**
 * 员工账户管理类型定义
 */

// 员工状态
export type StaffStatus = "active" | "inactive" | "suspended";

// 性别
export type Gender = "male" | "female" | "secret";

// 性别显示映射
export const genderLabels: Record<Gender, string> = {
  male: "男",
  female: "女",
  secret: "保密",
};

// 员工账户
export interface Staff {
  id: string;
  email: string;
  phone?: string;
  fullName: string;
  nickname?: string;
  gender: Gender;
  avatar?: string;
  roleId: string;
  roleName: string;
  departmentIds: string[];
  primaryDepartment?: string;
  status: StaffStatus;
  lastLoginAt?: string;
  lastLoginIp?: string;
  loginFailCount: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;

  // 认证相关
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  tempPassword?: string;
  tempPasswordExpiresAt?: string;
  passwordChangedAt?: string;
  failedLoginAttempts?: number;
  lockedUntil?: string;
  lastOtpSentAt?: string;
}

// 登录请求 / 响应
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  token?: string;
  staff?: Staff;
  requiresOtp?: boolean;
  requiresPasswordChange?: boolean;
  requires2faBinding?: boolean;
  requires2faCode?: boolean;
  error?: string;
  lockedUntil?: string;
  remainingAttempts?: number;
}

export interface SetPasswordRequest {
  email: string;
  tempPassword: string;
  newPassword: string;
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
}

export interface Bind2faRequest {
  email: string;
  code: string;
  secret: string;
}

// 创建员工请求
export interface CreateStaffRequest {
  email: string;
  phone?: string;
  fullName: string;
  nickname?: string;
  gender: Gender;
  roleId: string;
  departmentIds: string[];
  primaryDepartment?: string;
  sendWelcomeEmail: boolean;
}

// 更新员工请求
export interface UpdateStaffRequest {
  fullName?: string;
  nickname?: string;
  gender?: Gender;
  phone?: string;
  roleId?: string;
  departmentIds?: string[];
  primaryDepartment?: string;
  status?: StaffStatus;
}

// 登录历史
export interface StaffLoginLog {
  id: string;
  staffId: string;
  staffName: string;
  ip: string;
  userAgent: string;
  browser?: string;
  os?: string;
  location?: string;
  status: "success" | "failed" | "blocked";
  failReason?: string;
  createdAt: string;
}

// 操作审计日志
export interface StaffAuditLog {
  id: string;
  staffId: string;
  staffName: string;
  action: string;
  module: string;
  description: string;
  details: Record<string, unknown>;
  ip: string;
  createdAt: string;
}

// 员工筛选条件
export interface StaffFilter {
  keyword?: string;
  status?: StaffStatus | "all";
  roleId?: string;
  department?: string;
}

// 登录日志筛选
export interface LoginLogFilter {
  staffId?: string;
  status?: "success" | "failed" | "blocked" | "all";
  startDate?: string;
  endDate?: string;
}

// 审计日志筛选
export interface AuditLogFilter {
  staffId?: string;
  module?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
}
