#!/usr/bin/env tsx
/**
 * Single-Tenant → Multi-Tenant Data Migration Script
 *
 * Usage:
 *   npx tsx scripts/migrate-single-to-multi-tenant.ts --dry-run
 *   npx tsx scripts/migrate-single-to-multi-tenant.ts --execute
 *
 * This script migrates existing users (who have no tenant association)
 * into the multi-tenant SaaS model by:
 * 1. Creating a Tenant for each user who owns no tenant
 * 2. Creating a TenantMember link (owner role)
 * 3. Creating a Subscription for the tenant
 * 4. Updating the user's onboarding flags
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function printUsage() {
  console.log("Usage: npx tsx scripts/migrate-single-to-multi-tenant.ts [--dry-run | --execute]");
  console.log("  --dry-run   Preview changes without writing to DB");
  console.log("  --execute   Apply changes to database");
  process.exit(1);
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const execute = args.includes("--execute");

  if (!dryRun && !execute) {
    printUsage();
  }

  console.log(`[Migrate] Mode: ${dryRun ? "DRY RUN" : "EXECUTE"}\n`);

  // Find all users who don't own a tenant
  const orphanedUsers = await prisma.user.findMany({
    where: {
      ownedTenants: { none: {} },
    },
  });

  console.log(`[Migrate] Found ${orphanedUsers.length} users without a tenant\n`);

  if (orphanedUsers.length === 0) {
    console.log("[Migrate] Nothing to migrate. All users already have tenants.");
    return;
  }

  for (const user of orphanedUsers) {
    const tenantName = user.name || user.email.split("@")[0];
    const slug = `tenant-${user.id.slice(0, 8)}`;

    console.log(`  User: ${user.email} (${user.id})`);
    console.log(`    → Create Tenant: ${tenantName} (slug: ${slug})`);
    console.log(`    → Create Subscription: free plan`);
    console.log(`    → Create TenantMember: owner`);

    if (execute) {
      const tenant = await prisma.tenant.create({
        data: {
          name: tenantName,
          slug,
          ownerId: user.id,
          status: user.status === "active" ? "active" : "trial",
          plan: "free",
          maxUsers: 5,
          maxAccounts: 3,
          trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          locale: "zh-CN",
          region: "ap-southeast-1",
        },
      });

      await prisma.tenantMember.create({
        data: {
          tenantId: tenant.id,
          userId: user.id,
          role: "owner",
        },
      });

      // Find a default product or create subscription without product relation
      const defaultProduct = await prisma.product.findFirst();
      await prisma.subscription.create({
        data: {
          tenantId: tenant.id,
          productId: defaultProduct?.id || "",
          planName: "free",
          status: "active",
          seatLimit: 5,
          startsAt: new Date(),
          endsAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
      });

      await prisma.user.update({
        where: { id: user.id },
        data: {
          onboardingLocked: false,
        },
      });

      console.log(`    ✓ Done (Tenant ID: ${tenant.id})`);
    } else {
      console.log(`    [dry-run] Skipped`);
    }

    console.log("");
  }

  console.log(`[Migrate] ${execute ? "Migration complete" : "Dry run complete — no changes made"}.`);
}

main()
  .catch((err) => {
    console.error("[Migrate] Error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
