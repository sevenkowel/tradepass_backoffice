# Clients 模块实现方案

> 版本：v1.0 | 日期：2026-05-08 | 状态：待确认

---

## 一、目标

将现有 `/crm/users` 升级为 `/crm/clients` 客户管理中心，包含：

| 页面 | 路由 | 优先级 |
|------|------|--------|
| Client List | `/crm/clients` | P0 |
| Client Profile | `/crm/clients/:id` | P0 |
| Tags | `/crm/clients/tags` | P1 |
| Segments | `/crm/clients/segments` | P1 |
| Lifecycle | `/crm/clients/lifecycle` | P2 |
| Notes | `/crm/clients/notes` | P2 |
| Relationships | `/crm/clients/relationships` | P2 |

---

## 二、数据模型扩展

### 2.1 BackofficeUser 扩展

```typescript
// src/types/backoffice/user.ts

export type UserStatus = 'active' | 'frozen' | 'pending' | 'closed';
export type KYCStatus = 'not_submitted' | 'pending' | 'verified' | 'rejected';
export type UserLevel = 'standard' | 'vip' | 'premium' | 'enterprise';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type LifecycleStage = 'registered' | 'verified' | 'ftd' | 'active' | 'inactive' | 'churn';

export interface BackofficeUser {
  id: string;
  uid: string;
  name: string;
  username?: string;
  email: string;
  phone: string;
  country?: string;
  avatar?: string;
  status: UserStatus;
  kycStatus: KYCStatus;
  level: UserLevel;
  balance: number;
  equity: number;
  createdAt: string;
  lastLoginAt: string;
  tags: string[];
  ibId?: string;
  notes?: string;

  // === 新增字段 ===
  riskLevel?: RiskLevel;           // 风险等级
  riskScore?: number;              // 风险评分 0-100
  lifecycleStage?: LifecycleStage; // 生命周期阶段
  ftdDate?: string;                // 首存时间
  totalDeposit?: number;           // 累计入金
  totalWithdrawal?: number;        // 累计出金
  netDeposit?: number;             // 净入金
  tradingVolume?: number;          // 交易量
  lastTradeAt?: string;            // 最后交易时间
  deviceCount?: number;            // 关联设备数
  ipCount?: number;                // 关联 IP 数
  relatedUserIds?: string[];       // 关联用户 ID（同设备/IP）
}

// 客户列表查询参数
export interface ClientListParams {
  page: number;
  pageSize: number;
  search?: string;
  status?: UserStatus;
  kycStatus?: KYCStatus;
  level?: UserLevel;
  riskLevel?: RiskLevel;
  lifecycleStage?: LifecycleStage;
  country?: string;
  hasFtd?: boolean;
  tags?: string[];
  dateRange?: { start: string; end: string };
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
```

### 2.2 标签模型

```typescript
// src/types/backoffice/client.ts (新增)

export interface ClientTag {
  id: string;
  name: string;
  color: string;
  description?: string;
  isSystem: boolean;      // 系统标签 vs 自定义标签
  autoRule?: TagAutoRule; // 自动打标规则
  userCount: number;
  createdAt: string;
}

export interface TagAutoRule {
  condition: 'and' | 'or';
  rules: {
    field: string;        // e.g. 'balance', 'netDeposit', 'tradingVolume'
    operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'in';
    value: number | string | string[];
  }[];
}

export interface ClientSegment {
  id: string;
  name: string;
  description?: string;
  filter: ClientListParams; // 复用列表筛选参数
  userCount: number;
  isDynamic: boolean;       // 动态分组（实时计算）vs 静态分组
  createdAt: string;
}
```

---

## 三、API 设计

```
GET    /api/crm/clients              客户列表（支持高级筛选）
GET    /api/crm/clients/:id          客户详情
PATCH  /api/crm/clients/:id          更新客户信息
POST   /api/crm/clients/:id/freeze   冻结账户
POST   /api/crm/clients/:id/unfreeze 解冻账户
POST   /api/crm/clients/:id/tags     批量打标签
DELETE /api/crm/clients/:id/tags     批量移除标签

GET    /api/crm/clients/tags         标签列表
POST   /api/crm/clients/tags         创建标签
PATCH  /api/crm/clients/tags/:id     更新标签
DELETE /api/crm/clients/tags/:id     删除标签

GET    /api/crm/clients/segments     分组列表
POST   /api/crm/clients/segments     创建分组
DELETE /api/crm/clients/segments/:id 删除分组

GET    /api/crm/clients/:id/notes    客户备注列表
POST   /api/crm/clients/:id/notes    添加备注

GET    /api/crm/clients/:id/related  关联用户（同设备/IP）
```

---

## 四、页面设计

### 4.1 Client List (`/crm/clients`)

**布局结构：**
```
┌─ Breadcrumb: Clients / Client List ──────────────┐
├─ PageHeader: title + [导出] [添加客户] ──────────┤
├─ Stats Cards (4列) ──────────────────────────────┤
│  总客户 | 活跃用户 | 待审核 KYC | 高风险客户       │
├─ Filter Bar ─────────────────────────────────────┤
│  搜索框 + 状态筛选 + KYC筛选 + 等级筛选 + 风险筛选 │
│  + 国家筛选 + 标签筛选 + 生命周期筛选 + 时间范围   │
├─ Batch Action Bar (选中时显示) ──────────────────┤
│  [批量打标签] [批量冻结] [批量导出] [取消]        │
├─ Data Table ─────────────────────────────────────┤
│  UID | 姓名 | 国家 | 等级 | 余额 | 状态 | KYC      │
│  | 风险 | 标签 | 注册时间 | 操作                   │
└──────────────────────────────────────────────────┘
```

**表格列定义：**

| 列 | 字段 | 说明 |
|----|------|------|
| UID | `uid` | 链接到详情页 |
| Client | `name` + `email` | 头像 + 姓名 + 邮箱 |
| Country | `country` | 国旗 + 国家名 |
| Level | `level` | LevelBadge 组件 |
| Balance | `balance` | 右对齐，千分位 |
| Status | `status` | StatusBadge 组件 |
| KYC | `kycStatus` | KYCStatusBadge 组件 |
| Risk | `riskLevel` | RiskBadge 组件（新增） |
| Tags | `tags` | 标签 chips（最多显示3个） |
| Registered | `createdAt` | 日期格式化 |
| Actions | - | 查看 / 冻结 / 调整余额 |

**高级筛选条件（FilterBar 扩展）：**
- 基础：UID、姓名、邮箱、手机
- 状态：active / frozen / pending / closed
- KYC：verified / pending / rejected / not_submitted
- 等级：standard / vip / premium / enterprise
- 风险等级：low / medium / high / critical
- 生命周期：registered / verified / ftd / active / inactive / churn
- 国家：下拉选择
- 标签：多选标签
- 时间范围：注册时间、最后登录时间
- 资金：余额范围、净入金范围

### 4.2 Client Profile (`/crm/clients/:id`)

**布局结构（FB/Telegram 风格）：**
```
┌─ Left Sidebar (固定宽度 320px) ──┐ ┌─ Right Content ──────────────────┐
│                                  │ │  Tab Navigation                  │
│  ┌─ Avatar + Name ───────────── │ │  Overview | KYC | Risk | Accounts│
│  │                              │ │  | Funds | Trades | Device | Audit│
│  │  [大头像]                     │ │  | Agreements | Logs | Notes     │
│  │  张三                        │ │  | Relationships                 │
│  │  user_12345                  │ │                                  │
│  │  [冻结] [发消息] [编辑]       │ │  Tab Content                     │
│  │                              │ │  ...                             │
│  ├─ Quick Stats ─────────────── │ │                                  │
│  │  余额: $20,840               │ │                                  │
│  │  净值: $20,998               │ │                                  │
│  │  风险: Medium                │ │                                  │
│  │  KYC: Verified               │ │                                  │
│  ├─ Basic Info ──────────────── │ │                                  │
│  │  邮箱 / 手机 / 国家 / 注册时间 │ │                                  │
│  ├─ Tags ────────────────────── │ │                                  │
│  │  [VIP] [高频交易] [+添加]     │ │                                  │
│  └─ Notes Preview ───────────── │ │                                  │
│     最新一条备注...              │ │                                  │
└──────────────────────────────────┘ └──────────────────────────────────┘
```

**12 个 Tab：**

| # | Tab | 内容 | 优先级 |
|---|-----|------|--------|
| 1 | Overview | 总览卡片（余额/净值/盈亏/活跃度）+ 最近活动 | P0 |
| 2 | KYC | KYC 状态时间线 + 证件信息 + OCR 结果 | P0 |
| 3 | Risk | 风险评分 + 风险标记 + 命中规则 | P0 |
| 4 | Accounts | MT 账户列表（余额/净值/保证金/杠杆） | P0 |
| 5 | Funds | 出入金记录 + 资金统计 | P0 |
| 6 | Trades | 交易历史 + 盈亏统计 | P0 |
| 7 | Device | 登录设备列表 + IP 历史 + 地理位置 | P1 |
| 8 | Audit | KYC 审核记录 + 操作审计 | P1 |
| 9 | Agreements | 协议签署历史 + 版本 | P1 |
| 10 | Logs | 操作日志（登录/修改/交易） | P1 |
| 11 | Notes | 内部备注列表 + @协作 + 添加备注 | P1 |
| 12 | Relationships | IB 关系树 + 关联用户（同设备/IP） | P2 |

### 4.3 Tags (`/crm/clients/tags`)

**布局结构：**
```
┌─ Breadcrumb: Clients / Tags ─────────────────────┐
├─ PageHeader: title + [创建标签] ─────────────────┤
├─ Tabs: [全部] [系统标签] [自定义标签] ────────────┤
├─ Data Table ─────────────────────────────────────┤
│  标签名 | 颜色 | 类型 | 规则 | 用户数量 | 操作     │
└──────────────────────────────────────────────────┘
```

**创建标签弹窗：**
- 标签名称
- 颜色选择器
- 描述
- 自动打标规则（可选）：字段 + 运算符 + 值

### 4.4 Segments (`/crm/clients/segments`)

**布局结构：**
```
┌─ Breadcrumb: Clients / Segments ─────────────────┐
├─ PageHeader: title + [创建分组] ─────────────────┤
├─ Segment Cards (网格布局) ───────────────────────┤
│  ┌─ 未入金用户 ─────────────┐ ┌─ 沉默用户 ─────┐ │
│  │  FTD = 0                  │ │  30天未登录    │ │
│  │  用户: 1,234              │ │  用户: 567     │ │
│  │  [查看列表]               │ │  [查看列表]    │ │
│  └───────────────────────────┘ └────────────────┘ │
└──────────────────────────────────────────────────┘
```

**创建分组弹窗：**
- 分组名称
- 描述
- 筛选条件（复用 FilterBar 的筛选逻辑）
- 动态分组（实时计算）vs 静态分组（快照）

---

## 五、组件拆分

### 5.1 新增组件

| 组件 | 路径 | 说明 |
|------|------|------|
| `ClientListPage` | `src/app/crm/clients/page.tsx` | 客户列表主页面 |
| `ClientProfilePage` | `src/app/crm/clients/[id]/page.tsx` | 客户详情主页面 |
| `ClientProfileLayout` | `src/app/crm/clients/[id]/layout.tsx` | 详情页布局（左栏+右内容） |
| `ClientLeftSidebar` | `src/components/crm/clients/ClientLeftSidebar.tsx` | 左侧资料栏 |
| `ClientTabNav` | `src/components/crm/clients/ClientTabNav.tsx` | Tab 导航 |
| `OverviewTab` | `src/components/crm/clients/tabs/OverviewTab.tsx` | 总览 Tab |
| `KYCTab` | `src/components/crm/clients/tabs/KYCTab.tsx` | KYC Tab |
| `RiskTab` | `src/components/crm/clients/tabs/RiskTab.tsx` | 风险 Tab |
| `AccountsTab` | `src/components/crm/clients/tabs/AccountsTab.tsx` | 账户 Tab |
| `FundsTab` | `src/components/crm/clients/tabs/FundsTab.tsx` | 资金 Tab |
| `TradesTab` | `src/components/crm/clients/tabs/TradesTab.tsx` | 交易 Tab |
| `DeviceTab` | `src/components/crm/clients/tabs/DeviceTab.tsx` | 设备 Tab |
| `AuditTab` | `src/components/crm/clients/tabs/AuditTab.tsx` | 审核 Tab |
| `AgreementsTab` | `src/components/crm/clients/tabs/AgreementsTab.tsx` | 协议 Tab |
| `LogsTab` | `src/components/crm/clients/tabs/LogsTab.tsx` | 日志 Tab |
| `NotesTab` | `src/components/crm/clients/tabs/NotesTab.tsx` | 备注 Tab |
| `RelationshipsTab` | `src/components/crm/clients/tabs/RelationshipsTab.tsx` | 关联 Tab |
| `TagManager` | `src/app/crm/clients/tags/page.tsx` | 标签管理页面 |
| `SegmentManager` | `src/app/crm/clients/segments/page.tsx` | 分组管理页面 |
| `LifecyclePage` | `src/app/crm/clients/lifecycle/page.tsx` | 生命周期页面 |
| `NotesPage` | `src/app/crm/clients/notes/page.tsx` | 备注中心页面 |
| `RelationshipsPage` | `src/app/crm/clients/relationships/page.tsx` | 关联关系页面 |
| `RiskBadge` | `src/components/crm/ui/RiskBadge.tsx` | 风险等级徽章 |
| `KYCStatusBadge` | `src/components/crm/ui/KYCStatusBadge.tsx` | KYC 状态徽章 |
| `ClientTag` | `src/components/crm/ui/ClientTag.tsx` | 客户标签 chip |
| `TagColorPicker` | `src/components/crm/clients/TagColorPicker.tsx` | 标签颜色选择器 |
| `BatchActionBar` | `src/components/crm/clients/BatchActionBar.tsx` | 批量操作栏 |

### 5.2 复用现有组件

| 组件 | 来源 | 用途 |
|------|------|------|
| `EnhancedDataTable` | `src/components/crm/ui` | 客户列表表格 |
| `FilterBar` | `src/components/crm/ui` | 高级筛选 |
| `PageHeader` | `src/components/crm/ui` | 页面标题栏 |
| `Card` | `src/components/crm/ui` | 统计卡片 |
| `StatusBadge` | `src/components/crm/ui` | 状态徽章 |
| `LevelBadge` | `src/components/crm/ui` | 等级徽章 |
| `Breadcrumb` | `src/components/crm/layout` | 面包屑 |

---

## 六、Mock 数据服务

### 6.1 Client Service

```typescript
// src/lib/crm/services/client.service.ts

class ClientService {
  private clients: BackofficeUser[];

  async list(params: ClientListParams): Promise<{ items: BackofficeUser[]; total: number }>
  async getById(id: string): Promise<BackofficeUser | null>
  async update(id: string, data: Partial<BackofficeUser>): Promise<BackofficeUser>
  async freeze(id: string): Promise<void>
  async unfreeze(id: string): Promise<void>
  async addTags(id: string, tagIds: string[]): Promise<void>
  async removeTags(id: string, tagIds: string[]): Promise<void>
  async getNotes(id: string): Promise<ClientNote[]>
  async addNote(id: string, note: string, mentions?: string[]): Promise<ClientNote>
  async getRelatedUsers(id: string): Promise<BackofficeUser[]>
}
```

### 6.2 Tag Service

```typescript
// src/lib/crm/services/tag.service.ts

class TagService {
  private tags: ClientTag[];

  async list(): Promise<ClientTag[]>
  async create(data: Omit<ClientTag, 'id' | 'userCount'>): Promise<ClientTag>
  async update(id: string, data: Partial<ClientTag>): Promise<ClientTag>
  async delete(id: string): Promise<void>
  async applyAutoTags(): Promise<void> // 执行自动打标规则
}
```

---

## 七、实现顺序

### Phase 1: 基础列表 + 详情骨架（P0）

| # | 任务 | 文件 |
|---|------|------|
| 1.1 | 扩展 BackofficeUser 类型 | `src/types/backoffice/user.ts` |
| 1.2 | 创建 Client Service | `src/lib/crm/services/client.service.ts` |
| 1.3 | 重构 Client List 页面 | `src/app/crm/clients/page.tsx` |
| 1.4 | 新增 RiskBadge / KYCStatusBadge | `src/components/crm/ui/` |
| 1.5 | 创建 Client Profile 布局 | `src/app/crm/clients/[id]/layout.tsx` |
| 1.6 | 创建 Client Profile 页面 | `src/app/crm/clients/[id]/page.tsx` |
| 1.7 | 创建 Overview Tab | `src/components/crm/clients/tabs/OverviewTab.tsx` |
| 1.8 | 创建 KYC Tab | `src/components/crm/clients/tabs/KYCTab.tsx` |
| 1.9 | 创建 Risk Tab | `src/components/crm/clients/tabs/RiskTab.tsx` |

### Phase 2: 详情 Tab 完善（P0）

| # | 任务 | 文件 |
|---|------|------|
| 2.1 | 创建 Accounts Tab | `tabs/AccountsTab.tsx` |
| 2.2 | 创建 Funds Tab | `tabs/FundsTab.tsx` |
| 2.3 | 创建 Trades Tab | `tabs/TradesTab.tsx` |
| 2.4 | 创建 Device Tab | `tabs/DeviceTab.tsx` |
| 2.5 | 创建 Audit Tab | `tabs/AuditTab.tsx` |

### Phase 3: 标签系统（P1）

| # | 任务 | 文件 |
|---|------|------|
| 3.1 | 创建 Tag Service | `src/lib/crm/services/tag.service.ts` |
| 3.2 | 重构 Tags 页面 | `src/app/crm/clients/tags/page.tsx` |
| 3.3 | 创建 TagColorPicker | `src/components/crm/clients/TagColorPicker.tsx` |
| 3.4 | 支持批量打标签 | `BatchActionBar.tsx` |

### Phase 4: 分组 + 生命周期（P2）

| # | 任务 | 文件 |
|---|------|------|
| 4.1 | 创建 Segments 页面 | `src/app/crm/clients/segments/page.tsx` |
| 4.2 | 创建 Lifecycle 页面 | `src/app/crm/clients/lifecycle/page.tsx` |
| 4.3 | 创建 Notes 页面 | `src/app/crm/clients/notes/page.tsx` |
| 4.4 | 创建 Relationships 页面 | `src/app/crm/clients/relationships/page.tsx` |

---

## 八、与现有代码的兼容处理

| 现有文件 | 处理方式 |
|----------|----------|
| `/crm/users/page.tsx` | 内容迁移到 `/crm/clients/page.tsx`，旧路由保留为 redirect |
| `/crm/users/tags/page.tsx` | 内容迁移到 `/crm/clients/tags/page.tsx` |
| `/crm/users/levels/page.tsx` | 功能合并到 `/crm/kyc/levels`（已迁移） |
| `UserDetailDrawer.tsx` | 保留作为 Client Profile 的参考，逐步替换为 Tab 页面 |
| `/api/crm/users` | 重命名为 `/api/crm/clients`，保持响应格式兼容 |

---

## 九、关键设计决策

1. **Client Profile 采用页面路由而非 Drawer** — 详情页内容太多（12 Tab），Drawer 空间有限，改为独立页面 `/crm/clients/:id`
2. **Tab 内容懒加载** — 使用动态 import，只有激活的 Tab 才加载组件
3. **左侧栏固定** — 滚动时左侧客户资料保持固定，右侧 Tab 内容可滚动
4. **标签颜色规范化** — 提供 16 色预设，避免自定义颜色导致可读性问题
5. **批量操作状态管理** — 使用 URL query params 保存筛选条件，刷新不丢失

---

*等确认后，按 Phase 1 → Phase 2 → Phase 3 → Phase 4 顺序执行。*
