#!/usr/bin/env node
/**
 * US-LAUNCH-014 AC17 — seed the fixed TEST_USER_EMAIL account DIRECTLY via Prisma.
 *
 * Why not register over HTTP like scripts/ensure-payment-test-user.mjs does: since this
 * story a registered account starts unverified and cannot reach the AI-spend routes, and
 * sign-ups are rate limited per IP. Smoke tests must therefore LOG IN as a deliberately
 * seeded, pre-verified account rather than create one at runtime.
 *
 * This script does NOT read INTERNAL_TEST_EMAIL_DOMAINS — that is the point. Production
 * gets its test account without ever enabling the allowlist bypass.
 *
 * Idempotent: running it twice updates the same user and never creates a second user or
 * organization.
 *
 *   npm run seed:test-users
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
// The single source of truth for the duplicate-detection key — re-implementing it here
// would let the script and AuthService disagree about what counts as the same inbox.
// (Run under tsx, which resolves this .ts import from a .mjs entry point.)
import { normalizeEmail } from '../api/src/modules/auth/utils/email-policy.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootEnvPath = path.join(__dirname, '..', '.env');

if (fs.existsSync(rootEnvPath)) {
  const content = fs.readFileSync(rootEnvPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) process.env[key] = value;
  }
}

const email = process.env.TEST_USER_EMAIL;
const password = process.env.TEST_USER_PASSWORD;
const name = process.env.TEST_USER_NAME || 'Automated Test User';
const organizationName = process.env.TEST_USER_ORG_NAME || `${name}'s Organization`;

if (!email || !password) {
  console.error(
    '❌ Set TEST_USER_EMAIL and TEST_USER_PASSWORD (in .env or the environment) before running seed:test-users.',
  );
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set — this script writes to the database directly.');
  process.exit(1);
}

// Same cost factor as AuthService.register(), so a seeded password verifies identically.
const BCRYPT_ROUNDS = 10;

const prisma = new PrismaClient();

async function main() {
  const emailNormalized = normalizeEmail(email);
  const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const now = new Date();

  // Match the way register() detects duplicates, so a second run finds the row it wrote.
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { emailNormalized }] },
    select: { id: true, email: true, organizationId: true },
  });

  if (existing) {
    let organizationId = existing.organizationId;

    if (!organizationId) {
      const organization = await prisma.organization.create({
        data: { name: organizationName, planTier: 'free', monthlyLimit: 3 },
      });
      organizationId = organization.id;
      console.log(`   • created missing organization ${organizationId}`);
    }

    const user = await prisma.user.update({
      where: { id: existing.id },
      data: {
        password: hashedPassword,
        emailNormalized,
        emailVerified: true,
        emailVerifiedAt: now,
        organizationId,
      },
      select: { id: true, email: true, organizationId: true, emailVerified: true },
    });

    console.log('✅ Test user already existed — password reset and verification confirmed.');
    console.log(`   id=${user.id} email=${user.email} org=${user.organizationId} emailVerified=${user.emailVerified}`);
    return;
  }

  // Mirrors register()'s "Option 2": every new account gets its own free organization.
  const organization = await prisma.organization.create({
    data: { name: organizationName, planTier: 'free', monthlyLimit: 3 },
  });

  const user = await prisma.user.create({
    data: {
      // `email` is the address as typed; `emailNormalized` is the duplicate key only.
      email,
      emailNormalized,
      password: hashedPassword,
      name,
      organizationId: organization.id,
      // The whole reason this script exists: no inbox round-trip in automation.
      emailVerified: true,
      emailVerifiedAt: now,
    },
    select: { id: true, email: true, organizationId: true, emailVerified: true },
  });

  console.log('✅ Created verified test user.');
  console.log(`   id=${user.id} email=${user.email} org=${user.organizationId} emailVerified=${user.emailVerified}`);
}

main()
  .catch((error) => {
    console.error('❌ seed:test-users failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect().catch(() => undefined);
  });
