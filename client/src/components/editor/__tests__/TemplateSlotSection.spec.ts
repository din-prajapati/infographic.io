/**
 * US-EDIT-015 — Lane A: one form per fact in the sidebar.
 *
 * TC-EDIT-015-04 (AC5): The fabricated sample hints ("Skyline Signature
 * Residences", "From ₹1.18 Cr", etc.) are gone from TemplateSlotSection.tsx.
 * Verified by reading the source as text so this test does not depend on a
 * React render harness (BL-20).
 *
 * Also asserts the trimmed catalogues contain exactly the kept fields (D2),
 * and that brand.name is absent from BRAND_SLOT_FIELDS (Q2).
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  BRAND_SLOT_FIELDS,
  PROPERTY_SLOT_FIELDS,
  AGENT_SLOT_FIELDS,
} from '../TemplateSlotSection';

const src = readFileSync(resolve(__dirname, '../TemplateSlotSection.tsx'), 'utf8');

// TC-EDIT-015-04 · AC5
describe('fabricated hints are absent from TemplateSlotSection', () => {
  const fabricated = [
    'Skyline Signature Residences',
    'From ₹1.18 Cr',
    'Sarjapur Road, Bengaluru',
    '3 BHK · 2,480 sq.ft',
    'Aisha Sharma',
    '+91 90000 00000',
    'agent@agency.in',
    'PRM/KA/RERA/1254/',
    'Skyline Realty',
  ];

  for (const hint of fabricated) {
    it(`does not contain "${hint}"`, () => {
      expect(src).not.toContain(hint);
    });
  }
});

// D2: PROPERTY_SLOT_FIELDS keeps only no-form-counterpart entries
describe('PROPERTY_SLOT_FIELDS — trimmed to kept fields only', () => {
  const slots = PROPERTY_SLOT_FIELDS.map((f) => f.slot);

  it('retains hero image and secondary image', () => {
    expect(slots).toContain('property.heroImage');
    expect(slots).toContain('property.galleryImage');
  });

  it('retains Open House and Market Report fields', () => {
    expect(slots).toContain('openHouse.date');
    expect(slots).toContain('openHouse.time');
    expect(slots).toContain('report.headline');
    expect(slots).toContain('report.kpis');
    expect(slots).toContain('report.period');
  });

  it('no longer contains form-owned property fields', () => {
    expect(slots).not.toContain('property.headline');
    expect(slots).not.toContain('property.price');
    expect(slots).not.toContain('property.location');
    expect(slots).not.toContain('property.facts');
    expect(slots).not.toContain('property.specs');
    expect(slots).not.toContain('property.features');
    expect(slots).not.toContain('property.description');
  });
});

// D2: AGENT_SLOT_FIELDS keeps only no-form-counterpart entries
describe('AGENT_SLOT_FIELDS — trimmed to kept fields only', () => {
  const slots = AGENT_SLOT_FIELDS.map((f) => f.slot);

  it('retains agent photo and call-to-action', () => {
    expect(slots).toContain('agent.photo');
    expect(slots).toContain('agent.cta');
  });

  it('no longer contains form-owned agent fields', () => {
    expect(slots).not.toContain('agent.name');
    expect(slots).not.toContain('agent.phone');
    expect(slots).not.toContain('agent.email');
    expect(slots).not.toContain('agent.rera');
  });
});

// Q2: brand.name removed from BRAND_SLOT_FIELDS
describe('BRAND_SLOT_FIELDS — agency name removed (Q2)', () => {
  const slots = BRAND_SLOT_FIELDS.map((f) => f.slot);

  it('retains brand logo and accent color', () => {
    expect(slots).toContain('brand.logo');
    expect(slots).toContain('brand.accentColor');
  });

  it('does not contain brand.name — agency name is owned by Agent tab Brokerage field', () => {
    expect(slots).not.toContain('brand.name');
  });
});
