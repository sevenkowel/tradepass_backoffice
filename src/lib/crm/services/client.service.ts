/**
 * Client service — calls live `/api/crm/*` endpoints. No mock data anywhere
 * in this file. The mock fixtures under `../mock-clients` and
 * `../mock-client-detail` are now only loaded by tests / showcase pages.
 */

import type {
  BackofficeUser,
  ClientListParams,
  ClientTag,
  ClientSegment,
  ClientNote,
} from "@/types/backoffice/user";
import type { ClientDetailData } from "@/types/backoffice/client-detail";

const API_BASE = "/api/crm/clients";

function isServerSide(): boolean {
  return typeof window === "undefined";
}

function buildUrl(path: string, params?: Record<string, string | number | undefined>): string {
  const qs = new URLSearchParams();
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v != null && v !== "") qs.set(k, String(v));
    }
  }
  const query = qs.toString();
  if (isServerSide()) {
    const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return `${origin}${path}${query ? `?${query}` : ""}`;
  }
  return `${path}${query ? `?${query}` : ""}`;
}

async function api<T>(
  path: string,
  init?: RequestInit & { params?: Record<string, string | number | undefined> }
): Promise<T> {
  const { params, ...rest } = init ?? {};
  const res = await fetch(buildUrl(path, params), {
    cache: "no-store",
    credentials: "include",
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(rest.headers as Record<string, string> | undefined),
    },
  });
  const json = (await res.json().catch(() => ({}))) as { success?: boolean; error?: string } & T;
  if (!res.ok || json.success === false) {
    throw new Error(json.error || `Request failed: ${res.status}`);
  }
  return json;
}

class ClientService {
  async list(params: Partial<ClientListParams> = {}): Promise<{ items: BackofficeUser[]; total: number }> {
    const json = await api<{ items: BackofficeUser[]; total: number }>(API_BASE, {
      params: {
        page: params.page,
        pageSize: params.pageSize,
        search: params.search,
        status: params.status,
        kycStatus: params.kycStatus,
        level: params.level,
        riskLevel: params.riskLevel,
        lifecycleStage: params.lifecycleStage,
        // Multi-select countries → comma-separated wire format
        country: params.country && params.country.length > 0 ? params.country.join(",") : undefined,
        startDate: params.startDate,
        endDate: params.endDate,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
      },
    });
    return { items: json.items, total: json.total };
  }

  async getById(id: string): Promise<BackofficeUser | null> {
    try {
      const json = await api<{ item: BackofficeUser }>(`${API_BASE}/${encodeURIComponent(id)}`);
      return json.item;
    } catch (err) {
      if (err instanceof Error && /404|Not found/i.test(err.message)) return null;
      throw err;
    }
  }

  async getByUid(uid: string): Promise<BackofficeUser | null> {
    const { items } = await this.list({ search: uid, page: 1, pageSize: 1 });
    return items[0] ?? null;
  }

  async update(id: string, data: Partial<BackofficeUser>): Promise<BackofficeUser> {
    const json = await api<{ item: BackofficeUser }>(`${API_BASE}/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify({ status: data.status }),
    });
    return json.item;
  }

  async freeze(id: string): Promise<void> {
    await this.update(id, { status: "frozen" });
  }

  async unfreeze(id: string): Promise<void> {
    await this.update(id, { status: "active" });
  }

  async addTags(id: string, tagNames: string[]): Promise<void> {
    await api(`${API_BASE}/${encodeURIComponent(id)}/tags`, {
      method: "POST",
      body: JSON.stringify({ tagNames }),
    });
  }

  async removeTags(id: string, tagNames: string[]): Promise<void> {
    await api(`${API_BASE}/${encodeURIComponent(id)}/tags`, {
      method: "DELETE",
      body: JSON.stringify({ tagNames }),
    });
  }

  async getClientTags(id: string): Promise<{ id: string; name: string; color: string; assignedAt: string }[]> {
    const json = await api<{ items: { id: string; name: string; color: string; assignedAt: string }[] }>(
      `${API_BASE}/${encodeURIComponent(id)}/tags`
    );
    return json.items;
  }

  // === Tags (catalog) ===
  async listTags(): Promise<ClientTag[]> {
    const json = await api<{ items: ClientTag[] }>("/api/crm/tags");
    return json.items;
  }

  async createTag(data: Omit<ClientTag, "id" | "userCount">): Promise<ClientTag> {
    const json = await api<{ item: ClientTag }>("/api/crm/tags", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return json.item;
  }

  async updateTag(id: string, data: Partial<ClientTag>): Promise<ClientTag> {
    const json = await api<{ item: ClientTag }>(`/api/crm/tags/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    return json.item;
  }

  async deleteTag(id: string): Promise<void> {
    await api(`/api/crm/tags/${encodeURIComponent(id)}`, { method: "DELETE" });
  }

  // === Segments ===
  async listSegments(): Promise<ClientSegment[]> {
    const json = await api<{ items: ClientSegment[] }>("/api/crm/segments");
    return json.items;
  }

  async createSegment(data: Omit<ClientSegment, "id" | "userCount" | "createdAt">): Promise<ClientSegment> {
    const json = await api<{ item: ClientSegment }>("/api/crm/segments", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return json.item;
  }

  // === Notes ===
  async getNotes(clientId: string): Promise<ClientNote[]> {
    const json = await api<{ items: ClientNote[] }>(
      `${API_BASE}/${encodeURIComponent(clientId)}/notes`
    );
    return json.items;
  }

  async addNote(
    clientId: string,
    content: string,
    _author: string,
    mentions: string[] = []
  ): Promise<ClientNote> {
    const json = await api<{ item: ClientNote }>(
      `${API_BASE}/${encodeURIComponent(clientId)}/notes`,
      {
        method: "POST",
        body: JSON.stringify({ content, mentions }),
      }
    );
    return json.item;
  }

  // === Related clients (graph by shared device/ip) ===
  async getRelatedUsers(id: string): Promise<BackofficeUser[]> {
    const json = await api<{ items: BackofficeUser[] }>(
      `${API_BASE}/${encodeURIComponent(id)}/related`
    );
    return json.items;
  }

  // === Stats ===
  async getStats(): Promise<{
    total: number;
    active: number;
    pendingKyc: number;
    frozen: number;
    highRisk: number;
    ftdCount: number;
  }> {
    const json = await api<{
      total: number;
      active: number;
      pendingKyc: number;
      frozen: number;
      highRisk: number;
      ftdCount: number;
    }>(`${API_BASE}/stats`);
    return {
      total: json.total,
      active: json.active,
      pendingKyc: json.pendingKyc,
      frozen: json.frozen,
      highRisk: json.highRisk,
      ftdCount: json.ftdCount,
    };
  }

  // === Client Detail (360) ===
  async getDetail(id: string): Promise<ClientDetailData | null> {
    try {
      const json = await api<{ detail: ClientDetailData }>(
        `${API_BASE}/${encodeURIComponent(id)}/detail`
      );
      return json.detail;
    } catch (err) {
      if (err instanceof Error && /404|Not found/i.test(err.message)) return null;
      throw err;
    }
  }
}

export const clientService = new ClientService();
