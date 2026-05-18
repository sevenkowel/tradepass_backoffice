# `/crm/support/sms` — SMS Log

> **数据契约**：
> - 新建 `prisma.smsLog`：id / clientId / direction / type (`otp` / `notification` / `marketing` / `reply`) / phone (E.164) / template_id / message_body / status (`queued`/`sent`/`delivered`/`failed`/`undeliverable`/`replied`) / provider (twilio / vonage / msg91 / etc.) / segments_used / cost_estimate / message_id / created_at
> - 与 [support-emails.md](./support-emails.md) **同构**

---

## 1. 目的

全平台 SMS 发送审计 + 成本追踪 + 投递质量监控。SMS 是 FX broker 的关键通道：
- **OTP**（登录 / 出金 / 改密码 2FA）— 必须送达
- **Security**（异地登录警告）
- **Transactional**（出金到账确认）
- **Marketing**（受限，需要 opt-in）

> SMS 成本高 + 监管对营销 SMS 严（GDPR / TCPA / 等），追踪 cost / opt-out / 错号率是核心需求。

---

## 2. 数据展示

### 2.1 顶部 KPI

| KPI |
|---|
| 24h 发送量 / 投递率 / 平均成本 / Top destination countries / Failed count / Opt-out 累计数 / OTP 成功率 |

### 2.2 列表

| 字段 |
|---|
| Sent at / Client / Type / Template / Phone (masked) / Country code / Status / Segments (1 SMS = 160 chars, 长 message 分段计费) / Cost / Provider / Message ID |

### 2.3 详情 Drawer
- 完整 message body
- 投递事件
- Provider raw response
- Resend / Cancel
- 关联 ticket / OTP request / campaign

### 2.4 Template 管理（独立 tab）

注意 SMS 模板**字符数硬限制**（160 单段 / 70 unicode）— UI 显示实时段数 + 估算成本。

### 2.5 国际化路由（独立 tab "Routing"）

| 字段 |
|---|
| Country code / Default provider / Fallback provider / Cost per segment / Quality score |

---

## 3. 可执行操作

| 动作 | 权限 |
|---|---|
| Resend SMS | support / admin |
| Cancel queued | support / admin |
| Bulk resend | marketing / admin（受 opt-in / regulatory check） |
| Update template | marketing / admin（OTP / Security 类需 admin 双签） |
| Send test SMS | marketing / admin |
| Configure country routing | admin |
| Disable provider | admin |
| Export CSV | support / admin / compliance |
| Mark client opt-out manually | support / admin |

---

## 4. 过滤 / 排序

| 过滤 |
|---|
| Type / Status / Country / Provider / Date range / Cost 范围 / Template / Search by phone (encrypted) |

---

## 5. 副作用

| 动作 | 审计 |
|---|---|
| Bulk send | `support.sms.bulk_send` (severity=warning) |
| Template update (OTP / Security) | `support.sms_template.update` (severity=critical) |
| Provider switch / disable | `support.sms_provider.config` |
| Mark opt-out | `support.sms.opt_out` |

---

## 6. 实现要点

- Provider abstraction：`@/lib/integrations/sms.ts` （Twilio / Vonage / MSG91 / Telesign）
- 多 provider failover by country
- OTP 必须**实时** delivery 监控；> 30s 未送达自动 retry 备用 provider
- Marketing SMS 强制 check `client.notifications.smsMarketing` opt-in
- TCPA / GDPR 合规：opt-out list 永久保留
- 成本估算 + 月度报表（marketing 支出审计）

---

## 7. 边界

| 此页 | Client Detail Logs tab |
|---|---|
| 全平台 SMS + provider 管理 | 单客户的 SMS 子集 |

---

## 8. OPEN

| # | 问题 |
|---|---|
| Q1 | Provider 选型：Twilio（贵 + 覆盖全） / Vonage / 区域 provider 混合？ |
| Q2 | Marketing SMS 是否启用（很多 broker 禁用以避免合规风险） |
| Q3 | OTP delivery SLA 多严：30s p95 vs 60s p95 |
