# Agile QA workflow — Epics, features, stories, test cases, PRs

> **Purpose:** One way to model **manual and automated tests** the same way you model product work: traceable from **user value** → **delivery (PR)** → **verification**.  
> **Use with:** [PAYMENT_TEST_CHECKLIST.md](./PAYMENT_TEST_CHECKLIST.md) (grouped by **Solo/Team × monthly/annual**, each TC with Prerequisites / Configuration / Scenario / Automation / Result / Finding / PR), or copy this pattern for other domains.

---

## Hierarchy (maps to common boards)

| Level | Typical Jira / Azure DevOps / GitHub Projects | Owner | Output |
|--------|-----------------------------------------------|--------|--------|
| **Epic** | Epic / Initiative | PM / Eng lead | Large outcome (e.g. “MVP payments live”) |
| **Feature** | Feature / Area | Eng lead | Shippable slice (e.g. “Razorpay checkout”) |
| **User story** | Story / PBI | Product + Eng | *As a … I want … So that …* |
| **Task** | Sub-task / Dev task | Dev | Implementation work (often **one PR** or part of one) |
| **Test case** | Test / QA task / AC check | QA / Dev | Given–When–Then or explicit expected result |
| **PR** | Pull request | Dev | Code merged; link **every story** you touch |

**Definition of Done (story):**

- Acceptance criteria satisfied in a **staging or local** environment as agreed.
- Linked **test cases** executed: pass, fail (with **Finding** + issue ID), or **N/A** with reason.
- **PR** merged (or listed if story is QA-only).
- Trackers updated: [MVP_LAUNCH_TRACKER.md](./MVP_LAUNCH_TRACKER.md), [implementation/1_WEEK_LAUNCH_TRACKER.md](./implementation/1_WEEK_LAUNCH_TRACKER.md), or team board.

---

## User story template (copy per story)

```markdown
### US-AREA-NNN — <short title>

**Feature:** F-AREA-xxx — <feature name>  
**Epic:** EPIC-AREA-01 — <epic name>

**Story**  
*As a* <persona>  
*I want* <capability>  
*So that* <outcome / value>

**Acceptance criteria**
- [ ] AC1: …
- [ ] AC2: …

**Engineering / PR**
- **PR:** #_____ (link)
- **Primary paths:** `path/to/file` (optional)

**Test cases**

| TC ID | Type | Priority | Given / When / Then | Status | Finding / link |
|-------|------|----------|---------------------|--------|----------------|
| TC-… | Manual / Auto | P0 | … | ☐ / ☑ | … |
```

**Type**

- **Manual** — human executes steps (browser, Dashboard, tunnel).
- **Auto** — `npm run …`, CI job, Playwright; link script name in **Finding**.

**Priority**

- **P0** — launch blocker  
- **P1** — should complete before GA  
- **P2** — optional / nice-to-have  

---

## From test case → PR (traceability)

1. When you open a **PR**, list **story IDs** and **TC IDs** in the description (e.g. “Closes US-PAY-105; validates TC 1.5b”).
2. When QA finishes a **TC**, note **PR #** that introduced or fixed the behavior under test (if not obvious).
3. Regressions: add **TC** under the **same story** or a **Regression** feature under the epic.

---

## Yesterday / today (sprint-style notes)

Use a short block at the top of your checklist or sprint doc:

| Date | Completed (stories / TCs) | Next (stories / TCs) |
|------|---------------------------|----------------------|
| YYYY-MM-DD | … | … |

---

*Related: [PAYMENT_TEST_CHECKLIST.md](./PAYMENT_TEST_CHECKLIST.md) · [PAYMENT_AUTOMATED_TESTING.md](./PAYMENT_AUTOMATED_TESTING.md)*
