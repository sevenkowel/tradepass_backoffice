# `/crm/risk/whitelist` — Risk Whitelist

> **数据契约**：
> - 新建 Prisma 模型 `RiskWhitelist`（不复用 `BlacklistEntry`，语义反向）
> - 字段：id / type / value / scope / reason / addedBy / expiresAt / createdAt
> - 审计走 `GlobalAuditLog(domain=risk)`

---

## 1. 目的

风控**豁免名单**：标记"已知安全"的客户 / IP / 设备 / 国家，使其**跳过**特定风控规则。常见场景：
- 内部测试账户
- 高价值 VIP 客户（手动豁免某些异常检测）
- 公司员工 / IB 自己的账户
- 集团内部 IP
- 测试 / 监管沙箱国家

---

## 2. 数据展示

### 2.1 列表（按 type 分组 tab）

每条 whitelist entry：

| 字段 |
|---|
| ID / Type (`client / ip / device / country / email_domain / referrer_code`) / Value（具体值，e.g. uid 或 IP 或 dev fingerprint）/ Scope（豁免哪些规则，multi-select：`anomaly_detection / aml_screening / amount_limits / kyc_renewal / withdrawal_review / all`）/ Reason / Added by / Created / Expires at / Status (`active / expired / revoked`) |

### 2.2 顶部 KPI

| KPI |
|---|
| Total active entries / By type counts / Expiring next 7 days / Revoked (30d) |

---

## 3. 可执行操作

| 动作 | 权限 |
|---|---|
| Add entry | risk + admin 双签（避免单人豁免风控） |
| Edit (scope / reason / expiry) | risk + admin |
| Revoke | risk + admin |
| Bulk import CSV | admin only |
| Export CSV | risk / admin |
| 查看 entry 历史变更 | viewer+ |

---

## 4. 过滤 / 排序

| 过滤 |
|---|
| Type / Status / Scope / Search by value / Date range / Added by |

---

## 5. 副作用

| 动作 | 审计 |
|---|---|
| Add | `risk.whitelist.add` (severity=warning) |
| Edit | `risk.whitelist.update` |
| Revoke | `risk.whitelist.revoke` |
| Bulk import | `risk.whitelist.bulk_import` (severity=critical) |

**无客户时间线**（白名单是内部决策，客户不应知道自己被"特殊豁免"，可能引起利益冲突）。

---

## 6. 实现要点

- 新加 Prisma model `RiskWhitelist`（迁移）
- Risk Engine 在每次评分时**先查 whitelist**：命中则该 scope 内的规则跳过
- UI: 标准 `EnhancedDataTable` + `ConfigDrawer` 新建
- 双签流程：第一员工提交 → 第二员工审 → 生效
- 自动 expire job

---

## 7. OPEN

| # | 问题 |
|---|---|
| Q1 | 双签是否必要？小规模 broker 可能放给单一 risk_manager |
| Q2 | Expiry 默认时长？建议 30 / 90 天，强制 review |
