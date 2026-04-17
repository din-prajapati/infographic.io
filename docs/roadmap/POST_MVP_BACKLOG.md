# Next Phase Development - Pending Tasks

> **Purpose:** Track pending features and improvements for the next development phase  
> **Last Updated:** April 6, 2026  
> **Status:** Planning

---

## Executive Summary

This document captures features advertised on the Landing Page and in plan descriptions that are **not yet fully implemented**. It serves as the backlog for the next development phase.

---

## 1. Team Workspace

**Advertised:** Share templates and assets across your entire team seamlessly.

**Current State:**
- ✅ Backend: Organization model, designs saved with `organizationId`
- ✅ API: `/users/organization`, `/users/organization/members`, `/users/organization/slots`
- ❌ UI: No Team Workspace screen for sharing templates between members
- ❌ No shared template library visible in the app

**Pending Tasks:**
- [ ] Team Workspace UI – dedicated page/section for org members to browse shared templates
- [ ] Template sharing flow – "Share with team" action from editor/My Designs
- [ ] Shared assets library – organization-level asset storage
- [ ] Permissions – who can add/edit shared templates

**Effort Estimate:** 2–3 weeks

---

## 2. Multi-Agent Support

**Advertised:** Each agent gets their own workspace with shared resources.

**Current State:**
- ✅ Backend: User limits per plan (5 for Team, unlimited for Brokerage)
- ✅ API: Add/remove org members, remaining slots, invite-by-email for **existing** accounts (`POST .../members/invite`)
- ✅ UI: **Account → Organization** — members, seat meter, add by email (existing users), remove
- ❌ UI: No Multi-Agent workspace or shared resources view
- ⏳ **Full invite flow** (token link, new users, transactional email) — specification in **§6** below

**Pending Tasks:**
- [ ] **Full** invite flow — see [§6 Organization invite flow](#6-organization-invite-flow-full-specification) and [ORGANIZATION_INVITE_FLOW.md](./ORGANIZATION_INVITE_FLOW.md)
- [x] Organization settings page — **partial:** members & slots under Account → Organization
- [ ] Multi-Agent workspace view – per-agent designs with shared resources
- [ ] Shared resources panel – org-level templates, logos, brand kits

**Effort Estimate:** 2–3 weeks

---

## 3. Instant Export – PDF & Print

**Advertised:** PNG, PDF, Print.

**Current State:**
- ✅ PNG export – implemented (`canvasExport.ts`)
- ✅ JPG export – supported
- ❌ PDF export – not implemented
- ❌ Print – no dedicated print flow (browser print only)

**Pending Tasks:**
- [ ] PDF export – render canvas to PDF (e.g. jsPDF, pdf-lib, or html2canvas + canvas)
- [ ] Print-optimized export – A4/letter sizing, print margins
- [ ] Print dialog – "Print" button in editor toolbar with preview

**Effort Estimate:** 1–2 weeks

---

## 4. Advanced Analytics

**Advertised:** (Team plan) "Advanced analytics"

**Current State:**
- ✅ Usage analytics – monthly usage, cost breakdown, usage history
- ❌ No "advanced" analytics (e.g. per-template performance, export analytics)

**Pending Tasks:**
- [ ] Define advanced analytics scope
- [ ] Per-template usage stats
- [ ] Export analytics (formats used, frequency)
- [ ] Dashboard for team/brokerage admins

**Effort Estimate:** 1–2 weeks

---

## 5. Other Improvements

- [ ] **Share button** – EditorToolbar Share button is non-functional
- [ ] **Publish button** – EditorToolbar Publish button is non-functional
- [ ] **Organization brand kit** – Sync `Organization.brandColors`/`logoUrl` with editor Brand Kit
- [ ] **User limit enforcement** – Documented in `docs/ARCHIVE/USER_LIMIT_ENFORCEMENT_GAP.md`; verify backend is fully enforced

---

## 6. Organization invite flow (full specification)

**Goal:** Evolve today’s **add existing user by email** into a complete product flow: pending invites, secure links, signup/login to accept, transactional email, and seat checks at accept time — without replacing current APIs (they remain the fast path).

**Current MVP / launch baseline**

| Capability | Status |
|------------|--------|
| Seat limits (TEAM = 5, etc.) | ✅ `UsersService` / `PLAN_USER_LIMITS` |
| Instant add (user must already exist) | ✅ `POST /api/v1/users/organization/members/invite` + **Account → Organization** |
| Registration join via `organizationId` | ✅ Auth (legacy / internal) |
| Token-based invite, email, `/invite/accept` | ❌ Post-MVP — **draft spec ready** |

**Specification (implement in phases)**

👉 **[ORGANIZATION_INVITE_FLOW.md](./ORGANIZATION_INVITE_FLOW.md)** — data model (`OrganizationInvite`), proposed REST endpoints, security, email/deep links, frontend phases, edge cases.

**Related planning**

- [1_WEEK_LAUNCH_PLAN.md](./implementation/1_WEEK_LAUNCH_PLAN.md) — Day 1–2 Task 1.1 (user limits); related docs in header
- [1_WEEK_LAUNCH_TRACKER.md](./implementation/1_WEEK_LAUNCH_TRACKER.md) — verified status for launch-week tasks
- [MVP_LAUNCH_TRACKER.md](./MVP_LAUNCH_TRACKER.md) — executive MVP checklist

---

## Priority Order

| Priority | Feature              | Effort   | Impact |
|----------|----------------------|----------|--------|
| 1        | PDF & Print export   | 1–2 wks  | High   |
| 2        | Team Workspace UI    | 2–3 wks  | High   |
| 3        | Full org invite flow ([§6](#6-organization-invite-flow-full-specification), [spec](./ORGANIZATION_INVITE_FLOW.md)) | 1–2 wks | High   |
| 4        | Multi-Agent workspace| 2–3 wks  | Medium |
| 5        | Share/Publish buttons| 1–2 d    | Low    |

---

## References

- [USER_LIMIT_ENFORCEMENT_GAP.md](./ARCHIVE/USER_LIMIT_ENFORCEMENT_GAP.md)
- [PRODUCT_ROADMAP.md](./roadmap/PRODUCT_ROADMAP.md)
- [1_WEEK_LAUNCH_PLAN.md](./implementation/1_WEEK_LAUNCH_PLAN.md)
- [1_WEEK_LAUNCH_TRACKER.md](./implementation/1_WEEK_LAUNCH_TRACKER.md)
- [MVP_LAUNCH_TRACKER.md](./MVP_LAUNCH_TRACKER.md)
- [ORGANIZATION_INVITE_FLOW.md](./ORGANIZATION_INVITE_FLOW.md) — full invite flow draft (implements §6)
