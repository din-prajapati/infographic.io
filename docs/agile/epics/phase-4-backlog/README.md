# Phase 4 — Future Backlog

> **What this folder is:** A holding area for all features that are scoped, understood, and intentionally deferred past Phase 3 AI Advanced. Nothing here is abandoned — each item has a source document, an effort estimate, and a trigger condition for when to pull it into active delivery.
>
> **When to pull items:** After Phase 3 AI Advanced gate closes. Prioritise by business signal (user requests, revenue impact, competitor moves) rather than technical readiness.
>
> **Sources:** [PRODUCT_ROADMAP.md](../../../roadmap/PRODUCT_ROADMAP.md) · [POST_MVP_BACKLOG.md](../../../roadmap/POST_MVP_BACKLOG.md) · [PHASE_TRACKER.md](../../PHASE_TRACKER.md)

---

## Backlog Index

| # | Item | Domain | Effort | Impact | Source |
|---|------|--------|--------|--------|--------|
| B-01 | [EPIC-DESIGN-03 — Component Visual Polish](#b-01--m-design-05--component-visual-polish) | Design | ~2 wks | High | EPIC-DESIGN-03 |
| B-02 | [PDF & Print Export](#b-02--pdf--print-export) | Editor | 1–2 wks | High | POST_MVP_BACKLOG §3 |
| B-03 | [Team Workspace UI](#b-03--team-workspace-ui) | ORG | 2–3 wks | High | POST_MVP_BACKLOG §1 |
| B-04 | [Full Org Invite Flow](#b-04--full-org-invite-flow) | ORG/AUTH | 1–2 wks | High | POST_MVP_BACKLOG §6 |
| B-05 | [Multi-Agent Workspace View](#b-05--multi-agent-workspace-view) | ORG | 2–3 wks | Medium | POST_MVP_BACKLOG §2 |
| B-06 | [Share & Publish Buttons](#b-06--share--publish-buttons) | Editor | 1–2 days | Low | POST_MVP_BACKLOG §5 |
| B-07 | [Organization Brand Kit Sync](#b-07--organization-brand-kit-sync) | ORG/Design | 1 wk | Medium | POST_MVP_BACKLOG §5 |
| B-08 | [B2B API — Key Management](#b-08--b2b-api--key-management) | API | 4–6 wks | High | PRODUCT_ROADMAP §2.0 |
| B-09 | [B2B API — Webhook System](#b-09--b2b-api--webhook-system) | API | 4–6 wks | High | PRODUCT_ROADMAP §2.0 |
| B-10 | [Developer Portal](#b-10--developer-portal) | API | 6–8 wks | Medium | PRODUCT_ROADMAP §2.0 |
| B-11 | [Admin Dashboard](#b-11--admin-dashboard) | Infra | 6–8 wks | High | PRODUCT_ROADMAP §2.1 |
| B-12 | [Performance Optimization](#b-12--performance-optimization) | Infra | 4–6 wks | High | PRODUCT_ROADMAP §2.1 |
| B-13 | [Advanced Analytics — Usage & AI](#b-13--advanced-analytics--usage--ai) | Analytics | 3–5 wks | Medium | POST_MVP_BACKLOG §4 |
| B-14 | [Production Hardening & Security](#b-14--production-hardening--security) | Infra | 6–10 wks | Critical | PRODUCT_ROADMAP §2.2 |
| B-15 | [Mobile App](#b-15--mobile-app) | Mobile | 10–14 wks | Medium | PRODUCT_ROADMAP §2.2 |

---

## Design

### B-01 — EPIC-DESIGN-03 — Component Visual Polish

**Epic:** [EPIC-DESIGN-03](EPIC-DESIGN-03/EPIC.md)  
**Milestone:** [M-DESIGN-05](EPIC-DESIGN-03/milestones/M-DESIGN-05-component-polish.md)  
**Deferred from:** EPIC-DESIGN-02 (decision: 2026-04-25)  
**Prereq:** M-DESIGN-04 ✅ (domain color tokens in place)  
**Effort:** ~2 weeks (3 stories)

Apply component-specific tokens from `design-tokens.css` to the three main UI surfaces. No logic or layout changes — CSS class and inline-style updates only.

| Story | Surface | Key changes |
|-------|---------|-------------|
| [US-DESIGN-009](EPIC-DESIGN-03/stories/US-DESIGN-009/STORY.md) | TemplatesPage | Filter pills, card headers, category dots, CTA button, search bar |
| [US-DESIGN-010](EPIC-DESIGN-03/stories/US-DESIGN-010/STORY.md) | Canvas Editor | Floating toolbar (dark pill), layer sidebar (white panel), selection stroke |
| [US-DESIGN-011](EPIC-DESIGN-03/stories/US-DESIGN-011/STORY.md) | AI Chat Panel | Promo banner (lime), user bubble (blue), AI bubble (warm grey), chips |

**Files:** `TemplatesPage.tsx` · `FloatingToolbar.tsx` · `LayersPanel.tsx` · `AIChatBox.tsx`  
**Reference previews:** `design-preview-templates.html` · `design-preview-canvas.html`

---

## Editor / Export

### B-02 — PDF & Print Export

**Advertised in plan:** "PNG, PDF, Print"  
**Current state:** PNG ✅ · JPG ✅ · PDF ❌ · Print ❌  
**Effort:** 1–2 weeks

| Task | Approach |
|------|----------|
| PDF export | jsPDF or pdf-lib render from canvas |
| Print-optimized sizing | A4/letter + print margins |
| Print dialog | "Print" button in editor toolbar with preview |

**Files:** `client/src/lib/canvasExport.ts` · `EditorToolbar.tsx`

### B-06 — Share & Publish Buttons

**Current state:** Buttons exist in toolbar but are non-functional  
**Effort:** 1–2 days (stub → real action)

- Share button: generate shareable link or copy-to-clipboard
- Publish button: publish design to public gallery or export

---

## Organization / Team

### B-03 — Team Workspace UI

**Advertised:** "Share templates and assets across your entire team seamlessly."  
**Current state:** Backend org model ✅ · API ✅ · UI ❌  
**Effort:** 2–3 weeks

| Task | Description |
|------|-------------|
| Team Workspace page | Dedicated section for org members to browse shared templates |
| Share-with-team action | "Share" action from editor / My Designs |
| Shared assets library | Org-level asset storage (logos, images, brand kits) |
| Permissions | Who can add/edit shared templates |

### B-04 — Full Org Invite Flow

**Current state:** Add-existing-user-by-email ✅ · Token invite + email ❌  
**Effort:** 1–2 weeks  
**Full spec:** [ORGANIZATION_INVITE_FLOW.md](../../../roadmap/ORGANIZATION_INVITE_FLOW.md)

| Phase | Scope |
|-------|-------|
| 1 | `OrganizationInvite` model + pending state |
| 2 | Token-based `/invite/accept` endpoint |
| 3 | Transactional email (invite link, new user signup to accept) |
| 4 | Seat check at accept time |

### B-05 — Multi-Agent Workspace View

**Advertised:** "Each agent gets their own workspace with shared resources."  
**Current state:** Seat limits ✅ · Per-agent workspace view ❌  
**Effort:** 2–3 weeks

- Per-agent designs with shared org resources panel
- Shared brand kits, logos, templates at org level
- Filtered My Designs view per org member

### B-07 — Organization Brand Kit Sync

**Current state:** `Organization.brandColors` / `logoUrl` fields exist but not surfaced in editor Brand Kit  
**Effort:** ~1 week

- Sync org-level brand colors into editor color palette
- Org logoUrl auto-populated in editor Brand Kit
- Admin sets org defaults; member editors inherit

---

## B2B API

### B-08 — B2B API — Key Management

**Effort:** 4–6 weeks (~23–34h)  
**Planned epic:** EPIC-API-01  
**Phase tracker:** Product Phase 4 (Release 2.0)

| Feature | Detail |
|---------|--------|
| API key generation UI | Create / name / describe keys per org |
| Key rotation / regeneration | Invalidate old, issue new |
| Key permissions & scoping | Read / write / generate |
| Rate limiting per key | Tier-based quotas |
| Usage analytics per key | Requests, cost, errors |
| Multiple keys per org | Up to plan limit |

### B-09 — B2B API — Webhook System

**Effort:** 4–6 weeks (~25–35h)  
**Planned epic:** EPIC-API-01 (webhook module)

| Feature | Detail |
|---------|--------|
| Webhook config UI | URL, event selection, secret |
| Event types | `generation.completed` · `generation.failed` · `subscription.*` |
| Delivery with retries | Exponential backoff, 3 attempts |
| Signature verification | HMAC-SHA256 header |
| Webhook logs dashboard | Last 100 deliveries, status, payload |
| Failed delivery alerts | Email on consecutive failures |

### B-10 — Developer Portal

**Effort:** 6–8 weeks (~37–56h)

| Feature | Detail |
|---------|--------|
| Expanded API docs | All endpoints, auth, errors, rate limits |
| Interactive API explorer | Try-it-now in browser |
| Code examples | TypeScript, Python, cURL |
| Postman collection | Downloadable |
| SDK | TypeScript/JavaScript client |
| Sandbox environment | Test generation without billing |
| API versioning strategy | `/v1` locked; `/v2` migration path |

---

## Analytics & Admin

### B-11 — Admin Dashboard

**Effort:** 6–8 weeks (~48–68h)  
**Planned epic:** EPIC-INFRA-02 (Product Phase 5)

| Feature | Detail |
|---------|--------|
| Revenue analytics | MRR, churn, ARPU by tier |
| User growth metrics | Signups, activations, DAU/MAU |
| Generation metrics | Volume, model mix, error rate |
| Cost tracking | AI spend per request, per user, per tier |
| Customer segmentation | By plan, usage, tenure |

### B-13 — Advanced Analytics — Usage & AI

**Current state:** Monthly usage chart ✅ · Cost breakdown ✅ · Advanced ❌  
**Effort:** 3–5 weeks

| Feature | Detail |
|---------|--------|
| Per-template performance | Which templates generate most, best-rated |
| Export analytics | Format frequency, download count |
| Historical reports | Month-over-month trends |
| Export usage data | CSV download |
| AI model A/B testing | Quality score comparison across models |
| Cost optimization algorithm | Auto-route to cheapest model meeting quality bar |

---

## Infrastructure

### B-12 — Performance Optimization

**Effort:** 4–6 weeks (~38–58h)

| Feature | Detail |
|---------|--------|
| CDN integration | Serve generated images from Cloudflare CDN |
| Redis caching | Prompt dedup, session cache, rate limit counters |
| Database query optimization | Index review, N+1 fix, pagination |
| Background job queue | Bull/BullMQ for generation jobs |
| Load testing | 100+ concurrent users, identify bottlenecks |

### B-14 — Production Hardening & Security

**Effort:** 6–10 weeks (~70–110h)  
**Planned epic:** EPIC-INFRA-03 (Product Phase 6)

| Feature | Detail |
|---------|--------|
| Security audit | OWASP top-10 review |
| Penetration testing | External vendor |
| Rate limiting middleware | Per-IP + per-user |
| DDoS protection | Cloudflare |
| Database backup strategy | Daily snapshot + point-in-time recovery |
| Full test coverage | Unit + integration + E2E to 80%+ |
| 99.9% uptime SLA | Alerting, runbooks, on-call rotation |

---

## Mobile

### B-15 — Mobile App

**Effort:** 10–14 weeks (~70–100h)  
**Planned epic:** EPIC-MOBILE-01 (Product Phase 6)

| Feature | Detail |
|---------|--------|
| React Native or PWA | Decision gate: usage share mobile vs desktop |
| Quick generation | Simplified form for mobile |
| OCR scanning | Photograph listing sheet → auto-fill form |
| Voice input | Speak property details |
| Push notifications | Generation complete alerts |
| Offline support | View previously generated infographics |

---

## Trigger Conditions (when to promote to active delivery)

| Trigger | Item(s) to pull |
|---------|-----------------|
| Phase 3 AI Advanced gate closes | B-01 (design polish), B-02 (PDF export) |
| 50+ paying users | B-03, B-04 (team workspace + invites) |
| First B2B customer inquiry | B-08, B-09 (API keys + webhooks) |
| Admin visibility needed | B-11, B-13 (dashboards + analytics) |
| Cost margin pressure | B-12, B-13 AI optimization |
| Enterprise deal in pipeline | B-14 (security audit + SLA) |
| Mobile usage > 30% | B-15 (mobile app) |

---

*Phase 4 Backlog created: 2026-04-29 · Sources: PRODUCT_ROADMAP.md · POST_MVP_BACKLOG.md · PHASE_TRACKER.md*
