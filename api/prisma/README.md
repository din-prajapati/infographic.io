# Prisma Configuration

## Current Setup

This project uses **Prisma 6.19.1** (due to Node.js version constraints).

### Schema Configuration

- `schema.prisma` contains the `url` property in the datasource block (required for Prisma 6)
- `prisma.config.ts` is prepared for future Prisma 7 migration

### Linter Warning

You may see a linter warning about `url` not being supported in schema files. This is expected because:
- The Prisma extension uses Prisma 7 rules
- We're using Prisma 6 which requires `url` in the schema
- This warning can be safely ignored until upgrading to Prisma 7

### Migration to Prisma 7

When ready to upgrade (requires Node.js 20.19+):
1. Upgrade Node.js to 20.19+ or 22.12+
2. Run: `npm install prisma@latest @prisma/client@latest`
3. Remove `url` from `schema.prisma` datasource block
4. The `prisma.config.ts` is already configured for Prisma 7
