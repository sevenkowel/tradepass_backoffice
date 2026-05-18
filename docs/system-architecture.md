# TradePass 系统架构文档

## 概述

TradePass 是一个外汇保证金交易平台，采用 **SaaS + 多租户** 架构，为经纪商提供完整的交易基础设施。系统分为 **平台层** 和 **租户层** 两大层级。

---

## 一、六大系统概览

| 系统 | 层级 | 目标用户 | 核心功能 | 访问路径 |
|------|------|---------|---------|---------|
| **平台官网** | 平台层 | 潜在客户 | 产品介绍、定价、注册引导 | `/` |
| **Console** | 平台层 | 平台管理员 | 租户管理、系统配置、运营监控 | `/console` |
| **Backoffice** | 平台层 | 平台管理员 | 用户管理、License管理、计费审计 | `/backoffice` |
| **Broker 官网** | 租户层 | 终端客户 | 经纪商品牌展示、开户引导 | `/broker` |
| **Portal** | 租户层 | 交易员 | 交易终端、账户管理、出入金 | `/portal/dashboard` |
| **CRM** | 租户层 | 经纪商运营 | 客户管理、KYC审批、风控监控 | `/crm` |

---

## 二、系统关系图

```
┌─────────────────────────────────────────────────────────────────┐
│                         平台层 (TradePass)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   平台官网    │  │   Console    │  │  Backoffice  │          │
│  │   (营销)     │  │  (租户管理)   │  │  (平台管理)   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│         │                 │                 │                   │
│         ▼                 ▼                 ▼                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              平台管理员 (Super Admin)                    │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ 创建/管理
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        租户层 (Broker)                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Broker 官网  │  │    Portal    │  │     CRM      │          │
│  │   (品牌展示)  │  │  (交易终端)   │  │  (运营管理)   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│         │                 │                 │                   │
│         ▼                 ▼                 ▼                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              经纪商团队 (Broker Team)                    │   │
│  │         ┌─────────┐    ┌─────────┐    ┌─────────┐      │   │
│  │         │  运营   │    │  风控   │    │  客服   │      │   │
│  │         └─────────┘    └─────────┘    └─────────┘      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│                              │ 服务                             │
│                              ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                 终端交易员 (Trader)                      │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 三、核心实体关系

### 3.1 实体关系图

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│    User     │───────│   Tenant    │───────│   License   │
│  (平台用户)  │  1:N  │   (租户)    │  1:N  │   (许可证)   │
└─────────────┘       └──────┬──────┘       └─────────────┘
                             │
                             │ 1:N
                             ▼
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   Product   │───────│  Subscription│───────│    Plan     │
│   (产品)    │  1:N  │   (订阅)    │  N:1  │  (套餐)     │
└─────────────┘       └─────────────┘       └─────────────┘
                             │
                             │ 1:N
                             ▼
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│    Module   │───────│TenantModule │───────│   Feature   │
│  (功能模块)  │  N:M  │ (租户模块)  │       │  (功能特性)  │
└─────────────┘       └─────────────┘       └─────────────┘
```

### 3.2 实体详解

#### User (平台用户)
- **定义**: TradePass 平台的注册用户
- **角色类型**:
  - `super_admin`: 平台超级管理员
  - `platform_admin`: 平台管理员
  - `broker_manager`: 经纪商经理
  - `trader`: 交易员
- **关键字段**: id, email, role, status, kycStatus

#### Tenant (租户/经纪商)
- **定义**: 使用 TradePass 平台服务的经纪商
- **状态**: `trial` (试用) | `active` (活跃) | `suspended` (暂停)
- **关键字段**: id, name, subdomain, ownerId, status, brandConfig
- **关系**:
  - 一个租户对应一个 Owner (User)
  - 一个租户可以有多个成员 (TenantMember)
  - 一个租户可以有多个 License

#### License (许可证)
- **定义**: 租户的产品使用授权
- **产品代码**: `trade_pass_business` | `trade_pass_pro`
- **状态**: `active` | `expired` | `suspended`
- **关键字段**: tenantId, productCode, status, validFrom, validTo

#### Product (产品)
- **定义**: TradePass 提供的产品线
- **示例**: TradePass Business, TradePass Pro
- **关系**: 一个产品包含多个 Plan (套餐)

#### Plan (套餐)
- **定义**: 产品的定价方案
- **计费周期**: `monthly` | `yearly`
- **关键字段**: productId, name, price, billingCycle, features

#### Subscription (订阅)
- **定义**: 租户的产品订阅记录
- **状态**: `active` | `cancelled` | `expired`
- **关键字段**: tenantId, planId, status, currentPeriodStart, currentPeriodEnd

#### Module (功能模块)
- **定义**: 系统的功能模块单元
- **示例**: `trading`, `kyc`, `payments`, `crm`, `reports`
- **关系**: 通过 TenantModule 与租户关联

#### TenantModule (租户模块配置)
- **定义**: 租户对模块的启用/配置状态
- **关键字段**: tenantId, moduleId, enabled, config

---

## 四、六大系统详细设计

### 4.1 平台官网 (Marketing Site)

**目标**: 吸引潜在客户，引导注册

**核心页面**:
| 路由 | 功能 |
|------|------|
| `/` | 首页 - 产品价值主张 |
| `/pricing` | 定价页面 |
| `/about` | 关于我们 |
| `/contact` | 联系我们 |
| `/broker` | 经纪商方案介绍 |
| `/auth/login` | 登录 |
| `/auth/register` | 注册 |

**用户流程**:
```
访客 → 官网 → 注册 → Console (创建租户) → 开通服务
```

---

### 4.2 Console (租户控制台)

**目标**: 租户自助管理平台

**核心页面**:
| 路由 | 功能 |
|------|------|
| `/console` | 仪表盘 - 租户概览、引导检查清单 |
| `/console/onboarding` | 初始化引导 |
| `/console/tenants/new` | 创建新租户 |
| `/console/tenants/:id` | 租户详情 |
| `/console/billing` | 计费管理 |
| `/console/settings` | 账户设置 |

**用户流程**:
```
注册 → Console → 创建租户 → 配置品牌 → 开通服务 → 访问 Portal/CRM
```

**关键功能**:
- 租户创建与配置
- 品牌自定义 (Logo、主题色)
- 套餐升级/降级
- 账单管理

---

### 4.3 Backoffice (平台管理后台)

**目标**: 平台运营人员管理整个系统

**核心页面**:
| 路由 | 功能 |
|------|------|
| `/backoffice` | 仪表盘 - 平台级 KPI |
| `/backoffice/users` | 用户管理 |
| `/backoffice/tenants` | 租户管理 |
| `/backoffice/licenses` | License 管理 |
| `/backoffice/billing` | 计费管理 |
| `/backoffice/audit-logs` | 审计日志 |

**权限**: 仅平台管理员可访问

**关键功能**:
- 租户审核与开通
- License 发放与管理
- 收入统计
- 系统级配置

---

### 4.4 Broker 官网 (租户营销站点)

**目标**: 经纪商展示品牌形象，吸引终端客户开户

**核心页面**:
| 路由 | 功能 |
|------|------|
| `/broker` | 经纪商首页 |
| `/broker/about` | 关于经纪商 |
| `/broker/products` | 交易产品 |
| `/broker/pricing` | 点差/佣金 |
| `/broker/contact` | 联系方式 |
| `/auth/portal/login` | 客户登录 |
| `/auth/portal/register` | 客户开户 |

**特点**:
- 支持子域名访问 (如 `dupoin.tradepass.com`)
- 品牌自定义 (Logo、颜色、文案)
- 与 Portal 无缝集成

---

### 4.5 Portal (交易客户端)

**目标**: 交易员进行账户管理和交易操作

**核心页面**:
| 路由 | 功能 |
|------|------|
| `/portal/dashboard` | 账户总览 |
| `/portal/trading/terminal` | 交易终端 |
| `/portal/accounts` | 账户管理 |
| `/portal/wallets` | 钱包管理 |
| `/portal/payments/deposit` | 入金 |
| `/portal/payments/withdraw` | 出金 |
| `/portal/kyc` | 身份认证 |
| `/portal/history` | 交易历史 |
| `/portal/settings` | 账户设置 |

**访问方式**:
- 路径模式: `/portal/*`
- 子域名模式: `portal.{tenant}.tradepass.com/*`

**关键功能**:
- 多账户管理
- 实时行情与交易
- 出入金操作
- KYC 认证流程
- 风险监控

---

### 4.6 CRM (经纪商运营后台)

**目标**: 经纪商运营团队管理客户和业务

**核心页面**:
| 路由 | 功能 |
|------|------|
| `/crm` | 仪表盘 - 业务概览 |
| `/crm/accounts` | 客户账户管理 |
| `/crm/users` | 用户管理 |
| `/crm/funds/deposits` | 入金审核 |
| `/crm/funds/withdrawals` | 出金审核 |
| `/crm/compliance/kyc` | KYC 审批 |
| `/crm/trading/orders` | 订单监控 |
| `/crm/risk/exposure` | 风险敞口 |
| `/crm/reports/financial` | 财务报表 |
| `/crm/marketing/campaigns` | 营销活动 |
| `/crm/settings` | 系统设置 |

**访问方式**:
- 路径模式: `/crm/*`
- 子域名模式: `crm.{tenant}.tradepass.com/*`

**关键功能**:
- 客户全生命周期管理
- KYC 审批工作流
- 出入金审核
- 风险监控与预警
- 营销自动化
- 数据分析报表

---

## 五、路由映射表

### 5.1 开发环境路由 (localhost:3001)

| 系统 | 路由 | 实际路径 | 备注 |
|------|------|---------|------|
| 平台官网 | `/` | `src/app/page.tsx` | 营销首页 |
| Console | `/console` | `src/app/console/page.tsx` | 租户控制台 |
| Console | `/console/onboarding` | `src/app/console/onboarding/page.tsx` | 初始化引导 |
| Backoffice | `/backoffice` | `src/app/backoffice/page.tsx` | 平台管理 |
| Broker 官网 | `/broker` | `src/app/broker/page.tsx` | 经纪商展示 |
| Portal | `/portal/dashboard` | `src/app/portal/dashboard/page.tsx` | 交易客户端 |
| Portal | `/portal/trading/terminal` | `src/app/portal/trading/terminal/page.tsx` | 交易终端 |
| CRM | `/crm` | `src/app/crm/page.tsx` | 运营后台 |
| CRM | `/crm/compliance/kyc` | `src/app/crm/compliance/kyc/page.tsx` | KYC审批 |

### 5.2 生产环境子域名路由

| 系统 | 子域名模式 | 示例 |
|------|-----------|------|
| 平台官网 | `tradepass.com` | `tradepass.com` |
| Console | `console.tradepass.com` | `console.tradepass.com` |
| Backoffice | `backoffice.tradepass.com` | `backoffice.tradepass.com` |
| Broker 官网 | `{tenant}.tradepass.com` | `dupoin.tradepass.com` |
| Portal | `portal.{tenant}.tradepass.com` | `portal.dupoin.tradepass.com` |
| CRM | `crm.{tenant}.tradepass.com` | `crm.dupoin.tradepass.com` |

---

## 六、数据流向

### 6.1 租户开通流程

```
用户注册
    │
    ▼
Console (创建租户)
    │
    ▼
选择套餐 → 生成 License
    │
    ▼
配置品牌 (Logo、主题色、域名)
    │
    ▼
开通服务 (Broker 官网、Portal、CRM)
    │
    ▼
终端客户访问 Broker 官网开户 → 使用 Portal 交易
```

### 6.2 交易流程

```
终端客户 (Trader)
    │
    ├─→ Broker 官网 (开户)
    │
    ├─→ Portal (入金)
    │       │
    │       ▼
    │   CRM (入金审核)
    │       │
    │       ▼
    │   Portal (交易)
    │       │
    │       ▼
    │   Portal (出金)
    │       │
    │       ▼
    │   CRM (出金审核)
    │
    └─→ CRM (KYC 认证)
```

---

## 七、权限模型

### 7.1 平台层权限

| 角色 | 平台官网 | Console | Backoffice |
|------|---------|---------|-----------|
| 访客 | ✅ | ❌ | ❌ |
| 注册用户 | ✅ | ✅ | ❌ |
| 平台管理员 | ✅ | ✅ | ✅ |

### 7.2 租户层权限

| 角色 | Broker 官网 | Portal | CRM |
|------|------------|--------|-----|
| 访客 | ✅ | ❌ | ❌ |
| 交易员 | ✅ | ✅ | ❌ |
| 经纪商经理 | ✅ | ✅ | ✅ |
| 经纪商管理员 | ✅ | ✅ | ✅ |

---

## 八、技术实现要点

### 8.1 多租户隔离

- **数据隔离**: 所有租户相关表包含 `tenantId` 字段
- **品牌隔离**: 通过 `portal_tenant` cookie 识别当前租户
- **子域名解析**: Middleware 根据 Host 头路由到对应系统

### 8.2 认证机制

- **Demo 模式**: 所有系统开放访问，使用默认用户
- **生产模式**: JWT Token + Cookie 认证
- **权限控制**: Middleware 拦截 + 组件级权限检查

### 8.3 路由重写规则

```typescript
// next.config.ts
async rewrites() {
  return {
    beforeFiles: [
      // Portal 子域名 → /portal/*
      {
        source: "/:path*",
        has: [{ type: "host", value: "portal.(?<tenant>[^.]+).localhost:3002" }],
        destination: "/portal/:path*",
      },
      // CRM 子域名 → /crm/*
      {
        source: "/:path*",
        has: [{ type: "host", value: "crm.(?<tenant>[^.]+).localhost:3002" }],
        destination: "/crm/:path*",
      },
    ],
  };
}
```

---

## 九、部署架构

```
┌─────────────────────────────────────────────────────────┐
│                      CDN / WAF                           │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                   Load Balancer                          │
└─────────────────────────────────────────────────────────┘
                            │
            ┌───────────────┼───────────────┐
            ▼               ▼               ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   Next.js App   │ │   Next.js App   │ │   Next.js App   │
│   (Instance 1)  │ │   (Instance 2)  │ │   (Instance 3)  │
└─────────────────┘ └─────────────────┘ └─────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│              Database (PostgreSQL)                       │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐      │
│  │  Users  │ │ Tenants │ │ Licenses│ │  Trades │      │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘      │
└─────────────────────────────────────────────────────────┘
```

---

## 十、总结

TradePass 采用 **平台 + 租户** 的双层架构：

1. **平台层** (3个系统): 官网、Console、Backoffice - 服务于平台运营
2. **租户层** (3个系统): Broker 官网、Portal、CRM - 服务于经纪商及其客户

六大系统通过 **租户 ID** 关联，形成完整的交易生态闭环。每个系统都有明确的职责边界和用户群体，共同构成一个功能完整的外汇保证金交易平台。
