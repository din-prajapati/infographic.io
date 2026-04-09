import 'dotenv/config';
import { ensureDatabaseUrlFromPgEnv } from './api/src/common/ensure-database-url';

ensureDatabaseUrlFromPgEnv();

import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'api/prisma/schema.prisma',
  migrations: {
    path: 'api/prisma/migrations',
  },
  datasource: {
    url: process.env.DATABASE_URL!,
  },
});
