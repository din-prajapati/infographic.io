---
title: Story Card — US-ORG-001
type: story
tags: [org, security, rbac, nestjs, prisma]
updated: 2026-08-31
---

# Story Card — US-ORG-001

> **Status:** 🔲 Not Started
> **Feature:** F-ORG-01 — Organization access control
> **Epic:** [EPIC-ORG-01](../../EPIC.md)
> **Milestone:** [M-ORG-01-organization-roles](../../milestones/M-ORG-01-organization-roles.md)
> **Linear:** LIN-XXX
> **Size:** M
> **Created:** 2026-08-31 | **Closed:** —
>
> **Source:** [PRD — Organization Roles & Access Control](../../../../PRD/2026-08-30-organization-roles-rbac.md) — every claim below was verified against `main @ e65c472`.

---

## Story

*As* the person who pays for a TEAM or AGENCY subscription
*I want* only me and the admins I designate to be able to add or remove members
*So that* a colleague I invited cannot remove me from the organisation I am being billed for, take my access to its designs and quota with them, and leave me paying for an account I can no longer reach

---

## Acceptance Criteria

> **Rule:** ACs are file-specific and binary. "Works correctly" is not an AC.

- [ ] **AC1 [happy-path]:** `api/prisma/schema.prisma` declares `enum OrgRole { OWNER ADMIN MEMBER }` and `User.orgRole OrgRole @default(MEMBER)`, and a Prisma migration exists that adds both. `npx prisma generate --schema=api/prisma/schema.prisma` produces a client on which `user.orgRole` is typed as `OrgRole`.

- [ ] **AC2 [happy-path]:** A data migration promotes exactly one `OWNER` per existing organisation, using this rule in order: (1) the `userId` on that organisation's most recent `Subscription` whose status is `ACTIVE` or `PENDING`; (2) failing that, the earliest-created `User` in the organisation; (3) an organisation with zero users is skipped. After it runs, `SELECT "organizationId", count(*) FROM "User" WHERE "orgRole" = 'OWNER' GROUP BY 1 HAVING count(*) <> 1` returns **zero rows**.

- [ ] **AC3 [security]:** `removeUserFromOrganization()` in `api/src/modules/users/users.service.ts` rejects with HTTP 403 when the **calling** user's `orgRole` is `MEMBER`. The current implementation validates only the *target* (`users.service.ts:177-191`) and never the caller, which is what allows a junior to remove the paying founder.

- [ ] **AC4 [security]:** The same caller check applies to `POST organization/members/invite` and `POST organization/members/:userId` in `api/src/modules/users/users.controller.ts` — a `MEMBER` receives 403 and no seat is consumed.

- [ ] **AC5 [security]:** Removing a user whose `orgRole` is `OWNER` is rejected with HTTP 403 **for every caller, including another OWNER or an ADMIN**. An organisation always has exactly one OWNER; ownership is transferred, never vacated.

- [ ] **AC6 [security]:** No endpoint allows a user to change their own `orgRole`, and no endpoint allows an `ADMIN` to promote anyone to `OWNER`. Role changes are an OWNER-only action. Verified by test per role × per endpoint, asserting the denial, not only the allow.

- [ ] **AC7 [happy-path]:** An OWNER can transfer ownership to another member of the same organisation via a new endpoint; on success the previous OWNER becomes `ADMIN` and the target becomes `OWNER`, atomically (one transaction — never a moment with zero or two owners). Without this, a departing owner strands the account permanently, because AC5 forbids removing them.

- [ ] **AC8 [rollback]:** If the ownership-transfer transaction fails partway, neither user's `orgRole` has changed — verified by a test that forces a failure between the two writes.

---

## Out of Scope

- **SSO / SAML, SCIM provisioning, audit logs, data residency.** Enterprise-tier features, built reactively against a real deal's security review. See the PRD's tier analysis — Canva puts these in Enterprise, not Teams.
- **Per-member design quotas or spend caps.** The shared pool stays shared. `UsageRecord.userId` already exists so *reporting* who spent what is a query and a screen, but per-seat *limits* are a pricing-model change.
- **Multi-org membership.** `User.organizationId` is a single nullable scalar; a join table would model a many-to-many that does not exist. That migration should be driven by the requirement, not pre-built for it.
- **UI beyond not breaking the existing members screen.** Hiding a button the API already refuses is presentation, not protection.

---

## Design Notes

**Role on `User`, not a join table.** A user belongs to at most one organisation today
(`User.organizationId` is a nullable scalar), so a membership table would model a relationship the
product does not have.

**Three roles, deliberately.** OWNER + MEMBER alone closes both defects; ADMIN exists for
delegation on larger accounts, which is real for AGENCY's unlimited seats and speculative for
TEAM. Open question below.

**The backfill is the risky part, not the enum.** Every existing row takes `MEMBER` from the
default, which would leave every organisation with **no owner** — strictly worse than today, since
nobody could then invite anyone. `Subscription.userId` is the principled source: it records who
actually paid, which makes the person being billed the person in control. That is the whole point
of AC3.

**Two invariants, stated as invariants rather than scattered checks:** exactly one OWNER per
organisation, and no self-escalation.

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|:--------:|----------|:------:|---------|
| TC-ORG-001-01 | Unit | **P0** | security: MEMBER calls removeUserFromOrganization → 403, target's `organizationId` unchanged | 🔲 | |
| TC-ORG-001-02 | Unit | **P0** | security: any caller attempts to remove the OWNER → 403, including when the caller is ADMIN | 🔲 | |
| TC-ORG-001-03 | Unit | P0 | security: MEMBER calls invite / add-member → 403, seat count unchanged | 🔲 | |
| TC-ORG-001-04 | Unit | P0 | security: MEMBER attempts to set own `orgRole` → 403; ADMIN attempts to create a second OWNER → 403 | 🔲 | |
| TC-ORG-001-05 | Unit | P0 | happy-path: ADMIN removes a MEMBER → succeeds | 🔲 | |
| TC-ORG-001-06 | Unit | P0 | happy-path: ownership transfer swaps exactly two roles; old OWNER becomes ADMIN | 🔲 | |
| TC-ORG-001-07 | Unit | P0 | rollback: transfer fails between writes → neither role changed | 🔲 | |
| TC-ORG-001-08 | Integration | **P0** | AC2's query returns zero rows after the backfill migration runs against a real DB | 🔲 | |
| TC-ORG-001-09 | Unit | P1 | backfill rule: org with an ACTIVE subscription → that `Subscription.userId` becomes OWNER | 🔲 | |
| TC-ORG-001-10 | Unit | P1 | backfill rule: FREE org with no subscription → earliest-created user becomes OWNER | 🔲 | |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

---

## Definition of Done

- [ ] All ACs checked
- [ ] Gate 1 passes (`npm run check` + `npm run test:unit`)
- [ ] **The backfill verified against a real database**, not only unit-tested — AC2's query run
      after the migration. This is the one step that cannot be mocked: getting an organisation
      wrong means a real person loses control of their account.
- [ ] PR opened with story card as description
- [ ] EPIC.md "Implementation Update" log appended

---

## Open Questions

- [ ] **Does ADMIN earn its place in v1?** OWNER + MEMBER closes both defects. ADMIN is delegation
      — real for AGENCY, speculative for TEAM. Dropping it removes AC6's second half and one role
      from every test matrix.
- [ ] **What happens to a removed member's designs?** Today `organizationId: null` detaches the
      user while their `Infographic` rows keep the org id. Probably correct — the work belongs to
      the organisation that paid for it — but it is currently accidental rather than decided.
- [ ] **Is per-user usage attribution in or out?** The data exists (`UsageRecord.userId`); it is a
      query and a screen. Useful for AGENCY, not required to close a vulnerability.
