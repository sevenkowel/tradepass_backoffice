/**
 * 员工账户管理 Store
 */

import { create } from "zustand";
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

// Staff Store State
interface StaffState {
  // Data
  staff: Staff[];
  loginLogs: StaffLoginLog[];
  auditLogs: StaffAuditLog[];
  currentStaff: Staff | null;

  // Loading states
  isLoadingStaff: boolean;
  isLoadingLogs: boolean;
  isLoadingAuditLogs: boolean;
  isSubmitting: boolean;

  // Actions
  fetchStaff: (filter?: StaffFilter) => Promise<void>;
  fetchStaffById: (id: string) => Promise<Staff | null>;
  createStaff: (data: CreateStaffRequest) => Promise<Staff | null>;
  updateStaff: (id: string, data: UpdateStaffRequest) => Promise<Staff | null>;
  deleteStaff: (id: string) => Promise<boolean>;
  resetPassword: (id: string) => Promise<string | null>;
  reset2fa: (id: string) => Promise<boolean>;
  toggleStaffStatus: (id: string) => Promise<boolean>;
  setCurrentStaff: (staff: Staff | null) => void;

  // Login logs
  fetchLoginLogs: (filter?: LoginLogFilter) => Promise<void>;

  // Audit logs
  fetchAuditLogs: (filter?: AuditLogFilter) => Promise<void>;
}

export const useStaffStore = create<StaffState>((set, get) => ({
  // Initial state
  staff: [],
  loginLogs: [],
  auditLogs: [],
  currentStaff: null,
  isLoadingStaff: false,
  isLoadingLogs: false,
  isLoadingAuditLogs: false,
  isSubmitting: false,

  // Fetch staff list
  fetchStaff: async (filter) => {
    set({ isLoadingStaff: true });
    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      let filteredStaff = [...mockStaff];

      if (filter) {
        if (filter.keyword) {
          const keyword = filter.keyword.toLowerCase();
          filteredStaff = filteredStaff.filter(
            (s) =>
              s.fullName.toLowerCase().includes(keyword) ||
              s.email.toLowerCase().includes(keyword)
          );
        }

        if (filter.status && filter.status !== "all") {
          filteredStaff = filteredStaff.filter((s) => s.status === filter.status);
        }

        if (filter.roleId) {
          filteredStaff = filteredStaff.filter((s) => s.roleId === filter.roleId);
        }

        if (filter.department) {
          filteredStaff = filteredStaff.filter((s) => s.departmentIds?.includes(filter.department as string));
        }
      }

      set({ staff: filteredStaff });
    } finally {
      set({ isLoadingStaff: false });
    }
  },

  // Fetch single staff
  fetchStaffById: async (id) => {
    const staff = mockStaff.find((s) => s.id === id);
    if (staff) {
      set({ currentStaff: staff });
      return staff;
    }
    return null;
  },

  // Create staff
  createStaff: async (data) => {
    set({ isSubmitting: true });
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));

      const newStaff: Staff = {
        id: `staff-${Date.now()}`,
        ...data,
        status: "active",
        loginFailCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: "current-user",
        twoFactorEnabled: false,
        roleName: "待分配", // Should be fetched from role store
      };

      mockStaff.push(newStaff);
      set((state) => ({ staff: [...state.staff, newStaff] }));
      return newStaff;
    } finally {
      set({ isSubmitting: false });
    }
  },

  // Update staff
  updateStaff: async (id, data) => {
    set({ isSubmitting: true });
    try {
      await new Promise((resolve) => setTimeout(resolve, 600));

      const index = mockStaff.findIndex((s) => s.id === id);
      if (index === -1) return null;

      const updatedStaff = {
        ...mockStaff[index],
        ...data,
        updatedAt: new Date().toISOString(),
      };

      mockStaff[index] = updatedStaff;
      set((state) => ({
        staff: state.staff.map((s) => (s.id === id ? updatedStaff : s)),
        currentStaff: state.currentStaff?.id === id ? updatedStaff : state.currentStaff,
      }));

      return updatedStaff;
    } finally {
      set({ isSubmitting: false });
    }
  },

  // Delete staff (soft delete)
  deleteStaff: async (id) => {
    set({ isSubmitting: true });
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      const index = mockStaff.findIndex((s) => s.id === id);
      if (index === -1) return false;

      // Remove from mock data
      mockStaff.splice(index, 1);
      set((state) => ({
        staff: state.staff.filter((s) => s.id !== id),
        currentStaff: state.currentStaff?.id === id ? null : state.currentStaff,
      }));

      return true;
    } finally {
      set({ isSubmitting: false });
    }
  },

  // Reset password
  resetPassword: async (id) => {
    set({ isSubmitting: true });
    try {
      await new Promise((resolve) => setTimeout(resolve, 700));

      const staff = mockStaff.find((s) => s.id === id);
      if (!staff) return null;

      // Generate temporary password
      const tempPassword = Math.random().toString(36).slice(-8);

      return tempPassword;
    } finally {
      set({ isSubmitting: false });
    }
  },

  // Reset 2FA
  reset2fa: async (id) => {
    set({ isSubmitting: true });
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      const staff = mockStaff.find((s) => s.id === id);
      if (!staff) return false;

      staff.twoFactorEnabled = false;
      staff.twoFactorSecret = undefined;

      // Update currentStaff if viewing the same user
      const state = get();
      if (state.currentStaff?.id === id) {
        state.currentStaff.twoFactorEnabled = false;
        state.currentStaff.twoFactorSecret = undefined;
        set({ currentStaff: { ...state.currentStaff } });
      }

      return true;
    } finally {
      set({ isSubmitting: false });
    }
  },

  // Toggle staff status
  toggleStaffStatus: async (id) => {
    const staff = mockStaff.find((s) => s.id === id);
    if (!staff) return false;

    const newStatus = staff.status === "active" ? "inactive" : "active";
    const result = await get().updateStaff(id, { status: newStatus });
    return !!result;
  },

  // Set current staff
  setCurrentStaff: (staff) => {
    set({ currentStaff: staff });
  },

  // Fetch login logs
  fetchLoginLogs: async (filter) => {
    set({ isLoadingLogs: true });
    try {
      await new Promise((resolve) => setTimeout(resolve, 400));

      let filteredLogs = [...mockLoginLogs];

      if (filter) {
        if (filter.staffId) {
          filteredLogs = filteredLogs.filter((l) => l.staffId === filter.staffId);
        }

        if (filter.status && filter.status !== "all") {
          filteredLogs = filteredLogs.filter((l) => l.status === filter.status);
        }

        if (filter.startDate) {
          filteredLogs = filteredLogs.filter((l) => l.createdAt >= filter.startDate!);
        }

        if (filter.endDate) {
          filteredLogs = filteredLogs.filter((l) => l.createdAt <= filter.endDate!);
        }
      }

      // Sort by createdAt desc
      filteredLogs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      set({ loginLogs: filteredLogs });
    } finally {
      set({ isLoadingLogs: false });
    }
  },

  // Fetch audit logs
  fetchAuditLogs: async (filter) => {
    set({ isLoadingAuditLogs: true });
    try {
      await new Promise((resolve) => setTimeout(resolve, 400));

      let filteredLogs = [...mockAuditLogs];

      if (filter) {
        if (filter.staffId) {
          filteredLogs = filteredLogs.filter((l) => l.staffId === filter.staffId);
        }

        if (filter.module) {
          filteredLogs = filteredLogs.filter((l) => l.module === filter.module);
        }

        if (filter.action) {
          filteredLogs = filteredLogs.filter((l) => l.action === filter.action);
        }

        if (filter.startDate) {
          filteredLogs = filteredLogs.filter((l) => l.createdAt >= filter.startDate!);
        }

        if (filter.endDate) {
          filteredLogs = filteredLogs.filter((l) => l.createdAt <= filter.endDate!);
        }
      }

      // Sort by createdAt desc
      filteredLogs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      set({ auditLogs: filteredLogs });
    } finally {
      set({ isLoadingAuditLogs: false });
    }
  },
}));
