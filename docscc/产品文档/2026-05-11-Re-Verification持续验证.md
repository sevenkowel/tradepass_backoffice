# Re-Verification 持续验证

> 日期：2026-05-11 · 分类：产品文档 · 状态：已确认

## 决策

1. **Re-Verification 的 Rules 合并到 Configuration → Routing & Rules** 第 4 个 tab，与其他规则家族同台维护
2. **新增"持续验证"触发类型**：从过去的"事件触发"扩展为两个 kind：`event` + `continuous`

## 触发类型定义

| Kind | 引擎评估时机 | 典型场景 |
|---|---|---|
| **event** | 业务事件到达时（提款、登录、AML 回调、协议发布等） | AML hit / 大额提款 / VPN 切换国家 / 协议更新 |
| **continuous** | 后台扫描器按 `scanFrequency` 定时扫描所有活跃用户 | 证件即将过期 / 长期不活跃 / POA 即将过期 |

两类共享相同的条件评估词汇表（`WorkflowCondition`），只是调度形态不同。

## 数据模型

```ts
ReVerificationRule {
  // 原有字段...
  triggerKind: "event" | "continuous"    // 新增
  scanFrequency?: "daily" | "weekly" | "monthly"  // continuous 独有
}
```

drawer 编辑器：选 **Continuous** 时显示 `scanFrequency` 下拉；选 **Event** 时隐藏。

## 合并细节

- 老路由 `/crm/clm/re-verification/rules` 改为 redirect → `/crm/clm/rules?tab=re-verification`
- 用 Next.js Suspense 包裹 search-params 读取（hook 要求）
- 侧栏 Re-Verification 区只剩 Requests / Templates / History 三个，规则维护去 Configuration
- Rules tab 内部还有 chips 子筛选：All / Event-driven / Continuous

## 已有规则的归类

| ID | 名称 | Kind |
|---|---|---|
| rrv-001 | ID Expiring Within 7 Days | continuous · daily |
| rrv-002 | Large Withdrawal → Video | event |
| rrv-003 | VPN Country Switch → Re-Liveness | event |
| rrv-004 | Agreement Updated → Re-sign | event |
| rrv-005 | AML Hit → Source of Wealth | event |
| **rrv-006**（新增） | 12-Month Inactivity → Refresh KYC | continuous · weekly |

## UI 呈现

每条规则卡片显示：
- Trigger kind chip（蓝色 Event / 紫色 Continuous，含频率后缀）
- Re-Verification type chip（identity / liveness / address / income / agreement / questionnaire / video）
- Restriction level chip
- 条件 / 行动两列对照
- 运行次数 + 最近触发时间

## 涉及文件

- `src/types/clm/re-verification.ts` — 新增 `ReVerificationTriggerKind` / `ReVerificationScanFrequency` 类型
- `src/lib/clm/mock/mock-re-verification.ts` — 既有规则补 `triggerKind`，新增 rrv-006
- `src/components/crm/clm/re-verification/RulesTab.tsx`（新组件）
- `src/app/crm/clm/rules/page.tsx` — 加第 4 个 tab，支持 query-param 选 tab
- `src/app/crm/clm/re-verification/rules/page.tsx` — 改为 redirect
- `src/components/crm/layout/Sidebar.tsx`

---

## 待办

- [ ] continuous 规则需要一个 "下次扫描时间" 估算显示（依赖运行引擎集成）
- [ ] 给 continuous 类型加 "最近扫描覆盖人数" 的指标
- [ ] 未来：scanFrequency 是否要支持 "custom cron"
