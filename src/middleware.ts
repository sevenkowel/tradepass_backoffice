/**
 * Middleware - Demo Mode (完全开放，无认证)
 *
 * 所有路由直接放行，用于快速验证 Demo
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Demo 模式：直接放行所有请求
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
