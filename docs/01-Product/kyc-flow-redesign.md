# TradePass KYC 流程方案

> 基于现有实现的重构方案 — 聚焦地区化配置与灵活步骤编排

---

## 1. 全流程总览

```
[选择居住地] → [证件认证+信息确认] → [活体认证] → [地址证明] → [个人经验] → [协议签署] → [审核状态]
     Step 1           Step 2               Step 3       Step 4       Step 5       Step 6        Done
```

### 各步骤路由

| Step | 路径 | 职责 |
|---|---|---|
| 1 | `/portal/kyc` | 选择国家/地区，确定 KYC 所需步骤 |
| 2 | `/portal/kyc/document` | 上传证件 → OCR 识别 → 确认个人信息 |
| 3 | `/portal/kyc/liveness` | 活体检测（按地区配置可选） |
| 4 | `/portal/kyc/address-proof` | 地址证明上传（按地区配置可选） |
| 5 | `/portal/kyc/experience` | 财务/就业/交易/学历/专业知识声明 |
| 6 | `/portal/kyc/agreements` | 协议签署（手写签名或文本签名） |
| - | `/portal/kyc/status` | 提交状态查看 |

---

## 2. 地区化步骤编排

### 2.1 地区配置驱动

不同地区配置不同的 KYC 步骤和等级：

| 地区 | KYC 等级 | 证件类型 | 活体 | 地址证明 |
|---|---|---|---|---|
| VN 越南 | standard | 身份证, 护照 | ✅ | ❌ |
| TH 泰国 | standard | 身份证, 护照 | ✅ | ❌ |
| IN 印度 | enhanced | 身份证, 护照, 驾驶证 | ✅ | ✅ |
| AE 阿联酋 | enhanced | 身份证, 护照 | ✅ | ✅ |
| KR 韩国 | standard | 身份证, 护照, 驾驶证 | ✅ | ❌ |
| JP 日本 | standard | 身份证, 护照, 驾驶证 | ✅ | ❌ |
| FR 法国 | standard | 身份证, 护照, 驾驶证 | ✅ | ✅ |
| ES 西班牙 | standard | 身份证, 护照, 驾驶证 | ✅ | ✅ |
| BR 巴西 | standard | 身份证, 护照, 驾驶证 | ✅ | ❌ |

### 2.2 步骤动态编排

步骤守卫 (`KYCGuard`) 根据地区配置动态激活/跳过步骤：

```typescript
// 伪代码逻辑
function getStepsForRegion(regionCode): KYCStep[] {
  const cfg = getRegionConfig(regionCode);
  const steps = [
    StepConfig("region", true),          // 始终需要
    StepConfig("document", true),         // 始终需要
    StepConfig("liveness", cfg.features.livenessRequired),
    StepConfig("address-proof", cfg.features.addressProofRequired),
    StepConfig("experience", true),       // 始终需要
    StepConfig("agreements", true),       // 始终需要
  ];
  return steps.filter(s => s.enabled);
}
```

**进度条**: 根据实际激活的步骤数动态计算（4-6步），而非固定 4 步。

---

## 3. 步骤详细设计

### Step 1: 选择居住地（现有，基本不变）

**路径**: `/portal/kyc`

**功能**:
- 下拉选择国家/地区
- 显示该地区认证要求（需要的证件、活体、地址证明等）
- 点击"开始认证"进入下一步

**改动**: 无重大改动，补充地区要求说明即可。

---

### Step 2: 证件认证 + 信息确认（合并现有三步）

**路径**: `/portal/kyc/document`

现有流程是 Document → OCR Confirm → OCR 成功后才到 Liveness。新方案合并为：

```
[选择证件类型] → [上传正反面] → [OCR 识别] → [确认个人信息] → [下一步]
```

**子步骤**:

#### 2a. 选择证件类型
- 根据地区配置显示允许的证件类型（护照、身份证、驾驶证）
- 卡片式选择，展示证件图标 + 名称

#### 2b. 上传证件
- 上传正反面照片（支持相机/相册）
- 实时预览
- OCR 自动识别（调用 `/api/kyc/ocr`）

#### 2c. 确认个人信息（当前 OCR 确认页加强）
- OCR 识别结果显示 + 可编辑字段
- 包含必填信息：姓名、证件号、出生日期、国籍等
- 用户核对并修正后确认

**文件改动**:

| 文件 | 改动 |
|---|---|
| `src/app/portal/kyc/document/page.tsx` | 重构：整合 OCR 确认逻辑 |
| `src/app/portal/kyc/ocr-confirm/page.tsx` | 删除，合并到 document |
| `src/components/kyc/DocumentUpload.tsx` | 扩展：支持证件类型选择 |
| `src/components/kyc/OCRResultEditor.tsx` | 微调 UI，适配合并流程 |

---

### Step 3: 活体认证（现有，基本不变）

**路径**: `/portal/kyc/liveness`

**功能**:
- 摄像头实时检测
- 3 次尝试机会
- 按地区配置可选

**改动**: 无。

---

### Step 4: 地址证明（新增页面）

**路径**: `/portal/kyc/address-proof`

**功能**:
- 按地区配置决定是否显示
- 上传地址证明文件（水电账单、银行对账单、政府信件等）
- 有效期要求：3 个月内
- 支持文件类型：PDF / JPG / PNG

**触发条件**:
```typescript
const regionCfg = getRegionConfig(regionCode);
if (regionCfg.features.addressProofRequired) {
  // 显示此步骤
}
```

**新增文件**:

| 文件 | 职责 |
|---|---|
| `src/app/portal/kyc/address-proof/page.tsx` | 地址证明页面 |
| `src/components/kyc/AddressProofUpload.tsx` | 地址证明上传组件 |
| `src/app/api/kyc/address-proof/route.ts` | 地址证明 API |

---

### Step 5: 个人经验（聚合现有表单）

**路径**: `/portal/kyc/experience`

**功能**: 整合 5 个表单项，按地区配置启用：

| 表单项 | 说明 | 启用条件 |
|---|---|---|
| 财务信息 | 年收入、净资产、资金来源 | `formFields.financialStatus` |
| 就业信息 | 职业、雇主、职位 | `formFields.professionalDeclaration` |
| 交易经验 | 交易年限、交易频率、产品熟悉度 | `formFields.investmentExperience` |
| 教育背景 | 最高学历、专业领域 | `formFields.education` |
| 专业知识 | 金融知识自评、投资目标 | 始终启用 |

**现有资源**: `src/lib/kyc/form-schemas.ts` 已定义相关表单 schema，直接复用。

**新增文件**:

| 文件 | 职责 |
|---|---|
| `src/app/portal/kyc/experience/page.tsx` | 经验信息页面 |
| `src/components/kyc/ExperienceForm.tsx` | 多步骤表单容器 |

**可删除文件**:
- `src/app/portal/kyc/personal-info/page.tsx`（个人信息合并到 Step 2）

---

### Step 6: 协议签署（增强签名方式）

**路径**: `/portal/kyc/agreements`

**现有**:
- 纯文本协议展示
- 仅支持 checkbox 勾选

**增强**:
- 支持**两种签名方式**：
  - **手写签名**：Canvas 绘制 + 签名板组件
  - **文本签名**：输入框输入姓名（如 "John Doe"）

```
┌──────────────────────────┐
│  协议内容（滚动查看）     │
│                          │
│  [ ] 我已阅读并同意       │
│                          │
│  签名方式:                │
│  ○ 手写签名  ○ 文本签名  │
│                          │
│  ┌──────────────────┐   │
│  │  在此签名区域     │   │
│  └──────────────────┘   │
│                          │
│  [提交申请]              │
└──────────────────────────┘
```

**新增文件**:

| 文件 | 职责 |
|---|---|
| `src/components/kyc/SignaturePad.tsx` | 手写签名 Canvas 组件 |
| `src/components/kyc/TextSignature.tsx` | 文本签名输入组件 |

---

## 4. 步骤守卫实现

### 4.1 Guard 逻辑更新

现有 `guard.ts` 的步骤映射已硬编码 4 步，需改为动态：

```typescript
const STEP_MAP: Record<StepName, number> = {
  region: 1,
  document: 2,
  liveness: 3,
  "address-proof": 4,
  experience: 5,
  agreements: 6,
};

function checkStepPermission(step: StepName, ...): GuardResult {
  const regionCfg = getRegionConfig(regionCode);
  const steps = getEnabledSteps(regionCfg);
  const currentIndex = steps.indexOf(step);

  // 检查前序所有步骤是否完成
  for (let i = 0; i < currentIndex; i++) {
    if (!isStepComplete(steps[i], kycData)) {
      return { allowed: false, missingStep: steps[i] };
    }
  }
  return { allowed: true };
}
```

### 4.2 步骤完成判断

```typescript
function isStepComplete(step: StepName, kycData): boolean {
  switch (step) {
    case "region":      return !!kycData?.regionCode;
    case "document":    return !!kycData?.ocrData && !!kycData?.personalInfo;
    case "liveness":    return !!kycData?.livenessPassed;
    case "address-proof": return !!kycData?.addressProofUrl;
    case "experience":  return !!kycData?.experienceInfo;
    case "agreements":  return !!kycData?.agreementsSigned?.length;
  }
}
```

---

## 5. 进度条适配

当前进度棒固定为 4 步，需改为动态步骤数：

```typescript
function getStepCount(regionCode): number {
  const cfg = getRegionConfig(regionCode);
  return 2  // region + document
    + (cfg.features.livenessRequired ? 1 : 0)
    + (cfg.features.addressProofRequired ? 1 : 0)
    + 2;  // experience + agreements
}
```

每个页面根据当前步骤序号和总步数计算百分比。

---

## 6. 文件改动清单

### 新增文件

| 文件 | 职责 |
|---|---|
| `src/app/portal/kyc/address-proof/page.tsx` | Step 4 地址证明 |
| `src/components/kyc/AddressProofUpload.tsx` | 地址证明上传组件 |
| `src/app/api/kyc/address-proof/route.ts` | 地址证明 API |
| `src/app/portal/kyc/experience/page.tsx` | Step 5 个人经验 |
| `src/components/kyc/ExperienceForm.tsx` | 经验表单容器 |
| `src/components/kyc/SignaturePad.tsx` | 手写签名 Canvas |
| `src/components/kyc/TextSignature.tsx` | 文本签名输入 |

### 修改文件

| 文件 | 改动 |
|---|---|
| `src/app/portal/kyc/document/page.tsx` | 整合 OCR 确认逻辑 |
| `src/components/kyc/DocumentUpload.tsx` | 扩展证件类型选择 |
| `src/components/kyc/OCRResultEditor.tsx` | 适配合并流程 |
| `src/app/portal/kyc/agreements/page.tsx` | 增强签名方式 |
| `src/components/kyc/AgreementSign.tsx` | 支持两种签名 |
| `src/lib/kyc/guard.ts` | 步骤守卫动态化 |
| `src/lib/kyc/guard-client.ts` | 客户端守卫同步更新 |
| `src/lib/kyc/types.ts` | 补充新字段类型 |
| `src/lib/kyc/store.ts` | 补充新步骤状态 |

### 删除文件

| 文件 | 原因 |
|---|---|
| `src/app/portal/kyc/ocr-confirm/page.tsx` | 合并到 document 页 |
| `src/app/portal/kyc/personal-info/page.tsx` | 拆分：基础信息→Step 2，经验→Step 5 |

---

## 7. 实施顺序

```
Phase 1: 基础结构调整
├── 步骤守卫动态化（guard.ts）
├── 进度条适配动态步数
└── Store 补充新字段

Phase 2: Step 2 重构
├── Document 页整合 OCR 确认
├── 删除 ocr-confirm 页
└── 个人信息确认嵌入 Document 流程

Phase 3: Step 4 地址证明（新增）
├── AddressProofUpload 组件
├── API 路由
└──── Portal 页面

Phase 4: Step 5 个人经验（新增）
├── ExperienceForm 聚合表单
├── 复用 form-schemas.ts
└── 删除 personal-info 页

Phase 5: Step 6 签名增强
├── SignaturePad 手写签名
├── TextSignature 文本签名
└── AgreementSign 集成
```
