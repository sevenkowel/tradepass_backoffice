import { mockPrismaProxy } from "@/lib/mock/prisma-proxy";

// Use a type-only import so the @prisma/client module (and its native engine
// binary) is never loaded when MOCK_DB=true.  The real `require()` below only
// runs in non-mock mode, which prevents the OpenSSL/libssl load error on
// Alpine-based containers that don't have OpenSSL 1.1.x installed.
type PrismaClientType = import("@prisma/client").PrismaClient;
const globalForPrisma = global as unknown as { prisma: PrismaClientType };

function createClient(): PrismaClientType {
  if (process.env.MOCK_DB === "true") {
    return mockPrismaProxy as unknown as PrismaClientType;
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaClient } = require("@prisma/client") as typeof import("@prisma/client");
  return new PrismaClient();
}

export const prisma: PrismaClientType = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
