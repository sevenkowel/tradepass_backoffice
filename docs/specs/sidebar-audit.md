# Sidebar Audit & Cleanup Plan

> **范围**：全 CRM 14 个菜单组、~65 个 sidebar 链接、126 个实际 page.tsx 路由的对照审计。
>
> **输出**：
> 1. 冲突与重叠清单（**12 类**问题）
> 2. Orphan 路由处理建议（52 个）
> 3. 14 个 placeholder 页的功能规格（独立文件，见 [`placeholder-pages/`](./placeholder-pages/)）
> 4. 1 个 dead link 的修复方案

---

## 1. 现状速览

| 项 | 数 |
|---|---|
| sidebar 中的链接（不含 section labels / separators） | ~65 |
| 实际 `page.tsx` 路由文件 | 126 |
| **Dead link**（sidebar 有，code 无） | 1 |
| **Orphan**（code 有，sidebar 无） | 52 |
| **placeholder 页**（sidebar 有，code 是 `Coming Soon` stub） | 14 |
| **真实页**（sidebar 有 + 真实实现） | 50 |

---

## 2. 冲突类型矩阵（核心问题）

按"用户最关心的、影响开发方向的"排序：

| # | 冲突 | 详情 | 决策 |
|---|---|---|---|
| **C1** | **`/crm/kyc/*` 旧模块 vs `/crm/clm/*` 新 CLM** | 9 个 `/crm/kyc/*` 页面已被 CLM 取代但未删除 | 全部 redirect 到 CLM 对应页（已在 alignment doc 说明） |
| **C2** | **`/crm/clm/*` 内部 v1 页 vs v2 4-page 简化版** | 7 个 v1 页面（policies / levels / forms / templates / workflows / routing / re-verification/rules）保留 back-compat 但不在 nav | 保留代码、redirect 到 v2，或删除 |
| **C3** | **`/crm/compliance/*` 老模块 vs Risk Center + CLM** | 5 个老 `/crm/compliance/*` 页面 | redirect：audit→clm/audit-trail；blacklist→risk/blacklist；kyc-review→clm/review-queue；risk→risk；supplemental-review→clm/re-verification |
| **C4** | **`/crm/users/*` 老模块 vs `/crm/clients/*` 新模块** | 3 个老页面（/crm/users + /levels + /tags） | 全部 redirect 到 `/crm/clients/*` |
| **C5** | **`/crm/crm/*` 双层路径（早期）vs Support / Notes** | 3 个老页面：feedback / logs / tickets | tickets→support/tickets；logs→client detail Logs tab；feedback→新功能（见 §4） |
| **C6** | **`/crm/accounts/*` 老 MT 账户管理 vs Client Detail Accounts tab** | 3 个老页面 + sidebar 没列入 | 决策：保留作为**全局 MT 账户管理**（一个员工查所有客户的 MT 账户），还是删？建议保留 + 加入 sidebar Trading 组下；当前不优先 |
| **C7** | **`/crm/risk/blacklist` dead link → 实际 `/crm/compliance/blacklist`** | sidebar 链接到不存在的页 | 二选一：fix sidebar 链接，或把 `/crm/compliance/blacklist` 移到 `/crm/risk/blacklist` |
| **C8** | **IB 子页 orphan**：tree / commissions / settings | sidebar 只有 `/crm/ib`（IB Dashboard），3 个子页 orphan | 加入 sidebar IB 组：IB Tree / Commissions / Settings |
| **C9** | **System 子页 orphan**：auth-config / config / kyc-config / users / security/*（3 个） / staff/logs | 8 个被 System 折叠掉 | auth-config / config 合并入 sidebar；kyc-config 删（CLM owns）；users 删（Clients owns）；security/ip-restriction / logs / password-policy 应嵌入 security 主页 tab；staff/logs 嵌入 staff 详情 |
| **C10** | **Risk margin / NBP 的客户级 vs 全局级** | Risk Center 的 `/crm/risk/margin` 是**全局 margin 监控**；客户详情的 Risk tab 看**单客户 margin** | 不是冲突，是**互补**视图；alignment doc 已说明 |
| **C11** | **AI Signals / Copy Trading / Promo 是应用化模块** | sidebar 不显示是正常的（按 Apps 启用） | 保留；不动 |
| **C12** | **`/crm/profile`、`/crm/settings`、`/crm/ui-showcase`、`/crm/business-config`** | 4 个孤立单页 | profile = staff 个人；settings = staff 偏好；ui-showcase = 开发用（生产环境隐藏）；business-config = 待定 |

---

## 3. 处理动作清单（按优先级）

### P0 — 立即（影响导航 / 用户看到错误）

| 动作 | 影响 |
|---|---|
| **fix dead link** `/crm/risk/blacklist` | sidebar 链接修正或新建 page |
| **删除或 redirect 9 个 `/crm/kyc/*` 旧页** | 防止链接散落到错误目的地 |

### P1 — 短期（数据 / 逻辑统一）

| 动作 | 影响 |
|---|---|
| **5 个 `/crm/compliance/*` 加 redirect** | 已有 audit redirect（按 SESSION-HANDOFF），剩余 4 个补齐 |
| **3 个 `/crm/users/*` 加 redirect** | 老外链不致 404 |
| **3 个 `/crm/crm/*` 加 redirect** | 同上 |
| **3 个 IB 子页加入 sidebar** | IB 模块真实可用 |

### P2 — 中期（功能补全）

| 动作 | 影响 |
|---|---|
| **补 14 个 placeholder 的功能** | 见 [`placeholder-pages/`](./placeholder-pages/) 每页单独规格 |
| **CLM v1 → v2 7 个老页加 redirect** | 链接整理 |
| **System 8 个 orphan 子页归位** | 部分嵌入主页 tab、部分加入 sidebar |
| **`/crm/accounts/*` 3 个全局 MT 账户页** | 决定保留为全局视图还是删 |

### P3 — 长期（信息架构优化）

| 动作 |
|---|
| profile / settings 入口加入 TopBar |
| ui-showcase 在生产环境隐藏 |
| business-config 用途明确 |

---

## 4. Placeholder 页清单 + 规格文档

每个 placeholder 都有**独立的功能规格文件**：

| Sidebar 路径 | 当前状态 | 规格文档 | 复杂度 |
|---|---|---|---|
| `/crm/risk/anomalies` | Coming Soon (12 行) | [`anomalies.md`](./placeholder-pages/anomalies.md) | M |
| `/crm/risk/aml` | Coming Soon | [`aml.md`](./placeholder-pages/aml.md) | L |
| `/crm/risk/whitelist` | Coming Soon | [`whitelist.md`](./placeholder-pages/whitelist.md) | S |
| `/crm/risk/blacklist` | **Dead link** | [`blacklist.md`](./placeholder-pages/blacklist.md) | S — 复用 compliance/blacklist |
| `/crm/funds/policy` | Coming Soon | [`funds-policy.md`](./placeholder-pages/funds-policy.md) | M |
| `/crm/trading/instruments/config` | Coming Soon | [`trading-product-config.md`](./placeholder-pages/trading-product-config.md) | L |
| `/crm/reports/conversion` | Coming Soon | [`reports-conversion.md`](./placeholder-pages/reports-conversion.md) | M |
| `/crm/reports/compliance` | Coming Soon | [`reports-compliance.md`](./placeholder-pages/reports-compliance.md) | M |
| `/crm/support/emails` | Coming Soon | [`support-emails.md`](./placeholder-pages/support-emails.md) | M |
| `/crm/support/sms` | Coming Soon | [`support-sms.md`](./placeholder-pages/support-sms.md) | M |
| `/crm/support/push` | Coming Soon | [`support-push.md`](./placeholder-pages/support-push.md) | M |
| `/crm/support/chat` | Coming Soon | [`support-chat.md`](./placeholder-pages/support-chat.md) | L |
| `/crm/client-360` | Coming Soon | [`client-360.md`](./placeholder-pages/client-360.md) | XL |
| `/crm/setup-guide` | Coming Soon | [`setup-guide.md`](./placeholder-pages/setup-guide.md) | M |
| `/crm/setup-guide/manuals` | Coming Soon | [`setup-guide-manuals.md`](./placeholder-pages/setup-guide-manuals.md) | S |

> 复杂度：S（小，可单 session 完成）/ M（中，1-2 session）/ L（大，3-5 session）/ XL（超大，5+ session，可能需要分阶段）

---

## 5. Orphan 路由完整清单（52 个）

按"归属模块"分组：

### 5.1 旧 KYC 模块（9 个）→ **全部 redirect 到 CLM**

| Orphan | redirect 到 |
|---|---|
| `/crm/kyc/review` | `/crm/clm/workspace` |
| `/crm/kyc/review-policy` | `/crm/clm/rules` |
| `/crm/kyc/levels` | `/crm/clm/kyc-flows` |
| `/crm/kyc/agreements` | `/crm/clm/agreements` |
| `/crm/kyc/config` | `/crm/clm/system-modules` |
| `/crm/kyc/poa-review` | `/crm/clm/review-queue?type=poa` |
| `/crm/kyc/liveness-review` | `/crm/clm/review-queue?type=liveness` |
| `/crm/kyc/resubmit` | `/crm/clm/re-verification/requests` |
| `/crm/kyc/archive` | `/crm/clm/cases?decisionMode=manual&statusIn=approved,rejected` |

### 5.2 CLM v1 内部老页（7 个）→ 已是 back-compat，建议**加 banner + 引导到 v2**

| Orphan | v2 替代 |
|---|---|
| `/crm/clm/policies` | `/crm/clm/rules` |
| `/crm/clm/levels` | `/crm/clm/kyc-flows`（同时 tier 配置） |
| `/crm/clm/forms` | `/crm/clm/kyc-flows`（form sections） |
| `/crm/clm/templates` | `/crm/clm/agreements` + `/crm/clm/kyc-flows` |
| `/crm/clm/workflows` | `/crm/clm/rules` |
| `/crm/clm/routing` | `/crm/clm/rules` |
| `/crm/clm/re-verification/rules` | `/crm/clm/rules` 第 4 个 tab |

### 5.3 旧 compliance 模块（5 个）→ redirect

| Orphan | redirect 到 |
|---|---|
| `/crm/compliance/audit` | `/crm/clm/audit-trail`（**已实现**，SESSION-HANDOFF 提及） |
| `/crm/compliance/blacklist` | **保留**（filling /crm/risk/blacklist dead link 用） |
| `/crm/compliance/kyc-review` | `/crm/clm/review-queue` |
| `/crm/compliance/risk` | `/crm/risk` |
| `/crm/compliance/supplemental-review` | `/crm/clm/re-verification/requests` |

### 5.4 旧 users 模块（3 个）→ redirect 到 clients

| Orphan | redirect 到 |
|---|---|
| `/crm/users` | `/crm/clients` |
| `/crm/users/levels` | `/crm/clients/lifecycle` |
| `/crm/users/tags` | `/crm/clients/tags` |

### 5.5 双层 crm 路径（3 个）→ redirect

| Orphan | redirect 到 |
|---|---|
| `/crm/crm/tickets` | `/crm/support/tickets` |
| `/crm/crm/logs` | `/crm/clm/audit-trail`（员工日志走 GlobalAuditLog） |
| `/crm/crm/feedback` | **暂留**（设计成"客户反馈调研"功能，未来归 Support 组） |

### 5.6 全局 MT 账户（3 个）→ 决策待定

| Orphan | 建议 |
|---|---|
| `/crm/accounts` | 加入 sidebar Trading 组：MT Accounts |
| `/crm/accounts/groups` | 加入：Account Groups |
| `/crm/accounts/leverage` | 加入：Leverage Settings |

> 这 3 个页 sidebar 没有，但代码已实现。是**全局 MT 账户管理**视图（客户详情 Accounts tab 只看单客户）。建议加入 Trading 组。

### 5.7 IB 子页（3 个）→ 加入 sidebar IB 组

| Orphan | sidebar 应加 |
|---|---|
| `/crm/ib/tree` | IB Tree |
| `/crm/ib/commissions` | Commissions |
| `/crm/ib/settings` | IB Settings |

### 5.8 System 子页（8 个）→ 部分加入、部分嵌入

| Orphan | 处理 |
|---|---|
| `/crm/system/auth-config` | 加入 sidebar System 组：Authentication Config |
| `/crm/system/config` | 加入 sidebar System 组：General Config |
| `/crm/system/kyc-config` | **删除**（CLM owns KYC config）；redirect → `/crm/clm/kyc-flows` |
| `/crm/system/users` | **删除**（Clients owns）；redirect → `/crm/clients` |
| `/crm/system/security/ip-restriction` | 嵌入 `/crm/system/security` 作为 Tab |
| `/crm/system/security/logs` | 嵌入 `/crm/system/security` 作为 Tab |
| `/crm/system/security/password-policy` | 嵌入 `/crm/system/security` 作为 Tab |
| `/crm/system/staff/logs` | 嵌入 `/crm/system/staff/[id]` 作为 Tab（单员工日志） |

### 5.9 应用化模块（9 个）→ 不动，按 Apps 启用

| Orphan |
|---|
| `/crm/ai-signals` `/crm/ai-signals/pool` `/crm/ai-signals/usage` |
| `/crm/copy-trading/traders` `/crm/copy-trading/followers` `/crm/copy-trading/settings` `/crm/copy-trading/profits` |
| `/crm/promo` |
| `/crm/business-config` — 待定（可能也是应用化） |

### 5.10 单页（4 个）

| Orphan | 处理 |
|---|---|
| `/crm/profile` | **保留**；入口加到 TopBar 头像下拉菜单 |
| `/crm/settings` | **保留**；同上 |
| `/crm/ui-showcase` | **生产环境隐藏**（dev 工具） |
| `/crm/business-config` | 用途不明，需 review |

---

## 6. 跨模块逻辑统一总览

回应"统一逻辑"，把所有需要遵守 alignment 的对照点列在一处：

| 概念 | 事实源（owner） | view-only 引用方 |
|---|---|---|
| KYC case / 状态 / 级别 | **CLM**（`CLMCase` + `CLMCaseStatus` + `KYCLevel`） | Client Detail KYC tab、Compliance Reports、Risk Center high-risk filter |
| KYC renew 配置 | **CLM**（`ReVerificationRequest` + `ReVerificationType`） | Client Detail KYC tab、Permissions tab restriction |
| 协议模板 / 签署 | **CLM**（`AgreementRecord` + `/crm/clm/agreements`） | Client Detail Agreements tab、Onboarding |
| 跨域审计 | **GlobalAuditLog**（`@/types/core/audit` + `globalAuditService`） | Client Detail Logs tab、System Operation Logs、Compliance Reports |
| 风险画像 | **Risk Engine**（`@/types/core/risk-profile` + `lib/risk-engine`） | Client Detail Risk tab、CLM Case Risk Panel、Risk Center scoring |
| 客户关系图 | **Core types**（`@/types/core/client-graph` + `lib/risk-engine/graph`） | Client Detail Risk tab、Devices tab、`/crm/risk/graph` |
| IP geo / VPN 检测 | **Core types**（`@/types/core/ip-geo` + `lookupIPGeo`） | Client Detail Devices tab、CLM Case submission context、Risk Center IP analysis |
| 三方认证 (Sumsub/Onfido) | **Core types**（`ThirdPartyVerification`） | CLM Case material chip、Client Detail KYC tab |
| IB 数据 | **Core types**（`IBSummary`） + 全局 `/crm/ib` 模块 | Client Detail Overview、CLM Case IB section、Risk Center IB source axis |
| 客户标签 / 段 / 备注 | **CRM Clients 模块** | Marketing 圈选目标、Reports 维度切片 |
| MT 账户 | **CRM Trading 模块**（`MTAccount`）+ `/crm/accounts/*` 全局视图 | Client Detail Accounts tab |
| 工单 | **CRM Support 模块**（`CrmTicket`） | Client Detail Tickets tab |
| 通知模板（邮件 / SMS / Push） | **System Modules**（`/crm/clm/system-modules` notification adapters）+ 各 Support 子模块的发送日志 | Marketing、CLM re-verification、Tickets |

**实施铁律**：
> 任何新功能（包括 placeholder 填充）**必须**从这张表的 owner 列拉数据，**不允许**新建平行模型。

---

## 7. Sidebar 顶层结构改动建议

基于以上分析的最小化调整：

### 7.1 加入 sidebar 的 orphan（11 个）

| 组 | 加入 |
|---|---|
| Trading | MT Accounts / Account Groups / Leverage Settings（来自 `/crm/accounts/*`） |
| IB | IB Tree / Commissions / Settings（来自 `/crm/ib/*`） |
| System | Authentication Config / General Config（来自 `/crm/system/{auth-config,config}`） |

### 7.2 修复 dead link

`/crm/risk/blacklist` 指向 `/crm/compliance/blacklist`（或把 page 复制 / 移到 `/crm/risk/blacklist`）

### 7.3 顶部 / 个人入口（不在 sidebar）

TopBar 右上头像菜单：
- My Profile（`/crm/profile`）
- Preferences（`/crm/settings`）
- Logout

---

## 8. 优先级总结（给排期参考）

| 优先级 | 工作 | 估时 |
|---|---|---|
| P0 | Dead link `/crm/risk/blacklist` 修复 | 0.5h |
| P0 | 9 个 `/crm/kyc/*` 加 redirect 到 CLM | 1-2h |
| P0 | 5 个 `/crm/compliance/*` 加 redirect | 1h |
| P0 | 3 个 `/crm/users/*` 加 redirect | 0.5h |
| P0 | 3 个 `/crm/crm/*` 加 redirect | 0.5h |
| P1 | 11 个 orphan 加入 sidebar | 1-2h |
| P1 | 5 个 System 子页嵌入主页 tab | 1-2 day |
| P1 | TopBar 个人菜单 + ui-showcase 生产隐藏 | 1h |
| P2 | 14 个 placeholder 按 [`placeholder-pages/`](./placeholder-pages/) 补全 | 见每个 spec |
| P2 | CLM v1 7 个老页加 banner + redirect | 2-4h |
| P3 | `/crm/accounts/*` 决策保留/删 + 加 sidebar | 0.5 day |
| P3 | `business-config` 用途明确 | TBD |

---

## 9. OPEN 问题（待业务方确认）

| # | 问题 | 影响 |
|---|---|---|
| C-Q1 | `/crm/risk/blacklist` vs `/crm/compliance/blacklist` 哪个名字保留？ | Sidebar 一致性 |
| C-Q2 | 旧 9 个 `/crm/kyc/*` 是 redirect 还是直接删？（外部书签 / 老 IB tracking 链接是否要兼容） | 旧链接体验 |
| C-Q3 | `/crm/accounts/*` 全局 MT 账户管理是否保留？如果保留，加 sidebar 哪个组？ | 信息架构 |
| C-Q4 | `/crm/crm/feedback` 是删还是设计成"客户反馈调研"功能？ | 是否新功能 |
| C-Q5 | `business-config` 是做什么的？删 / 重命名 / 保留？ | 待确认 |
| C-Q6 | CLM v1 老页面（policies/levels/forms/templates/workflows/routing）是否完全删除？还是保留 read-only + 引导到 v2？ | 配置历史保留 |
| C-Q7 | Marketing 4 个 page 真实实现（>400 行），但需要确认是否符合 FX 经纪商场景（vs 普通 SaaS marketing） | 需 review |
| C-Q8 | `/crm/system/security/{ip-restriction,logs,password-policy}` 嵌入主页 tab 还是保留独立 URL？ | UX 决策 |
| C-Q9 | `/crm/system/staff/logs`（全平台 staff 操作日志）独立 vs 在 `/crm/system/logs` 内统一？ | 信息聚合 |
| C-Q10 | 14 个 placeholder 的实现优先级（按业务价值）？ | 排期 |
