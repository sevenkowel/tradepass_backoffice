# PRD — Client Relationships (Relationship Graph)

> 反向文档：基于现有实现代码提取的功能需求说明  
> 产品：TradePass CRM  
> 模块：Clients → Relationships / Risk Center → Relationship Graph  
> 关联代码路径：`src/app/crm/clients/relationships/`, `src/components/crm/relationships/`, `src/app/api/crm/clients/[id]/graph/`, `src/types/core/client-graph.ts`

---

## 1. 功能概述

### 1.1 目标
为合规、风控和客服团队提供可视化的客户关联分析工具，通过力导向关系图谱展示客户之间的潜在关联关系，辅助识别多账户套利、身份伪造、代理开户等风险场景。

### 1.2 入口位置

| 入口 | 路径 | 菜单 |
|------|------|------|
| 客户模块 | `/crm/clients/relationships` | Clients → Relationships |
| 风控模块 | `/crm/risk/graph` | Risk Center → Relationship Graph |

### 1.3 复用策略
核心渲染组件 `RelationshipGraph` 在两个入口完全复用，仅外层页面包装不同：
- **Clients 入口**：标准面包屑 + 页面标题 + 中心客户选择器
- **Risk Center 入口**：额外展示 High-risk shortlist（未选择中心客户时），方便风控人员快速切入已标记客户

---

## 2. 用户故事

1. **作为合规官**，我可以通过选择一个中心客户，查看所有与其存在关联的其他客户，以便识别潜在的欺诈团伙。
2. **作为风控经理**，我可以在 Risk Center 直接进入关系图谱，并从高风险客户快捷列表中选择起点，提升调查效率。
3. **作为客服**，我可以通过搜索客户名称/UID/邮箱快速定位到目标客户，查看其关联网络，辅助处理账户异常申诉。
4. **作为所有授权用户**，我可以通过筛选不同类型的关联关系，聚焦特定维度的风险线索。

---

## 3. 权限模型

访问本功能需要以下任一角色：

- `admin`
- `compliance_officer`
- `support_agent`
- `risk_manager`
- `finance_officer`
- `viewer`

权限检查通过 `requireRole` middleware 在 API 层执行，UI 层通过 Sidebar 的 `permission: "accounts"`（Clients 入口）和 `permission: "risk"`（Risk Center 入口）控制可见性。

---

## 4. 数据模型

### 4.1 核心类型定义
文件：`src/types/core/client-graph.ts`

```typescript
// 节点视觉分类
type ClientGraphNodeKind =
  | "center"          // 中心节点（有且仅有一个）
  | "shared_ip"       // 仅通过共享 IP 关联
  | "shared_device"   // 仅通过共享设备关联
  | "same_id"         // 通过重复身份/姓名匹配关联
  | "shared_payment"  // 通过共享支付方式关联
  | "ib_relation"     // 通过 IB 邀请树关联
  | "mixed";          // 同时存在多种关联类型

// 边（关系证据）类型
type ClientGraphEdgeKind =
  | "shared_ip"
  | "shared_device"
  | "same_id"
  | "shared_payment"
  | "ib_invited";

interface ClientGraphNode {
  id: string;        // 内部 user.id
  uid: string;       // 展示用 UID（如 U10024）
  name: string;
  email: string;
  phone?: string;
  country?: string;
  kycStatus: string;
  riskLevel: "low" | "medium" | "high" | "critical";
  riskScore: number; // 0–100，来自 Risk Engine
  lastLoginAt: string;
  createdAt: string;
  kind: ClientGraphNodeKind;
}

interface ClientGraphEdge {
  source: string;    // 源节点 ID（当前 API 下始终为中心客户）
  target: string;    // 目标节点 ID
  kind: ClientGraphEdgeKind;
  label: string;     // 可读标签，如 "Shared IP: 1.2.3.4"
  strength?: number; // 0–1，用于排序和线宽
  detectedAt?: string;
}

interface ClientGraph {
  center: ClientGraphNode;
  nodes: ClientGraphNode[];  // 不含 center
  edges: ClientGraphEdge[];
}
```

### 4.2 视觉令牌
文件：`src/lib/risk-engine/graph.ts`

| 分类 | 颜色 | 用途 |
|------|------|------|
| center | `#3B82F6` (blue-500) | 中心节点 |
| shared_ip | `#F59E0B` (amber-500) | 共享 IP 关联 |
| shared_device | `#10B981` (emerald-500) | 共享设备关联 |
| same_id | `#EF4444` (red-500) | 重复身份关联 |
| shared_payment | `#8B5CF6` (violet-500) | 共享支付方式 |
| ib_relation | `#0EA5E9` (sky-500) | IB 邀请关系 |
| mixed | `#A855F7` (purple-500) | 多种关联并存 |

边线样式：
- `shared_ip`: 虚线 `[5, 5]`
- `shared_device`: 实线
- `same_id`: 点划线 `[2, 3]` + 粒子动画（2 个粒子）
- `shared_payment`: 虚线 `[3, 3]`
- `ib_invited`: 实线

---

## 5. API 接口

### 5.1 获取关系图谱
```
GET /api/crm/clients/{id}/graph
```

**权限**：`requireRole([admin, compliance_officer, support_agent, risk_manager, finance_officer, viewer])`

**响应**：
```json
{
  "success": true,
  "center": { /* ClientGraphNode, type="center" */ },
  "nodes": [ /* ClientGraphNode[] */ ],
  "edges": [ /* ClientGraphEdge[] */ ]
}
```

**数据源与推断逻辑**（文件：`src/app/api/crm/clients/[id]/graph/route.ts`）：
1. 查询中心客户的 `client_devices` 记录，提取所有 `deviceId` 和 `ipAddress`
2. 查询共享设备：其他用户使用了相同的 `deviceId`
3. 查询共享 IP：其他用户使用了相同的 `ipAddress`
4. 查询同名账户：`user.name` 大小写不敏感精确匹配（识别重复开户）
5. 聚合去重，为每个关联用户计算其关联类型集合
6. 若关联类型 >1，节点 `type` 标记为 `"mixed"`
7. 返回 1-hop 图谱（仅中心客户到直接关联客户）

**关联用户字段来源**：`prisma.user` + `wallets` + `mtAccounts` + `kycRecord`，通过 `mapUserToClient` 映射。

### 5.2 获取相关客户列表（独立 API）
```
GET /api/crm/clients/{id}/related
```

返回简化的关联客户列表（用于其他页面），支持 `shared_device` 和 `shared_ip` 两种关系类型，strength 评分规则：两种关系同时存在 = 90，仅一种 = 60。

### 5.3 客户搜索（用于 Center Picker）
```
GET /api/crm/clients?search={query}&page=1&pageSize=20
```

通过 `clientService.list()` 调用，支持按 name/email/UID 模糊搜索。

---

## 6. 前端交互设计

### 6.1 页面结构

```
Relationships Page
├── Breadcrumb: Clients / Relationships
├── PageHeader: 标题 + 副标题
├── Center Picker Bar
│   ├── 标签 "Center:"
│   ├── 已选客户 chip（蓝色背景）
│   ├── Clear 按钮
│   └── Change center / Pick a client 按钮
├── RelationshipGraph 组件
│   ├── 搜索框（按 name/uid/email 过滤）
│   ├── 关系类型筛选按钮组（Shared IP / Shared Device / Same ID）
│   ├── 全屏切换按钮
│   ├── 图例（节点颜色说明 + 统计）
│   ├── 力导向画布（1200×700）
│   │   ├── 中心节点固定于画布中心（fx/fy）
│   │   ├── 节点大小：中心=30，其他=12
│   │   ├── 节点标签：name + uid
│   │   └── 搜索匹配高亮：蓝色描边；不匹配节点透明度 25%
│   ├── Hover Tooltip（右上角浮动卡片）
│   └── Selected Node Detail Panel（底部卡片）
│       ├── 节点完整信息（KYC 状态、风险等级、注册/登录时间）
│       ├── Open Detail 链接 → `/crm/clients/{id}`
│       └── Close 按钮
└── CenterPicker Modal（全局遮罩弹窗）
    ├── 搜索输入框（debounce 200ms）
    ├── 搜索结果列表（头像 + name + email + uid）
    └── 点击选择后关闭弹窗并更新 URL
```

### 6.2 空状态
- **未选择中心客户**：展示引导卡片，提示用户选择客户，提供 "Pick a client" 按钮
- **已选择但无关联数据**：画布区域展示 "No related clients found" 提示
- **Risk Center 入口空状态**：额外展示 High-risk shortlist（critical + high 风险客户卡片网格）

### 6.3 加载与错误状态
- 加载：居中展示旋转 Loader + "Loading relationship graph..."
- 错误：红色警示卡片展示错误信息

### 6.4 键盘与交互细节
- Center Picker 弹窗：点击遮罩层关闭，支持 ESC 关闭（通过 onClick 委托实现）
- 搜索框：实时过滤，debounce 200ms
- 全屏：调用 Fullscreen API，全屏状态下显示 Minimize2 图标
- 节点点击：选中节点并展开详情面板
- 节点悬停：显示右上角 tooltip（pointer-events: none）

---

## 7. 组件清单

| 组件 | 路径 | 职责 |
|------|------|------|
| RelationshipsPage | `src/app/crm/clients/relationships/page.tsx` | Clients 入口页面，含 CenterPicker 弹窗 |
| RiskGraphPage | `src/app/crm/risk/graph/page.tsx` | Risk Center 入口页面，含 High-risk shortlist |
| RelationshipGraph | `src/components/crm/relationships/RelationshipGraph.tsx` | 核心图谱渲染 + 交互逻辑 |
| ForceGraphWrapper | `src/components/crm/relationships/ForceGraphWrapper.tsx` | react-force-graph-2d 动态导入封装（禁用 SSR） |
| graph utils | `src/lib/risk-engine/graph.ts` | 颜色/标签/计数/风险评分/排序工具函数 |

---

## 8. 风险评分算法

文件：`src/lib/risk-engine/graph.ts`

图谱级粗粒度风险评分（0–100），用于快速标记可疑网络：

| 关系类型 | 单项分值 | 上限 |
|----------|----------|------|
| same_id | 30 | 60 |
| shared_payment | 20 | 40 |
| shared_device | 10 | 30 |
| shared_ip | 5 | 25 |
| ib_invited | 0 | 0（纯信息性） |

总分 = min(100, Σ各项 capped 分值)

关联节点排序优先级：`same_id` > `shared_payment` > `shared_device` > `shared_ip` > `ib_invited`，同优先级按 `riskScore` 降序。

---

## 9. 技术实现

### 9.1 依赖
- `react-force-graph-2d`：力导向图渲染引擎
- `lucide-react`：图标系统
- Next.js App Router + dynamic import（SSR 禁用）

### 9.2 关键实现细节
1. **SSR 安全**：`ForceGraph2D` 通过 `dynamic(() => import("react-force-graph-2d"), { ssr: false })` 包装，避免服务端渲染时 canvas API 不可用
2. **URL 状态同步**：中心客户 ID 通过 query param `?clientId={id}` 持久化，支持刷新后恢复状态
3. **中心节点固定**：通过 `fx/fy` 将中心节点锁定在画布几何中心，避免力模拟漂移
4. **Canvas 自定义绘制**：`nodeCanvasObject` 在力导向图绘制后叠加自定义文本标签（name + uid），支持搜索高亮/暗淡效果
5. **API 字段映射**：后端返回的 legacy 字段 `type` 在组件内映射为统一的 `kind`，保持类型一致性

### 9.3 性能考虑
- 力导向图尺寸固定为 1200×700，cooldownTicks=120
- 仅渲染 1-hop 关系，不展开多跳网络
- Center Picker 搜索结果限制 20 条
- 搜索过滤在客户端完成，不触发重新请求

---

## 10. 已知限制与待办

1. **共享支付方式（`shared_payment`）**：当前 API 仅通过 `client_devices` 推断 `shared_ip` 和 `shared_device`，`shared_payment` 尚未接入真实数据（注释标注 "Phase E should add bank/wallet linkage"）
2. **IB 邀请关系（`ib_invited`）**：类型定义中存在，但当前图谱 API 未实际生成此类边
3. **多跳扩展**：当前仅支持 1-hop 图谱，多跳网络扩展为 UI 层未来需求
4. **RiskTab echarts 图谱**：客户详情页 RiskTab 仍使用 echarts 力导向图（legacy），未来计划统一迁移至 `ClientGraph`（注释标注 "Future: merge into ClientGraph in M7"）
5. **KYC 图标**：仅支持 `verified/pending/rejected/not_submitted` 四种状态，其他状态回退到 `AlertTriangle`

---

## 11. 相关文件索引

| 文件 | 路径 | 说明 |
|------|------|------|
| 入口页面（Clients） | `src/app/crm/clients/relationships/page.tsx` | 客户模块关系图谱页 |
| 入口页面（Risk） | `src/app/crm/risk/graph/page.tsx` | 风控模块关系图谱页 |
| 核心图谱组件 | `src/components/crm/relationships/RelationshipGraph.tsx` | 力导向图渲染 + 交互 |
| SSR 包装器 | `src/components/crm/relationships/ForceGraphWrapper.tsx` | react-force-graph-2d 动态导入 |
| 类型定义 | `src/types/core/client-graph.ts` | 统一图模型类型 |
| 图数据 API | `src/app/api/crm/clients/[id]/graph/route.ts` | 1-hop 关系图谱查询 |
| 相关客户 API | `src/app/api/crm/clients/[id]/related/route.ts` | 简化关联列表查询 |
| 图工具函数 | `src/lib/risk-engine/graph.ts` | 颜色/计数/评分/排序 |
| 客户服务 | `src/lib/crm/services/client.service.ts` | 客户搜索/列表/详情服务 |
| 菜单配置 | `src/components/crm/layout/Sidebar.tsx` | 菜单入口配置 |
| 客户详情 RiskTab | `src/app/crm/clients/[id]/tabs/RiskTab.tsx` | 详情页风险标签（echarts 图） |
