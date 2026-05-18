import { Page } from "@playwright/test";

export async function getTenantDetail(page: Page, tenantId: string) {
  return page.evaluate(async (id) => {
    const res = await fetch(`/api/console/tenants/${id}`);
    return res.json();
  }, tenantId);
}

export async function extendTrialAdmin(page: Page, tenantId: string, days: number = 14) {
  return page.evaluate(
    async ({ id, days }) => {
      const res = await fetch(`/api/admin/tenants/${id}/extend-trial`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days }),
      });
      return res.json();
    },
    { id: tenantId, days }
  );
}

export async function getAdminTenants(page: Page) {
  return page.evaluate(async () => {
    const res = await fetch("/api/admin/tenants");
    return res.json();
  });
}
