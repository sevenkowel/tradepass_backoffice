# `/crm/support/chat` — Chat History

> **数据契约**：
> - 若**自建**：新建 `prisma.chatConversation` + `chatMessage`：id / clientId / staffId / channel (`web_widget` / `portal` / `whatsapp` / `telegram`) / status / startedAt / endedAt / waitTime / handleTime / csatScore / messages[]
> - 若**对接 Zendesk Chat / Intercom / LiveChat**：mirror 元数据，message body 通过 widget 查
> - 与 [Tickets](../client-detail/03-ops.md) 边界：chat = 实时；ticket = 异步

---

## 1. 目的

在线客服**聊天历史**审计 + 实时支持员状态总览。覆盖：
- Web widget 聊天（客户在 portal 点 chat 图标）
- WhatsApp Business / Telegram 接入聊天
- 内部 staff↔staff 与客户相关的协作（少量）

→ 复用工单解决相同问题（异步 vs 实时）。chat 解决"立即性"。

---

## 2. 数据展示

### 2.1 顶部 KPI（实时 + 历史切换）

实时模式：
| KPI |
|---|
| Online clients in chat / Online staff / Queue (waiting) / Avg wait time today / Avg handle time / Active conversations |

历史模式（任意时间段）：
| KPI |
|---|
| Total conversations / Avg wait / Avg handle / CSAT 平均分 / Resolved within first contact / 升级到 ticket 占比 |

### 2.2 列表（按 status 分 tab）

Tabs: `Active / Waiting / Resolved / Abandoned`

| 字段 |
|---|
| Conv ID / Started at / Client (uid+name) / Channel / Assigned staff / Status / Wait time / Handle time / Messages count / Last message preview / CSAT |

### 2.3 详情 Drawer / 全屏（点击行）

- 完整消息 thread（与 ticket 视图同构）
- Customer-facing vs internal note 区分
- 附件 / 截图
- 关联资源（ticket / case / deposit）
- 转 ticket 按钮

### 2.4 Staff Online 状态 panel

每个 support_agent：
- Status (online / away / offline / busy)
- 当前 active conversations 数
- 今日处理数 / 平均处理时长 / CSAT
- 客户队列分配 setting

---

## 3. 可执行操作

| 动作 | 权限 |
|---|---|
| Open conversation full view | support / admin |
| Reply（in active conv） | support / admin |
| Add internal note | any staff |
| Assign / Transfer conv | support / admin |
| Escalate to ticket / case | support |
| Close / Resolve | support / admin |
| Re-open | support / admin |
| Toggle my online status | self |
| Force log staff offline | admin |
| Auto-routing config | admin |
| Bulk export CSV | admin + compliance（审计） |

---

## 4. 过滤 / 排序

| 过滤 |
|---|
| Status / Channel / Staff / Client / Date range / Wait time > N min / CSAT range |

---

## 5. 副作用

| 动作 | 审计 |
|---|---|
| Reply customer-facing | `support.chat.reply` |
| Internal note | `support.chat.note` |
| Escalate to ticket | `support.chat.convert_ticket` |
| Force staff offline | `support.staff.force_offline` |
| Export CSV | `support.chat.export` |

---

## 6. 实现要点

**两种方案对比：**

| 维度 | 自建 | Zendesk Chat / Intercom |
|---|---|---|
| 实时引擎 | WebSocket（Socket.io / Pusher / Ably） | 第三方负责 |
| 工程量 | 大（typing indicator / read receipt / file upload / 多人协作 / 客户重连） | 小（widget + webhook） |
| 数据 own | 在自家 DB | 第三方 SaaS（PII 出本系统） |
| 监管 | 友好 | 需 DPA + 注意 PII 跨境 |
| 多渠道（WA / Telegram） | 自己接 | 第三方 unified inbox |
| 推荐 | 团队 > 20 人客服 | 团队 < 10 人客服 |

> 与 Tickets 决策一致：M1 自建（已实现简单 ticket）；客服规模上来再切 Zendesk。

- WebSocket 用 `socket.io`（Node.js）
- 消息持久化到 DB
- Typing indicator / read receipt via socket events
- File upload 走标准 upload endpoint
- Customer side：portal 集成 chat widget
- WhatsApp / Telegram：单独 webhook ingest

---

## 7. 边界

| 此页 | Tickets tab | Notes tab |
|---|---|---|
| 实时 chat 会话 | 异步工单 | 内部备注 |
| 客户在线主动咨询 | 客户提交问题等回复 | 员工内部沟通 |

---

## 8. OPEN

| # | 问题 |
|---|---|
| Q1 | 自建 vs Zendesk Chat 决策（已在 Tickets OPEN 提过，决策一致） |
| Q2 | WhatsApp Business / Telegram 是否 MVP 必须？还是 Phase 2？ |
| Q3 | CSAT 调查触发：每次 conv 结束 / 仅每周一次 / 客户主动？ |
| Q4 | 多语言支持 + 自动翻译（客户用中文，员工看到英文翻译）？ |
| Q5 | AI 助理回复建议（基于历史工单库）？ |
