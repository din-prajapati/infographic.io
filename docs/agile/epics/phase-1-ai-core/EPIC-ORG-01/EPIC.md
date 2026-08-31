---
title: Epic — Organization Access Control
type: epic
domain: ORG
phase: 1
created: 2026-08-31
status: 🔲 Not Started
---

# EPIC-ORG-01 — Organization Access Control

> **Domain:** ORG · **Phase:** 1 (Revenue Strategy, v1.1)
> **Milestone:** [M-ORG-01-organization-roles](milestones/M-ORG-01-organization-roles.md)
> **Source:** [PRD — Organization Roles & Access Control](../../../PRD/2026-08-30-organization-roles-rbac.md)

---

## Why this epic exists

`AGENCY` went on sale in production on **2026-08-30** with **unlimited seats**, and `TEAM` sells 5.
Neither has any concept of who is in charge: there is no `role` field on `User` anywhere in
`api/prisma/schema.prisma`, and no permission check on any organisation endpoint beyond "are you
logged in".

The sharpest consequence is not the missing model but what it permits. `users.service.ts:177`
validates the **target** of a member removal and never the **caller**:

```ts
if (target.organizationId !== organizationId) throw ...
await prisma.user.update({ where: { id: userId }, data: { organizationId: null } });
```

So on an AGENCY account, a junior invited this morning can remove the founder who owns the
subscription. The founder loses access to the organisation's designs and quota **and keeps being
charged**, because `Subscription.userId` still points at them.

This is **OWASP A01, Broken Access Control** — the top row of the project's own
[`SECURITY.md`](../../../../.orion/rules/SECURITY.md) risk map. Authenticated but unauthorised.

## Why now rather than later

Two facts pull the same direction, and they will not both hold for long:

- **AGENCY is live and purchasable**, so the exposure is real rather than theoretical.
- **There are zero paying customers**, so no organisation has a second member yet — the
  vulnerability has no victim, and the ownership backfill has almost nothing to migrate.

Fixing this before the first multi-seat account exists is materially cheaper than after.

---

## Scope

Three roles and no more — `OWNER` / `ADMIN` / `MEMBER`. Canva puts detailed user roles in
*Enterprise*, not Teams; a granular permission system is enterprise work built against a real
deal's security review, not something to invent ahead of one.

**Out of scope for this epic:** SSO/SAML, SCIM provisioning, audit logs, data residency,
multi-org membership. All are enterprise-tier features to be built reactively — see the tier
analysis in the PRD.

---

## Stories

| # | Story | Size | Status |
|:-:|---|:--:|---|
| 1 | [US-ORG-001](stories/US-ORG-001/STORY.md) — Organization roles + permission enforcement | M | 🔲 Not Started |

---

## Out of Scope (Epic Level)

- **Per-member design quotas or spend caps.** `UsageRecord.userId` is already written on every
  generation, so "who spent what" reporting is a query and a screen — worth doing, but per-seat
  *limits* are a pricing-model change and a separate decision.
- **Brand kit / workspace settings** — ORG domain, but unrelated to access control.
