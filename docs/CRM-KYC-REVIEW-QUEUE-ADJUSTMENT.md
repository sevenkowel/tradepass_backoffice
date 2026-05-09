# Review Queue & Case Detail 调整方案

> 基于 PRD vs 当前实现 Gap 分析
> Version: v1.0 | 待确认后执行

---

## 1. Review Queue 列表

### 1.1 当前列 vs PRD 要求

| 列 | 当前实现 | PRD 要求 | 调整 |
|---|---|:---:|:---:|
| Case ID | ✅ font-mono blue link | Case ID | 保留 |
| Customer | ✅ name + uid | User Name + UID | 保留，加 UID 独立列 |
| UID | 合并在 Customer 中 | UID | **拆分独立列** |
| Country | ✅ 文本 | Country | 保留 |
| Type | ✅ CaseTypeBadge | Task Type | 保留 |
| Risk Level | ✅ RiskBadge | Risk Level | 保留 |
| AML Status | ✅ AMLStatusBadge | AML Status | 保留 |
| KYC Level | ❌ 无 | Tier 0-4 | **新增列** |
| Status | ✅ Badge | Current Status | 保留 |
| SLA | ✅ SLABadge | SLA Countdown | **改为倒计时**（Xm left / Xm overdue） |
| Assignee | ✅ 文本 | Assigned Reviewer | 保留 |
| Created At | ✅ 时间 | Submission Time | 保留 |
| Updated At | ❌ 无 | Last Updated | **新增列** |
| Source Channel | ❌ 无 | 注册来源 | **新增列** |
| Auto Review Result | ❌ 无 | Pass/Reject/Pending | **新增列** |
| Priority | ❌ 无 | VIP/High Risk/Urgent | **新增列** |

### 1.2 调整后列顺序（16 列）

```text
□ | Case ID | UID | Customer | Country | Type | Risk | AML | KYC Level | Priority | Status |
  | SLA Countdown | Auto Review | Assignee | Source | Created | Updated | Action
```

### 1.3 新增筛选器

| 筛选器 | 类型 | 选项 |
|--------|------|------|
| KYC Level | Select | Tier0–Tier4 |
| Priority | Select | Normal / VIP / High Risk / Urgent |
| Source Channel | Select | Website / IB / Partner / Mobile |
| Auto Review Result | Select | Pass / Reject / Pending / Not Checked |

### 1.4 行操作增强

| 操作 | 当前 | 调整 |
|------|:---:|:---:|
| Review | ✅ | 保留 |
| Assign to Me | ✅ | 保留 |
| Escalate | ✅ | 保留 |
| View Customer | ❌ | **新增**（跳转 `/crm/clients/[id]`） |
| View Audit | ❌ | **新增**（跳转 Audit Trail 筛选） |

---

## 2. Case Detail 详情页

### 2.1 整体布局

当前：2 列布局（左侧主内容 × 右侧决策面板）
PRD 要求：左 Summary + 右 Main Content

调整为：

```text
┌─────────────────────────────────────────────────────────┐
│ Sticky Header (Case ID + Badges + SLA + Assignee)       │
├──────────────┬──────────────────────────────────────────┤
│ Left Sidebar │ Main Content                             │
│ (Sticky)     │                                          │
│              │  1. User Basic Information               │
│  • User Info │  2. Uploaded Documents (OCR)             │
│  • Risk      │  3. Personal Experience Questionnaire    │
│  • Quick Nav │  4. Agreement Signing                    │
│              │  5. Disclaimer Section                   │
│              │  6. Auto Review / Manual Review Result   │
│              │  7. Timeline                             │
│              │  8. Notes                                │
├──────────────┴──────────────────────────────────────────┤
│ Bottom Decision Bar (Sticky)                            │
└─────────────────────────────────────────────────────────┘
```

### 2.2 Sticky Header 增强

| 字段 | 当前 | 调整 |
|------|------|------|
| Case ID | ✅ | 保留 |
| Case Type | ✅ CaseTypeBadge | 保留 |
| Status | ✅ Badge | 保留 |
| Risk Level | ✅ RiskBadge | 保留 |
| SLA | ✅ SLABadge | **改为倒计时**（精确分钟） |
| Assignee | ✅ 文本 | 保留 |
| Trigger Source | ✅ 文本 | 保留 |
| Timeout Warning | ❌ | **新增**（SLA < 10m 强警示样式） |
| Accept Task 按钮 | ❌ | **新增**（状态 = pending 时显示） |

### 2.3 Left Sidebar（新增，Sticky）

```text
┌──────────────────────┐
│ User Info Card       │
│ ┌──────────────────┐ │
│ │ [Avatar]  Name   │ │
│ │ UID: 10028391    │ │
│ │ Email: n***@g... │ │
│ │ Phone: +84 ****  │ │
│ │ Country: Vietnam │ │
│ │ KYC Level: Tier1 │ │
│ │ Reg: 2026-05-03  │ │
│ │ IB: —            │ │
│ └──────────────────┘ │
│                      │
│ Quick Access         │
│ [Client Detail]      │
│ [Fund History]       │
│ [Trading History]    │
│ [Risk Center]        │
│                      │
│ Risk Summary Card    │
│ (精简版评分 + 告警数) │
│                      │
│ Case Info            │
│ SLA: 20m left        │
│ Created: 10:30       │
│ Updated: 10:45       │
└──────────────────────┘
```

### 2.4 主内容区增强

#### 2.4.1 User Basic Information（新增字段）

| 字段 | 当前 | 调整 |
|------|------|------|
| Avatar | ✅ | 保留 |
| Name | ✅ | 保留 |
| UID | ✅ | 保留 |
| Email | ✅ | 保留，**脱敏**显示 |
| Phone | ✅ | 保留，**脱敏**显示 |
| Country | ✅ | 保留 |
| Nationality | ✅ | 保留 |
| Date of Birth | ✅ | 保留 |
| KYC Level | ✅ | 保留 |
| Account Status | ✅ | 保留 |
| Registration Time | ❌ | **新增** |
| IB / Referral | ❌ | **新增** |
| Quick Access Links | ❌ | **新增**（4 个跳转按钮） |

#### 2.4.2 Uploaded Documents（增强 OCR 对比）

| 功能 | 当前 | 调整 |
|------|:---:|:---:|
| 图片预览 | ✅ placeholder | **真实图片**（mock） |
| OCR 字段对比 | ✅ key-value | 保留，增加**字段级置信度百分比** |
| OCR Mismatch 高亮 | ✅ 列表 | 增强：**红绿高亮对比**（左 OCR 值 vs 右人工确认值） |
| 图片放大 | ✅ modal | 保留 |
| 图片旋转 | ❌ | **新增** |
| 下载原图 | ❌ | **新增** |
| 状态标签 | ✅ submitted/verified/rejected | 保留 |

#### 2.4.3 Personal Experience Questionnaire（全新 Section）

```text
┌─────────────────────────────────────────────┐
│ Personal Experience Questionnaire           │
│                                             │
│ Family Information                          │
│  Marital Status: Married                    │
│  Dependents: 2                              │
│                                             │
│ Education / Employment                      │
│  Education Level: Bachelor                  │
│  Employment: Employed                       │
│  Occupation: Engineer                       │
│  Employer: ABC Corp                         │
│  Annual Income: $25k – $50k                │
│  Net Worth: $50k – $100k                   │
│                                             │
│ Trading Experience                          │
│  Years of Experience: 1-3                   │
│  Products Traded: Forex, Stocks             │
│  Leverage Understanding: Yes                │
│  Risk Understanding: Yes                    │
└─────────────────────────────────────────────┘
```

#### 2.4.4 Agreement Signing（全新 Section）

| 字段 | 说明 |
|------|------|
| Agreement Version | 当前签署版本 |
| Signed At | 时间戳 |
| Signed IP | 用户 IP |
| Language | 签署语言 |
| Signature Method | Handwritten / Text |
| PDF Archive | 查看/下载按钮 |

当协议版本更新时：展示 Force Re-sign 警告条。

#### 2.4.5 Disclaimer Section（全新 Section）

```text
┌─────────────────────────────────────────────┐
│ Declarations                                │
│                                             │
│ ✅ US Person: No                            │
│ ✅ PEP: No                                  │
│ ✅ Military: No                             │
│ ✅ Financial Professional: No               │
│ ✅ Criminal Record: No                      │
│ ✅ Tax Residency: Vietnam                   │
│ ✅ FATCA Related: No                        │
└─────────────────────────────────────────────┘
```

#### 2.4.6 Auto Review / Manual Review Results（全新 Section）

```text
┌─────────────────────────────────────────────┐
│ Review Engine Results                       │
│                                             │
│ Auto Review:                                │
│  OCR Score: 94%        [Pass]               │
│  AML Result: Hit       [Review Required]    │
│  Face Match Score: 88% [Pass]               │
│  Device Risk: Normal   [Pass]               │
│  IP Risk: VPN          [Flagged]            │
│  Overall: Manual Review Required            │
│                                             │
│ Manual Review:                              │
│  Reviewer: Admin A                          │
│  Duration: 4m 30s                           │
│  Status: In Progress                        │
└─────────────────────────────────────────────┘
```

### 2.5 Decision Bar 增强

#### 2.5.1 操作类型

| 操作 | 当前 | 调整说明 |
|------|:---:|:---|
| Accept Task | ❌ | **新增**——接单操作，状态从 Pending → Reviewing |
| Approve | ✅ | 保留 |
| Reject | ✅ | **增强**——Reject & Blacklist 选项（永久拒绝） |
| Request Resubmission | ✅ | 保留 |
| Request Additional Documents | ❌ | **新增**——请求额外文件（与 Resubmit 分开） |
| Hold | ❌ | **新增**——临时暂停审核 |
| Transfer | ❌ | **新增**——转派给其他审核员 |
| Escalate | ✅ | 保留 |
| Add Note | ✅ | 保留 |
| View Customer | ✅ | 保留 |

#### 2.5.2 布局变化

当前：右侧 Card 内 2×2 按钮网格
调整：**底部 Sticky Bar**（更符合真实审核工作流）

```text
┌─────────────────────────────────────────────────────────┐
│ 底部 Sticky Decision Bar                                │
│ [Accept Task] | [Approve] [Reject ▼] [Resubmit] [Hold] │
│ [Add Docs] [Transfer] [Escalate] | [Add Note] [View...] │
│ ┌─ SLA: 20m left ────────────────────────────────────┐  │
└─────────────────────────────────────────────────────────┘
```

---

## 3. 数据模型扩展

### 3.1 CLMCase 新增字段

```typescript
interface CLMCase {
  // 现有字段...
  
  // 新增
  kycLevel?: "tier0" | "tier1" | "tier2" | "tier3" | "tier4";
  priority?: "normal" | "vip" | "high_risk" | "urgent";
  sourceChannel?: "website" | "ib" | "partner" | "mobile" | "api";
  autoReviewResult?: "pass" | "reject" | "pending" | "not_checked";
  
  // 详情页独有
  personalInfo?: PersonalInfo;          // 扩展用户信息
  experience?: ExperienceInfo;          // 问卷/经验信息
  agreements?: AgreementRecord[];       // 协议签署记录
  disclaimer?: DisclaimerInfo;          // 声明信息
  autoReview?: AutoReviewResult;        // 自动审核结果
  manualReview?: ManualReviewInfo;      // 人工审核信息
  reviewerHistory?: ReviewAction[];     // 审核操作历史
  relationshipGraph?: RelationNode[];   // 关系图谱（在 Case Detail 中展示）
}
```

### 3.2 新类型定义

```typescript
// 个人经验问卷
interface ExperienceInfo {
  family: { maritalStatus: string; dependents: number };
  education: { level: string; field?: string };
  employment: { status: string; occupation: string; employer?: string };
  financial: { annualIncome: string; netWorth: string };
  trading: { years: string; products: string[]; leverageUnderstanding: boolean; riskUnderstanding: boolean };
}

// 协议签署记录
interface AgreementRecord {
  name: string;
  version: string;
  signedAt: string;
  ipAddress: string;
  language: string;
  signatureType: "handwritten" | "text";
  pdfUrl?: string;
  forceResign?: boolean;
}

// 声明信息
interface DisclaimerInfo {
  usPerson: boolean;
  pep: boolean;
  military: boolean;
  financialProfessional: boolean;
  criminalRecord: boolean;
  taxResidency: string;
  fatcaRelated: boolean;
}

// 自动审核结果
interface AutoReviewResult {
  ocrScore: number;
  ocrPassed: boolean;
  amlResult: AMLStatus;
  faceMatchScore: number;
  faceMatchPassed: boolean;
  deviceRisk: string;
  ipRisk: string;
  overall: "auto_pass" | "manual_review" | "auto_reject";
}

// 审核操作历史
interface ReviewAction {
  action: string;
  actor: string;
  timestamp: string;
  note?: string;
  previousStatus: string;
  newStatus: string;
}
```

---

## 4. 组件改动清单

| 组件 | 改动 | 工作量 |
|------|------|:------:|
| `review-queue/page.tsx` | 重写（更多列、筛选器、行操作、倒计时） | 大 |
| `cases/[id]/page.tsx` | 重写（左 Sum + 右 Main + 底 Bar 布局） | 大 |
| `DecisionPanel.tsx` | 增强（Accept/Hold/Transfer/Reject&Blacklist/AdditionalDocs） | 中 |
| `RiskAssessmentPanel.tsx` | 增强（加入关系图谱、Auto Review 结果） | 中 |
| `DocumentPreview.tsx` | 增强（旋转/下载/更高对比度） | 中 |
| `CommentPanel.tsx` | 保留 | 小 |
| `CaseTimeline.tsx` | 保留 | 小 |
| 新增 `ExperienceSection.tsx` | 全新 | 中 |
| 新增 `DisclaimerSection.tsx` | 全新 | 小 |
| 新增 `AgreementSection.tsx` | 全新 | 中 |
| 新增 `AutoReviewSection.tsx` | 全新 | 小 |
| 新增 `QuickAccessCard.tsx` | 全新 | 小 |
| mock 数据扩展 | 按新类型扩展 mock | 中 |

---

## 5. 执行策略

建议分两轮：

**轮次 1（Review Queue）**：列表列增强 + 筛选器 + 行操作
**轮次 2（Case Detail）**：新布局 + 新 Section + Decision Bar 增强

每轮确认后再动手，不两张同时改。
