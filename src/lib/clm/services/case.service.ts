/**
 * CLM Case Service — mock implementation.
 *
 * In-memory implementation of `ICaseService`. Used by default in
 * development and demos. The HTTP-backed counterpart lives in
 * `services/api/case.service.api.ts`; the factory in
 * `services/index.ts` decides which one to export based on
 * `USE_MOCK_API` from `lib/clm/config.ts`.
 */
import type {
  CLMCase,
  CLMCaseStatus,
  CaseListParams,
  PaginatedResult,
  CaseComment,
  CaseDetail,
} from "@/types/clm";
import type { ICaseService } from "./types";
import { mockCases, mockCaseDetail } from "../mock";
import { delay } from "@/lib/utils";

class CaseService implements ICaseService {
  private cases = [...mockCases];
  private auditLogs: import("@/types/clm").CLMAuditLog[] = [];

  async list(params: CaseListParams = {}): Promise<PaginatedResult<CLMCase>> {
    await delay(300);
    let result = [...this.cases];

    // Filter by case type
    if (params.caseType) {
      result = result.filter((c) => c.type === params.caseType);
    }

    // Filter by risk level
    if (params.riskLevel) {
      result = result.filter((c) => c.riskLevel === params.riskLevel);
    }

    // Filter by country
    if (params.country) {
      result = result.filter((c) => c.country === params.country);
    }

    // Filter by AML status
    if (params.amlStatus) {
      result = result.filter((c) => c.amlStatus === params.amlStatus);
    }

    // Filter by SLA status
    if (params.slaStatus) {
      result = result.filter((c) => c.slaStatus === params.slaStatus);
    }

    // Filter by case status
    if (params.status) {
      result = result.filter((c) => c.status === params.status);
    }

    // Filter by status set (Review Queue's "active" lock-down)
    if (params.statusIn && params.statusIn.length > 0) {
      const set = new Set(params.statusIn);
      result = result.filter((c) => set.has(c.status));
    }

    // Filter by assignee
    if (params.assignee) {
      if (params.assignee === "unassigned") {
        result = result.filter((c) => !c.assigneeId);
      } else if (params.assignee === "me") {
        result = result.filter((c) => c.assigneeId === "staff-001");
      } else {
        result = result.filter((c) => c.assigneeId === params.assignee);
      }
    }

    // Search
    if (params.search) {
      const kw = params.search.toLowerCase();
      result = result.filter(
        (c) =>
          c.caseNo.toLowerCase().includes(kw) ||
          c.customerName.toLowerCase().includes(kw) ||
          c.customerUid.includes(kw) ||
          c.country.toLowerCase().includes(kw) ||
          c.type.toLowerCase().includes(kw)
      );
    }

    // Filter by priority
    if (params.priority) {
      result = result.filter((c) => c.priority === params.priority);
    }

    // Filter by source channel
    if (params.sourceChannel) {
      result = result.filter((c) => c.sourceChannel === params.sourceChannel);
    }

    // Filter by auto review result
    if (params.autoReviewResult) {
      result = result.filter((c) => c.autoReviewResult === params.autoReviewResult);
    }

    // Date range
    if (params.startDate) {
      result = result.filter((c) => c.createdAt >= params.startDate!);
    }
    if (params.endDate) {
      result = result.filter((c) => c.createdAt <= params.endDate!);
    }

    // Sort by priority: Critical > High > Medium > Low, then by SLA status
    result.sort((a, b) => {
      const priorityScore = { critical: 4, high: 3, medium: 2, low: 1 };
      const slaScore = { timeout: 3, near_timeout: 2, normal: 1 };
      const scoreA = priorityScore[a.riskLevel] * 10 + slaScore[a.slaStatus] * 3;
      const scoreB = priorityScore[b.riskLevel] * 10 + slaScore[b.slaStatus] * 3;
      return scoreB - scoreA;
    });

    const page = params.page || 1;
    const pageSize = params.pageSize || 10;
    const start = (page - 1) * pageSize;
    const paginated = result.slice(start, start + pageSize);

    return { items: paginated, total: result.length, page, pageSize };
  }

  async getById(id: string): Promise<(CLMCase & Partial<CaseDetail>) | null> {
    await delay(200);
    const caseItem = this.cases.find((c) => c.id === id);
    if (!caseItem) return null;

    // Merge with detail data for the first case (richest)
    if (id === "case-001") {
      return { ...caseItem, ...mockCaseDetail };
    }

    // Generate basic detail for all other cases
    return {
      ...caseItem,
      personalInfo: {
        registrationTime: caseItem.createdAt,
        registrationIp: "192.168.1.***",
        registrationDevice: "Chrome / Windows 10",
        registrationSource: caseItem.sourceChannel ? caseItem.sourceChannel.charAt(0).toUpperCase() + caseItem.sourceChannel.slice(1) : "Website",
        emailMasked: `${caseItem.customerName.toLowerCase().replace(/\s/g, ".")}@example.com`,
        phoneMasked: "+** **** ****",
      },
      customerSnapshot: {
        id: caseItem.customerId,
        uid: caseItem.customerUid,
        name: caseItem.customerName,
        email: `${caseItem.customerName.toLowerCase().replace(/\s/g, ".")}@example.com`,
        phone: "+** **** ****",
        country: caseItem.country === "VN" ? "Vietnam" : caseItem.country === "IN" ? "India" :
                 caseItem.country === "KR" ? "South Korea" : caseItem.country === "JP" ? "Japan" :
                 caseItem.country === "FR" ? "France" : caseItem.country === "ES" ? "Spain" :
                 caseItem.country === "BR" ? "Brazil" : caseItem.country === "AE" ? "UAE" :
                 caseItem.country === "SG" ? "Singapore" : caseItem.country === "SE" ? "Sweden" :
                 caseItem.country === "ID" ? "Indonesia" : caseItem.country === "CY" ? "Cyprus" :
                 caseItem.country === "AU" ? "Australia" : caseItem.country === "VG" ? "British Virgin Islands" :
                 caseItem.country,
        nationality: caseItem.country === "VN" ? "Vietnam" : caseItem.country === "IN" ? "India" :
                      caseItem.country === "KR" ? "South Korean" : caseItem.country === "JP" ? "Japanese" :
                      caseItem.country === "FR" ? "French" : caseItem.country === "ES" ? "Spanish" :
                      caseItem.country === "BR" ? "Brazilian" : caseItem.country === "AE" ? "Emirati" :
                      caseItem.country,
        dateOfBirth: "1990-01-01",
        registrationDate: caseItem.createdAt,
        kycLevel: caseItem.kycLevel || "tier1",
        accountStatus: "active",
        totalCases: 1,
        pendingCases: ["pending", "reviewing"].includes(caseItem.status) ? 1 : 0,
        lastCaseType: caseItem.type,
        lastCaseStatus: caseItem.status,
      },
      submittedMaterials: [
        {
          id: `mat-${id}`,
          type: "id_document",
          label: "Identity Document",
          url: "/mock/id-front.jpg",
          status: "submitted",
          submittedAt: caseItem.createdAt,
          ocrResult: {
            extractedName: caseItem.customerName,
            extractedNumber: Math.random().toString(36).toUpperCase().slice(2, 12),
            extractedNationality: caseItem.country,
            extractedDateOfBirth: "1990-01-01",
            extractedExpiryDate: "2030-01-01",
            confidence: 0.85 + Math.random() * 0.15,
            mismatches: [],
          },
        },
      ],
      riskAssessment: {
        riskScore: caseItem.riskLevel === "critical" ? 88 : caseItem.riskLevel === "high" ? 72 :
                   caseItem.riskLevel === "medium" ? 55 : 25,
        riskLevel: caseItem.riskLevel,
        amlStatus: caseItem.amlStatus,
        countryRisk: "medium",
        deviceRisk: "normal",
        ipRisk: "normal",
        fundingRisk: "normal",
        multiAccountRisk: "none",
        indicators: caseItem.amlStatus === "hit" ? [
          { type: "aml_hit", level: "high", description: "Name matched AML watchlist" },
        ] : [],
      },
      experience: {
        family: { maritalStatus: "married", dependents: 1 },
        education: { level: "bachelor", field: "Business" },
        employment: { status: "employed", occupation: "Professional", employer: "Company" },
        financial: { annualIncome: "$25k – $50k", netWorth: "$50k – $100k" },
        trading: { years: "1-3", products: ["Forex"], leverageUnderstanding: true, riskUnderstanding: true },
        declarations: { isUSPerson: false, isPEP: false, isMilitary: false, isFinancialProfessional: false, hasCriminalRecord: false },
      },
      agreements: [
        {
          id: `agr-${id}-1`, name: "Client Agreement", version: "v1.2",
          signedAt: caseItem.createdAt, ipAddress: "192.168.1.1",
          language: "English", signatureType: "text", status: "signed",
        },
      ],
      disclaimer: {
        usPerson: false, pep: false, military: false, financialProfessional: false,
        criminalRecord: false, taxResidency: caseItem.country === "VN" ? "Vietnam" : caseItem.country === "IN" ? "India" : caseItem.country,
        fatcaRelated: false, declarationsConfirmed: true,
      },
      autoReview: {
        ocrScore: 0.88, ocrPassed: true, amlResult: caseItem.amlStatus,
        amlDetails: caseItem.amlStatus === "hit" ? ["Name matched sanctions list"] : [],
        faceMatchScore: 0.82, faceMatchPassed: true, deviceRisk: "normal", ipRisk: "normal",
        riskEngineScore: caseItem.riskLevel === "critical" ? 85 : caseItem.riskLevel === "high" ? 70 :
                         caseItem.riskLevel === "medium" ? 50 : 30,
        overall: caseItem.amlStatus === "hit" ? "manual_review" : "auto_pass",
      },
      comments: [],
      timeline: [
        { id: `evt-${id}-1`, timestamp: caseItem.createdAt, actor: "System", actorRole: "System", action: "Case Created", description: `Auto-created from ${caseItem.triggerSource}` },
        ...(caseItem.assigneeId ? [{ id: `evt-${id}-2`, timestamp: caseItem.updatedAt, actor: caseItem.assigneeName || "System", actorRole: "Reviewer", action: "Case Assigned", description: `Assigned to ${caseItem.assigneeName}` }] : []),
      ],
    };
  }

  async getMyTasks(userId: string): Promise<CLMCase[]> {
    await delay(200);
    return this.cases.filter(
      (c) =>
        c.assigneeId === userId &&
        ["pending", "reviewing", "escalated", "resubmission"].includes(c.status)
    );
  }

  // Review actions
  async approve(id: string, reviewerId: string, notes?: string): Promise<void> {
    await delay(500);
    this.updateCaseStatus(id, "approved", reviewerId, notes);
  }

  async reject(id: string, reviewerId: string, reason: string): Promise<void> {
    await delay(500);
    this.updateCaseStatus(id, "rejected", reviewerId, reason);
  }

  async requestResubmission(id: string, reviewerId: string, reason: string): Promise<void> {
    await delay(500);
    const index = this.cases.findIndex((c) => c.id === id);
    if (index === -1) return;
    this.cases[index] = {
      ...this.cases[index],
      status: "resubmission",
      resubmissionReason: reason,
      reviewedAt: new Date().toISOString(),
      reviewedBy: reviewerId,
    };
  }

  async escalate(id: string, reviewerId: string, reason: string): Promise<void> {
    await delay(500);
    const index = this.cases.findIndex((c) => c.id === id);
    if (index === -1) return;
    this.cases[index] = {
      ...this.cases[index],
      status: "escalated",
      reviewReason: reason,
      reviewedAt: new Date().toISOString(),
      reviewedBy: reviewerId,
    };
  }

  async assign(id: string, assigneeId: string, assignedBy: string): Promise<void> {
    await delay(300);
    const index = this.cases.findIndex((c) => c.id === id);
    if (index === -1) return;
    this.cases[index] = {
      ...this.cases[index],
      assigneeId,
      assigneeName: assigneeId === "staff-001" ? "Admin A" : assigneeId === "staff-002" ? "Admin B" : "Senior Reviewer",
      status: this.cases[index].status === "pending" ? "reviewing" : this.cases[index].status,
      updatedAt: new Date().toISOString(),
    };
  }

  // Comments
  async addComment(id: string, comment: CaseComment): Promise<void> {
    await delay(200);
    const caseItem = this.cases.find((c) => c.id === id);
    if (!caseItem) return;
    // In real implementation, persist comment
  }

  // Batch operations
  async batchApprove(ids: string[], reviewerId: string): Promise<void> {
    await delay(800);
    for (const id of ids) {
      this.updateCaseStatus(id, "approved", reviewerId);
    }
  }

  async batchAssign(ids: string[], assigneeId: string, assignedBy: string): Promise<void> {
    await delay(500);
    for (const id of ids) {
      await this.assign(id, assigneeId, assignedBy);
    }
  }

  private updateCaseStatus(
    id: string,
    status: CLMCaseStatus,
    reviewerId: string,
    reason?: string
  ) {
    const index = this.cases.findIndex((c) => c.id === id);
    if (index === -1) return;
    this.cases[index] = {
      ...this.cases[index],
      status,
      reviewDecision: status as "approve" | "reject" | "resubmit" | "escalate",
      reviewReason: reason,
      reviewedAt: new Date().toISOString(),
      reviewedBy: reviewerId,
      updatedAt: new Date().toISOString(),
    };
  }
}

export const caseService = new CaseService();
