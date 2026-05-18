# `/crm/risk/aml` — AML Hits

> **数据契约**：
> - `RiskProfile.factors[key=aml]`（`@/types/core/risk-profile`）— 命中评分 + 证据
> - `AMLStatus: not_checked / pass / hit / pending`（`@/types/clm/case`）
> - Sanctions provider 通过 `@/lib/integrations/sumsub.ts`（mock fallback）
> - 命中事件用 `CLMCase(type=edd / source_of_wealth)` 落地，**不**新建 `AMLHit` 模型
> - 跨域审计走 `GlobalAuditLog(domain=risk)`

---

## 1. 目的

合规 / 风控员的 AML 工作台。集中处理：
- Sanctions / PEP / Adverse Media 命中告警
- AML 风险评分高的客户（`RiskFactor[aml].score >= 60`）
- 触发的 EDD（Enhanced Due Diligence）案件
- 定期 AML 复检结果（来自 `ReVerificationType.re_identity / re_income`）

---

## 2. 数据展示

### 2.1 顶部 KPI 条
| KPI | 计算 |
|---|---|
| Active AML hits (30d) | count(`CLMCase` where type=edd AND status active) |
| Sanctions matches (today) | count(`GlobalAuditLog` where action=`sanctions.hit` AND today) |
| PEP 客户数 | count(User where `clientFlags.isPEP=true`) |
| AML 高分客户（>=60） | count(clients with `RiskFactor[aml].score >= 60`) |
| 待审 EDD cases | count(`CLMCase` where type=edd AND statusIn=[pending, reviewing]) |
| 月度 SAR 提交 | count(SAR 报告 this month) |

### 2.2 AML 告警列表（主表格）

使用 `EnhancedDataTable tableId="aml-hits"`：

| 字段 | 来源 |
|---|---|
| Hit ID | 自动生成 |
| 客户 | name + uid + 跳转 |
| Hit type | sanctions / pep / adverse_media / blacklist_match / aml_score_spike |
| Provider | sumsub / refinitiv / complyadvantage / internal |
| Score | 0-100 |
| Matched name / list | 命中的 sanctions list 条目名 |
| Status | open / investigating / cleared / confirmed |
| Linked case | `CLMCase` link（如已开 EDD） |
| Assignee | 负责 compliance officer |
| SLA | `useGlobalSLATick` 驱动 |
| First hit at / Last seen | timestamps |

### 2.3 子区块（侧栏 / 折叠）
- **趋势图**：过去 30 天每日命中数（按 type 堆叠）
- **TOP sanctions lists**：哪些 list 命中最多
- **Provider 健康度**：每个 provider 最近调用成功率、平均延迟

---

## 3. 可执行操作

| 动作 | 权限 | 行为 |
|---|---|---|
| Open EDD case | compliance / risk | 创建 `CLMCase(type=edd, customerId, linkedHit=hitId)` |
| Mark cleared（false positive） | compliance | hit.status=cleared + 必填 reason + 通过 `globalAuditService` 写 audit |
| Mark confirmed | compliance | hit.status=confirmed → 自动加 client 到 watchlist + 客户 frozen + 创建 SAR case |
| Reassign | compliance / admin | |
| Add note | any staff | 写 `ClientNote(type=risk)` |
| Generate SAR report | compliance | 弹 SAR drawer → 填法定字段 → 提交本地 FIU API（mock）|
| 重新扫描客户 AML | compliance / risk | 调 sumsub 重 trigger，刷新 `RiskProfile.factors[aml]` |
| Export CSV | compliance / admin | 审计 |

---

## 4. 过滤 / 排序

| 过滤维度 |
|---|
| Hit type / Provider / Status / Score 范围 / Date range / Country / Assignee |

排序默认：score desc。

---

## 5. 副作用

| 动作 | 审计 (`GlobalAuditLog.action`) | 时间线（客户视角） | 联动 |
|---|---|---|---|
| Open EDD | `risk.edd.trigger` | `edd_started` | KYC tab 标识 "EDD in progress" |
| Mark cleared | `risk.aml.clear` | 仅内部 | 不刷客户视角 |
| Mark confirmed | `risk.aml.confirm` | `aml_confirmed`（内部） | 客户冻结 + watchlist + SAR case |
| Sanction rescan | `risk.aml.rescan` | 不写 | 更新 `RiskFactor[aml]` |
| Generate SAR | `compliance.sar.generate` | 仅内部 | 创建 sar case，进入 case workflow |

---

## 6. 边界

| 维度 | 此页 | CLM | Client Detail Risk tab |
|---|---|---|---|
| 作用域 | **所有 AML 告警**全局列表 | 单 case 详情 | 单客户视图 |
| 主要动作 | triage + 决定开不开 EDD | 完整审批流 | 只读 + 跳 CLM |

---

## 7. 实现要点

- 数据：`globalAuditService.list({domain: 'risk', action: 'sanctions.hit'})` + `caseService.list({typeIn: [edd]})` + `RiskProfile` 高分客户
- 主表组件：`EnhancedDataTable`
- 详情侧栏点开一行用 `Drawer`
- SAR drawer 用 `ConfigDrawer`
- 趋势图复用 echarts（项目已用）

---

## 8. OPEN

| # | 问题 |
|---|---|
| Q1 | SAR 提交对接哪些国家 FIU？（FinCEN US、AUSTRAC AU、FCA UK、etc.） |
| Q2 | Adverse media 数据源是 ComplyAdvantage 还是 Refinitiv 还是自建抓取？ |
| Q3 | False positive 命中是否需要 "second-pair-of-eyes"（双合规员审）？ |
| Q4 | Cleared 后多久自动 re-check 防止漏判？ |
