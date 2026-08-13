/**
 * US-AI-048 — Compose cache: hit/miss/write/degraded tests
 *
 * TC-AI-048-01  Cache hit → stored design returned, extraction NOT called (AC1)  [T2]
 * TC-AI-048-02  Cache hit → usageRecord.update NOT called (AC2)                  [T2]
 * TC-AI-048-03  Same image, rotated exp/sig → treated as same key (AC3)          [T1]
 * TC-AI-048-04  Degraded extraction (null) → not cached, retry re-calls (AC5)    [T3]
 * TC-AI-048-05  A, B, A → exactly 2 extraction calls (AC4)                       [T3]
 * TC-AI-048-07  Prisma update throws after extraction → design still returned (AC7) [T3]
 */

import { describe, it, expect } from 'vitest';

import { composeCacheKey } from '../../src/modules/ai-generation/services/ai-orchestrator.service';

// ─── Fixtures ────────────────────────────────────────────────────────────────

/** Ideogram CDN URL pattern: base path + signed query params (exp + sig rotate every ~24h). */
const BASE_URL = 'https://cdn.ideogram.ai/compositions/abc123/output.jpg';
const SIGNED_URL_A = `${BASE_URL}?exp=1720000000&sig=aabbccdd`;
const SIGNED_URL_B = `${BASE_URL}?exp=1720090000&sig=eeff0011`; // rotated signature, same image
const SIGNED_URL_NO_PARAMS = BASE_URL;

// ─── T1: TC-AI-048-03 — composeCacheKey normalisation (AC3) ──────────────────

describe('composeCacheKey — TC-AI-048-03 (AC3)', () => {
  it('strips exp and sig, leaving the stable base URL', () => {
    expect(composeCacheKey(SIGNED_URL_A)).toBe(BASE_URL);
  });

  it('maps two different signatures of the same image to the same key', () => {
    expect(composeCacheKey(SIGNED_URL_A)).toBe(composeCacheKey(SIGNED_URL_B));
  });

  it('is a no-op for URLs that have no exp/sig params', () => {
    expect(composeCacheKey(SIGNED_URL_NO_PARAMS)).toBe(BASE_URL);
  });

  it('preserves unrelated query params (e.g. w, h)', () => {
    const url = `${BASE_URL}?w=800&h=1000&exp=999&sig=abc`;
    expect(composeCacheKey(url)).toBe(`${BASE_URL}?w=800&h=1000`);
  });

  it('falls back to the raw string for a malformed URL', () => {
    const bad = 'not-a-url';
    expect(composeCacheKey(bad)).toBe('not-a-url');
  });
});
