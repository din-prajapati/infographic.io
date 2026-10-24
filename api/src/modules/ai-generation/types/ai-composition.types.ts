/**
 * US-EDIT-011 — what an AI image *is*, named once.
 *
 * The server has always known whether a generation would come back as a plain
 * background or as a finished poster with the listing facts baked into the
 * pixels: `ai-orchestrator.service.ts` derives it from `photoReference` to pick
 * the US-AI-051 text-free prompt. But it derived it into a local variable and
 * threw it away, so the canvas had to infer from pixels what the server knew
 * for certain — and inferring wrongly is BL-27, where a template's own text
 * survives on top of a poster that already renders the same facts.
 *
 * The predicate lives here rather than in either caller because it has two:
 * `generations.service.ts` persists it onto the row at creation time, and the
 * orchestrator reads it later, asynchronously, to choose the prompt. Those must
 * never disagree, and the only way to guarantee that is one function.
 */

export type AiComposition = 'background' | 'poster';

/**
 * `'background'` when the user supplied their own listing photograph — the
 * text-free path, which produces an image with no baked-in text. `'poster'`
 * otherwise, where the composed prompt bakes a headline and price into the
 * image itself.
 *
 * The guard is US-AI-051's, kept verbatim: `photoReference` must be a non-empty
 * string. An empty-string photo falls through to the composed prompt, as it
 * always has.
 */
export function resolveAiComposition(photoReference?: unknown): AiComposition {
  return typeof photoReference === 'string' && photoReference.length > 0
    ? 'background'
    : 'poster';
}
