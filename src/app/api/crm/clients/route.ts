import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";
import { mapUserToClient, buildUserWhere } from "@/lib/crm/clients/mapper";
import type { Prisma } from "@prisma/client";

export const GET = requireRole(
  ["admin", "compliance_officer", "support_agent", "risk_manager", "finance_officer", "viewer"],
  async (req: NextRequest) => {
    const { searchParams } = new URL(req.url);

    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || "20", 10)));

    const minAccount = searchParams.get("minAccountCount");
    const maxAccount = searchParams.get("maxAccountCount");

    // Multi-select country: client sends comma-separated, server parses to array.
    const rawCountry = searchParams.get("country");
    const countries = rawCountry
      ? rawCountry.split(",").map((c) => c.trim().toUpperCase()).filter(Boolean)
      : undefined;

    const where = buildUserWhere({
      search: searchParams.get("search") || undefined,
      status: searchParams.get("status") || undefined,
      kycStatus: searchParams.get("kycStatus") || undefined,
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      // v3 — direct filters on the User table
      country: countries,
      role: searchParams.get("role") || undefined,
      minAccountCount: minAccount ? Number(minAccount) : undefined,
      maxAccountCount: maxAccount ? Number(maxAccount) : undefined,
    });

    const sortBy = searchParams.get("sortBy");
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";
    const orderBy: Prisma.UserOrderByWithRelationInput =
      sortBy === "name" || sortBy === "email"
        ? { [sortBy]: sortOrder }
        : { createdAt: sortOrder };

    try {
      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          orderBy,
          skip: (page - 1) * pageSize,
          take: pageSize,
          include: {
            wallets: { select: { balance: true, frozen: true, currency: true } },
            mtAccounts: { select: { equity: true, balance: true } },
            kycRecord: { select: { amlRiskScore: true, kycLevel: true, status: true } },
          },
        }),
        prisma.user.count({ where }),
      ]);

      // Optional in-memory filters that depend on derived/related fields.
      // We keep these here because Prisma SQLite can't compose them all in
      // one `where` cleanly (account-count range is best post-mapped, and
      // tag filtering requires a join against the tag-assignment table).
      const levelFilter = searchParams.get("level");
      const riskFilter = searchParams.get("riskLevel");
      const lifecycleFilter = searchParams.get("lifecycleStage");
      const tagFilter = searchParams.get("tag");
      const minAccountCount = minAccount ? Number(minAccount) : undefined;
      const maxAccountCount = maxAccount ? Number(maxAccount) : undefined;

      let items = users.map(mapUserToClient);

      if (levelFilter) items = items.filter((c) => c.level === levelFilter);
      if (riskFilter) items = items.filter((c) => c.riskLevel === riskFilter);
      if (lifecycleFilter) items = items.filter((c) => c.lifecycleStage === lifecycleFilter);
      if (minAccountCount != null) items = items.filter((c) => (c.accountCount ?? 0) >= minAccountCount);
      if (maxAccountCount != null) items = items.filter((c) => (c.accountCount ?? 0) <= maxAccountCount);

      // Tag filter — fetch the assignment set in one query and intersect with the
      // current page's IDs. Cheap because we're already paged.
      if (tagFilter && items.length > 0) {
        const allowedIds = await safeFindUserIdsWithTag(tagFilter, items.map((c) => c.id));
        const allow = new Set(allowedIds);
        items = items.filter((c) => allow.has(c.id));
      }

      return NextResponse.json({ success: true, items, total, page, pageSize });
    } catch (error) {
      console.error("GET /api/crm/clients failed:", error);
      return NextResponse.json(
        { success: false, error: "Failed to load clients" },
        { status: 500 }
      );
    }
  }
);

/** Fetch user ids that have an assignment to the named tag, scoped to the
 *  given candidate id list. Returns [] on missing-table errors so the
 *  endpoint stays functional before the migration is applied. */
async function safeFindUserIdsWithTag(
  tagName: string,
  candidateIds: string[]
): Promise<string[]> {
  try {
    const tag = await prisma.clientTag.findUnique({
      where: { name: tagName },
      select: { id: true },
    });
    if (!tag) return [];
    const rows = await prisma.clientTagAssignment.findMany({
      where: { tagId: tag.id, userId: { in: candidateIds } },
      select: { userId: true },
    });
    return rows.map((r) => r.userId);
  } catch {
    return [];
  }
}
