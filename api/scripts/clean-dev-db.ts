/**
 * Clean Dev DB — removes ALL payment and user data for a fresh test start.
 * Safe to run against Neon dev DB; does NOT touch schema or templates.
 *
 * Run from repo root:  npm run clean-dev-db
 * Run from api/:      npx tsx scripts/clean-dev-db.ts
 */
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

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
if (!process.env.DATABASE_URL && process.env.PGUSER && process.env.PGPASSWORD && process.env.PGHOST) {
  const port = process.env.PGPORT || '5432';
  const db = process.env.PGDATABASE || 'neondb';
  const user = encodeURIComponent(process.env.PGUSER);
  const password = encodeURIComponent(process.env.PGPASSWORD);
  process.env.DATABASE_URL = `postgresql://${user}:${password}@${process.env.PGHOST}:${port}/${db}?sslmode=require`;
}

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Connecting to DB...');
  await prisma.$connect();

  console.log('Cleaning...');

  // Order matters — FK constraints
  const [messages, extractions, usageRecords, payments, invoices, subscriptions, infographics, apiKeys, conversations] =
    await Promise.all([
      prisma.message.deleteMany({}),
      prisma.extraction.deleteMany({}),
      prisma.usageRecord.deleteMany({}),
      prisma.payment.deleteMany({}),
      prisma.invoice.deleteMany({}),
      prisma.subscription.deleteMany({}),
      prisma.infographic.deleteMany({}),
      prisma.apiKey.deleteMany({}),
      prisma.conversation.deleteMany({}),
    ]);

  const usersDeleted = await prisma.user.deleteMany({});
  const orgsDeleted  = await prisma.organization.deleteMany({});

  console.log('Done.');
  console.log(`  Messages:    ${messages.count}`);
  console.log(`  Extractions: ${extractions.count}`);
  console.log(`  UsageRecords:${usageRecords.count}`);
  console.log(`  Payments:    ${payments.count}`);
  console.log(`  Invoices:    ${invoices.count}`);
  console.log(`  Subscriptions:${subscriptions.count}`);
  console.log(`  Infographics:${infographics.count}`);
  console.log(`  ApiKeys:     ${apiKeys.count}`);
  console.log(`  Conversations:${conversations.count}`);
  console.log(`  Users:       ${usersDeleted.count}`);
  console.log(`  Orgs:        ${orgsDeleted.count}`);
  console.log('\nDB is clean. Next steps:');
  console.log('  1. Clear browser localStorage — open DevTools (F12) → Application → Local Storage → right-click → Clear');
  console.log('     OR paste in browser console:  localStorage.clear()');
  console.log('  2. Register a fresh user at http://localhost:5000/auth');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
