# Client Detail — Compliance Tabs (v2, aligned to CLM)

> 3 个合规 tab：KYC / Cases / Agreements。
> **本文档 v2 已按 [05-alignment.md](./05-alignment.md) 重写**。三个 tab 都**不再是独立设计**，而是 **CLM 模块的客户级视图**。
>
> **先读 [05-alignment.md](./05-alignment.md)。** 它说明了为什么这三个 tab 不能自己造数据模型。

---

## 设计前提

| 项 | 真相 |
|---|---|
| KYC 状态机 | `CLMCaseStatus`（10 状态），不是 Client Detail 自定义的 |
| KYC 级别 | `KYCLevel: tier0 / tier1 / tier2 / tier3 / tier4` |
| KYC 步骤 | `KYCFlowStepId`（phone_email / document / liveness / poa / income_proof / video_verification） |
| KYC renew | `ReVerificationRequest` + `ReVerificationType`（7 种），spawn `CLMCase(type=re_verification)` |
| KYC 审核 UI | CLM Workspace (`/crm/clm/workspace` + `/crm/clm/cases/[id]`) 已完整实现，Client Detail KYC tab 跳转过去而非重复 |
| 协议模板 | `clmConfigService.listAgreements()` + `/crm/clm/agreements` 配置页 |
| 协议签署记录 | `AgreementRecord`（CLM 拥有），通过 `agreement_signing` case 落地 |
| Cases | `CLMCase` + `caseService`，Client Detail Cases tab = `caseService.list({customerId})` |

Client Detail 这三个 tab 的角色：**列出 + 摘要 + 跳转**。

---

## Tab 6 — KYC

### 6.1 目的
作为 CLM KYC 数据**针对此客户的视图**。把分散在 CLM Workspace 各处的 KYC 信息整合到一个客户视图：当前 KYC tier、所有 KYC 相关 case（按 type 分组）、活跃的 re-verification 请求、所有提交的材料、风险评估摘要。

> **审核操作不在这个 tab 内完成。** 点击任一 case 卡片跳 `/crm/clm/cases/[caseId]` 用标准 CLM Workspace 操作。

### 6.2 数据来源

```ts
const kycRelevantTypes: CLMCaseType[] = [
  "kyc", "poa", "liveness", "video_verification",
  "edd", "source_of_wealth", "re_verification",
  // 注意：agreement_signing 在 Agreements tab 处理，不在这里
];

const cases = await caseService.list({
  customerId,
  typeIn: kycRelevantTypes,
});

const activeReVerifications = await reVerificationService.list({
  customerId,
  statusIn: ["pending", "submitted", "in_progress"],
});

const riskProfile = await lookupRiskProfile(customerId, baseScore, amlStatus);
```

### 6.3 数据展示

**A. KYC 状态总览卡（顶部）**

| 字段 | 来源 |
|---|---|
| 当前 KYC tier | `User.kycLevel`（派生自最近一次 approved 的 `CLMCase.kycLevel`） |
| 客户当前 flow | `clmConfigService.getFlow(regionCode)` → `KYCFlowStepId[]` |
| 已完成步骤 | `latestKYCCase.kycFlowSteps[].completed` |
| 最近一次审核 | reviewer / 时间 / 决定（来自最近一个 terminal case） |
| 下次 renew | 来自活跃的 `ReVerificationRequest`，或者按 `clmConfigService.policies` 的 renew 规则推算 |
| AML 状态 | `User.amlStatus`（`AMLStatus: not_checked / pass / hit / pending`） |
| 关联 active cases | count of `cases.filter(c => isActive(c.status))` |

**B. KYC Case 列表（按 type 分组折叠）**

每组（kyc / poa / liveness / video_verification / edd / source_of_wealth / re_verification）：
- 该 type 的所有 case，按 `updatedAt desc`
- 每行字段（与 CLM Cases page 一致）：caseNo / status / riskLevel / amlStatus / autoReviewResult / assignee / SLA / createdAt
- 点击行 → `/crm/clm/cases/[caseId]`

**C. Re-Verification 活跃请求（独立 section）**

来自 `reVerificationService.list({customerId, statusIn: active})`：
- 每条：`verificationType`（7 种）/ trigger（manual / automatic）/ triggerReason / 限制配置（`RestrictionLevel` + `RestrictionScope[]`）/ 通知渠道 / 截止时间 / 链接的 case
- 点击 → `/crm/clm/re-verification/requests`

**D. 提交的材料汇总（最近一次 case 的 `submittedMaterials`）**

直接显示 `CaseDetail.submittedMaterials[]`：
- 每条 material：type（id_document / poa / income_proof / liveness_image / liveness_video / bank_account / agreement）/ label / 缩略图 / status / submittedAt
- OCR 结果（`OCRResult`）和 `userSubmittedFields` mismatch 由 case detail 展开时渲染
- 三方认证状态（`ThirdPartyVerification`）用 `VerificationChip` 组件

**E. 风险评估快照**

直接复用 CLM Case Detail 用的同款 UI：
- `RiskScoreRing`（6 轴 composite score）
- `RiskFactorList`（每轴可展开看 reasoning + evidence）
- AML 状态 badge

### 6.4 可执行操作（tab 级）

| 动作 | 权限 | 行为 |
|---|---|---|
| **Open in Workspace** | viewer+ | 跳 `/crm/clm/workspace?customerId=X` 用标准 inbox 处理此客户所有 case |
| **Open case** | viewer+ | 跳 `/crm/clm/cases/[caseId]` 全功能详情 |
| **Request re-verification** | compliance / risk / admin | 打开 `NewRequestDrawer`，6 步触发流程（已实现，复用） |
| **Trigger AML rescan** | compliance / risk | 调 CLM 服务的 rescan endpoint，刷新 `riskProfile.amlStatus` |
| **View KYC config** | viewer+ | 跳 `/crm/clm/levels` / `/crm/clm/kyc-flows` 看配置 |
| **导出 KYC 历史 PDF** | compliance / admin | 调 `/api/crm/clients/[id]/kyc/export`，写 GlobalAuditLog |

> **不在这个 tab 实现的**：approve / reject / resubmit / escalate / mark suspicious / 上传内部文档 / 单文档级操作（标记 fake / 重 OCR / 替换 / 删除）—— 全部走 `/crm/clm/cases/[caseId]` 的 `DecisionPanel` + 文档卡片操作。

### 6.5 副作用

KYC tab 本身**不写**审计或时间线。所有审计来自 CLM Workspace 内的操作（CLM 已经写了 `CLMAuditLog`，经 `clmAuditToGlobal` adapter 进 `GlobalAuditLog`，Client Detail Logs tab 通过 `globalAuditService.listForClient(id)` 读到）。

唯一例外：在 KYC tab 内触发的 "Request re-verification" 调用 `reVerificationService.create()`，由 service 内部写审计。

### 6.6 SLA

不在 Client Detail 定义。SLA 配置在 CLM `clmConfigService.policies`（category = `sla`）。Client Detail 只读取并显示。

### 6.7 跨 tab 联动

| 事件 | 联动 |
|---|---|
| CLM Workspace 内 case approve | KYC tab 刷新 → User.kycStatus 更新 → Overview 横幅消失 |
| Re-Verification request 加 RestrictionConfig | Permissions tab 显示对应 restriction 来源 = re-verification |
| AML 状态从 pass → hit | Overview 横幅显示 + Risk tab 因子重新计算 + Notes tab 可选自动写一条 risk note |

---

## Tab 7 — Cases

### 7.1 目的
列出此客户的**所有** `CLMCase`，无论 type，作为 CLM 的客户级 dashboard。

> **此 tab 不创建 case 模型副本。** 不嵌入 case detail 视图。点击案例跳 `/crm/clm/cases/[caseId]`。

### 7.2 数据来源

```ts
await caseService.list({ customerId });
```

支持 CLM 的全部过滤参数（`CaseListParams`）：
- `caseType` / `typeIn`
- `status` / `statusIn` / `decisionMode`
- `priority`
- `slaStatus` / `amlStatus` / `riskLevel`
- `autoReviewResult`
- `assignee`
- `startDate` / `endDate`

### 7.3 数据展示

**A. 顶部 KPI 条**

| KPI | 计算 |
|---|---|
| 总 cases | count |
| 进行中（status in active set） | count |
| 已完成（status in terminal set） | count |
| 平均完成时长 | avg(reviewedAt - createdAt) over 已完成 |
| 超 SLA 笔数 | count where `slaStatus = timeout` |
| 自动通过率 | count(`auto_approved`) / count(all 终态) |

**B. 列表**

字段与 `/crm/clm/cases` 主列表完全一致（用同一份 `<EnhancedDataTable tableId="client-detail-cases">`）：

| 字段 | 来源 |
|---|---|
| caseNo | `CLMCase.caseNo` |
| type | `CLMCaseType` |
| status | `CLMCaseStatus`（10 状态） |
| priority | `Priority` |
| riskLevel / amlStatus | |
| assignee | with avatar |
| SLA | `useGlobalSLATick` 驱动 |
| autoReviewResult | `AutoReviewVerdict` |
| createdAt / updatedAt | |

**C. 时间线视图（可选 toggle）**

用 `RichTimeline` 组件按 `createdAt desc` 展示该客户的所有 case，5 类颜色编码（submission / system / assignment / comment / decision）。

### 7.4 可执行操作

| 动作 | 权限 | 行为 |
|---|---|---|
| **Open case** | viewer+ | 跳 `/crm/clm/cases/[caseId]` |
| **Open in Workspace** | reviewer roles | 跳 `/crm/clm/workspace?customerId=X` |
| **Create manual case** | compliance / risk / support / admin | 用 CLM 的标准创建 drawer（如未实现则在 CLM 加，不在此 tab 实现） |
| **Bulk assign**（选中 N 个） | compliance / admin | 调 `caseService.bulkAssign` |
| **Export CSV** | viewer+ | 调 `/api/crm/clm/cases/export?customerId=X` |
| 切换视图：list / timeline | viewer+ | 仅 UI |

### 7.5 副作用

Tab 不写审计。CLM service 写 `CLMAuditLog` → adapter → `GlobalAuditLog`。

### 7.6 与 CLM Cases page 的边界

| 维度 | `/crm/clm/cases` | Client Detail Cases tab |
|---|---|---|
| 范围 | 全平台所有 case | `customerId = 当前客户` 的 case |
| 过滤 | 按 reviewer inbox 等运营维度 | 按此客户的 type/status |
| 主要用途 | 审核员日常工作面板 | 看"这个客户所有合规历史" |
| 操作 | 全功能（assign / decide） | 跳转过去操作 |

---

## Tab 8 — Agreements

### 8.1 目的
此客户签过的所有**法律协议记录** + **待签清单**。是 CLM Agreements 模块（`/crm/clm/agreements` 配置 + `agreement_signing` cases + `AgreementRecord`）的客户级视图。

> **协议模板的定义**（哪些协议、哪个 jurisdiction 用、什么版本、什么时机签）由 CLM Agreements 配置页拥有。Client Detail 只查询和触发签署，不定义。

### 8.2 数据来源

```ts
// 1. 此客户所有签过的协议（聚合所有 case 的 agreements + 独立 agreement_signing case）
const signedAgreements: AgreementRecord[] = await collectAgreements(customerId);

// 2. 此客户应签但未签的协议（按 jurisdiction × KYCLevel × 已签的版本号 diff）
const pendingAgreements = await clmConfigService.computePendingAgreements({
  customerId,
  jurisdiction: customer.country,
  kycLevel: customer.kycLevel,
  signedRecords: signedAgreements,
});

// 3. 阻断信息（待签协议是否阻挡客户某些操作）
const blockingAgreements = pendingAgreements.filter(a => a.blocksOperations.length > 0);
```

### 8.3 数据展示

**A. 阻断警告（顶部，仅有阻断时）**

红色横幅显示阻断项 + 影响的操作：
- "Risk Disclosure v3.2 待签 — 阻断：出金 / 开新仓"
- "FATCA Self-Cert 2026 待签 — 阻断：renew KYC"

**B. 待签协议（折叠 section）**

每条：
- 协议名 + 版本号 + jurisdiction
- 强制时机（"注册时" / "首次出金前" / "annual renew"）
- 待签原因（"版本升级" / "周期到期" / "新地区" / "权限触发"）
- Action 按钮："Request signature"

**C. 已签协议列表**

字段（直接来自 `AgreementRecord`）：
| 字段 |
|---|
| name / version / signedAt / ipAddress / language / signatureType (`handwritten` / `text`) / pdfUrl / status (`signed` / `pending` / `expired`) / forceResign（是否需要强制重签的标记） |

排序：按 signedAt desc。每行可点查看 PDF（用 `AgreementReader` 组件）。

**D. 即将到期（次序排序）**

未来 30 天内 expire 的，红色 highlight。

### 8.4 可执行操作

| 动作 | 权限 | 行为 |
|---|---|---|
| **View / Download PDF** | compliance / admin | 用 `AgreementReader`；下载写 GlobalAuditLog |
| **Request signature** | compliance / support / admin | 创建 `CLMCase(type=agreement_signing)`，customer 在 portal 看到 prompt |
| **Mark expired** | compliance | 调 `clmConfigService.markAgreementExpired(agreementRecordId)` |
| **Upload wet-sign** | compliance | 客户线下签的扫描件上传 |
| **Revoke signature** | admin + compliance 双签 | 罕见，需 reason |
| **Send reminder email** | support / compliance | 触发邮件 + 站内 |
| **Bulk re-sign request**（系统级，跨多客户） | admin | 不在此 tab，跳 `/crm/clm/agreements` 主页 |

### 8.5 副作用

所有 mutation 通过 CLM service 完成，CLM service 写 `CLMAuditLog`（→ GlobalAuditLog）。

| 动作 | 时间线（客户视角） |
|---|---|
| Request signature | `agreement_pending` |
| Mark expired | `agreement_expired` |
| Sign（来自 portal 或 wet-sign 上传） | `agreement_signed` |
| Revoke | 仅内部，不写客户时间线 |

### 8.6 与 CLM Agreements 模块的边界

| 维度 | `/crm/clm/agreements` 配置页 | Client Detail Agreements tab |
|---|---|---|
| 范围 | 协议模板 + 版本 + 适用规则 | 此客户的签署记录 + 待签清单 |
| 主要用途 | 法务 / 合规配 default 模板 | 员工查这个客户签了什么 |
| 操作 | 定义新协议 / 改版 / 改适用规则 | 触发此客户重签 / 查 PDF |

### 8.7 协议类型清单（含 FX 经纪商常见的）

> **此清单是参考。最终以 `/crm/clm/agreements` 配置为准。**

| 协议 | 触发时机 | 周期 | jurisdiction-aware |
|---|---|---|---|
| Client Agreement / TOS | 注册 | 重大变更 re-sign | 是 |
| Risk Disclosure Statement | 注册 / 首次出金前 | 年度 + 重大变更 | 是 |
| Privacy Policy | 注册 | 变更 | 是 |
| AML / KYC Disclosure | 注册 | 变更 | 是 |
| Order Execution Policy | 首次交易前 | 重大变更 | 是 |
| Fees & Commissions Schedule | 注册 | 变更 | 是 |
| Investor Compensation Scheme | 注册（CySEC 等监管） | 一次性 | 仅特定 jurisdiction |
| KIID / Product Disclosure（按产品） | 首次交易该产品前 | 季度 / 年度 | 是 |
| Joint Account Agreement | 开联合账户 | 一次性 | 是 |
| Power of Attorney | 委托交易 | 一次性 | 是 |
| W-8BEN | 注册（非美居民交易美股） | 3 年 | US-related |
| W-9 | 注册（美居民） | 国籍变更 | 是 |
| CRS Self-Certification | 注册 | 年度 | 是 |
| FATCA Self-Cert | 注册 | 年度 | US-related |
| PEP Declaration | 注册 | 年度 / PEP 状态变更 | 是 |
| Islamic / Swap-Free Declaration | 申请 Swap-Free | 一次性 | 是 |
| Marketing Consent | 注册 | 可随时撤回 | 是 |
| Cookie Consent | 首访 | session | 是 |

### 8.8 与其他 tab 的硬性阻断

待签协议触发的阻断（计算在 service 层，CRM Permissions tab 显示来源）：

| 待签项 | 阻断操作 |
|---|---|
| Risk Disclosure (latest) | 出金 |
| Order Execution Policy | 交易某些品种 |
| W-8BEN expired | 美股相关产品 |
| FATCA / CRS expired | 出金 + KYC renew |
| PEP Declaration expired | KYC renew |

阻断的 enforce 在 CRM service 层（出金 API / 交易 API 调用前检查）。Client Detail Agreements tab **显示**阻断原因，不**实现**阻断逻辑。

---

## 完整性 checklist（Compliance 三 tab）

实现这三个 tab 时对照检查：

- [ ] KYC tab 没有自定义 `kycStatus` 枚举（用 `CLMCaseStatus`）
- [ ] KYC tab 没有自定义 KYC level 枚举（用 `KYCLevel: tier0-4`）
- [ ] KYC tab 没有自定义 OCR / Liveness / POA / Video 结构（用 `CaseDetail` 字段）
- [ ] KYC tab 的所有"审核操作"都跳 `/crm/clm/cases/[id]`，不重写 DecisionPanel
- [ ] KYC tab 的 "renew" 走 `reVerificationService`，不自定义周期
- [ ] Cases tab 列表用 `<EnhancedDataTable tableId="...">`，列同 CLM Cases page
- [ ] Cases tab 没有内嵌 case 详情，点击跳 `/crm/clm/cases/[id]`
- [ ] Agreements tab 用 `AgreementRecord`，不自建 ClientAgreement 模型
- [ ] Agreements tab 的协议模板来自 `clmConfigService.listAgreements()`
- [ ] 三个 tab 都不写 audit log（CLM service 内部已写）
- [ ] 三个 tab 都用 `useCurrentStaffId()`，不硬编码员工 ID
- [ ] PDF / 文档查看用 `AgreementReader` / `VerificationChip`，不重写
