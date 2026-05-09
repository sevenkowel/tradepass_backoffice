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
  return parts[parts.length - 2] ?? null;
}

/**
 * Surface clients linked by shared device fingerprint or shared IP.
 * This is a simple heuristic — Phase E should add bank/wallet linkage.
 */
export const GET = requireRole([...ROLES_READ], async (req: NextRequest) => {
  const id = clientIdFromPath(req);
  if (!id) return NextResponse.json({ success: false, error: "Missing id" }, { status: 400 });

  try {
    const myDevices = await prisma.clientDevice.findMany({
      where: { userId: id },
      select: { deviceId: true, ipAddress: true },
    });
    if (myDevices.length === 0) {
      return NextResponse.json({ success: true, items: [] });
    }
    const deviceIds = [...new Set(myDevices.map((d) => d.deviceId))];
    const ips = [...new Set(myDevices.map((d) => d.ipAddress))];

    const matches = await prisma.clientDevice.findMany({
      where: {
        OR: [{ deviceId: { in: deviceIds } }, { ipAddress: { in: ips } }],
        userId: { not: id },
      },
      select: { userId: true, deviceId: true, ipAddress: true },
    });

    if (matches.length === 0) {
      return NextResponse.json({ success: true, items: [] });
    }

    // Group by other-user, collect link types
    const linkMap = new Map<string, { sharedDevice: boolean; sharedIp: boolean }>();
    for (const m of matches) {
      const cur = linkMap.get(m.userId) ?? { sharedDevice: false, sharedIp: false };
      if (deviceIds.includes(m.deviceId)) cur.sharedDevice = true;
      if (ips.includes(m.ipAddress)) cur.sharedIp = true;
      linkMap.set(m.userId, cur);
    }

    const otherUserIds = [...linkMap.keys()];
    const users = await prisma.user.findMany({
      where: { id: { in: otherUserIds } },
      include: includeShape,
    });

    const items = users.map((u) => {
      const link = linkMap.get(u.id)!;
      const types: string[] = [];
      if (link.sharedDevice) types.push("shared_device");
      if (link.sharedIp) types.push("shared_ip");
      return {
        ...mapUserToClient(u),
        relationship: { types, strength: types.length === 2 ? 90 : 60 },
      };
    });

    return NextResponse.json({ success: true, items });
  } catch (error) {
    console.error("GET related clients failed:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load related clients" },
      { status: 500 }
    );
  }
});
