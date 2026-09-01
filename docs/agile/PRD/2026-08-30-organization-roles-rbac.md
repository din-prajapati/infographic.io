---
title: PRD (pre-story) — Organization Roles & Access Control
type: prd
domain: PAY
created: 2026-08-30
status: draft — not scheduled. Written as a pre-story so sizing/placement can be decided separately.
verified_against: main @ e65c472
---

# PRD (pre-story) — Organization Roles & Access Control

> Every claim below was checked against the code on 2026-08-30. File and line references are
> to `main @ e65c472`.

---

## 1. Why this exists

`AGENCY` went on sale in production on 2026-08-30 with **unlimited seats**. `TEAM` sells 5.

Neither has any concept of who is in charge. There is no `role` field on `User` anywhere in
`api/prisma/schema.prisma`, and no permission check on any organisation endpoint beyond
"are you logged in". Every member of an organisation is, in effect, an owner.

This is not an enterprise-tier gap. It is a gap in a tier that is **live and purchasable right
now**, and it is what makes "unlimited users" a liability rather than a feature: the more seats
a plan sells, the worse the blast radius.

---

## 2. Current state (verified 2026-08-30)

| Piece | State |
|---|---|
| `User.role` / `OrganizationMember` | **does not exist** — no role field in `schema.prisma` |
| `Organization.ownerId` / `createdBy` | **does not exist** |
| Org endpoints | 6, in `users.controller.ts` — all guarded by `AuthGuard('jwt')` only |
| Seat cap enforcement | ✅ works — `canAddUser()` / `PLAN_USER_LIMITS` (fixed 2026-08-30) |
| Design quota | ✅ org-scoped and enforced — `Organization.monthlyLimit` |
| Per-user usage attribution | `UsageRecord.userId` **is written**, but nothing reads it per-user |

### 2.1 The six organisation endpoints, and who can call them

All six carry `@UseGuards(AuthGuard('jwt'))` and nothing else.

| Endpoint | Who should | Who actually can |
|---|---|---|
| `GET organization` | any member | any member ✅ |
| `GET organization/members` | any member | any member ✅ |
| `GET organization/slots` | any member | any member ✅ |
| `POST organization/members/invite` | admin | **any member** ❌ |
| `POST organization/members/:userId` | admin | **any member** ❌ |
| `DELETE organization/members/:userId` | admin | **any member** ❌ |

---

## 3. The three defects, in severity order

### 3.1 🔴 Any member can remove any other member — including the payer

`users.service.ts:177-191`:

```ts
async removeUserFromOrganization(organizationId: string, userId: string): Promise<void> {
  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) throw new NotFoundException('User not found');
  if (target.organizationId !== organizationId) {
    throw new BadRequestException('User is not a member of this organization');
  }
  await prisma.user.update({ where: { id: userId }, data: { organizationId: null } });
}
```

It validates the **target** and never the **caller**. The controller passes
`req.user.organizationId`, so the only condition is that both parties are in the same
organisation.

**Concretely:** on an AGENCY account, a junior who was invited this morning can call
`DELETE /users/organization/members/:userId` against the founder who owns the subscription.
The founder is silently detached from the organisation — `organizationId: null` — and loses
access to the org's designs, quota, and billing, while continuing to be charged, because
`Subscription.userId` still points at them.

This is **OWASP A01, Broken Access Control** — the top item in the project's own
`SECURITY.md` risk map ("Backend auth middleware + RBAC checks per resource"). It is
authenticated-but-unauthorised, not an authentication hole.

### 3.2 🟠 Any member can consume seats

`POST organization/members/invite` and `POST organization/members/:userId` have the same
shape. On `TEAM` (5 seats) any member can fill the remaining seats; the cap is enforced, so
the failure mode is a legitimate colleague being unable to join rather than an unbounded bill.
On `AGENCY` (unlimited) there is no cap at all.

### 3.3 🟡 No per-seat visibility into a shared pool

The design allowance is one org-wide pool (`Organization.monthlyLimit`). Any one member can
spend all 400 of AGENCY's designs, and there is no way for an admin to see who spent what, cap
a member, or stop them.

`UsageRecord.userId` is already written on every generation, so **the data to answer "who spent
what" exists today** — nothing reads it per-user. That makes attribution reporting a query, not
a schema change.

---

## 4. Proposed model

### 4.1 Three roles, no more

```prisma
enum OrgRole {
  OWNER    // billing + everything ADMIN can do. Exactly one per org.
  ADMIN    // manage members
  MEMBER   // create designs, spend the shared pool
}
```

Deliberately minimal. Canva's own ladder puts detailed user roles in *Enterprise*, not Teams —
a granular permission system is an enterprise feature to be built against a real deal, and
inventing one now would be the speculative work §6 argues against.

| Capability | OWNER | ADMIN | MEMBER |
|---|:--:|:--:|:--:|
| Generate designs, spend the pool | ✅ | ✅ | ✅ |
| View org, members, slots | ✅ | ✅ | ✅ |
| Invite / add members | ✅ | ✅ | ❌ |
| Remove members | ✅ | ✅ | ❌ |
| Remove an ADMIN | ✅ | ❌ | ❌ |
| **Remove the OWNER** | ❌ **nobody** | ❌ | ❌ |
| Manage billing / change plan | ✅ | ❌ | ❌ |
| Transfer ownership | ✅ | ❌ | ❌ |

Two invariants worth stating as invariants, not as checks scattered through handlers:

- **An organisation always has exactly one OWNER.** Removing them is not a permission that
  exists; ownership is transferred, never vacated.
- **Nobody can escalate their own role.** Role changes are an OWNER action.

### 4.2 Where the role lives

On `User`, not a join table:

```prisma
model User {
  organizationId String?
  orgRole        OrgRole @default(MEMBER)
}
```

A user belongs to at most one organisation today (`User.organizationId` is a nullable scalar),
so a membership join table would model a many-to-many that does not exist. If multi-org
membership is ever wanted, that is the migration that introduces the join table — and it should
be driven by that requirement, not pre-built for it.

### 4.3 Backfilling existing organisations — the interesting part

Every existing row gets `MEMBER` from the default, which would leave **every organisation with
no owner**. The migration must promote exactly one user per org, and the codebase has no
`createdBy` to read.

`Subscription.userId` is the answer: it records the user who actually paid.

```
For each Organization:
  1. OWNER := Subscription.userId  where organizationId = org.id
                                     and status in (ACTIVE, PENDING)
                                     order by createdAt desc, limit 1
  2. fallback (no subscription — every FREE org): the earliest-created User in the org
  3. if the org has zero users: no-op, nothing to own
```

Rule 1 is the one that matters: it makes the **person being billed** the person in control,
which is the whole point of §3.1. Rule 2 covers FREE orgs, where the earliest user is the one
who created the org during registration (`auth.service.ts:89`).

This must be a **data migration that runs and is verified**, not a schema default. A default of
`MEMBER` with no backfill is strictly worse than today: nobody could invite anyone.

---

## 5. Scope

**In:**
- `OrgRole` enum + `User.orgRole` + migration and backfill (§4.3)
- A guard/decorator enforcing the §4.1 matrix on the three mutating endpoints
- The two invariants: single owner, no self-escalation
- Ownership transfer endpoint (OWNER only) — without it, a departing owner strands the account
- Tests asserting the specific denials, not just the allows

**Out:**
- SSO / SAML / SCIM — enterprise, build against a real deal (see the tier discussion)
- Audit logs — same
- Per-member design quotas or spend caps. §3.3's *reporting* may be worth doing; per-seat
  *limits* are a pricing-model change and a separate decision
- Multi-org membership
- Any UI beyond what is needed to not break the existing members screen

---

## 6. Why not build the full enterprise permission system now

The category builds enterprise access control **reactively**, against a specific deal's security
review. Canva puts SSO, SCIM, audit logs and detailed roles in Enterprise (custom-quoted, 25-seat
minimum) and ships Teams with plain admin/member.

Three roles closes a live vulnerability on a live tier. Everything beyond that is speculative
until someone asks — and BROKERAGE/ENTERPRISE are explicitly deferred until a real enquiry.

---

## 7. Effort

| Piece | Size |
|---|---|
| Enum + field + Prisma migration | XS |
| Backfill migration + verification query | **S — the risky part**, gets an org wrong and someone loses control of their account |
| Role guard + apply to 3 endpoints | S |
| Single-owner + no-escalation invariants | S |
| Ownership transfer endpoint | S |
| Tests (denials per role × endpoint) | S |
| Members-screen UI: show role, hide disallowed actions | M |

**Roughly one story if the UI is deferred; two if not.** The backend alone closes §3.1 and
§3.2 — a member who cannot call the endpoint cannot remove the owner, whether or not the button
is hidden.

---

## 8. Open questions

- [ ] **Does an ADMIN role earn its place in v1?** OWNER + MEMBER closes both defects. ADMIN
      exists for delegation on larger accounts — real for AGENCY, speculative for TEAM.
- [ ] **What happens to a removed member's designs?** Today `organizationId: null` detaches the
      user; their `Infographic` rows keep the org id. Probably correct (work belongs to the org
      that paid) but it is currently accidental rather than decided.
- [ ] **Should removing a member be blocked while they hold the active subscription**, or should
      it force a transfer first? §4.1 forbids removing the OWNER, which covers it — but only if
      the backfill correctly identified them.
- [ ] **Is §3.3's per-user attribution reporting in or out?** The data exists; it is a query and
      a screen. Useful for AGENCY, not required to close a vulnerability.

---

## 9. Prerequisites

None technically. Worth noting for prioritisation:

- **AGENCY is live and sellable as of 2026-08-30**, so §3.1's exposure is real, not theoretical
- There are still **zero paying customers**, so no organisation currently has a second member —
  the vulnerability has no live victim yet, and the backfill has almost nothing to migrate
- Both facts point the same way: **this is much cheaper to fix now than after the first
  multi-seat account exists**
