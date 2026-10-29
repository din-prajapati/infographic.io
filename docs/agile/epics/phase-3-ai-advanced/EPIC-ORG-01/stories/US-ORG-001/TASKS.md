---
title: PR Task List — US-ORG-001
type: tasks
updated: 2026-08-31
---

# PR Task List — US-ORG-001

> **Story:** [STORY.md](./STORY.md)
> **Milestone branch:** `feat/org/m-01-organization-roles`
> **PR:** #_____

---

## Four Pillars Pre-flight

- [x] **Brain** — STORY.md filled, 8 ACs, all file-specific
- [x] **Muscle** — T1-T6 below with exact test commands
- [ ] **Map** — [ARCHITECTURE.mmd](../../ARCHITECTURE.mmd) — not yet created for this epic
- [x] **Env** — no new environment variables

---

## PR Scope Summary

**One-liner:** Organization roles, so a member cannot remove the person paying for the account.

```
feat(org): T{n} {summary} — US-ORG-001
```

---

## Task Breakdown

### T1 — Schema + migration
- **File:** `api/prisma/schema.prisma`, `api/prisma/migrations/`
- **Type:** `feat` · **AC(s):** AC1
- `enum OrgRole { OWNER ADMIN MEMBER }`, `User.orgRole OrgRole @default(MEMBER)`
- `npx prisma migrate dev --schema=api/prisma/schema.prisma`
- ⚠️ Stop the dev server first — a running NestJS process holds the Prisma query-engine DLL open
  on Windows and `prisma generate` fails with `EPERM`.

### T2 — Backfill migration
- **File:** `api/prisma/migrations/` (data migration) or `api/scripts/backfill-org-owners.ts`
- **Type:** `feat` · **AC(s):** AC2
- **The risky task.** Default `MEMBER` with no backfill leaves every org ownerless, which is worse
  than today: nobody could invite anyone.
- Rule, in order: most recent `ACTIVE`/`PENDING` `Subscription.userId` → earliest-created user →
  skip empty orgs.
- Must be **verified against a real database**, not only unit-tested (see DoD).

### T3 — Role guard
- **File:** `api/src/modules/users/users.service.ts`, `users.controller.ts`
- **Type:** `feat` · **AC(s):** AC3, AC4, AC5
- Add the caller check to `removeUserFromOrganization()` — it currently validates only the target
  (`users.service.ts:177-191`).
- Same for invite and add-member.
- Removing an OWNER is refused for every caller.
- Prefer a reusable guard/decorator over three inline checks — three copies of a permission rule
  is how the fourth call site ends up without one.

### T4 — Invariants
- **File:** `api/src/modules/users/users.service.ts`
- **Type:** `feat` · **AC(s):** AC6
- No self-escalation; only OWNER changes roles; ADMIN cannot mint an OWNER.

### T5 — Ownership transfer
- **File:** `api/src/modules/users/users.service.ts`, `users.controller.ts`
- **Type:** `feat` · **AC(s):** AC7, AC8
- One transaction — never a moment with zero or two owners. Without this, AC5 means a departing
  owner strands the account permanently.

### T6 — Tests
- **File:** `api/tests/users/org-roles.spec.ts` (new)
- **Type:** `test` · **AC(s):** all
- Assert the **denials** per role × per endpoint, not only the allows. A guard that permits
  everything passes every happy-path test.
- `cd api && npx vitest run --config vitest.config.ts tests/users/org-roles.spec.ts`

---

## Task Checklist

- [ ] T1 — Schema + migration
- [ ] T2 — Backfill migration
- [ ] T3 — Role guard on the three mutating endpoints
- [ ] T4 — Single-owner + no-self-escalation invariants
- [ ] T5 — Ownership transfer
- [ ] T6 — Tests
- [ ] Gate 1 passes
- [ ] Backfill verified against a real DB (AC2's query returns zero rows)
- [ ] PR opened with story card as description
- [ ] STORY.md ACs ticked off
- [ ] EPIC.md "Implementation Update" log appended
