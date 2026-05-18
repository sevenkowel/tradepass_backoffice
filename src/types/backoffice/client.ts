/**
 * `backoffice/client` — single barrel for the Clients module's type vocabulary.
 *
 * The CRM historically split client types across two files:
 *   - `backoffice/user.ts`         — list-page model (BackofficeUser + ClientTag + Segment + ListParams)
 *   - `backoffice/client-detail.ts` — detail-page model (TradingAccount + KYCDocument + Timeline + ...)
 *
 * Both files remain (no breaking move), but this barrel exposes the
 * complete set under one import path. Prefer this file in new code:
 *
 *   import {
 *     BackofficeUser, ClientTag, ClientDetailData, BaseTabProps
 *   } from "@/types/backoffice/client";
 */

export type {
  // Core entity + status enums
  BackofficeUser,
  UserStatus,
  KYCStatus,
  UserLevel,
  RiskLevel,
  LifecycleStage,

  // List / search
  UserListParams,
  ClientListParams,
  UserListResponse,

  // Tagging / segmentation / notes
  ClientTag,
  TagAutoRule,
  ClientSegment,
  ClientNote,
} from "./user";

export type {
  // Detail data shape (driven by ClientDetailContext)
  ClientDetailData,

  // Sub-entities used by tabs
  TradingAccount,
  FundType,
  FundStatus,
  FundMethod,
  FundRecord,
  TradeRecord,
  TradingStats,
  RiskBehavior,
  DocumentType,
  VerificationStatus,
  KYCDocument,
  OCRResult,
  KYCRiskIndicator,
  ClientDevice,
  CaseType,
  CaseStatus,
  CaseItem,
  CaseComment,
  TicketType,
  TicketStatus,
  TicketPriority,
  Ticket,
  TicketMessage,
  ClientPermission,
  ClientAgreement,
  TimelineEventType,
  TimelineEvent,
  AuditLog,
  RiskRelationship,
  RiskFactor,
} from "./client-detail";

import type { ClientDetailData } from "./client-detail";

/**
 * Props every Client-detail tab component receives.
 *
 * Use this instead of declaring `interface Props { data: ClientDetailData }`
 * in every tab file. Tabs that need extra props can extend it:
 *
 *   interface KYCTabProps extends BaseTabProps {
 *     onApprove?: () => void;
 *   }
 */
export interface BaseTabProps {
  data: ClientDetailData;
}
