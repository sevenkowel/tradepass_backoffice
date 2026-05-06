/**
 * Trade Module - Mock AI Signals Data
 * AI信号Mock数据
 */

import type { AISignal, MarketNews, PriceAlert } from '../types';

// ==================== AI信号数据 ====================

export const mockAISignals: AISignal[] = [
  {
    id: 'signal-001',
    productId: 'comm-001',
    symbol: 'XAUUSD',
    direction: 'buy',
    strength: 'strong',
    confidence: 88,
    entryPrice: 2032.50,
    takeProfit: 2055.00,
    stopLoss: 2018.00,
    signalType: 'swing',
    timeframe: '4H',
    riskLevel: 'medium',
    reason: '黄金突破关键阻力位2030，MACD金叉确认，避险情绪升温。',
    factors: [
      '美元指数持续走弱',
      '地缘政治风险上升',
      '技术面突破确认',
      'ETF持仓连续增加',
    ],
    createdAt: Date.now() - 3600000,
    expiresAt: Date.now() + 86400000,
    accuracy: 76,
  },
  {
    id: 'signal-002',
    productId: 'forex-003',
    symbol: 'USDJPY',
    direction: 'buy',
    strength: 'strong',
    confidence: 85,
    entryPrice: 149.85,
    takeProfit: 151.20,
    stopLoss: 148.90,
    signalType: 'intraday',
    timeframe: '1H',
    riskLevel: 'low',
    reason: '美日维持强势，突破149.80阻力位，利差扩大支撑日元走弱。',
    factors: [
      '美日利差维持高位',
      '日本央行维持宽松',
      '技术面多头排列',
      '动能指标强劲',
    ],
    createdAt: Date.now() - 7200000,
    expiresAt: Date.now() + 43200000,
    accuracy: 82,
  },
  {
    id: 'signal-003',
    productId: 'forex-001',
    symbol: 'EURUSD',
    direction: 'buy',
    strength: 'moderate',
    confidence: 72,
    entryPrice: 1.0845,
    takeProfit: 1.0920,
    stopLoss: 1.0800,
    signalType: 'swing',
    timeframe: '4H',
    riskLevel: 'medium',
    reason: '欧元突破短期下行趋势线，欧美利差收窄提供支撑。',
    factors: [
      '欧央行相对鹰派',
      '欧美利差收窄',
      '技术面企稳回升',
    ],
    createdAt: Date.now() - 10800000,
    expiresAt: Date.now() + 86400000,
    accuracy: 68,
  },
  {
    id: 'signal-004',
    productId: 'comm-003',
    symbol: 'USOIL',
    direction: 'sell',
    strength: 'moderate',
    confidence: 64,
    entryPrice: 78.48,
    takeProfit: 76.50,
    stopLoss: 79.50,
    signalType: 'swing',
    timeframe: '1D',
    riskLevel: 'medium',
    reason: '原油需求担忧加剧，库存增加，技术面向下突破关键支撑。',
    factors: [
      '美国库存意外增加',
      '需求增长放缓',
      '技术面破位',
      'OPEC+减产效果减弱',
    ],
    createdAt: Date.now() - 5400000,
    expiresAt: Date.now() + 172800000,
    accuracy: 65,
  },
  {
    id: 'signal-005',
    productId: 'indices-002',
    symbol: 'SPX500',
    direction: 'buy',
    strength: 'moderate',
    confidence: 74,
    entryPrice: 5120.00,
    takeProfit: 5200.00,
    stopLoss: 5080.00,
    signalType: 'swing',
    timeframe: '1D',
    riskLevel: 'medium',
    reason: '美股延续上涨趋势，科技股财报超预期，美联储鸽派表态。',
    factors: [
      '科技股财报利好',
      '美联储降息预期',
      '技术面多头排列',
      '资金持续流入',
    ],
    createdAt: Date.now() - 1800000,
    expiresAt: Date.now() + 86400000,
    accuracy: 71,
  },
  {
    id: 'signal-006',
    productId: 'comm-002',
    symbol: 'XAGUSD',
    direction: 'buy',
    strength: 'weak',
    confidence: 58,
    entryPrice: 22.88,
    takeProfit: 23.50,
    stopLoss: 22.50,
    signalType: 'intraday',
    timeframe: '1H',
    riskLevel: 'high',
    reason: '白银跟随黄金上涨，金银比处于高位，有修复需求。',
    factors: [
      '黄金上涨带动',
      '金银比偏高',
      '工业需求支撑',
    ],
    createdAt: Date.now() - 9000000,
    expiresAt: Date.now() + 43200000,
    accuracy: 55,
  },
];

// ==================== 市场资讯数据 ====================

export const mockMarketNews: MarketNews[] = [
  {
    id: 'news-001',
    title: '黄金价格突破2030美元关口，避险情绪持续升温',
    source: 'Reuters',
    publishedAt: Date.now() - 3600000,
    summary: '受中东地缘政治紧张局势影响，黄金作为避险资产受到追捧，价格突破2030美元关键阻力位。',
    sentiment: 'bullish',
    relatedSymbols: ['XAUUSD', 'XAGUSD'],
  },
  {
    id: 'news-002',
    title: '美联储会议纪要：降息时点仍存分歧',
    source: 'Bloomberg',
    publishedAt: Date.now() - 7200000,
    summary: '最新公布的会议纪要显示，美联储官员对降息时机看法不一，市场押注6月首次降息。',
    sentiment: 'bullish',
    relatedSymbols: ['EURUSD', 'XAUUSD', 'SPX500'],
  },
  {
    id: 'news-003',
    title: '美国原油库存意外增加520万桶，油价承压',
    source: 'CNBC',
    publishedAt: Date.now() - 5400000,
    summary: 'EIA数据显示美国原油库存大幅增加，超出市场预期，原油价格应声下跌。',
    sentiment: 'bearish',
    relatedSymbols: ['USOIL', 'UKOIL'],
  },
  {
    id: 'news-004',
    title: '日本央行行长：将继续维持宽松货币政策',
    source: 'Nikkei',
    publishedAt: Date.now() - 10800000,
    summary: '植田和男表示，在通胀稳定在2%目标之前，日本央行将继续保持宽松立场。',
    sentiment: 'bearish',
    relatedSymbols: ['USDJPY'],
  },
  {
    id: 'news-005',
    title: '标普500再创历史新高，科技股领涨',
    source: 'WSJ',
    publishedAt: Date.now() - 1800000,
    summary: '受AI热潮和企业盈利强劲推动，美股三大指数集体收涨，标普500首次突破5100点。',
    sentiment: 'bullish',
    relatedSymbols: ['SPX500', 'NAS100'],
  },
  {
    id: 'news-006',
    title: '欧元区通胀数据略高于预期，欧元短线走强',
    source: 'Financial Times',
    publishedAt: Date.now() - 9000000,
    summary: '欧元区2月CPI同比增长2.6%，略高于2.5%预期，市场下调欧央行降息预期。',
    sentiment: 'bullish',
    relatedSymbols: ['EURUSD'],
  },
  {
    id: 'news-007',
    title: 'OPEC+考虑延长减产协议至二季度末',
    source: 'Reuters',
    publishedAt: Date.now() - 14400000,
    summary: '消息人士称OPEC+正在讨论将现有减产措施延长至6月之后，以支撑油价。',
    sentiment: 'bullish',
    relatedSymbols: ['USOIL', 'UKOIL'],
  },
  {
    id: 'news-008',
    title: '非农数据大超预期，美元指数反弹',
    source: 'Bloomberg',
    publishedAt: Date.now() - 21600000,
    summary: '美国2月非农就业新增27.5万人，远超预期，失业率意外升至3.9%。',
    sentiment: 'bearish',
    relatedSymbols: ['EURUSD', 'GBPUSD', 'XAUUSD'],
  },
];

// ==================== 价格预警数据 ====================

export const mockPriceAlerts: PriceAlert[] = [
  {
    id: 'alert-001',
    userId: 'user-001',
    productId: 'comm-001',
    symbol: 'XAUUSD',
    condition: 'above',
    targetValue: 2050.00,
    channels: ['app', 'email'],
    isActive: true,
    createdAt: Date.now() - 86400000,
  },
  {
    id: 'alert-002',
    userId: 'user-001',
    productId: 'forex-001',
    symbol: 'EURUSD',
    condition: 'below',
    targetValue: 1.0800,
    channels: ['app'],
    isActive: true,
    createdAt: Date.now() - 172800000,
  },
  {
    id: 'alert-003',
    userId: 'user-001',
    productId: 'comm-003',
    symbol: 'USOIL',
    condition: 'change_down',
    targetPercent: 2.0,
    channels: ['app', 'email', 'sms'],
    isActive: true,
    createdAt: Date.now() - 259200000,
  },
];

// ==================== 辅助函数 ====================

export function getSignalsBySymbol(symbol: string): AISignal[] {
  return mockAISignals.filter(s => s.symbol === symbol);
}

export function getSignalsByDirection(direction: 'buy' | 'sell' | 'neutral'): AISignal[] {
  return mockAISignals.filter(s => s.direction === direction);
}

export function getNewsBySymbol(symbol: string): MarketNews[] {
  return mockMarketNews.filter(n => n.relatedSymbols.includes(symbol));
}

export function getRecentNews(limit: number = 5): MarketNews[] {
  return mockMarketNews
    .sort((a, b) => b.publishedAt - a.publishedAt)
    .slice(0, limit);
}

export function getActiveAlerts(): PriceAlert[] {
  return mockPriceAlerts.filter(a => a.isActive);
}
