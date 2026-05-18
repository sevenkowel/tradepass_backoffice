/**
 * KYC Review Service
 */
import type { UserKYC, KYCStatus } from "@/lib/kyc/types";
import { mockKYCRecords, mockClientNames } from "../mock-kyc";
import { delay } from "@/lib/utils";

class KYCService {
  private records = [...mockKYCRecords];

  async list(params: { status?: KYCStatus; search?: string } = {}): Promise<{
    items: UserKYC[];
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  }> {
    await delay(300);
    let result = [...this.records];

    if (params.status) {
      if (params.status === 'submitted') {
        result = result.filter(r => r.status === 'submitted' || r.status === 'supplemental_required');
      } else {
        result = result.filter(r => r.status === params.status);
      }
    }

    if (params.search) {
      const kw = params.search.toLowerCase();
      result = result.filter(r => {
        const clientName = (mockClientNames[r.userId] || '').toLowerCase();
        return r.userId.toLowerCase().includes(kw) || clientName.includes(kw) || r.regionCode?.toLowerCase().includes(kw);
      });
    }

    const pending = this.records.filter(r => r.status === 'submitted').length;
    const approved = this.records.filter(r => r.status === 'approved').length;
    const rejected = this.records.filter(r => r.status === 'rejected').length;

    return { items: result, total: this.records.length, pending, approved, rejected };
  }

  async getById(id: string): Promise<UserKYC | null> {
    await delay(200);
    const record = this.records.find(r => r.id === id);
    return record ? { ...record } : null;
  }

  async approve(id: string, reviewerId: string, notes?: string): Promise<void> {
    await delay(500);
    const index = this.records.findIndex(r => r.id === id);
    if (index === -1) return;
    this.records = this.records.map((r, i) => i === index
      ? { ...r, status: 'approved' as KYCStatus, reviewedAt: new Date().toISOString(), reviewedBy: reviewerId }
      : r
    );
  }

  async reject(id: string, reviewerId: string, reason: string): Promise<void> {
    await delay(500);
    const index = this.records.findIndex(r => r.id === id);
    if (index === -1) return;
    this.records = this.records.map((r, i) => i === index
      ? { ...r, status: 'rejected' as KYCStatus, rejectionReason: reason, reviewedAt: new Date().toISOString(), reviewedBy: reviewerId }
      : r
    );
  }

  async requestResubmit(id: string, reviewerId: string, reason: string): Promise<void> {
    await delay(500);
    const index = this.records.findIndex(r => r.id === id);
    if (index === -1) return;
    this.records = this.records.map((r, i) => i === index
      ? { ...r, status: 'supplemental_required' as KYCStatus, rejectionReason: reason, reviewedAt: new Date().toISOString(), reviewedBy: reviewerId }
      : r
    );
  }
}

export const kycService = new KYCService();
