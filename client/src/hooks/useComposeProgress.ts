/**
 * useComposeProgress — US-AI-050
 *
 * Shared elapsed-time and step-label hook for both generation surfaces
 * (RightSidebar + AIChatBox) while POST /:id/compose is in flight.
 *
 * One implementation here means RightSidebar and AIChatBox cannot drift into
 * separate timer logic — the exact same anti-pattern that caused the US-AI-047
 * editable-feature split.
 *
 * Phase transitions:
 *   'starting'       — 0 to 19 seconds (initial state, counts up)
 *   'still-working'  — ≥ 20 seconds (AC2: acknowledge the wait explicitly)
 *
 * AC4: the client timeout (COMPOSE_CLIENT_TIMEOUT_MS) passed to the caller is
 * guaranteed to be ≥ the server's LAYERIZE_TIMEOUT_MS (90 000ms) so the server
 * always gets to respond before the client gives up.
 *
 * AC6: the interval and the mounted guard are both cleaned up in the useEffect
 * return function. setState is only called while `mounted` is true, which is
 * set to false in the cleanup — preventing any "state update on unmounted
 * component" warning even when the compose call resolves after navigation.
 */
import { useState, useEffect, useCallback } from 'react';

export type ComposePhase = 'starting' | 'still-working';

export interface ComposeProgress {
  /** Elapsed seconds since compose started. Increments every second. */
  elapsedSeconds: number;
  /**
   * 'starting'      — first 19 seconds: "Extracting text layers… 12s"
   * 'still-working' — ≥ 20 seconds: "Still working — this can take up to a minute for detailed designs"
   */
  phase: ComposePhase;
  /**
   * Pre-composed label string ready to render directly in a button or toast.
   * Callers may display this as-is or build their own string from elapsedSeconds + phase.
   */
  label: string;
}

/** Phase flip threshold (seconds). AC2 requires the message change at/after 20s. */
export const STILL_WORKING_THRESHOLD_S = 20;

/** Tick interval for the elapsed-seconds counter (ms). */
const TICK_INTERVAL_MS = 1000;

/**
 * Minimum client-side request timeout for getComposedDesign.
 *
 * Must be ≥ LAYERIZE_TIMEOUT_MS (90 000ms) so the server always gets to
 * respond before the client gives up (AC4). Set to 120 000ms to allow a
 * generous safety margin over the 90s server budget.
 *
 * Export so T3 (api.ts) and the AC4 test can both reference the same constant
 * rather than repeating the literal in two places.
 */
export const COMPOSE_CLIENT_TIMEOUT_MS = 120_000;

/** @internal exported for unit testing only */
export function buildLabel(elapsed: number, phase: ComposePhase): string {
  if (phase === 'still-working') {
    return 'Still working — this can take up to a minute for detailed designs';
  }
  return `Extracting text layers… ${elapsed}s`;
}

/**
 * Start a compose-wait progress tracker.
 *
 * @param active - Pass `true` while the compose call is in flight. The timer
 *   starts the first time `active` transitions from false→true and resets
 *   whenever `active` becomes false again.
 *
 * @returns ComposeProgress — reset to { elapsedSeconds: 0, phase: 'starting' }
 *   whenever `active` is false.
 */
export function useComposeProgress(active: boolean): ComposeProgress {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!active) {
      setElapsed(0);
      return;
    }

    let mounted = true;

    // Start counting immediately (t=0 on first tick after 1s)
    const intervalId = setInterval(() => {
      if (mounted) {
        setElapsed((prev) => prev + 1);
      }
    }, TICK_INTERVAL_MS);

    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, [active]);

  const phase: ComposePhase =
    elapsed >= STILL_WORKING_THRESHOLD_S ? 'still-working' : 'starting';

  return {
    elapsedSeconds: elapsed,
    phase,
    label: buildLabel(elapsed, phase),
  };
}
