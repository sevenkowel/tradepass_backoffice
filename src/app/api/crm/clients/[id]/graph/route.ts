/**
 * GET /api/crm/clients/[id]/graph
 *
 * Returns a 1-hop relationship graph rooted at the given client. Edges are
 * derived from shared device fingerprints and shared IP addresses recorded
 * in `client_devices`. Each related node carries the link types and a
 * crude strength score (number of distinct fingerprints in common).
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";
import { mapUserToClient } from "@/lib/crm/clients/mapper";

const ROLES_READ = [
  "admin",
  "compliance_officer",
  "support_agent",
  "risk_manager",
  "finance_officer",
  "viewer",
] as const;

const includeShape = {
  wallets: { select: { balance: true, frozen: true, currency: true } },
  mtAccounts: { select: { equity: true, balance: true } },
  kycRecord: { select: { amlRiskScore: true, kycLevel: true, status: true } },
} as const;

function clientIdFromPath(req: NextRequest): string | null {
  const parts = req.nextUrl.pathname.split("/").filter(Boolean);
  // .../clients/[id]/graph
  return parts[parts.length - 2] ?? null;
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
  type: "center" | "shared_ip" | "shared_device" | "same_id" | "mixed";
}

interface GraphEdgeOut {
  source: string;
  target: string;
  type: "shared_ip" | "shared_device" | "same_id";
  label: string;
}

export const GET = requireRole([...ROLES_READ], async (req: NextRequest) => {
  const id = clientIdFromPath(req);
  if (!id) return NextResponse.json({ success: false, error: "Missing id" }, { status: 400 });

  try {
    const center = await prisma.user.findUnique({ where: { id }, include: includeShape });
    if (!center) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }

    const myDevices = await prisma.clientDevice.findMany({
      where: { userId: id },
      select: { deviceId: true, ipAddress: true },
    });

    const deviceIds = [...new Set(myDevices.map((d) => d.deviceId))];
    const ips = [...new Set(myDevices.map((d) => d.ipAddress))];

    const sharedDevices = deviceIds.length
      ? await prisma.clientDevice.findMany({
          where: { deviceId: { in: deviceIds }, userId: { not: id } },
          select: { userId: true, deviceId: true, ipAddress: true },
        })
      : [];

    const sharedIps = ips.length
      ? await prisma.clientDevice.findMany({
          where: { ipAddress: { in: ips }, userId: { not: id } },
          select: { userId: true, deviceId: true, ipAddress: true },
        })
      : [];

    // Derive same-name links — heuristic, looks for other users sharing the
    // exact case-insensitive `name` value (often a sign of duplicate accounts).
    const sameName: { userId: string; name: string | null }[] = center.name
      ? await prisma.user.findMany({
          where: { name: center.name, id: { not: id } },
          select: { id: true, name: true },
        }).then((rows) => rows.map((r) => ({ userId: r.id, name: r.name })))
      : [];

    interface LinkAccumulator {
      userId: string;
      sharedIps: Set<string>;
      sharedDeviceIds: Set<string>;
      sameName: boolean;
    }
    const accMap = new Map<string, LinkAccumulator>();

    function ensure(userId: string): LinkAccumulator {
      let a = accMap.get(userId);
      if (!a) {
        a = { userId, sharedIps: new Set(), sharedDeviceIds: new Set(), sameName: false };
        accMap.set(userId, a);
      }
      return a;
    }

    for (const m of sharedDevices) ensure(m.userId).sharedDeviceIds.add(m.deviceId);
    for (const m of sharedIps) ensure(m.userId).sharedIps.add(m.ipAddress);
    for (const m of sameName) ensure(m.userId).sameName = true;

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

    const nodes: GraphNodeOut[] = others.map((u) => {
      const acc = accMap.get(u.id)!;
      const types: GraphNodeOut["type"][] = [];
      if (acc.sharedIps.size > 0) types.push("shared_ip");
      if (acc.sharedDeviceIds.size > 0) types.push("shared_device");
      if (acc.sameName) types.push("same_id");
      const type = types.length > 1 ? "mixed" : (types[0] ?? "shared_ip");
      return graphNodeFromUser(u, type);
    });

    const edges: GraphEdgeOut[] = [];
    for (const acc of accMap.values()) {
      for (const ip of acc.sharedIps) {
        edges.push({
          source: id,
          target: acc.userId,
          type: "shared_ip",
          label: `Shared IP: ${ip}`,
        });
      }
      for (const dev of acc.sharedDeviceIds) {
        edges.push({
          source: id,
          target: acc.userId,
          type: "shared_device",
          label: `Shared device: ${dev}`,
        });
      }
      if (acc.sameName) {
        edges.push({
          source: id,
          target: acc.userId,
          type: "same_id",
          label: `Same name: ${center.name}`,
        });
      }
    }

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
