/**
 * KYC 类型定义
 */

export type { RegionCode, KYCLevel, DocumentType } from "./region-config";
import type { RegionCode, KYCLevel, DocumentType } from "./region-config";

// KYC 状态
export type KYCStatus =
  | "not_started"           // 未开始
  | "region_selected"       // 已选择地区
  | "document_uploaded"     // 证件已上传
  | "ocr_processing"        // OCR 识别中
  | "ocr_completed"         // OCR 完成（含个人信息确认）
  | "personal_info_pending" // 待填写个人信息
  | "personal_info_completed" // 个人信息已完成
  | "liveness_pending"      // 待活体检测
  | "liveness_completed"    // 活体检测完成
  | "address_proof_pending" // 待上传地址证明
  | "address_proof_completed" // 地址证明完成
  | "experience_pending"    // 待填写经验信息
  | "experience_completed"  // 经验信息完成
  | "agreement_pending"     // 待签署协议
  | "submitted"             // 已提交审核
  | "under_review"          // 审核中
  | "supplemental_required" // 需要补充材料（reviewer 退回）
  | "approved"              // 已通过
  | "rejected";             // 已拒绝

// KYC 步骤（按新流程 6 步）
export type KYCStep =
  | "region"
  | "document"
  | "liveness"
  | "address-proof"
  | "experience"
  | "agreement";

// 用户 KYC 记录
export interface UserKYC {
  id: string;
  userId: string;
  regionCode: RegionCode;
  kycLevel: KYCLevel;
  status: KYCStatus;
  currentStep: number; // 1-4
  
  // 证件信息
  documentType?: DocumentType;
  documentFrontUrl?: string;
  documentBackUrl?: string;
  selfieUrl?: string;
  documentNumber?: string;
  documentExpiryDate?: string;
  
  // OCR 结果
  ocrData?: OCRResult;
  ocrConfidence?: number;
  
  // 活体检测
  livenessPassed?: boolean;
  livenessAttempts?: number;
  livenessVideoUrl?: string;
  
  // 个人信息（基础，在 Step 2 确认 OCR 时填写）
  personalInfo?: PersonalInfo;
  
  // Step 4: 地址证明
  addressProofUrl?: string;
  addressProofType?: string;
  addressProofUploadedAt?: string;
  
  // Step 5: 经验信息
  experienceInfo?: ExperienceInfo;
  
  // Step 6: 协议签署
  agreementsSigned?: AgreementSignature[];
  signatureType?: "handwritten" | "text";  // 签名方式
  
  // 审核信息
  submittedAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
  rejectionDetails?: string;
  
  // 时间戳
  createdAt: string;
  updatedAt: string;
}

// OCR 识别结果
export interface OCRResult {
  documentType: DocumentType;
  fullName?: string;
  idNumber?: string;
  dateOfBirth?: string;
  nationality?: string;
  expiryDate?: string;
  address?: string;
  gender?: string;
  issuingCountry?: string;
  confidence: number;
  rawData: Record<string, unknown>;
  // 用户确认相关
  userConfirmed?: boolean;
  userEditedFields?: string[];
  nameSimilarity?: number;
}

// 个人信息
export interface PersonalInfo {
  // 基础信息
  fullName: string;
  dateOfBirth: string;
  nationality: string;
  placeOfBirth?: string;
  gender?: "male" | "female" | "other";
  
  // 联系信息
  phone: string;
  email: string;
  address: string;
  city: string;
  postalCode?: string;
  country: string;

  // 地址证明
  addressProofType?: string;
  addressProofUrl?: string;
  
  // 教育背景与就业
  education?: EducationInfo;
  employment?: EmploymentInfo;
  
  // 投资经验
  investmentExperience?: InvestmentExperience;
  
  // 财务状况
  financialStatus?: FinancialStatus;
  
  // 声明
  declarations?: Declarations;
}

// 教育背景
export interface EducationInfo {
  highestLevel: "high_school" | "bachelor" | "master" | "doctorate" | "other";
  fieldOfStudy?: string;
  institution?: string;
}

// 投资经验
export interface InvestmentExperience {
  yearsOfExperience: "none" | "less_than_1" | "1_to_3" | "3_to_5" | "more_than_5";
  tradingFrequency: "rarely" | "monthly" | "weekly" | "daily";
  productsTraded: string[]; // forex, stocks, crypto, etc.
  averageTradeSize?: string;
  riskTolerance: "low" | "medium" | "high";
  knowledgeCheck?: KnowledgeCheck;
}

// 交易知识测验
export interface KnowledgeCheck {
  leverageAnswer?: string;
  marginCallAnswer?: string;
  stopLossAnswer?: string;
}

// 财务状况
export interface FinancialStatus {
  annualIncome: "below_25k" | "25k_to_50k" | "50k_to_100k" | "100k_to_250k" | "above_250k";
  netWorth: "below_50k" | "50k_to_100k" | "100k_to_500k" | "500k_to_1m" | "above_1m";
  sourceOfFunds: string;
  investmentObjectives: string[];
}

// 经验信息（Step 5 聚合）
export interface ExperienceInfo {
  // 就业
  employment?: EmploymentInfo;
  // 教育
  education?: EducationInfo;
  // 投资经验
  investmentExperience?: InvestmentExperience;
  // 财务状况
  financialStatus?: FinancialStatus;
  // 专业知识
  professionalKnowledge?: ProfessionalKnowledge;
  // 声明
  declarations?: Declarations;
}

// 就业信息
export interface EmploymentInfo {
  employmentStatus: "employed" | "self_employed" | "retired" | "student" | "unemployed";
  occupation?: string;
  industry?: string;
  employer?: string;
  position?: string;
  yearsInCurrentJob?: string;
}

// 专业知识
export interface ProfessionalKnowledge {
  financeKnowledge: "none" | "basic" | "intermediate" | "advanced" | "expert";
  tradingKnowledge: "none" | "basic" | "intermediate" | "advanced" | "expert";
  hasProfessionalCertification: boolean;
  certificationDetails?: string;
  investmentGoal: "income" | "growth" | "speculation" | "hedging" | "diversification";
}

// 声明
export interface Declarations {
  isUSPerson: boolean;
  isPEP: boolean; // Politically Exposed Person
  isMilitary: boolean;
  isFinancialProfessional: boolean;
  hasCriminalRecord: boolean;
  
  // 详细声明
  usPersonDetails?: {
    isUSCitizen: boolean;
    isUSResident: boolean;
    isUSGreenCardHolder: boolean;
    taxId?: string; // W-9 或 W-8BEN
  };
  
  pepDetails?: {
    isPEP: boolean;
    relationship?: "self" | "family" | "associate";
    position?: string;
    country?: string;
  };
  
  militaryDetails?: {
    isMilitary: boolean;
    branch?: string;
    rank?: string;
    country?: string;
  };
  
  professionalDetails?: {
    isProfessional: boolean;
    licenseType?: string;
    licenseNumber?: string;
    employer?: string;
  };
}

// 协议签署
export interface AgreementSignature {
  agreementId: string;
  agreementName: string;
  version: string;
  signedAt: string;
  signature: string; // 用户输入的姓名
  ipAddress: string;
  userAgent: string;
}

// KYC 协议
export interface KYCAgreement {
  id: string;
  name: string;
  title: string;
  content: string;
  version: string;
  required: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

// API 请求/响应类型

// 获取 KYC 配置请求
export interface GetKYCConfigRequest {
  region: RegionCode;
}

export interface GetKYCConfigResponse {
  config: unknown; // RegionKYCConfig
}

// 上传证件请求
export interface UploadDocumentRequest {
  documentType: DocumentType;
  frontImage: string; // base64
  backImage?: string; // base64
}

export interface UploadDocumentResponse {
  documentId: string;
  frontUrl: string;
  backUrl?: string;
}

// OCR 识别请求
export interface OCRRequest {
  documentId: string;
}

export interface OCRResponse {
  success: boolean;
  data?: OCRResult;
  error?: string;
}

// 活体检测请求
export interface LivenessRequest {
  videoData: string; // base64 video
  actions: string[]; // ["blink", "turn_head"]
}

export interface LivenessResponse {
  success: boolean;
  passed: boolean;
  confidence: number;
  error?: string;
}

// 提交个人信息请求
export interface SubmitPersonalInfoRequest {
  personalInfo: PersonalInfo;
}

export interface SubmitPersonalInfoResponse {
  success: boolean;
  error?: string;
}

// 签署协议请求
export interface SignAgreementsRequest {
  signatures: {
    agreementId: string;
    signature: string;
  }[];
}

export interface SignAgreementsResponse {
  success: boolean;
  error?: string;
}

// 提交审核请求
export interface SubmitKYCRequest {
  confirm: boolean;
}

export interface SubmitKYCResponse {
  success: boolean;
  status: KYCStatus;
  estimatedReviewTime?: string;
  error?: string;
}

// 获取 KYC 状态响应
export interface GetKYCStatusResponse {
  status: KYCStatus;
  currentStep: number;
  progress: number; // 0-100
  canProceed: boolean;
  requiredActions?: string[];
  rejectionReason?: string;
  reviewedAt?: string;
}
