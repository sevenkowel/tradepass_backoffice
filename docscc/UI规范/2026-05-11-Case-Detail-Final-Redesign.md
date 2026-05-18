# Case Detail 终版改造（2026-05-11）

> 一整天围绕 `/crm/clm/cases/[id]` 案件详情页的 UX/UI 系统改造。涉及右侧 tab 化重构、底部行动栏、Timeline 内联备注与回复、决策 Dialog 化、Composite Risk 整合 Submission Context、Case Info 重组等多轮迭代。本文是该页面当日所有变更的最终归档。

---

## 一、最终布局（终态）

```
┌─────────────────────────────────────────────────────────────┐
│ Breadcrumb: CLM Center > Review Queue > K-00101              │
├─────────────────────────────────────────────────────────────┤
│ ⚠ Critical / AML banner（仅高风险案件）                       │
├─────────┬───────────────────────────┬───────────────────────┤
│ 客户卡   │ 类型内容（KYC: 文档+OCR） │ Composite Risk        │
│  ↓      │  ↓                        │  ↓                    │
│ Case Info│ 经历问卷                  │ TIMELINE              │
│ (重组)   │ 协议                      │  - 系统事件           │
│  ↓      │ 声明                      │  - 备注/回复（含缩进）│
│ Quick   │                           │                       │
│ Access  │                           │                       │
├─────────┴───────────────────────────┴───────────────────────┤
│ Bottom Action Bar (sticky bottom)                            │
│  [💬 Add a note...] [Send]    [Escalate][Resubmit][Reject][Approve] │
└─────────────────────────────────────────────────────────────┘
```

**核心特征**：
- **无顶部 sticky 案件 header**（已删）
- **整页一个滚动上下文**（仅 window 滚动，左栏 sticky `top-[64px]`，右栏不再 sticky）
- **决策、备注、Timeline 三分离**：决策在底栏 Dialog 化；备注在底栏 quick-input；Timeline 在右栏独立面板
- **底部行动栏 sticky**，决策按钮始终在视口下方

---

## 二、改动汇总（按模块）

### 2.1 类型层
- `CaseComment` 新增 `parentId?: string` — 备注可以回复某个事件/备注
- `CaseTimelineEvent` 新增 `parentId?: string` — 评论事件携带父事件 id 用于缩进渲染
- `SubmittedMaterial` 新增 `userSubmittedFields?: Record<string, string>` — OCR vs 用户提交对比
- `CaseDetail.submission?: SubmissionContext` — 当次申请的 IP/设备 + 共用账户列表
- `SubmissionContext { ip, device, submittedAt, ipGeo?, sharedIpAccountIds[], sharedDeviceAccountIds[] }`
- `KYCFlow.contact: KYCFlowContactModule` — 手机/邮箱 OTP per-flow 强制开关
- `KYCFlowContactModule { enabled, requireMobileOtp, requireEmailOtp }`
- `AutoReviewRule.logic?: "and" | "or"` — 条件组合逻辑
- 新增 `CONDITION_FIELDS` / `ConditionFieldDef` — Auto-Review 条件构建器字段元数据（11 个预定义字段：country / registration_source / ib_id / risk_level / kyc_level / aml_status / ocr_confidence / face_match_score / deposit_amount / withdrawal_amount / is_vpn）
- 删除 `AutoUpgradeRule` / `AutoUpgradeKind` / `ContactVerificationChannel`（功能拆分到 KYC Flow Contact 模块 + Monitoring 触发规则）

### 2.2 Service / Mock 层
- `case.service.addComment` 改为运行时 in-memory store：`extraComments` + `extraEvents`，addComment 同时镜像写一个 `category: "comment"` timeline event（带 parentId）
- `case.service.buildSubmissionContext(case)` — 根据 case id 做确定性 hash 生成 mock submission（共用账户数 0-11 / 0-6）
- mock case-001 detail 加 `submission` 字段（IP `45.222.178.91`、device `Chrome 120 / Windows 11`、共用 IP 7 个、共用设备 3 个）
- mock auto-review rules 加 `logic`（`ar-001: and`、`ar-002: or` 演示 OR 逻辑）
- mock kyc flows 全部加 `contact` 字段
- mock IB 新增 `listIBs()` helper（供 ConditionBuilder 远程下拉）

### 2.3 组件层

#### 新增
- `src/components/crm/clm/rules/ConditionBuilder.tsx` — 通用条件构建器（field 下拉 / value 联动 / AND-OR 切换 / JSON 高级模式）
- 页面内：`CompositeRiskCard`、`SubmissionContextSection`、`SharedAccountsList`、`SubmissionIpCell`、`SubmissionDeviceCell`、`HoverPopover`、`SharedUidList`、`ApproveDialog`、`RejectDialog`、`ResubmitDialog`、`BottomActionBar`、`ReplyComposer`

#### 删除
- 页面内：`ReviewTab`、`TimelineTopChunk`、`TimelineEventsList`、`DecisionPanel`、`EscalateButton`、`ActionBtn`、`OCRCompareTable`（移入 DocumentPreview）

#### 修改
- `RichTimeline` — 加 `onReply` / `replyingTo` / `replyInput` props；reply 事件以 L 形 connector + `pl-8` 缩进 + CornerDownRight 图标渲染；Reply 按钮始终可见（subtle 默认色，hover 变蓝）
- `DocumentPreview` — 加 `showUserComparison` prop，内置 3 列 OCR vs 用户提交对比表（80px 标签 + 1fr + 1fr 等宽）
- `AgreementSection` — 加预览 Dialog，每条协议有 "预览" 按钮
- `CommentPanel` — 加 `hideHistory` prop；input 重设计（去掉曲别针/@/笑脸装饰图标，键盘提示 + Send 按钮）
- `RiskFactorList` — 加 `renderExtraExpanded?: (factor) => ReactNode` prop，用于 `device_ip` 因子展开时追加 Submission Context

### 2.4 页面层

#### Case Detail (`/crm/clm/cases/[id]`)
- 删除顶部 sticky case header（原本 K-001 + 状态 + 风险 + SLA + Assignee 那一行）
- 右栏不再 sticky；Composite Risk + Timeline 跟随页面滚动
- 左栏仍 sticky（top-[64px]，因为没有顶部 header 了），Case Info 重组：
  - Case No + 「← Queue」返回链接
  - 3 个胶囊：Type / Status / Risk
  - SLA / Assignee / App IP / App Device / Priority / Source / Created / Reviewer
  - **App IP / App Device 都是 HoverPopover**，显示 IP geo + 共用账户列表
- 底部 sticky 行动栏：
  - 左：备注 quick-input（Enter 即发，立刻冒到 Timeline 顶部）
  - 右：4 个决策按钮 — Escalate / Resubmit / Reject / Approve
  - 决策按钮点击打开对应 Dialog（充裕空间填写理由、勾选 blacklist、选择 escalate 步骤）
- Timeline：备注事件 inline 与系统事件混排；hover 时显示 Reply 按钮；回复事件带视觉缩进
- 「device_ip」因子展开追加 Submission Context（注册时 + 开户时两组 IP/设备对比 + 共用账户 chip）

#### Routing & Rules (`/crm/clm/rules`)
- 4 tab → 3 tab：Routing / Auto-Review / **Monitoring**（原 Re-Verification 重命名）
- 删除 Auto-Upgrade tab 及其全部代码（500+ 行）
- 面包屑 / 标题改为 "Routing & Rules"
- 旧路由 `/crm/clm/re-verification/rules?tab=re-verification` 自动重定向到 monitoring tab
- Auto-Review 编辑抽屉接入新的 `<ConditionBuilder>`，支持：
  - 11 个预定义字段（含新增的 registration_source / ib_id）
  - Value 按字段类型联动（enum 下拉 / IB 远程下拉 / 数字 / boolean / text）
  - AND/OR 切换
  - JSON 高级模式（schema 与数据 1:1 镜像）
  - 行级 `<>` 切换到 raw text 输入

#### KYC Flows (`/crm/clm/kyc-flows`)
- KYC Flow 编辑器新增 **Contact Verification** 模块（最顶部）：
  - 「Enable contact verification」总开关
  - 二级缩进：「Require mobile OTP」/「Require email OTP」
  - 描述文案说明：runtime 自动跳过已验证渠道
- 卡片胶囊新增 `Contact OTP (Mobile + Email)` 显示

---

## 三、关键设计决策

### 3.1 三件事三块位置
| 操作 | 位置 | 原因 |
|---|---|---|
| 决策 | 底栏 + Dialog | 横向空间充裕；Dialog 内填写理由、勾选 blacklist、选择 escalate 步骤无空间压力 |
| 备注 | 底栏 quick-input + Timeline 内回复 | 顺手记一笔不需要切换上下文；回复某事件支持线程化对话 |
| Timeline 浏览 | 右栏，flow with page | 一个滚动上下文，无嵌套 overflow；备注事件 inline 混排 |

### 3.2 SubmissionContext 双重展示
- **左侧 Case Info（轻量）**：App IP + App Device，hover popover 显示 geo + 共用账户列表
- **右侧 Composite Risk 的 device_ip 因子展开（详细）**：注册时 vs 开户时对比 + 共用账户 chip + Multi-account risk 警示
- 两处复用同一份 `submission` 数据 + 同一份 `severityForShared` 阈值（0 → emerald / 1-2 → slate / 3-5 → amber / ≥6 → red）

### 3.3 共用账户阈值
| 数量 | 视觉 | 含义 |
|---|---|---|
| 0 | emerald `Unique` | 该 IP/设备首次见到此用户 |
| 1-2 | slate | 少量共用，可能正常 |
| 3-5 | amber | 需要警惕 |
| ≥6 | red + Multi-account risk banner | 强信号反刷号 |

### 3.4 Reply 设计
- Reply 按钮**始终可见**（GitHub 范式是 hover-only，但对触屏/键盘党不友好）
- 默认 `text-slate-300`（弱化），父 li hover 时 `text-slate-500`，按钮自身 hover 时 `text-blue-600`
- 回复事件不再显示 Reply 按钮（避免无限嵌套；多人对话仍可在同一 parent 下回复多次）
- 视觉：L 形 connector + 缩进 + CornerDownRight 图标

### 3.5 滚动隔离的演进
- 第一版：右栏 sticky + 内嵌 timeline overflow → scroll chaining 难受
- 第二版：加 `overscroll-contain` → 鼠标在 timeline 内时整页不能滚，体感僵
- 第三版：拆 sticky（top 部分 sticky + 下半 flow）+ z-index 防穿透
- **最终版**：右栏完全不 sticky → 整页一个滚动上下文，所有疑难一次性消除

---

## 四、改动文件清单

### 类型
- `src/types/clm/case.ts` — `parentId` / `userSubmittedFields`
- `src/types/clm/detail.ts` — `SubmissionContext`、`CaseDetail.submission`
- `src/types/clm/config.ts` — `KYCFlowContactModule`、`AutoReviewRule.logic`、`CONDITION_FIELDS`、`ConditionFieldDef`、删 `AutoUpgradeRule`

### Service / Mock
- `src/lib/clm/services/case.service.ts` — `extraComments` / `extraEvents` 存储、`buildSubmissionContext`、addComment 镜像 timeline 事件
- `src/lib/clm/services/flow.service.ts` — 删 `autoUpgradeRules`
- `src/lib/clm/mock/mock-cases.ts` — case-001 加 `submission`，`userSubmittedFields`
- `src/lib/clm/mock/mock-flows.ts` — flows 加 `contact`、auto-review rules 加 `logic`、删 auto-upgrade mock
- `src/lib/clm/mock/mock-ib.ts` — 新增 `listIBs()`
- `src/lib/clm/mock/index.ts` — 导出 `listIBs`、删除 `mockAutoUpgradeRules`

### 组件 / 页面
- `src/app/crm/clm/cases/[id]/page.tsx` — 全面重构（最终版本约 1300 行）
- `src/app/crm/clm/rules/page.tsx` — 3 tab + ConditionBuilder 接入
- `src/app/crm/clm/kyc-flows/page.tsx` — Contact 模块
- `src/components/crm/clm/RichTimeline.tsx` — reply 支持
- `src/components/crm/clm/DocumentPreview.tsx` — 内置 OCR 对比表
- `src/components/crm/clm/AgreementSection.tsx` — 预览 Dialog
- `src/components/crm/clm/CommentPanel.tsx` — 简化 input + `hideHistory`
- `src/components/crm/clm/risk/RiskFactorList.tsx` — `renderExtraExpanded` prop
- `src/components/crm/clm/rules/ConditionBuilder.tsx` — **新建**

---

## 五、用户验证清单（手动 smoke test 建议）

- [ ] 访问 `/crm/clm/cases/case-001`，确认无顶部 header；左侧 Case Info 显示 K-00101 + 三胶囊 + SLA + Assignee + App IP/Device
- [ ] hover App IP → 弹 popover 显示 geo + 共用账户列表
- [ ] hover App Device → 弹 popover 显示共用账户
- [ ] 点击 Composite Risk 的 Device 因子行 → 展开后显示 Submission Context（注册时 + 开户时）
- [ ] 整页向下滚动 → 左右两栏一起跟随滚动，没有 sticky 残留
- [ ] 点 "Take over case" → 状态变 reviewing；底栏出现 4 个决策按钮
- [ ] 底栏 Add a note 输入文字 → Enter → 立刻冒到 Timeline 顶部
- [ ] hover Timeline 事件 → Reply 按钮变蓝
- [ ] 点 Reply → 弹出输入框 → 输入回复 → Enter → 回复事件带缩进出现
- [ ] 点 Reject → 打开 Dialog；填理由 + 勾选 blacklist → Confirm
- [ ] 点 Escalate（KYC 类型）→ Dialog 出现步骤多选 + 备注
- [ ] 访问 `/crm/clm/rules` → 确认 3 tab；编辑 Auto-Review 规则 → ConditionBuilder 工作（含 AND/OR 切换 + JSON 模式）
- [ ] 访问 `/crm/clm/kyc-flows` → 编辑任意 flow → 顶部 Contact Verification 模块可配置

---

## 六、待办（次日候选）

- [ ] Reply 输入框打开后自动 focus / scrollIntoView（部分场景滚不到位）
- [ ] 决策 Dialog 加快捷键支持（A=Approve / R=Reject / S=Resubmit / E=Escalate）
- [ ] 备注 quick-input 支持 @ 提及（CommentPanel 旧版有占位 UI，已删，需要重新接入真实 mention picker）
- [ ] Timeline 事件分组（按天）
- [ ] Reply 支持嵌套层级展示（目前只支持一级回复）
- [ ] Bottom action bar 在小屏（<1024px）适配 — 当前底栏左右容易挤
- [ ] case detail 进入即 focus 备注输入框，键盘党友好

---

## 七、回退方式

所有改动集中在单次会话内的 working tree。如需回退到 sticky header + Tab 版本：

```bash
git checkout HEAD~1 -- \
  src/app/crm/clm/cases/\[id\]/page.tsx \
  src/components/crm/clm/RichTimeline.tsx \
  src/lib/clm/services/case.service.ts \
  src/types/clm/case.ts \
  src/types/clm/detail.ts
```

或全量回到改造前：`git stash` 当前改动 → 找到改造前的 commit hash → `git checkout <hash> -- <files>`。tsc 全程零报错，回退不会破坏类型。
