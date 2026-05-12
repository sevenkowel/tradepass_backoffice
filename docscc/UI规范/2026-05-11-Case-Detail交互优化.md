# Case Detail 交互优化

> 日期：2026-05-11 · 分类：UI规范 · 状态：已确认

## 背景

case-001 详情页是密度最高的合规工作台。用户提出 5 个具体痛点；本次整改逐项解决，并把通用规则沉淀到设计令牌中。

## 1. 卡片间距

**问题**：原来 page 级 `space-y-3` (12px) 过紧，案件详情页特别明显（多层卡片相邻）。

**方案**：
- page 顶层垂直节奏改为 `space-y-4` (16px)
- 卡内分组保持 `space-y-3` (12px)，紧密分组用 `space-y-2` (8px)
- 三档规则写进 `docs/05-UI-System/Design-Tokens.md` 的 §3a "Vertical rhythm — three tiers"
- sticky 顶偏移从 `top-[124px]` 同步抬到 `top-[128px]` 保持视觉对齐

## 2. 审批决策面板（风险敏感）

### 原问题
- "Accept Task" 直接 `assign(caseId, staffId, staffId)` 覆盖已有 assignee，语义模糊
- 永远显示理由输入框，连"低风险一键 Approve"都要两次点击
- 高风险 / AML hit 案件，Approve 仍是醒目绿色主按钮 —— 误导审核人
- 选了一个动作后其他按钮消失，比较 difficult
- Reject 与 Resubmit 视觉相似，但语义完全不同（终决 vs. 可重交）

### 新设计
- 抽出 `<DecisionPanel>` 子组件
- **Risk-aware 排序**：`riskLevel ∈ {critical, high}` 或 `amlStatus === "hit"` 时，Reject 升为主按钮（红色满宽），Escalate / Resubmit 在次行；Approve 降级为 outlined "Approve anyway…" 按钮，且强制要求填理由
- **Inline reason**：点击动作不再隐藏其他按钮；选中的按钮加 ring 高亮，下方滑出 textarea，按钮区始终可见
- **Escalate / Blacklist 升级**：Escalate 变正式按钮（不再是末尾的文字链接），Blacklist 留在面板底部小红字（仍然 reachable 但视觉低优先级，因为 destructive）
- **Accept Task → 上下文化标题**："Accept case"（无 assignee） vs. "Take over case"（已分配给他人，说明这是抢单语义）
- 面板头部加 "High stakes" 标识（AML hit / critical risk 时）

## 3. 图片裂图修复

**问题**：mock 的 `thumbnailUrl` 都是 `/mock/id-front.jpg` 类的 404 路径；浏览器渲染裂图占位。

**方案**：
- DocumentPreview 加 `imageBroken` state，`<img onError>` 触发后 swap 到原有的"无预览"占位卡（带 `FileImage` icon），文案改为"Preview failed to load"
- Lightbox 同步处理
- 顺手把组件内冗余的 header（标题 + 状态 pill + 提交日期）删掉 —— 外层 case-detail 页已经在 `submittedDocuments` 区域绘制了一次标题 + VerificationChip，组件内再画就重复了。提交日期挪到外层标题旁

## 4. Timeline 改造

### Key / All 改为分类胶囊
原来 Key/All 二选一太粗糙（其实只是过滤 Comment 类）。改为分类 chip strip：
`All · Decisions · System · Submissions · Assignments · Comments`，每个带计数；空类自动隐藏。

### 决策事件结果 pill
扩展 `CaseTimelineEvent.metadata`：
```ts
metadata: {
  result?: "approved" | "rejected" | "resubmit_requested" | "escalated" | "blacklisted" | "auto_approved" | "auto_rejected"
  reason?: string
  score?: number
}
```

`category === "decision"` 的事件在行尾显示彩色大写 pill，icon 也按结果切换：
- rejected → XCircle (红)
- escalated → ArrowUp (橙)
- blacklisted → ShieldOff (深灰，反白文字)

### 审核理由块
`metadata.reason` 渲染为左侧实线引用样式（Quote icon + 斜体），与描述文字明显区分。

### 数字 token 自动高亮
description 里的 `78/100`、`94%`、`10000 IDR` 等通过 regex 匹配后自动包成 `font-mono tabular-nums font-semibold`，让关键信号在 system 事件中跳出来。Producer 不需要手动标注。

### Mock 演示
`evt-009`（case-001 Resubmission Requested）展示完整结构：result pill + reason 引用块。

## 5. 重复标题修复

CommentPanel 内部有 `<h3>Notes & Comments</h3>`，外层又用 `<Collapsible title="Comments">` 包了一次。删除内部标题，外层 owns 标题；CommentPanel 顺便从 `gray-*` 全部换成 `slate-*`（对齐设计规则）。

## 6. IP popover 与 IB 对齐

原 IPGeoPopover 是点击触发；IBSummaryHover 是悬停。同样的"客户元信息卡"用了两种交互不一致。改 IPGeoPopover 为悬停：
- `<button onClick>` → `<span onMouseEnter/Leave>`
- 120ms close delay，让用户能把鼠标移到 popover 内
- popover div 也绑定 enter/leave handlers，让内部链接（related UIDs 跳转）可点
- 保留 portal 渲染（避免被 sticky / z-index 父级裁剪）
- public API 不变，两处调用站点（`DevicesTab` + case detail customer card）无需改动

## 设计原则归纳

1. **风险高的操作不能放在最显眼的位置** —— 默认 CTA 要匹配低风险路径
2. **状态变化不能让其他选项消失** —— 不要用 modal-replace pattern 替代 inline 输入
3. **冗余优先级**：当外层和组件都画标题时，外层 owns 标题（组件做 body-only）
4. **同类信息卡用同一种交互范式** —— 客户元信息卡的所有 popover 都是 hover

## 涉及文件

- `docs/05-UI-System/Design-Tokens.md` — 新增 §3a 三档间距规则
- `src/app/crm/clm/cases/[id]/page.tsx` — DecisionPanel 抽组件、间距调整、Timeline category chips
- `src/components/crm/clm/DocumentPreview.tsx` — onError fallback、删除冗余 header
- `src/components/crm/clm/RichTimeline.tsx` — result pill、reason 块、数字高亮
- `src/components/crm/clm/CommentPanel.tsx` — 删除冗余标题 + 配色对齐
- `src/components/crm/clm/popovers/IPGeoPopover.tsx` — click → hover
- `src/types/clm/case.ts` — `TimelineDecisionResult` / `TimelineMetadata` 类型
- `src/lib/clm/mock/mock-cases.ts` — `evt-009` 演示数据

---

## 待办

- [ ] DecisionPanel 抽到独立文件，给 Re-Verification 详情页复用
- [ ] Timeline 数字高亮 regex 抽到 `bits.tsx` 作为复用 utility
- [ ] DocumentPreview 失败状态加 retry 按钮（mock 模式不需要，真实 API 需要）
- [ ] hover popover 加键盘可达性（focus-visible 也要触发）
