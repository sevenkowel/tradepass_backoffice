/**
 * Staff Mock Service
 * 封装所有员工数据的 CRUD 操作，保证数据不可变性
 */

import type {
  Staff,
  StaffLoginLog,
  StaffAuditLog,
  StaffFilter,
  LoginLogFilter,
  AuditLogFilter,
  CreateStaffRequest,
  UpdateStaffRequest,
} from "@/types/backoffice/staff";
import { mockStaff, mockLoginLogs, mockAuditLogs } from "@/lib/backoffice/mock-staff";
import { delay } from "@/lib/utils";

class StaffService {
  private staff = [...mockStaff];
  private loginLogs = [...mockLoginLogs];
  private auditLogs = [...mockAuditLogs];

  async getAll(filter?: StaffFilter): Promise<Staff[]> {
    await delay(500);
    let result = [...this.staff];

    if (filter) {
      if (filter.keyword) {
        const keyword = filter.keyword.toLowerCase();
        result = result.filter(
          (s) =>
            s.fullName.toLowerCase().includes(keyword) ||
            s.email.toLowerCase().includes(keyword)
        );
      }
      if (filter.status && filter.status !== "all") {
        result = result.filter((s) => s.status === filter.status);
      }
      if (filter.roleId) {
        result = result.filter((s) => s.roleId === filter.roleId);
      }
      if (filter.department) {
        result = result.filter((s) =>
          s.departmentIds?.includes(filter.department as string)
        );
      }
    }

    return result;
  }

  async getById(id: string): Promise<Staff | null> {
    await delay(200);
    const member = this.staff.find((s) => s.id === id);
    return member ? { ...member } : null;
  }

  async create(data: CreateStaffRequest): Promise<Staff> {
    await delay(800);
    const newStaff: Staff = {
      id: `staff-${Date.now()}`,
      ...data,
      status: "active",
      loginFailCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: "current-user",
      twoFactorEnabled: false,
      roleName: "待分配",
    };
    this.staff = [...this.staff, newStaff];
    return { ...newStaff };
  }

  async update(id: string, data: UpdateStaffRequest): Promise<Staff | null> {
    await delay(600);
    const index = this.staff.findIndex((s) => s.id === id);
    if (index === -1) return null;

    const updated: Staff = {
      ...this.staff[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    this.staff = this.staff.map((s, i) => (i === index ? updated : s));
    return { ...updated };
  }

  async delete(id: string): Promise<boolean> {
    await delay(500);
    const index = this.staff.findIndex((s) => s.id === id);
    if (index === -1) return false;
    this.staff = this.staff.filter((s) => s.id !== id);
    return true;
  }

  async resetPassword(id: string): Promise<string | null> {
    await delay(700);
    const member = this.staff.find((s) => s.id === id);
    if (!member) return null;
    return Math.random().toString(36).slice(-8);
  }

  async reset2fa(id: string): Promise<boolean> {
    await delay(500);
    const index = this.staff.findIndex((s) => s.id === id);
    if (index === -1) return false;
    this.staff = this.staff.map((s, i) =>
      i === index ? { ...s, twoFactorEnabled: false, twoFactorSecret: undefined } : s
    );
    return true;
  }

  async toggleStatus(id: string): Promise<boolean> {
    const member = this.staff.find((s) => s.id === id);
    if (!member) return false;
    const newStatus = member.status === "active" ? "inactive" : "active";
    const updated = await this.update(id, { status: newStatus });
    return !!updated;
  }

  async getLoginLogs(filter?: LoginLogFilter): Promise<StaffLoginLog[]> {
    await delay(400);
    let result = [...this.loginLogs];

    if (filter) {
      if (filter.staffId) {
        result = result.filter((l) => l.staffId === filter.staffId);
      }
      if (filter.status && filter.status !== "all") {
        result = result.filter((l) => l.status === filter.status);
      }
      if (filter.startDate) {
        result = result.filter((l) => l.createdAt >= filter.startDate!);
      }
      if (filter.endDate) {
        result = result.filter((l) => l.createdAt <= filter.endDate!);
      }
    }

    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return result;
  }

  async getAuditLogs(filter?: AuditLogFilter): Promise<StaffAuditLog[]> {
    await delay(400);
    let result = [...this.auditLogs];

    if (filter) {
      if (filter.staffId) {
        result = result.filter((l) => l.staffId === filter.staffId);
      }
      if (filter.module) {
        result = result.filter((l) => l.module === filter.module);
      }
      if (filter.action) {
        result = result.filter((l) => l.action === filter.action);
      }
      if (filter.startDate) {
        result = result.filter((l) => l.createdAt >= filter.startDate!);
      }
      if (filter.endDate) {
        result = result.filter((l) => l.createdAt <= filter.endDate!);
      }
    }

    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return result;
  }
}

export const staffService = new StaffService();
