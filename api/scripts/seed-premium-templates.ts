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
 * Seed data lives in `./data/premium-templates.data.ts` and is imported
 * statically. It was previously an *optional* dynamic import of
 * `client/src/lib/premiumTemplates.ts`; that file was deleted in 216c3ef and
 * the optional import turned this script into a silent no-op — see BL-25 and
 * the header of the data module for the full account.
 *
 * Run from repo root:
 *   npx tsx api/scripts/seed-premium-templates.ts             # write
 *   npx tsx api/scripts/seed-premium-templates.ts --dry-run   # report only
 *
 * `--dry-run` performs every read and reports exactly what a real run would
 * create, skip and tag, without issuing a single write. Use it to inspect an
 * environment you are not ready to touch.
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
import { PREMIUM_CANVAS_TEMPLATES } from './data/premium-templates.data';

// ---------------------------------------------------------------------------
// System account constants (owning account for admin_curated rows)
// ---------------------------------------------------------------------------
const SYSTEM_ORG_NAME = 'Buildographic Curated Templates (System)';
const SYSTEM_USER_EMAIL = 'templates-system@buildographic.internal';
const SYSTEM_USER_NAME = 'Buildographic System (Curated Templates)';

const prisma = new PrismaClient();

/**
 * --dry-run: perform every read, report every intended write, issue none.
 *
 * Exists because the only way to learn what this script would do to an
 * environment used to be to run it against that environment. BL-25 turned on
 * exactly that blind spot.
 */
const DRY_RUN = process.argv.includes('--dry-run');

/** Build ≥2 tags from badge (style) + category (content) — US-AI-040 AC4. */
/**
 * Map a template's `badge` to a format-taxonomy id.
 *
 * The badge field holds presentation shorthand — "9:16", "1:1", "A4 · 300dpi",
 * "3:1", "MLS". Those must never become tags: tags surface directly as
 * user-facing filter chips, and shipping a chip labelled "A4 · 300dpi" or
 * "9:16" would break the standing no-technical-specs rule (CLAUDE.md critical
 * rule 5, US-AI-038 AC8, US-AI-039 AC7).
 *
 * Mapping the badge to the format id it actually denotes gives a tag that is
 * both user-meaningful ("Instagram Story") and useful to
 * canvasTemplatesApi.getByFormatTag, which the Format Picker already queries
 * and which has been returning nothing because every row shipped with tags: [].
 */
const BADGE_TO_FORMAT_TAG: Record<string, string> = {
  '9:16': 'instagram-story',
  '1:1': 'instagram-post',
  '3:1': 'email-header-banner',
  'a4 · 300dpi': 'print-flyer',
  'a4 300dpi': 'print-flyer',
  mls: 'print-feature-sheet',
};

function formatTagFromBadge(badge?: string | null): string | undefined {
  if (!badge) return undefined;
  return BADGE_TO_FORMAT_TAG[String(badge).trim().toLowerCase()];
}

/**
 * Human-readable label for a format tag — what the gallery card's badge shows.
 *
 * Keep in sync with FORMAT_TAXONOMY (`client/src/lib/formatTaxonomy.ts`). It is
 * duplicated rather than imported because that module is frontend TS and the
 * one previous cross-boundary import here (premiumTemplates.js) broke when the
 * file was deleted.
 */
const FORMAT_TAG_LABEL: Record<string, string> = {
  'instagram-story': 'Instagram Story',
  'instagram-post': 'Instagram Post',
  'instagram-reel-cover': 'Reel Cover',
  'facebook-post': 'Facebook Post',
  'facebook-cover': 'Facebook Cover',
  'facebook-story': 'Facebook Story',
  'whatsapp-status': 'WhatsApp Status',
  'whatsapp-post': 'WhatsApp Post',
  'print-flyer': 'Print Flyer',
  'print-feature-sheet': 'Feature Sheet',
  'print-postcard': 'Postcard',
  'print-open-house-sign': 'Open House Sign',
  'email-header-banner': 'Email Header',
  'linkedin-post': 'LinkedIn Post',
};

/**
 * Descriptions rewritten to carry no geometry — US-AI-040.
 *
 * The seeded copy described templates by their measurements ("Vertical 9:16
 * social story", "A4 portrait at 300 DPI"). Those are the browse surface, where
 * Canva shows none: across 50 of its real-estate template cards there are zero
 * ratios, zero pixel dimensions and zero DPI values — the format NAME carries
 * the meaning instead. Geometry is disclosed later, at the point of choosing a
 * size, not while scanning a gallery.
 *
 * Keyed by template name, which is stable and already the migration's identity.
 */
const DESCRIPTION_REWRITES: Record<string, string> = {
  'Premium Listing — Story':
    'Full-bleed story with a hero image, price chip, key facts and a call to action',
  'Luxury Home Showcase':
    'Square social post — hero image on the left, brand, price and features on the right',
  'Open House Flyer — Print Ready':
    'Print-ready open-house handout with a bleed-safe margin',
  'Market Report — Email Header':
    'Wide email and LinkedIn header with a KPI row and a call to action',
  'MLS Listing Sheet':
    'MLS-ready sheet with two images, a specs table and an agent footer',
};

/**
 * Build the tag list for a template — US-AI-040 AC4.
 *
 * Deliberately does NOT include the raw badge. Produces a content-category tag
 * plus a format tag, both of which read as plain language when rendered as a
 * filter chip.
 */
function buildTags(badge?: string | null, category?: string | null): string[] {
  const tags: string[] = [];
  if (category) tags.push(String(category));
  const formatTag = formatTagFromBadge(badge);
  if (formatTag) tags.push(formatTag);
  return tags;
}

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
  if (DRY_RUN) {
    console.log(`  ○  WOULD create system org: ${SYSTEM_ORG_NAME}`);
    return { id: '(dry-run-org)' } as { id: string };
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
  if (DRY_RUN) {
    console.log(`  ○  WOULD create system user: ${SYSTEM_USER_EMAIL}`);
    return { id: '(dry-run-user)' } as { id: string };
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
  if (DRY_RUN) {
    console.log('   🔍 DRY RUN — reads only. Nothing below is written.\n');
  }

  // Name the target database. This script falls back to the root .env when
  // DATABASE_URL is unset, so a run intended for production that quietly hit
  // dev would otherwise be indistinguishable from one that worked. Host only —
  // never the credentials.
  try {
    const dbHost = new URL(process.env.DATABASE_URL ?? '').host;
    console.log(`   Target database: ${dbHost}`);
  } catch {
    console.log('   Target database: (DATABASE_URL unparseable)');
  }
  console.log(`   Seed data: ${PREMIUM_CANVAS_TEMPLATES.length} templates bundled with this script.`);

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

  // 4. Create each premium template from the bundled seed data.
  //
  //    This used to be an *optional* dynamic import of
  //    `client/src/lib/premiumTemplates.ts`. That file was deleted in 216c3ef
  //    (US-AI-037) and the optional import swallowed its absence, so the script
  //    degraded to a silent tag-backfill no-op — which is how production and
  //    staging both ended up with an empty gallery (BL-25, found 2026-09-07).
  //    The data now ships with the script and is imported statically at the top
  //    of this file: if it goes missing the script cannot start at all.
  const premiumTemplates = PREMIUM_CANVAS_TEMPLATES;

  console.log(`\n📝 Migrating ${premiumTemplates.length} premium templates...\n`);
  let created = 0;
  let skipped = 0;

  for (const tpl of premiumTemplates) {
    if (existingNames.has(tpl.name)) {
      console.log(`  ⏭  Already migrated: "${tpl.name}"`);
      skipped++;
      continue;
    }

    if (DRY_RUN) {
      console.log(
        `  ○  WOULD create: "${tpl.name}" [${tpl.badge}] tags [${buildTags(tpl.badge, tpl.category).join(', ')}]`,
      );
      created++;
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
            // US-AI-040 AC4: real tags from badge (style) + category (content)
            tags: buildTags(tpl.badge, tpl.category),
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

  // 5. Backfill tags on existing admin_curated rows that still have tags: [] (US-AI-040 AC4)
  console.log('\n🏷  Backfilling tags on existing canvas-template rows...\n');
  let tagged = 0;
  const allCurated = await prisma.infographic.findMany({
    where: { aiModel: 'canvas-template' },
  });
  for (const row of allCurated) {
    const propertyData = (row.propertyData ?? {}) as Record<string, unknown>;
    const canvasDesign = (propertyData.canvasDesign ?? {}) as Record<string, unknown>;
    const name = String(canvasDesign.name ?? '');
    const rawBadge = canvasDesign.badge as string | undefined;

    const existingTags = Array.isArray(canvasDesign.tags) ? (canvasDesign.tags as string[]) : [];
    const tags =
      existingTags.length >= 2
        ? existingTags
        : buildTags(rawBadge, canvasDesign.category as string | undefined);

    if (tags.length < 2) {
      console.log(
        `  ⚠  Skipping "${name}": need a category and a badge that maps to a known format (got badge="${rawBadge}", category="${canvasDesign.category}")`,
      );
      continue;
    }

    // Badge carries the FORMAT NAME, never the geometry.
    //
    // The seeded badges were "9:16", "1:1", "A4 · 300dpi", "3:1", "MLS" — but a
    // ratio cannot identify a template: 9:16 is shared by five formats in
    // FORMAT_TAXONOMY (Instagram Story, Reel Cover, Facebook Story, WhatsApp
    // Status, Listing Story) and 1:1 by six. The format tag is the
    // disambiguator, so the badge is derived from it.
    const formatTag = tags.find((t) => t in FORMAT_TAG_LABEL);
    const badge = formatTag ? FORMAT_TAG_LABEL[formatTag] : rawBadge;
    const description = DESCRIPTION_REWRITES[name] ?? canvasDesign.description;

    const unchanged =
      existingTags.length >= 2 &&
      badge === rawBadge &&
      description === canvasDesign.description;
    if (unchanged) continue;

    if (DRY_RUN) {
      console.log(`  ○  WOULD retag "${name}" → badge "${badge}", tags [${tags.join(', ')}]`);
      tagged++;
      continue;
    }

    await prisma.infographic.update({
      where: { id: row.id },
      data: {
        propertyData: {
          ...propertyData,
          canvasDesign: { ...canvasDesign, tags, badge, description },
        },
      },
    });
    console.log(`  ✅ "${name}" → badge "${badge}", tags [${tags.join(', ')}]`);
    tagged++;
  }

  console.log(`\n📊 Summary${DRY_RUN ? ' (DRY RUN — nothing was written)' : ''}:`);
  console.log(`   ${DRY_RUN ? 'Would create' : 'Created'}: ${created}`);
  console.log(`   Skipped (already present): ${skipped}`);
  console.log(`   ${DRY_RUN ? 'Would retag' : 'Tags backfilled'}: ${tagged}`);

  if (DRY_RUN) {
    console.log(`\n🔍 Dry run complete. Re-run without --dry-run to apply.\n`);
    return;
  }

  // A run that creates nothing against an empty gallery is the BL-25 failure
  // mode, not a success. Say so rather than printing "Done".
  if (created === 0 && skipped === 0) {
    console.log(
      `\n⚠  Created 0 and skipped 0 — the gallery is still empty and this run changed nothing.\n` +
        `   That is the BL-25 signature. Check that the seed data module loaded.\n`,
    );
    return;
  }

  console.log(
    `\n✅ Done. Next: npx tsx api/scripts/update-template-images.ts (swaps SVG stubs for real photos).\n` +
      `   Verify via: GET /api/v1/canvas-templates?visibility=admin_curated\n`,
  );
}

main()
  .catch((e) => {
    console.error('❌ Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
