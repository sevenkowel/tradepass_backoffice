/**
 * Dev-aware fetch wrapper
 * KYC API 在开发环境中本地 mock，不走网络，不受 MockFetch 认证限制
 */

/**
 * 读取 DevTools Mock 配置
 */
function readMockConfig(): {
  ocrConfidence: number;
  ocrSimulateError: boolean;
  livenessPassRate: number;
  livenessForceResult: string;
  reviewForceResult: string;
} {
  if (typeof window === "undefined") {
    return { ocrConfidence: 0.95, ocrSimulateError: false, livenessPassRate: 0.9, livenessForceResult: "auto", reviewForceResult: "auto" };
  }
  try {
    const stored = localStorage.getItem("kyc-mock-config");
    if (!stored) return { ocrConfidence: 0.95, ocrSimulateError: false, livenessPassRate: 0.9, livenessForceResult: "auto", reviewForceResult: "auto" };
    const config = JSON.parse(stored);
    const state = config?.state || {};
    return {
      ocrConfidence: state.ocrConfidence ?? 0.95,
      ocrSimulateError: state.ocrSimulateError ?? false,
      livenessPassRate: state.livenessPassRate ?? 0.9,
      livenessForceResult: state.livenessForceResult ?? "auto",
      reviewForceResult: state.reviewForceResult ?? "auto",
    };
  } catch {
    return { ocrConfidence: 0.95, ocrSimulateError: false, livenessPassRate: 0.9, livenessForceResult: "auto", reviewForceResult: "auto" };
  }
}

/**
 * 本地 mock OCR 响应
 */
async function mockOCRResponse(body: any): Promise<Response> {
  const config = readMockConfig();

  // DevTools: OCR 失败开关
  if (config.ocrSimulateError) {
    await mockDelay(600);
    return new Response(
      JSON.stringify({ success: false, error: "OCR engine error: Failed to extract text from image" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  const docType = body?.documentType || "passport";
  const mockNames = ["Nguyen Van A", "Tran Thi B", "Le Van C", "Pham Thi D", "Hoang Van E"];
  const mockName = mockNames[Math.floor(Math.random() * mockNames.length)];

  await mockDelay(800);
  const mockPassportId = `P${String(Math.floor(Math.random() * 90000000) + 10000000)}`;
  return new Response(
    JSON.stringify({
      success: true,
      data: {
        documentType: docType,
        fullName: mockName,
        idNumber: mockPassportId,
        dateOfBirth: "1990-01-01",
        nationality: "Vietnam",
        issuingCountry: "Vietnam",
        gender: "M",
        expiryDate: "2030-12-31",
        confidence: config.ocrConfidence,
      },
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}

/**
 * 本地 mock save-step 响应
 */
async function mockSaveStepResponse(): Promise<Response> {
  await mockDelay(200);
  return new Response(
    JSON.stringify({ success: true }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}

function mockDelay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 增强的 fetch
 * KYC API 本地 mock，其他请求正常 fetch
 */
export function devFetch(url: string, options: RequestInit = {}): Promise<Response> {
  // OCR 请求 — 本地 mock
  if (typeof window !== "undefined" && url.includes("/api/kyc/ocr")) {
    const body = options.body ? JSON.parse(options.body as string) : {};
    return mockOCRResponse(body);
  }

  // save-step 请求 — 本地 mock
  if (typeof window !== "undefined" && url.includes("/api/kyc/save-step")) {
    return mockSaveStepResponse();
  }

  // 其他请求正常走 fetch
  return fetch(url, options);
}
