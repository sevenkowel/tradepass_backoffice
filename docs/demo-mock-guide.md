# TradePass Demo 稳定运行指南

> 纯前端 Mock 方案，无需 API，Demo 不崩

---

## 核心原则

1. **所有数据走 Mock Store** - 不调用真实 API
2. **API 路由返回固定数据** - 不查数据库
3. **组件容错处理** - 数据缺失不报错
4. **默认数据兜底** - 每个页面都有 fallback

---

## 1. Mock Store 架构

### 统一数据层
```typescript
// src/lib/mock/store.ts
export const mockStore = {
  // 当前登录用户
  currentUser: {
    id: 'demo-user-001',
    email: 'demo@tradepass.com',
    name: 'Demo User',
    role: 'trader', // 'admin' | 'broker' | 'trader'
    status: 'active',
    kycStatus: 'approved',
  },

  // 当前租户
  currentTenant: {
    id: 'demo-tenant-001',
    name: 'Demo Broker',
    subdomain: 'demo',
    status: 'active',
    ownerId: 'demo-user-001',
    brand: {
      brandName: 'Demo Broker',
      logoUrl: '/logo.svg',
      primaryColor: '#0ea5e9',
    },
  },

  // 用户列表
  users: [
    { id: 'u1', email: 'trader1@example.com', name: 'Trader One', role: 'trader', status: 'active' },
    { id: 'u2', email: 'trader2@example.com', name: 'Trader Two', role: 'trader', status: 'pending' },
  ],

  // KYC 记录
  kycRecords: [
    {
      id: 'kyc-001',
      userId: 'u1',
      status: 'approved',
      documents: [
        { type: 'id', url: '/mock/id-card.jpg', uploadedAt: '2024-01-01' },
      ],
      submittedAt: '2024-01-01',
      reviewedAt: '2024-01-02',
    },
    {
      id: 'kyc-002',
      userId: 'u2',
      status: 'pending',
      documents: [
        { type: 'id', url: '/mock/id-card-2.jpg', uploadedAt: '2024-01-03' },
      ],
      submittedAt: '2024-01-03',
    },
  ],

  // 仪表盘数据
  dashboard: {
    // Console 仪表盘
    console: {
      totalTenants: 5,
      totalUsers: 128,
      pendingKyc: 3,
      revenue: 12500,
    },
    // Portal 仪表盘
    portal: {
      balance: 10000,
      equity: 10500,
      margin: 2000,
      openPositions: 3,
    },
    // CRM 仪表盘
    crm: {
      totalClients: 50,
      pendingDeposits: 5,
      pendingWithdrawals: 2,
      todayVolume: 1000000,
    },
  },
};
```

---

## 2. API 路由 Mock 方案

### 统一返回固定数据
```typescript
// src/app/api/backoffice/metrics/route.ts
export async function GET() {
  // 不查数据库，直接返回 Mock 数据
  return Response.json({
    users: { total: 128, active: 95 },
    tenants: { total: 5, trial: 2 },
    licenses: { total: 5, active: 4 },
    invoices: { total: 20, paid: 18, revenue: 12500 },
    recentUsers: [
      { id: 'u1', email: 'user1@example.com', name: 'User One', createdAt: '2024-01-01' },
    ],
    recentTenants: [
      { id: 't1', name: 'Tenant One', slug: 'tenant-one', status: 'active', createdAt: '2024-01-01', owner: { email: 'owner@example.com' } },
    ],
  });
}
```

### 关键 API 列表（全部 Mock）
```
GET  /api/auth/me              → 返回 mockStore.currentUser
GET  /api/console/tenants      → 返回 [mockStore.currentTenant]
GET  /api/backoffice/metrics   → 返回固定仪表盘数据
GET  /api/portal/dashboard     → 返回固定交易数据
GET  /api/crm/dashboard        → 返回固定 CRM 数据
GET  /api/kyc/records          → 返回 mockStore.kycRecords
POST /api/kyc/submit           → 返回 { success: true }
```

---

## 3. 组件容错方案

### 数据加载容错
```typescript
// 每个页面组件都要有默认值
export default function Dashboard() {
  const [data, setData] = useState(DEFAULT_DATA); // 先给默认值
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(data => setData({ ...DEFAULT_DATA, ...data })) // 合并默认值
      .catch(() => setData(DEFAULT_DATA)) // 出错用默认值
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;

  // 数据解构时给默认值
  const {
    users = { total: 0, active: 0 },
    tenants = { total: 0, trial: 0 },
  } = data;

  return <DashboardView users={users} tenants={tenants} />;
}

// 默认值常量
const DEFAULT_DATA = {
  users: { total: 0, active: 0 },
  tenants: { total: 0, trial: 0 },
  licenses: { total: 0, active: 0 },
  invoices: { total: 0, paid: 0, revenue: 0 },
  recentUsers: [],
  recentTenants: [],
};
```

### Props 容错
```typescript
// 组件参数都给默认值
function MetricCard({
  value = 0,
  label = '-',
  sub = '',
}: {
  value?: number | string;
  label?: string;
  sub?: string;
}) {
  return (
    <Card>
      <p>{label}</p>
      <p>{value ?? '-'}</p>
      <p>{sub}</p>
    </Card>
  );
}
```

---

## 4. 图片/资源 Mock

### 本地占位图
```
public/
  mock/
    avatar-1.jpg      # 用户头像
    avatar-2.jpg
    id-card.jpg       # 身份证示例
    passport.jpg      # 护照示例
    logo-default.svg  # 默认 Logo
```

### 图片加载失败处理
```typescript
function Avatar({ src, alt }: { src?: string; alt: string }) {
  const [error, setError] = useState(false);

  if (error || !src) {
    return <div className="avatar-placeholder">{alt[0]}</div>;
  }

  return <img src={src} alt={alt} onError={() => setError(true)} />;
}
```

---

## 5. 关键页面容错检查清单

### Backoffice 仪表盘
```typescript
// 检查点
- [x] metrics 为 null 时显示默认值
- [x] recentUsers 为空数组时显示空状态
- [x] API 失败时不跳转，显示默认数据
```

### Portal 仪表盘
```typescript
// 检查点
- [x] balance/equity 为 undefined 时显示 0
- [x] 图表数据为空时显示空图表
- [x] KYC 状态为 undefined 时显示 "未开始"
```

### CRM 仪表盘
```typescript
// 检查点
- [x] pendingKyc 为 undefined 时显示 0
- [x] 客户列表为空时显示空状态
- [x] 统计数据缺失时显示 "--"
```

---

## 6. 快速修复脚本

### 一键修复常见错误
```bash
# 1. 清理缓存
rm -rf .next

# 2. 重启服务
npm run dev:fast

# 3. 检查端口
lsof -i:3001
```

### 常见错误处理
```
错误：metrics.users is undefined
修复：const users = metrics?.users ?? { total: 0, active: 0 }

错误：Cannot read property 'map' of undefined
修复：const list = data?.list ?? []

错误：router.push is not a function
修复：检查 useRouter 导入是否正确
```

---

## 7. Demo 演示流程

### 稳定演示路径
```
1. 首页 (/) → 点击 "开始"
2. Console (/console) → 查看仪表盘
3. 创建租户 (/console/tenants/new) → 填写表单
4. Portal (/portal/dashboard) → 查看交易账户
5. KYC 认证 (/portal/kyc) → 上传文件
6. CRM (/crm) → 查看客户列表
7. KYC 审批 (/crm/compliance/kyc) → 审批通过
```

### 每个页面检查
- 页面能打开，不白屏
- 数据能显示，不报错
- 按钮能点击，有反馈

---

## 8. 应急方案

### 如果页面崩了
1. **刷新页面** - 80% 问题能解决
2. **清理缓存** - `rm -rf .next && npm run dev`
3. **回退到首页** - 从 `/` 重新开始
4. **跳过该页面** - 直接访问下一个路由

### 如果数据不对
1. 检查 Mock Store 是否有该数据
2. 检查 API 路由是否返回固定数据
3. 检查组件是否有默认值

---

## 总结

| 问题 | 解决方案 |
|------|---------|
| API 报错 | 所有 API 返回固定 Mock 数据 |
| 数据 undefined | 每个组件设置默认值 |
| 页面白屏 | 添加 Error Boundary + 默认值 |
| 图片加载失败 | 使用 onError + 占位图 |
| 路由跳转失败 | 使用 window.location 兜底 |

> 核心原则：**不依赖外部数据，所有数据自给自足**
