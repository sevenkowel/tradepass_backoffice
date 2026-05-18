# Breadcrumb 面包屑 UI 规范

> **基准页面**: `/crm/clm/review-queue`  
> **生效范围**: 所有 `/crm/**/*` 页面

---

## 1. 标准模式

```tsx
// 导入
import { Breadcrumb } from "@/components/crm/layout";

// 使用：必须在 PageHeader 之前
<div className="space-y-3">
  <Breadcrumb items={[{ label: "CLM Center" }, { label: "Review Queue" }]} />
  <PageHeader title="Review Queue" description="..." />
  ...
</div>
```

**规则：**
- `items[0]`: 一级模块名，英文，首字母大写
- `items[1]`: 当前页面名，英文，首字母大写
- 不使用 `t()` / i18n key（面包屑是导航结构标识，不是用户文案）
- 不使用中文标签
- 始终放在 `PageHeader` 之前，外层用 `space-y-3` 或 `space-y-4` 容器

---

## 2. 组件行为 (Breadcrumb.tsx)

- 自动渲染 Home 图标（链接到 `/crm`）
- 最后一级自动渲染为 `<h1>`（`text-lg font-semibold text-slate-900`）
- 中间级渲染为 `<Link>`（`text-xs text-slate-500`）
- 超过 2 级时自动生成中间链接
- 不提供 `items` 时从 `pathname` 自动生成

---

## 3. 模块英文名称表

| 模块 | 英文名称 | 适用范围 |
|---|---|---|
| Clients | `Clients` | `/crm/clients/**` |
| KYC Center | `KYC Center` | `/crm/kyc/**` |
| CLM Center | `CLM Center` | `/crm/clm/**` |
| Risk Center | `Risk Center` | `/crm/risk/**` |
| Compliance | `Compliance` | `/crm/compliance/**` |
| Funds | `Funds` | `/crm/funds/**` |
| Trading | `Trading` | `/crm/trading/**` |
| Users | `Users` | `/crm/users/**` |
| Accounts | `Accounts` | `/crm/accounts/**` |
| Marketing | `Marketing` | `/crm/marketing/**` |
| IB / Commission | `IB / Commission` | `/crm/ib/**` |
| Reports | `Reports` | `/crm/reports/**` |
| Support | `Support` | `/crm/crm/**` |
| System | `System` | `/crm/system/**` |
| Dashboard | `Dashboard` | `/crm/monitor`, `/crm/funnel` |
| Business Config | `Business Config` | `/crm/business-config` |

---

## 4. 各页面具体规范

### Clients

| 页面 | items 参数 |
|---|---|
| Client List | `[{ label: "Clients" }, { label: "Client List" }]` |
| Relationships | `[{ label: "Clients" }, { label: "Relationships" }]` |
| Lifecycle | `[{ label: "Clients" }, { label: "Lifecycle" }]` |
| Tags | `[{ label: "Clients" }, { label: "Tags" }]` |
| Notes | `[{ label: "Clients" }, { label: "Notes" }]` |
| Segments | `[{ label: "Clients" }, { label: "Segments" }]` |

### KYC Center

| 页面 | items 参数 |
|---|---|
| Review Queue | `[{ label: "KYC Center" }, { label: "Review Queue" }]` |
| POA Review | `[{ label: "KYC Center" }, { label: "POA Review" }]` |
| Liveness Review | `[{ label: "KYC Center" }, { label: "Liveness Review" }]` |
| Resubmission | `[{ label: "KYC Center" }, { label: "Resubmission" }]` |
| KYC Levels | `[{ label: "KYC Center" }, { label: "KYC Levels" }]` |
| Agreement Docs | `[{ label: "KYC Center" }, { label: "Agreement Docs" }]` |
| Review Policy | `[{ label: "KYC Center" }, { label: "Review Policy" }]` |
| Compliance Archive | `[{ label: "KYC Center" }, { label: "Compliance Archive" }]` |

### CLM Center

| 页面 | items 参数 |
|---|---|
| Review Queue | `[{ label: "CLM Center" }, { label: "Review Queue" }]` |
| Workspace | `[{ label: "CLM Center" }, { label: "Workspace" }]` |
| Cases | `[{ label: "CLM Center" }, { label: "Cases" }]` |
| Case Detail | `[{ label: "CLM Center" }, { label: "Cases", href: "/crm/clm/cases" }, { label: "{caseNo}" }]` |
| Agreements | `[{ label: "CLM Center" }, { label: "Agreements" }]` |
| Rules Engine | `[{ label: "CLM Center" }, { label: "Rules Engine" }]` |
| Audit Trail | `[{ label: "CLM Center" }, { label: "Audit Trail" }]` |
| SLA & Monitoring | `[{ label: "CLM Center" }, { label: "SLA & Monitoring" }]` |
| Re-Verification → Requests | `[{ label: "CLM Center" }, { label: "Re-Verification", href: "/crm/clm/re-verification/requests" }, { label: "Requests" }]` |
| Re-Verification → Templates | `[{ label: "CLM Center" }, { label: "Re-Verification", href: "/crm/clm/re-verification/templates" }, { label: "Templates" }]` |
| Re-Verification → History | `[{ label: "CLM Center" }, { label: "Re-Verification", href: "/crm/clm/re-verification/history" }, { label: "History" }]` |
| System Modules | `[{ label: "CLM Center" }, { label: "System Modules" }]` |
| KYC Flows | `[{ label: "CLM Center" }, { label: "KYC Flows" }]` |

### Risk Center

| 页面 | items 参数 |
|---|---|
| High-Risk Clients | `[{ label: "Risk Center" }, { label: "High-Risk Clients" }]` |
| Relationship Graph | `[{ label: "Risk Center" }, { label: "Relationship Graph" }]` |
| Scoring Policy | `[{ label: "Risk Center" }, { label: "Scoring Policy" }]` |
| Risk Rules | `[{ label: "Risk Center" }, { label: "Risk Rules" }]` |
| Device & Security | `[{ label: "Risk Center" }, { label: "Device & Security" }]` |
| Negative Balance | `[{ label: "Risk Center" }, { label: "Negative Balance Protection" }]` |
| Margin Alerts | `[{ label: "Risk Center" }, { label: "Margin Alerts" }]` |

### Compliance

| 页面 | items 参数 |
|---|---|
| KYC Review | `[{ label: "Compliance" }, { label: "KYC Review" }]` |
| Blacklist | `[{ label: "Compliance" }, { label: "Blacklist" }]` |
| Risk Alerts | `[{ label: "Compliance" }, { label: "Risk Alerts" }]` |

### Funds

| 页面 | items 参数 |
|---|---|
| Withdrawal Review | `[{ label: "Funds" }, { label: "Withdrawal Review" }]` |
| Deposits | `[{ label: "Funds" }, { label: "Deposits" }]` |
| Transactions | `[{ label: "Funds" }, { label: "Transactions" }]` |
| Payment Channels | `[{ label: "Funds" }, { label: "Payment Channels" }]` |

### Trading

| 页面 | items 参数 |
|---|---|
| Trading Settings | `[{ label: "Trading" }, { label: "Settings" }]` |
| Instruments | `[{ label: "Trading" }, { label: "Instruments" }]` |

### Users

| 页面 | items 参数 |
|---|---|
| User List | `[{ label: "Users" }, { label: "User List" }]` |
| User Tags | `[{ label: "Users" }, { label: "User Tags" }]` |
| User Levels | `[{ label: "Users" }, { label: "User Levels" }]` |

### Accounts

| 页面 | items 参数 |
|---|---|
| Account Groups | `[{ label: "Accounts" }, { label: "Account Groups" }]` |
| Leverage Settings | `[{ label: "Accounts" }, { label: "Leverage Settings" }]` |

### Marketing

| 页面 | items 参数 |
|---|---|
| Campaigns | `[{ label: "Marketing" }, { label: "Campaigns" }]` |
| Messages | `[{ label: "Marketing" }, { label: "Messages" }]` |
| News | `[{ label: "Marketing" }, { label: "News" }]` |
| Banners | `[{ label: "Marketing" }, { label: "Banners" }]` |

### IB / Commission

| 页面 | items 参数 |
|---|---|
| Referral Tree | `[{ label: "IB / Commission" }, { label: "Referral Tree" }]` |
| Commission Records | `[{ label: "IB / Commission" }, { label: "Commission Records" }]` |
| Commission Settings | `[{ label: "IB / Commission" }, { label: "Settings" }]` |

### Reports

| 页面 | items 参数 |
|---|---|
| Financial Reports | `[{ label: "Reports" }, { label: "Financial Reports" }]` |
| User Reports | `[{ label: "Reports" }, { label: "User Reports" }]` |
| Trading Reports | `[{ label: "Reports" }, { label: "Trading Reports" }]` |

### Support

| 页面 | items 参数 |
|---|---|
| Tickets | `[{ label: "Support" }, { label: "Tickets" }]` |
| Feedback | `[{ label: "Support" }, { label: "Feedback" }]` |
| Logs | `[{ label: "Support" }, { label: "Logs" }]` |

### System

| 页面 | items 参数 |
|---|---|
| Operation Logs | `[{ label: "System" }, { label: "Operation Logs" }]` |
| API Management | `[{ label: "System" }, { label: "API Management" }]` |
| Auth Config | `[{ label: "System" }, { label: "Auth Config" }]` |

### Dashboard

| 页面 | items 参数 |
|---|---|
| Monitor | `[{ label: "Dashboard" }, { label: "Monitor" }]` |
| Funnel | `[{ label: "Dashboard" }, { label: "Conversion Funnel" }]` |

---

## 5. 反例（不要这样写）

```tsx
// ❌ 中文标签
<Breadcrumb items={[{ label: "用户管理" }, { label: "用户列表" }]} />

// ❌ i18n key
<Breadcrumb items={[{ label: t("clients.crumb.root") }, { label: t("clients.crumb.notes") }]} />

// ❌ 只有注释没有实现
{/* Breadcrumb */}

// ❌ 没有导入
// (缺少 import { Breadcrumb } from "@/components/crm/layout";)
```
