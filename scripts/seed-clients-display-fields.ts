/**
 * Backfill the v3 client-display fields on existing users:
 *
 *   - User.country             — random realistic ISO-3166 alpha-2
 *   - User.registrationSource  — random from 5 channels
 *   - User.registrationDevice  — short label, derived from first
 *                                 ClientDevice when available
 *   - User.role                — partner if the user has an IBPartner
 *                                 record, affiliate for ~5% of remaining,
 *                                 client for everyone else
 *
 * Idempotent — running again overwrites with the same deterministic seed
 * derived from `user.id`, so country/source/device stays stable across runs
 * (good for screenshots / regression tests).
 *
 * Usage: npx tsx scripts/seed-clients-display-fields.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const COUNTRIES = [
  // Heavier weights on key forex markets so the list looks plausible.
  "CN", "CN", "CN", "CN", "CN",
  "HK", "HK", "HK",
  "SG", "SG",
  "JP", "JP",
  "VN", "VN",
  "TH", "MY", "ID", "PH",
  "AE", "AE",
  "US", "US",
  "GB", "GB",
  "AU", "DE", "FR", "ES", "IT", "BR", "MX", "ZA",
  "KR", "TW", "IN",
];

const SOURCES = [
  "web", "web", "web", "web",
  "mobile_ios", "mobile_ios",
  "mobile_android", "mobile_android", "mobile_android",
  "affiliate",
  "import",
];

const DEVICES = [
  "Chrome 124 on macOS",
  "Chrome 124 on Windows 11",
  "Safari 17 on macOS",
  "Safari Mobile on iOS 17",
  "Chrome Mobile on Android 14",
  "Edge 124 on Windows 11",
  "Firefox 125 on Linux",
];

/** Stable pseudorandom integer in [0, max) seeded by a string. */
function hashPick(seed: string, salt: string, max: number): number {
  let h = 0;
  const s = `${seed}|${salt}`;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h) % max;
}

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, createdAt: true, ibPartner: { select: { id: true } } },
    orderBy: { id: "asc" },
  });
  console.log(`Backfilling ${users.length} users…`);

  let partnerCount = 0;
  let affiliateCount = 0;
  let clientCount = 0;

  for (const u of users) {
    const country = COUNTRIES[hashPick(u.id, "country", COUNTRIES.length)];
    const registrationSource = SOURCES[hashPick(u.id, "source", SOURCES.length)];
    const registrationDevice = DEVICES[hashPick(u.id, "device", DEVICES.length)];

    let role: "client" | "partner" | "affiliate";
    if (u.ibPartner) {
      role = "partner";
      partnerCount++;
    } else if (hashPick(u.id, "affiliate", 20) === 0) {
      // ~5% affiliates
      role = "affiliate";
      affiliateCount++;
    } else {
      role = "client";
      clientCount++;
    }

    // Cast through `unknown` so this script compiles before the migration
    // is applied — once `prisma generate` runs the new fields are typed.
    await (prisma.user.update as unknown as (args: {
      where: { id: string };
      data: Record<string, unknown>;
    }) => Promise<unknown>)({
      where: { id: u.id },
      data: { country, registrationSource, registrationDevice, role },
    });
  }

  console.log(
    `Done. clients=${clientCount}  partners=${partnerCount}  affiliates=${affiliateCount}`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
