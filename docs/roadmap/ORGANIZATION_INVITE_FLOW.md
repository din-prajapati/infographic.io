# Organization invite flow — draft specification

> **Status:** Draft for future implementation  
> **Builds on:** `OrganizationScreen` (`inviteMemberByEmail` / `POST /api/v1/users/organization/members/invite`), seat limits in `UsersService`, registration with `organizationId` in `AuthService`  
> **Last updated:** April 6, 2026

---

## 1. Purpose

Today, a **team admin** can only attach users who **already have an account** by email (`inviteMemberByEmail`). A **full invite flow** should:

- Let admins invite **any email** (no account required yet).
- Send a **secure, time-limited link** (and optional reminder).
- Let invitees **accept or decline** without guessing internal user IDs.
- Respect **seat limits** at **accept** time (not only at “instant add”).
- Optionally support **domain allowlists**, **roles**, and **audit**.

This document is the blueprint to implement that incrementally without throwing away the current API.

---

## 2. Current foundation (keep)

| Piece | Role |
|-------|------|
| `PLAN_USER_LIMITS` / `canAddUser` | Enforce max seats (e.g. TEAM = 5). |
| `addUserToOrganization` / `removeUserFromOrganization` | Final membership mutations (already validated). |
| `POST .../members/invite` (email, existing user) | **Fast path:** user exists → add immediately (current behavior). |
| Registration `organizationId` | Legacy/join-by-ID path; invites should prefer **token**, not raw org id in URL. |
| `OrganizationScreen` | UI shell for members, slots, cap messaging — extend with “Pending invites” and “Send invite”. |

---

## 3. Target user journeys

### 3.1 Admin: send invite

1. Admin opens **Account → Organization**.
2. Enters **email** (and optionally **role** if you add roles later).
3. Clicks **Send invite**.
4. System creates a **pending invite** record, reserves nothing in DB for seats until accept (see §6), sends email with link.
5. UI shows invite as **Pending** with **Resend** / **Revoke**.

**Validation (server):**

- Admin is authenticated and `organizationId` matches org.
- Email format valid; normalize to lowercase.
- No duplicate **pending** invite for same `(organizationId, email)`.
- Optional: block if email already a **member** of this org.
- Optional: same email cannot have **two orgs** policy — align with `addUserToOrganization` (already blocks “other org”).

### 3.2 Invitee: no account yet

1. Clicks link: `/invite/accept?token=...` (or `/auth?invite=...` — pick one canonical route).
2. If token valid: show **org name**, **inviter** (optional), **plan context** (“You’ll join Acme Realty on the Team plan.”).
3. **Sign up** (or **Continue with Google**) on the same flow; after auth, **auto-accept** invite (single transaction: create/join user + attach org + mark invite accepted).
4. Redirect to **Templates** or **Organization** with success toast.

### 3.3 Invitee: already has account (logged out)

1. Same link → landing explains invite.
2. **Log in** → after login, **accept** (POST) → attach to org if seats available.
3. If already in **another** org → show error consistent with `addUserToOrganization` (“already in another organization”).

### 3.4 Invitee: already logged in as different user

- If logged-in email **≠** invite email: show warning (“This invite is for `x@y.com`. Log out and sign in with that account, or ask admin to resend.”).
- Avoid silently attaching the wrong user.

### 3.5 Admin: revoke / resend

- **Revoke:** pending invite → `revoked`; link stops working.
- **Resend:** new token or extend expiry (policy choice); throttle per invite (e.g. max 3/hour).

---

## 4. Data model (proposed)

New Prisma model (names indicative — adjust to naming conventions):

```prisma
enum OrganizationInviteStatus {
  PENDING
  ACCEPTED
  EXPIRED
  REVOKED
}

model OrganizationInvite {
  id              String   @id @default(cuid())
  organizationId  String
  organization    Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  email           String   // normalized lowercase
  tokenHash       String   @unique // store HASH(token), never raw token in DB
  invitedByUserId String
  invitedBy       User     @relation("InvitesSent", fields: [invitedByUserId], references: [id])

  status          OrganizationInviteStatus @default(PENDING)
  expiresAt       DateTime
  acceptedAt      DateTime?
  acceptedByUserId String?

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([organizationId, email])
  @@index([organizationId, status])
}
```

**Token handling:**

- Generate high-entropy secret (e.g. 32+ bytes), URL-safe.
- Store **only** `SHA-256(token)` (or bcrypt with cost tuned for one-time use) + constant-time compare on accept.
- TTL: e.g. **7 days** default; configurable.

**Seat accounting:**

- **Option A (recommended):** Do **not** decrement “remaining” until **accept**. Prevents seat blocking by abandoned invites.
- **Option B:** “Soft reserve” — optional max pending per org to prevent spam.

---

## 5. API surface (proposed)

All under `api/v1`, JWT unless noted.

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/users/organization/invites` | Create pending invite `{ email }`; send email; return `{ id, email, expiresAt }` (no token in response). |
| `GET` | `/users/organization/invites` | List pending (and recently accepted) for admins. |
| `DELETE` | `/users/organization/invites/:id` | Revoke pending. |
| `POST` | `/users/organization/invites/:id/resend` | Resend email (throttled). |
| `GET` | `/invites/preview?token=...` | **Public:** validate token, return safe metadata `{ orgName, inviteeEmailMasked, expiresAt }` — no auth. |
| `POST` | `/invites/accept` | **Auth required:** `{ token }` — attach user to org, mark invite ACCEPTED, idempotent if already member. |

**Compatibility with today’s endpoint:**

- Keep `POST .../members/invite` as **“add existing user now”**.
- Optional convenience: `POST .../organization/invites` could **branch** — if user exists, either auto-add (current) or still send email (product choice). Document the choice in UX copy.

---

## 6. Email & deep links

- **Provider:** transactional email (Resend, SendGrid, SES, etc.) — align with existing stack when chosen.
- **Template variables:** org name, inviter name, accept URL, expiry date, support link.
- **Accept URL:** `https://{CLIENT_URL}/invite/accept?token={rawToken}`  
  SPA route loads preview → signup/login → calls `POST /invites/accept` with token.

**Environment:**

- `CLIENT_URL`, `INVITE_TOKEN_TTL_DAYS`, email API keys.

---

## 7. Frontend work (incremental)

| Phase | UI |
|-------|-----|
| **P0** | New route `/invite/accept` — token in query, preview from public API, CTA to auth. |
| **P1** | Organization screen: **Send invite** → new API; table **Pending invites** (email, sent date, expiry, actions). |
| **P2** | Post-login handler: if `localStorage` / query has `pending_invite_token`, auto-call accept once. |
| **P3** | Optional: invite-only registration (disable changing email on accept screen). |

Reuse existing **seat cap** UI; on accept failure (409), show same messaging as today (“limit reached / upgrade”).

---

## 8. Security checklist

- [ ] Tokens: cryptographically random; **hashed at rest**; short TTL; one-time use on accept (or allow idempotent repeat for same user).
- [ ] Public preview: no leakage of other users’ PII; mask email (`j***@domain.com`).
- [ ] Rate limit: create invite, resend, accept preview, accept POST (per IP + per org).
- [ ] Authorization: only org members with **admin** role (if introduced) can invite; until roles exist, **any org member** vs **first user only** — **decide explicitly** (recommend: any member for TEAM, or restrict later).
- [ ] Audit log (optional): who invited whom, when accepted.

---

## 9. Edge cases

| Case | Behavior |
|------|----------|
| Invite to email that **registers solo org** first | On accept, **move** user to invited org if allowed; else error + support path. |
| TEAM at cap at accept time | Reject with clear message; admin sees failed state or “expired capacity” analytics. |
| Duplicate invite | Return existing pending or 409 with friendly message. |
| Org deleted | Cascade deletes invites; links 404. |
| Inviter leaves org | Invites remain valid until revoked; optional job to revoke on last-admin leave. |

---

## 10. Implementation phases (suggested order)

1. **Schema + CRUD** — `OrganizationInvite`, migrate, Prisma client.
2. **Public preview + accept (auth)** — core loop without email (manual token in dev).
3. **Transactional email** — wire template + env.
4. **Admin UI** — pending list, revoke, resend; wire **OrganizationScreen** “Send invite” to new endpoint.
5. **Polish** — rate limits, roles, audit, analytics.

---

## 11. References in repo

- `client/src/components/account/OrganizationScreen.tsx` — extend UI here.
- `api/src/modules/users/users.service.ts` — seat logic; add `createInvite` / `acceptInvite` orchestration.
- `api/src/modules/users/users.controller.ts` — new routes; consider `InvitesController` if file grows.
- `api/src/modules/auth/services/auth.service.ts` — optional hook: after register, apply invite token from body.

**Planning docs**

- [NEXT_PHASE_DEVELOPMENT.md](./NEXT_PHASE_DEVELOPMENT.md) — **§6 Organization invite flow** (summary + links)
- [1_WEEK_LAUNCH_PLAN.md](./implementation/1_WEEK_LAUNCH_PLAN.md) — Day 1–2 Task 1.1 (user limits); related docs in header
- [1_WEEK_LAUNCH_TRACKER.md](./implementation/1_WEEK_LAUNCH_TRACKER.md) — verification status vs launch week
- [MVP_LAUNCH_TRACKER.md](./MVP_LAUNCH_TRACKER.md) — executive MVP tracker

---

*This is a design draft; adjust copy, TTLs, and permissions with product/legal review before implementation.*
