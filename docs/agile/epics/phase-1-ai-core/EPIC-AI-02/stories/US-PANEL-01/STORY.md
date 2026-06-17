# US-PANEL-01 — Right Panel: Brand Styles → Generation + Quick Styles as Post-Generation Tool

> **Epic:** [EPIC-AI-02](../../EPIC.md)
> **Milestone:** M-AI-06-photo-and-format
> **Status:** 🔲 Not Started
> **Priority:** P1
> **Persona:** Real estate agent (daily user, SOLO/BROKERAGE plan)
> **Branch:** `feat/ai-us-panel-01-brand-generation`

---

## User Story

*As a* real estate agent using the right panel to generate infographics,  
*I want* to know which brand palette is active before I click Generate, and have that palette meaningfully affect the generated image,  
*So that* I don't waste a generation credit on an image that ignores my brand colors.

---

## Current Reality (as of Phase 0.5)

### What IS wired and working today

| Flow | Status | Evidence |
|------|--------|---------|
| Design tab palette → `selectedThemeColors` (canvas store) | ✅ | `RightSidebar.tsx` useCanvasStore |
| `selectedThemeColors` → `agent.brandColors` in `generationsApi.generate()` | ✅ | `RightSidebar.tsx` handleGenerate() |
| `dtoAgent.brandColors` → `propertyData.agent.brandColors` | ✅ | `generations.service.ts:131–136` |
| `brandColors` → Ideogram prompt text: "Brand colors: #1F448B, #FFFFFF" | ✅ | `openai.service.ts:51,61` |

### What is NOT working or misleading today

| Problem | Impact | Root cause |
|---------|--------|-----------|
| No indicator near Generate button showing which palette is active | Agent may generate without knowing their brand is/isn't applied | UX gap — no visual connection between Design tab selection and Generate button |
| Hex codes in image prompt ("Brand colors: #1F448B") poorly interpreted by image models | Brand colors inconsistently reflected in output | Image models understand descriptive color names better than hex |
| Agent brand colors from AgentInfoForm (`agent.brandColors`) are currently empty array by default | Brand defaults to hardcoded `#1F448B, #FFFFFF` if no palette selected | `useAgentStore` default has empty `brandColors: []` |
| Quick Styles (Design tab) have NO connection to AI generation | Agents may expect Quick Styles to affect generation — they don't | Quick Styles add canvas `TextElement` nodes; generation takes a text prompt only |

---

## Acceptance Criteria

- [ ] **AC1 — Active brand indicator:** A pill/badge near the Generate button shows the active palette name (e.g. "Modern Blue") when a palette is selected. Shows "No brand selected" when none is selected. Updates immediately when the agent switches palettes in the Design tab.

- [ ] **AC2 — AgentInfoForm brand color fallback:** When no Design tab palette is selected AND `agent.brandColors` is empty, the generation omits brand color hints entirely (no hardcoded fallback colors). Implemented in Phase 0.5 US-AI-002a; this AC verifies the behaviour holds end-to-end from the UI.

- [ ] **AC4 — Quick Styles help text:** The Quick Styles section in the Design tab shows a contextual note: "Add styled text to your canvas after loading a generated design." This replaces the current generic "Quickly add pre-styled text elements" description.

- [ ] **AC5 — Post-generation Design tab prompt:** After clicking "Use This Design" and loading a variation to canvas, a subtle toast or inline nudge suggests: "Add text overlays with Quick Styles in the Design tab."

- [ ] **AC6 — No model names exposed:** Color name mapping and any new UI text must not mention Ideogram, Gemini, Nano Banana, GPT-4o, or any underlying model. Model opacity rule applies.

---

## Depends On

- **US-AI-002a** (Phase 0.5) — hex→color-name mapping in `generateImagePrompt()`. Must be complete before this story, since AC2 in this story verifies the end-to-end behaviour of that fix.

## Out of Scope

- Color name mapping logic itself (done in Phase 0.5 — US-AI-002a)
- Saving chosen palette per-user to database (localStorage is acceptable for Phase 1)
- Brand color picker inside AgentInfoForm (deferred to agent profile feature, Phase 2)
- Quick Styles generating AI text (e.g. "generate a price label for me") — Phase 2
- Canvas template data substitution using Quick Styles (GAP-02, Phase 2)
- Integrating Quick Styles output as reference input for image generation — Phase 3

---

## Design Behavior

### Active Brand Indicator (AC1)

Placed between the Generate button and the tab switcher, replacing the current empty space:

```
┌─────────────────────────────────────┐
│  [✦ Generate Template]              │  ← button (existing)
│  Brand: Modern Blue ●●●●●           │  ← NEW: 5 color dot swatches + name
│  [Design] [Property] [Agent]        │  ← tab switcher
└─────────────────────────────────────┘
```

When no palette is selected:
```
│  Brand: None — select in Design tab │  ← muted text, clickable → switches to Design tab
```

### Color Name Lookup Table (AC2)

Pre-built static map (not LLM). Key entries:

| Hex range | Name |
|-----------|------|
| Dark navy (hue 220–240°, L<25%) | "deep navy blue" |
| Gold / amber (#D4AF37, #F59E0B range) | "gold" |
| Pure white (#FFFFFF, L>95%) | "white" |
| Pure black (#000000, L<5%) | "black" |
| Forest green (hue 120–150°, L 25–45%) | "forest green" |
| Warm red (hue 0–15°, S>60%) | "deep red" |
| Light cream / off-white (L 88–95%) | "warm cream" |
| Medium grey | "charcoal grey" |

If no match → use hex as-is (current behavior).

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|----------|----------|--------|---------|
| TC-PANEL-01-01 | Manual | P0 | Select "Modern Blue" palette → brand indicator shows "Modern Blue" with color dots | 🔲 | |
| TC-PANEL-01-02 | Manual | P0 | No palette selected → indicator shows "None — select in Design tab" | 🔲 | |
| TC-PANEL-01-03 | Manual | P1 | Click "None" indicator → Design tab activates automatically | 🔲 | |
| TC-PANEL-01-04 | Manual | P0 | Generate with Modern Blue selected → server log shows "deep navy blue and blue" in image prompt (not hex) | 🔲 | |
| TC-PANEL-01-05 | Manual | P1 | Generate with no palette + empty agent.brandColors → server log shows neutral default colors | 🔲 | |
| TC-PANEL-01-06 | Manual | P1 | Quick Styles section shows "after loading a generated design" note | 🔲 | |
| TC-PANEL-01-07 | Manual | P1 | Use This Design → toast or inline nudge mentions Quick Styles | 🔲 | |
| TC-PANEL-01-08 | Automated | P1 | Brand indicator updates when palette changes (Playwright: select palette → assert indicator text) | 🔲 | |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

---

## Technical Notes

### Color name mapping (AC2)

Add utility `client/src/lib/colorNames.ts`:
```typescript
export function hexToColorName(hex: string): string { ... }
export function brandColorsToDescription(colors: string[]): string {
  // returns "deep navy blue, gold, and white"
}
```

Update `openai.service.ts` `generateImagePrompt()`:
```typescript
// Before:
const colors = propertyData.agent?.brandColors?.join(', ') || '#1F448B, #FFFFFF';
// "Brand colors: #1F448B, #FFFFFF"

// After:
const colors = brandColorsToDescription(propertyData.agent?.brandColors || []);
// "Brand colors: deep navy blue and white"
```

**Note:** `colorNames.ts` is a shared utility. The mapping itself is a server-side concern (goes into the image prompt). The client only reads it for the brand indicator dots.

### Brand indicator placement (AC1)

New component `BrandIndicator` (inline in RightSidebar or separate file):
- Reads `selectedTheme` (existing state in RightSidebar)
- Renders palette name + 3–5 color dot swatches
- `onClick` → `setActiveTab('design')`

---

## Effort Estimate

| Task | Hours |
|------|-------|
| `colorNames.ts` utility + update `generateImagePrompt` in openai.service.ts | 1.5h |
| Brand indicator component in RightSidebar | 1h |
| Click-to-Design-tab link when no brand selected | 0.5h |
| Quick Styles help text update | 0.25h |
| Post-generation "add text overlays" nudge in handleUseDesign | 0.5h |
| Manual QA (8 test cases) | 1h |
| Playwright stub (TC-PANEL-01-08) | 0.5h |
| **Total** | **~5.25h** |

---

*Story created: 2026-06-16*
