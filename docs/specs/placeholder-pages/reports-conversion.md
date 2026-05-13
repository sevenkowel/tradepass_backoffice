# `/crm/reports/conversion` — Conversion Funnel Reports

> **数据契约**：
> - 现有 `/crm/funnel` 是**实时漏斗 dashboard**；此页是**历史报表**
> - 数据源：聚合 `User` / `KYCRecord` / `MTAccount` / `Transaction` / `Order` + `ClientLifecycleStage`
> - 不新建报表数据模型；用 SQL 聚合或物化视图
> - 审计走 `GlobalAuditLog(domain=system, action='reports.export')` for exports

---

## 1. 目的

经纪商**获客转化漏斗**的可视化历史报表。回答业务问题：
- 这个月的注册→KYC→FTD 转化率是多少？
- 哪个 IB / channel / country 转化最好？
- 转化率 vs 上月 / 上季度趋势？
- 卡在某 step 的客户有多少？为什么？

> 与实时 `/crm/funnel` 的边界：实时 dashboard 只看**当前 snapshot**；此页看**时间段对比 + 多维度 cohort 分析**。

---

## 2. 数据展示

### 2.1 顶部 cohort 选择器

| 维度 |
|---|
| 时间范围（last 7d / 30d / 90d / quarter / year / custom） |
| Cohort（按注册周分组的 cohort 视图） |
| Channel（website / mobile_app / IB / paid_ad / organic） |
| Country / Region |
| IB ID（选定 IB 的下线漏斗） |
| Tag / Segment 过滤 |

### 2.2 漏斗主视图

阶段（基于 `LifecycleStage`）：
1. `registered` — 注册
2. `email_verified` — 邮箱验证
3. `kyc_submitted` — 提交 KYC
4. `kyc_approved` — KYC 通过
5. `agreement_signed` — 完成必签协议
6. `first_deposit` (FTD) — 首次入金
7. `first_trade` — 首次交易
8. `active_trader` — 30 天内交易过 N 手

每阶段：
- 进入人数 / 通过率 / 平均到达时长（中位 + p90）
- 与上期对比（环比 / 同比 % 变化）
- 卡住的人数 + "查看详情" → 跳列表

### 2.3 详细分析

**Drop-off 分析**：哪些 step 流失最多
**漏斗转化曲线**：按时间 x 注册 cohort 的转化对比
**Cohort retention**：注册后 7d / 30d / 90d 仍活跃的比例
**渠道对比**：channel × stage 矩阵
**Country 表现**：top 国家的 funnel 指标 / 异常国家 highlight
**IB 表现**：top IB 的 conversion + fraud rate

### 2.4 详细列表（点击漏斗 step 进入）

卡在该 step 的客户列表（标准 `EnhancedDataTable`，列同 Client List）。

---

## 3. 可执行操作

| 动作 | 权限 |
|---|---|
| Save report（保存当前过滤为命名报表） | marketing / admin / reports |
| Schedule email（每周 / 每月发送给指定邮箱列表） | marketing / admin |
| Export CSV / Excel / PDF | viewer+ |
| Drill-down 单个客户 | viewer+ → 跳 Client Detail |
| Bulk action on stuck clients（如 "给所有卡在 KYC 的客户发提醒邮件"） | marketing + admin |
| Share report URL（含过滤参数） | viewer+ |
| 跳到对应 marketing campaign 看效果（如选 channel=email_campaign） | reports + marketing |

---

## 4. 过滤 / 排序

漏斗顶部 cohort selector 即过滤；可保存为 preset。

---

## 5. 副作用

| 动作 | 审计 |
|---|---|
| Export CSV / PDF | `reports.export` (severity=info) + 包含的过滤 + row count |
| Schedule email | `reports.schedule.create` |
| Bulk action on stuck clients | 触发对应的具体审计（如 `marketing.message.send.bulk`） |

读操作（浏览报表）按 alignment doc 不写审计。

---

## 6. 实现要点

- 数据：SQL 聚合（用 Prisma raw + materialized views 缓存）
- 实时性：每小时 refresh 即可（漏斗报表不需要 second-level real-time）
- 可视化：echarts（funnel + cohort heatmap + line chart）
- 列表：`EnhancedDataTable` 复用
- 缓存：用 Redis 或 in-memory cache 缓 1 小时
- Schedule email：用 cron + nodemailer

---

## 7. 边界

| 此页 | `/crm/funnel` 实时 | `/crm/reports/users` | `/crm/dashboard` Overview |
|---|---|---|---|
| 历史漏斗 + cohort + drop-off | 当前 snapshot | 用户增长 / 留存 | KPI 摘要 |
| 用：marketing / reports | 用：dashboard 守值班 | 用：reports / marketing | 全员 |

---

## 8. OPEN

| # | 问题 |
|---|---|
| Q1 | LifecycleStage 8 阶段是否需要客户化（不同 broker 可能不同步骤）？ |
| Q2 | Cohort retention 计算口径："活跃" 怎么定义（登录 / 交易 / 入金）？ |
| Q3 | Schedule email 是否对外发（marketing email service 集成）还是只内部？ |
| Q4 | 跨租户对比（白标 multi-tenant 时是否能看到匿名行业基准）？ |
