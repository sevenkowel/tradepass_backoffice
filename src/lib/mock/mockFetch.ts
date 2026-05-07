/**
 * Mock Fetch - 拦截 API 调用并返回 Mock 数据
 * 用于纯前端 Demo 模式
 */

import { mockDB, mockDelay, generateId } from './mockDB';
import type { MockUser, MockTenant } from './types';

// 模拟 Response 对象
class MockResponse {
  constructor(
    private data: any,
    private statusCode: number = 200,
    private headers: Record<string, string> = {}
  ) {}

  async json() {
    return this.data;
  }

  async text() {
    return typeof this.data === 'string' ? this.data : JSON.stringify(this.data);
  }

  get ok() {
    return this.statusCode >= 200 && this.statusCode < 300;
  }

  get status() {
    return this.statusCode;
  }

  get statusText() {
    return this.statusCode === 200 ? 'OK' : this.statusCode === 404 ? 'Not Found' : 'Error';
  }
}

// 路由处理器类型
type RouteHandler = (params: {
  url: URL;
  method: string;
  body?: any;
  headers: Headers;
  query: Record<string, string>;
}) => Promise<MockResponse> | MockResponse;

// API 路由映射
const routes: Record<string, RouteHandler> = {
  // ============================================
  // 认证相关
  // ============================================
  
  // POST /api/auth/login
  'POST /api/auth/login': async ({ body }) => {
    const { email, password } = body || {};
    
    // Demo 模式：简化验证，只检查邮箱
    const users = mockDB.getCollection<MockUser>('users');
    const user = users.find(u => u.email === email);
    
    if (!user) {
      return new MockResponse({ error: '用户不存在' }, 401);
    }
    
    // 创建会话
    const token = generateId('token');
    mockDB.createSession(token, user.id, 24);
    mockDB.setCurrentUser(user.id);
    
    // 更新最后登录时间
    mockDB.update('users', user.id, { lastLoginAt: new Date().toISOString() });
    
    return new MockResponse({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId,
        kycStatus: user.kycStatus,
        kycLevel: user.kycLevel,
      },
    });
  },

  // POST /api/auth/register
  'POST /api/auth/register': async ({ body }) => {
    const { email, password, name, tenantId, role = 'user' } = body || {};
    
    // 检查邮箱是否已存在
    const users = mockDB.getCollection<MockUser>('users');
    if (users.some(u => u.email === email)) {
      return new MockResponse({ error: '邮箱已被注册' }, 409);
    }
    
    // 创建新用户
    const newUser: MockUser = {
      id: generateId('user'),
      email,
      name,
      role: role as any,
      tenantId,
      createdAt: new Date().toISOString(),
      kycStatus: 'not_started',
    };
    
    mockDB.insert('users', newUser);
    
    // 创建会话
    const token = generateId('token');
    mockDB.createSession(token, newUser.id, 24);
    mockDB.setCurrentUser(newUser.id);
    
    return new MockResponse({
      success: true,
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        tenantId: newUser.tenantId,
        kycStatus: newUser.kycStatus,
      },
    });
  },

  // POST /api/auth/logout
  'POST /api/auth/logout': async ({ headers }) => {
    const token = headers.get('authorization')?.replace('Bearer ', '');
    if (token) {
      mockDB.destroySession(token);
    }
    mockDB.setCurrentUser(null);
    return new MockResponse({ success: true });
  },

  // POST /api/auth/otp
  'POST /api/auth/otp': async ({ body }) => {
    const { target, action, channel } = body || {};
    const channelLabel = channel ? `通过${channel === 'sms' ? '短信' : channel === 'whatsapp' ? 'WhatsApp' : '语音电话'}` : '';
    return new MockResponse({
      success: true,
      hint: `验证码已${channelLabel}发送至 ${target}（Demo 模式输入 1234 即可）`,
    });
  },

  // GET /api/auth/me
  'GET /api/auth/me': async ({ headers }) => {
    const token = headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return new MockResponse({ error: '未登录' }, 401);
    }
    
    const session = mockDB.validateSession(token);
    if (!session) {
      return new MockResponse({ error: '会话已过期' }, 401);
    }
    
    const user = mockDB.findById<MockUser>('users', session.userId);
    if (!user) {
      return new MockResponse({ error: '用户不存在' }, 404);
    }
    
    return new MockResponse({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId,
        kycStatus: user.kycStatus,
        kycLevel: user.kycLevel,
      },
    });
  },

  // ============================================
  // 租户相关
  // ============================================

  // GET /api/tenants
  'GET /api/tenants': async () => {
    const tenants = mockDB.getCollection<MockTenant>('tenants');
    return new MockResponse({ tenants });
  },

  // GET /api/tenants/:id
  'GET /api/tenants/': async ({ url }) => {
    const id = url.pathname.split('/').pop();
    const tenant = mockDB.findById<MockTenant>('tenants', id || '');
    if (!tenant) {
      return new MockResponse({ error: '租户不存在' }, 404);
    }
    return new MockResponse({ tenant });
  },

  // POST /api/tenants
  'POST /api/tenants': async ({ body }) => {
    const { name, subdomain } = body || {};
    
    // 检查 subdomain 是否已存在
    const tenants = mockDB.getCollection<MockTenant>('tenants');
    if (tenants.some(t => t.subdomain === subdomain)) {
      return new MockResponse({ error: '子域名已被使用' }, 409);
    }
    
    const slug = (subdomain || generateId('slug')).toLowerCase().replace(/[^a-z0-9-]/g, '-');
    const newTenant: MockTenant = {
      id: generateId('tenant'),
      name,
      slug,
      subdomain,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'trial',
      ownerId: mockDB.getCurrentUser()?.id || '',
      region: 'VN',
      plan: 'starter',
      settings: {
        kycLevel: 'standard',
        features: ['portal', 'crm'],
      },
      onboardingCompleted: false,
      onboardingStatus: 'not_started',
      onboardingPhases: {
        branding: false,
        auth: false,
        kyc: false,
        payments: false,
        trading: false,
        accounts: false,
      },
      onboardingTasks: [],
    };
    
    mockDB.insert('tenants', newTenant);
    return new MockResponse({ tenant: newTenant }, 201);
  },

  // GET /api/tenants/by-subdomain/:subdomain
  'GET /api/tenants/by-subdomain/': async ({ url }) => {
    const subdomain = url.pathname.split('/').pop();
    const tenants = mockDB.getCollection<MockTenant>('tenants');
    const tenant = tenants.find(t => t.subdomain === subdomain);
    
    if (!tenant) {
      return new MockResponse({ error: '租户不存在' }, 404);
    }
    return new MockResponse({ tenant });
  },

  // ============================================
  // KYC 相关
  // ============================================

  // GET /api/kyc/status
  'GET /api/kyc/status': async ({ headers }) => {
    const user = await getCurrentUserFromToken(headers);
    if (!user) {
      return new MockResponse({ error: '未登录' }, 401);
    }
    
    return new MockResponse({
      status: user.kycStatus,
      level: user.kycLevel,
    });
  },

  // GET /api/kyc/records
  'GET /api/kyc/records': async ({ headers, query }) => {
    const user = await getCurrentUserFromToken(headers);
    if (!user) {
      return new MockResponse({ error: '未登录' }, 401);
    }
    
    const records = mockDB.find('kycRecords', (r: any) => {
      if (user.role === 'user') {
        return r.userId === user.id;
      }
      if (query.tenantId) {
        return r.tenantId === query.tenantId;
      }
      return r.tenantId === user.tenantId;
    });
    
    return new MockResponse({ records });
  },

  // POST /api/kyc/submit
  'POST /api/kyc/submit': async ({ headers, body }) => {
    const user = await getCurrentUserFromToken(headers);
    if (!user) {
      return new MockResponse({ error: '未登录' }, 401);
    }
    
    // 更新用户 KYC 状态
    mockDB.update('users', user.id, { 
      kycStatus: 'under_review',
      kycLevel: body?.level || 'basic',
    });
    
    // 创建 KYC 记录
    const record = {
      id: generateId('kyc'),
      userId: user.id,
      tenantId: user.tenantId,
      status: 'under_review',
      level: body?.level || 'basic',
      documents: body?.documents || [],
      region: body?.region || 'VN',
      submittedAt: new Date().toISOString(),
    };
    
    mockDB.insert('kycRecords', record);
    
    return new MockResponse({ success: true, record });
  },

  // POST /api/kyc/ocr — 证件 OCR 识别（Demo 模式，支持 DevTools 联动）
  'POST /api/kyc/ocr': async ({ headers, body }) => {
    const user = await getCurrentUserFromToken(headers);
    if (!user) {
      return new MockResponse({ error: '未登录' }, 401);
    }

    await mockDelay(800);

    // 读取 DevTools Mock 配置
    const simulateError = headers.get('X-Mock-OCR-Error') === 'true';
    if (simulateError) {
      return new MockResponse({ success: false, error: 'OCR engine error: Failed to extract text from image' }, 200);
    }

    const confidenceOverride = headers.get('X-Mock-OCR-Confidence');
    const confidence = confidenceOverride ? parseFloat(confidenceOverride) : 0.95;

    const docType = body?.documentType || 'passport';
    const mockNames = ['Nguyen Van A', 'Tran Thi B', 'Le Van C', 'Pham Thi D', 'Hoang Van E'];
    const mockName = mockNames[Math.floor(Math.random() * mockNames.length)];
    const mockId = String(Math.floor(Math.random() * 900000000) + 100000000);

    return new MockResponse({
      success: true,
      data: {
        documentType: docType,
        fullName: mockName,
        documentNumber: mockId,
        dateOfBirth: '1990-01-01',
        nationality: 'Vietnam',
        gender: 'M',
        expiryDate: '2030-12-31',
        confidence,
      },
    });
  },

  // POST /api/kyc/save-step — 保存 KYC 步骤进度
  'POST /api/kyc/save-step': async ({ headers, body }) => {
    const user = await getCurrentUserFromToken(headers);
    if (!user) {
      return new MockResponse({ error: '未登录' }, 401);
    }

    return new MockResponse({ success: true });
  },

  // GET /api/config/kyc-system — KYC 系统配置
  'GET /api/config/kyc-system': async () => {
    return new MockResponse({
      success: true,
      data: {
        enabled: true,
        version: 1,
        steps: {
          document: { enabled: true, required: true },
          ocr: { enabled: true, required: true },
          liveness: { enabled: true, required: true },
          personalInfo: { enabled: true, required: true },
          agreements: { enabled: true, required: true },
        },
        defaults: {
          reviewMode: 'auto',
        },
      },
    });
  },

  // ============================================
  // 资金相关
  // ============================================

  // GET /api/funds/deposits
  'GET /api/funds/deposits': async ({ headers, query }) => {
    const user = await getCurrentUserFromToken(headers);
    if (!user) {
      return new MockResponse({ error: '未登录' }, 401);
    }
    
    const deposits = mockDB.find('deposits', (d: any) => {
      if (user.role === 'user') {
        return d.userId === user.id;
      }
      if (query.tenantId) {
        return d.tenantId === query.tenantId;
      }
      return d.tenantId === user.tenantId;
    });
    
    return new MockResponse({ deposits });
  },

  // GET /api/funds/withdrawals
  'GET /api/funds/withdrawals': async ({ headers, query }) => {
    const user = await getCurrentUserFromToken(headers);
    if (!user) {
      return new MockResponse({ error: '未登录' }, 401);
    }
    
    const withdrawals = mockDB.find('withdrawals', (w: any) => {
      if (user.role === 'user') {
        return w.userId === user.id;
      }
      if (query.tenantId) {
        return w.tenantId === query.tenantId;
      }
      return w.tenantId === user.tenantId;
    });
    
    return new MockResponse({ withdrawals });
  },

  // POST /api/funds/deposit
  'POST /api/funds/deposit': async ({ headers, body }) => {
    const user = await getCurrentUserFromToken(headers);
    if (!user) {
      return new MockResponse({ error: '未登录' }, 401);
    }
    
    const deposit = {
      id: generateId('dep'),
      userId: user.id,
      tenantId: user.tenantId,
      amount: body?.amount,
      currency: body?.currency || 'USD',
      method: body?.method || 'bank_transfer',
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    
    mockDB.insert('deposits', deposit);
    
    return new MockResponse({ success: true, deposit });
  },

  // ============================================
  // 通知相关
  // ============================================

  // GET /api/notifications
  'GET /api/notifications': async ({ headers }) => {
    const user = await getCurrentUserFromToken(headers);
    if (!user) {
      return new MockResponse({ error: '未登录' }, 401);
    }
    
    const notifications = mockDB.find('notifications', (n: any) => n.userId === user.id);
    notifications.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return new MockResponse({ notifications });
  },

  // PATCH /api/notifications/:id/read
  'PATCH /api/notifications/': async ({ headers, url }) => {
    const user = await getCurrentUserFromToken(headers);
    if (!user) {
      return new MockResponse({ error: '未登录' }, 401);
    }
    
    const id = url.pathname.split('/').pop();
    mockDB.update('notifications', id || '', { isRead: true });
    
    return new MockResponse({ success: true });
  },

  // ============================================
  // 用户管理 (CRM)
  // ============================================

  // GET /api/users
  'GET /api/users': async ({ headers, query }) => {
    const user = await getCurrentUserFromToken(headers);
    if (!user) {
      return new MockResponse({ error: '未登录' }, 401);
    }
    
    // 只有租户管理员可以查看用户列表
    if (user.role === 'user') {
      return new MockResponse({ error: '权限不足' }, 403);
    }
    
    let users = mockDB.getCollection<MockUser>('users');
    
    // 过滤本租户用户
    if (user.tenantId) {
      users = users.filter(u => u.tenantId === user.tenantId);
    }
    
    // 搜索过滤
    if (query.search) {
      const search = query.search.toLowerCase();
      users = users.filter(u => 
        u.email.toLowerCase().includes(search) || 
        u.name.toLowerCase().includes(search)
      );
    }
    
    // 状态过滤
    if (query.kycStatus) {
      users = users.filter(u => u.kycStatus === query.kycStatus);
    }
    
    return new MockResponse({ 
      users: users.map(u => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        kycStatus: u.kycStatus,
        kycLevel: u.kycLevel,
        createdAt: u.createdAt,
        lastLoginAt: u.lastLoginAt,
      }))
    });
  },
  // GET /api/crm/users - CRM 用户列表
  'GET /api/crm/users': async () => {
    const users = mockDB.getCollection<MockUser>('users') || [];
    const items = users.map((u, i) => ({
      id: u.id,
      uid: `USR${String(i + 1).padStart(3, "0")}`,
      name: u.name,
      email: u.email,
      phone: (u as any).phone || "+86 138****0000",
      status: u.status === "suspended" ? "frozen" : (u.status || "active"),
      kycStatus: u.kycStatus || "not_submitted",
      level: "standard",
      balance: Math.floor(Math.random() * 100000),
      equity: Math.floor(Math.random() * 100000),
      createdAt: u.createdAt,
      lastLoginAt: u.lastLoginAt || u.createdAt,
      tags: [],
      country: "CN",
    }));
    return new MockResponse({ success: true, items, total: items.length });
  },

  // GET /api/tenant/apps
  'GET /api/tenant/apps': async () => {
    return new MockResponse({ installedApps: ["copy_trading", "ai_signals", "ib_referral"] });
  },
};

// 辅助函数：从 token 获取当前用户
async function getCurrentUserFromToken(headers: Headers) {
  // 先从 Authorization header 读取
  let token: string | null | undefined = headers.get('authorization')?.replace('Bearer ', '');
  
  // 如果没有，从 cookie 读取
  if (!token && typeof document !== 'undefined') {
    const match = document.cookie.match(/token=([^;]+)/);
    token = match ? decodeURIComponent(match[1]) : undefined;
  }
  
  if (!token) return null;
  
  // 先尝试 validateSession（正式 session）
  const session = mockDB.validateSession(token);
  if (session) {
    return mockDB.findById<MockUser>('users', session.userId);
  }
  
  // Fallback: mock token 直接返回默认用户（Demo 模式）
  if (token.startsWith('mock-token-')) {
    const users = mockDB.find<MockUser>('users', (u: MockUser) => u.role === 'user');
    if (users.length > 0) return users[0];
  }
  
  return null;
}

// 主 mockFetch 函数
export async function mockFetch(
  input: string | URL | Request,
  init?: RequestInit
): Promise<Response> {
  // 模拟网络延迟
  await mockDelay(200 + Math.random() * 300);
  
  const url = typeof input === 'string' ? new URL(input, 'http://localhost') : 
              input instanceof URL ? input : new URL(input.url);
  
  const method = init?.method || 'GET';
  const body = init?.body ? JSON.parse(init.body as string) : undefined;
  const headers = new Headers(init?.headers);
  
  const query: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    query[key] = value;
  });
  
  // 查找匹配的路由
  const routeKey = `${method} ${url.pathname}`;
  const handler = routes[routeKey] || findDynamicRoute(routeKey);
  
  if (!handler) {
    console.warn(`[MockFetch] No handler for: ${routeKey}`);
    return new MockResponse({ error: 'Not Found' }, 404) as unknown as Response;
  }
  
  try {
    const response = await handler({ url, method, body, headers, query });
    return response as unknown as Response;
  } catch (error) {
    console.error(`[MockFetch] Error handling ${routeKey}:`, error);
    return new MockResponse({ error: 'Internal Server Error' }, 500) as unknown as Response;
  }
}

// 查找动态路由
function findDynamicRoute(routeKey: string): RouteHandler | undefined {
  // 支持 /api/resource/:id 模式
  const basePath = routeKey.replace(/\/[^/]+$/, '/');
  return routes[basePath];
}

// 覆盖全局 fetch（仅在客户端）
export function enableMockFetch(): void {
  if (typeof window !== 'undefined') {
    (window as any).originalFetch = window.fetch;
    window.fetch = mockFetch as any;
    console.log('[Mock] API mocking enabled');
  }
}

// 恢复全局 fetch
export function disableMockFetch(): void {
  if (typeof window !== 'undefined' && (window as any).originalFetch) {
    window.fetch = (window as any).originalFetch;
    console.log('[Mock] API mocking disabled');
  }
}
