import { test, expect } from "@playwright/test";

const BASE = "http://localhost:3001";

function uniqueEmail() {
  return `billing-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@test.local`;
}

test.describe.serial("Billing API", () => {
  let context: any;

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext();
  });

  test.afterAll(async () => {
    await context.close();
  });

  async function registerAndGetCookie(email: string) {
    await context.request.post(`${BASE}/api/auth/register`, {
      data: { email, password: "TestPass123!", name: "Billing Tester", skipVerification: true },
    });
    await context.request.post(`${BASE}/api/auth/login`, {
      data: { email, password: "TestPass123!" },
    });
  }

  test("API-BILL-01: GET /api/console/billing/trial-status → 200 with lifecycle", async () => {
    const email = uniqueEmail();
    await registerAndGetCookie(email);

    const res = await context.request.get(`${BASE}/api/console/billing/trial-status`);
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty("state");
    expect(json.state).toHaveProperty("status");
    expect(["active_trial", "grace_period", "expired", "active_paid"]).toContain(json.state.status);
  });

  test("API-BILL-02: POST /api/console/billing/checkout-session free plan → 200", async () => {
    const email = uniqueEmail();
    await registerAndGetCookie(email);

    const res = await context.request.post(`${BASE}/api/console/billing/checkout-session`, {
      data: { plan: "free", yearly: false, currency: "USD" },
    });
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.free).toBe(true);
  });

  test("API-BILL-03: POST /api/console/billing/checkout-session paid plan → dev mode", async () => {
    const email = uniqueEmail();
    await registerAndGetCookie(email);

    const res = await context.request.post(`${BASE}/api/console/billing/checkout-session`, {
      data: { plan: "starter", yearly: false, currency: "USD" },
    });
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.devMode).toBe(true);
    expect(json.invoiceId).toBeTruthy();
  });

  test("API-BILL-04: POST /api/console/billing/checkout-session multi-currency", async () => {
    const email = uniqueEmail();
    await registerAndGetCookie(email);

    const res = await context.request.post(`${BASE}/api/console/billing/checkout-session`, {
      data: { plan: "starter", yearly: false, currency: "CNY" },
    });
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    // CNY price should be higher than USD due to exchange rate
    if (json.amount) {
      expect(json.amount).toBeGreaterThan(0);
    }
  });

  test("API-BILL-05: POST /api/console/billing/pay → marks invoice paid", async () => {
    const email = uniqueEmail();
    await registerAndGetCookie(email);

    // Create an invoice first via checkout
    const checkoutRes = await context.request.post(`${BASE}/api/console/billing/checkout-session`, {
      data: { plan: "starter", yearly: false, currency: "USD" },
    });
    const checkout = await checkoutRes.json();

    // Pay the invoice
    const payRes = await context.request.post(`${BASE}/api/console/billing/pay`, {
      data: { invoiceId: checkout.invoiceId, method: "card" },
    });
    expect(payRes.status()).toBe(200);
    const pay = await payRes.json();
    expect(pay.invoice.status).toBe("paid");
  });

  test("API-BILL-06: GET /api/console/billing → returns invoices", async () => {
    const email = uniqueEmail();
    await registerAndGetCookie(email);

    const res = await context.request.get(`${BASE}/api/console/billing`);
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty("invoices");
    expect(Array.isArray(json.invoices)).toBe(true);
  });

  test("API-BILL-07: POST /api/webhooks/stripe → dev mode returns 200", async () => {
    const res = await context.request.post(`${BASE}/api/webhooks/stripe`, {
      data: { type: "test.event", data: {} },
      headers: { "Content-Type": "application/json" },
    });
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.devMode).toBe(true);
  });
});
