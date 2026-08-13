# Story Card — US-AI-049

> **Status:** 🔲 Not Started
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

- [ ] **AC1:** A pure function `mapExtractedFont(fontName, alternatives?) → { family, weight }` converts provider identifiers to CSS-resolvable families: `Montserrat-Bold.ttf` → `{ family: 'Montserrat', weight: 700 }`, `-SemiBold` → 600, `-Medium` → 500, `-Light` → 300, no suffix → 400 — unit-tested against every identifier observed in the 2026-08-13 payloads.
- [ ] **AC2:** Unrecognisable identifiers (e.g. `IMFeFCrm28P.ttf`) fall back through `font_alternatives` (first `font__{slug}__{weight}` entry parsed the same way) and only then to Inter — never a browser default serif.
- [ ] **AC3:** The mapped families used by extraction (at minimum: Montserrat, Playfair Display) are loaded in the editor (Google Fonts link or self-hosted) so mapped names actually resolve — verified via `document.fonts.check()` in a browser run.
- [ ] **AC4:** `loadComposedDesignToCanvas` applies `{ family, weight }` to each TextElement (`fontFamily` + `fontWeight`/`bold`) instead of storing the raw `.ttf` string — covered by an updated helper spec.
- [ ] **AC5:** Live re-verify with `scripts/e2e-editable-verify.mjs`: the price block renders on one line matching the preview (the "₹1.9 / Cr" wrap is gone) — screenshot recorded in the story dir.

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
| TC-AI-049-04 | Manual | P1 | Live harness run: price renders one line; fonts visually match preview (AC3/5) | 🔲 | |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

---

## Definition of Done

- [ ] All ACs checked ✅ · test cases recorded · Gate 1 green
