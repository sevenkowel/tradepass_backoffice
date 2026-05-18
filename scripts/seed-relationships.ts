/**
 * Seed relationship-graph demo data.
 *
 * Builds **6 deliberate rings** of related clients so the new
 * `/crm/clients/relationships` and `/crm/clients/clusters` pages have
 * non-trivial data to display. Each ring exercises a different factor
 * pattern from the 6-category model:
 *
 *   Ring α  Identity  →  3 users share the same passport hash       (HARD)
 *   Ring β  Payment   →  4 users share the same bank account hash   (HARD)
 *   Ring γ  Device    →  5 users share device + IP + ISP            (HARD+MED+SOFT)
 *   Ring δ  Crypto    →  3 users share the same crypto wallet hash  (HARD)
 *   Ring ε  Mixed     →  4 users tie identity + payment + IP + dev  (HARD×3 — top cluster)
 *   Ring ζ  Soft      →  2 users only share /24 subnet + ISP/city   (SOFT only)
 *
 * Total: 21 users selected deterministically (by id ASC). Pair scores
 * are pre-computed using the same strength-layered + combination-amplified
 * algorithm as `pairScore()` and written to `client_relationship_scores`,
 * so the cluster page has data even without a separate batch job.
 *
 * Usage:  npx tsx scripts/seed-relationships.ts
 *
 * Idempotent — clears prior demo rows for selected users first.
 */
import { PrismaClient } from "@prisma/client";
import crypto from "node:crypto";

const prisma = new PrismaClient();

/* --------------------------------------------------------------------- */
/* Strength / scoring helpers — duplicated from lib/risk-engine/graph.ts */
/* so this script can run standalone without the Next.js path-aliases.   */
/* --------------------------------------------------------------------- */

type EvidenceStrength = "hard" | "medium" | "soft" | "info";
type EdgeCategory = "identity" | "contact" | "network" | "device" | "payment" | "business";

const STRENGTH_BASE: Record<EvidenceStrength, number> = {
  hard: 60, medium: 25, soft: 8, info: 0,
};
const HARD_AMPLIFIER = [1.0, 1.15, 1.3, 1.4, 1.5];

const EDGE_STRENGTH: Record<string, EvidenceStrength> = {
  same_id_document: "hard", same_passport: "hard", same_tax_id: "hard", same_name_dob: "medium",
  same_email: "medium", same_phone: "medium", email_pattern_sim: "soft",
  shared_ip: "medium", same_ip_subnet: "soft", same_isp_geo: "soft",
  shared_device: "hard", shared_browser_fp: "medium", shared_mobile_id: "hard",
  shared_bank_account: "hard", shared_crypto_wallet: "hard", shared_e_wallet: "hard",
  fund_flow_link: "medium",
  ib_invited: "info", referral_chain: "soft", copy_trading: "info",
};
const EDGE_CATEGORY: Record<string, EdgeCategory> = {
  same_id_document: "identity", same_passport: "identity", same_tax_id: "identity", same_name_dob: "identity",
  same_email: "contact", same_phone: "contact", email_pattern_sim: "contact",
  shared_ip: "network", same_ip_subnet: "network", same_isp_geo: "network",
  shared_device: "device", shared_browser_fp: "device", shared_mobile_id: "device",
  shared_bank_account: "payment", shared_crypto_wallet: "payment", shared_e_wallet: "payment", fund_flow_link: "payment",
  ib_invited: "business", referral_chain: "business", copy_trading: "business",
};

function strengthRank(s: EvidenceStrength): number {
  return s === "hard" ? 3 : s === "medium" ? 2 : s === "soft" ? 1 : 0;
}

function pairScore(edgeKinds: string[]): number {
  if (edgeKinds.length === 0) return 0;
  const byCat: Record<EdgeCategory, string[]> = {
    identity: [], contact: [], network: [], device: [], payment: [], business: [],
  };
  for (const k of edgeKinds) {
    const cat = EDGE_CATEGORY[k];
    if (cat) byCat[cat].push(k);
  }
  let total = 0;
  let hardCats = 0;
  for (const cat of Object.keys(byCat) as EdgeCategory[]) {
    const kinds = byCat[cat];
    if (kinds.length === 0) continue;
    const strengths = kinds.map((k) => EDGE_STRENGTH[k] ?? "soft");
    const best = strengths.reduce<EvidenceStrength>(
      (acc, s) => (strengthRank(s) > strengthRank(acc) ? s : acc),
      "info",
    );
    total += STRENGTH_BASE[best] + (kinds.length - 1) * STRENGTH_BASE[best] * 0.3;
    if (best === "hard") hardCats++;
  }
  const amp = HARD_AMPLIFIER[Math.min(hardCats, HARD_AMPLIFIER.length - 1)];
  return Math.min(100, Math.round(total * amp));
}

function strengthCounts(edgeKinds: string[]): { hard: number; medium: number; soft: number } {
  const c = { hard: 0, medium: 0, soft: 0 };
  for (const k of edgeKinds) {
    const s = EDGE_STRENGTH[k] ?? "soft";
    if (s === "hard") c.hard++;
    else if (s === "medium") c.medium++;
    else if (s === "soft") c.soft++;
  }
  return c;
}

/* --------------------------------------------------------------------- */
/* Helpers                                                               */
/* --------------------------------------------------------------------- */

function sha(s: string): string {
  return crypto.createHash("sha256").update(s).digest("hex");
}
function last4(s: string): string {
  return s.slice(-4);
}
function ipToSubnet(ip: string): string {
  const parts = ip.split(".");
  if (parts.length !== 4) return ip;
  return `${parts[0]}.${parts[1]}.${parts[2]}.0/24`;
}
function pairKey(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

/* --------------------------------------------------------------------- */
/* Ring blueprint                                                        */
/* --------------------------------------------------------------------- */

interface Ring {
  name: string;
  /** How many user slots from the global pool. */
  size: number;
  /** Per-pair edge kinds that EVERY pair in the ring will share. */
  pairKinds: string[];
  /** Per-user payloads to be inserted in the supporting tables. */
  identity?: { docType: string; docNumberRaw: string; country: string };
  payment?: { type: "bank" | "crypto" | "e_wallet"; accountRaw: string; provider: string; currency: string };
  device?: {
    deviceId: string;
    ipAddress: string;
    isp?: string;
    city?: string;
    browserFingerprint?: string;
    mobileAdId?: string;
  };
  /** Override email pattern (for email_pattern_sim demo). */
  emailPattern?: string;
}

const RINGS: Ring[] = [
  {
    name: "α  Identity",
    size: 3,
    pairKinds: ["same_id_document"],
    identity: { docType: "passport", docNumberRaw: "ALPHA-PASS-X91234", country: "CN" },
  },
  {
    name: "β  Payment",
    size: 4,
    pairKinds: ["shared_bank_account"],
    payment: { type: "bank", accountRaw: "6222000000003344", provider: "ICBC", currency: "USD" },
  },
  {
    name: "γ  Device",
    size: 5,
    pairKinds: ["shared_device", "shared_ip", "same_ip_subnet", "same_isp_geo"],
    device: {
      deviceId: "fp_gamma_a1b2c3d4e5f6",
      ipAddress: "178.32.45.67",
      isp: "CT.Net",
      city: "Shenzhen",
      browserFingerprint: "bfp_gamma_xyz789",
    },
  },
  {
    name: "δ  Crypto",
    size: 3,
    pairKinds: ["shared_crypto_wallet"],
    payment: { type: "crypto", accountRaw: "0x3f5DEADBEEF00000000000000000000000008a2b", provider: "USDT-TRC20", currency: "USDT" },
  },
  {
    name: "ε  Mixed",
    size: 4,
    pairKinds: ["same_id_document", "shared_bank_account", "shared_ip", "shared_device", "same_phone"],
    identity: { docType: "id_card", docNumberRaw: "ECHO-ID-3101151985XXXX9012", country: "CN" },
    payment: { type: "bank", accountRaw: "6228480000005555", provider: "CMB", currency: "CNY" },
    device: {
      deviceId: "fp_echo_megaring_001",
      ipAddress: "103.45.67.89",
      isp: "CT.Net",
      city: "Beijing",
      browserFingerprint: "bfp_echo_001",
      mobileAdId: "IDFA-ECHO-7A8B-9012",
    },
  },
  {
    name: "ζ  Soft signals",
    size: 2,
    pairKinds: ["same_ip_subnet", "same_isp_geo"],
    device: {
      deviceId: "fp_zeta_softonly", // unique to each user in this ring
      ipAddress: "203.112.44.55",
      isp: "Telekom",
      city: "Frankfurt",
    },
  },
];

/* --------------------------------------------------------------------- */
/* Main                                                                  */
/* --------------------------------------------------------------------- */

async function main() {
  // Pull a deterministic set of users — sort by id ASC for stability.
  const totalSlots = RINGS.reduce((s, r) => s + r.size, 0);
  const users = await prisma.user.findMany({
    where: { email: { contains: "@" } },
    orderBy: { id: "asc" },
    take: totalSlots,
    select: { id: true, email: true, name: true, phone: true },
  });
  if (users.length < totalSlots) {
    console.error(`Need ${totalSlots} users for seeding, only found ${users.length}. Aborting.`);
    process.exit(1);
  }

  const allUserIds = users.map((u) => u.id);

  // ---------------- Clean prior demo data for these users ----------------
  console.log(`Clearing prior relationship demo rows for ${allUserIds.length} users…`);
  await prisma.$transaction([
    prisma.clientIdentity.deleteMany({ where: { userId: { in: allUserIds } } }),
    prisma.clientPaymentAccount.deleteMany({ where: { userId: { in: allUserIds } } }),
    prisma.clientDevice.deleteMany({
      where: {
        userId: { in: allUserIds },
        OR: [
          { deviceId: { startsWith: "fp_" } },
          { deviceId: { startsWith: "demo_" } },
        ],
      },
    }),
    prisma.clientRelationshipScore.deleteMany({
      where: {
        OR: [
          { userIdA: { in: allUserIds } },
          { userIdB: { in: allUserIds } },
        ],
      },
    }),
  ]);

  // ---------------- Slice users per ring ---------------------------------
  let cursor = 0;
  const ringMembers: { ring: Ring; members: typeof users }[] = [];
  for (const ring of RINGS) {
    ringMembers.push({ ring, members: users.slice(cursor, cursor + ring.size) });
    cursor += ring.size;
  }

  // ---------------- Insert per-ring evidence -----------------------------
  for (const { ring, members } of ringMembers) {
    console.log(`Ring ${ring.name} → ${members.length} users`);

    for (const u of members) {
      // Identity
      if (ring.identity) {
        const docHash = sha(ring.identity.docNumberRaw);
        await prisma.clientIdentity.upsert({
          where: { userId_docType: { userId: u.id, docType: ring.identity.docType } },
          update: {
            docNumberHash: docHash,
            docNumberLast4: last4(ring.identity.docNumberRaw),
            country: ring.identity.country,
          },
          create: {
            userId: u.id,
            docType: ring.identity.docType,
            docNumberHash: docHash,
            docNumberLast4: last4(ring.identity.docNumberRaw),
            country: ring.identity.country,
          },
        });
      }

      // Payment
      if (ring.payment) {
        const accountHash = sha(ring.payment.accountRaw);
        await prisma.clientPaymentAccount.create({
          data: {
            userId: u.id,
            type: ring.payment.type,
            accountHash,
            accountLast4: last4(ring.payment.accountRaw),
            provider: ring.payment.provider,
            currency: ring.payment.currency,
            status: "active",
          },
        });
      }

      // Device — Ring ζ uses unique device IDs per user (only sharing soft IP).
      if (ring.device) {
        const isSoftRing = ring.name.startsWith("ζ");
        const deviceId = isSoftRing
          ? `fp_${ring.name.split(" ")[0]}_${u.id.slice(-6)}`
          : ring.device.deviceId;
        await prisma.clientDevice.create({
          data: {
            userId: u.id,
            ipAddress: ring.device.ipAddress,
            ipSubnet: ipToSubnet(ring.device.ipAddress),
            isp: ring.device.isp ?? null,
            country: ring.device.city ? "CN" : null,
            city: ring.device.city ?? null,
            deviceId,
            browserFingerprint: ring.device.browserFingerprint ?? null,
            mobileAdId: ring.device.mobileAdId ?? null,
            browser: "Chrome 124",
            os: "macOS 14",
            timezone: "Asia/Shanghai",
            sessionsCount: 18,
            isRisky: ring.name.startsWith("ε"),
            isCurrent: true,
          },
        });
      }
    }

    // ---------------- Compute and insert pair-scores --------------------
    const score = pairScore(ring.pairKinds);
    const sc = strengthCounts(ring.pairKinds);
    const edgeKinds = ring.pairKinds.join(",");
    const evidenceJson = JSON.stringify(
      ring.pairKinds.map((k) => ({
        kind: k,
        strength: EDGE_STRENGTH[k] ?? "soft",
        label: `Ring ${ring.name} — ${k}`,
      })),
    );

    for (let i = 0; i < members.length; i++) {
      for (let j = i + 1; j < members.length; j++) {
        const [a, b] = pairKey(members[i].id, members[j].id);
        await prisma.clientRelationshipScore.upsert({
          where: { userIdA_userIdB: { userIdA: a, userIdB: b } },
          update: {
            totalScore: score,
            hardCount: sc.hard,
            mediumCount: sc.medium,
            softCount: sc.soft,
            edgeKinds,
            evidenceJson,
            calculatedAt: new Date(),
          },
          create: {
            userIdA: a,
            userIdB: b,
            totalScore: score,
            hardCount: sc.hard,
            mediumCount: sc.medium,
            softCount: sc.soft,
            edgeKinds,
            evidenceJson,
          },
        });
      }
    }
  }

  // ---------------- Print a quick summary --------------------------------
  console.log("\nSeed complete. Ring summary:");
  for (const { ring, members } of ringMembers) {
    const sc = strengthCounts(ring.pairKinds);
    console.log(
      `  ${ring.name.padEnd(18)}  size=${ring.size}  score=${pairScore(ring.pairKinds)}  ` +
        `(HARD=${sc.hard}  MED=${sc.medium}  SOFT=${sc.soft})  ` +
        `members=${members.map((m) => m.id.slice(-6)).join(",")}`,
    );
  }

  const totalScores = await prisma.clientRelationshipScore.count();
  console.log(`\nclient_relationship_scores rows: ${totalScores}`);
  const totalIdentities = await prisma.clientIdentity.count();
  const totalPayments = await prisma.clientPaymentAccount.count();
  console.log(`client_identities rows: ${totalIdentities}`);
  console.log(`client_payment_accounts rows: ${totalPayments}`);

  // Suggest a center client to inspect
  const centerCandidate = ringMembers.find((r) => r.ring.name.startsWith("ε"))?.members[0];
  if (centerCandidate) {
    console.log(
      `\nTry: /crm/clients/relationships?clientId=${centerCandidate.id}  ` +
        `(Ring ε center — should show all 6 categories lit up)`,
    );
    console.log(`Or:  /crm/clients/clusters  (should list ${RINGS.length} clusters)`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
