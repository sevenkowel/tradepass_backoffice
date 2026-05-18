# Configuration 简化方案

> 日期：2026-05-11 · 分类：产品文档 · 状态：已确认（PRD v2.0 对齐）

## 背景

原 Configuration 下有 7 个菜单项：KYC Policies / KYC Levels / Forms & Fields / Compliance Templates / Agreements / Workflows / Routing。运营反馈"过于碎片化、心智门槛高"。简化 PRD v2.0 要求把它合并为 4 个，让"Flow"成为用户被路由进入的核心对象。

## 新菜单结构

```
CLM Center > Configuration
├── KYC Flows                  ← 新核心概念，5 模块开关
├── Routing & Workflow Rules   ← 4 tab：Routing / Auto-Review / Auto-Upgrade / Re-Verification
├── Agreement Documents        ← 保留（已 PRD-aligned）
└── System Modules             ← 新增：Identity 文档矩阵 + 三个 preview 卡
```

旧的 6 个路由（policies / levels / forms / templates / workflows / routing）保留可访问，但从侧栏移除。

## KYC Flow 数据模型

一个 Flow 描述了用户注册后的完整 onboarding 流程，包含 5 个模块：

| 模块 | 必选 | 子开关 |
|---|---|---|
| A. Identity Verification | ✓ 默认必选 | Document（强制）/ Liveness / Selfie / Force Camera Only |
| B. Proof of Address | 可选 | 单一 toggle |
| C. Income Proof | 可选 | 单一 toggle |
| D. Questionnaire | 可选 | 可绑定 KYCForm.id |
| E. Agreement Signing | 可选 | 选择要签署的协议（来自 Agreement Documents） |

Flow 自己不做 country / nationality 路由 — 通过 `KYCFlowRoutingRule` 表把用户分配到 Flow。

## 三层规则统一在一页

`/crm/clm/rules` 用 tab 把所有规则集中：

1. **KYC Flow Routing** — `country_of_residence` / `passport_nationality` 等属性 → Flow ID
2. **Auto-Review** — 条件 → `auto_approve` / `auto_reject` / `manual_review`
3. **Auto-Upgrade** — 注册渠道 / 异常行为 → 强制 OTP / 强制 POA
4. **Re-Verification** — 事件 / 持续两类合规复查触发（详见单独文档）

支持 `?tab=re-verification` 形式的 deep-link 让外部跳转直接打开对应 tab。

## System Modules

`/crm/clm/system-modules` 是 PRD §4 的最后一块：

- **Identity Verification** — 唯一带结构化配置的：每国家允许的文档类型矩阵（national_id / passport / drivers_license）+ 过期检查（3 个月内即拒）
- **Liveness Check / Proof of Address / Income Proof** — preview 卡，配置在 Flow 内做

## 类型与服务

新增 `clmFlowService` 命名空间（独立于 `clmConfigService`）：

```
clmFlowService.flows.{list, create, update, setStatus, remove, getById}
clmFlowService.routingRules.*
clmFlowService.autoReviewRules.*
clmFlowService.autoUpgradeRules.*
clmFlowService.identityModule.{get, update}
```

`clmConfigService.agreements` 保留（Agreement Documents 没有被简化，依然有 version + signing rich model）。

## Mock Seeds

- 4 个 Flow：Standard Retail / EU Retail (CySEC) / Enhanced Due Diligence / SVG Offshore
- 4 条 Routing rule，含 `values: ["*"]` 兜底
- 3 条 Auto-Review（auto-approve / auto-reject / manual-review 各一）
- 3 条 Auto-Upgrade（mobile OTP / email OTP / large withdrawal → POA）
- Identity 模块：5 国允许度 + 启用过期检查

## 涉及文件

- `src/types/clm/config.ts` — 新增 `KYCFlow*` / `KYCFlowRoutingRule` / `AutoReviewRule` / `AutoUpgradeRule` / `IdentityModuleConfig` 类型
- `src/lib/clm/mock/mock-flows.ts`（新）
- `src/lib/clm/services/flow.service.ts`（新）
- `src/app/crm/clm/{kyc-flows,rules,system-modules}/page.tsx`（新）
- `src/components/crm/layout/Sidebar.tsx`

## 决策点

- **不删除旧页面**：留作 back-compat，避免旧 bookmark 404
- **Agreement Documents 不被简化**：版本管理 + 电子签署是已交付的丰富能力，没必要为了简化而损失功能
- **Routing & Rules 用 tab 而非独立菜单项**：4 个规则家族共用一个页面，让运营在一处看完所有自动化

---

## 待办

- [ ] 评估是否最终下线旧的 policies / levels / forms / templates / workflows / routing 路由（决策点：等运营反馈不再使用之后）
- [ ] KYC Flow 与 Agreement Documents 双向跳转（Flow 详情里点击 agreement chip 跳到 agreement 详情）
- [ ] 给 KYC Flow 加发布历史（目前是 ConfigStatus，没有版本概念）
