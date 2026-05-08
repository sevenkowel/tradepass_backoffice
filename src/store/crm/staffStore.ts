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
import { staffService } from "@/lib/crm/services/staff.service";

interface StaffState {
  staff: Staff[];
  loginLogs: StaffLoginLog[];
  auditLogs: StaffAuditLog[];
  currentStaff: Staff | null;

  isLoadingStaff: boolean;
  isLoadingLogs: boolean;
  isLoadingAuditLogs: boolean;
  isSubmitting: boolean;

  fetchStaff: (filter?: StaffFilter) => Promise<void>;
  fetchStaffById: (id: string) => Promise<Staff | null>;
  createStaff: (data: CreateStaffRequest) => Promise<Staff | null>;
  updateStaff: (id: string, data: UpdateStaffRequest) => Promise<Staff | null>;
  deleteStaff: (id: string) => Promise<boolean>;
  resetPassword: (id: string) => Promise<string | null>;
  reset2fa: (id: string) => Promise<boolean>;
  toggleStaffStatus: (id: string) => Promise<boolean>;
  setCurrentStaff: (staff: Staff | null) => void;

  fetchLoginLogs: (filter?: LoginLogFilter) => Promise<void>;
  fetchAuditLogs: (filter?: AuditLogFilter) => Promise<void>;
}

export const useStaffStore = create<StaffState>((set, get) => ({
  staff: [],
  loginLogs: [],
  auditLogs: [],
  currentStaff: null,
  isLoadingStaff: false,
  isLoadingLogs: false,
  isLoadingAuditLogs: false,
  isSubmitting: false,

  fetchStaff: async (filter) => {
    set({ isLoadingStaff: true });
    const staff = await staffService.getAll(filter);
    set({ staff, isLoadingStaff: false });
  },

  fetchStaffById: async (id) => {
    const staff = await staffService.getById(id);
    set({ currentStaff: staff });
    return staff;
  },

  createStaff: async (data) => {
    set({ isSubmitting: true });
    const newStaff = await staffService.create(data);
    set((state) => ({ staff: [...state.staff, newStaff], isSubmitting: false }));
    return newStaff;
  },

  updateStaff: async (id, data) => {
    set({ isSubmitting: true });
    const updated = await staffService.update(id, data);
    if (updated) {
      set((state) => ({
        staff: state.staff.map((s) => (s.id === id ? updated : s)),
        currentStaff: state.currentStaff?.id === id ? updated : state.currentStaff,
        isSubmitting: false,
      }));
    } else {
      set({ isSubmitting: false });
    }
    return updated;
  },

  deleteStaff: async (id) => {
    set({ isSubmitting: true });
    const success = await staffService.delete(id);
    if (success) {
      set((state) => ({
        staff: state.staff.filter((s) => s.id !== id),
        currentStaff: state.currentStaff?.id === id ? null : state.currentStaff,
        isSubmitting: false,
      }));
    } else {
      set({ isSubmitting: false });
    }
    return success;
  },

  resetPassword: async (id) => {
    set({ isSubmitting: true });
    const password = await staffService.resetPassword(id);
    set({ isSubmitting: false });
    return password;
  },

  reset2fa: async (id) => {
    set({ isSubmitting: true });
    const success = await staffService.reset2fa(id);
    if (success) {
      set((state) => ({
        staff: state.staff.map((s) =>
          s.id === id ? { ...s, twoFactorEnabled: false, twoFactorSecret: undefined } : s
        ),
        currentStaff:
          state.currentStaff?.id === id
            ? { ...state.currentStaff, twoFactorEnabled: false, twoFactorSecret: undefined }
            : state.currentStaff,
        isSubmitting: false,
      }));
    } else {
      set({ isSubmitting: false });
    }
    return success;
  },

  toggleStaffStatus: async (id) => {
    const success = await staffService.toggleStatus(id);
    if (success) {
      const updated = await staffService.getById(id);
      if (updated) {
        set((state) => ({
          staff: state.staff.map((s) => (s.id === id ? updated : s)),
          currentStaff: state.currentStaff?.id === id ? updated : state.currentStaff,
        }));
      }
    }
    return success;
  },

  setCurrentStaff: (staff) => {
    set({ currentStaff: staff });
  },

  fetchLoginLogs: async (filter) => {
    set({ isLoadingLogs: true });
    const logs = await staffService.getLoginLogs(filter);
    set({ loginLogs: logs, isLoadingLogs: false });
  },

  fetchAuditLogs: async (filter) => {
    set({ isLoadingAuditLogs: true });
    const logs = await staffService.getAuditLogs(filter);
    set({ auditLogs: logs, isLoadingAuditLogs: false });
  },
}));
