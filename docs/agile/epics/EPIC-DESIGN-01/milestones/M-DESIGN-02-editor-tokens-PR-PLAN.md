# PR Plan — M-DESIGN-02: Editor Token Fix

> **Milestone:** [M-DESIGN-02-editor-tokens](M-DESIGN-02-editor-tokens.md)  
> **Epic:** [EPIC-DESIGN-01](../EPIC.md)  
> **Architecture:** [ARCHITECTURE.mmd](../ARCHITECTURE.mmd)

---

## PR Sequence

### PR 1 — US-DESIGN-002: Editor design token replacement

**Branch:** `feat/design-us-design-002-editor-tokens`  
**Rationale:** Core visual fix. Editor components bypass the CSS variable system with hardcoded `bg-gray-*` classes. Until this merges, the editor always looks dark regardless of theme — making the app feel like two different products.  
**Depends on:** Nothing (M-DESIGN-01 QA already done)  
**Blocks:** PR 2 (US-DESIGN-003 human QA needs a working editor in both themes)  
**Files:** 12 editor + AI chat component files (see [TASKS.md](../stories/US-DESIGN-002/TASKS.md))  
**Tests:** `npm run check` + `npm run test:unit` + manual editor smoke

---

### PR 2 — US-DESIGN-003: AI Generation flow human QA (no code change expected)

**Branch:** `fix/design-us-design-003-if-needed` (only if AC2–6 surface bugs)  
**Rationale:** Generation progress states (spinner, result card, error) need visual verification after US-DESIGN-002 token fixes land. TC-DS-003-01/02 findings are fixed in PR 1 — re-verify them here.  
**Depends on:** PR 1 merged + staging deploy + live Ideogram API  
**Blocks:** Nothing  
**Files:** Only if live QA surfaces new hardcoded colors  
**Tests:** Manual TC-DS-003-03 to 08 using live API on staging

---

### PR 3 — US-DESIGN-001 + US-DESIGN-004: Human QA findings (only if code changes surface)

**Branch:** `fix/design-us-design-001-human-qa` (only if theme toggle or spacing bugs found)  
**Rationale:** AC1–3 of US-DESIGN-001 and AC2–4,6 of US-DESIGN-004 require human walk-through. This PR exists only if that walk-through reveals code bugs.  
**Depends on:** PR 1 merged  
**Files:** `theme-provider.tsx`, `index.css`, page components (only if broken)  
**Tests:** Manual theme toggle walk-through + visual contrast check

---

## Dependencies Diagram

```
M-DESIGN-01 (QA baseline) ✅ Done
    │
    ▼
PR 1: US-DESIGN-002 (editor tokens)     ← start here
    │
    ├─▶ PR 2: US-DESIGN-003 human QA   ← after PR 1 + staging deploy
    │
    └─▶ PR 3: US-DESIGN-001/004 fixes  ← after PR 1, if needed
```

---

## Milestone Exit Gate

- [ ] PR 1 merged and verified on staging
- [ ] PR 2 TCs recorded (pass or finding noted)
- [ ] PR 3 merged OR human QA recorded as "no code changes needed"
- [ ] `npm run check` passes
- [ ] [M-DESIGN-02 milestone file](M-DESIGN-02-editor-tokens.md) status → ✅ Done
- [ ] [PHASE_TRACKER.md](../../../PHASE_TRACKER.md) EPIC-DESIGN-01 row updated
