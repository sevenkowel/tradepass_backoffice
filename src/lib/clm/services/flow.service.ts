/**
 * Simplified Configuration service (PRD v2.0).
 *
 * Sub-namespaces — `flows`, `routingRules`, `autoReviewRules`,
 * and the per-module system configs — replace what the old policies /
 * levels / forms / templates / workflows / routing surfaces used to do.
 * The new shape is one CRUD bag per entity, no version history, no
 * nested per-language editing; the simplification PRD explicitly called
 * out the old surface as too heavy.
 *
 * Pages call `clmFlowService.{flows,routingRules,...}.list()` etc.;
 * the older `clmConfigService.agreements` namespace stays untouched
 * (Agreement Documents kept its rich version model).
 */
import type {
  AutoReviewRule,
  ConfigStatus,
  IdentityModuleConfig,
  KYCFlow,
  KYCFlowRoutingRule,
  POAModuleConfig,
  IncomeProofModuleConfig,
  LivenessModuleConfig,
  QuestionnaireModuleConfig,
} from "@/types/clm";
import {
  mockAutoReviewRules,
  mockIdentityModuleConfig,
  mockKycFlowRoutingRules,
  mockKycFlows,
  mockPOAModuleConfig,
  mockIncomeProofModuleConfig,
  mockLivenessModuleConfig,
  mockQuestionnaireModuleConfig,
} from "../mock";
import { delay } from "@/lib/utils";

interface ConfigEntity {
  id: string;
  status: ConfigStatus;
  updatedAt: string;
  updatedBy: string;
  createdAt: string;
}

function nowIso(): string {
  return new Date().toISOString();
}

/** Generic CRUD builder so each sub-namespace can stay one line. */
function makeCrud<T extends ConfigEntity>(prefix: string, seed: T[]) {
  const pool: T[] = [...seed];
  let counter = pool.length;

  return {
    async list(): Promise<T[]> {
      await delay(120);
      return [...pool].sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    },
    async getById(id: string): Promise<T | null> {
      await delay(60);
      return pool.find((r) => r.id === id) ?? null;
    },
    async create(
      input: Omit<T, "id" | "updatedBy" | "updatedAt" | "createdAt">,
      actor: string
    ): Promise<T> {
      await delay(180);
      counter += 1;
      const ts = nowIso();
      const row = {
        ...input,
        id: `${prefix}-${String(counter).padStart(3, "0")}`,
        updatedBy: actor,
        updatedAt: ts,
        createdAt: ts,
      } as unknown as T;
      pool.unshift(row);
      return row;
    },
    async update(id: string, patch: Partial<T>, actor: string): Promise<T | null> {
      await delay(140);
      const idx = pool.findIndex((r) => r.id === id);
      if (idx < 0) return null;
      const merged = {
        ...pool[idx],
        ...patch,
        updatedBy: actor,
        updatedAt: nowIso(),
      } as T;
      pool[idx] = merged;
      return merged;
    },
    async setStatus(id: string, status: ConfigStatus, actor: string): Promise<void> {
      await delay(120);
      const idx = pool.findIndex((r) => r.id === id);
      if (idx < 0) return;
      pool[idx] = {
        ...pool[idx],
        status,
        updatedBy: actor,
        updatedAt: nowIso(),
      };
    },
    async remove(id: string): Promise<void> {
      await delay(120);
      const idx = pool.findIndex((r) => r.id === id);
      if (idx >= 0) pool.splice(idx, 1);
    },
  };
}

/** Generic singleton module builder — one persistent row, get + update. */
function makeSingletonModule<T extends { id: string; updatedBy: string; updatedAt: string }>(
  seed: T
) {
  let row: T = { ...seed };
  return {
    async get(): Promise<T> {
      await delay(100);
      return { ...row };
    },
    async update(
      patch: Partial<Omit<T, "id" | "createdAt">>,
      actor: string
    ): Promise<T> {
      await delay(160);
      row = { ...row, ...patch, updatedBy: actor, updatedAt: nowIso() };
      return { ...row };
    },
  };
}

export const clmFlowService = {
  flows: makeCrud<KYCFlow>("flow", mockKycFlows),
  routingRules: makeCrud<KYCFlowRoutingRule>("fr", mockKycFlowRoutingRules),
  autoReviewRules: makeCrud<AutoReviewRule>("ar", mockAutoReviewRules),
  identityModule:     makeSingletonModule<IdentityModuleConfig>(mockIdentityModuleConfig),
  poaModule:          makeSingletonModule<POAModuleConfig>(mockPOAModuleConfig),
  incomeProofModule:  makeSingletonModule<IncomeProofModuleConfig>(mockIncomeProofModuleConfig),
  livenessModule:     makeSingletonModule<LivenessModuleConfig>(mockLivenessModuleConfig),
  questionnaireModule: makeSingletonModule<QuestionnaireModuleConfig>(mockQuestionnaireModuleConfig),
};

export type IClmFlowService = typeof clmFlowService;
