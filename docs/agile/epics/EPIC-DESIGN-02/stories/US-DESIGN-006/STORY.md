# Story Card — US-DESIGN-006

> **Status:** ✅ Done  
> **Feature:** F-DESIGN-06 — Token Foundation  
> **Epic:** [EPIC-DESIGN-02](../../EPIC.md)  
> **Milestone:** [M-DESIGN-03 — Token Foundation](../../milestones/M-DESIGN-03-token-foundation.md)  
> **Linear:** LIN-XXX  
> **Created:** 2026-04-17 | **Closed:** 2026-04-22

---

## Story

*As a* product designer reviewing InfographicAI  
*I want* display headings to use the Outfit font (warm, modern feel)  
*So that* the brand identity matches the Lovart.ai + FillinForm creative-tool aesthetic

---

## Acceptance Criteria

- [x] **AC1:** `index.html` loads Outfit from Google Fonts (`weights: 400,500,600,700`)
- [x] **AC2:** `tailwind.config.ts` has `fontFamily.display: ['Outfit', 'Inter', 'sans-serif']`
- [x] **AC3:** `globals.css` `:root` has `--font-display: 'Outfit', 'Inter', sans-serif`
- [x] **AC4:** Page headings (`h1`, `h2`) that use `font-display` class render in Outfit in browser
- [x] **AC5:** Body text and UI labels remain in Inter (no regression)
- [x] **AC6:** `npm run check` passes — zero new TypeScript errors
- [x] **AC7:** `npm run test:unit` passes — 34/34

---

## Out of Scope

- Applying `font-display` to specific components (that is M-DESIGN-05 work)
- Changing Inter as the base UI font
- Self-hosting the font (CDN via Google Fonts is sufficient for MVP)
- Variable font or `font-display: swap` FOUT optimisation

---

## Engineering / PR

- **Branch:** `feat/epic-design-02-ui-redesign`
- **PR:** #_____
- **Primary files touched:**
  - `index.html` (add Google Fonts `<link>`)
  - `tailwind.config.ts` (add `fontFamily.display`)
  - `client/src/styles/globals.css` (add `--font-display` var in `:root`)

---

## AI Implementation Prompt

> Copy this block into Claude Code to implement the story.

```
Context: InfographicAI SaaS — React frontend (Tailwind v4 + shadcn/ui).
See CLAUDE.md for architecture. Design reference: client/src/design-tokens.css

Story: US-DESIGN-006 — Outfit display font integration

Step 1 — index.html
Add inside <head> before existing font links (or after charset/viewport):
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet">

Step 2 — tailwind.config.ts
In the theme.extend.fontFamily block, add:
  display: ['Outfit', 'Inter', 'sans-serif'],

Step 3 — client/src/styles/globals.css
In the :root block, add after the last --font-* variable (or at the end of :root):
  --font-display: 'Outfit', 'Inter', sans-serif;

Rules:
- Do NOT change any existing font-family declarations
- Do NOT apply the font to any components (that is M-DESIGN-05)
- Do NOT remove Inter from any existing font stacks
- When done: confirm npm run check passes
```

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|----------|----------|--------|---------|
| TC-DS-006-01 | Manual | P0 | Google Fonts `<link>` present in `index.html` | ✅ Pass | |
| TC-DS-006-02 | Manual | P0 | Browser DevTools → Fonts shows Outfit loaded | ✅ Pass | |
| TC-DS-006-03 | Manual | P1 | Elements with `font-display` class render in Outfit | ✅ Pass | |
| TC-DS-006-04 | Manual | P1 | Body text remains Inter — no regression | ✅ Pass | |
| TC-DS-006-05 | Auto | P0 | `npm run check` — zero TypeScript errors | ✅ Pass | |
| TC-DS-006-06 | Auto | P0 | `npm run test:unit` — all unit tests pass | ✅ Pass | |

---

## Definition of Done

- [x] All ACs checked ✅ (AC4 requires manual browser verification)
- [x] All test cases run and recorded
- [x] `npm run check` passes (no new errors vs baseline)
- [x] `npm run test:unit` passes — 34/34
- [x] Manual browser check: Outfit shows in DevTools Fonts panel
- [ ] PR merged (PR #_____)
- [ ] TASKS.md task list fully checked

---

*Story created: 2026-04-17*
