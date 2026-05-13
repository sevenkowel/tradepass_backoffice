# `/crm/support/push` — Push Notification Log

> **数据契约**：
> - 新建 `prisma.pushLog`：id / clientId / channel (`in_app` / `web_push` / `mobile_push`) / type (`transactional` / `marketing` / `security`) / template_id / title / body / payload (JSON action) / device_token / status (`queued`/`sent`/`delivered`/`failed`/`opened`) / opened_at / provider (`fcm` / `apns` / `onesignal` / `internal`) / created_at
> - `prisma.userDevice` 已有（多设备 push token 管理）

---

## 1. 目的

CRM 推送通道日志 + 模板管理。FX broker 推送主要用于：
- **In-App**：站内通知（红点 / 通知中心 / forced popup for re-verification per RestrictionLevel.important）
- **Web Push**：客户在浏览器开 portal 时（Service Worker）
- **Mobile Push**：客户用 iOS / Android app 时

类别：
- Transactional（出金到账、KYC 通过、margin call）
- Security（新设备登录、密码改）
- Marketing（受限，需 opt-in）
- Re-Verification 触发的 `forced_popup` per `RestrictionLevel.important`

---

## 2. 数据展示

### 2.1 顶部 KPI

| KPI |
|---|
| 24h 发送量 / 投递率（按 channel） / 打开率 / 失败数 / 客户设备覆盖率（注册过 push token 的客户比例） |

### 2.2 列表

| 字段 |
|---|
| Sent at / Client / Channel (in_app / web / mobile) / Type / Template / Title / Status / Opened at / Provider / Device |

### 2.3 详情 Drawer

- 完整 title + body + payload（含 deep link）
- 投递事件
- Device 详情（OS / app version）
- 关联资源（如 ticket / re-verification request）

### 2.4 Template 管理 tab

字段：title / body / action payload (`deep_link` / `external_url` / `dismiss_only`) / image (optional) / icon / 5 类严重度（per ReVerification PRD）

### 2.5 Settings tab

- Provider config（FCM key / APNs cert / 等）
- Default channel preference（按 type 应该走哪个 channel）
- Forced popup 配置（哪些 type 触发 RestrictionLevel.important 的强制弹窗）

---

## 3. 可执行操作

| 动作 | 权限 |
|---|---|
| Resend | support / admin |
| Cancel queued | support / admin |
| Bulk push | marketing / admin |
| Send test | marketing / admin |
| Template CRUD | marketing / admin |
| Configure provider | admin |
| Export CSV | support / admin |

---

## 4. 过滤 / 排序

| 过滤 |
|---|
| Channel / Type / Status / Template / Date range / Has opened |

---

## 5. 副作用

| 动作 | 审计 |
|---|---|
| Bulk push | `support.push.bulk_send` (severity=warning) |
| Forced popup template change | `support.push_template.update` (severity=critical)（强制弹窗影响客户体验） |
| Provider config | `support.push_provider.config` |

---

## 6. 实现要点

- Provider abstraction：`@/lib/integrations/push.ts`
- In-app push：WebSocket / Server-Sent Events 推到 portal 站内通知中心
- Web Push：Service Worker + VAPID
- Mobile Push：FCM (Android + iOS via FCM HTTP v1) / APNs HTTP/2
- Device token 注册：portal / mobile app 启动时上报，clientDevice 表
- Token 过期清理：定期 batch 检查
- Forced popup 通过 in-app channel + payload type `force_popup`，前端组件强制阻断 UI

---

## 7. 边界

| 此页 | Client Detail Logs tab | Re-Verification Templates |
|---|---|---|
| 全平台 push + 模板 | 单客户的 push 子集 | re-verification 专用模板（PRD §11） |

> Re-Verification 通知模板**部分重叠**（PRD §11 定义 4 channel × N type 的 slot 模板）。建议：re-verification 的模板在 `/crm/clm/re-verification/templates` 配置；通用 push 模板在此页。运行时 service 自动选模板。

---

## 8. OPEN

| # | 问题 |
|---|---|
| Q1 | In-App push 和 Email / SMS 是同等地位还是补充？哪类通知 fallback 到 email？ |
| Q2 | Forced popup 是否需要客户确认才能继续用 portal？还是只显示一次？ |
| Q3 | Re-Verification 通知与此页模板的关系：分离还是统一？ |
