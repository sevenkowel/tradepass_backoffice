# `/crm/funds/policy` — Fund Policy

> **数据契约**：
> - 复用 `clmConfigService` 模式（CLM Configuration 的 6 个 screen 都用这套）— `FundPolicy` 走 `clmConfigService.policies` (category='funds') 或新建 `fundsConfigService`，与 `ConfigDrawer` 配套
> - 审计走 `GlobalAuditLog(domain=funds)`
> - 客户级 override 通过 `Permissions tab`（Client Detail）

---

## 1. 目的

经纪商**全平台资金策略**配置：哪些客户能入金 / 出金、限额、cooldown、自动批准规则、双签门槛。是合规审计的重要项（监管会查 "为什么客户能 / 不能出金"）。

> 一处定义，多处生效：Funds tab 的 mutation 调用 service 时**强制**先 enforce 这里的 policy；Permissions tab 的 client-level override 不能突破这里的硬上限。

---

## 2. 数据展示

按 section 分组（每组用 `Card` + Edit 入口打开 `ConfigDrawer`）。

### 2.1 Withdrawal Approval Rules

| 字段 | 默认 |
|---|---|
| 自动批准阈值 | < $500（小额 + 无风险标记）自动批 |
| 双签阈值（compliance + finance） | >= $10k（详见 client-detail OPEN Q1） |
| Per-jurisdiction 阈值 override | Q1 决定后填 |
| Daily limit per client | $50k default（VIP / level override） |
| Monthly limit per client | $500k default |
| First withdrawal cooldown | 7 天（lifetime first） |
| KYC renew 后 cooldown | 3 天 |
| AML flagged cooldown | 14 天 |
| Frozen account 出金 | 不允许 |
| 允许的收款方变更检查 | 与入金方一致 / 客户主动改需重 KYC |

### 2.2 Deposit Rules

| 字段 |
|---|
| 最小入金额（首次 / 后续）/ 最大单笔入金 / Daily / Monthly limit per client / 允许的入金 method 矩阵（method × jurisdiction） / 大额入金触发 EDD 阈值（$10k default） / 第三方入金检测：是否拒绝 / 入金到出金最短间隔（防 rinse pattern） |

### 2.3 Internal Transfer Rules

| 字段 |
|---|
| 是否允许客户多账户内部转账 / 转账上限 / 仅同币种 vs 自动换汇 / 是否扣手续费 |

### 2.4 Adjustment Rules（手动调账）

| 字段 |
|---|
| Single-sign 上限（< $1k） / 双签上限（< $10k） / 三签上限（> $10k） / 允许的 reason 枚举（误存退还 / 系统补偿 / Bonus 入账 / 罚款扣账 / 其他） / 强制附凭证（截图 / 邮件） |

### 2.5 Bonus / Promo Rules

| 字段 |
|---|
| 是否启用 bonus / 类型（welcome / no-deposit / deposit-match / cashback / loyalty） / Turnover 倍数要求（10x / 25x / 等） / 与出金的隔离规则（bonus 不可直接出，必须先 turnover） / 失效时间 / 适用国家 |

### 2.6 Payment Channels 状态总览

只读 — 跳转 `/crm/funds/channels` 配置。

---

## 3. 可执行操作

| 动作 | 权限 |
|---|---|
| Edit any section | finance + admin 双签 |
| 临时禁用某 method（紧急停用一个支付渠道） | admin |
| Bulk apply preset（"VIP loosen" / "Lockdown" 等模板） | admin |
| 导出 policy snapshot（PDF，监管审计用） | compliance / admin |
| 查看 policy 历史变更 diff | viewer+ |

---

## 4. 副作用

| 动作 | 审计 |
|---|---|
| Section edit | `funds.policy.update` (severity=critical) + diff 详情 |
| 紧急禁用 method | `funds.method.disable` (severity=critical) |
| Bulk apply preset | `funds.policy.preset` |

> 任何变更**立刻**生效（不像有些 SaaS 有 "publish" 步骤）— 资金策略 stale 风险大。

---

## 5. 联动

| 此页改了 | 影响 |
|---|---|
| 自动批准阈值降低 | 已 pending 但 amount > 新阈值的进入人工审 |
| 双签阈值改 | 已 pending 的 case 重新计算需要几签 |
| Cooldown 改 | 仅对**未来**出金请求生效；已提交不追溯 |
| Daily/Monthly limit 改 | 立即生效，下一笔超额拒 |
| Method disable | 已 in-flight 的处理完，新请求不接 |

---

## 6. 边界

| 维度 | 此页 | Client Detail Permissions tab |
|---|---|---|
| 范围 | **全平台默认** | 单客户 override |
| 谁能改 | finance + admin 双签 | finance + admin（可 override 但不能突破硬上限） |
| 客户级覆盖优先级 | 低 | 高（在硬上限内） |

> 即使 Permissions tab 给某客户开 "withdrawal_enabled=true"，但此页禁用了对应 method，仍然不能出。

---

## 7. 实现要点

- 数据：新建 `fundsConfig` 表 或扩展 `clmConfigService.policies(category='funds')`
- UI 主页：`<Card>` + Edit 按钮 → `<ConfigDrawer>`
- 每 section 独立 form schema
- Snapshot 导出 PDF：用 `react-pdf` 或服务端 puppeteer

---

## 8. OPEN

| # | 问题 |
|---|---|
| Q1 | Per-jurisdiction 阈值矩阵需要业务方确认（已在 client-detail OPEN Q1） |
| Q2 | Bonus / Promo 是 MVP scope 内还是 Phase 2？ |
| Q3 | 紧急停用 method 是否需要"系统级 dead-man switch"（管理员触发后所有支付暂停） |
| Q4 | Policy 变更前是否有 "试运行" 模式：选定客户子集 N 天 → 评估影响 → 全平台 |
