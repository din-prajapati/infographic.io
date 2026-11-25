# Story Card — US-EDIT-038

> **Status:** In Progress - implemented and verified locally; merge pending
> **Feature:** N/A — V3 annotated editing refinements
> **Epic:** [EPIC-EDIT-04](../../EPIC.md)
> **Milestone:** [M-EDIT-11-v3-editor-slice](../../milestones/M-EDIT-11-v3-editor-slice.md)
> **Linear:** Unassigned
> **Size:** M
> **Created:** 2026-11-05 | **Closed:** —
> **Prerequisites:** Existing locally verified US-EDIT-031–037 runtime on the existing milestone branch; no completed feature rebuild.

---

## Story

*As a* solo real estate agent refining a saved listing design
*I want* clear Effects, opacity, text-anchor and image-Fit controls
*So that* the selected formatting visibly matches my intent and I can verify the result on canvas.

---

## Acceptance Criteria

- [x] **AC1 [happy-path]:** When a solo agent uses the annotated shape Effects, paint-opacity, text-anchor and image-Fit controls, `V3Editor.tsx`, `V3PaintPicker.tsx`, `TextElement.tsx` and `ImageElement.tsx` satisfy every observable requirement in the Annotation Contract below, including reference-style Effects sidebar cards, readable editable percent suffix, distinct anchor positions in a taller text box and distinct Cover/Contain/Stretch rendering for mismatched aspect ratios; committed values survive Undo/Redo, save/reload and PNG export.
- [x] **AC2 [error-path]:** When a preview is cancelled, a target becomes hidden/locked/deselected, or an opacity entry is empty, nonnumeric or outside 0–100, the annotation controls in `V3ElementToolbar.tsx`, `V3EffectsPanel.tsx` and `V3PaintPicker.tsx` preserve the prior canonical element/history, clear transient artwork and cannot apply an obsolete target edit; all four controls remain keyboard accessible and usable in both approved themes at 1242×668 and 1440px desktop widths.

### Annotation Contract

1. **Effects sidebar:** Selecting Effects for one visible unlocked shape opens an Effects sidebar in the existing sidebar location; the current shadow-only toolbar popover is removed. Show a close button, a None tile and a compact three-column visual-card grid using the supplied Canva reference's thumbnail-over-label arrangement, adapted to existing Navy/Teal tokens. The seven functional presets are Drop, Glow, Echo, Glitch, and an Advanced group containing Radioactive, Retro and Midnight. Drop is a displaced blurred shadow; Glow is centered and blurred; Echo has two successive displaced copies; Glitch has a cyan left copy and pink right copy; Radioactive has a green glow; Retro has a warm hard displaced outline/copy; Midnight has a blue/violet dark glow. All preserve the original fill. Use existing shape.shadow for the primary treatment and optional shape.shadowLayers:ElementShadow[] for additional copies; legacy documents without layers retain their current rendering. Selecting a preset applies its visible result with one Undo entry; None removes primary and additional shadows. Keep existing custom color, opacity, blur and x/y offset editing available within the sidebar, including the shared No Color behavior. The selected card has an observable active state. Closing restores the preceding sidebar; switching selection or entering Preview clears an uncommitted effect preview. Show no nonfunctional or unnamed reference cards.
2. **Opacity value:** Keep an editable numeric percentage beside the hex value. Place the percent sign in a fixed suffix area outside the input's editable text; reserve enough input width for 100 with no collision, clipping, spinner overlap or focus-ring overlap with the suffix. Values 0, 50 and 100 visibly update alpha and remain readable at both desktop widths/themes. Slider and number stay synchronized. An unchanged value adds no Undo entry; invalid committed values restore the last valid value. Escape cancels the preview without a blur-induced commit.
3. **Text anchor:** Top, Middle and Bottom use the existing textAnchor start/middle/end model. For a fixed 200px-high box containing two lines whose combined rendered height is below 100px, choosing the three modes visibly places the content at the top, centered vertically and bottom, respectively, without moving/resizing the box or rewriting text. The spacing popover shows the selected icon state and contextual help explaining that increasing text-box height reveals vertical alignment. DOM display and exported PNG agree within normal font rasterization tolerance. A box containing no spare vertical space may show no displacement; its selected anchor must still persist. Inline text editing must retain the selected anchor on exit.
4. **Image Fit:** Cover, Contain and Stretch use the existing objectFit cover/contain/fill values. For a 2:1 source in a square frame, Cover fills the frame and clips source sides; Contain shows the entire source centered with empty space above/below; Stretch fills both frame dimensions and distorts the source. Selecting a Fit mode does not change frame x/y/width/height. In the V3 route, side resize handles permit changing the frame aspect ratio so these differences can be revealed, while corner resizing preserves the frame aspect ratio and the legacy editor retains its existing ratio-lock behavior. The active tile reflects the committed fit; ordinary images and existing AI-background-backed images use the same fit semantics, preserving overlays, filters, borders, flips and corners. Include help explaining that modes may look identical when image and frame aspect ratios match.
5. **Lifecycle and preservation:** Each completed user action produces at most one Undo step; pointer/keyboard previews do not create saves/history. Cancel/stale-target handling restores canonical state. Existing save/reload serialization and PNG export retain supported values; legacy documents without new fields retain prior defaults. Preserve approved shell, existing color panel behavior and completed editor capabilities. This is desktop-only as the existing opt-in V3 slice; no mobile shell or new network endpoint is added.

---

## Out of Scope

- Does not implement unnamed advanced reference effects, shape fill replacement, Crop, image recoloring or paid AI.
- Does not change the Navy/Teal shell, legacy default route, plan limits, authentication, backend or database schema.
- Does not add mobile editor layout, new export formats or unrelated optimizations.
- Does not commit, push, merge or deploy without explicit user permission.

---

## Engineering / PR

- **Branch:** `feat/edit/m-11-v3-editor-slice`
- **PR:** #_____ (fill when opened)
- **Primary files touched:**
- `client/src/components/editor/v3/V3Editor.tsx`
- `client/src/components/editor/v3/V3Panels.tsx`
- `client/src/components/editor/v3/V3ElementToolbar.tsx`
- `client/src/components/editor/v3/V3EffectsPanel.tsx`
- `client/src/components/editor/v3/v3-effects-panel.css`
- `client/src/components/editor/v3/V3PaintPicker.tsx`
- `client/src/components/editor/v3/v3-color-panel.css`
- `client/src/styles/v3-element-toolbar.css`
- `client/src/components/canvas/TextElement.tsx`
- `client/src/components/canvas/ImageElement.tsx`
- `client/src/lib/textLayout.ts`
- `client/src/lib/canvasState.ts`
- `client/src/lib/canvasExport.ts`
- `client/src/lib/canvasTypes.ts`
- `client/src/lib/elementStyles.ts`
- `client/src/lib/v3ElementEditing.ts`
- `client/src/hooks/useV3ElementPreview.ts`
- `client/src/components/editor/v3/__tests__/V3EffectsPanel.spec.tsx`
- `client/src/components/editor/v3/__tests__/V3PaintPicker.spec.tsx`
- `client/src/components/editor/v3/__tests__/V3ElementToolbar.spec.tsx`
- `client/src/components/editor/v3/__tests__/V3Panels.spec.tsx`
- `client/src/components/canvas/__tests__/TextElement.spec.tsx`
- `client/src/components/canvas/__tests__/ImageElement.spec.tsx`
- `client/src/lib/__tests__/textLayout.spec.ts`
- `client/src/lib/__tests__/elementStyles.spec.ts`
- `client/src/lib/__tests__/canvasExport.spec.ts`
- `client/src/lib/__tests__/canvasState.safeGeometry.spec.ts`
- `client/src/lib/__tests__/v3ElementEditing.spec.ts`
- `client/src/hooks/__tests__/useV3ElementPreview.spec.ts`
- `e2e/v3-annotations.spec.ts`
- `e2e/v3-slice.config.ts`
- `Mockups/approved-v3-editor/ANNOTATION_VERIFICATION.md`
- `Mockups/approved-v3-editor/evidence/annotations-effects-light.png`
- `Mockups/approved-v3-editor/evidence/annotations-effects-dark.png`
- `Mockups/approved-v3-editor/evidence/annotations-opacity-dark.png`
- `Mockups/approved-v3-editor/evidence/annotation-text-anchor.png`
- `Mockups/approved-v3-editor/evidence/annotations-fit-dark.png`
- `client/src/lib/shapeEffects.ts`
- `client/src/lib/__tests__/shapeEffects.spec.ts`
- `client/src/hooks/useV3EffectsPanel.ts`
- `client/src/hooks/__tests__/useV3EffectsPanel.spec.ts`
- `client/src/components/canvas/ShapeElement.tsx`
- `client/src/components/canvas/__tests__/ShapeElement.spec.tsx`
- `client/src/components/editor/v3/V3Canvas.tsx`
- `client/src/lib/v3DesignSession.ts`
- `client/src/lib/__tests__/v3DesignSession.spec.ts`
- `client/src/hooks/useV3DesignSession.ts`
- `client/src/lib/paint.ts`
- `client/src/lib/__tests__/paint.spec.ts`

New paths above are intentionally scoped additions; existing peer edits must be preserved. Root coordinates shared toolbar/editor changes with independently owned renderer and picker work.

---

## AI Implementation Prompt

> Paste this block into Codex to implement the story.

```text
Context: InfographicAI SaaS — React18/Vite/Wouter/Zustand; NestJS11 API3001 through Express5000; Prisma6. Read AGENTS.md and PROJECT_CONTEXT.yaml.
Story: US-EDIT-038 — Annotated Effects, opacity, text-anchor and image-Fit refinements
As a solo real estate agent refining a saved listing design, I want clear Effects, opacity, text-anchor and image-Fit controls so that the selected formatting visibly matches my intent and I can verify the result on canvas.

Acceptance Criteria:
AC1: When a solo agent uses the annotated shape Effects, paint-opacity, text-anchor and image-Fit controls, `V3Editor.tsx`, `V3PaintPicker.tsx`, `TextElement.tsx` and `ImageElement.tsx` satisfy every observable requirement in the Annotation Contract below, including reference-style Effects sidebar cards, readable editable percent suffix, distinct anchor positions in a taller text box and distinct Cover/Contain/Stretch rendering for mismatched aspect ratios; committed values survive Undo/Redo, save/reload and PNG export.
AC2: When a preview is cancelled, a target becomes hidden/locked/deselected, or an opacity entry is empty, nonnumeric or outside 0–100, the annotation controls in `V3ElementToolbar.tsx`, `V3EffectsPanel.tsx` and `V3PaintPicker.tsx` preserve the prior canonical element/history, clear transient artwork and cannot apply an obsolete target edit; all four controls remain keyboard accessible and usable in both approved themes at 1242×668 and 1440px desktop widths.
Read and satisfy every numbered clause of this card's Annotation Contract.

Out of Scope:
Unnamed advanced reference effects, shape fill replacement, Crop, image recoloring, paid AI, shell/default route/auth/plan/backend/schema changes, mobile shell, new export formats or unrelated optimization.

Primary files to touch (do NOT touch other files):
client/src/components/editor/v3/V3Editor.tsx
client/src/components/editor/v3/V3Panels.tsx
client/src/components/editor/v3/V3ElementToolbar.tsx
client/src/components/editor/v3/V3EffectsPanel.tsx
client/src/components/editor/v3/v3-effects-panel.css
client/src/components/editor/v3/V3PaintPicker.tsx
client/src/components/editor/v3/v3-color-panel.css
client/src/styles/v3-element-toolbar.css
client/src/components/canvas/TextElement.tsx
client/src/components/canvas/ImageElement.tsx
client/src/lib/textLayout.ts
client/src/lib/canvasState.ts
client/src/lib/canvasExport.ts
client/src/lib/canvasTypes.ts
client/src/lib/elementStyles.ts
client/src/lib/v3ElementEditing.ts
client/src/hooks/useV3ElementPreview.ts
client/src/components/editor/v3/__tests__/V3EffectsPanel.spec.tsx
client/src/components/editor/v3/__tests__/V3PaintPicker.spec.tsx
client/src/components/editor/v3/__tests__/V3ElementToolbar.spec.tsx
client/src/components/editor/v3/__tests__/V3Panels.spec.tsx
client/src/components/canvas/__tests__/TextElement.spec.tsx
client/src/components/canvas/__tests__/ImageElement.spec.tsx
client/src/lib/__tests__/textLayout.spec.ts
client/src/lib/__tests__/elementStyles.spec.ts
client/src/lib/__tests__/canvasExport.spec.ts
client/src/lib/__tests__/canvasState.safeGeometry.spec.ts
client/src/lib/__tests__/v3ElementEditing.spec.ts
client/src/hooks/__tests__/useV3ElementPreview.spec.ts
e2e/v3-annotations.spec.ts
e2e/v3-slice.config.ts
Mockups/approved-v3-editor/ANNOTATION_VERIFICATION.md
Mockups/approved-v3-editor/evidence/annotations-effects-light.png
Mockups/approved-v3-editor/evidence/annotations-effects-dark.png
Mockups/approved-v3-editor/evidence/annotations-opacity-dark.png
Mockups/approved-v3-editor/evidence/annotation-text-anchor.png
Mockups/approved-v3-editor/evidence/annotations-fit-dark.png
client/src/lib/shapeEffects.ts
client/src/lib/__tests__/shapeEffects.spec.ts
client/src/hooks/useV3EffectsPanel.ts
client/src/hooks/__tests__/useV3EffectsPanel.spec.ts
client/src/components/canvas/ShapeElement.tsx
client/src/components/canvas/__tests__/ShapeElement.spec.tsx
client/src/components/editor/v3/V3Canvas.tsx
client/src/lib/v3DesignSession.ts
client/src/lib/__tests__/v3DesignSession.spec.ts
client/src/hooks/useV3DesignSession.ts
client/src/lib/paint.ts
client/src/lib/__tests__/paint.spec.ts

Rules:
- Touch ONLY listed paths plus this card/TASKS/scaffold and official locks/replay governance.
- Do NOT implement Out of Scope. Preserve all existing uncommitted work and unrelated docs/reviews.
- Use existing worktree .codex-worktrees/v3-slice and branch feat/edit/m-11-v3-editor-slice.
- Obtain official harden lock and write acceptance-derived failing tests before runtime changes.
- Coordinate shared files with root; do not revert peer edits.
- Run npm run check, npm run test:unit and the scoped V3 browser gates.
- Record changed files, ACs and actual test output; distinguish isolated mocked tests from authenticated server checks.
- Do not mark Done before approved milestone PR merge; no commit/push/merge/deploy without permission.
```

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|----------|----------|--------|---------|
| TC-EDIT-038-01 | Unit | P0 | happy-path: When a solo agent uses the annotated shape Effects, paint… | ✅ | 1445 unit tests and 98 browser cases pass; ANNOTATION_VERIFICATION.md |
| TC-EDIT-038-02 | Unit | P0 | error-path: When a preview is cancelled, a target becomes hidden/lock… | ✅ | 1445 unit tests and 98 browser cases pass; ANNOTATION_VERIFICATION.md |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

---

## Definition of Done

- [x] All ACs checked ✅
- [x] All test cases run and recorded above
- [x] `npm run check` passes (0 new TypeScript errors)
- [x] `npm run test:unit` passes (no regressions)
- [x] Scoped V3 browser and themed desktop visual gates pass
- [x] Manual flow verified on localhost:5000 or documented equivalent isolated port
- [ ] PR merged (PR #_____)
- [ ] No console errors in changed flow
- [x] [TASKS.md](./TASKS.md) fully checked ✅
- [ ] STORY.md status updated to ✅ Done


## Existing color and regression integration seams

- `client/src/hooks/useV3ColorPanel.ts`
- `client/src/hooks/__tests__/useV3ColorPanel.spec.ts`
- `e2e/v3-element-toolbars.spec.ts`
- `e2e/v3-color-paints.spec.ts`

Root-owned: No Color clears all effect shadows; existing browser journeys enter the new Drop card instead of the removed Shadow popover. Existing assertions stay intact.

## Local implementation evidence - 2026-11-05

Gate 1 passed: frontend/API type checks, 811 backend and 634 client unit tests (1,445 total; one pre-existing client skip). Gates 2/3 passed: light/dark desktop inspection and 98 complete isolated browser cases, including actual text positions, side/corner image gestures, fit/effect PNG pixels, save/reload and existing editor regressions. [Verification and limits](../../../../../../../Mockups/approved-v3-editor/ANNOTATION_VERIFICATION.md). Gate 4 is not triggered by frontend-only work. No new authenticated database persistence smoke or production build is claimed. PR merge, broad manual console certification and formal Done remain unchecked. No commit/push/merge/deployment.
