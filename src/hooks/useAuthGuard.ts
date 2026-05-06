/**
 * 认证守卫 Hook
 * 用于保护需要登录的路由
 */

'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useMockStore } from '@/lib/mock/store';

interface UseAuthGuardOptions {
  requireAuth?: boolean;
  redirectTo?: string;
}

export function useAuthGuard(options: UseAuthGuardOptions = {}) {
  const { requireAuth = true, redirectTo = '/auth/login' } = options;
  const { currentUser } = useMockStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (requireAuth && !currentUser) {
      // 需要登录但未登录，重定向到登录页
      const returnUrl = encodeURIComponent(pathname);
      router.push(`${redirectTo}?returnUrl=${returnUrl}`);
    } else if (!requireAuth && currentUser) {
      // 不需要登录但已登录（如登录页），重定向到控制台
      router.push('/console');
    }
  }, [currentUser, requireAuth, redirectTo, pathname, router]);

  return {
    user: currentUser,
    isAuthenticated: !!currentUser,
    isLoading: false,
  };
}

/**
 * 获取当前用户信息
 */
export function useCurrentUser() {
  const { currentUser } = useMockStore();
  return currentUser;
}

/**
 * 判断是否已登录
 */
export function useIsAuthenticated() {
  const { currentUser } = useMockStore();
  return !!currentUser;
}
