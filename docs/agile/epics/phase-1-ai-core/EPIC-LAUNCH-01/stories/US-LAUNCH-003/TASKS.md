# PR Task List — US-LAUNCH-003

> **Story:** [STORY.md](./STORY.md)
> **Branch:** `feat/launch-us-launch-003-password-reset`
> **PR:** #_____ (fill when opened)
> **Linear:** LIN-XXX
> **Type:** feat

---

## Three Pillars Pre-flight (check before starting AI session)

- [ ] **Brain** — STORY.md filled
- [ ] **Muscle** — file list + ordered tasks + exact test commands
- [ ] **Map** — [ARCHITECTURE.mmd](../../ARCHITECTURE.mmd) exists
- [ ] **Env** — [ENV.yaml](../../ENV.yaml) loaded
- [ ] **Dependency** — US-LAUNCH-002 (EmailService) merged

---

## PR Scope Summary

**One-liner:** Forgot/reset password — token model, auth endpoints, email, frontend pages
```
feat(auth): forgot/reset password flow — US-LAUNCH-003
```

---

## Task Breakdown

### T1 — PasswordResetToken model
**File:** `api/prisma/schema.prisma`
**AC(s) covered:** AC1
**Changes:** *(fill during implementation session; then `npx prisma db push` + `npx prisma generate`)*

### T2 — Auth endpoints (forgot + reset)
**Files:** `api/src/modules/auth/services/auth.service.ts`, auth controller `(TBC)`
**AC(s) covered:** AC1, AC2, AC3, AC5
**Changes:** *(fill during implementation session)*

### T3 — Frontend pages + routes + login link
**Files:** `client/src/pages/auth/ForgotPasswordPage.tsx`, `ResetPasswordPage.tsx` (new), `client/src/pages/AuthPage.tsx`, `client/src/App.tsx`
**AC(s) covered:** AC4
**Changes:** *(fill during implementation session)*

### T4 — Unit tests
**File:** `api/tests/auth/password-reset.spec.ts` (new)
**AC(s) covered:** AC1, AC3, AC5
**Changes:** *(fill during implementation session)*

---

## File-to-Task Mapping

| File | Task(s) | AC(s) | Notes |
|------|---------|-------|-------|
| `api/prisma/schema.prisma` | T1 | AC1 | new model only — touch nothing else in schema |
| `api/src/modules/auth/*` | T2 | AC1–AC3, AC5 | |
| `client/src/pages/auth/*`, `AuthPage.tsx`, `App.tsx` | T3 | AC4 | public routes |
| `api/tests/auth/password-reset.spec.ts` | T4 | AC1, AC3, AC5 | mock-based |

---

## Exact Test Commands

```bash
npm run check
npm run test:unit
cd api && npx vitest run tests/auth/password-reset.spec.ts --reporter=verbose
# Manual: localhost:5000/auth → "Forgot password?" → email form → console link → reset → re-login
```

---

## Task Checklist

- [x] T1 — Prisma model + db push
- [x] T2 — auth endpoints
- [x] T3 — frontend pages + routes
- [x] T4 — unit tests
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

- Do NOT store the raw token — SHA-256 hash only; raw goes in the email link once
- Do NOT return different responses for known vs unknown emails (user enumeration)
- Do NOT touch `shared/schema.ts` (legacy Drizzle) — Prisma is canonical
- Do NOT refactor existing login/register logic while adding the new endpoints

---

*Tasks created: 2026-07-07*
