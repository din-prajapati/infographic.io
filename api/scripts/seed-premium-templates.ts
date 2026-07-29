/**
 * seed-premium-templates.ts — one-time migration script (US-AI-037)
 *
 * Migrates the 5 hardcoded premium canvas templates from
 * client/src/lib/premiumTemplates.ts into the database as Infographic rows
 * with visibility: 'admin_curated' and aiModel: 'canvas-template'.
 *
 * OWNING ACCOUNT DECISION (documented per STORY.md requirement):
 *   Templates are owned by a dedicated internal system account, NOT the QA
 *   seed.ts accounts (free@test.infographai.com etc.). A purpose-built org +
 *   user is created idempotently so:
 *   - The rows are never accidentally included in regular user queries
 *     (findAll(userId) only returns the requesting user's own canvas-editor rows)
 *   - The rows can always be re-identified and cleaned up without ambiguity
 *
 *   Org:  "Buildographic Curated Templates (System)"  [api_enterprise, limit -1]
 *   User: templates-system@buildographic.internal      [no-login account]
 *
 * Idempotent: skips any template whose name already exists in the system user's
 * canvas-template rows. Safe to run multiple times.
 *
 * Run from repo root:
 *   npx tsx api/scripts/seed-premium-templates.ts
 *
 * Requires: DATABASE_URL in environment (or root .env file).
 */

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import * as bcrypt from 'bcrypt';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Load root .env so DATABASE_URL is available when running locally
// ---------------------------------------------------------------------------
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

import { PrismaClient } from '@prisma/client';

// ---------------------------------------------------------------------------
// Import the 5 premium templates from the frontend source
// The file uses only standard JS/TS constructs (SVG data-URLs), no browser APIs.
// ---------------------------------------------------------------------------
import { PREMIUM_CANVAS_TEMPLATES } from '../../client/src/lib/premiumTemplates.js';

// ---------------------------------------------------------------------------
// System account constants (owning account for admin_curated rows)
// ---------------------------------------------------------------------------
const SYSTEM_ORG_NAME = 'Buildographic Curated Templates (System)';
const SYSTEM_USER_EMAIL = 'templates-system@buildographic.internal';
const SYSTEM_USER_NAME = 'Buildographic System (Curated Templates)';

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function upsertSystemOrg() {
  const existing = await prisma.organization.findFirst({
    where: { name: SYSTEM_ORG_NAME },
  });
  if (existing) {
    console.log(`  ⏭  System org already exists: ${SYSTEM_ORG_NAME}`);
    return existing;
  }
  const org = await prisma.organization.create({
    data: {
      name: SYSTEM_ORG_NAME,
      planTier: 'api_enterprise',
      monthlyLimit: -1,
    },
  });
  console.log(`  ✅ Created system org: ${SYSTEM_ORG_NAME} [${org.id}]`);
  return org;
}

async function upsertSystemUser(orgId: string) {
  const existing = await prisma.user.findUnique({
    where: { email: SYSTEM_USER_EMAIL },
  });
  if (existing) {
    console.log(`  ⏭  System user already exists: ${SYSTEM_USER_EMAIL}`);
    return existing;
  }
  // A bcrypt-hashed impossible password — this account should never be used
  // for login. The hash is of a fixed, unpublished internal string.
  const noLoginHash = await bcrypt.hash(
    'BUILDOGRAPHIC_SYSTEM_INTERNAL_NO_LOGIN_ACCOUNT',
    10,
  );
  const user = await prisma.user.create({
    data: {
      email: SYSTEM_USER_EMAIL,
      name: SYSTEM_USER_NAME,
      password: noLoginHash,
      organizationId: orgId,
      provider: 'local',
    },
  });
  console.log(`  ✅ Created system user: ${SYSTEM_USER_EMAIL} [${user.id}]`);
  return user;
}

async function getDefaultTemplateId() {
  const defaultTemplate = await prisma.template.findFirst({
    where: { isActive: true },
  });
  if (!defaultTemplate) {
    throw new Error(
      'No active Template row found. Run `npx prisma db seed` first to seed the Template table.',
    );
  }
  return defaultTemplate.id;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('\n🌱 seed-premium-templates — migrating premium gallery to DB...\n');

  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL is not set. Aborting.');
    process.exit(1);
  }

  // 1. Ensure system org + user exist
  console.log('📦 Ensuring system org...');
  const systemOrg = await upsertSystemOrg();

  console.log('\n👤 Ensuring system user...');
  const systemUser = await upsertSystemUser(systemOrg.id);

  // 2. Get the default template ID (required by Infographic FK)
  const defaultTemplateId = await getDefaultTemplateId();

  // 3. Load existing canvas-template rows for the system user (idempotency check)
  const existing = await prisma.infographic.findMany({
    where: { userId: systemUser.id, aiModel: 'canvas-template' },
  });
  const existingNames = new Set(
    existing.map((e) => (e.propertyData as any)?.canvasDesign?.name as string | undefined),
  );

  // 4. Migrate each premium template
  console.log(`\n📝 Migrating ${PREMIUM_CANVAS_TEMPLATES.length} premium templates...\n`);
  let created = 0;
  let skipped = 0;

  for (const tpl of PREMIUM_CANVAS_TEMPLATES) {
    if (existingNames.has(tpl.name)) {
      console.log(`  ⏭  Already migrated: "${tpl.name}"`);
      skipped++;
      continue;
    }

    await prisma.infographic.create({
      data: {
        userId: systemUser.id,
        organizationId: systemOrg.id,
        templateId: defaultTemplateId,
        aiModel: 'canvas-template',
        status: 'completed',
        imageUrl: tpl.image, // SVG thumbnail data-URL used as imageUrl placeholder
        propertyData: {
          canvasDesign: {
            name: tpl.name,
            type: 'template',
            category: tpl.category,
            thumbnail: tpl.image,
            canvasData: tpl.canvasData,
            tags: [],
            visibility: 'admin_curated',
            description: tpl.description,
            badge: tpl.badge,
          },
        },
      },
    });

    console.log(`  ✅ Migrated: "${tpl.name}" [${tpl.badge}]`);
    created++;
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Created: ${created}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`\n✅ Done. Verify via:\n   GET /api/v1/canvas-templates?visibility=admin_curated\n`);
}

main()
  .catch((e) => {
    console.error('❌ Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
