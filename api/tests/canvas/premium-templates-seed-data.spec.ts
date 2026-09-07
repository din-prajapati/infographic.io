/**
 * BL-25 regression — the premium template seed must carry its own data.
 *
 * History: `seed-premium-templates.ts` used to load its 5 templates through an
 * *optional* dynamic import of `client/src/lib/premiumTemplates.ts`. That file
 * was deleted in 216c3ef (US-AI-037). The optional import swallowed the
 * absence, so the seed silently created zero templates and production shipped
 * an empty gallery — "No templates found matching your criteria." was the first
 * screen after registration, for 17 days.
 *
 * The failure was invisible because nothing asserted that the seed had any data
 * to seed. These tests are that assertion. They deliberately check the DATA
 * MODULE, not the database: the defect was an empty input, and it would have
 * been caught before any DB was involved.
 */
import { describe, it, expect } from 'vitest';
import {
  PREMIUM_CANVAS_TEMPLATES,
  type StarterCanvasTemplate,
} from '../../scripts/data/premium-templates.data';

/** The 5 formats the landing page promises and the gallery must show. */
const EXPECTED_NAMES = [
  'Premium Listing — Story',
  'Luxury Home Showcase',
  'Open House Flyer — Print Ready',
  'Market Report — Email Header',
  'MLS Listing Sheet',
];

describe('BL-25 — premium template seed data', () => {
  it('exports exactly the 5 gallery templates', () => {
    // The precise number matters: 0 was the production bug, and a silent drop
    // to 4 would empty a format's shelf just as invisibly.
    expect(PREMIUM_CANVAS_TEMPLATES).toHaveLength(5);
    expect(PREMIUM_CANVAS_TEMPLATES.map((t) => t.name)).toEqual(EXPECTED_NAMES);
  });

  it('has no imports that a client-side refactor could delete', async () => {
    // The root cause was a cross-boundary dependency (api/scripts -> client/src).
    // This module must stay standalone; a type-only import is not enough,
    // because the file that owned the type was itself deletable.
    const fs = await import('fs');
    const path = await import('path');
    const src = fs.readFileSync(
      path.resolve(__dirname, '../../scripts/data/premium-templates.data.ts'),
      'utf8',
    );
    const importLines = src
      .split('\n')
      .filter((l) => /^\s*(import|export)\s.*\sfrom\s/.test(l));
    expect(importLines).toEqual([]);
  });

  it.each(EXPECTED_NAMES)('%s is seedable — the fields the seed writes are present', (name) => {
    const tpl = PREMIUM_CANVAS_TEMPLATES.find((t) => t.name === name) as StarterCanvasTemplate;
    expect(tpl).toBeDefined();

    // Each of these is read by seed-premium-templates.ts when building the
    // Infographic row. A missing one seeds a broken gallery card rather than
    // no card, which is harder to notice.
    expect(tpl.category).toBeTruthy();
    expect(tpl.badge).toBeTruthy();
    expect(tpl.description).toBeTruthy();
    expect(tpl.image).toMatch(/^data:image\/svg\+xml/);

    expect(tpl.canvasData.canvasWidth).toBeGreaterThan(0);
    expect(tpl.canvasData.canvasHeight).toBeGreaterThan(0);
    expect(tpl.canvasData.elements.length).toBeGreaterThan(0);
  });

  it('every badge maps to a format tag, so no card ships untagged', () => {
    // buildTags() drops a template to <2 tags when the badge is unmapped, and
    // the seed then logs a warning and skips the retag — leaving a card that no
    // Format Picker query can reach.
    const MAPPABLE = ['9:16', '1:1', '3:1', 'a4 · 300dpi', 'a4 300dpi', 'mls'];
    for (const tpl of PREMIUM_CANVAS_TEMPLATES) {
      expect(MAPPABLE).toContain(tpl.badge.trim().toLowerCase());
    }
  });
});
