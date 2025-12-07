// src/lib/prisma.ts
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const globalForPrisma = global as unknown as { prisma?: PrismaClient };

// This URL should match your SQLite URL in prisma.config.ts
const adapter = new PrismaBetterSqlite3({
  url: "file:./dev.db",
  // If you prefer envs instead:
  // url: process.env.DATABASE_URL || "file:./dev.db",
});

const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter, // 👈 Prisma 7 is now happy
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
