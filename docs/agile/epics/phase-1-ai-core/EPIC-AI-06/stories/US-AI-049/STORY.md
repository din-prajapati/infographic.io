# Story Card — US-AI-049

> **Status:** 🟡 In Progress — AC5 live-verified 2026-08-14 and **failed**: font-mapping itself works (AC1/2/4/6 confirmed live), but the wrap regression this story set out to close still reproduces for a different reason (see AC5 finding below)
> **Feature:** F-AI-06-08 — Extraction fidelity: font mapping
> **Epic:** [EPIC-AI-06](../../EPIC.md)
> **Milestone:** [M-AI-18-editable-text-overlay](../../milestones/M-AI-18-editable-text-overlay.md)
> **Size:** S
> **Depends on:** extraction-led editable path (`88db72d`) — ✅
> **Linear:** LIN-XXX
> **Created:** 2026-08-13 | **Closed:** —

---

## Why this story exists

Layerize returns provider font identifiers (`Montserrat-Bold.ttf`, `Montserrat-Medium.ttf`, `IMFeFCrm28P.ttf`, plus a `font_alternatives` list of Google-font slugs like `font__playfair-display__700`). The canvas loader stores them verbatim as `fontFamily`, the browser can't resolve them, and every element silently falls back to Inter. Different metrics → different wrapping than the preview: live run 2026-08-13 rendered the price as "₹1.9 / Cr" on two lines where the design had one. The data to fix this is already in the payload — it is a mapping problem, not an AI problem.

---

## Story

*As a* solo real estate agent
*I want* the editable text blocks to render in the same fonts the generated design used
*So that* what I edit looks like what I approved, and nothing re-wraps or shifts.

---

## Acceptance Criteria

- [x] **AC1 [happy-path]:** A pure function `mapExtractedFont(fontName, alternatives?) → { family, weight }` converts provider identifiers to CSS-resolvable families: `Montserrat-Bold.ttf` → `{ family: 'Montserrat', weight: 700 }`, `-SemiBold` → 600, `-Medium` → 500, `-Light` → 300, no suffix → 400 — unit-tested against every identifier observed in the 2026-08-13 payloads.
- [x] **AC2 [error-path]:** Unrecognisable identifiers (e.g. `IMFeFCrm28P.ttf`) fall back through `font_alternatives` (first `font__{slug}__{weight}` entry parsed the same way) and only then to Inter — never a browser default serif.
- [x] **AC3 [happy-path]:** The mapped families used by extraction (at minimum: Montserrat, Playfair Display) are loaded in the editor (Google Fonts link or self-hosted) so mapped names actually resolve — verified via `document.fonts.check()` in a browser run.
- [x] **AC4 [happy-path]:** `loadComposedDesignToCanvas` applies `{ family, weight }` to each TextElement (`fontFamily` + `fontWeight`/`bold`) instead of storing the raw `.ttf` string — covered by an updated helper spec.
- [ ] **AC5 [regression]:** ❌ **Live-verified 2026-08-14, FAILS.** New Playwright spec `e2e/us-ai-049-font-mapping.spec.ts` (supersedes the manual `scripts/e2e-editable-verify.mjs` harness referenced in the original AC text — same live-money discipline, now a durable, re-runnable regression test). The price block still wraps to two lines ("₹1.9" / "Cr") on the editable canvas while the same text renders on one line in the preview thumbnail beside it — screenshot: `evidence/ac5-price-wraps-two-lines-2026-08-14.png`. **Root cause is NOT font-mapping** — `document.fonts.check()` confirms the resolved family loads, and the mapper correctly avoided leaking a raw `.ttf` identifier. The mapper fell through to the Inter fallback (this generation's font identifier didn't match a known pattern — AC2's documented, correct behavior), and the box `canvasState.ts:551` sizes for the text (`safeW = geo.width * scale`) comes straight from the extraction's measured geometry with **no adjustment for the actually-applied font's glyph metrics** — `mapExtractedFont` and the width calculation are entirely independent. Inter's glyphs don't fit the box sized for the original (unknown) provider font, so it wraps. This is real, separate scope from what this story built — tracked as [BL-08](../../../../../BACKLOG.md).
- [x] **AC6 [edge-case]:** Given a `font_alternatives` array that is present but empty, or contains only entries that fail the `font__{slug}__{weight}` pattern, when `mapExtractedFont` in `client/src/lib/fontMap.ts` is called with an unrecognized primary identifier and that alternatives list, then it returns `{ family: 'Inter', weight: 400 }` without throwing — unit-tested with both an empty `font_alternatives` array and an array whose every entry is unparseable.

---

## Out of Scope

- **Exact font licensing/embedding for export** — export parity beyond what html2canvas already does is not this story.
- **Fonts in the layout-engine (AI-first) path** — DEFAULT template typography is engine territory (US-AI-043 land).
- **Downloading/self-hosting every Google font layerize might name** — load the observed set; extend the map as new identifiers appear.

---

## Engineering / PR

- **Branch:** `feat/ai/us-ai-049-font-mapping`
- **PR:** #_____ (fill when opened)
- **Primary files touched:**
  - `client/src/lib/fontMap.ts` (new) — mapper + tests
  - `client/src/lib/canvasState.ts` — apply mapping in `loadComposedDesignToCanvas`
  - `client/index.html` or `client/src/index.css` — font loading
  - `api/src/modules/ai-generation/services/layer-extraction.service.ts` — pass `font_alternatives` through on `ExtractedTextBlock` (TBC — only if not already surfaced)

---

## AI Implementation Prompt

```
Context: InfographicAI — see CLAUDE.md. Read this STORY.md + TASKS.md.

Story: US-AI-049 — Map extracted font identifiers to real editor fonts

Build client/src/lib/fontMap.ts: mapExtractedFont('Montserrat-Bold.ttf') →
{ family:'Montserrat', weight:700 }; parse -Bold/-SemiBold/-Medium/-Light/-Regular
suffixes; fall back through font_alternatives ('font__playfair-display__700' →
{ family:'Playfair Display', weight:700 }); final fallback Inter/400.
Apply in loadComposedDesignToCanvas (canvasState.ts) — set fontFamily AND weight.
Load Montserrat + Playfair Display in the editor shell. Verify with the e2e harness.

Rules: only listed files; out-of-scope is law; tests ship with their task's commit.
```

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|----------|----------|--------|---------|
| TC-AI-049-01 | Auto | P0 | Every observed identifier maps to expected {family, weight} (AC1) | 🔲 | |
| TC-AI-049-02 | Auto | P0 | Garbage identifier + alternatives list → first alternative parsed; no alternatives → Inter 400 (AC2) | 🔲 | |
| TC-AI-049-03 | Auto | P1 | Loader spec: TextElement gets mapped family/weight, never a raw `.ttf` string (AC4) | 🔲 | |
| TC-AI-049-04 | Auto (E2E, live) | P1 | Live: price renders one line; fonts visually match preview (AC3/5) | ❌ Fail | `e2e/us-ai-049-font-mapping.spec.ts` — AC3 (fonts load) passes; AC5 (one line) fails, see AC5 finding + BL-08 |
| TC-AI-049-05 | Auto | P1 | edge-case: empty or fully-unparseable `font_alternatives` list falls back to Inter 400 without throwing (AC6) | 🔲 | |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

---

## Definition of Done

- [ ] All ACs checked ✅ · test cases recorded · Gate 1 green
