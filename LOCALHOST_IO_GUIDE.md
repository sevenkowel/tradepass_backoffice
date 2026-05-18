# 🌐 使用 localhost.io 访问子域名

由于 macOS hosts 文件不支持通配符，我们使用 `localhost.io` 作为替代方案。

## 访问地址（使用 localhost.io）

```
http://localhost:3002?mock=true                        # TradePass 官网
http://console.localhost.io:3002?mock=true             # Console
http://backoffice.localhost.io:3002?mock=true          # Backoffice
http://demo.localhost.io:3002?mock=true                # 租户官网 (demo)
http://portal.demo.localhost.io:3002?mock=true         # Portal
http://crm.demo.localhost.io:3002?mock=true            # CRM
```

**注意**：`localhost.io` 是一个特殊的域名，自动解析到 `127.0.0.1`，无需修改 hosts 文件。

---

## 快速开始

### 1. 启动服务器

```bash
cd tradepass
DEV_HTTP=true PORT=3002 npm run dev
```

### 2. 访问官网并启用 Mock 模式

```
http://localhost:3002?mock=true
```

### 3. 登录预设账号

| 邮箱 | 角色 | 登录后进入 |
|-----|------|-----------|
| `admin@tradepass.io` | 平台管理员 | Backoffice |

### 4. 访问子域名系统

Mock 模式启用后，可以在地址栏直接访问：

```
http://console.localhost.io:3002        # Console
http://backoffice.localhost.io:3002     # Backoffice
http://demo.localhost.io:3002           # 租户官网
http://portal.demo.localhost.io:3002    # Portal
http://crm.demo.localhost.io:3002       # CRM
```

**不需要重复添加 `?mock=true`**，因为 Mock 模式已经通过 cookie 保存。

---

## 如何切换用户

### 方法一：悬浮按钮（推荐）

登录后，右下角会出现 🎭 Mock 模式按钮，点击可：
- 一键切换到不同角色
- 重置所有数据

### 方法二：控制台命令

```javascript
// 切换到平台管理员
MockTools.switchUser('admin@tradepass.io')

// 切换到租户所有者
MockTools.switchUser('owner@demobroker.com')

// 切换到 CRM 管理员
MockTools.switchUser('admin@demobroker.com')

// 切换到普通用户
MockTools.switchUser('user@example.com')

// 重置数据
MockTools.reset()
```

---

## 预设数据

### 租户
- `demo` - Demo Broker (Professional 计划)
- `acme` - Acme FX (试用中)

### 用户
- `admin@tradepass.io` - 平台超级管理员
- `owner@demobroker.com` - Demo Broker 所有者
- `admin@demobroker.com` - Demo Broker 管理员 (CRM)
- `user@example.com` - 普通终端用户

---

## 故障排除

### Cookie 不共享？

如果切换子域名后需要重新登录，可能是 cookie domain 问题。确保：
1. 所有子域名都使用 `.localhost.io` 而非 `.localhost`
2. 首次访问时添加了 `?mock=true` 参数

### 页面显示 "unknown"？

检查 URL 格式是否正确：
- ✅ `http://portal.demo.localhost.io:3002`
- ❌ `http://portal.demo.localhost:3002` (需要添加 `.io`)

### 如何退出 Mock 模式？

清除浏览器 Cookie 中的 `mock_mode`，或访问：
```
http://localhost:3002/?mock=false
```
