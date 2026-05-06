/**
 * Trade Module - React Hooks
 * 市场数据Hooks
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  TradingProduct,
  ProductDetail,
  AISignal,
  MarketNews,
  PriceAlert,
  MarketFilter,
  MarketSort,
  PriceTick,
} from '../types';
import {
  MarketService,
  SignalService,
  NewsService,
  AlertService,
  PriceWebSocket,
} from '../services/marketService';

// ==================== 产品列表Hook ====================

interface UseProductsOptions {
  filter?: MarketFilter;
  sort?: MarketSort;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function useProducts(options: UseProductsOptions = {}) {
  const { filter, sort, autoRefresh = false, refreshInterval = 5000 } = options;

  const [products, setProducts] = useState<TradingProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // 使用 ref 避免依赖循环
  const optionsRef = useRef({ filter, sort, autoRefresh, refreshInterval });
  optionsRef.current = { filter, sort, autoRefresh, refreshInterval };

  // 初始加载
  useEffect(() => {
    let isMounted = true;
    
    const loadProducts = async () => {
      try {
        setIsLoading(true);
        const data = await MarketService.filterProducts(optionsRef.current.filter || {}, optionsRef.current.sort);
        if (isMounted) {
          setProducts(data);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to fetch products'));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadProducts();

    // 自动刷新 - 增加最小间隔限制避免过于频繁的刷新
    let interval: NodeJS.Timeout | null = null;
    if (autoRefresh && refreshInterval >= 1000) {
      interval = setInterval(loadProducts, Math.max(refreshInterval, 3000));
    }

    return () => {
      isMounted = false;
      if (interval) clearInterval(interval);
    };
  // 只在挂载时执行一次，filter/sort 变化通过 ref 获取
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 手动刷新函数
  const refetch = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await MarketService.filterProducts(optionsRef.current.filter || {}, optionsRef.current.sort);
      setProducts(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch products'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    products,
    isLoading,
    error,
    refetch,
  };
}

// ==================== 单个产品Hook ====================

interface UseProductOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function useProduct(symbol: string, options: UseProductOptions = {}) {
  const { autoRefresh = false, refreshInterval = 3000 } = options;

  const [product, setProduct] = useState<TradingProduct | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProduct = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await MarketService.getProduct(symbol);
      if (data) {
        setProduct(data);
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch product'));
    } finally {
      setIsLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
    fetchProduct();

    if (autoRefresh) {
      const interval = setInterval(fetchProduct, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchProduct, autoRefresh, refreshInterval]);

  // 订阅实时价格
  useEffect(() => {
    PriceWebSocket.connect();
    const unsubscribe = PriceWebSocket.subscribe((tick: PriceTick) => {
      if (tick.symbol === symbol && product) {
        setProduct(prev => {
          if (!prev) return null;
          return {
            ...prev,
            bid: tick.bid,
            ask: tick.ask,
            lastUpdated: tick.timestamp,
          };
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [symbol, product?.symbol]);

  const toggleFavorite = useCallback(async () => {
    const result = await MarketService.toggleFavorite(symbol);
    if (result !== undefined && product) {
      setProduct({ ...product, isFavorite: result });
    }
    return result;
  }, [symbol, product]);

  return {
    product,
    isLoading,
    error,
    refetch: fetchProduct,
    toggleFavorite,
  };
}

// ==================== 产品详情Hook ====================

export function useProductDetail(symbol: string) {
  const [detail, setDetail] = useState<ProductDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchDetail = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await MarketService.getProductDetail(symbol);
      if (data) {
        setDetail(data);
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch product detail'));
    } finally {
      setIsLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  return {
    detail,
    isLoading,
    error,
    refetch: fetchDetail,
  };
}

// ==================== AI信号Hook ====================

export function useAISignals(symbol?: string) {
  const [signals, setSignals] = useState<AISignal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchSignals = async () => {
      try {
        setIsLoading(true);
        const data = symbol
          ? await SignalService.getSignalsBySymbol(symbol)
          : await SignalService.getAllSignals();
        setSignals(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch signals'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchSignals();
  }, [symbol]);

  return {
    signals,
    isLoading,
    error,
  };
}

// ==================== 资讯Hook ====================

interface UseNewsOptions {
  symbol?: string;
  limit?: number;
}

export function useNews(options: UseNewsOptions = {}) {
  const { symbol, limit = 5 } = options;

  const [news, setNews] = useState<MarketNews[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setIsLoading(true);
        const data = symbol
          ? await NewsService.getNewsBySymbol(symbol)
          : await NewsService.getRecentNews(limit);
        setNews(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch news'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchNews();
  }, [symbol, limit]);

  return {
    news,
    isLoading,
    error,
  };
}

// ==================== 价格预警Hook ====================

export function usePriceAlerts() {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAlerts = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await AlertService.getAllAlerts();
      setAlerts(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch alerts'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const createAlert = useCallback(
    async (alert: Omit<PriceAlert, 'id' | 'userId' | 'createdAt'>) => {
      const newAlert = await AlertService.createAlert(alert);
      setAlerts(prev => [...prev, newAlert]);
      return newAlert;
    },
    []
  );

  const updateAlert = useCallback(
    async (alertId: string, updates: Partial<PriceAlert>) => {
      const updated = await AlertService.updateAlert(alertId, updates);
      if (updated) {
        setAlerts(prev =>
          prev.map(a => (a.id === alertId ? { ...a, ...updates } : a))
        );
      }
      return updated;
    },
    []
  );

  const deleteAlert = useCallback(
    async (alertId: string) => {
      const success = await AlertService.deleteAlert(alertId);
      if (success) {
        setAlerts(prev => prev.filter(a => a.id !== alertId));
      }
      return success;
    },
    []
  );

  const toggleAlert = useCallback(
    async (alertId: string) => {
      const isActive = await AlertService.toggleAlert(alertId);
      setAlerts(prev =>
        prev.map(a => (a.id === alertId ? { ...a, isActive } : a))
      );
      return isActive;
    },
    []
  );

  return {
    alerts,
    isLoading,
    error,
    refetch: fetchAlerts,
    createAlert,
    updateAlert,
    deleteAlert,
    toggleAlert,
  };
}

// ==================== 实时价格Hook ====================

export function usePriceStream(symbols: string[]) {
  const [prices, setPrices] = useState<Record<string, PriceTick>>({});
  const symbolsRef = useRef(symbols);

  useEffect(() => {
    symbolsRef.current = symbols;
  }, [symbols]);

  useEffect(() => {
    PriceWebSocket.connect();
    const unsubscribe = PriceWebSocket.subscribe((tick: PriceTick) => {
      if (symbolsRef.current.includes(tick.symbol)) {
        setPrices(prev => ({
          ...prev,
          [tick.symbol]: tick,
        }));
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return prices;
}
