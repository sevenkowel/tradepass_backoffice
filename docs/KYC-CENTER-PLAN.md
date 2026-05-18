# CRM KYC Center 模块方案

> 版本：v1.0 | 日期：2026-05-08 | 状态：待确认

---

## 一、菜单结构（9 个子页面）

```
KYC Center
├── 审核操作区
│   ├── Review Queue          /crm/kyc/review
│   ├── Resubmission          /crm/kyc/resubmit
│   ├── Liveness Review       /crm/kyc/liveness-review
│   ├── POA Review            /crm/kyc/poa-review
│   └── Compliance Archive    /crm/kyc/archive
├── ─── 配置区 ───
│   ├── KYC Form Config       /crm/kyc/config
│   ├── KYC Levels            /crm/kyc/levels
│   ├── Review Policy         /crm/kyc/review-policy
│   └── Agreement Docs        /crm/kyc/agreements
```

---

## 二、子页面详细设计

### 2.1 Review Queue（审核队列）

**路由**: `/crm/kyc/review`
**权限**: `kyc.review`
**角色**: 审核员

**功能**:
- 三级 Tab 切换：Pending（待审核）/ Approved（已通过）/ Rejected（已拒绝）
- 表格列：UID / 姓名 / 地区 / 证件类型 / OCR 置信度 / 风险标记 / 提交时间 / SLA 状态
- 智能排序：超时优先、高风险优先
- 点击行 → 进入审核详情视图

**审核详情视图**（左/右/下三段布局）:
```
┌─ 左侧（用户资料）──┐  ┌─ 右侧（审核内容）────┐
│ 姓名 / UID          │  │ OCR 识别结果对照      │
│ 地区 / 证件类型      │  │ 证件正反面预览        │
│ KYC 等级            │  │ 活体视频（如有）      │
│ 风险评分            │  │ 地址证明（如有）      │
│ 提交时间            │  │ 个人信息表单          │
│                     │  │ 经验/声明信息         │
├─────────────────────┤  └──────────────────────┘
│ ┌─ 审核操作 ───────┐│
│ │ [通过] [拒绝] [要求补件] │
│ │ 审核批注: __________  │
│ │ 风险标记: □ AML □ PEP │
│ └───────────────────┘│
│ ┌─ 审核历史 ───────┐│
│ │ 2024-01-20: Approved by Admin │
│ └───────────────────┘│
└──────────────────────┘
```

---

### 2.2 Resubmission（补件审核）

**路由**: `/crm/kyc/resubmit`
**权限**: `kyc.resubmission`
**角色**: 审核员

**功能**:
- 补件类型筛选：身份证 / 自拍 / 地址证明 / 银行卡 / 视频认证 / 财富来源
- 超时标记（72h SLA）
- 自动提醒记录（已发/未发/已读）
- 点击进入补件详情 → 对比新旧文档

**补件详情**:
- 左侧：原始补件要求（审核员上次标注的问题）
- 右侧：用户新上传的文件预览
- 底部：通过/再次驳回操作

---

### 2.3 Liveness Review（活体审核）

**路由**: `/crm/kyc/liveness-review`
**权限**: `kyc.liveness`
**角色**: 审核员

**功能**:
- 活体检测记录列表：UID / 姓名 / 检测时间 / 动作 / 置信度 / 状态
- 点击进入视频播放器
- 支持逐帧查看（慢放/暂停）
- 标记可疑（疑似照片攻击、视频重放）
- 通过/驳回

---

### 2.4 POA Review（地址证明审核）

**路由**: `/crm/kyc/poa-review`
**权限**: `kyc.poa`
**角色**: 审核员

**功能**:
- 地址证明类型分类：水电账单 / 银行对账单 / 政府信件 / 其他
- 有效期检查（3 个月内）
- 文件预览（PDF / 图片）
- 与 OCR 地址比对（自动高亮不一致）
- 通过/驳回

---

### 2.5 Compliance Archive（合规档案）

**路由**: `/crm/kyc/archive`
**权限**: `kyc.archive`
**角色**: 合规官

**功能**:
- 按用户搜索，展示完整 KYC 档案
- 时间线视图：所有 KYC 活动按时间排列
- 内容包含：KYC 文件 / 审核记录 / 协议签署 / 风险评估 / 活体视频 / 聊天记录
- PDF 导出（一键生成合规报告，支持 CySEC/FCA/ASIC 格式）
- 审计留痕（不可篡改）

---

### 2.6 KYC Form Config（KYC 表单配置）

**路由**: `/crm/kyc/config`
**权限**: `kyc.config`
**角色**: 系统管理员
**现状**: 页面已存在（原 `system/kyc-config`），6 个 Tab

**功能（基于已有页面增强）**:

| Tab | 功能 |
|-----|------|
| Dashboard | 配置概览、地区统计、字段使用率 |
| Regions | 9 地区增删 + 每个地区的 KYC 参数配置（证件类型、活体、地址证明） |
| Stages | 认证阶段定义（6 步流程，每步可启用/禁用） |
| Tiers | KYC 等级体系（Tier0-4），等级与权限映射 |
| Fields | 表单字段编辑器（新增/编辑/删除字段，按地区差异化配置） |
| Settings | 全局 OCR 供应商、活体 SDK、文件限制等 |

---

### 2.7 KYC Levels（KYC 等级管理）

**路由**: `/crm/kyc/levels`
**权限**: `kyc.levels`
**角色**: 合规官 / 管理员

**功能**:
- 等级列表：Tier0（基础）/ Tier1（标准）/ Tier2（增强）/ Tier3（专业）/ Tier4（机构）
- 每个等级卡片展示：所需步骤、文件要求、权限范围
- 手动升降级操作（单个用户）+ 批量升降级
- 等级与权限映射可视化（如 Tier2 才有出金权限）

---

### 2.8 Review Policy（审核策略）

**路由**: `/crm/kyc/review-policy`
**权限**: `kyc.policy`
**角色**: 合规官 / 管理员

**功能**:

**自动审核**:
- 置信度阈值配置（OCR 置信度 ≥ 0.9 自动通过）
- 风险规则（AML 命中 → 强制转人工）
- 地区差异化策略（enhanced 地区强制人工）
- 模拟测试（输入 mock 数据，预测审核结果）

**手动审核路由**:
- 按国家/风险/VIP 分配审核员
- SLA 配置（标准 24h / 加急 4h）
- 超时告警阈值

---

### 2.9 Agreement Docs（协议文档管理）

**路由**: `/crm/kyc/agreements`
**权限**: `kyc.agreements`
**角色**: 合规官 / 管理员

**功能**:
- 协议列表：客户协议 / 风险披露 / 隐私政策 / AML 声明
- 每个协议的版本历史（v1 → v2 → v3）
- 协议编辑器（支持 Markdown）
- 强制重签触发规则（如：协议更新后 7 天内未签署 → 冻结账户）
- 多语言协议管理

---

## 三、数据依赖

| 页面 | 依赖数据 |
|------|----------|
| Review Queue | `UserKYC` + `OCRResult` + 证件文件 |
| Resubmission | `UserKYC` + 补件历史 |
| Liveness Review | 活体视频文件 + 检测结果 |
| POA Review | 地址证明文件 + 地址比对 |
| Compliance Archive | 全量 KYC 数据 + 审核日志 |
| KYC Form Config | `RegionKYCConfig` |
| KYC Levels | `KYCLevel` 定义 + 权限映射 |
| Review Policy | 审核策略 JSON + SLA 配置 |
| Agreement Docs | `KYCAgreement` + 版本历史 |

---

## 四、实施顺序

| Phase | 页面 | 说明 |
|-------|------|------|
| P0 | Review Queue + Resubmission | 核心审核工作流 |
| P0 | KYC Form Config | 已有页面，迁路由 + 增强 |
| P1 | Liveness Review + POA Review | 专项审核 |
| P1 | KYC Levels + Review Policy | 策略配置 |
| P2 | Compliance Archive | 合规导出 |
| P2 | Agreement Docs | 协议版本管理 |

---

*等确认后按 Phase 顺序执行。*
