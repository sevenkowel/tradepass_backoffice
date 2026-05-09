/**
 * Client Mock Service
 * 封装客户数据的 CRUD 操作，保证数据不可变性
 */

import type {
  BackofficeUser,
  ClientListParams,
  ClientTag,
  ClientSegment,
  ClientNote,
} from "@/types/backoffice/user";
import type { ClientDetailData } from "@/types/backoffice/client-detail";
import { mockClients, mockClientTags, mockClientSegments, mockClientNotes } from "../mock-clients";
import {
  mockTradingAccounts,
  mockFundRecords,
  mockTradeRecords,
  mockTradingStats,
  mockKYCDocuments,
  mockKYCRiskIndicators,
  mockClientDevices,
  mockCaseItems,
  mockTickets,
  mockClientPermissions,
  mockClientAgreements,
  mockTimelineEvents,
  mockAuditLogs,
  mockRiskRelationships,
  mockRiskFactors,
  mockLifecycleStages,
  mockUserValueMetrics,
  mockClientNotes as mockDetailNotes,
} from "../mock-client-detail";
import { delay } from "@/lib/utils";

class ClientService {
  private clients = [...mockClients];
  private tags = [...mockClientTags];
  private segments = [...mockClientSegments];
  private notes = [...mockClientNotes];

  async list(params: Partial<ClientListParams> = {}): Promise<{ items: BackofficeUser[]; total: number }> {
    await delay(300);
    let result = [...this.clients];

    // 搜索过滤
    if (params.search) {
      const keyword = params.search.toLowerCase();
      result = result.filter(
        (c) =>
          c.uid.toLowerCase().includes(keyword) ||
          c.name.toLowerCase().includes(keyword) ||
          c.email.toLowerCase().includes(keyword) ||
          c.phone.includes(keyword)
      );
    }

    // 状态过滤
    if (params.status) {
      result = result.filter((c) => c.status === params.status);
    }
    if (params.kycStatus) {
      result = result.filter((c) => c.kycStatus === params.kycStatus);
    }
    if (params.level) {
      result = result.filter((c) => c.level === params.level);
    }
    if (params.riskLevel) {
      result = result.filter((c) => c.riskLevel === params.riskLevel);
    }
    if (params.lifecycleStage) {
      result = result.filter((c) => c.lifecycleStage === params.lifecycleStage);
    }
    if (params.country) {
      result = result.filter((c) => c.country === params.country);
    }
    if (params.hasFtd !== undefined) {
      result = result.filter((c) => (c.ftdDate ? true : false) === params.hasFtd);
    }
    if (params.tags && params.tags.length > 0) {
      result = result.filter((c) => params.tags!.some((tag) => c.tags.includes(tag)));
    }

    // 排序
    if (params.sortBy) {
      const order = params.sortOrder === "asc" ? 1 : -1;
      result.sort((a, b) => {
        const aVal = (a as Record<string, unknown>)[params.sortBy!];
        const bVal = (b as Record<string, unknown>)[params.sortBy!];
        if (typeof aVal === "number" && typeof bVal === "number") {
          return (aVal - bVal) * order;
        }
        return String(aVal).localeCompare(String(bVal)) * order;
      });
    }

    const total = result.length;

    // 分页
    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    result = result.slice(start, end);

    return { items: result, total };
  }

  async getById(id: string): Promise<BackofficeUser | null> {
    await delay(200);
    const client = this.clients.find((c) => c.id === id);
    return client ? { ...client } : null;
  }

  async getByUid(uid: string): Promise<BackofficeUser | null> {
    await delay(200);
    const client = this.clients.find((c) => c.uid === uid);
    return client ? { ...client } : null;
  }

  async update(id: string, data: Partial<BackofficeUser>): Promise<BackofficeUser> {
    await delay(400);
    const index = this.clients.findIndex((c) => c.id === id);
    if (index === -1) throw new Error("Client not found");

    const updated = { ...this.clients[index], ...data };
    this.clients = this.clients.map((c, i) => (i === index ? updated : c));
    return { ...updated };
  }

  async freeze(id: string): Promise<void> {
    await this.update(id, { status: "frozen" });
  }

  async unfreeze(id: string): Promise<void> {
    await this.update(id, { status: "active" });
  }

  async addTags(id: string, tagNames: string[]): Promise<void> {
    await delay(200);
    const index = this.clients.findIndex((c) => c.id === id);
    if (index === -1) throw new Error("Client not found");

    const client = this.clients[index];
    const newTags = [...new Set([...client.tags, ...tagNames])];
    this.clients = this.clients.map((c, i) => (i === index ? { ...c, tags: newTags } : c));
  }

  async removeTags(id: string, tagNames: string[]): Promise<void> {
    await delay(200);
    const index = this.clients.findIndex((c) => c.id === id);
    if (index === -1) throw new Error("Client not found");

    const client = this.clients[index];
    const newTags = client.tags.filter((t) => !tagNames.includes(t));
    this.clients = this.clients.map((c, i) => (i === index ? { ...c, tags: newTags } : c));
  }

  // === Tags ===
  async listTags(): Promise<ClientTag[]> {
    await delay(200);
    return [...this.tags];
  }

  async createTag(data: Omit<ClientTag, "id" | "userCount">): Promise<ClientTag> {
    await delay(300);
    const newTag: ClientTag = {
      ...data,
      id: `tag-${Date.now()}`,
      userCount: 0,
    };
    this.tags = [...this.tags, newTag];
    return { ...newTag };
  }

  async updateTag(id: string, data: Partial<ClientTag>): Promise<ClientTag> {
    await delay(300);
    const index = this.tags.findIndex((t) => t.id === id);
    if (index === -1) throw new Error("Tag not found");

    const updated = { ...this.tags[index], ...data };
    this.tags = this.tags.map((t, i) => (i === index ? updated : t));
    return { ...updated };
  }

  async deleteTag(id: string): Promise<void> {
    await delay(200);
    this.tags = this.tags.filter((t) => t.id !== id);
  }

  // === Segments ===
  async listSegments(): Promise<ClientSegment[]> {
    await delay(200);
    return [...this.segments];
  }

  // === Notes ===
  async getNotes(clientId: string): Promise<ClientNote[]> {
    await delay(200);
    return this.notes
      .filter((n) => n.clientId === clientId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async addNote(clientId: string, content: string, author: string, mentions: string[] = []): Promise<ClientNote> {
    await delay(300);
    const note: ClientNote = {
      id: `note-${Date.now()}`,
      clientId,
      content,
      author,
      mentions,
      isPinned: false,
      createdAt: new Date().toISOString(),
    };
    this.notes = [...this.notes, note];
    return { ...note };
  }

  // === Related Users ===
  async getRelatedUsers(id: string): Promise<BackofficeUser[]> {
    await delay(300);
    const client = this.clients.find((c) => c.id === id);
    if (!client || !client.relatedUserIds) return [];

    return client.relatedUserIds
      .map((rid) => this.clients.find((c) => c.id === rid))
      .filter(Boolean)
      .map((c) => ({ ...c! }));
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
    await delay(200);
    const total = this.clients.length;
    const active = this.clients.filter((c) => c.status === "active").length;
    const pendingKyc = this.clients.filter(
      (c) => c.kycStatus === "pending" || c.kycStatus === "not_submitted"
    ).length;
    const frozen = this.clients.filter((c) => c.status === "frozen").length;
    const highRisk = this.clients.filter((c) => c.riskLevel === "high" || c.riskLevel === "critical").length;
    const ftdCount = this.clients.filter((c) => c.ftdDate).length;

    return { total, active, pendingKyc, frozen, highRisk, ftdCount };
  }

  // === Client Detail (360) ===
  async getDetail(id: string): Promise<ClientDetailData | null> {
    await delay(400);
    const client = this.clients.find((c) => c.id === id);
    if (!client) return null;

    return {
      user: { ...client },
      accounts: mockTradingAccounts,
      funds: mockFundRecords.filter((f) => f.clientId === id),
      trades: mockTradeRecords.filter((t) => t.clientId === id),
      tradingStats: mockTradingStats,
      kycDocuments: mockKYCDocuments.filter((d) => d.clientId === id),
      kycRiskIndicators: mockKYCRiskIndicators,
      devices: mockClientDevices.filter((d) => d.clientId === id),
      cases: mockCaseItems.filter((c) => c.clientId === id),
      tickets: mockTickets.filter((t) => t.clientId === id),
      permissions: mockClientPermissions,
      agreements: mockClientAgreements.filter((a) => a.clientId === id),
      timeline: mockTimelineEvents
        .filter((e) => e.clientId === id)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
      notes: mockDetailNotes
        .filter((n) => n.clientId === id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
      auditLogs: mockAuditLogs
        .filter((l) => l.clientId === id)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
      riskRelationships: mockRiskRelationships,
      riskFactors: mockRiskFactors,
      lifecycleStages: mockLifecycleStages,
      valueMetrics: mockUserValueMetrics,
    };
  }
}

export const clientService = new ClientService();
