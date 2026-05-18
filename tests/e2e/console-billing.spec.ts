import { test, expect } from "@playwright/test";
import { registerAndLogin } from "../helpers/auth";
import { createCheckoutSession } from "../helpers/billing";

test.describe("Console Billing", () => {
  test("billing page renders with plan cards and currency selector", async ({ page }) => {
    await registerAndLogin(page);
    await page.goto("/console/billing");

    // Plan cards visible
    await expect(page.locator("text=选择套餐")).toBeVisible();
    await expect(page.locator("text=Free")).toBeVisible();
    await expect(page.locator("text=Starter")).toBeVisible();
    await expect(page.locator("text=Professional")).toBeVisible();

    // Currency selector
    await expect(page.locator("button:has-text('USD')")).toBeVisible();
    await expect(page.locator("button:has-text('CNY')")).toBeVisible();

    // Billing period toggle
    await expect(page.locator("text=月付")).toBeVisible();
    await expect(page.locator("text=年付")).toBeVisible();
  });

  test("currency switch updates prices", async ({ page }) => {
    await registerAndLogin(page);
    await page.goto("/console/billing");

    // Default USD
    await expect(page.locator("text=$")).toBeVisible();

    // Switch to CNY
    await page.click("button:has-text('CNY')");
    await expect(page.locator("text=¥")).toBeVisible();

    // Switch to JPY
    await page.click("button:has-text('JPY')");
    await expect(page.locator("text=¥")).toBeVisible();
  });

  test("yearly toggle shows discount", async ({ page }) => {
    await registerAndLogin(page);
    await page.goto("/console/billing");

    await page.click("text=年付");
    await expect(page.locator("text=-15%")).toBeVisible();
  });

  test("free plan upgrade creates checkout session in dev mode", async ({ page }) => {
    await registerAndLogin(page);
    const data = await createCheckoutSession(page, "free", false, "USD");

    expect(data.success).toBe(true);
    expect(data.free).toBe(true);
  });

  test("paid plan checkout session returns dev redirect", async ({ page }) => {
    await registerAndLogin(page);
    const data = await createCheckoutSession(page, "starter", false, "USD");

    expect(data.success).toBe(true);
    expect(data.devMode).toBe(true);
    expect(data.invoiceId).toBeTruthy();
    expect(data.redirectUrl).toContain("/console/billing/success");
  });

  test("billing success page renders", async ({ page }) => {
    await page.goto("/console/billing/success?dev_invoice=test_123");
    await expect(page.locator("text=支付成功")).toBeVisible();
    await expect(page.locator("text=进入控制台")).toBeVisible();
  });

  test("billing cancel page renders", async ({ page }) => {
    await page.goto("/console/billing/cancel");
    await expect(page.locator("text=支付已取消")).toBeVisible();
    await expect(page.locator("text=重新支付")).toBeVisible();
  });

  test("invoice list shows pending invoice after checkout", async ({ page }) => {
    await registerAndLogin(page);
    await createCheckoutSession(page, "starter", false, "USD");

    await page.goto("/console/billing");
    await expect(page.locator("text=INV-")).toBeVisible();
    await expect(page.locator("text=pending")).toBeVisible();
  });
});
