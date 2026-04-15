# Story Card — US-{DOMAIN}-{NNN}

> **Status:** 🔲 Not Started | 🟡 In Progress | ✅ Done  
> **Feature:** F-{DOMAIN}-{NN} — {feature name}  
> **Epic:** [EPIC-{DOMAIN}-{NN}](../../EPIC.md)  
> **Milestone:** [M-{DOMAIN}-{NN}-{slug}](../../milestones/M-{DOMAIN}-{NN}-{slug}.md)  
> **Linear:** LIN-XXX  
> **Created:** YYYY-MM-DD | **Closed:** —

---

## Story

*As a* {persona — e.g. "solo real estate agent"}  
*I want* {one clear capability}  
*So that* {the outcome / why it matters}

---

## Acceptance Criteria

- [ ] **AC1:** {specific, testable condition}
- [ ] **AC2:** {specific, testable condition}
- [ ] **AC3:** {specific, testable condition}

---

## Out of Scope

- {Thing this story does NOT implement}
- {Another out-of-scope item — tells AI what to ignore}

---

## Engineering / PR

- **Branch:** `feat/{domain}-us-{domain}-{nnn}-{slug}`
- **PR:** #_____ (fill when opened)
- **Primary files touched:**
  - `path/to/file.tsx`
  - `path/to/another/file.ts`

---

## AI Implementation Prompt

> Copy this block into Claude Code / Cursor to implement the story.

```
Context: InfographicAI SaaS — NestJS API (port 3001) + React frontend (port 5000 via Express proxy).
See CLAUDE.md for architecture.

Story: US-{DOMAIN}-{NNN} — {title}

{paste story + ACs from above}

Implementation rules:
- Touch ONLY the files listed in "Primary files touched"
- Do NOT implement anything in "Out of scope"
- Token/pattern replacement guide: {paste from TASKS.md if applicable}
- When done: list files changed, ACs checked, test command to run
```

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|----------|----------|--------|---------|
| TC-{DS}-{NNN}-01 | Manual / Auto | P0 | {given/when/then} | 🔲 | |
| TC-{DS}-{NNN}-02 | Manual / Auto | P1 | {given/when/then} | 🔲 | |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

---

## Definition of Done

- [ ] All ACs checked ✅
- [ ] All test cases run and recorded
- [ ] `npm run check` passes
- [ ] `npm run test:unit` passes
- [ ] Manual flow verified on `localhost:5000`
- [ ] PR merged (PR #{number})
- [ ] No console errors for the changed flow
- [ ] [TASKS.md](./TASKS.md) task list fully checked

---

*Story created: YYYY-MM-DD*
