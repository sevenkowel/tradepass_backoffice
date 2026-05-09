# CRM Client Detail Page — 需求文档

> 基于 PRD `CRM Client Detail Page PRD` 与现有代码现状的 Gap 分析 & 实现规划
> Version: v1.0 | 待确认后执行

---

## 1. 现状速览

| 项目 | 状态 |
|---|---|
| 路由 | `/crm/clients/[id]/page.tsx` + `layout.tsx` |
| Tab 数量 | 12 个（Overview / KYC / Risk / Accounts / Funds / Trades / Device / Audit / Agreements / Logs / Notes / Relations）|
| 有内容的 Tab | 仅 3 个：Overview、KYC、Risk（均为硬编码 mock 数据） |
| 左侧边栏 | Avatar、Status、Freeze/Message 按钮、Balance/Equity/Risk/KYC 统计、Basic Info、Tags |
| 数据层 | `clientService` mock 类（内存数组），`BackofficeUser` 类型已有 v2 扩展字段 |
| 竞品参考 | `UserDetailDrawer.tsx` 有更完整的 Accounts/Funds/Trades/KYC/IB mock 实现 |

---

## 2. PRD vs 现状 Gap 总表

### 2.1 结构层 Gap

| PRD 要求 | 现状 | 差距 |
|---|---|---|
| **Sticky Header Status Bar**（独立粘性头部，含 Badges + Quick Actions） | 无独立 Header，信息散落在 Layout Sidebar 中 | 🔴 需新增 |
| **14 个 Tab**（含 Cases / Tickets / Timeline） | 仅 12 个 Tab，缺 Cases、Tickets、Timeline；Audit/Logs 重复 | 🔴 需合并/新增 |
| **Left Sidebar：Risk Score Card / Lifecycle / Value Info** | 只有简单 Balance/Equity 行 | 🟡 需增强 |

### 2.2 Tab 层 Gap（逐个分析）

| Tab | 现状 | PRD 要求 | 差距评级 |
|---|---|---|---|
| **Overview** | 4 个 KPI 卡片 + 硬编码 Activity + Lifecycle | KPI 卡片 + **风险警告区** + 最近活动 | 🟡 中 |
| **KYC** | 状态卡片 + 文档列表 + 个人信息网格 | 文档信息 + **OCR 对比（左图右文）** + **风险指标** + **审核操作按钮** | 🔴 高 |
| **Accounts** | Placeholder | MT 账户表格 + 禁用/改杠杆/改组/限制交易/新建账户 | 🔴 高（Drawer 有可复用代码） |
| **Funds** | Placeholder | 入金/出金记录 + **风险监控** + 冻结/拒单/强制人工审核 | 🔴 高（Drawer 有可复用代码） |
| **Trading** | Placeholder（Trades） | 交易统计 + **风险行为检测**（套利/剥头皮/高频） | 🔴 高（Drawer 有可复用代码） |
| **Risk** | 3 个卡片 + 5 条进度条因子 | 风险评分 + 风险因子 + **用户关系图谱**（共享 IP/设备/银行卡） | 🔴 高 |
| **Devices** | Placeholder（Device） | IP/设备/浏览器/时区表格 + 强制登出/冻结/重置 2FA/标记风险 | 🔴 高 |
| **Cases** | ❌ 无此 Tab | 审批工作流：KYC/出金/重新提交/视频认证，含 SLA/指派/升级 | 🔴 高 |
| **Tickets** | ❌ 无此 Tab | 客服工单：财务/KYC/出金/投诉/风控申诉，含对话时间线 | 🔴 高（`/crm/support` 已有工单系统，可复用组件） |
| **Permissions** | Placeholder | 自动出金/最大杠杆/跟单/推广访问等权限开关 | 🟡 中 |
| **Agreements** | Placeholder | 协议版本/签署时间/IP/PDF 存档，支持查看/下载/强制重签 | 🟡 中 |
| **Timeline** | ❌ 无此 Tab | 统一事件时间线：注册→KYC→入金→交易→出金全生命周期 | 🔴 高 |
| **Notes** | Placeholder | 内部协作笔记：风险备注/@同事/跟进记录/销售笔记 | 🟡 中（`clientService` 已有 `getNotes`/`addNote` API） |
| **Audit Logs** | Placeholder（Logs） | 合规审计日志：操作人/动作/旧值/新值/时间/IP | 🔴 高 |

### 2.3 系统层 Gap

| PRD 要求 | 现状 | 差距 |
|---|---|---|
| **Full Audit Trail**（所有操作记录 operator/action/old/new/timestamp/IP） | 无 | 🔴 需设计 |
| **RBAC 权限控制**（每 Tab、每 Action 按角色控制） | 无 | 🔴 需设计（可与现有 `crmSidebarStore` 权限体系打通） |
| **Real-Time Refresh / WebSocket** | 无，纯客户端 mock | 🟡 先预留结构，后续接入 |
| **Timeline Integration**（所有操作自动同步到 Timeline） | 无 Timeline 模块 | 🔴 需设计 |
| **多租户配置**（不同租户不同 KYC 流程/权限/工单/杠杆规则） | 项目支持多租户，但 Detail 页无租户级配置入口 | 🟡 中 |

---

## 3. 技术约束 & 复用资产

### 3.1 可复用组件

| 资产 | 位置 | 可复用程度 |
|---|---|---|
| `EnhancedDataTable` | `src/components/crm/ui/EnhancedDataTable.tsx` | 全部 Tab 的表格均可用 |
| `StatusBadge` / `RiskBadge` / `KYCStatusBadge` | `src/components/crm/ui/StatusBadge.tsx` 等 | Header / Sidebar / Tab 内均可复用 |
| `PageHeader` / `Card` / `FilterBar` | `src/components/crm/ui/*.tsx` | 通用布局 |
| `UserDetailDrawer` | `src/components/crm/users/UserDetailDrawer.tsx` | Accounts/Funds/Trades/KYC/IB 的 mock 实现可直接迁移到 Tab 组件 |
| 工单系统 | `src/app/crm/support/` | Tickets Tab 可复用现有工单组件 |

### 3.2 数据层现状

- `clientService`：纯 mock，支持 `getById` / `freeze` / `unfreeze` / `addTags` / `removeTags` / `getNotes` / `addNote` / `getRelatedUsers` / `getStats`
- `BackofficeUser`：已有 `riskLevel` / `riskScore` / `lifecycleStage` / `ftdDate` / `totalDeposit` / `totalWithdrawal` / `netDeposit` / `tradingVolume` / `deviceCount` / `ipCount` / `relatedUserIds` 等字段
- 缺少的类型：AuditLog、Case、Ticket、Device、Permission、Agreement、TimelineEvent 等需新增

### 3.3 设计约束

- 样式：Tailwind CSS v4 + 项目自定义色板（slate/blue/emerald/violet/amber/red）
- 图标：Lucide React
- 动画：Framer Motion（已有使用）
- 状态：Zustand（全局）+ useState（局部）
- 组件语言：与现有 CRM 保持一致，使用中文标签 + 英文代码

---

## 4. 实现方案（建议按 Phase 推进）

### Phase 1：骨架与 Header（基础框架）

1. **新增 Sticky Header 组件**
   - 提取为独立组件 `ClientDetailHeader`
   - 内容：UID / Full Name / Country / Email / Phone / Registration Time / IB / Source Channel
   - Status Badges 行：KYC Level / Risk Level / User Status / FTD Status / Withdrawal Status / AML Status / Auto Withdrawal
   - Quick Actions 行：Freeze / Restrict Withdrawal / Request Resubmission / Adjust Leverage / Modify Permissions / Add Note / Create Ticket / Send Notification

2. **Tab 结构调整**
   - 将现有 12 Tab → 调整为 14 Tab（与 PRD 对齐）
   - Audit + Logs 合并为 **Audit Logs**
   - 新增 **Cases**、**Tickets**、**Timeline**

3. **Sidebar 增强**
   - Risk Score Card（大数字 + 颜色等级）
   - Lifecycle Stage（可视化步骤：Register → Verified → FTD → Active Trader）
   - User Value Info（Net Deposit / Current Balance / Equity / Total Lots / Open Positions / Total Profit）

### Phase 2：核心 Tab 填充（高价值优先）

按优先级排序：

| 顺序 | Tab | 理由 | 工作量 |
|---|---|---|---|
| 1 | **Overview** | 首页门面，数据已有 | 小 |
| 2 | **Accounts** | Drawer 有现成代码可迁移 | 中 |
| 3 | **Funds** | Drawer 有现成代码可迁移 | 中 |
| 4 | **Trading** | Drawer 有现成代码可迁移 | 中 |
| 5 | **KYC** | 需新增 OCR 对比 + 审核按钮 + 风险指标 | 中 |
| 6 | **Risk** | 需新增用户关系图谱 | 中 |
| 7 | **Notes** | `clientService` 已有 API，只需 UI | 小 |
| 8 | **Timeline** | 需设计事件模型，但数据可 mock | 中 |

### Phase 3：运营 Tab 填充

| 顺序 | Tab | 理由 | 工作量 |
|---|---|---|---|
| 9 | **Tickets** | 可复用 `/crm/support` 工单组件 | 中 |
| 10 | **Cases** | 需设计 Case 模型 + 工作流 UI | 中 |
| 11 | **Devices** | 需 Device 数据模型 | 中 |
| 12 | **Permissions** | 权限开关 UI | 小 |
| 13 | **Agreements** | 协议列表 + PDF 查看器 | 中 |
| 14 | **Audit Logs** | 需 AuditLog 模型 + 表格 | 中 |

### Phase 4：系统能力

- **Audit Trail 中间件**：封装所有 Client Detail 页的操作，自动记录 operator/action/old/new/timestamp/IP
- **RBAC 权限检查**：每个 Tab 渲染前检查权限，每个 Action 按钮做权限控制
- **Timeline 自动集成**：关键操作（Freeze、KYC Approve、Withdrawal Reject 等）自动写入 Timeline

---

## 5. 数据模型扩展建议

需新增以下类型（放在 `src/types/backoffice/user.ts` 或新建 `src/types/backoffice/client-detail.ts`）：

```typescript
// 设备
interface ClientDevice { id; ip; country; deviceId; browser; os; timezone; lastUsedAt; isRisky }

// 审计日志
interface AuditLog { id; operator; action; targetField; oldValue; newValue; timestamp; ipAddress; clientId }

// 时间线事件
interface TimelineEvent { id; clientId; type; title; description; metadata; timestamp; operator? }

// 审批 Case
interface CaseItem { id; caseId; type; status; sla; reviewer; clientId; createdAt; updatedAt; comments }

// 交易账户
interface TradingAccount { id; mtAccount; accountType; leverage; status; balance; equity; margin; marginLevel; group }

// 资金记录
interface FundRecord { id; type: 'deposit' \| 'withdrawal'; amount; method; status; createdAt; reviewedBy? }

// 交易记录
interface TradeRecord { id; symbol; type; volume; openPrice; closePrice; profit; openTime; closeTime }
```

---

## 6. 待确认问题

1. **Tab 命名对齐**：PRD 中的 `Trades` → 是否改为 `Trading`？`Logs` + `Audit` → 合并为 `Audit Logs`？
2. **Header 实现方式**：是在 `layout.tsx` 中新增固定 Header，还是在 `page.tsx` 顶部加 sticky 区域？
3. **Cases / Tickets 优先级**：这两个 Tab 依赖后端工作流，是否先做 UI mock，等后端接口？
4. **用户关系图谱**：Risk Tab 的「共享 IP/设备/银行卡」关系图，用哪种可视化方案？（SVG / ECharts / 简单节点图）
5. **OCR 对比**：KYC Tab 的「左图右文」OCR 对比，图片从哪里加载？（mock 固定图片 URL / base64 / 占位符）
6. **Phase 执行粒度**：是否按 Phase 逐个确认再执行，还是确认整体方案后我一次性排期实现？

---

## 7. 文件变更预估

| 类型 | 数量 | 说明 |
|---|---|---|
| 新增组件 | ~20 个 | 每个 Tab 1 个主体组件 + Header + Sidebar 增强 + 若干子组件 |
| 修改组件 | 3 个 | `page.tsx` / `layout.tsx` / `client.service.ts` |
| 新增类型 | 1 个文件 | `src/types/backoffice/client-detail.ts` |
| 新增 mock 数据 | 1 个文件 | `src/lib/crm/mock-client-detail.ts` |

---

## 8. 用户确认意见（已锁定）

| # | 问题 | 确认结果 |
|---|---|---|
| 1 | Tab 命名 | `Trades` → `Trading`；`Audit` + `Logs` 合并为 `Logs` |
| 2 | Header 位置 | `page.tsx` sticky 顶部（与 Tab 导航同层级） |
| 3 | Cases / Tickets | 先做 UI mock，数据用 mock |
| 4 | 关系图谱 | Risk Tab 使用 ECharts 实现用户关系网络图 |
| 5 | OCR 对比 | KYC 左图右文，图片用占位符 |
| 6 | 执行方式 | 一次性排期，按 Phase 连续执行 |

---

## 9. 执行计划（已确认）

### Phase 1：骨架结构
- [ ] 新增类型定义 `src/types/backoffice/client-detail.ts`
- [ ] 新增 mock 数据 `src/lib/crm/mock-client-detail.ts`
- [ ] 重构 `page.tsx`：Sticky Header + 14 Tabs 路由
- [ ] 增强 `layout.tsx` Sidebar：Risk Score Card / Lifecycle / Value Info
- [ ] 新增 `clientDetailService` 扩展 mock 服务

### Phase 2：核心 Tab（8 个）
- [ ] Overview Tab（KPI + 风险警告 + 最近活动）
- [ ] Accounts Tab（MT 账户表格 + 操作）
- [ ] Funds Tab（入金/出金 + 风险监控）
- [ ] Trading Tab（交易统计 + 风险行为）
- [ ] KYC Tab（文档 + OCR 对比占位 + 审核操作）
- [ ] Risk Tab（评分 + 因子 + ECharts 关系图谱）
- [ ] Notes Tab（内部笔记 + @提及）
- [ ] Timeline Tab（统一事件时间线）

### Phase 3：运营 Tab（6 个）
- [ ] Tickets Tab（客服工单 UI mock）
- [ ] Cases Tab（审批工作流 UI mock）
- [ ] Devices Tab（设备/登录管理）
- [ ] Permissions Tab（权限开关）
- [ ] Agreements Tab（协议管理）
- [ ] Logs Tab（审计日志表格）

### Phase 4：系统能力
- [ ] Audit Trail 封装（操作自动记录）
- [ ] RBAC 权限检查（Tab / Action 级别）
- [ ] Timeline 自动集成（关键操作同步）

---

**状态：已确认，开始执行。**
