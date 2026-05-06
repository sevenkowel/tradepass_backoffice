/**
 * CRM 部门 Mock 数据 — 树形结构
 */

import type { Department } from "@/types/crm/department";

export const mockDepartments: Department[] = [
  // ========== 一级部门 ==========
  {
    id: "dept-tech",
    name: "技术部",
    description: "系统开发与运维",
    parentId: undefined,
    managerId: "staff-001",
    managerName: "系统管理员",
    moduleAccess: ["System", "Apps", "Dashboard"],
    status: "active",
    memberCount: 3,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2026-04-01T00:00:00Z",
  },
  {
    id: "dept-ops",
    name: "运营部",
    description: "平台运营与市场推广",
    parentId: undefined,
    managerId: "staff-002",
    managerName: "张三",
    moduleAccess: ["Users", "Marketing", "CRM / Support", "Dashboard", "Reports"],
    status: "active",
    memberCount: 4,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2026-04-01T00:00:00Z",
  },
  {
    id: "dept-compliance",
    name: "风控部",
    description: "合规审核与风险控制",
    parentId: undefined,
    managerId: "staff-004",
    managerName: "王五",
    moduleAccess: ["Compliance", "Risk", "Dashboard"],
    status: "active",
    memberCount: 3,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2026-04-01T00:00:00Z",
  },
  {
    id: "dept-finance",
    name: "财务部",
    description: "资金管理与会计核算",
    parentId: undefined,
    managerId: "staff-005",
    managerName: "赵六",
    moduleAccess: ["Funds", "Reports", "Dashboard"],
    status: "inactive",
    memberCount: 2,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2026-03-28T00:00:00Z",
  },
  {
    id: "dept-cs",
    name: "客服部",
    description: "客户支持与工单处理",
    parentId: undefined,
    managerId: "staff-003",
    managerName: "李四",
    moduleAccess: ["CRM / Support", "Dashboard"],
    status: "active",
    memberCount: 3,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2026-04-01T00:00:00Z",
  },
  {
    id: "dept-product",
    name: "产品部",
    description: "产品规划与交易产品配置",
    parentId: undefined,
    managerId: "staff-009",
    managerName: "周十",
    moduleAccess: ["Business Config", "Trading", "Dashboard"],
    status: "active",
    memberCount: 2,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2026-04-01T00:00:00Z",
  },

  // ========== 二级部门（子部门） ==========
  {
    id: "dept-tech-dev",
    name: "开发组",
    description: "前端与后端开发",
    parentId: "dept-tech",
    managerId: "staff-001",
    managerName: "系统管理员",
    moduleAccess: ["System", "Apps"],
    status: "active",
    memberCount: 2,
    createdAt: "2024-06-01T00:00:00Z",
    updatedAt: "2026-04-01T00:00:00Z",
  },
  {
    id: "dept-tech-ops",
    name: "运维组",
    description: "系统运维与监控",
    parentId: "dept-tech",
    managerId: undefined,
    managerName: undefined,
    moduleAccess: ["System"],
    status: "active",
    memberCount: 1,
    createdAt: "2024-06-01T00:00:00Z",
    updatedAt: "2026-04-01T00:00:00Z",
  },
  {
    id: "dept-compliance-kyc",
    name: "KYC 审核组",
    description: "客户身份认证审核",
    parentId: "dept-compliance",
    managerId: "staff-004",
    managerName: "王五",
    moduleAccess: ["Compliance", "Dashboard"],
    status: "active",
    memberCount: 2,
    createdAt: "2024-06-01T00:00:00Z",
    updatedAt: "2026-04-01T00:00:00Z",
  },
  {
    id: "dept-compliance-monitor",
    name: "交易监控组",
    description: "异常交易监控",
    parentId: "dept-compliance",
    managerId: undefined,
    managerName: undefined,
    moduleAccess: ["Risk", "Dashboard"],
    status: "active",
    memberCount: 1,
    createdAt: "2024-06-01T00:00:00Z",
    updatedAt: "2026-04-01T00:00:00Z",
  },
  {
    id: "dept-finance-in",
    name: "入金组",
    description: "入金处理",
    parentId: "dept-finance",
    managerId: undefined,
    managerName: undefined,
    moduleAccess: ["Funds"],
    status: "inactive",
    memberCount: 1,
    createdAt: "2024-06-01T00:00:00Z",
    updatedAt: "2026-03-28T00:00:00Z",
  },
  {
    id: "dept-finance-out",
    name: "出金组",
    description: "出金审核与处理",
    parentId: "dept-finance",
    managerId: undefined,
    managerName: undefined,
    moduleAccess: ["Funds"],
    status: "inactive",
    memberCount: 1,
    createdAt: "2024-06-01T00:00:00Z",
    updatedAt: "2026-03-28T00:00:00Z",
  },
  {
    id: "dept-cs-level1",
    name: "一线客服组",
    description: "日常客户咨询",
    parentId: "dept-cs",
    managerId: "staff-003",
    managerName: "李四",
    moduleAccess: ["CRM / Support"],
    status: "active",
    memberCount: 2,
    createdAt: "2024-06-01T00:00:00Z",
    updatedAt: "2026-04-01T00:00:00Z",
  },
  {
    id: "dept-cs-level2",
    name: "二线客服组",
    description: "复杂问题升级处理",
    parentId: "dept-cs",
    managerId: undefined,
    managerName: undefined,
    moduleAccess: ["CRM / Support"],
    status: "active",
    memberCount: 1,
    createdAt: "2024-06-01T00:00:00Z",
    updatedAt: "2026-04-01T00:00:00Z",
  },
];

export function buildDepartmentTree(departments: Department[]) {
  const map = new Map<string, any>();
  const roots: any[] = [];

  for (const dept of departments) {
    map.set(dept.id, { ...dept, children: [], level: 0 });
  }

  for (const dept of departments) {
    const node = map.get(dept.id);
    if (dept.parentId && map.has(dept.parentId)) {
      const parent = map.get(dept.parentId);
      node.level = parent.level + 1;
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots as (Department & { children: any[]; level: number })[];
}

export function getDepartmentPath(departments: Department[], id: string): string {
  const names: string[] = [];
  let current = departments.find((d) => d.id === id);
  while (current) {
    names.unshift(current.name);
    current = current.parentId ? departments.find((d) => d.id === current!.parentId) : undefined;
  }
  return names.join(" / ");
}

export function getDepartmentAndChildrenIds(departments: Department[], id: string): string[] {
  const ids: string[] = [id];
  const children = departments.filter((d) => d.parentId === id);
  for (const child of children) {
    ids.push(...getDepartmentAndChildrenIds(departments, child.id));
  }
  return ids;
}
