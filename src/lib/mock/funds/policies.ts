/**
 * Mock data — Funds Policies & Limits
 *
 * The configuration backbone of the funds module. Drives:
 *
 *   - KYC tier × daily / monthly / per-txn limits (deposit + withdrawal)
 *   - Auto Match / Auto Approval rules
 *   - First-withdrawal review (the forex industry "always-on" check)
 *   - Cooldown, channel whitelists, country restrictions
 *   - MT bridge limits (internal transfers)
 *   - KYC tier → funds permission mapping
 *
 * Spec: `docscc/产品文档/2026-05-17-funds-module-design.md` §6.6
 */

export type PolicyCategoryKey =
  | "deposit_limits"
  | "deposit_auto_match"
  | "deposit_velocity"
  | "withdrawal_limits"
  | "withdrawal_auto_approval"
  | "withdrawal_first"
  | "withdrawal_cooldown"
  | "withdrawal_channel_whitelist"
  | "withdrawal_country"
  | "mt_bridge_limits"
  | "kyc_mapping";

export interface PolicyCategory {
  key: PolicyCategoryKey;
  group: "Deposit" | "Withdrawal" | "Internal" | "KYC Mapping";
  label: string;
  description: string;
}

export const policyCategories: PolicyCategory[] = [
  { key: "deposit_limits",                group: "Deposit",      label: "Limits",            description: "Daily / monthly / per-txn caps by KYC tier" },
  { key: "deposit_auto_match",            group: "Deposit",      label: "Auto Match",        description: "Auto bank reference / crypto confirmation rules" },
  { key: "deposit_velocity",              group: "Deposit",      label: "Velocity",          description: "Duplicate detection and rate limits" },

  { key: "withdrawal_limits",             group: "Withdrawal",   label: "Limits",            description: "Daily / monthly / per-txn caps by KYC tier" },
  { key: "withdrawal_auto_approval",      group: "Withdrawal",   label: "Auto Approval",     description: "Conditions under which a withdrawal can be auto-approved" },
  { key: "withdrawal_first",              group: "Withdrawal",   label: "First Withdrawal",  description: "Force manual review on a client's first withdrawal" },
  { key: "withdrawal_cooldown",           group: "Withdrawal",   label: "Cooldown",          description: "Minimum time between consecutive withdrawals" },
  { key: "withdrawal_channel_whitelist",  group: "Withdrawal",   label: "Channel Whitelist", description: "Which channels each KYC tier can use" },
  { key: "withdrawal_country",            group: "Withdrawal",   label: "Country Rules",     description: "Allow / hold / block by country" },

  { key: "mt_bridge_limits",              group: "Internal",     label: "MT Bridge Limits",  description: "Wallet ↔ MT account transfer caps" },

  { key: "kyc_mapping",                   group: "KYC Mapping",  label: "Tier → Permissions", description: "What each KYC tier is allowed to do with funds" },
];

/* ── Rule values (one configuration object per category) ──────── */

export interface TierLimit {
  tier: "Tier1" | "Tier2" | "Tier3";
  daily: number;     // USD
  monthly: number;
  perTxn: number;
}

export const depositLimits: TierLimit[] = [
  { tier: "Tier1", daily: 1_000,    monthly: 10_000,    perTxn: 1_000   },
  { tier: "Tier2", daily: 20_000,   monthly: 200_000,   perTxn: 20_000  },
  { tier: "Tier3", daily: 100_000,  monthly: 1_500_000, perTxn: 100_000 },
];

export const withdrawalLimits: TierLimit[] = [
  { tier: "Tier1", daily: 1_000,    monthly: 5_000,     perTxn: 1_000   },
  { tier: "Tier2", daily: 20_000,   monthly: 100_000,   perTxn: 10_000  },
  { tier: "Tier3", daily: 100_000,  monthly: 1_000_000, perTxn: 50_000  },
];

export interface SimpleToggle {
  key: string;
  label: string;
  enabled: boolean;
  detail?: string;
}

export const depositAutoMatchRules: SimpleToggle[] = [
  { key: "bank_reference",    label: "Auto-match by bank reference code",   enabled: true,
    detail: "Bank statement memo must contain client UID" },
  { key: "bank_amount",       label: "Auto-match by amount + last name",    enabled: true,
    detail: "Confidence ≥ 80% to auto-approve, otherwise human queue" },
  { key: "crypto_confirms",   label: "Crypto auto-credit after N confirmations", enabled: true,
    detail: "TRC20: 6 confirmations · ERC20: 12 confirmations" },
  { key: "crypto_aml",        label: "Run wallet screening before credit",  enabled: true,
    detail: "Block if score ≥ 75 (Chainalysis Severe)" },
];

export const depositVelocityRules: SimpleToggle[] = [
  { key: "dup_amount",        label: "Block identical amount within 1h",    enabled: true  },
  { key: "rate_per_hour",     label: "Max 5 deposits / hour / client",      enabled: true  },
  { key: "rate_per_day",      label: "Max 15 deposits / day / client",      enabled: false },
];

export const withdrawalAutoApprovalConditions: SimpleToggle[] = [
  { key: "low_risk",          label: "Risk = Low",                            enabled: true,
    detail: "Combined score < 25 (AML + behavioral)" },
  { key: "tier_ok",           label: "KYC = Tier2 or Tier3",                  enabled: true },
  { key: "amount_ceiling",    label: "Amount ≤ $5,000",                       enabled: true },
  { key: "channel_match",     label: "Same channel as last 3 successful WD",  enabled: true,
    detail: "Cuts cold-start fraud risk to ~0" },
  { key: "no_open_positions", label: "MT margin level ≥ 200% after WD",       enabled: true },
  { key: "no_recent_aml",     label: "No AML hit in last 30 days",            enabled: true },
];

export const firstWithdrawalRule = {
  enabled: true,
  detail: "First withdrawal always routes to manual review regardless of risk score / amount / channel. " +
          "Captures the standard fraud pattern (deposit → small win → withdraw out).",
};

export const cooldownRule = {
  enabled: true,
  defaultMinutes: 60,
  perTier: [
    { tier: "Tier1", minutes: 240 },
    { tier: "Tier2", minutes: 60  },
    { tier: "Tier3", minutes: 30  },
  ],
};

export interface ChannelTierMatrix {
  channel: string;
  tier1: boolean;
  tier2: boolean;
  tier3: boolean;
}

export const channelWhitelist: ChannelTierMatrix[] = [
  { channel: "Bank Wire",    tier1: false, tier2: true,  tier3: true  },
  { channel: "USDT TRC20",   tier1: false, tier2: true,  tier3: true  },
  { channel: "USDT ERC20",   tier1: false, tier2: true,  tier3: true  },
  { channel: "DOKU Wallet",  tier1: true,  tier2: true,  tier3: true  },
  { channel: "Visa Card",    tier1: false, tier2: false, tier3: true  },
];

export interface CountryRule {
  country: string;
  iso: string;
  action: "allow" | "hold" | "block";
  note?: string;
}

export const countryRules: CountryRule[] = [
  { country: "United States",  iso: "US", action: "allow"  },
  { country: "United Kingdom", iso: "GB", action: "allow"  },
  { country: "Japan",          iso: "JP", action: "allow"  },
  { country: "Russia",         iso: "RU", action: "hold",  note: "Sanctions watch list — manual review required" },
  { country: "Iran",           iso: "IR", action: "block", note: "OFAC sanctioned" },
  { country: "North Korea",    iso: "KP", action: "block", note: "OFAC sanctioned" },
];

export const mtBridgeLimits = [
  { direction: "Wallet → MT", maxPerTxn: 50_000, maxPerDay: 100_000, autoApprove: true,  note: "Auto-credit after MT5 Manager API confirms" },
  { direction: "MT → Wallet", maxPerTxn: 50_000, maxPerDay: 100_000, autoApprove: false, note: "Manual; reuses Withdrawals risk checks" },
  { direction: "MT → MT",     maxPerTxn: 50_000, maxPerDay: 200_000, autoApprove: true,  note: "Same beneficial owner only" },
];

export interface KycPermission {
  permission: string;
  tier1: "yes" | "no" | "limited";
  tier2: "yes" | "no" | "limited";
  tier3: "yes" | "no" | "limited";
  note?: string;
}

export const kycPermissions: KycPermission[] = [
  { permission: "Deposit fiat",        tier1: "limited", tier2: "yes",     tier3: "yes",     note: "Tier1 capped at $1,000/day" },
  { permission: "Deposit crypto",      tier1: "no",      tier2: "yes",     tier3: "yes" },
  { permission: "Withdraw fiat",       tier1: "limited", tier2: "yes",     tier3: "yes",     note: "Tier1 first WD always manual" },
  { permission: "Withdraw crypto",     tier1: "no",      tier2: "yes",     tier3: "yes" },
  { permission: "MT Bridge transfers", tier1: "limited", tier2: "yes",     tier3: "yes" },
  { permission: "Bonus conversion",    tier1: "no",      tier2: "limited", tier3: "yes",     note: "Subject to bonus terms" },
  { permission: "IB commissions",      tier1: "no",      tier2: "yes",     tier3: "yes" },
];
