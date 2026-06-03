import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const globalForPrisma = globalThis;
const { Pool } = pg;
const connectionString = process.env.DATABASE_URL || "postgresql://localhost:5432/postgres";

const pool = globalForPrisma.prismaPool || new Pool({ connectionString });
if (!globalForPrisma.prismaPool) {
  globalForPrisma.prismaPool = pool;
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaPg(pool),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
