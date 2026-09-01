/**
 * US-EDIT-009 AC2/AC5 — the shared generation store holds no render-mode
 * preference.
 *
 * Why this is worth a test rather than left to review:
 *
 * CanvasEditToolbar derives "is this canvas editable?" from the canvas alone,
 * and its source carries a warning about what happened when it did not —
 * "ORing it in here made every canvas in the session claim to be editable once
 * any compose had succeeded, including a freshly opened template holding no AI
 * content at all."
 *
 * That bug needed one ingredient: a session-global renderMode on this store for
 * someone to reach for. US-EDIT-009 removed it, which makes the bug structurally
 * impossible rather than merely avoided by a comment. This test fails the moment
 * the ingredient comes back, which is the point at which the warning stops being
 * enforced by anything.
 *
 * It is not a substitute for rendering CanvasEditToolbar — no component test
 * harness exists in this project (@testing-library/react is not a dependency),
 * so TC-EDIT-009-05 is covered here structurally and on staging by hand.
 */

import { describe, it, expect } from 'vitest';
import { useGenerationPrefs } from '../useGenerationPrefs';

describe('useGenerationPrefs — US-EDIT-009', () => {
  it('exposes no renderMode preference (AC2)', () => {
    const state = useGenerationPrefs.getState() as unknown as Record<string, unknown>;

    expect(state).not.toHaveProperty('renderMode');
    expect(state).not.toHaveProperty('setRenderMode');
  });

  it('still carries activeGenerationId — an identity, not a preference (AC9)', () => {
    const state = useGenerationPrefs.getState();

    // CanvasEditToolbar reads this to know which generation to compose. It is
    // the one thing the store must keep: without it "Edit elements" has no id
    // to call POST /:id/compose with.
    expect(state).toHaveProperty('activeGenerationId');
    expect(typeof state.setActiveGenerationId).toBe('function');
  });

  it('round-trips activeGenerationId through the setter', () => {
    useGenerationPrefs.getState().setActiveGenerationId('gen-123');
    expect(useGenerationPrefs.getState().activeGenerationId).toBe('gen-123');

    useGenerationPrefs.getState().setActiveGenerationId(null);
    expect(useGenerationPrefs.getState().activeGenerationId).toBeNull();
  });
});
