# Client Detail — Core Tabs

> 5 个 core tab：Overview / Accounts / Funds / Trading / Risk。
> 这组 tab 围绕**资金与交易的事实**，是经纪商日常运营的主战场。

---

## Tab 1 — Overview（概览）

### 1.1 目的
一屏看清这个客户当前的健康度。**只汇总，不深挖**；任何 KPI 都能点进对应 tab 看明细。

### 1.2 数据展示

**A. 顶部状态横幅（仅在异常时出现）**
按优先级显示，最多 2 条：

| 优先级 | 条件 | 文案示例 |
|---|---|---|
| 1 | 账户被冻结 | "账户已冻结 — 由 Alice 于 2026-05-08 操作" |
| 2 | 任一 MT 账户 margin level < 100% | "Margin call: account #8501 at 87%" |
| 3 | 待审 KYC 超过 SLA (24h) | "KYC 已等待 36 小时未审核" |
| 4 | 待审出金超过 SLA (12h 内) | "Withdrawal #W-2026-0123 已等待 14 小时" |
| 5 | 在 watchlist 中 | "Client on AML watchlist (added by Bob, 2026-04-30)" |

**B. KPI 卡片（8 张，分两行）**

第 1 行 — 实时账户健康：
| KPI | 数据源 | 备注 |
|---|---|---|
| 当前余额 | sum(wallets.balance) | 多币种时显示 USD 等值 + tooltip 明细 |
| 净值（Equity） | sum(mt_accounts.equity) | MT 桥接数据，可能落后 1-5s |
| 浮动盈亏 | sum(positions.profit) | 实时 |
| 持仓数量 | count(positions) | 跨所有 MT 账户 |

第 2 行 — 累计指标：
| KPI | 数据源 |
|---|---|
| 总入金 | sum(transactions where type=deposit, status=completed) |
| 总出金 | sum(transactions where type=withdrawal, status=completed) |
| 净入金 | 总入金 - 总出金 |
| 交易量（手） | sum(orders.volume where status=closed) |

**C. 风险摘要（横向带）**
- 风险评分（gauge 圆环，0-100，颜色按等级）
- 触发的高风险因子 chip 列表（最多 3 个，点击跳 Risk tab）
- KYC 状态 Badge
- 生命周期阶段 Badge

**D. 最近活动（Timeline 前 6 条）**
- 入金 / 出金 / 交易 / 登录 / KYC 提交 / 工单创建
- 每行：icon + 标题 + 时间 + 跳转链接
- 底部 "查看全部" → Timeline tab

**E. 客户基础卡（右侧栏，sticky）**
- 头像（gravatar fallback）/ 姓名 / UID（mono font）
- Email（带掩码切换）/ Phone（带掩码切换）
- 国家 + 时区
- 注册时间 / 首存时间 / 最后登录
- IB 信息（如有）：IB 姓名 + Code，点击跳 IB 详情
- Tag 列表（chip，可点开管理）

### 1.3 可执行操作（Quick Actions 按钮组）

| 动作 | 权限 | 是否打开 modal/drawer |
|---|---|---|
| 冻结 / 解冻账户 | risk_manager + compliance | 弹 reason 选择 + confirm |
| 添加 Note | any staff | inline composer |
| 创建 Ticket | any staff | drawer 表单 |
| 发送通知（站内 + 邮件） | support / compliance | drawer 表单 |
| 添加 Tag | compliance / support / risk | autocomplete popover |
| 加入 / 移出 Watchlist | compliance / risk | 弹 reason 选择 |
| 跳转 IB 详情 | any staff | 路由跳转 |
| 复制 UID / Email | any staff | 客户端 clipboard |

### 1.4 过滤 / 排序
不适用（不是列表 tab）。Timeline 预览段固定时间倒序。

### 1.5 副作用规则
| 动作 | 审计 | 时间线 | 通知 |
|---|---|---|---|
| 冻结账户 | `client.status.update` | `account_frozen` | 邮件 + 站内 |
| 解冻 | `client.status.update` | `account_unfrozen` | 邮件 + 站内 |
| Tag 加 | `client.tag.add` | 仅当 tag 是 VIP/At Risk/Watchlist | 无 |
| Watchlist 加 | `risk.watchlist.add` | `watchlist_added` | 无（客户不可见） |
| 发通知 | `client.notify.send` | `notification_sent` | 站内 + 邮件已包含 |

---

## Tab 2 — Accounts（交易账户）

### 2.1 目的
管理客户在 MT4/MT5 上的**实盘**交易账户。Demo 账户单独列。

### 2.2 数据展示

**列表卡片，每个账户一行：**

| 字段 | 说明 |
|---|---|
| MT Login | 8-10 位数字，mono font，可复制 |
| Server | MT 服务器名（e.g. `TradePass-Live01`） |
| Type | Standard / ECN / PRO / VIP / Demo / Swap-Free |
| Currency | USD / EUR / JPY / ... |
| Leverage | 1:30 / 1:100 / 1:500 — 显示客户实际，hover 显示集团默认 |
| Group | MT group name（合规 / 路由用） |
| Balance | currency-aware |
| Equity | balance + 浮盈 |
| Margin / Free Margin | 当前已用保证金 / 可用 |
| Margin Level % | 颜色：> 200% 绿 / 100-200% 黄 / < 100% 红 |
| Open Positions | 数字 + 链接到 Trading tab 过滤该账户 |
| Routing | A-book / B-book / Hybrid — 颜色 chip |
| Status | active / restricted_trading / restricted_all / disabled / archived |
| Created / Last Trade | timestamps |

**右上工具栏：**
- "Add account" 按钮（admin / finance）
- 切换显示：实盘 only / 含 demo
- 是否归档：默认隐藏

**展开行（点击账户行）：**
- 最近 5 笔交易摘要
- 该账户的 7 天 / 30 天 P/L 趋势小图
- 当前所有 open positions 缩略列表
- 当前所有 pending orders 列表

### 2.3 可执行操作

每个账户行的 "..." 菜单：

| 动作 | 权限 | UI |
|---|---|---|
| 修改杠杆 | risk_manager / admin | popover，选项是配置好的 leverage tiers，禁止低于集团 floor |
| 切换 group | admin | drawer，选择 group，影响路由 / 点差 |
| 重置 MT 主密码 | support / admin | confirm modal，新密码经邮件发送 |
| 重置 Investor 密码 | support / admin | 同上 |
| 限制交易（restricted_trading） | risk / compliance / admin | confirm + reason |
| 限制所有（restricted_all） | risk / compliance / admin | 同上 |
| 启用 | risk / compliance / admin | confirm |
| 禁用账户（disabled） | admin only | 双确认 + reason，60s 冷却（不能立刻 enable） |
| 归档（archived） | admin | confirm |
| 强制 MT 终端登出 | risk / admin | 仅当客户在线 |
| 标记 A-book / B-book / Hybrid | risk / admin | drawer，含说明 |
| 调整客户名（MT 端显示名） | admin | inline |
| 查看完整交易历史 | viewer+ | 跳转 Trading tab，预过滤该账户 |
| 关闭账户（永久） | admin only | 多步骤 confirm，强制先归档再关闭 |

**顶部批量操作：**
- 选中多个账户 → 批量 restrict / un-restrict
- 一键 close all positions on selected accounts（risk 紧急按钮）

### 2.4 过滤 / 排序
- Type、Status、Currency、Server 筛选
- 排序：默认按 Created desc；可按 Balance / Equity / Margin Level

### 2.5 副作用
| 动作 | 审计 | 时间线 | 备注 |
|---|---|---|---|
| Leverage change | `account.leverage.change` (old → new) | `account_leverage_changed` | 同步到 MT；失败 rollback |
| Group change | `account.group.change` | `account_group_changed` | 客户当前持仓不平 → 警告，需确认 |
| 重置密码 | `account.password.reset` | `account_password_reset` | 邮件 + 站内 |
| Restrict / unrestrict | `account.status.update` | `account_restricted` / `account_unrestricted` | 同步 MT enable 标志 |
| Close all positions | `trading.position.close.bulk` | `bulk_close_executed` | 大额时合规通知 |

---

## Tab 3 — Funds（资金，**4 个子 tab 镜像 sidebar，确认 A-Q8**）

> **数据契约（v3 alignment）**：Funds tab 是 Funds 模块的客户级视图。4 个子 tab 镜像 sidebar `/crm/funds/*` 结构（除 Channels 配置）。详见 [05-alignment.md §3](./05-alignment.md#3-tab--来源模块-详细矩阵16-tabs)。
>
> | 子 tab | 来源 sidebar | service |
> |---|---|---|
> | **Deposits** | `/crm/funds/deposits` | `prisma.transaction.findMany({where:{userId, type:deposit}})` |
> | **Withdrawals** | `/crm/funds/withdrawal-review` | `prisma.transaction.findMany({where:{userId, type:withdrawal}})` + `caseService` 联动 |
> | **Transactions** | `/crm/funds/transactions` | `prisma.transaction.findMany({where:{userId, type:transfer}})` |
> | **Adjustments** | `/crm/funds/policy` 配置 + 调账 audit | `globalAuditService.list({domain:funds, action:'funds.adjustment.*', clientId:X})` 派生 |
>
> **不进客户视角的**：Channels（`/crm/funds/channels`，是配置不是客户数据）。

### 3.1 目的
客户的所有资金流：入金、出金、调账、IB 佣金、内部转账。审核出入金的主战场。

### 3.2 数据展示（4 个子 tab）

**3.2.1 子 tab "Deposits"（入金）**

| 字段 | 说明 |
|---|---|
| ID | mono，可复制 |
| Method | bank_transfer / usdt_trc20 / usdt_erc20 / stripe / wire | 带 logo |
| Channel | 具体支付商（e.g. "AsiaPay-CN"，"Coinify"） |
| Amount + Fee + Net | 三列 |
| Currency | |
| Status | `pending / processing / completed / failed / cancelled` |
| Tx Hash / Reference | 链上 hash 或银行 ref，可点 → 区块链浏览器 |
| Screenshot | 客户上传凭证缩略图，hover 放大 |
| Risk Flags | chip：first_deposit / high_risk_jurisdiction / third_party / amount_mismatch |
| Created / Completed | timestamps |
| Operator | 自动 = system，手动调账 = staff 名 |

**3.2.2 子 tab "Withdrawals"（出金）— 重点 tab，与 `/crm/funds/withdrawal-review` 同款审核流**

每行展开：客户银行 / 钱包详情 + 风控扫描结果 + 上游 case 链接

| 字段 | 说明 |
|---|---|
| ID | |
| Method + Channel | |
| Amount + Fee + Net | |
| Status | `requested / compliance_review / finance_review / approved / processing / completed / failed_refunded / rejected_*` |
| SLA 计时 | 进入 review 后开始计时，红色超时 |
| Recipient | bank: 卡号末四 + 银行名；crypto: 地址截断 |
| Compliance Flags | sanctions hit / first_withdrawal_after_deposit / unusual_amount / 多账户共享地址 |
| Linked Case | 大额或可疑触发的合规 case |
| Operator | 当前处理人 |

**3.2.3 子 tab "Transactions"（内部转账）— 镜像 `/crm/funds/transactions`**

客户在自己多个账户间的转账：

| 字段 |
|---|
| ID / From account / To account / Amount / Currency / Status / Created / Operator（如员工代操作） |

**3.2.4 子 tab "Adjustments"（调账）**

人为修改余额的记录：bonus 入账、纠错、retainer 等。来自 `globalAuditService` 过滤 `funds.adjustment.*` action。

| 字段 |
|---|
| ID, Direction (credit/debit), Amount, Currency, Wallet/MT Account, Reason, Operator, Approved By, Created |

> **IB Commissions**（客户作为 IB 赚 / 作为下线贡献）已迁到独立的 **IB tab**（Tab 13），不在 Funds 此处。Funds tab 仅看资金流入流出，IB tab 看佣金业务。

### 3.3 顶部统计条
| KPI |
|---|
| 总入金 / 总出金 / 净入金 / 平均出金天数 / 最近 30d 出入金笔数 / Pending 出金笔数 |

### 3.4 可执行操作

**Deposit 行操作：**
| 动作 | 权限 | UI |
|---|---|---|
| 标记为 completed（手动确认到账） | finance / admin | confirm + 上传凭证 |
| 标记为 failed | finance / admin | reason 必填 |
| 加风控标记 | compliance / risk | tag picker |
| 退款（refund） | finance + compliance 双签 | drawer + reason + 退款金额 |
| 关联到调账 | finance | 例如 "误存 → 退还" |

**Withdrawal 行操作（按状态出现）：**

| 状态 | 可执行 |
|---|---|
| `requested` | 自动进入 `compliance_review`，无操作 |
| `compliance_review` | Approve compliance / Reject (with reason) / Escalate to case |
| `finance_review` | Approve finance / Reject (with reason) / Send back to compliance |
| `approved` | Mark processing / Cancel |
| `processing` | Mark completed (with txid) / Mark failed_refunded |
| `completed` | 仅查看 |
| `rejected_*` | 客户可重新申请 / 仅查看 |

**Adjustment：**
| 动作 | 权限 |
|---|---|
| 创建调账（credit / debit） | finance + admin 双签（>$1k），单签（<$1k） |
| 撤销调账 | admin only，原路反向 |

**顶部按钮：**
- "Manual Deposit"（finance）— 客户线下打款，CRM 入账
- "Bulk Approve Withdrawals"（finance + admin）— 一次审多笔（仅小额 < $1k 且无风控标记）
- "Export Statement"（任何 staff）— 生成 PDF 对账单

### 3.5 副作用
| 动作 | 审计 | 时间线 | 通知 | 同步 |
|---|---|---|---|---|
| Approve deposit | `funds.deposit.approve` | `deposit_completed` | 邮件 + 站内 | wallet += amount, MT account += amount |
| Reject deposit | `funds.deposit.reject` | `deposit_rejected` | 邮件 + 站内 | 无 |
| Approve withdrawal | `funds.withdrawal.approve` | `withdrawal_approved` | 邮件 + 站内 | wallet.frozen += amount（仍未实际打款） |
| Mark processing | `funds.withdrawal.process` | `withdrawal_processing` | 站内 | 触发第三方打款 API |
| Mark completed | `funds.withdrawal.complete` | `withdrawal_completed` | 邮件 + 站内 | wallet.balance -= amount, wallet.frozen -= amount |
| Mark failed_refunded | `funds.withdrawal.refund` | `withdrawal_failed` | 邮件 | wallet.frozen -= amount，balance 不变 |
| Reject withdrawal | `funds.withdrawal.reject` | `withdrawal_rejected` | 邮件 + 站内 | 无（钱本来没扣） |
| Manual adjustment | `funds.adjustment.create` | `balance_adjusted` | 站内 | wallet.balance ± amount |

### 3.6 风控集成
- 出金请求自动调用 `risk-engine.score(withdrawal)`，分数 > 60 自动停留 `compliance_review`
- 入金 > $10k 或来自高风险国家：自动 `compliance_review`，触发 SAR 候选 case

---

## Tab 4 — Trading（交易，**2 个子 tab，确认 A-Q7**）

> **数据契约（v3 alignment）**：Trading tab 是 Trading 模块的客户级视图。子 tab 与 `/crm/trading/{positions,orders}` 一一对应。详见 [05-alignment.md §3](./05-alignment.md#3-tab--来源模块-详细矩阵16-tabs)。
>
> 子 tab 结构：
> | 子 tab | 来源 | service |
> |---|---|---|
> | **Open Positions** | `/crm/trading/positions` | `prisma.position.findMany({where:{account:{userId}}})` 实时轮询 |
> | **Trade History** | `/crm/trading/orders` | `prisma.order.findMany({where:{account:{userId}, status:closed}})` |
>
> Pending Orders 合并入 **Open Positions**（顶部子区块，待执行的挂单 + 实时持仓在一处）。

### 4.1 目的
看客户的交易行为。挑出异常（EA、刷单、套利）。必要时强制介入（平仓、限交易）。

### 4.2 数据展示（2 子 tab + 顶部汇总）

**4.2.1 子 tab "Open Positions"（实时）**

包含**当前持仓** + **pending orders**（合并以减少 tab 数量）。

| 字段 |
|---|
| Ticket / MT Account / Symbol / Side(B/S) / Volume(lots) / Open Price / Current Price / SL / TP / Swap / Commission / Profit (浮) / Open Time / Magic (EA 用) / Comment |

实时轮询 5s。底部聚合：总持仓数、总名义价值、总浮盈。

**4.2.2 子区块 "Pending Orders"（在 Open Positions 子 tab 内）**

| 字段 |
|---|
| Ticket / Symbol / Type (buy_stop/sell_limit/buy_limit/sell_stop) / Volume / Price / SL / TP / Expiry / Comment |

**4.2.3 子 tab "Trade History"（已平仓订单）**

| 字段 |
|---|
| Ticket / MT Account / Symbol / Side / Volume / Open Price / Close Price / Open Time / Close Time / Duration / Pips / Profit / Swap / Commission / Magic / Comment |

支持时间范围 + Symbol + Side + Profit > 0 / < 0 等多维过滤。**列与 `/crm/trading/orders` 完全一致**，只是预过滤了 `userId`。

### 4.3 顶部汇总条
- 24h / 7d / 30d / 总计 — 切换
- 每段显示：成交笔数、成交手数、胜率、盈亏、平均持仓时长、最常交易品种 top 5

### 4.4 行为标记（页面右侧栏）
自动检测的异常：

| 标签 | 触发条件 |
|---|---|
| EA Trading | > 70% 订单带 Magic Number |
| High Frequency | 1 分钟内 > 5 笔 |
| Tick Scalping | 平均持仓 < 30s 且 > 50 笔/天 |
| Latency Arbitrage | 单 symbol 反复入场，时差 < 1s，平均盈利 |
| Hedging | 同 symbol 同时持多空（非锁仓账户） |
| Profit/Loss outlier | 单日 P/L > 历史 mean + 3σ |

每个标签可点开看具体触发的订单列表。

### 4.5 可执行操作

| 动作 | 权限 | 备注 |
|---|---|---|
| 强平单笔仓位 | risk / admin | confirm + reason；同步 MT |
| 强平全部仓位（账户级） | risk / admin | 大确认弹窗，含影响估算 |
| 取消单笔 pending order | risk / admin / support（客户授权） | |
| 取消全部 pending | risk / admin | |
| 修改 SL / TP | risk / admin | 仅在监管允许的范围 |
| 标记交易为 A-book / B-book / 排除统计 | risk | 影响 risk-engine |
| 导出交易历史 CSV | viewer+ | |
| 跳到该订单的 magic 全平台关联订单 | risk | 找 EA 农场 |
| 退订 EA | admin | 联动 MT 端禁用脚本 |

### 4.6 副作用
| 动作 | 审计 | 时间线 |
|---|---|---|
| 强平仓位 | `trading.position.close` | `position_force_closed` |
| 强平全部 | `trading.position.close.bulk` | `bulk_close_executed` |
| 取消 pending | `trading.order.cancel` | `order_cancelled` |
| 改 SL/TP | `trading.sltp.update` | 仅高 risk 客户写时间线 |

---

## Tab 5 — Risk（风控）

> **数据契约（v2 alignment）**：本 tab 是 **Risk Engine + Client Graph 的视图**，不重新定义风险模型。详见 [05-alignment.md](./05-alignment.md) §8。
>
> | 用途 | Canonical |
> |---|---|
> | 6 轴风险画像 | `RiskProfile` (`@/types/core/risk-profile`) + `lookupRiskProfile()` |
> | 风险评分大环 | `RiskScoreRing` (`@/components/crm/clm/risk/RiskScoreRing`) |
> | 6 轴因子列表（可展开） | `RiskFactorList` (`@/components/crm/clm/risk/RiskFactorList`) |
> | 关系图 | `ClientGraph` (`@/types/core/client-graph`) + `lib/risk-engine/graph.ts` helpers |
> | 关系图组件 | `RelationshipGraph`（已统一，复用 force-directed 实现） |
> | IP 弹层 | `IPGeoPopover` (`@/components/crm/clm/popovers/IPGeoPopover`) |
> | AML 状态 | `AMLStatus: not_checked / pass / hit / pending`（`@/types/clm/case`） |
> | 风险等级 | `RiskLevel: low / medium / high / critical`（`@/types/clm/case`） |
>
> 6 轴 key（不可自定义）：`country / identity / device_ip / ib_source / aml / blacklist`。CLM Case Detail 用同一份 `RiskProfile`，UI 必须**视觉一致**。

### 5.1 目的
**可解释**的客户风险全景。给合规 / 风控员一个统一的"为什么"。

### 5.2 数据展示

**A. 风险评分大圆环 — 用 `RiskScoreRing` 组件**
- 0-100 分，`riskLevel` (`low / medium / high / critical`) 决定颜色
- 来自 `RiskProfile.overallScore` / `riskProfile.riskLevel`
- AML 状态 chip：`amlStatus.replace(/_/g, " ")`

**B. 6 轴因子列表 — 用 `RiskFactorList` 组件**

6 轴（key 固定，不可改）：

| key | 中文 |
|---|---|
| `country` | 注册国家 / 居住国家的合规等级 |
| `identity` | 证件认证 + OCR + 人脸匹配 |
| `device_ip` | 设备指纹 + IP 归属 + VPN/proxy |
| `ib_source` | 推荐 IB 的历史质量 |
| `aml` | 反洗钱命名单匹配 |
| `blacklist` | 内部黑名单匹配 |

每个因子展开后显示：
- 分数 / 权重 / max
- `reasoning` 句（来自 RiskFactor.reasoning）
- `evidence` map（key-value 证据，UI 自动渲染）
- 这是 CLM Case Detail 同款组件，UI 必须一致

**C. AML 状态卡**
- 最近一次 sanctions 扫描结果（OFAC / EU / UN / local）
- 命中 / 通过 / 部分匹配（人工复核中）
- PEP 检查结果
- Adverse media（如接入第三方）

**D. 关系图（force-directed）**

数据契约：`ClientGraph` (`@/types/core/client-graph`)；UI 复用 `RelationshipGraph` 组件。

- 中心节点 = 当前客户（`ClientGraphNodeKind: center`，fx/fy 锁定不漂移）
- 周边节点 = 5 种 kind：`shared_ip / shared_device / same_id / shared_payment / ib_relation / mixed`
- 边 5 种 kind：`shared_ip / shared_device / same_id / shared_payment / ib_invited`
- 边颜色 / dash 用 `lib/risk-engine/graph.ts` 的 `EDGE_COLOR / EDGE_DASH`
- 节点颜色用 `NODE_COLOR`
- 节点 hover 用 `IPGeoPopover`（IP 类）或独立摘要弹层
- 节点 click 跳对方 client detail

**E. Risk Events 时间线**
- margin_call / stop_out / NBP / large_deposit / suspicious_pattern / kyc_alert
- 按时间倒序，每条带 severity badge 和具体数据

**F. Watchlist 状态卡**
- 是否在 watchlist
- 谁加的、何时、原因
- 关联的合规 case 列表

### 5.3 可执行操作

| 动作 | 权限 |
|---|---|
| 加入 / 移出 watchlist | compliance / risk |
| 触发 Enhanced Due Diligence（EDD） | compliance | 自动开 case，分配给主审 |
| 设置风险覆写（人工锁定风险等级 N 天） | risk + 备注 |
| 触发 AML 升级（生成 SAR 候选） | compliance |
| 重新评估（强制 risk engine 重算） | risk / admin |
| 强制 margin call（人工平仓警示） | risk | 推送 MT 端通知客户补充保证金 |
| 阻止特定产品 | risk | 跳 Permissions tab |
| 导出风险报告 PDF | compliance |

### 5.4 副作用
| 动作 | 审计 | 时间线 |
|---|---|---|
| Add to watchlist | `risk.watchlist.add` | `watchlist_added`（仅内部） |
| Remove from watchlist | `risk.watchlist.remove` | `watchlist_removed` |
| EDD trigger | `risk.edd.trigger` | `edd_started` |
| Risk override | `risk.override.set` | `risk_override_set` |
| AML escalation | `risk.aml.escalate` | `aml_escalated`（仅内部） |
| Re-evaluate | `risk.score.recompute` | 不写时间线 |

### 5.5 数据 / 算法依赖
- Risk Engine（`src/lib/risk-engine/`）— 6 轴算法；当前 mock `lookupRiskProfile`，未来 `riskService.getProfile()`
- 权重 + 阈值 config：`src/lib/risk-engine/config.ts` 的 `FACTOR_WEIGHTS` + `LEVEL_THRESHOLDS`（hardcoded，展示在 `/crm/risk/scoring`）
- Sanctions Provider（接入 ComplyAdvantage / Refinitiv / 自建）— 通过 `src/lib/integrations/sumsub.ts` 等 integration 层
- Device fingerprint：通过 `src/lib/integrations/ipgeo.ts`（mock fallback）
- 实时：margin / NBP 由 MT 桥接推送

### 5.6 跨 tab 联动
- 加入 watchlist：Overview 横幅、Permissions 默认拒绝出金、Tickets 自动加内部 note
- EDD 触发：Cases 新建一个 EDD case，KYC tab 标识 "EDD in progress"
