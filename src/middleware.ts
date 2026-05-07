/**
 * Middleware - 登录拦截
 *
 * 受保护的路由：/console, /portal, /backoffice, /crm, /broker
 * 公开路由：/auth/*, /api/auth/*, /_next/*, /favicon.ico, 静态资源
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = [
  "/auth",
  "/api/auth",
  "/api/config",
  "/_next",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
];

// 需要登录的路由前缀
const PROTECTED_PATHS = [
  "/console",
  "/portal",
  "/backoffice",
  "/crm",
  "/broker",
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname.startsWith(p));
}

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATHS.some((p) => pathname.startsWith(p));
}

function getRedirectUrl(request: NextRequest): URL {
  const { pathname, search } = request.nextUrl;
  const callbackUrl = pathname + search;
  const loginUrl = new URL("/auth/login", request.url);
  loginUrl.searchParams.set("callbackUrl", callbackUrl);
  return loginUrl;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 公开路径直接放行
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // 非保护路径直接放行
  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  // 检查登录状态 (Cookie)
  const token = request.cookies.get("token");
  const mockUserRole = request.cookies.get("mock_user_role");
  const onboardingCompleted = request.cookies.get("onboarding_completed");

  const isLoggedIn = !!(token || mockUserRole);

  // Demo 模式特殊处理：如果有 onboarding_completed cookie 且值为 true，跳过登录
  if (mockUserRole && onboardingCompleted?.value === "true") {
    return NextResponse.next();
  }

  // 未登录，重定向到登录页
  if (!isLoggedIn) {
    return NextResponse.redirect(getRedirectUrl(request));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * 匹配所有路径，排除：
     * - _next/static (静态文件)
     * - _next/image (图片优化)
     * - favicon.ico (图标)
     * - 公共 API 路径已在函数中处理
     */
    "/((?!_next/image|_next/static|favicon.ico).*)",
  ],
};
