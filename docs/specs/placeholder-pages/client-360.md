# `/crm/client-360` — Client 360 View

> **数据契约**：
> - **完全聚合视图**，零新模型
> - 数据源：`User` + `MTAccount` + `Wallet` + `Transaction` + `Order` + `Position` + `RiskProfile` + `CLMCase` + `CrmTicket` + `ClientGraph` + `GlobalAuditLog` + `IPGeoInfo` + `IBSummary`
> - 与 Client Detail 边界：Client Detail 是**单客户深入工作台**（14 tab）；Client 360 是**多客户聚合驾驶舱**（按业务场景聚类、跨客户洞察）

---

## 1. 目的

回答"宏观"问题，与 Client Detail 单客户深度形成互补：

- 当前 active 客户的整体健康度如何？
- 哪些客户**今天最需要关注**（margin call / KYC 即将过期 / 大额出金待审 / 风险评分跳升）？
- 谁是 "high-value at-risk"（VIP 但风险等级上升）？
- 客户群体的 demographics / behavior 切片？
- 各 cohort 的 LTV / churn 趋势？

→ 用 dashboard 风格代替 list 风格，帮助 staff "知道下一步该看谁"。

---

## 2. 数据展示（多区块布局）

### 2.1 顶部全局 KPI 条

| KPI |
|---|
| 总客户 / 活跃客户 (30d) / 新客户 (7d) / 总 AUM (Assets Under Management) / 24h trading volume / 24h net deposit / 当前 pending KYC / 当前 pending withdrawal |

### 2.2 Attention Required（**重点 - 今天要看的**）

按业务紧迫度排序的客户卡片网格：

| 卡 type | 触发条件 | Action |
|---|---|---|
| Margin Call | Margin Level < 100% | 跳客户 Trading tab |
| 大额 Pending Withdrawal | amount > $10k 且 > 6h 未审 | 跳客户 Funds tab |
| KYC SLA 即将超时 | KYC pending > 18h（SLA 24h 的 75%） | 跳客户 KYC tab |
| Risk Spike | 24h 内 riskScore 涨 > 20 分 | 跳客户 Risk tab |
| 协议过期阻断 | 待签协议阻塞了出金或交易 | 跳客户 Agreements tab |
| New device + large amount | 新设备登录后立刻发起 > $5k 出金 | 跳客户 Devices + Funds |
| AML Confirmed | 命中 sanctions 但还没开 EDD case | 跳客户 KYC / 创 EDD |

每张卡显示：client name + uid + 触发原因 + 关键数字 + Action 按钮（取消显示 / Open in detail）。

### 2.3 客户分布画像（图表区）

- **By KYC tier**: tier0 / tier1 / tier2 / tier3 / tier4 饼图
- **By lifecycle stage**: registered / verified / FTD / active / inactive / churn 漏斗
- **By risk level**: low / medium / high / critical 柱状
- **By country (top 10)**: 国家分布 + AML 风险 heatmap
- **By IB tree**: top 10 IB 的客户数 / pass rate / commission

### 2.4 高价值 + 高风险象限图

X 轴：净入金 / 累计交易量
Y 轴：风险评分
象限 highlight 客户名，点击跳详情。

### 2.5 Recent Activity Feed（全局，仅大事件）

来自 `globalAuditService.list({severity: critical, recent: 50})`：
- KYC approve / reject 大客户
- 出金 approve / reject 大额
- 强制冻结
- AML confirmed
- 协议过期触发阻断

每条带 timestamp + clickable client link。

### 2.6 智能搜索栏（顶部）

支持自然语言式查询：
- "vip clients in UAE pending kyc"
- "high risk clients with deposit > 10k this week"
- "frozen clients with open positions"

→ 解析为多维度过滤 + 跳 Client List 预填过滤。

---

## 3. 可执行操作

| 动作 | 权限 |
|---|---|
| Open client detail | viewer+ |
| Dismiss attention card | the staff who acts on it |
| Bulk action（如选中 N 个 attention card 一起冻结） | risk / compliance / admin（需双确认） |
| Save custom dashboard layout | self |
| Schedule daily 8am summary email | self / admin |
| Drill-down 任何图表 | viewer+ |
| Export full 360 snapshot PDF | compliance / admin |

---

## 4. 副作用

主要是只读 dashboard。Bulk action 触发对应的具体 audit（freeze 等已 spec）。

| 动作 | 审计 |
|---|---|
| Bulk freeze | per-client `client.status.update` × N |
| Snapshot export | `reports.client360.export` |

---

## 5. 实现要点

- 数据：复杂聚合，**强 cache**（实时 KPI 用 1min cache；分布画像用 1h cache）
- Attention cards 用规则引擎计算，可配置阈值
- 智能搜索：可以是 NLP 简化版（关键词 + dimension 映射），不必上 LLM
- 实时性：核心 KPI 用 SSE 或 30s 轮询
- 性能：大 broker 万客户级别，避免 N+1 query；用 materialized views

---

## 6. 边界

| 此页 | Client List | Dashboard Overview | Real-time Monitor |
|---|---|---|---|
| 跨客户洞察 + Attention Required | 列表 + 过滤 | 高层 KPI | 实时事件 |
| 用：所有 ops / risk / compliance | 客户管理日常 | dashboard 守值班 | 风控 / 交易 |

---

## 7. 信息架构挑战

这个页是**全平台 cross-cutting view**，几乎所有模块都贡献数据。容易做成"什么都有什么都不深"的鸡肋页。

**避免方法**：
1. **Attention Required** 是核心 — 给具体下一步 action，不只是数字
2. 智能搜索 = 真用户场景，不只是"展示"
3. 限制图表数量（< 6 张）
4. 每张卡 / 图都能 drill-down 到 detail，**永远**有去处

---

## 8. OPEN

| # | 问题 |
|---|---|
| Q1 | Attention card 触发规则：硬编码还是 `/crm/risk/rules` 配置？ |
| Q2 | 是否所有员工看同一份 360 view，还是按角色定制（compliance 看 KYC / risk 看异常 / finance 看资金）？ |
| Q3 | 智能搜索：MVP 用 keyword + dimension mapping，Phase 2 上 NL/LLM？ |
| Q4 | 8am daily summary email 是默认开还是 opt-in？ |
| Q5 | 多租户（白标）时此页是否需要按租户 isolate？ |
