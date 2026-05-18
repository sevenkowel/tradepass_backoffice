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

// ==================== Backoffice KYC Review Mock Data ====================

const MOCK_KYC_REVIEWS = [
  {
    id: 'kyc-review-001', userId: 'user-001',
    userName: 'Nguyen Van Anh', email: 'nguyenvananh@example.com', phone: '+84 912 345 678',
    regionCode: 'VN', country: 'Vietnam',
    kycLevel: 'standard' as const, status: 'submitted' as const, riskLevel: 'low' as const,
    documentType: 'id_card', documentFrontUrl: '/mock/docs/id_front.jpg', documentBackUrl: '/mock/docs/id_back.jpg', selfieUrl: '/mock/docs/selfie.jpg',
    ocrConfidence: 0.96, livenessPassed: true,
    submittedAt: '2026-05-05T10:30:00Z',
    personalInfo: { fullName: 'Nguyen Van Anh', dateOfBirth: '1992-03-15', nationality: 'Vietnam', address: '123 Le Loi Street', city: 'Ho Chi Minh City', country: 'Vietnam' },
    amlPassed: true, amlRiskScore: 12, flags: [],
  },
  {
    id: 'kyc-review-002', userId: 'user-002',
    userName: 'Somchai Jaidee', email: 'somchai@example.com', phone: '+66 81 234 5678',
    regionCode: 'TH', country: 'Thailand',
    kycLevel: 'enhanced' as const, status: 'under_review' as const, riskLevel: 'medium' as const,
    documentType: 'passport', documentFrontUrl: '/mock/docs/passport.jpg',
    ocrConfidence: 0.88, livenessPassed: true,
    submittedAt: '2026-05-04T14:20:00Z',
    personalInfo: { fullName: 'Somchai Jaidee', dateOfBirth: '1985-07-22', nationality: 'Thailand', address: '45 Sukhumvit Road', city: 'Bangkok', country: 'Thailand' },
    amlPassed: true, amlRiskScore: 35, flags: ['multiple_accounts'],
  },
  {
    id: 'kyc-review-003', userId: 'user-003',
    userName: 'Budi Santoso', email: 'budi@example.com', phone: '+62 812 3456 7890',
    regionCode: 'ID', country: 'Indonesia',
    kycLevel: 'basic' as const, status: 'submitted' as const, riskLevel: 'high' as const,
    documentType: 'drivers_license', documentFrontUrl: '/mock/docs/dl_front.jpg', documentBackUrl: '/mock/docs/dl_back.jpg',
    ocrConfidence: 0.72, livenessPassed: false,
    submittedAt: '2026-05-06T09:15:00Z',
    personalInfo: { fullName: 'Budi Santoso', dateOfBirth: '1998-11-30', nationality: 'Indonesia', address: 'Jl. Merdeka No. 88', city: 'Jakarta', country: 'Indonesia' },
    amlPassed: false, amlRiskScore: 72, flags: ['pep_related', 'unusual_pattern'],
  },
  {
    id: 'kyc-review-004', userId: 'user-004',
    userName: 'Chen Wei Ming', email: 'chenwm@example.com', phone: '+86 138 0000 1234',
    regionCode: 'CN', country: 'China',
    kycLevel: 'standard' as const, status: 'approved' as const, riskLevel: 'low' as const,
    documentType: 'id_card', documentFrontUrl: '/mock/docs/id_front_2.jpg', documentBackUrl: '/mock/docs/id_back_2.jpg', selfieUrl: '/mock/docs/selfie_2.jpg',
    ocrConfidence: 0.98, livenessPassed: true,
    submittedAt: '2026-05-02T08:00:00Z', reviewedAt: '2026-05-03T10:00:00Z', reviewedBy: 'admin_001',
    personalInfo: { fullName: 'Chen Wei Ming', dateOfBirth: '1990-01-10', nationality: 'China', address: '88 Nanjing Road', city: 'Shanghai', country: 'China' },
    amlPassed: true, amlRiskScore: 5, flags: [],
  },
  {
    id: 'kyc-review-005', userId: 'user-005',
    userName: 'Rajesh Kumar', email: 'rajesh.k@example.com', phone: '+91 98765 43210',
    regionCode: 'IN', country: 'India',
    kycLevel: 'standard' as const, status: 'rejected' as const, riskLevel: 'high' as const,
    documentType: 'passport', documentFrontUrl: '/mock/docs/passport_2.jpg',
    ocrConfidence: 0.45, livenessPassed: false,
    submittedAt: '2026-05-01T16:45:00Z', reviewedAt: '2026-05-02T09:30:00Z', reviewedBy: 'admin_002', rejectionReason: 'Document image quality too low, please resubmit with clearer photo',
    personalInfo: { fullName: 'Rajesh Kumar', dateOfBirth: '1982-06-25', nationality: 'India', address: '42 MG Road', city: 'Mumbai', country: 'India' },
    amlPassed: true, amlRiskScore: 28, flags: ['document_quality'],
  },
  {
    id: 'kyc-review-006', userId: 'user-006',
    userName: 'Sarah Lim', email: 'sarah.lim@example.com', phone: '+65 9123 4567',
    regionCode: 'SG', country: 'Singapore',
    kycLevel: 'enhanced' as const, status: 'under_review' as const, riskLevel: 'low' as const,
    documentType: 'passport', documentFrontUrl: '/mock/docs/passport_3.jpg', selfieUrl: '/mock/docs/selfie_3.jpg',
    ocrConfidence: 0.94, livenessPassed: true,
    submittedAt: '2026-05-06T11:00:00Z',
    personalInfo: { fullName: 'Sarah Lim', dateOfBirth: '1995-09-18', nationality: 'Singapore', address: '10 Orchard Road #12-34', city: 'Singapore', country: 'Singapore' },
    amlPassed: true, amlRiskScore: 8, flags: [],
  },
];

const MOCK_SUPPLEMENTAL_REQUESTS = [
  {
    id: 'sup-kyc-001', userId: 'user-003',
    type: 'risk_control' as const,
    requiredStages: ['identity' as const, 'liveness' as const],
    completedStages: ['identity' as const],
    status: 'in_progress' as const,
    initiatedBy: 'admin_001', initiatedByName: 'Admin Wong', initiatedAt: '2026-05-06T08:00:00Z',
    deadline: '2026-05-13T08:00:00Z',
    reason: 'High risk user triggered risk control supplemental KYC',
    notes: 'User flagged for unusual trading pattern. Please verify identity and liveness.',
    restrictions: { depositEnabled: true, withdrawEnabled: false, tradingEnabled: true, accountOpeningEnabled: false },
    targetTier: 2,
    notificationsSent: [{ type: 'email' as const, sentAt: '2026-05-06T08:01:00Z', status: 'delivered' as const }],
    createdAt: '2026-05-06T08:00:00Z', updatedAt: '2026-05-06T08:00:00Z',
  },
  {
    id: 'sup-kyc-002', userId: 'user-005',
    type: 'document_expiry' as const,
    requiredStages: ['identity' as const],
    completedStages: [],
    status: 'pending' as const,
    initiatedBy: 'admin_002', initiatedByName: 'System Auto', initiatedAt: '2026-05-05T14:00:00Z',
    deadline: '2026-05-20T14:00:00Z',
    reason: 'Submitted passport expiring within 30 days. Please provide updated document.',
    restrictions: { depositEnabled: true, withdrawEnabled: true, tradingEnabled: true, accountOpeningEnabled: true },
    notificationsSent: [{ type: 'email' as const, sentAt: '2026-05-05T14:01:00Z', status: 'delivered' as const }],
    metadata: { documentType: 'passport', documentExpiryDate: '2026-06-15' },
    createdAt: '2026-05-05T14:00:00Z', updatedAt: '2026-05-05T14:00:00Z',
  },
  {
    id: 'sup-kyc-003', userId: 'user-002',
    type: 'tier_upgrade' as const,
    requiredStages: ['identity' as const, 'address' as const, 'questionnaire' as const],
    completedStages: [],
    status: 'pending' as const,
    initiatedBy: 'admin_001', initiatedByName: 'Admin Wong', initiatedAt: '2026-05-04T10:30:00Z',
    deadline: '2026-05-18T10:30:00Z',
    reason: 'User requested tier upgrade from standard to enhanced. Additional verification required.',
    notes: 'Experience proof and financial source documentation needed.',
    restrictions: { depositEnabled: true, withdrawEnabled: true, tradingEnabled: true, accountOpeningEnabled: true },
    targetTier: 3,
    notificationsSent: [{ type: 'email' as const, sentAt: '2026-05-04T10:31:00Z', status: 'sent' as const }],
    createdAt: '2026-05-04T10:30:00Z', updatedAt: '2026-05-04T10:30:00Z',
  },
  {
    id: 'sup-kyc-004', userId: 'user-006',
    type: 'aml_compliance' as const,
    requiredStages: ['identity' as const, 'address' as const],
    completedStages: ['identity' as const, 'address' as const],
    status: 'completed' as const,
    initiatedBy: 'admin_002', initiatedByName: 'System Auto', initiatedAt: '2026-04-28T09:00:00Z',
    reason: 'Routine AML compliance check for high-net-worth account.',
    restrictions: { depositEnabled: true, withdrawEnabled: true, tradingEnabled: true, accountOpeningEnabled: true },
    notificationsSent: [{ type: 'email' as const, sentAt: '2026-04-28T09:01:00Z', status: 'delivered' as const }],
    completedAt: '2026-05-02T11:00:00Z', completedBy: 'admin_001',
    createdAt: '2026-04-28T09:00:00Z', updatedAt: '2026-05-02T11:00:00Z',
  },
];

// ==================== Backoffice KYC Review Handlers ====================

const handleGetKycReview = (_params: string[], _body?: unknown, query?: URLSearchParams): ApiResponse => {
  const status = query?.get('status') || 'all';
  const risk = query?.get('risk') || 'all';
  const search = query?.get('search') || '';

  let items = [...MOCK_KYC_REVIEWS];

  if (status !== 'all') items = items.filter((r) => r.status === status);
  if (risk !== 'all') items = items.filter((r) => r.riskLevel === risk);
  if (search) {
    const q = search.toLowerCase();
    items = items.filter(
      (r) => r.userName.toLowerCase().includes(q) || r.email.toLowerCase().includes(q) || r.id.toLowerCase().includes(q)
    );
  }

  return {
    success: true,
    items,
    stats: {
      total: MOCK_KYC_REVIEWS.length,
      submitted: MOCK_KYC_REVIEWS.filter((r) => r.status === 'submitted').length,
      under_review: MOCK_KYC_REVIEWS.filter((r) => r.status === 'under_review').length,
      approved: MOCK_KYC_REVIEWS.filter((r) => r.status === 'approved').length,
      rejected: MOCK_KYC_REVIEWS.filter((r) => r.status === 'rejected').length,
      high_risk: MOCK_KYC_REVIEWS.filter((r) => r.riskLevel === 'high').length,
    },
  } as unknown as ApiResponse;
};

const handlePostKycReview = (_params: string[], body?: unknown): ApiResponse => {
  const data = parseBody(body);
  const record = MOCK_KYC_REVIEWS.find((r) => r.id === data.id);
  if (!record) return { success: false, error: { code: 'NOT_FOUND', message: 'Record not found' } };

  const now = new Date().toISOString();
  switch (data.action) {
    case 'start_review':
      record.status = 'under_review';
      break;
    case 'approve':
      record.status = 'approved';
      record.reviewedAt = now;
      record.reviewedBy = 'mock_admin';
      break;
    case 'reject':
      record.status = 'rejected';
      record.reviewedAt = now;
      record.reviewedBy = 'mock_admin';
      record.rejectionReason = (data.reason as string) || 'Insufficient documentation';
      break;
    case 'request_info':
      record.status = 'submitted';
      (record.flags as string[]).push('info_requested');
      break;
  }

  return { success: true, message: `KYC ${data.action} successful`, record } as unknown as ApiResponse;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let supplementalStore: any[] = [...MOCK_SUPPLEMENTAL_REQUESTS];

const handleGetSupplemental = (_params: string[], _body?: unknown, query?: URLSearchParams): ApiResponse => {
  const status = query?.get('status') || 'all';
  const type = query?.get('type') || 'all';

  let requests = [...supplementalStore];
  if (status !== 'all') requests = requests.filter((r) => r.status === status);
  if (type !== 'all') requests = requests.filter((r) => r.type === type);

  return { success: true, requests } as unknown as ApiResponse;
};

const handlePostSupplemental = (_params: string[], body?: unknown): ApiResponse => {
  const data = parseBody(body) as Record<string, unknown>;
  const now = new Date().toISOString();
  const newRequest = {
    id: `sup-kyc-${Date.now()}`,
    userId: data.userId as string,
    type: data.type as string,
    requiredStages: (data.requiredStages as string[]) || ['identity'],
    completedStages: [],
    status: 'pending' as const,
    initiatedBy: 'mock_admin',
    initiatedByName: 'Mock Admin',
    initiatedAt: now,
    deadline: data.deadline as string,
    reason: data.reason as string,
    notes: data.notes as string,
    restrictions: (data.restrictions as Record<string, boolean>) || { depositEnabled: true, withdrawEnabled: true, tradingEnabled: true, accountOpeningEnabled: true },
    targetTier: data.targetTier as number,
    notificationsSent: [{ type: 'email' as const, sentAt: now, status: 'sent' as const }],
    createdAt: now,
    updatedAt: now,
  };
  supplementalStore.push(newRequest as any);
  return { success: true, request: newRequest } as unknown as ApiResponse;
};

const handleDeleteSupplemental = (params: string[], body?: unknown): ApiResponse => {
  const id = params[0];
  const data = parseBody(body);
  const index = supplementalStore.findIndex((r) => r.id === id);
  if (index === -1) return { success: false, error: { code: 'NOT_FOUND', message: 'Request not found' } };

  supplementalStore[index] = {
    ...supplementalStore[index],
    status: 'cancelled' as const,
    updatedAt: new Date().toISOString(),
  };
  return { success: true };
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
  
  // Backoffice KYC Review
  { method: 'GET', pattern: /^\/api\/backoffice\/kyc\/review$/, handler: handleGetKycReview },
  { method: 'POST', pattern: /^\/api\/backoffice\/kyc\/review$/, handler: handlePostKycReview },
  
  // Backoffice Supplemental KYC
  { method: 'GET', pattern: /^\/api\/backoffice\/kyc\/supplemental$/, handler: handleGetSupplemental },
  { method: 'POST', pattern: /^\/api\/backoffice\/kyc\/supplemental$/, handler: handlePostSupplemental },
  { method: 'DELETE', pattern: /^\/api\/backoffice\/kyc\/supplemental\/([^/]+)$/, handler: handleDeleteSupplemental },
  
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
