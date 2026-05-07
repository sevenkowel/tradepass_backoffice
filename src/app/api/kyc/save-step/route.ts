import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { checkStepPermission, type StepName, getEnabledSteps } from "@/lib/kyc/guard";
import { createKYCRecord } from "@/lib/kyc/state-machine";
import type { RegionCode } from "@/lib/kyc/region-config";

/**
 * POST /api/kyc/save-step
 * 保存 KYC 中间步骤数据到数据库
 *
 * Body: {
 *   step: 1 | 2 | 3 | 4
 *   data: {
 *     // Step 1 (document)
 *     documentType?: string
 *     documentFrontUrl?: string
 *     documentBackUrl?: string
 *     selfieUrl?: string
 *     ocrConfidence?: number
 *     ocrData?: object
 *
 *     // Step 2 (liveness)
 *     livenessPassed?: boolean
 *     livenessVideoUrl?: string
 *
 *     // Step 3 (personalInfo)
 *     personalInfo?: object
 *
 *     // Step 4 (agreements)
 *     agreementsSigned?: object[]
 *   }
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { step, data } = body;

    if (!step || typeof step !== "number" || step < 1 || step > 6) {
      return NextResponse.json({ error: "Invalid step. Must be 1-6." }, { status: 400 });
    }

    if (!data || typeof data !== "object") {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    // 获取或创建 KYC 记录
    let record = await prisma.kYCRecord.findUnique({
      where: { userId: user.id },
    });

    if (!record) {
      // 如果没有记录， Step 1 时必须传 regionCode
      const regionCode = data.regionCode as RegionCode | undefined;
      if (!regionCode) {
        return NextResponse.json(
          { error: "regionCode is required for first step" },
          { status: 400 }
        );
      }
      record = await createKYCRecord(user.id, regionCode, "basic");
    }

    // 检查步骤权限
    const regionCode = (record.regionCode as RegionCode) || null;
    const steps = getEnabledSteps(regionCode);
    const stepName: StepName = steps[step - 1] || "region";
    
    const kycData = {
      documentFrontUrl: record.documentFrontUrl || undefined,
      documentBackUrl: record.documentBackUrl || undefined,
      ocrData: record.ocrConfidence ? { confidence: record.ocrConfidence } : undefined,
      livenessPassed: record.livenessPassed || undefined,
      personalInfo: record.personalInfo ? JSON.parse(record.personalInfo as string) : undefined,
    };

    const permission = checkStepPermission(stepName, regionCode, kycData as Record<string, unknown>);
    if (!permission.allowed) {
      return NextResponse.json(
        { error: permission.message, missingStep: permission.missingStep },
        { status: 403 }
      );
    }

    // 构建更新数据
    const updateData: Record<string, unknown> = {};

    if (step === 1) {
      if (data.documentType) updateData.documentType = data.documentType;
      if (data.documentFrontUrl) updateData.documentFrontUrl = data.documentFrontUrl;
      if (data.documentBackUrl) updateData.documentBackUrl = data.documentBackUrl;
      if (data.selfieUrl) updateData.selfieUrl = data.selfieUrl;
      if (data.ocrConfidence !== undefined) updateData.ocrConfidence = data.ocrConfidence;
      if (data.ocrData) updateData.ocrData = JSON.stringify(data.ocrData);
      updateData.status = "ocr_processing";
    }

    if (step === 2) {
      if (data.livenessPassed !== undefined) updateData.livenessPassed = data.livenessPassed;
      if (data.livenessVideoUrl) updateData.livenessVideoUrl = data.livenessVideoUrl;
      updateData.status = "liveness_completed";
    }

    if (step === 3) {
      if (data.personalInfo) updateData.personalInfo = JSON.stringify(data.personalInfo);
      updateData.status = "personal_info_completed";
    }

    if (step === 4) {
      // Step 4 (agreements) 在提交时才统一保存，中间步骤无需写入数据库
      updateData.status = "agreement_pending";
    }

    // 更新记录
    await prisma.kYCRecord.update({
      where: { userId: user.id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: `Step ${step} saved successfully`,
    });
  } catch (err) {
    console.error("KYC save-step error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
