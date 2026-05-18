/**
 * HTTP-backed CLM Config service stub.
 *
 * Mirrors the mock surface so pages don't need to know which one is wired
 * up. Throws `NotImplemented` until the backend lands.
 */
import type {
  ConfigAgreement,
  ConfigCreateInput,
  ConfigStatus,
  ConfigTemplate,
  ConfigUpdateInput,
  KYCForm,
  KYCLevelConfig,
  KYCPolicy,
  WorkflowRule,
} from "@/types/clm";
import type { IClmConfigService } from "../config.service";

function notImplemented(method: string): never {
  throw new Error(`[clmConfigService.api] ${method} not implemented yet`);
}

interface CommonListParams {
  status?: ConfigStatus;
  search?: string;
}

function makeStub<T>() {
  return {
    async list(_params?: CommonListParams): Promise<T[]> {
      notImplemented("list");
    },
    async create(_input: ConfigCreateInput<T & { id: string; status: ConfigStatus; updatedBy: string; updatedAt: string; createdAt: string }>, _actor: string): Promise<T> {
      notImplemented("create");
    },
    async update(_input: ConfigUpdateInput<T & { id: string; status: ConfigStatus; updatedBy: string; updatedAt: string; createdAt: string }>, _actor: string): Promise<T> {
      notImplemented("update");
    },
    async remove(_id: string, _actor: string): Promise<void> {
      notImplemented("remove");
    },
    async setStatus(_id: string, _status: ConfigStatus, _actor: string): Promise<T> {
      notImplemented("setStatus");
    },
  };
}

/** Agreements has extra version + signature methods on top of the
 *  generic CRUD; the stub spreads them all into one NotImplemented bag. */
const agreementsStub: IClmConfigService["agreements"] = {
  ...(makeStub<ConfigAgreement>() as IClmConfigService["agreements"]),
  async listVersions(_agreementId) { notImplemented("listVersions"); },
  async createVersion(_agreementId, _input, _actor) { notImplemented("createVersion"); },
  async updateVersion(_agreementId, _versionId, _patch, _actor) { notImplemented("updateVersion"); },
  async publishVersion(_agreementId, _versionId, _actor) { notImplemented("publishVersion"); },
  async setVersionStatus(_agreementId, _versionId, _status, _actor) { notImplemented("setVersionStatus"); },
  async listSignatures(_params) { notImplemented("listSignatures"); },
  async recordSignature(_record) { notImplemented("recordSignature"); },
};

export const apiClmConfigService: IClmConfigService = {
  policies: makeStub<KYCPolicy>() as IClmConfigService["policies"],
  levels: makeStub<KYCLevelConfig>() as IClmConfigService["levels"],
  forms: makeStub<KYCForm>() as IClmConfigService["forms"],
  templates: makeStub<ConfigTemplate>() as IClmConfigService["templates"],
  agreements: agreementsStub,
  workflows: makeStub<WorkflowRule>() as IClmConfigService["workflows"],
};
