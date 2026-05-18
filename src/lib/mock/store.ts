/**
 * TradePass Mock Store
 * Zustand + persist 实现纯前端数据存储
 */

'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  MockStore,
  MockUser,
  MockTenant,
  MockLicense,
  MockCrmUser,
  MockKycRecord,
  MockDeposit,
  MockWithdrawal,
  TenantRegion,
  TenantPlan,
  LicenseType,
  KycLevel,
  BrokerConfig,
  OnboardingTask,
  DEFAULT_ONBOARDING_PHASES,
  OnboardingPhase,
  OnboardingStatus,
} from './types';

// 生成唯一 ID
const generateId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// 生成默认运营任务列表
const generateDefaultOnboardingTasks = (): OnboardingTask[] => [
  {
    id: 'upload_logo',
    title: '上传公司 Logo',
    description: '在 Portal 中展示专业品牌形象',
    priority: 'P2',
    completed: false,
    skipped: false,
    actionUrl: '/console/settings/branding',
  },
  {
    id: 'configure_spread',
    title: '配置交易点差',
    description: '设置交易成本和盈利模式',
    priority: 'P1',
    completed: false,
    skipped: false,
    actionUrl: '/console/settings/trading',
  },
  {
    id: 'setup_risk_rules',
    title: '设置风控规则',
    description: '配置爆仓比例和预警机制',
    priority: 'P1',
    completed: false,
    skipped: false,
    actionUrl: '/console/settings/risk',
  },
  {
    id: 'enable_2fa',
    title: '开启 2FA 安全',
    description: '保护账户安全',
    priority: 'P2',
    completed: false,
    skipped: false,
    actionUrl: '/console/settings/security',
  },
  {
    id: 'configure_notifications',
    title: '配置通知渠道',
    description: '设置邮件和短信通知',
    priority: 'P2',
    completed: false,
    skipped: false,
    actionUrl: '/console/settings/notifications',
  },
  {
    id: 'setup_kyc_level',
    title: '设置 KYC 等级',
    description: '根据合规要求配置身份验证流程',
    priority: 'P1',
    completed: true,
    skipped: false,
    completedAt: new Date().toISOString(),
    actionUrl: '/console/settings/kyc',
  },
  {
    id: 'configure_crm_tags',
    title: '配置 CRM 标签',
    description: '优化客户管理和营销策略',
    priority: 'P3',
    completed: false,
    skipped: false,
    actionUrl: '/crm/settings/tags',
  },
  {
    id: 'custom_email_templates',
    title: '自定义邮件模板',
    description: '保持品牌一致的邮件风格',
    priority: 'P3',
    completed: false,
    skipped: false,
    actionUrl: '/console/settings/email',
  },
];

// Demo 数据生成器
const createDemoTenant = (ownerId: string, index: number): MockTenant => {
  const name = `Demo Broker ${index + 1}`;
  const slug = `demo-broker-${index + 1}`;
  const primaryColor = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'][index % 4];
  return {
    id: generateId('tenant'),
    name,
    slug,
    region: ['VN', 'TH', 'IN', 'AE'][index % 4] as TenantRegion,
    plan: ['starter', 'growth', 'enterprise'][index % 3] as TenantPlan,
    status: 'active',
    ownerId,
    createdAt: new Date(Date.now() - index * 86400000 * 30).toISOString(),
    updatedAt: new Date().toISOString(),
    settings: {
      kycLevel: 'standard',
      features: ['portal', 'crm', 'mt5'],
      branding: {
        primaryColor,
        companyName: name,
      },
    },
    brandConfig: {
      brandName: name,
      companyName: `${name} Limited`,
      slug,
      primaryColor,
    },
    businessTemplate: {
      id: 'standard_fx',
      name: '标准外汇经纪商',
      description: '传统外汇业务模式',
      icon: '🏆',
      preset: {
        instruments: ['forex', 'metals', 'indices'],
        accountTypes: ['standard', 'ecn'],
        leverageOptions: ['1:100', '1:200', '1:500'],
        regulationType: 'offshore',
        baseCurrencies: ['USD', 'EUR'],
        minDeposit: 100,
        spreadType: 'variable',
        islamicAccount: false,
        copyTrading: false,
        mamPamm: false,
      },
      paymentPreset: {
        depositMethods: ['bank_transfer', 'ewallet', 'crypto'],
        withdrawalMethods: ['bank_transfer', 'crypto'],
      },
    },
    paymentConfig: {
      depositMethods: [
        {
          method: 'bank_transfer',
          provider: 'local_bank',
          providerName: '本地银行转账',
          enabled: true,
          minAmount: 50,
          maxAmount: 50000,
          fee: 0,
          feeType: 'fixed',
          processingTime: '1-2工作日',
          currencies: ['USD'],
        },
        {
          method: 'crypto',
          provider: 'usdt_trc20',
          providerName: 'USDT (TRC20)',
          enabled: true,
          minAmount: 50,
          maxAmount: 100000,
          fee: 1,
          feeType: 'fixed',
          processingTime: '即时',
          currencies: ['USDT'],
        },
      ],
      withdrawalMethods: [
        {
          method: 'bank_transfer',
          provider: 'local_bank',
          providerName: '本地银行转账',
          enabled: true,
          minAmount: 100,
          maxAmount: 10000,
          fee: 5,
          feeType: 'fixed',
          processingTime: '1-2工作日',
          currencies: ['USD'],
        },
      ],
    },
    onboardingStatus: 'completed',
    onboardingPhases: {
      branding: true,
      auth: true,
      kyc: true,
      payments: true,
      trading: true,
      accounts: true,
    },
    onboardingCompleted: true,
    onboardingCompletedAt: new Date(Date.now() - index * 86400000 * 30).toISOString(),
    onboardingTasks: generateDefaultOnboardingTasks().map(t => ({
      ...t,
      completed: Math.random() > 0.5,
      completedAt: Math.random() > 0.5 ? new Date().toISOString() : undefined,
    })),
  };
};

const createDemoLicense = (tenantId: string, type: LicenseType): MockLicense => ({
  id: generateId('license'),
  tenantId,
  type,
  server: `${type.toLowerCase()}.demo.tradepass.io`,
  status: 'active',
  createdAt: new Date().toISOString(),
  expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
});

const createDemoCrmUser = (tenantId: string, index: number): MockCrmUser => ({
  id: generateId('crm_user'),
  tenantId,
  email: `trader${index + 1}@example.com`,
  name: `Trader ${index + 1}`,
  phone: `+84${Math.floor(Math.random() * 900000000) + 100000000}`,
  kycStatus: ['not_started', 'pending', 'approved', 'approved', 'rejected'][index % 5] as MockCrmUser['kycStatus'],
  balance: Math.floor(Math.random() * 100000) + 1000,
  currency: 'USD',
  createdAt: new Date(Date.now() - Math.random() * 86400000 * 60).toISOString(),
  lastLoginAt: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString(),
});

const createDemoKycRecord = (tenantId: string, userId: string, userIndex: number): MockKycRecord | null => {
  const status = ['not_started', 'pending', 'approved', 'approved', 'rejected'][userIndex % 5] as MockCrmUser['kycStatus'];
  if (status === 'not_started') return null;
  
  const statusMap: Record<string, MockKycRecord['status']> = {
    pending: 'under_review',
    approved: 'approved',
    rejected: 'rejected',
  };
  
  return {
    id: generateId('kyc'),
    userId,
    tenantId,
    level: 'standard',
    status: statusMap[status],
    documents: [
      { type: 'id_card', url: '/mock/docs/id_card.jpg', uploadedAt: new Date().toISOString() },
      { type: 'proof_of_address', url: '/mock/docs/address.jpg', uploadedAt: new Date().toISOString() },
    ],
    submittedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    reviewedAt: status !== 'pending' ? new Date(Date.now() - 86400000).toISOString() : undefined,
    reviewedBy: status !== 'pending' ? 'admin_001' : undefined,
    rejectionReason: status === 'rejected' ? 'Document unclear, please resubmit' : undefined,
  };
};

export const useMockStore = create<MockStore>()(
  persist(
    (set, get) => ({
      // 初始状态
      currentUser: null,
      currentTenantId: null,
      users: [],
      tenants: [],
      licenses: [],
      crmUsers: [],
      kycRecords: [],
      deposits: [],
      withdrawals: [],

      // ==================== 认证方法 ====================
      
      register: (email: string, password: string, name: string) => {
        // 检查用户是否已存在
        const existingUser = get().users.find((u) => u.email === email);
        if (existingUser) {
          throw new Error('User already exists');
        }
        
        const user: MockUser = {
          id: generateId('user'),
          email,
          name,
          role: 'owner',
          createdAt: new Date().toISOString(),
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
        };
        
        set((state) => ({
          users: [...state.users, user],
          currentUser: user,
        }));
        
        return user;
      },

      login: (email: string, password: string) => {
        // Demo 模式：如果不存在则自动注册
        let user = get().users.find((u) => u.email === email);
        
        if (!user) {
          // 自动注册
          user = get().register(email, password, email.split('@')[0]);
        }
        
        set({ currentUser: user });
        return user;
      },

      logout: () => {
        set({ 
          currentUser: null,
          currentTenantId: null,
        });
      },

      // ==================== 租户方法 ====================
      
      createTenant: (data) => {
        const currentUser = get().currentUser;
        if (!currentUser) {
          throw new Error('Not authenticated');
        }

        const tenant: MockTenant = {
          id: generateId('tenant'),
          name: data.name,
          slug: data.slug || generateId('slug'),
          region: data.region,
          plan: data.plan,
          status: 'trial',
          ownerId: currentUser.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          settings: {
            kycLevel: data.settings?.kycLevel || 'standard',
            features: data.settings?.features || ['portal', 'crm', 'broker'],
            branding: data.settings?.branding,
          },
          brokerConfig: data.brokerConfig,
          brandConfig: data.brandConfig,
          businessTemplate: data.businessTemplate,
          paymentConfig: data.paymentConfig,
          onboardingStatus: 'not_started',
          onboardingPhases: { ...DEFAULT_ONBOARDING_PHASES },
          onboardingCompleted: false,
          onboardingCompletedAt: undefined,
          onboardingTasks: generateDefaultOnboardingTasks().map((t) => ({ ...t, completed: false })),
        };

        set((state) => ({
          tenants: [...state.tenants, tenant],
          currentTenantId: tenant.id,
        }));

        return tenant;
      },

      updateTenant: (id, data) => {
        let updated: MockTenant | null = null;
        set((state) => ({
          tenants: state.tenants.map((t) => {
            if (t.id === id) {
              updated = { ...t, ...data, updatedAt: new Date().toISOString() };
              return updated;
            }
            return t;
          }),
        }));
        return updated;
      },

      deleteTenant: (id) => {
        const tenant = get().tenants.find((t) => t.id === id);
        if (!tenant) return false;
        
        set((state) => ({
          tenants: state.tenants.filter((t) => t.id !== id),
          licenses: state.licenses.filter((l) => l.tenantId !== id),
          crmUsers: state.crmUsers.filter((u) => u.tenantId !== id),
          kycRecords: state.kycRecords.filter((k) => k.tenantId !== id),
        }));
        
        return true;
      },

      getUserTenants: (userId) => {
        return get().tenants.filter((t) => t.ownerId === userId);
      },

      getTenantById: (id) => {
        return get().tenants.find((t) => t.id === id) || null;
      },

      setCurrentTenant: (tenantId) => {
        set({ currentTenantId: tenantId });
      },

      // ==================== Onboarding 方法 ====================

      updateOnboardingPhase: (tenantId, phase, value) => {
        set((state) => ({
          tenants: state.tenants.map((t) => {
            if (t.id === tenantId) {
              const phases = { ...t.onboardingPhases, [phase]: value };
              const status: OnboardingStatus = Object.values(phases).every((v) => v)
                ? 'completed'
                : t.onboardingStatus === 'not_started'
                  ? 'in_progress'
                  : t.onboardingStatus;
              return {
                ...t,
                onboardingPhases: phases,
                onboardingStatus: status,
                onboardingCompleted: status === 'completed',
                onboardingCompletedAt: status === 'completed' ? new Date().toISOString() : undefined,
                updatedAt: new Date().toISOString(),
              } as MockTenant;
            }
            return t;
          }),
        }));
      },

      updateOnboardingStatus: (tenantId, status) => {
        set((state) => ({
          tenants: state.tenants.map((t) => {
            if (t.id === tenantId) {
              return {
                ...t,
                onboardingStatus: status,
                updatedAt: new Date().toISOString(),
              };
            }
            return t;
          }),
        }));
      },

      completeOnboarding: (tenantId) => {
        set((state) => ({
          tenants: state.tenants.map((t) => {
            if (t.id === tenantId) {
              return {
                ...t,
                onboardingStatus: 'completed',
                onboardingPhases: {
                  branding: true,
                  auth: true,
                  kyc: true,
                  payments: true,
                  trading: true,
                  accounts: true,
                },
                onboardingCompleted: true,
                onboardingCompletedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };
            }
            return t;
          }),
        }));
      },

      getOnboardingProgress: (tenantId) => {
        const tenant = get().tenants.find((t) => t.id === tenantId);
        if (!tenant) {
          return { completed: 0, total: 6, phases: DEFAULT_ONBOARDING_PHASES, status: 'not_started' as OnboardingStatus };
        }
        const phases = tenant.onboardingPhases;
        const completed = Object.values(phases).filter(Boolean).length;
        return { completed, total: 6, phases, status: tenant.onboardingStatus };
      },

      // ==================== License 方法 ====================
      
      createLicense: (tenantId, type) => {
        const license: MockLicense = {
          id: generateId('license'),
          tenantId,
          type,
          server: `${type.toLowerCase()}.demo.tradepass.io`,
          status: 'active',
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        };
        
        set((state) => ({ licenses: [...state.licenses, license] }));
        return license;
      },

      getTenantLicenses: (tenantId) => {
        return get().licenses.filter((l) => l.tenantId === tenantId);
      },

      deleteLicense: (id) => {
        const license = get().licenses.find((l) => l.id === id);
        if (!license) return false;
        
        set((state) => ({
          licenses: state.licenses.filter((l) => l.id !== id),
        }));
        
        return true;
      },

      // ==================== CRM 方法 ====================
      
      createCrmUser: (tenantId, data) => {
        const user: MockCrmUser = {
          id: generateId('crm_user'),
          tenantId,
          email: data.email,
          name: data.name,
          phone: data.phone,
          kycStatus: 'not_started',
          balance: 0,
          currency: 'USD',
          createdAt: new Date().toISOString(),
        };
        
        set((state) => ({ crmUsers: [...state.crmUsers, user] }));
        return user;
      },

      getCrmUsers: (tenantId) => {
        return get().crmUsers.filter((u) => u.tenantId === tenantId);
      },

      updateCrmUser: (id, data) => {
        let updated: MockCrmUser | null = null;
        set((state) => ({
          crmUsers: state.crmUsers.map((u) => {
            if (u.id === id) {
              updated = { ...u, ...data };
              return updated;
            }
            return u;
          }),
        }));
        return updated;
      },

      // ==================== KYC 方法 ====================
      
      createKycRecord: (tenantId, userId, level) => {
        const record: MockKycRecord = {
          id: generateId('kyc'),
          userId,
          tenantId,
          level,
          status: 'not_started',
          documents: [],
        };
        
        set((state) => ({ kycRecords: [...state.kycRecords, record] }));
        return record;
      },

      getKycRecords: (tenantId) => {
        return get().kycRecords.filter((k) => k.tenantId === tenantId);
      },

      updateKycStatus: (id, status, reviewerId, rejectionReason) => {
        let updated: MockKycRecord | null = null;
        set((state) => ({
          kycRecords: state.kycRecords.map((k) => {
            if (k.id === id) {
              updated = {
                ...k,
                status,
                reviewedAt: reviewerId ? new Date().toISOString() : k.reviewedAt,
                reviewedBy: reviewerId || k.reviewedBy,
                rejectionReason: rejectionReason || k.rejectionReason,
              };
              return updated;
            }
            return k;
          }),
        }));
        return updated;
      },

      // ==================== 资金方法 ====================
      
      createDeposit: (tenantId, userId, amount, currency, method) => {
        const deposit: MockDeposit = {
          id: generateId('deposit'),
          userId,
          tenantId,
          amount,
          currency,
          method,
          status: 'pending',
          createdAt: new Date().toISOString(),
        };
        
        set((state) => ({ deposits: [...state.deposits, deposit] }));
        return deposit;
      },

      createWithdrawal: (tenantId, userId, amount, currency, method) => {
        const withdrawal: MockWithdrawal = {
          id: generateId('withdrawal'),
          userId,
          tenantId,
          amount,
          currency,
          method,
          status: 'pending',
          createdAt: new Date().toISOString(),
        };
        
        set((state) => ({ withdrawals: [...state.withdrawals, withdrawal] }));
        return withdrawal;
      },

      getDeposits: (tenantId) => {
        return get().deposits.filter((d) => d.tenantId === tenantId);
      },

      getWithdrawals: (tenantId) => {
        return get().withdrawals.filter((w) => w.tenantId === tenantId);
      },

      // ==================== Demo 数据初始化 ====================
      
      initDemoData: () => {
        const currentUser = get().currentUser;
        if (!currentUser || get().tenants.length > 0) return;

        // 创建 2 个 Demo 租户
        const demoTenants = [0, 1].map((i) => createDemoTenant(currentUser.id, i));
        
        // 为每个租户创建 License
        const demoLicenses: MockLicense[] = [];
        demoTenants.forEach((t, i) => {
          demoLicenses.push(createDemoLicense(t.id, 'MT5'));
          if (i % 2 === 0) {
            demoLicenses.push(createDemoLicense(t.id, 'MT4'));
          }
        });

        // 创建 Demo CRM 用户
        const demoCrmUsers: MockCrmUser[] = [];
        const demoKycRecords: MockKycRecord[] = [];
        
        demoTenants.forEach((t) => {
          for (let i = 0; i < 5; i++) {
            const user = createDemoCrmUser(t.id, i);
            demoCrmUsers.push(user);
            
            const kyc = createDemoKycRecord(t.id, user.id, i);
            if (kyc) {
              demoKycRecords.push(kyc);
            }
          }
        });

        set({
          tenants: demoTenants,
          licenses: demoLicenses,
          crmUsers: demoCrmUsers,
          kycRecords: demoKycRecords,
        });
      },

      resetAllData: () => {
        set({
          currentUser: null,
          currentTenantId: null,
          users: [],
          tenants: [],
          licenses: [],
          crmUsers: [],
          kycRecords: [],
          deposits: [],
          withdrawals: [],
        });
      },
    }),
    {
      name: 'tradepass-mock-storage',
      partialize: (state) => ({
        users: state.users,
        tenants: state.tenants,
        licenses: state.licenses,
        crmUsers: state.crmUsers,
        kycRecords: state.kycRecords,
        deposits: state.deposits,
        withdrawals: state.withdrawals,
      }),
    }
  )
);

// Hook: 获取当前租户
export const useCurrentTenant = () => {
  const { currentTenantId, getTenantById } = useMockStore();
  return currentTenantId ? getTenantById(currentTenantId) : null;
};
