/**
 * Mock data for global relationship views — list / clusters.
 *
 * 这里生成全平台范围的关联对（边），以及风险团伙（连通分量）。
 * 客户详情页的 RiskRelationship 是"以某客户为中心的 1 跳"，
 * 这里则是整个平台的网络。
 */

/* ─────────────────────────────────────────────────────────────────────────── */
/* Types — 简化版（专用于 relationships 页面渲染，避免与 RiskRelationship 混淆）*/
/* ─────────────────────────────────────────────────────────────────────────── */

export type RelEdgeKind =
  | "shared_ip"
  | "shared_device"
  | "shared_bank"
  | "shared_crypto_wallet"
  | "same_name"
  | "shared_email"
  | "fund_flow_link";

export type RelStrength = "hard" | "medium" | "soft";

export interface GlobalRelationshipEdge {
  id: string;
  sourceId: string;
  sourceName: string;
  sourceUid: string;
  sourceCountry?: string;
  sourceRiskLevel: "low" | "medium" | "high" | "critical";
  targetId: string;
  targetName: string;
  targetUid: string;
  targetCountry?: string;
  targetRiskLevel: "low" | "medium" | "high" | "critical";
  kind: RelEdgeKind;
  strength: RelStrength;
  /** 0-1 数值化 */
  weight: number;
  details: string;
  detectedAt: string;
  lastSeenAt: string;
}

export interface RelCluster {
  id: string;
  /** 集群成员客户 ids */
  memberIds: string[];
  members: { id: string; name: string; uid: string; riskScore: number }[];
  /** 集群内所有关联信号种类 */
  signals: RelEdgeKind[];
  /** 集群平均风险评分 */
  avgRiskScore: number;
  /** 集群整体风险等级 */
  riskLevel: "low" | "medium" | "high" | "critical";
  /** 累计净入金 */
  totalNetDeposit: number;
  /** 累计出金 */
  totalWithdrawal: number;
  /** 集群发现时间 */
  detectedAt: string;
  /** 最近活动 */
  lastActivityAt: string;
  /** AI 分析 / 备注 */
  notes: string;
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* PRNG                                                                        */
/* ─────────────────────────────────────────────────────────────────────────── */

function hashStr(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h = (h ^ s.charCodeAt(i)) >>> 0;
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

function mulberry32(seed: number): () => number {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* Frozen "now" — see comment in mock-collaboration.ts for the reasoning.
 * Using Date.now() inside generators causes SSR/CSR hydration mismatches
 * because the server clock differs from the client clock. */
const EPOCH = Date.parse("2026-05-18T12:00:00Z");

/** Per-call PRNG factory — each generator creates a fresh one so two
 *  consecutive calls in the same render produce identical output and
 *  module-level call order doesn't leak between callers. */
function localRng(seed: number) {
  const r = mulberry32(seed);
  return {
    rand: () => r(),
    ri: (min: number, max: number) => Math.floor(r() * (max - min + 1)) + min,
    pick: <T>(arr: readonly T[]): T => arr[Math.floor(r() * arr.length)],
  };
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Mock pool — 30+ 客户                                                        */
/* ─────────────────────────────────────────────────────────────────────────── */

const NAME_POOL = [
  ["Liu Wei", "CN"], ["Zhang Min", "CN"], ["Chen Hao", "CN"], ["Wang Lei", "CN"],
  ["Yang Jing", "CN"], ["Zhao Yu", "CN"], ["Sun Tao", "CN"],
  ["Tanaka Yuki", "JP"], ["Sato Kenji", "JP"], ["Yamada Aiko", "JP"],
  ["Park Min-jun", "KR"], ["Kim Soo-yeon", "KR"], ["Lee Hyun-woo", "KR"],
  ["Lee Wong", "HK"], ["Cheung Ka", "HK"], ["Wong Ming", "HK"],
  ["Hassan Khalid", "AE"], ["Aisha Rahman", "AE"], ["Omar Al-Mansouri", "AE"],
  ["Aleksandr Volkov", "RU"], ["Dmitry Petrov", "RU"],
  ["Marco Rossi", "IT"], ["Luigi Bianchi", "IT"],
  ["Sophie Martin", "FR"], ["Antoine Dupont", "FR"],
  ["Hans Mueller", "DE"], ["Klaus Schmidt", "DE"],
  ["John Smith", "US"], ["Mary Johnson", "US"], ["Robert Brown", "US"],
  ["Carlos Garcia", "ES"], ["Ana Lopez", "ES"],
] as const;

const POOL = NAME_POOL.map(([name, country], i) => ({
  id: `mock_rel_${i}`,
  uid: `USR${100000 + i}`,
  name,
  country,
  riskScore: ri(10, 95),
}));

function riskLevelOf(score: number): "low" | "medium" | "high" | "critical" {
  if (score >= 80) return "critical";
  if (score >= 60) return "high";
  if (score >= 30) return "medium";
  return "low";
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Edges generator                                                             */
/* ─────────────────────────────────────────────────────────────────────────── */

const EDGE_TEMPLATES: { kind: RelEdgeKind; strength: RelStrength; details: string[]; weightRange: [number, number] }[] = [
  {
    kind: "shared_ip",       strength: "soft",
    details: ["共享公网 IP 1.2.3.4", "同 IP /24 段 · 12 次共同登录", "VPN 出口节点重叠"],
    weightRange: [0.3, 0.6],
  },
  {
    kind: "shared_device",   strength: "medium",
    details: ["设备指纹完全一致 (Chrome / macOS)", "Mobile Ad ID 一致（同一手机）", "Browser FP + 屏幕分辨率 + 时区 完全重合"],
    weightRange: [0.6, 0.85],
  },
  {
    kind: "shared_bank",     strength: "hard",
    details: ["出入金使用同一银行账户 HSBC ****1234", "同一银行卡号 (CC) 入金", "提款到同一银行"],
    weightRange: [0.85, 0.98],
  },
  {
    kind: "shared_crypto_wallet", strength: "hard",
    details: ["USDT-TRC20 钱包地址重复", "BTC 充值地址共用", "签名钱包链路有重合"],
    weightRange: [0.85, 0.98],
  },
  {
    kind: "same_name",       strength: "medium",
    details: ["同名 + 同生日", "证件号完全一致", "Email 模式高度相似 (li.wei.1@/li.wei.2@)"],
    weightRange: [0.6, 0.85],
  },
  {
    kind: "shared_email",    strength: "medium",
    details: ["邮箱 alias 同一 base (john+1@/john+2@)", "回收邮箱重复使用"],
    weightRange: [0.55, 0.8],
  },
  {
    kind: "fund_flow_link",  strength: "hard",
    details: ["A 出金 → 1h 内 B 入金", "资金 1 跳关联，金额相近", "A↔B 链上小额往来"],
    weightRange: [0.7, 0.95],
  },
];

export function generateEdges(): GlobalRelationshipEdge[] {
  const { rand, ri, pick } = localRng(hashStr("crm:relationships:edges"));
  const edges: GlobalRelationshipEdge[] = [];
  // 大约生成 60-100 条边
  const targetCount = 80;
  const usedPairs = new Set<string>();

  while (edges.length < targetCount) {
    const a = pick(POOL);
    const b = pick(POOL);
    if (a.id === b.id) continue;
    const key = [a.id, b.id].sort().join(":");
    if (usedPairs.has(key)) continue;
    usedPairs.add(key);

    const tpl = pick(EDGE_TEMPLATES);
    const weight = Number((rand() * (tpl.weightRange[1] - tpl.weightRange[0]) + tpl.weightRange[0]).toFixed(2));
    const detectedAt = new Date(EPOCH - ri(1, 180) * 86400_000).toISOString();
    const lastSeenAt = new Date(EPOCH - ri(0, 30) * 86400_000).toISOString();

    edges.push({
      id: `edge_${edges.length}`,
      sourceId: a.id,
      sourceName: a.name,
      sourceUid: a.uid,
      sourceCountry: a.country,
      sourceRiskLevel: riskLevelOf(a.riskScore),
      targetId: b.id,
      targetName: b.name,
      targetUid: b.uid,
      targetCountry: b.country,
      targetRiskLevel: riskLevelOf(b.riskScore),
      kind: tpl.kind,
      strength: tpl.strength,
      weight,
      details: pick(tpl.details),
      detectedAt,
      lastSeenAt,
    });
  }

  return edges.sort((a, b) => b.weight - a.weight);
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Clusters generator — 派生 8-12 个团伙                                       */
/* ─────────────────────────────────────────────────────────────────────────── */

const CLUSTER_NOTES = [
  "疑似 IB 农场账户：同一设备 hash + 银行账户共享 + 资金互转",
  "亚太多账户群：同 IP 段 + 同语言 / 时区 + 集中入金时间",
  "高频套利团伙：共享 VPS + 抢报价行为 + 钱包链上互转",
  "重复注册嫌疑：同名 + 同证件 + 同 KYC 提交时间",
  "VPN 节点共享：5 个客户 100% 通过同一 NordVPN IP",
  "亲属账户：同 surname + 同地址 + 银行卡持卡人不同但银行账户相邻",
  "信用卡盗刷池：3 个账户使用同一被盗信用卡入金，已上报",
  "代理操盘集群：用户 A/B/C 同一设备登录，但身份证不同（合规存疑）",
];

export function generateClusters(): RelCluster[] {
  const { ri, pick } = localRng(hashStr("crm:relationships:clusters"));
  const clusters: RelCluster[] = [];
  const count = 10;
  let memberIdx = 0;

  for (let i = 0; i < count; i++) {
    const memberCount = ri(3, 8);
    const members = [];
    const usedIds = new Set<string>();
    while (members.length < memberCount && usedIds.size < POOL.length) {
      const p = POOL[memberIdx % POOL.length];
      memberIdx++;
      if (usedIds.has(p.id)) continue;
      usedIds.add(p.id);
      members.push({ id: p.id, name: p.name, uid: p.uid, riskScore: p.riskScore });
    }
    const avgRisk = Math.round(members.reduce((s, m) => s + m.riskScore, 0) / members.length);
    const signalCount = ri(2, 4);
    const signals: RelEdgeKind[] = [];
    const allKinds: RelEdgeKind[] = ["shared_ip", "shared_device", "shared_bank", "shared_crypto_wallet", "same_name", "fund_flow_link"];
    for (let s = 0; s < signalCount; s++) {
      const sig = pick(allKinds);
      if (!signals.includes(sig)) signals.push(sig);
    }

    clusters.push({
      id: `cluster_${i}`,
      memberIds: members.map((m) => m.id),
      members,
      signals,
      avgRiskScore: avgRisk,
      riskLevel: riskLevelOf(avgRisk),
      totalNetDeposit: ri(50_000, 2_000_000),
      totalWithdrawal: ri(20_000, 1_500_000),
      detectedAt: new Date(EPOCH - ri(10, 200) * 86400_000).toISOString(),
      lastActivityAt: new Date(EPOCH - ri(0, 14) * 86400_000).toISOString(),
      notes: CLUSTER_NOTES[i % CLUSTER_NOTES.length],
    });
  }

  return clusters.sort((a, b) => b.avgRiskScore - a.avgRiskScore);
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Edge kind metadata                                                          */
/* ─────────────────────────────────────────────────────────────────────────── */

export const EDGE_KIND_META: Record<RelEdgeKind, { label: string; color: string; bg: string }> = {
  shared_ip:            { label: "共享 IP",      color: "text-amber-700",   bg: "bg-amber-50" },
  shared_device:        { label: "共享设备",     color: "text-orange-700",  bg: "bg-orange-50" },
  shared_bank:          { label: "共享银行",     color: "text-red-700",     bg: "bg-red-50" },
  shared_crypto_wallet: { label: "共享钱包",     color: "text-red-700",     bg: "bg-red-50" },
  same_name:            { label: "同名/同证件",  color: "text-violet-700",  bg: "bg-violet-50" },
  shared_email:         { label: "共享邮箱",     color: "text-blue-700",    bg: "bg-blue-50" },
  fund_flow_link:       { label: "资金链路",     color: "text-rose-700",    bg: "bg-rose-50" },
};
