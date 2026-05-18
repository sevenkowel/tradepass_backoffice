import { Page } from "@playwright/test";

export async function createCheckoutSession(
  page: Page,
  plan: string,
  yearly: boolean = false,
  currency: string = "USD"
) {
  return page.evaluate(
    async ({ plan, yearly, currency }) => {
      const res = await fetch("/api/console/billing/checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, yearly, currency }),
      });
      return res.json();
    },
    { plan, yearly, currency }
  );
}

export async function getTrialStatus(page: Page) {
  return page.evaluate(async () => {
    const res = await fetch("/api/console/billing/trial-status");
    return res.json();
  });
}

export async function payInvoice(page: Page, invoiceId: string) {
  return page.evaluate(async (id) => {
    const res = await fetch("/api/console/billing/pay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invoiceId: id, method: "card" }),
    });
    return res.json();
  }, invoiceId);
}
