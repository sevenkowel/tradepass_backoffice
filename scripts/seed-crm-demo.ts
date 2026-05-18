/**
 * Seed CRM demo data: tags, notes, devices, agreements, cases, tickets,
 * timeline events, audit logs — attached to two existing demo users.
 *
 * Usage:  npx tsx scripts/seed-crm-demo.ts
 *
 * Idempotent — safe to re-run; existing rows for these users get cleared first.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const TARGET_EMAILS = ["demo.kyc.1@tradepass.local", "demo.kyc.2@tradepass.local"];

const TAGS: { name: string; color: string; description: string; isSystem: boolean }[] = [
  { name: "VIP", color: "#facc15", description: "High-value clients", isSystem: true },
  { name: "High Value", color: "#10b981", description: "Net deposit > $50k", isSystem: true },
  { name: "At Risk", color: "#f59e0b", description: "Behavior anomaly detected", isSystem: true },
  { name: "Active Trader", color: "#3b82f6", description: "Recent trading activity", isSystem: true },
  { name: "New", color: "#a78bfa", description: "Registered in last 30 days", isSystem: true },
];

async function main() {
  const users = await prisma.user.findMany({ where: { email: { in: TARGET_EMAILS } } });
  if (users.length === 0) {
    console.error("No target users found — expected demo.kyc.1@tradepass.local etc.");
    process.exit(1);
  }

  for (const t of TAGS) {
    await prisma.clientTag.upsert({
      where: { name: t.name },
      update: { color: t.color, description: t.description, isSystem: t.isSystem },
      create: t,
    });
  }
  const allTags = await prisma.clientTag.findMany();

  for (const u of users) {
    await prisma.$transaction([
      prisma.clientTagAssignment.deleteMany({ where: { userId: u.id } }),
      prisma.clientNote.deleteMany({ where: { userId: u.id } }),
      prisma.clientDevice.deleteMany({ where: { userId: u.id } }),
      prisma.clientAgreement.deleteMany({ where: { userId: u.id } }),
      prisma.crmCase.deleteMany({ where: { userId: u.id } }),
      prisma.crmTicket.deleteMany({ where: { userId: u.id } }),
      prisma.crmTimelineEvent.deleteMany({ where: { userId: u.id } }),
      prisma.crmAuditLog.deleteMany({ where: { userId: u.id } }),
    ]);

    await prisma.clientTagAssignment.createMany({
      data: [
        { userId: u.id, tagId: allTags[0].id, assignedBy: "system" },
        { userId: u.id, tagId: allTags[3].id, assignedBy: "system" },
      ],
    });

    await prisma.clientNote.createMany({
      data: [
        {
          userId: u.id,
          authorId: "staff-001",
          authorName: "Alice Chen",
          content: "Initial onboarding call completed. Client is comfortable with platform.",
          mentions: "[]",
          isPinned: true,
          noteType: "general",
        },
        {
          userId: u.id,
          authorId: "staff-002",
          authorName: "Bob Martin",
          content: "Followup deposit reminder scheduled for next week.",
          mentions: "[]",
          isPinned: false,
          noteType: "followup",
        },
      ],
    });

    await prisma.clientDevice.createMany({
      data: [
        {
          userId: u.id,
          ipAddress: "203.0.113.42",
          country: "US",
          city: "San Francisco",
          deviceId: "dev-mac-001",
          browser: "Chrome 124",
          os: "macOS 14",
          timezone: "America/Los_Angeles",
          isRisky: false,
          isCurrent: true,
        },
        {
          userId: u.id,
          ipAddress: "198.51.100.7",
          country: "GB",
          city: "London",
          deviceId: "dev-ios-002",
          browser: "Safari Mobile 17",
          os: "iOS 17",
          timezone: "Europe/London",
          isRisky: true,
          isCurrent: false,
        },
      ],
    });

    await prisma.clientAgreement.createMany({
      data: [
        {
          userId: u.id,
          agreementType: "Terms of Service",
          version: "v2.3",
          signedAt: new Date(Date.now() - 90 * 24 * 3600_000),
          signedIp: "203.0.113.42",
          pdfUrl: "/legal/tos-v2.3.pdf",
          status: "signed",
        },
        {
          userId: u.id,
          agreementType: "Risk Disclosure",
          version: "v1.7",
          signedAt: new Date(Date.now() - 90 * 24 * 3600_000),
          signedIp: "203.0.113.42",
          pdfUrl: "/legal/risk-v1.7.pdf",
          status: "signed",
        },
      ],
    });

    await prisma.crmCase.create({
      data: {
        caseId: `CASE-${u.id.slice(-4).toUpperCase()}-001`,
        userId: u.id,
        type: "kyc_review",
        status: "in_review",
        priority: "high",
        sla: "PT24H",
        reviewerId: "staff-001",
        comments: JSON.stringify([
          {
            id: "c1",
            author: "Alice Chen",
            content: "Document quality acceptable, awaiting AML check.",
            createdAt: new Date(Date.now() - 2 * 3600_000).toISOString(),
          },
        ]),
      },
    });

    await prisma.crmTicket.create({
      data: {
        ticketId: `T-${u.id.slice(-4).toUpperCase()}-001`,
        userId: u.id,
        type: "withdrawal",
        status: "in_progress",
        priority: "medium",
        subject: "Withdrawal not received in bank account",
        assignedToId: "staff-002",
        messages: JSON.stringify([
          {
            id: "m1",
            author: u.name ?? "Client",
            isStaff: false,
            content: "I requested a withdrawal 3 days ago and it has not arrived.",
            createdAt: new Date(Date.now() - 24 * 3600_000).toISOString(),
          },
          {
            id: "m2",
            author: "Bob Martin",
            isStaff: true,
            content: "Checking with our payment provider — will update by EOD.",
            createdAt: new Date(Date.now() - 12 * 3600_000).toISOString(),
          },
        ]),
      },
    });

    const now = Date.now();
    await prisma.crmTimelineEvent.createMany({
      data: [
        {
          userId: u.id,
          type: "registered",
          title: "Account registered",
          description: "Client signed up via web portal.",
          createdAt: u.createdAt,
        },
        {
          userId: u.id,
          type: "agreement_signed",
          title: "Signed Terms of Service v2.3",
          createdAt: new Date(now - 90 * 24 * 3600_000),
        },
        {
          userId: u.id,
          type: "kyc_submitted",
          title: "Submitted KYC documents",
          description: "Passport + selfie uploaded.",
          createdAt: new Date(now - 45 * 24 * 3600_000),
        },
        {
          userId: u.id,
          type: "deposit",
          title: "First deposit",
          description: "$5,000 via bank transfer.",
          metadata: JSON.stringify({ amount: 5000, currency: "USD" }),
          createdAt: new Date(now - 30 * 24 * 3600_000),
        },
        {
          userId: u.id,
          type: "ticket_created",
          title: "Opened support ticket",
          description: "Withdrawal not received in bank account.",
          createdAt: new Date(now - 24 * 3600_000),
        },
      ],
    });

    await prisma.crmAuditLog.createMany({
      data: [
        {
          userId: u.id,
          operatorId: "staff-001",
          operatorName: "Alice Chen",
          action: "kyc.review.assign",
          targetField: "kycReviewer",
          oldValue: null,
          newValue: "staff-001",
          ipAddress: "10.0.0.5",
        },
        {
          userId: u.id,
          operatorId: "staff-002",
          operatorName: "Bob Martin",
          action: "ticket.assign",
          targetField: "assignedTo",
          oldValue: null,
          newValue: "staff-002",
          ipAddress: "10.0.0.7",
        },
      ],
    });
  }

  await prisma.clientSegment.deleteMany({ where: { name: { startsWith: "Demo:" } } });
  await prisma.clientSegment.createMany({
    data: [
      {
        name: "Demo: VIP active traders",
        description: "VIP-tagged clients with active status",
        filter: JSON.stringify({ status: "active", level: "vip" }),
        isDynamic: true,
        userCount: 0,
      },
      {
        name: "Demo: Pending KYC",
        description: "Clients whose KYC is not yet verified",
        filter: JSON.stringify({ kycStatus: "pending" }),
        isDynamic: true,
        userCount: 0,
      },
    ],
  });

  console.log(`Seeded CRM demo data for ${users.length} user(s):`);
  for (const u of users) console.log(`  - ${u.email} (${u.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
