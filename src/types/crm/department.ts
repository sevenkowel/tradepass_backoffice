/**
 * CRM 部门管理类型定义
 */

// CRM 模块列表（对应侧边栏菜单分组）
export const CRM_MODULES = [
  "Dashboard",
  "Users",
  "Compliance",
  "Accounts",
  "Funds",
  "Trading",
  "Risk",
  "CRM / Support",
  "Marketing",
  "Reports",
  "Business Config",
  "System",
  "Apps",
] as const;

export type CrmModule = (typeof CRM_MODULES)[number];

// 部门
export interface Department {
  id: string;
  name: string;
  description?: string;
  parentId?: string;        // 父级部门 ID，用于树形结构
  managerId?: string;       // 主管员工 ID
  managerName?: string;     // 主管姓名（展示用）
  moduleAccess: CrmModule[]; // 可访问的模块列表
  status: "active" | "inactive";
  memberCount: number;      // 成员数（自动计算）
  createdAt: string;
  updatedAt: string;
}

// 部门树形节点
export interface DepartmentTreeNode extends Department {
  children: DepartmentTreeNode[];
  level: number;
}

// 创建部门请求
export interface CreateDepartmentRequest {
  name: string;
  description?: string;
  parentId?: string;
  managerId?: string;
  moduleAccess: CrmModule[];
}

// 更新部门请求
export interface UpdateDepartmentRequest {
  name?: string;
  description?: string;
  parentId?: string;
  managerId?: string;
  moduleAccess?: CrmModule[];
  status?: "active" | "inactive";
}
