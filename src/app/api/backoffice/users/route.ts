import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

// 模拟用户数据
const mockUsers = [
  {
    id: "usr_001",
    uid: "TP2024001",
    email: "zhangsan@example.com",
    name: "张三",
    phone: "+86 138****1234",
    status: "active",
    kycStatus: "verified",
    level: "vip",
    balance: 125800.50,
    emailVerifiedAt: new Date("2024-01-15"),
    lastLoginAt: new Date("2024-03-20"),
    createdAt: new Date("2024-01-10"),
  },
  {
    id: "usr_002",
    uid: "TP2024002",
    email: "lisi@example.com",
    name: "李四",
    phone: "+86 139****5678",
    status: "active",
    kycStatus: "pending",
    level: "standard",
    balance: 56800.00,
    emailVerifiedAt: new Date("2024-02-01"),
    lastLoginAt: new Date("2024-03-19"),
    createdAt: new Date("2024-01-20"),
  },
  {
    id: "usr_003",
    uid: "TP2024003",
    email: "wangwu@example.com",
    name: "王五",
    phone: "+86 137****9012",
    status: "frozen",
    kycStatus: "verified",
    level: "premium",
    balance: 320000.00,
    emailVerifiedAt: new Date("2024-01-25"),
    lastLoginAt: new Date("2024-02-28"),
    createdAt: new Date("2024-01-25"),
  },
  {
    id: "usr_004",
    uid: "TP2024004",
    email: "zhaoliu@example.com",
    name: "赵六",
    phone: "+86 136****3456",
    status: "active",
    kycStatus: "not_submitted",
    level: "standard",
    balance: 0,
    emailVerifiedAt: null,
    lastLoginAt: new Date("2024-03-18"),
    createdAt: new Date("2024-02-05"),
  },
  {
    id: "usr_005",
    uid: "TP2024005",
    email: "chenqi@example.com",
    name: "陈七",
    phone: "+86 135****7890",
    status: "active",
    kycStatus: "rejected",
    level: "standard",
    balance: 5000.00,
    emailVerifiedAt: new Date("2024-02-10"),
    lastLoginAt: new Date("2024-03-15"),
    createdAt: new Date("2024-02-10"),
  },
  {
    id: "usr_006",
    uid: "TP2024006",
    email: "liuba@example.com",
    name: "刘八",
    phone: "+86 134****2345",
    status: "active",
    kycStatus: "verified",
    level: "enterprise",
    balance: 850000.00,
    emailVerifiedAt: new Date("2023-12-01"),
    lastLoginAt: new Date("2024-03-20"),
    createdAt: new Date("2023-12-01"),
  },
  {
    id: "usr_007",
    uid: "TP2024007",
    email: "yangjiu@example.com",
    name: "杨九",
    phone: "+86 133****6789",
    status: "pending",
    kycStatus: "not_submitted",
    level: "standard",
    balance: 0,
    emailVerifiedAt: null,
    lastLoginAt: null,
    createdAt: new Date("2024-03-01"),
  },
  {
    id: "usr_008",
    uid: "TP2024008",
    email: "huangshi@example.com",
    name: "黄十",
    phone: "+86 132****0123",
    status: "active",
    kycStatus: "verified",
    level: "vip",
    balance: 256000.75,
    emailVerifiedAt: new Date("2024-01-05"),
    lastLoginAt: new Date("2024-03-19"),
    createdAt: new Date("2024-01-05"),
  },
];

export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req);
  const { searchParams } = new URL(req.url);
  const mock = searchParams.get("mock") !== "false"; // 默认使用模拟数据

  // 开发模式下无认证也允许访问模拟数据
  if (!user && !mock) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const status = searchParams.get("status");

  // 使用模拟数据
  if (mock) {
    let filteredUsers = [...mockUsers];
    if (status) {
      filteredUsers = filteredUsers.filter(u => u.status === status);
    }

    return NextResponse.json({
      success: true,
      items: filteredUsers,
      total: filteredUsers.length,
      page,
      limit,
    });
  }

  // 真实数据库查询
  try {
    const where = status ? { status } : {};
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          status: true,
          kycStatus: true,
          emailVerifiedAt: true,
          lastLoginAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    // 转换为前端期望的格式
    const items = users.map(u => ({
      ...u,
      uid: `TP${u.id.slice(-6).toUpperCase()}`,
      level: "standard",
      balance: 0,
    }));

    return NextResponse.json({ success: true, items, total, page, limit });
  } catch (error) {
    console.error("Failed to fetch users:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { userId, status } = body;
  if (!userId || !status) {
    return NextResponse.json({ error: "Missing userId or status" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { status },
  });

  return NextResponse.json({ user: updated });
}
