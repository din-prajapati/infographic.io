# Story Card — US-AI-002a

> **Status:** 🔲 Not Started
> **Feature:** F-AI-00-02 — Correct LLM model routing
> **Epic:** [EPIC-AI-00](../../EPIC.md)
> **Milestone:** [M-AI-01-critical-fixes](../../milestones/M-AI-01-critical-fixes.md)
> **Linear:** LIN-US-AI-002a
> **Created:** 2026-06-16 | **Closed:** —
> **Depends on:** US-AI-002 (gpt-4o fix must be done first — same file)

---

## Background — The Gap

The `generateImagePrompt()` function in `openai.service.ts` injects brand colors into the Ideogram text prompt as raw hex codes:

```
Brand colors: #1F448B, #FFFFFF
```

Image generation models (Ideogram, Gemini Image, Flux) do not reliably interpret hex color codes in text prompts. They understand **descriptive color language**:

```
Brand colors: deep navy blue and white
```

This means **every generation since launch has had brand colors silently ignored**, regardless of what palette the agent selected in the Design tab. The plumbing to pass brand colors from the UI → API → prompt exists and is correct (`RightSidebar.tsx` → `generations.service.ts` → `openai.service.ts`). Only the final formatting step — hex → human-readable name — is missing.

### Evidence

```typescript
// openai.service.ts:51 — current broken state
const colors = propertyData.agent?.brandColors?.join(', ') || '#1F448B, #FFFFFF';
// Produces: "Brand colors: #1F448B, #D4AF37, #FFFFFF"
// Image model sees: unknown tokens — mostly ignored

// Desired output
// "Brand colors: deep navy blue, gold, and white"
// Image model sees: recognized color language — acted upon
```

---

## Story

*As a* real estate agent,  
*I want* my selected brand colors to actually appear in the generated infographic,  
*So that* every infographic I produce matches my brokerage's brand without post-editing.

---

## Acceptance Criteria

- [ ] **AC1:** A new utility `client/src/lib/colorNames.ts` exports `hexToColorName(hex: string): string` that maps common real estate brand hex values to descriptive English color names. Returns the hex itself as fallback for unrecognized values.

- [ ] **AC2:** A second export `brandColorsToDescription(colors: string[]): string` returns a natural-language phrase, e.g. `"deep navy blue, gold, and white"`. Handles 1–5 colors. Empty array returns `""`.

- [ ] **AC3:** `openai.service.ts:generateImagePrompt()` imports and calls `brandColorsToDescription()` to replace the raw hex join. The Ideogram prompt line changes from:
  ```
  - Brand colors: #1F448B, #D4AF37, #FFFFFF
  ```
  to:
  ```
  - Brand colors: deep navy blue, gold, and white
  ```

- [ ] **AC4:** When `brandColors` is an empty array or undefined, the prompt omits the brand colors line entirely (no fallback to hardcoded `#1F448B, #FFFFFF`). A generation without a selected palette should use no brand color hint — let the model choose freely.

- [ ] **AC5:** The color name mapping covers all 5 colors in every built-in brand palette in `RightSidebar.tsx` (`defaultBrandPalettes`). Each palette's colors must produce at least a partial name match (not all-hex fallback).

- [ ] **AC6:** `npm run check` passes. No model name, hex code, or vendor name appears in any UI label or API response.

---

## Color Name Lookup — Minimum Required Coverage

The lookup table must cover at minimum the hex values used in `defaultBrandPalettes`:

| Hex | Name |
|-----|------|
| `#1F1F1F` | charcoal black |
| `#D4AF37` | gold |
| `#FFFFFF` | white |
| `#F5F5F5` | off-white |
| `#8B7355` | warm brown |
| `#0F172A` | midnight navy |
| `#3B82F6` | bright blue |
| `#60A5FA` | sky blue |
| `#DBEAFE` | pale blue |
| `#14532D` | forest green |
| `#16A34A` | emerald green |
| `#86EFAC` | light green |
| `#F0FDF4` | mint white |
| `#1E293B` | dark slate |
| `#334155` | slate grey |
| `#94A3B8` | cool grey |
| `#E2E8F0` | light grey |
| `#7C2D12` | deep burgundy |
| `#EA580C` | burnt orange |
| `#FB923C` | warm orange |
| `#FED7AA` | peach |
| `#4C1D95` | deep purple |
| `#7C3AED` | violet |
| `#A78BFA` | lavender |
| `#EDE9FE` | pale lavender |

For hex values not in this table, use a hue-based fallback:
- Hue 0–15° or 345–360°: "warm red"
- Hue 16–45°: "orange"  
- Hue 46–65°: "yellow"
- Hue 66–150°: "green"
- Hue 151–200°: "teal"
- Hue 201–260°: "blue"
- Hue 261–300°: "purple"
- Hue 301–344°: "pink"
- Saturation < 10%: "white", "light grey", "grey", "dark grey", or "black" based on lightness

---

## Out of Scope

- LLM-based color name generation (static lookup only — faster, cheaper, deterministic)
- Saving agent's brand color preference to database (Phase 2 — Agent Profile)
- The active brand indicator UI near the Generate button (Phase 1 — US-PANEL-01)
- Quick Styles connection to generation (Phase 1 — US-PANEL-01)
- Any changes to `analyzeProperty()` prompt or logic
- Any changes to how brand colors are passed from frontend to API (that wiring is correct)

---

## Engineering / PR

- **Branch:** `fix/ai-us-ai-002a-brand-color-names`
- **PR:** #_____ (fill when opened)
- **Primary files:**
  - `client/src/lib/colorNames.ts` — **new file**
  - `api/src/modules/ai-generation/services/openai.service.ts` — update `generateImagePrompt()`
- **Note:** `colorNames.ts` is a frontend utility but the color name logic is also needed server-side. If the backend ever needs it independently, duplicate the lookup into `api/src/utils/colorNames.ts`. For Phase 0.5, frontend-only is sufficient since `openai.service.ts` receives the colors as strings from the DTO — the translation can happen in `generateImagePrompt()` directly as a pure function (no import needed).

---

## AI Implementation Prompt

> Copy this block into Claude Code to implement the story.

```
Context: InfographicAI SaaS — NestJS API (port 3001) + React frontend.
See CLAUDE.md for architecture.

Story: US-AI-002a — Brand color hex codes → descriptive names in image prompt

Problem: openai.service.ts:generateImagePrompt() passes brand colors as raw hex codes
("Brand colors: #1F448B, #FFFFFF") to the image generation model. Image models do not
reliably interpret hex codes — they need descriptive color names ("deep navy blue and white").

Fix:
1. Create client/src/lib/colorNames.ts with:
   - hexToColorName(hex: string): string — static lookup table with hue-based fallback
   - brandColorsToDescription(colors: string[]): string — joins names as "X, Y, and Z"
   - Lookup table must cover ALL hex values in RightSidebar.tsx defaultBrandPalettes

2. In api/src/modules/ai-generation/services/openai.service.ts, in generateImagePrompt():
   - Add an inline hexToColorName function (copy of the logic — no cross-package import)
   - Replace: const colors = propertyData.agent?.brandColors?.join(', ') || '#1F448B, #FFFFFF'
   - With:
     const rawColors: string[] = propertyData.agent?.brandColors || [];
     const colorDescription = rawColors.length > 0
       ? rawColors.map(hexToColorName).join(', ')
       : '';
   - Update the prompt line:
     if (colorDescription) prompt += `\n- Brand colors: ${colorDescription}`;
     (omit the line entirely when no colors — do NOT use a hardcoded default)

Constraints:
- Do NOT use an LLM to generate color names — static lookup only
- Do NOT expose hex codes, model names, or vendor names in any output
- Do NOT change analyzeProperty() or any other function in openai.service.ts
- npm run check must pass after changes

Acceptance:
- AC1–AC5 from STORY.md
- brandColorsToDescription(['#1F1F1F', '#D4AF37', '#FFFFFF']) returns "charcoal black, gold, and white"
- brandColorsToDescription([]) returns ""
- Server log during generation shows color names (not hex) in the image prompt
```

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|----------|----------|--------|---------|
| TC-AI-002a-01 | Auto | P0 | `brandColorsToDescription(['#1F1F1F', '#D4AF37', '#FFFFFF'])` returns `"charcoal black, gold, and white"` | 🔲 | |
| TC-AI-002a-02 | Auto | P0 | `brandColorsToDescription([])` returns `""` | 🔲 | |
| TC-AI-002a-03 | Auto | P1 | `hexToColorName('#3B82F6')` returns `"bright blue"` | 🔲 | |
| TC-AI-002a-04 | Auto | P1 | `hexToColorName('#ABCDEF')` returns `"#ABCDEF"` (unknown hex, passthrough) | 🔲 | |
| TC-AI-002a-05 | Manual | P0 | Generate with "Luxury Gold" palette selected → server log shows `"Brand colors: charcoal black, gold, white, off-white, warm brown"` (not hex) | 🔲 | |
| TC-AI-002a-06 | Manual | P0 | Generate with no palette selected + empty agent.brandColors → server log shows NO "Brand colors:" line | 🔲 | |
| TC-AI-002a-07 | Manual | P1 | Generated image visibly reflects gold/navy tones when Luxury Gold palette is selected | 🔲 | |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

---

## Definition of Done

- [ ] All ACs checked ✅
- [ ] All test cases run and recorded above
- [ ] `npm run check` passes
- [ ] `npm run test:unit` passes
- [ ] Manual flow verified: server log shows color names (not hex) during generation
- [ ] PR merged (PR #{number})
- [ ] M-AI-01 milestone AC updated to include this story

---

*Story created: 2026-06-16*
