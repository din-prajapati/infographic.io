# Team Status Board — InfographicAI

> **Audience:** Engineering leads and domain teams  
> **Purpose:** Per-domain view of what's in progress, what's next, and what's blocked — mapped to epics and stories.  
> **Update cadence:** When a story status changes (start / block / complete).  
> **Last updated:** 2026-04-15

---

## Board Summary (All Domains)

| Domain | Active Epic | In Progress | Blocked | Upcoming |
|--------|-------------|-------------|---------|----------|
| [Payments (PAY)](#-payments-pay) | EPIC-PAY-01 ✅ Done | — | PT-06 BROKERAGE | EPIC-PAY-02 Phase 1 |
| [Design / Frontend (DESIGN)](#-design--frontend-design) | EPIC-DESIGN-01 🟡 | Open PR / merge US-002 | US-DESIGN-003 (live API) | US-DESIGN-001 human QA |
| [Auth (AUTH)](#-auth-auth) | EPIC-AUTH-01 ✅ Done | — | — | Full invite flow post-MVP |
| [Canvas Editor (EDIT)](#-canvas-editor-edit) | EPIC-EDIT-01 ✅ Done | — | — | Batch upload Phase 3 |
| [AI Generation (AI)](#-ai-generation-ai) | EPIC-AI-01 ✅ Done | — | — | Multi-pass Phase 2 |
| [Infrastructure (INFRA)](#-infrastructure-infra) | EPIC-INFRA-01 🟡 | Phase 0 deploy tasks | — | Admin dashboard Phase 5 |
| [Organization / Team (ORG)](#-organization--team-org) | — | — | — | Full invite flow post-MVP |

---

---

## 💳 Payments (PAY)

**Epic lead:** Dinesh  
**Active epic:** [EPIC-PAY-01](epics/EPIC-PAY-01/EPIC.md) — MVP Payments  
**Phase:** 0 (MVP)

### Now (In Progress)
> No active development. EPIC-PAY-01 code is complete and QA-signed off.

### Done
| Story | Title | PR | Closed |
|-------|-------|-----|--------|
| US-PAY-001 | RazorPay checkout (SOLO + TEAM × M/A) | — | 2026-04-10 ✅ |
| US-PAY-002 | Subscription state machine (PENDING→ACTIVE) | — | 2026-02-28 ✅ |
| US-PAY-003 | Webhook handling (charged, cancelled, failure path) | — | 2026-04-10 ✅ |
| US-PAY-004 | Plan enforcement (usage limits per tier) | — | ✅ |

### Blocked / Deferred
| Issue | Description | Unblocked by |
|-------|-------------|--------------|
| PT-06 | BROKERAGE plan IDs not configured in RazorPay | Create plans in RazorPay dashboard + update `.env` |

### Next (Phase 1 — post Phase 0 gate)
| Epic | Story | Focus |
|------|-------|-------|
| EPIC-PAY-02 | US-PAY-101 | Payment method management UI |

---

## 🎨 Design / Frontend (DESIGN)

**Epic lead:** Dinesh  
**Active epic:** [EPIC-DESIGN-01](epics/EPIC-DESIGN-01/EPIC.md) — UI Design Consistency & Theme  
**Phase:** 0 (MVP)

### Now (In Progress)

| Story | Title | Status | Blocks |
|-------|-------|--------|--------|
| [US-DESIGN-001](epics/EPIC-DESIGN-01/stories/US-DESIGN-001/STORY.md) | Theme system — non-editor screens | 🟡 AC4–7 ✅, AC1–3 🔲 human | Nothing |
| [US-DESIGN-004](epics/EPIC-DESIGN-01/stories/US-DESIGN-004/STORY.md) | Global typography + nav consistency | 🟡 AC1,5 ✅, AC2–4,6 🔲 human | Nothing |

**Ship gate:** Open PR from `feat/design-us-design-002-editor-tokens` → merge **US-DESIGN-002** → record PR # in [STORY.md](epics/EPIC-DESIGN-01/stories/US-DESIGN-002/STORY.md), then run **US-DESIGN-003** staging QA.

### Ready to Start (Next AI Session)

| Story | Title | Notes |
|-------|-------|--------|
| — | After US-002 PR merges | US-DESIGN-003 human TCs (live API) or ad-hoc fixes from staging |

### Blocked (needs external resource)

| Story | Title | Blocked by |
|-------|-------|------------|
| [US-DESIGN-003](epics/EPIC-DESIGN-01/stories/US-DESIGN-003/STORY.md) | AI Generation flow UX states | Live Ideogram API + US-DESIGN-002 must merge first |

### Done (this Epic)
| Story | AC status | PR |
|-------|-----------|-----|
| M-DESIGN-01 QA | ✅ 35 auto-tests run 2026-04-13 | — (QA-only milestone) |
| [US-DESIGN-002](epics/EPIC-DESIGN-01/stories/US-DESIGN-002/STORY.md) | ✅ ACs + TCs per STORY (implementation on branch) | Open PR from `feat/design-us-design-002-editor-tokens` |

---

## 🔐 Auth (AUTH)

**Epic lead:** Dinesh  
**Active epic:** EPIC-AUTH-01 — MVP Auth  
**Phase:** 0 (MVP) ✅ Done

### Now
> No active development.

### Done
| Area | Status |
|------|--------|
| JWT local login + Google OAuth | ✅ |
| User registration + plan assignment | ✅ |
| Organization membership (add/remove members) | ✅ |
| User limit enforcement per plan tier | ✅ |
| Auth unit tests (15 tests) | ✅ |

### Next (Post-MVP — Phase 1+)

| Feature | Phase | Backlog ref |
|---------|-------|-------------|
| Full org invite flow (token link, new users, transactional email) | Post-MVP | [ORGANIZATION_INVITE_FLOW.md](../roadmap/ORGANIZATION_INVITE_FLOW.md) |
| Session management UI | Phase 2 | POST_MVP_BACKLOG.md §2 |

---

## 🖼️ Canvas Editor (EDIT)

**Epic lead:** Dinesh  
**Active epic:** EPIC-EDIT-01 — MVP Canvas Editor  
**Phase:** 0 (MVP) ✅ Done

### Now
> No active development. Design token fix for editor UI is under EPIC-DESIGN-01 (US-DESIGN-002).

### Done
| Area | Status |
|------|--------|
| Canvas renderer (`canvasUtils.ts`, `shapeRenderers.ts`) | ✅ |
| Drag-resize (`react-rnd`) | ✅ |
| Text / Shape / Image elements | ✅ |
| My Designs CRUD | ✅ |
| Export (PNG) | ✅ |

### Known Issue (Not a Bug — Deferred)
> **Theme:** Primary editor chrome + AI chat token work is on **US-DESIGN-002** (EPIC-DESIGN-01). AI Chat is grep-clean for common gray/white utilities; **editor** still has **residual** gray/white Tailwind in secondary UI — see [M-DESIGN-02](epics/EPIC-DESIGN-01/milestones/M-DESIGN-02-editor-tokens.md).

### Next (Phase 3+)
| Feature | Phase | Story |
|---------|-------|-------|
| Progressive generation UI | Phase 3 | EDIT story TBD |
| Batch CSV upload | Phase 3 | EDIT story TBD |
| PDF export | Post-MVP | POST_MVP_BACKLOG.md §3 |
| Template sharing | Post-MVP | POST_MVP_BACKLOG.md §1 |

---

## 🤖 AI Generation (AI)

**Epic lead:** Dinesh  
**Active epic:** EPIC-AI-01 — MVP AI Pipeline  
**Phase:** 0 (MVP) ✅ Done

### Now
> No active development.

### Done
| Area | Status |
|------|--------|
| GPT-4o layout orchestration | ✅ |
| Ideogram image generation | ✅ |
| Socket.io progress streaming | ✅ |
| AI chat conversation history | ✅ |
| Usage enforcement per plan tier | ✅ |
| AI model selector (ideogram-turbo vs ideogram-2) | ✅ |

### AI Generation UX QA (in progress under DESIGN)
> US-DESIGN-003 (EPIC-DESIGN-01) handles the visual UX QA for generation flow states.  
> TC-DS-003-03 to 08 need live Ideogram API — blocked until staging deploy.

### Next (Phase 2+)

| Feature | Phase | Story |
|---------|-------|-------|
| Multi-pass AI refinement | Phase 2 | AI story TBD |
| Quality scoring system | Phase 2 | AI story TBD |
| Intelligent caching (prompt dedup) | Phase 3 | AI story TBD |
| AI model cost optimization | Phase 5 | AI story TBD |

---

## 🏗️ Infrastructure (INFRA)

**Epic lead:** Dinesh  
**Active epic:** EPIC-INFRA-01 — MVP Deployment  
**Phase:** 0 (MVP) 🟡 In Progress

### Now (3 Human Tasks — Phase 0 Blockers)

| Task | Owner | Status | Reference |
|------|-------|--------|-----------|
| Critical-path 10-flow manual test | HUMAN | ⏳ Pending | [testing/MVP_CRITICAL_PATH_QA.md](../testing/MVP_CRITICAL_PATH_QA.md) |
| Staging smoke test (Railway) | HUMAN | ⏳ Pending | [setup/COMPLETE_SETUP_GUIDE.md](../setup/COMPLETE_SETUP_GUIDE.md) |
| Production go-live + Sentry verify | HUMAN | ⏳ Pending (blocked by staging) | Same |

### Done
| Area | Status |
|------|--------|
| Railway project + GitHub deploy secrets | ✅ |
| CI/CD `.github/workflows/deploy.yml` | ✅ |
| Sentry DSN in `.env.example` | ✅ |
| Express + NestJS + Vite 3-server topology | ✅ |
| Neon PostgreSQL (serverless) | ✅ |
| Prisma schema + migrations | ✅ |

### Next (Phase 5+)

| Feature | Phase | Epic |
|---------|-------|------|
| Admin dashboard | Phase 5 | EPIC-INFRA-02 |
| Performance monitoring (New Relic / DataDog) | Phase 5 | EPIC-INFRA-02 |
| Security audit | Phase 6 | EPIC-INFRA-03 |
| Load testing | Phase 6 | EPIC-INFRA-03 |

---

## 👥 Organization / Team (ORG)

**Epic lead:** Dinesh  
**Active epic:** — (no dedicated epic yet; partial features shipped in EPIC-AUTH-01)  
**Phase:** Post-MVP

### Now
> No active development. Org management UI is partially done (Account → Organization).

### Partial (shipped in Phase 0)
| Feature | Status | Notes |
|---------|--------|-------|
| Add/remove org members by email | ✅ | Existing users only |
| Seat meter (slots used / available) | ✅ | Account → Organization |
| Per-plan user limits enforcement | ✅ | Backend + API |

### Blocked / Missing
| Feature | Blocked by | Spec |
|---------|------------|------|
| Full invite flow (token link, new users, transactional email) | No transactional email provider set up | [ORGANIZATION_INVITE_FLOW.md](../roadmap/ORGANIZATION_INVITE_FLOW.md) |
| Multi-agent workspace view | Design + backend epic needed | POST_MVP_BACKLOG.md §2 |
| Shared template library (org-level) | Template sharing backend not built | POST_MVP_BACKLOG.md §1 |

### Next (Post-MVP — Phase 1+)

| Feature | Phase | Epic (to create) |
|---------|-------|------|
| Full org invite flow | Post-MVP / Phase 1 | EPIC-ORG-01 |
| Multi-agent workspace | Phase 2 | EPIC-ORG-02 |
| Shared assets library | Phase 2 | EPIC-ORG-02 |

---

## How to Read This Board

- **Now** = in progress this week — a story branch exists or is about to be created
- **Blocked** = cannot proceed without something external (API access, decision, dependency)
- **Next** = planned, story card exists or needs to be written before next session
- **Done** = shipped and closed in this epic

### When to Update

| Event | Update |
|-------|--------|
| Story branch created | Move story to "Now" in domain section |
| Story blocked | Move to "Blocked", note reason |
| Story PR merged | Move to "Done", note PR number |
| Epic closed | Update domain header "Active epic" → next epic |
| Phase gate passes | Update [PHASE_TRACKER.md](PHASE_TRACKER.md) and this board's summary table |

---

*See also: [PHASE_TRACKER.md](PHASE_TRACKER.md) · [AGILE_INDEX.md](AGILE_INDEX.md) · [../MVP_LAUNCH_TRACKER.md](../MVP_LAUNCH_TRACKER.md)*
