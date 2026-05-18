# Client Detail Page — 产品规格

> 客户详情页 `/crm/clients/[id]` 的完整产品需求文档。
> **16 个 tab**（v3 新增 Marketing + IB），按 sidebar 来源模块分组：core / compliance / ops / system。
>
> 状态：**v3 — 全部 16 tab 按"UID lens"原则映射到 sidebar 模块**
> 业务场景：外汇经纪商 CRM 后台

---

> ## ⚠️ 阅读前必读 — 核心心智模型
>
> **Client Detail 页 = 把所有 sidebar 菜单模块中 `UID = 当前客户` 的内容聚合到一个工作台。**
>
> 给内部运营人员"以人为中心"的入口，**反向**于 sidebar 的"以业务模块为中心"。
>
> | 视角 | 入口 | 看到 |
> |---|---|---|
> | **业务模块视角**（sidebar） | Sidebar → Funds / CLM / Risk / Support … | 该模块**所有客户**的数据 |
> | **客户视角**（详情页） | Sidebar → Clients → 单个客户 | **某一个客户**在**所有模块**的数据 |
>
> 两个视角对**同一份数据**做查询，只是 `WHERE` 子句不同。每个 tab **不是新功能**，是对应模块的"按客户过滤"视图。
>
> 完整原则 + Tab × 模块映射表见 **[05-alignment.md §0](./05-alignment.md#0-心智模型最重要)**。
>
> 任何 tab 实现前对照 [05-alignment.md §11 checklist](./05-alignment.md#11-实施核查清单给开发用)。

---

## 文档索引

| # | 文档 | 内容 |
|---|---|---|
| 00 | [Foundations](./00-foundations.md) | 设计原则、角色权限、状态机、跨 tab 联动表、审计 / 时间线写入约定、UI 规范、性能 / 安全约束、i18n |
| 01 | [Core Tabs](./01-core.md) | **Overview** · **Accounts** · **Funds** · **Trading** · **Risk** — 资金与交易的事实。Risk tab 已 align 到 `RiskProfile` + `RiskScoreRing` |
| 02 | [Compliance Tabs](./02-compliance.md) | **KYC** · **Cases** · **Agreements** — **已重写**，全部是 CLM 视图（v2） |
| 03 | [Operations Tabs](./03-ops.md) | **Tickets** · **Devices** · **Notes**。Devices tab 已 align 到 `IPGeoInfo` + `IPGeoPopover` |
| 04 | [System Tabs](./04-system.md) | **Permissions** · **Timeline** · **Logs**。Logs tab 已 align 到 `GlobalAuditLog` + `globalAuditService` |
| **05** | **[Alignment](./05-alignment.md)** | **⚠️ 必读**：与 CLM / Risk Engine / GlobalAuditLog 的对齐规则、canonical-source 地图、Tab × 数据所有权矩阵、KYC 全栈对齐细则 |

---

## Tab 全景（16 tab v3）

按 sidebar group → tab → 一句话定位 + 来源模块：

### Core（核心运营 · 5 tab）
| # | Tab | 一句话 | 来源 sidebar 模块 |
|---|---|---|---|
| 1 | **Overview** | 一屏看清客户健康度 | 聚合多模块 |
| 2 | **Accounts** | 客户的 MT4/MT5 交易账户 | Trading > MT Accounts (`/crm/accounts/*`，待入 sidebar) |
| 3 | **Funds**（4 子 tab） | Deposits / Withdrawals / Transactions / Adjustments | Funds (`/crm/funds/*`) |
| 4 | **Trading**（2 子 tab） | Open Positions / Trade History | Trading (`/crm/trading/{positions,orders}`) |
| 5 | **Risk** | 6 轴风险评分 + 关系图 | Risk Center |

### Compliance（合规 · 3 tab，全 CLM 视图）
| # | Tab | 一句话 | 来源 sidebar 模块 |
|---|---|---|---|
| 6 | **KYC** | 身份认证全生命周期（含 re-verification） | CLM > KYC-typed cases |
| 7 | **Cases** | 所有合规 / 运营案件 | CLM > Cases |
| 8 | **Agreements** | 客户签过的法律协议 | CLM > Agreements |

### Operations（运营沟通 · 5 tab）
| # | Tab | 一句话 | 来源 sidebar 模块 |
|---|---|---|---|
| 9 | **Tickets** | 客户支持工单 | Support > Tickets |
| 10 | **Devices** | 登录设备 / IP / 会话（**复用 `/crm/risk/device` UI**） | Risk Center > Device & Security |
| 11 | **Notes** | 员工内部备注 | Clients > Notes |
| 12 | **Marketing** ⭐ NEW | 此客户的 campaigns / emails / SMS / push engagement + 通知偏好 | Marketing + Support Comms |
| 13 | **IB** ⭐ NEW | 客户作为 IB / 作为下线 / 都不是的 3 种视图 | IB |

### System（系统 · 3 tab）
| # | Tab | 一句话 | 来源 sidebar 模块 |
|---|---|---|---|
| 14 | **Permissions** | 单客户能力开关（**4 sections by source**：Trading / Funds / Security / IB） | 多源 override |
| 15 | **Timeline** | 客户**读视角**的事件流 | 派生（cross-module） |
| 16 | **Logs** | 员工 / 系统**写视角**的审计流 | System Logs + GlobalAuditLog |

---

## 阅读顺序建议

| 你想了解 | 读这些 |
|---|---|
| **本 spec 怎么和 CLM 模块对齐** | **[05-alignment](./05-alignment.md) 全篇** |
| 整体设计哲学 / 是否合理 | [00-foundations](./00-foundations.md) 全篇 |
| 某一个 tab 的具体功能 | 找对应文档；KYC / Cases / Agreements / Risk / Devices / Logs **必须**先看 [05-alignment](./05-alignment.md) 对应章节 |
| 跨 tab 数据怎么流 | [00-foundations](./00-foundations.md) §4 跨 tab 联动表 |
| 谁能干什么 | [00-foundations](./00-foundations.md) §2 角色权限矩阵 + 各 tab "可执行操作" |
| 状态机 | [00-foundations](./00-foundations.md) §3（CLM 状态机见 [05-alignment](./05-alignment.md) §4.1） |
| 审计 / 合规审计员视角 | [04-system](./04-system.md) Logs tab + [05-alignment](./05-alignment.md) §7 |
| 数据所有权（哪个模块拥有什么） | [05-alignment](./05-alignment.md) §3 |

---

## 业务决策（基于行业惯例 + 监管要求的推荐）

> 状态：v1 建议方案，业务方可按实际情况调整。各项的展开理由见底部 "决策详情"。

| # | 议题 | 决策摘要 | 状态 | 影响范围 |
|---|---|---|---|---|
| Q1 | 大额出金双签阈值 | 按司法管辖区可配，default **$10k USD-等值**，internal floor **$5k** | ✅ 推荐 | Funds tab |
| Q2 | KYC renew 周期 | 按风险等级分层：**Low 24m / Medium 12m / High·PEP 6m / EDD 3m**；司法管辖区可 override | ✅ 推荐 | KYC tab |
| Q3 | Risk Engine 6 轴权重 | risk_manager **只读**；变更走 "Risk Model Change Request" 工作流，admin + compliance **双签**执行；每次变更触发全量重算 + diff 报告 | ✅ 推荐 | Risk tab + 设置中心 |
| Q4 | Timeline 暴露给客户 portal | **是**，做 "My Activity" feed；`crm_timeline_events` 加 `is_client_visible` boolean；显示交易/资金/KYC/协议/登录类，隐藏 Note / Watchlist / EDD / staff 姓名 | ✅ 推荐 | Timeline tab + portal |
| Q5 | Withdrawal cooldown | **启用**：首次出金 7 天 / KYC renew 后 3 天 / AML flag 期间 14 天 / 标准 0 天；VIP 可 admin override | ✅ 推荐 | Permissions tab |
| Q6 | Demo 账户进风控评分 | **不进**主评分，避免假阳性；保留为独立 "Demo Behavior" 指标显示在 Risk tab | ✅ 推荐 | Risk + Accounts |
| Q7 | Tickets 自建 vs Zendesk | **M1 自建**（已有基础 model）；客服 > 10 人 + 工单 > 500/天时再接 Zendesk；接入方式：webhook 镜像，PII 禁出本系统 | ✅ 推荐 | Tickets tab |
| Q8 | 2FA 强制 | 分场景：登录 **opt-in**，首次入金后**自动 enforced**；交易 / 出金 / 改密 / API key 操作**永远强制** | ✅ 推荐 | Permissions + Devices |
| Q9 | 协议签署方式 | **混合**：TOS / Privacy / Risk Disclosure / Cookie / Marketing / Order Execution Policy 用 **click-wrap**；PoA / Joint / Managed / Swap-Free / PEP Declaration 用 **DocuSign** | ✅ 推荐 | Agreements tab |
| Q10 | Force logout 通知 | **不带具体原因**，统一 "safety reason"；防止打草惊蛇；CRM 内部记录完整原因 | ✅ 推荐 | Devices tab |
| Q11 | Note 转 Case/Ticket | **保留原 Note**，双向 link 不归档；原 Note 显示 "→ Converted to Case #X"；可选 "Hide converted" filter | ✅ 推荐 | Notes / Cases / Tickets |
| Q12 | IB tab 独立性 | **不加 15th tab**；Overview 显示 IB summary chip + 跳转 `/crm/ib/[id]`；Permissions tab § IB 段放 toggle / tier / commission rate | ✅ 推荐 | 整体信息架构 |
| Q13 | Audit 是否记录"查看" | **选择性**：KYC 文档查看 / 下载 / 导出 / Logs tab 本身**写**；列表浏览 / 翻页 / 过滤**不写**；进入单客户详情页粗粒度日访问记 1 条 | ✅ 推荐 | Logs tab |
| Q14 | Permission override 粒度 | **两层**：客户级（KYC level、withdrawal_enabled 总闸、2FA、IB tier、通知）+ 账户级（leverage、group、A/B-book、swap-free、单账户禁交易 / 禁出金） | ✅ 推荐 | Permissions tab |
| Q15 | 客户关闭后访问 | 详情页**只读可访问**（compliance + admin + viewer），banner 红色 "Account closed"；compliance 可加 Note / Case / 回 Ticket；**7 年保留**全量数据，**5 年后 PII 掩码**；列表默认过滤 closed | ✅ 推荐 | 整体 |

---

### 决策详情

#### Q1 · 大额出金双签阈值
- 各国 FIU 法定门槛不同：US/EU $10k、UK £8k、AU $10k、SG $20k、CN RMB 50k
- 内部 risk floor $5k 是行业实践，低于法定但仍触发额外审核
- **实现**：`tenant_configs.withdrawal_dual_sign` 存 `{ default_usd: 10000, per_jurisdiction: { UK: 8000, SG: 20000, ... } }`
- 触发条件 = max(jurisdiction_threshold, internal_floor)

#### Q2 · KYC renew 周期
- FCA/CySEC/ASIC 监管思路是 "risk-based"，**禁止**统一周期
- PEP 法定周期 12 个月，设 6 个月留 buffer
- 高风险国家（FATF grey/black list）单独配置更短周期
- **实现**：`risk_level → renew_months` 映射在 `tenant_configs.kyc_renew_policy`；到期前 30/7/1 天 reminder

#### Q3 · Risk Engine 权重
- Model governance 是监管核心：要能回答"为什么 X 客户被评为 high risk、谁改了模型、何时改"
- 让 risk_manager 自由改权重 = 给员工"调低自己客户分数"的口子，审计无法追责
- **流程**：propose → 自动跑 1000 个 sample 客户对比新旧分数 → admin + compliance review → 执行后全量重算 + diff 通知所有 risk_manager
- 所有权重变更进 `crm_audit_logs` + 单独的 `risk_model_changes` 表

#### Q4 · Timeline 客户 portal 化
- 客户看到自己的活动 = 透明度 + 减少客服咨询
- 关键是**严格白名单**而非黑名单，避免误曝
- **实现**：
  - 数据库：`crm_timeline_events.is_client_visible BOOLEAN DEFAULT false`
  - 写入时按 `type → default_visibility` 映射（在 spec §13.3）
  - Portal API：`/api/portal/me/activity` 强制 `WHERE is_client_visible = true`
  - 即使可见，`operator_id` 字段在 portal 替换为 "TradePass Compliance / TradePass Support" 等团队名

#### Q5 · Withdrawal cooldown
- 7 天 first-withdrawal cooldown 是 anti-money-laundering 行业标准
- 防 "rinse-the-money" 模式：洗钱客户入金后立即想出
- AML flagged 14 天给合规足够调查时间
- **实现**：Permissions tab `withdrawal_hold_days` 字段 + 系统级 default policy；出金请求时算 `max(client_override, system_default)`

#### Q6 · Demo 风控
- Demo 没有真钱，**不参与**主评分
- 但 demo 行为有"红旗"信号：
  - 注册多个 demo 跑同 EA 后才上 live → 可能是 fraud farm
  - Demo 期间频繁切策略 → 客户不稳定
- **实现**：Risk tab 加独立 "Demo Behavior" section（read-only，不入 6 轴）；显示 demo 账户数、最长 EA 测试时长、demo→live 转化时间

#### Q7 · Tickets 自建优先
- 自建优势：单一审计源、客户上下文 inline、监管易审计
- Zendesk 优势：成熟 SLA / 模板 / CSAT / KB
- **决策点**：客服 > 10 人 OR 工单 > 500/天 → 接 Zendesk
- 即使接入，**回复内容** + **客户 PII** 仍存本系统；Zendesk 只做工作流

#### Q8 · 2FA 强制
- 监管不强制 login 2FA（PSD2 SCA 只到 payment 级）
- 但首次入金后**自动升级**到强制 = 行业惯例（保护客户资金）
- 交易 / 出金 transaction-level 2FA 永远强制
- **实现**：Permissions tab：
  - `2fa_enforced_login: false` (default) → 首次入金后自动改 true
  - `2fa_required_for: ["withdrawal", "trade", "password_change", "api_key", "agreement_sign"]` (multi-select，default 全勾)

#### Q9 · 协议签署
- Click-wrap 法律效力对 standard agreements 足够（已被多国法院支持）
- E-signature 必需的场景：PoA、Joint Account、Managed Account、税务表的部分司法管辖区
- **选 DocuSign**：金融业事实标准、覆盖 40+ 国、API 成熟
- **关键**：所有 e-signature 的 final PDF + audit trail 我方存一份，不依赖第三方

#### Q10 · Force logout 通知
- 客户被合规调查时告知具体原因 = 打草惊蛇
- 行业标准文案：`"For your security, you've been logged out. Please sign in again."`
- 客户自己触发的 "log me out everywhere" 例外（可确认是自己的操作）
- CRM 内 staff 看到完整 reason，审计日志记完整

#### Q11 · Note 转换处理
- Note 是 immutable 历史
- 归档会制造 "去哪了？" 困惑 + 难以审计
- **实现**：
  - `client_notes.converted_to_case_id` / `converted_to_ticket_id` 字段（nullable FK）
  - UI 卡片显示 "→ Converted to Case #C-2026-0042" badge
  - 反向：`crm_cases.source_note_id` 反向链
  - Notes tab 顶部 filter chip "Hide converted"，default 不勾

#### Q12 · IB tab 信息架构
- 14 tab 已经够多，加 15th 显著加重 navigation 负担
- IB 视角是**一棵树**（下线、佣金、付款），单点客户视图装不下
- **架构**：
  - 客户详情 Overview：IB 是否启用 + 佣金率 + 下线数 + 跳转链接
  - Permissions tab § IB：toggle / tier / commission rate / sub-IB allowed
  - 深度 IB 管理：独立 `/crm/ib/[id]` 页面（树形 + 报表）
  - 同一人既是 client 又是 IB 时，在两个页面间通过 cross-link 跳转

#### Q13 · Audit 查看操作
- 监管 MiFID II Art. 16 / FCA SYSC 9.1.4 要求审计**高敏感 PII 访问**
- 不要求审计每次列表浏览
- 全记录 = staff 浏览 100 客户 = 100 条 audit，性能差 + audit log 失去信号意义
- **实现**：
  - 列表 / 翻页 / 过滤：**不写**
  - 进入单客户详情：写 1 条 `audit.client.view` (粗粒度日访问，配 unique index 限 1 次/staff/client/day)
  - KYC 文档放大 / 下载：**写**
  - Logs tab 打开本身：**写**
  - 导出 CSV/PDF：**写** + severity = warning

#### Q14 · Permission 双层
- MT 账户特性（leverage、group、A/B-book）天然按账户分
- 客户身份特性（KYC、2FA、IB tier）按客户分
- **UI 示例**：
  - Permissions tab：仅客户级，全局开关
  - Accounts tab → 单账户卡片展开 → "Account permissions" 折叠 section：账户级 override
- **实现**：
  - 客户级：`User.permissions` JSON 或独立 `client_permissions` 表
  - 账户级：`MTAccount.overrides` JSON 字段
  - 计算 effective permission：`account.override ?? client.permission ?? group.default`

#### Q15 · 客户关闭后保留
- 法定底线：FCA SYSC 5 年 / MiFID II 5 年 / FINRA 6 年 / EU GDPR 删除权 vs AML 保留义务冲突时**优先 AML**
- 实务：默认 7 年最保险
- PII 掩码 ≠ 删除：邮箱 `j***@example.com`、手机 `+1 *** *** 1234`、姓名保留 first letter + last，交易记录原样
- **实现**：
  - `User.closedAt` 字段，UI 列表 default 隐藏 closed
  - 详情页加 read-only 横幅，所有 mutation API 返回 403（少数例外：Note / Case / Ticket 加新条）
  - Cron job：每天扫 `closedAt + 5y` 的客户 → 触发 PII redact migration
  - Cron job：每天扫 `closedAt + 7y` → 归档冷存储（S3 Glacier 或类似）+ DB 删除
  - 冷存储访问需 admin + compliance 双签，每次写 audit

---

## 实现优先级建议（按业务价值）

> 不是开发顺序，而是**先把哪几个 tab 做到可用、其他先 placeholder** 的建议。

| 优先级 | Tab | 理由 |
|---|---|---|
| **P0**（先做） | Overview, KYC, Funds, Accounts | 经纪商核心：开户、合规、入出金、账户管理。这 4 个不能用就开不了张。 |
| **P1** | Trading, Risk, Tickets, Notes | 日常运营。Risk 依赖 Risk Engine 子模块，所以稍后；Notes 已基本可用。 |
| **P2** | Cases, Agreements, Permissions, Devices | 合规审计 + 安全。监管检查时会要，运营日常少用。 |
| **P3** | Timeline, Logs | 衍生视图，前面 tab 数据稳了它们自然有内容。 |

---

## 数据模型现状

### Core types（@/types/core/） — 跨模块统一契约

| 类型 | 状态 |
|---|---|
| `RiskProfile` / `RiskFactor` / `RiskFactorKey` | ✅ 已就位 |
| `ClientGraph` / `ClientGraphNode` / `ClientGraphEdge` | ✅ 已就位 |
| `IPGeoInfo` | ✅ 已就位 |
| `GlobalAuditLog` / `AuditDomain` / `AuditSeverity` | ✅ 已就位 |
| `IBSummary` | ✅ 已就位 |
| `ThirdPartyVerification` | ✅ 已就位 |

### CLM types（@/types/clm/）

| 类型 | 状态 |
|---|---|
| `CLMCase` / `CLMCaseType`(10种) / `CLMCaseStatus`(10种) / `KYCLevel`(tier0-4) | ✅ 已就位 |
| `CaseDetail` + `LivenessResult` + `POADetail` + `VideoVerificationDetail` + `SubmittedMaterial` + `OCRResult` + `AutoReviewResult` | ✅ 已就位 |
| `AgreementRecord` | ✅ 已就位 |
| `ReVerificationRequest` / `ReVerificationType`(7种) / `RestrictionConfig` | ✅ 已就位 |
| CLM `config`（forms / templates / policies / workflows）— 853 行 | ✅ 已就位 |

### CRM-owned Prisma 表

| 表 | 用途 |
|---|---|
| User / MTAccount / Wallet / Transaction / Order / Position / KYCRecord / KYCReviewLog / RiskEvent / BlacklistEntry / IBPartner / CommissionRecord | 核心交易 / 资金 / 客户主表 |
| ClientNote / ClientTag / ClientTagAssignment / ClientSegment / ClientDevice / CrmCase / CrmTicket / CrmTimelineEvent / CrmAuditLog | CRM 模块原生概念 |

> 注：`CrmCase` / `CrmAuditLog` 仍然存在作为 CRM 侧的写入端，但**读取通过 `globalAuditService` / `caseService`** 统一查。`ClientAgreement`（如之前 spec 草稿提及的）**不存在 / 不应建** — 协议记录用 CLM `AgreementRecord`。

### 仍缺

| 项 | 影响 |
|---|---|
| Sanctions provider 实接（ComplyAdvantage / Refinitiv） | KYC AML 准确度 |
| Video call session 完整模型 | 视频认证 |
| Withdrawal SLA tracking | Funds tab |
| Followup reminders（Note 跟进） | Notes tab |
| Saved replies (templates) | Tickets tab |
| Multi-hop graph traversal | Risk 关系图（当前 1 跳） |
| Tenant-level audit consolidation | 跨租户审计 |

---

## 接下来

1. **业务方 review 这 6 个文档**（含 [05-alignment](./05-alignment.md) 必读）
2. 业务方对每个 tab 标 "必须 / 可选 / 不要"
3. 业务方对 15 个 OPEN 问题的推荐方案给最终意见
4. 按优先级排期，每个 tab 拆 P0 / P1 / P2 子功能
5. 设计师按 spec 出 UI 高保真稿
6. **实现时严格遵守 [05-alignment.md §11 checklist](./05-alignment.md#11-实施核查清单给开发用)** — 任何 tab 不能新建已有的数据类型或服务

---

## v1 → v2 → v3 变更摘要

**v3（基于"客户详情 = sidebar 模块的 UID lens"原则）：**
| 变化 | 原因 |
|---|---|
| 14 tab → **16 tab** | 新增 Marketing（沟通/营销 engagement 视图）+ IB（业务关系视图） |
| [05-alignment.md §0](./05-alignment.md#0-心智模型最重要) 新增 "心智模型" | 明确客户详情 = 业务模块的反向 lens（UID-filtered） |
| [05-alignment.md §3](./05-alignment.md#3-tab--来源模块-详细矩阵16-tabs) Tab × 来源模块矩阵 | 每个 tab 明确对应 sidebar 模块，零数据模型重复 |
| Funds tab → **4 子 tab** | 镜像 sidebar `/crm/funds/*` 结构 |
| Trading tab → **2 子 tab** | Open Positions / Trade History 分离 |
| Permissions tab → **4 sections** | Trading / Funds / Security / IB by source module |
| Devices tab → **完全复用 `/crm/risk/device` UI** | UID-filtered |
| Logs vs Timeline 边界 | Logs = 员工写视角；Timeline = 客户读视角 |
| 通知偏好从 Permissions 迁到 Marketing | 避免重复编辑 |
| 8 个 A-OPEN 全部 closed | 业务方已 confirm |

**v2（基于"Client Detail 是 CLM 视图"原则）：**
| 变化 | 原因 |
|---|---|
| 新增 [05-alignment.md](./05-alignment.md) | v1 在多处重新发明已有模型（KYC 状态机 / level / audit / risk profile / graph / IP geo） |
| [02-compliance.md](./02-compliance.md) 全部重写 | KYC / Cases / Agreements 从"独立设计"改为"CLM 视图" |
| [01-core.md](./01-core.md) Risk tab 加 Data Contract 段 | 使用 `RiskProfile` + `RiskScoreRing` + `RiskFactorList` |
| [03-ops.md](./03-ops.md) Devices tab 加 Data Contract 段 | 使用 `IPGeoInfo` + `IPGeoPopover` + `ClientGraph` |
| [04-system.md](./04-system.md) Logs tab 加 Data Contract 段 | 使用 `GlobalAuditLog` + `globalAuditService` |
