# PR Task List — US-LAUNCH-002

> **Story:** [STORY.md](./STORY.md)
> **Branch:** `feat/launch-us-launch-002-email-service`
> **PR:** #_____ (fill when opened)
> **Linear:** LIN-XXX
> **Type:** feat

---

## Three Pillars Pre-flight (check before starting AI session)

- [ ] **Brain** — STORY.md filled
- [ ] **Muscle** — file list + ordered tasks + exact test commands
- [ ] **Map** — [ARCHITECTURE.mmd](../../ARCHITECTURE.mmd) exists
- [ ] **Env** — [ENV.yaml](../../ENV.yaml) loaded (RESEND_API_KEY, EMAIL_FROM)

---

## PR Scope Summary

**One-liner:** Provider-agnostic EmailService module (Resend impl + console dev fallback)
```
feat(email): transactional email foundation — US-LAUNCH-002
```

---

## Task Breakdown

### T1 — Email module + service
**Files:** `api/src/modules/email/email.module.ts`, `email.service.ts` (new)
**AC(s) covered:** AC1, AC2, AC3, AC4
**Changes:** *(fill during implementation session)*

### T2 — Register module + dependency
**Files:** `api/src/app.module.ts`, `package.json`
**AC(s) covered:** AC1, AC2
**Changes:** *(fill during implementation session)*

### T3 — Unit tests
**File:** `api/tests/email/email.service.spec.ts` (new)
**AC(s) covered:** AC5
**Changes:** *(fill during implementation session)*

---

## File-to-Task Mapping

| File | Task(s) | AC(s) | Notes |
|------|---------|-------|-------|
| `api/src/modules/email/*` | T1 | AC1–AC4 | new module |
| `api/src/app.module.ts`, `package.json` | T2 | AC1, AC2 | |
| `api/tests/email/email.service.spec.ts` | T3 | AC5 | new, mock-based |

---

## Exact Test Commands

```bash
npm run check
npm run test:unit
cd api && npx vitest run tests/email/email.service.spec.ts --reporter=verbose
# Manual: with no RESEND_API_KEY, boot npm run dev → no crash; trigger send → console log
```

---

## Task Checklist

- [x] T1 — email module + service
- [x] T2 — app module registration + dependency
- [x] T3 — unit tests
- [x] `npm run check` passes ✅
- [x] `npm run test:unit` passes ✅
- [ ] Manual test recorded ✅
- [ ] PR opened with story card as description ✅
- [ ] STORY.md ACs updated ✅

---

## Test Is Truth

> Do not weaken, skip, or modify a failing test to make it pass. Fix the code.

---

## Anti-Patterns to Avoid in This Story

- Do NOT leak the provider name outside the module — `EmailService`, not `ResendService`, in all callers (generic-naming rule)
- Do NOT let send() throw — auth and webhook flows must survive email outages
- Do NOT build a template engine — inline HTML strings per email are the Phase 1 answer
- Do NOT wire any caller flows yet (reset email is US-LAUNCH-003, receipt is US-LAUNCH-006)

---

*Tasks created: 2026-07-07*
