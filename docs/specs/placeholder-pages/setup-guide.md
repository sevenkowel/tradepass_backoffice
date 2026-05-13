# `/crm/setup-guide` — Setup Checklist

> **数据契约**：
> - 新建 `prisma.tenantSetupTask`：id / tenantId / category / step_key / status (`not_started`/`in_progress`/`completed`/`skipped`/`failed`) / required / order / metadata（JSON） / completedAt / completedBy / dependsOn[]
> - 用 multi-tenant 时 per-tenant 独立进度
> - 检查项的 evaluator function 在 server-side，不在 UI 写死

---

## 1. 目的

新租户（broker）开通 CRM 后的"开门红"引导清单。让租户清楚：
- 必做：什么不配 CRM 不能开张（KYC config / Payment channel / 至少 1 个 MT account group / 1 个 admin staff）
- 应做：上线前补全（Agreement templates / Risk rules / Email templates / Branding）
- 可做：长期持续完善（Marketing campaigns / IB tier / AI signals）

> 与 `/crm/setup-guide/manuals` 的边界：此页 = **任务清单 + 进度跟踪**；manuals = **静态文档 / 视频**。

---

## 2. 数据展示

### 2.1 顶部进度条

```
[████████░░░░░░] 60% complete  ·  8 of 14 required tasks done  ·  12 of 22 total
```

警示分级：
- 红色：必做未做 + blocks core function（如未配 payment channel，无法接受入金）
- 黄色：应做未做 + 影响体验
- 灰色：可做

### 2.2 任务分组（折叠 cards）

| Category | 示例任务 |
|---|---|
| **Identity & Branding** | 上传 logo / favicon / 配 primary color / 设置 domain (e.g. broker.example.com) / 配置 brand name + slogan |
| **Compliance Foundation**（必做） | 选定支持的 jurisdiction / 配 KYC flow per jurisdiction / 上传 Agreement templates (TOS / Risk / Privacy) / 配 AML provider (Sumsub / Refinitiv) keys |
| **Trading Setup**（必做） | 添加至少 1 个 MT account group / 添加至少 5 个 instruments / 配 default leverage / 配 trading hours |
| **Funds Setup**（必做） | 至少 1 个 deposit channel / 至少 1 个 withdrawal channel / 配 Fund Policy / 设 dual-sign 阈值 |
| **Staff & Permissions**（必做） | 至少 1 个 admin staff / 创 compliance officer / 创 finance officer / 配 RBAC |
| **Risk Center**（应做） | 配 risk rules / 设 NBP protection / 设 margin alert thresholds |
| **Communications**（应做） | 配 email provider (SendGrid / SES) / 配 SMS provider / 上传 transactional email templates |
| **Marketing**（可做） | 创建 first campaign / 配 IB tier 与 commission rates / 开启 promo codes |
| **Integration**（可做） | 接入 third-party verification (Sumsub) / 接入 Risk Engine / 接入 Reporting tool |

### 2.3 任务卡详情

每张卡：
- Task name + description
- Required / Recommended badge
- Status badge
- 完成日期 + 完成员工（如已完成）
- "Go to" 按钮 → 跳到对应配置页（已预填好建议默认值）
- 依赖任务（如未完成 X 则禁用此卡）
- Skip 选项（仅可做项 / 带原因）

### 2.4 准入门禁（顶部 banner）

如果必做项未完成，显示横幅："Your broker is not yet ready to accept clients. Complete [X required tasks] first."

未完成必做项时，client portal 可以**禁止注册新客户**（防止半成品上线坑客户）。

---

## 3. 可执行操作

| 动作 | 权限 |
|---|---|
| Go to task | viewer+ |
| Mark as completed manually（部分任务可能无法自动检测） | admin |
| Skip task | admin + 必填 reason |
| Reset task to not_started | admin |
| Export progress PDF（给业务方报告） | admin |

---

## 4. 副作用

| 动作 | 审计 |
|---|---|
| Task completion（自动检测触发） | `system.setup.task_completed` (info) |
| Mark completed manually | `system.setup.manual_completion` |
| Skip | `system.setup.skip` |
| All required completed | `system.tenant.ready` (critical) — 触发"开门红" celebration + 解锁 client portal 注册 |

---

## 5. 实现要点

- Task 定义在 server-side：每个 task 有 `evaluator(): Promise<boolean>` 自动检测
- 定时（每 5 min）+ 触发（任何配置变更）reevaluate
- "Go to" 按钮跳到对应配置页时附 `?from=setup-guide` query，让目标页知道是从引导来的（可显示提示）
- 完成度计算：`completed_required / total_required` × 100
- 进度持久化到 `tenantSetupTask` 表
- New tenant 初始化时 seed 所有 task = not_started
- 引导完成（all required done）后此页 collapsed 显示，可在 sidebar 隐藏（admin 可重新打开）

---

## 6. 边界

| 此页 | `/crm/setup-guide/manuals` | `/crm/system/*`配置页 |
|---|---|---|
| 任务清单 + 进度 | 静态文档 | 实际配置入口 |

---

## 7. OPEN

| # | 问题 |
|---|---|
| Q1 | 必做 / 应做 / 可做的分级是平台统一还是 broker 自定义？ |
| Q2 | "未完成必做项时禁止注册新客户" 是否启用？影响 broker 上线速度 |
| Q3 | 每个 task 的 evaluator 怎么写：硬编码 vs 配置化？ |
| Q4 | 多人协作完成 task 时，"completedBy" 字段如何记录（最后一人 vs 历史列表）？ |
