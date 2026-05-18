# OCR 确认信息页优化方案

> 针对 `/portal/kyc/ocr-confirm`（及 `document` 内联确认）页面的改造方案

---

## 一、需求梳理

### 1.1 识别成功提示

**现状**：横幅展示 "高置信度 - 信息识别准确（置信度: 95%）"

**需求**：保留成功/警告/失败的状态提示，但**不展示具体置信度数字给用户**。置信度只用于系统内部判断（如 ≥0.9 绿色、0.8-0.9 黄色、<0.8 红色）。

### 1.2 字段数据填充

**现状**：护照的"护照号"和"签发国家"显示 "-"，因为 mock OCR 没返回这些字段

**需求**：mock OCR 按证件类型返回完整的对应字段，不再出现 "-"

### 1.3 姓名匹配度拦截

**现状**：用户修改姓名后点击「确认并继续」，直接提交，无前端拦截

**需求**：点击确认时，**前端实时计算**用户输入姓名与 OCR 原始识别姓名的相似度（Levenshtein Distance）。若相似度低于阈值（默认 0.8），弹窗拦截提示，不允许继续。

### 1.4 证件类型字段差异

**现状**：`field-config.ts` 已定义三种证件的字段配置，但 mock OCR 只返回通用字段

**需求**：mock OCR 按 `documentType` 返回该类型所需的全部字段。

---

## 二、当前字段配置 vs Mock 数据缺口

### 2.1 护照 (passport)

| 字段 key | 中文 label | 当前 mock | 目标 |
|---|---|---|---|
| fullName | 姓名 | ✅ 有 | 保留 |
| idNumber | 护照号 | ❌ 无（显示 "-"） | **补充 demo 数据** |
| nationality | 国籍 | ✅ 有 | 保留 |
| dateOfBirth | 出生日期 | ✅ 有 | 保留 |
| issuingCountry | 签发国家 | ❌ 无（显示 "-"） | **补充 demo 数据** |
| expiryDate | 有效期至 | ✅ 有 | 保留 |

### 2.2 身份证 (id_card)

| 字段 key | 中文 label | 当前 mock | 目标 |
|---|---|---|---|
| fullName | 姓名 | ✅ 有 | 保留 |
| idNumber | 身份证号 | ✅ 有（documentNumber） | 保留 |
| nationality | 国籍 | ✅ 有 | 保留 |
| dateOfBirth | 出生日期 | ✅ 有 | 保留 |
| gender | 性别 | ✅ 有 | 保留 |
| address | 地址 | ❌ 无 | **补充 demo 数据** |
| expiryDate | 有效期至 | ✅ 有 | 保留 |

### 2.3 驾驶证 (driving_license)

| 字段 key | 中文 label | 当前 mock | 目标 |
|---|---|---|---|
| fullName | 姓名 | ✅ 有 | 保留 |
| idNumber | 证件号 | ✅ 有（documentNumber） | 保留 |
| nationality | 国家 | ✅ 有 | 保留 |
| dateOfBirth | 出生日期 | ✅ 有 | 保留 |
| address | 地址 | ❌ 无 | **补充 demo 数据** |
| expiryDate | 有效期至 | ✅ 有 | 保留 |

---

## 三、改造方案

### 3.1 Mock OCR 增强 (`src/lib/kyc/dev-fetch.ts`)

按 `documentType` 返回差异化字段：

```ts
// 护照
if (docType === "passport") {
  return {
    fullName: mockName,
    idNumber: mockId,           // 护照号
    nationality: "Vietnam",
    dateOfBirth: "1990-01-01",
    issuingCountry: "Vietnam",  // 签发国家
    expiryDate: "2030-12-31",
    confidence: config.ocrConfidence,
  };
}

// 身份证
if (docType === "id_card") {
  return {
    fullName: mockName,
    idNumber: mockId,
    nationality: "Vietnam",
    dateOfBirth: "1990-01-01",
    gender: "M",
    address: "123 Nguyen Trai, District 1, Ho Chi Minh City",
    expiryDate: "2030-12-31",
    confidence: config.ocrConfidence,
  };
}

// 驾驶证
if (docType === "driving_license") {
  return {
    fullName: mockName,
    idNumber: mockId,
    nationality: "Vietnam",
    dateOfBirth: "1990-01-01",
    address: "123 Nguyen Trai, District 1, Ho Chi Minh City",
    expiryDate: "2028-06-15",
    confidence: config.ocrConfidence,
  };
}
```

### 3.2 置信度横幅改造 (`src/components/kyc/OCRResultEditor.tsx`)

去掉具体百分比展示，仅保留状态文案：

| 置信度区间 | 状态文案（中文） | 颜色 |
|---|---|---|
| ≥ 0.9 | 识别成功 · 信息识别准确 | 绿色 |
| 0.8 - 0.9 | 请核对信息 · 部分字段建议人工确认 | 黄色 |
| < 0.8 | 需要修正 · 识别结果可信度较低，请检查 | 红色 |

**删除代码**：`(置信度: {Math.round(result.confidence * 100)}%)`

### 3.3 姓名相似度校验（前端拦截）

在 `OCRResultEditor.tsx` 的 `handleConfirm` 中增加校验逻辑：

```ts
const handleConfirm = () => {
  // 1. 计算姓名相似度
  const originalName = result.fullName || "";
  const editedName = editedData.fullName || "";
  const { isValid, similarity, message } = validateNameSimilarity(
    originalName,
    editedName,
    0.8  // 阈值从 field-config 读取
  );

  if (!isValid) {
    // 展示拦截提示（弹窗或 inline error）
    setNameSimilarityError(message);
    return;
  }

  // 2. 原有确认逻辑
  const confirmData: Record<string, string> = {};
  fieldConfigs.forEach((config) => {
    confirmData[config.key] = editedData[config.key] ?? "";
  });
  onConfirm(confirmData as Partial<OCRResult>, editedFields);
};
```

**UI 表现**：
- 当用户修改姓名字段时，实时计算相似度，在姓名输入框旁展示相似度指示条（绿色/黄色/红色）
- 点击确认时若相似度不达标，姓名字段高亮红色 + inline error 提示，阻止提交

### 3.4 OCR 确认 API 改造 (`src/app/api/kyc/ocr/confirm/route.ts`)

如果存在该 API，确保后端也执行姓名相似度校验（双重校验）。如不存在，mock 层直接通过。

### 3.5 ocr-confirm 页面修复 (`src/app/portal/kyc/ocr-confirm/page.tsx`)

当前 `handleConfirm` 成功后只写 `ocrData` 和 `status`，**漏写 `personalInfo`**，导致 guard 将用户踢回 document。

修复：构造 `personalInfo` 一并 `updateKYCData`：

```ts
const personalInfo = {
  fullName: (result.data?.fullName || data.fullName || "") as string,
  dateOfBirth: (result.data?.dateOfBirth || data.dateOfBirth || "") as string,
  nationality: (result.data?.nationality || data.nationality || "") as string,
  phone: "",
  email: "",
  address: (result.data?.address || data.address || "") as string,
  city: "",
  country: regionCode || "",
} as PersonalInfo;

updateKYCData({ ocrData: result.data, personalInfo, status: "ocr_completed" });
```

---

## 四、改造范围

| # | 文件 | 修改类型 | 说明 |
|---|---|---|---|
| 1 | `src/lib/kyc/dev-fetch.ts` | 修改 | mock OCR 按证件类型返回完整字段 |
| 2 | `src/components/kyc/OCRResultEditor.tsx` | 修改 | 去掉置信度百分比；增加姓名相似度实时计算与拦截 |
| 3 | `src/app/portal/kyc/ocr-confirm/page.tsx` | 修改 | handleConfirm 补充 personalInfo 写入 |
| 4 | `src/app/portal/kyc/document/page.tsx` | 修改 | handleConfirm 补充姓名相似度校验（与 ocr-confirm 保持一致） |
| 5 | `src/components/kyc/OCRFieldEditable.tsx` | 可选修改 | 姓名字段旁增加相似度指示条 |

---

## 五、姓名相似度计算逻辑（已有，不需重写）

已有 `src/lib/kyc/validation/similarity.ts`：

- `levenshteinDistance(str1, str2)` — 编辑距离
- `calculateSimilarity(str1, str2)` — 归一化相似度 (0-1)
- `validateNameSimilarity(ocrName, userName, threshold)` — 返回 { isValid, similarity, message }
- `normalizeName(name)` — OCR 纠错归一化（0→O, 1→I, 5→S, 8→B）

**阈值**：默认 0.8（即 80% 相似度），可在 `field-config.ts` 的 `validationParams.similarityThreshold` 中配置。

---

## 六、Mock 数据示例（护照）

确认页展示效果：

```
┌─────────────────────────────────────────┐
│  ✅ 识别成功 · 信息识别准确                │
├─────────────────────────────────────────┤
│  [证件预览图]                             │
├─────────────────────────────────────────┤
│  识别信息确认           ●锁定  ●可编辑     │
│                                         │
│  姓名 (Full Name) *       护照号          │
│  ┌──────────────┐       ┌──────────────┐│
│  │ Tran Thi B   │       │ B12345678    ││  ← 可编辑  ← 锁定
│  └──────────────┘       └──────────────┘│
│                                         │
│  国籍          出生日期                    │
│  ┌──────────┐  ┌──────────────────┐     │
│  │ Vietnam  │  │ 1990年1月1日      │     │  ← 锁定    ← 锁定
│  └──────────┘  └──────────────────┘     │
│                                         │
│  签发国家       有效期至                  │
│  ┌──────────┐  ┌──────────────────┐     │
│  │ Vietnam  │  │ 2030年12月31日    │     │  ← 锁定    ← 锁定
│  └──────────┘  └──────────────────┘     │
│                                         │
│  [📷 重新拍摄]        [确认并继续 →]      │
└─────────────────────────────────────────┘
```

---

## 七、确认清单

请确认以下事项，确认后我立即执行：

- [ ] Mock 数据字段按上述三种证件类型配置是否满足需求？
- [ ] 姓名相似度阈值 0.8 是否合适？
- [ ] 置信度横幅不展示百分比，仅保留状态文案，是否正确？
- [ ] 姓名不匹配时的拦截方式：inline error（不弹窗）+ 阻止提交，是否接受？
- [ ] 身份证和驾驶证的字段配置是否需要调整？
