# Client Detail — Operations Tabs

> 3 个运营 tab：Tickets / Devices / Notes。
> 这组围绕**日常客户沟通与安全**：客服工单、设备/会话管理、内部备注。

---

## Tab 9 — Tickets（客服工单）

### 9.1 目的
客户主动发起的咨询、投诉、问题反馈，以及员工帮客户创建的工单。每张工单是一段对话 thread。

> **与 Cases tab 的边界**：Ticket = 客户提问 / 客户主动联系；Case = 内部决策流程。Ticket 可以"升级为 Case"，Case 也可以"派生 Ticket"。

### 9.2 数据展示

**顶部统计：**
| KPI |
|---|
| Open / In progress / Waiting customer / Resolved (30d) / Avg response time / Avg resolution time / Customer satisfaction (CSAT) |

**列表（默认 status=open + in_progress 在前）：**

| 字段 |
|---|
| Ticket ID（e.g. `T-2026-0089`） / Subject / Type / Status / Priority / Assigned to / Last reply by (客户 or staff) / Last reply at / Created |

**Type 枚举：**
- `financial`（资金问题）
- `kyc`（认证相关）
- `withdrawal`（出金问题）
- `deposit`（入金问题）
- `complaint`（投诉，自动 priority=high）
- `risk_appeal`（被冻结 / 限制后申诉）
- `technical`（平台 / MT 故障）
- `account_change`（改密码 / 改邮箱）
- `product_inquiry`（咨询产品）
- `general`

**展开 / 详情视图：**

左侧：消息 thread
- 每条消息：作者头像 / 名字 / 角色 chip（客户 / staff name） / 时间 / 正文 / 附件
- 区分 `customer_facing` 消息（客户能看） 和 `staff_only` 内部备注（折叠或不同色块）
- 系统消息（"状态变更"、"分配到 Alice"）作为分隔条嵌入

右侧 sidebar：
- 工单元信息（Type / Priority / Status / Assigned / SLA / 创建源）
- 客户上下文摘要（balance / kycStatus / risk level / 最近的 case / 最近交易）
- Related tickets（同主题串联）
- 关联 case（如有）
- 关联资金记录（如适用，如出金问题工单 ↔ 出金 ID）

### 9.3 可执行操作

**列表顶部：**
| 动作 | 权限 |
|---|---|
| 创建新工单（员工代客户） | support / admin |
| 切换视图：我负责的 / 全部 / 未分配 | viewer+ |
| 批量分配 | support / admin |
| 导出 CSV | viewer+ |

**单工单操作：**

| 动作 | 权限 | 备注 |
|---|---|---|
| 回复（customer-facing） | support / 任一相关 role / admin | 富文本 + 附件；发送时同步邮件给客户 |
| 加内部备注（staff-only） | 任何 staff | 客户看不到 |
| 分配 / 转分配 | support / admin | 转给个人或队列 |
| 升级（escalate） | support / admin | 提升 priority；可同时升级为 case |
| 转为 case | support / compliance / admin | 自动 link，工单状态保持 |
| 关闭（resolved） | assigned + admin | 触发 CSAT 调查给客户 |
| 重开 | support / admin | 关闭后 7 天内有效 |
| 改 priority | support / admin | |
| 改 type | support / admin | 不写时间线 |
| 合并到另一工单 | support / admin | 同主题去重 |
| 删除（仅 spam） | admin | confirm + reason，软删保留 |
| 应用模板回复 | support / admin | 预设话术，按 Type 过滤 |

### 9.4 SLA
| Priority | 首响应 | 解决 |
|---|---|---|
| urgent | < 30 min | < 4h |
| high | < 2h | < 24h |
| medium | < 8h | < 72h |
| low | < 24h | < 7d |

SLA 倒计时显示在列表，超时高亮。

### 9.5 副作用
| 动作 | 审计 | 时间线（客户视角） |
|---|---|---|
| Create ticket | `ticket.create` | `ticket_created` |
| Reply customer-facing | `ticket.reply` | `ticket_replied`（仅当 staff 回复，因为客户回复客户自己知道） |
| Add internal note | `ticket.note.add` | 不写 |
| Assign | `ticket.assign` | 不写 |
| Escalate | `ticket.escalate` | 仅当 priority → urgent 时写 |
| Close | `ticket.close` | `ticket_resolved` |
| Re-open | `ticket.reopen` | `ticket_reopened` |
| Convert to case | `ticket.convert.case` | 不写 |

### 9.6 通知触发
- 客户回复 → 通知 assignee（站内 + 邮件）
- Staff 回复 → 通知客户（邮件 + portal 站内）
- 升级 urgent → 通知 team lead（Slack / 站内）
- SLA 即将超时（剩余 25% 时间）→ 通知 assignee
- SLA 已超时 → 通知 team lead + assignee

### 9.7 模板回复（管理在系统设置，此 tab 仅使用）
- 按 Type 分组
- 含变量：`{{client.name}}`、`{{client.uid}}`、`{{ticket.id}}`
- 多语言版本

---

## Tab 10 — Devices（设备 / 会话）

> **数据契约（v2 alignment）**：Devices tab 的设备表 CRM 自有，但**所有 IP 渲染必须**通过 core types + shared 组件。详见 [05-alignment.md](./05-alignment.md) §9。
>
> | 用途 | Canonical |
> |---|---|
> | 设备 / session 表 | `ClientDevice`（CRM-owned, Prisma 表） |
> | IP geo / VPN 检测 | `IPGeoInfo` (`@/types/core/ip-geo`) + `lookupIPGeo()` |
> | IP 弹层（hover 显示 geo + VPN + 同 IP 关联客户） | `IPGeoPopover` (`@/components/crm/clm/popovers/IPGeoPopover`) |
> | 同 IP / 同设备的关联客户 | `ClientGraph` + `lib/risk-engine/graph.ts` 的关系链 |
> | 2FA 重置审计 | 由 mutation 写 `GlobalAuditLog` |
>
> **禁止**：自建 VPN/Tor/proxy 检测逻辑、自建 geo lookup、自建"同 IP 关联客户"查询 — 全部走 `IPGeoInfo` + `lookupIPGeo`。

### 10.1 目的
客户登录用过的所有设备 / IP / 浏览器。安全审计：发现共享账户、被盗用、地理异常。

### 10.2 数据展示

**列表（按 last_used_at desc）：**

| 字段 |
|---|
| Device ID（fingerprint hash 截断） / IP / Country + City (GeoIP) / Browser + Version / OS + Version / Timezone / First seen / Last seen / Login count / Is current（正在使用） / Is risky / Marked trusted |

**风险标记触发**（数据来自 `IPGeoInfo` + Risk Engine）：
- 同一设备 N 天内出现 > X 个客户登录（疑似共享账户） — 来自 `ClientGraph` shared_device edge
- 客户从 N 个不同国家登录（VPN / 旅行 / 共享）— 来自 `IPGeoInfo.country` 多样性
- 数据中心 IP / Tor exit / VPN provider 黑名单 — 来自 `IPGeoInfo.isVPN / isTor / isProxy`
- 短时间内同账户多地登录（不可能的位移）— Risk Engine 内的规则
- 设备 fingerprint 突变（同 IP 但 fingerprint 全新）— 来自 device 表 + `ClientGraph`
- 已知 fraud farm IP / device — `IPGeoInfo` enrichment + blacklist

**展开行：**
- 该设备 / IP 的登录历史（最近 50 条）：时间 / 成功 / 失败 / 失败原因 / 2FA 通过情况
- 关联客户：调 `/api/crm/clients/[id]/graph` 拿 `ClientGraph`，过滤出 `kind ∈ [shared_ip, shared_device]` 的节点；点击跳对方 client detail 或 Risk tab 关系图
- IP 单元格悬停：用 `IPGeoPopover` 显示 geo + VPN/Tor 标记 + 同 IP 关联 UID 列表

**右侧 sidebar：**
- 当前活跃 sessions（带 "force logout this session" 按钮）
- 客户已注册的 2FA 方式列表（authenticator app / SMS / Email）
- 安全事件计数（30 天内失败登录、强制登出、密码重置）

### 10.3 可执行操作

| 动作 | 权限 | 备注 |
|---|---|---|
| 撤销单个 session | support / risk / admin | 立即踢出该 session |
| 强制全部登出 | risk / admin | 所有 sessions 失效，requires reason |
| 阻止 IP（加入黑名单） | risk / compliance / admin | 影响该 IP 所有客户 |
| 信任设备 | support / admin | 跳过 2FA（仅特定客户请求） |
| 取消信任 | support / risk / admin | |
| 重置客户 2FA | support + admin 双签 | 客户下次登录重新绑定 |
| 标记 risky | risk / compliance | 加 risk_engine 权重 |
| 重新评估（重跑 device risk） | risk / admin | |
| 锁定登录到特定国家 | compliance / risk / admin | 配合监管要求 |
| 解锁国家限制 | compliance / risk / admin | |
| 查看完整登录历史导出 | admin | 审计审计员用 |

### 10.4 副作用
| 动作 | 审计 | 时间线 |
|---|---|---|
| Revoke session | `device.session.revoke` | 不写客户时间线（安全考虑，但内部写） |
| Force logout all | `device.session.revoke.all` | `forced_logout` |
| Block IP | `device.ip.block` | `ip_blocked`（仅内部） |
| Reset 2FA | `device.2fa.reset` | `two_factor_reset` |
| Trust / Untrust | `device.trust.set` | 不写 |
| Country restrict | `device.country.restrict` | `geo_restricted`（仅内部） |

### 10.5 通知给客户
| 事件 | 是否通知 |
|---|---|
| 新设备登录 | 邮件 + 站内（默认开启） |
| 不寻常地理 | 邮件 + 站内 + 可选 SMS |
| 密码尝试失败 N 次 | 邮件 |
| Staff 强制登出 | 邮件（briefly：safety 原因 — 不告诉具体什么 staff） |
| 2FA 重置 | 邮件 + 站内 |
| IP 被阻止 | 不通知（避免对方知道） |

### 10.6 数据保留
- Sessions：active session 实时；historical sessions 保留 1 年
- 登录日志：5 年（监管）
- Geo lookup：每次查询 + cache 24h

---

## Tab 11 — Notes（内部备注）

### 11.1 目的
员工之间关于此客户的内部沟通 — 销售跟进、风险提醒、运营提示。**永不**对客户可见。

### 11.2 数据展示

**顶部工具栏：**
- Type filter chips：All / Pinned / General / Risk / Sales / Followup
- 搜索框（按内容 + 作者）
- 排序：默认 Pinned 在最前，然后时间倒序

**Composer（顶部）：**
- 富文本输入（多行）
- @mention staff（autocomplete from staff directory）
- Note type 选择（general / risk / sales / followup）
- 是否 pin（仅 compliance / risk / admin 能 pin）
- 是否标记为后续跟进（设置提醒日期）
- 附件（截图 / PDF / 链接）

**每条 Note 卡片：**
- 作者头像 + 名字 + 角色 chip
- Type chip（带颜色）
- Pinned 标记
- 时间（绝对 + 相对）
- 内容（支持 markdown 简化版）
- @mentions（蓝色 chip）
- 附件
- 操作按钮：Edit（30 分钟内 + 仅自己写的） / Delete（仅自己 / admin） / Convert to case / Convert to ticket

### 11.3 可执行操作

| 动作 | 权限 |
|---|---|
| 添加 note | 任何 staff |
| Pin / Unpin | compliance / risk / admin |
| Edit 自己的 note | 作者 + 30 分钟内 |
| Delete 自己的 note | 作者 + 24 小时内（之后只 admin） |
| Delete 任意 note | admin only（强制写审计） |
| @mention | 任何 staff（autocomplete） |
| 转换为 case | compliance / risk / support |
| 转换为 ticket | support |
| 设置 followup 提醒 | 任何 staff（自己作为提醒人） |
| 按 mention 我的过滤 | 任何 staff |
| 导出 PDF | compliance / admin |

### 11.4 副作用
| 动作 | 审计 | 时间线 |
|---|---|---|
| Add note | `note.add` | 不写 |
| Edit | `note.edit`（带 diff） | 不写 |
| Delete | `note.delete` | 不写 |
| Pin / Unpin | `note.pin.toggle` | 不写 |
| Convert to case | `note.convert.case` | 不写 |
| Mention | 不写审计（mention 本身只是 inline 引用） | 触发被 mention staff 的站内通知 |

### 11.5 提及（@mention）行为
- 被 mention 的 staff 在站内通知中心看到："Alice mentioned you in a note on client Min Khan"
- 点击跳转此 Notes tab 并 scroll 到该 note
- Mention 邮件可选（每个员工自己配置）

### 11.6 Followup 提醒
- 设置时选日期 + 时间 + 提醒人（默认自己）
- 到点：站内 + 邮件
- 客户详情页右上显示"3 个 followup 待办"角标
- followup 处理后可标记完成（保留原 note，加 resolved 状态）

### 11.7 关联
- Notes 不直接跳出客户详情，但**搜索全局 Notes**（`/crm/clients/notes` 页面）可以跨客户查
- 任何 Note 可"转为 Case"，自动 copy 内容 + 关联到客户

---

## Tab 12 — Marketing（⭐ NEW）

> **数据契约（v3）**：Marketing tab 是 `Marketing` + `Support Comms` 子模块的客户级**聚合视图**。详见 [05-alignment.md §3](./05-alignment.md#3-tab--来源模块-详细矩阵16-tabs)。
>
> | 用途 | Canonical |
> |---|---|
> | 客户收到的 campaign engagement | `marketingCampaignTarget`（`/crm/marketing/campaigns` 模块拥有） |
> | 邮件发送日志 | `emailLog`（`/crm/support/emails`） |
> | SMS 发送日志 | `smsLog`（`/crm/support/sms`） |
> | Push 通知日志 | `pushLog`（`/crm/support/push`） |
> | 站内消息日志 | `notification`（`/crm/marketing/messages`） |
> | Banner 曝光（如客户在 portal 看到） | `bannerImpression`（`/crm/marketing/banners`，可选） |
> | News 阅读 | `newsRead`（`/crm/marketing/news`，可选） |
> | Opt-in 偏好 | `User.notifications`（multi-channel toggle） |
>
> **本 tab 不写 marketing model** — 完全聚合各模块的客户过滤视图。

### 12.1 目的

把"客户**收到过**什么营销 / 通信 + 他**反应**怎样"集中到一处。给：
- **Marketing**：看自家 campaign 对单客户实际触达 + 转化
- **Support**：客户说"没收到通知" / "邮件被发到 spam" 时定位
- **Compliance**：客户投诉 marketing 时复现完整通信史

### 12.2 数据展示

**A. 顶部偏好卡（客户的通知偏好快照）**

四个 toggle 状态 + 上次修改时间 + 谁改的：
- Email marketing
- SMS marketing
- Push marketing
- Phone calls OK

灰色显示客户当前设置 + 一个 "Edit preferences" 按钮（跳 Permissions tab Marketing 偏好）

**B. KPI 条**

| KPI |
|---|
| 30 天内收到通讯次数（按 channel）/ 打开率 / 点击率 / 命中 campaign 数 / Opt-out 次数累计 / Last engagement at |

**C. 主时间线 / 列表（按时间倒序）**

每条统一展示（不同 channel 用 chip + color 区分）：

| 字段 |
|---|
| Channel chip (email / SMS / push / in-app / banner_impression / news_view) / Direction（outbound 系统发 / inbound 客户互动）/ Type（transactional / marketing / security）/ Subject 或 Title / Template / Campaign（如属于一个 campaign）/ Status（sent / delivered / opened / clicked / bounced / failed / spam）/ Sent at / Opened at / Clicked at |

支持过滤：channel / type / campaign / has-engagement / date range。

**D. Campaign 维度切片（可切到 "By Campaign" view）**

| 字段 |
|---|
| Campaign name / 触达此客户次数 / Open / Click / Convert（如有归因） / 客户当前是否还在 segment 内 |

**E. 模板 + raw 详情（点开任一行）**

- 完整 subject + body 预览（含变量替换后）
- 投递事件时间线（queued → sent → delivered → opened → clicked / bounced）
- Provider raw response（折叠）
- 关联资源（campaign / ticket / case）

### 12.3 可执行操作

| 动作 | 权限 |
|---|---|
| Edit 通知偏好（toggle email/SMS/push opt-in）| support / admin（客户授权时） |
| Mark all opt-out（如客户邮件请求） | support / compliance + admin 双签 |
| Resend 单条 | support / admin |
| Manual send（员工代客户发：忘记密码邮件 / 出金确认 / 等）| support / admin |
| 跳到 campaign 看群体效果 | marketing / reports |
| 跳到 template 看本身 | marketing / admin |
| Export CSV（客户的完整通讯史，应客户 GDPR 请求） | compliance / admin |

### 12.4 副作用

| 动作 | 审计 | 时间线（客户视角） |
|---|---|---|
| Toggle opt-out | `client.preference.update` | `marketing_opted_out`（客户可见） |
| Manual send | 对应模块的 send audit（`support.email.send` / `support.sms.send` / 等） | 仅 transactional 类写客户时间线 |
| GDPR Export | `compliance.client.gdpr_export` (severity=critical) | 仅内部 |

### 12.5 与其他 tab 的边界

| 维度 | Marketing tab | Support > Tickets tab | Permissions tab |
|---|---|---|---|
| 内容 | 客户被发了什么通信 + 互动 | 客户主动发的工单 | 客户的偏好开关 |
| 视角 | "我们对客户说" | "客户对我们说" | "客户允许我们说什么" |

Permissions tab 的 Marketing § 部分**和此页同步**编辑同一字段 — 是 view consistency 问题，service 内部保证。

### 12.6 实现要点

- 数据：4 个 service 并行 fetch + merge by timestamp
- 主表用 `EnhancedDataTable tableId="client-marketing"`
- Campaign engagement：从 `marketingCampaignTarget.findMany({where:{userId}})` 拿
- 偏好编辑可在 tab 内 inline 改（避免来回跳 Permissions tab）
- Channel chip 颜色 / icon 与 Support 各 sub-page 一致

### 12.7 OPEN

| # | 问题 |
|---|---|
| M-Q1 | Banner impression / News view 是否进时间线？（数据量大，可能仅按 daily aggregate） |
| M-Q2 | 客户多账户多 campaign 时聚合维度（按用户 vs 按账户）|
| M-Q3 | GDPR export 是否包含 raw provider 响应（含 IP / 设备指纹），有数据保护边界 |

---

## Tab 13 — IB（⭐ NEW）

> **数据契约（v3）**：IB tab 是 `IB` 模块的客户级视图。
>
> | 用途 | Canonical |
> |---|---|
> | IB 主表 | `prisma.ibPartner` |
> | IB tier / commission rate | `ibPartner.level` + `commissionRate` |
> | 佣金记录 | `prisma.commissionRecord` |
> | IB tree（上下游） | `ibPartner.parentId` 形成的树 |
> | 全局 IB 管理 | `/crm/ib` + 即将加入 sidebar 的 `/crm/ib/{tree,commissions,settings}` |
> | IB 摘要 chip | `IBSummary` (`@/types/core/ib-summary`) |
>
> 本 tab 不新建 IB 模型 — 客户视角下展示**此客户作为 IB / 作为下属 / 既无**的 3 种状态。

### 13.1 目的

把客户的"**IB 关系**"汇总展示。一个客户可能：
- 是 IB（吸引下线获佣金）
- 是某 IB 的下线（被推荐来的）
- 同时是（IB 被另一个 IB 推荐来 — 多级 IB 网络）
- 都不是

每种情况展示不同内容。给 sales / partnership / risk 三类员工都用。

### 13.2 数据展示（按客户状态分情形）

#### Case A：客户**是 IB**

**顶部 IB 卡**：
- IB Code + Tier badge（IBTier: 1/2/3/partner）
- 当前 commission rate（与 tier 默认比较，highlight override）
- Total clients invited / Active clients (30d) / FTD rate / Avg deposit per client
- Total commission earned (lifetime / month / 待付) / Last payout

**下线树**：
- 用 echarts tree 或简易卡片网格
- 直接下线（depth 1）+ 二级下线（depth 2）
- 每节点显示：客户 name / uid / KYC status / deposit / commission generated for this IB
- 点击节点跳对方 client detail

**佣金记录表**（`prisma.commissionRecord.findMany({where:{ibId}})`）：
- 期间 / 金额 / 状态（pending / paid / cancelled）/ 对应下线 / 关联订单
- 同 `/crm/ib/commissions` 列

**Sub-IB Allowed**：是否允许此 IB 再发展下属 IB（toggle，跳 Permissions tab IB §）

#### Case B：客户**是某 IB 的下线**

**Parent IB 卡**：
- IB name + UID + Tier + IB Code（用于注册时 referral code 追溯）
- 此客户给 IB 创造的 commission（lifetime）
- 加入时间（注册时 referral 关系建立）
- IB 联系信息（如开放给运营）

**Referral chain**（如果 IB 之上还有上级 IB）：
- 树状展示 referral 链：当前客户 ← 直 IB ← 上级 IB ← ...
- 每级显示 commission 分成比例

**Account Manager 分配**（如启用）：
- 此客户的 dedicated AM（如 VIP）
- AM 联系方式

#### Case C：客户**既不是 IB 也无 IB 关系**

简化提示：
- "This client is not an IB and has no IB referral on record."
- 一个 "Convert to IB" 按钮（admin 操作）跳 `/crm/ib/settings?customerId=X` 创建 IB 流程

### 13.3 可执行操作

| 动作 | 权限 | 适用 Case |
|---|---|---|
| Convert to IB | admin only | C → A |
| Change IB tier | admin | A |
| Override commission rate | admin + 必填 reason | A |
| Toggle sub-IB allowed | admin | A |
| Trigger commission payout (manual) | finance + admin 双签 | A |
| Reassign parent IB（把客户从 IB X 转到 IB Y） | admin + compliance（防滥用） | B |
| Mark referral disputed（IB 投诉抢客户） | compliance | B |
| Open IB details in module | viewer+ | A or B |
| View commission detail | finance / viewer+ | A or B |
| Generate IB statement PDF | finance / compliance | A |

### 13.4 副作用

| 动作 | 审计 | 时间线（客户视角） |
|---|---|---|
| Convert to IB | `ib.partner.create` | `ib_enrolled` |
| Change tier | `ib.partner.tier_change` | `ib_tier_changed` |
| Override commission | `ib.commission.override` (severity=warning) | 仅内部 |
| Reassign parent | `ib.referral.reassign` (severity=critical) | `ib_referral_changed`（客户能看） |
| Manual payout | `ib.commission.payout` | `commission_paid`（客户作为 IB 收到时） |

### 13.5 与 `/crm/ib` 模块的边界

| 维度 | Client Detail IB tab | `/crm/ib` 主入口 |
|---|---|---|
| 范围 | 单客户的 IB 关系 | 全平台 IB 网络管理 |
| 主要用途 | 看这个客户是怎么进来的 / 创造了多少佣金 | 跨 IB 排名 / 佣金总账 / 树形浏览 |
| 操作 | 单客户级（tier 改 / reassign） | 全局（bulk payout / global stats） |

### 13.6 实现要点

- 数据：`prisma.ibPartner` + `commissionRecord` 一次性 fetch
- 下线树：echarts `graph` with `layout=force`（已在项目用过）
- IB chip 复用 `IBSummary` + `IBSummaryHover` 弹层
- 树深度默认显示 2 级（防止巨型 IB 网络爆 UI）；"Expand" 按需加载更深

### 13.7 OPEN

| # | 问题 |
|---|---|
| I-Q1 | Multi-level commission（IB A 的下线 IB B 的下线 commission 分成给 A 多少）规则在 `/crm/ib/settings` 配置？此 tab 仅显示？ |
| I-Q2 | Reassign parent IB 是否触发对原 IB 的通知（"你失去了一个下线"）？ |
| I-Q3 | 客户作为 IB 时，是否他自己在 portal 可以看自己的下线？数据脱敏到什么程度？ |

---

## 跨 tab 的 ops 模式

| 场景 | 流转 |
|---|---|
| 客户邮件投诉收到 → 自动创 Ticket | Ticket(type=complaint) → 分配 → 回复 → resolve |
| 风控发现可疑设备 → 加 Note 提醒 sales 别推 VIP | Note(type=risk, pinned) |
| Note 显示需要法律介入 → 转 Case | Note → Case → Cases tab 处理 |
| 客户出金被拒 → 客户开 Ticket 申诉 → 升级 Case | Ticket(risk_appeal) → escalate → Case(dispute) |
| 同 IP 多客户登录 → 风控自动 + 通知 compliance | Devices flagged → Note 自动添加 → Compliance 决定开 Case |
| Campaign A 命中此客户但客户全 opt-out | Marketing tab 显示 0 触达 → 提示员工说服客户重新订阅 |
| 客户开 Ticket 抱怨 spam | Ticket(complaint) ← Marketing tab 反向查通讯历史，定位是哪条信息 → 升级 → Compliance 案例 |
| 客户被 IB 投诉抢客户 | IB tab `Mark referral disputed` → 开 Case(type=dispute) → IB tab 显示争议状态 |
| IB 投诉佣金少算 | IB tab 看 commission detail → 跳 `/crm/ib/commissions` 复算 → 必要时调账（Funds tab） |
