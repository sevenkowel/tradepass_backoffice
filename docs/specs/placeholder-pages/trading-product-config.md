# `/crm/trading/instruments/config` — Product Configuration

> **数据契约**：
> - `MTAccount.group` 现有；产品配置 = symbol × group 矩阵
> - 新建 `prisma.tradingInstrument`（如还没有）或扩展 `Instrument` 模型 — 字段：symbol / category / digits / contract_size / min_volume / max_volume / volume_step / margin_currency / spread / commission / swap_long / swap_short / trading_hours / margin_required / leverage_cap / status
> - 不复用 KYC / Case / Audit 模型；这是 trading 自有领域
> - 审计走 `GlobalAuditLog(domain=trading)`

---

## 1. 目的

经纪商**交易产品**（symbol / instrument）的统一配置：哪些品种可交易、各品种的点差 / 佣金 / swap / 保证金、交易时段、按 MT group 的差异化配置。

> 与 `/crm/trading/instruments` 的边界：`instruments` 是**仪表盘**（看实时点差、成交量、风险），此页是**配置**（改参数）。

---

## 2. 数据展示

### 2.1 顶部统计

| KPI |
|---|
| Active instruments / Disabled / By category counts / Recent changes (7d) |

### 2.2 主表（按 category 分组 tab）

| Category |
|---|
| Forex Majors / Forex Minors / Forex Exotics / Indices / Commodities (Metals / Energy / Soft) / Crypto / Stocks (ETFs) / 等 |

每条 instrument：

| 字段 | 说明 |
|---|---|
| Symbol | EURUSD / XAUUSD / BTCUSD 等 |
| Display name | "Euro vs US Dollar" |
| Category | |
| Digits | 5（FX）/ 2（commodity） |
| Contract size | 100,000（FX standard lot）/ 100（XAUUSD）/ etc. |
| Min / Max volume / Step | 0.01 / 100 / 0.01 lots |
| Margin currency | USD / EUR |
| Spread type | fixed / floating / market |
| Default spread (pips) | |
| Commission (per lot per side) | 0 / $3.5 / etc. |
| Swap long / short | |
| Margin required | 与 leverage 配套（1:30 → 3.33%） |
| Leverage cap | symbol 级别上限（监管约束，e.g. EU CFD ESMA 30:1 majors） |
| Trading hours | session 矩阵（按 UTC，含 holiday 例外） |
| MT group override | 列出 N 个 group 各自的覆写 |
| Status | active / disabled / read_only / scheduled_change |
| Routing | A-book / B-book / hybrid（每 group 可不同） |

### 2.3 矩阵视图（按需 toggle）

横轴：MT group（Standard / ECN / PRO / VIP / Swap-Free）
纵轴：symbol
单元格：override summary（spread + commission）

---

## 3. 可执行操作

| 动作 | 权限 |
|---|---|
| Add instrument | admin only |
| Edit instrument（任何字段） | admin + 触发即时 audit + 灰度通知 risk_manager |
| Disable / Enable | admin |
| Set scheduled change（计划好的参数变更，N 时间后生效） | admin |
| Add MT group override | admin |
| Bulk update（按 category 批量改点差） | admin only |
| Import from MT server（同步 MT-side 配置） | admin |
| Export to CSV / JSON | viewer+ |
| 查看历史变更 diff | viewer+ |
| Holiday / session 配置 | admin |
| Set max position size 全平台 | risk + admin |

---

## 4. 过滤 / 排序

| 过滤 |
|---|
| Category / Status / Spread range / Has override / Search by symbol |

---

## 5. 副作用

| 动作 | 审计 |
|---|---|
| Edit spread / commission / swap | `trading.instrument.update` (severity=warning) |
| Disable instrument | `trading.instrument.disable` (severity=critical) + 检查现有 open positions |
| Margin / leverage 改 | `trading.instrument.margin_change` (critical) + 检查所有客户现有持仓是否需要补保证金 |
| Routing change（A↔B-book） | `trading.instrument.routing` (critical) + 通知 risk + Treasury |
| Bulk update | `trading.instrument.bulk_update` (critical) |
| Scheduled change | `trading.instrument.schedule` (info) → 到期时 trigger `trading.instrument.schedule_apply` (critical) |

---

## 6. 联动

| 改 | 影响 |
|---|---|
| Spread / commission | 立即生效；下一笔订单按新参数 |
| Margin required 提高 | 已有持仓**不强补**，但新仓位按新值；同时触发 margin_call 检查 |
| Disable symbol | 不能开新仓；现有持仓正常平 |
| Leverage cap 下降 | 客户级 leverage cap 不能超过此值；triggers re-evaluate of overrides |
| Trading hours 改 | 立即；session 关闭时不接单 |

---

## 7. 边界

| 此页 | `/crm/trading/instruments`（仪表盘） |
|---|---|
| 写：改参数 | 读：实时点差、成交、暴露 |
| 影响：未来订单 | 看：当前订单 |

---

## 8. 实现要点

- 新建 `prisma.tradingInstrument` + Prisma migration
- UI: `EnhancedDataTable` + 每行点开右滑 `ConfigDrawer` 编辑
- 矩阵视图：自定义 grid
- Scheduled change：cron job 到时间 trigger
- Import from MT：通过 MT bridge API
- 历史 diff: 用 `GlobalAuditLog` 查同一 symbol 的变更
- 改变 routing / margin 触发的"现有持仓影响估算"：在 confirm modal 内计算

---

## 9. OPEN

| # | 问题 |
|---|---|
| Q1 | MT 端是 source of truth 还是 CRM 端？冲突时谁覆盖谁？ |
| Q2 | Scheduled change 是否要审批（admin 提交 → admin 审）？ |
| Q3 | Hybrid routing 算法（什么时候 A-book 什么时候 B-book）是否暴露在此页配置？ |
| Q4 | 单 symbol 历史 spread 趋势图：是否在此页内嵌？数据量大可能性能差 |
