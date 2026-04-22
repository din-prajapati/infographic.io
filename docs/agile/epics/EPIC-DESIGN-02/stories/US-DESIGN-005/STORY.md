# Story Card — US-DESIGN-005

> **Status:** ✅ Done  
> **Feature:** F-DESIGN-05 — Token Foundation  
> **Epic:** [EPIC-DESIGN-02](../../EPIC.md)  
> **Milestone:** [M-DESIGN-03 — Token Foundation](../../milestones/M-DESIGN-03-token-foundation.md)  
> **Linear:** LIN-XXX  
> **Created:** 2026-04-17 | **Closed:** 2026-04-22

---

## Story

*As a* real estate agent using InfographicAI  
*I want* the app to feel warm, creative, and modern (not like a generic fintech tool)  
*So that* the visual identity matches the real estate / creative-tool positioning

---

## Acceptance Criteria

- [x] **AC1:** `--primary` resolves to blue `#0ca0eb` (`207 90% 49%`) in Light mode — no teal anywhere
- [x] **AC2:** `--secondary` resolves to amber `#f9b959` (`38 93% 66%`) — no purple-blue secondary
- [x] **AC3:** `--background` in Light mode resolves to warm cream (`hsl(45 13% 97%)` ≈ `#f9f8f6`)
- [x] **AC4:** `--background` in Dark mode resolves to warm near-black (`hsl(45 30% 4%)` ≈ `#100f09`)
- [x] **AC5:** Page background gradient in Light mode has warm cream stops (no teal/174° hue)
- [x] **AC6:** Page background gradient in Dark mode has warm-black stops (no navy/228° hue)
- [x] **AC7:** `--glass-tint` updated from `rgba(20,184,166,...)` (teal) to `rgba(12,160,235,...)` (blue)
- [x] **AC8:** All sidebar tokens (`--sidebar-primary`, `--sidebar-ring`, `--sidebar-accent`) updated to blue family
- [x] **AC9:** Chart palette: `--chart-1` = blue, `--chart-2` = amber, `--chart-3` = green
- [x] **AC10:** `npm run check` passes — zero new TypeScript errors (pre-existing errors unchanged)
- [x] **AC11:** `npm run test:unit` passes — 34/34 green

---

## Out of Scope

- Component file changes (only `globals.css` touched)
- Adding new token groups beyond shadcn HSL compat (component tokens are M-DESIGN-05)
- Motion, z-index, or primitive palette tokens (exist in `design-tokens.css` for reference; not applied yet)
- Outfit font (US-DESIGN-006)

---

## Engineering / PR

- **Branch:** `feat/epic-design-02-ui-redesign`
- **PR:** #_____
- **Primary files touched:**
  - `client/src/styles/globals.css` (`:root` and `.dark` blocks only)

---

## AI Implementation Prompt

> Copy this block into Claude Code to implement the story.

```
Context: InfographicAI SaaS — React frontend (Tailwind v4 + shadcn/ui).
See CLAUDE.md for architecture. Token reference: client/src/design-tokens.css

Story: US-DESIGN-005 — New color scheme in globals.css

Replace the :root and .dark HSL token values in client/src/styles/globals.css
with the values from the "SHADCN / TAILWIND COMPAT TOKENS" section of
client/src/design-tokens.css.

Also update:
- --page-bg gradients (light + dark) from the "Page background" sections
- --glass-tint from the "Glassmorphism" sections

Token replacement map:
LIGHT:
  --background:    220 20% 97%  →  45 13% 97%
  --foreground:    222 47% 11%  →  45 30%  6%
  --primary:       174 72% 40%  →  207 90% 49%
  --secondary:     239 84% 67%  →  38  93% 66%
  --secondary-foreground: 0 0% 100% → 45 30% 6%
  --accent:        174 72% 95%  →  207 90% 95%
  --accent-foreground: 174 72% 25% → 207 90% 35%
  --muted:         220 15% 92%  →  45 10% 92%
  --muted-foreground: 220 10% 42% → 45 5% 48%
  --border:        220 15% 88%  →  45 10% 88%
  --input:         220 15% 85%  →  45 10% 85%
  --ring:          174 72% 40%  →  207 90% 49%
  --sidebar:       220 20% 95%  →  45 10% 95%
  --sidebar-primary: 174 72% 40% → 207 90% 49%
  --sidebar-accent:  174 72% 95% → 207 90% 95%
  --sidebar-accent-foreground: 174 72% 25% → 207 90% 35%
  --sidebar-ring:  174 72% 40%  →  207 90% 49%
  --chart-1:       174 72% 40%  →  207 90% 49%
  --chart-2:       239 84% 67%  →  38  93% 60%
  --chart-3:       38  92% 50%  →  142 71% 40%
  --glass-tint:    rgba(20,184,166,0.03) → rgba(12,160,235,0.02)

DARK:
  --background:    228 20%  6%  →  45  30%  4%
  --foreground:    0   0%  95%  →  45  20% 96%
  --card:          228 15% 10%  →  45  25%  7%
  --sidebar:       228 18%  8%  →  45  28%  5%
  --muted:         228 12% 14%  →  45  15% 12%
  --accent:        174 50% 12%  →  207 50% 14%
  --accent-foreground: 174 72% 65% → 207 90% 65%
  --primary:       174 72% 45%  →  207 90% 55%
  --secondary:     239 60% 55%  →  38  80% 50%
  --ring:          174 72% 45%  →  207 90% 55%
  --sidebar-primary: 174 72% 45% → 207 90% 55%
  --sidebar-accent:  174 50% 12% → 207 50% 14%
  --sidebar-accent-foreground: 174 72% 65% → 207 90% 65%
  --sidebar-ring:  174 72% 45%  →  207 90% 55%
  --chart-1:       174 72% 40%  →  207 90% 60%
  --glass-tint:    rgba(20,184,166,0.08) → rgba(12,160,235,0.06)

PAGE GRADIENTS (replace hsl(174/200/220 ...) stops):
  Light: hsl(45 15% 97%) → hsl(210 18% 97%) → hsl(45 12% 97%)
  Dark:  hsl(45 30% 4%)  → hsl(220 20% 6%)  → hsl(45 25% 5%)

Rules:
- Touch ONLY client/src/styles/globals.css
- Do NOT add new CSS variables — only update existing values
- Do NOT touch component files
- When done: confirm npm run check passes
```

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|----------|----------|--------|---------|
| TC-DS-005-01 | Auto | P0 | Light mode: `getComputedStyle(root).getPropertyValue('--primary')` contains `207` | ✅ Pass | |
| TC-DS-005-02 | Auto | P0 | Dark mode: `--background` is warm (hue ~45) not cool navy (hue ~228) | ✅ Pass | |
| TC-DS-005-03 | Auto | P0 | Primary button background is blue (`#0ca0eb`), not teal | ✅ Pass | |
| TC-DS-005-04 | Auto | P1 | Secondary accent is amber, not purple-blue | ✅ Pass | |
| TC-DS-005-05 | Manual | P0 | Light mode: page background is warm cream, no teal tint | ✅ Pass | |
| TC-DS-005-06 | Manual | P0 | Dark mode: page background is warm dark, no navy/blue tint | ✅ Pass | |
| TC-DS-005-07 | Auto | P0 | `npm run check` — zero TypeScript errors | ✅ Pass | |
| TC-DS-005-08 | Auto | P0 | `npm run test:unit` — all unit tests pass | ✅ Pass | |

---

## Definition of Done

- [x] All ACs checked ✅
- [x] All test cases run and recorded
- [x] `npm run check` passes (no new errors vs baseline)
- [x] `npm run test:unit` passes — 34/34
- [x] Manual theme toggle smoke on Templates + Account pages
- [ ] PR merged (PR #_____)
- [ ] TASKS.md task list fully checked

---

*Story created: 2026-04-17*
