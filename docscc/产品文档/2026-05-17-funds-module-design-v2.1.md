# Funds 模块设计方案 v2.1（增量）

> 日期：2026-05-17 · 分类：产品文档 · 状态：讨论中 · 版本：v2.1（增量）
> 基线：v2.0（同日早些时候）

## 0. v2.1 相对 v2 的变化

v2 锁定后产品又提出 **5 大块业务规则 + 6 条字段补全**，本文档汇总成 v2.1。本版**仅写增量**，未提及的部分以 v2 为准。

| v2.1 新增 | 落点 |
|---|---|
| 加密货币安全策略 | Policies & Limits 新分类 "Crypto Security" |
| 关键信息变更冷却 | Policies & Limits 新分类 "Account Change Cooldown" |
| 客户收款方式管理 | **新模块** Beneficiaries |
| 对账 4-tab 重写 | Reconciliation 改为 MT 内对 → PSP 外对 → 报表 三步 |
| 流水补 merchant / order 字段 | Transactions + 4 个流水页全部加 |
| 手续费管理 | **新模块** Fees & Pricing |
| 出金前置拦截 | **新模块** Withdrawal Rules（含 4 套可提款公式 + DSL） |
| 并发限制 | Policies & Limits 新分类 "Concurrency Limits" |
| 汇率中心 | **新模块** Rate Center |
| 通道准入 | **新模块** Channel Eligibility（或合并到通道详情） |
| 自动出 / 入款规则 | Policies & Limits 重组 "Automation Rules" |

## 1. 业务前提（v2 已敲定 + v2.1 补充）

| 项 | 选择 |
|---|---|
| 单实体 / USD 等值 / 三角色审批 | 维持 v2 |
| 钱包 ↔ MT 路径 | 双轨（必经钱包默认，外部直入 MT 可选） |
| P2P 转账 | 仅 IB 角色 + Compliance 强制审 |
| **手续费承担方** | **(c) 按通道差异化** —— Credit Card broker 自吸；Crypto 客户承担；Bank Wire 客户承担；本地 PSP 可按客户群差异化 |
| **加密地址白名单** | **(c) 双轨** —— 单笔 ≤ $1k 自助 + 24h 冷却；> $1k 人工 KYC 审 + 24h 冷却 |
| **关键信息变更冷却** | **(c) 按字段** —— 密码/2FA/邮箱/手机 改了直接拒；银行卡/USDT 地址改了走强制人工 |
| **对账流程** | **标准三步** —— Tab1 内对 (CRM↔MT) → Tab2 外对 (CRM↔PSP) → Tab3 Reports (日/周/月) |

## 2. 新 IA（19 → 20 页）

```
Funds
├─ Overview                               (Cockpit)
│
├─ ── Money Flow ────────────────
│  ├─ Transactions                        [+ merchant / order_id]
│  ├─ Wallet Deposits                     [+ merchant / order_id]
│  ├─ Wallet Withdrawals                  [+ merchant / order_id]
│  ├─ Trading Deposits                    [+ merchant / order_id]
│  └─ Trading Withdrawals                 [+ merchant / order_id]
│
├─ ── Internal Transfer ─────────
│  └─ Transfers (5 种场景)
│
├─ ── Money Assets ──────────────
│  ├─ Wallets
│  ├─ Beneficiaries                       ★ (客户收款方式管理)
│  └─ Treasury
│
├─ ── Channels ──────────────────
│  ├─ Wallet Channels
│  ├─ Trading Channels
│  ├─ Routing & Rules
│  └─ Fees & Pricing                      ★ (手续费管理)
│
├─ ── Rate Center ───────────────         ★ 新组（汇率中心）
│  └─ Rate Center
│
├─ ── Monitor & Recon ───────────
│  ├─ Fund Monitoring
│  ├─ Reconciliation                      [4 tab: MT内 / PSP外 / Daily / Monthly]
│  └─ Adjustments
│
├─ ── Governance ────────────────
│  ├─ Policies & Limits                   [扩展 6 个新分类]
│  ├─ Risk & Compliance
│  └─ Approval Workflow
│
└─ Reports
```

页面总数：**20**（+ Rate Center）

## 3. Policies & Limits 内部结构（v2.1 重写）

策略类目按"业务场景"分组，**每个二级类目独立编辑面板**：

```
Limits
├─ Deposit Limits (per tier × per direction)
├─ Withdrawal Limits (per tier × per direction)
└─ Transfer Limits (5 个场景各自配)

Withdrawal Rules                          ★ 新分类
├─ Holdings Interception (持仓拦截开关)
├─ Margin Level Thresholds (3 档：warn / manual / block)
├─ Withdrawable Formula                   ★ 核心
│   ├─ Preset A: Free Margin Conservative
│   ├─ Preset B: Free Margin + Stop Out Buffer
│   ├─ Preset C: Closed Realized Only
│   ├─ Preset D: Available Balance (excl. Bonus/Credit/Pending)
│   └─ Custom Formula (DSL / 函数表达式)
├─ Decimal Places (per currency / per channel)
└─ Per-Channel Specific Rules

Concurrency Limits                        ★ 新分类
├─ Per Client (max pending deposits / withdrawals)
├─ Per Channel (max in-flight)
└─ Platform-wide Capacity

Crypto Security                           ★ 新分类
├─ Address Whitelist Rules
├─ Chain Whitelist
├─ Large USDT Thresholds
├─ Chainalysis Integration
├─ Deposit-to-Withdrawal Cooldown
├─ Min Confirmations
└─ Suspicious Address Delay

Account Change Cooldown                   ★ 新分类
├─ Password Change (default 24h, behavior: block)
├─ 2FA Device Change (48h, block)
├─ Email / Phone Change (24h, block)
├─ Card / Crypto Address Bind (24h, manual)
└─ KYC Re-submit (0h, no cooldown)

Automation Rules                          ★ 重组
├─ Auto Deposit Conditions
├─ Auto Withdrawal Conditions
└─ Auto Internal Transfer Conditions

Channel Eligibility                       ★ 新分类（也可独立成页）
├─ By Region
├─ By KYC Tier
├─ By User Tag
├─ By User Role (IB / VIP / Standard)
└─ By MT Account Type

Transfer Rules
├─ Account ↔ Account (含跨币种 FX spread / 跨平台同步)
├─ Wallet → Account / Account → Wallet
├─ Wallet → Wallet P2P (仅 IB)
└─ Bonus Injection

KYC Mapping (Tier → 资金权限)
First-Withdrawal Rule
Country Restrictions
```

## 4. 可提款金额公式（v2.1 §13.3 详解）

**核心痛点**：不同 broker 算法不同，外汇行业没有统一标准。需要支持多套预设 + 自定义。

### 4.1 预设公式

| 预设 | 公式 | 适用场景 |
|---|---|---|
| **A. Conservative Free Margin** | `Equity - UsedMargin × (1 + safetyBuffer)` | 严格保守 broker，避免 stop-out |
| **B. Free Margin + Stop-Out Buffer** | `Equity - UsedMargin × (100% / stopOutLevel)` | 行业最常用，匹配交易系统 stop-out 阈值 |
| **C. Closed Realized Only** | `min(Equity, Balance) - Bonus - Credit - PendingOrders` | 最保守，只能取已平仓利润 |
| **D. Available Balance** | `Balance - Bonus - Credit - PendingOrders - PendingWithdrawals` | 不计未实现盈亏（防对赌客户先盈再提） |

> 变量定义（每个 broker 可能略有差异）：
> - **Equity** = Balance + Floating PnL
> - **Balance** = Realized PnL 累计 + Deposits − Withdrawals + Adjustments
> - **UsedMargin** = Σ(Position × MarginRate)
> - **safetyBuffer** = 用户在配置里设的安全比例（默认 0.2，即 20%）
> - **stopOutLevel** = 跟交易系统对齐（如 50% 或 100%）

### 4.2 自定义公式（DSL）

支持运营在 UI 上写**函数表达式**，可用变量和函数：

```
变量：Equity / Balance / UsedMargin / FreeMargin / Bonus / Credit
       Pending / Floating / Realized / DailyWithdrawn / MonthlyWithdrawn
       KYCTier / UserTag / AccountType / Country
函数：min / max / clamp / if(cond, a, b)
```

示例：
```js
// 例子 1：VIP 给 10% 额外额度
WithdrawableAmount = if(UserTag == "VIP",
  Equity - UsedMargin * 1.1,
  Equity - UsedMargin * 1.3)

// 例子 2：每日累计封顶
WithdrawableAmount = min(
  Equity - UsedMargin * 1.2 - Bonus - Credit,
  10000 - DailyWithdrawn
)
```

### 4.3 UI

```
┌─ Withdrawable Formula ──────────────────────┐
│ 当前生效: Preset B (Free Margin + Stop-Out) │
│ ──────────────────────────────────────────  │
│ ( ) Preset A: Conservative                   │
│ (●) Preset B: Free Margin + Stop-Out         │
│     safetyBuffer = [ 0.2 ]                   │
│     stopOutLevel = [ 50% ]                   │
│ ( ) Preset C: Closed Realized Only           │
│ ( ) Preset D: Available Balance              │
│ ( ) Custom Formula                           │
│     [DSL 编辑器]                              │
│                                              │
│ [实时计算器] 输入虚拟 Equity 等 → 看公式输出 │
│                                              │
│ [测试沙盒] 对最近 10 笔出金回算，看差异     │
└─────────────────────────────────────────────┘
```

## 5. 出金前置拦截规则（v2.1 §13）

每条**独立可启用 / 禁用 / 配置阈值**，按顺序执行：

```
┌──────────────────────────────────────────────────────────────┐
│ Step 1: 持仓拦截                                              │
│   [✓] 有 open positions 时:                                  │
│       ( ) 完全禁止                                            │
│       (●) 允许但金额受限于 WithdrawableAmount                │
│       ( ) 警告 + 二次确认                                     │
├──────────────────────────────────────────────────────────────┤
│ Step 2: Margin 阈值                                          │
│   预测出金后 margin level:                                    │
│   < [200%] 警告操作员                                         │
│   < [150%] 强制人工 + Compliance                              │
│   < [100%] 直接拒                                             │
├──────────────────────────────────────────────────────────────┤
│ Step 3: 可提款金额计算                                        │
│   套用 §4 当前生效公式                                        │
│   出金 > WithdrawableAmount 直接拒                            │
├──────────────────────────────────────────────────────────────┤
│ Step 4: 小数位校验                                            │
│   USD / EUR / GBP: [2] 位                                    │
│   USDT TRC20: [6] 位                                         │
│   USDT ERC20: [6] 位                                         │
│   BTC: [8] 位                                                │
│   (per-currency 配置)                                         │
└──────────────────────────────────────────────────────────────┘
```

## 6. 并发限制（v2.1 §14）

| 维度 | 默认 | 行为 |
|---|---|---|
| 每客户 Pending Deposits | 3 | 超过则前端阻止提交 + 后台告警 |
| 每客户 Pending Withdrawals | 2 | 超过则前端阻止 |
| 每客户每日 Pending 累计 | 10 | 超过强制人工 |
| 每通道 in-flight | 50 | 超过排队 + 告警通道方 |
| 平台 in-flight withdrawals | 200 | 超过临时禁用自动出金 |

每条都可启用 / 禁用 / 调阈值。规则触发时记录到 Audit Trail。

## 7. Rate Center（v2.1 §15，新模块）

### 7.1 数据层次

```
Layer 1: 基础汇率 (Reference Rate)
   来源: Google Finance (用户指定)
   更新频率: 每分钟 / 每 5 分钟（可配）
   字段: pair (USDEUR) / mid / bid / ask / source / fetchedAt

Layer 2: 业务汇率 (Business Rate)
   财务在基础上 ± 调水
   spread: 数值或百分比（如 +0.5% 或 +0.005）
   有效期: from / to
   变更走 Audit Trail

Layer 3: 通道使用层
   每个通道在配置里选:
     ( ) 使用基础汇率 (no spread)
     (●) 使用业务汇率 (赚 spread)
     ( ) 自定义汇率
   不同方向可不同（deposit / withdrawal 各自配）
```

### 7.2 货币对管理

```
USD/EUR    显示顺序: USD → EUR     小数位: 4 (0.9300)
USD/JPY    显示顺序: USD → JPY     小数位: 2 (110.50)
USD/IDR    显示顺序: USD → IDR     小数位: 0 (15500)
USDT/USD   显示顺序: USDT → USD    小数位: 4 (0.9998)
EUR/USDT   显示顺序: EUR → USDT    小数位: 4 (1.0750)
...
```

每个货币对：
- 启用 / 禁用
- 小数位
- 显示顺序（base/quote 方向）
- 当前基础汇率 + 业务汇率
- spread 配置
- 变更历史

### 7.3 路由

`/crm/funds/rate-center` —— 独立成 section（不归在 Channels 下，因为它服务所有模块）

### 7.4 用途

- Transfers 跨币种时引用业务汇率
- PSP 当地货币入金时按业务汇率折美元到钱包
- Trading Deposit 当地货币 → MT USD 账户时折算
- Treasury 计算 AUM USD 等值时用业务汇率（vs 基础汇率折算差异 = broker 名义利润）

## 8. 通道准入 Channel Eligibility（v2.1 §16）

每条通道（不论 Wallet / Trading）的"谁能用"维度配置：

```
┌─ DOKU Wallet ────────────────────────────────┐
│ Direction: Deposit + Withdrawal              │
│                                              │
│ Eligibility Matrix:                          │
│   Region:        [ID, MY] only               │
│   KYC Tier:      [Tier2, Tier3]              │
│   User Tag:      ANY (不限)                   │
│   User Role:     Standard, IB (不含 VIP)     │
│   MT Account:    Standard, Cents (不含 ECN)  │
│                                              │
│ Override (per individual):                   │
│   Whitelisted clients (强制启用): 12         │
│   Blacklisted clients (强制禁用): 3          │
└──────────────────────────────────────────────┘
```

放在通道详情页里更合理（不需要独立成页）。Policies 入口可跳通道详情。

## 9. Automation Rules（v2.1 §17，重组）

回答用户问题"存款设置是什么？"：

**根本区别**：
- 入金的"自动化"= **默认开启**，条件不满足时**降级到人工**
- 出金的"自动化"= **默认人工**，条件全满足时**升级到自动**

### 9.1 Auto Deposit（默认开启的降级模型）

```
通道 webhook 收到付款 ↓
   ↓
[ ] AML pass ?           →  否 → 人工
[ ] 金额匹配 ?            →  否 → Pending Match 队列
[ ] 客户钱包 Active ?     →  否 → 人工
[ ] 非首次大额 ?          →  否（首次 > $1k）→ 人工
[ ] 来源通道白名单 ?      →  否 → 人工
[ ] 加密充值最低确认数 ?  →  否 → 等待 Confirmation
   ↓ 全过
入账钱包 + 通知客户
```

### 9.2 Auto Withdrawal（默认人工的升级模型）

```
客户提交出金 ↓
[ ] 风险分 ≤ 25 ?              →  否 → 人工
[ ] KYC tier ≥ 2 ?              →  否 → 人工
[ ] 每人每日小额次数 < N ?       →  否 → 人工 (N 可配，默认 3)
[ ] 单笔 ≤ $X ?                 →  否 → 人工 (X 可配，默认 $5,000)
[ ] 每日累计 ≤ $Y ?             →  否 → 人工 (Y 可配，默认 $10,000)
[ ] 通道在白名单 ?               →  否 → 人工
[ ] 同通道 3 笔历史成功 ?        →  否 → 人工
[ ] 关键信息冷却期外 ?           →  否 → 直接拒
[ ] 无 open positions /
   margin level after ≥ 200% ?  →  否 → 人工
[ ] Fast-In-Out 未触发 ?         →  否 → 人工
[ ] AML 无 hit ?                 →  否 → 人工 + Compliance
   ↓ 全过
自动放款（Step 1 跳过，直接 Step 2）
```

### 9.3 Auto Internal Transfer

Wallet → Account 内转默认全自动（同主体、无外部资金流）；其他场景按规则。

## 10. 流水字段补全（v2.1 §5）

所有流水类页（Transactions + 4 个 Deposit/Withdrawal 页）的列表 + 详情都加：

| 字段 | 含义 |
|---|---|
| Channel | DOKU / USDT TRC20 / ... |
| Merchant Name | "DOKU - PT XYZ Indonesia"（PSP 之上的具体运营商户） |
| Merchant Order ID | PSP 那侧的单号（**对账主键**） |
| Channel Reference | 通道最终返回的引用号（银行电汇号 / TXID / 卡交易号） |
| Fee Applied | 本笔实际收的手续费 + 承担方 |
| FX Rate Used | 跨币种时引用的业务汇率 + 时间戳 |

## 11. 落地优先级（v2.1 更新）

**P0**（核心闭环，10 项）
1. Overview
2. Wallet Deposits（列表 + 详情）
3. Wallet Withdrawals（列表 + 详情）
4. Trading Deposits（列表 + 详情）
5. Trading Withdrawals（列表 + 详情）
6. Transfers（列表 + 详情）
7. Policies & Limits（含 Withdrawal Rules / Concurrency / Crypto Security / Account Change Cooldown / Automation Rules）
8. Beneficiaries
9. Rate Center
10. Reconciliation（3 tab）

**P1**（5 项）
11. Treasury
12. Wallet Channels（含 Eligibility + Fees）
13. Trading Channels（含 Eligibility + Fees）
14. Routing & Rules
15. Approval Workflow（人工 + 自动）

**P2**（7 项）
16. Transactions
17. Wallets
18. Adjustments
19. Fund Monitoring
20. Risk & Compliance
21. Reports
22. Fees & Pricing（如果不放在通道详情内）

## 12. v2.2 增量（B 系列回答 + 5 个新业务规则）

### 12.1 B 系列决策结果

| 决策 | 选择 | 备注 |
|---|---|---|
| **B1 可提款公式** | **4 套全支持 + 默认 Preset B** | UI 上让运营自选 + DSL 高级模式 |
| **B2 DSL 自定义改动权限** | **(c) 双人复核**（Finance 改 + Compliance 签） | 公式直接关乎放款金额，必须双人 |
| **B3 持仓拦截阶梯** | **margin level 阶梯式**（推荐组合）：≥200% 通过 / 150–200% 警告 / 100–150% 强制人工 / <100% 直接拒 | 用户原话："强化提示 + 达到阈值才强制拦截" |
| **B4 加密小数位** | **(c) 按币种 + 通道双层** | 同 USDT 不同链精度不同 |
| **B5 平台容量上限触发** | **(a) 临时禁用自动出金，全转人工**（fail-safe） | 标准做法 |
| **B6 基础汇率源** | **多源接入（Google + Yahoo）+ T-1 兜底**（v2.2 重设计，见 §12.6） | 灾备已纳入 |
| **B7 业务汇率调水** | **(a) Finance 改 → 即时生效 + Audit Trail** | 灵活优先 |
| **B8 Whitelist override** | **(b) Whitelist + Blacklist override**（推荐） | 应对 VIP 特批 + 风控临时禁用 |
| **B9 Auto Deposit 首次大额阈值** | **(d) 按 KYC tier 分档**（推荐） | Tier1=$500 / Tier2=$5,000 / Tier3=$50,000 |
| **B10 Auto Withdrawal 每日小额** | **(d) 按 KYC tier 分档**（推荐） | Tier1=禁 / Tier2=3笔×$2k / Tier3=5笔×$5k |

> 注：B2/B3/B4/B8/B9/B10 用户没明确选项，按"我的推荐组合"落定。如要调整告知。

### 12.2 IB 链路 / 注册 Source 准入（新需求 1）

之前 Channel Eligibility 是 5 维矩阵（region/KYC/tag/role/MT account）。v2.2 加 **2 维**：

```
┌─ Channel Eligibility Matrix (扩展到 7 维) ──────────────┐
│ Region        [country list]                            │
│ KYC Tier      [tier list]                               │
│ User Tag      [tag list]                                │
│ User Role     [role list]                               │
│ MT Account    [account type list]                       │
│ IB Affiliation [IB tree path list]  ← 新                │
│ Registration Source [source list]    ← 新                │
└─────────────────────────────────────────────────────────┘
```

**IB Affiliation 数据结构**：IB 是树形（IB-001 → 子 IB-A / 子 IB-B → 客户）。
- 配置时支持选择特定 IB 节点（如 "IB-001 全树" / "IB-001 直系" / 具体子节点）
- 客户的 IB 归属来自 `client.referralChain`

**Registration Source 数据结构**：平面标签集合（如 `fb_camp_summer2026` / `google_ads_id` / `referral_link_X`）
- 来自 `client.registrationSource` 字段
- 营销部门维护可选列表

**实际场景举例**：
- "DOKU Wallet 只对 IB-001 树下的客户开放（IB 渠道独占）"
- "Bank Wire 不对 fb_camp 渠道客户开放（这批客户风险高，强制走 USDT）"

**入口**：通道详情页 → Eligibility tab → 多维矩阵编辑器

### 12.3 提款字段补全（新需求 2）

v2.1 §10 提到了 merchant_name / merchant_order_id，v2.2 再细化提款专属 3 字段：

| 字段 | 含义 | 数据来源 |
|---|---|---|
| **Payout Method** | 提款给客户的最终形式：Bank Wire to Chase ****4567 / USDT TRC20 to TXfa...4422 / DOKU Wallet ID-22001 | 客户绑定的 Beneficiary |
| **Channel Name** | 通道标识：USDT-TRC20 / Bank-Wire-Chase / DOKU-IDR | Channel master data |
| **Payout Fee** | 本笔提款实收手续费 + 承担方（客户/Broker） | 套用 Fees & Pricing 规则 |

**列表列**：插入"Method · Channel · Fee"三列，分别显示。
**详情页**：在 Hero 下"Payout Target"段单独展示 Method 全文 + Beneficiary 跳转链接。

### 12.4 收款方式币种管理 + 银行下拉列表（新需求 3）

v2.1 已有 Beneficiaries 模块，v2.2 在它**之上加币种维度** + 银行主数据：

#### 12.4.1 Channel × Currency 矩阵

每个通道支持的币种不是一个，而是个矩阵：

```
USDT TRC20:    [USDT, USDC]
Bank Wire:     [USD, EUR, GBP, JPY, AUD, IDR, BRL, ...]
DOKU Wallet:   [IDR only]
SEPA:          [EUR only]
PIX:           [BRL only]
```

每个币种**独立可启用 + 独立 Eligibility 配置**：
- "Bank Wire USD" 对所有客户开放
- "Bank Wire IDR" 只对 region=ID 开放
- "Bank Wire JPY" 对 region=JP + KYC tier ≥ 2 开放

入口：Channels 详情 → "Supported Currencies" tab → 每币种独立 sub-config

#### 12.4.2 Bank Master Data（新子模块）

银行下拉列表需要后台维护：

```
/crm/funds/master-data/banks (新二级模块或挂在 Channels 下)

Fields per bank:
├─ Bank Name        Chase Bank
├─ Bank Code        CHASUS33XXX
├─ Country          US
├─ SWIFT Code       CHASUS33XXX
├─ Routing Number   021000021 (国家相关字段)
├─ IBAN Required    YES/NO (国家相关)
├─ Intermediary Bank YES/NO (跨境时是否需要中间行)
├─ Status           Active / Inactive
└─ Last Updated By / At
```

操作员/客户绑定银行卡时，从该清单下拉选 → 自动填 SWIFT/Routing 等字段，减少手填错误。

### 12.5 提款扣除规则（新需求 4 - 核心反洗钱策略）

用户原话：
> 用 USDT 存入 1 块钱；然后使用银行卡 提取 EUR 5000 块钱
> 提款时，先扣除什么金额，按道理应该是 同币种同出优先

**这是反洗钱核心规则**（防"USDT 入金洗白成法币出"模式）。

#### 12.5.1 行业 5 种策略

| 策略 | 含义 | 行业评价 |
|---|---|---|
| **FIFO** | 先进先出 | 简单但反洗钱差 |
| **LIFO** | 后进先出 | 更差，不推荐 |
| **Same-Currency First** | 同币种优先（用户提的） | OK，但同币不同通道仍可洗 |
| **Same-Channel First** ★ | **同通道优先** | **行业反洗钱黄金标准** |
| **Risk-Weighted** | 高风险源优先转出 | 主动清洗，激进 |

#### 12.5.2 "Same-Channel First" 算法

用户充值历史按通道分桶：
```
Client USR-X 充值历史:
   USDT TRC20:  $1,200 (deposits)
   Bank Wire USD: $3,800 (deposits)
   DOKU IDR:    $500 (deposits)
                ─────
                $5,500 total
```

客户请求出 $5,000 到 EUR 银行卡 时：
```
Step 1: 优先扣同通道（Bank Wire）   → $3,800 from Bank Wire 桶
Step 2: 仍需 $1,200 → 触发跨通道告警
        ── 选项 A：拒绝（最严）
        ── 选项 B：人工 + Compliance（允许但审）
        ── 选项 C：自动跨桶 + FX 转换 + 记录路径
```

**配置项**：
```
Withdrawal Deduction Rule:
  Primary:        [Same-Channel First]
  Cross-Channel:  ( ) Block
                  (●) Manual + Compliance
                  ( ) Auto-cross + FX (危险)
  Same-Currency Cross-Channel?  YES / NO
```

#### 12.5.3 客户视图 UI

客户提款界面应该显示：
```
提款 EUR 5,000
├─ 可用余额: $5,500 USD 等值
├─ 优先扣除: Bank Wire (USD) $3,800  ✓ 同通道
├─ 跨通道补足: $1,200 (需审批)
│   ├─ USDT TRC20:  $1,200 (可选)
│   └─ DOKU IDR:    $500 (可选, 部分)
└─ 提交 → 人工审核
```

让客户对自己资金来源透明，减少争议。

#### 12.5.4 详情页字段

每笔出金详情新增"Deduction Plan"段，列出：
- 实际从哪个桶扣了多少
- 跨通道时审批人 + 备注
- 用的 FX rate 时间戳（v2.1 Rate Center §7 关联）

### 12.6 每日资金报表（新需求 5）

v2.1 Reconciliation Tab 3 已经是 Daily Reports，v2.2 把内容**结构化**：

#### 12.6.1 通道维度日报（按通道汇总）

```
通道     入金额(笔)         出金额(笔)         净流入     成功率
─────    ─────────         ─────────         ──────     ──────
DOKU     $412k (412)       $0  (0)           +$412k     98.4%
USDT-TRC $880k (89)        $560k (43)        +$320k     99.1%
Bank Wire $540k (38)       $210k (18)        +$330k     86.3%
...
─────    ─────────         ─────────         ──────
Total    $2.3M (612)        $1.1M (89)        +$1.2M     96.8%
```

#### 12.6.2 余额维度日报（钱包/账户类型）

```
账户类型       开始余额      入金       出金       净变化      结束余额
──────────    ────────     ──────     ──────    ─────────   ────────
Real Wallet   $78.2M       +$1.8M     -$900k    +$900k      $79.1M
Bonus Wallet  $4.1M        +$80k      -$60k     +$20k       $4.12M
Credit        $2.0M        +$0        -$0       $0          $2.0M
MT5 Trading   $11.8M       +$500k     -$140k    +$360k      $12.16M
─────────     ────────     ──────     ──────    ─────────   ────────
Total AUM     $96.1M       +$2.38M    -$1.1M    +$1.28M     $97.38M
```

#### 12.6.3 客户维度日报

```
Top 10 FTD (首次入金):           [客户 / 金额 / 渠道]
Top 10 Deposits (大额入金):       [客户 / 金额 / 渠道]
Top 10 Withdrawals (大额出金):    [客户 / 金额 / 渠道]
新增钱包冻结: N 个
异常资金事件: N 件
```

#### 12.6.4 历史归档

每日 00:30 自动生成前日报表（24h 数据冷却），归档到 `funds_daily_reports` 表。
财务可下载 CSV / PDF（自动签名）作为正式财务凭证。

## 13. Rate Center 灾备机制（v2.2 §12.1 B6 详化）

```
Layer 1: 双源采集
  ├─ Source A: Google Finance  → mid_a
  └─ Source B: Yahoo Finance   → mid_b
  系统每分钟拉取，去极值取中位

Layer 2: 滚动存储
  ├─ T-1h snapshot   (上一小时)
  ├─ T-1d midpoint   (昨日中间价)
  └─ T-7d average    (周均)

Layer 3: 失败降级链
  Live (a+b 取中) 失败
    ↓
  Live a 或 b 单源 (取剩下能用的)
    ↓
  T-1h snapshot
    ↓
  T-1d midpoint  ← 兜底
    ↓
  系统全局告警 + 暂停跨币种 transfer 自动审批
```

UI 上 Rate Center 必须显示**当前生效层级**：
```
🟢 Live (Google + Yahoo, 14:30:00)     正常
🟡 Live (Yahoo only)                   单源
🟠 Snapshot T-1h                       滚动兜底
🔴 T-1 Midpoint (DR mode)              灾备模式 — 暂停自动跨币审批
```

## 14. v2.2 IA 调整

```
Funds (20 → 21 页)
├─ Overview
├─ Money Flow (5 页)
├─ Internal Transfer (Transfers)
├─ Money Assets (Wallets / Beneficiaries / Treasury)
├─ Channels (Wallet / Trading / Routing / Fees & Pricing / Master Data)  ← +1
├─ Rate Center
├─ Monitor & Recon (Monitoring / Reconciliation / Adjustments)
├─ Governance (Policies & Limits / Risk / Approval Workflow)
└─ Reports

Channels.Master Data (新)
└─ Banks         (银行下拉列表维护)
```

## 15. v2.2 Policies & Limits 内部最终结构

```
Limits                              (3 子项)
Withdrawal Rules                    (新增 Deduction Rule)
  ├─ Holdings Interception
  ├─ Margin Level Thresholds (阶梯)
  ├─ Withdrawable Formula (4 套 + DSL)
  ├─ Decimal Places (币种 × 通道)
  ├─ Deduction Strategy ★ 新       ← Same-Channel First 默认
  └─ Per-Channel Specific Rules
Concurrency Limits                  (5 维)
Crypto Security                     (7 子项)
Account Change Cooldown             (按字段)
Automation Rules                    (Auto Deposit / Withdrawal / Transfer)
Channel Eligibility                 (扩展到 7 维: + IB / Source)
Transfer Rules                      (5 场景)
KYC Mapping
First-Withdrawal Rule
Country Restrictions
```

## 16. C 系列决策结果（v2.2 最终）

| 决策 | 选择 |
|---|---|
| **C1 提款扣除规则** | **运营在 UI 可选**，3 套预设：Same-Channel First / Same-Currency First / FIFO；**默认 Same-Channel First** |
| **C2 跨通道补足策略** | **运营在 UI 可选**，2 套：Block / Manual+Compliance；**默认 Manual+Compliance** |
| **C3 IB 链路颗粒度** | **直系 + 全树双轨**：每条 Eligibility 规则可选 "直系" 或 "全树（含子 IB）" |
| **C4 注册 Source 列表** | **混合**：从客户实际注册数据自动聚合候选 → 营销部门审批后才进入可选项 |
| **C5 Bank Master Data 维护权限** | **Finance 总监**改 + 全量 Audit Trail（操作员只读） |
| **C6 每日资金报表维度** | **全做 3 维**：通道维度 + 余额维度 + 客户维度（Top10 FTD / 大额入 / 大额出） |

## 17. 方案冻结清单（v2.2 Final）

### 17.1 全部已决策列表（29 条）

```
Q1 单实体经纪商
Q2 钱包+MT 双轨（默认必经钱包 + 可选直入 MT）
Q3 三角色审批 (Finance / Treasury / Compliance)
Q4 P2P 转账限 IB + Compliance 审
Q5 Overview 4 角色驾驶舱
Q6 详情用全屏页（参考 case detail）
Q7 推倒重建 v1
Q8 P0+P1+P2 全部实现

A1 Beneficiaries 独立成页
A2 手续费按通道差异化（c）
A3 加密地址双轨（c）
A4 关键信息变更冷却按字段（c）
A5 三步对账：MT 内对 → PSP 外对 → Reports

B1 4 套可提款公式 + DSL，默认 Preset B
B2 DSL 双人复核（Finance 改 + Compliance 签）
B3 持仓拦截 margin level 阶梯：≥200% 通过 / 150-200% 警告 / 100-150% 强制人工 / <100% 拒
B4 小数位按币种 × 通道双层
B5 平台容量上限 → 临时禁用自动出金，全转人工
B6 双源（Google + Yahoo） + T-1 兜底（4 层降级链）
B7 业务汇率即时生效 + Audit Trail
B8 Whitelist + Blacklist 个体 override
B9 Auto Deposit 首存大额按 tier 分档（500/5000/50000）
B10 Auto Withdrawal 每日小额按 tier 分档（禁/3×$2k/5×$5k）

C1 提款扣除规则运营可选，默认 Same-Channel First
C2 跨通道补足运营可选，默认 Manual + Compliance
C3 IB 链路双轨（直系/全树）
C4 注册 Source 混合（聚合 + 营销审批）
C5 Bank Master 维护权限 Finance 总监 + Audit Trail
C6 每日报表全做 3 维度
```

### 17.2 完整模块清单 (21 个二级页 + 5 个动态详情子页)

```
01. Overview                              (Cockpit, 4 角色)
02. Transactions                          (ledger)
03. Wallet Deposits          + [id]       (任务工作台 + 全屏详情)
04. Wallet Withdrawals       + [id]
05. Trading Deposits         + [id]
06. Trading Withdrawals      + [id]
07. Transfers                + [id]       (5 场景 tab)
08. Wallets                               (客户钱包矩阵)
09. Beneficiaries                         ★ 新
10. Treasury                              ★ 新 (CFO 视角)
11. Wallet Channels                       (含 Eligibility 7 维 + Currency × N)
12. Trading Channels                      (含 Eligibility + Currency)
13. Routing & Rules                       (动态路由)
14. Fees & Pricing                        ★ 新 (手续费管理)
15. Bank Master Data                      ★ 新 (银行下拉列表)
16. Rate Center                           ★ 新 (双源汇率)
17. Fund Monitoring
18. Reconciliation                        (3 tab: MT内 / PSP外 / Reports[3 维])
19. Adjustments
20. Policies & Limits                     (10 个子分类)
21. Risk & Compliance
22. Approval Workflow                     (人工 + 自动)
23. Reports
```

### 17.3 共享基础设施清单（先建后用）

```
lib/mock/funds/v2/                        新版 mock 数据
├─ entities.ts             客户 / 操作员 / 角色 / 团队 / MT 账户
├─ channels.ts             通道 master data (含 currency matrix)
├─ banks.ts                银行下拉列表
├─ beneficiaries.ts        客户绑定的收款方式
├─ ib-tree.ts              IB 层级结构
├─ registration-sources.ts 注册渠道
├─ rates.ts                汇率快照 + spread
├─ policies.ts             策略配置 + 公式 DSL
├─ approvals.ts            分步审批任务
├─ transfers.ts            5 种转账数据
├─ deposits-wallet.ts
├─ withdrawals-wallet.ts
├─ deposits-trading.ts
├─ withdrawals-trading.ts
└─ reconciliation.ts       3 tab 数据

components/crm/funds/                     共享组件
├─ ApprovalDetailLayout.tsx               全屏 Hero + Tabs + Timeline
├─ StepFlowTimeline.tsx                   分步审批可视化
├─ FundsToolbar.tsx                       单行 toolbar (参考 ClientsToolbar)
├─ FundsFilterDrawer.tsx                  高级筛选 Drawer
├─ ChannelEligibilityEditor.tsx           7 维矩阵编辑器
├─ FormulaEditor.tsx                      DSL 公式编辑器 + 实时计算器
├─ MarginImpactPanel.tsx                  Margin level 影响面板
├─ DeductionPlanPanel.tsx                 扣款方案展示
└─ RateLayerBadge.tsx                     汇率灾备层级显示
```

### 17.4 落地顺序

```
Step 1 — 清理 (1 message)
  ├─ git rm v1 funds page (deposits/withdrawals/wallets/adjustments/etc)
  ├─ Edit Sidebar 切到 v2.2 新 IA
  └─ Edit i18n 新词条

Step 2 — 共享基础 (1-2 messages)
  ├─ 建 14 个 mock 文件
  └─ 建 9 个共享组件

Step 3 — P0 (3-4 messages, ~3000 行)
  ├─ Overview
  ├─ Wallet Deposits 列表 + 全屏详情
  ├─ Wallet Withdrawals 列表 + 全屏详情
  ├─ Trading Deposits 列表 + 全屏详情
  ├─ Trading Withdrawals 列表 + 全屏详情
  ├─ Transfers 列表 + 全屏详情
  ├─ Policies & Limits (10 子类)
  ├─ Beneficiaries
  ├─ Rate Center
  └─ Reconciliation (3 tab)

Step 4 — P1 (2-3 messages, ~2000 行)
  ├─ Treasury
  ├─ Wallet Channels (含 Eligibility + Currency)
  ├─ Trading Channels
  ├─ Routing & Rules
  ├─ Fees & Pricing
  ├─ Bank Master Data
  └─ Approval Workflow

Step 5 — P2 (2 messages, ~1500 行)
  ├─ Transactions
  ├─ Wallets
  ├─ Adjustments
  ├─ Fund Monitoring
  ├─ Risk & Compliance
  └─ Reports

Step 6 — 收尾 (1 message)
  ├─ Sidebar 整体校对
  ├─ i18n 完整词条
  └─ tsc --noEmit 通过
```

## 待办

- [x] 方案 v2.2 冻结完成
- [ ] 等用户指令 "开始" / "开工" → 进入 Step 1
- [ ] 之后按 Step 顺序推进，每个 Step 完成报告进度
