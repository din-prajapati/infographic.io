/**
 * Development / QA seed script
 * Run: npm run db:seed
 *
 * Creates one org + one user per plan tier so every QA flow (free limit,
 * paid generation, team seats, usage meter) can be exercised without touching
 * real payment APIs. Passwords are the same for all seed users: Test@123!
 *
 * Idempotent: skips any record that already exists (matched by email).
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const PASSWORD = 'Test@123!';
const HASH_ROUNDS = 10;

// ---------------------------------------------------------------------------
// Seed data definitions
// ---------------------------------------------------------------------------

const ORGS = [
  {
    key: 'free',
    name: 'Free Tier Org (QA)',
    planTier: 'free',
    monthlyLimit: 3,
  },
  {
    key: 'solo',
    name: 'Solo Tier Org (QA)',
    planTier: 'solo',
    monthlyLimit: 50,
  },
  {
    key: 'team',
    name: 'Team Tier Org (QA)',
    planTier: 'team',
    monthlyLimit: 200,
  },
  {
    key: 'unlimited',
    name: 'Unlimited Tier Org (QA)',
    planTier: 'api_enterprise',
    monthlyLimit: -1,
  },
] as const;

const USERS = [
  {
    email: 'free@test.infographai.com',
    name: 'Free User (QA)',
    orgKey: 'free',
    role: 'owner',
  },
  {
    email: 'solo@test.infographai.com',
    name: 'Solo User (QA)',
    orgKey: 'solo',
    role: 'owner',
  },
  {
    email: 'team-owner@test.infographai.com',
    name: 'Team Owner (QA)',
    orgKey: 'team',
    role: 'owner',
  },
  {
    email: 'team-member@test.infographai.com',
    name: 'Team Member (QA)',
    orgKey: 'team',
    role: 'member',
  },
  {
    email: 'unlimited@test.infographai.com',
    name: 'Unlimited User (QA)',
    orgKey: 'unlimited',
    role: 'owner',
  },
] as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function upsertOrg(def: (typeof ORGS)[number]) {
  const existing = await prisma.organization.findFirst({
    where: { name: def.name },
  });
  if (existing) {
    console.log(`  ⏭️  Org already exists: ${def.name}`);
    return existing;
  }
  const org = await prisma.organization.create({
    data: {
      name: def.name,
      planTier: def.planTier,
      monthlyLimit: def.monthlyLimit,
    },
  });
  console.log(`  ✅ Created org: ${def.name} [${def.planTier}]`);
  return org;
}

async function upsertUser(
  def: (typeof USERS)[number],
  orgId: string,
  passwordHash: string,
) {
  const existing = await prisma.user.findUnique({ where: { email: def.email } });
  if (existing) {
    if (existing.organizationId !== orgId) {
      await prisma.user.update({ where: { id: existing.id }, data: { organizationId: orgId } });
      console.log(`  🔧 Fixed org link for existing user: ${def.email}`);
    } else {
      console.log(`  ⏭️  User already exists: ${def.email}`);
    }
    return existing;
  }
  const user = await prisma.user.create({
    data: {
      email: def.email,
      name: def.name,
      password: passwordHash,
      organizationId: orgId,
      provider: 'local',
    },
  });
  console.log(`  ✅ Created user: ${def.email} [org: ${orgId}]`);
  return user;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('\n🌱 Starting InfographicAI DB seed...\n');

  const passwordHash = await bcrypt.hash(PASSWORD, HASH_ROUNDS);

  // 1. Organisations
  console.log('📦 Seeding organisations...');
  const orgMap = new Map<string, string>(); // key → id
  for (const orgDef of ORGS) {
    const org = await upsertOrg(orgDef);
    orgMap.set(orgDef.key, org.id);
  }

  // 2. Users
  console.log('\n👤 Seeding users...');
  for (const userDef of USERS) {
    const orgId = orgMap.get(userDef.orgKey)!;
    await upsertUser(userDef, orgId, passwordHash);
  }

  // 3. Summary
  const [userCount, orgCount, templateCount] = await Promise.all([
    prisma.user.count(),
    prisma.organization.count(),
    prisma.template.count(),
  ]);

  console.log('\n📊 DB summary after seed:');
  console.log(`   Users:         ${userCount}`);
  console.log(`   Organisations: ${orgCount}`);
  console.log(`   Templates:     ${templateCount}`);

  console.log('\n🔑 Test credentials (all users share the same password):');
  console.log('   Password: Test@123!');
  console.log('');
  for (const u of USERS) {
    const orgDef = ORGS.find((o) => o.key === u.orgKey)!;
    console.log(`   ${u.email.padEnd(42)} [${orgDef.planTier.toUpperCase()} — ${orgDef.monthlyLimit}/mo]`);
  }
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
