import { PrismaClient } from "@/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export function createPrismaClient(): PrismaClient {
  let connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    // Use /tmp for Vercel (persists during deployment), ./ for local dev
    const dbPath = process.env.NODE_ENV === "production" ? "/tmp/dev.db" : "./dev.db";
    connectionString = `file:${dbPath}`;
  }

  const adapter = connectionString.startsWith("file:")
    ? new PrismaBetterSqlite3({ url: connectionString })
    : new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

export function getPrisma(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}
