/**
 * Trade Module - Market Data Service
 * 市场数据服务层
 */

import type {
  TradingProduct,
  ProductDetail,
  AISignal,
  MarketNews,
  PriceAlert,
  MarketFilter,
  MarketSort,
  PriceTick,
  AssetClass,
} from '../types';
import {
  mockProducts,
  mockProductDetails,
  getProductBySymbol,
  getProductDetail,
  getProductsByClass,
  getFavoriteProducts,
} from '../mocks/products';
import {
  mockAISignals,
  mockMarketNews,
  mockPriceAlerts,
  getSignalsBySymbol,
  getNewsBySymbol,
  getRecentNews,
  getActiveAlerts,
} from '../mocks/signals';

// ==================== 行情服务 ====================

export class MarketService {
  // 获取所有产品
  static async getAllProducts(): Promise<TradingProduct[]> {
    return Promise.resolve([...mockProducts]);
  }

  // 按分类获取产品
  static async getProductsByClass(assetClass: AssetClass): Promise<TradingProduct[]> {
    return Promise.resolve(getProductsByClass(assetClass));
  }

  // 获取自选产品
  static async getFavoriteProducts(): Promise<TradingProduct[]> {
    return Promise.resolve(getFavoriteProducts());
  }

  // 获取单个产品
  static async getProduct(symbol: string): Promise<TradingProduct | undefined> {
    return Promise.resolve(getProductBySymbol(symbol));
  }

  // 获取产品详情
  static async getProductDetail(symbol: string): Promise<ProductDetail | undefined> {
    const detail = getProductDetail(symbol);
    if (detail) {
      // 填充相关数据
      return Promise.resolve({
        ...detail,
        relatedNews: getNewsBySymbol(symbol),
        aiSignals: getSignalsBySymbol(symbol),
      });
    }
    return Promise.resolve(undefined);
  }

  // 筛选和排序产品
  static async filterProducts(
    filter: MarketFilter,
    sort?: MarketSort
  ): Promise<TradingProduct[]> {
    let result = [...mockProducts];

    // 应用筛选
    if (filter.assetClass) {
      result = result.filter(p => p.assetClass === filter.assetClass);
    }

    if (filter.favoritesOnly) {
      result = result.filter(p => p.isFavorite);
    }

    if (filter.aiSignal) {
      result = result.filter(p => p.aiSignal.direction === filter.aiSignal);
    }

    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase();
      result = result.filter(
        p =>
          p.symbol.toLowerCase().includes(query) ||
          p.name.toLowerCase().includes(query) ||
          p.shortName.includes(query)
      );
    }

    // 应用排序
    if (sort) {
      result.sort((a, b) => {
        let valueA: number | string;
        let valueB: number | string;

        switch (sort.field) {
          case 'symbol':
            valueA = a.symbol;
            valueB = b.symbol;
            break;
          case 'price':
            valueA = a.bid;
            valueB = b.bid;
            break;
          case 'change':
            valueA = a.changePercent;
            valueB = b.changePercent;
            break;
          case 'spread':
            valueA = a.spread;
            valueB = b.spread;
            break;
          case 'sentiment':
            valueA = a.sentiment.longPercent;
            valueB = b.sentiment.longPercent;
            break;
          case 'aiSignal':
            valueA = a.aiSignal.confidence;
            valueB = b.aiSignal.confidence;
            break;
          default:
            valueA = a.symbol;
            valueB = b.symbol;
        }

        if (typeof valueA === 'string' && typeof valueB === 'string') {
          return sort.order === 'asc'
            ? valueA.localeCompare(valueB)
            : valueB.localeCompare(valueA);
        }

        return sort.order === 'asc'
          ? (valueA as number) - (valueB as number)
          : (valueB as number) - (valueA as number);
      });
    }

    return Promise.resolve(result);
  }

  // 切换收藏状态
  static async toggleFavorite(symbol: string): Promise<boolean> {
    const product = mockProducts.find(p => p.symbol === symbol);
    if (product) {
      product.isFavorite = !product.isFavorite;
      return Promise.resolve(product.isFavorite);
    }
    return Promise.resolve(false);
  }
}

// ==================== AI信号服务 ====================

export class SignalService {
  // 获取所有信号
  static async getAllSignals(): Promise<AISignal[]> {
    return Promise.resolve([...mockAISignals]);
  }

  // 获取产品相关信号
  static async getSignalsBySymbol(symbol: string): Promise<AISignal[]> {
    return Promise.resolve(getSignalsBySymbol(symbol));
  }

  // 获取买入信号
  static async getBuySignals(): Promise<AISignal[]> {
    return Promise.resolve(mockAISignals.filter(s => s.direction === 'buy'));
  }

  // 获取卖出信号
  static async getSellSignals(): Promise<AISignal[]> {
    return Promise.resolve(mockAISignals.filter(s => s.direction === 'sell'));
  }

  // 获取高置信度信号
  static async getHighConfidenceSignals(minConfidence: number = 75): Promise<AISignal[]> {
    return Promise.resolve(
      mockAISignals.filter(s => s.confidence >= minConfidence)
    );
  }

  // 获取信号统计
  static async getSignalStats(): Promise<{
    total: number;
    buy: number;
    sell: number;
    neutral: number;
    avgConfidence: number;
  }> {
    const total = mockAISignals.length;
    const buy = mockAISignals.filter(s => s.direction === 'buy').length;
    const sell = mockAISignals.filter(s => s.direction === 'sell').length;
    const neutral = mockAISignals.filter(s => s.direction === 'neutral').length;
    const avgConfidence =
      mockAISignals.reduce((sum, s) => sum + s.confidence, 0) / total;

    return Promise.resolve({
      total,
      buy,
      sell,
      neutral,
      avgConfidence: Math.round(avgConfidence),
    });
  }
}

// ==================== 资讯服务 ====================

export class NewsService {
  // 获取所有资讯
  static async getAllNews(): Promise<MarketNews[]> {
    return Promise.resolve([...mockMarketNews]);
  }

  // 获取最新资讯
  static async getRecentNews(limit: number = 5): Promise<MarketNews[]> {
    return Promise.resolve(getRecentNews(limit));
  }

  // 获取产品相关资讯
  static async getNewsBySymbol(symbol: string): Promise<MarketNews[]> {
    return Promise.resolve(getNewsBySymbol(symbol));
  }

  // 按情绪筛选资讯
  static async getNewsBySentiment(
    sentiment: 'bullish' | 'bearish' | 'neutral'
  ): Promise<MarketNews[]> {
    return Promise.resolve(
      mockMarketNews.filter(n => n.sentiment === sentiment)
    );
  }
}

// ==================== 预警服务 ====================

export class AlertService {
  // 获取所有预警
  static async getAllAlerts(): Promise<PriceAlert[]> {
    return Promise.resolve([...mockPriceAlerts]);
  }

  // 获取活跃预警
  static async getActiveAlerts(): Promise<PriceAlert[]> {
    return Promise.resolve(getActiveAlerts());
  }

  // 创建预警
  static async createAlert(
    alert: Omit<PriceAlert, 'id' | 'userId' | 'createdAt'>
  ): Promise<PriceAlert> {
    const newAlert: PriceAlert = {
      ...alert,
      id: `alert-${Date.now()}`,
      userId: 'user-001', // Mock user
      createdAt: Date.now(),
    };
    mockPriceAlerts.push(newAlert);
    return Promise.resolve(newAlert);
  }

  // 更新预警
  static async updateAlert(
    alertId: string,
    updates: Partial<PriceAlert>
  ): Promise<PriceAlert | undefined> {
    const alert = mockPriceAlerts.find(a => a.id === alertId);
    if (alert) {
      Object.assign(alert, updates);
      return Promise.resolve(alert);
    }
    return Promise.resolve(undefined);
  }

  // 删除预警
  static async deleteAlert(alertId: string): Promise<boolean> {
    const index = mockPriceAlerts.findIndex(a => a.id === alertId);
    if (index !== -1) {
      mockPriceAlerts.splice(index, 1);
      return Promise.resolve(true);
    }
    return Promise.resolve(false);
  }

  // 切换预警状态
  static async toggleAlert(alertId: string): Promise<boolean> {
    const alert = mockPriceAlerts.find(a => a.id === alertId);
    if (alert) {
      alert.isActive = !alert.isActive;
      return Promise.resolve(alert.isActive);
    }
    return Promise.resolve(false);
  }
}

// ==================== WebSocket模拟 ====================

export class PriceWebSocket {
  private static listeners: Set<(tick: PriceTick) => void> = new Set();
  private static interval: NodeJS.Timeout | null = null;

  // 连接WebSocket
  static connect(): void {
    if (this.interval) return;

    // 模拟价格推送
    this.interval = setInterval(() => {
      const randomProduct = mockProducts[Math.floor(Math.random() * mockProducts.length)];
      const volatility = 0.001; // 0.1% 波动
      const change = (Math.random() - 0.5) * 2 * volatility;

      const tick: PriceTick = {
        symbol: randomProduct.symbol,
        bid: randomProduct.bid * (1 + change),
        ask: randomProduct.ask * (1 + change),
        timestamp: Date.now(),
        volume: Math.floor(Math.random() * 1000),
      };

      this.listeners.forEach(listener => listener(tick));
    }, 2000); // 每2秒推送一次
  }

  // 断开连接
  static disconnect(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  // 订阅价格更新
  static subscribe(listener: (tick: PriceTick) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}
