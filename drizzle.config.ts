import { config } from "dotenv";
import { resolve } from "path";
import { defineConfig } from "drizzle-kit";

import { ensureDatabaseUrlFromPgEnv } from "./api/src/common/ensure-database-url";

[resolve(process.cwd(), ".env"), resolve(process.cwd(), "../.env")].forEach((p) =>
  config({ path: p })
);
ensureDatabaseUrlFromPgEnv();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL or PG* vars required. Ensure the database is provisioned.");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
