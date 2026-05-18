# CRM 模块代码优化方案

> 基于对 `src/app/crm`、`src/components/crm`、`src/store/crm`、`src/lib/crm`、`src/app/api/crm` 的抽样审查

---

## 一、问题总览

| 优先级 | 类别 | 问题数 | 影响 |
|---|---|---|---|
| **P0** | 架构/稳定性 | 3 | 数据竞态、无限重渲染、维护困难 |
| **P1** | 类型安全 | 4 | 编译时类型失效、隐式 bug |
| **P2** | 性能 | 3 | 不必要的重渲染、主线程阻塞 |
| **P3** | 代码质量/重复 | 5 | 可读性差、扩展成本高 |

---

## 二、P0 — 架构/稳定性问题

### 2.1 Mock 数据直接修改（竞态条件风险）

**问题代码：**
```ts
// src/store/crm/departmentStore.ts
mockDepartments.push(newDept);                    // 直接 push
mockDepartments[index] = updated;                 // 直接赋值
mockDepartments.splice(idx, 1);                   // 直接删除

// src/store/crm/staffStore.ts
mockStaff.push(newStaff);
mockStaff.splice(index, 1);
mockStaff[index] = updatedStaff;
```

**影响：**
- 模块级变量被多个 store 实例共享，React 并发模式下可能出现 tearing
- 直接修改外部状态破坏了单向数据流，调试困难
- 将来切到真实 API 时需要大面积重构

**优化方案：**
提取一个 **Mock Service Layer**，所有 mock 数据操作通过 service 方法完成，内部保证不可变性。

```ts
// src/lib/crm/services/department.service.ts
class DepartmentService {
  private departments = [...mockDepartments];

  async getAll(): Promise<Department[]> {
    await delay(300);
    return [...this.departments];
  }

  async create(data: CreateDepartmentRequest): Promise<Department> {
    await delay(500);
    const newDept: Department = {
      id: `dept-${Date.now()}`,
      ...data,
      status: 'active',
      memberCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.departments = [...this.departments, newDept];
    return newDept;
  }

  async update(id: string, data: UpdateDepartmentRequest): Promise<Department | null> {
    await delay(500);
    const index = this.departments.findIndex(d => d.id === id);
    if (index === -1) return null;
    const updated = { ...this.departments[index], ...data, updatedAt: new Date().toISOString() };
    this.departments = this.departments.map((d, i) => (i === index ? updated : d));
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    await delay(400);
    const idsToRemove = new Set([id]);
    const collectChildren = (parentId: string) => {
      this.departments.forEach(d => {
        if (d.parentId === parentId) {
          idsToRemove.add(d.id);
          collectChildren(d.id);
        }
      });
    };
    collectChildren(id);
    this.departments = this.departments.filter(d => !idsToRemove.has(d.id));
    return true;
  }
}

export const departmentService = new DepartmentService();
```

Store 中只保留状态和 UI 相关逻辑：
```ts
// src/store/crm/departmentStore.ts
fetchDepartments: async () => {
  set({ isLoading: true });
  const departments = await departmentService.getAll();
  set({ departments, isLoading: false });
},
```

---

### 2.2 Store index.ts 导出不完整

**问题代码：**
```ts
// src/store/crm/index.ts
export { useAuthStore } from './authStore';
export { useToastStore } from './toastStore';
// departmentStore, staffStore, roleStore, twoFAStore... 全部缺失
```

**影响：**
- 其他文件需要写多个 import 路径，维护成本高
- 新增 store 时容易遗漏导出

**优化方案：**
补全导出，建立统一的 store 入口：
```ts
// src/store/crm/index.ts
export { useAuthStore } from './authStore';
export { useToastStore } from './toastStore';
export { useDepartmentStore } from './departmentStore';
export { useStaffStore } from './staffStore';
export { useRoleStore } from './roleStore';
export { useTwoFAStore } from './twoFAStore';
export { useSecurityStore } from './securityStore';
export { useUserProfileStore } from './userProfileStore';
export { useUserSettingsStore } from './userSettingsStore';
```

---

### 2.3 useEffect 依赖 Store Action 导致无限重获取

**问题代码：**
```tsx
// src/app/crm/system/departments/page.tsx
useEffect(() => {
  fetchDepartments();
  fetchStaff();
}, [fetchDepartments, fetchStaff]);
```

**影响：**
- Zustand 的 action 虽然引用稳定，但如果 store 被重新创建（如 HMR），会导致重复请求
- 更关键的是，如果 store 中有其他 state 变化触发了组件重渲染，而 action 引用不稳定，就会进入无限循环

**优化方案：**
在 store 创建时用 `useShallow` 选择器，或在 page 中用空依赖数组 + 初始化标志：
```tsx
// 方案 A：用 zustand 的浅比较
import { useShallow } from 'zustand/react/shallow';

const { fetchDepartments } = useDepartmentStore(
  useShallow(state => ({ fetchDepartments: state.fetchDepartments }))
);

// 方案 B：空依赖 + 守卫（推荐）
useEffect(() => {
  fetchDepartments();
  fetchStaff();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);
```

> 建议统一采用方案 A，并在项目里配一个 `useStoreAction` 的自定义 hook。

---

## 三、P1 — 类型安全问题

### 3.1 `as never` / `as any` 类型断言

**问题代码：**
```ts
// src/store/crm/authStore.ts:95-96
return modulePermission.actions.includes('*' as never) || 
       modulePermission.actions.includes(action as never);

// src/components/crm/layout/Sidebar.tsx:564
if (allowedModules && !allowedModules.includes(group.group as any)) {
```

**优化方案：**
修正类型定义，消除断言：
```ts
// types/backoffice/role.ts — 确保 Permission 类型正确
type PermissionAction = '*' | 'view' | 'create' | 'edit' | 'delete' | string;

interface Permission {
  module: string;
  actions: PermissionAction[];
}

// authStore.ts
return modulePermission.actions.includes('*') || 
       modulePermission.actions.includes(action);

// Sidebar.tsx — allowedModules 类型收窄
const allowedModules: string[] | null = ...;
// group.group 本身就是 string，无需 as any
if (allowedModules && !allowedModules.includes(group.group)) {
```

---

### 3.2 `any[]` 泛滥

**问题代码：**
```ts
// src/app/crm/system/departments/page.tsx:31
const [tree, setTree] = useState<any[]>([]);

// src/lib/crm/mock-departments.ts:196-214
const map = new Map<string, any>();
const roots: any[] = [];
return roots as (Department & { children: any[]; level: number })[];
```

**优化方案：**
定义树节点类型：
```ts
// src/types/crm/department.ts
export interface DepartmentTreeNode extends Department {
  children: DepartmentTreeNode[];
  level: number;
}

// page.tsx
const [tree, setTree] = useState<DepartmentTreeNode[]>([]);

// mock-departments.ts
export function buildDepartmentTree(departments: Department[]): DepartmentTreeNode[] {
  const map = new Map<string, DepartmentTreeNode>();
  const roots: DepartmentTreeNode[] = [];
  // ...
}
```

---

### 3.3 `flattenTree` 在组件内定义且无类型

**问题代码：**
```ts
// departments/page.tsx:64-74
const flattenTree = (nodes: any[], level = 0): (Department & { _level: number; _hasChildren: boolean })[] => {
  // ...
};
```

**优化方案：**
提取为工具函数并加上类型：
```ts
// src/lib/crm/tree-utils.ts
export interface FlattenedDepartment extends Department {
  _level: number;
  _hasChildren: boolean;
}

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
```

---

## 四、P2 — 性能问题

### 4.1 Sidebar `filteredMenuGroups` useMemo 失效

**问题代码：**
```tsx
// Sidebar.tsx:537
const filteredMenuGroups = useMemo(() => {
  // 大量计算...
}, [hasPermission, installedApps]);
```

`hasPermission` 是 zustand store 里的方法，虽然 zustand 默认会保持 action 引用稳定，但如果通过选择器解构出来，可能不稳定。更安全的做法是在 useMemo 内部直接读取权限状态：

**优化方案：**
```tsx
const user = useAuthStore(state => state.user);

const filteredMenuGroups = useMemo(() => {
  // 把 hasPermission 的逻辑内联，不依赖方法引用
  const checkPermission = (module: string, action?: string) => {
    if (!user) return false;
    if (user.role.id === 'super_admin') return true;
    // ...
  };
  // ...
}, [user, installedApps, departments]);
```

---

### 4.2 EnhancedDataTable 搜索无 Debounce

**问题代码：**
```tsx
<input
  onChange={(e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  }}
/>
```

**优化方案：**
```tsx
import { useDeferredValue } from 'react';

// 搜索状态
const [searchQuery, setSearchQuery] = useState('');
const deferredQuery = useDeferredValue(searchQuery);

// 过滤用 deferredQuery
const filteredData = useMemo(() => {
  if (!searchable || !deferredQuery) return data;
  // ...
}, [data, searchable, deferredQuery, searchKeys]);

// input 保持即时响应
<input
  value={searchQuery}
  onChange={(e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  }}
/>
```

> 或者用 `useDebounce` hook，但 React 18+ 推荐 `useDeferredValue`。

---

### 4.3 图片使用原生 `<img>` 而非 Next.js `<Image>`

**问题代码：**
```tsx
// Sidebar.tsx:668
<img
  src={brandLogo}
  alt={brandName}
  className="w-10 h-10 rounded-xl object-contain flex-shrink-0"
/>
```

**优化方案：**
```tsx
import Image from 'next/image';

<Image
  src={brandLogo}
  alt={brandName}
  width={40}
  height={40}
  className="rounded-xl object-contain flex-shrink-0"
/>
```

---

## 五、P3 — 代码质量问题

### 5.1 `window.location.href` 而非 `router.push`

**问题代码：**
```tsx
// departments/page.tsx:147
window.location.href = `/crm/system/departments/${row.id}`;

// staff/page.tsx:287
window.location.href = `/crm/system/staff/${row.id}`;
```

**优化方案：**
```tsx
const router = useRouter();

// 在 rowActions 中
onClick: (row) => {
  router.push(`/crm/system/departments/${row.id}`);
},
```

---

### 5.2 Loading Spinner 重复代码

几乎每个 page 都写了：
```tsx
<div className="flex items-center justify-center py-12">
  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
</div>
```

**优化方案：**
提取为通用组件：
```tsx
// src/components/crm/ui/LoadingState.tsx
export function LoadingState({ size = 'md', className }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizeMap = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <Loader2 className={cn('animate-spin text-blue-600', sizeMap[size])} />
    </div>
  );
}
```

---

### 5.3 Mock API 延迟模式重复

几乎每个 store 都写了：
```ts
await new Promise((resolve) => setTimeout(resolve, 500));
```

**优化方案：**
```ts
// src/lib/utils.ts
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// store 中使用
import { delay } from '@/lib/utils';
await delay(500);
```

---

### 5.4 `isDescendant` 递归函数在渲染中定义

**问题代码：**
```tsx
// DepartmentForm.tsx:107-118
const availableParents = departments.filter((d) => {
  if (d.id === department?.id) return false;
  if (department) {
    const isDescendant = (parentId: string): boolean => {
      const children = departments.filter((c) => c.parentId === department.id);
      return children.some((c) => c.id === parentId || isDescendant(c.id));
    };
    if (isDescendant(d.id)) return false;
  }
  return true;
});
```

**影响：**
- 每次渲染都重新定义递归函数，且 `departments.filter` 在递归内部重复执行，时间复杂度 O(n²)

**优化方案：**
预计算后代集合，用 `useMemo`：
```tsx
const descendantIds = useMemo(() => {
  if (!department) return new Set<string>();
  const ids = new Set<string>();
  const queue = [department.id];
  while (queue.length) {
    const current = queue.shift()!;
    const children = departments.filter(d => d.parentId === current);
    for (const child of children) {
      ids.add(child.id);
      queue.push(child.id);
    }
  }
  return ids;
}, [department, departments]);

const availableParents = useMemo(() =>
  departments.filter(d => d.id !== department?.id && !descendantIds.has(d.id)),
  [departments, department, descendantIds]
);
```

---

### 5.5 API Route 中 Mock 与真实逻辑耦合

**问题代码：**
```ts
// src/app/api/crm/users/route.ts
const useMock = searchParams.get("mock") !== "false";

if (useMock) {
  return NextResponse.json({ ... });
}

// 真实数据库查询...
try {
  const users = await prisma.user.findMany(...);
} catch (error) {
  // 数据库失败时回退到模拟数据
  return NextResponse.json({ items: mockUsers });
}
```

**影响：**
- 每个 route 都重复 mock/真实切换逻辑
- 生产环境可能意外暴露 mock 数据
- catch 块直接回退 mock，可能掩盖真实数据库故障

**优化方案：**
用 **API Client + MSW** 或统一 Mock 中间件：
```ts
// src/lib/api-client.ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL;

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, options);
  if (!res.ok) throw new ApiError(res.status, await res.text());
  return res.json();
}

// 开发模式下用 MSW 拦截 /api/* 请求，返回 mock 数据
// 生产模式直接走真实 API，route handler 里不再写 mock 分支
```

> 或至少提取一个 `withMock` 高阶函数统一处理。

---

## 六、实施建议（优先级排序）

| 顺序 | 任务 | 预估工时 | 文件数 |
|---|---|---|---|
| 1 | 提取 Mock Service Layer（department/staff） | 2h | 2-4 |
| 2 | 补全 store/crm/index.ts 导出 | 10min | 1 |
| 3 | 修复 useEffect 依赖 + 提取 useStoreAction hook | 1h | 10+ |
| 4 | 消除 `as never` / `as any` / `any[]` | 1.5h | 5-8 |
| 5 | 提取通用组件（LoadingState、delay、tree-utils） | 1h | 3-5 |
| 6 | Sidebar useMemo 修复 + Image 组件替换 | 1h | 1-2 |
| 7 | EnhancedDataTable 加 debounce | 30min | 1 |
| 8 | window.location.href → router.push | 30min | 2-3 |
| 9 | API Route mock/真实逻辑解耦（长期） | 4h | 10+ |

---

## 七、快速自检清单

后续写 CRM 代码时，对照以下清单：

- [ ] 不直接修改模块级 mock 变量
- [ ] 不用 `as any` / `as never`
- [ ] useEffect 依赖数组不填 store action
- [ ] 路由跳转用 `router.push`
- [ ] 图片用 Next.js `<Image>`
- [ ] 搜索/输入有 debounce 或 deferred value
- [ ] 递归/复杂计算用 `useMemo`
- [ ] 新增 store 后在 `store/crm/index.ts` 导出
