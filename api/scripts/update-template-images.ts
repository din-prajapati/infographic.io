/**
 * update-template-images.ts — one-off content fix (2026-08-20)
 *
 * The 5 admin_curated sample templates (seeded by seed-premium-templates.ts,
 * source deleted in US-AI-037) shipped every image slot — hero photos, agent
 * headshots, and brand-logo placeholders — as inline SVG data-URL stand-ins.
 * Nothing in the gallery ever showed a real image.
 *
 * This script points every image element's `src`, plus each row's top-level
 * `imageUrl` (the gallery-card thumbnail), at real static assets:
 *   - Hero/secondary property shots  → Ideogram-generated (client/public/template-assets/)
 *   - Agent-photo placeholders       → free-license Unsplash headshots (Unsplash License)
 *   - Brand-logo placeholders        → a generic "upload your logo" placeholder mark
 *
 * These are curated, fixed system assets that ship with the app — served as
 * static files, not routed through the AI-generation pipeline or dependent on
 * EPIC-INFRA-02's object storage (which doesn't exist yet).
 *
 * Idempotent: re-running just re-applies the same mapping (no duplicate rows,
 * matches by element id / template name).
 *
 * Run from repo root:
 *   npx tsx api/scripts/update-template-images.ts
 *
 * Requires: DATABASE_URL in environment (or root .env file).
 */

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
const prisma = new PrismaClient();

// Static assets, served from client/public/template-assets/ at /template-assets/*
// (deliberately not /templates/* — that path is already the SPA's Templates gallery route)
const ASSET_BASE = '/template-assets';

// element id → new src. Covers all 13 image elements across the 5 templates.
const ELEMENT_SRC: Record<string, string> = {
  'ps-hero': `${ASSET_BASE}/us/ps-hero.jpg`,
  'ps-logo': `${ASSET_BASE}/logo-placeholder.svg`,

  'sq-hero': `${ASSET_BASE}/us/sq-hero.jpg`,
  'sq-logo': `${ASSET_BASE}/logo-placeholder.svg`,
  'sq-photo': `${ASSET_BASE}/agent-3.jpg`,

  'oh-hero': `${ASSET_BASE}/us/oh-hero.jpg`,
  'oh-logo': `${ASSET_BASE}/logo-placeholder.svg`,
  'oh-photo': `${ASSET_BASE}/agent-1.jpg`,

  'mr-logo': `${ASSET_BASE}/logo-placeholder.svg`,

  'ml-logo': `${ASSET_BASE}/logo-placeholder.svg`,
  'ml-hero': `${ASSET_BASE}/us/ml-hero.jpg`,
  'ml-gallery': `${ASSET_BASE}/ml-gallery.jpg`,
  'ml-photo': `${ASSET_BASE}/agent-2.jpg`,
};

// template name → new gallery-card thumbnail (top-level Infographic.imageUrl).
// "Market Report — Email Header" has no hero photo (data-only template) — its
// thumbnail is left untouched; only its Brand Logo element changes.
const THUMBNAIL_BY_NAME: Record<string, string> = {
  'Premium Listing — Story': `${ASSET_BASE}/us/ps-hero.jpg`,
  'Luxury Home Showcase': `${ASSET_BASE}/us/sq-hero.jpg`,
  'Open House Flyer — Print Ready': `${ASSET_BASE}/us/oh-hero.jpg`,
  'MLS Listing Sheet': `${ASSET_BASE}/us/ml-hero.jpg`,
};

async function main() {
  console.log('\n🖼  update-template-images — wiring real images into the 5 sample templates...\n');

  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL is not set. Aborting.');
    process.exit(1);
  }

  const rows = await prisma.infographic.findMany({
    where: { aiModel: 'canvas-template' },
  });

  if (rows.length === 0) {
    console.log('⚠️  No canvas-template rows found. Run seed-premium-templates.ts first.');
    return;
  }

  let updatedRows = 0;
  let updatedElements = 0;
  let updatedThumbnails = 0;

  for (const row of rows) {
    const propertyData = (row.propertyData ?? {}) as Record<string, any>;
    const canvasDesign = (propertyData.canvasDesign ?? {}) as Record<string, any>;
    const canvasData = (canvasDesign.canvasData ?? {}) as Record<string, any>;
    const elements = Array.isArray(canvasData.elements) ? canvasData.elements : [];
    const name = String(canvasDesign.name ?? '');

    let rowChanged = false;

    const newElements = elements.map((el: any) => {
      if (el && el.type === 'image' && el.id && ELEMENT_SRC[el.id]) {
        const newSrc = ELEMENT_SRC[el.id];
        if (el.src !== newSrc) {
          updatedElements++;
          rowChanged = true;
          return { ...el, src: newSrc };
        }
      }
      return el;
    });

    const newThumbnail = THUMBNAIL_BY_NAME[name];
    // Gallery-card thumbnails render from propertyData.canvasDesign.thumbnail
    // (DesignsService.findAdminCuratedTemplates()/findOne() both map `thumbnail:
    // canvasDesign.thumbnail`) — NOT from the top-level Infographic.imageUrl
    // column. Both are set here: imageUrl for API/DB-level consistency (some
    // paths still read it), canvasDesign.thumbnail because that's what the
    // Templates gallery and editor's Templates panel actually render.
    const willUpdateImageUrl = !!newThumbnail && row.imageUrl !== newThumbnail;
    const willUpdateThumbnail = !!newThumbnail && canvasDesign.thumbnail !== newThumbnail;
    if (willUpdateImageUrl || willUpdateThumbnail) {
      updatedThumbnails++;
      rowChanged = true;
    }

    if (!rowChanged) {
      console.log(`  ⏭  "${name}" — already up to date`);
      continue;
    }

    await prisma.infographic.update({
      where: { id: row.id },
      data: {
        imageUrl: willUpdateImageUrl ? newThumbnail : row.imageUrl,
        propertyData: {
          ...propertyData,
          canvasDesign: {
            ...canvasDesign,
            thumbnail: willUpdateThumbnail ? newThumbnail : canvasDesign.thumbnail,
            canvasData: { ...canvasData, elements: newElements },
          },
        },
      },
    });

    updatedRows++;
    console.log(`  ✅ "${name}" — ${newElements.filter((e: any, i: number) => e !== elements[i]).length} image slot(s) updated${willUpdateThumbnail ? ', thumbnail updated' : ''}`);
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Rows updated:       ${updatedRows} / ${rows.length}`);
  console.log(`   Image elements set: ${updatedElements}`);
  console.log(`   Thumbnails set:     ${updatedThumbnails}`);
  console.log(`\n✅ Done. Verify via:\n   GET /api/v1/canvas-templates?visibility=admin_curated\n`);
}

main()
  .catch((e) => {
    console.error('❌ Update failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
