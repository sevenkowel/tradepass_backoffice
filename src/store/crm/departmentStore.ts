/**
 * 部门管理 Store
 */

import { create } from "zustand";
import type {
  Department,
  CreateDepartmentRequest,
  UpdateDepartmentRequest,
} from "@/types/crm/department";
import { departmentService } from "@/lib/crm/services/department.service";

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
    const departments = await departmentService.getAll();
    set({ departments, isLoading: false });
  },

  createDepartment: async (data) => {
    set({ isSubmitting: true });
    const newDept = await departmentService.create(data);
    set((state) => ({ departments: [...state.departments, newDept], isSubmitting: false }));
    return newDept;
  },

  updateDepartment: async (id, data) => {
    set({ isSubmitting: true });
    const updated = await departmentService.update(id, data);
    if (updated) {
      set((state) => ({
        departments: state.departments.map((d) => (d.id === id ? updated : d)),
        isSubmitting: false,
      }));
    } else {
      set({ isSubmitting: false });
    }
    return updated;
  },

  deleteDepartment: async (id) => {
    set({ isSubmitting: true });
    const success = await departmentService.delete(id);
    if (success) {
      set((state) => ({
        departments: state.departments.filter((d) => d.id !== id && d.parentId !== id),
        isSubmitting: false,
      }));
    } else {
      set({ isSubmitting: false });
    }
    return success;
  },

  getDepartmentById: (id) => {
    return get().departments.find((d) => d.id === id);
  },

  getStaffDepartments: () => {
    return get().departments.filter((d) => d.status === "active");
  },
}));
