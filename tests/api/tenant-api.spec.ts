import { test, expect } from "@playwright/test";

const BASE = "http://localhost:3001";

function uniqueEmail() {
  return `tenant-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@test.local`;
}

test.describe.serial("Tenant API", () => {
  let context: any;

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext();
  });

  test.afterAll(async () => {
    await context.close();
  });

  async function registerAndGetCookie(email: string) {
    await context.request.post(`${BASE}/api/auth/register`, {
      data: { email, password: "TestPass123!", name: "Tenant Tester", skipVerification: true },
    });
    await context.request.post(`${BASE}/api/auth/login`, {
      data: { email, password: "TestPass123!" },
    });
  }

  test("API-TEN-01: GET /api/console/tenants → 200 with tenant list", async () => {
    const email = uniqueEmail();
    await registerAndGetCookie(email);

    const res = await context.request.get(`${BASE}/api/console/tenants`);
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty("tenants");
    expect(Array.isArray(json.tenants)).toBe(true);
    expect(json.tenants.length).toBeGreaterThan(0);
  });

  test("API-TEN-02: GET /api/console/tenants/:id → 200 with detail", async () => {
    const email = uniqueEmail();
    await registerAndGetCookie(email);

    const listRes = await context.request.get(`${BASE}/api/console/tenants`);
    const list = await listRes.json();
    const tenantId = list.tenants[0].id;

    const res = await context.request.get(`${BASE}/api/console/tenants/${tenantId}`);
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty("tenant");
    expect(json.tenant).toHaveProperty("id", tenantId);
  });

  test("API-TEN-03: GET /api/console/subscription → 200 with subscription", async () => {
    const email = uniqueEmail();
    await registerAndGetCookie(email);

    const res = await context.request.get(`${BASE}/api/console/subscription`);
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty("subscription");
  });

  test("API-TEN-04: POST /api/console/billing/upgrade → upgrades plan", async () => {
    const email = uniqueEmail();
    await registerAndGetCookie(email);

    const res = await context.request.post(`${BASE}/api/console/billing/upgrade`, {
      data: { plan: "starter", yearly: false },
    });
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.plan).toBe("starter");
  });

  test("API-TEN-05: GET /api/admin/tenants → 200 for admin", async () => {
    await context.request.post(`${BASE}/api/auth/login`, {
      data: { email: "admin@tradepass.com", password: "admin123" },
    });

    const res = await context.request.get(`${BASE}/api/admin/tenants`);
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty("tenants");
  });

  test("API-TEN-06: POST /api/admin/tenants/:id/extend-trial → extends trial", async () => {
    await context.request.post(`${BASE}/api/auth/login`, {
      data: { email: "admin@tradepass.com", password: "admin123" },
    });

    const listRes = await context.request.get(`${BASE}/api/admin/tenants`);
    const list = await listRes.json();
    if (list.tenants.length === 0) {
      test.skip();
      return;
    }

    const tenantId = list.tenants[0].id;
    const res = await context.request.post(`${BASE}/api/admin/tenants/${tenantId}/extend-trial`, {
      data: { days: 14 },
    });
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });
});
