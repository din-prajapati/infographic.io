/**
 * Prisma and pg clients expect DATABASE_URL. When only PG* vars are set (common with Neon),
 * synthesize a URI. Safe to call multiple times.
 *
 * Format: postgresql://USER:PASS@HOST:PORT/DB?sslmode=require
 * User/password are URI-encoded for special characters in credentials.
 */
export function ensureDatabaseUrlFromPgEnv(): void {
  if (process.env.DATABASE_URL) return;
  if (!process.env.PGUSER || !process.env.PGPASSWORD || !process.env.PGHOST) return;

  const port = process.env.PGPORT || '5432';
  const db = process.env.PGDATABASE || 'neondb';
  const user = encodeURIComponent(process.env.PGUSER);
  const password = encodeURIComponent(process.env.PGPASSWORD);
  process.env.DATABASE_URL = `postgresql://${user}:${password}@${process.env.PGHOST}:${port}/${db}?sslmode=require`;
}
