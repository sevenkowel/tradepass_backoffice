/**
 * TradePass Mock 数据类型定义
 * 纯前端 Demo 使用，数据通过 Zustand + localStorage 持久化
 */

export type UserRole = 'owner' | 'admin' | 'operator' | 'platform_admin' | 'tenant_owner' | 'tenant_admin' | 'user';

export type TenantRegion = 'VN' | 'TH' | 'IN' | 'AE' | 'KR' | 'JP' | 'FR' | 'ES' | 'BR';

export type TenantPlan = 'starter' | 'growth' | 'enterprise';

export type TenantStatus = 'active' | 'suspended' | 'pending' | 'trial';

export type OnboardingStatus = 'not_started' | 'in_progress' | 'completed' | 'paused';

export interface OnboardingPhase {
  branding: boolean;
  auth: boolean;
  kyc: boolean;
  payments: boolean;
  trading: boolean;
  accounts: boolean;
}

export const DEFAULT_ONBOARDING_PHASES: OnboardingPhase = {
  branding: false,
  auth: false,
  kyc: false,
  payments: false,
  trading: false,
  accounts: false,
};

export type LicenseType = 'MT4' | 'MT5' | 'cTrader';

export type LicenseStatus = 'active' | 'expired' | 'suspended';

export type KycLevel = 'basic' | 'standard' | 'enhanced';

// 外汇经纪商业务配置类型
export type TradingInstrument = 'forex' | 'metals' | 'indices' | 'commodities' | 'crypto' | 'stocks';

export type AccountType = 'standard' | 'ecn' | 'vip' | 'micro';

export type LeverageOption = '1:50' | '1:100' | '1:200' | '1:500' | '1:1000';

export type RegulationType = 'none' | 'offshore' | 'tier3' | 'tier2' | 'tier1';

export interface BrokerConfig {
  // 交易产品
  instruments: TradingInstrument[];
  // 账户类型
  accountTypes: AccountType[];
  // 杠杆选项
  leverageOptions: LeverageOption[];
  // 监管类型
  regulationType: RegulationType;
  // 监管机构名称
  regulationName?: string;
  // 监管牌照号
  licenseNumber?: string;
  // 基础货币
  baseCurrencies: string[];
  // 点差类型
  spreadType: 'fixed' | 'variable' | 'raw';
  // 最小入金 (USD)
  minDeposit: number;
  // 是否启用伊斯兰账户
  islamicAccount: boolean;
  // 是否启用跟单交易
  copyTrading: boolean;
  // 是否启用MAM/PAMM
  mamPamm: boolean;
}

// ============================================
// 租户初始化配置类型
// ============================================

// 品牌配置
export interface BrandConfig {
  brandName: string;
  companyName: string;
  slug: string;
  primaryColor: string;
  logo?: string;
  favicon?: string;
}

// 业务模板类型
export type BusinessTemplateId = 'standard_fx' | 'crypto_focus' | 'sea_local' | 'custom';

export interface BusinessTemplate {
  id: BusinessTemplateId;
  name: string;
  description: string;
  icon: string;
  preset: {
    instruments: TradingInstrument[];
    accountTypes: AccountType[];
    leverageOptions: LeverageOption[];
    regulationType: RegulationType;
    baseCurrencies: string[];
    minDeposit: number;
    spreadType: 'fixed' | 'variable' | 'raw';
    islamicAccount: boolean;
    copyTrading: boolean;
    mamPamm: boolean;
  };
  paymentPreset: {
    depositMethods: string[];
    withdrawalMethods: string[];
  };
}

// 支付配置
export type PaymentMethodType = 'bank_transfer' | 'ewallet' | 'crypto' | 'card';

export interface PaymentMethodConfig {
  method: PaymentMethodType;
  provider: string;
  providerName: string;
  icon?: string;
  enabled: boolean;
  minAmount: number;
  maxAmount: number;
  fee: number;
  feeType: 'fixed' | 'percentage';
  processingTime: string;
  currencies: string[];
}

export interface PaymentConfig {
  depositMethods: PaymentMethodConfig[];
  withdrawalMethods: PaymentMethodConfig[];
}

// 运营任务
export type TaskPriority = 'P0' | 'P1' | 'P2' | 'P3';

export interface OnboardingTask {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  completed: boolean;
  skipped: boolean;
  completedAt?: string;
  actionUrl: string;
}

export interface MockUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
  avatar?: string;
  // 旧版兼容字段
  lastLoginAt?: string;
  kycStatus?: string;
  kycLevel?: string;
  tenantId?: string;
  status?: string;
}

export interface MockTenant {
  id: string;
  name: string;
  slug: string;
  region: TenantRegion;
  plan: TenantPlan;
  status: TenantStatus;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  settings: {
    kycLevel: KycLevel;
    features: string[];
    branding?: {
      logo?: string;
      primaryColor?: string;
      favicon?: string;
      companyName?: string;
    };
  };
  // 外汇经纪商业务配置
  brokerConfig?: BrokerConfig;
  // 租户初始化配置（新增）
  brandConfig?: BrandConfig;
  businessTemplate?: BusinessTemplate;
  paymentConfig?: PaymentConfig;
  onboardingStatus: OnboardingStatus;
  onboardingPhases: OnboardingPhase;
  onboardingCompleted: boolean;
  onboardingCompletedAt?: string;
  onboardingTasks: OnboardingTask[];
  // 旧版兼容字段
  subdomain?: string;
  logo?: string;
  primaryColor?: string;
  subscription?: {
    plan?: string;
    expiresAt?: string;
  };
}

export interface MockLicense {
  id: string;
  tenantId: string;
  type: LicenseType;
  server: string;
  status: LicenseStatus;
  createdAt: string;
  expiresAt: string;
}

export interface MockCrmUser {
  id: string;
  tenantId: string;
  email: string;
  name: string;
  phone?: string;
  kycStatus: 'not_started' | 'pending' | 'approved' | 'rejected';
  balance: number;
  currency: string;
  createdAt: string;
  lastLoginAt?: string;
}

export interface MockKycRecord {
  id: string;
  userId: string;
  tenantId: string;
  level: KycLevel;
  status: 'not_started' | 'document_uploaded' | 'ocr_processing' | 'ocr_completed' | 
          'liveness_pending' | 'liveness_completed' | 'personal_info_pending' | 
          'personal_info_completed' | 'agreement_pending' | 'submitted' | 
          'under_review' | 'approved' | 'rejected';
  documents: {
    type: string;
    url: string;
    uploadedAt: string;
  }[];
  submittedAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
  // 旧版兼容字段
  ocrData?: {
    fullName?: string;
    idNumber?: string;
    dateOfBirth?: string;
  };
  region?: string;
}

export interface MockDeposit {
  id: string;
  userId: string;
  tenantId: string;
  amount: number;
  currency: string;
  method: 'bank_transfer' | 'credit_card' | 'crypto' | 'ewallet';
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  createdAt: string;
  completedAt?: string;
}

export interface MockWithdrawal {
  id: string;
  userId: string;
  tenantId: string;
  amount: number;
  currency: string;
  method: 'bank_transfer' | 'crypto' | 'ewallet';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  createdAt: string;
  completedAt?: string;
}

// API 响应类型
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

// Store 类型
export interface MockStore {
  // 当前会话
  currentUser: MockUser | null;
  currentTenantId: string | null;
  
  // 数据存储
  users: MockUser[];
  tenants: MockTenant[];
  licenses: MockLicense[];
  crmUsers: MockCrmUser[];
  kycRecords: MockKycRecord[];
  deposits: MockDeposit[];
  withdrawals: MockWithdrawal[];
  
  // 认证方法
  register: (email: string, password: string, name: string) => MockUser;
  login: (email: string, password: string) => MockUser | null;
  logout: () => void;
  
  // 租户方法
  createTenant: (data: Partial<MockTenant> & { 
    name: string; 
    region: TenantRegion; 
    plan: TenantPlan;
    slug: string;
    brandConfig?: BrandConfig;
    businessTemplate?: BusinessTemplate;
    paymentConfig?: PaymentConfig;
    brokerConfig?: BrokerConfig;
  }) => MockTenant;
  updateTenant: (id: string, data: Partial<MockTenant>) => MockTenant | null;
  deleteTenant: (id: string) => boolean;
  getUserTenants: (userId: string) => MockTenant[];
  getTenantById: (id: string) => MockTenant | null;
  setCurrentTenant: (tenantId: string | null) => void;
  
  // Onboarding 方法
  updateOnboardingPhase: (tenantId: string, phase: keyof OnboardingPhase, value: boolean) => void;
  updateOnboardingStatus: (tenantId: string, status: OnboardingStatus) => void;
  completeOnboarding: (tenantId: string) => void;
  getOnboardingProgress: (tenantId: string) => { completed: number; total: number; phases: OnboardingPhase; status: OnboardingStatus };
  
  // License 方法
  createLicense: (tenantId: string, type: LicenseType) => MockLicense;
  getTenantLicenses: (tenantId: string) => MockLicense[];
  deleteLicense: (id: string) => boolean;
  
  // CRM 方法
  createCrmUser: (tenantId: string, data: Partial<MockCrmUser> & { email: string; name: string }) => MockCrmUser;
  getCrmUsers: (tenantId: string) => MockCrmUser[];
  updateCrmUser: (id: string, data: Partial<MockCrmUser>) => MockCrmUser | null;
  
  // KYC 方法
  createKycRecord: (tenantId: string, userId: string, level: KycLevel) => MockKycRecord;
  getKycRecords: (tenantId: string) => MockKycRecord[];
  updateKycStatus: (id: string, status: MockKycRecord['status'], reviewerId?: string, rejectionReason?: string) => MockKycRecord | null;
  
  // 资金方法
  createDeposit: (tenantId: string, userId: string, amount: number, currency: string, method: MockDeposit['method']) => MockDeposit;
  createWithdrawal: (tenantId: string, userId: string, amount: number, currency: string, method: MockWithdrawal['method']) => MockWithdrawal;
  getDeposits: (tenantId: string) => MockDeposit[];
  getWithdrawals: (tenantId: string) => MockWithdrawal[];
  
  // 初始化 Demo 数据
  initDemoData: () => void;
  resetAllData: () => void;
}

// ============================================
// 旧版兼容类型（用于 mockDB.ts）
// ============================================

export interface MockEntity {
  id: string;
  [key: string]: any;
}

export interface MockSession {
  userId: string;
  expiresAt: string;
}

export interface MockDatabase {
  tenants: MockTenant[];
  users: MockUser[];
  kycRecords: MockKycRecord[];
  deposits: MockDeposit[];
  withdrawals: MockWithdrawal[];
  licenses: MockLicense[];
  tradingAccounts: unknown[];
  notifications: unknown[];
  sessions: Record<string, MockSession>;
  currentUserId?: string;
}
