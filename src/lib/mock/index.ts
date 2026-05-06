/**
 * Mock System - 纯前端 Demo 模式
 * 
 * 使用方法：
 * 1. 在应用入口（layout.tsx）导入并调用 enableMockMode()
 * 2. 所有 API 调用会自动使用 LocalStorage 数据
 * 3. 刷新页面数据不丢失
 */

export { mockDB, generateId, mockDelay } from './mockDB';
export { mockFetch, enableMockFetch, disableMockFetch } from './mockFetch';
export type * from './types';

import { enableMockFetch } from './mockFetch';

// 全局启用 Mock 模式
export function enableMockMode(): void {
  if (typeof window !== 'undefined') {
    enableMockFetch();
    
    // 添加调试工具到全局
    (window as any).MockTools = {
      reset: () => {
        const { mockDB } = require('./mockDB');
        mockDB.reset();
        window.location.reload();
      },
      clear: () => {
        const { mockDB } = require('./mockDB');
        mockDB.clear();
        window.location.reload();
      },
      db: () => {
        const { mockDB } = require('./mockDB');
        return mockDB.getDB();
      },
      switchUser: (email: string) => {
        const { mockDB } = require('./mockDB');
        const users = mockDB.getCollection('users');
        const user = users.find((u: any) => u.email === email);
        if (user) {
          const token = `demo-token-${Date.now()}`;
          mockDB.createSession(token, user.id, 24);
          // 纯路径路由模式：不需要 domain，只用 path 级 cookie
          document.cookie = `token=${token}; path=/`;
          document.cookie = `portal_tenant=${user.tenantId || ''}; path=/`;
          // 记录当前用户角色，方便前端做自动跳转
          document.cookie = `mock_user_role=${user.role}; path=/`;
          document.cookie = `onboarding_completed=${user.role === 'tenant_owner' ? 'false' : 'true'}; path=/`;
          // 根据角色跳转
          const rolePathMap: Record<string, string> = {
            'platform_admin': '/backoffice',
            'tenant_owner': '/console',
            'tenant_admin': '/crm',
            'user': '/portal',
          };
          const rolePath = rolePathMap[user.role as string] || '/';
          window.location.href = rolePath;
        } else {
          console.warn(`[MockTools] User not found: ${email}`);
          console.log('Available users:', users.map((u: any) => u.email).join(', '));
        }
      },
    };
    
    console.log('🎭 Mock Mode Enabled');
    console.log('💡 调试工具: window.MockTools');
    console.log('   - MockTools.reset() - 重置数据');
    console.log('   - MockTools.db() - 查看数据库');
    console.log('   - MockTools.switchUser("admin@tradepass.io") - 切换用户');
  }
}
