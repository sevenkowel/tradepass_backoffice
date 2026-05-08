# TradePass KYC 开户流程方案文档

> 版本：v1.0 | 日期：2026-05-07 | 状态：基于 `a695083`（Phase 5）现状评审

---

## 一、设计目标

构建一个**地区化、可配置、防跳过**的 6 步 KYC 开户流程：

1. **选择居住地** — 不同地区可配置不同的 KYC 流程（步骤组合、证件类型、表单字段）
2. **证件认证** — 上传证件（护照/身份证/驾驶证）+ OCR 识别 + 个人信息确认
3. **活体认证** — 人脸识别（部分地区可选）
4. **地址证明** — 上传地址证明文件（部分地区要求）
5. **个人经验** — 财务、就业、交易经验、学历、专业知识、声明等
6. **协议签署** — 支持手写签名或输入姓名签名

---

## 二、当前实现现状

### 2.1 文件结构

```
src/app/portal/kyc/
├── page.tsx              # Step 1: 地区选择
├── document/page.tsx     # Step 2: 证件上传 + 内联 OCR 确认
├── ocr-confirm/page.tsx  # Step 2 备选: 独立 OCR 确认页（功能重复）
├── liveness/page.tsx     # Step 3: 活体检测
├── address-proof/page.tsx# Step 4: 地址证明
├── experience/page.tsx   # Step 5: 个人经验
├── agreements/page.tsx   # Step 6: 协议签署
├── personal-info/page.tsx# 遗留页面：详细个人信息表单（新流程中已合并到 Step 2）
└── status/page.tsx       # KYC 状态查询 + 补充验证
```

### 2.2 核心模块

| 模块 | 文件 | 职责 |
|---|---|---|
| Store | `src/lib/kyc/store.ts` | Zustand + persist，管理 kycData / currentStep / regionCode |
| Guard | `src/lib/kyc/guard.ts` | 服务端/客户端通用步骤权限检查 |
| Guard Hook | `src/lib/kyc/guard-client.ts` | `useKYCGuard` — 客户端步骤守卫 + 自动重定向 |
| 地区配置 | `src/lib/kyc/region-config.ts` | 9 地区配置（VN/TH/IN/AE/KR/JP/FR/ES/BR） |
| 类型定义 | `src/lib/kyc/types.ts` | UserKYC / OCRResult / PersonalInfo / ExperienceInfo / AgreementSignature |
| Dev Mock | `src/lib/kyc/dev-fetch.ts` | 本地 mock OCR / save-step API |
| Dev Config | `src/lib/kyc/dev-mock-config.ts` | Zustand store 控制 mock 行为 |

### 2.3 已实现的组件

| 组件 | 功能 |
|---|---|
| `DocumentUpload` | 证件类型选择 + 拖拽上传（正反面） |
| `OCRResultEditor` | OCR 结果展示 + 字段编辑 + 确认/重拍 |
| `LivenessCheck` | 活体检测 UI（调用底层 SDK） |
| `AgreementSign` | 协议列表 + 滚动阅读检测 + 签名（文字/手写） |
| `SignaturePad` | Canvas 手写签名板 |
| `PersonalInfoForm` | 地区化动态表单（根据 region-config 渲染字段） |

---

## 三、问题诊断（阻断性 + 架构性）

### 🔴 阻断性问题（导致流程无法走通）

#### 问题 1: OCR 确认页跳转回 document（已暴露）

**现象**：用户在 `/portal/kyc/ocr-confirm` 点击「确认并继续」后，被重定向回 `/portal/kyc/document`。

**根因**：
- `guard.ts` 检查 `document` 步骤完成的条件是 `!!(kycData.ocrData && kycData.personalInfo)`
- `ocr-confirm/page.tsx` 的 `handleConfirm` 只执行了 `updateKYCData({ ocrData: result.data, status: "ocr_completed" })`，**漏写 `personalInfo`**
- 跳转到 `liveness` 后，`useKYCGuard("liveness")` 发现前置的 `document` 步骤未完成（缺少 `personalInfo`），将用户踢回 `document`

**对比**：`document/page.tsx` 的 `handleConfirm` 同时构造了 `personalInfo` 并写入，所以内联确认能正常通过。

#### 问题 2: `getNextStep()` 返回错误的下一步

**根因**：
- `store.ts` 的 `getNextStep()` 基于 `get().currentStepName` 计算索引
- `currentStepName` 初始值为 `"region"`，**整个流程中从未被更新**（`setCurrentStep` 只更新数字 `currentStep`，不更新字符串 `currentStepName`）
- 因此 `getNextStep()` 永远从 `"region"` 开始找，返回 `"document"`

**影响**：
- `document/page.tsx` 使用 `getNextStep()` 跳转，如果当前步骤不是 region，会跳回 document
- 同样影响 liveness 等使用 `getNextStep()` 的地方

#### 问题 3: `ocr-confirm` 与 `document` 页面功能重复但行为不一致

- `document/page.tsx` 内联了完整的 upload → OCR → confirm → done 流程（stage: upload/confirming/done）
- `ocr-confirm/page.tsx` 是独立的确认页面，供从 document 跳转过来使用
- **两者共用 `OCRResultEditor` 组件，但 `onConfirm` 回调逻辑不同**：document 页写 personalInfo，ocr-confirm 页不写
- 这导致走不同路径（内联确认 vs 独立页面确认）会产生不同的数据状态

#### 问题 4: 硬编码跳转路由 vs 动态流程不匹配

| 页面 | 硬编码跳转目标 | 新流程期望目标 | 问题 |
|---|---|---|---|
| `liveness/page.tsx` | `/portal/kyc/personal-info` | 应为动态计算 | `personal-info` 在新流程中不是独立步骤 |
| `agreements/page.tsx` back | `/portal/kyc/personal-info` | 应为 `/portal/kyc/experience` | 死链 |
| `experience/page.tsx` | `/portal/kyc/agreements` | 未考虑 address-proof | 若地区需 address-proof，会跳过它 |
| `personal-info/page.tsx` | `/portal/kyc/agreements` | — | 使用 `useKYCGuard("experience")`，guard 参数不匹配 |

#### 问题 5: Guard Hook 无 hydration 超时后备

- `guard-client.ts` 依赖 `hasHydrated` 状态
- Zustand persist 的 `onRehydrateStorage` 回调在某些情况下不触发
- 无超时后备机制，页面可能**无限显示 loading spinner**

---

### 🟡 架构性问题（影响可维护性）

#### 问题 6: `personal-info/page.tsx` 在新流程中的定位模糊

- 新 6 步流程将「个人信息确认」合并到了 Step 2（document）的 OCR 确认环节
- 但 `personal-info/page.tsx` 仍然存在，它是一个更详细的表单（`PersonalInfoForm` 组件）
- 该页面使用 `useKYCGuard("experience")` 做守卫，但 `"experience"` 不是 `"personal-info"`
- 实际上没有任何页面跳转到 `personal-info`，它是死代码还是备用方案不明确

#### 问题 7: 各页面的 Progress Bar 是硬编码的

- document/liveness/personal-info/agreements 的 progress bar 都是写死的 4 步（Document → Liveness → Personal Info → Agreement）
- 未根据地区动态调整：如需 address-proof，进度条不会反映额外步骤
- Step label 也是硬编码英文

#### 问题 8: Address Proof 页面仅做前端 FileReader

- `address-proof/page.tsx` 用 `FileReader.readAsDataURL()` 转 base64 后直接 `setAddressProof(url, file.type)`
- 没有实际上传到服务器，刷新页面后数据丢失（虽然 persist store 会保留，但不符合真实流程）

#### 问题 9: Experience 页面表单过于简化

-  employment/trading experience/financial 等字段用原生 `<select>`/`<input>`，未使用统一表单组件
- 地区配置 `formFields` 中定义了丰富的字段（pepDeclaration / usPersonDeclaration / professionalDeclaration 等），但页面中全部硬编码为默认值
- `regionConfig` 读取了但未根据配置动态渲染表单字段

---

## 四、改进方案

### 方案 A: 精简路线（推荐）

**核心思路**：去掉 `ocr-confirm` 独立页面和 `personal-info` 遗留页面，以 `document/page.tsx` 的内联流程为唯一路径。统一跳转逻辑，修复 guard 和 store 的协同问题。

#### 4.1 页面路由精简

```
src/app/portal/kyc/
├── page.tsx              # Step 1: 地区选择（保留）
├── document/page.tsx     # Step 2: 证件上传 + OCR + 信息确认（唯一入口）
├── liveness/page.tsx     # Step 3: 活体检测（保留）
├── address-proof/page.tsx# Step 4: 地址证明（条件显示）
├── experience/page.tsx   # Step 5: 个人经验（保留，需增强）
├── agreements/page.tsx   # Step 6: 协议签署（保留）
├── status/page.tsx       # 状态查询（保留）
└── ocr-confirm/page.tsx  # ❌ 删除（功能已合并到 document）
└── personal-info/page.tsx# ❌ 删除（遗留页面，功能已合并）
```

#### 4.2 Store 修复

**修复 `getNextStep()`**：不再依赖 `currentStepName`，改为从当前步骤路由名推导：

```ts
// store.ts
getNextStep: (currentStepName?: string) => {
  const steps = get().getEnabledSteps();
  const current = currentStepName || get().currentStepName;
  const currentIdx = steps.indexOf(current);
  if (currentIdx >= 0 && currentIdx < steps.length - 1) {
    return steps[currentIdx + 1];
  }
  return null;
}
```

**或更简单的方案**：页面组件在跳转时不使用 `getNextStep()`，直接根据 `getEnabledSteps()` 数组找索引：

```ts
const steps = useKYCStore.getState().getEnabledSteps();
const currentIdx = steps.indexOf("document"); // 当前页面名
const nextStep = steps[currentIdx + 1];
router.push(`/portal/kyc/${nextStep}`);
```

**在页面跳转时同步更新 `currentStepName`**：

```ts
// 在每个页面 mount 时
setCurrentStepName("document"); // 或其他步骤名
```

#### 4.3 统一跳转逻辑

所有页面的「下一步」和「返回」统一使用动态计算：

```ts
// 通用跳转辅助函数（可提取到 hooks）
function useKYCNavigation() {
  const router = useRouter();
  const { getEnabledSteps } = useKYCStore();

  const goToStep = (stepName: StepName) => {
    router.push(`/portal/kyc/${STEP_ROUTES[stepName]}`);
  };

  const goNext = (currentStep: StepName) => {
    const steps = getEnabledSteps();
    const idx = steps.indexOf(currentStep);
    if (idx >= 0 && idx < steps.length - 1) {
      goToStep(steps[idx + 1]);
    }
  };

  const goBack = (currentStep: StepName) => {
    const steps = getEnabledSteps();
    const idx = steps.indexOf(currentStep);
    if (idx > 0) {
      goToStep(steps[idx - 1]);
    }
  };

  return { goToStep, goNext, goBack };
}
```

#### 4.4 Guard 修复

**修复 `guard-client.ts`**：
- 添加 600ms 超时后备（今天已验证有效）
- 在超时分支中直接执行权限检查，避免 `hasHydrated` 不触发导致的无限 loading

**修复 `guard.ts` 的 `isStepComplete`**：
- 确保 `document` 步骤的完成条件与数据写入逻辑一致
- 如果 OCR 确认时写入 `personalInfo`，则条件 `!!(kycData.ocrData && kycData.personalInfo)` 是正确的，不需要改
- **只需要确保所有写数据的地方都同步写 `personalInfo`**

#### 4.5 删除重复页面

- 删除 `ocr-confirm/page.tsx`（功能已合并到 document 内联流程）
- 删除 `personal-info/page.tsx`（新流程中已合并到 document 步骤）
- 如有需要保留详细个人信息表单，可将其作为 `experience` 步骤的一部分，或作为补充 KYC 流程调用

#### 4.6 Experience 页面增强

- 根据 `regionConfig.formFields` 动态渲染表单字段
- 使用统一的表单组件（如 React Hook Form + 自定义字段组件）
- 支持以下模块的完整配置：
  - `personalInfo`（基础信息）
  - `education`（教育背景）
  - `investmentExperience`（投资经验）
  - `financialStatus`（财务状况）
  - `pepDeclaration`（政治人物声明）
  - `usPersonDeclaration`（美国人士声明）
  - `professionalDeclaration`（专业人士声明）
  - `militaryDeclaration`（军事人员声明）

#### 4.7 Progress Bar 动态化

- 每个页面根据 `getEnabledSteps()` 动态渲染进度条
- 步骤标签支持 i18n
- 示例：

```tsx
const steps = getEnabledSteps();
const currentIdx = steps.indexOf("liveness");
const progress = ((currentIdx + 1) / steps.length) * 100;
```

---

### 方案 B: 保留双路径（不推荐）

保留 `document` 内联确认 和 `ocr-confirm` 独立页面两条路径，但强制要求两者在 `handleConfirm` 中的数据写入逻辑完全一致。

**缺点**：维护成本高，容易再次出现两边逻辑不一致的 bug。

---

## 五、修改清单（按优先级）

### P0 — 阻断修复（必须立即修）

| # | 文件 | 修改内容 |
|---|---|---|
| 1 | `src/app/portal/kyc/ocr-confirm/page.tsx` | **删除该文件**（功能已合并到 document） |
| 2 | `src/app/portal/kyc/personal-info/page.tsx` | **删除该文件**（遗留页面） |
| 3 | `src/lib/kyc/guard-client.ts` | 添加 600ms 超时后备（今天已验证） |
| 4 | `src/lib/kyc/store.ts` | 在每个 `set*Result` action 中同步更新 `currentStepName`；或页面 mount 时更新 |
| 5 | `src/app/portal/kyc/document/page.tsx` | 确认 `handleConfirm` 中写 `personalInfo` 的逻辑是唯一且正确的 |
| 6 | `src/app/portal/kyc/liveness/page.tsx` | 跳转从硬编码 `/personal-info` 改为动态计算下一步 |
| 7 | `src/app/portal/kyc/agreements/page.tsx` | back 按钮从 `/personal-info` 改为动态计算上一步 |
| 8 | `src/app/portal/kyc/experience/page.tsx` | 跳转从硬编码 `/agreements` 改为动态计算下一步 |

### P1 — 架构优化（提升可维护性）

| # | 文件 | 修改内容 |
|---|---|---|
| 9 | 新建 `src/lib/kyc/use-kyc-navigation.ts` | 提取统一的 `useKYCNavigation` hook，封装 goNext/goBack/goToStep |
| 10 | 所有 KYC page.tsx | 统一使用 `useKYCNavigation` 替代硬编码路由 |
| 11 | 所有 KYC page.tsx | Progress Bar 改为基于 `getEnabledSteps()` 动态渲染 |
| 12 | `src/app/portal/kyc/address-proof/page.tsx` | 实际上传文件到服务器（调用 API），而非仅前端 FileReader |
| 13 | `src/app/portal/kyc/experience/page.tsx` | 根据 `regionConfig.formFields` 动态渲染表单 |

### P2 — 体验优化

| # | 文件 | 修改内容 |
|---|---|---|
| 14 | `src/app/portal/kyc/status/page.tsx` | Progress 步骤从硬编码 4 步改为基于 `getEnabledSteps()` |
| 15 | `src/app/portal/kyc/experience/page.tsx` | 使用统一表单组件替代原生 select/input |
| 16 | `src/lib/kyc/region-config.ts` | 补充缺失的 `idNumberPattern` / `idNumberExample`（FR 缺） |

---

## 六、流程状态机（修复后）

```
not_started
  │ 用户选择地区
  ▼
region_selected ──→ /portal/kyc/document
  │ 上传证件 + OCR + 确认信息（含 personalInfo）
  ▼
ocr_completed ──→ /portal/kyc/liveness
  │ 活体检测（或跳过，如果地区不要求）
  ▼
liveness_completed
  │
  ├─ 地区要求 address-proof ──→ /portal/kyc/address-proof
  │                              │ 上传地址证明
  │                              ▼
  │                           address_proof_completed
  │                              │
  │                              ▼
  └─ 不要求 address-proof ──→ /portal/kyc/experience
                                │ 填写个人经验
                                ▼
                             experience_completed ──→ /portal/kyc/agreements
                                │ 签署协议
                                ▼
                             agreement_pending ──→ submitted
                                │ 提交审核
                                ▼
                             under_review / approved / rejected
```

---

## 七、DevTools 支持

当前已实现的开发调试能力（保留并继续完善）：

| 功能 | 实现 |
|---|---|
| OCR Mock | `dev-fetch.ts` 本地 mock，支持置信度调节 / 模拟错误 |
| Liveness Mock | `dev-mock-config.ts` 控制通过率 / 强制结果 |
| Review Mock | 支持强制 approve/reject |
| FloatingDevToolbox | 悬浮工具箱，集成 KYC Dev Panel |
| KYC Dev Panel | OCR 配置 / 活体配置 / 审核配置 / 地区切换 |

---

## 八、下一步行动

1. **确认方案**：选择方案 A（精简路线）或方案 B（保留双路径）
2. **确认删除**：是否同意删除 `ocr-confirm` 和 `personal-info` 页面
3. **执行 P0 修复**：按清单执行阻断性修复
4. **执行 P1 优化**：提取 `useKYCNavigation` hook，统一所有跳转逻辑
5. **回归测试**：完整走一遍所有 9 个地区的 KYC 流程
