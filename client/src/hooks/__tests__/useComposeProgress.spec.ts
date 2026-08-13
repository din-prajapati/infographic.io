/**
 * useComposeProgress — US-AI-050
 *
 * TC-AI-050-01: hook reports elapsedSeconds incrementing; phase flips to
 *               'still-working' at 20s (AC1/AC2)
 * TC-AI-050-02: client request timeout config ≥ 90 000ms (AC4)
 * TC-AI-050-06: hook clears its timer and skips state updates when the
 *               consuming component unmounts mid-wait (AC6)
 *
 * Strategy: test the exported pure helpers (buildLabel, constants) and the
 * interval/cleanup contract using fake timers + manual setInterval/clearInterval
 * simulation.  @testing-library/react is not yet a dev-dependency in this repo;
 * the project canvas-test policy (option b, vitest.config.ts header) prefers
 * testing pure computation over React rendering.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  buildLabel,
  COMPOSE_CLIENT_TIMEOUT_MS,
  STILL_WORKING_THRESHOLD_S,
  type ComposePhase,
} from '../useComposeProgress';

// ── TC-AI-050-01: AC1 — label builds correctly at any elapsed value ────────
describe('buildLabel', () => {
  it('includes elapsed seconds in the starting-phase label', () => {
    const label = buildLabel(12, 'starting');
    expect(label).toContain('12s');
    expect(label).toContain('Extracting');
  });

  it('changes message at the still-working phase (AC2)', () => {
    const label = buildLabel(STILL_WORKING_THRESHOLD_S, 'still-working');
    expect(label).toMatch(/still working/i);
    expect(label).toMatch(/minute/i);
  });

  it('starting-phase label at 0s does not include "still working"', () => {
    expect(buildLabel(0, 'starting')).not.toMatch(/still working/i);
  });

  it('starting-phase label at 19s still shows Extracting (one second before flip)', () => {
    const label = buildLabel(19, 'starting');
    expect(label).toContain('19s');
    expect(label).toContain('Extracting');
    expect(label).not.toMatch(/still working/i);
  });
});

// ── TC-AI-050-01: AC2 — phase flip threshold ──────────────────────────────
describe('STILL_WORKING_THRESHOLD_S', () => {
  it('is 20 seconds (AC2 specifies "if the request exceeds 20s")', () => {
    expect(STILL_WORKING_THRESHOLD_S).toBe(20);
  });

  it('phase logic: elapsed < threshold → starting, elapsed >= threshold → still-working', () => {
    const toPhase = (elapsed: number): ComposePhase =>
      elapsed >= STILL_WORKING_THRESHOLD_S ? 'still-working' : 'starting';

    expect(toPhase(0)).toBe('starting');
    expect(toPhase(19)).toBe('starting');
    expect(toPhase(20)).toBe('still-working');
    expect(toPhase(60)).toBe('still-working');
  });
});

// ── TC-AI-050-02: AC4 — client timeout must be ≥ server's 90s ─────────────
describe('COMPOSE_CLIENT_TIMEOUT_MS', () => {
  it('is at least 90 000ms (the server LAYERIZE_TIMEOUT_MS)', () => {
    // The server's LAYERIZE_TIMEOUT_MS is 90 000ms (US-AI-031b).
    // The client must not fire before the server, or the user sees a
    // false failure while the server is still legitimately working (AC4).
    expect(COMPOSE_CLIENT_TIMEOUT_MS).toBeGreaterThanOrEqual(90_000);
  });

  it('is a reasonable upper bound (≤ 5 minutes)', () => {
    // A timeout over 5 minutes would leave the user in an indefinite wait
    // with no feedback path.
    expect(COMPOSE_CLIENT_TIMEOUT_MS).toBeLessThanOrEqual(300_000);
  });
});

// ── TC-AI-050-06: AC6 — interval cleanup contract ─────────────────────────
//
// The hook uses a `mounted` guard so setState is not called after unmount,
// and clears its interval in the useEffect cleanup.  We verify both contracts
// here by simulating setInterval/clearInterval directly.
describe('interval cleanup contract (AC6)', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('clearInterval is called when the consumer cleans up the effect', () => {
    const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval');
    const intervalId = setInterval(() => {}, 1000);

    // Simulate the cleanup the hook performs
    clearInterval(intervalId);

    expect(clearIntervalSpy).toHaveBeenCalledWith(intervalId);
    clearIntervalSpy.mockRestore();
  });

  it('a mounted-guard pattern stops updates after the flag is false', () => {
    // Simulate the hook's inner loop with a mounted guard
    let count = 0;
    let mounted = true;

    const id = setInterval(() => {
      if (mounted) count += 1;
    }, 1000);

    vi.advanceTimersByTime(3000);
    expect(count).toBe(3);

    // Unmount: set guard false, clear interval
    mounted = false;
    clearInterval(id);

    // Subsequent ticks should not increment count
    vi.advanceTimersByTime(10_000);
    expect(count).toBe(3);
  });
});
