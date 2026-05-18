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

  // GET /api/apps — CRM 模块控制台
  'GET /api/apps': async ({ headers }) => {
    const user = await getCurrentUserFromToken(headers);
    if (!user) {
      return new MockResponse({ error: '未登录' }, 401);
    }

    // 产品配置（与 products.ts 保持一致）
    const PRODUCT_CODES = [
      'trade_pass_business',
      'trade_pass_growth',
      'trade_pass_engine',
      'trade_pass_edge',
      'trade_pass_media',
      'trade_pass_ai',
    ] as const;

    const PRODUCT_CONFIG: Record<string, any> = {
      trade_pass_business: {
        name: 'TradePass Business',
        shortName: 'Business',
        basePrice: 7000,
        currency: 'USD',
        isBaseLayer: true,
        modules: [
          { id: 'portal_access', name: '客户门户 Portal', description: '终端客户交易与账户管理门户', icon: 'Globe', route: '/portal' },
          { id: 'backoffice_access', name: '运营后台 Backoffice', description: '经纪商运营管理后台', icon: 'LayoutDashboard', route: '/backoffice' },
          { id: 'kyc_system', name: 'KYC 身份认证', description: '多地区多级别身份验证系统', icon: 'ShieldCheck', route: '/backoffice/compliance/kyc-review' },
          { id: 'funds_management', name: '资金管理', description: 'USDT/银行/信用卡多渠道出入金', icon: 'Wallet', route: '/backoffice/funds' },
          { id: 'trading_accounts', name: '交易账户', description: 'MT5 账户分组、杠杆配置', icon: 'Briefcase', route: '/backoffice/accounts' },
          { id: 'user_management', name: '用户管理', description: '用户列表、等级、标签管理', icon: 'Users', route: '/backoffice/users' },
          { id: 'reports_basic', name: '基础报表', description: '财务、交易、用户基础报表', icon: 'BarChart3', route: '/backoffice/reports' },
          { id: 'crm_support', name: 'CRM / 客服', description: '工单、反馈、交互记录', icon: 'Headphones', route: '/backoffice/crm' },
        ],
      },
      trade_pass_growth: {
        name: 'TradePass Growth',
        shortName: 'Growth',
        basePrice: 5000,
        currency: 'USD',
        isBaseLayer: false,
        modules: [
          { id: 'ib_referral', name: 'IB & 推荐系统', description: '多级代理佣金分层与推荐体系', icon: 'Network', route: '/backoffice/ib' },
          { id: 'cdp', name: '客户数据平台 CDP', description: '客户画像、分群、行为分析', icon: 'Database', route: '/backoffice/marketing' },
          { id: 'marketing_automation', name: '营销自动化', description: '活动、Banner、消息推送管理', icon: 'Megaphone', route: '/backoffice/marketing/campaigns' },
          { id: 'promotions', name: '促销活动', description: '优惠券、返佣、积分活动', icon: 'Gift', route: '/backoffice/marketing' },
        ],
      },
      trade_pass_engine: {
        name: 'TradePass Engine',
        shortName: 'Engine',
        basePrice: 10000,
        currency: 'USD',
        isBaseLayer: false,
        modules: [
          { id: 'mt5_web_terminal', name: 'MT5 Web 终端', description: '网页版 MT5 交易终端', icon: 'Monitor', route: '/backoffice/trading' },
          { id: 'order_management', name: '订单管理', description: '订单审核、持仓、交易品种管理', icon: 'TrendingUp', route: '/backoffice/trading/orders' },
          { id: 'copy_trading', name: 'Copy Trading', description: '社交跟单交易与分润体系', icon: 'Copy', route: '/backoffice/copy-trading', isAddOn: true, addOnPrice: 3000 },
          { id: 'api_integration', name: 'API 集成', description: 'REST API、Webhooks、第三方对接', icon: 'Plug', route: '/backoffice/system/api', isAddOn: true, addOnPrice: 2000 },
          { id: 'social_trading', name: 'Social Trading', description: '交易员排行榜与信号分享', icon: 'Users', route: '/backoffice/copy-trading' },
        ],
      },
      trade_pass_edge: {
        name: 'TradePass Edge',
        shortName: 'Edge',
        basePrice: 9000,
        currency: 'USD',
        isBaseLayer: false,
        modules: [
          { id: 'risk_engine', name: '风控引擎', description: '实时风控规则、告警、NBP 保护', icon: 'Shield', route: '/backoffice/risk' },
          { id: 'lp_management', name: 'LP 管理', description: '流动性提供商聚合与路由', icon: 'Route', route: '/backoffice/risk' },
          { id: 'margin_management', name: '保证金管理', description: '保证金监控、强平、追加通知', icon: 'AlertTriangle', route: '/backoffice/risk/margin' },
          { id: 'blacklist', name: '黑名单', description: '黑名单管理、自动拦截、AML', icon: 'Ban', route: '/backoffice/compliance/blacklist' },
        ],
      },
      trade_pass_media: {
        name: 'TradePass Media',
        shortName: 'Media',
        basePrice: 2000,
        currency: 'USD',
        isBaseLayer: false,
        modules: [
          { id: 'economic_calendar', name: '财经日历', description: '全球经济事件与市场影响', icon: 'Calendar', route: '/backoffice/marketing/news' },
          { id: 'news_feed', name: '新闻快讯', description: '实时财经新闻与快讯推送', icon: 'Newspaper', route: '/backoffice/marketing/news' },
          { id: 'market_commentary', name: '市场评论', description: '专业市场分析与评论', icon: 'MessageSquare', route: '/backoffice/marketing/news' },
          { id: 'data_visualization', name: '数据可视化', description: '行情图表、热力图、数据面板', icon: 'BarChart3', route: '/backoffice/reports' },
        ],
      },
      trade_pass_ai: {
        name: 'TradePass AI',
        shortName: 'AI',
        basePrice: 5000,
        currency: 'USD',
        isBaseLayer: false,
        modules: [
          { id: 'ai_signals', name: 'AI 交易信号', description: 'AI 驱动的交易信号推送', icon: 'Brain', route: '/backoffice/ai-signals', isAddOn: true, addOnPrice: 2000 },
          { id: 'ai_strategies', name: 'AI 交易策略', description: 'AI 生成的量化交易策略', icon: 'Cpu', route: '/backoffice/ai-signals' },
          { id: 'ai_order_analysis', name: 'AI 订单分析', description: '历史订单深度分析与洞察', icon: 'Search', route: '/backoffice/reports/trading' },
          { id: 'ai_reports', name: 'AI 报告', description: 'AI 日报、周报、月报自动生成', icon: 'FileText', route: '/backoffice/reports' },
          { id: 'ai_risk_alerts', name: 'AI 风控预警', description: 'AI 驱动的异常检测与预警', icon: 'AlertTriangle', route: '/backoffice/risk' },
        ],
      },
    };

    const BASE_LAYER_CODE = 'trade_pass_business';

    // Mock 订阅状态：基础层 + Growth + Engine 已订阅，其余未订阅
    const subscribedCodes = new Set([BASE_LAYER_CODE, 'trade_pass_growth', 'trade_pass_engine']);

    const groups = PRODUCT_CODES.map((code) => {
      const config = PRODUCT_CONFIG[code];
      const isSubscribed = subscribedCodes.has(code);

      return {
        productCode: code,
        productName: config.name,
        shortName: config.shortName,
        isBaseLayer: config.isBaseLayer,
        isSubscribed,
        basePrice: config.basePrice,
        currency: config.currency,
        modules: config.modules.map((m: any) => ({
          id: m.id,
          name: m.name,
          description: m.description,
          icon: m.icon,
          route: m.route,
          isAvailable: isSubscribed,
          isAddOn: m.isAddOn ?? false,
          addOnPrice: m.addOnPrice,
        })),
      };
    });

    const installedCount = groups.reduce(
      (sum, g) => sum + g.modules.filter((m: any) => m.isAvailable).length,
      0
    );
    const totalModuleCount = groups.reduce(
      (sum, g) => sum + g.modules.length,
      0
    );

    return new MockResponse({
      groups,
      stats: {
        installedModules: installedCount,
        totalModules: totalModuleCount,
        subscribedProducts: subscribedCodes.size,
        totalProducts: PRODUCT_CODES.length,
      },
    });
  },

  /* ── Approval Center handlers removed in v2 ─────────────────────
   * The full Approval Center API now lives as real Next.js Route
   * Handlers under `src/app/api/approvals/*`. The mockFetch override
   * intercepts the request, finds no handler in this map, and falls
   * through to the native fetch — which hits the real route handler
   * (server-side, sharing the same in-memory approvalService
   * singleton). One implementation, one source of truth.
   * See docs/Approval-Center-v2-Architecture.md §D5. */
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
  
  // Fallback: demo/mock token 直接返回默认用户（Demo 模式）
  if (token.startsWith('mock-token-') || token.startsWith('demo-token-')) {
    const users = mockDB.find<MockUser>('users', (u: MockUser) => u.role === 'tenant_admin');
    if (users.length > 0) return users[0];
    // 如果没有 tenant_admin，返回任意用户
    const allUsers = mockDB.getCollection<MockUser>('users');
    if (allUsers.length > 0) return allUsers[0];
  }
  
  return null;
}

// 主 mockFetch 函数
export async function mockFetch(
  input: string | URL | Request,
  init?: RequestInit
): Promise<Response> {
  const url = typeof input === 'string' ? new URL(input, 'http://localhost') :
              input instanceof URL ? input : new URL(input.url);

  // CRITICAL: only intercept /api/* paths. Anything else — including
  // Next.js RSC payload fetches for client-side navigation (which hit
  // route URLs like `/crm/approvals/my-tasks` with an `RSC=1` header)
  // — must pass through to the native fetch unchanged. Returning a
  // MockResponse for those breaks `res.headers.get(...)` inside the
  // App Router and the navigation silently falls back to a full
  // browser reload + surfaces a red error overlay.
  if (!url.pathname.startsWith('/api/')) {
    const origFetch = (window as any).originalFetch as typeof fetch | undefined;
    if (origFetch) return origFetch(input, init);
    // Last resort: if originalFetch was somehow lost, recreate using
    // the global Response via XHR-less means — but in practice this
    // branch is never hit because enableMockFetch always stashes it.
    return new Response(null, { status: 503 });
  }

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
    // No handler for this /api/* path. Pass through to the real Next.js
    // API route — Approval Center, for example, ships full server routes
    // under /api/approvals/* that should run instead of being shadowed
    // by an empty mock fallback.
    const origFetch = (window as any).originalFetch as typeof fetch | undefined;
    if (origFetch) {
      return origFetch(input, init);
    }
    console.warn(`[MockFetch] No handler for: ${routeKey} — returning empty fallback`);
    return new MockResponse({ success: true, items: [], total: 0 }, 200) as unknown as Response;
  }

  // 模拟网络延迟（仅 mock 请求）
  await mockDelay(200 + Math.random() * 300);
  
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
    // Guard against double-wrapping. React Strict Mode in dev mounts
    // effects twice, and HMR reloads can trigger re-init paths. If we
    // overwrite `originalFetch` with the already-wrapped fetch, we
    // lose the only handle to the real fetch and non-/api/ paths
    // (e.g. Next.js RSC navigation) start returning MockResponse.
    if ((window as any).__mockFetchInstalled) return;
    (window as any).__mockFetchInstalled = true;
    (window as any).originalFetch = window.fetch;
    window.fetch = mockFetch as any;
    console.log('[Mock] API mocking enabled');
  }
}

// 恢复全局 fetch
export function disableMockFetch(): void {
  if (typeof window !== 'undefined' && (window as any).originalFetch) {
    window.fetch = (window as any).originalFetch;
    (window as any).__mockFetchInstalled = false;
    console.log('[Mock] API mocking disabled');
  }
}
