# Client Detail — 模块对齐（必读）

> **本文档优先级最高**。读完 [00-foundations.md](./00-foundations.md) 后**必须**读这份。

---

## 0. 心智模型（最重要）

> **Client Detail 页 = 把所有 sidebar 菜单模块中 `UID = 当前客户` 的内容，聚合到一个工作台**。
>
> 给内部运营人员一个"以人为中心"的入口，**反向**于 sidebar 的"以业务模块为中心"。
>
> 客户详情页**不是**新功能，它是**对现有所有模块的 lens**。

**两种视角：**

| 视角 | 入口 | 看到什么 |
|---|---|---|
| 业务模块视角 | Sidebar 菜单 | 该模块**所有客户**的数据（如 `/crm/funds/deposits` = 所有客户的入金） |
| 客户视角 | Sidebar → Clients → 单客户详情 | **某一个客户**在**所有模块**的数据 |

两个视角对**同一份数据**做查询，只是 `WHERE` 子句不同：
- 模块视角：`WHERE module-specific-filter`
- 客户视角：`WHERE userId = X`

这意味着 Client Detail 的每个 tab 都有**对应的 sidebar 模块**，是该模块的"按客户过滤"视图。下表是关键映射。

### Tab × 来源模块映射（**16 tab，业务方已确认**）

| # | Client Detail Tab | 来源 Sidebar 模块 | 主要数据 / 服务 | 过滤逻辑 |
|---|---|---|---|---|
| 1 | **Overview** | （聚合多模块） | 跨模块 KPI 汇总 | `userId = X` 在多个表 |
| 2 | **Accounts** | Trading > MT Accounts（`/crm/accounts/*`，**已确认加入 sidebar Trading 组**） | `prisma.mtAccount` | `userId = X` |
| 3 | **Funds** | Funds（**4 个子 tab 镜像 sidebar**：Deposits / Withdrawal Review / Transactions ／ Adjustments） | `prisma.transaction` | `userId = X` |
| 4 | **Trading** | Trading（**2 个子 tab**：Open Positions / Trade History） | `prisma.position` / `prisma.order` | `userId = X` 通过 mtAccount |
| 5 | **Risk** | Risk Center（`/crm/risk` + 子页） | `RiskProfile` + `lib/risk-engine` | `clientId = X` |
| 6 | **KYC** | CLM（`/crm/clm/workspace` + KYC-typed cases） | `caseService.list({customerId, typeIn:[kyc,poa,liveness,video_verification,edd,source_of_wealth,re_verification]})` | `customerId = X` |
| 7 | **Cases** | CLM（`/crm/clm/cases`） | `caseService.list({customerId})` | `customerId = X` |
| 8 | **Agreements** | CLM（`/crm/clm/agreements` 配置 + `agreement_signing` cases） | `AgreementRecord[]` 聚合 | `customerId = X` |
| 9 | **Tickets** | Support（`/crm/support/tickets`） | `prisma.crmTicket` | `userId = X` |
| 10 | **Devices** | Risk Center（`/crm/risk/device`，**完全复用 UI**） | `prisma.clientDevice` + `IPGeoInfo` | `userId = X` |
| 11 | **Notes** | Clients（`/crm/clients/notes`） | `prisma.clientNote` | `userId = X` |
| 12 | **Marketing** ⭐ NEW | Marketing + Support Comms（campaigns / emails / SMS / push 的 engagement） | 聚合 `marketingCampaignTarget` + `emailLog` + `smsLog` + `pushLog` | `userId = X` |
| 13 | **IB** ⭐ NEW | IB（`/crm/ib`） | `prisma.ibPartner` + `commissionRecord` + sub-IB tree | `userId = X` |
| 14 | **Permissions** | 多源（**4 sections by source**：Trading / Funds / Security / IB） | `User.permissions` + `MTAccount.overrides` | `userId = X` 客户级 override |
| 15 | **Timeline** | （cross-module 派生 — **客户读视角**） | `crmTimelineEvent.findMany` + `globalAuditService.listForClient(visibleOnly)` | `userId = X` + `is_client_visible=true` 含义 |
| 16 | **Logs** | System Logs / GlobalAuditLog（**员工写视角**） | `globalAuditService.listForClient(clientId)` 全量 | `userId = X` |

**Sidebar 模块依然没有对应 tab 的（按设计）：**

| Sidebar 模块 | 为什么没有 tab |
|---|---|
| Dashboard | 全局概览，不限单客户 |
| Reports | 报表是跨客户聚合，不适合单客户视图 |
| Setup Guide | 租户级，不是客户级 |
| Apps | 租户级 |
| Real-time Monitor | 全局实时大盘 |
| Conversion Funnel | 全局漏斗 |
| Client 360 | 此页本身就是"以客户为中心"的视图，等价 |

### Tab 分组（用于 TabBar UI）

| group | tabs |
|---|---|
| `core` | Overview / Accounts / Funds / Trading / Risk |
| `compliance` | KYC / Cases / Agreements |
| `ops` | Tickets / Devices / Notes / Marketing / IB |
| `system`（折叠到 "More" 下拉） | Permissions / Timeline / Logs |

---

### Logs vs Timeline — 视角边界（A-Q5 已确认）

| 维度 | Logs | Timeline |
|---|---|---|
| 视角 | **员工 / 系统的"写"视角** | **客户的"读"视角** |
| 受众 | 内部审计 / 合规 / 调查 | 内部运营（"客户经历了什么"）+ 未来可暴露给客户 portal |
| 内容 | 所有字段级修改 + read on sensitive 数据 | 关键事件，**客户能理解的人类语言** |
| 数据源 | `GlobalAuditLog`（全量） | `crmTimelineEvent`（写时显式过滤）+ `GlobalAuditLog`（仅 `is_client_visible=true`） |
| 数量级 | 数千 - 数万条 | 数十 - 数百条 |
| staff 姓名 | 显示（操作员审计） | 替换成团队名（"TradePass Compliance"） |
| 内部敏感（watchlist / EDD / force_logout reason） | 显示 | **不显示** |
| 暴露给客户 | **永不** | 部分可（按 `is_client_visible` 字段） |

> 此边界与 [00-foundations.md §5](./00-foundations.md) "审计 & 时间线写入约定" 一致。Logs 是底，Timeline 是过滤投影。

**已经统一应用此原则的好处：**
1. **零数据模型重复**：每个 tab 用对应模块的 service，不新建 model
2. **状态机一致**：客户在 Funds tab 看到的出金状态机 = 在 `/crm/funds/withdrawal-review` 看到的 = 是同一个状态机
3. **审计自动同步**：mutation 写一份 audit，模块视角和客户视角都能看到（通过 GlobalAuditLog）
4. **UI 视觉一致**：模块视角和客户视角都用同款 `EnhancedDataTable`、`RiskScoreRing`、`ConfigDrawer`，员工切换视角不困惑

---

## 1. 总原则

> **Client Detail 是 view，不是 source of truth。**
>
> KYC / Funds / Trading / Risk / Devices / Tickets / Agreements / Audit Logs 的数据契约都在对应**业务模块**定义。Client Detail 的对应 tab 只负责：
> 1. 调用对应模块的 service 拉数据，按 `userId / customerId = 当前客户` 过滤
> 2. 用 shared UI 组件渲染（与模块视角同款）
> 3. mutation 调对应模块的 service API
> 4. 在 tab 内提供"跳转到对应模块完整视图"的链接（不限当前客户）

| 不要做 ❌ | 应该做 ✅ |
|---|---|
| 在 Client Detail 重新定义 KYC 状态机 | 用 `CLMCaseStatus`（10 状态）+ `CLMCaseType.kyc` |
| 在 Client Detail 自定义 KYC level 枚举 | 用 `KYCLevel: tier0-tier4` |
| 自己设计 "KYC renew 周期" | 用 `ReVerificationRequest` + `ReVerificationType`（7 种） |
| 自建 Audit log 表给 Client Detail 用 | 用 `GlobalAuditLog` + `globalAuditService.listForClient(id)` |
| 重新实现风险评分算法 | 用 `RiskProfile`（@/types/core）+ `lib/risk-engine` |
| 自己画关系图 | 用 `ClientGraph`（@/types/core）+ `lib/risk-engine/graph` |
| 自建协议数据模型 | 用 CLM `AgreementRecord` + `/crm/clm/agreements` 配置 |
| 给 Devices tab 自定义 IP geo 模型 | 用 `IPGeoInfo`（@/types/core）+ `IPGeoPopover` |
| 给 Devices tab 自建 Device 表 | 用 `/crm/risk/device` 同款 device 模型 + 同款 service |
| 给 Tickets tab 自建工单状态机 | 用 `/crm/support/tickets` 同款 `CrmTicket` 状态机 |
| 给 Funds tab 自建出金审核流 | 用 `/crm/funds/withdrawal-review` 同款审核 state machine |
| 给 Trading tab 自建持仓 / 订单模型 | 用 `/crm/trading/{orders,positions}` 同款数据 + MT bridge |
| 给 Permissions tab 自建权限模型 | 复用 System > Roles + Funds Policy + Risk Rules 的客户级 override |

---

## 2. Canonical source 地图

每一行：**数据 / UI 行为属于哪个模块** → **存储/类型位置** → **服务 / Hook / 组件**。Client Detail tab 用 → 引用。

### 2.1 数据契约（types）

| 概念 | Canonical type | 文件 | 不能再造 |
|---|---|---|---|
| 风险画像（6 轴） | `RiskProfile` / `RiskFactor` / `RiskFactorKey` | `@/types/core/risk-profile` | ✅ 已定 |
| 关系图 | `ClientGraph` / `ClientGraphNode` / `ClientGraphEdge` | `@/types/core/client-graph` | ✅ 已定 |
| IP 地理 | `IPGeoInfo` | `@/types/core/ip-geo` | ✅ 已定 |
| 跨域审计 | `GlobalAuditLog` / `AuditDomain` / `AuditSeverity` | `@/types/core/audit` | ✅ 已定 |
| IB 摘要 | `IBSummary` / `IBTier` | `@/types/core/ib-summary` | ✅ 已定 |
| 三方认证 | `ThirdPartyVerification` | `@/types/core/third-party-verification` | ✅ 已定 |
| CLM Case | `CLMCase` / `CLMCaseType` / `CLMCaseStatus` | `@/types/clm/case` | ✅ 已定 |
| Case 详情 | `CaseDetail` + `PersonalInfo` + `ExperienceInfo` + `AutoReviewResult` + `LivenessResult` + `POADetail` + `VideoVerificationDetail` | `@/types/clm/detail` | ✅ 已定 |
| 协议记录 | `AgreementRecord` | `@/types/clm/detail` | ✅ 已定 |
| KYC level | `KYCLevel: tier0 / tier1 / tier2 / tier3 / tier4` | `@/types/clm/case` | ✅ 已定 |
| KYC flow 步骤 | `KYCFlowStepId` (`phone_email / document / liveness / poa / income_proof / video_verification`) | `@/types/clm/detail` | ✅ 已定 |
| 重新认证 | `ReVerificationRequest` / `ReVerificationType` (7种) | `@/types/clm/re-verification` | ✅ 已定 |
| CLM 配置（forms / templates / policies / workflows） | `@/types/clm/config` (853 行) | `@/types/clm/config` | ✅ 已定 |

### 2.2 服务（runtime）

| 概念 | Service | 文件 | mock / api |
|---|---|---|---|
| CLM Case CRUD | `caseService.list / getById / update / assign / decide` | `@/lib/clm/services/case.service.ts` | mock + api 双轨 |
| Workspace（reviewer 收件箱） | `workspaceService` | `@/lib/clm/services/workspace.service.ts` | 同上 |
| Re-Verification | `reVerificationService` | `@/lib/clm/services/re-verification.service.ts` | 同上 |
| CLM Config（forms/templates/policies/workflows） | `clmConfigService` | `@/lib/clm/services/config.service.ts` | 同上 |
| KYC Flow 配置 | `flowService` | `@/lib/clm/services/flow.service.ts` | 同上 |
| 跨域审计 | `globalAuditService.list / listForClient / listForCase` | `@/lib/audit/service.ts` | 跨域 adapter 聚合 |
| 风险画像 | `lookupRiskProfile(clientId, baseScore, amlStatus)` | `@/lib/risk-engine/mock-risk-profiles.ts` | mock → 未来 `riskService.getProfile()` |
| 关系图（颜色 + 评分） | `NODE_COLOR / EDGE_COLOR / EDGE_DASH / countEdgesByKind / graphRiskScore / rankedRelatedNodes` | `@/lib/risk-engine/graph.ts` | helper，非 service |
| IP geo lookup | `lookupIPGeo(ip)` / `listAllIPGeo()` | `@/lib/clm/mock/mock-ip-geo.ts` | mock，未来 `/api/crm/integrations/ipgeo` |
| 客户列表 / 详情 / mutation | `clientService` | `@/lib/crm/services/client.service.ts` | mock + api（已迁移） |

### 2.3 UI 组件（必用，不要再造）

| 用途 | 组件 | 文件 |
|---|---|---|
| 风险评分大环 | `RiskScoreRing` | `@/components/crm/clm/risk/RiskScoreRing` |
| 6 轴风险因子列表 | `RiskFactorList` | `@/components/crm/clm/risk/RiskFactorList` |
| IP 弹层（hover 显示 geo + VPN + 关联客户） | `IPGeoPopover` | `@/components/crm/clm/popovers/IPGeoPopover` |
| IB 弹层（tier + 通过率） | `IBSummaryHover` | `@/components/crm/clm/popovers/IBSummaryHover` |
| 三方认证 chip + 原因弹层 | `VerificationChip` | `@/components/crm/clm/popovers/VerificationChip` |
| 五类时间线（submission/system/assignment/comment/decision） | `RichTimeline` | `@/components/crm/clm/RichTimeline` |
| 配置编辑右滑抽屉 | `ConfigDrawer` | `@/components/crm/clm/config/ConfigDrawer` |
| 标准数据表（列可见性、排序提示、行内动作） | `EnhancedDataTable` | `@/components/crm/ui/EnhancedDataTable` |
| 案例时间线 | `CaseTimeline` / `RichTimeline` | `@/components/crm/clm/` |
| 协议阅读器 | `AgreementReader` | `@/components/crm/clm/agreements/AgreementReader` |
| 签名板 | `SignaturePad` | `@/components/crm/clm/agreements/SignaturePad` |

### 2.4 Hooks（必用）

| 用途 | Hook |
|---|---|
| 当前员工 id / 角色 | `useCurrentStaffId()` / `useCurrentStaff()` —— **替代**所有硬编码 `"staff-001"` |
| 列表 page/filter/total state | `useListWithFilters` |
| SLA 倒计时（10s 单 ticker） | `useGlobalSLATick` |
| 风险摘要 derived | `useRiskSummary` |
| RBAC 权限 | `usePermission` |
| Review Queue badge | `useReviewQueueCount` |

---

## 3. Tab × 来源模块 详细矩阵（16 tabs）

每个 tab：**来源 sidebar 模块** · **module 全局视角入口** · **客户视角调用 service** · **共享的 UI / 组件**。

| Tab | 来源模块 | 模块全局入口 | 客户视角调用 | 共享 UI（同模块全局视角） |
|---|---|---|---|---|
| **Overview** | （聚合多模块） | n/a | `clientService.getDetail()` 内部 fan-out | n/a — 自定义 KPI 卡 + 异常 banner + 最近活动预览 |
| **Accounts** | Trading > MT Accounts | `/crm/accounts/*` ⭐ 已确认加入 sidebar Trading 组 | `prisma.mtAccount.findMany({where:{userId}})` | `EnhancedDataTable tableId="accounts"` 同列同操作 |
| **Funds**（**4 子 tab**） | Funds | `/crm/funds/{deposits,withdrawal-review,transactions}` | 各子 tab 调对应模块 service，按 `userId` 过滤 | 入金 / 出金审核 / 内部 / 调账 — 每子 tab 同 Funds 模块入口的 UI |
| ` ↳ Deposits` | Funds > Deposits | `/crm/funds/deposits` | `prisma.transaction.findMany({where:{userId, type:deposit}})` | 同款列表 + status pipeline |
| ` ↳ Withdrawals` | Funds > Withdrawal Review | `/crm/funds/withdrawal-review` | `prisma.transaction.findMany({where:{userId, type:withdrawal}})` + `caseService` 联动 | 同款审核 drawer + 风控 chip |
| ` ↳ Transactions` | Funds > Transactions | `/crm/funds/transactions` | `prisma.transaction.findMany({where:{userId, type:transfer}})` | 同款列表 |
| ` ↳ Adjustments` | Funds > Adjustments（policy） | `/crm/funds/policy` 配置 + 调账 audit | 调账记录从 `GlobalAuditLog action='funds.adjustment.*'` 派生 | 同款审计行 |
| **Trading**（**2 子 tab**） | Trading | `/crm/trading/{orders,positions}` | 子 tab 分别走 positions / orders 查 | 同 `/crm/trading` 的实时表格 |
| ` ↳ Open Positions` | Trading > Positions | `/crm/trading/positions` | `prisma.position.findMany({where:{account:{userId}}})` 实时轮询 | 同款列 + P/L 实时 |
| ` ↳ Trade History` | Trading > Orders | `/crm/trading/orders` | `prisma.order.findMany({where:{account:{userId}, status:closed}})` | 同款历史表 + 时间范围筛选 |
| **Risk** | Risk Center | `/crm/risk` + 子页 | `lookupRiskProfile(clientId)` + `ClientGraph` + `prisma.riskEvent.findMany({where:{userId}})` | `RiskScoreRing` + `RiskFactorList` + `RelationshipGraph` |
| **KYC** | CLM | `/crm/clm/workspace` | `caseService.list({customerId, typeIn:[KYC-相关 7 种 type]})` | CLM Case 卡 + 跳 case detail |
| **Cases** | CLM | `/crm/clm/cases` | `caseService.list({customerId})` | `EnhancedDataTable tableId="clm-cases"` 同列 |
| **Agreements** | CLM | `/crm/clm/agreements` | `clmConfigService.listAgreements()` + `caseService` 过滤 | `AgreementReader` + `SignaturePad` + `SignFlowPreview` |
| **Tickets** | Support | `/crm/support/tickets` | `prisma.crmTicket.findMany({where:{userId}})` | `/crm/support/tickets` 的 thread view |
| **Devices** | Risk Center > Device & Security | `/crm/risk/device` ⭐ **完全复用 UI** | `prisma.clientDevice.findMany({where:{userId}})` + `lookupIPGeo()` | **同 `/crm/risk/device` 的表 + 操作 + IPGeoPopover**，仅顶部 filter 固定到此客户 |
| **Notes** | Clients | `/crm/clients/notes` | `prisma.clientNote.findMany({where:{userId}})` | 同 `/crm/clients/notes` 的卡片 + composer |
| **Marketing** ⭐ NEW | Marketing + Support Comms | `/crm/marketing/{campaigns,messages,banners,news}` + `/crm/support/{emails,sms,push}` | 见 Marketing tab spec（聚合 4 个数据源） | 共用 Support log 的列 + Campaign engagement chip |
| **IB** ⭐ NEW | IB | `/crm/ib` + 子页 | `prisma.ibPartner.findUnique({where:{userId}})`（如客户是 IB）+ `commissionRecord` + parent IB 链 | 同 `/crm/ib/[id]` 的 tier card / commission table / 下线树 |
| **Permissions**（**4 sections**） | 多源 override：System + Funds + Risk + IB | 见每 section | `User.permissions` + `MTAccount.overrides` + 计算 effective | 4 section 卡片：Trading / Funds / Security / IB |
| ` ↳ § Trading permissions` | Trading 全局默认 | `/crm/trading/settings` | trading_enabled / max_leverage / EA / scalping / 产品白名单 / max position size / max MT accounts | toggle / select / multi-select |
| ` ↳ § Funds permissions` | Funds 全局策略 | `/crm/funds/policy` | deposit_enabled / withdrawal_enabled / withdrawal_hold_days / per-day / per-month limits | toggle / number |
| ` ↳ § Security permissions` | System + Risk | `/crm/system/security` + `/crm/risk/rules` | 2FA enforced / login country lock / session timeout / device trust | toggle / multi-select |
| ` ↳ § IB permissions` | IB | `/crm/ib/settings` | is_IB / IB tier / custom commission rate / sub-IB allowed | select / number |
| **Timeline** | 派生 cross-module（**客户读视角**） | n/a | `crmTimelineEvent.findMany` + `globalAuditService(visibleOnly=true)` | `RichTimeline` 五类编码 |
| **Logs** | System Logs / GlobalAuditLog（**员工写视角**） | `/crm/system/logs` + `/crm/clm/audit-trail` | `globalAuditService.listForClient(clientId)` 全量 | `/crm/clm/audit-trail` 的 audit table |

---

## 4. KYC 全栈对齐细则（这是用户最关心的）

### 4.1 状态机 — 用 CLM 的

❌ 之前的 spec：`not_submitted → submitted → in_review → approved / rejected / needs_more_docs → expired`

✅ 用 `CLMCaseStatus`（10 状态）：
```
pending ──→ reviewing ──┬──→ approved
                        ├──→ rejected
                        ├──→ resubmission ──→ pending（客户重新提交后）
                        ├──→ escalated ──→ approved / rejected
                        └──→ cancelled
auto_approved（系统自动过）   auto_rejected（系统自动拒）   expired（renew 到期）
```

`User.kycStatus` 是**派生字段**（latest `CLMCase` of type `kyc` 的 status 映射到 `verified / pending / rejected / not_submitted`），不是独立状态机。

### 4.2 KYC 级别 — 用 CLM 的

❌ 之前的 spec：`basic / advanced / enterprise`

✅ 用 `KYCLevel: tier0 / tier1 / tier2 / tier3 / tier4`

各 tier 含义见 `01-Product/KYC-PRD.md` + `/crm/clm/levels` 配置页（runtime 可改）。Client Detail 只读取、不定义。

### 4.3 KYC 步骤 — 用 CLM 的

✅ 用 `KYCFlowStepId`：
- `phone_email`
- `document`
- `liveness`
- `poa`
- `income_proof`
- `video_verification`

哪些 step 出现在客户的当前 flow 里：由 `clmConfigService.listFlows()` 按 `regionCode` 或 `kycLevel` 决定。Client Detail 显示 `KYCFlowStepInfo[]`（每 step `included` + `completed`）。

### 4.4 KYC 操作 — 跳到 CLM Workspace

KYC tab 不应该自己写 "approve / reject / escalate" 按钮的实现。这些**已经在 CLM Workspace** (`/crm/clm/workspace`) 完整实现：
- `DecisionPanel` — approve / reject / resubmission / escalate
- `CommentPanel` — 内部评论 + @mention
- `AutoReviewSection` — OCR / Liveness / Face Match / AML / Device Risk / IP Risk
- `RiskAssessmentPanel` — 6 轴 RiskProfile
- `AgreementSection`

Client Detail 的 KYC tab：
1. 列出该客户的所有 KYC 相关 case（按 type 分组：KYC / POA / Liveness / Video / EDD / SourceOfWealth / Re-verification）
2. 每个 case 展示**摘要** + 一个 "Open in Workspace" 按钮，跳到 `/crm/clm/cases/[caseId]` 全功能审批界面
3. tab 内能做的**只有**：创建新 case（如手动触发 re-verification）、查看历史、备注

### 4.5 KYC renew = Re-Verification

❌ 之前的 spec：自定义 "renew 周期" 字段

✅ 用 `ReVerificationRequest` + `ReVerificationType`：
- `re_identity`（证件过期 / mismatch）
- `re_liveness`（风控触发的活体复检）
- `re_address`（POA refresh）
- `re_income`（收入证明 / 财富来源）
- `re_agreement`（协议重签）
- `re_questionnaire`（适当性重确认）
- `re_video`（脚本朗读视频认证）

触发方式：**自动**（rule 命中 / 文档到期）或**手动**（员工在 `/crm/clm/re-verification/requests` 发起）。submit 后 spawn 一个 `CLMCase` of type `re_verification`，sub-type 在 `ReVerificationRequest.verificationType`。

Client Detail KYC tab：
- 显示活跃的 ReVerification requests
- 提供 "Request re-verification" 按钮 → 跳到 `NewRequestDrawer` 流程
- 不重新实现 7 种 type 的逻辑

### 4.6 OCR / Liveness / POA / Video 详情数据

❌ 之前的 spec：在 KYC tab 自定义 OCR 字段、Liveness 占位、POA 比对

✅ 用 CLM `CaseDetail` 的 type-specific 字段：
- `kycFlowSteps: KYCFlowStepInfo[]`
- `livenessResult: LivenessResult`（confidenceScore / passed / attemptCount / provider / images）
- `poaDetail: POADetail`（document / extractedAddress / addressMatch）
- `videoVerification: VideoVerificationDetail`（videoUrl / checklist）
- `submittedMaterials: SubmittedMaterial[]`（含 OCRResult + userSubmittedFields mismatch + Sumsub `ThirdPartyVerification`）

### 4.7 风险评估 = `RiskProfile`

❌ 之前的 spec：在 KYC tab 自己列 "AML / OCR mismatch / blacklist" 风险指标

✅ 用 `RiskAssessment.factors`（6 轴 `RiskProfile`） + `RiskFactorList` 组件展示。AML 状态用 `AMLStatus: not_checked / pass / hit / pending`。

---

## 5. Agreements 全栈对齐

❌ 之前的 spec：自建 `ClientAgreement` 表 + 自己列协议类型清单

✅ 用 CLM：
- 协议**模板配置**：`clmConfigService.listAgreements()` / `/crm/clm/agreements` 页（CRUD 协议模板）
- **签署记录**：`AgreementRecord` 嵌在 `CaseDetail.agreements`，或独立查询（agreements 的全局 case type 是 `agreement_signing`）
- **签署 UI**：`AgreementReader` + `SignaturePad` + `SignFlowPreview` 已就位

Client Detail Agreements tab：
- 列出该客户签过的 `AgreementRecord[]`（来自所有 case + 独立 agreement_signing case）
- 显示哪些协议**待签**（来自 `clmConfigService.listAgreements()` × 客户 jurisdiction，过滤掉已签的）
- 提供 "Request resign" 按钮 → 创建 `agreement_signing` case
- 不重新定义协议类型、版本、签署方式

---

## 6. Cases 全栈对齐

Client Detail Cases tab = `caseService.list({ customerId: 当前客户 })`。

- 列表用同样的列与 `CLMCase` 字段，不引入新字段
- 点击 case 跳 `/crm/clm/cases/[caseId]` 全功能详情（不在 tab 内嵌一份）
- tab 内顶部按钮："Open Workspace" 跳到 `/crm/clm/workspace?customerId=X`，让审核员在标准 inbox 内处理这个客户的所有 case
- 创建新 case：用 CLM 的标准 "新建 case" drawer（如已实现 / 否则在 CLM workspace 加）

✅ Cases tab 唯一可独立的：**针对此客户的 case 统计 KPI**（进行中 / 已完成 / 平均时长 / 超 SLA 笔数）

---

## 7. Audit / Logs 全栈对齐

❌ 之前的 spec：Client Detail 用自己的 `crm_audit_logs` 表

✅ 用：
- **存储**：`crm_audit_logs` 继续存（CRM 侧的写入），但**读取一律通过** `globalAuditService.listForClient(clientId)`
- service 内部 adapter（`@/lib/audit/adapters.ts`）把 `CRM crm_audit_logs` + `CLM CLMAuditLog` + 跨域 mock 都 project 成 `GlobalAuditLog`
- UI 用 `EnhancedDataTable` 渲染 `GlobalAuditLog[]`
- 点 "View Cross-Domain" 跳到 `/crm/clm/audit-trail?clientId=X` 看全局（包含同 IP 客户的相邻事件）

---

## 8. Risk 全栈对齐

❌ 之前的 spec：Client Detail Risk tab 自己定义"6 个 axis"

✅ 用：
- **数据**：`RiskProfile`（`@/types/core/risk-profile`），6 轴：`country / identity / device_ip / ib_source / aml / blacklist`
- **服务**：现在用 `lookupRiskProfile(clientId, baseScore, amlStatus)`（mock）；未来切 `riskService.getProfile()`
- **UI**：`RiskScoreRing` + `RiskFactorList`（同 CLM Case Detail 用的同款组件，UI 一致）
- **关系图**：`ClientGraph` + `lib/risk-engine/graph.ts` helpers + `RelationshipGraph` 组件（已统一）

---

## 9. Devices 全栈对齐

✅ Devices tab 自己拥有 `ClientDevice` 表（CRM-owned），但**所有 IP 渲染**通过：
- `IPGeoInfo`（@/types/core）数据
- `lookupIPGeo(ip)` 服务（mock / 未来 `/api/crm/integrations/ipgeo`）
- `IPGeoPopover` 组件渲染 hover 弹层（geo + VPN / Tor / Proxy 标记 + 同 IP 关联 UID）

不要在 Devices tab 自定义 VPN 检测、地理 lookup、关联客户匹配 — 全走 `IPGeoInfo`。

---

## 10. Notes / Tags / Segments — CRM-owned

这几个 tab 没有 CLM 对应物，是 CRM 模块的原生概念：
- `ClientNote` / `ClientTag` / `ClientTagAssignment` / `ClientSegment`
- 完全由 `clientService` + `/api/crm/{tags,segments,clients/[id]/notes}` 拥有
- mutation 写 `crm_audit_logs`（通过 GlobalAuditLog adapter 自动进入全局审计）

---

## 11. 实施核查清单（给开发用）

每个 tab 开始编码前，对照这个 checklist：

### 11.1 架构原则
- [ ] **明确**对应的 sidebar 模块（"这个 tab 是哪个全局模块的 UID 过滤视图"）
- [ ] 数据 fetch 调用对应**模块的 service**，不是新建 service
- [ ] mutation 调对应模块的 mutation API，不是新建 endpoint
- [ ] **客户视角和模块视角看到的是同一份数据**（只是 filter 不同）

### 11.2 数据契约
- [ ] 数据类型来自正确的 canonical source（不是新建）
- [ ] 没有新建 `AuditLog` / `Case` / `Agreement` / `RiskFactor` / `GraphNode` / `IPGeo` / `Device` / `Ticket` 类型
- [ ] 状态机用对应模块定义的（CLM / Funds / Trading / Support）

### 11.3 UI 复用
- [ ] UI 用的是 shared 组件（RiskScoreRing / EnhancedDataTable / IPGeoPopover / RichTimeline / 等）
- [ ] **列表表格的列 ≈ 模块全局视角的列**（去掉"客户"列，因为已固定）
- [ ] hooks 用的是 shared hooks（useCurrentStaffId / useGlobalSLATick / 等）
- [ ] 所有员工 ID 取自 `useCurrentStaffId()`，不硬编码 `"staff-001"`

### 11.4 跳转 / 深链
- [ ] 每个 tab 顶部有"在模块视角打开"链接（如 KYC tab → `/crm/clm/workspace?customerId=X`）
- [ ] 每行 / 每条目可跳到该条目在模块的详情（如 case → `/crm/clm/cases/[id]`）
- [ ] 不破坏 sticky / z-index 约束（见 SESSION-HANDOFF.md）

### 11.5 性能 / 列表
- [ ] 列表用 `useListWithFilters`，SLA 用 `useGlobalSLATick`
- [ ] 列表组件用 `<EnhancedDataTable tableId="client-detail-<tab>">`，与模块视角不同 tableId 但共组件

---

## 12. 如果发现 CLM 缺一个能力

正确做法：
1. **不要在 Client Detail tab 偷偷实现**
2. 提到 CLM 模块去加（types + service + UI 组件）
3. 在 Client Detail tab 调用 CLM 新加的能力

错误做法：
- "我先在 Client Detail 内 mock 一下，等 CLM 那边有时间再迁移" — 这就是当前规格出问题的根因

---

## 13. 信息架构决策（全部已确认）

| # | 议题 | ✅ 决策 |
|---|---|---|
| A-Q1 | Marketing engagement 在哪儿看？ | **加 "Marketing" 第 12 tab**（在 ops 组内），聚合 campaigns / emails / SMS / push engagement |
| A-Q2 | `/crm/accounts/*` 是否加入 sidebar Trading 组？ | **是**。3 个 orphan page（accounts / accounts/groups / accounts/leverage）加入 sidebar Trading 组，Accounts tab 与之 1:1 对应 |
| A-Q3 | Permissions tab 怎么组织？ | **4 sections by source**：Trading / Funds / Security / IB |
| A-Q4 | Devices tab UI 是否复用 `/crm/risk/device`？ | **完全复用**，仅顶部 filter 固定到此客户 |
| A-Q5 | Logs vs Timeline 边界 | **Logs = 员工写视角（全量 + 内部敏感）；Timeline = 客户读视角（过滤 + 团队名替换 staff 名）**。详见 §0 末尾的边界表 |
| A-Q6 | IB 是否单独 tab？ | **是**。新增 "IB" 第 13 tab（在 ops 组内）。客户是 IB / 客户在 IB 下属 / 都不是 — 三种状态各自显示对应内容 |
| A-Q7 | Trading tab 子结构？ | **2 子 tab**：Open Positions / Trade History（与 `/crm/trading/{positions,orders}` 同结构） |
| A-Q8 | Funds tab 子结构？ | **4 子 tab**：Deposits / Withdrawals / Transactions / Adjustments。注：Channels 是配置不进客户视角 |

## 15. 与本文档冲突时的优先级

如果 `02-compliance.md` 或其他文档与本文档冲突，**以本文档为准**。`02-compliance.md` 已基于此文档对齐重写（v2）。

如果发现实际模块代码（CLM / Risk Engine / Funds / Trading 等）与本文档说法冲突，**以代码为准**（这些模块是事实源）。修正本文档。
