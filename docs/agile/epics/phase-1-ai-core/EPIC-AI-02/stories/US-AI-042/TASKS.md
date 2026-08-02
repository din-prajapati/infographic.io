# PR Task List — US-AI-042

> **Story:** [STORY.md](./STORY.md)
> **Branch:** `feat/ai-us-ai-042-real-canvas-thumbnails`
> **PR:** #_____ (fill when opened)
> **Type:** feat

---

## Three Pillars Pre-flight (check before starting AI session)

- [x] **Brain** — STORY.md filled: ACs written, out-of-scope listed
- [x] **Muscle** — file list + ordered tasks + exact test commands (below)
- [x] **Map** — [ARCHITECTURE.mmd](../../ARCHITECTURE.mmd) exists for this epic
- [x] **Env** — N/A (no new env vars)
- [x] **Dependency** — none; file-disjoint from US-AI-039/040

---

## PR Scope Summary

**One-liner:** Persist a real render of the canvas as the thumbnail on save, instead of the fixed grey placeholder.
```
feat(editor): capture real canvas thumbnails on save — US-AI-042
```

> **Note on ordering:** T1 is a spike, not a code change, and it decides T2's implementation. Do not skip it — the whole story is a no-op if html2canvas silently falls back on this theme.

---

## Task Breakdown

### T1 — Resolve the oklch question by observation (AC8)
**File:** none (investigation; record the finding below)
- Run the app, save a design, and determine whether `generateThumbnail()` returns a real capture or falls back to `generatePlaceholderThumbnail()`
- `canvasExport.ts:3` claims html2canvas cannot parse this theme's oklch colours; `SaveDialog.tsx:69` already calls the real capture, so its in-dialog preview is the fastest place to observe the truth
- **Outcome decides T2:** html2canvas works → use `generateThumbnail()`. It fails → use `exportCanvasToImage()` from `canvasExport.ts` and downscale to a 320px long edge

**Finding (2026-08-02): html2canvas is NOT usable — switched to `exportCanvasToImage()`.**

Observed directly in the browser console:

```
Error generating thumbnail: Error: Attempting to parse an unsupported color
function "oklch"
    at Object.parse (html2canvas.js:1673)
    at new CSSParsedDeclaration2 (html2canvas.js:3558)
    at parseNodeTree (html2canvas.js:4593)
```

The failure is intermittent in a way that makes it easy to misread as success:
html2canvas parses the *live DOM*, so it works when the artboard happens to
contain only hex-coloured template elements, and throws the moment any
theme-styled (oklch) node is in the tree — e.g. the empty-canvas "Sample
Preview" placeholder. A first pass at this story looked like it worked for
exactly that reason.

A second, separate defect was found in the same function: it passed the
artboard's native size (1080×1920) as html2canvas's `width`/`height`, believing
that produced a print-resolution capture. Those options are the capture
*viewport*, not a scale factor — so for an element rendered at 281×499 on
screen the design was painted into the top-left corner of a 1080×1920 frame
with ~93% left transparent (measured: 6.8% opaque). The thumbnail had the right
aspect ratio and real pixels, which is why it passed a naive "is it real?"
check while looking blank to a user.

Resolution: `generateThumbnail()` now renders through `exportCanvasToImage()`
from `canvasExport.ts`, which draws elements onto a native canvas straight from
the store and never touches computed CSS — the reason that module exists
("Bypasses html2canvas to avoid oklch color parsing issues") and why the Export
button already worked. It also already sets `img.crossOrigin = 'anonymous'`,
which covers AC3's tainted-canvas risk for free.

Verified after the change, in the editor with the Premium Listing — Story
template loaded (1080×1920, 13 elements):
`isPlaceholder: false`, `thumbSize: 180×320` (true 9:16), `opaquePct: 100`,
`136 distinct colours`, 43.4 KB — a full render showing the headline, the
₹1.18 Cr price chip, amenity lines and the CTA bar.

### T2 — Make the save path use the real capture
**Files:** `client/src/lib/canvasState.ts`, `client/src/components/editor/EditorLayout.tsx`
- Point both save handlers (`handleSaveClick` ~`:255`, `handleSaveAsTemplate` ~`:316`) at the capture chosen in T1
- `handleSaveAsTemplate` is already `async`; check whether the regular save handler must become `async`
- Keep `generatePlaceholderThumbnail()` as the fallback and document why it survives

### T3 — Cross-origin handling (AC3)
**File:** `client/src/lib/canvasState.ts`
- AI images come from provider URLs and taint the canvas → `toDataURL()` throws SecurityError
- Route capture-time image loads through the existing `/api/proxy-image`, or confirm the current element rendering already avoids tainting
- Verify with a real generated infographic, not a local placeholder image

### T4 — Failure path (AC5)
**Files:** same as T2
- Capture failure must never block a save or persist an empty string
- Fall back to the placeholder, log the error

### T5 — E2E coverage
**File:** `e2e/us-ai-042-real-canvas-thumbnails.spec.ts` (new)
- TC-AI-042-04: saved `thumbnail` differs from the known placeholder data-URL
- TC-AI-042-06: forced capture failure still saves, stores placeholder
- Reuse the auth helper from `e2e/us-ai-040-template-preview-tags.spec.ts` — and avoid the trap that spec hit: waiting on "A OR B" resolved during the fetch window and turned assertions into silent skips

---

## File-to-Task Mapping

| File | Tasks |
|------|-------|
| _(investigation only)_ | T1 |
| `client/src/lib/canvasState.ts` | T2, T3, T4 |
| `client/src/components/editor/EditorLayout.tsx` | T2, T4 |
| `e2e/us-ai-042-real-canvas-thumbnails.spec.ts` | T5 |

---

## Exact Test Commands

```bash
npm run check
npm run test:unit
PLAYWRIGHT_BASE_URL=http://localhost:5000 npx playwright test e2e/us-ai-042-real-canvas-thumbnails.spec.ts
# Manual: save a design with text + image -> My Designs card shows the artwork
# Manual: Save as Template -> real thumbnail in the editor Templates panel + gallery
# Manual: generate with a real property photo, save -> thumbnail shows it, no SecurityError
# Manual: save Story / Post / Email Header -> aspect ratio preserved, long edge <= 320px
```

> **Note:** `.env` sets `PLAYWRIGHT_BASE_URL` to the Railway staging URL, so a bare
> `npx playwright test` runs against staging. Always pass the localhost override
> when verifying local work.

---

## Task Checklist

- [x] T1 — Resolve the oklch question (finding recorded above)
- [x] T2 — Save path uses the real capture
- [x] T3 — Cross-origin handling
- [x] T4 — Failure path
- [x] T5 — E2E coverage
- [x] `npm run check` passes
- [x] `npm run test:unit` passes
- [x] `npm run test:e2e` passes (new spec)
- [ ] Manual test recorded
- [ ] PR opened with story card as description
- [ ] STORY.md ACs updated

---

## Test Is Truth

> Do not weaken, skip, or modify a failing test to make it pass. Fix the code.

---

## Anti-Patterns to Avoid in This Story

- Do NOT assume html2canvas works — T1 exists because `canvasExport.ts` documents that it does not on this theme. "Awaited the async one, shipped it" is the failure mode here: it compiles, it passes, and it still stores a placeholder.
- Do NOT backfill existing rows — out of scope, and there is no server-side canvas renderer to do it with.
- Do NOT touch the seeded premium templates' hand-authored SVG thumbnails, or any thumbnail *consumer* — the five surfaces all read the same field and are fixed by the write path alone.
- Do NOT assert "a thumbnail exists" — the placeholder is a valid image and would pass. Compare against the placeholder output.

---

*Tasks created: 2026-08-02*
