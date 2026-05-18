# Portal MVP 核心用户流程设计方案

## 一、现状盘点（已有基础设施）

### 1.1 数据库
**不需要引入额外数据库。** 当前使用 SQLite + Prisma，已有完整模型：

| 模型 | 已有字段 | 状态 |
|---|---|---|
| `User` | email, passwordHash, name, phone, status, emailVerifiedAt, kycStatus, twoFactorSecret, twoFactorEnabled, lastLoginAt | ✅ 可用 |
| `Tenant` | ownerId, brandName, config, plan, status 等 | ✅ 可用 |
| `TenantConfig` | brand, auth(JSON), kyc(JSON), trading(JSON), payment(JSON), mvpMode | ✅ 可用 |
| `TenantMember` | tenantId, userId, role | ✅ 可用 |
| `KYCRecord` | userId, regionCode, kycLevel, status, documents, personalInfo 等 | ✅ 可用 |
| `MTAccount` | userId, mtLogin, leverage, balance, status | ✅ 可用 |
| `Wallet` | userId, currency, balance, frozen, available | ✅ 可用 |
| `Transaction` | type(deposit/withdrawal/transfer/commission), amount, status, method | ✅ 可用 |
| `PaymentMethod` | userId, type, provider, last4 | ✅ 可用 |
| `EmailVerification` | email, token, expiresAt | ✅ 可用 |
| `Subscription/License` | tenant 产品订阅和许可证 | ✅ 可用 |

### 1.2 已有 API
- `POST /api/auth/register` — 注册 + 自动创建租户/产品订阅
- `GET /api/auth/me` — 获取当前用户
- `POST /api/kyc/submit` — KYC 提交（已修复）
- `GET /api/kyc/status` — KYC 状态（已改为真实查询）
- `POST /api/backoffice/kyc/review` — Backoffice 审核
- Backoffice CRM / Users / Reports / Marketing 模块（已完成）

### 1.3 已有 Portal 页面
- `/portal/kyc/*` — KYC 4 步流程（document → liveness → personal-info → agreements）
- `/portal/kyc/status` — KYC 状态页
- `/portal` — Portal 首页（待完善）

---

## 二、核心用户流程设计

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Portal 用户 MVP 流程                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐      │
│  │  注册     │───→│  登录     │───→│  选择租户 │───→│  KYC     │      │
│  │ (注册页)  │    │ (登录页)  │    │ (租户切换)│    │ (4步流程)│      │
│  └──────────┘    └──────────┘    └──────────┘    └────┬─────┘      │
│       │                                               │            │
│       ▼                                               ▼            │
│  ┌──────────┐                              ┌──────────────────┐   │
│  │ Backoffice│◄────────────────────────────│  审核状态同步     │   │
│  │ 用户列表  │                              │  submitted →     │   │
│  └──────────┘                              │  approved/reject │   │
│                                            └──────────────────┘   │
│                                                                     │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐      │
│  │ 开户     │───→│ 入金     │───→│ 交易     │───→│ 出金/转账│      │
│  │ MT账户  │    │ 存款     │    │ (简版)   │    │ 提现     │      │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 三、验证码简化方案

### 3.1 OTP（手机/邮箱验证）
| 场景 | 位数 | 规则 | 示例（2026年4月28日） |
|---|---|---|---|
| 邮箱验证码 | 4位 | `MMDD`（月日） | `0428` |
| 手机验证码 | 4位 | `MMDD`（月日） | `0428` |
| 密码重置验证码 | 4位 | `MMDD`（月日） | `0428` |

**实现方式**：后端验证逻辑中，不调用真实短信/邮件网关，直接比对输入是否等于当天 `MMDD`。

### 3.2 2FA（二次验证）
| 场景 | 位数 | 规则 | 示例（2026年4月28日） |
|---|---|---|---|
| 登录 2FA | 6位 | `YYMMDD`（年月日） | `260428` |
| 敏感操作 2FA | 6位 | `YYMMDD`（年月日） | `260428` |
| 大额提现 2FA | 6位 | `YYMMDD`（年月日） | `260428` |

**实现方式**：后端 `verify2FACode(code)` 中，比对输入是否等于当天 `YYMMDD`。

### 3.3 开发体验
- 前端输入框 placeholder 显示当天验证码提示（如 "今日验证码：0428"）
- 不依赖外部短信/邮件服务，Demo 环境随时可用
- 生产环境可切换为真实网关（阿里云/AWS SNS/SendGrid）

---

## 四、租户表单配置设计

### 4.1 配置存储
扩展 `TenantConfig.auth` JSON 字段，支持注册登录表单配置：

```json
{
  "methods": ["email", "phone"],
  "registerFlow": "standard",
  "loginFlow": "password_or_2fa",
  "registerForm": {
    "fields": [
      { "name": "email", "type": "email", "required": true, "label": "邮箱" },
      { "name": "phone", "type": "tel", "required": true, "label": "手机号" },
      { "name": "password", "type": "password", "required": true, "label": "密码", "minLength": 8 },
      { "name": "name", "type": "text", "required": true, "label": "姓名" },
      { "name": "referralCode", "type": "text", "required": false, "label": "推荐码" },
      { "name": "country", "type": "select", "required": true, "label": "国家/地区", "options": [...] }
    ],
    "verification": {
      "email": { "enabled": true, "required": true },
      "phone": { "enabled": true, "required": true }
    },
    "agreements": [
      { "id": "terms", "required": true, "label": "服务条款" },
      { "id": "privacy", "required": true, "label": "隐私政策" },
      { "id": "risk", "required": true, "label": "风险披露" }
    ]
  },
  "loginForm": {
    "fields": [
      { "name": "email", "type": "email", "required": true, "label": "邮箱" },
      { "name": "password", "type": "password", "required": true, "label": "密码" }
    ],
    "twoFactor": { "enabled": false, "required": false }
  }
}
```

### 4.2 配置方式
- **默认配置**：每个租户注册时自动生成上述默认配置
- **Backoffice 配置**：在 Backoffice 系统设置 → 认证配置 页面可编辑
- **Portal 读取**：Portal 注册/登录页挂载时，`GET /api/config/auth` 读取当前租户配置并渲染表单

### 4.3 动态表单渲染
Portal 注册页根据 `TenantConfig.auth.registerForm.fields` 动态渲染输入框：
- `type: "email"` → email input
- `type: "tel"` → phone input + 发送验证码按钮
- `type: "select"` → select dropdown
- `type: "password"` → password input + 强度提示
- `required: true` → 前端校验必填

---

## 五、数据模型调整（最小化）

### 5.1 新增表

```prisma
// 手机验证码记录（替代真实 SMS 网关）
model PhoneVerification {
  id        String   @id @default(cuid())
  phone     String
  code      String   // 存储当天 MMDD
  verified  Boolean  @default(false)
  expiresAt DateTime @map("expires_at")
  createdAt DateTime @default(now()) @map("created_at")

  @@map("phone_verifications")
}

// 登录 OTP/2FA 会话（用于敏感操作验证）
model TwoFactorSession {
  id        String   @id @default(cuid())
  userId    String   @map("user_id")
  purpose   String   // login, withdrawal, transfer, password_change
  code      String   // 存储当天 YYMMDD
  verified  Boolean  @default(false)
  expiresAt DateTime @map("expires_at")
  createdAt DateTime @default(now()) @map("created_at")

  @@map("two_factor_sessions")
}
```

### 5.2 User 模型扩展（可选字段）
```prisma
model User {
  // ... 已有字段 ...
  
  // 新增（可选，不影响已有数据）
  phoneVerifiedAt   DateTime? @map("phone_verified_at")
  referralCode      String?   @unique @map("referral_code")
  referredBy        String?   @map("referred_by")
  country           String?
  
  // 关系已有：memberships(TenantMember), kycRecord, mtAccounts, wallets, transactions
}
```

### 5.3 是否需要 migrate？
**是的**，需要运行 `npx prisma migrate dev` 应用新增表。已有数据不受影响。

---

## 六、API 设计

### 6.1 认证相关

```
POST /api/auth/register          # 注册（扩展：支持 phone, country, referralCode）
POST /api/auth/login             # 登录（支持 password + optional 2FA）
POST /api/auth/verify-email      # 邮箱验证（OTP = MMDD）
POST /api/auth/verify-phone      # 手机验证（OTP = MMDD）
POST /api/auth/forgot-password   # 忘记密码
POST /api/auth/reset-password    # 重置密码
POST /api/auth/2fa/setup         # 启用 2FA
POST /api/auth/2fa/verify        # 验证 2FA（code = YYMMDD）
POST /api/auth/logout            # 登出
GET  /api/auth/me                # 获取当前用户信息
GET  /api/config/auth            # 获取当前租户认证配置（动态表单）
```

### 6.2 KYC 相关（已有，需确保联动）

```
GET  /api/kyc/config             # 获取 KYC 配置
POST /api/kyc/documents          # 上传证件
POST /api/kyc/ocr                # OCR 识别
POST /api/kyc/liveness           # 活体检测
POST /api/kyc/personal-info      # 提交个人信息（新增：保存到数据库）
POST /api/kyc/agreements         # 签署协议（已有，已修复）
POST /api/kyc/submit             # 提交审核（已有，已修复）
GET  /api/kyc/status             # 查询状态（已有，已改为真实查询）
```

### 6.3 交易账户（MTAccount）

```
POST /api/accounts/create        # 创建首个 MT5 账户（KYC approved 后）
GET  /api/accounts               # 查询用户所有账户
GET  /api/accounts/:id           # 查询账户详情
POST /api/accounts/:id/reset-password  # 重置 MT 密码
```

### 6.4 资金（Wallet + Transaction）

```
GET  /api/wallets                # 查询用户钱包列表
POST /api/wallets/deposit        # 入金申请
POST /api/wallets/withdrawal     # 出金申请（需 2FA）
POST /api/wallets/transfer       # 转账（钱包 → MTAccount）
GET  /api/transactions           # 查询交易记录
```

### 6.5 Backoffice 联动 API

```
GET  /api/backoffice/users       # 用户列表（注册后自动同步）
GET  /api/backoffice/users/:id   # 用户详情
PUT  /api/backoffice/users/:id   # 编辑用户
GET  /api/backoffice/accounts    # 交易账户列表
GET  /api/backoffice/wallets     # 钱包列表
GET  /api/backoffice/transactions# 资金流水
```

---

## 七、Backoffice 联动机制

### 7.1 用户注册 → Backoffice 同步

```
Portal 注册成功
  ├─ 创建 User 记录
  ├─ 创建 Tenant 记录
  ├─ 创建 TenantMember(owner) 记录
  └─ Backoffice 用户列表自动可见
      └─ GET /api/backoffice/users 查询 users 表（已有数据）
```

**不需要额外的同步机制** — Backoffice 直接查询 `users` 表即可。注册时 `user.status = "pending_verification"`，验证后变为 `"active"`。

### 7.2 KYC 提交 → Backoffice 审核

```
Portal KYC 提交
  └─ KYCRecord.status = "submitted"
      └─ Backoffice KYC 审核页自动显示
          └─ GET /api/backoffice/kyc/review?status=submitted
              └─ 审核员操作 approve/reject/request_info
                  └─ KYCRecord.status 更新 + user.kycStatus 同步
                      └─ Portal /api/kyc/status 返回最新状态
```

**已有，已修复。**

### 7.3 开户 → Backoffice 同步

```
KYC approved
  └─ 自动创建 MTAccount + Wallet（Backoffice 审核 approve 时触发）
      └─ Backoffice 交易账户列表可见
```

**已有逻辑** — `createMTAccount()` 在 Backoffice approve 时自动调用。

### 7.4 资金流水 → Backoffice 同步

```
Portal 入金/出金/转账
  └─ 创建 Transaction 记录
      └─ Backoffice 资金流水页直接查询 transactions 表
```

**不需要额外同步** — Backoffice 直接查询 `transactions` 表。

---

## 八、页面结构

### 8.1 Portal（面向用户）

```
/portal
├── /auth
│   ├── /register              # 注册页（动态表单）
│   ├── /login                 # 登录页
│   ├── /verify-email          # 邮箱验证
│   ├── /verify-phone          # 手机验证
│   ├── /forgot-password       # 忘记密码
│   └── /reset-password        # 重置密码
├── /kyc
│   ├── /                      # KYC 入口/地区选择
│   ├── /document-upload       # 证件上传
│   ├── /liveness              # 活体检测
│   ├── /personal-info         # 个人信息
│   ├── /agreements            # 协议签署
│   └── /status                # KYC 状态
├── /accounts
│   ├── /                      # 账户列表
│   └── /create                # 创建账户（首次开户）
├── /funds
│   ├── /deposit               # 入金
│   ├── /withdrawal            # 出金
│   └── /history               # 资金记录
├── /transfer                  # 转账（钱包 ↔ 账户）
├── /settings
│   ├── /profile               # 个人资料
│   ├── /security              # 安全设置（2FA）
│   └── /payment-methods       # 支付方式
└── /                          # Portal 首页（Dashboard）
```

### 8.2 Backoffice（面向运营）

已有模块，需要补充用户管理和资金模块：

```
/backoffice
├── /compliance
│   └── /kyc-review            # KYC 审核（已有）
├── /crm
│   ├── /tickets               # 工单（已有）
│   ├── /feedback              # 反馈（已有）
│   └── /users                 # 用户管理（需补充）
├── /funds                     # 资金管理（需补充）
│   ├── /deposits              # 入金审核
│   ├── /withdrawals           # 出金审核
│   └── /transactions          # 资金流水
├── /accounts                  # 交易账户（需补充）
└── /reports                   # 报表（已有）
```

---

## 九、实施计划（分阶段）

### Phase 1：注册登录 + 租户表单配置
**目标**：用户可以注册、登录、验证邮箱/手机

| 任务 | 文件 | 工作量 |
|---|---|---|
| 数据模型扩展（PhoneVerification, TwoFactorSession, User 字段） | `prisma/schema.prisma` | 小 |
| Prisma migrate | — | 小 |
| 验证码工具（getTodayOTP / getToday2FA / verifyCode） | `src/lib/auth/otp.ts` | 小 |
| 租户认证配置 API | `src/app/api/config/auth/route.ts` | 中 |
| Portal 注册页（动态表单 + OTP 验证） | `src/app/portal/auth/register/page.tsx` | 中 |
| Portal 登录页（+ 2FA 支持） | `src/app/portal/auth/login/page.tsx` | 中 |
| 邮箱/手机验证页 | `src/app/portal/auth/verify-*/page.tsx` | 小 |
| 密码重置流程 | `src/app/portal/auth/forgot-password/page.tsx` | 小 |
| Backoffice 用户列表页 | `src/app/backoffice/crm/users/page.tsx` | 中 |

### Phase 2：KYC 流程完善
**目标**：KYC 4 步流程可完整走通，数据保存到数据库

| 任务 | 文件 | 工作量 |
|---|---|---|
| KYC document-upload 保存到数据库 | `src/app/api/kyc/documents/route.ts` | 小 |
| KYC liveness 保存到数据库 | `src/app/api/kyc/liveness/route.ts` | 小 |
| KYC personal-info 保存到数据库 | `src/app/api/kyc/personal-info/route.ts` | 小 |
| KYC 流程步骤状态持久化 | `src/lib/kyc/store.ts` | 小 |
| Portal KYC 状态页优化 | `src/app/portal/kyc/status/page.tsx` | 小 |

### Phase 3：开户 + 存取款
**目标**：KYC 通过后用户可开户、入金、出金、转账

| 任务 | 文件 | 工作量 |
|---|---|---|
| 开户 API（KYC approved 后允许创建） | `src/app/api/accounts/create/route.ts` | 中 |
| Portal 开户页 | `src/app/portal/accounts/create/page.tsx` | 中 |
| 入金 API | `src/app/api/wallets/deposit/route.ts` | 中 |
| 出金 API（需 2FA） | `src/app/api/wallets/withdrawal/route.ts` | 中 |
| 转账 API | `src/app/api/wallets/transfer/route.ts` | 中 |
| Portal 资金页 | `src/app/portal/funds/*` | 中 |
| Backoffice 资金审核页 | `src/app/backoffice/funds/*` | 中 |

### Phase 4：Portal Dashboard + 优化
**目标**：Portal 首页展示用户资产、账户、待办

| 任务 | 文件 | 工作量 |
|---|---|---|
| Portal Dashboard | `src/app/portal/page.tsx` | 中 |
| 用户设置页 | `src/app/portal/settings/*` | 小 |
| 安全中心（2FA 设置） | `src/app/portal/settings/security/page.tsx` | 小 |
| 响应式适配 + 体验优化 | — | 中 |

---

## 十、关键决策

### 10.1 是否需要额外数据库？
**不需要。** 当前 SQLite + Prisma 完全够用。MVP Demo 阶段数据量小，SQLite 性能足够。后续可无缝迁移到 PostgreSQL（只需改 `datasource db` 配置）。

### 10.2 验证码是否安全？
**Demo 环境：** 统一当天日期作为验证码，方便体验流程，不依赖外部服务。  
**生产环境：** 切换为真实 SMS/邮件网关（阿里云、AWS SNS、SendGrid 等），只需替换 `otp.ts` 中的生成和验证逻辑。

### 10.3 文件存储（证件图片）？
MVP 阶段使用 Base64 存储在数据库中（`documentFrontUrl` 等字段存 data URL），或本地文件系统。  
生产环境切换到对象存储（OSS/S3）。

### 10.4 MT5 交易对接？
MVP 阶段使用模拟数据（Mock），账户创建后显示模拟余额/订单。  
生产环境对接 MT5 Manager API 或 Bridge。

---

## 十一、方案确认清单

请确认以下内容：

- [ ] **数据库**：继续使用 SQLite（Prisma），不引入新数据库
- [ ] **验证码**：OTP = MMDD（当天日期），2FA = YYMMDD（当天年月日）
- [ ] **租户表单配置**：通过 TenantConfig.auth JSON 存储，Backoffice 可编辑
- [ ] **注册后 Backoffice 同步**：Backoffice 直接查询 users 表（无需额外同步机制）
- [ ] **实施顺序**：Phase 1（注册登录）→ Phase 2（KYC）→ Phase 3（开户+资金）→ Phase 4（Dashboard）
- [ ] **MT5/交易**：MVP 阶段使用 Mock 数据，不对接真实 MT5

**确认后从 Phase 1 开始实施。**
