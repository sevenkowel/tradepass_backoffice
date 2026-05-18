/**
 * 部门树形结构工具函数
 */

import type { Department } from "@/types/crm/department";

export interface DepartmentTreeNode extends Department {
  children: DepartmentTreeNode[];
  level: number;
}

export interface FlattenedDepartment extends Department {
  _level: number;
  _hasChildren: boolean;
}

/**
 * 将扁平部门列表构建为树形结构
 */
export function buildDepartmentTree(departments: Department[]): DepartmentTreeNode[] {
  const map = new Map<string, DepartmentTreeNode>();
  const roots: DepartmentTreeNode[] = [];

  for (const dept of departments) {
    map.set(dept.id, { ...dept, children: [], level: 0 });
  }

  for (const dept of departments) {
    const node = map.get(dept.id);
    if (!node) continue;
    if (dept.parentId && map.has(dept.parentId)) {
      const parent = map.get(dept.parentId);
      if (parent) {
        node.level = parent.level + 1;
        parent.children.push(node);
      }
    } else {
      roots.push(node);
    }
  }

  return roots;
}

/**
 * 将树形结构扁平化为列表（用于表格展示）
 */
export function flattenDepartmentTree(
  nodes: DepartmentTreeNode[],
  level = 0
): FlattenedDepartment[] {
  const result: FlattenedDepartment[] = [];
  for (const node of nodes) {
    const hasChildren = node.children.length > 0;
    result.push({ ...node, _level: level, _hasChildren: hasChildren });
    if (hasChildren) {
      result.push(...flattenDepartmentTree(node.children, level + 1));
    }
  }
  return result;
}

/**
 * 获取部门完整路径名称
 */
export function getDepartmentPath(departments: Department[], id: string): string {
  const names: string[] = [];
  let current: Department | undefined = departments.find((d) => d.id === id);
  while (current) {
    names.unshift(current.name);
    current = current.parentId
      ? departments.find((d) => d.id === current!.parentId)
      : undefined;
  }
  return names.join(" / ");
}

/**
 * 获取部门及其所有子部门的 ID 列表
 */
export function getDepartmentAndChildrenIds(departments: Department[], id: string): string[] {
  const ids: string[] = [id];
  const children = departments.filter((d) => d.parentId === id);
  for (const child of children) {
    ids.push(...getDepartmentAndChildrenIds(departments, child.id));
  }
  return ids;
}

/**
 * 获取指定部门的所有后代 ID（不包含自身）
 */
export function getDescendantIds(departments: Department[], id: string): Set<string> {
  const ids = new Set<string>();
  const queue = [id];
  while (queue.length) {
    const current = queue.shift()!;
    const children = departments.filter((d) => d.parentId === current);
    for (const child of children) {
      ids.add(child.id);
      queue.push(child.id);
    }
  }
  return ids;
}
