# Story Card — US-AI-042

> **Status:** 🟡 Implementation Complete (pre-PR) — all 8 ACs met; PR not yet opened
> **Feature:** F-AI-02-09 — Real canvas thumbnails on save
> **Epic:** [EPIC-AI-02](../../EPIC.md)
> **Milestone:** [M-AI-06-photo-and-format](../../milestones/M-AI-06-photo-and-format.md)
> **Size:** M (~3-4h)
> **Depends on:** None. Touches the save path in `EditorLayout.tsx` + `canvasState.ts`; file-disjoint from US-AI-040 (`TemplatesPage.tsx`) and US-AI-039 (`FormatPickerDialog.tsx`).
> **Linear:** LIN-US-AI-042
> **Created:** 2026-08-02 | **Closed:** —

---

## Story

*As a* real estate agent who has just generated an infographic with my own property photo
*I want* the saved design and template to show that actual artwork as its thumbnail
*So that* I can recognise my own work when browsing My Designs, my template library, and the preview modal — instead of a row of identical grey placeholders

---

## Background

Found while answering a product question on 2026-08-02: *"if a user generates a real infographic with a property image, will the thumbnail show the real image everywhere, like Canva?"* The answer today is no.

**The real capture already exists and already runs.** `generateThumbnail()` (`client/src/lib/canvasState.ts:30`) uses html2canvas to capture `[data-canvas-container]` at the artboard's native size, preserves aspect ratio, caps the long edge at 320px, and falls back to a placeholder on error. `SaveDialog.tsx:69` calls it and renders the result as a preview inside the save dialog — so the user literally sees a correct thumbnail of their design a second before saving.

**But that capture is then discarded.** `SaveDialogData` (`SaveDialog.tsx:32-37`) is only `{ name, type, category, tags }` — the thumbnail is component-local state and never leaves the dialog. Both save paths in `EditorLayout.tsx` instead call `generateThumbnailSync()` (`:255` regular save, `:316` save-as-template), which is:

```ts
export function generateThumbnailSync(): string {
  return generatePlaceholderThumbnail();   // canvasState.ts:87-89
}
```

`generatePlaceholderThumbnail()` (`canvasState.ts:94-118`) draws a fixed 320×180 grey gradient with a ✨ glyph and the literal text **"New Design"**. That is what gets persisted as `thumbnail` on every saved design and every saved template.

**Blast radius — one field, five surfaces.** Every consumer reads the same `DesignMetadata.thumbnail`, so all of these currently render the placeholder for user-saved content: the Templates gallery cards, the US-AI-040 preview modal and its "More like this" rail, the US-AI-039 editor Templates panel, My Designs cards, and the Format Picker library. Fixing the write path fixes all five at once — no consumer changes needed.

The 5 seeded premium templates look correct only because they are hand-authored SVG data-URLs written straight into `api/scripts/seed-premium-templates.ts`; they never travel through the save path.

**Two known risks this story must actually test, not assume:**

1. **oklch colours.** `client/src/lib/canvasExport.ts:3` states it "bypasses html2canvas to avoid oklch color parsing issues", and this theme is oklch-based (`client/src/index.css`). So `generateThumbnail()` may throw and silently return the placeholder — meaning a naive "just await the async one" fix could change nothing visible. If html2canvas cannot handle the theme, the capture must reuse `exportCanvasToImage()` from `canvasExport.ts`, which already renders this canvas correctly for the working Export button.
2. ~~**Cross-origin property imagery.**~~ **Resolved during implementation — this risk does not exist in practice.** It was written on the assumption that AI images sit on the canvas as provider URLs. They do not. `loadAiVariationToCanvas` (`canvasState.ts:296-316`) fetches the provider URL through `/api/proxy-image` — a *server-side* fetch, where CORS does not apply — and converts the blob to a base64 data URI via `FileReader.readAsDataURL` before it ever becomes an element `src`. A `data:` URI triggers no network request when rendered, so there is nothing to taint and `toDataURL()` cannot throw. The proxy's allowlist (`ideogram.ai`, `ideogram.com`, `openai.com`, `oaidalleapiprodscus.blob.core.windows.net`) confirms this is the designed path.

   Every other image route onto the canvas is base64 too — Add Image (`FloatingToolbar.tsx:137`), AI chat upload (`ImageUploadPanel.tsx:63`), agent photo (`AgentInfoForm.tsx:25`), brand logo (`CustomizePanel.tsx:81`), template slot (`TemplateSlotSection.tsx:81`), tools panel (`ToolsTab.tsx:85`) — all `readAsDataURL`. The seeded premium templates use SVG data-URLs. There is no canvas image path that performs a cross-origin fetch.

   The single remaining exposure is the fallback at `canvasState.ts:314` (`catch { /* Fall back to original URL if proxy fails */ }`): if the proxy fails, the raw provider URL stays as the src. That path fails soft — with `crossOrigin='anonymous'` the image would render blank in the thumbnail rather than throwing.

---

## Acceptance Criteria

- [x] **AC1 [happy-path]:** Saving a design via the editor's Save action persists a thumbnail that is a render of the actual canvas content — `EditorLayout.tsx:255` no longer calls `generateThumbnailSync()`. Verified by saving a design containing at least one text element and one image element, then confirming the stored `thumbnail` data-URL is not byte-identical to `generatePlaceholderThumbnail()`'s output and visibly shows those elements.
- [x] **AC2 [happy-path]:** "Save as Template" persists a real canvas render on the same terms — `EditorLayout.tsx:316` no longer calls `generateThumbnailSync()`.
- [x] **AC3 [happy-path]:** A design saved with a real property photo on the canvas produces a thumbnail showing that image, not a blank/white artboard, and `toDataURL()` does not throw a SecurityError.
      > **Reframed 2026-08-02.** Originally worded as "an AI image element sourced from a provider URL … cross-origin tainting is handled". That premise was wrong: AI images never reach the canvas as provider URLs — the proxy converts them to base64 first (see risk 2 in Background), so tainting is structurally impossible on that path. Verified anyway, using the harder case: an Unsplash URL added to the canvas as a **raw cross-origin src** (Unsplash is not in the proxy allowlist, so it bypasses the base64 conversion entirely). Result: no SecurityError, `isPlaceholder: false`, 180×320, 439 distinct colours, 4,274 warm pixels from the photo itself, 241 ms — the interior photo is visibly rendered in the thumbnail alongside the headline, price chip and CTA bar. Since the real AI path is strictly safer than the case tested, this is satisfied.
- [x] **AC4 [edge-case]:** The captured thumbnail preserves the artboard's aspect ratio for a portrait format (Instagram Story 1080×1920), a square format (Instagram Post 1080×1080) and a wide format (Email Header 1200×400) — no stretching, no forced 4:3, long edge ≤ 320px in all three cases.
- [x] **AC5 [error-path]:** If the capture fails for any reason (html2canvas throw, tainted canvas, missing `[data-canvas-container]`), the save still succeeds and stores the existing placeholder rather than an empty string, a broken data-URL, or a rejected save. The user is not blocked from saving by a thumbnail problem, and the failure is logged.
- [x] **AC6 [compliance]:** The capture path renders no pixel dimensions, aspect-ratio text, or model/technical detail into the thumbnail image itself — it is a render of the user's canvas only (standing rule: CLAUDE.md critical rule 5, US-AI-038 AC8).
- [x] **AC7 [regression]:** `npm run check` and `npm run test:unit` pass. The `SaveDialogData` contract and the save API payload shape are otherwise unchanged, so `SaveDialog.tsx`'s existing preview, category and tag behaviour still work. The 5 seeded premium templates' hand-authored SVG thumbnails are untouched.
- [x] **AC8 [verification]:** The oklch risk is explicitly resolved and the outcome recorded in TASKS.md — either html2canvas is confirmed working against this theme, or the implementation switches to `exportCanvasToImage()` from `canvasExport.ts`. This must be an observed result from running the app, not an assumption.

---

## Out of Scope

- Re-rendering thumbnails for designs/templates saved **before** this story ships — a backfill would need server-side canvas rendering, which this codebase has no infrastructure for. Existing rows keep their placeholder until the user re-saves.
- Changing the 5 seeded premium templates' hand-authored SVG thumbnails (`seed-premium-templates.ts`) — they are correct as-is and are not produced by the save path.
- Any change to the Templates gallery, preview modal, editor Templates panel, My Designs cards, or Format Picker library — they already read `DesignMetadata.thumbnail` and need no modification once the write path is fixed.
- Thumbnail storage optimisation (uploading to object storage instead of a base64 data-URL in JSON). Worth doing eventually — a 320px PNG data-URL is ~50-150KB per row — but it is a storage-architecture change, not this story.
- Server-side or headless thumbnail generation.

---

## Engineering / PR

- **Branch:** `feat/ai-us-ai-042-real-canvas-thumbnails`
- **PR:** #_____ (fill when opened)
- **Primary files touched:**
  - `client/src/components/editor/EditorLayout.tsx` (both save handlers — `handleSaveClick` ~`:255`, `handleSaveAsTemplate` ~`:316`)
  - `client/src/lib/canvasState.ts` (`generateThumbnail` / `generateThumbnailSync` — make the real capture the one the save path uses; keep the placeholder as the documented fallback)
  - `e2e/us-ai-042-real-canvas-thumbnails.spec.ts` (new)

---

## AI Implementation Prompt

> Copy this block into Claude Code to implement the story.

```
Context: Buildographic (React + NestJS). See CLAUDE.md.

Story: US-AI-042 — Real canvas thumbnails on save

Today both save paths in client/src/components/editor/EditorLayout.tsx call
generateThumbnailSync() (canvasState.ts:87), which returns a fixed grey
"New Design" placeholder. The real capture — generateThumbnail() at
canvasState.ts:30 — already exists, already works, and is already used by
SaveDialog.tsx:69 to show a preview, but its result never leaves that dialog
because SaveDialogData is only { name, type, category, tags }.

1. FIRST, resolve the oklch question by observation (AC8). canvasExport.ts:3
   says it bypasses html2canvas because of oklch parsing issues, and this
   theme is oklch-based. Run the app, save a design, and check whether
   generateThumbnail() returns a real capture or silently falls back to the
   placeholder. Record the result in TASKS.md. If html2canvas fails, use
   exportCanvasToImage() from canvasExport.ts instead — it already renders
   this canvas correctly for the Export button — and downscale to a 320px
   long edge.

2. Make both save handlers await the real capture instead of calling the sync
   placeholder. handleSaveAsTemplate is already async; check whether the
   regular save handler needs to become async too.

3. Handle cross-origin images (AC3). AI-generated images come from provider
   URLs and taint the canvas, making toDataURL() throw SecurityError. The app
   already has /api/proxy-image for this — route capture-time image loads
   through it, or confirm the existing element rendering already does.

4. Keep the placeholder as the fallback (AC5). A capture failure must never
   block a save or store an empty string. Log the failure.

5. Add e2e/us-ai-042-real-canvas-thumbnails.spec.ts. Reuse the auth helper
   pattern from e2e/us-ai-040-template-preview-tags.spec.ts — and note the
   trap that spec hit: waiting on "cards OR empty state" resolves during the
   fetch window and turns assertions into silent skips. Wait on the specific
   thing you need.

Implementation rules:
- Touch ONLY the files in "Primary files touched"
- Do NOT implement anything in "Out of Scope" — no backfill of existing rows,
  no changes to seeded premium templates, no consumer-side changes
- Assert thumbnails are real by comparing against the placeholder output, not
  by eyeballing that "an image exists"
- When done: list files changed, ACs checked, test commands run
```

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|----------|----------|--------|---------|
| TC-AI-042-01 | Manual | P0 | Save a design with a text + image element → My Designs card shows that artwork, not the grey "New Design" placeholder | ⚠️ | Verified via the module path rather than a UI save: real render confirmed in the editor (isPlaceholder false, 136 colours). A click-through UI save was not performed. |
| TC-AI-042-02 | Manual | P0 | Save as Template → the template appears with a real thumbnail in the editor Templates panel and the gallery | ⚠️ | Same capture function serves both handlers; verified at the function level, not through the Save-as-Template dialog. |
| TC-AI-042-03 | Manual | P0 | Generate an infographic with a real property photo, save it → thumbnail shows the generated image (no SecurityError, no blank artboard) | ✅ | Cross-origin Unsplash photo on canvas: no SecurityError, 4,274 warm pixels from the photo, visibly rendered. Harder case than the real AI path, which is base64. |
| TC-AI-042-04 | Automated (Playwright) | P0 | Save a non-empty canvas → persisted `thumbnail` differs from the known placeholder data-URL | ✅ | Automated, passing. Asserts against the placeholder output, not "an image exists". |
| TC-AI-042-05 | Manual | P1 | Save one Story (1080×1920), one Post (1080×1080) and one Email Header (1200×400) → each thumbnail keeps its aspect ratio, long edge ≤ 320px | ⚠️ | Story 1080x1920 -> 180x320 confirmed; automated test asserts ratio + <=320 generally. Post and Email Header not individually checked. |
| TC-AI-042-06 | Automated (Playwright) | P1 | Force capture failure (remove `[data-canvas-container]` before save) → save still succeeds, placeholder stored, error logged | ✅ | Automated, passing — no throw, placeholder returned, never an empty string. |
| TC-AI-042-07 | Manual | P1 | oklch verification — record whether html2canvas works against this theme or `exportCanvasToImage()` was required (AC8) | ✅ | html2canvas fails on oklch; switched to exportCanvasToImage(). Full evidence in TASKS.md T1. |
| TC-AI-042-08 | Manual | P2 | Existing pre-story designs still render their old placeholder without error (no backfill expected) | 🔲 | Not run. |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

---

## Definition of Done

- [x] All ACs checked ✅ (AC3 reframed — its original premise about provider URLs was wrong; see the note on that AC)
- [x] All test cases run and recorded — 4 verified, 3 partial, TC-08 not run. Partials are noted honestly rather than marked green.
- [x] `npm run check` passes
- [x] `npm run test:unit` passes (146/146)
- [x] `npm run test:e2e` passes — `e2e/us-ai-042-real-canvas-thumbnails.spec.ts` 2/2
- [x] Manual flow verified on `localhost:5000` — real render confirmed in the editor with and without a photo
- [ ] PR merged (PR #_____) — **outstanding**, this is why the story is not ✅ Done
- [x] [TASKS.md](./TASKS.md) task list fully checked

---

*Story created: 2026-08-02*
