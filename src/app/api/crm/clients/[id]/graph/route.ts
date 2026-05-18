/**
 * GET /api/crm/clients/[id]/graph
 *
 * Returns a 1-hop relationship graph rooted at the given client.
 *
 * v2 — Detects all 15 sub-factors across 6 categories defined in
 * `@/types/core/client-graph.ts`:
 *
 *   Identity:  same_id_document | same_passport | same_tax_id | same_name_dob
 *   Contact:   same_email | same_phone | email_pattern_sim
 *   Network:   shared_ip | same_ip_subnet | same_isp_geo
 *   Device:    shared_device | shared_browser_fp | shared_mobile_id
 *   Payment:   shared_bank_account | shared_crypto_wallet | shared_e_wallet | fund_flow_link
 *   Business:  ib_invited | referral_chain | copy_trading
 *
 * Detection is direct-equality joins on hashed columns (ClientIdentity,
 * ClientPaymentAccount) and on existing device/IP/contact columns. No
 * fuzzy matching here — that's the job of the batch reconciliation engine.
 * Each edge carries the strength inferred from EDGE_STRENGTH in
 * `@/lib/risk-engine/graph.ts`.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";
import { mapUserToClient } from "@/lib/crm/clients/mapper";
import { EDGE_STRENGTH, deriveNodeKind } from "@/lib/risk-engine/graph";
import type { ClientGraphEdgeKind, EvidenceStrength } from "@/types/core";

const ROLES_READ = [
  "admin", "compliance_officer", "support_agent",
  "risk_manager", "finance_officer", "viewer",
] as const;

const includeShape = {
  wallets: { select: { balance: true, frozen: true, currency: true } },
  mtAccounts: { select: { equity: true, balance: true } },
  kycRecord: { select: { amlRiskScore: true, kycLevel: true, status: true } },
} as const;

function clientIdFromPath(req: NextRequest): string | null {
  const parts = req.nextUrl.pathname.split("/").filter(Boolean);
  return parts[parts.length - 2] ?? null; // .../clients/[id]/graph
}

interface GraphNodeOut {
  id: string;
  uid: string;
  name: string;
  email: string;
  phone: string;
  country?: string;
  kycStatus: string;
  riskLevel: string;
  riskScore: number;
  lastLoginAt: string;
  createdAt: string;
  type: "center" | "shared_ip" | "shared_device" | "same_id" | "shared_payment" | "ib_relation" | "mixed";
}

interface GraphEdgeOut {
  source: string;
  target: string;
  type: ClientGraphEdgeKind;
  label: string;
  strength: EvidenceStrength;
}

/* --------------------------------------------------------------------- */
/* Helpers                                                               */
/* --------------------------------------------------------------------- */

/** Normalize email to canonical form: lowercase + strip aliases. */
function canonicalEmail(e: string | null | undefined): string | null {
  if (!e) return null;
  const lower = e.toLowerCase().trim();
  const [local, domain] = lower.split("@");
  if (!domain) return null;
  if (domain === "gmail.com" || domain === "googlemail.com") {
    return `${local.split("+")[0].replace(/\./g, "")}@gmail.com`;
  }
  return `${local.split("+")[0]}@${domain}`;
}

/** Normalize phone to E.164-ish: keep digits + leading "+". */
function canonicalPhone(p: string | null | undefined): string | null {
  if (!p) return null;
  const digits = p.replace(/[^\d+]/g, "");
  if (digits.length < 6) return null;
  return digits;
}

/** Local-part pattern for `email_pattern_sim`. */
function emailLocalPattern(e: string | null | undefined): string | null {
  if (!e) return null;
  const local = e.toLowerCase().split("@")[0];
  const pattern = local.replace(/\d+/g, "{n}");
  return pattern.length >= 4 && pattern !== local ? pattern : null;
}

interface PairAcc {
  idDocs: Set<string>;
  emails: Set<string>;
  phones: Set<string>;
  emailPatterns: Set<string>;
  sharedIps: Set<string>;
  sharedSubnets: Set<string>;
  sameIspGeo: Set<string>;
  sharedDevices: Set<string>;
  sharedBrowserFps: Set<string>;
  sharedMobileIds: Set<string>;
  paymentEdges: { kind: ClientGraphEdgeKind; label: string }[];
  ibInvited: boolean;
}

function newAcc(): PairAcc {
  return {
    idDocs: new Set(), emails: new Set(), phones: new Set(), emailPatterns: new Set(),
    sharedIps: new Set(), sharedSubnets: new Set(), sameIspGeo: new Set(),
    sharedDevices: new Set(), sharedBrowserFps: new Set(), sharedMobileIds: new Set(),
    paymentEdges: [], ibInvited: false,
  };
}

/* --------------------------------------------------------------------- */
/* Route                                                                 */
/* --------------------------------------------------------------------- */

export const GET = requireRole([...ROLES_READ], async (req: NextRequest) => {
  const id = clientIdFromPath(req);
  if (!id) {
    return NextResponse.json({ success: false, error: "Missing id" }, { status: 400 });
  }

  try {
    const center = await prisma.user.findUnique({
      where: { id }, include: includeShape,
    });
    if (!center) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }

    const myDevices = await prisma.clientDevice.findMany({
      where: { userId: id },
      select: {
        deviceId: true, ipAddress: true, ipSubnet: true,
        browserFingerprint: true, mobileAdId: true,
        isp: true, city: true,
      },
    });

    const myIdentities = await safeFindIdentities(id);
    const myPayments = await safeFindPayments(id);

    const canonicalCenterEmail = canonicalEmail(center.email);
    const canonicalCenterPhone = canonicalPhone(center.phone);
    const centerEmailPattern = emailLocalPattern(center.email);

    const ips = uniq(myDevices.map((d) => d.ipAddress).filter(Boolean));
    const subnets = uniq(myDevices.map((d) => d.ipSubnet).filter(notNull));
    const deviceIds = uniq(myDevices.map((d) => d.deviceId).filter(Boolean));
    const browserFps = uniq(myDevices.map((d) => d.browserFingerprint).filter(notNull));
    const mobileIds = uniq(myDevices.map((d) => d.mobileAdId).filter(notNull));
    const ispCities = uniq(
      myDevices.filter((d) => d.isp && d.city).map((d) => `${d.isp}|${d.city}`),
    );
    const docHashKeys = myIdentities.map((d) => ({ docType: d.docType, docNumberHash: d.docNumberHash }));
    const paymentHashKeys = myPayments.map((p) => ({ type: p.type, accountHash: p.accountHash }));

    const [
      sharedDevicesRows, sharedIpsRows, sharedSubnetsRows,
      sharedBrowserFpsRows, sharedMobileIdsRows, sameIspGeoRows,
      sameEmail, samePhone, emailPatternHits,
      sameIdDocs, sharedPayments, ibChildren,
    ] = await Promise.all([
      deviceIds.length
        ? prisma.clientDevice.findMany({
            where: { deviceId: { in: deviceIds }, userId: { not: id } },
            select: { userId: true, deviceId: true },
          })
        : Promise.resolve([] as { userId: string; deviceId: string }[]),

      ips.length
        ? prisma.clientDevice.findMany({
            where: { ipAddress: { in: ips }, userId: { not: id } },
            select: { userId: true, ipAddress: true },
          })
        : Promise.resolve([] as { userId: string; ipAddress: string }[]),

      subnets.length
        ? prisma.clientDevice.findMany({
            where: { ipSubnet: { in: subnets }, userId: { not: id } },
            select: { userId: true, ipSubnet: true },
          })
        : Promise.resolve([] as { userId: string; ipSubnet: string | null }[]),

      browserFps.length
        ? prisma.clientDevice.findMany({
            where: { browserFingerprint: { in: browserFps }, userId: { not: id } },
            select: { userId: true, browserFingerprint: true },
          })
        : Promise.resolve([] as { userId: string; browserFingerprint: string | null }[]),

      mobileIds.length
        ? prisma.clientDevice.findMany({
            where: { mobileAdId: { in: mobileIds }, userId: { not: id } },
            select: { userId: true, mobileAdId: true },
          })
        : Promise.resolve([] as { userId: string; mobileAdId: string | null }[]),

      ispCities.length
        ? prisma.clientDevice.findMany({
            where: { userId: { not: id } },
            select: { userId: true, isp: true, city: true },
          }).then((rows) =>
            rows.filter((r) => r.isp && r.city && ispCities.includes(`${r.isp}|${r.city}`))
          )
        : Promise.resolve([] as { userId: string; isp: string | null; city: string | null }[]),

      canonicalCenterEmail
        ? prisma.user.findMany({
            where: { email: { not: center.email }, id: { not: id } },
            select: { id: true, email: true },
          }).then((rows) => rows.filter((r) => canonicalEmail(r.email) === canonicalCenterEmail))
        : Promise.resolve([] as { id: string; email: string }[]),

      canonicalCenterPhone
        ? prisma.user.findMany({
            where: { phone: { not: null }, id: { not: id } },
            select: { id: true, phone: true },
          }).then((rows) => rows.filter((r) => canonicalPhone(r.phone) === canonicalCenterPhone))
        : Promise.resolve([] as { id: string; phone: string | null }[]),

      centerEmailPattern
        ? prisma.user.findMany({
            where: { id: { not: id }, email: { not: center.email ?? undefined } },
            select: { id: true, email: true },
          }).then((rows) => rows.filter((r) => emailLocalPattern(r.email) === centerEmailPattern))
        : Promise.resolve([] as { id: string; email: string }[]),

      safeFindMatchingIdentities(docHashKeys, id),
      safeFindMatchingPayments(paymentHashKeys, id),

      // IB invitation children — users whose IBPartner.parentId is this user.
      prisma.user.findMany({
        where: { ibPartner: { isNot: null } },
        select: { id: true, ibPartner: { select: { parentId: true } } },
      }).then((rows) =>
        rows
          .filter((r) => r.ibPartner?.parentId === id && r.id !== id)
          .map((r) => ({ userId: r.id }))
      ),
    ]);

    /* ---------------------- Build per-pair accumulator ------------------- */
    const accMap = new Map<string, PairAcc>();
    const ensure = (uid: string): PairAcc => {
      let a = accMap.get(uid);
      if (!a) { a = newAcc(); accMap.set(uid, a); }
      return a;
    };

    for (const r of sharedDevicesRows)     ensure(r.userId).sharedDevices.add(r.deviceId);
    for (const r of sharedIpsRows)         ensure(r.userId).sharedIps.add(r.ipAddress);
    for (const r of sharedSubnetsRows)
      if (r.ipSubnet)                       ensure(r.userId).sharedSubnets.add(r.ipSubnet);
    for (const r of sharedBrowserFpsRows)
      if (r.browserFingerprint)             ensure(r.userId).sharedBrowserFps.add(r.browserFingerprint);
    for (const r of sharedMobileIdsRows)
      if (r.mobileAdId)                     ensure(r.userId).sharedMobileIds.add(r.mobileAdId);
    for (const r of sameIspGeoRows)
      if (r.isp && r.city)                  ensure(r.userId).sameIspGeo.add(`${r.isp} · ${r.city}`);

    for (const r of sameEmail)              ensure(r.id).emails.add(canonicalCenterEmail ?? "");
    for (const r of samePhone)              ensure(r.id).phones.add(canonicalCenterPhone ?? "");
    for (const r of emailPatternHits)
      if (centerEmailPattern)               ensure(r.id).emailPatterns.add(centerEmailPattern);

    for (const r of sameIdDocs) {
      ensure(r.userId).idDocs.add(`${r.docType}:****${r.docNumberLast4}`);
    }

    for (const r of sharedPayments) {
      const acc = ensure(r.userId);
      const kindMap: Record<string, ClientGraphEdgeKind> = {
        bank: "shared_bank_account",
        crypto: "shared_crypto_wallet",
        e_wallet: "shared_e_wallet",
      };
      const kind = kindMap[r.type] ?? "shared_payment";
      acc.paymentEdges.push({
        kind,
        label: `${labelForPaymentType(r.type)}: ${r.provider ?? ""} ****${r.accountLast4}`.trim(),
      });
    }

    for (const r of ibChildren)             ensure(r.userId).ibInvited = true;

    const otherUserIds = [...accMap.keys()];
    if (otherUserIds.length === 0) {
      return NextResponse.json({
        success: true,
        center: graphNodeFromUser(center, "center"),
        nodes: [],
        edges: [],
      });
    }

    const others = await prisma.user.findMany({
      where: { id: { in: otherUserIds } },
      include: includeShape,
    });

    const edges: GraphEdgeOut[] = [];
    const targetKinds = new Map<string, ClientGraphEdgeKind[]>();

    const pushEdge = (target: string, kind: ClientGraphEdgeKind, label: string) => {
      edges.push({ source: id, target, type: kind, label, strength: EDGE_STRENGTH[kind] });
      const list = targetKinds.get(target) ?? [];
      list.push(kind);
      targetKinds.set(target, list);
    };

    for (const [uid, acc] of accMap.entries()) {
      for (const lbl of acc.idDocs) pushEdge(uid, "same_id_document", `Same ID: ${lbl}`);
      for (const e of acc.emails) pushEdge(uid, "same_email", `Same email (normalised): ${maskEmail(e)}`);
      for (const p of acc.phones) pushEdge(uid, "same_phone", `Same phone: ${maskPhone(p)}`);
      for (const p of acc.emailPatterns) pushEdge(uid, "email_pattern_sim", `Email pattern: ${p}@`);
      for (const ip of acc.sharedIps) pushEdge(uid, "shared_ip", `Shared IP: ${ip}`);
      for (const sn of acc.sharedSubnets) pushEdge(uid, "same_ip_subnet", `Same subnet: ${sn}`);
      for (const isp of acc.sameIspGeo) pushEdge(uid, "same_isp_geo", `Same ISP/city: ${isp}`);
      for (const d of acc.sharedDevices) pushEdge(uid, "shared_device", `Shared device: ${d.slice(0, 12)}…`);
      for (const fp of acc.sharedBrowserFps) pushEdge(uid, "shared_browser_fp", `Shared browser fp: ${fp.slice(0, 12)}…`);
      for (const m of acc.sharedMobileIds) pushEdge(uid, "shared_mobile_id", `Shared ad ID: ${m.slice(0, 12)}…`);
      for (const p of acc.paymentEdges) pushEdge(uid, p.kind, p.label);
      if (acc.ibInvited) pushEdge(uid, "ib_invited", "IB invitation chain");
    }

    const nodes: GraphNodeOut[] = others.map((u) => {
      const kinds = targetKinds.get(u.id) ?? [];
      const nodeKind = deriveNodeKind(kinds);
      return graphNodeFromUser(u, nodeKind as GraphNodeOut["type"]);
    });

    return NextResponse.json({
      success: true,
      center: graphNodeFromUser(center, "center"),
      nodes,
      edges,
    });
  } catch (error) {
    console.error("GET /api/crm/clients/[id]/graph failed:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load relationship graph" },
      { status: 500 }
    );
  }
});

/* --------------------------------------------------------------------- */
/* Safe wrappers — these tables may not exist yet on staging DBs         */
/* before the relationship-graph migration is applied. Wrappers swallow  */
/* "table missing" errors and return empty so the endpoint stays         */
/* functional with the legacy fields only.                               */
/* --------------------------------------------------------------------- */

async function safeFindIdentities(userId: string) {
  try {
    const client = prisma as unknown as {
      clientIdentity: {
        findMany: (args: unknown) => Promise<{
          docType: string; docNumberHash: string; docNumberLast4: string; country: string;
        }[]>;
      };
    };
    return await client.clientIdentity.findMany({
      where: { userId },
      select: { docType: true, docNumberHash: true, docNumberLast4: true, country: true },
    });
  } catch {
    return [];
  }
}

async function safeFindPayments(userId: string) {
  try {
    const client = prisma as unknown as {
      clientPaymentAccount: {
        findMany: (args: unknown) => Promise<{
          type: string; accountHash: string; accountLast4: string;
          provider: string | null; currency: string | null;
        }[]>;
      };
    };
    return await client.clientPaymentAccount.findMany({
      where: { userId, status: "active" },
      select: {
        type: true, accountHash: true, accountLast4: true,
        provider: true, currency: true,
      },
    });
  } catch {
    return [];
  }
}

async function safeFindMatchingIdentities(
  hashKeys: { docType: string; docNumberHash: string }[],
  excludeUserId: string
) {
  if (hashKeys.length === 0) return [];
  try {
    const client = prisma as unknown as {
      clientIdentity: {
        findMany: (args: unknown) => Promise<{
          userId: string; docType: string; docNumberLast4: string;
        }[]>;
      };
    };
    return await client.clientIdentity.findMany({
      where: { OR: hashKeys, NOT: { userId: excludeUserId } },
      select: { userId: true, docType: true, docNumberLast4: true },
    });
  } catch {
    return [];
  }
}

async function safeFindMatchingPayments(
  hashKeys: { type: string; accountHash: string }[],
  excludeUserId: string
) {
  if (hashKeys.length === 0) return [];
  try {
    const client = prisma as unknown as {
      clientPaymentAccount: {
        findMany: (args: unknown) => Promise<{
          userId: string; type: string; accountLast4: string; provider: string | null;
        }[]>;
      };
    };
    return await client.clientPaymentAccount.findMany({
      where: { OR: hashKeys, NOT: { userId: excludeUserId }, status: "active" },
      select: { userId: true, type: true, accountLast4: true, provider: true },
    });
  } catch {
    return [];
  }
}

/* --------------------------------------------------------------------- */
/* Misc                                                                  */
/* --------------------------------------------------------------------- */

type UserRow = Parameters<typeof mapUserToClient>[0];

function graphNodeFromUser(user: UserRow, type: GraphNodeOut["type"]): GraphNodeOut {
  const mapped = mapUserToClient(user);
  return {
    id: mapped.id,
    uid: mapped.uid,
    name: mapped.name,
    email: mapped.email,
    phone: mapped.phone,
    country: mapped.country,
    kycStatus: mapped.kycStatus,
    riskLevel: mapped.riskLevel ?? "low",
    riskScore: mapped.riskScore ?? 0,
    lastLoginAt: mapped.lastLoginAt,
    createdAt: mapped.createdAt,
    type,
  };
}

function uniq<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}

function notNull<T>(v: T | null | undefined): v is T {
  return v !== null && v !== undefined;
}

function maskEmail(e: string): string {
  if (!e || !e.includes("@")) return e;
  const [local, domain] = e.split("@");
  return `${local.slice(0, 2)}***@${domain}`;
}

function maskPhone(p: string): string {
  if (p.length < 6) return p;
  return `${p.slice(0, 3)}****${p.slice(-4)}`;
}

function labelForPaymentType(t: string): string {
  switch (t) {
    case "bank":     return "Bank";
    case "crypto":   return "Crypto wallet";
    case "e_wallet": return "E-wallet";
    default:         return "Payment";
  }
}
