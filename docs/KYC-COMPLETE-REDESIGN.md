# TradePass KYC 系统 — 完整重构方案

> 版本：v2.0 | 日期：2026-05-08 | 状态：设计评审
>
> 综合来源：KYC-PRD / KYC-TestCases / KYC-Flow-Redesign / KYC-Region-Config / KYC-Flow-Proposal / ForexCLM-Architecture

---

## 一、设计目标

构建一个**地区化驱动、步骤动态编排、防跳过、前后台一体化**的 KYC 开户流程：

1. **9 地区差异化**：VN/TH/IN/AE/KR/JP/FR/ES/BR，每个地区证件类型、步骤组合、表单字段、声明项均可配置
2. **6 步动态流程**：居住地选择 → 证件认证+OCR → 活体检测 → 地址证明 → 个人经验 → 协议签署
3. **防跳过机制**：前后端双重步骤守卫（Guard），动态计算下一步
4. **前后台一体**：前台 Portal 完成流程，后台 CRM 进行审核、风控、合规管理
5. **DevTools 支持**：Mock OCR / Mock 活体 / Mock 审核 / 地区切换，支持快速原型验证

---

## 二、用户旅程（按地区动态）

```
用户进入 KYC
    ↓
[Step 1] 选择居住地 → 加载地区配置 → 显示该地区所需步骤和证件类型
    ↓
[Step 2] 选择证件类型 → 上传正反面 → OCR 识别 → 确认/编辑个人信息
    ↓
[Step 3] 活体检测（眨眼+摇头，如地区要求）
    ↓
[Step 4] 地址证明上传（如地区要求：IN/AE/JP/FR/ES）
    ↓
[Step 5] 填写个人经验（财务/就业/交易/学历/声明，按地区配置动态渲染）
    ↓
[Step 6] 阅读协议 → 电子签名（手写/文本）→ 提交审核
    ↓
系统初审（eKYC Mock）→ 人工复核（如需）→ 结果通知
```

### 2.1 各地区步骤差异

| 地区 | KYC 等级 | 证件类型 | 活体 | 地址证明 | 总步骤 |
|------|---------|---------|------|---------|--------|
| VN 越南 | standard | 身份证, 护照 | ✅ | ❌ | 5 步 |
| TH 泰国 | standard | 身份证, 护照, 驾驶证 | ✅ | ❌ | 5 步 |
| IN 印度 | enhanced | 身份证, 护照, 驾驶证 | ✅ | ✅ | 6 步 |
| AE 阿联酋 | enhanced | 护照, 驾驶证 | ✅ | ✅ | 6 步 |
| KR 韩国 | standard | 身份证, 护照, 驾驶证 | ✅ | ❌ | 5 步 |
| JP 日本 | enhanced | 身份证, 护照, 驾驶证 | ✅ | ✅ | 6 步 |
| FR 法国 | enhanced | 护照, 驾驶证 | ✅ | ✅ | 6 步 |
| ES 西班牙 | enhanced | 身份证, 护照, 驾驶证 | ✅ | ✅ | 6 步 |
| BR 巴西 | standard | 身份证, 护照, 驾驶证 | ✅ | ❌ | 5 步 |

---

## 三、核心数据模型

### 3.1 地区配置模型（RegionKYCConfig）

```typescript
interface RegionKYCConfig {
  regionCode: RegionCode;           // "VN" | "TH" | "IN" | ...
  regionName: string;
  regionNameLocal: string;
  kycLevel: "basic" | "standard" | "enhanced";

  // 证件配置
  documents: {
    allowedTypes: ("id_card" | "passport" | "driving_license")[];
    maxFileSize: number;            // MB
    allowedFormats: string[];       // ["jpg", "png", "pdf"]
    ocrEnabled: boolean;
  };

  // 功能开关
  features: {
    livenessRequired: boolean;
    addressProofRequired: boolean;
    videoKYCRequired: boolean;
    manualReviewRequired: boolean;  // 强制人工复核
  };

  // 表单字段配置
  formFields: {
    personalInfo: FieldConfig[];    // 动态字段定义
    education: boolean;
    investmentExperience: boolean;
    financialStatus: boolean;
    declarations: {
      usPerson: boolean;
      pep: boolean;
      military: boolean;
      professional: boolean;
    };
  };

  // 本地化
  localization: {
    defaultLanguage: string;
    supportedLanguages: string[];
    dateFormat: string;
    currency: string;
  };
}
```

### 3.2 用户 KYC 记录（UserKYC）

```typescript
interface UserKYC {
  id: string;
  userId: string;
  regionCode: RegionCode;
  kycLevel: KYCLevel;
  status: KYCStatus;

  // Step 2: 证件
  documentType?: DocumentType;
  documentFrontUrl?: string;
  documentBackUrl?: string;
  ocrData?: OCRResult;
  ocrConfidence?: number;

  // Step 3: 活体
  livenessPassed?: boolean;
  livenessAttempts?: number;
  livenessVideoUrl?: string;

  // Step 4: 地址证明（条件）
  addressProofUrl?: string;
  addressProofType?: string;

  // Step 5: 个人经验（聚合）
  experienceInfo?: {
    employment?: EmploymentInfo;
    education?: EducationInfo;
    investmentExperience?: InvestmentExperience;
    financialStatus?: FinancialStatus;
    professionalKnowledge?: ProfessionalKnowledge;
    declarations?: Declarations;
  };

  // Step 6: 协议签署
  agreementsSigned?: AgreementSignature[];
  signatureType?: "handwritten" | "text";

  // 审核信息
  submittedAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
  rejectionDetails?: string;

  createdAt: string;
  updatedAt: string;
}
```

### 3.3 KYC 状态枚举

```typescript
type KYCStatus =
  | "not_started"              // 未开始
  | "region_selected"          // 已选择地区
  | "document_uploaded"        // 证件已上传
  | "ocr_processing"           // OCR 识别中
  | "ocr_completed"            // OCR 完成（含个人信息确认）
  | "liveness_pending"         // 待活体检测
  | "liveness_completed"       // 活体检测完成
  | "address_proof_pending"    // 待上传地址证明
  | "address_proof_completed"  // 地址证明完成
  | "experience_pending"       // 待填写经验信息
  | "experience_completed"     // 经验信息完成
  | "agreement_pending"        // 待签署协议
  | "submitted"                // 已提交审核
  | "under_review"             // 审核中
  | "approved"                 // 已通过
  | "rejected"                 // 已拒绝
  | "supplemental_required";   // 需补充材料
```

---

## 四、状态机设计

### 4.1 状态流转图

```
not_started
    │ 选择地区
    ▼
region_selected ──→ /portal/kyc/document
    │ 上传证件 + OCR + 确认个人信息
    ▼
document_uploaded → ocr_processing → ocr_completed
    │
    ▼
liveness_pending ──→ /portal/kyc/liveness
    │ 活体检测（或跳过）
    ▼
liveness_completed
    │
    ├─ addressProofRequired ──→ /portal/kyc/address-proof
    │                              │ 上传地址证明
    │                              ▼
    │                           address_proof_completed
    │                              │
    │                              ▼
    └─ !addressProofRequired ──→ /portal/kyc/experience
                                    │ 填写个人经验
                                    ▼
                                 experience_completed ──→ /portal/kyc/agreements
                                    │ 签署协议
                                    ▼
                                 agreement_pending → agreement_completed
                                    │
                                    ▼
                                 submitted
                                    │
                                    ▼
                              ┌─────────────┐
                              │ 自动审核     │
                              │ (eKYC Mock) │
                              └──────┬──────┘
                                     │
                    ┌────────────────┼────────────────┐
                    ▼                ▼                ▼
               confidence       confidence       confidence
                 < 0.9          >= 0.9 &&       < 0.7
                                  < 0.9
                    │                │                │
                    ▼                ▼                ▼
              under_review      approved         rejected
                    │                                 │
                    ▼                                 │
              ┌──────────┐                            │
              │ 人工复核  │                            │
              │ approved │                            │
              │ rejected │                            │
              │ supplemental_required │               │
              └──────────┘                            │
                                                      │
                    ┌─────────────────────────────────┘
                    │ 重新提交
                    ▼
              not_started（保留数据）
```

### 4.2 状态转换规则

```typescript
const VALID_TRANSITIONS: Record<KYCStatus, KYCStatus[]> = {
  not_started: ["region_selected"],
  region_selected: ["document_uploaded"],
  document_uploaded: ["ocr_processing", "rejected"],
  ocr_processing: ["ocr_completed", "rejected"],
  ocr_completed: ["liveness_pending"],
  liveness_pending: ["liveness_completed", "rejected"],
  liveness_completed: ["address_proof_pending", "experience_pending"],
  address_proof_pending: ["address_proof_completed", "rejected"],
  address_proof_completed: ["experience_pending"],
  experience_pending: ["experience_completed"],
  experience_completed: ["agreement_pending"],
  agreement_pending: ["agreement_completed"],
  agreement_completed: ["submitted"],
  submitted: ["under_review", "approved", "rejected"],
  under_review: ["approved", "rejected", "supplemental_required"],
  approved: [],                          // 终态
  rejected: ["not_started"],             // 可重新提交
  supplemental_required: ["submitted"],  // 补件后重新提交
};
```

---

## 五、步骤守卫（Guard）设计

### 5.1 服务端 Guard（guard.ts）

```typescript
type StepName = "region" | "document" | "liveness" | "address-proof" | "experience" | "agreement";

/** 根据地区配置返回启用的步骤列表 */
function getEnabledSteps(regionCode: RegionCode | null): StepName[] {
  if (!regionCode) return ["region"];
  const cfg = getRegionConfig(regionCode);
  const steps: StepName[] = [
    "region",
    "document",
    "liveness",
  ];
  if (cfg.features.addressProofRequired) steps.push("address-proof");
  steps.push("experience", "agreement");
  return steps;
}

/** 检查某步骤是否完成 */
function isStepComplete(step: StepName, kycData: Partial<UserKYC>): boolean {
  switch (step) {
    case "region":        return !!kycData?.regionCode;
    case "document":      return !!(kycData?.ocrData && kycData?.personalInfo);
    case "liveness":      return !!kycData?.livenessPassed || !getRegionConfig(kycData?.regionCode!).features.livenessRequired;
    case "address-proof": return !!kycData?.addressProofUrl || !getRegionConfig(kycData?.regionCode!).features.addressProofRequired;
    case "experience":    return !!kycData?.experienceInfo;
    case "agreement":     return !!(kycData?.agreementsSigned && kycData.agreementsSigned.length > 0);
    default:              return false;
  }
}

/** 检查步骤权限 */
function checkStepPermission(targetStep: StepName, regionCode: RegionCode | null, kycData: Partial<UserKYC> | null): GuardResult {
  if (targetStep === "region") return { allowed: true, message: "OK" };
  if (!regionCode) return { allowed: false, missingStep: "region", message: "请先选择地区" };

  const steps = getEnabledSteps(regionCode);
  for (const step of steps) {
    if (step === targetStep) break;
    if (!isStepComplete(step, kycData || {})) {
      return { allowed: false, missingStep: step, message: `请先完成"${step}"步骤` };
    }
  }
  return { allowed: true, message: "OK" };
}
```

### 5.2 客户端 Guard Hook（guard-client.ts）

```typescript
const STEP_ROUTES: Record<StepName, string> = {
  region:        "/portal/kyc",
  document:      "/portal/kyc/document",
  liveness:      "/portal/kyc/liveness",
  "address-proof": "/portal/kyc/address-proof",
  experience:    "/portal/kyc/experience",
  agreement:     "/portal/kyc/agreements",
};

function useKYCGuard(targetStep: StepName): GuardResult {
  // 600ms 超时后备，避免 hasHydrated 不触发导致无限 loading
  useEffect(() => {
    const timer = setTimeout(() => {
      if (checking) {
        // 超时后直接使用当前状态检查
        const result = checkStepPermission(targetStep, regionCode, kycData);
        setAllowed(result.allowed);
        if (!result.allowed) setRedirectTo(STEP_ROUTES[result.missingStep!]);
        setChecking(false);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [checking]);
}
```

---

## 六、Store 设计（Zustand + Persist）

```typescript
interface KYCState {
  kycData: Partial<UserKYC> | null;
  currentStep: number;
  currentStepName: StepName;
  regionCode: RegionCode | null;
  isLoading: boolean;
  error: string | null;
  hasHydrated: boolean;

  // Actions
  setRegion: (region: RegionCode) => void;
  updateKYCData: (data: Partial<UserKYC>) => void;
  setCurrentStepName: (name: StepName) => void;
  setOCRResult: (result: OCRResult, personalInfo: PersonalInfo) => void;
  setLivenessResult: (passed: boolean, videoUrl?: string) => void;
  setAddressProof: (url: string, type: string) => void;
  setExperienceInfo: (info: ExperienceInfo) => void;
  setAgreementSignatures: (signatures: AgreementSignature[], type?: "handwritten" | "text") => void;

  // 流程控制（动态）
  getEnabledSteps: () => StepName[];
  getNextStep: (fromStep?: StepName) => StepName | null;
  getPrevStep: (fromStep?: StepName) => StepName | null;
  getProgress: () => number;
}
```

**关键修复（vs 现状）：**
- `getEnabledSteps()` 不再硬编码，而是读取 `regionConfig` 动态计算
- `getNextStep()` / `getPrevStep()` 基于 `getEnabledSteps()` 数组索引计算
- 页面 mount 时同步 `setCurrentStepName()`，确保导航正确
- `setAddressProof` / `setExperienceInfo` 不再是 no-op

---

## 七、页面路由结构

### 7.1 Portal 前台路由

```
/portal/kyc                          → Step 1: 选择居住地
/portal/kyc/document                 → Step 2: 证件上传 + OCR + 信息确认
/portal/kyc/liveness                 → Step 3: 活体检测（条件显示）
/portal/kyc/address-proof            → Step 4: 地址证明（条件显示）
/portal/kyc/experience               → Step 5: 个人经验
/portal/kyc/agreements               → Step 6: 协议签署
/portal/kyc/status                   → 审核状态查看
```

### 7.2 CRM 后台路由

```
/crm/compliance/kyc-review           → KYC 审核工作台（待审队列）
/crm/compliance/kyc-review/:id       → 单个用户 KYC 审核详情
/crm/compliance/kyc-levels           → KYC 等级配置
/crm/risk/blacklist                  → 黑白名单管理
/crm/customers                       → 客户列表（含 KYC 状态）
/crm/customers/:id                   → 客户详情（KYC 档案、审核历史）
```

---

## 八、API 设计

### 8.1 前台 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/kyc/config?region=VN` | 获取地区 KYC 配置 |
| POST | `/api/kyc/document` | 上传证件 |
| POST | `/api/kyc/ocr` | OCR 识别 |
| POST | `/api/kyc/ocr/confirm` | 确认 OCR 结果（含 personalInfo） |
| POST | `/api/kyc/liveness` | 活体检测 |
| POST | `/api/kyc/address-proof` | 上传地址证明 |
| POST | `/api/kyc/experience` | 提交个人经验 |
| POST | `/api/kyc/agreements` | 提交协议签署 |
| POST | `/api/kyc/submit` | 提交 KYC 审核 |
| GET | `/api/kyc/status` | 获取 KYC 状态 |
| GET | `/api/kyc/review?status=submitted` | 获取审核列表（CRM） |

### 8.2 后台 API（CRM）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/crm/kyc/review` | 待审/已审队列 |
| GET | `/api/crm/kyc/review/:id` | 审核详情 |
| POST | `/api/crm/kyc/review/:id/approve` | 通过审核 |
| POST | `/api/crm/kyc/review/:id/reject` | 拒绝审核 |
| POST | `/api/crm/kyc/review/:id/supplemental` | 要求补件 |
| GET | `/api/crm/kyc/stats` | KYC 统计看板 |

---

## 九、前后台功能映射

### 9.1 前台 Portal（终端用户）

| 模块 | 功能点 | 优先级 |
|------|--------|--------|
| 居住地选择 | 9 地区下拉选择，显示该地区认证要求 | P0 |
| 证件认证 | 证件类型选择（按地区）→ 正反面上传 → OCR → 信息确认/编辑 | P0 |
| 活体检测 | 摄像头检测，眨眼+摇头，3 次重试 | P0 |
| 地址证明 | 条件显示，上传水电账单/银行对账单等 | P0 |
| 个人经验 | 财务/就业/交易/学历/声明，按地区配置动态渲染 | P0 |
| 协议签署 | 协议阅读+滚动检测，手写/文本签名 | P0 |
| KYC 进度看板 | 可视化进度条，审核状态实时更新 | P0 |
| 补件中心 | 待补件列表，精确补件指引 | P1 |
| 通知中心 | 审核通知、补件提醒、等级变更 | P1 |

### 9.2 后台 CRM（运营管理）

| 角色 | 模块 | 功能点 | 优先级 |
|------|------|--------|--------|
| 审核员 | 待审队列 | KYC 待审/补件待审，智能排序，路由分配 | P0 |
| 审核员 | 审核操作 | 通过/拒绝/驳回补件，审核批注，风险标记 | P0 |
| 审核员 | 客户档案 | 完整 KYC 资料，历史审核记录，设备信息 | P0 |
| 风控经理 | 黑白名单 | 用户/设备/IP/银行卡/钱包黑名单，白名单 VIP | P0 |
| 风控经理 | 风险评分 | 实时风险分布，高风险客户列表，评分趋势 | P0 |
| 合规官 | 审计日志 | 全量操作记录，变更追踪，时间轴展示 | P0 |
| 合规官 | KYC 等级 | 等级定义配置，手动升降级，等级与权限映射 | P0 |
| 系统管理员 | 审核流配置 | 流程设计器，审核节点配置，SLA 设置 | P0 |
| 系统管理员 | 表单字段配置 | KYC 字段定义，国家差异化配置，必填/可选规则 | P0 |

---

## 十、组件设计

### 10.1 新增/保留组件

| 组件 | 类型 | 职责 |
|------|------|------|
| `RegionSelector` | 页面级 | 地区选择卡片，显示各地区的 KYC 要求预览 |
| `DocumentUpload` | 页面级 | 证件类型选择 + 正反面拖拽上传 + 实时预览 |
| `OCRResultEditor` | 组件 | OCR 结果展示 + 字段编辑 + 确认/重拍 |
| `LivenessCheck` | 页面级 | 活体检测 UI（调用底层 SDK） |
| `AddressProofUpload` | 页面级 | 地址证明文件上传（水电账单/银行对账单/政府信件） |
| `ExperienceForm` | 页面级 | 多步骤表单容器，根据 regionConfig 动态渲染字段 |
| `AgreementSign` | 页面级 | 协议列表 + 滚动阅读检测 + 签名方式切换 |
| `SignaturePad` | 组件 | Canvas 手写签名板 |
| `TextSignature` | 组件 | 文本签名输入框 |
| `KYCProgressBar` | 组件 | 动态进度条，根据 `getEnabledSteps()` 计算 |
| `KYCNavigation` | Hook | `useKYCNavigation` — 封装 goNext/goBack/goToStep |

### 10.2 删除组件

| 文件 | 原因 |
|------|------|
| `ocr-confirm/page.tsx` | 功能已合并到 document 内联流程 |
| `personal-info/page.tsx` | 新流程中个人信息确认已合并到 Step 2 |

---

## 十一、DevTools 支持

| 功能 | 实现 |
|------|------|
| OCR Mock | `dev-fetch.ts` 本地 mock，支持置信度调节 / 模拟错误 |
| Liveness Mock | `dev-mock-config.ts` 控制通过率 / 强制结果 |
| Review Mock | 支持强制 approve/reject/supplemental |
| 地区切换 | KYC Dev Panel 中切换 9 个地区，实时观察流程差异 |
| 状态重置 | 一键重置 KYC 状态到 not_started |
| 数据填充 | 一键填充各步骤的 mock 数据，快速跳转到最后一步 |

---

## 十二、实施计划（分 5 个 Phase）

### Phase 1: 基础结构调整（核心）

**目标**：修复 Guard/Store 的动态化，打通 6 步流程骨架

| # | 任务 | 文件 |
|---|------|------|
| 1.1 | 更新 `StepName` 类型，新增 `address-proof` / `experience` | `guard.ts`, `types.ts` |
| 1.2 | `getEnabledSteps()` 动态读取 regionConfig | `guard.ts`, `store.ts` |
| 1.3 | `isStepComplete()` 新增 address-proof / experience 判断 | `guard.ts` |
| 1.4 | `store.ts` 修复 `setAddressProof` / `setExperienceInfo` 为有效实现 | `store.ts` |
| 1.5 | 新增 `setCurrentStepName` action，页面 mount 时同步 | `store.ts` |
| 1.6 | `getNextStep()` / `getPrevStep()` 基于 enabledSteps 索引计算 | `store.ts` |
| 1.7 | Guard Client 600ms 超时后备 | `guard-client.ts` |
| 1.8 | 状态机新增 `address_proof_pending` / `address_proof_completed` / `experience_pending` / `experience_completed` | `state-machine.ts` |

### Phase 2: Step 2 重构（证件认证 + OCR 合并）

| # | 任务 | 文件 |
|---|------|------|
| 2.1 | Document 页面整合 OCR 确认逻辑（stage: upload → confirming → done） | `document/page.tsx` |
| 2.2 | 确保 `handleConfirm` 同时写入 `ocrData` + `personalInfo` | `document/page.tsx` |
| 2.3 | 删除 `ocr-confirm/page.tsx` | — |
| 2.4 | 删除 `personal-info/page.tsx` | — |
| 2.5 | 更新 `OCRResultEditor` 组件，适配合并流程 | `OCRResultEditor.tsx` |

### Phase 3: Step 4 地址证明（新增）

| # | 任务 | 文件 |
|---|------|------|
| 3.1 | 新建 `address-proof/page.tsx` | 新建 |
| 3.2 | 新建 `AddressProofUpload` 组件 | 新建 |
| 3.3 | 实际上传 API（调用 `/api/kyc/address-proof`） | 新建 |

### Phase 4: Step 5 个人经验（增强）

| # | 任务 | 文件 |
|---|------|------|
| 4.1 | 新建 `experience/page.tsx` | 新建 |
| 4.2 | 新建 `ExperienceForm` 组件，根据 `regionConfig.formFields` 动态渲染 | 新建 |
| 4.3 | 复用 `form-schemas.ts` 中的 schema | `form-schemas.ts` |
| 4.4 | 支持声明子表单的动态显示/隐藏 | `ExperienceForm.tsx` |

### Phase 5: 统一导航 + 进度条 + 回归测试

| # | 任务 | 文件 |
|---|------|------|
| 5.1 | 新建 `useKYCNavigation` hook | 新建 |
| 5.2 | 所有 KYC 页面统一使用 `useKYCNavigation` | 所有 page.tsx |
| 5.3 | Progress Bar 动态化 | 所有 page.tsx |
| 5.4 | 修复各页面的硬编码跳转 | liveness, experience, agreements |
| 5.5 | 完整回归测试：9 个地区 × 6 步流程 | — |

---

## 十三、测试矩阵

| 测试项 | VN | TH | IN | AE | KR | JP | FR | ES | BR |
|--------|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| 地区选择 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 证件上传 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| OCR 识别 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 信息确认编辑 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 活体检测 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 地址证明 | ❌ | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ |
| 个人经验表单 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 声明动态显示 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 协议签署 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 自动审核 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 人工复核 | ❌ | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ |

---

## 十四、风险与注意事项

1. **数据迁移**：现有用户的 KYC 数据（在 `personal-info` 页面的）需要迁移到 `document` 步骤的 `personalInfo` 字段
2. **URL 变更**：删除 `ocr-confirm` 和 `personal-info` 页面，需要确认无外部链接指向这些 URL
3. **状态机兼容性**：新增的状态（`address_proof_pending` 等）需要确保旧数据不会触发异常
4. **地区配置扩展**：新地区接入时只需在 `region-config.ts` 中新增配置，无需改代码
5. **性能**：`getEnabledSteps()` 在多个地方调用，避免重复计算（可缓存）

---

*本文档综合了 6 份原始文档的全部内容，作为 KYC 系统重构的唯一方案来源。*
