# `/crm/setup-guide/manuals` — Manuals & Documentation

> **数据契约**：
> - 静态内容站；不需要 DB（可考虑 CMS / Markdown 文件 / Notion API）
> - 若需用户跟踪："is_helpful" 投票 / "viewed_at" 进度可加 `prisma.manualPageView`，但 MVP 不必

---

## 1. 目的

CRM 用户（broker staff）**自助式**文档中心。覆盖：
- 操作手册（如何审 KYC / 如何配 trading product / 如何处理 dispute）
- 视频教程（onboarding 用，10 分钟 walkthrough）
- FAQ
- API documentation（供 broker 技术对接）
- Release notes（每次 CRM 更新内容）

→ 减少给客服 / TradePass 自己的支持工单数。

---

## 2. 数据展示

### 2.1 顶部搜索

全文搜索（用 Algolia / Meilisearch / 客户端 fuse.js）。

### 2.2 内容分类（左侧 sidebar）

| Category |
|---|
| **Getting Started**（onboarding 视频 + checklist） |
| **Daily Operations**（KYC 审 / 出金 / 工单 / Notes） |
| **Risk Management**（异常处理 / AML / Watchlist） |
| **Trading Setup**（产品配置 / Group / Routing / Margin） |
| **Compliance**（监管报表 / 协议管理 / SAR 提交） |
| **Marketing**（Campaign / IB / Promo） |
| **System Admin**（员工管理 / 权限 / 集成） |
| **API Reference** |
| **Troubleshooting** |
| **Release Notes** |
| **FAQ** |

### 2.3 文档详情页

- 面包屑
- TOC 右侧
- Markdown 渲染（代码块 highlight，图片懒加载）
- 视频嵌入（YouTube / 自托管 Mux）
- "Was this helpful? 👍 👎"
- "Last updated" + author
- 相关文档推荐

### 2.4 视频教程

- 缩略图 + 时长
- 播放器（可调速 / 字幕 / 进度记忆）
- 章节 chapter markers

---

## 3. 可执行操作（前端）

| 动作 | 权限 |
|---|---|
| Read / Search | 所有 staff |
| 投票 helpful / not helpful | 所有 staff（per page） |
| Bookmark page | self |
| Print as PDF | viewer+ |
| Share link to colleague | viewer+ |
| Submit feedback / 报告错误 | viewer+（生成 internal ticket） |

### 内容管理（后台 / 仅 admin）

- 上传新文档（Markdown）
- 编辑现有文档
- 上传视频
- 发布 release note
- 看 analytics（哪些文档被读最多 / helpful 率）

---

## 4. 副作用

通常都是 read。少量 write 操作：
| 动作 | 审计 |
|---|---|
| Vote helpful | 无审计（量大、低价值） |
| Submit feedback | 创建 internal ticket（已是 audit 化）|
| 内容更新（admin） | `system.docs.update` (info) |

---

## 5. 实现要点

**两条路：**

| 维度 | A. 内嵌 Markdown 文件 | B. 接 Notion / Confluence / Gitbook |
|---|---|---|
| 工程量 | 中（自己写 renderer + search） | 小（embed + API） |
| 内容更新流 | 走 git PR | 直接 Notion 编辑 |
| Offline 可用 | 是 | 否 |
| 搜索 | client-side fuse.js | 第三方 |
| 多语言 | 自己管理 i18n 文件 | Notion 多 page |
| 推荐 | 文档少 / 团队习惯 git | 文档多 / 内容运营独立 |

**MVP 建议**：A 方案（文档目录在 `/docs/manuals/`，build 时生成 sitemap）

- 视频用 Mux（streaming + 缩略图自动 + 章节）
- 多语言：`/manuals/<locale>/<category>/<slug>.md`
- 搜索：build 时生成 search index（json），client-side 查
- "is_helpful" 投票：简单 endpoint `/api/manuals/feedback`，聚合到 analytics

---

## 6. 边界

| 此页 | `/crm/setup-guide` |
|---|---|
| 静态文档 / 视频 | 任务清单 + 进度 |

---

## 7. OPEN

| # | 问题 |
|---|---|
| Q1 | 内嵌 Markdown vs 接 Notion 偏好？ |
| Q2 | 是否需要按角色显示不同的文档？（compliance 看合规 / finance 看资金，不互相打扰） |
| Q3 | 视频托管：Mux（贵但稳）/ YouTube unlisted（免费但有 logo）/ 自托管？ |
| Q4 | 多语言文档同步策略：自动翻译 vs 人工 vs 仅英文先行？ |
