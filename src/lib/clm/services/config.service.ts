/**
 * CLM Config Service — mock CRUD for the six Phase 4 / M8 entities.
 *
 * One service, six entity types — they share a common base shape, so
 * passing the type around as a generic keeps the surface flat without
 * losing per-type narrowing at call sites.
 *
 * Pages import only from `@/lib/clm/services` (the barrel) — never from
 * this file. The barrel exports `configService` which the factory swaps
 * for an HTTP-backed implementation when `USE_MOCK_API === false`.
 */
import type {
  AgreementVersion,
  AgreementVersionStatus,
  ConfigAgreement,
  ConfigCreateInput,
  ConfigStatus,
  ConfigTemplate,
  ConfigUpdateInput,
  KYCForm,
  KYCLevelConfig,
  KYCPolicy,
  SignatureListParams,
  SignatureRecord,
  WorkflowRule,
} from "@/types/clm";
import {
  mockAgreements,
  mockForms,
  mockLevels,
  mockPolicies,
  mockSignatureRecords,
  mockTemplates,
  mockWorkflows,
} from "../mock";
import { delay } from "@/lib/utils";

/** Identity prefix per entity, used to generate ids in mock mode. */
const ID_PREFIX = {
  policy: "pol",
  level: "tier",
  form: "form",
  template: "tmp",
  agreement: "agr",
  workflow: "wf",
} as const;

type EntityKind = keyof typeof ID_PREFIX;

interface Pool {
  policy: KYCPolicy[];
  level: KYCLevelConfig[];
  form: KYCForm[];
  template: ConfigTemplate[];
  agreement: ConfigAgreement[];
  workflow: WorkflowRule[];
}

const pool: Pool = {
  policy: [...mockPolicies],
  level: [...mockLevels],
  form: [...mockForms],
  template: [...mockTemplates],
  agreement: [...mockAgreements],
  workflow: [...mockWorkflows],
};

function nextId(kind: EntityKind, count: number): string {
  return `${ID_PREFIX[kind]}-${String(count + 1).padStart(3, "0")}`;
}

interface CommonListParams {
  status?: ConfigStatus;
  search?: string;
}

interface ConfigEntity {
  id: string;
  status: ConfigStatus;
  updatedAt: string;
  updatedBy: string;
  createdAt: string;
  priority?: number;
  name?: string;
}

function applyCommon<T extends ConfigEntity>(
  rows: T[],
  params: CommonListParams
): T[] {
  let result = rows;
  if (params.status) result = result.filter((r) => r.status === params.status);
  if (params.search?.trim()) {
    const q = params.search.toLowerCase();
    result = result.filter((r) => r.name?.toLowerCase().includes(q));
  }
  return result;
}

interface ICrudService<TList, TCreate, TUpdate, TItem> {
  list(params?: TList): Promise<TItem[]>;
  create(input: TCreate, actor: string): Promise<TItem>;
  update(input: TUpdate, actor: string): Promise<TItem>;
  remove(id: string, actor: string): Promise<void>;
  setStatus(id: string, status: ConfigStatus, actor: string): Promise<TItem>;
}

function makeCrud<K extends EntityKind, T extends ConfigEntity>(
  kind: K
): ICrudService<
  CommonListParams,
  ConfigCreateInput<T>,
  ConfigUpdateInput<T>,
  T
> {
  return {
    async list(params: CommonListParams = {}) {
      await delay(120);
      const rows = pool[kind] as unknown as T[];
      return applyCommon(rows, params)
        .slice()
        .sort((a, b) => {
          const ap = a.priority ?? 0;
          const bp = b.priority ?? 0;
          if (ap !== bp) return bp - ap;
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        });
    },
    async create(input, actor) {
      await delay(180);
      const list = pool[kind] as unknown as T[];
      const now = new Date().toISOString();
      const row = {
        ...input,
        id: nextId(kind, list.length),
        updatedBy: actor,
        updatedAt: now,
        createdAt: now,
      } as unknown as T;
      list.unshift(row);
      return row;
    },
    async update(input, actor) {
      await delay(160);
      const list = pool[kind] as unknown as T[];
      const idx = list.findIndex((r) => r.id === input.id);
      if (idx < 0) throw new Error(`${kind} ${input.id} not found`);
      const merged = {
        ...list[idx],
        ...input,
        updatedBy: actor,
        updatedAt: new Date().toISOString(),
      } as T;
      list[idx] = merged;
      return merged;
    },
    async remove(id, _actor) {
      await delay(140);
      const list = pool[kind] as unknown as T[];
      const idx = list.findIndex((r) => r.id === id);
      if (idx >= 0) list.splice(idx, 1);
    },
    async setStatus(id, status, actor) {
      await delay(140);
      const list = pool[kind] as unknown as T[];
      const idx = list.findIndex((r) => r.id === id);
      if (idx < 0) throw new Error(`${kind} ${id} not found`);
      const merged = {
        ...list[idx],
        status,
        updatedBy: actor,
        updatedAt: new Date().toISOString(),
      } as T;
      list[idx] = merged;
      return merged;
    },
  };
}

/* ------------------------------------------------------------------------- */
/* Agreement-version operations + signature audit                            */
/* ------------------------------------------------------------------------- */

const agreementsCrud = makeCrud<"agreement", ConfigAgreement>("agreement");

/** Mutable signature pool — appended to when the preview-flow simulates
 *  an end-user signing event, so the Signatures tab updates live. */
const signaturePool: SignatureRecord[] = [...mockSignatureRecords];

const agreementsExtensions = {
  /** List versions for one agreement, latest first. */
  async listVersions(agreementId: string): Promise<AgreementVersion[]> {
    await delay(80);
    const all = (pool.agreement as ConfigAgreement[]).find((a) => a.id === agreementId);
    if (!all) return [];
    return [...all.versions].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  /** Create a new version. The new version is always created in `draft`
   *  status; the `publish` call below promotes it. */
  async createVersion(
    agreementId: string,
    input: Omit<AgreementVersion, "id" | "status" | "createdAt" | "createdBy" | "publishedAt" | "publishedBy">,
    actor: string
  ): Promise<AgreementVersion> {
    await delay(140);
    const list = pool.agreement as ConfigAgreement[];
    const idx = list.findIndex((a) => a.id === agreementId);
    if (idx < 0) throw new Error(`agreement ${agreementId} not found`);
    const nowIso = new Date().toISOString();
    const versionId = `agrv-${Date.now()}`;
    const row: AgreementVersion = {
      ...input,
      id: versionId,
      status: "draft",
      createdAt: nowIso,
      createdBy: actor,
    };
    list[idx] = {
      ...list[idx],
      versions: [row, ...list[idx].versions],
      updatedAt: nowIso,
      updatedBy: actor,
    };
    return row;
  },

  /** Patch a draft version. Only `draft` versions can be edited; the
   *  service throws if the caller tries to mutate an active or retired
   *  one (mirrors how the production backend should behave). */
  async updateVersion(
    agreementId: string,
    versionId: string,
    patch: Partial<Omit<AgreementVersion, "id" | "status" | "createdAt" | "createdBy">>,
    actor: string
  ): Promise<void> {
    await delay(140);
    const list = pool.agreement as ConfigAgreement[];
    const idx = list.findIndex((a) => a.id === agreementId);
    if (idx < 0) return;
    const versions = list[idx].versions.map((v) => {
      if (v.id !== versionId) return v;
      if (v.status !== "draft") {
        throw new Error("only draft versions can be edited");
      }
      return { ...v, ...patch };
    });
    list[idx] = {
      ...list[idx],
      versions,
      updatedAt: new Date().toISOString(),
      updatedBy: actor,
    };
  },

  /** Promote a draft to active. Auto-retires whatever was active before
   *  and updates the agreement's `currentVersion` + `activeVersionId`
   *  pointers so list-view summaries stay coherent. */
  async publishVersion(
    agreementId: string,
    versionId: string,
    actor: string
  ): Promise<void> {
    await delay(180);
    const list = pool.agreement as ConfigAgreement[];
    const idx = list.findIndex((a) => a.id === agreementId);
    if (idx < 0) return;
    const target = list[idx].versions.find((v) => v.id === versionId);
    if (!target) return;
    if (target.status !== "draft") {
      throw new Error("only draft versions can be published");
    }
    const nowIso = new Date().toISOString();
    const versions: AgreementVersion[] = list[idx].versions.map((v) => {
      if (v.id === versionId) {
        return { ...v, status: "active", publishedAt: nowIso, publishedBy: actor };
      }
      // Auto-retire the previous active.
      if (v.status === "active") return { ...v, status: "retired" };
      return v;
    });
    list[idx] = {
      ...list[idx],
      versions,
      currentVersion: target.version,
      activeVersionId: target.id,
      // Reset signedCount because the active version just changed.
      signedCount: 0,
      updatedAt: nowIso,
      updatedBy: actor,
    };
  },

  /** Move a version to retired without promoting another. Use for
   *  emergency rollback; `publishVersion` of an older draft is the
   *  normal flow. */
  async setVersionStatus(
    agreementId: string,
    versionId: string,
    status: AgreementVersionStatus,
    actor: string
  ): Promise<void> {
    await delay(140);
    const list = pool.agreement as ConfigAgreement[];
    const idx = list.findIndex((a) => a.id === agreementId);
    if (idx < 0) return;
    const versions = list[idx].versions.map((v) =>
      v.id === versionId ? { ...v, status } : v
    );
    list[idx] = {
      ...list[idx],
      versions,
      updatedAt: new Date().toISOString(),
      updatedBy: actor,
    };
  },

  /** Read the signature audit pool, optionally filtered. */
  async listSignatures(params: SignatureListParams = {}): Promise<SignatureRecord[]> {
    await delay(120);
    return signaturePool
      .filter((s) => {
        if (params.agreementId && s.agreementId !== params.agreementId) return false;
        if (params.versionId && s.versionId !== params.versionId) return false;
        if (params.userId && s.userId !== params.userId) return false;
        if (params.language && s.language !== params.language) return false;
        return true;
      })
      .sort(
        (a, b) =>
          new Date(b.signedAt).getTime() - new Date(a.signedAt).getTime()
      );
  },

  /** Append a synthetic signature — used by the operator-facing preview
   *  flow so the Signatures tab updates live with the captured PNG +
   *  reading proof. Production has a dedicated signing endpoint. */
  async recordSignature(
    record: Omit<SignatureRecord, "id">
  ): Promise<SignatureRecord> {
    await delay(120);
    const row: SignatureRecord = {
      ...record,
      id: `sig-${Date.now()}`,
    };
    signaturePool.unshift(row);
    // Bump signedCount on the agreement so list summaries stay accurate.
    const list = pool.agreement as ConfigAgreement[];
    const idx = list.findIndex((a) => a.id === row.agreementId);
    if (idx >= 0 && list[idx].activeVersionId === row.versionId) {
      list[idx] = { ...list[idx], signedCount: list[idx].signedCount + 1 };
    }
    return row;
  },
};

export const clmConfigService = {
  policies: makeCrud<"policy", KYCPolicy>("policy"),
  levels: makeCrud<"level", KYCLevelConfig>("level"),
  forms: makeCrud<"form", KYCForm>("form"),
  templates: makeCrud<"template", ConfigTemplate>("template"),
  agreements: { ...agreementsCrud, ...agreementsExtensions },
  workflows: makeCrud<"workflow", WorkflowRule>("workflow"),
};

/** Public type for the service — pages depend on this, not the
 *  underlying mock instance. */
export type IClmConfigService = typeof clmConfigService;
