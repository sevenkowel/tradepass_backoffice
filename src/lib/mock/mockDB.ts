/**
 * Mock Database - LocalStorage 持久化
 * 纯前端 Demo 模式的数据层
 */

import type { MockDatabase, MockEntity } from './types';

const STORAGE_KEY = 'tradepass_mock_db_v1';

// 初始示例数据
const initialData: MockDatabase = {
  tenants: [
    {
      id: 'demo-broker',
      name: 'Demo Broker',
      subdomain: 'demo',
      logo: '/logos/demo-broker.png',
      primaryColor: '#2563eb',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'active',
      ownerId: 'tenant-owner-1',
      region: 'VN',
      plan: 'enterprise',
      subscription: {
        plan: 'professional',
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      },
      settings: {
        kycLevel: 'standard',
        features: ['portal', 'crm', 'mt5'],
        branding: {
          logo: '/logos/demo-broker.png',
          primaryColor: '#2563eb',
        },
      },
    },
    {
      id: 'acme-fx',
      name: 'Acme FX',
      subdomain: 'acme',
      primaryColor: '#dc2626',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'trial',
      ownerId: 'tenant-owner-2',
      region: 'TH',
      plan: 'starter',
      settings: {
        kycLevel: 'basic',
        features: ['portal'],
        branding: {
          primaryColor: '#dc2626',
        },
      },
    },
  ] as any,
  users: [
    {
      id: 'platform-admin-1',
      email: 'admin@tradepass.io',
      name: 'Platform Admin',
      role: 'platform_admin',
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      kycStatus: 'approved',
    },
    {
      id: 'tenant-owner-1',
      email: 'owner@demobroker.com',
      name: 'Demo Owner',
      role: 'tenant_owner',
      tenantId: 'demo-broker',
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      kycStatus: 'approved',
      kycLevel: 'enhanced',
    },
    {
      id: 'tenant-admin-1',
      email: 'admin@demobroker.com',
      name: 'Demo Admin',
      role: 'tenant_admin',
      tenantId: 'demo-broker',
      createdAt: new Date().toISOString(),
      kycStatus: 'approved',
      kycLevel: 'standard',
    },
    {
      id: 'user-1',
      email: 'user@example.com',
      name: 'Test User',
      role: 'user',
      tenantId: 'demo-broker',
      createdAt: new Date().toISOString(),
      kycStatus: 'pending',
      kycLevel: 'basic',
    },
  ],
  kycRecords: [
    {
      id: 'kyc-1',
      userId: 'user-1',
      tenantId: 'demo-broker',
      status: 'under_review',
      level: 'standard',
      documents: [
        { type: 'id_card_front', url: '/mock/docs/id_front.jpg', uploadedAt: new Date().toISOString() },
        { type: 'id_card_back', url: '/mock/docs/id_back.jpg', uploadedAt: new Date().toISOString() },
      ],
      ocrData: {
        fullName: 'John Doe',
        idNumber: 'ID123456789',
        dateOfBirth: '1990-01-01',
      },
      region: 'VN',
      submittedAt: new Date().toISOString(),
    },
  ],
  deposits: [
    {
      id: 'dep-1',
      userId: 'user-1',
      tenantId: 'demo-broker',
      amount: 1000,
      currency: 'USD',
      method: 'bank_transfer',
      status: 'completed',
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      completedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'dep-2',
      userId: 'user-1',
      tenantId: 'demo-broker',
      amount: 500,
      currency: 'USD',
      method: 'credit_card',
      status: 'pending',
      createdAt: new Date().toISOString(),
    },
  ],
  withdrawals: [
    {
      id: 'wd-1',
      userId: 'user-1',
      tenantId: 'demo-broker',
      amount: 200,
      currency: 'USD',
      method: 'bank_transfer',
      status: 'completed',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
  licenses: [] as any,
  tradingAccounts: [
    {
      id: 'acc-1',
      userId: 'user-1',
      tenantId: 'demo-broker',
      accountNumber: 'DEMO-12345',
      balance: 8500,
      currency: 'USD',
      leverage: 100,
      status: 'active',
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
  notifications: [
    {
      id: 'notif-1',
      userId: 'user-1',
      type: 'kyc',
      title: 'KYC 审核中',
      content: '您的身份认证资料已提交，正在审核中',
      isRead: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'notif-2',
      userId: 'user-1',
      type: 'deposit',
      title: '存款成功',
      content: '您的存款 $1,000 已成功到账',
      isRead: true,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
  sessions: {},
};

class MockDatabaseManager {
  private data: MockDatabase;

  constructor() {
    this.data = this.load();
  }

  private load(): MockDatabase {
    if (typeof window === 'undefined') {
      return initialData;
    }
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...initialData, ...JSON.parse(stored) };
    }
    // 首次初始化
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
    return initialData;
  }

  private save(): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
  }

  // 获取完整数据库
  getDB(): MockDatabase {
    return { ...this.data };
  }

  // 获取集合
  getCollection<T extends MockEntity>(name: keyof MockDatabase): T[] {
    const collection = this.data[name];
    return Array.isArray(collection) ? [...collection] as T[] : [];
  }

  // 按 ID 查找
  findById<T extends MockEntity>(collectionName: keyof MockDatabase, id: string): T | undefined {
    const collection = this.getCollection<T>(collectionName);
    return collection.find((item: any) => item.id === id);
  }

  // 条件查询
  find<T extends MockEntity>(
    collectionName: keyof MockDatabase,
    predicate: (item: T) => boolean
  ): T[] {
    const collection = this.getCollection<T>(collectionName);
    return collection.filter(predicate);
  }

  // 插入
  insert<T extends MockEntity>(collectionName: keyof MockDatabase, item: T): T {
    const collection = this.getCollection<T>(collectionName);
    collection.push(item);
    (this.data[collectionName] as any) = collection;
    this.save();
    return item;
  }

  // 更新
  update<T extends MockEntity>(
    collectionName: keyof MockDatabase,
    id: string,
    updates: Partial<T>
  ): T | undefined {
    const collection = this.getCollection<T>(collectionName);
    const index = collection.findIndex((item: any) => item.id === id);
    if (index === -1) return undefined;
    
    collection[index] = { ...collection[index], ...updates };
    (this.data[collectionName] as any) = collection;
    this.save();
    return collection[index];
  }

  // 删除
  delete(collectionName: keyof MockDatabase, id: string): boolean {
    const collection = this.getCollection(collectionName);
    const index = collection.findIndex((item: any) => item.id === id);
    if (index === -1) return false;
    
    collection.splice(index, 1);
    (this.data[collectionName] as any) = collection;
    this.save();
    return true;
  }

  // 获取当前用户
  getCurrentUser() {
    if (!this.data.currentUserId) return null;
    return this.findById('users', this.data.currentUserId);
  }

  // 设置当前用户
  setCurrentUser(userId: string | null) {
    this.data.currentUserId = userId || undefined;
    this.save();
  }

  // 创建会话
  createSession(token: string, userId: string, expiresInHours: number = 24): void {
    this.data.sessions[token] = {
      userId,
      expiresAt: new Date(Date.now() + expiresInHours * 60 * 60 * 1000).toISOString(),
    };
    this.save();
  }

  // 验证会话
  validateSession(token: string): { userId: string } | null {
    const session = this.data.sessions[token];
    if (!session) return null;
    if (new Date(session.expiresAt) < new Date()) {
      delete this.data.sessions[token];
      this.save();
      return null;
    }
    return { userId: session.userId };
  }

  // 销毁会话
  destroySession(token: string): void {
    delete this.data.sessions[token];
    this.save();
  }

  // 重置为初始数据
  reset(): void {
    this.data = { ...initialData };
    this.save();
  }

  // 清空所有数据
  clear(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
    this.data = { ...initialData };
  }
}

// 单例导出
export const mockDB = new MockDatabaseManager();

// 辅助函数：生成 ID
export function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// 辅助函数：延迟模拟网络
export function mockDelay(ms: number = 300): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
