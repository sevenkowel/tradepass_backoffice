/**
 * 部门管理 Store
 */

import { create } from "zustand";
import type { Department, CreateDepartmentRequest, UpdateDepartmentRequest } from "@/types/crm/department";
import { mockDepartments } from "@/lib/crm/mock-departments";

interface DepartmentState {
  departments: Department[];
  isLoading: boolean;
  isSubmitting: boolean;

  fetchDepartments: () => Promise<void>;
  createDepartment: (data: CreateDepartmentRequest) => Promise<Department | null>;
  updateDepartment: (id: string, data: UpdateDepartmentRequest) => Promise<Department | null>;
  deleteDepartment: (id: string) => Promise<boolean>;
  getDepartmentById: (id: string) => Department | undefined;
  getStaffDepartments: () => Department[];
}

export const useDepartmentStore = create<DepartmentState>((set, get) => ({
  departments: [],
  isLoading: false,
  isSubmitting: false,

  fetchDepartments: async () => {
    set({ isLoading: true });
    await new Promise((r) => setTimeout(r, 300));
    set({ departments: [...mockDepartments], isLoading: false });
  },

  createDepartment: async (data) => {
    set({ isSubmitting: true });
    await new Promise((r) => setTimeout(r, 500));

    const newDept: Department = {
      id: `dept-${Date.now()}`,
      ...data,
      status: "active",
      memberCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockDepartments.push(newDept);
    set((state) => ({ departments: [...state.departments, newDept] }));
    set({ isSubmitting: false });
    return newDept;
  },

  updateDepartment: async (id, data) => {
    set({ isSubmitting: true });
    await new Promise((r) => setTimeout(r, 500));

    const index = mockDepartments.findIndex((d) => d.id === id);
    if (index === -1) {
      set({ isSubmitting: false });
      return null;
    }

    const updated = {
      ...mockDepartments[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    mockDepartments[index] = updated;

    set((state) => ({
      departments: state.departments.map((d) => (d.id === id ? updated : d)),
    }));
    set({ isSubmitting: false });
    return updated;
  },

  deleteDepartment: async (id) => {
    set({ isSubmitting: true });
    await new Promise((r) => setTimeout(r, 400));

    const index = mockDepartments.findIndex((d) => d.id === id);
    if (index === -1) {
      set({ isSubmitting: false });
      return false;
    }

    // Also remove children
    const removeIds = [id, ...mockDepartments.filter((d) => d.parentId === id).map((d) => d.id)];
    for (const removeId of removeIds) {
      const idx = mockDepartments.findIndex((d) => d.id === removeId);
      if (idx !== -1) mockDepartments.splice(idx, 1);
    }

    set((state) => ({
      departments: state.departments.filter((d) => d.id !== id && d.parentId !== id),
    }));
    set({ isSubmitting: false });
    return true;
  },

  getDepartmentById: (id) => {
    return get().departments.find((d) => d.id === id);
  },

  // 获取当前登录员工所属部门（mock）
  getStaffDepartments: () => {
    // Mock: return all active departments
    return get().departments.filter((d) => d.status === "active");
  },
}));
