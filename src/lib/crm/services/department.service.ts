/**
 * Department Mock Service
 * 封装所有部门数据的 CRUD 操作，保证数据不可变性
 */

import type {
  Department,
  CreateDepartmentRequest,
  UpdateDepartmentRequest,
} from "@/types/crm/department";
import { mockDepartments } from "../mock-departments";
import { delay } from "@/lib/utils";

class DepartmentService {
  private departments = [...mockDepartments];

  async getAll(): Promise<Department[]> {
    await delay(300);
    return [...this.departments];
  }

  async getById(id: string): Promise<Department | null> {
    await delay(200);
    const dept = this.departments.find((d) => d.id === id);
    return dept ? { ...dept } : null;
  }

  async create(data: CreateDepartmentRequest): Promise<Department> {
    await delay(500);
    const newDept: Department = {
      id: `dept-${Date.now()}`,
      ...data,
      status: "active",
      memberCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.departments = [...this.departments, newDept];
    return { ...newDept };
  }

  async update(
    id: string,
    data: UpdateDepartmentRequest
  ): Promise<Department | null> {
    await delay(500);
    const index = this.departments.findIndex((d) => d.id === id);
    if (index === -1) return null;

    const updated: Department = {
      ...this.departments[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    this.departments = this.departments.map((d, i) =>
      i === index ? updated : d
    );
    return { ...updated };
  }

  async delete(id: string): Promise<boolean> {
    await delay(400);
    const index = this.departments.findIndex((d) => d.id === id);
    if (index === -1) return false;

    const idsToRemove = new Set([id]);
    const collectChildren = (parentId: string) => {
      this.departments.forEach((d) => {
        if (d.parentId === parentId) {
          idsToRemove.add(d.id);
          collectChildren(d.id);
        }
      });
    };
    collectChildren(id);

    this.departments = this.departments.filter((d) => !idsToRemove.has(d.id));
    return true;
  }
}

export const departmentService = new DepartmentService();
