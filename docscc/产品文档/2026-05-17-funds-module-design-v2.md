# Funds 模块设计方案 v2

> 日期：2026-05-17 · 分类：产品文档 · 状态：已确认 · 版本：v2.0
> 替代 v1.0（同日早些时候已废）

## 0. v1 检讨

v1.0 实现了 13 个页面，但被产品判定"基本上用不了"。核心错误：

| v1 错误 | v2 修正 |
|---|---|
| 混淆 Wallet 与 Trading Account | **拆 4 个独立流水页**：Wallet 入/出、Trading 入/出 |
| 单步 Drawer 审批 | **全屏详情页**（Hero + Tabs + Timeline，参考 CLM Case Detail） |
| Tabs + Chips 信息架构混乱 | **Toolbar + 高级筛选 Drawer**（参考 Client List） |
| MT Bridge 独立模块 | 删除，并入 Transfers |
| Overview 数据稀薄 | **4 角色驾驶舱**（Treasury/Operations/Compliance/Growth） |
| 通道一刀切混在一起 | 拆 **Wallet Channels / Trading Channels** 两栏 |
| 缺分步审批 | **三角色分步**：Finance / Treasury / Compliance |
| 缺转账中心 | **Transfers** 独立模块，覆盖 5 种内部资金动作 |

## 1. 业务前提（v2 已敲定）

| 项 | 选择 |
|---|---|
| 经纪商规模 | **单实体**（不需要按 legal entity 拆分 UI） |
| 钱包币种 | **统一 USD 等值显示**（不做多币种切换） |
| 三角色审批 | **Finance（审核）+ Treasury（收付）+ Compliance（风控）** |
| 钱包 ↔ 交易账户路径 | **双轨**：默认 External→Wallet→Trading（安全/对账好）；可选 External→Trading 直入（需 KYC tier 3+ 额外审） |
| P2P 钱包转账 | **限 IB 用户**默认禁用；启用后走 Compliance 强制审批 + 受让方 KYC 校验 |

## 2. 新 IA（17 个二级页 + 多个全屏详情）

```
Funds
├─ Overview                          /crm/funds                       [Cockpit]
│
├─ ── Money Flow ────────────────
│  ├─ Transactions                   /crm/funds/transactions          [ledger]
│  ├─ Wallet Deposits                /crm/funds/wallet-deposits       [P0]
│  │   └─ [id]                       /crm/funds/wallet-deposits/[id]  [P0 全屏详情]
│  ├─ Wallet Withdrawals             /crm/funds/wallet-withdrawals    [P0]
│  │   └─ [id]                       /crm/funds/wallet-withdrawals/[id]
│  ├─ Trading Deposits               /crm/funds/trading-deposits      [P0]
│  │   └─ [id]                       /crm/funds/trading-deposits/[id]
│  └─ Trading Withdrawals            /crm/funds/trading-withdrawals   [P0]
│      └─ [id]                       /crm/funds/trading-withdrawals/[id]
│
├─ ── Internal Transfer ─────────
│  └─ Transfers                      /crm/funds/transfers             [P0]
│      └─ [id]                       /crm/funds/transfers/[id]
│
├─ ── Money Assets ──────────────
│  ├─ Wallets                        /crm/funds/wallets               [P2]
│  └─ Treasury                       /crm/funds/treasury              [P1·新]
│
├─ ── Channels ──────────────────
│  ├─ Wallet Channels                /crm/funds/channels/wallet       [P1·拆]
│  ├─ Trading Channels               /crm/funds/channels/trading      [P1·拆]
│  └─ Routing & Rules                /crm/funds/routing               [P1]
│
├─ ── Monitor & Recon ───────────
│  ├─ Fund Monitoring                /crm/funds/monitoring            [P2]
│  ├─ Reconciliation                 /crm/funds/reconciliation        [P2]
│  └─ Adjustments                    /crm/funds/adjustments           [P2]
│
├─ ── Governance ────────────────
│  ├─ Policies & Limits              /crm/funds/policies              [P0]
│  ├─ Risk & Compliance              /crm/funds/risk                  [P2]
│  └─ Approval Workflow              /crm/funds/workflow              [P1]
│
└─ Reports                           /crm/funds/reports               [P2]
```

**删除**：`funds/mt-bridge/`（功能已并入 Transfers）

## 3. 4 种存取款的分步流程对比

```
┌───────────────────────┬──────────────────────────┬──────────────────────────┐
│ 类型                   │ Step 1                   │ Step 2                   │
├───────────────────────┼──────────────────────────┼──────────────────────────┤
│ Wallet Deposit         │ Treasury 确认收款        │ Finance 钱包入账         │
│ (客户外部 → 钱包)      │ (通道 webhook / 流水)    │ (一般自动)                │
├───────────────────────┼──────────────────────────┼──────────────────────────┤
│ Wallet Withdrawal      │ Finance 审 + Compliance  │ Treasury 出款            │
│ (钱包 → 客户外部)      │ (风控 / AML / KYC)       │ (实际通道付款)            │
├───────────────────────┼──────────────────────────┼──────────────────────────┤
│ Trading Deposit        │ (Wallet→MT 内转无 Step1) │ Finance 上分到 MT5/4     │
│ (钱包/外部 → MT)       │ (External 直入: Treasury │ (MT5 Manager API 调用)   │
│                        │  确认收款)                │                          │
├───────────────────────┼──────────────────────────┼──────────────────────────┤
│ Trading Withdrawal     │ Finance 确认             │ Treasury 付款给客户      │
│ (MT → 钱包/外部)       │ (margin/positions/KYC)   │ (内转回钱包 / 外部出款)  │
└───────────────────────┴──────────────────────────┴──────────────────────────┘
```

**自动化条件**（任一不满足则强制走人工）：
- Wallet Deposit: 通道 webhook + 金额匹配 + AML pass + 非 first-deposit
- Wallet Withdrawal: 风险低 + 通道白名单 + 非 first-WD + cooldown 过 + KYC tier ≥ 2
- Trading Deposit (内转): Wallet 余额够 + KYC tier ≥ 2
- Trading Withdrawal: margin level ≥ 200% (after) + 非 high-profit + 风险低

## 4. Transfers 5 种场景

| 场景 | 心智 | 关键校验 |
|---|---|---|
| **Account ↔ Account** | 同客户名下两个 MT 账户互转 | 余额、margin、跨币种汇率、跨平台同步 |
| **Wallet → Account** | 内转上分 | 钱包余额 + tier |
| **Account → Wallet** | 内转下分 | margin / open positions |
| **Wallet → Wallet (P2P)** | **限 IB 用户** | 默认禁用；受让方 KYC ≥ tier 2 + Compliance 审 |
| **Bonus 注入** | 营销活动主动给客户加 bonus wallet | 营销部门发起 + Finance 审 |

**Transfer 路由设置**（你点名）→ 放在 Policies & Limits 的 "Transfer Rules" 分类下：
- 单笔/日累计/月累计额度（按 wallet 类型 × tier × 方向）
- 频率限制（24h 内最多 N 笔）
- 跨币种 FX spread / 报价超时
- P2P 准入名单（仅 IB 角色 + 受让方白名单）
- 跨平台 (MT4↔MT5↔TradePass) 同步策略

## 5. 通道二元拆分

```
Wallet Channels                 Trading Channels
─────────────────               ─────────────────
入金 + 出金                      存款 + 提款
USDT TRC20                      Internal (wallet ↔ MT)
USDT ERC20                      Bank Wire (直入 MT)
Bank Wire                       USDT (直入 MT)
DOKU / Skrill / Neteller        Card (直入 MT)
Visa Card (deposit only)
PIX / SEPA / 本地通道
```

通道详情页：基础信息 / 当前指标 / 高级策略（优先级、Cutoff 时间、KYC tier、风险等级、币种/额度、失败率告警）。

## 6. Routing & Rules

3 个区分维度的路由规则：

| 维度 | 规则示例 |
|---|---|
| Wallet 入金路由 | country=ID & amount<$1k → DOKU；amount≥$5k & tier=3 → Bank Wire |
| Wallet 出金路由 | currency=USDT → TRC20 (≤$10k) / ERC20 (>$10k) |
| Trading 出金路由 | risk=Low → 自动内转回钱包；risk=High → 强制人工 + Bank Wire |

每条规则：优先级、启用、条件树（多字段 AND）、目标通道、Fallback。

## 7. 审批流程（人工 + 自动）

**Manual Workflows** — 节点编辑器：
```
[Submitted] → [Auto checks] → [Decision: low risk?]
                                ├─ Yes → [Auto Lane]
                                └─ No  → [Finance L1] → [Decision: amount>$10k?]
                                                          ├─ Yes → [Compliance + Finance L2]
                                                          └─ No  → [Treasury Payout]
```

**Auto Workflows** — 触发条件 + 持续监控：
- 触发：`Wallet.deposit.created` / `Trading.withdrawal.submitted` / 等
- 动作：Block / Hold / Notify / Score+
- 联动：Risk 规则、AML 引擎、Velocity 计数器

## 8. 详情页统一模式（参考 Case Detail）

每个 Deposit / Withdrawal / Transfer 详情都是**全屏页**，结构：

```
┌─ Hero (sticky, 红色 border-l on critical) ──────────────────┐
│ L1: ID + Type chip + Status chip + Risk chip                │
│     [Action buttons by current step] [Reassign] [⌨]         │
│ L2: 客户 + KYC + 通道 + Amount + SLA timer + Assignee       │
└──────────────────────────────────────────────────────────────┘
┌─ BODY 两列 ─────────────────────────────────────────────────┐
│ [Tabs: Step Flow · Risk · Margin/Wallet · AML · Notes]       │
│                                                              │
│ Step Flow tab (核心)：                                       │
│   ●─── Submitted by client            14:23                  │
│   │                                                          │
│   ●─── Step 1: Finance Confirmed      14:25 · ops_001        │
│   │    [margin OK · KYC OK · policy ✓]                       │
│   │                                                          │
│   ●─── Step 2: Treasury Payout        ⏱ Pending             │
│        Waiting role: treasury_l1                             │
│        ──── [Approve & Payout] [Reject] ────                 │
│                                                              │
│ Risk tab、Margin tab、AML tab、Notes tab                     │
│                                                              │
│                 │ ─── 右栏 Timeline (sticky) ───            │
│                 │ Audit trail · presence · @mention          │
└──────────────────────────────────────────────────────────────┘
```

**关键功能**（对齐 case detail）：
- Sticky Hero
- 键盘快捷键（A/R/H/E 触发对应 Dialog）
- 右栏 Timeline 可拖宽
- Reassign Dialog
- 双确认（critical 时）
- 移动端 Timeline 抽屉

## 9. 列表页统一模式（参考 Client List）

```
┌─ Breadcrumb ─────────────────────────────────────┐
├─ 6× KPI 卡片（点击应用筛选） ─────────────────────┤
├─ 单行 Toolbar:                                   │
│  [Search 320px] [Quick chips 3-4 个] ⋯ [高级筛选 N]│
├─ Table toolbar: 共 N · 已选 X · Columns · Export ┤
└─ EnhancedDataTable ─────────────────────────────┘

右滑 Drawer 高级筛选：
  金额范围 / 通道 / KYC tier / 国家 / 实体 / 时间段 / 风险 / 审批步骤 / ...
```

废弃 v1 的 `Tabs + Chips 双层结构`。

## 10. Overview — 4 角色驾驶舱

```
┌─ Hero: Money at a glance ───────────────────────────────┐
│ AUM $98.4M ↑1.2% │ Net Flow +$1.2M │ Pending $5.3M     │
│ 7 day trend ──────────────────────────────────────────│
└──────────────────────────────────────────────────────────┘
┌─ Section 切换：[Treasury] [Operations] [Compliance] [Growth] ┐
└────────────────────────────────────────────────────────────┘

Treasury Section (CFO)：
  - 资金池规模（Real $80M / Bonus $4M / Credit $2M）
  - 资金分布（在钱包 / 在 MT / 在途 / 备用）
  - 当日净流入 / 7日趋势 / 30 日趋势
  - 备用金 / 跨实体调拨（占位，单实体场景显示 -）

Operations Section (COO)：
  - 自动化率（Auto Deposit 97% / Auto Withdrawal 91%）
  - SLA 达成率 / 超时数
  - 通道健康度（5/6 online）
  - 积压（Pending：Treasury 18 / Finance 9 / Compliance 4）
  - 人均处理量

Compliance Section (CCO)：
  - AML 命中 + 严重度分布
  - 大额交易（≥$10k）
  - 异常模式（Fast In-Out / High Profit / Velocity 触发次数）
  - 未结挂起 > 24h
  - SAR/STR 提交进度
  - 黑名单命中

Growth Section (CRO/CMO)：
  - FTD（首次入金）数 + 金额
  - 复入金率
  - 客单价 / 平均存款
  - 流失 / 清户
  - IB 渠道存款 / 佣金支出
  - 地区表现
```

## 11. 落地优先级（推倒重建）

**P0**（本轮起）
1. Overview（4 角色驾驶舱）
2. Wallet Deposits 列表 + 详情
3. Wallet Withdrawals 列表 + 详情
4. Trading Deposits 列表 + 详情
5. Trading Withdrawals 列表 + 详情
6. Transfers 列表（4 tab）+ 详情
7. Policies & Limits（含 Transfer Rules）

**P1**
8. Treasury（财务总监页）
9. Wallet Channels
10. Trading Channels
11. Routing & Rules
12. Approval Workflow（含人工 + 自动 持续监控）

**P2**
13. Transactions（ledger）
14. Wallets（客户钱包矩阵）
15. Adjustments
16. Monitoring
17. Reconciliation
18. Risk & Compliance
19. Reports

## 12. 共享基础设施（重建前先建）

新建以下模块以避免页面间重复：

- `lib/mock/funds/v2/entities.ts`：客户、操作员（含 role/team）、MT 账户
- `lib/mock/funds/v2/policies.ts`：审批步骤定义 + 角色映射
- `components/crm/funds/ApprovalDetailLayout.tsx`：全屏 Hero + Tabs + Timeline 模板
- `components/crm/funds/StepFlowTimeline.tsx`：分步审批可视化
- `components/crm/funds/FundsToolbar.tsx`：单行 toolbar（参考 ClientsToolbar）
- `components/crm/funds/FundsFilterDrawer.tsx`：高级筛选 Drawer

## 待办

- [ ] 删除 mt-bridge 目录
- [ ] 旧 v1 funds 页面文件（deposits / withdrawals / wallets / adjustments / monitoring / reconciliation / risk / reports / workflow / routing）：全部重写
- [ ] Sidebar.tsx 按新 IA 重排（17 项 + 7 个 section label）
- [ ] crm-shell.ts 加新 i18n 词条
- [ ] 共享 mock 数据 v2
- [ ] 共享组件：ApprovalDetailLayout / StepFlowTimeline / FundsToolbar / FundsFilterDrawer
- [ ] P0 全部 7 页（含 4 个全屏详情子页）
- [ ] P1 全部 5 页
- [ ] P2 全部 7 页
- [ ] 类型检查全绿
