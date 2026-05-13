# Placeholder Pages — 功能规格集

> 14 个 sidebar 中链接到 `Coming Soon` 占位页的功能完整设计。
> 上游审计见 [`../sidebar-audit.md`](../sidebar-audit.md)。
>
> 每个 spec 都按 [`../client-detail/05-alignment.md`](../client-detail/05-alignment.md) 的"统一数据 / 不要平行造模型"原则。

---

## 设计原则（所有页通用）

1. **必须先看 canonical source**：每个页面在 spec 顶部明确写"数据契约"（来自哪个模块、哪些类型、哪个 service）
2. **不允许新建已有的数据模型** — KYC / Case / Audit / Risk / Graph / IPGeo / IB 都有 owner，复用
3. **复用 shared UI 组件** — `EnhancedDataTable` / `ConfigDrawer` / `RiskScoreRing` / `IPGeoPopover` / `RichTimeline` / 等
4. **mutation 必写审计** — 通过 `globalAuditService` 自动 capture
5. **i18n** — 不硬编码中英文，键名 `<page>.<key>`

---

## 文档索引（按 sidebar 顺序）

### Risk Center

| 文档 | 路径 | 一句话 | 复杂度 |
|---|---|---|---|
| [aml.md](./aml.md) | `/crm/risk/aml` | AML 命中告警 + sanctions / PEP 监控 | L |
| [anomalies.md](./anomalies.md) | `/crm/risk/anomalies` | 异常交易 / 行为检测看板 | M |
| [whitelist.md](./whitelist.md) | `/crm/risk/whitelist` | 风控白名单（豁免特定客户 / IP / 设备 / 国家） | S |
| [blacklist.md](./blacklist.md) | `/crm/risk/blacklist` | 黑名单（复用 `/crm/compliance/blacklist` 现有实现） | S |

### Funds

| 文档 | 路径 | 一句话 | 复杂度 |
|---|---|---|---|
| [funds-policy.md](./funds-policy.md) | `/crm/funds/policy` | 出入金策略：限额、双签阈值、cooldown、自动批准规则 | M |

### Trading

| 文档 | 路径 | 一句话 | 复杂度 |
|---|---|---|---|
| [trading-product-config.md](./trading-product-config.md) | `/crm/trading/instruments/config` | 产品（symbol）配置：点差、佣金、swap、margin、交易时段 | L |

### Reports

| 文档 | 路径 | 一句话 | 复杂度 |
|---|---|---|---|
| [reports-conversion.md](./reports-conversion.md) | `/crm/reports/conversion` | 注册→KYC→FTD→活跃转化漏斗报表 | M |
| [reports-compliance.md](./reports-compliance.md) | `/crm/reports/compliance` | 合规报表：KYC SLA、SAR 报告、协议签署率、AML 复检 | M |

### Support

| 文档 | 路径 | 一句话 | 复杂度 |
|---|---|---|---|
| [support-emails.md](./support-emails.md) | `/crm/support/emails` | 邮件发送日志（事务 + 营销） | M |
| [support-sms.md](./support-sms.md) | `/crm/support/sms` | SMS 发送日志 | M |
| [support-push.md](./support-push.md) | `/crm/support/push` | 站内推送日志 + 推送模板管理 | M |
| [support-chat.md](./support-chat.md) | `/crm/support/chat` | 在线客服聊天历史 / 在线员工状态 | L |

### Dashboard

| 文档 | 路径 | 一句话 | 复杂度 |
|---|---|---|---|
| [client-360.md](./client-360.md) | `/crm/client-360` | 单一客户的"全息视图"——比 Client Detail 更聚合的搜索 + 跳转入口 | XL |

### Setup Guide

| 文档 | 路径 | 一句话 | 复杂度 |
|---|---|---|---|
| [setup-guide.md](./setup-guide.md) | `/crm/setup-guide` | 新租户开通 CRM 后的引导清单 + 完成度 | M |
| [setup-guide-manuals.md](./setup-guide-manuals.md) | `/crm/setup-guide/manuals` | 用户手册 / 视频教程 / FAQ 静态内容站 | S |

---

## 实施建议优先级（按业务价值，结合复杂度）

| 优先级 | 页面 | 理由 |
|---|---|---|
| **P0** | aml / anomalies / blacklist / whitelist | Risk Center 是经纪商核心，4 个 placeholder 不能再放 |
| **P0** | funds-policy | 出入金策略是合规审计的必查项 |
| **P1** | reports-compliance / reports-conversion | 监管报表 + 运营漏斗，月度必看 |
| **P1** | trading-product-config | 产品上下架、点差调整 |
| **P2** | support-emails / sms / push | 客户沟通审计 + 自动化基础 |
| **P2** | client-360 | 单客户聚合视图，价值高但复杂 |
| **P3** | support-chat | 看是否对接 Zendesk / 自建 |
| **P3** | setup-guide / manuals | 新租户引导，非核心运营功能 |

---

## 模板（每个 spec 文件结构）

每个 `*.md` 都包含：

```
# <Page Name>
> 路径 / 数据契约（canonical sources）

## 1. 目的
## 2. 数据展示（区块 / 列表 / KPI）
## 3. 可执行操作 + 权限
## 4. 过滤 / 排序
## 5. 副作用（审计 / 时间线 / 通知）
## 6. 与其他模块的边界
## 7. 实现要点（数据 fetch / 组件复用 / 性能）
## 8. OPEN 问题
```
