# `/crm/reports/compliance` — Compliance Reports

> **数据契约**：
> - 数据源：`CLMCase` + `ReVerificationRequest` + `AgreementRecord` + `GlobalAuditLog(domain=compliance|clm|risk)` + `RiskProfile`
> - **完全聚合视图**；不新建报表模型
> - 监管 SAR / KYC 报告通过此页生成
> - 审计走 `GlobalAuditLog(domain=compliance, action='reports.export')`

---

## 1. 目的

合规官员的"报表中心"，给出：
- KYC SLA 完成率 / 超时率
- AML 处理统计（命中数 / cleared 率 / SAR 提交数）
- 协议签署率（新版本上线后的覆盖率）
- 风险事件月度统计
- 监管报表（按司法管辖区模板生成 PDF）— 是月度 / 季度 / 年度合规审计的硬性要求

---

## 2. 数据展示（按报表 type 分 tab）

### 2.1 Tab: KYC Performance

| KPI |
|---|
| 当月新提交 KYC / 通过率 / 拒绝率 / 平均审核时长 / SLA 超时率 / 复审率 / EDD 触发率 |

**图表**：
- KYC 审核漏斗（submitted → in_review → approved / rejected）
- 按 jurisdiction 的通过率热力图
- 按 reviewer 的工作量与决策分布
- SLA 趋势（30 天）

**列表**：超时未处理的 case top N

### 2.2 Tab: AML & Sanctions

| KPI |
|---|
| 当月 sanctions hit / PEP hit / Adverse media hit / Confirmed vs Cleared / SAR 提交数 / EDD 开启与关闭数 |

**图表**：
- 命中 source 来源饼图（sumsub / refinitiv / 内部 / 等）
- TOP 命中 list（命中最多的 sanctions 列表名）
- AML 风险评分分布（直方图）

**列表**：confirmed hits 详细（含 SAR 状态）

### 2.3 Tab: Agreements Coverage

| KPI |
|---|
| 各协议类型的已签覆盖率（按 jurisdiction × 协议 × 客户群体）/ 待签数 / 过期数 / 阻断中的客户数 |

**图表**：
- 协议覆盖率矩阵：协议 × jurisdiction
- 版本升级后的签署率曲线（上线 30 天内完成签的比例）

### 2.4 Tab: Re-Verification

| KPI |
|---|
| 主动触发的 re-verification 数 / 自动触发数（按 trigger reason 分） / 7 种 type 的分布 / 完成率 / 平均耗时 / 客户配合度（按时完成 vs 超期） |

### 2.5 Tab: Risk Events

| KPI |
|---|
| 按 type 的事件数（30 天）/ severity 分布 / 平均处理时长 / 自动 vs 人工解决占比 / TOP 触发规则 |

### 2.6 Tab: Regulatory Reports（监管报表生成）

每种监管报表是一个**模板**：

| 模板 | 频次 | 司法管辖区 |
|---|---|---|
| SAR (Suspicious Activity Report) | per case | US (FinCEN) / UK (NCA) / AU (AUSTRAC) / etc. |
| MiFID II Transaction Report | daily | EU |
| CySEC Compliance Report | monthly | CY |
| FCA Returns | quarterly | UK |
| AUSTRAC Threshold Transaction Report | per transaction > AU$10k | AU |
| FATCA / CRS Report | annual | global |
| Marketing Communication Audit | quarterly | UK / EU |

每个：
- 生成时间范围选择
- 预览（show 数据，highlight 异常）
- 导出 PDF / XML（监管规定的格式）
- 提交记录（哪次报送了什么，by 谁，签名）

---

## 3. 可执行操作

| 动作 | 权限 |
|---|---|
| 生成监管报表 PDF | compliance |
| 提交监管报表（标记已报送） | compliance + admin 双签 |
| Schedule 周期性生成 + 邮件 | compliance + admin |
| Export 任何 tab 的数据 CSV | viewer+ |
| Save 自定义 cohort 报表 | compliance / admin |
| 跳转报表内某 metric 的 drill-down 列表 | viewer+ |

---

## 4. 副作用

| 动作 | 审计 |
|---|---|
| Generate report PDF | `compliance.report.generate` (severity=info) |
| Submit to regulator | `compliance.report.submit` (severity=critical) + reason + submission ID |
| Schedule | `compliance.report.schedule` |

---

## 5. 实现要点

- 数据：复杂 SQL 聚合，建议建物化视图按 daily refresh
- 报表 PDF 用模板引擎 + react-pdf 或 puppeteer
- 提交监管 API（每个国家不同）：通过 `@/lib/integrations/regulators` 独立模块
- 缓存策略：报表多为读密集，agressive cache
- 时间范围切换可能涉及大查询：用骨架 placeholder + 异步加载

---

## 6. 边界

| 此页 | `/crm/clm/audit-trail` | `/crm/reports/financial` |
|---|---|---|
| 合规视角的统计 + 监管报表 | 详细审计日志 | 财务视角统计 |

---

## 7. OPEN

| # | 问题 |
|---|---|
| Q1 | 哪些国家监管报表 P0 必须，哪些 P2？ |
| Q2 | 监管 API 自动提交 vs 手动下载后提交？看监管国是否支持 e-submission |
| Q3 | 报表数据保留期：监管要求 5-7 年，物化视图存几年？ |
| Q4 | "已提交" 状态的撤回 / 修正：报错后修正需要如何处理？ |
