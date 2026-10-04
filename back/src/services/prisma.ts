import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const isPrismaConfigured = () => {
  const url = process.env.DATABASE_URL;
  return Boolean(
    url &&
      !url.includes("npg_placeholder") &&
      !url.includes("placeholder") &&
      url.startsWith("postgresql://")
  );
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
