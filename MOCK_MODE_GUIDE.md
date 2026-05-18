# 🎭 TradePass Mock Demo 模式

## ⚠️ 重要：使用 localhost.io 访问子域名

由于 macOS/Windows hosts 文件不支持通配符 (`*.localhost`)，需要使用 `localhost.io` 替代：

```
# ✅ 正确的访问方式
http://console.localhost.io:3002
http://demo.localhost.io:3002
http://portal.demo.localhost.io:3002

# ❌ 错误的访问方式（hosts 不支持）
http://console.localhost:3002
```

完整指南见：[LOCALHOST_IO_GUIDE.md](./LOCALHOST_IO_GUIDE.md)

---

## 快速开始

### 1. 启用 Mock 模式

在官网 URL 后添加 `?mock=true` 参数：

```
http://localhost:3002?mock=true
```

启用后，Mock 模式会持续 30 天（通过 cookie 保存）。

### 然后访问各系统

```
http://console.localhost.io:3002          # Console
http://backoffice.localhost.io:3002       # Backoffice
http://demo.localhost.io:3002             # 租户官网
http://portal.demo.localhost.io:3002      # Portal
http://crm.demo.localhost.io:3002         # CRM
```

### 2. 预设用户账号

Mock 模式预置了以下账号，可直接登录：

| 角色 | 邮箱 | 密码 | 用途 |
|-----|------|------|------|
| 平台管理员 | `admin@tradepass.io` | 任意 | 进入 Backoffice |
| 租户所有者 | `owner@demobroker.com` | 任意 | 进入 Console |
| CRM 管理员 | `admin@demobroker.com` | 任意 | 进入 CRM |
| 普通用户 | `user@example.com` | 任意 | 进入 Portal |

### 3. 快速切换用户

启用 Mock 模式后，右下角会出现悬浮按钮，点击可：
- 一键切换不同角色
- 查看当前 Mock 数据
- 重置所有数据

或在浏览器控制台执行：
```javascript
// 切换到平台管理员
MockTools.switchUser('admin@tradepass.io')

// 切换到租户所有者
MockTools.switchUser('owner@demobroker.com')

// 查看所有数据
MockTools.db()

// 重置数据
MockTools.reset()
```

### 4. 访问各系统

Mock 模式下，各系统的 URL 保持不变：

```
# TradePass 平台
http://localhost:3002          # 官网
http://console.localhost:3002  # Console
http://backoffice.localhost:3002 # Backoffice

# 租户业务系统
http://demo.localhost:3002           # 租户官网
http://portal.demo.localhost:3002    # Portal
http://crm.demo.localhost:3002       # CRM
```

### 5. 数据持久化

所有数据存储在浏览器 LocalStorage 中：
- ✅ 刷新页面数据不丢失
- ✅ 不同子域名共享数据
- ✅ 支持多用户同时登录测试

### 6. 退出 Mock 模式

清除浏览器 Cookie 中的 `mock_mode` 即可。

---

## 架构说明

### 文件结构

```
src/lib/mock/
├── types.ts        # Mock 数据类型定义
├── mockDB.ts       # LocalStorage 数据库层
├── mockFetch.ts    # API Mock 拦截器
└── index.ts        # 入口，导出所有功能

src/components/providers/
└── MockProvider.tsx  # Mock 模式 UI 组件
```

### 数据模型

```typescript
// 主要数据实体
- tenants: 租户列表
- users: 用户列表
- kycRecords: KYC 记录
- deposits: 存款记录
- withdrawals: 提款记录
- tradingAccounts: 交易账户
- notifications: 通知消息
```

### API 支持

Mock 模式支持以下 API：

```
POST   /api/auth/login
POST   /api/auth/register
POST   /api/auth/logout
GET    /api/auth/me

GET    /api/tenants
GET    /api/tenants/:id
POST   /api/tenants
GET    /api/tenants/by-subdomain/:subdomain

GET    /api/kyc/status
GET    /api/kyc/records
POST   /api/kyc/submit

GET    /api/funds/deposits
GET    /api/funds/withdrawals
POST   /api/funds/deposit

GET    /api/notifications
PATCH  /api/notifications/:id/read

GET    /api/users
```

---

## 扩展 Mock 数据

在 `src/lib/mock/mockDB.ts` 中的 `initialData` 对象添加更多示例数据。

---

## 切换回真实模式

删除 Cookie `mock_mode`，或访问：
```
http://localhost:3002/?mock=false
```
