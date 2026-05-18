# Funds 模块设计方案

> 日期：2026-05-17 · 分类：产品文档 · 状态：已确认 · 版本：v1.0

## 一、定位与核心理念

**Funds 模块的定位**：Broker Money Operating Platform（经纪商资金运营平台），不是简单的入金提款页面或财务流水后台。

**核心能力**：客户资金生命周期、支付通道运营、自动化出入金、资金风控、AML、对账、资金策略、资金限制、资金监控。

**连接的模块**：Wallet、Payment、Approval、Risk、Compliance、Trading、CRM。

**核心卖点**（针对新 Broker）：Bank Transfer + USDT + Auto Deposit + Auto Withdrawal — "低成本资金运营能力"，帮助 Broker 快速启动业务并降低运营成本。

---

## 二、6 个关键设计决策

| # | 决策项 | 选择 | 一句话理由 |
|---|---|---|---|
| 1 | MT Bridge | **独立模块** | 外汇核心，复杂度独立支撑一页 |
| 2 | Wallets 模型 | **每客户 N 个 wallet**（Real / Bonus / Credit / Reward） | 行业标准；每 wallet 独立冻结/币种/规则 |
| 3 | 持仓中出金 | **警告 + 允许 + 一键平仓快捷入口** | 行业默认允许（margin level > 100%）；显示影响 + 给出退路 |
| 4 | 首次出金审核 | **Policies 一条可关闭规则** | 灵活，不写死 |
| 5 | IB Commission 回流 | **主入口 IB Commissions**；Funds Adjustments 有"IB 佣金"筛选 deep link | IB 操作员习惯在 IB 模块；Funds 是数据流出口 |
| 6 | Workflow 编辑 | **编辑在 Approval Center**；Funds 内只读 + 应用 | 工作流是平台级配置，防概念扩散 |

---

## 三、外汇经纪商资金模块的 8 个特殊性

通用支付平台没有这些，**外汇经纪商**必须叠加：

| # | 外汇特性 | 影响哪个模块 |
|---|---|---|
| 1 | **MT 桥接**（MT4/MT5 账户资金调拨） | Internal Transfers 必须升级，独立 MT Bridge 模块 |
| 2 | **多账户类型**（Live / Demo / Cents / ECN / Standard） | Wallets 不只是法币/加密分类，还要按账户类型 |
| 3 | **Bonus / Credit / Real Money 三轨核算** | 任何流水都要标记"动的是哪个余额"，Withdrawals 只能动 Real Money |
| 4 | **持仓状态影响出金**（open positions、used margin、margin level） | Withdrawals 必须显示账户即时保证金影响 |
| 5 | **快进快出（Fast Deposit-Withdraw）= 反洗钱触发器** | Fund Monitoring 必须包含这条 velocity 规则 |
| 6 | **High Profit Withdrawal**（短时高盈利提款 = 套利/对赌嫌疑） | Withdrawals 必须有"PnL 来源"标识 |
| 7 | **IB Commission 回流到 wallet** | Funds 需要承接，但操作在 IB 模块 |
| 8 | **首次出金审核** + **同人多账户合并出金限额** | Policies & Limits 必须支持 |

---

## 四、与 4 个核心模块的接合面（独立视图 · 共享服务）

设计原则：
- **不要重复** = 不要重复实现底层 service / data model
- **闭环完整** = 在当前模块上下文里，操作员能完成一整套任务，不被甩出去
- **正确姿势** = 视图独立 · 服务共享（Stripe Dashboard / Adyen / Plaid 的标准做法）

### 4.1 Funds ↔ Clients

| 在哪 | 看什么 / 能做什么 |
|---|---|
| **Funds 内的 Wallets 页** | 平台级钱包视图：所有客户 × 所有 wallet 类型的余额矩阵；筛选「冻结余额 > 0 / 零余额 / 异常 wallet」；点击 → drill 到客户详情的 Wallet tab |
| **Clients 详情的 Wallet tab** | 单客户视角：所有 wallet（Real/Bonus/Credit）+ 所有 MT 账户余额 + 最近 30 天流水 + 触发的资金风控事件 |
| **共享什么** | `wallet` service、`transaction` query。客户详情和 Funds 模块**调同一个 API**，UI 不同 |
| **闭环点** | 在 Funds Wallets 页能直接「冻结 wallet / 解冻 / 手动调账」；不需要跳到客户详情 |

### 4.2 Funds ↔ KYC

| 在哪 | 看什么 / 能做什么 |
|---|---|
| **Funds 的 Policies & Limits** | KYC tier → 限额映射（Tier1=$1k/天，Tier2=$10k/天，Tier3=无限），通道白名单（USDT 只对 Tier2+） |
| **Funds 的 Withdrawals 任务卡** | 显示客户当前 KYC 状态 + 实时校验「这个金额这个通道是否触发 KYC 升级要求」 |
| **共享什么** | KYC tier 数据来自 CLM Center 的 case service；policies 引擎在 Funds 维护 |
| **闭环点** | 任务卡上一键「向客户发送 KYC 升级请求」（创建 CLM case），不离开 Withdrawals 页 |

### 4.3 Funds ↔ Approval Center

| 在哪 | 看什么 / 能做什么 |
|---|---|
| **Approval Center** | 全部审批的总览 + 工作流定义（Workflows 这个二级菜单），funds 只是它的一种 task type |
| **Funds 的 Withdrawals + Approval Queue** | 资金视角的审批工作台：金额、通道、wallet 余额、持仓影响、AML 评分都是一等公民。不需要去 Approval Center 看 funds 审批 |
| **共享什么** | 审批 state machine / workflow engine / audit trail 全部共享。Funds 不重新发明审批引擎，但 UI 是为资金场景定制 |
| **闭环点** | 在 Funds Withdrawals 详情抽屉里能完整批 / 拒 / 升级 / 留言 / 查 timeline；同时这个动作会出现在 Approval Center 的审计日志里 |

### 4.4 Funds ↔ Trading

| 在哪 | 看什么 / 能做什么 |
|---|---|
| **Funds 的 Internal Transfers / MT Bridge** | Wallet ↔ MT 账户的资金调拨；MT 账户之间互转；Bonus 注入 |
| **Funds 的 Withdrawals 任务卡** | 显示触发账户的「open positions、used margin、free margin、margin level、equity」，预测出金后的 margin level（< 100% 不允许） |
| **共享什么** | MT 桥接服务（MT5 Manager API / FIX API），Trading 模块也用同一套 |
| **闭环点** | 在 Withdrawals 抽屉看到「出金会让 margin level 降到 80%」→ 一键「先平仓再出金」（创建 Trading 平仓任务） |

---

## 五、完整 IA + 路由

```
Funds (icon: Wallet)
├─ Overview                    /crm/funds                   [新建·驾驶舱]
│
├─ ── 资金流水 ──────────────
│  ├─ Transactions             /crm/funds/transactions      [重构·ledger 心智]
│  ├─ Deposits                 /crm/funds/deposits          [重构·任务工作台]
│  ├─ Withdrawals              /crm/funds/withdrawals       [改名+重构]
│  └─ Adjustments              /crm/funds/adjustments       [新建·含 IB 回流]
│
├─ ── 资金资产 ──────────────
│  ├─ Wallets                  /crm/funds/wallets           [新建]
│  └─ MT Bridge                /crm/funds/mt-bridge         [新建·外汇特有]
│
├─ ── 通道运营 ──────────────
│  ├─ Payment Channels         /crm/funds/channels          [保留+精简]
│  └─ Routing Rules            /crm/funds/routing           [新建·从 channels 拆出]
│
├─ ── 监控与对账 ────────────
│  ├─ Fund Monitoring          /crm/funds/monitoring        [新建]
│  └─ Reconciliation           /crm/funds/reconciliation    [新建]
│
├─ ── 治理 ─────────────────
│  ├─ Policies & Limits        /crm/funds/policies          [从 placeholder 重写]
│  ├─ Risk & Compliance        /crm/funds/risk              [新建]
│  └─ Approval Workflow        /crm/funds/workflow          [新建·只读视图]
│
└─ Reports                     /crm/funds/reports           [新建·内嵌不跳走]
```

**注意**：`withdrawal-review` → `withdrawals` 改名 + 加 301 重定向防外链断裂。

---

## 六、6 个核心页详细设计

### 6.1 Overview — 资金运营驾驶舱

**心智**：操作员每天 9 点打开 CRM 看的第一屏。**自动化优先**叙事。

**结构**（自上而下）：

```
┌─ Row 1: 自动化健康度 ─────────────────────────────────┐
│ Auto Deposit       Auto Withdrawal      Channel Health │
│ 234/240  97.5%     89/98  90.8%         5/6 在线       │
│ 平均 3m12s         平均 8m               1 个 warning    │
│ [→ 规则配置]       [→ 规则配置]          [→ 通道列表]    │
└────────────────────────────────────────────────────────┘
┌─ Row 2: 今日资金摘要 ─────────────────────────────────┐
│ Deposit $2.3M | Withdrawal $1.1M | Net +$1.2M         │
│ Pending Withdrawals 32 | Failed Txn 12                │
└────────────────────────────────────────────────────────┘
┌─ Row 3: 风险提醒 timeline（最近 24h）──────────────────┐
│ • 14:23 USR-12345 大额出金 $50k（待审）                │
│ • 13:45 USR-23456 AML 命中（已挂起）                   │
│ • 11:02 通道 BCA 失败率 5% 警告                        │
└────────────────────────────────────────────────────────┘
┌─ Row 4: 通道实时状态 + 资金趋势图 ─────────────────────┐
│ DOKU NORMAL | USDT NORMAL | BCA WARNING | TRC20 DELAYED│
│ ─ 7 日入出金对比折线图 ───                              │
└────────────────────────────────────────────────────────┘
```

**复用现有组件**：`KpiTile`、`Card`、自定义 timeline。

---

### 6.2 Withdrawals — 提款运营与风控中心（重中之重）

**心智**：任务工作台。沿用 Approval Inbox 的 Mine / Unassigned / All tab 模式。

**顶部 KPI**：
```
Mine 5  |  Overdue 9  |  Critical 3  |  Auto Failed 4
```

**Tabs**：Mine · Unassigned · All

**Chips（pinned）**：Pending · AML Hit · High Profit · New Device · Fast In-Out · Overdue

**列表字段**（按外汇行业习惯）：

| 字段 | 内容 |
|---|---|
| Withdrawal ID | WTH-00123 |
| Client | UID + 名字 + KYC tier |
| Amount | $5,000 USDT |
| Channel | USDT TRC20 |
| Wallet | Real Wallet · 余额 $5,200 |
| Status | dot+text: Pending / Reviewing / Processing |
| Risk | dot+text: Critical / High / Med / Low |
| AML | dot+text: Hit / Pass |
| PnL Source | dot+text: Trading Profit / Deposit Balance / Bonus |
| Margin Impact | "→ 80% margin level"（hover 显示出金后预测）|
| Auto/Manual | chip |
| Created · SLA | "5m overdue" |

**详情抽屉结构**：

```
┌─ 头部 ──────────────────────────────┐
│ WTH-00123 · USR-12345 (Tier2)       │
│ $5,000 USDT TRC20 · Pending         │
├─ 客户资金画像 ──────────────────────┤
│ Real Wallet: $5,200 (Available)     │
│ Bonus Wallet: $300 (不可提)         │
│ MT 账户 MT5-12345: $4,900 equity    │
│   - Open positions: 3               │
│   - Used margin: $4,100             │
│   - Free margin: $800               │
│   - Margin level: 119%              │
│   - 出金后预测: 80% 🟠              │
│   [一键平仓全部] [部分平仓]         │
├─ 风控信号 ──────────────────────────┤
│ ⚠ Fast In-Out: 入金 2h 后请求出金   │
│ ⚠ High Profit: 7 日 PnL +$3k        │
│ ✓ AML: 通过                         │
│ ⚠ New Device: 4h 前换了设备         │
├─ 政策检查 ──────────────────────────┤
│ ✓ KYC tier 限额 $10k/天             │
│ ✓ 通道 USDT 启用                    │
│ ⚠ 首次出金: YES → 强制人工          │
├─ Timeline ──────────────────────────┤
│ 14:23 提交                          │
│ 14:24 自动检查触发 → 转人工          │
├─ 操作区 ────────────────────────────┤
│ [批准] [拒绝] [挂起] [升级]         │
│ 留言: [_______________]             │
└─────────────────────────────────────┘
```

---

### 6.3 Deposits — 入金运营中心

**心智**：任务工作台。**自动入金匹配队列**是核心叙事。

**Tabs**：Pending Match · Pending Confirmation · Completed · Failed

**Chips**：Crypto · Bank Transfer · E-Wallet · Duplicate · Velocity · AML

**列表字段**：
```
Deposit ID | Client | Method | Amount | Status | Auto Match Confidence | Channel | Risk | Created
```

**特色：自动匹配置信度列**
- Crypto: 链上确认数（3/6 → 待确认；6/6 → 已确认）
- Bank: 流水识别匹配度（92% → 自动；< 70% → 人工）

**详情抽屉**：与 Withdrawals 同结构 + 「手动匹配客户」按钮（搜索 UID/金额/参考号）

---

### 6.4 Wallets — 客户钱包平台级视图

**心智**：所有客户 × 所有 wallet 的矩阵。冻结/异常 wallet 一眼可见。

**KPI**：
```
Total Real Balance | Total Frozen | Total Bonus | Zero Balance Clients
```

**Tabs**：All · Real · Bonus · Credit · Reward

**列表**（按客户分组）：
```
Client                 Real      Bonus    Credit   Risk     Status
USR-12345 (Tier2)     $5,200    $300     $0       Low      ● Active
USR-23456 (Tier1)     $0        $50      $0       High     ● Frozen
```

**操作**：
- 选中行 → 「冻结 wallet / 解冻 / 调账 / 查询流水」
- 列表行内 chip 显示冻结原因

---

### 6.5 MT Bridge — MT 平台资金桥接（外汇特有）

**心智**：Wallet ↔ MT 账户之间资金调拨的工作台。

**Tabs**：Wallet → MT · MT → Wallet · MT → MT · Bonus 注入

**列表**：
```
ID | Client | From | To | Amount | Status | MT Sync | Created
TRF-001 | USR-12345 | Real Wallet | MT5-12345 | $500 | Synced | ✓ | 14:23
```

**特色字段 MT Sync**：
- ✓ Synced — MT 平台已确认
- ⌛ Syncing — 调用中
- ✗ Failed — MT 拒绝（含原因：margin level 不足、账户禁用等）

**详情抽屉**：MT 账户实时状态 + 「重试同步」按钮

---

### 6.6 Policies & Limits — 资金策略中心

**心智**：所有自动化和限制规则的可视化配置台。

**分组**（左侧侧边导航）：
```
Deposit
├ Limits             [按 KYC tier 配置每日/单笔/月度限额]
├ Auto Match Rules   [自动入金匹配规则]
└ Velocity Rules     [重复入金检测]

Withdrawal
├ Limits             [按 KYC tier 配置]
├ Auto Approval      [自动出金条件]
├ First Withdrawal   [首次出金审核 开关 + 规则]
├ Cooldown           [冷却期]
├ Channel Whitelist  [通道白名单 × tier]
└ Country Restrictions [国家限制]

Internal
└ MT Bridge Limits   [MT 桥接限额]

KYC Mapping
└ Tier → 资金权限    [Tier1-4 对应的能做什么]
```

**右侧编辑面板**：根据选择的规则展示当前配置 + 历史版本 + 启用/禁用开关。

---

## 七、7 个辅助页（精简版）

### 7.1 Transactions（重构）
**心智**：账目层。只读、可筛、可导出。
**字段**：TXN ID · UID · Type (Deposit/Withdrawal/Transfer/Credit/Adjustment/Bonus/Refund) · Amount · Wallet · Channel · Status · Risk · AML · Auto/Manual · Created
**Chips**：Type · Status · Risk · AML · Auto · Failed

### 7.2 Adjustments
**心智**：手动调账 + IB 佣金注入的 ledger 入口。
**Tabs**：Manual Adjustment · IB Commission · Bonus Grant · Correction
**操作**：发起调账（金额、wallet、原因、备注）→ 走 Approval Center 审批 → 完成后回写

### 7.3 Payment Channels（精简）
**Tabs**：Active · Inactive · Maintenance
**字段**：通道名 · 类型 · 当前状态 · 24h 成功率 · 平均处理时间 · 启用国家 · 限额
**详情**：通道配置 + 24h 健康度趋势

### 7.4 Routing Rules
**心智**：动态路由可视化编辑器。
**结构**：条件树（IF country=ID AND amount > $1000 AND tier=2 THEN channel=DOKU ELSE channel=USDT）
**视图**：规则列表 + 流程图 + 测试器（输入虚拟交易看走哪条路由）

### 7.5 Fund Monitoring
**心智**：资金风险监控大盘。
**结构**：实时告警流 + 5 个监控类别（Large Deposits / Large Withdrawals / Velocity / AML / Channel Failures / Auto Failures）每类一个 widget。

### 7.6 Reconciliation
**心智**：财务对账。
**Tabs**：Bank · PSP · Crypto · Wallet
**列表**：差异记录（系统记录 vs 外部对账单），匹配状态（Auto Matched / Manual / Unmatched）
**操作**：手动匹配 / 标记差异原因

### 7.7 Risk & Compliance
**心智**：资金交易级风控规则 + 告警列表。
**Tabs**：Active Rules · Wallet Screening · Blacklist · Velocity History · AML Reports

### 7.8 Approval Workflow（只读视图）
**心智**：当前生效的资金审批流可视化。
**展示**：每种资金动作的审批路径流程图（Pending → 自动检查 → [若触发] → 一审 → 二审 → 完成）
**链接**：右上角"编辑工作流 →"跳 Approval Center

### 7.9 Reports（内嵌）
**结构**：6 个报表卡片 tab
- Deposit Trends · Withdrawal Trends · Channel Success Rate · AML Statistics · Auto Withdraw Rate · Failure Analysis
每卡片下方是 chart + 数据表 + 导出按钮。

---

## 八、UI 一致性 checklist（重构必须遵守）

现有 CRM 的视觉/交互模式必须复用：

| 场景 | 复用现有什么 | 怎么用 |
|---|---|---|
| KPI 卡片 | `KpiTile`（Approval Inbox 已用） | Overview / Wallets 顶部 stat 卡 |
| 列表数据 | `EnhancedDataTable` + `useListWithFilters` | Transactions / Deposits / Withdrawals 全用 |
| 任务工作台 | Approval Inbox 模式（Mine / Unassigned / All tabs + chips） | Deposits / Withdrawals |
| 状态色 | dot + 颜色文字（Cases 列表已统一） | 所有状态列严格用 dot + text，不用 BadgeBase chip |
| Chip filters | 已有 PINNED_CHIPS / ADVANCED_FIELDS 模式 | Transactions 的 Overdue / AML hit / Auto/Manual |
| 抽屉详情 | Approval Center Drawer | Withdrawals 详情、Deposit 匹配 |
| 审批 timeline | 已有 audit trail 组件 | 资金审批历史展示 |
| chip 颜色 tone | 100\|500\|700 三档（emerald/amber/red/orange） | 自动化健康度、通道状态 |

**这是硬性要求，新页面不能引入新设计语言。**

---

## 九、需要重构的现有页

| 现有页 | 重构动作 |
|---|---|
| `funds/withdrawal-review` | **改名** `funds/withdrawals`；加自动出金状态列、PnL 来源列、Margin 影响列、AML 评分列 |
| `funds/deposits` | 加自动匹配状态、待匹配队列、Crypto 链上确认数 |
| `funds/transactions` | 加 Auto/Manual、AML、Risk Level 筛选；改成"账目层"心智 |
| `funds/channels` | Routing Rules 独立成新页（`funds/routing`），Channels 只管通道本身 |
| `funds/policy` | 从 placeholder 重写为完整的 Policies & Limits（含 KYC tier mapping、首次出金、冷却期、自动化规则） |

---

## 十、落地优先级

| Phase | 周期 | 内容 |
|---|---|---|
| **P0** | 第 1-2 周 | Overview · Withdrawals 重构 · Policies & Limits（必备的 broker MVP） |
| **P1** | 第 3-4 周 | Deposits 重构 · Wallets · MT Bridge · Routing Rules |
| **P2** | 第 5-6 周 | Adjustments · Fund Monitoring · Reconciliation · Risk & Compliance |
| **P3** | 第 7+ 周 | Reports · Approval Workflow · 自动化引擎打磨 |

---

## 十一、Service 共享面（避免重复实现）

| Service | 谁拥有 | 谁使用 |
|---|---|---|
| `approvalService` | Approval Center | Funds Withdrawals / Adjustments |
| `kycService` | CLM Center | Funds Policies / Withdrawals |
| `riskService` | Risk Center | Funds Risk / Withdrawals |
| `mtService` | Trading | Funds MT Bridge / Withdrawals |
| `walletService` | Funds（核心拥有） | Clients 详情 Wallet tab |
| `transactionService` | Funds（核心拥有） | Clients 详情、Reports |
| `channelService` | Funds | 所有发起出入金的地方 |

---

## 十二、Starter / Growth / Enterprise 三阶段产品定位

**Starter（新 broker MVP）**
- Bank Transfer + USDT
- Manual Review
- Basic Auto Deposit
- 最低门槛启动方案

**Growth**
- + Auto Withdrawal
- + Routing Rules
- + AML Rules
- + Velocity Controls

**Enterprise**
- + Local PSP
- + Treasury
- + Multi-region Routing
- + Advanced Risk Engine
- + Liquidity Integration

---

## 十三、最终定位（最重要）

**Funds 不是入金提款模块，而是 Broker Money Operating System。**

它负责：
- 资金运营
- 自动化出入金
- 支付通道
- 资金风控
- AML
- 对账
- 资金策略

**是整个 Broker CRM 最核心的中台之一。**

---

## 待办

- [ ] P0-1：扩展 mock 数据（PnL 来源、margin level、自动化状态、风险信号等 Withdrawals 场景数据）
- [ ] P0-2：重命名 `funds/withdrawal-review` → `funds/withdrawals` 路由（加 301 重定向）
- [ ] P0-3：Withdrawals 页面重构（KPI / Tabs / Chips / 新字段列 / 详情抽屉）
- [ ] P0-4：Sidebar.tsx 同步更新 withdrawals 路径
- [ ] P0-5：Overview 页面新建
- [ ] P0-6：Policies & Limits 重写（从 placeholder）
- [ ] P1-1：Deposits 重构（自动匹配置信度、Crypto 确认数）
- [ ] P1-2：Wallets 页面新建（客户钱包矩阵）
- [ ] P1-3：MT Bridge 页面新建（外汇特有）
- [ ] P1-4：Routing Rules 页面新建（从 channels 拆出）
- [ ] P2-1：Adjustments 页面新建
- [ ] P2-2：Fund Monitoring 页面新建
- [ ] P2-3：Reconciliation 页面新建
- [ ] P2-4：Risk & Compliance 页面新建
- [ ] P3-1：Reports 页面新建
- [ ] P3-2：Approval Workflow 只读视图
