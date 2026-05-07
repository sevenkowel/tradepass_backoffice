/**
 * useDashboardData — Portal Dashboard 真实数据 Hook
 * 从 /api/portal/dashboard 获取用户概览数据
 */

import { useState, useEffect } from "react";

interface Wallet {
  id: string;
  currency: string;
  balance: number;
  available: number;
  frozen: number;
}

interface Account {
  id: string;
  accountId: string;
  type: "demo" | "real";
  status: string;
  currency: string;
  balance: number;
  equity: number;
  leverage: number;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
}

interface Notification {
  id: string;
  type: "warning" | "info" | "action";
  title: string;
  message: string;
  action: { label: string; href: string };
}

interface DashboardData {
  user: {
    name: string;
    email: string;
    kycStatus: string;
    kycLevel: string | null;
  };
  wallets: Wallet[];
  accounts: Account[];
  totalBalance: number;
  totalEquity: number;
  totalAssets: number;
  recentTransactions: Transaction[];
  notifications: Notification[];
}

interface UseDashboardDataReturn {
  data: DashboardData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useDashboardData(): UseDashboardDataReturn {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch("/api/portal/dashboard");
      if (response.status === 401) {
        // 未登录状态，静默处理
        setData(null);
        setIsLoading(false);
        return;
      }
      if (!response.ok) {
        throw new Error(`Failed to fetch dashboard data: ${response.status}`);
      }
      const result = await response.json();
      if (result.success) {
        setData(result);
      } else {
        throw new Error(result.error || "Unknown error");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard data");
      console.error("Dashboard data error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { data, isLoading, error, refetch: fetchData };
}
