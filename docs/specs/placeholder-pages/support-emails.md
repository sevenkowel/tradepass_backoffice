# `/crm/support/emails` — Email Log

> **数据契约**：
> - 新建 `prisma.emailLog`（如未有）：id / clientId / direction (`outbound`/`inbound`) / type (`transactional`/`marketing`/`security`/`reply`) / subject / from / to / cc / bcc / template_id / status (`queued`/`sent`/`delivered`/`bounced`/`failed`/`spam`/`opened`/`clicked`) / opened_at / clicked_at / bounce_reason / provider (sendgrid/ses/mailgun) / message_id / created_at
> - 模板配置：`clmConfigService` 或新建 `emailTemplates` 表
> - 客户级关联到 Tickets / Cases / Marketing Campaign

---

## 1. 目的

全平台**邮件发送审计 + 投递追踪**。包括：
- Transactional（KYC 通知 / 出金确认 / 密码重置 / 协议签署提示）
- Security（异地登录提醒 / 2FA 验证码）
- Marketing（campaign 发的，跨大量客户）
- Tickets reply（员工回复客户工单的邮件副本）
- Re-Verification 通知

→ 解决"客户说没收到邮件"客服场景；监管审计"重要通知是否送达"。

---

## 2. 数据展示

### 2.1 顶部 KPI

| KPI |
|---|
| 24h 发送量 / 投递率 / Bounce 率 / 打开率 / 点击率 / 失败数（按 provider） |

### 2.2 列表（标准 `EnhancedDataTable`）

| 字段 |
|---|
| Sent at / Client (uid + name) / Type chip / Template name / Subject (truncated) / To / Status badge / Opens / Clicks / Provider / Message ID |

### 2.3 详情 Drawer（点击行）

- 完整 subject + body 预览（含变量替换后的最终内容）
- 投递事件时间线（queued → sent → delivered / opened / clicked / bounced）
- 关联资源（ticket / case / campaign / agreement-resign）
- Provider raw 响应（折叠）
- Resend 按钮（适用 failed / bounced）

### 2.4 Template 管理（独立 tab "Templates"）

| 字段 |
|---|
| Template ID / Name / Type / Subject / Body preview / Variables 列表 / Languages (i18n) / Last edited / Status / Used count |

---

## 3. 可执行操作

| 动作 | 权限 |
|---|---|
| Search emails | viewer+ |
| Resend email | support / admin |
| Cancel queued | support / admin |
| Mark spam (provider report) | support / admin |
| 查看 raw provider response | support / admin |
| Bulk resend（同 template / 同 cohort） | marketing / admin |
| Export CSV | support / admin / compliance（带审计） |
| Send test email（template 测试） | marketing / admin |
| Create / edit template | marketing / admin（双签 for transactional templates） |
| Disable template | admin |
| Set provider failover order | admin |

---

## 4. 过滤 / 排序

| 过滤 |
|---|
| Type / Status / Provider / Template / Date range / Search by subject 或 to 或 message_id / Has opens / Has clicks / Bounced |

---

## 5. 副作用

| 动作 | 审计 |
|---|---|
| Resend | `support.email.resend` |
| Cancel queued | `support.email.cancel` |
| Bulk resend | `support.email.bulk_resend` (severity=warning) |
| Template create / edit / disable | `support.email_template.update` |
| Provider failover | `support.email_provider.config` |
| Export CSV | `support.email.export` |

---

## 6. 实现要点

- Webhook ingest from provider（SendGrid / SES / Mailgun）→ 更新 emailLog status
- Email 模板用 MJML / Handlebars
- i18n：每模板 N 个 language 版本
- Provider abstraction：`@/lib/integrations/email.ts`
- Rate limit：marketing 类不能瞬间发 10000 封压坏 provider
- Retry policy：bounced soft 重试 N 次

---

## 7. 边界

| 此页 | Client Detail Logs tab | Marketing Campaigns |
|---|---|---|
| 全平台邮件 + 模板管理 | 单客户的邮件子集 | 群发活动管理 |

---

## 8. OPEN

| # | 问题 |
|---|---|
| Q1 | Provider 选哪几家做 failover？SendGrid 主 + SES 备？ |
| Q2 | 是否提供 inbound email parsing（客户回复邮件自动 link 回 ticket）？ |
| Q3 | GDPR：客户请求"被遗忘" 时 email log 是否删除？还是脱敏？ |
