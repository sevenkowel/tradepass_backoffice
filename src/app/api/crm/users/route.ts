import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

// 模拟用户数据（开发模式使用）
const mockUsers = [
  {
    id: "usr_001",
    uid: "USR001",
    name: "张三",
    email: "zhangsan@example.com",
    phone: "+86 138****1234",
    status: "active",
    kycStatus: "verified",
    level: "vip",
    balance: 125800.50,
    equity: 125800.50,
    createdAt: "2024-01-10T00:00:00.000Z",
    lastLoginAt: "2024-03-20T00:00:00.000Z",
    tags: ["高频交易", "VIP客户"],
    country: "CN",
  },
  {
    id: "usr_002",
    uid: "USR002",
    name: "李四",
    email: "lisi@example.com",
    phone: "+86 139****5678",
    status: "active",
    kycStatus: "pending",
    level: "standard",
    balance: 56800.00,
    equity: 56800.00,
    createdAt: "2024-01-20T00:00:00.000Z",
    lastLoginAt: "2024-03-19T00:00:00.000Z",
    tags: [],
    country: "CN",
  },
  {
    id: "usr_003",
    uid: "USR003",
    name: "王五",
    email: "wangwu@example.com",
    phone: "+86 137****9012",
    status: "frozen",
    kycStatus: "verified",
    level: "premium",
    balance: 320000.00,
    equity: 320000.00,
    createdAt: "2024-01-25T00:00:00.000Z",
    lastLoginAt: "2024-02-28T00:00:00.000Z",
    tags: ["大额客户"],
    country: "CN",
  },
  {
    id: "usr_004",
    uid: "USR004",
    name: "赵六",
    email: "zhaoliu@example.com",
    phone: "+86 136****3456",
    status: "active",
    kycStatus: "not_submitted",
    level: "standard",
    balance: 0,
    equity: 0,
    createdAt: "2024-02-05T00:00:00.000Z",
    lastLoginAt: "2024-03-18T00:00:00.000Z",
    tags: ["新客户"],
    country: "CN",
  },
  {
    id: "usr_005",
    uid: "USR005",
    name: "陈七",
    email: "chenqi@example.com",
    phone: "+86 135****7890",
    status: "active",
    kycStatus: "rejected",
    level: "standard",
    balance: 5000.00,
    equity: 5000.00,
    createdAt: "2024-02-10T00:00:00.000Z",
    lastLoginAt: "2024-03-15T00:00:00.000Z",
    tags: [],
    country: "CN",
  },
  {
    id: "usr_006",
    uid: "USR006",
    name: "刘八",
    email: "liuba@example.com",
    phone: "+86 134****2345",
    status: "active",
    kycStatus: "verified",
    level: "enterprise",
    balance: 850000.00,
    equity: 850000.00,
    createdAt: "2023-12-01T00:00:00.000Z",
    lastLoginAt: "2024-03-20T00:00:00.000Z",
    tags: ["机构客户", "VIP"],
    country: "CN",
  },
  {
    id: "usr_007",
    uid: "USR007",
    name: "杨九",
    email: "yangjiu@example.com",
    phone: "+86 133****6789",
    status: "pending",
    kycStatus: "not_submitted",
    level: "standard",
    balance: 0,
    equity: 0,
    createdAt: "2024-03-01T00:00:00.000Z",
    lastLoginAt: null,
    tags: ["待激活"],
    country: "CN",
  },
  {
    id: "usr_008",
    uid: "USR008",
    name: "黄十",
    email: "huangshi@example.com",
    phone: "+86 132****0123",
    status: "active",
    kycStatus: "verified",
    level: "vip",
    balance: 256000.75,
    equity: 256000.75,
    createdAt: "2024-01-05T00:00:00.000Z",
    lastLoginAt: "2024-03-19T00:00:00.000Z",
    tags: [],
    country: "CN",
  },
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const useMock = searchParams.get("mock") !== "false"; // 默认使用模拟数据

  // 检查认证
  const user = await getCurrentUser(req);
  
  // 未登录且不使用模拟数据时返回 401
  if (!user && !useMock) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 使用模拟数据
  if (useMock) {
    return NextResponse.json({
      success: true,
      items: mockUsers,
      total: mockUsers.length,
    });
  }

  // 真实数据库查询
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        status: true,
        kycStatus: true,
        createdAt: true,
        lastLoginAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const wallets = await prisma.wallet.findMany({
      select: { userId: true, balance: true },
    });
    const walletMap = new Map(wallets.map((w) => [w.userId, w.balance]));

    const items = users.map((u, i) => ({
      id: u.id,
      uid: `USR${String(i + 1).padStart(3, "0")}`,
      name: u.name ?? "Unknown",
      email: u.email,
      phone: u.phone ?? "-",
      status: u.status === "active" ? "active" : u.status === "suspended" ? "frozen" : "pending",
      kycStatus: u.kycStatus ?? "not_submitted",
      level: (walletMap.get(u.id) ?? 0) > 10000 ? "vip" : (walletMap.get(u.id) ?? 0) > 5000 ? "premium" : "standard",
      balance: walletMap.get(u.id) ?? 0,
      equity: walletMap.get(u.id) ?? 0,
      createdAt: u.createdAt.toISOString(),
      lastLoginAt: u.lastLoginAt?.toISOString() ?? u.createdAt.toISOString(),
      tags: [],
      country: "-",
    }));

    return NextResponse.json({ success: true, items, total: items.length });
  } catch (error) {
    console.error("Failed to fetch users:", error);
    // 数据库失败时回退到模拟数据
    return NextResponse.json({
      success: true,
      items: mockUsers,
      total: mockUsers.length,
    });
  }
}
