# Approval Inbox — 统一审批收件箱 PRD

> Version: v1.1 | 2026-05-13  
> Status: ✅ 已确认，可执行  
> 背景：运营人员身兼多职，需要在 KYC 审批、存款审批、提款审批三个模块间反复切换，SLA 优先级跨模块无法对齐。

**已确认决策：**
- 菜单位置：顶层独立入口（与 Dashboard、Clients、CLM Center 同级）
- 内联审批阈值：Deposit < $50,000 / Withdrawal < $10,000（与业务匹配）
- Phase 1 范围：个人工作台，不含 Assign 功能

---

## 1. 背景与目标

### 1.1 现状痛点

| 痛点 | 描述 |
|------|------|
| **入口分散** | 待审批任务分布在 `/crm/kyc/review`、`/crm/clm/review-queue`、`/crm/funds/deposits`、`/crm/funds/withdrawal-review` 四个路由，审批员需逐一检查 |
| **SLA 盲区** | 提款超时可能比 KYC 更紧急，但无跨模块优先级视图 |
| **上下文切换** | 处理完 KYC 后，必须手动导航到 Funds 模块查找提款队列 |
| **工作量不透明** | 主管无法一眼看到今日整体待处理量和积压情况 |

### 1.2 目标

1. 提供一个**统一入口**，聚合所有待审批任务
2. 以 **SLA 倒计时**为主排序，最紧急的排最前
3. **简单审批内联完成**（存款/提款），**复杂审批跳转**（KYC）到原有详情页
4. 原有各模块队列页面**继续保留**，不废弃

---

## 2. 用户故事

| 角色 | 故事 | 验收标准 |
|------|------|---------|
| 审批员（多职） | 打开 Inbox，看到所有待我处理的审批，按紧急程度排列 | 列表包含 KYC / 存款 / 提款三类，SLA 剩余时间排序 |
| 审批员 | 对一笔低风险存款直接在列表行点击 Approve | 无需跳转，刷新后该行消失 |
| 审批员 | 对一个 KYC case 需要查看文件，点击 Review 跳转详情页 | 跳转到 `/crm/clm/cases/[id]` |
| 主管 | 查看今日 KYC/存款/提款各类型积压数量和超时数量 | 顶部汇总栏显示三类 pending count + overdue count |
| 主管 | 将某条任务指派给团队成员 | Assign 下拉支持选择 Staff |

---

## 3. 功能规格

### 3.1 路由与菜单位置

```
/crm/approvals              → Approval Inbox 主页（默认 All Tab）
/crm/approvals?type=kyc     → 打开 KYC Tab
/crm/approvals?type=deposit → 打开 Deposits Tab
/crm/approvals?type=withdrawal → 打开 Withdrawals Tab
```

**菜单位置**：顶层独立入口，导航顺序紧跟 Dashboard 之后：

```
Dashboard
Approvals          ← 新增，显示待审批总数角标
Clients
CLM Center
Risk Center
Funds
Trading
...
```

角标逻辑：显示所有 `pending + on_hold` 总数，超时数用红点额外标记。

---

### 3.2 页面结构

```
┌─────────────────────────────────────────────────────────────────┐
│  PageHeader: "Approval Inbox"              [Refresh] [Settings] │
├─────────────────────────────────────────────────────────────────┤
│  汇总栏（Summary Bar）                                           │
│  ┌───────────┬──────────────┬───────────────┐                  │
│  │ KYC        │ Deposits     │ Withdrawals   │                  │
│  │ 8 pending  │ 3 pending    │ 5 pending     │                  │
│  │ 2 overdue  │ 0 overdue    │ 1 overdue     │                  │
│  └───────────┴──────────────┴───────────────┘                  │
├─────────────────────────────────────────────────────────────────┤
│  Tab 栏                                                         │
│  [All (16)] [KYC (8)] [Deposits (3)] [Withdrawals (5)]         │
│  [Assigned to me] [Unassigned]                                  │
├─────────────────────────────────────────────────────────────────┤
│  FilterBar（可折叠）                                             │
│  Status | Risk Level | SLA Status | Assignee | Date Range       │
├─────────────────────────────────────────────────────────────────┤
│  审批列表（EnhancedDataTable）                                   │
│  ... rows ...                                                    │
└─────────────────────────────────────────────────────────────────┘
```

---

### 3.3 列表列定义

| 列名 | 宽度 | 内容 | 说明 |
|------|------|------|------|
| Type | 80px | `[KYC]` / `[DEP]` / `[WD]` 类型徽章 | 颜色区分三类 |
| User | 160px | 头像 + 姓名 + UID | 点击跳转客户详情 |
| Subject | 200px | KYC: 文件类型（Identity / POA / …）；存款: 金额 + 渠道；提款: 金额 + 方式 | |
| Risk | 80px | 风险等级徽章 Low/Medium/High/Critical | |
| Amount | 100px | 存款/提款显示金额，KYC 显示 `—` | 右对齐，font-mono |
| SLA | 120px | 倒计时胶囊（剩余时间 / Overdue +时长） | 颜色：绿→橙→红 |
| Assignee | 100px | 头像 + 姓名；未指派显示 `Unassigned` | |
| Created | 100px | 相对时间（3h ago） | hover 显示绝对时间 |
| Actions | 160px | 内联操作按钮（见 §3.4） | |

默认排序：`overdue first → SLA 剩余时间 ASC`

---

### 3.4 内联操作规则

| 类型 | 条件 | 内联按钮 |
|------|------|---------|
| KYC | 任意 | `[Review →]`（跳转 `/crm/clm/cases/[id]`） |
| Deposit | 风险 = Low / Medium，金额 < $50,000 | `[Approve]` `[Reject]` `[Hold]` |
| Deposit | 风险 = High / Critical，或金额 ≥ $50,000 | `[Review →]`（跳转存款详情） |
| Withdrawal | 风险 = Low，金额 < $10,000 | `[Approve]` `[Reject]` `[Hold]` |
| Withdrawal | 风险 ≥ Medium，或金额 ≥ $10,000 | `[Review →]`（跳转提款审批页） |

> **设计原则**：强制跳转阈值由后端配置，前端仅渲染 Review 按钮。

**Approve / Reject 操作流**：
- `Approve`：直接执行，成功后行消失，Toast 显示 "Approved"
- `Reject`：弹出 Inline Reason 输入框（不全屏 Dialog），填写后确认
- `Hold`：直接执行，状态变为 "On Hold"，行保留但置灰

---

### 3.5 汇总栏（Summary Bar）

三张统计卡，每张包含：
- 类型名称 + 图标
- `N pending`（待审批总数）
- `N overdue`（已超 SLA 数，红色高亮）
- 点击整张卡 = 切换到对应 Tab

---

### 3.6 过滤器（FilterBar）

| 筛选项 | 类型 | 选项 |
|--------|------|------|
| Status | 多选 | Pending / On Hold / In Review |
| Risk Level | 多选 | Low / Medium / High / Critical |
| SLA Status | 单选 | All / Overdue / Urgent (< 1h) / Normal |
| Assignee | 单选 | All / Me / Unassigned / [Staff Name] |
| Type | 多选 | KYC / Deposit / Withdrawal（Tab 已选时禁用） |
| Date Range | 日期区间 | 创建时间范围 |

筛选状态写入 URL（支持刷新保持、链接分享）。

---

### 3.7 行内 Reject 表单

不弹全屏 Dialog，在行下方展开一个内联输入区：

```
┌──────────────────────────────────────────────────┐
│  Reason for rejection *                           │
│  ┌────────────────────────────────────────────┐  │
│  │ e.g. Suspicious transaction pattern…       │  │
│  └────────────────────────────────────────────┘  │
│                            [Cancel]  [Confirm Reject] │
└──────────────────────────────────────────────────┘
```

---

### 3.8 Assign 功能

每行 Assignee 列点击后展开下拉，显示在线 Staff 列表（角色过滤：只显示有该类型审批权限的人），选择后立即指派并写 Audit Log。

---

## 4. 数据模型

### 4.1 统一审批条目（ApprovalItem）

```typescript
interface ApprovalItem {
  id: string;
  type: "kyc" | "deposit" | "withdrawal";

  // 关联 ID（用于跳转）
  sourceId: string;          // CLM case ID / deposit order ID / withdrawal request ID
  detailUrl: string;         // 跳转 URL

  // 用户信息
  userId: string;
  userUid: string;
  userName: string;
  userCountry: string;

  // 审批主体
  subject: string;           // "Identity Document" / "$12,400 USDT" / "Card Deposit $3,200"
  amount?: number;           // 存款/提款金额，KYC 为 undefined
  currency?: string;

  // 风险
  riskLevel: "low" | "medium" | "high" | "critical";
  riskFlags?: string[];

  // SLA
  status: "pending" | "on_hold" | "in_review";
  slaDueAt?: string;         // ISO，用于倒计时计算
  createdAt: string;

  // 指派
  assigneeId?: string;
  assigneeName?: string;

  // 内联操作能力（后端决定）
  canInlineApprove: boolean; // false = 强制跳转 Review
}
```

### 4.2 汇总数据（ApprovalSummary）

```typescript
interface ApprovalSummary {
  kyc:         { pending: number; overdue: number };
  deposit:     { pending: number; overdue: number };
  withdrawal:  { pending: number; overdue: number };
}
```

---

## 5. 与现有模块的关系

```
Approval Inbox（新）             原有模块（保留，不废弃）
─────────────────────────────────────────────────────────────
行点 [Review →] KYC       →   /crm/clm/cases/[id]
行点 [Review →] Deposit   →   /crm/funds/deposits（Drawer）
行点 [Review →] Withdrawal →  /crm/funds/withdrawal-review（Drawer）

内联 Approve/Reject/Hold  →   调用对应 service，写 Audit Log
                          →   同步更新原模块数据（共享 service 层）
```

**Audit Log 双写**：所有在 Inbox 发生的操作，同时写入全局 Audit Trail 和模块专属日志。

---

## 6. 权限控制（RBAC）

| 角色 | KYC 列 | Deposit 列 | Withdrawal 列 |
|------|--------|-----------|--------------|
| Compliance Officer | ✅ 可见 + 操作 | ❌ 不可见 | ❌ 不可见 |
| Finance Officer | ❌ 不可见 | ✅ 可见 + 操作 | ✅ 可见 + 操作 |
| Super Admin | ✅ | ✅ | ✅ |
| 多职运营员 | ✅ | ✅ | ✅ |

汇总栏只显示有权限的类型卡片。Tab 过滤器同理。

---

## 7. 实现分阶段

### Phase 1 — 个人工作台（MVP，当前执行范围）

**目标**：一个人能在一个页面处理完所有待审批，不再需要切换模块。

| # | 功能 | 技术要点 |
|---|------|---------|
| 1.1 | 路由 + 页面骨架 | `/crm/approvals`，`Suspense` 包裹，PageHeader + 汇总栏 + Tab + FilterBar + 列表 |
| 1.2 | 数据聚合 Service | `approvalService.list()` 聚合 CLM cases（kyc 类型）+ 存款 pending + 提款 pending |
| 1.3 | 汇总栏 | 三张统计卡，各显示 pending count + overdue count，点击切换 Tab |
| 1.4 | Tab 过滤 | All / KYC / Deposits / Withdrawals，Tab 数字实时更新 |
| 1.5 | SLA 排序 | overdue 优先，剩余时间 ASC；`useEffect` 每 15s 重算倒计时 |
| 1.6 | 内联快速审批 | Deposit/Withdrawal 满足阈值条件时显示内联按钮；Reject 展开 Inline Reason 表单 |
| 1.7 | KYC 跳转 | `[Review →]` 按钮跳转 `/crm/clm/cases/[id]`；高风险 Deposit/Withdrawal 同样跳转 |
| 1.8 | URL 状态同步 | `?type=` `?status=` `?risk=` `?sla=` 写入 URL，支持刷新保持 |
| 1.9 | 菜单角标 | Sidebar `Approvals` 菜单项显示待审批总数；overdue > 0 时显示红点 |
| 1.10 | Audit Log | 所有操作双写：全局 Audit Trail + 模块专属日志 |

**不在 Phase 1 范围**：Assign、Batch 操作、统计看板。

---

### Phase 2 — 团队协作与效率工具（后续规划）

| # | 功能 | 说明 |
|---|------|------|
| 2.1 | **Assign 指派** | 列表行 Assignee 列点击 → Staff 下拉（按权限过滤），指派后写 Audit Log |
| 2.2 | **Batch 批量审批** | 勾选多行 → 批量 Approve（仅 `canInlineApprove = true` 的行可选），确认 Dialog 显示影响范围 |
| 2.3 | **统计看板** | 今日处理量 / 平均处理时长 / 超时率 / 各类型占比，嵌入 Approval Inbox 顶部可折叠区域 |
| 2.4 | **Hold 超时自动升级** | Hold 状态超过配置时长（默认 24h）自动变回 Pending 并触发通知 |
| 2.5 | **关联显示** | 同一用户有多条待审批时，聚合为展开组（Group by User），方便关联决策 |
| 2.6 | **浏览器推送通知** | 有新的 overdue 任务时，浏览器 Notification API 推送提醒 |
| 2.7 | **导出** | 导出当前筛选结果为 CSV，用于合规存档 |

---

## 8. 待确认问题

| # | 问题 | 影响 |
|---|------|------|
| Q1 | 菜单位置 | ✅ 顶层独立入口，与 Dashboard / Clients / CLM Center 同级 |
| Q2 | 内联审批金额阈值 | ✅ Deposit < $50,000 / Withdrawal < $10,000 可内联，超出强制跳转 |
| Q3 | Hold 状态的最长保持时长？超时后是否自动升级？ | ⏳ 待确认 |
| Q4 | 同一用户同时有 KYC + 提款待审批时，是否关联显示？ | ⏳ 待确认 |
| Q5 | Phase 1 / Phase 2 范围 | ✅ Phase 1 = 个人工作台，Assign 移入 Phase 2 |

---

## 9. 竞品参考

| 产品 | 做法 |
|------|------|
| Stripe Radar | 统一 Review Queue，所有支付风险事件合并，按 Score 排序 |
| Coinbase Prime | Compliance + Finance 审批分模块，无统一 Inbox |
| Linear | My Issues：个人工作台，跨项目聚合，按优先级排序 |
| Jira | My Work：个人待办，跨项目，支持按 Due Date 排序 |

本方案接近 **Stripe Radar + Linear My Issues** 的混合模式：统一入口 + 复杂任务跳转详情。

---

*Author: TradePass Dev | 2026-05-13*
