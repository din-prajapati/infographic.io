/**
 * US-LAUNCH-015 — ApiError carries HTTP status + backend error code so
 * callers (e.g. loadVariation.ts's 402 EDITABLE_REQUIRES_UPGRADE detection)
 * don't have to string-match `.message` text. Purely additive: existing
 * `.message` behavior for callers that don't care about status/code is
 * unaffected — ApiError still `instanceof Error`.
 */
import { describe, it, expect } from 'vitest';
import { ApiError } from '../queryClient';

describe('ApiError', () => {
  it('is an instanceof Error — existing .message-only callers are unaffected', () => {
    const err = new ApiError('Payment required', 402, 'EDITABLE_REQUIRES_UPGRADE');
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe('Payment required');
  });

  it('carries the HTTP status', () => {
    const err = new ApiError('Monthly limit reached', 403);
    expect(err.status).toBe(403);
  });

  it('carries the backend error code when present', () => {
    const err = new ApiError('Payment required', 402, 'EDITABLE_REQUIRES_UPGRADE');
    expect(err.code).toBe('EDITABLE_REQUIRES_UPGRADE');
  });

  it('code is undefined when the backend response has none', () => {
    const err = new ApiError('Monthly limit reached', 403);
    expect(err.code).toBeUndefined();
  });
});
