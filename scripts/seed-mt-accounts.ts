/**
 * Backfill MT trading accounts for every user.
 *
 * The dev DB had `mt_accounts` empty, so the new "Accounts" column on the
 * client list showed `0` for everyone — looking like a mock value. This
 * script gives every client 1–3 MT accounts with realistic balances so
 * the column tells a meaningful story.
 *
 * Distribution (deterministic from user.id):
 *   - 5%  no accounts
 *   - 60% one account
 *   - 25% two accounts
 *   - 10% three accounts
 *
 * Usage: npx tsx scripts/seed-mt-accounts.ts
 *
 * Idempotent — clears prior seed accounts (group prefix `demo\\` or `live\\`)
 * before reseeding.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function hashPick(seed: string, salt: string, max: number): number {
  let h = 0;
  const s = `${seed}|${salt}`;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h) % max;
}

function pickCount(userId: string): number {
  const roll = hashPick(userId, "count", 100);
  if (roll < 5)  return 0;
  if (roll < 65) return 1;
  if (roll < 90) return 2;
  return 3;
}

const GROUPS  = ["live\\standard", "live\\ecn", "live\\vip", "demo\\standard"];
const LEVERAGES = [50, 100, 200, 500];

async function main() {
  console.log("Clearing prior seeded MT accounts…");
  await prisma.mTAccount.deleteMany({
    where: {
      OR: [
        { group: { startsWith: "live\\" } },
        { group: { startsWith: "demo\\" } },
      ],
    },
  });

  const users = await prisma.user.findMany({
    select: { id: true },
    orderBy: { id: "asc" },
  });

  let inserted = 0;
  let usersWithAccounts = 0;
  const dist: Record<number, number> = {};

  for (const u of users) {
    const count = pickCount(u.id);
    dist[count] = (dist[count] ?? 0) + 1;
    if (count === 0) continue;
    usersWithAccounts++;

    for (let i = 0; i < count; i++) {
      const seed = `${u.id}-${i}`;
      const group    = GROUPS[hashPick(seed, "group", GROUPS.length)];
      const leverage = LEVERAGES[hashPick(seed, "leverage", LEVERAGES.length)];
      const r = hashPick(seed, "balance", 1000) / 1000;
      const balance = Math.round(r * r * 50000);     // skewed low, tail to $50k
      const pnl     = (hashPick(seed, "pnl", 200) - 100) * 10;  // ±$1000
      const equity  = Math.max(0, balance + pnl);

      // 6-digit MT login; suffix the user-account index to keep uniqueness.
      const baseLogin = (parseInt(u.id.slice(-6), 36) % 900000 + 100000).toString();
      const login = `${baseLogin}${i}`;

      await prisma.mTAccount.create({
        data: {
          userId: u.id,
          mtLogin: login,
          mtPassword: "seed-only-not-a-real-password",
          group,
          leverage,
          balance,
          equity,
          margin: Math.round(balance * 0.05),
          freeMargin: Math.round(equity * 0.95),
          currency: "USD",
          status: "active",
        },
      });
      inserted++;
    }
  }

  console.log(`Seeded ${inserted} accounts across ${usersWithAccounts}/${users.length} users.`);
  console.log("\nDistribution:");
  for (const c of Object.keys(dist).map(Number).sort()) {
    console.log(`  ${c} account${c === 1 ? "" : "s"}: ${dist[c]} users`);
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
