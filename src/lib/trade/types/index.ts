/**
 * Trade Module - Type Definitions
 * 交易模块类型定义
 */

// ==================== 基础类型 ====================

export type AssetClass = 'forex' | 'indices' | 'commodities';
export type CommodityType = 'gold' | 'silver' | 'oil';

export type TradeDirection = 'buy' | 'sell' | 'neutral';
export type SignalStrength = 'strong' | 'moderate' | 'weak';
export type TrendDirection = 'bullish' | 'bearish' | 'neutral';

// ==================== 产品类型 ====================

export interface TradingProduct {
  id: string;
  symbol: string;           // XAUUSD, EURUSD
  name: string;             // Gold, Euro / US Dollar
  shortName: string;        // 黄金, 欧元/美元
  assetClass: AssetClass;
  commodityType?: CommodityType;
  icon?: string;
  isFavorite: boolean;
  // 价格数据
  bid: number;
  ask: number;
  spread: number;
  change: number;           // 24h涨跌额
  changePercent: number;    // 24h涨跌幅%
  high24h: number;
  low24h: number;
  // 附加数据
  sentiment: SentimentData;
  aiSignal: AISignalSummary;
  // 元数据
  volume?: number;
  openPrice?: number;
  closePrice?: number;
  digits?: number;          // 小数位数
  lastUpdated: number;      // timestamp
  // 交易规格
  contractSize?: number;    // 合约大小
  tickSize?: number;        // 最小价格变动
  minVolume?: number;       // 最小交易量
  maxVolume?: number;       // 最大交易量
  // 隔夜利息
  swapLong?: number;        // 多头隔夜利息
  swapShort?: number;       // 空头隔夜利息
}

// ==================== 情绪指数 ====================

export interface SentimentData {
  longPercent: number;      // 0-100
  shortPercent: number;     // 0-100
  longCount: number;
  shortCount: number;
  totalPositions: number;
  timestamp: number;
}

// ==================== AI信号 ====================

export interface AISignalSummary {
  direction: TradeDirection;
  strength: SignalStrength;
  confidence: number;       // 0-100
  updatedAt: number;
}

export interface AISignal {
  id: string;
  productId: string;
  symbol: string;
  direction: TradeDirection;
  strength: SignalStrength;
  confidence: number;       // 0-100
  // 入场建议
  entryPrice: number;
  takeProfit: number;
  stopLoss: number;
  // 信号信息
  signalType: 'intraday' | 'swing' | 'scalping';
  timeframe: string;        // 1H, 4H, 1D
  riskLevel: 'low' | 'medium' | 'high';
  // 分析理由
  reason: string;
  factors: string[];
  // 元数据
  createdAt: number;
  expiresAt: number;
  accuracy?: number;        // 历史准确率
}

// ==================== 技术面分析 ====================

export interface TechnicalIndicator {
  name: string;             // RSI, MACD, MA
  value: number | string;
  signal: TrendDirection;
  description: string;
}

export interface TechnicalAnalysis {
  overallScore: number;     // 0-100
  trend: TrendDirection;
  indicators: TechnicalIndicator[];
  summary: string;
  updatedAt: number;
}

// ==================== 基本面分析 ====================

export interface FundamentalFactor {
  name: string;
  value: string;
  impact: 'positive' | 'negative' | 'neutral';
  description: string;
}

export interface FundamentalAnalysis {
  factors: FundamentalFactor[];
  summary: string;
  lastEvent?: string;
  nextEvent?: string;
  updatedAt: number;
}

// ==================== 资讯 ====================

export interface MarketNews {
  id: string;
  title: string;
  source: string;
  url?: string;
  publishedAt: number;
  summary?: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  relatedSymbols: string[];
  imageUrl?: string;
}

// ==================== 价格预警 ====================

export type AlertCondition = 'above' | 'below' | 'change_up' | 'change_down';
export type AlertChannel = 'app' | 'email' | 'sms';

export interface PriceAlert {
  id: string;
  userId: string;
  productId: string;
  symbol: string;
  condition: AlertCondition;
  targetValue?: number;
  targetPercent?: number;
  channels: AlertChannel[];
  isActive: boolean;
  triggeredAt?: number;
  createdAt: number;
}

// ==================== 图表 ====================

export type ChartTimeframe = '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d' | '1w' | '1M';

export interface ChartSettings {
  timeframe: ChartTimeframe;
  chartType: 'candles' | 'line' | 'area' | 'bars';
  indicators: string[];
}

// ==================== 交易面板 ====================

export type OrderType = 'market' | 'limit' | 'stop';

export interface TradeOrder {
  id?: string;
  productId: string;
  symbol: string;
  direction: TradeDirection;
  orderType: OrderType;
  volume: number;           // 手数
  entryPrice?: number;      // 限价单用
  stopLoss?: number;
  takeProfit?: number;
  comment?: string;
}

// ==================== 基本面驱动因素 ====================

export type DriverImpactLevel = 'high' | 'medium' | 'low';
export type DriverStatus = 'bullish' | 'bearish' | 'neutral';

export interface FundamentalDriver {
  id: string;
  title: string;
  icon: 'TrendingDown' | 'DollarSign' | 'Landmark' | 'Flame' | 'Globe' | 'ArrowLeftRight';
  impact: DriverImpactLevel;
  description: string;
  currentStatus: DriverStatus;
  detail: string;
  updatedAt: string;
}

// ==================== 季节性数据 ====================

export interface MonthlyStat {
  month: number;
  monthName: string;
  avgReturn: number;
  winRate: number;
  avgVolatility: number;
  sampleYears: number;
}

export interface SeasonalData {
  monthlyStats: MonthlyStat[];
  bestMonth: { month: number; avgReturn: number };
  worstMonth: { month: number; avgReturn: number };
  summary: string;
}

// ==================== 产品详情 ====================

export interface ProductDetail extends TradingProduct {
  description: string;
  tradingHours: string;
  contractSize: number;
  minVolume: number;
  maxVolume: number;
  marginRequirement: number;
  swapLong: number;
  swapShort: number;
  digits: number;
  // 扩展统计数据
  high52w?: number;
  low52w?: number;
  volatility?: number;
  turnover?: number;
  // 分析数据
  technicalAnalysis: TechnicalAnalysis;
  fundamentalAnalysis: FundamentalAnalysis;
  relatedNews: MarketNews[];
  aiSignals: AISignal[];
  // 新增：基本面驱动因素
  fundamentalDrivers?: FundamentalDriver[];
  // 新增：季节性数据
  seasonalData?: SeasonalData;
  // 历史数据
  priceHistory?: PricePoint[];
}

export interface PricePoint {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

// ==================== 筛选与排序 ====================

export interface MarketFilter {
  assetClass?: AssetClass;
  commodityType?: CommodityType;
  favoritesOnly?: boolean;
  aiSignal?: TradeDirection;
  searchQuery?: string;
}

export type SortField = 'symbol' | 'price' | 'change' | 'spread' | 'sentiment' | 'aiSignal';
export type SortOrder = 'asc' | 'desc';

export interface MarketSort {
  field: SortField;
  order: SortOrder;
}

// ==================== WebSocket ====================

export interface PriceTick {
  symbol: string;
  bid: number;
  ask: number;
  timestamp: number;
  volume?: number;
}

// ==================== API响应 ====================

export interface MarketDataResponse {
  products: TradingProduct[];
  lastUpdate: number;
}

export interface ProductDetailResponse {
  product: ProductDetail;
  signals: AISignal[];
  news: MarketNews[];
}
