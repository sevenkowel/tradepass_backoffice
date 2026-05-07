/**
 * Seed demo KYC records for all statuses and risk levels
 * Usage: npx tsx scripts/seed-kyc-demo.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const REGIONS = ["VN", "TH", "IN", "AE", "KR", "JP", "FR", "ES", "BR"] as const;
const DOC_TYPES = ["id_card", "passport", "driving_license"] as const;
const KYC_LEVELS = ["basic", "standard", "enhanced"] as const;

function randomItem<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generatePhone(region: string): string {
  const prefixes: Record<string, string> = {
    VN: "+84", TH: "+66", IN: "+91", AE: "+971",
    KR: "+82", JP: "+81", FR: "+33", ES: "+34", BR: "+55",
  };
  return `${prefixes[region] ?? "+1"} ${randomInt(100, 999)} ${randomInt(100, 999)} ${randomInt(1000, 9999)}`;
}

interface SeedConfig {
  status: "submitted" | "under_review" | "approved" | "rejected";
  riskScore: number; // determines low/medium/high
  count: number;
}

const configs: SeedConfig[] = [
  // submitted - all risk levels
  { status: "submitted", riskScore: 15, count: 2 },
  { status: "submitted", riskScore: 45, count: 2 },
  { status: "submitted", riskScore: 78, count: 2 },
  // under_review
  { status: "under_review", riskScore: 22, count: 2 },
  { status: "under_review", riskScore: 55, count: 2 },
  { status: "under_review", riskScore: 82, count: 2 },
  // approved
  { status: "approved", riskScore: 12, count: 2 },
  { status: "approved", riskScore: 38, count: 2 },
  { status: "approved", riskScore: 65, count: 2 },
  // rejected
  { status: "rejected", riskScore: 70, count: 2 },
  { status: "rejected", riskScore: 88, count: 2 },
  { status: "rejected", riskScore: 95, count: 2 },
];

async function main() {
  console.log("Seeding demo KYC data...");

  let created = 0;
  let userIndex = 1;

  for (const cfg of configs) {
    for (let i = 0; i < cfg.count; i++) {
      const region = randomItem(REGIONS);
      const docType = randomItem(DOC_TYPES);
      const kycLevel = randomItem(KYC_LEVELS);
      const ocrConfidence = Math.random() * 0.4 + 0.55; // 0.55 - 0.95
      const livenessPassed = Math.random() > 0.15;
      const amlPassed = cfg.riskScore < 60;

      // Build flags based on risk signals
      const flags: string[] = [];
      if (ocrConfidence < 0.85) flags.push("OCR 识别置信度低");
      if (!livenessPassed) flags.push("活体检测未通过");
      if (!amlPassed) flags.push("AML 筛查异常");
      if (cfg.riskScore > 75) flags.push("高风险地区");
      if (Math.random() > 0.7) flags.push("证件即将过期");

      const firstName = ["Wei", "Min", "Hassan", "Kim", "Sato", "Jean", "Carlos", "Anh", "Raj", "Ahmed"][randomInt(0, 9)];
      const lastName = ["Zhang", "Lee", "Al-Rashid", "Park", "Tanaka", "Dupont", "Silva", "Nguyen", "Patel", "Khan"][randomInt(0, 9)];
      const fullName = `${firstName} ${lastName}`;

      // Create user
      const user = await prisma.user.create({
        data: {
          email: `demo.kyc.${userIndex}@tradepass.local`,
          passwordHash: "$2b$10$hashedpasswordplaceholder",
          name: fullName,
          phone: generatePhone(region),
          status: "active",
          kycStatus: cfg.status,
        },
      });

      // Create KYC record
      const kycData: any = {
        userId: user.id,
        regionCode: region,
        kycLevel,
        status: cfg.status,
        documentType: docType,
        documentFrontUrl: `https://picsum.photos/seed/${user.id}_front/800/500`,
        documentBackUrl: Math.random() > 0.3 ? `https://picsum.photos/seed/${user.id}_back/800/500` : null,
        selfieUrl: `https://picsum.photos/seed/${user.id}_selfie/400/400`,
        ocrConfidence,
        livenessPassed,
        amlPassed,
        amlRiskScore: cfg.riskScore,
        personalInfo: JSON.stringify({
          fullName,
          dateOfBirth: `${randomInt(1970, 2000)}-${String(randomInt(1, 12)).padStart(2, "0")}-${String(randomInt(1, 28)).padStart(2, "0")}`,
          nationality: region,
          address: `${randomInt(1, 999)} ${["Main St", "Oak Ave", "Park Rd", "River Ln"][randomInt(0, 3)]}`,
          city: ["Ho Chi Minh", "Bangkok", "Mumbai", "Dubai", "Seoul", "Tokyo", "Paris", "Madrid", "Sao Paulo"][REGIONS.indexOf(region)],
          country: region,
        }),
        flags: JSON.stringify(flags),
        submittedAt: new Date(Date.now() - randomInt(1, 30) * 24 * 60 * 60 * 1000),
      };

      if (cfg.status === "approved" || cfg.status === "rejected") {
        kycData.reviewedAt = new Date(Date.now() - randomInt(1, 10) * 24 * 60 * 60 * 1000);
        kycData.reviewedBy = "demo-admin";
      }

      if (cfg.status === "rejected") {
        kycData.rejectionReason = [
          "证件照片不清晰，请重新上传",
          "身份信息与证件不符",
          "地址证明无效",
          "AML 筛查未通过，需补充资金来源证明",
          "活体检测失败，请重新进行人脸识别",
        ][randomInt(0, 4)];
      }

      await prisma.kYCRecord.create({ data: kycData });

      created++;
      userIndex++;
    }
  }

  console.log(`✅ Seeded ${created} KYC records across all statuses and risk levels.`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
