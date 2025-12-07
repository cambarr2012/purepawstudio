// prisma.config.ts
import { defineConfig } from "prisma/config";

export default defineConfig({
  // Where your schema file lives
  schema: "schema.prisma",

  // Where migrations will be stored (Prisma will create this folder)
  migrations: {
    path: "prisma/migrations",
  },

  // ✅ NOTE: singular `datasource`, not `datasources`
  datasource: {
    // SQLite DB file in the project root
    url: "file:./dev.db",
  },
});
