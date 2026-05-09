'use client';

import { useEffect } from 'react';
import { enableMockMode } from '@/lib/mock';

/**
 * MockProvider - 纯前端 Demo 模式（默认启用）
 */
export function MockProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // 默认启用 Mock 模式
    enableMockMode();

    // 设置 mock_mode cookie（用于 API 路由识别）
    document.cookie = 'mock_mode=true; path=/; max-age=86400';
  }, []);

  return <>{children}</>;
}
