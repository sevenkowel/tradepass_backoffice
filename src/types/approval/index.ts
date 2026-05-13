export type ApprovalItemType = "kyc" | "deposit" | "withdrawal";
export type ApprovalItemStatus = "pending" | "on_hold" | "in_review";

export interface ApprovalItem {
  id: string;
  type: ApprovalItemType;

  /** Foreign key into the source entity (CLM case ID / deposit order ID / withdrawal request ID). */
  sourceId: string;
  /** Absolute URL to the module detail page. */
  detailUrl: string;

  userId: string;
  userUid: string;
  userName: string;
  userCountry: string;

  /** Human-readable subject: "Identity Document" / "$12,400 USDT" / "Card Deposit $3,200" */
  subject: string;
  amount?: number;
  currency?: string;

  riskLevel: "low" | "medium" | "high" | "critical";
  riskFlags?: string[];

  status: ApprovalItemStatus;
  /** ISO timestamp. Undefined = no SLA configured. */
  slaDueAt?: string;
  createdAt: string;

  /**
   * When true, Approve/Reject/Hold buttons render inline.
   * When false (KYC or high-risk/large-amount funds), only Review → renders.
   */
  canInlineApprove: boolean;
}

export interface ApprovalSummary {
  kyc:        { pending: number; overdue: number };
  deposit:    { pending: number; overdue: number };
  withdrawal: { pending: number; overdue: number };
}

export interface ApprovalListParams {
  type?: ApprovalItemType | "all";
  status?: ApprovalItemStatus | ApprovalItemStatus[];
  riskLevel?: string;
  /** "overdue" | "urgent" (<1h) | "normal" | "all" */
  slaStatus?: "overdue" | "urgent" | "normal" | "all";
  search?: string;
  page?: number;
  pageSize?: number;
}
