import { config } from "dotenv";
import { defineConfig } from "prisma/config";

config({ path: ".env.local" });

// `prisma generate` (run by `postinstall` on every fresh install, including
// Vercel builds) never connects to the database, but the config is still loaded
// and used to fail outright when DATABASE_URL wasn't set yet. The placeholder
// only satisfies that load; commands that really connect (db push, migrate)
// need the real DATABASE_URL and will fail against the placeholder.
const PLACEHOLDER_URL = "postgresql://placeholder:placeholder@localhost:5432/placeholder";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL ?? PLACEHOLDER_URL,
  },
});
