# Agile Hierarchy — Master Index

> **Entry point for all planning, story, and delivery work.**  
> Full hierarchy: **Phase → Epic → Milestone → Story → Task → PR**  
> Toolchain: GitHub (code + PR) · Linear (issue tracker) · Claude Code (AI implementation)

| I want to see… | Go to |
|----------------|-------|
| **How to use this whole system** | [HOW_TO_USE.md](HOW_TO_USE.md) ← start here |
| **Phase progress (executive view)** | [PHASE_TRACKER.md](PHASE_TRACKER.md) |
| **What is left to build, by phase (hours + confidence)** | [ESTIMATES.md](ESTIMATES.md) |
| **Every task only a human can do (dashboard/DNS/legal/real-money)** | [HUMAN_TASKS.md](HUMAN_TASKS.md) |
| **Domain team board (what's now / next / blocked)** | [TEAM_STATUS.md](TEAM_STATUS.md) |
| **Active story to implement next** | [TEAM_STATUS.md → Design → Ready to Start](TEAM_STATUS.md) |
| **Git branch/commit/PR conventions** | [GIT_STRATEGY.md](GIT_STRATEGY.md) |
| **Phase-assigned non-blocking backlog (BL-NN)** | [BACKLOG.md](BACKLOG.md) |
| **Open a story PR (`gh`, `PR_BODY.md`, templates)** | [guides/STORY_PR_WORKFLOW.md](guides/STORY_PR_WORKFLOW.md) |
| **AI agile cycle: Story → PR (diagram + checklist)** | [guides/STORY_PR_WORKFLOW.md §0](guides/STORY_PR_WORKFLOW.md#0-in-the-ai-assisted-agile-cycle) |
| **Linear + GitHub integration setup** | [LINEAR_GITHUB.md](LINEAR_GITHUB.md) |

---

## How It Fits Together

```
EPIC         = large business outcome (3–8 weeks)
  MILESTONE  = shippable sub-goal within the epic (1–2 weeks)
    STORY    = one user-facing capability (1 AI session / 2–4 h)
      TASK   = one implementation step, mapped to files (≤ 5 files)
        PR   = one merged branch — named by Story or Task
```

Every PR is traceable from `git log` → Story → Milestone → Epic.

---

## Active Epics — Phase 0 MVP

| Epic ID | Title | Status | Stories | Pending |
|---------|-------|--------|---------|---------|
| [EPIC-DESIGN-01](epics/phase-0-mvp/EPIC-DESIGN-01/EPIC.md) | MVP UI Design Consistency & Theme | ✅ Done 2026-10-28 | US-001 ✅ · US-002 ✅ · US-003 ✅ · US-004 ✅ | — |
| [EPIC-DESIGN-02](epics/phase-0-mvp/EPIC-DESIGN-02/EPIC.md) | UI/UX Redesign — Blue/Amber/Warm-Cream Palette | ✅ Done (Phase 0 scope) | US-005–008 ✅ · US-009–011 → [EPIC-DESIGN-03](epics/phase-4-backlog/EPIC-DESIGN-03/EPIC.md) | — |
| [EPIC-DESIGN-04](epics/phase-0.5-foundation/EPIC-DESIGN-04/EPIC.md) | Premium Sample Templates & Brand Customization | ✅ Done | US-012 ✅ | — |
| EPIC-PAY-01 | MVP Payments Live | ✅ Done | All closed | — |
| EPIC-AUTH-01 | MVP Auth (JWT + Google OAuth) | ✅ Done | All closed | — |
| EPIC-EDIT-01 | Canvas Editor (CRUD + export) | ✅ Done | All closed | — |
| EPIC-AI-01 | MVP AI Pipeline (GPT-4o + Ideogram) | ✅ Done | All closed | — |
| EPIC-INFRA-01 | Railway + Sentry + DB migrations | ✅ Done 2026-10-29 | Code ✅ · Tasks 1–3 signed off PASS (Task 3: 2026-10-29) | — |
| [EPIC-AI-07](epics/phase-0-mvp/EPIC-AI-07/EPIC.md) | Generation Progress Delivery Fix — **PT-09** | ✅ Done 2026-07-09 | US-AI-034 ✅ (PR #14, staging-verified) · US-AI-035 ⏭️ superseded | — |

## Phase 1.5 — Property Foundation & V3 Editor (opened 2026-10-29)

> Plan, waves and gate: [epics/phase-1.5-foundation-v3/README.md](epics/phase-1.5-foundation-v3/README.md) · decision: [ADR-003](decisions/ADR-003-phase-1-close-and-phase-1.5.md)

| Epic ID | Title | Status | Stories |
|---------|-------|--------|---------|
| [EPIC-OBS-00](epics/phase-1.5-foundation-v3/EPIC-OBS-00/EPIC.md) | Structured Observability (Sentry · uptime) — moved from Phase 1 | 🟡 0/5 — US-OBS-005 waits on T5 (BL-34); reconcile US-OBS-002/003 against the existing Sentry wiring | US-OBS-001 to US-OBS-005 |
| [EPIC-PROP-01](epics/phase-1.5-foundation-v3/EPIC-PROP-01/EPIC.md) | Property & Brand Foundation (Property record · structured price + intent · Auto-Fill · Brand profile · template contract) | 🔲 0/11 — hardened 2026-10-29 | US-PROP-001 to 006 · US-AI-028 · US-LAUNCH-016/017 · US-EDIT-006/007 |
| [EPIC-EDIT-04](epics/phase-1.5-foundation-v3/EPIC-EDIT-04/EPIC.md) | V3 Editor Simplification (single editable path · linked editing · Design tab · AI Assistant · export review · V3 shell, light + dark · Property/Contact tabs · autosave · Edit Elements review) | 🟡 1/11 — M-EDIT-03 ✅ 2026-10-29 | US-EDIT-008/009 · US-EDIT-020 to 027 · US-AI-015 |

## AI Capability Epics (Phase 0.5 → Phase 3)

| Epic ID | Title | Phase Folder | Status | Effort | Stories |
|---------|-------|-------------|--------|--------|---------|
| [EPIC-AI-00](epics/phase-0.5-foundation/EPIC-AI-00/EPIC.md) | Foundation Fixes (Socket.io · GPT model · Gemini LLM routing · Persistence) | [phase-0.5-foundation](epics/phase-0.5-foundation/) | ✅ Done (closed 2026-07-03, PRs #7–#10) | 22h | US-AI-001/002/002a/005/006 + US-QA-001 — US-AI-003/004 moved to EPIC-AI-08 as B-17 (2026-08-04) |
| [EPIC-AI-01](epics/phase-4-backlog/EPIC-AI-01/EPIC.md) | Conversational AI Core — **moved to the backlog 2026-10-29** (replaced by the V3 AI Assistant) | [phase-4-backlog](epics/phase-4-backlog/) | 🔲 Not Started — US-AI-009 superseded | ~27h | US-AI-007, US-AI-008 |
| [EPIC-AI-02](epics/phase-1-ai-core/EPIC-AI-02/EPIC.md) | Generation Control — US-AI-010/036/037/038/039/040/042 ✅ Done (2026-08-03); US-PANEL-01 ✅ Done (2026-08-05, PR #26); US-AI-011/041 superseded; US-AI-012/013/014 moved to EPIC-AI-08 (Phase 4 Backlog, revenue-gated, 2026-07-30) | [phase-1-ai-core](epics/phase-1-ai-core/) | ✅ Done | — (M-AI-06 closed 2026-08-05) | US-AI-010, US-AI-036 to US-AI-042, US-PANEL-01 |
| [EPIC-AI-03](epics/phase-2-ai-refine/EPIC-AI-03/EPIC.md) | Asset quality (element edit · semantic layer remainder · background removal · print upscale) — re-scoped 2026-10-29 | [phase-2-ai-refine](epics/phase-2-ai-refine/) | 🔲 0/4 — US-AI-015 → EPIC-EDIT-04; 016/018/020 superseded | — | US-AI-017, 019, 021, 022 |
| [EPIC-AI-04](epics/phase-3-ai-advanced/EPIC-AI-04/EPIC.md) | Production Tools (mockup · outpaint · cleanup · Campaign backend) | [phase-3-ai-advanced](epics/phase-3-ai-advanced/) | 🔲 Not Started | ~72h | US-AI-023 to US-AI-026 |
| [EPIC-AI-05](epics/phase-3-ai-advanced/EPIC-AI-05/EPIC.md) | Intelligence Enrichment — re-scoped 2026-10-29 to listing-status tone (US-AI-029) | [phase-3-ai-advanced](epics/phase-3-ai-advanced/) | 🔲 0/1 — US-AI-028 → EPIC-PROP-01, US-AI-027 → backlog, US-AI-030 superseded | — | US-AI-029 |
| [EPIC-ORG-01](epics/phase-3-ai-advanced/EPIC-ORG-01/EPIC.md) | Organization Access Control — **moved to Phase 3 2026-10-29** | [phase-3-ai-advanced](epics/phase-3-ai-advanced/) | 🔲 0/1 | — | US-ORG-001 |
| [EPIC-GEN-01](epics/phase-0.5-foundation/EPIC-GEN-01/EPIC.md) | Generation Quality — V4 Magic-Prompt Pipeline (garble fix · verify/repair · cost markers) + output localisation | [phase-0.5-foundation](epics/phase-0.5-foundation/) | 🟡 **Both milestones ✅ done** — M-GEN-01 (2026-07-07) · M-GEN-02 (US-GEN-003, PR #28, 2026-08-07). **Staging DoD still pending** — pre-dates M-GEN-02, blocks the epic and Phase 0.5 | ~18h | US-GEN-001 to US-GEN-003 |
| [EPIC-AI-06](epics/phase-1-ai-core/EPIC-AI-06/EPIC.md) | Hybrid Real-Photo Pipeline (real photo background · editable overlay · synthetic guard) — **promoted to Phase 1** | [phase-1-ai-core](epics/phase-1-ai-core/) | ✅ **Fully closed 2026-08-15** — both milestones done. M-AI-18 (editable overlay): 10 stories Done/resolved-superseded. M-AI-17 (real-photo composition): US-AI-031/031b's AC1 live-verified same day after an Ideogram credit top-up — real photo confirmed recognizable in the composition, canonical values confirmed rendering correctly over it | ~30h+ | 12 stories under M-AI-18 (9 Done, 1 closed-superseded); 2 stories under M-AI-17 (both Done) |
| [EPIC-KIT-01](epics/phase-2-ai-refine/EPIC-KIT-01/EPIC.md) | Listing Marketing Kits — **moved to Phase 2 2026-10-29**; re-scope on Property + proven templates before implementing | [phase-2-ai-refine](epics/phase-2-ai-refine/) | 🔲 Not Started | ~45h | US-KIT-001 to US-KIT-006 |
| [EPIC-MKT-01](epics/phase-4-backlog/EPIC-MKT-01/EPIC.md) | Market-Aware Generation — **moved to the backlog 2026-10-29** (parked, trigger unchanged) | [phase-4-backlog](epics/phase-4-backlog/) | 🔲 Not Started | ~25–28h | US-MKT-001 to US-MKT-006 |
| [EPIC-LAUNCH-01](epics/phase-1-ai-core/EPIC-LAUNCH-01/EPIC.md) | Go-Live & Revenue Readiness | [phase-1-ai-core](epics/phase-1-ai-core/) | ✅ **Done — 15/15**; US-LAUNCH-016/017 moved to EPIC-PROP-01 2026-10-29 | 0 |
| [EPIC-DEPLOY-01](epics/phase-1-ai-core/EPIC-DEPLOY-01/EPIC.md) | Deployment Velocity & Safety | [phase-1-ai-core](epics/phase-1-ai-core/) | ✅ **Closed at Phase 1 scope 2026-10-29 — 2/7** (US-DEPLOY-004, 007); five open → [EPIC-DEPLOY-02](epics/phase-4-backlog/EPIC-DEPLOY-02/EPIC.md) | — | US-DEPLOY-004, US-DEPLOY-007 |
| [EPIC-INFRA-02](epics/phase-1-ai-core/EPIC-INFRA-02/EPIC.md) | Durable Asset Storage (Cloudflare R2: generated images + composed designs + source photos off Ideogram's expiring URLs / ephemeral tmp dir) — **revenue-on gate blocker, added 2026-08-19** | [phase-1-ai-core](epics/phase-1-ai-core/) | ✅ **Done 2026-10-19** — 3/3 stories, M-INFRA-01 closed, assets verified serving from `assets.buildographic.com` on production | 0 |
| [EPIC-PAY-05](epics/phase-1-ai-core/EPIC-PAY-05/EPIC.md) | Pricing Relaunch | [phase-1-ai-core](epics/phase-1-ai-core/) | ✅ **Closed at Phase 1 scope (V1) 2026-10-29** — 11/11 + 1 superseded; M-PAY-05 on hold (backlog B-24) | — | US-PAY-102 to US-PAY-113 |
| [EPIC-EDIT-03](epics/phase-1-ai-core/EPIC-EDIT-03/EPIC.md) | Editable Design Discoverability | [phase-1-ai-core](epics/phase-1-ai-core/) | ✅ **Closed at Phase 1 scope 2026-10-29 — 10/10** (M-EDIT-01/04/05); open stories → EPIC-EDIT-04 / EPIC-PROP-01 | — | US-EDIT-005, US-EDIT-011 to US-EDIT-019 |

> **Priority order (2026-10-29, [ADR-003](decisions/ADR-003-phase-1-close-and-phase-1.5.md)):** Phase 0 and Phase 1 are closed. ① **Phase 1.5** in waves — M-OBS-01 ∥ M-EDIT-03, then M-PROP-01 ∥ M-PROP-03, then M-EDIT-06 ∥ M-PROP-02, then M-EDIT-07, then M-EDIT-08. ② **Phase 2** — EPIC-KIT-01 (re-scoped) and EPIC-AI-03 asset quality. ③ **Phase 3** — EPIC-AI-04 Campaign Mode, EPIC-ORG-01, EPIC-AI-05. *The 2026-07-07 ranking below is history.*
>
> **Priority order (re-ranked 2026-07-07
>
> **Model opacity rule (all AI epics):** Model names (Nano Banana, Gemini, Flash, Pro) must NEVER appear in any UI label, API response, or user-visible message. Users see: "Quick Generate", "Campaign Quality", "Social", "Print Quality".

## Phase 4 Backlog — Deferred After Phase 3

> **[→ Full backlog with effort + trigger conditions](epics/phase-4-backlog/README.md)**  
> 15 items scoped and intentionally deferred. Promote to active delivery by business trigger, not calendar.

| ID | Item | Domain | Effort | Trigger |
|----|------|--------|--------|---------|
| B-01 | [EPIC-DESIGN-03](epics/phase-4-backlog/EPIC-DESIGN-03/EPIC.md) — M-DESIGN-05 Component Polish (TemplatesPage · Editor · AI Chat) | Design | ~2 wks | Phase 3 gate closes |
| B-02 | PDF & Print Export | Editor | 1–2 wks | Phase 3 gate closes |
| B-03 | Team Workspace UI | ORG | 2–3 wks | 50+ paying users |
| B-04 | Full Org Invite Flow (token · email · accept) | ORG/AUTH | 1–2 wks | 50+ paying users |
| B-05 | Multi-Agent Workspace View | ORG | 2–3 wks | 50+ paying users |
| B-06 | Share & Publish Buttons | Editor | 1–2 days | Phase 3 gate closes |
| B-07 | Org Brand Kit Sync | ORG/Design | 1 wk | 50+ paying users |
| B-08 | B2B API — Key Management | API | 4–6 wks | First B2B inquiry |
| B-09 | B2B API — Webhook System | API | 4–6 wks | First B2B inquiry |
| B-10 | Developer Portal | API | 6–8 wks | First B2B inquiry |
| B-11 | Admin Dashboard | Infra | 6–8 wks | Admin visibility needed |
| B-12 | Performance Optimization (CDN · Redis · jobs) | Infra | 4–6 wks | Cost margin pressure |
| B-13 | Advanced Analytics (usage · AI cost optimization) | Analytics | 3–5 wks | Cost margin pressure |
| B-14 | Production Hardening & Security Audit | Infra | 6–10 wks | Enterprise deal |
| B-15 | Mobile App (React Native or PWA) | Mobile | 10–14 wks | Mobile usage > 30% |
| B-16 | [EPIC-AI-08](epics/phase-4-backlog/EPIC-AI-08/EPIC.md) — M-AI-07 Quality Tiers & Campaign Mode UI (moved from EPIC-AI-02, 2026-07-30) | AI | ~8-10h | First real revenue (M-LAUNCH-02 flips) |
| B-17 | [EPIC-AI-08](epics/phase-4-backlog/EPIC-AI-08/EPIC.md) — M-AI-02 Ideogram → Nano Banana **image**-model swap (moved from EPIC-AI-00, 2026-08-04; the LLM/text half already shipped via PRs #9/#10) | AI | ~6-8h | Image cost/quality pressure |
| B-18 | [US-AI-033](epics/phase-4-backlog/EPIC-AI-08/stories/US-AI-033/STORY.md) — Synthetic-content guard (moved from EPIC-AI-06 / M-AI-17, 2026-08-11). **Scope under review since 2026-08-07 — no agreed scope to build.** Was holding M-AI-17 open via a DoD line only this story could satisfy | AI | TBD — resize after the scope review resolves | Real user demand for synthetic-content controls |
| B-20 | [EPIC-AI-01](epics/phase-4-backlog/EPIC-AI-01/EPIC.md) — Conversational AI Core (moved from Phase 2, 2026-10-29) | AI | ~27h | Agents ask for conversation after using the V3 Assistant |
| B-21 | [EPIC-MKT-01](epics/phase-4-backlog/EPIC-MKT-01/EPIC.md) — Market-Aware Generation (moved from Phase 1, 2026-10-29) | MKT | ~25–28h | Beta shows a market whose output is wrong |
| B-22 | [EPIC-DEPLOY-02](epics/phase-4-backlog/EPIC-DEPLOY-02/EPIC.md) — Deployment Velocity remainder (from EPIC-DEPLOY-01, 2026-10-29) | DEPLOY | ~4 days | The pain is real (e.g. BL-36) |
| B-23 | [US-AI-027](epics/phase-4-backlog/EPIC-AI-08/stories/US-AI-027/STORY.md) — Market data enrichment (from EPIC-AI-05, 2026-10-29) | AI | ~12h | Agents ask for it |
| B-24 | [M-PAY-05](epics/phase-1-ai-core/EPIC-PAY-05/milestones/M-PAY-05-founding-promo-activation.md) — Founding promo activation (on hold since 2026-10-21) | PAY | — | Payment traction |
| B-25 | Speed & Batch — caching · pre-rendering · progressive generation UI · batch CSV upload · job queue · volume pricing (legacy PHASE_TRACKER Phase 3, moved 2026-10-29) | EDIT/INFRA/PAY | ~30–40h | Batch / volume demand |
| B-19 | [EPIC-AI-09](epics/phase-4-backlog/EPIC-AI-09/EPIC.md) — Sample Template Format Expansion (added 2026-08-20). 18 of 23 `formatTaxonomy.ts` formats have zero admin_curated template; likely prerequisite/trigger-adjacent to EPIC-KIT-01 (Kit's own Goal names "WhatsApp card" as a deliverable, no WhatsApp template exists). Stories not yet drafted | AI | ~27-36h (XL — must split ~5-6 stories) | EPIC-KIT-01 pulled forward, or Phase 3 gate closes |

---

## Folder Layout

```
docs/agile/
  AGILE_INDEX.md            ← you are here
  PHASE_TRACKER.md          ← executive phase progress view
  ESTIMATES.md              ← phase-wise remaining effort + readiness audit
  TEAM_STATUS.md            ← per-domain board (now / next / blocked)
  GIT_STRATEGY.md           ← branch / commit / PR / label conventions
  LINEAR_GITHUB.md          ← Linear + GitHub integration setup
  templates/
    EPIC.md                 ← copy → epics/{PHASE}/{EPIC-ID}/EPIC.md
    MILESTONE.md            ← copy → epics/{PHASE}/{EPIC-ID}/milestones/{M-ID}.md
    STORY.md                ← copy → epics/{PHASE}/{EPIC-ID}/stories/{US-ID}/STORY.md
    TASKS.md                ← copy → epics/{PHASE}/{EPIC-ID}/stories/{US-ID}/TASKS.md
  epics/
    phase-0-mvp/            ← EPIC-DESIGN-01, EPIC-DESIGN-02 (v1.0)
    phase-0.5-foundation/   ← EPIC-AI-00 (runs parallel to Phase 0 close)
    phase-1-ai-core/        ← ✅ closed 2026-10-29 — LAUNCH-01, AI-02, AI-06, INFRA-02, PAY-05, EDIT-03, DEPLOY-01
    phase-1.5-foundation-v3/← OBS-00, PROP-01, EDIT-04 (Property foundation + V3 editor)
    phase-2-ai-refine/      ← KIT-01, AI-03 (kits + asset quality)
    phase-3-ai-advanced/    ← AI-04, AI-05, ORG-01
    phase-4-backlog/        ← All deferred items after Phase 3 (15 items, B-01–B-15)
      README.md             ← phase scope, gate criteria, epic list
      {EPIC-ID}/
        EPIC.md             ← epic definition + milestone list + story index
        milestones/
          {M-ID}.md         ← milestone scope, stories in it, DoD
        stories/
          {US-ID}/
            STORY.md        ← story card: ACs, test cases, out-of-scope
            TASKS.md        ← PR-based task breakdown (files, commands, checklist)
            PR-NNN.md       ← created when PR is opened (optional record)
```

---

## Naming Conventions

| Level | Format | Example |
|-------|--------|---------|
| Epic | `EPIC-{DOMAIN}-{NN}` | `EPIC-DESIGN-01` |
| Milestone | `M-{DOMAIN}-{NN}-{slug}` | `M-DESIGN-02-editor-tokens` |
| Story | `US-{DOMAIN}-{NNN}` | `US-DESIGN-002` |
| Task | `T{N}` (within a TASKS.md) | `T1`, `T2` |
| PR branch | `feat/{domain}-{story-slug}` | `feat/design-us-design-002-editor-tokens` |
| Linear issue | Sync with story ID in title | `[US-DESIGN-002] Editor token replacement` |

Domain prefixes: `DESIGN` · `PAY` · `AUTH` · `EDIT` · `AI` · `USAGE` · `INFRA` · `ORG` · `KIT` (listing kits) · `PROP` (property & brand records, added 2026-10-29) · `GEN` (generation quality) · `LAUNCH` (go-live & revenue readiness) · `DEPLOY` (deployment velocity & safety — in use since EPIC-DEPLOY-01, 2026-07-13; not yet added to `PROJECT_CONTEXT.yaml`'s `domains:`/`counters:` lists, flagged 2026-08-15)

---

## Start a New Story (quick-start)

```bash
# 1. Copy templates (replace {PHASE} with e.g. phase-0-mvp, phase-1-ai-core, etc.)
cp docs/agile/templates/STORY.md  docs/agile/epics/{PHASE}/{EPIC-ID}/stories/{US-ID}/STORY.md
cp docs/agile/templates/TASKS.md  docs/agile/epics/{PHASE}/{EPIC-ID}/stories/{US-ID}/TASKS.md

# 2. Fill in STORY.md (5 min — write ACs before opening AI chat)

# 3. Create feature branch
git checkout -b feat/{domain}-{story-slug}

# 4. Paste TASKS.md into AI prompt → implement

# 5. Commit with story ID
git commit -m "feat(domain): what and why — US-{DOMAIN}-{NNN}"

# 6. Open PR → paste story card as PR body
# 7. Merge → update STORY.md status + this index
```

Full protocol: [workflow/AGILE_AI_WORKFLOW.md](../workflow/AGILE_AI_WORKFLOW.md)

---

## Definition of Done (any story)

- [ ] All ACs in STORY.md checked ✅
- [ ] All tasks in TASKS.md checked ✅
- [ ] `npm run check` passes (no TypeScript errors)
- [ ] `npm run test:unit` passes
- [ ] Manual test of changed flow on `localhost:5000`
- [ ] PR merged with story card as description
- [ ] STORY.md status updated to `✅ Done`
- [ ] This index updated (story count / epic status)
- [ ] [docs/MVP_LAUNCH_TRACKER.md](../MVP_LAUNCH_TRACKER.md) updated if applicable
