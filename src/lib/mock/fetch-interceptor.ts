/**
 * TradePass Fetch 拦截层
 * 拦截 window.fetch 请求，返回 Mock 数据
 * 无需修改现有页面的 fetch 调用
 */

'use client';

import { useMockStore } from './store';
import { ApiResponse, MockKycRecord, BrokerConfig, BrandConfig, BusinessTemplate, PaymentConfig } from './types';

// 路由匹配规则
interface RoutePattern {
  method: string;
  pattern: RegExp;
  handler: (params: string[], body?: unknown, query?: URLSearchParams) => ApiResponse | Promise<ApiResponse>;
}

// 解析 URL 参数
const parseBody = (body: unknown): Record<string, unknown> => {
  if (typeof body === 'string') {
    try {
      return JSON.parse(body);
    } catch {
      return {};
    }
  }
  return (body as Record<string, unknown>) || {};
};

// ==================== Auth Handlers ====================

const handleRegister = (params: string[], body?: unknown): ApiResponse => {
  const data = parseBody(body);
  const store = useMockStore.getState();
  
  try {
    const user = store.register(
      data.email as string,
      data.password as string,
      data.name as string
    );
    return { success: true, data: user };
  } catch (error) {
    return { 
      success: false, 
      error: { 
        code: 'USER_EXISTS', 
        message: (error as Error).message 
      } 
    };
  }
};

const handleLogin = (params: string[], body?: unknown): ApiResponse => {
  const data = parseBody(body);
  const store = useMockStore.getState();
  
  const user = store.login(
    data.email as string,
    data.password as string
  );
  
  if (user) {
    return { success: true, data: user };
  }
  
  return { 
    success: false, 
    error: { 
      code: 'INVALID_CREDENTIALS', 
      message: 'Invalid email or password' 
    } 
  };
};

const handleLogout = (params: string[]): ApiResponse => {
  const store = useMockStore.getState();
  store.logout();
  return { success: true };
};

const handleGetMe = (params: string[]): ApiResponse => {
  const store = useMockStore.getState();
  const user = store.currentUser;
  
  if (!user) {
    return { 
      success: false, 
      error: { 
        code: 'UNAUTHORIZED', 
        message: 'Not authenticated' 
      } 
    };
  }
  
  return { success: true, data: user };
};

// ==================== Tenant Handlers ====================

const handleGetTenants = (params: string[]): ApiResponse => {
  const store = useMockStore.getState();
  const user = store.currentUser;
  
  if (!user) {
    return { 
      success: false, 
      error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } 
    };
  }
  
  const tenants = store.getUserTenants(user.id);
  return { success: true, data: tenants };
};

const handleCreateTenant = (params: string[], body?: unknown): ApiResponse => {
  const data = parseBody(body);
  const store = useMockStore.getState();

  if (!store.currentUser) {
    return {
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Not authenticated' }
    };
  }

  try {
    const tenant = store.createTenant({
      name: data.name as string,
      slug: data.slug as string,
      region: data.region as 'VN' | 'TH' | 'IN' | 'AE' | 'KR' | 'JP' | 'FR' | 'ES' | 'BR',
      plan: data.plan as 'starter' | 'growth' | 'enterprise',
      settings: data.settings as {
        kycLevel: 'basic' | 'standard' | 'enhanced';
        features: string[];
        branding?: { logo?: string; primaryColor?: string; companyName?: string; favicon?: string }
      },
      brokerConfig: data.brokerConfig as BrokerConfig,
      brandConfig: data.brandConfig as BrandConfig,
      businessTemplate: data.businessTemplate as BusinessTemplate,
      paymentConfig: data.paymentConfig as PaymentConfig,
    });
    return { success: true, data: tenant };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'CREATE_FAILED',
        message: (error as Error).message
      }
    };
  }
};

const handleGetTenant = (params: string[]): ApiResponse => {
  const tenantId = params[0];
  const store = useMockStore.getState();
  
  const tenant = store.getTenantById(tenantId);
  
  if (!tenant) {
    return { 
      success: false, 
      error: { code: 'NOT_FOUND', message: 'Tenant not found' } 
    };
  }
  
  return { success: true, data: tenant };
};

const handleUpdateTenant = (params: string[], body?: unknown): ApiResponse => {
  const tenantId = params[0];
  const data = parseBody(body);
  const store = useMockStore.getState();
  
  const tenant = store.updateTenant(tenantId, data);
  
  if (!tenant) {
    return { 
      success: false, 
      error: { code: 'NOT_FOUND', message: 'Tenant not found' } 
    };
  }
  
  return { success: true, data: tenant };
};

const handleDeleteTenant = (params: string[]): ApiResponse => {
  const tenantId = params[0];
  const store = useMockStore.getState();
  
  const success = store.deleteTenant(tenantId);
  
  if (!success) {
    return { 
      success: false, 
      error: { code: 'NOT_FOUND', message: 'Tenant not found' } 
    };
  }
  
  return { success: true };
};

// ==================== License Handlers ====================

const handleGetLicenses = (params: string[]): ApiResponse => {
  const tenantId = params[0];
  const store = useMockStore.getState();
  
  const licenses = store.getTenantLicenses(tenantId);
  return { success: true, data: licenses };
};

const handleCreateLicense = (params: string[], body?: unknown): ApiResponse => {
  const tenantId = params[0];
  const data = parseBody(body);
  const store = useMockStore.getState();
  
  try {
    const license = store.createLicense(
      tenantId,
      data.type as 'MT4' | 'MT5' | 'cTrader'
    );
    return { success: true, data: license };
  } catch (error) {
    return { 
      success: false, 
      error: { 
        code: 'CREATE_FAILED', 
        message: (error as Error).message 
      } 
    };
  }
};

const handleDeleteLicense = (params: string[]): ApiResponse => {
  const licenseId = params[0];
  const store = useMockStore.getState();
  
  const success = store.deleteLicense(licenseId);
  
  if (!success) {
    return { 
      success: false, 
      error: { code: 'NOT_FOUND', message: 'License not found' } 
    };
  }
  
  return { success: true };
};

// ==================== CRM Handlers ====================

const handleGetCrmUsers = (params: string[], body?: unknown, query?: URLSearchParams): ApiResponse => {
  const store = useMockStore.getState();
  const tenantId = query?.get('tenantId');
  
  if (!tenantId) {
    return { 
      success: false, 
      error: { code: 'BAD_REQUEST', message: 'tenantId is required' } 
    };
  }
  
  const users = store.getCrmUsers(tenantId);
  return { 
    success: true, 
    data: users,
    meta: { total: users.length }
  };
};

const handleCreateCrmUser = (params: string[], body?: unknown): ApiResponse => {
  const data = parseBody(body);
  const store = useMockStore.getState();
  
  try {
    const user = store.createCrmUser(
      data.tenantId as string,
      {
        email: data.email as string,
        name: data.name as string,
        phone: data.phone as string,
      }
    );
    return { success: true, data: user };
  } catch (error) {
    return { 
      success: false, 
      error: { 
        code: 'CREATE_FAILED', 
        message: (error as Error).message 
      } 
    };
  }
};

const handleUpdateCrmUser = (params: string[], body?: unknown): ApiResponse => {
  const userId = params[0];
  const data = parseBody(body);
  const store = useMockStore.getState();
  
  const user = store.updateCrmUser(userId, data);
  
  if (!user) {
    return { 
      success: false, 
      error: { code: 'NOT_FOUND', message: 'User not found' } 
    };
  }
  
  return { success: true, data: user };
};

// ==================== KYC Handlers ====================

const handleGetKycRecords = (params: string[], body?: unknown, query?: URLSearchParams): ApiResponse => {
  const store = useMockStore.getState();
  const tenantId = query?.get('tenantId');
  
  if (!tenantId) {
    return { 
      success: false, 
      error: { code: 'BAD_REQUEST', message: 'tenantId is required' } 
    };
  }
  
  const records = store.getKycRecords(tenantId);
  return { 
    success: true, 
    data: records,
    meta: { total: records.length }
  };
};

const handleUpdateKycStatus = (params: string[], body?: unknown): ApiResponse => {
  const kycId = params[0];
  const data = parseBody(body);
  const store = useMockStore.getState();
  
  const record = store.updateKycStatus(
    kycId,
    data.status as MockKycRecord['status'],
    data.reviewerId as string,
    data.rejectionReason as string
  );
  
  if (!record) {
    return { 
      success: false, 
      error: { code: 'NOT_FOUND', message: 'KYC record not found' } 
    };
  }
  
  return { success: true, data: record };
};

// ==================== Deposit/Withdrawal Handlers ====================

const handleGetDeposits = (params: string[], body?: unknown, query?: URLSearchParams): ApiResponse => {
  const store = useMockStore.getState();
  const tenantId = query?.get('tenantId');
  
  if (!tenantId) {
    return { 
      success: false, 
      error: { code: 'BAD_REQUEST', message: 'tenantId is required' } 
    };
  }
  
  const deposits = store.getDeposits(tenantId);
  return { 
    success: true, 
    data: deposits,
    meta: { total: deposits.length }
  };
};

const handleGetWithdrawals = (params: string[], body?: unknown, query?: URLSearchParams): ApiResponse => {
  const store = useMockStore.getState();
  const tenantId = query?.get('tenantId');
  
  if (!tenantId) {
    return { 
      success: false, 
      error: { code: 'BAD_REQUEST', message: 'tenantId is required' } 
    };
  }
  
  const withdrawals = store.getWithdrawals(tenantId);
  return { 
    success: true, 
    data: withdrawals,
    meta: { total: withdrawals.length }
  };
};

// ==================== Route Patterns ====================

const routes: RoutePattern[] = [
  // Auth
  { method: 'POST', pattern: /^\/api\/auth\/register$/, handler: handleRegister },
  { method: 'POST', pattern: /^\/api\/auth\/login$/, handler: handleLogin },
  { method: 'POST', pattern: /^\/api\/auth\/logout$/, handler: handleLogout },
  { method: 'GET', pattern: /^\/api\/auth\/me$/, handler: handleGetMe },

  // Tenants (Console API)
  { method: 'GET', pattern: /^\/api\/console\/tenants$/, handler: handleGetTenants },
  { method: 'POST', pattern: /^\/api\/console\/tenants$/, handler: handleCreateTenant },
  { method: 'GET', pattern: /^\/api\/console\/tenants\/([^/]+)$/, handler: handleGetTenant },
  { method: 'PUT', pattern: /^\/api\/console\/tenants\/([^/]+)$/, handler: handleUpdateTenant },
  { method: 'DELETE', pattern: /^\/api\/console\/tenants\/([^/]+)$/, handler: handleDeleteTenant },

  // Tenants (Legacy API - 向后兼容)
  { method: 'GET', pattern: /^\/api\/tenants$/, handler: handleGetTenants },
  { method: 'POST', pattern: /^\/api\/tenants$/, handler: handleCreateTenant },
  { method: 'GET', pattern: /^\/api\/tenants\/([^/]+)$/, handler: handleGetTenant },
  { method: 'PUT', pattern: /^\/api\/tenants\/([^/]+)$/, handler: handleUpdateTenant },
  { method: 'DELETE', pattern: /^\/api\/tenants\/([^/]+)$/, handler: handleDeleteTenant },
  
  // Licenses
  { method: 'GET', pattern: /^\/api\/tenants\/([^/]+)\/licenses$/, handler: handleGetLicenses },
  { method: 'POST', pattern: /^\/api\/tenants\/([^/]+)\/licenses$/, handler: handleCreateLicense },
  { method: 'DELETE', pattern: /^\/api\/licenses\/([^/]+)$/, handler: handleDeleteLicense },
  
  // CRM Users
  { method: 'GET', pattern: /^\/api\/crm\/users$/, handler: handleGetCrmUsers },
  { method: 'POST', pattern: /^\/api\/crm\/users$/, handler: handleCreateCrmUser },
  { method: 'PUT', pattern: /^\/api\/crm\/users\/([^/]+)$/, handler: handleUpdateCrmUser },
  
  // KYC
  { method: 'GET', pattern: /^\/api\/crm\/kyc$/, handler: handleGetKycRecords },
  { method: 'PUT', pattern: /^\/api\/crm\/kyc\/([^/]+)$/, handler: handleUpdateKycStatus },
  
  // Deposits & Withdrawals
  { method: 'GET', pattern: /^\/api\/crm\/deposits$/, handler: handleGetDeposits },
  { method: 'GET', pattern: /^\/api\/crm\/withdrawals$/, handler: handleGetWithdrawals },
];

// ==================== Interceptor Setup ====================

let isInterceptorSetup = false;

export function setupFetchInterceptor() {
  if (isInterceptorSetup) return;
  if (typeof window === 'undefined') return;
  
  const originalFetch = window.fetch;
  
  window.fetch = async (
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> => {
    const url = new URL(input.toString(), window.location.origin);
    const pathname = url.pathname;
    const method = (init?.method || 'GET').toUpperCase();
    
    // 查找匹配的路由
    for (const route of routes) {
      if (route.method !== method) continue;
      
      const match = pathname.match(route.pattern);
      if (match) {
        // 模拟网络延迟
        await new Promise((resolve) => setTimeout(resolve, 100 + Math.random() * 200));
        
        try {
          let body: unknown;
          if (init?.body) {
            body = init.body;
          }
          
          const params = match.slice(1);
          const result = await route.handler(params, body, url.searchParams);
          
          return new Response(JSON.stringify(result), {
            status: result.success ? 200 : 400,
            headers: {
              'Content-Type': 'application/json',
            },
          });
        } catch (error) {
          return new Response(
            JSON.stringify({
              success: false,
              error: {
                code: 'INTERNAL_ERROR',
                message: (error as Error).message,
              },
            }),
            {
              status: 500,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }
      }
    }
    
    // 未匹配，走真实 fetch
    return originalFetch(input, init);
  };
  
  isInterceptorSetup = true;
  console.log('[Mock] Fetch interceptor setup complete');
}

// 移除拦截器（用于调试）
export function removeFetchInterceptor() {
  if (typeof window === 'undefined') return;
  // 刷新页面即可重置
  window.location.reload();
}
