/**
 * Client Detail Page Mock Data
 * 为 Client 360 各 Tab 提供完整的 mock 数据
 */

import type {
  TradingAccount,
  FundRecord,
  TradeRecord,
  TradingStats,
  KYCDocument,
  KYCRiskIndicator,
  ClientDevice,
  CaseItem,
  Ticket,
  ClientPermission,
  ClientAgreement,
  TimelineEvent,
  AuditLog,
  RiskRelationship,
  RiskFactor,
  LifecycleStageInfo,
  UserValueMetrics,
  ClientNote,
} from "@/types/backoffice/client-detail";

// ============================================================
// 1. 交易账户
// ============================================================
export const mockTradingAccounts: TradingAccount[] = [
  {
    id: "acc-001",
    mtAccount: "10001",
    accountType: "ECN",
    leverage: "1:500",
    status: "active",
    balance: 12500.5,
    equity: 12847.3,
    margin: 625.0,
    marginLevel: "205.6%",
    group: "ECN-Group-A",
    createdAt: "2024-01-20T08:00:00Z",
  },
  {
    id: "acc-002",
    mtAccount: "10002",
    accountType: "Standard",
    leverage: "1:100",
    status: "active",
    balance: 8340.2,
    equity: 8150.8,
    margin: 400.0,
    marginLevel: "203.7%",
    group: "STD-Group-B",
    createdAt: "2024-03-15T10:00:00Z",
  },
];

// ============================================================
// 2. 资金记录
// ============================================================
export const mockFundRecords: FundRecord[] = [
  {
    id: "fund-001",
    clientId: "user-001",
    type: "deposit",
    amount: 15000,
    method: "wire_transfer",
    status: "completed",
    createdAt: "2026-05-01T10:30:00Z",
  },
  {
    id: "fund-002",
    clientId: "user-001",
    type: "withdrawal",
    amount: -2500,
    method: "bank_transfer",
    status: "completed",
    createdAt: "2026-04-28T15:45:00Z",
  },
  {
    id: "fund-003",
    clientId: "user-001",
    type: "deposit",
    amount: 5000,
    method: "crypto",
    status: "completed",
    createdAt: "2026-04-25T09:15:00Z",
  },
  {
    id: "fund-004",
    clientId: "user-001",
    type: "withdrawal",
    amount: -8000,
    method: "e_wallet",
    status: "manual_review",
    createdAt: "2026-05-07T14:20:00Z",
    riskFlags: ["large_amount", "frequent_withdrawal"],
  },
  {
    id: "fund-005",
    clientId: "user-001",
    type: "deposit",
    amount: 25000,
    method: "crypto",
    status: "completed",
    createdAt: "2026-03-10T11:00:00Z",
  },
];

// ============================================================
// 3. 交易记录
// ============================================================
export const mockTradeRecords: TradeRecord[] = [
  {
    id: "trade-001",
    clientId: "user-001",
    symbol: "XAUUSD",
    type: "buy",
    volume: 0.5,
    openPrice: 2034.5,
    closePrice: 2050.0,
    profit: 125.5,
    openTime: "2026-05-08T10:30:00Z",
    closeTime: "2026-05-08T12:00:00Z",
    isEATrading: false,
  },
  {
    id: "trade-002",
    clientId: "user-001",
    symbol: "EURUSD",
    type: "sell",
    volume: 1.0,
    openPrice: 1.0875,
    closePrice: 1.0920,
    profit: -45.2,
    openTime: "2026-05-08T09:15:00Z",
    closeTime: "2026-05-08T10:30:00Z",
    isEATrading: false,
  },
  {
    id: "trade-003",
    clientId: "user-001",
    symbol: "BTCUSD",
    type: "buy",
    volume: 0.1,
    openPrice: 67450.0,
    closePrice: 67770.0,
    profit: 320.0,
    openTime: "2026-05-08T08:58:00Z",
    closeTime: "2026-05-08T09:45:00Z",
    isEATrading: true,
  },
  {
    id: "trade-004",
    clientId: "user-001",
    symbol: "GBPUSD",
    type: "buy",
    volume: 2.0,
    openPrice: 1.2745,
    openTime: "2026-05-08T13:20:00Z",
    isEATrading: false,
  },
];

export const mockTradingStats: TradingStats = {
  totalLots: 150,
  winRate: 68,
  isEATrading: true,
  isHighFrequency: true,
  riskBehaviors: [
    {
      type: "high_frequency_abuse",
      level: "medium",
      description: "检测到高频交易模式，日均订单超过 200 笔",
      detectedAt: "2026-04-15T00:00:00Z",
    },
  ],
};

// ============================================================
// 4. KYC 文档
// ============================================================
export const mockKYCDocuments: KYCDocument[] = [
  {
    id: "kyc-doc-001",
    clientId: "user-001",
    type: "id_card",
    documentNumber: "A123456789",
    fullName: "Zhang Wei",
    nationality: "China",
    dateOfBirth: "1990-05-15",
    expiryDate: "2030-01-01",
    status: "verified",
    imageUrl: "/placeholder-kyc-id.jpg",
    ocrResult: {
      extractedName: "Zhang Wei",
      extractedNumber: "A123456789",
      extractedNationality: "China",
      extractedDateOfBirth: "1990-05-15",
      extractedExpiryDate: "2030-01-01",
      confidence: 0.95,
      mismatches: [],
    },
    submittedAt: "2024-01-18T08:00:00Z",
    reviewedAt: "2024-01-20T10:00:00Z",
    reviewedBy: "staff-001",
  },
];

export const mockKYCRiskIndicators: KYCRiskIndicator[] = [
  {
    type: "ocr_mismatch",
    level: "low",
    description: "OCR 结果与提交信息一致",
  },
];

// ============================================================
// 5. 设备
// ============================================================
export const mockClientDevices: ClientDevice[] = [
  {
    id: "dev-001",
    clientId: "user-001",
    ipAddress: "103.21.244.15",
    country: "Singapore",
    city: "Singapore",
    deviceId: "DEV-ABC123",
    browser: "Chrome 124",
    os: "macOS 14.4",
    timezone: "GMT+8",
    lastUsedAt: "2026-05-08T16:00:00Z",
    isRisky: false,
    isCurrent: true,
  },
  {
    id: "dev-002",
    clientId: "user-001",
    ipAddress: "47.242.25.110",
    country: "Hong Kong",
    city: "Hong Kong",
    deviceId: "DEV-XYZ789",
    browser: "Safari 17",
    os: "iOS 17.4",
    timezone: "GMT+8",
    lastUsedAt: "2026-05-07T22:30:00Z",
    isRisky: false,
    isCurrent: false,
  },
  {
    id: "dev-003",
    clientId: "user-001",
    ipAddress: "185.220.101.42",
    country: "Netherlands",
    city: "Amsterdam",
    deviceId: "DEV-VPN001",
    browser: "Firefox 125",
    os: "Windows 11",
    timezone: "GMT+2",
    lastUsedAt: "2026-05-06T03:15:00Z",
    isRisky: true,
    isCurrent: false,
  },
];

// ============================================================
// 6. 审批 Case
// ============================================================
export const mockCaseItems: CaseItem[] = [
  {
    id: "case-001",
    caseId: "CASE-2026-001",
    clientId: "user-001",
    type: "withdrawal_review",
    status: "pending",
    priority: "high",
    sla: "2h",
    reviewer: "staff-002",
    createdAt: "2026-05-08T14:20:00Z",
    updatedAt: "2026-05-08T14:20:00Z",
    comments: [
      {
        id: "comment-001",
        author: "staff-002",
        content: "大额出金，需核实资金来源",
        createdAt: "2026-05-08T14:25:00Z",
      },
    ],
  },
  {
    id: "case-002",
    caseId: "CASE-2026-002",
    clientId: "user-001",
    type: "kyc_review",
    status: "approved",
    priority: "medium",
    sla: "24h",
    reviewer: "staff-001",
    createdAt: "2024-01-18T08:00:00Z",
    updatedAt: "2024-01-20T10:00:00Z",
    comments: [],
  },
];

// ============================================================
// 7. 客服工单
// ============================================================
export const mockTickets: Ticket[] = [
  {
    id: "ticket-001",
    ticketId: "TK-2026-001",
    clientId: "user-001",
    type: "withdrawal",
    status: "open",
    priority: "high",
    subject: "出金未到账",
    assignedTo: "support-001",
    createdAt: "2026-05-07T09:00:00Z",
    updatedAt: "2026-05-08T10:05:00Z",
    messages: [
      {
        id: "msg-001",
        author: "user-001",
        isStaff: false,
        content: "我昨天申请的出金 2500 USD 到现在还没有到账，请帮忙查一下",
        createdAt: "2026-05-07T09:00:00Z",
      },
      {
        id: "msg-002",
        author: "support-001",
        isStaff: true,
        content: "您好，已收到您的反馈。经查询您的出金正在银行处理中，预计 1-3 个工作日到账。",
        createdAt: "2026-05-07T10:00:00Z",
      },
      {
        id: "msg-003",
        author: "user-001",
        isStaff: false,
        content: "好的，我再等等",
        createdAt: "2026-05-08T10:05:00Z",
      },
    ],
  },
];

// ============================================================
// 8. 权限
// ============================================================
export const mockClientPermissions: ClientPermission[] = [
  {
    key: "auto_withdrawal",
    label: "自动出金",
    value: false,
    type: "toggle",
    category: "资金",
  },
  {
    key: "max_leverage",
    label: "最大杠杆",
    value: "1:500",
    type: "select",
    options: [
      { label: "1:50", value: "1:50" },
      { label: "1:100", value: "1:100" },
      { label: "1:200", value: "1:200" },
      { label: "1:500", value: "1:500" },
    ],
    category: "交易",
  },
  {
    key: "copy_trading",
    label: "跟单交易",
    value: false,
    type: "toggle",
    category: "交易",
  },
  {
    key: "promotion_access",
    label: "推广活动访问",
    value: true,
    type: "toggle",
    category: "营销",
  },
  {
    key: "api_trading",
    label: "API 交易",
    value: true,
    type: "toggle",
    category: "交易",
  },
];

// ============================================================
// 9. 协议
// ============================================================
export const mockClientAgreements: ClientAgreement[] = [
  {
    id: "agr-001",
    clientId: "user-001",
    agreementType: "客户协议",
    version: "v2.1",
    signedAt: "2024-01-15T08:35:00Z",
    signedIp: "103.21.244.15",
    pdfUrl: "/agreements/client-agreement-v2.1.pdf",
    status: "signed",
  },
  {
    id: "agr-002",
    clientId: "user-001",
    agreementType: "风险披露声明",
    version: "v1.3",
    signedAt: "2024-01-15T08:36:00Z",
    signedIp: "103.21.244.15",
    pdfUrl: "/agreements/risk-disclosure-v1.3.pdf",
    status: "signed",
  },
];

// ============================================================
// 10. 时间线事件
// ============================================================
export const mockTimelineEvents: TimelineEvent[] = [
  {
    id: "tl-001",
    clientId: "user-001",
    type: "registered",
    title: "注册账户",
    description: "用户完成注册",
    timestamp: "2024-01-15T08:30:00Z",
  },
  {
    id: "tl-002",
    clientId: "user-001",
    type: "kyc_approved",
    title: "KYC 认证通过",
    description: "身份验证已通过",
    operator: "staff-001",
    timestamp: "2024-01-20T10:00:00Z",
  },
  {
    id: "tl-003",
    clientId: "user-001",
    type: "deposit",
    title: "首笔入金",
    description: "入金 $10,000",
    metadata: { amount: 10000, method: "wire_transfer" },
    timestamp: "2024-01-20T10:30:00Z",
  },
  {
    id: "tl-004",
    clientId: "user-001",
    type: "login",
    title: "登录",
    description: "从新加坡 IP 登录",
    metadata: { ip: "103.21.244.15", device: "Chrome/macOS" },
    timestamp: "2026-05-08T14:20:00Z",
  },
  {
    id: "tl-005",
    clientId: "user-001",
    type: "withdrawal",
    title: "提交出金",
    description: "出金 $2,500",
    metadata: { amount: -2500, method: "bank_transfer" },
    timestamp: "2026-04-28T15:45:00Z",
  },
  {
    id: "tl-006",
    clientId: "user-001",
    type: "case_created",
    title: "创建审批 Case",
    description: "出金审批 CASE-2026-001",
    operator: "system",
    timestamp: "2026-05-08T14:20:00Z",
  },
];

// ============================================================
// 11. 审计日志
// ============================================================
export const mockAuditLogs: AuditLog[] = [
  {
    id: "audit-001",
    clientId: "user-001",
    operator: "staff-001",
    action: "修改杠杆",
    targetField: "max_leverage",
    oldValue: "1:100",
    newValue: "1:500",
    timestamp: "2024-02-01T10:00:00Z",
    ipAddress: "103.21.244.15",
  },
  {
    id: "audit-002",
    clientId: "user-001",
    operator: "staff-002",
    action: "添加标签",
    targetField: "tags",
    oldValue: "[\"高净值\"]",
    newValue: "[\"高净值\", \"高频交易\"]",
    timestamp: "2024-03-10T14:30:00Z",
    ipAddress: "103.21.244.20",
  },
  {
    id: "audit-003",
    clientId: "user-001",
    operator: "staff-001",
    action: "KYC 审核通过",
    targetField: "kycStatus",
    oldValue: "pending",
    newValue: "verified",
    timestamp: "2024-01-20T10:00:00Z",
    ipAddress: "103.21.244.15",
  },
];

// ============================================================
// 12. 风险关系
// ============================================================
export const mockRiskRelationships: RiskRelationship[] = [
  {
    targetClientId: "user-003",
    targetClientName: "王芳",
    relationshipType: "shared_ip",
    strength: 0.85,
    details: "共享 IP 185.220.101.42 (VPN)",
    detectedAt: "2026-04-01T00:00:00Z",
  },
  {
    targetClientId: "user-004",
    targetClientName: "陈强",
    relationshipType: "shared_device",
    strength: 0.72,
    details: "共享设备指纹 DEV-ABC123",
    detectedAt: "2026-03-15T00:00:00Z",
  },
];

// ============================================================
// 13. 风险因子
// ============================================================
export const mockRiskFactors: RiskFactor[] = [
  { name: "地理风险", score: 5, maxScore: 10, level: "low", description: "新加坡 / 香港，低风险地区" },
  { name: "行为模式", score: 3, maxScore: 10, level: "low", description: "交易行为正常" },
  { name: "交易速度", score: 7, maxScore: 10, level: "medium", description: "检测到高频交易" },
  { name: "设备指纹", score: 6, maxScore: 10, level: "medium", description: "检测到 VPN 设备" },
  { name: "IP 信誉", score: 4, maxScore: 10, level: "low", description: "IP 信誉良好" },
  { name: "关联风险", score: 8, maxScore: 10, level: "high", description: "与高风险用户共享 IP/设备" },
];

// ============================================================
// 14. 生命周期阶段
// ============================================================
export const mockLifecycleStages: LifecycleStageInfo[] = [
  { stage: "registered", label: "已注册", reachedAt: "2024-01-15T08:30:00Z", isCurrent: false },
  { stage: "verified", label: "已验证", reachedAt: "2024-01-20T10:00:00Z", isCurrent: false },
  { stage: "ftd", label: "首存入金", reachedAt: "2024-01-20T10:30:00Z", isCurrent: false },
  { stage: "active_trader", label: "活跃交易者", reachedAt: "2024-02-01T00:00:00Z", isCurrent: true },
];

// ============================================================
// 15. 用户价值指标
// ============================================================
export const mockUserValueMetrics: UserValueMetrics = {
  netDeposit: 55000,
  currentBalance: 20840.7,
  equity: 20998.1,
  totalLots: 150,
  openPositions: 1,
  totalProfit: 3250,
  totalProfitPercent: 12,
};

// ============================================================
// 16. 内部笔记
// ============================================================
export const mockClientNotes: ClientNote[] = [
  {
    id: "note-001",
    clientId: "user-001",
    content: "客户咨询杠杆调整事宜，已记录需求，建议跟进",
    author: "staff-001",
    authorName: "客服小李",
    mentions: [],
    isPinned: false,
    noteType: "followup",
    createdAt: "2026-05-07T10:00:00Z",
  },
  {
    id: "note-002",
    clientId: "user-001",
    content: "高频交易行为监控中，暂无明显套利迹象 @风控小王",
    author: "staff-002",
    authorName: "风控小张",
    mentions: ["staff-003"],
    isPinned: true,
    noteType: "risk",
    createdAt: "2026-04-15T14:00:00Z",
  },
];
