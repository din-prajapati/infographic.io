/**
 * api.ts — US-AI-050 T3
 *
 * TC-AI-050-02: client request timeout constant ≥ 90 000ms (AC4).
 *
 * The server-side LAYERIZE_TIMEOUT_MS is 90 000ms (US-AI-031b).
 * The client must never time out before the server, or the user sees a false
 * failure ("network error") while the server is still legitimately working.
 *
 * This test is the authoritative registry for that invariant: if someone
 * accidentally lowers COMPOSE_REQUEST_TIMEOUT_MS below 90s in a future
 * refactor, this test fails immediately.
 */
import { describe, it, expect } from 'vitest';
import { COMPOSE_REQUEST_TIMEOUT_MS } from '../api';

describe('COMPOSE_REQUEST_TIMEOUT_MS (AC4 — US-AI-050)', () => {
  /** Server's LAYERIZE_TIMEOUT_MS — the floor for the client timeout. */
  const SERVER_LAYERIZE_TIMEOUT_MS = 90_000;

  it('is at least as large as the server LAYERIZE_TIMEOUT_MS (90 000ms)', () => {
    // If this fails, the client will abort getComposedDesign while the server
    // is still working, surfacing a false failure to the user.
    expect(COMPOSE_REQUEST_TIMEOUT_MS).toBeGreaterThanOrEqual(SERVER_LAYERIZE_TIMEOUT_MS);
  });

  it('is a positive number', () => {
    expect(COMPOSE_REQUEST_TIMEOUT_MS).toBeGreaterThan(0);
  });

  it('is a finite number (not Infinity)', () => {
    // Infinity would prevent AbortSignal.timeout from ever firing.
    expect(Number.isFinite(COMPOSE_REQUEST_TIMEOUT_MS)).toBe(true);
  });

  it('is ≤ 5 minutes (reasonable upper bound)', () => {
    // A timeout over 5 minutes would leave the user without any error signal
    // for an indefinite period.
    expect(COMPOSE_REQUEST_TIMEOUT_MS).toBeLessThanOrEqual(5 * 60 * 1000);
  });
});
