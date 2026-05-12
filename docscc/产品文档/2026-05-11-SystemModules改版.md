# System Modules 改版 PRD

> 版本：1.1 | 日期：2026-05-11 | 作者：产品

## 背景与问题

Configuration > System Modules 页面原始状态存在以下问题：

1. 国家政策以行内表格编辑，字段越来越多时体验差
2. 证件过期检查是全局一条设置，无法按证件类型区分
3. 身份证件缺少正反面配置
4. Liveness / POA / Income Proof 三张卡片是"只读预览"，实际运营需要可配置
5. 缺少问卷（Questionnaire）模块的统一配置入口
6. 文档类型设置和上传设置在页面中可直接内联编辑，交互方式不统一
7. 上传重试次数为单一字段，无法区分单用户总限额与时间窗口内限额
8. 活体认证仅支持自由文本供应商，无结构化的供应商配置
9. 国家政策缺少全局兜底逻辑说明

## 设计目标

- 五个验证模块（Identity / POA / Income Proof / Liveness / Questionnaire）统一到 System Modules 页面，每个模块均可独立配置
- 所有编辑操作通过右侧抽屉（ConfigDrawer）完成，页面本身为只读摘要
- 规范化活体认证供应商管理，支持自研 + 外部供应商 KEY 配置
- 明确国家政策的全局兜底规则，防止漏配导致用户被拒

---

## 数据模型

### §1 Identity Verification 模块

#### §1.1 DocumentTypeDefaults（证件类型全局默认）

控制每种证件是否需要正反面采集，独立于国家政策：

```ts
interface DocumentTypeDefaults {
  kind: DocumentTypeKind;            // national_id | passport | drivers_license
  backSideEnabled: boolean;          // 是否展示背面上传区域
  backSideRequired: boolean;         // 背面是否必传（enabled=true 时生效）
}
```

默认值：

| Kind | backSideEnabled | backSideRequired |
|---|---|---|
| national_id | true | true |
| passport | false | false |
| drivers_license | true | true |

#### §1.2 DocumentTypeExpiryRule（按证件类型的过期检查）

替代原来的全局 `DocumentExpiryCheck`，每种证件独立配置：

```ts
interface DocumentTypeExpiryRule {
  kind: DocumentTypeKind;
  checkEnabled: boolean;
  rejectIfExpiringWithinMonths: number;  // 0 = 仅检查是否已过期
}
```

默认值：

| Kind | checkEnabled | rejectWithin |
|---|---|---|
| passport | true | 6 |
| drivers_license | true | 1 |
| national_id | false | 0 |

#### §1.3 DocumentUploadConfig（上传通用设置）

重试次数拆为两个维度：

```ts
interface DocumentUploadConfig {
  acceptedFormats: ("jpg" | "png" | "pdf")[];
  maxFileSizeMb: number;
  maxRetryAttemptsPerUser: number;     // 单用户累计上限（不受时间窗限制）
  retryWindowHours: number;            // 滚动时间窗口，默认 24
  maxRetryAttemptsPerWindow: number;   // 时间窗口内最大次数
  duplicateDocumentNumberCheck: boolean;
}
```

**重试锁定逻辑：**
- 单用户累计失败超过 `maxRetryAttemptsPerUser` → 账户锁定，需人工处理
- 在 `retryWindowHours` 小时内失败超过 `maxRetryAttemptsPerWindow` → 暂时锁定，等待窗口重置

#### §1.4 DocumentTypePolicy（国家政策）

```ts
interface DocumentTypePolicy {
  country: string;                  // ISO code 或 "Global"
  allowedTypes: DocumentTypeKind[];
  backSideOverrides?: Partial<Record<DocumentTypeKind, boolean>>;  // 覆盖全局默认
}
```

**全局兜底规则（重要）：**
- 引擎按 `country` 精确匹配；无匹配时自动降级到 `country === "Global"` 的政策
- 若无 Global 政策，所有未匹配国家的用户将被拒绝
- UI 层：列表中缺少 Global 条目时，页面顶部显示橙色警告横幅
- Global 策略在国家政策列表中始终置顶，带"默认"徽标

#### §1.5 IdentityModuleConfig

```ts
interface IdentityModuleConfig extends ConfigBase {
  policies: DocumentTypePolicy[];
  documentTypeDefaults: DocumentTypeDefaults[];
  expiryRules: DocumentTypeExpiryRule[];
  uploadConfig: DocumentUploadConfig;
}
```

---

### §2 POA 模块

```ts
type POADocumentKind =
  | "utility_bill" | "bank_statement" | "government_letter"
  | "tenancy_agreement" | "tax_document";

interface POAModuleConfig extends ConfigBase {
  acceptedDocuments: POADocumentKind[];
  maxAgeMonths: number;          // 文件新鲜度，通常 3
  acceptedFormats: ("jpg" | "png" | "pdf")[];
  maxFileSizeMb: number;
}
```

---

### §3 Income Proof 模块

```ts
type IncomeDocumentKind =
  | "payslip" | "tax_return" | "bank_statement"
  | "audited_accounts" | "employer_letter";

interface IncomeProofModuleConfig extends ConfigBase {
  acceptedDocuments: IncomeDocumentKind[];
  periodCoverageMonths: number;  // 需要覆盖最近连续 N 个月
  acceptedFormats: ("jpg" | "png" | "pdf")[];
  maxFileSizeMb: number;
}
```

---

### §4 Liveness Check 模块

供应商从自由文本改为枚举，外部供应商支持结构化 KEY 配置：

```ts
type LivenessProvider = "tradepass" | "onfido" | "sumsub";

interface LivenessProviderConfig {
  apiKey?: string;           // onfido / sumsub
  webhookSecret?: string;    // onfido only：用于验证回调签名
  appToken?: string;         // sumsub only：等同于 API Key
  secretKey?: string;        // sumsub only：用于 HMAC 请求签名
}

interface LivenessModuleConfig extends ConfigBase {
  provider: LivenessProvider;
  providerConfig: LivenessProviderConfig;  // TradePass 自研时为空对象
  confidenceThreshold: number;            // 0-100，最小通过置信度
  maxAttempts: number;                    // 超出后自动判失败并创建 Case
}
```

**供应商说明：**

| 供应商 | 配置项 | SDK 文档 |
|---|---|---|
| tradepass | 无，开箱即用 | — |
| onfido | API Key + Webhook Secret | https://documentation.onfido.com/ |
| sumsub | App Token + Secret Key | https://developers.sumsub.com/ |

- 默认选 `tradepass`（自研），切换供应商时自动清空上一个供应商的 KEY
- 抽屉内各外部供应商下方附外链跳转对应 SDK 接入文档

---

### §5 Questionnaire 模块

```ts
type QuestionFieldType = "text" | "select" | "multiselect" | "boolean" | "number" | "date";

interface QuestionnaireField {
  id: string;
  label: string;
  type: QuestionFieldType;
  required: boolean;
  hint?: string;
  options?: { label: string; value: string }[];
  order: number;
}

interface QuestionnaireModuleConfig extends ConfigBase {
  fields: QuestionnaireField[];
}
```

---

## UI 设计

### 页面整体结构（只读摘要 + 抽屉编辑）

```
System Modules
──────────────────────────────────────────

[Identity Verification Card — 全宽]

  ⚠️  [橙色警告] 未配置全球默认政策（仅在缺少 Global 条目时显示）

  [文档类型设置]  3 种证件启用背面 · 2 种证件启用过期检查       >
  [上传设置]      JPG / PNG / PDF · 5MB · 单用户10次 · 24h内3次  >

  国家政策                                          [+ 添加国家]
  ┌──────────────────────────────────────────────┐
  │ Global  全球默认  [Passport]             [默认] ✎ │
  │ ID      Indonesia [Passport][National ID]       ✎ │
  │ TH      泰国      [Passport][National ID][驾照]  ✎ │
  └──────────────────────────────────────────────┘

[2×2 模块卡片]

  [POA]  utility bill、bank... · 有效期3月   [配置]
  [收入证明]  payslip、tax... · 覆盖3月       [配置]
  [活体认证]  TradePass自研 · 置信度80% · 最多3次  [配置]
  [问卷]  6 个字段                            [配置]
```

### 抽屉清单

| 抽屉 | 触发入口 | 内容 |
|---|---|---|
| 文档类型设置 | 摘要行点击 | 3 行 × 5 列表格（证件 × 背面/必传/过期/月数） |
| 上传设置 | 摘要行点击 | 格式、大小、单用户总次数、时间窗口（小时+次数）、重复检测 |
| 国家政策（新增/编辑） | + 添加国家 / ✎ 编辑 | 国家代码、允许证件类型、背面要求覆盖 |
| POA | 配置按钮 | 文件类型、有效期、格式、大小 |
| 收入证明 | 配置按钮 | 文件类型、覆盖月数、格式、大小 |
| 活体认证 | 配置按钮 | 供应商选择 + KEY 配置（按供应商动态显示）+ 置信度/次数 |
| 问卷 | 配置按钮 | 字段列表（添加/删除/编辑：标签、类型、必填、提示） |

### 国家政策全局兜底交互

1. 引擎匹配顺序：精确国家 → Global 兜底
2. 无 Global 时页面顶部橙色 Banner："未配置全球默认政策（Global）——无匹配国家的用户将被拒绝。"
3. Global 条目不可删除，不可修改 country 字段（Edit 模式下置灰）
4. 国家政策列表中 Global 始终置顶

---

## 交互规则

| 场景 | 行为 |
|---|---|
| 文档类型 / 上传设置 抽屉 Save | 立即调用 identityModule.update()，刷新页面摘要，toast 确认 |
| 国家政策 Save | 立即持久化（不经过页面级 Save），toast 确认 |
| 国家政策 Delete | Global 策略禁止删除（无 Delete 按钮） |
| 切换活体认证供应商 | 自动清空上一供应商的 KEY 字段 |
| 外部供应商 KEY 为空时 Save | 不阻止（允许先选供应商后再填 KEY）；但 KEY 为空时仍会触发 API 报错 |

---

## 待办

- [ ] 国家政策：防止重复添加相同 ISO code
- [ ] 证件过期检查 + 背面要求：未来可扩展到"per country per type"覆盖
- [ ] 问卷字段拖拽排序
- [ ] Liveness 外部供应商 KEY 加密存储（当前 mock 为明文）
- [ ] POA / Income 文件类型增加多语言展示名
- [ ] continuous 规则的"下次扫描时间"估算 UI（来源：Re-Verification）
