/**
 * One-off: audit subscription vs payments for payment test users.
 * Run from api/: npx tsx scripts/audit-payment-user.ts
 */
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';
import { ensureDatabaseUrlFromPgEnv } from '../src/common/ensure-database-url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
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

loadEnvFile(path.resolve(__dirname, '../../.env'));
loadEnvFile(path.resolve(__dirname, '../.env'));
ensureDatabaseUrlFromPgEnv();

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: { email: { contains: 'payment.automation', mode: 'insensitive' } },
    select: { id: true, email: true },
    take: 20,
  });

  if (users.length === 0) {
    // eslint-disable-next-line no-console
    console.log('No users matching email contains "payment.automation"');
    return;
  }

  for (const u of users) {
    const subs = await prisma.subscription.findMany({
      where: { userId: u.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        planTier: true,
        billingPeriod: true,
        externalSubscriptionId: true,
        createdAt: true,
        payments: {
          select: {
            id: true,
            externalPaymentId: true,
            amount: true,
            status: true,
          },
        },
      },
    });

    const payments = await prisma.payment.findMany({
      where: { userId: u.id },
      orderBy: { createdAt: 'desc' },
      select: {
        externalPaymentId: true,
        amount: true,
        status: true,
        subscriptionId: true,
      },
    });

    const latest = subs[0];
    const mismatch =
      latest?.status === 'ACTIVE' &&
      payments.length === 0 &&
      (!latest.payments || latest.payments.length === 0);

    // eslint-disable-next-line no-console
    console.log('\n---', u.email, '---');
    // eslint-disable-next-line no-console
    console.log(
      JSON.stringify(
        {
          subscriptions: subs.map((s) => ({
            id: s.id,
            status: s.status,
            planTier: s.planTier,
            billingPeriod: s.billingPeriod,
            externalSubscriptionId: s.externalSubscriptionId,
            createdAt: s.createdAt,
            paymentCount: s.payments.length,
          })),
          topLevelPaymentRows: payments.length,
          paymentSamples: payments.slice(0, 5),
          ACTIVE_BUT_NO_PAYMENT_ROWS: mismatch,
        },
        null,
        2,
      ),
    );
  }
}

main()
  // eslint-disable-next-line no-console
  .catch(console.error)
  .finally(() => prisma.$disconnect());
