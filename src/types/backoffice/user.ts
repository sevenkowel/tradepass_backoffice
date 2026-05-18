// Backoffice User Types
export type UserStatus = 'active' | 'frozen' | 'pending' | 'closed';
export type KYCStatus = 'not_submitted' | 'pending' | 'verified' | 'rejected';
export type UserLevel = 'standard' | 'vip' | 'premium' | 'enterprise';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type LifecycleStage = 'registered' | 'verified' | 'ftd' | 'active' | 'inactive' | 'churn';

/** Role in the broker ecosystem — drives different surfaces / permissions.
 *  See `User.role` in `schema.prisma`. */
export type ClientRole = "client" | "partner" | "affiliate";

export interface BackofficeUser {
  id: string;
  uid: string;
  name: string;
  username?: string;
  email: string;
  phone: string;
  country?: string;
  avatar?: string;
  status: UserStatus;
  kycStatus: KYCStatus;
  level: UserLevel;
  balance: number;
  equity: number;
  createdAt: string;
  lastLoginAt: string;
  tags: string[];
  ibId?: string;
  notes?: string;
  // === v2: Client Management 扩展字段 ===
  riskLevel?: RiskLevel;
  riskScore?: number;
  lifecycleStage?: LifecycleStage;
  ftdDate?: string;
  totalDeposit?: number;
  totalWithdrawal?: number;
  netDeposit?: number;
  tradingVolume?: number;
  lastTradeAt?: string;
  deviceCount?: number;
  ipCount?: number;
  relatedUserIds?: string[];
  // === v3: Client list display columns (2026-05-14) ===
  /** How the client signed up — web / mobile_ios / mobile_android / affiliate / import. */
  registrationSource?: string;
  /** Short device label captured at registration. */
  registrationDevice?: string;
  /** Count of trading accounts (MT4/5) attached to this user. */
  accountCount?: number;
  /** Broker-ecosystem role. */
  role?: ClientRole;

  // === v3b: User Value extras (2026-05-14) ===
  /** Cumulative commission earned (USD). For partners/affiliates only. */
  commissionEarned?: number;
  /** Cumulative negative-balance protection write-off (USD). */
  negBalanceProtected?: number;
}

export interface UserListParams {
  page: number;
  pageSize: number;
  status?: UserStatus;
  kycStatus?: KYCStatus;
  level?: UserLevel;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export interface ClientListParams extends UserListParams {
  riskLevel?: RiskLevel;
  lifecycleStage?: LifecycleStage;
  /** Multi-select country filter (ISO-3166 alpha-2, uppercase).
   *  Wire format: comma-separated string in the URL (`?country=CN,HK,SG`). */
  country?: string[];
  hasFtd?: boolean;
  tags?: string[];
  /** Single tag name shortcut (advanced filter drawer single-input UX). */
  tag?: string;
  /** Filter on broker role. */
  role?: ClientRole;
  /** Inclusive lower bound on trading account count. */
  minAccountCount?: number;
  /** Inclusive upper bound on trading account count. */
  maxAccountCount?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface UserListResponse {
  data: BackofficeUser[];
  total: number;
  page: number;
  pageSize: number;
}

// === v2: Client Tags ===
export interface ClientTag {
  id: string;
  name: string;
  color: string;
  description?: string;
  isSystem: boolean;
  autoRule?: TagAutoRule;
  userCount: number;
  createdAt: string;
}

export interface TagAutoRule {
  condition: 'and' | 'or';
  rules: {
    field: string;
    operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'in';
    value: number | string | string[];
  }[];
}

// === v2: Client Segments ===
export interface ClientSegment {
  id: string;
  name: string;
  description?: string;
  filter: Partial<ClientListParams>;
  userCount: number;
  isDynamic: boolean;
  createdAt: string;
}

// === v2: Client Notes ===
export interface ClientNote {
  id: string;
  clientId: string;
  content: string;
  /** Stable id (staff user id) of the author. */
  author: string;
  /** Display name resolved at write time so the feed is readable even if the author's user record is later renamed. */
  authorName?: string;
  mentions: string[];
  isPinned: boolean;
  /** Optional note category — `general | risk | sales | followup`. */
  noteType?: string;
  createdAt: string;
}
