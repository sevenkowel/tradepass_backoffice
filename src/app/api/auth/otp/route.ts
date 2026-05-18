import { NextRequest, NextResponse } from "next/server";
import { generateOTPCode, generate2FACode, verifyOTPCode, verify2FACode } from "@/lib/otp";

/**
 * POST /api/auth/otp
 * OTP 验证码接口 —— MVP Demo 专用
 *
 * 不调用真实 SMS/邮件网关，直接返回当天验证码。
 * 生产环境替换为真实发送逻辑。
 *
 * Body:
 *   - type: "otp" | "2fa"
 *   - target: string (邮箱或手机号，用于记录日志)
 *   - action: "register" | "login" | "reset_password"
 *
 * Response:
 *   - success: true
 *   - code: string (仅 Demo 环境返回，生产环境不返回)
 *   - hint: string
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      type: "otp" | "2fa";
      target: string;
      action: string;
    };

    const { type, target, action } = body;

    if (!target || !action) {
      return NextResponse.json(
        { error: "Missing target or action" },
        { status: 400 }
      );
    }

    // Demo 模式：直接生成并返回验证码
    // 生产环境：这里应该调用 SMS/邮件网关发送验证码，不返回 code
    const code = type === "2fa" ? generate2FACode() : generateOTPCode();
    const hint = type === "2fa"
      ? "请输入当天 2FA 验证码（6位：YYMMDD）"
      : "请输入当天 OTP 验证码（4位：MMDD）";

    console.log(`[OTP Demo] ${action} → ${type} to ${target}: ${code}`);

    return NextResponse.json({
      success: true,
      code, // ⚠️ 仅 Demo 返回，生产环境必须删除此行
      hint,
      expiresIn: 300, // 5 minutes
    });
  } catch (err) {
    console.error("OTP error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/auth/otp/verify
 * 验证 OTP 码
 *
 * Body:
 *   - type: "otp" | "2fa"
 *   - code: string
 */
export async function PUT(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      type: "otp" | "2fa";
      code: string;
    };

    const { type, code } = body;

    if (!code) {
      return NextResponse.json(
        { error: "Missing code" },
        { status: 400 }
      );
    }

    const valid = type === "2fa" ? verify2FACode(code) : verifyOTPCode(code);

    return NextResponse.json({
      success: valid,
      valid,
    });
  } catch (err) {
    console.error("OTP verify error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
