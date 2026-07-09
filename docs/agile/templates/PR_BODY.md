---
title: [{US-ID}] {Story Title}
type: template
tags: [orion, template]
updated: 2026-05-20
---

# [{US-ID}] {Story Title}

> **Epic:** [{EPIC-ID}](../docs/agile/epics/{phase}/{EPIC-ID}/EPIC.md)
> **Milestone:** [{M-ID}](../docs/agile/epics/{phase}/{EPIC-ID}/milestones/{M-ID}.md)
> **Linear:** [{LIN-ID}](https://linear.app/...)
> **Size:** XS | S | M | L

---

## Summary

{1–3 sentence description of what this PR delivers and why}

---

## Story

*As a* {persona}
*I want* {capability}
*So that* {outcome}

---

## Acceptance Criteria

- [x] **AC1:** {text} ✅
- [x] **AC2:** {text} ✅
- [ ] **AC3:** {text} — _deferred to staging QA story_

---

## Out of Scope (confirmed NOT in this PR)

- {Explicit exclusion 1}
- {Explicit exclusion 2}

---

## Test Evidence

### Gate 1 — TypeScript + Unit Tests (mandatory)
```
$ {gate 1 command 1}
✓ {output summary}

$ {gate 1 command 2}
✓ {N} tests passed
```

### Gate 2 — Visual Checklist (frontend stories)
- [x] Light mode — all changed components render correctly
- [x] Dark mode — same
- [x] Mobile (375px) — no overflow / overlap
- [x] Desktop (1440px) — layout balanced
- [x] No console errors on changed flow

### Gate 3 — E2E (frontend / token / critical-flow stories)
```
$ {gate 3 command}
✓ {N} tests passed
```

### Gate 4 — API Smoke (backend stories)
```
$ curl -fsS {api-url}/health
{"status": "ok"}

$ {gate 4 command}
✓ {N} tests passed
```

### Manual Flow
{1–3 sentences: what was clicked/typed/observed, end-to-end}

---

## Files Changed

| File | Task | AC(s) | Notes |
|------|:----:|:-----:|-------|
| `path/to/file.ext` | T1 | AC1, AC2 | {one-line summary} |
| `path/to/another.ext` | T2 | AC3 | {one-line summary} |
| `path/to/test.spec.ext` | T3 | AC1–AC3 | new tests |

**Total:** {N} files changed · +{N} additions · −{N} deletions

---

## Definition of Done

- [x] All ACs checked above
- [x] All test cases run (see STORY.md test cases table)
- [x] Gate 1 passes
- [ ] Gate 2 passes (manual checklist) — frontend
- [ ] Gate 3 passes — E2E
- [ ] Gate 4 passes — backend
- [x] Manual flow verified
- [x] No console errors
- [x] TASKS.md task list fully checked
- [ ] STORY.md status → ✅ Done (will be set by `/close-story` after merge)

---

## Reviewer Notes

> Optional — call out anything reviewers should pay extra attention to.

- {Specific concern or design decision worth a second look}
- {Performance implication, API contract change, or migration to watch}

---

## Linked Documents

- [STORY.md](../docs/agile/epics/{phase}/{EPIC-ID}/stories/{US-ID}/STORY.md)
- [TASKS.md](../docs/agile/epics/{phase}/{EPIC-ID}/stories/{US-ID}/TASKS.md)
- [ARCHITECTURE.mmd](../docs/agile/epics/{phase}/{EPIC-ID}/ARCHITECTURE.mmd)
