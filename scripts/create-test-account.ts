import { prisma } from "../src/lib/prisma";
import { hashPassword } from "../src/lib/auth";

async function main() {
  const email = process.argv[2] || "admin@example.com";
  const password = process.argv[3] || "Admin1234!";
  const name = process.argv[4] || "Admin User";

  console.log(`Creating test account: ${email}`);

  // 1. Create user (already verified)
  const passwordHash = await hashPassword(password);
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      status: "active",
      emailVerifiedAt: new Date(),
      passwordHash,
    },
    create: {
      email,
      name,
      passwordHash,
      status: "active",
      emailVerifiedAt: new Date(),
    },
  });
  console.log(`  User: ${user.id} (${user.status})`);

  // 2. Find or create tenant
  let tenant = await prisma.tenant.findFirst({
    where: { ownerId: user.id },
  });

  if (!tenant) {
    const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    const gracePeriodEndsAt = new Date(trialEndsAt.getTime() + 7 * 24 * 60 * 60 * 1000);

    tenant = await prisma.tenant.create({
      data: {
        name: name,
        slug: `tenant-${user.id.slice(0, 8)}`,
        ownerId: user.id,
        status: "trial",
        plan: "mvp",
        maxUsers: 10,
        maxAccounts: 5,
        brandName: name,
        subdomain: `${name.toLowerCase().replace(/[^a-z0-9]/g, "")}-${user.id.slice(0, 6)}`,
        trialEndsAt,
        gracePeriodEndsAt,
        onboardingLocked: true,
      },
    });
    console.log(`  Tenant: ${tenant.id}`);
  } else {
    console.log(`  Tenant already exists: ${tenant.id}`);
  }

  // 3. Create tenant member
  const existingMember = await prisma.tenantMember.findFirst({
    where: { tenantId: tenant.id, userId: user.id },
  });
  if (!existingMember) {
    await prisma.tenantMember.create({
      data: {
        tenantId: tenant.id,
        userId: user.id,
        role: "owner",
      },
    });
    console.log(`  TenantMember: owner`);
  }

  // 4. Create onboarding record
  const existingOnboarding = await prisma.tenantOnboarding.findUnique({
    where: { tenantId: tenant.id },
  });
  if (!existingOnboarding) {
    await prisma.tenantOnboarding.create({
      data: {
        tenantId: tenant.id,
        status: "in_progress",
        step: 1,
        data: JSON.stringify({}),
        isLocked: false,
      },
    });
    console.log(`  Onboarding: created (step 1)`);
  } else {
    console.log(`  Onboarding: already exists (step ${existingOnboarding.step})`);
  }

  // 5. Create tenant config
  const existingConfig = await prisma.tenantConfig.findUnique({
    where: { tenantId: tenant.id },
  });
  if (!existingConfig) {
    await prisma.tenantConfig.create({
      data: {
        tenantId: tenant.id,
        brand: JSON.stringify({ name, primaryColor: "#1a73e8" }),
        auth: JSON.stringify({ methods: ["email"], loginFlow: "password" }),
        kyc: JSON.stringify({ regions: ["VN"], level: "basic", amlEnabled: false }),
        trading: JSON.stringify({ groups: ["forex"], leverage: "1:100", spreadMode: "floating" }),
        payment: JSON.stringify({ currencies: ["USD"], depositChannels: ["usdt"], withdrawalChannels: ["usdt"] }),
        channels: JSON.stringify({ emailProvider: "tradepass_default", smsProvider: "tradepass_default", ekycProvider: "tradepass_default" }),
        mvpMode: true,
      },
    });
    console.log(`  TenantConfig: created`);
  }

  // 6. Ensure TradePass Business product exists (auto-create if missing)
  const businessProduct = await prisma.product.upsert({
    where: { code: "trade_pass_business" },
    update: {},
    create: {
      code: "trade_pass_business",
      name: "TradePass Business",
      description: "外汇经纪商业务系统基础层，包含 Portal、Backoffice 和核心运营功能",
      basePrice: 7000,
      seatPrice: 29,
      currency: "USD",
      isActive: true,
      features: JSON.stringify({
        modules: ["portal", "backoffice", "kyc", "funds", "trading_accounts"],
        plans: {
          free: { maxUsers: 10, maxAccounts: 5, maxDeposits: 100 },
          starter: { maxUsers: 50, maxAccounts: 100 },
          professional: { maxUsers: 200, maxAccounts: 500 },
          enterprise: { maxUsers: 1000, maxAccounts: 2000 },
          ultimate: { maxUsers: -1, maxAccounts: -1 },
        },
      }),
    },
  });

  if (businessProduct) {
    const existingSub = await prisma.subscription.findFirst({
      where: { tenantId: tenant.id, productId: businessProduct.id },
    });
    if (!existingSub) {
      await prisma.subscription.create({
        data: {
          tenantId: tenant.id,
          productId: businessProduct.id,
          status: "trialing",
          planName: "mvp",
          seatLimit: 10,
          currentSeats: 1,
          trialEndsAt: tenant.trialEndsAt,
          gracePeriodEndsAt: tenant.gracePeriodEndsAt,
          features: JSON.stringify({ plan: "mvp", modules: ["portal", "kyc_basic", "funds_usdt"] }),
        },
      });
      console.log(`  Subscription: trialing`);
    }
  }

  console.log("\n✅ Test account ready!");
  console.log(`   Email:    ${email}`);
  console.log(`   Password: ${password}`);
  console.log(`   Login:    http://localhost:3001/auth/login`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
