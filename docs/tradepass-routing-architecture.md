# TradePass 路由架构文档

## 一、系统概览 — 7 个子系统

TradePass 由三个层级、七个子系统组成：

```
                        TradePass 平台层（平台拥有者运营）
                        ┌─────────────────────────────────┐
                        │  TradePass Website（官网）        │
                        │  TradePass Console（租户控制台）  │
                        │  TradePass Backoffice（运营后台） │
                        └─────────────────────────────────┘
                                       ↓ 提供 SaaS 服务
                        ┌─────────────────────────────────┐
                        │       单个 Tenant（租户）         │
                        │  subdomain: "dupoin"             │
                        │  品牌: "Dupoin Broker"           │
                        └─────────────────────────────────┘
                                       ↓ 租户旗下业务系统
                        ┌─────────────────────────────────┐
                        │  Tenant Website（租户官网）       │
                        │  Tenant Portal（用户交易门户）    │
                        │  Tenant CRM（租户运营后台）       │
                        └─────────────────────────────────┘
```

---

## 二、域名架构（开发环境）

```
127.0.0.1  localhost                  # TradePass 平台官网
127.0.0.1  console.localhost          # Console（租户控制台）
127.0.0.1  backoffice.localhost       # Backoffice（运营后台）
127.0.0.1  dupoin.localhost           # 租户官网（示例租户）
127.0.0.1  portal.dupoin.localhost    # 租户 Portal
127.0.0.1  crm.dupoin.localhost       # 租户 CRM
```

### 生产环境映射

| 环境 | 域名模式 | 示例 |
|------|----------|------|
| 开发 | `*.localhost:3002` | `dupoin.localhost:3002` |
| 生产 | `*.tradepass.io` | `dupoin.tradepass.io` |

---

## 三、完整路由表

### 3.1 TradePass 平台层（Platform Layer）

#### [P1] TradePass Website — 平台官网

| 域名 | 路由前缀 | 说明 |
|------|----------|------|
| `localhost:3002` | `/` | 官网首页（营销页面：Hero → Problem → Platform → Architecture → Products → UseCases → Ecosystem → CTA） |
| `localhost:3002` | `/auth/login` | 平台登录 |
| `localhost:3002` | `/auth/register` | 平台注册（创建 Console 账户） |
| `localhost:3002` | `/auth/verify-email` | 邮箱验证 |
| `localhost:3002` | `/console/onboarding` | 新租户初始化向导（6 步配置） |
| `localhost:3002` | `/console/billing` | 计费页面（公开访问） |

> 路径映射：直接访问（`/console/*` 等由 middleware 或 rewrites 处理）

#### [P2] TradePass Console — 租户控制台

| 域名 | 路由 | 说明 |
|------|------|------|
| `console.localhost:3002` | `/` | 仪表盘 |
| `console.localhost:3002` | `/tenants` | 租户列表 |
| `console.localhost:3002` | `/tenants/[id]` | 租户详情（业务系统入口、产品订阅、成员管理、业务配置） |
| `console.localhost:3002` | `/products` | 产品管理 |
| `console.localhost:3002` | `/modules` | 产品矩阵 |
| `console.localhost:3002` | `/billing` | 账单管理 |
| `console.localhost:3002` | `/oauth-apps` | OAuth2 应用 |
| `console.localhost:3002` | `/api-docs` | API 文档 |

> Rewrite 规则：`console.localhost:3002/*` → `/console/*`

#### [P3] TradePass Backoffice — 平台运营后台

| 域名 | 路由 | 说明 |
|------|------|------|
| `backoffice.localhost:3002` | `/` | 运营仪表盘 |
| `backoffice.localhost:3002` | `/users` | 用户管理 |
| `backoffice.localhost:3002` | `/tenants` | 租户管理 |
| `backoffice.localhost:3002` | `/licenses` | 许可证管理 |
| `backoffice.localhost:3002` | `/billing` | 平台计费 |
| `backoffice.localhost:3002` | `/audit-logs` | 审计日志 |

> Rewrite 规则：`backoffice.localhost:3002/*` → `/backoffice/*`

---

### 3.2 租户层（Tenant Layer）

#### [T1] Tenant Website — 租户官网（原 Broker）

| 域名 | 路由 | 说明 |
|------|------|------|
| `dupoin.localhost:3002` | `/` | 租户官网首页（品牌展示） |
| `dupoin.localhost:3002` | `/auth/login` | 通用登录页（**有注册入口**） |
| `dupoin.localhost:3002` | `/auth/portal/login` | Portal 专用登录页（**有注册入口**） |
| `dupoin.localhost:3002` | `/auth/crm/login` | CRM 专用登录页（**无注册入口，仅管理员登录**） |
| `dupoin.localhost:3002` | `/auth/register` | 注册页（portal 用户注册） |
| `dupoin.localhost:3002` | `/auth/portal/register` | Portal 用户注册 |
| `dupoin.localhost:3002` | `/auth/verify-email` | 邮箱验证 |

> 此处`/auth/*` 指向的用户注册/登录页，不同类型的用户选择不同入口

#### [T2] Tenant Portal — 用户交易门户

| 域名 | 路由 | 说明 |
|------|------|------|
| `portal.dupoin.localhost:3002` | `/` | 门户首页 |
| `portal.dupoin.localhost:3002` | `/dashboard` | 交易概览 |
| `portal.dupoin.localhost:3002` | `/trading/*` | 交易系统（MT5、开仓、订单、持仓、历史） |
| `portal.dupoin.localhost:3002` | `/wallet/*` | 钱包管理（入金、出金、转账、流水） |
| `portal.dupoin.localhost:3002` | `/kyc` | KYC 认证 |
| `portal.dupoin.localhost:3002` | `/accounts/*` | 账户管理 |
| `portal.dupoin.localhost:3002` | `/settings/*` | 个人设置 |
| `portal.dupoin.localhost:3002` | `/profile` | 个人资料 |

> Rewrite 规则：`portal.dupoin.localhost:3002/*` → `/portal/*`

#### [T3] Tenant CRM — 租户运营后台

| 域名 | 路由 | 说明 |
|------|------|------|
| `crm.dupoin.localhost:3002/crm` | `/` | CRM 首页 |
| `crm.dupoin.localhost:3002/crm` | `/users` | 用户管理（管理员在此手动添加用户） |
| `crm.dupoin.localhost:3002/crm` | `/accounts` | 账户管理 |
| `crm.dupoin.localhost:3002/crm` | `/funds/*` | 资金管理 |
| `crm.dupoin.localhost:3002/crm` | `/kyc` | KYC 审核 |
| `crm.dupoin.localhost:3002/crm` | `/trading/*` | 交易管理 |
| `crm.dupoin.localhost:3002/crm` | `/risk/*` | 风控管理 |
| `crm.dupoin.localhost:3002/crm` | `/ib/*` | IB 管理 |
| `crm.dupoin.localhost:3002/crm` | `/compliance/*` | 合规管理 |
| `crm.dupoin.localhost:3002/crm` | `/marketing/*` | 营销管理 |
| `crm.dupoin.localhost:3002/crm` | `/crm/*` | CRM 内部模块 |
| `crm.dupoin.localhost:3002/crm` | `/reports/*` | 报表系统 |
| `crm.dupoin.localhost:3002/crm` | `/system/*` | 系统设置 |

> Rewrite 规则：`crm.dupoin.localhost:3002/*` → `/crm/*`

---

## 四、Middleware 路由识别逻辑

```
浏览器请求
    ↓
next.config.ts rewrites (beforeFiles)
  - portal.*.localhost → /portal/*
  - crm.*.localhost → /crm/*
  - console.localhost → /console/*
  - backoffice.localhost → /backoffice/*
    ↓
middleware detectAppFromHost()
  - localhost / 127.0.0.1                                   → app="website"
  - console.localhost                                        → app="console"
  - backoffice.localhost                                     → app="backoffice"
  - portal.{tenant}.localhost                                → app="portal"
  - crm.{tenant}.localhost                                   → app="crm"
  - {tenant}.localhost (二级子域名)                           → app="tenant-website"
    ↓
权限检查（按 app 分支）
  - website: PUBLIC_PATHS 公开，其余需要 token
  - console: PUBLIC_PATHS + onboarding 守卫
  - backoffice: 需要 token
  - portal: 无 token → 重定向到 {tenant}.localhost/auth/portal/login
  - crm: 无 token → 重定向到 {tenant}.localhost/auth/crm/login?redirect=...
  - tenant-website: 公开页面可访问，其余需要 token
```

---

## 五、认证与登录关系

### 5.1 三种认证场景

```
场景 A：成为平台管理员
┌─────────────────────────────────────────────────────────┐
│ TradePass Website (localhost:3002)                       │
│  /auth/register → 创建 Console 账户 → 创建 Tenant       │
│  /auth/login    → 进入 Console 管理租户                   │
│  注册后 → /console/onboarding → 6步配置 → /console      │
└─────────────────────────────────────────────────────────┘

场景 B：成为 Portal 用户
┌─────────────────────────────────────────────────────────┐
│ Tenant Website (dupoin.localhost:3002)                   │
│  /auth/portal/login → 有注册入口                         │
│  /auth/portal/register → 注册                           │
│  注册/登录后 → 跳转到 portal.dupoin.localhost:3002       │
│                                                        │
│ 入口：从 Console 租户详情页点击"Portal 门户"             │
│      从租户官网点击"登录"                                │
└─────────────────────────────────────────────────────────┘

场景 C：成为 CRM 运营人员
┌─────────────────────────────────────────────────────────┐
│ Tenant Website (dupoin.localhost:3002)                   │
│  /auth/crm/login → 仅有登录，无注册入口                  │
│  账户由管理员在 CRM 员工管理中手动添加                    │
│  登录后 → 跳转到 crm.dupoin.localhost:3002/crm          │
│                                                        │
│ 入口：从 Console 租户详情页点击"CRM 后台"                │
│      直接访问 crm.dupoin.localhost:3002/crm              │
└─────────────────────────────────────────────────────────┘
```

### 5.2 Cookie 共享

```
所有认证 cookie 设置 domain=".localhost"
  ↓
console.localhost          ✓ 读取 token（已登录）
dupoin.localhost           ✓ 读取 token（已登录）
portal.dupoin.localhost    ✓ 读取 token（已登录）
crm.dupoin.localhost       ✓ 读取 token（已登录）
backoffice.localhost       ✓ 读取 token（已登录）
```

---

## 六、用户身份类型

| 身份 | 登录入口 | 注册方式 | 可访问系统 |
|------|----------|----------|-----------|
| **平台管理员** | `localhost:3002/auth/login` | 官网注册 | Console, Backoffice |
| **Portal 用户** | `{tenant}.localhost:3002/auth/portal/login` | Portal 注册页 | Portal |
| **CRM 运营人员** | `{tenant}.localhost:3002/auth/crm/login` | 管理员在 CRM 后台添加 | CRM |

---

## 七、从属关系

```
TradePass 平台（拥有者/运营商）
│
├── Website (localhost:3002)
│   └── 平台营销展示
│
├── Console (console.localhost:3002)
│   └── 管理所有 Tenant
│       ├── 创建/管理租户
│       ├── 产品订阅
│       └── 成员管理
│
├── Backoffice (backoffice.localhost:3002)
│   └── 平台运营管理
│       ├── 全局用户管理
│       ├── 许可证管理
│       └── 审计日志
│
└── Tenant (如 dupoin)
    ├── Website ({tenant}.localhost:3002)
    │   ├── 租户品牌官网
    │   ├── 用户登录/注册入口
    │   └── CRM 登录入口
    │
    ├── Portal (portal.{tenant}.localhost:3002)
    │   ├── 终端用户交易门户
    │   ├── 资金管理
    │   └── KYC 认证
    │
    └── CRM (crm.{tenant}.localhost:3002/crm)
        ├── 用户管理（管理员添加用户）
        ├── 资金与交易管理
        ├── KYC 审核/风控/合规
        └── 营销/报表/系统设置
```

---

## 八、URL 构建规则（在 Console 租户详情页）

```typescript
// 当前访问域: console.localhost:3002
const host = "console.localhost:3002";
const mainDomain = host.replace(/^[^.]+\./, ""); // → "localhost:3002"
const tenantSubdomain = "dupoin";

const websiteUrl = `http://${tenantSubdomain}.${mainDomain}`;
// → http://dupoin.localhost:3002

const portalUrl = `http://portal.${tenantSubdomain}.${mainDomain}`;
// → http://portal.dupoin.localhost:3002

const crmUrl = `http://crm.${tenantSubdomain}.${mainDomain}/crm`;
// → http://crm.dupoin.localhost:3002/crm
```
