# US-PANEL-01 — Right Panel: Brand Styles → Generation + Quick Styles as Post-Generation Tool

> **Epic:** [EPIC-AI-02](../../EPIC.md)
> **Milestone:** M-AI-06-photo-and-format
> **Status:** ✅ Done
> **Priority:** P1
> **Persona:** Real estate agent (daily user, SOLO/BROKERAGE plan)
> **Branch:** `feat/ai/us-panel-01-brand-generation`
> **PR:** #26
> **Hardened:** 2026-08-05 — reality re-verified against `main` @ 45120fd; ACs re-typed and renumbered

---

## User Story

*As a* real estate agent using the right panel to generate infographics,
*I want* to know which brand palette is active before I click Generate, and have that palette meaningfully affect the generated image,
*So that* I don't waste a generation credit on an image that ignores my brand colors.

---

## Current Reality (re-verified 2026-08-05)

> The original 2026-06-16 "Current Reality" section described a Phase 0.5 codebase and was
> materially stale. It is replaced below with line-referenced findings from `main` @ 45120fd.

### What IS wired and working today

| Flow | Status | Evidence |
|------|--------|---------|
| Design tab palette → `selectedTheme` + `selectedThemeColors` (canvas store) | ✅ | `RightSidebar.tsx:499-516` `applyBrandPalette()` |
| `selectedThemeColors` → `agent.brandColors` in `generationsApi.generate()` | ✅ | `RightSidebar.tsx:365-392` `handleGenerate()` |
| Falls back to `agent.brandColors`, then `undefined` — no hardcoded hex fallback | ✅ | `RightSidebar.tsx:366-371` |
| Hex → natural-language colour names in the image prompt | ✅ | `infographic-prompt.builder.ts:18-83` `hexToColorName()` |
| Empty `brandColors` → the `- Color scheme:` line is omitted entirely | ✅ | `infographic-prompt.builder.ts:126,147`; pinned by `api/tests/ai-generation/infographic-prompt.builder.spec.ts:66` |

**US-AI-002a is fully delivered server-side.** The colour-name map and the no-fallback
behaviour both exist and are unit-tested. This story does not re-implement them.

### What is NOT working or misleading today

| # | Problem | Impact | Root cause |
|---|---------|--------|-----------|
| R1 | No indicator near the Generate button showing which palette is active | Agent generates without knowing whether their brand is applied | UX gap — no visual link between the Design tab selection and the Generate button |
| R2 | **A palette is *always* selected.** `useEffect` on mount force-selects `defaultBrandPalettes[0]` ("Luxury Gold") | Every generation silently carries Luxury Gold — charcoal black, gold, white — even for an agent who never opened the Design tab. The "no brand" state is unreachable, so the correct server-side omission behaviour never fires from the UI | `RightSidebar.tsx:305-314` |
| R3 | Quick Styles description implies a canvas-only feature is connected to generation | Agents may expect Quick Styles to affect generation — they don't | `RightSidebar.tsx:1036-1038`: "Quickly add pre-styled text elements… Colors are automatically applied from the selected theme above" |
| R4 | After "Use This Design" the toast says only "The canvas has been updated" | Dead end — no next action offered at the moment the agent has a design and nothing on it | `RightSidebar.tsx:416` |
| R5 | `client/src/lib/colorNames.ts` exists but has **zero importers** | Dead code shipped in the client bundle | Written for US-AI-002a, then the mapping landed server-side in `infographic-prompt.builder.ts` instead |

### Drift corrected during harden

| Original story said | Actual state |
|---|---|
| Generate button reads "Generate Template" | Reads **"Quick Generate"** with sub-label "From your Property & Agent details" (`RightSidebar.tsx:643-664`) |
| Brand defaults to hardcoded `#1F448B, #FFFFFF` when no palette selected | No hex fallback exists anywhere; the real default is the silent Luxury Gold auto-select (R2) |
| `agent.brandColors` empty array is the problem | It is still `[]` by default (`useAgentStore.ts:27`), but that is now correct behaviour, not a defect |
| Old AC3 — "hex→colour-name mapping" | Retired. Delivered by US-AI-002a in `infographic-prompt.builder.ts` |
| "Color Name Lookup Table (AC2)" design section | Removed — the table shipped server-side and is not this story's concern |

### Decisions taken at harden (2026-08-05)

- **D1 — Remove the mount auto-select (R2).** No palette is selected on load. This is what makes
  AC2 and AC3 reachable and stops billing a generation against a brand the agent never chose.
  Quick Styles degrade to neutral defaults via the existing `getColorForStyle(null, …)` branch
  (`RightSidebar.tsx:444-446`), so nothing crashes and nothing goes unstyled.
- **D2 — Nudge scope is the right panel only.** Only `RightSidebar.handleUseDesign` gets the
  AC6 nudge. `CenterCanvas.handleTemplateLoad` (the AI-chat variation path) is untouched — it
  is a different surface and a file US-AI-036 owns.
- **D5 — Add an explicit "None Selected" tile (added 2026-08-05, post-implementation).**
  Raised by the story owner reviewing the first pass. D1 made "no brand" the *opening* state but
  left the grid a one-way door: once any palette was clicked there was no way back, so an agent
  who wanted the model to pick its own colours was stuck with whatever they last touched. The
  indicator could report the empty state but nothing could restore it. Covered by AC8.
- **D6 — Clearing a brand restores the canvas background (added 2026-08-05, reverses the earlier
  D5 position).** The first pass deliberately left the canvas alone on clear, reasoning that
  repainting it would destroy work. Testing on a real canvas showed that reasoning was wrong for
  the background specifically: applying a palette is the *only* thing that writes it, so leaving
  it behind strands the cleared brand's colour on screen — the panel says "no brand" while the
  canvas is still visibly branded. The background is now captured on the no-brand → brand
  transition and restored on clear. Element colours keep the D5 treatment (left alone), because
  those genuinely can be hand-edited after a palette is applied and blanket-reverting them
  would lose work.
- **D7 — D1 intentionally reaches the AI-chat generation path too (confirmed by the story owner,
  2026-08-05).** `AIChatBox.tsx:762-769` builds its `brandColors` from the same
  `selectedThemeColors` store value the right panel writes, with the identical
  palette → `agentInfo.brandColors` → `undefined` precedence. Removing the mount auto-select
  therefore means chat-driven generations also carry no brand colours until the agent picks a
  palette. This is the intended behaviour, not an unnoticed side effect: the rule is "never send
  a brand the agent did not choose", and it should not depend on which surface they generate
  from. Note this is the chat **generation** path — the chat *load-to-canvas* path
  (`CenterCanvas.handleTemplateLoad`) remains out of scope per D2.

---

## AC numbering note

ACs were renumbered during harden to close a gap and add required type coverage.
Pre-harden → post-harden mapping:

| Pre-harden | Post-harden | Change |
|---|---|---|
| AC1 | AC1 + AC2 | Split: populated state vs. empty state (empty state was untestable before D1) |
| AC2 | AC3 | Now reachable end-to-end thanks to D1 |
| AC3 | — | Retired at authoring time; delivered by US-AI-002a |
| — | AC4 | **New** — required `error-path` coverage |
| AC4 | AC5 | Unchanged in substance |
| AC5 | AC6 | Unchanged in substance |
| AC6 | AC7 | Unchanged in substance |

---

## Acceptance Criteria

- [x] **AC1 [happy-path]:** When a brand palette is selected in the Design tab, a brand indicator
      rendered directly beneath the Generate button in `client/src/components/editor/RightSidebar.tsx`
      shows the palette name and up to 5 colour dot swatches (e.g. "Brand: Modern Blue ●●●●●").
      Switching palettes updates the indicator in the same render — no reload, no tab change.

- [x] **AC2 [null-input]:** When no palette is selected (the state on first load after D1),
      the indicator in `RightSidebar.tsx` reads "Brand: None — select in Design tab" in muted
      text with no swatches, and clicking it calls `setActiveTab("design")`.

- [x] **AC3 [null-input]:** When `selectedThemeColors` is null/empty AND `agent.brandColors` is
      empty, `handleGenerate()` in `RightSidebar.tsx` sends `agent.brandColors: undefined`, and
      the prompt produced by `buildImagePrompt()` in
      `api/src/modules/ai-generation/services/infographic-prompt.builder.ts` contains no
      `- Color scheme:` line. No hardcoded hex fallback is introduced at any layer.

- [x] **AC4 [error-path]:** When a custom palette loaded from the `custom-brand-palettes`
      localStorage key is malformed — `colors` absent, `null`, or `[]` — the brand indicator
      renders the "None" state rather than throwing, and `handleGenerate()` still sends
      `brandColors: undefined`. The right panel does not unmount or white-screen.

- [x] **AC5 [happy-path]:** The Quick Styles section description in `RightSidebar.tsx` reads
      "Add styled text to your canvas after loading a generated design." — replacing the current
      "Quickly add pre-styled text elements to your canvas. Colors are automatically applied from
      the selected theme above."

- [x] **AC6 [happy-path]:** After `handleUseDesign()` in `RightSidebar.tsx` successfully loads a
      variation to canvas, the success toast's description directs the agent to the next step:
      "Add text overlays with Quick Styles in the Design tab."

- [x] **AC7 [edge-case]:** No UI string, comment, or `data-testid` added by this story mentions
      Ideogram, Gemini, Nano Banana, GPT-4o, OpenAI, or any other underlying model or provider.
      Model opacity rule applies.

- [x] **AC8 [happy-path]:** The Brand Styles grid in `RightSidebar.tsx` shows a "None Selected"
      card as its **first** tile, before "Luxury Gold". Clicking it clears `selectedTheme` and
      `selectedThemeColors`, so the indicator returns to the AC2 empty state and the next
      generation carries no brand colours. The card renders as selected whenever no palette is
      active — including on first load. Clearing also restores the canvas background captured
      before the first palette was applied (see D6); element colours are left alone.

- [x] **AC9 [error-path]:** `pickCanvasBackground()` in `client/src/lib/brandPalette.ts` derives
      the canvas background from the palette's **lightest** swatch by WCAG relative luminance,
      not from `colors[colors.length - 1]`. All six built-in palettes yield `#FFFFFF` — including
      Luxury Gold, whose array ends in `#8B7355`. An all-dark custom palette keeps its own
      lightest colour rather than being forced to white; a palette with no parseable colour falls
      back to `DEFAULT_CANVAS_BACKGROUND`.

**Coverage:** `happy-path` ✅ (AC1, AC5, AC6) · `error-path` ✅ (AC4) · plus `null-input` (AC2, AC3)
and `edge-case` (AC7). Required set for domain `PANEL` = `[happy-path, error-path]` — complete.

---

## Depends On

- **US-AI-002a** (Phase 0.5) — ✅ Done. Hex→colour-name mapping and the no-fallback rule are
  live in `infographic-prompt.builder.ts` and unit-tested. AC3 verifies the end-to-end behaviour
  from the UI; it does not re-implement the mapping.

## Out of Scope

- Colour-name mapping logic itself (done in Phase 0.5 — US-AI-002a)
- Deleting the dead `client/src/lib/colorNames.ts` (R5) — flagged for a separate cleanup; removing
  it is not required by any AC here
- Saving the chosen palette per-user to the database (localStorage is acceptable for Phase 1)
- Brand colour picker inside `AgentInfoForm` (deferred to agent profile, Phase 2)
- The AI-chat "Use This Design" **load-to-canvas** path — `CenterCanvas.handleTemplateLoad` (D2).
  The AI-chat **generation** path is deliberately in scope for D1's effect — see D7.
- Quick Styles generating AI text — Phase 2
- Canvas template data substitution using Quick Styles (GAP-02, Phase 2)
- Integrating Quick Styles output as reference input for image generation — Phase 3

---

## Design Behavior

### Active Brand Indicator (AC1 / AC2)

Rendered inside the sticky top block, directly under the Generate button and its sub-label,
above the results-ready pill and the tab switcher:

```
┌─────────────────────────────────────┐
│  [✦ Quick Generate]                 │  ← existing button
│  From your Property & Agent details │  ← existing sub-label
│  Brand: Modern Blue ●●●●●           │  ← NEW (AC1)
├─────────────────────────────────────┤
│  [Design] [Property] [Agent]        │  ← existing tab switcher
└─────────────────────────────────────┘
```

Empty state (AC2) — muted, clickable, switches to the Design tab:
```
│  Brand: None — select in Design tab │
```

The indicator is hidden while `generating` is true, so it never competes with the progress bar.

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|----------|----------|--------|---------|
| TC-PANEL-01-01 | E2E | P0 | happy-path (AC1): select "Modern Blue" → indicator reads "Modern Blue" with 5 dots | ✅ | |
| TC-PANEL-01-02 | E2E | P0 | null-input (AC2): fresh editor, no palette → indicator reads "None — select in Design tab" | ✅ | |
| TC-PANEL-01-03 | E2E | P1 | null-input (AC2): click the "None" indicator → Design tab becomes active | ✅ | |
| TC-PANEL-01-04 | E2E | P1 | happy-path (AC1): switch Modern Blue → Natural Green → indicator text updates without reload | ✅ | |
| TC-PANEL-01-05 | Unit | P0 | null-input (AC3): `buildImagePrompt` with `brandColors: []` emits no `- Color scheme:` line | ✅ | |
| TC-PANEL-01-06 | Unit | P0 | happy-path (AC3): `buildImagePrompt` with a real palette emits colour *names*, never raw hex | ✅ | |
| TC-PANEL-01-07 | Unit | P0 | error-path (AC4): `resolveActivePalette` returns null for `{colors: null}`, `{colors: []}`, and a missing `colors` key | ✅ | |
| TC-PANEL-01-08 | E2E | P1 | error-path (AC4): seed malformed localStorage palette → panel renders, indicator shows "None", no console error | ⚠️ | See F1 — the guard had to move to the load boundary |
| TC-PANEL-01-09 | E2E | P1 | happy-path (AC5): Quick Styles description reads "after loading a generated design" | ✅ | |
| TC-PANEL-01-10 | Manual | P1 | happy-path (AC6): "Use This Design" → toast mentions Quick Styles in the Design tab | ⚠️ | See F2 — inspection only. Deferred to **Phase 0 HUMAN Task 3, row P-27** |
| TC-PANEL-01-11 | Manual | P1 | edge-case (AC7): grep the diff for model/provider names → zero hits in user-visible strings | ✅ | |
| TC-PANEL-01-12 | E2E | P0 | happy-path (AC8): "None Selected" is first, starts selected, and clicking it after applying Modern Blue returns the indicator to the empty state | ✅ | |
| TC-PANEL-01-13 | E2E + Unit | P0 | error-path (AC9): Luxury Gold paints the canvas white (not `#8B7355`), and clearing the brand restores the pre-brand background | ✅ | See F3 |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

### Findings

**F1 (TC-PANEL-01-08) — the AC4 guard was in the wrong place.** The plan guarded only the
*selected* palette. Writing this test exposed that the palette **grid** indexes
`palette.colors[0]` / `[1]` / `[length - 1]` directly when rendering theme cards, so a stored
entry with `colors: null` throws during render and takes the entire right panel down — before
any selection guard executes. Fixed by filtering unusable entries inside `loadCustomPalettes()`,
at the localStorage boundary, so they never reach state at all; the selection guard remains as
defence in depth. The test now asserts corrupt palettes are not offered as cards, which is also
better than rendering a card that errors when clicked.

**F3 (TC-PANEL-01-13) — two defects found by the story owner on a real canvas, both pre-existing
in spirit but surfaced by this story.** Reported with a screenshot showing a brown canvas after
selecting Luxury Gold, still brown after clicking "None Selected".

1. *Background derivation.* `applyBrandPalette` used `colors[colors.length - 1]` with the comment
   "usually the lightest color". Five of six built-ins do end in `#FFFFFF`; Luxury Gold ends in
   `#8B7355` (warm brown). So one palette painted the canvas mud and the other five looked fine —
   the classic shape of a bug that survives review. Ordering is not a contract that can be
   enforced on user-created custom palettes at all, so the background is now derived by
   luminance. This predates US-PANEL-01; the story simply made it visible.
2. *Clearing stranded the background.* The D5 decision not to touch the canvas on clear was
   wrong for the background — see D6.

Both are now pinned: 6 unit tests over the real built-in palette arrays (so a future palette
edit that reintroduces a dark trailing swatch fails immediately) plus an E2E asserting the
computed `background-color` of `[data-canvas-container]` round-trips.

### Deferred verification — Phase 0 HUMAN Task 3

Two checks cannot be honestly closed from a local session. Both are parked as rows in
[PHASE_0_HUMAN_QA_CHECKLIST.md § 3D](../../../../../testing/PHASE_0_HUMAN_QA_CHECKLIST.md#3d-production-smoke-test)
so they are tracked against go-live rather than lost at story close:

| Row | Check | Why deferred |
|-----|-------|--------------|
| P-25 | Editor opens with no brand selected; "None Selected" is the first tile | Cheap prod confirmation that D1 shipped |
| P-26 | Luxury Gold → white canvas (not `#8B7355`); clearing restores the background | Cheap prod confirmation of the AC9 fix |
| P-27 | TC-PANEL-01-10 — "Use This Design" toast copy | Needs a real generation to reach `handleUseDesign`; rides on P-16 at zero extra cost |
| P-28 | Full local E2E suite green before the go-live deploy | Regression sweep for D1's reach (see D7) — not re-run in this session |

**F2 (TC-PANEL-01-10) — not exercised at runtime.** `handleUseDesign` is only reachable after a
real generation, which spends a metered credit against the account. The change is a one-line
toast `description`; it was verified by inspection at `RightSidebar.tsx` `handleUseDesign()` and
by the fact that the surrounding `toast.success("Design loaded", …)` call is unchanged and
already proven in production. Worth confirming during the next organic generation rather than
burning a credit for a string.

### Verification evidence

```
npm run check                                    → clean (tsc, no errors)
cd api && npx vitest run --config vitest.config.ts
                                                 → 16 files, 164 tests passed
BROWSER=none npx vite --port 5200 --strictPort   # frontend only; /api proxies to :3001
PLAYWRIGHT_BASE_URL=http://localhost:5200 \
  npx playwright test e2e/us-panel-01-brand-indicator.spec.ts --project=chrome-headed
                                                 → 8 passed (50.8s)  [incl. AC8, AC9]
```

> **Runtime-verification notes — two ways the E2E environment lied.**
>
> 1. The first run failed all 6 tests against a dev server that had been up ~44 hours serving a
>    stale July build. The screenshot showed Luxury Gold still auto-selected and no indicator —
>    indistinguishable from a genuinely broken feature. `playwright.config.ts` sets
>    `reuseExistingServer: true`, so a long-lived stale server silently invalidates every result.
> 2. Running a second full stack on `PORT=5100 API_PORT=3101` does **not** isolate it:
>    `server/index.ts:79` hardcodes `API_PORT: '3001'` when spawning the Nest child, so the child
>    crash-loops on `EADDRINUSE` every 3s against the already-running stack. The resulting CPU
>    churn pushed page loads past the 20s timeout and produced two *intermittent* failures in
>    otherwise-passing tests — the most misleading failure mode of the three.
>
> The reliable local recipe for a frontend-only story is standalone Vite (above): it serves fresh
> client code and proxies `/api` to whatever NestJS is already running, spawning nothing.

---

## Technical Notes

### Palette resolution helper (AC1 / AC2 / AC4)

The "is a palette actually usable" check is needed in three places (indicator render,
`handleGenerate`, and the Quick Styles colour mapping), so it is extracted rather than inlined:

```typescript
// RightSidebar.tsx — module scope, pure, unit-testable
export function resolveActivePalette(p: BrandPalette | null): BrandPalette | null {
  if (!p || !Array.isArray(p.colors) || p.colors.length === 0) return null;
  return p;
}
```

This single guard satisfies AC4 for every consumer: a malformed palette is indistinguishable
from "no palette", which is exactly the desired degradation.

### Removing the mount auto-select (D1)

`RightSidebar.tsx:305-314` — the `useEffect` keeps loading custom palettes but stops calling
`setSelectedTheme` / `setSelectedThemeColors`:

```typescript
// Before: force-selects defaultBrandPalettes[0] on every mount
// After:  loads custom palettes only; selectedTheme stays null until the agent picks one
```

`getColorForStyle(null, …)` already handles the null theme (`RightSidebar.tsx:444-446`), so
Quick Styles keep sensible neutral colours with no palette selected.

### Server-side verification (AC3)

No server change required — `derivePromptParts` already emits `colors: ''` for an empty
`brandColors` array and `buildImagePrompt` already gates the line on `if (p.colors)`. AC3 adds
tests that pin this contract so a future refactor cannot silently reintroduce a fallback.

---

## Effort Estimate

| Task | Hours |
|------|-------|
| T1 — `resolveActivePalette` helper + remove mount auto-select | 0.75h |
| T2 — `BrandIndicator` render block (populated + empty + click-to-Design-tab) | 1.25h |
| T3 — Quick Styles help text | 0.25h |
| T4 — Post-generation nudge in `handleUseDesign` | 0.25h |
| T5 — Unit tests (TC-05/06/07) | 0.75h |
| T6 — Playwright spec (TC-01/02/03/04/08/09) | 1.25h |
| T7 — Manual QA (TC-10/11) + Gate 1 | 0.5h |
| **Total** | **~5h** |

---

*Story created: 2026-06-16 · Hardened: 2026-08-05*
