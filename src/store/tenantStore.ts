import { create } from "zustand";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status: string;
}

interface TenantStore {
  currentTenant: Tenant | null;
  tenants: Tenant[];
  setCurrentTenant: (tenant: Tenant | null) => void;
  setTenants: (tenants: Tenant[]) => void;
}

export const useTenantStore = create<TenantStore>((set) => ({
  currentTenant: null,
  tenants: [],
  setCurrentTenant: (tenant) => set({ currentTenant: tenant }),
  setTenants: (tenants) => set({ tenants }),
}));
