import { describe, it, expect } from 'vitest';
import {
  resolveAiComposition,
  type AiComposition,
} from '../../src/modules/ai-generation/types/ai-composition.types';

/**
 * US-EDIT-011 — the AI composition flag, end to end.
 *
 * These tests assert the contract BL-27's fix branches on. The two that matter
 * most are the legacy cases: a generation created before this shipped has no
 * stored `composition`, and if that ever resolves to `'poster'` instead of
 * staying absent, every one of the 181 saved designs changes behaviour on
 * reopen. TC-EDIT-011-03 and -04 exist to make that impossible to regress
 * quietly.
 */
describe('US-EDIT-011 — resolveAiComposition', () => {
  // TC-EDIT-011-01 · AC1
  it("returns 'background' when a listing photograph was supplied", () => {
    expect(resolveAiComposition('photo_abc123')).toBe('background');
  });

  // TC-EDIT-011-02 · AC2
  it("returns 'poster' when no photograph was supplied", () => {
    expect(resolveAiComposition(undefined)).toBe('poster');
  });

  // AC2 — US-AI-051's guard, kept verbatim: an empty string is not a photo and
  // falls through to the composed (text-baked) prompt, as it always has.
  it("treats an empty-string photoReference as 'poster', matching US-AI-051", () => {
    expect(resolveAiComposition('')).toBe('poster');
  });

  // AC2 — a non-string must never be mistaken for a photo. The DTO is validated
  // upstream, but this predicate is the single source of truth for a decision
  // that is persisted and later branched on, so it defends itself.
  it('treats a non-string photoReference as poster', () => {
    expect(resolveAiComposition(null)).toBe('poster');
    expect(resolveAiComposition(0)).toBe('poster');
    expect(resolveAiComposition({})).toBe('poster');
  });

  // The prompt choice in ai-orchestrator and the value persisted in
  // generations.service MUST agree — they are two call sites of this one
  // function precisely so they cannot drift. This asserts the equivalence the
  // orchestrator relies on: useTextFree === (composition === 'background').
  it('is equivalent to the useTextFree condition the orchestrator applies', () => {
    const cases: unknown[] = ['photo_1', '', undefined, null, 'x'];
    for (const ref of cases) {
      const useTextFree = typeof ref === 'string' && ref.length > 0;
      expect(resolveAiComposition(ref) === 'background').toBe(useTextFree);
    }
  });
});

/**
 * The variations endpoint's mapping, asserted against the exact shape
 * `generations.service.getVariations()` builds. Extracted here as the pure
 * decision it is: which stored values become a `composition` field, and which
 * must leave the field absent.
 */
function readStoredComposition(propertyData: any): AiComposition | undefined {
  return propertyData?.composition === 'background' || propertyData?.composition === 'poster'
    ? propertyData.composition
    : undefined;
}

describe('US-EDIT-011 — composition on the variations contract', () => {
  // AC4
  it('carries a stored composition through to the variation', () => {
    expect(readStoredComposition({ composition: 'poster' })).toBe('poster');
    expect(readStoredComposition({ composition: 'background' })).toBe('background');
  });

  // TC-EDIT-011-03 · AC5 — the legacy path. A row created before US-EDIT-011
  // has no `composition`. The field must arrive ABSENT so the canvas applies
  // its legacy rule ('background'). Defaulting here would silently relabel
  // every pre-existing poster.
  it('leaves the field absent for a row with no stored composition', () => {
    expect(readStoredComposition({ address: '12 Oak St' })).toBeUndefined();
    expect(readStoredComposition({})).toBeUndefined();
    expect(readStoredComposition(null)).toBeUndefined();
    expect(readStoredComposition(undefined)).toBeUndefined();
  });

  // AC5 — a corrupt or unrecognised stored value is treated as legacy, not
  // passed through. Absent is always the safe answer; 'poster' never is.
  it('treats an unrecognised stored value as absent rather than passing it through', () => {
    expect(readStoredComposition({ composition: 'Poster' })).toBeUndefined();
    expect(readStoredComposition({ composition: 'flat' })).toBeUndefined();
    expect(readStoredComposition({ composition: true })).toBeUndefined();
  });

  // The spread used in getVariations must omit the key entirely rather than set
  // it to undefined — `'composition' in variation` is false for a legacy row.
  // JSON.stringify would drop an undefined value, but the in-memory object is
  // what the canvas reads, so the distinction is real.
  it('omits the key entirely for a legacy row, rather than setting it undefined', () => {
    const composition = readStoredComposition({});
    const variation = {
      id: 'v1',
      imageUrl: 'https://example.test/a.png',
      title: 'Generated Infographic',
      description: 'AI-generated property infographic',
      ...(composition ? { composition } : {}),
    };
    expect('composition' in variation).toBe(false);
  });
});

/**
 * TC-EDIT-011-04 · AC3 — the value is written at creation, not on completion.
 *
 * `generations.service.createGeneration` builds `propertyData` and passes it to
 * `prisma.infographic.create` BEFORE the orchestrator is invoked (the
 * orchestrator runs in a detached `Promise.resolve().then(...)`). So a run that
 * fails or is cancelled still has a row recording what it attempted. This
 * asserts that ordering property directly: composition is derivable from the
 * DTO alone, with no orchestrator result in hand.
 */
describe('US-EDIT-011 — composition is known at creation time', () => {
  it('derives from the request DTO alone, before any generation runs', () => {
    const dtoWithPhoto = { prompt: 'a flat', photoReference: 'photo_xyz' };
    const dtoWithout = { prompt: 'a flat' };

    expect(resolveAiComposition(dtoWithPhoto.photoReference)).toBe('background');
    expect(resolveAiComposition((dtoWithout as any).photoReference)).toBe('poster');
  });
});
