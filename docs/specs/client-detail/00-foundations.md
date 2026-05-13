# Client Detail — Foundations

> 客户详情页 `/crm/clients/[id]` 的横切关注点：角色权限、状态机、跨 tab 联动、审计与时间线约定。
> 14 个 tab 各自规格见 `01-core.md` / `02-compliance.md` / `03-ops.md` / `04-system.md`。

---

## 1. 设计原则

| # | 原则 | 说明 |
|---|---|---|
| 1 | **单一数据源（SSoT）** | 14 个 tab 共享 `ClientDetailContext`。任何 mutation 后必须 `refresh()`。不允许 tab 内独立 fetch 主数据。 |
| 2 | **所有写操作 → 审计 + 时间线** | 一次员工动作产生两条记录：`crm_audit_logs`（结构化，给合规审计用）+ `crm_timeline_events`（人类可读，给客户视图用）。 |
| 3 | **没有静默修改** | 任何改客户状态的操作必须有 reason / actor / IP。审计中能完整复现"谁、何时、在哪个 IP、为什么、把哪个字段从 X 改成 Y"。 |
| 4 | **乐观锁，悲观提示** | 长时操作（出金审核、KYC 审核）锁定 `caseId`，二审员工打开同一案例时看到"正在被 X 处理"。 |
| 5 | **客户可见 vs 内部** | 内部 notes/cases/logs 永不暴露给客户。Ticket 区分 `staff_only_message` 和 `customer_facing_message`。 |
| 6 | **不破坏 MT 真相** | MT4/MT5 是交易资金的事实源。CRM 显示余额/持仓时**永远**以 MT 服务器为准；手动调整必须通过 Funds tab 的"调账"流程，再由桥接同步回 MT。 |
| 7 | **金额绝对** | 所有金额带 currency；不做隐式 USD 换算。客户多账户多币种时按账户分组展示。 |

---

## 2. 角色权限矩阵

`requireRole` 已支持的 6 个角色（`src/lib/permissions.ts`）。每个 tab 的具体动作权限在各自的 spec 文件里列。

| 角色 | 典型职责 |
|---|---|
| `admin` | 平台所有人/CTO 级别。**所有**操作可执行。 |
| `compliance_officer` | KYC 审核、AML 调查、Sanctions、协议、可疑活动报告（SAR）。 |
| `risk_manager` | 交易风控、保证金、强平、A/B-book 路由、风险关联图。 |
| `finance_officer` | 出入金审核（合规线索除外）、IB 佣金支付、调账、对账。 |
| `support_agent` | 工单回复、备注、视频认证、协助客户找密码 / 二次激活。 |
| `viewer` | 只读。审计员 / 外部审查 / 新员工培训。 |

### 操作权限通用约定

| 动作类型 | 默认所需角色 | 备注 |
|---|---|---|
| 查看任何 tab | `viewer +` | viewer 看不到 staff-only Notes 和金额 PII 末四位以外 |
| 加 Note | 任何已认证 staff | 自己写的可编辑 30 分钟内 |
| 创建 Case | `compliance_officer / risk_manager / support_agent / admin` | 普通 staff 不能直接创建合规级 case |
| Approve/Reject 合规动作 | `compliance_officer / admin` | KYC、SAR、Watchlist |
| Approve/Reject 资金动作 | `finance_officer / admin`，大额（>=$10k）须 `+ compliance_officer` 双签 | 大额阈值可配 |
| 风控冻结/强平 | `risk_manager / admin` | 不可逆操作要 confirmation 弹窗 |
| 改 Permissions | `admin / compliance_officer` | leverage cap、产品白名单 |
| 改 Tag | `compliance_officer / support_agent / risk_manager / admin` | 系统标签不可删 |

> **未来**：迁移到细粒度 `permission_key` 表，按 `(role, action, target)` 配置，而不是写死在代码里。当前 MVP 用角色组。

---

## 3. 客户级状态机

### 3.1 KYC 状态机

```
not_submitted ──→ submitted ──→ in_review ──┬──→ approved ──→ expired (周期性 renew)
                                            ├──→ rejected
                                            └──→ needs_more_docs ──→ submitted (回到 submitted)
```

**字段**：`User.kycStatus`（顶层概览） + `KYCRecord.status`（最近一次提交的精确状态）。
**触发文档**：见 `02-compliance.md` KYC tab。

### 3.2 Account（账户）状态机

```
active ──→ restricted_trading ──→ restricted_all ──→ disabled ──→ archived
   ↑              │                      │
   └──────────────┴──────────────────────┘  (任何状态可降级回 active 由 admin/risk)
```

| 状态 | 客户体验 |
|---|---|
| active | 可登录 MT、可交易、可出入金 |
| restricted_trading | 可登录、可出入金、**不可开新仓**；现有仓位可平 |
| restricted_all | 可登录看数据，不可任何操作 |
| disabled | 不可登录 MT；账户余额冻结 |
| archived | 数据保留但 UI 隐藏，符合保留期满后再删除 |

### 3.3 Withdrawal 状态机

```
requested ──→ compliance_review ──┬──→ rejected_compliance
                                  └──→ finance_review ──┬──→ rejected_finance
                                                        └──→ approved ──→ processing ──┬──→ completed
                                                                                       └──→ failed_refunded
```

- **compliance_review**：自动扫 AML / sanctions，多于 $10k 触发人工
- **finance_review**：核对收款方信息、扣手续费、生成出金指令
- **processing**：实际打款（银行 / 链上）— 第三方异步回调
- **failed_refunded**：打款失败，原路退回客户钱包

### 3.4 Case 状态机（CLM 模块定义，CRM 引用）

```
new ──→ in_review ──→ pending_evidence ──┬──→ approved
                                         ├──→ rejected
                                         └──→ escalated ──→ closed_escalated
```

### 3.5 Ticket 状态机

```
open ──→ in_progress ──→ waiting_customer ──→ resolved ──→ closed
   │           │                  │              │
   └───────────┴──────────────────┴──────────────┘  (任何状态可 re-open)
```

---

## 4. 跨 tab 联动表（16 tabs）

任何 mutation 触发后，**显式必须刷新或显示**的 tab。打 ✓ 表示该 tab 需要响应。

> 表头缩写：Ov=Overview · Acc=Accounts · Fund=Funds · Trd=Trading · Risk · KYC · Case=Cases · Agr=Agreements · Tkt=Tickets · Dev=Devices · Not=Notes · **Mkt=Marketing** · **IB** · Perm=Permissions · TL=Timeline · Log=Logs

| 触发动作 | Ov | Acc | Fund | Trd | Risk | KYC | Case | Agr | Tkt | Dev | Not | Mkt | IB | Perm | TL | Log |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| KYC 通过 | ✓ |  |  |  | ✓ | ✓ | ✓ |  |  |  |  |  |  | ✓ | ✓ | ✓ |
| KYC 拒绝 | ✓ |  |  |  | ✓ | ✓ | ✓ |  | ✓ |  |  |  |  |  | ✓ | ✓ |
| 冻结账户 | ✓ | ✓ | ✓ |  |  |  |  |  |  |  |  |  |  | ✓ | ✓ | ✓ |
| 出金批准 | ✓ |  | ✓ |  |  |  |  |  |  |  |  |  |  |  | ✓ | ✓ |
| 出金拒绝 | ✓ |  | ✓ |  | ✓ |  | ✓ |  | ✓ |  |  |  |  |  | ✓ | ✓ |
| 强平仓位 | ✓ | ✓ |  | ✓ | ✓ |  |  |  |  |  |  |  |  |  | ✓ | ✓ |
| 调杠杆 |  | ✓ |  |  |  |  |  |  |  |  |  |  |  | ✓ | ✓ | ✓ |
| 改产品白名单 |  | ✓ |  | ✓ |  |  |  |  |  |  |  |  |  | ✓ | ✓ | ✓ |
| 加 Tag |  |  |  |  | ✓ |  |  |  |  |  |  | ✓ |  |  | ✓ | ✓ |
| 加入 watchlist | ✓ |  |  |  | ✓ |  |  |  |  |  | ✓ |  |  |  | ✓ | ✓ |
| 设备撤销 |  |  |  |  | ✓ |  |  |  |  | ✓ |  |  |  |  | ✓ | ✓ |
| 协议过期/重签 | ✓ |  |  |  |  |  |  | ✓ |  |  |  |  |  |  | ✓ | ✓ |
| 工单升级为 Case | ✓ |  |  |  |  |  | ✓ |  | ✓ |  |  |  |  |  | ✓ | ✓ |
| **客户 opt-out marketing** |  |  |  |  |  |  |  |  |  |  |  | ✓ |  | ✓ | ✓ | ✓ |
| **campaign 触达此客户** |  |  |  |  |  |  |  |  |  |  |  | ✓ |  |  | ✓ |  |
| **客户收到 email/SMS/push** |  |  |  |  |  |  |  |  |  |  |  | ✓ |  |  |  |  |
| **IB tier 升级** | ✓ |  |  |  |  |  |  |  |  |  |  |  | ✓ | ✓ | ✓ | ✓ |
| **客户从 IB A 转到 IB B** | ✓ |  |  |  |  |  |  |  |  |  |  |  | ✓ |  | ✓ | ✓ |
| **commission 结算（客户作为 IB）** |  |  | ✓ |  |  |  |  |  |  |  |  |  | ✓ |  | ✓ | ✓ |
| 协议过期/重签 | ✓ |  |  |  |  |  |  | ✓ |  |  |  |  | ✓ | ✓ |
| 工单升级为 Case | ✓ |  |  |  |  |  | ✓ |  | ✓ |  |  |  | ✓ | ✓ |

> **实现约定**：`ClientDetailContext.refresh()` 是粗粒度全刷。对于 latency 敏感的 tab（Trading / Funds），后端 mutation 返回后前端先做 optimistic update，再 background refresh 校正。

---

## 5. 审计 & 时间线写入约定

### 5.1 审计日志（`crm_audit_logs`）

**必填字段**：`userId`, `operatorId`, `operatorName`, `action`（点分命名）, `ipAddress`, `createdAt`
**条件必填**：`targetField`, `oldValue`, `newValue`（涉及字段修改时）

**Action 命名规则**：`<domain>.<entity>.<verb>`，全小写。

| 类别 | 示例 |
|---|---|
| 客户级 | `client.status.update`、`client.tag.add`、`client.tag.remove`、`client.permission.update` |
| KYC | `kyc.review.assign`、`kyc.review.approve`、`kyc.review.reject`、`kyc.document.request` |
| 账户 | `account.create`、`account.leverage.change`、`account.group.change`、`account.password.reset` |
| 资金 | `funds.deposit.approve`、`funds.deposit.adjust`、`funds.withdrawal.approve`、`funds.withdrawal.reject`、`funds.freeze` |
| 交易 | `trading.position.close`、`trading.order.cancel`、`trading.sltp.update` |
| 风控 | `risk.watchlist.add`、`risk.override.set`、`risk.aml.escalate` |
| 工单 / Case | `case.assign`、`case.escalate`、`ticket.reply`、`ticket.assign` |
| 设备 | `device.session.revoke`、`device.ip.block` |
| 协议 | `agreement.resubmission.request` |
| Note | `note.add`、`note.pin`、`note.delete` |

### 5.2 时间线事件（`crm_timeline_events`）

**面向客户视角**的人类语言。一个 mutation 通常对应 1 条时间线，但**仅当客户视角有意义**时才写。

| 写时间线的事件 | 不写时间线的事件 |
|---|---|
| 注册、KYC 状态变化、入金、出金、首次交易、登录设备首次出现、被冻结/解冻、Tag VIP 标记、协议签署、被加入 watchlist、Ticket 创建 | 内部 case 状态流转、Note 添加、staff 分配变更、列表查看、过滤变更 |

**字段**：`type`（枚举）、`title`（短）、`description`（一行）、`metadata`（JSON 透传细节）、`operatorId`（可空，系统事件留空）

---

## 6. 通用 UI 规范

### 6.1 Drawer / Modal 用法

| 场景 | UI |
|---|---|
| 简单单字段编辑（leverage、tag） | inline 编辑或弹出 Popover |
| 多字段表单（创建账户、提交出金审核） | Drawer，右侧滑出，footer 固定 |
| 不可逆动作（冻结、强平、删除） | 居中 Modal，需要敲 `CONFIRM` 或选择原因下拉 |
| 长流程（KYC 审核、Withdrawal 审核） | 独立子路由，避免 drawer 被关闭丢上下文 |

### 6.2 操作反馈

- 成功：toast top-right，3 秒消失
- 失败：toast 红色，配合页面内 inline error
- 长任务（>2s）：按钮进入 loading 状态，禁用其他相关动作
- 不可逆动作的 confirm modal 默认按钮是 **Cancel**，破坏性按钮在右

### 6.3 空态

| 状态 | UI |
|---|---|
| Loading 首次 | 骨架 placeholder |
| Loading 刷新 | 顶部 1px 进度条 + 上次内容半透 |
| 完全为空（无数据） | 居中文案 + 引导操作（如 "添加首笔 Note"） |
| 错误 | inline 红框，附 Retry 按钮 |

### 6.4 列表 / 表格

- 默认按时间倒序
- 长列表分页 20 / 50 / 100；> 1000 行加导出 CSV
- 所有金额列右对齐、tabular-nums
- 状态列用 Badge，不用纯文字
- 行内动作（Edit、More）放最右列，hover 才显

---

## 7. 数据 fetch 策略

| 范围 | 方式 |
|---|---|
| 首次进入详情页 | `/api/crm/clients/[id]/detail` 一次性 aggregator 返回 14 tab 所需顶层数据 |
| 切换 tab | 主数据已在 context；tab 内补充数据用各自 endpoint（如 Trading tab 的 P/L 曲线、Cases tab 的评论历史） |
| 实时数据（MT 持仓、margin level） | 5-10s 轮询；未来切 WebSocket |
| 编辑后 | mutation API → `refresh()` → 全 context 刷新 |

---

## 8. 性能 / 安全约束

| 项 | 约束 |
|---|---|
| 单 client detail API 响应 | < 500ms p95（含 14 tab 聚合） |
| 列表 pagination 默认 | 20 行 |
| 大列表（trading history、audit log）pagination 上限 | 100 行/页，强制分页 |
| 客户 PII（身份证号、银行卡号） | 默认遮罩，hover 才显，且写入审计 |
| Withdrawal 大额（>$10k） | 强制双签（compliance + finance） |
| KYC 文档下载 | 限速；每次下载写审计 |
| Force logout / kill session | 仅 admin / risk_manager；带 reason 字段 |
| 任何 mutation API | 必须 CSRF token、必须 audit |

---

## 9. 国际化（i18n）

- 已有 `LocaleProvider` + `useT()` (`src/lib/i18n/LocaleProvider.tsx`)
- 4 种语言：`zh / en / ja / es`
- 命名空间：`clients.detail.<tab>.<key>`
- 状态/枚举值的标签从单独的 `enums.<domain>.<value>` 拉，避免在每个 tab 里重复
- 数字 / 货币 / 日期 用 `Intl.NumberFormat` / `Intl.DateTimeFormat`，按 locale 分组
