'use client';

import { useEffect, useState } from 'react';
import { enableMockMode } from '@/lib/mock';

/**
 * MockProvider - 纯前端 Demo 模式（默认启用）
 *
 * 功能：
 * 1. 自动启用 API Mock
 * 2. 提供全局调试工具
 * 3. 显示 Mock 模式指示器
 */
export function MockProvider({ children }: { children: React.ReactNode }) {
  const [isMockEnabled, setIsMockEnabled] = useState(false);

  useEffect(() => {
    // 默认启用 Mock 模式
    enableMockMode();
    setIsMockEnabled(true);

    // 设置 mock_mode cookie（用于 API 路由识别）
    document.cookie = 'mock_mode=true; path=/; max-age=86400';
  }, []);

  return (
    <>
      {children}
      {isMockEnabled && <MockIndicator />}
    </>
  );
}

/**
 * Mock 模式指示器
 */
function MockIndicator() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col items-end gap-2">
      {isExpanded && (
        <div className="bg-slate-900 text-white p-4 rounded-lg shadow-xl max-w-xs text-sm">
          <h4 className="font-semibold mb-2">🎭 Mock Demo 模式</h4>
          <p className="text-slate-300 mb-3">
            所有数据存储在浏览器 LocalStorage 中，刷新不丢失。
          </p>

          <div className="space-y-2">
            <div className="flex gap-2">
              <button
                onClick={() => (window as any).MockTools?.switchUser('admin@tradepass.io')}
                className="flex-1 bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded text-xs"
              >
                平台管理员 → /backoffice
              </button>
              <button
                onClick={() => (window as any).MockTools?.switchUser('owner@demobroker.com')}
                className="flex-1 bg-green-600 hover:bg-green-500 px-3 py-1.5 rounded text-xs"
              >
                租户所有者 → /console
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => (window as any).MockTools?.switchUser('admin@demobroker.com')}
                className="flex-1 bg-purple-600 hover:bg-purple-500 px-3 py-1.5 rounded text-xs"
              >
                CRM 管理员 → /crm
              </button>
              <button
                onClick={() => (window as any).MockTools?.switchUser('user@example.com')}
                className="flex-1 bg-orange-600 hover:bg-orange-500 px-3 py-1.5 rounded text-xs"
              >
                普通用户 → /portal
              </button>
            </div>
            <hr className="border-slate-700 my-2" />
            <div className="flex gap-2">
              <a href="/" className="flex-1 bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded text-xs text-center">
                回到官网 /
              </a>
              <button
                onClick={() => (window as any).MockTools?.reset()}
                className="flex-1 bg-red-600 hover:bg-red-500 px-3 py-1.5 rounded text-xs"
              >
                🔄 重置所有数据
              </button>
            </div>
          </div>

          <p className="text-slate-500 text-xs mt-3">
            控制台输入 MockTools 查看更多命令
          </p>
        </div>
      )}

      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center gap-2 font-medium"
      >
        <span>🎭</span>
        <span>Mock 模式</span>
        <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded">
          {isExpanded ? '收起' : '展开'}
        </span>
      </button>
    </div>
  );
}
