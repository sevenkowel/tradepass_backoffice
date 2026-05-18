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

/**
 * In MOCK_DB mode the proxy is just an in-memory object — caching it on
 * `globalForPrisma` is harmless for connection pooling but DOES hide
 * module-level edits during HMR: changing `mockUsers` in
 * `mock/prisma-proxy.ts` won't propagate because we're reading the
 * stale reference captured at startup. Skip the global cache for the
 * mock branch so HMR picks up data tweaks without a server restart.
 */
function resolveClient(): PrismaClientType {
  if (process.env.MOCK_DB === "true") return createClient();
  return globalForPrisma.prisma ?? createClient();
}
export const prisma: PrismaClientType = resolveClient();

if (process.env.NODE_ENV !== "production" && process.env.MOCK_DB !== "true") {
  globalForPrisma.prisma = prisma;
}
