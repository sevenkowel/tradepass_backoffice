# CRM KYC Center 改造实施计划

> 基于 CLM Center 产品方案 v1.0.1，结合现有 CRM 实现状态
> Version: v1.0 | 日期: 2026-05-08 | 状态: 待评审

---

## 1. 执行摘要

### 1.1 核心结论

当前 CRM 的 KYC 实现处于**原型验证阶段**，页面效果和功能深度远未达到 Broker SaaS 合规后台的要求。本计划将现有 `KYC Center` 按 CLM Center 方案进行全面改造，从"功能列表式后台"升级为"以 Case 为核心的合规工作流操作系统"。

### 1.2 改造范围

| 维度 | 当前状态 | 目标状态 |
|------|---------|---------|
| 菜单结构 | 9 个子项混排（审核+配置不分） | Operations 6 项 + Configuration 6 项，清晰隔离 |
| 核心对象 | KYC 记录（以用户为中心） | CLM Case（以审核任务为中心） |
| 审核入口 | Client Detail 内嵌 KYC Tab | 独立 Review Queue + Case Detail |
| 工作流 | 无（仅有 approve/reject/resubmit） | 完整 Case 生命周期 + SLA + 自动路由 |
| 风控视角 | 仅 OCR mismatch 提示 | 综合风险评分 + AML + 设备 + 资金风险 |
| 审计追踪 | Client Detail 内简单 Audit Log | 全局 Audit Trail，所有动作可追溯 |
| 运营监控 | 无 | SLA & Monitoring 看板 |

### 1.3 实施节奏

| Phase | 周期 | 交付物 |
|-------|------|--------|
| Phase 1 | 1 周 | Workspace + Review Queue + Case Detail（核心工作流） |
| Phase 2 | 1 周 | Cases 列表 + Customers 合规档案 + SLA & Monitoring |
| Phase 3 | 1 周 | Audit Trail + Configuration 全模块 |

---

## 2. 现状痛点分析

### 2.1 当前实现清单

```text
src/
├── app/crm/clients/[id]/tabs/KYCTab.tsx          # Client Detail 内嵌 KYC Tab（简陋）
├── components/crm/ui/KYCStatusBadge.tsx            # 状态徽章
├── lib/kyc/use-kyc-system-config.ts                # KYC 系统配置 hook
├── lib/crm/mock-kyc.ts                             # 5 条 mock 数据（UserKYC 类型）
├── lib/crm/services/kyc.service.ts                 # list/get/approve/reject/requestResubmit
└── types/backoffice/client-detail.ts               # 已有较完整类型定义
```

### 2.2 逐项痛点

#### 2.2.1 KYCTab.tsx — 页面效果太差

| 问题 | 当前表现 | CLM 要求 |
|------|---------|---------|
| 文档展示 | 纯色占位块 + "KYC 证件图片占位" 文案 | 真实图片预览 + OCR 高亮对比 |
| OCR 对比 | 简单 key-value 列表 | 字段级置信度 + mismatch 高亮 + 编辑确认 |
| 风险指标 | 只有 level + description | 多维度风险面板（AML/设备/IP/资金/多账户） |
| 审核操作 | 4 个并排按钮，无确认无记录 | Decision Panel + 二次确认 + 理由必填 + 自动记审计 |
| 时间线 | 无 | Case 完整生命周期时间线 |
| 评论协作 | 无 | 内部评论 + @同事 |

**判定：KYCTab 不是"需要优化"，而是"需要被 Case Detail 页面替代"。**

#### 2.2.2 kyc.service.ts — 能力太薄

```typescript
// 当前只有：list / getById / approve / reject / requestResubmit
// 缺少：
// - Case 创建（由系统自动触发）
// - 指派/转派
// - 升级
// - 批量操作
// - SLA 计算
// - 自动审核规则执行
// - 审计日志写入
```

#### 2.2.3 mock-kyc.ts — 数据模型与 CLM 不匹配

当前 `UserKYC` 类型面向 Portal 用户提交侧，而 CLM 需要 `CLMCase` 面向审核侧。两者字段和视角完全不同。

#### 2.2.4 菜单结构 — 审核与配置混排

当前 `KYC Center` 9 个子项同层排列，审核员和配置管理员看到同样的菜单，角色边界模糊。

---

## 3. Gap 总表：当前实现 vs CLM Center 方案

### 3.1 Operations 域 Gap

| 模块 | 当前实现 | CLM 要求 | 差距 | Phase |
|------|---------|---------|------|-------|
| Workspace | ❌ 无 | KPI + Queue Summary + Risk Alerts + My Tasks | 🔴 全新 | P1 |
| Review Queue | ❌ 无（仅在 Client Detail KYC Tab 展示） | 统一审核队列，支持筛选/排序/批量/智能排序 | 🔴 全新 | P1 |
| Case Detail | ❌ 无（KYCTab 简陋） | Case Header + Customer Snapshot + Materials + Risk + Decision + Comments + Timeline + Audit | 🔴 全新 | P1 |
| Cases 列表 | ❌ 无 | 全量 Case 生命周期管理，支持状态筛选 | 🔴 全新 | P2 |
| Customers | ✅ 已有 Client List + Detail | 需增强为"合规档案"视角（KYC Status / Risk Profile / Cases） | 🟡 增强 | P2 |
| SLA & Monitoring | ❌ 无 | KPI 看板 + Queue Backlog + Reviewer Performance + Automation Health + Alerts | 🔴 全新 | P2 |
| Audit Trail | ✅ Client Detail 有 Audit Log Tab | 需提取为全局模块，增强筛选和导出 | 🟡 增强 | P3 |

### 3.2 Configuration 域 Gap

| 模块 | 当前实现 | CLM 要求 | 差距 | Phase |
|------|---------|---------|------|-------|
| KYC Policies | ❌ 无 | IF/THEN Rule Builder + 测试模拟 | 🔴 全新 | P3 |
| KYC Levels | ✅ 已有 `/crm/kyc/levels` 路由占位 | 需实现权限矩阵 + 自动/手动升降级 | 🟡 增强 | P3 |
| Forms & Fields | ✅ 已有 `/crm/kyc/config` 路由占位 | 需实现 Form Builder | 🟡 增强 | P3 |
| Compliance Templates | ❌ 无 | 监管模板 + 版本管理 | 🔴 全新 | P3 |
| Agreements | ✅ 已有 `/crm/kyc/agreements` 路由占位 | 需实现富文本编辑 + 多语言 + 强制重签 | 🟡 增强 | P3 |
| Workflow Settings | ❌ 无 | 路由规则 + SLA 规则 + 升级规则 + 自动化 | 🔴 全新 | P3 |

### 3.3 数据模型 Gap

当前 `client-detail.ts` 已定义 `CaseItem`、`AuditLog`、`KYCDocument` 等类型，但字段和状态与 CLM 方案不完全匹配。

| 类型 | 当前 | CLM 要求 | 操作 |
|------|------|---------|------|
| `CaseType` | 4 种（kyc_review / withdrawal_review / resubmission_review / video_verification） | 10 种（+ poa / liveness / edd / source_of_wealth / agreement_signing / risk_recheck / manual_review） | 扩展枚举 |
| `CaseStatus` | 5 种（pending / in_review / approved / rejected / escalated） | 10 种（+ resubmission / auto_approved / auto_rejected / cancelled / expired） | 扩展枚举 |
| `CLMCase` | 无此类型（只有 `CaseItem`） | 需新增 `CLMCase`，包含 caseNo / riskLevel / amlStatus / triggerSource / slaDueAt / assignee | 新增 |
| `CLMCustomer` | 无（复用 `BackofficeUser`） | 需新增合规档案视角类型 | 新增 |
| `KYCPolicy` | 无 | 策略规则引擎类型 | 新增 |
| `AuditLog` | 有（但面向 Client） | 需扩展为全局审计（targetType 支持 case/policy/workflow 等） | 扩展 |

---

## 4. 信息架构重组

### 4.1 新菜单结构

```text
CLM Center（原 KYC Center 改名）
│
├─ Operations
│   ├── Workspace              /crm/clm/workspace              [P1]
│   ├── Review Queue           /crm/clm/review-queue           [P1]
│   ├── Cases                  /crm/clm/cases                  [P2]
│   ├── Customers              /crm/clm/customers              [P2]
│   ├── SLA & Monitoring       /crm/clm/sla-monitoring         [P2]
│   └── Audit Trail            /crm/clm/audit-trail            [P3]
│
└─ Configuration
    ├── KYC Policies           /crm/clm/policies               [P3]
    ├── KYC Levels             /crm/clm/levels                 [P3]
    ├── Forms & Fields         /crm/clm/forms                  [P3]
    ├── Compliance Templates   /crm/clm/templates              [P3]
    ├── Agreements             /crm/clm/agreements             [P3]
    └── Workflow Settings      /crm/clm/workflows              [P3]
```

### 4.2 与现有路由的兼容

| 现有路由 | 处理方式 |
|---------|---------|
| `/crm/kyc/review` | 重定向到 `/crm/clm/review-queue` |
| `/crm/kyc/resubmit` | 合并到 Review Queue 的 Resubmission Filter |
| `/crm/kyc/liveness-review` | 合并到 Review Queue 的 Liveness Filter |
| `/crm/kyc/poa-review` | 合并到 Review Queue 的 POA Filter |
| `/crm/kyc/archive` | 迁移到 `/crm/clm/audit-trail` |
| `/crm/kyc/config` | 迁移到 `/crm/clm/forms` |
| `/crm/kyc/levels` | 迁移到 `/crm/clm/levels` |
| `/crm/kyc/review-policy` | 迁移到 `/crm/clm/policies` |
| `/crm/kyc/agreements` | 迁移到 `/crm/clm/agreements` |
| `/crm/clients/[id]` KYC Tab | 保留但增强（与 Case Detail 双向跳转） |

---

## 5. 数据模型设计

### 5.1 CLMCase（核心）

```typescript
// src/types/clm/case.ts

export type CLMCaseType =
  | "kyc"
  | "poa"
  | "liveness"
  | "video_verification"
  | "withdrawal_review"
  | "edd"
  | "source_of_wealth"
  | "agreement_signing"
  | "risk_recheck"
  | "manual_review";

export type CLMCaseStatus =
  | "pending"
  | "reviewing"
  | "resubmission"
  | "escalated"
  | "approved"
  | "rejected"
  | "auto_approved"
  | "auto_rejected"
  | "cancelled"
  | "expired";

export type RiskLevel = "low" | "medium" | "high" | "critical";
export type AMLStatus = "not_checked" | "pass" | "hit" | "pending";

export interface CLMCase {
  id: string;
  caseNo: string;                    // KYC-000123
  customerId: string;
  customerName: string;
  customerUid: string;
  country: string;
  type: CLMCaseType;
  status: CLMCaseStatus;
  riskLevel: RiskLevel;
  amlStatus: AMLStatus;
  triggerSource: string;             // 触发来源说明
  
  // 指派
  assigneeId?: string;
  assigneeName?: string;
  assigneeAvatar?: string;
  
  // SLA
  slaMinutes: number;                // SLA 时长（分钟）
  slaDueAt: string;                  // ISO 时间
  slaStatus: "normal" | "near_timeout" | "timeout";
  
  // 时间
  createdAt: string;
  updatedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  
  // 审核结果
  reviewDecision?: "approve" | "reject" | "resubmit" | "escalate";
  reviewReason?: string;
  resubmissionReason?: string;
  
  // 关联数据（详情页展开）
  customerSnapshot?: CLMCustomerSnapshot;
  submittedMaterials?: SubmittedMaterial[];
  riskAssessment?: RiskAssessment;
  comments?: CaseComment[];
  timeline?: CaseTimelineEvent[];
  auditLogs?: CLMAuditLog[];
}

export interface SubmittedMaterial {
  id: string;
  type: "id_document" | "poa" | "liveness_image" | "liveness_video" | "bank_account" | "agreement";
  label: string;
  url: string;
  thumbnailUrl?: string;
  ocrResult?: OCRResult;
  status: "submitted" | "verified" | "rejected";
  submittedAt: string;
}

export interface RiskAssessment {
  riskScore: number;                 // 0-100
  riskLevel: RiskLevel;
  amlStatus: AMLStatus;
  countryRisk: "low" | "medium" | "high";
  deviceRisk: "normal" | "suspicious";
  ipRisk: "normal" | "vpn" | "proxy";
  fundingRisk: "normal" | "high";
  multiAccountRisk: "none" | "same_device" | "same_ip" | "same_bank";
  indicators: RiskIndicator[];
}

export interface RiskIndicator {
  type: string;
  level: "low" | "medium" | "high" | "critical";
  description: string;
}

export interface CaseComment {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  content: string;
  mentions: string[];                // @userId 数组
  isInternal: boolean;               // true = 内部备注，false = 客户可见
  createdAt: string;
}

export interface CaseTimelineEvent {
  id: string;
  timestamp: string;
  actor: string;
  actorRole: string;
  action: string;
  description: string;
  metadata?: Record<string, unknown>;
}
```

### 5.2 CLMCustomerSnapshot（合规档案）

```typescript
// src/types/clm/customer.ts

export interface CLMCustomerSnapshot {
  id: string;
  uid: string;
  name: string;
  email: string;                     // 脱敏
  phone: string;                     // 脱敏
  country: string;
  nationality: string;
  dateOfBirth: string;
  registrationDate: string;
  
  kycLevel: "tier0" | "tier1" | "tier2" | "tier3" | "tier4";
  accountStatus: "active" | "restricted" | "suspended" | "closed";
  
  // 快速统计
  totalCases: number;
  pendingCases: number;
  lastCaseType?: string;
  lastCaseStatus?: string;
}

export interface CLMCustomerDetail extends CLMCustomerSnapshot {
  kycStatus: {
    identityVerification: "approved" | "pending" | "failed" | "not_required";
    poa: "approved" | "pending" | "failed" | "not_required";
    liveness: "approved" | "pending" | "failed" | "not_required";
    videoVerification: "approved" | "pending" | "failed" | "not_required";
    agreementSigning: "signed" | "pending" | "expired";
  };
  riskProfile: RiskAssessment;
  tradingAccounts: TradingAccount[];   // 复用现有类型
  fundingHistory: FundRecord[];        // 复用现有类型
  cases: CLMCaseSummary[];
  devices: ClientDevice[];             // 复用现有类型
  agreements: ClientAgreement[];       // 复用现有类型
  auditLogs: CLMAuditLog[];
}

export interface CLMCaseSummary {
  id: string;
  caseNo: string;
  type: CLMCaseType;
  status: CLMCaseStatus;
  result?: string;
  reviewer?: string;
  updatedAt: string;
}
```

### 5.3 CLMAuditLog（全局审计）

```typescript
// src/types/clm/audit.ts

export interface CLMAuditLog {
  id: string;
  auditId: string;                   // AUD-000001
  actorId: string;
  actorName: string;
  actorRole: string;
  
  action: CLMAuditAction;
  targetType: "case" | "customer" | "policy" | "workflow" | "agreement" | "level" | "template";
  targetId: string;
  targetName?: string;
  
  previousValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  reason?: string;
  
  ipAddress?: string;
  device?: string;
  
  createdAt: string;
}

export type CLMAuditAction =
  | "case_created"
  | "case_assigned"
  | "case_reviewed"
  | "case_approved"
  | "case_rejected"
  | "case_resubmission_requested"
  | "case_escalated"
  | "case_cancelled"
  | "policy_updated"
  | "policy_published"
  | "agreement_published"
  | "workflow_changed"
  | "customer_level_changed"
  | "customer_frozen"
  | "customer_unfrozen";
```

### 5.4 类型复用策略

| 现有类型 | 复用方式 |
|---------|---------|
| `KYCDocument` / `OCRResult` | 直接复用，扩展字段 |
| `ClientDevice` | 直接复用 |
| `TradingAccount` / `FundRecord` / `TradeRecord` | 直接复用 |
| `ClientAgreement` | 直接复用 |
| `CaseItem` | 弃用，迁移到 `CLMCase` |
| `AuditLog`（Client Detail 版） | 弃用，迁移到 `CLMAuditLog` |
| `TimelineEvent` | 保留，Case Detail 内复用 |

---

## 6. 页面级设计

### 6.1 Phase 1：核心工作流（Workspace + Review Queue + Case Detail）

#### 6.1.1 Workspace (`/crm/clm/workspace`)

```text
页面结构：
┌─────────────────────────────────────────────────────────────┐
│  CLM Center / Workspace                                     │
├─────────────────────────────────────────────────────────────┤
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐   │
│  │Pending │ │Timeout │ │ AML    │ │Approval│ │ Avg    │   │
│  │  132   │ │  18    │ │ Hits 6 │ │ Rate   │ │ Time   │   │
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘   │
├─────────────────────────────────────────────────────────────┤
│  Risk Alerts                                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🔴 High-risk Country - User ID 10028491             │   │
│  │ 🟡 Multiple Accounts - 3 accounts same device       │   │
│  └─────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│  Queue Summary                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ New KYC     80   Medium    │  AML Review  12  Crit  │   │
│  │ Resubmit    30   High      │  Withdrawal   8  High  │   │
│  └─────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│  My Tasks                                                   │
│  [Pending] [In Progress] [Near Timeout] [Escalated]         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Case ID    Customer    Type    Risk   SLA    Action │   │
│  │ KYC-00123  John Lee    KYC     High   20m    Review │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**关键交互：**
- 点击 KPI Card 跳转到对应筛选状态的 Review Queue
- Risk Alert 点击直接进入 Case Detail
- My Tasks 点击 Review 进入 Case Detail

#### 6.1.2 Review Queue (`/crm/clm/review-queue`)

```text
页面结构：
┌─────────────────────────────────────────────────────────────┐
│  CLM Center / Review Queue                    [Export]      │
├─────────────────────────────────────────────────────────────┤
│  Filter Bar                                                 │
│  [Case Type ▼] [Risk ▼] [Country ▼] [AML ▼] [SLA ▼]        │
│  [Status ▼] [Assignee ▼] [Time ▼] [Tier ▼]  [Reset] [Apply]│
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │ □ │ Case ID │ Customer │ UID │ Country │ Type │ Risk│   │
│  │   │         │          │     │         │      │ AML │   │
│  │   │         │          │     │         │      │ SLA │   │
│  │   │         │          │     │         │      │Assignee│  │
│  ├─────────────────────────────────────────────────────┤   │
│  │ □ │KYC-00123│John Lee  │10028│ ID      │ POA  │High │   │
│  │   │         │          │     │         │      │ Hit │   │
│  │   │         │          │     │         │      │20m  │   │
│  │   │         │          │     │         │      │Admin│   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**表格列：**
| 列 | 宽度 | 说明 |
|----|------|------|
| Checkbox | 40px | 批量选择 |
| Case ID | 120px | 链接到 Case Detail |
| Customer | 150px | 姓名 + UID |
| Country | 100px | 国旗 + 国家码 |
| Case Type | 120px | Badge |
| Risk Level | 100px | RiskBadge |
| AML Status | 100px | Badge |
| SLA | 100px | SLABadge（剩余时间） |
| Assignee | 120px | 头像 + 名字 |
| Created At | 150px | 时间 |
| Action | 120px | Review / Assign / Escalate |

**批量操作栏（选中后显示）：**
- Batch Assign
- Batch Approve（仅低风险）
- Batch Reject
- Batch Escalate
- Batch Add Tag

#### 6.1.3 Case Detail (`/crm/clm/cases/[caseId]`)

```text
页面结构：
┌─────────────────────────────────────────────────────────────┐
│  Case Header                                                │
│  KYC-00123  POA  [Reviewing]  [High]  [20m left]  [Admin A] │
├──────────────────────┬──────────────────────────────────────┤
│                      │                                      │
│  Customer Snapshot   │  Submitted Materials                 │
│  ┌────────────────┐  │  ┌────────────────────────────────┐  │
│  │ UID: 10028391  │  │  │ Identity Document              │  │
│  │ Name: John Lee │  │  │ [图片预览]  KTP                │  │
│  │ Country: ID    │  │  │ OCR: Name: John Lee (94%)      │  │
│  │ KYC: Tier1     │  │  │      ID: 123456789             │  │
│  │ Status: Active │  │  └────────────────────────────────┘  │
│  └────────────────┘  │  ┌────────────────────────────────┐  │
│                      │  │ Proof of Address               │  │
│  Risk Assessment     │  │ [图片预览]  Bank Statement     │  │
│  ┌────────────────┐  │  └────────────────────────────────┘  │
│  │ Risk Score: 78 │  │                                      │
│  │ AML: Hit       │  │  Comments                            │
│  │ Country: High  │  │  ┌────────────────────────────────┐  │
│  │ Device: Normal │  │  │ Admin B: 请核实地址...         │  │
│  │ IP: VPN        │  │  │ @Admin A                         │  │
│  │ Funding: High  │  │  └────────────────────────────────┘  │
│  └────────────────┘  │  [输入评论...]                        │
│                      │                                      │
│  Timeline            │                                      │
│  ┌────────────────┐  │                                      │
│  │ ● 10:30 Created│  │                                      │
│  │ ● 10:35 Assigned│  │                                      │
│  │ ● 10:40 Review │  │                                      │
│  └────────────────┘  │                                      │
├──────────────────────┴──────────────────────────────────────┤
│  Sticky Decision Panel（底部或右侧固定）                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ [Approve ✓]  [Reject ✗]  [Resubmit ↻]  [Escalate ↑] │   │
│  │ [Add Internal Note]  [Assign to...]  [View Customer] │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**Decision Panel 交互：**
- **Approve**: 弹窗确认 → 可选填备注 → 提交 → 状态变为 Approved
- **Reject**: 弹窗 → 必填拒绝理由（下拉选择 + 自定义）→ 提交 → 状态变为 Rejected
- **Resubmit**: 弹窗 → 选择补件类型（Document Blurry / Expired / Name Mismatch 等）→ 提交 → 状态变为 Resubmission
- **Escalate**: 弹窗 → 选择升级原因 → 提交 → 状态变为 Escalated

---

### 6.2 Phase 2：扩展模块（Cases + Customers + SLA）

#### 6.2.1 Cases 列表 (`/crm/clm/cases`)

与 Review Queue 类似，但：
- 展示**全量** Case（不限于 Pending）
- 增加 Status 筛选权重
- 支持按 Updated At 排序
- 展示历史已关闭的 Case

#### 6.2.2 Customers (`/crm/clm/customers`)

```text
与现有 /crm/clients 的区别：
- 视角从"CRM 客户管理"转为"合规档案"
- 列表增加 KYC Level / Risk Level / AML Status / Last Case 字段
- Detail 增加 KYC Status / Risk Profile / Cases 历史 Tab
```

**实现策略：复用现有 Client List + Detail，增加 CLM 视角的 Tab 和数据。**

#### 6.2.3 SLA & Monitoring (`/crm/clm/sla-monitoring`)

```text
页面结构：
┌─────────────────────────────────────────────────────────────┐
│  KPI Cards (Pending / Timeout / Near / Avg Time / Rate)    │
├─────────────────────────────────────────────────────────────┤
│  Queue Backlog (Bar Chart)                                  │
│  KYC ████████ 80 | POA ████ 30 | AML ██ 12 | ...           │
├─────────────────────────────────────────────────────────────┤
│  Reviewer Performance (Table)                               │
│  Admin A | 120/day | 84% | 3m | 2 timeout                  │
├─────────────────────────────────────────────────────────────┤
│  Automation Health (Metrics)                                │
│  Auto Review: 67% | OCR Success: 91% | AML Fail: 2%        │
├─────────────────────────────────────────────────────────────┤
│  Alerts List                                                │
│  🔴 SLA Timeout: KYC-00123 exceeded 30min                  │
│  🟡 Queue Overload: AML queue > 20                         │
└─────────────────────────────────────────────────────────────┘
```

---

### 6.3 Phase 3：配置模块 + Audit Trail

#### 6.3.1 KYC Policies (`/crm/clm/policies`)

```text
页面结构：
┌─────────────────────────────────────────────────────────────┐
│  Policy List                                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Name          Type        Country  Status  Priority │   │
│  │ Indo Passport Document    ID       Active  1       │   │
│  └─────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│  Rule Builder（点击 Policy 进入）                           │
│  IF   [country] [equals] [Indonesia]                       │
│  AND  [document_type] [equals] [passport]                  │
│  THEN [poa_required] [=] [true]                            │
├─────────────────────────────────────────────────────────────┤
│  Test Simulation                                            │
│  Input: { country: "Indonesia", document_type: "passport" }│
│  Output: { poa_required: true, hit_policy: "Indo Passport" }│
└─────────────────────────────────────────────────────────────┘
```

#### 6.3.2 KYC Levels (`/crm/clm/levels`)

```text
页面结构：
┌─────────────────────────────────────────────────────────────┐
│  Level List + Permission Matrix                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Permission    │ Tier0 │ Tier1 │ Tier2 │ Tier3 │ Tier4│   │
│  │ View Market   │   ✓   │   ✓   │   ✓   │   ✓   │   ✓  │   │
│  │ Deposit       │   ✗   │  Lim  │   ✓   │   ✓   │   ✓  │   │
│  │ Withdraw      │   ✗   │   ✗   │  Lim  │   ✓   │   ✓  │   │
│  │ High Leverage │   ✗   │   ✗   │   ✗   │  Lim  │   ✓  │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

#### 6.3.3 Audit Trail (`/crm/clm/audit-trail`)

```text
页面结构：
┌─────────────────────────────────────────────────────────────┐
│  Filter: [Actor ▼] [Action ▼] [Target Type ▼] [Time ▼]     │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │ AUD-000001 | Admin A | Approved | Case KYC-00123   │   │
│  │            | Pending → Approved | 2026-05-08 10:30 │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. Service 层设计

### 7.1 CLM Service 架构

```
src/lib/clm/
├── services/
│   ├── case.service.ts         # Case CRUD + 审核操作
│   ├── queue.service.ts        # Review Queue 查询 + 筛选 + 排序
│   ├── customer.service.ts     # 合规档案查询
│   ├── sla.service.ts          # SLA 计算 + 监控数据
│   ├── audit.service.ts        # 审计日志写入 + 查询
│   └── workspace.service.ts    # Workspace KPI + My Tasks
├── mock/
│   ├── mock-cases.ts           # 20+ 条 Case mock 数据
│   ├── mock-customers.ts       # 合规档案 mock
│   ├── mock-workspace.ts       # Workspace 数据
│   └── mock-audit.ts           # 审计日志 mock
└── types/
    └── (见第 5 节)
```

### 7.2 case.service.ts 接口

```typescript
class CLMCaseService {
  // 查询
  async list(params: CaseListParams): Promise<PaginatedResult<CLMCase>>;
  async getById(id: string): Promise<CLMCase | null>;
  async getMyTasks(userId: string): Promise<CLMCase[]>;
  
  // 审核操作（每个操作自动写审计日志）
  async approve(id: string, reviewerId: string, notes?: string): Promise<void>;
  async reject(id: string, reviewerId: string, reason: string): Promise<void>;
  async requestResubmission(id: string, reviewerId: string, reason: string): Promise<void>;
  async escalate(id: string, reviewerId: string, reason: string): Promise<void>;
  async assign(id: string, assigneeId: string, assignedBy: string): Promise<void>;
  
  // 评论
  async addComment(id: string, comment: CaseComment): Promise<void>;
  
  // 批量
  async batchApprove(ids: string[], reviewerId: string): Promise<void>;
  async batchAssign(ids: string[], assigneeId: string, assignedBy: string): Promise<void>;
}
```

### 7.3 现有 kyc.service.ts 的处理

**方案：逐步迁移，最终删除。**

| 阶段 | 操作 |
|------|------|
| Phase 1 | 新建 `clm/case.service.ts`，`kyc.service.ts` 保留兼容 |
| Phase 2 | Client Detail KYC Tab 改为调用 `clm/case.service.ts` |
| Phase 3 | 删除 `kyc.service.ts` 和 `mock-kyc.ts` |

---

## 8. 实施路线图

### 8.1 Phase 1：核心工作流（第 1 周）

**目标：让审核员能用上 Workspace + Review Queue + Case Detail**

| 序号 | 任务 | 文件 |
|------|------|------|
| 1 | 新建 CLM 类型定义 | `src/types/clm/*.ts` |
| 2 | 新建 mock 数据（20+ Case） | `src/lib/clm/mock/*.ts` |
| 3 | 新建 Service 层 | `src/lib/clm/services/*.ts` |
| 4 | 实现 Workspace 页面 | `src/app/crm/clm/workspace/page.tsx` |
| 5 | 实现 Review Queue 页面 | `src/app/crm/clm/review-queue/page.tsx` |
| 6 | 实现 Case Detail 页面 | `src/app/crm/clm/cases/[id]/page.tsx` |
| 7 | 新增 CLM 路由和菜单 | 更新 sidebar config |
| 8 | 新增通用组件 | `DecisionPanel`, `CaseTimeline`, `RiskBadge`, `SLABadge` |

**Phase 1 交付标准：**
- [ ] Workspace 能展示 KPI + Risk Alerts + My Tasks
- [ ] Review Queue 支持全部筛选器和排序
- [ ] Case Detail 能展示 Customer Snapshot + Materials + Risk + Decision Panel
- [ ] Approve/Reject/Resubmit/Escalate 操作有弹窗确认
- [ ] 操作后状态正确变更，自动同步到列表

### 8.2 Phase 2：扩展运营（第 2 周）

| 序号 | 任务 | 文件 |
|------|------|------|
| 1 | 实现 Cases 列表页 | `src/app/crm/clm/cases/page.tsx` |
| 2 | 增强 Customers 合规视角 | 复用 `/crm/clients`，增加 CLM Tab |
| 3 | 实现 SLA & Monitoring | `src/app/crm/clm/sla-monitoring/page.tsx` |
| 4 | 集成图表（ECharts） | SLA 看板用 Bar/Line Chart |
| 5 | 实现 Comment 功能 | Case Detail 内评论 + @同事 |

### 8.3 Phase 3：配置模块（第 3 周）

| 序号 | 任务 | 文件 |
|------|------|------|
| 1 | 实现 Audit Trail | `src/app/crm/clm/audit-trail/page.tsx` |
| 2 | 实现 KYC Policies | `src/app/crm/clm/policies/page.tsx` |
| 3 | 实现 KYC Levels | `src/app/crm/clm/levels/page.tsx` |
| 4 | 实现 Forms & Fields | `src/app/crm/clm/forms/page.tsx` |
| 5 | 实现 Compliance Templates | `src/app/crm/clm/templates/page.tsx` |
| 6 | 实现 Agreements | `src/app/crm/clm/agreements/page.tsx` |
| 7 | 实现 Workflow Settings | `src/app/crm/clm/workflows/page.tsx` |
| 8 | 清理旧 KYC 路由 | 删除 `/crm/kyc/*`，添加重定向 |

---

## 9. 与现有代码的对接点

### 9.1 可复用资产

| 资产 | 位置 | 复用方式 |
|------|------|---------|
| `EnhancedDataTable` | `src/components/crm/ui/EnhancedDataTable.tsx` | Review Queue / Cases / Audit Trail 表格 |
| `StatusBadge` / `RiskBadge` | `src/components/crm/ui/StatusBadge.tsx` | Case 状态、风险等级 |
| `PageHeader` / `Card` / `FilterBar` | `src/components/crm/ui/*.tsx` | 通用布局 |
| `UserDetailDrawer` | `src/components/crm/users/UserDetailDrawer.tsx` | Customer Snapshot 可复用 |
| ECharts | 已安装 | SLA 看板图表 |
| Client Detail Tabs | 已有 14 Tab | KYC Tab 增强为与 Case Detail 双向跳转 |

### 9.2 需要新增的通用组件

| 组件 | 用途 | 优先级 |
|------|------|--------|
| `DecisionPanel` | 审核操作面板（Approve/Reject/Resubmit/Escalate） | P0 |
| `CaseTimeline` | Case 生命周期时间线 | P0 |
| `RiskBadge` | 风险等级标签（Low/Medium/High/Critical） | P0 |
| `SLABadge` | SLA 状态标签（Normal/Near/Timeout） | P0 |
| `AMLStatusBadge` | AML 状态标签 | P0 |
| `CaseTypeBadge` | Case 类型标签 | P0 |
| `CommentPanel` | 内部评论面板 | P1 |
| `DocumentPreview` | 证件图片预览 + OCR 高亮 | P0 |
| `ConfirmDialog` | 二次确认弹窗（带理由输入） | P0 |
| `MetricCard` | KPI 指标卡片 | P0 |
| `RuleBuilder` | IF/THEN 规则构建器 | P3 |
| `PermissionMatrix` | 权限矩阵表格 | P3 |

### 9.3 Client Detail KYC Tab 的改造

当前 `KYCTab.tsx` 不会被删除，而是**增强为 Case Detail 的快捷入口**。

改造方案：
1. KYC Tab 展示当前客户最新的 KYC Case 摘要
2. 点击 "Open Case Detail" 跳转到 `/crm/clm/cases/[caseId]`
3. Case Detail 中点击 "View Customer" 跳转回 `/crm/clients/[id]`
4. 双向跳转，保持上下文

---

## 10. 关键设计决策

### 10.1 决策记录

| # | 决策 | 结论 | 原因 |
|---|------|------|------|
| 1 | 路由前缀 | 用 `/crm/clm/` 而非 `/clm/` | 保持 CRM 命名空间统一 |
| 2 | Case 数据存储 | 先 mock，后续接后端 API | 原型验证阶段 |
| 3 | 审核操作是否写审计 | 必须写，mock 阶段也要模拟 | 合规要求 |
| 4 | KYCTab 是否保留 | 保留，作为 Case Detail 快捷入口 | 减少用户跳转成本 |
| 5 | Customers 是否独立 | 复用 `/crm/clients`，增加 CLM 视角 | 避免数据重复 |
| 6 | 旧 KYC 菜单何时删除 | Phase 3 完成后统一清理 | 保证过渡期可用 |
| 7 | 批量操作范围 | Phase 1 仅实现 Batch Assign，其他批量延至 Phase 2 | 优先级控制 |
| 8 | SLA 计算 | 客户端基于 createdAt + slaMinutes 计算 | mock 阶段简化 |
| 9 | 评论是否实时 | 先轮询，后续接 WebSocket | 原型阶段 |
| 10 | 图片预览 | 用 `<img>` 标签 + 放大弹窗，先不上传组件 | 简化实现 |

---

## 11. 验收标准

### 11.1 Phase 1 验收

- [ ] Workspace 页面有 6 个 KPI Card，点击可跳转
- [ ] Workspace 展示 Risk Alerts（至少 3 条）
- [ ] Workspace My Tasks 有 5 个 Tab，能展示数据
- [ ] Review Queue 表格有 11 列，能筛选和排序
- [ ] Review Queue 支持批量选择（Checkbox）
- [ ] Case Detail 有 Case Header（ID/Type/Status/Risk/SLA/Assignee）
- [ ] Case Detail 有 Customer Snapshot
- [ ] Case Detail 有 Submitted Materials（图片可预览）
- [ ] Case Detail 有 Risk Assessment（多维度）
- [ ] Case Detail Decision Panel 有 4 个操作按钮
- [ ] Approve/Reject/Resubmit/Escalate 都有二次确认弹窗
- [ ] 操作后 Case 状态正确更新，列表同步刷新
- [ ] 所有审核操作写入 Audit Trail（mock 级别）

### 11.2 全局验收

- [ ] 菜单结构清晰分离 Operations 和 Configuration
- [ ] 所有列表页面有 Empty State 和 Loading Skeleton
- [ ] 所有审核操作有二次确认
- [ ] 敏感信息（Email/Phone/Document No.）默认脱敏
- [ ] 审计日志不可编辑、不可删除
- [ ] 页面响应式支持 1440px+
- [ ] UI 文案统一英文

---

## 12. 附录

### 12.1 术语对照

| CLM 术语 | 现有术语 | 说明 |
|---------|---------|------|
| Case | KYC Record / Review | 审核任务单元 |
| Review Queue | Review Queue | 统一审核队列 |
| Customer | Client / User | 合规档案视角的客户 |
| Workspace | Dashboard | 审核员工作台 |
| SLA | - | 服务等级协议（审核时限） |
| Audit Trail | Audit Log | 审计日志 |
| Policy | Review Policy | 审核策略规则 |

### 12.2 参考文档

| 文档 | 路径 |
|------|------|
| CLM Center 产品方案 v1.0.1 | `/Users/sevenkowel/Downloads/CLM_Center_Product_Solution_v1.0.1.md` |
| CRM 菜单结构 v2.0 | `docs/CRM-MENU-STRUCTURE.md` |
| KYC 完整重构方案 | `docs/KYC-COMPLETE-REDESIGN.md` |
| Client Detail PRD v1.0 | `docs/PRD-Client-Detail-v1.0.md` |
| Client Module Plan | `docs/CLIENTS-MODULE-PLAN.md` |
