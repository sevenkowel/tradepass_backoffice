# Funds 模块设计方案 v2.3（交互闭环增量）

> 日期：2026-05-17 · 分类：产品文档 · 状态：已确认 · 版本：v2.3（增量）
> 基线：v2.2（同日早些时候）

## 0. v2.3 解决的问题

v2.2 的高级编辑器（FundsFilterDrawer / ReassignDialog / ManualMatchDialog / Withdrawable Formula DSL / Channel Eligibility / Routing Sandbox / Workflow hover）已经落地，但**列表页和详情页里仍有不少"占位按钮"没有 onClick 回调** — 操作员点击后没有反馈，对外看起来像"功能阻断"。

v2.3 的目标：**全量打通可点击元素，做到每个按钮要么真实交互、要么有清晰反馈，没有"哑按钮"**。

## 1. 三种交互闭环策略

```
A. 真实状态切换  → 本地 state 改变 + toast.success
   适用：Freeze / Unfreeze / Power / 添加 Notes / Delete

B. 跳转闭环      → Link href / router.push
   适用：客户名跳客户详情 / Approval Ref 跳 Approval Center
         / Beneficiary 引用跳 Beneficiaries 页 /
         "View Top FTDs" 跳 Reports / 通道详情跳 Channels

C. 演示反馈     → toast.info("功能演示中")
   适用：Export / 高级新建 / 编辑表单 / 历史曲线 / Spread 调整
   （这些占位待真实后端接口落地后改为真实表单 Dialog）
```

## 2. 新增共享 Helper

### `components/crm/funds/use-funds-toast.ts`

集中导出 5 个 toast helper 给所有 funds 页面使用，保证演示反馈文案统一：

```ts
demoAction(action: string)   // 通用操作演示反馈
actionDone(message: string)  // 真实状态切换的成功提示
demoExport(what: string)     // Export 按钮统一文案
demoCreate(what: string)     // "+ New X" 按钮统一文案
demoEdit(what: string)       // "Edit" 按钮统一文案
```

## 3. 各页面的交互闭环清单

### 3.1 Wallets 页

| 元素 | 闭环方式 | 备注 |
|---|---|---|
| 客户姓名/UID | **B 跳转** `/crm/clients/{id}` | 新加 |
| Freeze/Unfreeze 按钮 | **A 状态切换** + `actionDone` | 新加 |
| Txns 按钮 | **B 跳转** `/crm/funds/transactions?client={id}` | 新加 |
| Export | **C demoExport** | 新加 |

### 3.2 Beneficiaries 页

| 元素 | 闭环方式 | 备注 |
|---|---|---|
| 客户姓名/UID | **B 跳转** `/crm/clients/{id}` | 新加 |
| Freeze/Unfreeze | **A** | 新加 |
| Delete | **A** confirm() + state mutation | 新加 |
| New Beneficiary | **C demoCreate** | 新加 |
| Export | **C demoExport** | 新加 |
| 高级筛选 | **C demoAction** | 新加 |

### 3.3 Wallet/Trading Channels

| 元素 | 闭环方式 |
|---|---|
| Eligibility 按钮 | 已闭环 → 7 维矩阵 Drawer |
| Power 切换 | **A** Online ↔ Maintenance + `actionDone` |
| Edit 按钮 | **C demoEdit** |
| New Channel | **C demoCreate** |
| Export | **C demoExport** |

### 3.4 Adjustments / Fees / Bank Master / Rate Center / Routing / Risk

| 页面 | 闭环 |
|---|---|
| Adjustments | New Adjustment / Export → **C** |
| Fees & Pricing | 每行 Edit + New Fee / Export → **C** |
| Bank Master Data | 每行 Edit + New Bank / Export → **C** |
| Rate Center | 每行 Spread / History · 顶部 Refresh + New Pair → **A/C** |
| Routing | 每条 Edit / New Rule → **C** · Sandbox 已实时联动 |
| Risk & Compliance | New Rule → **C** |

### 3.5 列表页 Export (Wallet/Trading × Deposits/Withdrawals + Transfers)

5 个列表页的 Export 按钮全部 onClick → `demoExport`。

### 3.6 详情页（5 个 [id] 页面）

通过 `ApprovalDetailLayout` 共享的：
- **Print** 按钮 → `window.print()`
- **Keyboard Shortcuts** 按钮 → toast 显示快捷键清单
- **Reassign** 按钮 → 已弹 ReassignDialog
- **Approve / Reject / Hold** → 各详情页传入的 `onAction` callback → `actionDone`

各详情页本地的：
- **Wallet Withdrawal**: "Open in Beneficiaries" → **B Link href** · "Add Note" → **A state mutation**
- **Wallet Deposit**: "Manual Match client" → 已弹 ManualMatchDialog
- **Trading Withdrawal**: "Close all positions" / "Partial close" → **C demoAction**

### 3.7 Reconciliation

| 元素 | 闭环 |
|---|---|
| 顶部 Export | **C demoExport** |
| Daily Report → Export CSV | **C demoExport** |
| View Top FTDs / Deposits | **B Link** → `/crm/funds/reports` |
| View Anomalies | **B Link** → `/crm/funds/monitoring` |

### 3.8 Policies & Limits

| 元素 | 闭环 |
|---|---|
| 顶部 Edit | **C demoEdit** |
| 各 panel 内的 Edit 按钮（4 处） | **C demoEdit** |
| Withdrawable Formula "还原" | **A** 重置 inputs + active="B" + `actionDone` |
| Withdrawable Formula "应用为默认公式" | **A** `actionDone` |
| Withdrawable Formula "提交 Compliance 复核"（DSL 时） | **A** `actionDone` |

### 3.9 Overview / Transactions

| 元素 | 闭环 |
|---|---|
| Overview 4 角色切换 | 已闭环 |
| Overview "Configure" links | 已闭环（Link href） |
| Transactions 行点击 | 已闭环（router.push 到对应详情页） |
| Transactions Export | **C demoExport** |
| Transactions 高级筛选 | **C demoAction**（高级筛选 Drawer 待后续完整版） |

## 4. 没动的交互（已经在 v2.2 闭环）

- 列表页 KPI 卡 onClick — 已应用筛选
- 列表页 Quick chips — 已切换筛选
- 列表页 行 onClick — 已 router.push 详情
- 详情页 Tab 切换 — 已 setState
- 详情页 Hero 状态/Risk/AML chip — 信息展示无需 click
- Routing Sandbox 表单 — 已实时联动
- Workflow 节点 hover — 已 hover 详情卡
- Channel Eligibility 矩阵 chip — 已 toggle 选中

## 5. 当前完成度

| 类别 | 状态 |
|---|---|
| 真实状态切换 | ✅ 9 处（Freeze/Unfreeze × 2 / Power × 2 / Delete / Add Note / Refresh / Formula reset & apply） |
| 跳转闭环 | ✅ 7 处（Wallets 客户 / Beneficiaries 客户 / Wallet Txns / Open in Beneficiaries / Top FTDs / Top Deposits / Anomalies） |
| 演示反馈 toast | ✅ 30+ 处（Export × 8 / New X × 7 / Edit × 9 / 其它 demoAction × 8） |
| 高级编辑器 | ✅ FundsFilterDrawer / ReassignDialog / ManualMatchDialog / Channel Eligibility / Withdrawable Formula / Routing Sandbox |
| 类型检查 | ✅ `tsc --noEmit` 干净 |

## 6. 后续真实接口接入路径

每个 `demoExport / demoCreate / demoEdit / demoAction` 调用都是一个"实施位点"，等真实后端接口落地时，照此清单替换：

```typescript
// 现在
onClick={() => demoExport("钱包出金列表")}

// 接入真实接口后
onClick={async () => {
  const csv = await fundsService.exportWalletWithdrawals(filters);
  triggerDownload(csv, "wallet-withdrawals.csv");
  toast.success("已下载 CSV");
}}
```

替换工作量约 50-60 个位点 — 都是定位明确的单点替换，不涉及结构变化。

## 7. PRD 文档版本汇总

| 版本 | 文件 | 内容 |
|---|---|---|
| v2.0 | `2026-05-17-funds-module-design.md` | 第一版完整方案（已废 — 因实现质量被打回） |
| v2.1 | `2026-05-17-funds-module-design-v2.1.md` | v2 + v2.1 + v2.2 完整方案（29 条决策 + 21 个页面 IA） |
| **v2.3** | **本文档** | **交互闭环增量** |

## 待办

- [x] 全量审计可点击元素
- [x] 三种闭环策略落地
- [x] PRD v2.3 增量文档
- [ ] 后续：真实后端接口接入后，把每个 `demo*` 调用替换为真实 service 调用
