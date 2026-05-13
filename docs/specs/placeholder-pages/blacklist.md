# `/crm/risk/blacklist` — Risk Blacklist

> **数据契约**：
> - **复用** `prisma.blacklistEntry`（已存在）
> - **优先方案**：把已有 `/crm/compliance/blacklist`（已实现）移到 `/crm/risk/blacklist`，修 sidebar dead link
> - 审计走 `GlobalAuditLog(domain=risk)`

---

## 1. 修复 Dead Link

Sidebar 上 `/crm/risk/blacklist` 链接到不存在的页（dead link）。代码里实际 page 在 `/crm/compliance/blacklist`。

**3 个修复选项：**

| 选项 | 操作 | 推荐度 |
|---|---|---|
| A. 移文件 | 把 `/crm/compliance/blacklist/page.tsx` 移到 `/crm/risk/blacklist/page.tsx`；旧路径加 redirect | ⭐⭐⭐ 推荐 |
| B. 改 sidebar 链接 | sidebar 改为 `/crm/compliance/blacklist`；保持页面位置不动 | ⭐⭐ |
| C. 复制一份 | 两个路径都有；维护两份 | ❌ 不推荐 |

理由选 A：`Blacklist` 概念已统一归 Risk Center 管理（与 Whitelist 配对）；`/crm/compliance/*` 整组已在 sidebar audit 中标记为"老模块，要 redirect 走"。

---

## 2. 目的

风控**禁入名单**：标记"已知风险"的客户 / IP / 设备 / 邮箱 / 国家 / 银行账户 / 加密地址 / 证件号，**阻断**：
- 注册（新客户尝试用黑名单值注册时拒绝）
- 入金（来自黑名单地址 / 银行的入金）
- 出金（到黑名单地址 / 银行的出金）
- 登录（黑名单 IP / 设备）

---

## 3. 数据展示

### 3.1 顶部 KPI
| KPI |
|---|
| Total active entries / Recent additions (30d) / Hits prevented (30d) / Top match type / Pending review entries |

### 3.2 列表（按 type 分组 tab）

每条 entry：

| 字段 |
|---|
| ID / Type (`email / phone / ip / document_number / name / bank_account / crypto_address / device_fingerprint / country / merchant_id`) / Value（PII 掩码显示，hover 完整）/ Severity (`block / warn`) / Source（`internal / sanctions_list / fraud_database / industry_share`）/ Reason / Added by / Created / Expires at / Status / Hits count |

**Hits 详情子表**（点开 entry）：何时、被谁、什么 action 命中。

---

## 4. 可执行操作

| 动作 | 权限 |
|---|---|
| Add entry | compliance / risk |
| Edit (severity / reason / expiry) | compliance / risk + admin |
| Revoke | compliance / risk + admin（永久黑名单删除前 review） |
| Bulk import（监管 sanctions list / 行业 fraud DB） | admin only |
| Export CSV | compliance / admin |
| 关联到现有 Sanctions / Risk Event | compliance |
| 查看 hit 详情 | viewer+ |

---

## 5. 过滤 / 排序

| 过滤 |
|---|
| Type / Severity / Source / Status / Search by value / Hits count > N / Date range |

---

## 6. 副作用

| 动作 | 审计 |
|---|---|
| Add | `risk.blacklist.add` (severity=warning) |
| Edit | `risk.blacklist.update` |
| Revoke | `risk.blacklist.revoke` (severity=critical) |
| Bulk import | `risk.blacklist.bulk_import` |
| 检测到 hit（系统自动） | `risk.blacklist.hit` + 触发 block 动作 |

---

## 7. 联动 / 自动 enforcement

| 动作 | 触发 enforcement |
|---|---|
| 客户注册时 email/phone/document_number 命中 | 阻断注册 + 写 audit |
| 入金 source（IP / 卡号 / 加密地址）命中 | 自动拒绝 + 触发 SAR case |
| 出金 destination 命中 | 阻断 + 升级到 compliance review |
| 登录 IP / device 命中 | 阻断登录 + 通知客户（generic safety reason） |

---

## 8. 实现要点

- 复用 `prisma.blacklistEntry`（已存在）
- 若选 A 方案：file move + redirect from `/crm/compliance/blacklist`
- Risk Engine 在 score 时**先查 blacklist**：命中则评分上限拉满到 critical
- UI: 标准 `EnhancedDataTable` + `ConfigDrawer`
- Hits 详情用 GlobalAuditLog 查 `action=risk.blacklist.hit`

---

## 9. OPEN

| # | 问题 |
|---|---|
| Q1 | 移文件还是改 sidebar？建议 A | 待业务确认 |
| Q2 | 黑名单到期机制：永久 vs 强制 N 年 review | 监管视角 |
| Q3 | 是否接入行业共享 fraud DB（如 Onfido SharedSignals）？ |
