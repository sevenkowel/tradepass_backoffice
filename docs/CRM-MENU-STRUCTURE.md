# TradePass CRM — 菜单结构设计

> 版本：v2.0  
> 日期：2026-05-08  
> 状态：方案定稿

---

## 一、设计原则

1. **配置去中心化** — 每个功能模块的配置归入该模块下
2. **专业视图** — KYC/KYC 审核 / 风控/风控 各自独立一级菜单
3. **聚合可见性** — Setup Guide 作为聚合入口链接到各模块配置
4. **只读日志** — Support 只放沟通记录，不做发送功能
5. **混合审批** — 批准中心做聚合展示 + 跳板，处理在各自模块完成（暂缓实施）

---

## 二、完整菜单结构

```
CRM
├
├── Dashboard
│   ├─ Overview                 /crm
│   ├─ Real-time Monitor        /crm/monitor
│   ├─ Conversion Funnel        /crm/funnel
│   └─ Client 360 Dashboard     /crm/client-360
│
├── Clients
│   ├─ Client List              /crm/clients
│   ├─ Tags                     /crm/clients/tags
│   ├─ Segments                 /crm/clients/segments
│   ├─ Lifecycle                /crm/clients/lifecycle
│   ├─ Notes                    /crm/clients/notes
│   └─ Relationships            /crm/clients/relationships
│
├── KYC Center
│   ├─ Review Queue             /crm/kyc/review
│   ├─ Resubmission             /crm/kyc/resubmit
│   ├─ Liveness Review          /crm/kyc/liveness-review
│   ├─ POA Review               /crm/kyc/poa-review
│   ├─ Compliance Archive       /crm/kyc/archive
│   │  ────
│   ├─ KYC Form Config          /crm/kyc/config
│   ├─ KYC Levels               /crm/kyc/levels
│   ├─ Review Policy            /crm/kyc/review-policy
│   └─ Agreement Docs           /crm/kyc/agreements
│
├── Risk Center
│   ├─ Risk Dashboard           /crm/risk
│   ├─ High-Risk Clients        /crm/risk/high-risk
│   ├─ AML Hits                 /crm/risk/aml
│   ├─ Relationship Graph       /crm/risk/graph
│   ├─ Anomaly Detection        /crm/risk/anomalies
│   ├─ Device & Security        /crm/risk/device
│   ├─ Blacklist                /crm/risk/blacklist
│   ├─ Whitelist                /crm/risk/whitelist
│   │  ────
│   ├─ Risk Rules               /crm/risk/rules
│   ├─ Margin Alerts            /crm/risk/margin
│   └─ NBP Protection           /crm/risk/nbp
│
├── Funds
│   ├─ Deposits                 /crm/funds/deposits
│   ├─ Withdrawal Review        /crm/funds/withdrawal-review
│   ├─ Transactions             /crm/funds/transactions
│   ├─ Payment Channels         /crm/funds/channels
│   │  ────
│   └─ Fund Policy              /crm/funds/policy
│
├── Trading
│   ├─ Orders                   /crm/trading/orders
│   ├─ Positions                /crm/trading/positions
│   ├─ Instruments              /crm/trading/instruments
│   │  ────
│   ├─ Trading Settings         /crm/trading/settings
│   └─ Product Config           /crm/trading/instruments/config
│
├── Support
│   ├─ Tickets                  /crm/support/tickets
│   ├─ Email Log                /crm/support/emails
│   ├─ SMS Log                  /crm/support/sms
│   ├─ Push Log                 /crm/support/push
│   └─ Chat History             /crm/support/chat
│
├── Marketing
│   ├─ Campaigns                /crm/marketing/campaigns
│   ├─ Messages                 /crm/marketing/messages
│   ├─ Banners                  /crm/marketing/banners
│   └─ News / Insights          /crm/marketing/news
│
├── Reports
│   ├─ Financial Reports        /crm/reports/financial
│   ├─ Trading Reports          /crm/reports/trading
│   ├─ User Reports             /crm/reports/users
│   ├─ Conversion Reports       /crm/reports/conversion
│   └─ Compliance Reports       /crm/reports/compliance
│
├── IB
│   └─ IB Dashboard             /crm/ib
│
├── Setup Guide
│   ├─ Setup Checklist           /crm/setup-guide
│   └─ Manuals & Docs           /crm/setup-guide/manuals
│
├── System
│   ├─ Staff Management         /crm/system/staff
│   ├─ Departments              /crm/system/departments
│   ├─ Roles & Permissions      /crm/system/roles
│   ├─ Security Settings        /crm/system/security
│   ├─ Operation Logs           /crm/system/logs
│   └─ API Management           /crm/system/api
│
├── Apps
│   └─ App Center               /crm/apps
│
└── Approval Center (待实施)
    ├─ Pending Approvals         /crm/approval
    └─ Approval History          /crm/approval/history
```

---

## 三、一级菜单汇总（14 组）

| # | 菜单 | 目标用户 | 说明 |
|---|------|---------|------|
| 1 | Dashboard | 全部 | 总览看板 + Client 360 聚合 |
| 2 | Clients | 审核员/客服/运营 | 从 User List 升级为客户管理中心 |
| 3 | KYC Center | 审核员/合规官 | KYC 审核队列 + 配置管理 |
| 4 | Risk Center | 风控经理 | 风险监控 + 黑白名单 + 关联图谱 |
| 5 | Funds | 财务/运营 | 出入金管理 + 资金策略 |
| 6 | Trading | 运营 | 交易订单/持仓/品种配置 |
| 7 | Support | 客服 | 工单 + 沟通记录（只读） |
| 8 | Marketing | 运营 | 活动/Banner/推送 |
| 9 | Reports | 全部 | 报表统计 |
| 10 | IB | IB 运营 | 预留菜单 |
| 11 | Setup Guide | 管理员 | 配置聚合入口 + 手册 |
| 12 | System | 系统管理员 | 人员/权限/安全/API |
| 13 | Apps | 管理员 | 应用中心 |
| 14 | Approval Center | 全部 | 待实施 · 审批聚合展示 |

---

## 四、Routes 迁移对照表

| 旧路由 | 新路由 | 操作 |
|--------|--------|------|
| `/crm` | `/crm` | 保留 |
| `/crm/monitor` | `/crm/monitor` | 保留 |
| `/crm/funnel` | `/crm/funnel` | 保留 |
| — | `/crm/client-360` | **新增** |
| `/crm/users` | `/crm/clients` | **改名** |
| `/crm/users/tags` | `/crm/clients/tags` | **改名** |
| `/crm/users/levels` | `/crm/kyc/levels` | **迁移** |
| — | `/crm/clients/segments` | **新增** |
| — | `/crm/clients/lifecycle` | **新增** |
| — | `/crm/clients/notes` | **新增** |
| — | `/crm/clients/relationships` | **新增** |
| `/crm/compliance/kyc-review` | `/crm/kyc/review` | **迁移** |
| `/crm/compliance/supplemental-review` | `/crm/kyc/resubmit` | **迁移** |
| — | `/crm/kyc/liveness-review` | **新增** |
| — | `/crm/kyc/poa-review` | **新增** |
| — | `/crm/kyc/archive` | **新增** |
| `/crm/system/kyc-config` | `/crm/kyc/config` | **迁移** |
| — | `/crm/kyc/levels` | **新增** |
| — | `/crm/kyc/review-policy` | **新增** |
| — | `/crm/kyc/agreements` | **新增** |
| `/crm/risk` | `/crm/risk` | 保留（改内容） |
| `/crm/risk/rules` | `/crm/risk/rules` | 保留 |
| `/crm/risk/margin` | `/crm/risk/margin` | 保留 |
| `/crm/risk/nbp` | `/crm/risk/nbp` | 保留 |
| — | `/crm/risk/high-risk` | **新增** |
| — | `/crm/risk/aml` | **新增** |
| — | `/crm/risk/graph` | **新增** |
| — | `/crm/risk/anomalies` | **新增** |
| — | `/crm/risk/device` | **新增** |
| `/crm/compliance/blacklist` | `/crm/risk/blacklist` | **迁移** |
| — | `/crm/risk/whitelist` | **新增** |
| `/crm/funds/deposits` | `/crm/funds/deposits` | 保留 |
| `/crm/funds/withdrawal-review` | `/crm/funds/withdrawal-review` | 保留 |
| `/crm/funds/transactions` | `/crm/funds/transactions` | 保留 |
| `/crm/funds/channels` | `/crm/funds/channels` | 保留 |
| — | `/crm/funds/policy` | **新增** |
| `/crm/trading/orders` | `/crm/trading/orders` | 保留 |
| `/crm/trading/positions` | `/crm/trading/positions` | 保留 |
| `/crm/trading/instruments` | `/crm/trading/instruments` | 保留 |
| `/crm/trading/settings` | `/crm/trading/settings` | 保留 |
| — | `/crm/trading/instruments/config` | **新增** |
| `/crm/crm/tickets` | `/crm/support/tickets` | **迁移** |
| `/crm/crm/logs` | `/crm/support/logs` | **迁移** |
| — | `/crm/support/emails` | **新增** |
| — | `/crm/support/sms` | **新增** |
| — | `/crm/support/push` | **新增** |
| — | `/crm/support/chat` | **新增** |
| `/crm/marketing/campaigns` | `/crm/marketing/campaigns` | 保留 |
| `/crm/marketing/messages` | `/crm/marketing/messages` | 保留 |
| `/crm/marketing/banners` | `/crm/marketing/banners` | 保留 |
| `/crm/marketing/news` | `/crm/marketing/news` | 保留 |
| `/crm/reports/financial` | `/crm/reports/financial` | 保留 |
| `/crm/reports/trading` | `/crm/reports/trading` | 保留 |
| `/crm/reports/users` | `/crm/reports/users` | 保留 |
| — | `/crm/reports/conversion` | **新增** |
| — | `/crm/reports/compliance` | **新增** |
| `/crm/ib` | `/crm/ib` | 保留（预留） |
| `/crm/business-config` | `/crm/setup-guide` | **改名** |
| — | `/crm/setup-guide/manuals` | **新增** |
| `/crm/system/staff` | `/crm/system/staff` | 保留 |
| `/crm/system/departments` | `/crm/system/departments` | 保留 |
| `/crm/system/roles` | `/crm/system/roles` | 保留 |
| `/crm/system/security` | `/crm/system/security` | 保留 |
| `/crm/system/logs` | `/crm/system/logs` | 保留 |
| `/crm/system/api` | `/crm/system/api` | 保留 |
| `/crm/apps` | `/crm/apps` | 保留 |
| — | `/crm/approval` | **新增**（待实施） |
| — | `/crm/approval/history` | **新增**（待实施） |

**操作统计：**

| 操作 | 数量 |
|------|:----:|
| 保留 | 24 |
| 改名 | 3 |
| 迁移 | 7 |
| 新增 | 21 |
| 删除 | 2（`/crm/users`、`/crm/compliance/audit` → 并入 System logs） |

---

## 五、相关决策记录

| # | 决策 | 结论 |
|---|------|------|
| 1 | Client 360 放哪里 | Dashboard 子项 |
| 2 | Communication / Support | 叫 Support，只读日志 |
| 3 | IB | 预留菜单，占位符页面 |
| 4 | 一级命名 | "Clients" 一级，子项 "Client List" |
| 5 | 审批中心 | 混合模式：聚合展示 + 跳板（待实施） |
| 6 | 配置归属 | 去中心化，各模块自带配置区 |
| 7 | KYC Config 路由 | 从 System 迁移到 KYC Center |
| 8 | Audit Logs | 并入 System Operation Logs |
| 9 | Accounts | 拆解到 Trading（MT 账户 + 杠杆设置） |
| 10 | Compliance Archive | KYC Center 子项，时间线 + PDF 导出 |
| 11 | 配置引导 | Business Config → Setup Guide，聚合入口 |
| 12 | Compliance | 拆分为 KYC Center + Risk Center |
