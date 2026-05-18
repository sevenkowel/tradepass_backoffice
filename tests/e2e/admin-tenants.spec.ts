import { test, expect } from "@playwright/test";
import { getAdminTenants, extendTrialAdmin } from "../helpers/tenant";

test.describe("Admin Tenant Management", () => {
  test("admin tenants page renders with subscription columns", async ({ page }) => {
    // Login as admin
    await page.goto("/auth/login");
    await page.fill('input[name="email"]', "admin@tradepass.com");
    await page.fill('input[name="password"]', "admin123");
    await page.click('button[type="submit"]');
    await page.waitForURL(/admin/);

    await page.goto("/admin/tenants");
    await expect(page.locator("text=租户管理")).toBeVisible();
    await expect(page.locator("text=套餐")).toBeVisible();
    await expect(page.locator("text=状态")).toBeVisible();
  });

  test("admin tenants API returns tenant list", async ({ page }) => {
    await page.goto("/auth/login");
    await page.fill('input[name="email"]', "admin@tradepass.com");
    await page.fill('input[name="password"]', "admin123");
    await page.click('button[type="submit"]');
    await page.waitForURL(/admin/);

    const data = await getAdminTenants(page);
    expect(data).toHaveProperty("tenants");
    expect(Array.isArray(data.tenants)).toBe(true);
  });

  test("admin can extend tenant trial", async ({ page }) => {
    await page.goto("/auth/login");
    await page.fill('input[name="email"]', "admin@tradepass.com");
    await page.fill('input[name="password"]', "admin123");
    await page.click('button[type="submit"]');
    await page.waitForURL(/admin/);

    const list = await getAdminTenants(page);
    if (list.tenants.length === 0) {
      test.skip();
      return;
    }

    const tenant = list.tenants[0];
    const result = await extendTrialAdmin(page, tenant.id, 14);
    expect(result.success).toBe(true);
    expect(result.message).toContain("延长");
  });
});
