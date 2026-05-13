# `/crm/risk/anomalies` — Anomaly Detection

> **数据契约**：
> - `RiskProfile.factors`（@/types/core/risk-profile）— 触发的具体规则
> - `RiskEvent`（Prisma 现有）— 历史事件流
> - `ClientGraph`（@/types/core/client-graph）— 设备 / IP 关联
> - 异常规则定义在 Risk Rules（`/crm/risk/rules`），评分权重在 `/crm/risk/scoring`
> - 不新建 `Anomaly` 模型；异常是"规则命中事件" = `RiskEvent`

---

## 1. 目的

风控员的"异常行为驾驶舱"。覆盖：
- 交易行为异常（套利 / 刷单 / 高频 / 跨账户对刷）
- 资金行为异常（异常入金 / 大额异动 / 频繁出入金）
- 登录行为异常（多地登录 / VPN / 设备指纹突变 / 不可能位移）
- 账户关联异常（同 IP / 同设备 / 同收款方 / 同名）

→ 提供 triage 入口：哪些事件需要人工处理。

---

## 2. 数据展示

### 2.1 顶部 KPI（5 张）
| KPI |
|---|
| 24h 新异常 / 未处理事件 / 涉及高价值客户数（balance > 阈值） / 平均处理时长 / SLA 超时数 |

### 2.2 异常类型分组（折叠列表）

每组：count + 趋势小图 + "View all" 按钮

| 分组 | 数据源 |
|---|---|
| Trading anomalies | `RiskEvent.type ∈ {arbitrage, tick_scalping, hedging_abuse, magic_farm, large_volume_spike}` |
| Funds anomalies | `{large_deposit, rapid_in_out, structuring, third_party_funding}` |
| Login anomalies | `{geo_impossible_travel, vpn_tor_login, device_fingerprint_shift, fraud_farm_ip}` |
| Relationship anomalies | `{multi_account_same_ip, multi_account_same_device, shared_bank, shared_crypto_wallet}` |

### 2.3 事件列表（主表格 `EnhancedDataTable`）

| 字段 |
|---|
| Event ID / Type / Severity (low/medium/high/critical) / Client (name+uid) / Description / Triggered rule / Linked resource (deposit/order/session) / Status (open/investigating/resolved/false_positive) / Assignee / Created |

支持 hover 行展开关键证据（如订单 ID、IP、设备指纹）。

---

## 3. 可执行操作

| 动作 | 权限 |
|---|---|
| Triage（mark open → investigating） | risk |
| Resolve（解决）+ resolution reason | risk |
| Mark false positive + 反馈到 rule engine（用于规则调优） | risk + 必填 reason |
| Escalate → 开 `CLMCase(type=manual_review)` | risk / compliance |
| Add to watchlist | compliance / risk |
| Auto-action：触发 freeze / restrict_trading / margin_call | admin / risk |
| Reassign | risk / admin |
| Add note | any staff |
| Export CSV | risk / admin |

---

## 4. 过滤 / 排序

| 过滤 |
|---|
| Type / Severity / Status / Assignee / Date range / Search by client uid 或 event id / 是否高价值客户 |

排序默认：severity desc + createdAt desc。

---

## 5. 副作用

| 动作 | 审计 | 时间线 |
|---|---|---|
| Resolve | `risk.anomaly.resolve` | 不写客户时间线（内部 only） |
| False positive | `risk.anomaly.false_positive` | 不写 |
| Escalate | `risk.anomaly.escalate` | 不写客户视角 |
| Auto-action（freeze 等） | `risk.action.freeze` / `risk.action.restrict_trading` | 写客户时间线（客户能看自己被冻结的事实，generic reason） |

---

## 6. 边界

| 维度 | 此页 | Client Detail Risk tab |
|---|---|---|
| 范围 | 全平台异常事件 | 单客户的事件子集 |
| 主要用途 | 风控员 triage | 看单个客户为什么风险高 |

---

## 7. 实现要点

- 数据：`prisma.riskEvent.findMany` + `RiskProfile.factors` 高 score 的 + 实时（轮询 30s）
- 主组件：`EnhancedDataTable` + `useListWithFilters` + `useGlobalSLATick`
- 规则元数据从 `clmConfigService.workflows`（type='risk_rule'）读
- 关联客户跳转用 `ClientGraph` helper

---

## 8. OPEN

| # | 问题 |
|---|---|
| Q1 | 哪些异常 type 启用 auto-action（无需人工）？默认严重度阈值？ |
| Q2 | False positive 反馈到 rule engine 怎么实现：人工调权重，还是 ML 自学习？ |
| Q3 | 实时性要求：30s 轮询足够 还是要 WebSocket？ |
