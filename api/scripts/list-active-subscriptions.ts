/**
 * List active (and optionally all) subscriptions in the DB.
 * Run from repo root: npx tsx api/scripts/list-active-subscriptions.ts
 * Or from api/: npx tsx scripts/list-active-subscriptions.ts
 *
 * Loads .env from repo root so DATABASE_URL is set.
 */
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load root .env so DATABASE_URL or PG* vars are available
const rootEnv = path.resolve(__dirname, '../../.env');
if (fs.existsSync(rootEnv)) {
  const content = fs.readFileSync(rootEnv, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    if (key && !process.env[key]) process.env[key] = value;
  }
}

// Build DATABASE_URL from PG* if not set (avoids credentials-in-URI security warnings)
if (
  !process.env.DATABASE_URL &&
  process.env.PGUSER &&
  process.env.PGPASSWORD &&
  process.env.PGHOST
) {
  const port = process.env.PGPORT || '5432';
  const db = process.env.PGDATABASE || 'neondb';
  const user = encodeURIComponent(process.env.PGUSER);
  const password = encodeURIComponent(process.env.PGPASSWORD);
  process.env.DATABASE_URL = `postgresql://${user}:${password}@${process.env.PGHOST}:${port}/${db}?sslmode=require`;
}

const prisma = new PrismaClient();

async function main() {
  const byStatus = await prisma.subscription.groupBy({
    by: ['status'],
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
  });

  const activeCount = await prisma.subscription.count({
    where: { status: 'ACTIVE' },
  });

  const activeList = await prisma.subscription.findMany({
    where: { status: 'ACTIVE' },
    select: {
      id: true,
      planTier: true,
      status: true,
      currentPeriodStart: true,
      currentPeriodEnd: true,
      paymentProvider: true,
      externalSubscriptionId: true,
      user: { select: { email: true, name: true } },
      organizationId: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  console.log('--- Subscription counts by status ---');
  byStatus.forEach((row) => {
    console.log(`  ${row.status}: ${row._count.id}`);
  });
  console.log('');
  console.log(`--- Active subscriptions: ${activeCount} ---`);
  if (activeList.length === 0) {
    console.log('  (none)');
  } else {
    activeList.forEach((sub, i) => {
      console.log(
        `  ${i + 1}. ${sub.planTier} | ${sub.user.email} | ${sub.externalSubscriptionId} | ${sub.currentPeriodStart.toISOString().slice(0, 10)} → ${sub.currentPeriodEnd.toISOString().slice(0, 10)}`
      );
    });
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
