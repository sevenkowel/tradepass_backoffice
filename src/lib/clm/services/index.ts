/**
 * CLM service barrel + dispatch.
 *
 * Pages and components import from here only — never reach into
 * `./case.service` or `./api/*.api` directly. The exported instance is
 * picked at module load time based on `USE_MOCK_API` from
 * `lib/clm/config.ts`, so toggling the env var swaps every consumer
 * with a single restart.
 *
 * To add a new method:
 *   1. Add to the interface in `./types.ts`.
 *   2. Implement in both `./case.service.ts` and `./api/case.service.api.ts`.
 *   3. The barrel export below picks up the change automatically.
 */

import type { ICaseService, IWorkspaceService, IAuditService } from "./types";
import { USE_MOCK_API } from "../config";

import { caseService as mockCaseService } from "./case.service";
import { workspaceService as mockWorkspaceService } from "./workspace.service";
import { auditService as mockAuditService } from "./audit.service";
import { clmConfigService as mockConfigService } from "./config.service";
import { reVerificationService as mockReVerificationService } from "./re-verification.service";
import { clmFlowService as mockFlowService } from "./flow.service";

import { apiCaseService } from "./api/case.service.api";
import { apiWorkspaceService } from "./api/workspace.service.api";
import { apiAuditService } from "./api/audit.service.api";
import { apiClmConfigService } from "./api/config.service.api";

export const caseService: ICaseService = USE_MOCK_API ? mockCaseService : apiCaseService;
export const workspaceService: IWorkspaceService = USE_MOCK_API
  ? mockWorkspaceService
  : apiWorkspaceService;
export const auditService: IAuditService = USE_MOCK_API ? mockAuditService : apiAuditService;
export const clmConfigService = USE_MOCK_API ? mockConfigService : apiClmConfigService;

// Phase 4 / Re-Verification: no API stub yet — real backend will land
// in a follow-up. The mock service is the only implementation today.
export const reVerificationService = mockReVerificationService;

// v2.0 simplified Configuration surface (KYC Flows / Routing & Rules /
// System Modules). Replaces what `clmConfigService.{policies,levels,
// forms,templates,workflows}` used to model; agreements stay on the
// rich config service since the Agreement Documents module wasn't
// simplified.
export const clmFlowService = mockFlowService;

// Convenient re-exports
export type { ICaseService, IWorkspaceService, IAuditService } from "./types";
export type { IClmConfigService } from "./config.service";
export type { IClmFlowService } from "./flow.service";
export type { IReVerificationService } from "./re-verification.service";
export { USE_MOCK_API, CLM_API_BASE, clmEndpoint } from "../config";
