"use client";

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AdminUser, Role } from '@/types/backoffice';

// Mock current admin user.
// `id` matches the `assigneeId` used in mock-cases.ts so that "My Tasks"
// and Workspace counts show the seeded data. Real auth replaces this.
const mockAdmin: AdminUser = {
  id: 'staff-001',
  username: 'Admin A',
  email: 'admin@tradepass.com',
  role: {
    id: 'super_admin',
    name: '超级管理员',
    description: '拥有全部权限',
    permissions: [{ module: '*', actions: ['*'] }],
    userCount: 0,
    isSystem: true,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
  lastLoginAt: new Date().toISOString(),
  status: 'active',
  createdAt: '2024-01-01',
};

interface AuthState {
  user: AdminUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: AdminUser) => void;
  hasPermission: (module: string, action?: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: mockAdmin, // Mock logged in for demo
      token: 'mock-token',
      isAuthenticated: true,
      isLoading: false,

      login: async (username: string, password: string) => {
        set({ isLoading: true });
        
        // Mock login - in real app, call API
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        set({
          user: mockAdmin,
          token: 'mock-token',
          isAuthenticated: true,
          isLoading: false,
        });
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },

      setUser: (user: AdminUser) => {
        set({ user, isAuthenticated: true });
      },

      hasPermission: (module: string, action?: string) => {
        const { user } = get();
        if (!user) return false;
        
        // Super admin has all permissions
        if (user.role.id === 'super_admin') return true;
        
        const permissions = user.role.permissions;
        
        // Check for wildcard module permission
        const hasWildcardModule = permissions.some(
          p => p.module === '*' && p.actions.includes('*')
        );
        if (hasWildcardModule) return true;
        
        // Check specific module permission
        const modulePermission = permissions.find(p => p.module === module);
        if (!modulePermission) return false;
        
        // If action specified, check it
        if (action) {
          const actions = modulePermission.actions as string[];
          return actions.includes('*') || actions.includes(action);
        }
        
        return true;
      },
    }),
    {
      name: 'backoffice-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
