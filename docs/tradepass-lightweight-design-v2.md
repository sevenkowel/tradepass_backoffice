# TradePass SaaS 轻量化设计方案 v2.1

> **目标**: 去掉所有真实 API 依赖，纯前端 Mock 模式，快速验证产品功能和交互效果  
> **原则**: 路由即系统，零 API 调用，localStorage 持久化，现有 Portal/CRM/Backoffice 功能完整保留  
> **日期**: 2026-04-30  
> **变更**: v2.0 → v2.1 恢复 Backoffice 为独立系统

---

## 一、系统全景

TradePass 由 **两个层级、四套系统** 组成：

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    TradePass 平台层（TradePass 运营方使用）                 │
│                                                                         │
│   ┌───────────┐    ┌──────────────┐    ┌──────────────────┐            │
│   │  官网      │    │  控制台       │    │  运营管理后台     │            │
│   │  /         │    │  /console    │    │  /backoffice     │            │
│   │           │    │              │    │                  │            │
│   │ 产品介绍   │    │ 我的租户      │    │ 全局租户管理      │            │
│   │ 定价展示   │    │ 产品订阅      │    │ 平台用户管理      │            │
│   │ 注册入口   │    │ 账单管理      │    │ 许可证管理        │            │
│   └─────┬─────┘    │ 团队成员      │    │ 平台账单/审计     │            │
│         │          └──────┬───────┘    └──────────────────┘            │
│         │                 │                                             │
│         │  注册成功后      │  从控制台顶部切换                            │
│         └────────────────►│                                             │
│                          │                                             │
│                          ▼                                             │
│              ┌──────────────────────┐                                  │
│              │  租户详情页           │                                  │
│              │  /console/tenants/[id]│                                  │
│              │                      │                                  │
│              │  ┌────────────────┐  │                                  │
│              │  │ 3个业务入口     │  │                                  │
│              │  │ → 业务官网      │  │                                  │
│              │  │ → 交易门户      │  │                                  │
│              │  │ → CRM管理      │  │                                  │
│              │  └────────────────┘  │                                  │
│              └──────────────────────┘                                  │
└─────────────────────────────────────────────────────────────────────────┘

                        ↓ 租户旗下业务系统（Broker 使用）

┌─────────────────────────────────────────────────────────────────────────┐
│                    租户业务层（从租户详情页进入）                            │
│                                                                         │
│   ┌──────────────┐   ┌──────────────┐   ┌──────────────────┐           │
│   │  业务官网      │   │  交易门户      │   │  CRM 管理        │           │
│   │  /broker      │   │  /portal      │   │  /crm            │           │
│   │              │   │              │   │                  │           │
│   │ 品牌展示      │   │ 交易/开户     │   │ 交易用户管理      │           │
│   │ 产品介绍      │   │ 资金/钱包     │   │ 出入金审核        │           │
│   │ 登录注册入口   │   │ KYC认证      │   │ KYC审核/风控      │           │
│   └──────────────┘   └──────────────┘   │ 营销/报表         │           │
│                                         └──────────────────┘           │
└─────────────────────────────────────────────────────────────────────────┘
```

### 关键区分

| 系统 | 层级 | 使用者 | 管理对象 |
|------|------|--------|---------|
| **Backoffice** `/backoffice` | 平台层 | TradePass 运营方 | **管理所有租户**的订阅、许可证、平台账单 |
| **CRM** `/crm` | 租户层 | Broker 运营人员 | **管理自己租户**的交易用户、资金、KYC、风控 |

---

## 二、路由架构（纯路径路由，去掉子域名）

### 2.1 完整路由表

```
═══════════════════════════════════════
  平台层 - 官网
═══════════════════════════════════════
/                              → 官网首页（8 Sections 营销页）
/auth/register                 → 注册页
/auth/login                    → 登录页

═══════════════════════════════════════
  平台层 - 控制台（租户 Owner 使用）
═══════════════════════════════════════
/console                       → 控制台首页（租户列表 + 概览）
/console/tenants/new           → 创建租户（引导式表单）
/console/tenants/[id]          → 租户详情（3个业务入口 + 配置管理）
/console/billing               → 账单管理
/console/members               → 成员管理
/console/settings              → 控制台设置

═══════════════════════════════════════
  平台层 - 运营管理后台（TradePass 运营方使用）
═══════════════════════════════════════
/backoffice                    → 运营仪表盘
/backoffice/tenants            → 租户管理（全局：所有租户的订阅/状态/续费）
/backoffice/users              → 平台用户管理
/backoffice/licenses           → 许可证管理
/backoffice/billing            → 平台账单
/backoffice/audit-logs         → 审计日志

═══════════════════════════════════════
  租户层 - 业务官网
═══════════════════════════════════════
/broker                        → 租户品牌官网

═══════════════════════════════════════
  租户层 - 交易门户（Portal 用户使用）
═══════════════════════════════════════
/portal                        → 交易门户首页
/portal/dashboard              → 交易概览
/portal/trading/*              → 交易系统（保留现有全部页面）
/portal/fund/*                 → 资金管理（保留现有全部页面）
/portal/wallet/*               → 钱包管理（保留现有全部页面）
/portal/kyc/*                  → KYC认证（保留现有全部页面）
/portal/copy-trading/*         → 跟单交易（保留现有全部页面）
/portal/ai-signals/*           → AI信号（保留现有全部页面）
/portal/ib/*                   → IB代理（保留现有全部页面）
/portal/insights/*             → 市场资讯（保留现有全部页面）
/portal/activity/*             → 活动（保留现有全部页面）
/portal/mamm/*                 → MAM（保留现有全部页面）
/portal/pamm/*                 → PAMM（保留现有全部页面）
/portal/settings/*             → 设置（保留现有全部页面）
/portal/support/*              → 客服（保留现有全部页面）

═══════════════════════════════════════
  租户层 - CRM 管理（Broker 运营人员使用）
═══════════════════════════════════════
/crm                           → CRM管理首页
/crm/users/*                   → 用户管理（保留现有全部页面）
/crm/accounts/*                → 账户管理（保留现有全部页面）
/crm/funds/*                   → 资金管理（保留现有全部页面）
/crm/compliance/*              → 合规管理（保留现有全部页面）
/crm/trading/*                 → 交易管理（保留现有全部页面）
/crm/risk/*                    → 风控管理（保留现有全部页面）
/crm/ib/*                      → IB管理（保留现有全部页面）
/crm/marketing/*               → 营销管理（保留现有全部页面）
/crm/crm/*                     → CRM内部（保留现有全部页面）
/crm/reports/*                 → 报表（保留现有全部页面）
/crm/system/*                  → 系统设置（保留现有全部页面）
/crm/ai-signals/*              → AI信号（保留现有全部页面）
/crm/copy-trading/*            → 跟单（保留现有全部页面）
```

### 2.2 去掉的东西

| 原有机制 | 处理方式 |
|---------|---------|
| 子域名路由 (`console.localhost`, `portal.dupoin.localhost` 等) | **全部移除**，改为纯路径路由 |
| Middleware 域名检测 `detectAppFromHost()` | **移除**，改为路径检测 |
| `next.config.ts` rewrites（子域名映射） | **移除** |
| `/auth/crm/login`、`/auth/portal/login`、`/auth/portal/register` | **统一为** `/auth/login` + `/auth/register` |
| Prisma / SQLite 数据库 | **移除**，全部改用 localStorage + Zustand |
| Onboarding 6 步向导 | **简化为** 创建租户 1 步表单 |

### 2.3 保留不变的东西

| 系统 | 处理方式 |
|------|---------|
| `/backoffice/*` 路由和页面 | **完整保留**，独立系统 |
| `/portal/*` 全部页面 | **完整保留** |
| `/crm/*` 全部页面 | **完整保留** |

---

## 三、核心用户旅程（3 步走完 Demo）

### 3.1 租户 Owner 旅程（主流程）

```
Step 1: 注册
┌──────────────────────────────────────────────┐
│  官网首页 → 点击「免费试用」                    │
│  /auth/register → 填写邮箱+密码+姓名           │
│  点击注册 → 前端生成 Mock 用户数据              │
│  写入 localStorage → 跳转 /console             │
└──────────────────────────────────────────────┘
                    ↓
Step 2: 初始化租户
┌──────────────────────────────────────────────┐
│  /console → 检测无租户 → 自动跳转创建页         │
│  /console/tenants/new → 填写租户名称+行业       │
│  点击创建 → 前端生成 Mock 租户数据              │
│  写入 localStorage → 跳转租户详情页             │
└──────────────────────────────────────────────┘
                    ↓
Step 3: 进入业务系统
┌──────────────────────────────────────────────┐
│  /console/tenants/[id] → 租户详情页             │
│  ┌──────────────────────────────────┐         │
│  │  🏢 业务官网  → /broker          │         │
│  │  📊 交易门户  → /portal          │         │
│  │  ⚙️ CRM管理   → /crm             │         │
│  └──────────────────────────────────┘         │
│  点击任意入口 → 直接进入（无需再登录）           │
└──────────────────────────────────────────────┘
```

### 3.2 TradePass 运营方旅程

```
TradePass 运营人员 → /backoffice
  ├── 查看所有租户的订阅状态
  ├── 管理许可证（分配/回收/续期）
  ├── 管理平台用户
  ├── 平台账单和收入
  └── 审计日志
```

---

## 四、数据层设计（纯前端 Mock）

### 4.1 核心数据结构

```typescript
// src/lib/mock/types.ts

// 平台用户
interface MockUser {
  id: string;
  email: string;
  name: string;
  role: 'platform_admin' | 'tenant_owner' | 'portal_user' | 'crm_staff';
  createdAt: string;
}

// 租户
interface MockTenant {
  id: string;
  name: string;
  industry: string;
  logo?: string;
  status: 'trial' | 'active' | 'suspended';
  plan: 'starter' | 'professional' | 'enterprise';
  createdAt: string;
  trialEndsAt: string;
  ownerId: string;
  members: MockMember[];
  config: MockTenantConfig;
  // Backoffice 管理的字段
  licenseId?: string;
  subscriptionStatus: 'active' | 'overdue' | 'cancelled';
  monthlyFee: number;
}

// 租户成员
interface MockMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'operator' | 'viewer';
  joinedAt: string;
}

// 租户配置
interface MockTenantConfig {
  brand: {
    primaryColor: string;
    logo: string;
    companyName: string;
  };
  products: string[];  // 已订阅产品模块
}

// 许可证（Backoffice 管理）
interface MockLicense {
  id: string;
  tenantId: string;
  tenantName: string;
  productId: string;
  status: 'active' | 'expired' | 'revoked';
  expiresAt: string;
  features: string[];
  createdAt: string;
}
```

### 4.2 Mock 数据存储

```typescript
// src/lib/mock/store.ts (Zustand + localStorage)

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface MockStore {
  // 用户
  currentUser: MockUser | null;
  isAuthenticated: boolean;
  
  // 租户（Console 和 Backoffice 共享）
  tenants: MockTenant[];
  currentTenantId: string | null;
  
  // 许可证（Backoffice 管理）
  licenses: MockLicense[];
  
  // 操作
  register: (email: string, password: string, name: string) => MockUser;
  login: (email: string, password: string) => MockUser;
  logout: () => void;
  
  // 租户操作（Console）
  createTenant: (name: string, industry: string) => MockTenant;
  updateTenant: (id: string, data: Partial<MockTenant>) => void;
  setCurrentTenant: (id: string) => void;
  
  // 成员操作（Console）
  addMember: (tenantId: string, member: MockMember) => void;
  removeMember: (tenantId: string, memberId: string) => void;
  
  // 许可证操作（Backoffice）
  createLicense: (tenantId: string, productId: string) => MockLicense;
  revokeLicense: (licenseId: string) => void;
  extendLicense: (licenseId: string, days: number) => void;
}

export const useMockStore = create<MockStore>()(
  persist(
    (set, get) => ({
      currentUser: null,
      isAuthenticated: false,
      tenants: [],
      currentTenantId: null,
      licenses: [],
      
      register: (email, password, name) => {
        const user: MockUser = {
          id: `user-${Date.now()}`,
          email,
          name,
          role: 'tenant_owner',
          createdAt: new Date().toISOString(),
        };
        set({ currentUser: user, isAuthenticated: true });
        return user;
      },
      
      login: (email, password) => {
        const user: MockUser = {
          id: `user-${Date.now()}`,
          email,
          name: email.split('@')[0],
          role: 'tenant_owner',
          createdAt: new Date().toISOString(),
        };
        set({ currentUser: user, isAuthenticated: true });
        return user;
      },
      
      logout: () => {
        set({ currentUser: null, isAuthenticated: false, currentTenantId: null });
      },
      
      createTenant: (name, industry) => {
        const user = get().currentUser!;
        const tenant: MockTenant = {
          id: `tenant-${Date.now()}`,
          name,
          industry,
          status: 'trial',
          plan: 'starter',
          createdAt: new Date().toISOString(),
          trialEndsAt: new Date(Date.now() + 14 * 86400000).toISOString(),
          ownerId: user.id,
          subscriptionStatus: 'active',
          monthlyFee: 99,
          members: [{
            id: `member-${Date.now()}`,
            userId: user.id,
            name: user.name,
            email: user.email,
            role: 'owner',
            joinedAt: new Date().toISOString(),
          }],
          config: {
            brand: { primaryColor: '#3B5BDB', logo: '', companyName: name },
            products: ['broker-os-starter'],
          },
        };
        set(state => ({
          tenants: [...state.tenants, tenant],
          currentTenantId: tenant.id,
        }));
        return tenant;
      },
      
      updateTenant: (id, data) => {
        set(state => ({
          tenants: state.tenants.map(t => t.id === id ? { ...t, ...data } : t),
        }));
      },
      
      setCurrentTenant: (id) => set({ currentTenantId: id }),
      
      addMember: (tenantId, member) => {
        set(state => ({
          tenants: state.tenants.map(t =>
            t.id === tenantId ? { ...t, members: [...t.members, member] } : t
          ),
        }));
      },
      
      removeMember: (tenantId, memberId) => {
        set(state => ({
          tenants: state.tenants.map(t =>
            t.id === tenantId
              ? { ...t, members: t.members.filter(m => m.id !== memberId) }
              : t
          ),
        }));
      },
      
      createLicense: (tenantId, productId) => {
        const tenant = get().tenants.find(t => t.id === tenantId);
        const license: MockLicense = {
          id: `license-${Date.now()}`,
          tenantId,
          tenantName: tenant?.name || '',
          productId,
          status: 'active',
          expiresAt: new Date(Date.now() + 365 * 86400000).toISOString(),
          features: ['full'],
          createdAt: new Date().toISOString(),
        };
        set(state => ({ licenses: [...state.licenses, license] }));
        return license;
      },
      
      revokeLicense: (licenseId) => {
        set(state => ({
          licenses: state.licenses.map(l =>
            l.id === licenseId ? { ...l, status: 'revoked' } : l
          ),
        }));
      },
      
      extendLicense: (licenseId, days) => {
        set(state => ({
          licenses: state.licenses.map(l =>
            l.id === licenseId
              ? { ...l, expiresAt: new Date(new Date(l.expiresAt).getTime() + days * 86400000).toISOString() }
              : l
          ),
        }));
      },
    }),
    { name: 'tradepass-mock-store' }
  )
);
```

### 4.3 Mock 数据种子

```typescript
// src/lib/mock/seed.ts

// Portal Mock 数据（保留现有 mock 数据）
export const PORTAL_MOCK_DATA = {
  user: { name: '张三', email: 'zhangsan@demo.com', kycLevel: 'enhanced' },
  accounts: [
    { id: '1', login: '900001', type: 'MT5.Standard', balance: 12580.50, leverage: '1:100', status: 'active' },
    { id: '2', login: '900002', type: 'MT5.ECN', balance: 50200.00, leverage: '1:500', status: 'active' },
  ],
  wallets: [{ currency: 'USD', balance: 8950.30, frozen: 0, available: 8950.30 }],
  positions: [...],
  orders: [...],
};

// CRM Mock 数据（保留现有 mock 数据）
export const CRM_MOCK_DATA = {
  dashboard: { totalUsers: 12847, activeUsers: 3621, ... },
  users: [...],
  ...
};

// Backoffice Mock 数据
export const BACKOFFICE_MOCK_DATA = {
  dashboard: { totalTenants: 156, activeTenants: 134, mrr: 42800, ... },
  platformUsers: [...],
  auditLogs: [...],
};
```

---

## 五、各系统页面设计

### 5.1 官网 (`/`)

**保留现有 8 Sections，不做改动：**
- HeroSection → ProblemSection → PlatformSection → ArchitectureSection → CoreProductsSection → UseCasesSection → EcosystemSection → CTASection

**修改点：**
- CTASection 的「免费试用」按钮 → 链接到 `/auth/register`
- Header 的「登录」按钮 → 链接到 `/auth/login`

### 5.2 注册页 (`/auth/register`)

**极简注册流程：**
```
┌────────────────────────────────────────┐
│          创建 TradePass 账户             │
│                                        │
│  姓名     [                          ] │
│  邮箱     [                          ] │
│  密码     [                          ] │
│  确认密码  [                          ] │
│                                        │
│  ☑ 我同意服务条款和隐私政策              │
│                                        │
│        [ 创建账户 ]                    │
│                                        │
│  已有账户？ 登录                        │
└────────────────────────────────────────┘
```

**逻辑：**
1. 前端校验 → 调用 `useMockStore.register()`
2. 自动跳转 `/console`
3. 无 API 调用，无邮箱验证，无 OTP

### 5.3 登录页 (`/auth/login`)

**极简登录流程：**
```
┌────────────────────────────────────────┐
│          登录 TradePass                 │
│                                        │
│  邮箱     [                          ] │
│  密码     [                          ] │
│                                        │
│        [ 登录 ]                        │
│                                        │
│  没有账户？ 注册                        │
└────────────────────────────────────────┘
```

**逻辑：**
1. 任意邮箱密码即可登录（Mock 模式）
2. 调用 `useMockStore.login()`
3. 跳转 `/console`

### 5.4 控制台 (`/console`)

#### 控制台首页
```
┌─────────────────────────────────────────────────────────────┐
│  TradePass Console                              张三 ▼     │
├──────────┬──────────────────────────────────────────────────┤
│          │                                                  │
│  仪表盘   │  欢迎回来，张三！                                 │
│  租户管理  │                                                  │
│  账单     │  我的租户                              [+ 创建]  │
│  成员     │                                                  │
│  设置     │  ┌──────────────────────────────────────┐       │
│          │  │ 🏢 Demo Broker                       │       │
│          │  │    专业版 · 试用中                     │       │
│          │  │    剩余 12 天                         │       │
│          │  │    [进入详情 →]                       │       │
│          │  └──────────────────────────────────────┘       │
│          │                                                  │
│          │  （无租户时：显示引导创建卡片）                      │
│          │                                                  │
└──────────┴──────────────────────────────────────────────────┘
```

**关键逻辑：**
- 无租户时 → 自动跳转 `/console/tenants/new`
- 有租户时 → 显示租户列表卡片
- 点击「创建」→ `/console/tenants/new`

#### 创建租户页 (`/console/tenants/new`)
```
┌────────────────────────────────────────┐
│       创建你的第一个租户                  │
│                                        │
│  租户名称   [ Demo Broker            ] │
│  所属行业   [ 外汇经纪 ▼ ]              │
│  选择套餐                              │
│                                        │
│  ┌──────────┐ ┌──────────┐ ┌────────┐ │
│  │ 入门版    │ │ 专业版    │ │ 企业版  │ │
│  │ $99/月   │ │ $299/月  │ │ 联系我们│ │
│  │ 基础功能  │ │ 全功能    │ │ 定制化  │ │
│  └──────────┘ └──────────┘ └────────┘ │
│                                        │
│        [ 创建租户 ]                     │
└────────────────────────────────────────┘
```

#### 租户详情页 (`/console/tenants/[id]`) ⭐ 核心页面
```
┌──────────────────────────────────────────────────────────────────┐
│  TradePass Console                                  张三 ▼      │
├──────────┬───────────────────────────────────────────────────────┤
│          │                                                       │
│  仪表盘   │  Demo Broker                          [编辑] [设置]  │
│  租户管理  │  专业版 · 试用中 · 剩余 12 天                          │
│  账单     │                                                       │
│  成员     │  ─── 业务系统 ──────────────────────────────────     │
│  设置     │                                                       │
│          │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐     │
│          │  │  🏢         │ │  📊         │ │  ⚙️         │     │
│          │  │  业务官网    │ │  交易门户    │ │  CRM管理    │     │
│          │  │             │ │             │ │             │     │
│          │  │  品牌展示    │ │  交易/开户   │ │  交易用户    │     │
│          │  │  产品介绍    │ │  资金/钱包   │ │  出入金审核  │     │
│          │  │  登录注册    │ │  KYC认证    │ │  KYC/风控   │     │
│          │  │             │ │             │ │  营销/报表   │     │
│          │  │  [进入 →]   │ │  [进入 →]   │ │  [进入 →]   │     │
│          │  └─────────────┘ └─────────────┘ └─────────────┘     │
│          │                                                       │
│          │  ─── 订阅产品 ──────────────────────────────────     │
│          │  Broker OS    ████████████░░  已订阅                   │
│          │  Growth Engine ░░░░░░░░░░░░░  未订阅  [订阅]           │
│          │  Trade Engine  ░░░░░░░░░░░░░  未订阅  [订阅]           │
│          │                                                       │
│          │  ─── 团队成员 ──────────────────────────────────     │
│          │  张三 (Owner)  zhangsan@demo.com    [管理成员 →]       │
│          │                                                       │
└──────────┴───────────────────────────────────────────────────────┘
```

**三个业务入口的跳转：**
- 点击「业务官网 → 进入」 → 跳转 `/broker`
- 点击「交易门户 → 进入」 → 跳转 `/portal`
- 点击「CRM管理 → 进入」  → 跳转 `/crm`

### 5.5 运营管理后台 (`/backoffice`)

**保留现有 Backoffice 页面，独立系统：**

```
┌──────────────────────────────────────────────────────────────────┐
│  TradePass Backoffice                               管理员 ▼    │
├──────────┬───────────────────────────────────────────────────────┤
│          │                                                       │
│  仪表盘   │  平台概览                                             │
│  租户管理  │                                                       │
│  用户管理  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐               │
│  许可证    │  │ 156  │ │ 134  │ │$42.8K│ │ 12   │               │
│  账单     │  │总租户 │ │活跃  │ │ MRR  │ │逾期   │               │
│  审计日志  │  └──────┘ └──────┘ └──────┘ └──────┘               │
│          │                                                       │
│          │  最近租户                                             │
│          │  ┌─────────────────────────────────────────────┐     │
│          │  │ Demo Broker  │ 专业版 │ 试用中 │ 剩余12天     │     │
│          │  │ Alpha FX     │ 入门版 │ 活跃   │ -           │     │
│          │  │ Beta Trade   │ 企业版 │ 活跃   │ -           │     │
│          │  └─────────────────────────────────────────────┘     │
│          │                                                       │
└──────────┴───────────────────────────────────────────────────────┘
```

**现有页面清单（全部保留）：**
- `/backoffice` - 运营仪表盘
- `/backoffice/tenants` - 全局租户管理（管理所有租户的订阅/续费/停用）
- `/backoffice/users` - 平台用户管理
- `/backoffice/licenses` - 许可证管理（分配/回收/续期）
- `/backoffice/billing` - 平台账单
- `/backoffice/audit-logs` - 审计日志

**Backoffice vs CRM 管理对象对比：**
```
Backoffice（平台级）               CRM（租户级）
─────────────────────            ─────────────────────
管理: 所有租户的订阅状态           管理: 本租户的交易用户
管理: 许可证分配和回收             管理: 本租户的出入金审核
管理: 平台账单和收入               管理: 本租户的KYC审核
管理: 全局用户账号                 管理: 本租户的风控规则
管理: 审计日志                     管理: 本租户的营销活动
```

### 5.6 交易门户 (`/portal`)

**保留现有全部页面，不做功能删减。** 只需：
1. 数据源从 API 调用改为从 Fetch 拦截层获取 Mock 数据
2. 侧边栏顶部增加「← 返回控制台」入口
3. 无需修改现有 fetch 调用（拦截层自动处理）

**现有页面清单（全部保留）：**
- `/portal` ~ `/portal/support/*` （70+ 页面全部保留）

### 5.7 CRM 管理 (`/crm`)

**保留现有全部页面，不做功能删减。** 只需：
1. 数据源从 API 调用改为从 Fetch 拦截层获取 Mock 数据
2. 侧边栏顶部增加「← 返回控制台」入口
3. 无需修改现有 fetch 调用（拦截层自动处理）

**现有页面清单（全部保留）：**
- `/crm` ~ `/crm/system/*` （50+ 页面全部保留）

### 5.8 租户业务官网 (`/broker`)

**简化版品牌展示页**（保留现有 `/broker` 页面，稍作调整）：
- 品牌名称 + Logo
- 产品/服务卡片
- 「开始交易」按钮 → 跳转 `/portal`
- 「管理后台」按钮 → 跳转 `/crm`
- 「← 返回控制台」按钮 → 跳转 `/console`

---

## 六、导航与系统切换

### 6.1 系统间导航

```
                     ┌─────────────────┐
                     │   官网 /         │
                     │  (公开访问)      │
                     └────────┬────────┘
                              │ 注册/登录
                              ▼
                     ┌─────────────────┐        ┌─────────────────┐
              ┌─────►│  控制台 /console │───────►│ Backoffice /bo  │
              │      │  (租户Owner)     │        │ (TradePass运营) │
              │      └──┬───┬───┬──────┘        └─────────────────┘
              │         │   │   │
              │         │   │   └──────────────┐
              │         │   │                  │
              │         ▼   ▼                  ▼
              │  ┌─────────┐ ┌─────────┐ ┌─────────┐
              │  │ Broker  │ │ Portal  │ │  CRM    │
              │  │ /broker │ │ /portal │ │  /crm   │
              │  └─────────┘ └─────────┘ └─────────┘
              │         │   │   │                  │
              └─────────┘   │   └──────────────────┘
               ← 返回控制台  │     ← 返回控制台
                            │
                            └──← 返回控制台
```

### 6.2 导航入口

| 从 | 入口位置 | 到 |
|----|---------|-----|
| 控制台 | 顶栏右侧「运营后台」 | `/backoffice` |
| 控制台 | 租户详情页3个卡片 | `/broker`, `/portal`, `/crm` |
| Portal | 侧边栏顶部「← 返回控制台」 | `/console` |
| CRM | 侧边栏顶部「← 返回控制台」 | `/console` |
| Broker | 页面顶部「← 返回控制台」 | `/console` |
| Backoffice | 顶栏右侧「返回控制台」 | `/console` |

---

## 七、认证简化方案

### 7.1 单一认证流

```
注册: /auth/register → MockStore.register() → /console
登录: /auth/login    → MockStore.login()    → /console
登出: 任意页面        → MockStore.logout()   → /
```

### 7.2 路由守卫

```typescript
// src/lib/auth-guard.ts

export function useAuthGuard() {
  const { isAuthenticated } = useMockStore();
  const router = useRouter();
  
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/auth/login');
    }
  }, [isAuthenticated]);
}

// 需要守卫的路由组:
// /console/*, /backoffice/*, /portal/*, /crm/*, /broker/*
// 不需要守卫: /, /auth/*
```

### 7.3 移除的认证机制

| 原有 | 处理 |
|------|------|
| Cookie-based token (`token=...`) | 改为 Zustand store 状态 |
| `/api/auth/me` | 改为 `useMockStore.currentUser` |
| `/api/auth/login` | 改为 `useMockStore.login()` |
| `/api/auth/register` | 改为 `useMockStore.register()` |
| OTP / 邮箱验证 / 2FA | Demo 中全部跳过 |
| Cookie `onboarding_completed` | 不再需要 |

---

## 八、API 处理策略

### 8.1 全部移除的 API

```
/api/auth/*           → 全部移除，改用 MockStore
/api/onboarding/*     → 全部移除
/api/config/auth      → 全部移除
/api/tenant/brand     → 全部移除
/api/console/tenants  → 全部移除，改用 MockStore
```

### 8.2 保留但改为硬编码 Mock 的 API（Fetch 拦截层）

```typescript
// src/lib/mock/api-mock.ts
// 统一拦截 fetch 请求，返回 Mock 数据
// 不需要改现有页面（Portal/CRM/Backoffice）的 fetch 调用

const originalFetch = window.fetch;
window.fetch = async (input, init) => {
  const url = typeof input === 'string' ? input : input.url;
  
  // 匹配 Mock 路由
  const mockHandler = mockApiRoutes[url];
  if (mockHandler) {
    return new Response(JSON.stringify(mockHandler()), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
  
  return originalFetch(input, init);
};
```

### 8.3 Mock API 路由表

```typescript
const mockApiRoutes: Record<string, () => any> = {
  // 通用
  '/api/user/me': () => useMockStore.getState().currentUser,
  '/api/auth/me': () => useMockStore.getState().currentUser,
  
  // Portal
  '/api/portal/dashboard': () => PORTAL_MOCK_DATA.dashboard,
  '/api/portal/accounts': () => PORTAL_MOCK_DATA.accounts,
  '/api/portal/transactions': () => PORTAL_MOCK_DATA.transactions,
  
  // CRM
  '/api/crm/dashboard': () => CRM_MOCK_DATA.dashboard,
  '/api/crm/users': () => CRM_MOCK_DATA.users,
  '/api/crm/accounts': () => CRM_MOCK_DATA.accounts,
  '/api/crm/funds/deposits': () => CRM_MOCK_DATA.deposits,
  '/api/crm/funds/withdrawals': () => CRM_MOCK_DATA.withdrawals,
  '/api/crm/trading/orders': () => CRM_MOCK_DATA.orders,
  '/api/crm/compliance/kyc-review': () => CRM_MOCK_DATA.kycReview,
  
  // Backoffice
  '/api/backoffice/metrics': () => BACKOFFICE_MOCK_DATA.dashboard,
  '/api/backoffice/tenants': () => useMockStore.getState().tenants,
  '/api/backoffice/users': () => BACKOFFICE_MOCK_DATA.platformUsers,
  '/api/backoffice/licenses': () => useMockStore.getState().licenses,
  '/api/backoffice/audit-logs': () => BACKOFFICE_MOCK_DATA.auditLogs,
  
  // KYC
  '/api/config/kyc': () => DEFAULT_KYC_CONFIG,
  '/api/kyc/status': () => ({ status: 'approved', level: 'enhanced' }),
};
```

---

## 九、需要新建/修改的文件

### 9.1 新建文件

| 文件 | 说明 |
|------|------|
| `src/lib/mock/types.ts` | Mock 数据类型定义 |
| `src/lib/mock/store.ts` | Zustand Mock Store（用户+租户+许可证+认证） |
| `src/lib/mock/seed.ts` | Mock 种子数据（Portal/CRM/Backoffice 数据） |
| `src/lib/mock/api-mock.ts` | Fetch 拦截层 |
| `src/lib/auth-guard.ts` | 路由守卫 Hook |

### 9.2 需要修改的文件

| 文件 | 修改内容 |
|------|---------|
| `src/app/(marketing)/page.tsx` | CTA 按钮链接到 `/auth/register` |
| `src/components/layout/Header.tsx` | 登录/注册链接 |
| `src/app/auth/register/page.tsx` | 改为 MockStore.register()，跳转 /console |
| `src/app/auth/login/page.tsx` | 改为 MockStore.login()，跳转 /console |
| `src/app/console/page.tsx` | 改为从 MockStore 读租户列表，无租户跳转创建 |
| `src/app/console/layout.tsx` | 简化，移除 onboarding 检查，增加 Backoffice 入口 |
| `src/app/console/tenants/new/page.tsx` | 改为 MockStore.createTenant() |
| `src/app/console/tenants/[id]/page.tsx` | 重新设计：3 个业务入口卡片 |
| `src/app/portal/layout.tsx` | 增加「← 返回控制台」入口 |
| `src/app/crm/layout.tsx` | 增加「← 返回控制台」入口 |
| `src/app/backoffice/layout.tsx` | 增加「← 返回控制台」入口 |
| `src/app/broker/page.tsx` | 简化为品牌展示+导航入口 |
| `src/middleware.ts` | 简化为路径守卫，移除域名检测 |
| `next.config.ts` | 移除子域名 rewrites |
| `src/components/providers/MockProvider.tsx` | 集成 api-mock 拦截层 |
| `src/app/layout.tsx` | 引入 MockProvider |

### 9.3 可以删除的文件/目录

| 路径 | 原因 |
|------|------|
| `src/app/api/onboarding/**` | 不再需要 onboarding |
| `src/app/api/config/auth/**` | 不再需要动态认证配置 |
| `src/app/auth/crm/**` | 统一登录入口 |
| `src/app/auth/portal/**` | 统一登录入口 |
| `src/app/auth/verify-email/**` | Demo 不需要验证 |
| `prisma/**` | 不再使用数据库 |
| `src/lib/prisma.ts` | 不再使用 Prisma |

---

## 十、实施步骤（4 步完成）

### Step 1: 基础设施（Mock 层 + 认证）
- 创建 `src/lib/mock/` 目录（types, store, seed, api-mock）
- 简化注册/登录页（纯前端 Mock）
- 简化 Middleware（路径守卫）
- 移除子域名 rewrites

### Step 2: 控制台重构
- 简化 Console Layout
- 重写 Console 首页（租户列表）
- 重写创建租户页（一步表单）
- 重写租户详情页（3 个业务入口卡片）

### Step 3: 业务系统接入
- Portal Layout 增加「← 返回控制台」
- CRM Layout 增加「← 返回控制台」
- Backoffice Layout 增加「← 返回控制台」
- Broker 页面简化
- 集成 fetch 拦截层，现有页面无需改动

### Step 4: 清理
- 删除不再需要的 API 路由和页面
- 删除 Prisma 相关代码
- 验证全流程：注册 → 控制台 → 创建租户 → 进入 Portal/CRM
- 验证 Backoffice：查看租户列表、许可证管理

---

## 十一、与现有设计文档的关系

| 文档 | 处理方式 |
|------|---------|
| `docs/01-Product/Product-Spec.md` | 产品定位不变，SaaS 架构不变，只是 Demo 简化 |
| `docs/tradepass-routing-architecture.md` | **被本文档替代**（子域名 → 路径路由） |
| `docs/portal-mvp-flow-design.md` | Portal 功能保留，认证流程简化 |
| `docs/backoffice/SPEC.md` | Backoffice 独立保留，数据改为 Mock |
| `DESIGN.md` | UI 设计规范不变，继续遵循 |
| `docs/01-Product/KYC-PRD.md` | KYC 流程保留，数据改为 Mock |
| `docs/01-Product/Fund-PRD.md` | 资金功能保留，数据改为 Mock |

---

## 十二、关键设计决策

| # | 决策 | 选择 | 原因 |
|---|------|------|------|
| 1 | 路由方式 | 路径路由（非子域名） | 开发简单，无 DNS/hosts 配置，单端口即可运行 |
| 2 | 数据持久化 | localStorage (Zustand persist) | 零后端依赖，刷新不丢失，多标签页同步 |
| 3 | API Mock 方式 | Fetch 拦截层 | 现有页面 fetch 调用无需修改 |
| 4 | Backoffice | **独立保留** | 平台级运营后台，管理所有租户/订阅/许可证 |
| 5 | CRM | **独立保留** | 租户级管理后台，管理交易用户/资金/KYC |
| 6 | 认证方式 | Zustand store 状态 | 不用 Cookie/Token，无需 API |
| 7 | Portal/CRM/Backoffice 改动 | 仅加导航入口 + Mock 数据 | 保留所有现有功能和 UI |
| 8 | Onboarding 流程 | 简化为 1 步创建 | Demo 体验优先 |
