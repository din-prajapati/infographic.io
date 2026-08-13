# PR Task List — US-AI-043

> **Story:** [STORY.md](./STORY.md)
> **Branch:** `feat/ai/us-ai-043-layout-engine` *(based on `feat/deploy/us-deploy-007-client-test-infra`)*
> **PR:** #_____ (fill when opened)
> **Type:** feat
> **Estimated total:** ~3h 30m

---

## Four Pillars Pre-flight

- [ ] **Brain** — [STORY.md](./STORY.md) read: 8 typed ACs, "Explicitly not in this story" understood
- [ ] **Muscle** — file list + ordered tasks + test commands below
- [ ] **Map** — [ARCHITECTURE.mmd](../../ARCHITECTURE.mmd) reviewed (updated in T5)
- [ ] **Env** — none needed. This story makes **no network calls** and requires no API keys.

> **Read the spike first.** [`spike-pure-canvas-2026-08-12/FINDINGS.md`](../../../../../testing/reports/spike-pure-canvas-2026-08-12/FINDINGS.md) explains why the LLM must not place pixels. The overlapping headline/price in `04-planner-v2-constrained.png` is the exact defect AC4 exists to prevent.

---

## 🔑 Every task ships with its own test

Per the [TASKS template](../../../../templates/TASKS.md). This story is pure logic with client test infra already in place ([US-DEPLOY-007](../../../EPIC-DEPLOY-01/stories/US-DEPLOY-007/STORY.md)) — there is no excuse for an untested commit here.

---

## PR Scope Summary

```
feat(editor): add the template registry and flow layout engine — US-AI-043
```

---

## Task Breakdown

### T1 — Types and region schema
**Files:** `client/src/lib/layout/types.ts` *(new)* · `client/src/lib/layout/__tests__/templates.spec.ts` *(new)*
**AC(s):** AC1, AC8
**Estimate:** 30m

```ts
export interface Region { x: number; y: number; w: number; h: number; }   // FRACTIONS 0..1
export interface TemplateBlock {
  region: keyof Template['regions'];
  slots: SlotId[];              // stacking order within the region
  align: 'left' | 'right' | 'center';
  gap: number;                  // px between slots, at 1440 reference height
}
export interface Template {
  id: string; name: string;
  regions: Record<string, Region>;
  blocks: TemplateBlock[];
  scrim?: { region: string; direction: 'left' | 'right' | 'bottom' };
  typeScale: Record<SlotId, { min: number; ideal: number; weight: number }>;  // px @1440
}
```

- Fractions, never pixels — this is what lets one template serve landscape, portrait and square (AC7).
- `typeScale` sizes are relative to a 1440px reference height and scale with the canvas.
- **Test in the same commit:** every template's regions lie within 0..1 and do not overlap each other.

**Commit:** `feat(editor): T1 define layout template and region types — US-AI-043`

---

### T2 — Template registry (data only)
**Files:** `client/src/lib/layout/templates.ts` *(new)* · extend `__tests__/templates.spec.ts`
**AC(s):** AC1, AC8
**Estimate:** 45m

At least three, visually distinct:

| id | Shape |
|---|---|
| `left-scrim-hero` | Vertical scrim left third; headline/price/address stacked; stats bar full-width bottom; agent bottom-right. *(This is the spike's proven composite — port it.)* |
| `bottom-band` | Full-width band across the lower third; headline + price inline; agent right; no side scrim. |
| `corner-card` | Solid card panel in one corner holding all copy; photo otherwise unobstructed. |

- Registry is a plain exported object keyed by id. **No logic in this file.**
- **Test in the same commit:** every `TemplateBlock.slots` entry is a valid `SlotId` from `slotIds.ts`; every `block.region` resolves; every template covers all 7 slots.

**Commit:** `feat(editor): T2 add the initial template registry — US-AI-043`

---

### T3 — Flow engine
**Files:** `client/src/lib/layout/layoutEngine.ts` *(new)* · `client/src/lib/layout/__tests__/layoutEngine.spec.ts` *(new)*
**AC(s):** AC2, AC3, AC4, AC6
**Estimate:** 70m

```ts
export function layoutDesign(input: {
  templateId: string;
  values: Partial<Record<SlotId, string>>;
  canvas: { width: number; height: number };
  palette: { scrim: string; accent: string; text: string; muted: string };
  measureText: (text: string, fontSize: number, weight: number) => number;
}): ComposedTextElement[];
```

Algorithm — **flow, never fixed offsets**:
1. Resolve regions from fractions × canvas size.
2. For each block, walk its slots **in order**, skipping empty values (AC6).
3. Per slot: wrap via `wrapTextToWidth` (reuse from `canvasExport.ts` — do **not** reimplement) at the region width, measure the wrapped height, emit at the running cursor, advance cursor by height + gap.
4. Scale `typeScale` and `gap` by `canvas.height / 1440`.

> **AC4 is structural, not a post-check.** Because each block owns a disjoint region and stacks with a monotonically advancing cursor, overlap cannot occur. Do not "detect and fix" collisions — make them impossible, then assert it.

- **Test in the same commit:** TC-01, TC-02, TC-05, TC-06 with a proportional `measureText` stub.

**Commit:** `feat(editor): T3 add the flow layout engine — US-AI-043`

---

### T4 — Overflow degradation
**Files:** `layoutEngine.ts` · extend `__tests__/layoutEngine.spec.ts`
**AC(s):** AC5
**Estimate:** 40m

When a block's flowed height exceeds its region:
1. Shrink offending slots toward `typeScale.min` (never below).
2. Still overflowing → truncate the lowest-priority slot with `…`.
3. Never overflow the region, never overlap, never drop a value silently.

Emit a `degraded: 'shrunk' | 'truncated'` marker on affected elements so the UI can hint.

- **Test in the same commit:** TC-04 — assert bounds are respected and that a truncated string still ends in `…`.

**Commit:** `feat(editor): T4 degrade gracefully when text exceeds its region — US-AI-043`

---

### T5 — Fixture matrix + docs
**Files:** `__tests__/layoutEngine.spec.ts` · `ARCHITECTURE.mmd`
**AC(s):** AC7, AC8
**Estimate:** 45m

- Matrix: **every template × {long, typical, empty} × {2560×1440, 1440×2560, 2048×2048}**. Assert for each: no overlap, every supplied value present exactly once, all elements within canvas bounds. Drive it with a `describe.each` — do not hand-write 27 cases.
- Also assert TC-08: output is shape-compatible with `loadComposedDesignToCanvas`.
- `ARCHITECTURE.mmd`: replace the Remix→Layerize flow with background → planner(intent) → **flow renderer** → canvas. Note that OQ-2 disproved the previous mechanism.
- Document the "adding a template is a data change" contract (AC8).

**Commit:** `test(editor): T5 sweep the template matrix and update the architecture — US-AI-043`

---

## File-to-Task Mapping

| File | Task(s) | AC(s) | Test coverage |
|------|---------|-------|---------------|
| `layout/types.ts` | T1 | AC1, AC8 | ✅ `templates.spec.ts` (same commit) |
| `layout/templates.ts` | T2 | AC1, AC8 | ✅ `templates.spec.ts` (same commit) |
| `layout/layoutEngine.ts` | T3, T4 | AC2–AC6 | ✅ `layoutEngine.spec.ts` (same commit) |
| `layout/__tests__/*` | T1–T5 | all | are the tests |
| `ARCHITECTURE.mmd` | T5 | AC8 | n/a — docs |

---

## Exact Test Commands

```bash
npm run check
npm run test:unit                                   # backend 254 + client
cd client && npx vitest run src/lib/layout --reporter=verbose
```

> Backend must remain at **254**. This story touches no backend file — if that number moves, something is wrong.

---

## Task Checklist

- [x] T1 — types + region validation test
- [x] T2 — ≥3 templates + registry validation test
- [x] T3 — flow engine + TC-01/02/05/06
- [x] T4 — overflow degradation + TC-04
- [x] T5 — full matrix TC-03/07/08 + ARCHITECTURE.mmd
- [x] `npm run check` passes ✅
- [x] `npm run test:unit` passes, backend still 254 ✅
- [x] STORY.md ACs updated — only what was verified ✅

---

## Test Is Truth

> Do not weaken a failing test to make it pass. **Do not write mirror-tests** — import the real functions; the engine is pure, so there is no reason to copy anything. If an AC could not be verified, leave it unticked and say why.

---

## Anti-Patterns to Avoid in This Story

- Do **NOT** call an LLM or any network service — the planner is a separate story
- Do **NOT** hardcode pixel coordinates in templates; regions are fractions
- Do **NOT** reimplement `wrapTextToWidth`, `TEXT_PAD_H` or `TEXT_PAD_TOP` — import them
- Do **NOT** require a real canvas context anywhere in the engine; `measureText` is injected
- Do **NOT** "detect and resolve" overlaps — make them structurally impossible
- Do **NOT** touch backend files, the remix code, or `slotIds.ts`

---

*Tasks created: 2026-08-12*
