try {
  // Built-in to Node 20.6+: loads .env.local without external packages
  (process as unknown as { loadEnvFile?: (path: string) => void }).loadEnvFile?.(".env.local");
} catch {
  // Fall back silently if file doesn't exist
}

import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});


