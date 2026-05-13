# Client Detail — System Tabs

> 3 个系统 tab：Permissions / Timeline / Logs。
> 这组是**横切关注**：权限矩阵 + 客户视角的活动流 + 内部审计流。

---

## Tab 14 — Permissions（权限，**4 sections by source module**）

> **数据契约（v3 alignment）**：Permissions tab 是**多源 override** 的客户级聚合配置。详见 [05-alignment.md §3](./05-alignment.md#3-tab--来源模块-详细矩阵16-tabs)。
>
> 4 个 section 一一对应 sidebar 的配置模块；每 section 内的字段都是**该模块全局默认的客户级覆盖**：
>
> | Section | 全局默认配置来源（sidebar 模块） | 计算 effective 的公式 |
> |---|---|---|
> | § Trading | `/crm/trading/settings` + `/crm/trading/instruments/config` | `account.override ?? client.tradingPerm ?? group.default` |
> | § Funds | `/crm/funds/policy` | `client.fundsPerm ?? fundsPolicy.default`（且不能突破 fundsPolicy 硬上限） |
> | § Security | `/crm/system/security` + `/crm/risk/rules` | `client.securityPerm ?? systemDefault` |
> | § IB | `/crm/ib/settings` | `client.ibPerm ?? ibTierDefault` |
>
> **不在此页**：通知偏好（marketing/SMS/push opt-in）—— 已迁到 **Marketing tab** 内的偏好卡，避免重复编辑同一字段。

### 14.1 目的
对单客户的能力开关做**客户级 override**。每个字段都能看到：
- 当前 effective 值
- 来源（默认 / group / level / 客户 override）
- 谁、何时改的（跳 audit）

---

### 14.2 § Trading Permissions（交易权限）

| 权限 | 类型 | 全局默认源 | 说明 |
|---|---|---|---|
| Trading enabled | toggle | trading.settings | 总开关；false = 不能开新仓 |
| Max leverage | select | trading.settings + instrument cap | 单客户上限；不能高于 instrument cap 与 jurisdiction 监管上限 |
| Hedging allowed | toggle | group | 同 symbol 多空同时 |
| EA allowed | toggle | group | Magic number 订单 |
| Scalping allowed | toggle | group | 持仓 < 60s |
| Product allowlist | multi-select | trading.settings | CFD-FX / Crypto / Indices / Commodities / Stocks / Metals |
| Symbol blocklist | multi-select | empty | 单独禁交易品种 |
| Min volume per trade | number (lots) | instrument.min | |
| Max volume per trade | number (lots) | instrument.max | |
| Max open positions | number | unlimited | |
| Max MT accounts（账户能力，归入此 section） | number | 5 | |
| Demo account allowed | toggle | true | |
| Swap-free allowed | toggle | false | 申请后开通 |

可改角色：`risk_manager` + `admin`

---

### 14.3 § Funds Permissions（资金权限）

| 权限 | 类型 | 全局默认源 | 说明 |
|---|---|---|---|
| Deposit enabled | toggle | funds.policy | |
| Withdrawal enabled | toggle | funds.policy + KYC | KYC verified 后默认 true |
| Internal transfer enabled | toggle | funds.policy | 客户多账户间互转 |
| Withdrawal hold（days） | number | funds.policy.cooldown | 出金强制等待天数 |
| Max withdrawal per day | number | funds.policy.daily_limit | 不能 > policy 硬上限 |
| Max withdrawal per month | number | funds.policy.monthly_limit | 同上 |
| Allowed withdrawal methods | multi-select | funds.channels | 限制只能用特定方式 |
| Allowed deposit methods | multi-select | funds.channels | |
| Bonus eligible | toggle | funds.policy.bonus | 是否能领赠金 |
| Manual adjustment cap | number | funds.policy | 此客户的调账单次额度（高于此走双签） |

可改角色：`finance_officer` + `compliance_officer` + `admin`。`withdrawal_enabled` 仅 `compliance` + `admin`。

---

### 14.4 § Security Permissions（安全 / 登录）

| 权限 | 类型 | 全局默认源 | 说明 |
|---|---|---|---|
| 2FA enforced（login） | toggle | system.security + 自动触发（首次入金后） | 强制开 2FA 才能登录 |
| 2FA required for（动作级） | multi-select | system.security | 默认 [withdrawal, trade, password_change, api_key, agreement_sign] 全勾 |
| Login locked to country | multi-select | empty | 仅允许指定国家登录 |
| Login locked to IP range | text (CIDR) | empty | 仅允许指定 IP（机构客户用） |
| Password expiry days | number | system.security | 0 = 永不 |
| Session timeout (min) | number | system.security | 60 默认 |
| API key generation allowed | toggle | system.security | |
| Force device trust check | toggle | false | 每次新设备都必须 verify email |

可改角色：`risk_manager` + `admin`

---

### 14.5 § IB Permissions（IB 关系）

| 权限 | 类型 | 全局默认源 | 说明 |
|---|---|---|---|
| Is IB | toggle | false | 此客户本人是 IB（与 IB tab Case A 联动） |
| IB tier | select | ib.tier_default | 1 / 2 / 3 / partner |
| Custom commission rate | number (%) | tier default | override tier default |
| Sub-IB allowed | toggle | false | 能否再发展下属 IB |
| Parent IB（如客户是某 IB 下线） | display only | from `ibPartner.parentId` | 改请 reassign（IB tab 操作） |
| Marketing material access | toggle | true | 此 IB 是否可下载推广素材 |

可改角色：`admin` only（IB 涉及佣金，慎改）。`Reassign Parent IB` 在 IB tab 触发。

---

### 14.6 显示方式

每个权限一行：
- Label + 描述（tooltip）
- 当前 effective 值（toggle / select / input）
- 来源 indicator：「默认 / group / level / **已覆写**」chip
- 已覆写时显示：谁覆写 + 何时（点击跳对应 audit log 行）
- "复位到默认" 按钮（confirm 弹窗）

每 section 顶部一个 collapsible header + 该 section 的 "Reset section to default" + "Apply template" 按钮。

### 14.7 可执行操作

| 动作 | 权限 | 备注 |
|---|---|---|
| 切换单个字段 | 见各 section 上方 | 即时生效；自动写审计；触发联动 |
| 重置单字段到默认 | 同上 | 显式 confirm |
| Reset 整 section | 同上 | 强 confirm + reason |
| 应用客户级 preset 模板 | admin | "VIP standard" / "High risk lockdown" / "Restricted-trading" |
| 复制到另一客户 | admin | 罕用，需 reason |
| 历史快照回放（看 N 天前的权限） | admin | 通过 audit log diff 重建 |
| Bulk override（跨客户） | admin | 此 tab 不实现，跳设置中心 |
| 导出此客户权限快照 PDF | compliance / admin | 监管审计可能要 |

### 14.8 副作用

| 字段类型 | 审计 (`GlobalAuditLog.action`) | 时间线（客户视角） | 实时同步 |
|---|---|---|---|
| Trading toggle | `client.permission.trading.update` | 仅 `trading_enabled` 写 | MT bridge |
| Funds toggle | `client.permission.funds.update` | 仅 `withdrawal_enabled` 写 | funds service |
| Security toggle | `client.permission.security.update` | 仅 `2fa_enforced` 写 | Auth service |
| IB toggle | `client.permission.ib.update` | 仅 tier 升级 / 降级 写 | IB module |
| Reset section | `client.permission.section.reset` + section 名 | 不写 | 同上 |

### 14.9 联动（自动触发）

| 改 | 触发 |
|---|---|
| `trading_enabled = false` | 提示是否强制平掉所有 open positions（risk 确认） |
| `withdrawal_enabled = false` 且有 pending withdrawal | 自动拒绝 pending + 通知客户 |
| `max_leverage` 降低 | 检查现有持仓是否仍符合（不符合则触发 margin alert） |
| `2FA enforced = true` 且客户未开 2FA | 下次登录强制绑定 |
| `country lock` 改变 | 当前不在允许国家的 session 立即失效 |
| `IB tier` 升级 | 触发 commission rate 重算 + 通知客户 + Timeline 写事件 |
| `Is IB = true` (Convert) | 在 IB tab 显示 Case A 视图；分配 IB code |
| `Sub-IB allowed = false`（已有 sub-IB） | 仅禁止**新发展**，已有不删 |

### 14.10 与对应模块的边界

| 维度 | 此 tab Permissions | 模块全局配置 |
|---|---|---|
| Trading | 单客户级 override | `/crm/trading/settings` 全平台默认 |
| Funds | 单客户级 override（不能突破 policy 硬上限） | `/crm/funds/policy` 平台策略 |
| Security | 单客户 override | `/crm/system/security` 默认 |
| IB | 此客户的 IB 配置 | `/crm/ib/settings` 全局 tier / 默认佣金 |

---

---

## Tab 15 — Timeline（客户时间线，**读视角**）

### 15.1 目的
**客户视角的**事件流。从注册到现在所有重要事件，按时间倒序。给员工"读懂这个客户"的最快路径。未来可暴露给客户 portal（按 `is_client_visible` 过滤）。

### 15.2 与 Logs tab 的边界（已确认 A-Q5）

| 维度 | **Timeline（此 tab）** | **Logs（Tab 16）** |
|---|---|---|
| **视角** | **客户读视角**（"客户经历了什么"） | **员工 / 系统写视角**（"谁做了什么"） |
| 受众 | 内部运营 + 未来 portal 客户自己看 | 内部审计 / 合规 / 调查 |
| 内容 | 关键人类可读事件 | 所有字段级修改 + 读操作（敏感数据） |
| 数据源 | `crmTimelineEvent` + `globalAuditService(visibleOnly=true)` | `GlobalAuditLog` 全量 |
| 数量级 | 数十 - 数百 / 客户 | 数千 - 数万 / 客户 |
| 内部敏感字段 | **隐藏**（watchlist / EDD / force_logout reason / sanctions hit / staff 姓名） | **显示** |
| 操作员显示 | 替换为团队名（"TradePass Compliance / Support / Risk"） | 真实 staff name + role |
| 时间精度 | 精确到分钟 | 精确到毫秒 |
| 写入规则 | 仅 mutation 中显式标记 `is_client_visible=true` 的 | 所有 mutation 自动写 |
| 是否可暴露给客户 portal | 可（按 `is_client_visible` 过滤） | 永不 |
| 排序 | 时间倒序 | 时间倒序，可按 severity / operator 过滤 |
| 主要用例 | "这客户经历了什么？" "上次他跟我们沟通到哪了？" | "今天 Alice 改了哪些客户的什么字段？" "这个 freeze 是谁干的？" |

### 15.3 事件类型

按 domain 分组（顶部 chip filter）：

**Account & Identity**
- `registered`：客户注册
- `email_verified` / `phone_verified`
- `kyc_submitted` / `kyc_approved` / `kyc_rejected` / `kyc_expired`
- `agreement_signed`：协议签
- `account_frozen` / `account_unfrozen` / `account_archived`
- `level_upgraded`：升 VIP

**Funds**
- `deposit_completed` / `deposit_rejected`
- `withdrawal_requested` / `withdrawal_approved` / `withdrawal_rejected` / `withdrawal_completed` / `withdrawal_failed`
- `balance_adjusted`：调账
- `commission_paid`

**Trading**
- `first_trade`：首次交易
- `position_opened` / `position_closed`（仅大额或重大事件，避免淹没）
- `position_force_closed`：被强平
- `margin_call_triggered` / `stop_out_triggered`

**Risk & Compliance**
- `watchlist_added` / `watchlist_removed`
- `edd_started` / `edd_completed`
- `risk_event_triggered`：specific 风险事件
- `sanctions_alert`

**Ops**
- `ticket_created` / `ticket_resolved`
- `case_created` / `case_closed`（仅客户可见 case）
- `notification_sent`（如发了重要邮件）

**Security**
- `new_device_login`：新设备
- `password_changed`
- `2fa_enabled` / `2fa_disabled` / `two_factor_reset`
- `forced_logout`：被员工强制登出
- `geo_restricted`
- `ip_blocked`（仅内部）

### 15.4 显示

每条 timeline 卡片：
- 左侧 icon（按类型）
- 标题（一行，加粗）
- 描述（一行，灰色）
- 时间（相对 + 绝对 hover）
- 关联资源链接（如有：跳到 deposit / withdrawal / case / ticket）
- 操作员名（如有，"by Alice"）

### 15.5 过滤 / 搜索

| 过滤维度 |
|---|
| Domain（account / funds / trading / risk / ops / security） |
| 时间范围（last 24h / 7d / 30d / 90d / custom） |
| 关键词搜索（在 title + description） |

### 15.6 可执行操作

只读 tab，但提供：
| 动作 | 权限 |
|---|---|
| 导出 PDF / CSV | compliance / admin |
| 跳到关联资源 | viewer+ |
| 标记某事件为客户关心 | support（仅在工单上下文用） |

### 15.7 副作用
无（只读）。

### 15.8 性能 / 分页
- 默认 last 30 天
- 每页 50 条，无限滚动
- > 1 年的数据点按月聚合显示，需明确请求才展开

---

## Tab 16 — Logs（审计日志，**写视角**）

> **数据契约（v2 alignment）**：Logs tab 是 `GlobalAuditLog` 的**客户级视图**，不查 CRM 单独的 audit 表。详见 [05-alignment.md](./05-alignment.md) §7。
>
> | 用途 | Canonical |
> |---|---|
> | 跨域审计类型 | `GlobalAuditLog` / `AuditDomain` / `AuditSeverity` (`@/types/core/audit`) |
> | 客户级查询 | `globalAuditService.listForClient(clientId)` (`@/lib/audit/service.ts`) |
> | 适配器（把 CRM / CLM / staff 等源进入统一流） | `@/lib/audit/adapters.ts`（CRM 不需要改） |
> | 跨客户全局视图 | `/crm/clm/audit-trail?clientId=X` |
> | 表格组件 | `EnhancedDataTable` |
>
> **不要**：自建 audit 查询、自定义 audit 字段、为 Client Detail 写独立的 audit 读取 endpoint。

### 16.1 目的
对此客户做过的**所有员工 / 系统操作**的结构化记录。监管审计、内部调查、复盘 incident 用。

### 16.2 数据来源
- 查询：`globalAuditService.listForClient(clientId, filter)`（**统一入口**）
- 内部 adapter 已经把以下源 project 进 `GlobalAuditLog`：
  - CRM 的 `crm_audit_logs`（写入端，由各 mutation 自动写）
  - CLM 的 `CLMAuditLog`（CLM service 内部写）
  - 旧 `audit_logs` 表（tenant 级，迁移期保留）
  - 跨域 mock（占位，等真实 producer）
- UI 只读 `GlobalAuditLog[]`，无需关心源

### 16.3 数据展示

**列表（按时间倒序）：**

| 字段 |
|---|
| Timestamp（绝对 + 相对） / Operator 头像名 / Operator role / Action（domain.entity.verb 结构化） / Target field / Old value / New value / IP address / Source (web / api / mobile) / Severity (info / warning / critical) |

**字段类操作**（如 status 变更）：
- 展开行显示完整 diff，old / new 并排

**非字段类操作**（如 send_notification）：
- 显示 action description + metadata

**右侧 sidebar：**
- 当前过滤摘要
- 按 operator / action 的小图聚合（最近 30 天）
- 链接到 GlobalAuditLog 跨客户视图

### 16.4 过滤 / 搜索

| 过滤维度 |
|---|
| Operator（autocomplete staff） |
| Action（autocomplete from enum） |
| Severity |
| Date range |
| IP address（搜索） |
| Field name（针对字段变更过滤特定字段） |
| Source (web / api / mobile / admin / system) |

### 16.5 严重程度（Severity）

| Severity | 触发条件 | UI |
|---|---|---|
| `info` | 普通操作 | 灰色 |
| `warning` | 资金 / 风控相关 / 权限改 | 黄色 |
| `critical` | 不可逆 / 高金额 / 安全相关：force_close、freeze、reject_withdrawal_large、2fa_reset、override 风险等级 | 红色 |

### 16.6 可执行操作

只读 tab。
| 动作 | 权限 |
|---|---|
| 导出 CSV / PDF | compliance / admin |
| 复制单条 | 任何 staff |
| 跳到 GlobalAuditLog 视图 | viewer+ |
| 报告异常（如发现可疑操作） | 任何 staff（开 case） |

### 16.7 副作用
无（只读）。但**所有查看操作本身**写入审计 — 严肃监管下 "谁看过这个客户的日志" 也是审计目标。

| 动作 | 审计 |
|---|---|
| 打开 Logs tab | `audit.client.view` (severity=info) |
| 导出 logs | `audit.client.export`（severity=warning） |

### 16.8 数据保留
- 永久保留（监管强制）
- 5 年后归档到冷存储，查询慢但可访问
- 永不删除（即使客户账户关闭）

### 16.9 性能

| 项 | 约束 |
|---|---|
| 默认显示 last 30 天 | 200 条上限 |
| 翻页 / 时间范围扩展 | 每次 100 条 |
| 全量导出 | 异步任务 → 邮件发送 CSV 下载链接（链接含 token，72h 失效，写审计） |
| 实时刷新 | 不需要，30 秒轮询足够 |

### 16.10 GlobalAuditLog 跨域 chip

`GlobalAuditLog.domain` 取值：`clients / clm / risk / compliance / funds / trading / staff / system`，每条都带 domain chip 颜色编码。

可深链到 `/crm/clm/audit-trail?clientId=<id>` 看跨客户全局视图（含相关其他客户的事件，如同 IP 客户的操作）。

跨域查询是 `globalAuditService.list(filter)` —— Logs tab 用的 `listForClient(id)` 只是它的 `{ clientId: x }` 过滤简写。

---

## 横切：UI 一致性（System 组共用）

| 项 | 约定 |
|---|---|
| Diff 展示 | 字段级 old → new，删除红、新增绿 |
| 操作员显示 | 始终：名字 + 角色 chip，避免 ambiguity |
| 时间 | 默认相对（"3 hours ago"），hover 绝对（ISO + locale） |
| 跳转链接 | 资源 ID 永远点击可跳源（deposit / case / ticket） |
| 空态 | "No matching events" + 清空 filter 按钮 |
| 错误 | inline 红框 + retry |
