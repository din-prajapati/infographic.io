/**
 * US-AI-044 — PlannerIntent type validation helpers
 *
 * Tests for isPaletteValid() and isValidPlannerIntent().
 * No mocks needed — pure logic.
 */

import { describe, it, expect } from 'vitest';
import {
  DEFAULT_INTENT,
  isPaletteValid,
  isValidPlannerIntent,
  VALID_TEMPLATE_IDS,
  VALID_SCRIM_SIDES,
} from '../../src/modules/ai-generation/types/planner-intent.types';

// ---------------------------------------------------------------------------
// DEFAULT_INTENT
// ---------------------------------------------------------------------------

describe('DEFAULT_INTENT', () => {
  it('has a valid templateId', () => {
    expect(VALID_TEMPLATE_IDS).toContain(DEFAULT_INTENT.templateId);
  });

  it('has a valid scrimSide', () => {
    expect(VALID_SCRIM_SIDES).toContain(DEFAULT_INTENT.scrimSide);
  });

  it('has a valid palette', () => {
    expect(isPaletteValid(DEFAULT_INTENT.palette)).toBe(true);
  });

  it('has a reasoning string', () => {
    expect(typeof DEFAULT_INTENT.reasoning).toBe('string');
    expect(DEFAULT_INTENT.reasoning.length).toBeGreaterThan(0);
  });

  it('passes isValidPlannerIntent', () => {
    expect(isValidPlannerIntent(DEFAULT_INTENT)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// isPaletteValid
// ---------------------------------------------------------------------------

describe('isPaletteValid', () => {
  const good = { scrim: 'rgba(0,0,0,0.6)', accent: '#F5A623', text: '#FFFFFF', muted: '#CCCCCC' };

  it('accepts a well-formed palette', () => {
    expect(isPaletteValid(good)).toBe(true);
  });

  it('accepts a hex scrim', () => {
    expect(isPaletteValid({ ...good, scrim: '#1A1A1A' })).toBe(true);
  });

  it('accepts rgba with spaces', () => {
    expect(isPaletteValid({ ...good, scrim: 'rgba( 0 , 0 , 0 , 0.55 )' })).toBe(true);
  });

  it('rejects a 3-digit hex accent', () => {
    expect(isPaletteValid({ ...good, accent: '#F5A' })).toBe(false);
  });

  it('rejects a missing text field', () => {
    const { text: _text, ...rest } = good;
    expect(isPaletteValid(rest)).toBe(false);
  });

  it('rejects a non-string muted', () => {
    expect(isPaletteValid({ ...good, muted: 12345 })).toBe(false);
  });

  it('rejects an empty object', () => {
    expect(isPaletteValid({})).toBe(false);
  });

  it('rejects null', () => {
    expect(isPaletteValid(null)).toBe(false);
  });

  it('rejects a plain string', () => {
    expect(isPaletteValid('#FFFFFF')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isValidPlannerIntent
// ---------------------------------------------------------------------------

describe('isValidPlannerIntent', () => {
  const good = {
    templateId: 'left-scrim-hero',
    scrimSide:  'left',
    palette:    { scrim: 'rgba(0,0,0,0.6)', accent: '#F5A623', text: '#FFFFFF', muted: '#CCCCCC' },
    reasoning:  'sky is clear on the left',
  };

  it('accepts a fully valid intent', () => {
    expect(isValidPlannerIntent(good)).toBe(true);
  });

  it('accepts every valid templateId', () => {
    for (const id of VALID_TEMPLATE_IDS) {
      expect(isValidPlannerIntent({ ...good, templateId: id })).toBe(true);
    }
  });

  it('accepts every valid scrimSide', () => {
    for (const side of VALID_SCRIM_SIDES) {
      expect(isValidPlannerIntent({ ...good, scrimSide: side })).toBe(true);
    }
  });

  it('rejects an unknown templateId', () => {
    expect(isValidPlannerIntent({ ...good, templateId: 'full-bleed' })).toBe(false);
  });

  it('rejects an unknown scrimSide', () => {
    expect(isValidPlannerIntent({ ...good, scrimSide: 'top' })).toBe(false);
  });

  it('rejects an invalid palette (bad hex)', () => {
    expect(isValidPlannerIntent({ ...good, palette: { ...good.palette, accent: '#XYZ123' } })).toBe(false);
  });

  it('rejects a missing reasoning field', () => {
    const { reasoning: _r, ...rest } = good;
    expect(isValidPlannerIntent(rest)).toBe(false);
  });

  it('rejects a non-string reasoning', () => {
    expect(isValidPlannerIntent({ ...good, reasoning: 42 })).toBe(false);
  });

  it('rejects null', () => {
    expect(isValidPlannerIntent(null)).toBe(false);
  });

  it('rejects a plain string', () => {
    expect(isValidPlannerIntent('left-scrim-hero')).toBe(false);
  });

  it('rejects an empty object', () => {
    expect(isValidPlannerIntent({})).toBe(false);
  });
});
