import path from 'path';
import { config } from 'dotenv';
import { ensureDatabaseUrlFromPgEnv } from './src/common/ensure-database-url';

// Load .env from repo root (parent of api/) and api/.env when cwd is api/
config({ path: path.resolve(process.cwd(), '../.env') });
config({ path: path.resolve(process.cwd(), '.env') });
ensureDatabaseUrlFromPgEnv();

import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env.DATABASE_URL!,
  },
});
