import { PrismaClient } from "@prisma/client";
import { mockPrismaProxy } from "@/lib/mock/prisma-proxy";

// When MOCK_DB=true, use the in-memory mock — no SQLite required.
if (process.env.MOCK_DB === "true") {
  (global as unknown as Record<string, unknown>).__mockDb = true;
}

const globalForPrisma = global as unknown as { prisma: PrismaClient };

function createClient(): PrismaClient {
  if (process.env.MOCK_DB === "true") {
    return mockPrismaProxy as unknown as PrismaClient;
  }
  return new PrismaClient();
}

export const prisma = globalForPrisma.prisma || createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
