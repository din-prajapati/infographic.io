# Agile Hierarchy — Master Index

> **Entry point for all planning, story, and delivery work.**  
> Full hierarchy: **Phase → Epic → Milestone → Story → Task → PR**  
> Toolchain: GitHub (code + PR) · Linear (issue tracker) · Claude Code (AI implementation)

| I want to see… | Go to |
|----------------|-------|
| **How to use this whole system** | [HOW_TO_USE.md](HOW_TO_USE.md) ← start here |
| **Phase progress (executive view)** | [PHASE_TRACKER.md](PHASE_TRACKER.md) |
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
| [EPIC-DESIGN-01](epics/phase-0-mvp/EPIC-DESIGN-01/EPIC.md) | MVP UI Design Consistency & Theme | 🟡 In Progress | US-001 ✅ · US-002 ✅ · US-003 🟡 · US-004 🟡 | US-003 AC3 + US-004 ACs (staging) |
| [EPIC-DESIGN-02](epics/phase-0-mvp/EPIC-DESIGN-02/EPIC.md) | UI/UX Redesign — Blue/Amber/Warm-Cream Palette | ✅ Done (Phase 0 scope) | US-005–008 ✅ · US-009–011 → [EPIC-DESIGN-03](epics/phase-4-backlog/EPIC-DESIGN-03/EPIC.md) | — |
| [EPIC-DESIGN-04](epics/phase-0.5-foundation/EPIC-DESIGN-04/EPIC.md) | Premium Sample Templates & Brand Customization | ✅ Done | US-012 ✅ | — |
| EPIC-PAY-01 | MVP Payments Live | ✅ Done | All closed | — |
| EPIC-AUTH-01 | MVP Auth (JWT + Google OAuth) | ✅ Done | All closed | — |
| EPIC-EDIT-01 | Canvas Editor (CRUD + export) | ✅ Done | All closed | — |
| EPIC-AI-01 | MVP AI Pipeline (GPT-4o + Ideogram) | ✅ Done | All closed | — |
| EPIC-INFRA-01 | Railway + Sentry + DB migrations | 🟡 In Progress | Code ✅ | 3 human deploy tasks |
| [EPIC-AI-07](epics/phase-0-mvp/EPIC-AI-07/EPIC.md) | Generation Progress Delivery Fix — **PT-09, launch blocker** | 🟡 Fix in code | US-AI-034 🟡 (fix done, staging re-test pending deploy) · US-AI-035 ⏭️ superseded | Fix implemented + locally verified 2026-07-09; needs deploy to staging to close AC3 |

## AI Capability Epics (Phase 0.5 → Phase 3)

| Epic ID | Title | Phase Folder | Status | Effort | Stories |
|---------|-------|-------------|--------|--------|---------|
| [EPIC-AI-00](epics/phase-0.5-foundation/EPIC-AI-00/EPIC.md) | Foundation Fixes (Socket.io · GPT model · Gemini LLM routing · Persistence) | [phase-0.5-foundation](epics/phase-0.5-foundation/) | ✅ Done (closed 2026-07-03, PRs #7–#10) | 22h | US-AI-001 to US-AI-006 |
| [EPIC-AI-01](epics/phase-2-ai-refine/EPIC-AI-01/EPIC.md) | Conversational AI Core (intent · pre-plan · chips) — demoted to Phase 2 (2026-07-03) | [phase-2-ai-refine](epics/phase-2-ai-refine/) | 🔲 Not Started | ~27h | US-AI-007 to US-AI-009 |
| [EPIC-AI-02](epics/phase-1-ai-core/EPIC-AI-02/EPIC.md) | Generation Control — US-AI-010/011 first (deps of AI-06/KIT-01); rest → Phase 2 | [phase-1-ai-core](epics/phase-1-ai-core/) | 🔲 Not Started | ~24h | US-AI-010 to US-AI-014 |
| [EPIC-AI-03](epics/phase-2-ai-refine/EPIC-AI-03/EPIC.md) | Refine Loop (quick refine · element edit · R2 storage · media tools) | [phase-2-ai-refine](epics/phase-2-ai-refine/) | 🔲 Not Started | ~97h | US-AI-015 to US-AI-022 |
| [EPIC-AI-04](epics/phase-3-ai-advanced/EPIC-AI-04/EPIC.md) | Production Tools (mockup · outpaint · cleanup · Campaign backend) | [phase-3-ai-advanced](epics/phase-3-ai-advanced/) | 🔲 Not Started | ~72h | US-AI-023 to US-AI-026 |
| [EPIC-AI-05](epics/phase-3-ai-advanced/EPIC-AI-05/EPIC.md) | Intelligence Enrichment (market data · agent profile · tone · search) | [phase-3-ai-advanced](epics/phase-3-ai-advanced/) | 🔲 Not Started | ~38h | US-AI-027 to US-AI-030 |
| [EPIC-GEN-01](epics/phase-0.5-foundation/EPIC-GEN-01/EPIC.md) | Generation Quality — V4 Magic-Prompt Pipeline (garble fix · verify/repair · cost markers) | [phase-0.5-foundation](epics/phase-0.5-foundation/) | 🟡 M-GEN-01 ✅ done (2/2 stories, cost verified $0) — staging DoD pending | ~8h | US-GEN-001 to US-GEN-002 |
| [EPIC-AI-06](epics/phase-1-ai-core/EPIC-AI-06/EPIC.md) | Hybrid Real-Photo Pipeline (real photo background · editable overlay · synthetic guard) — **promoted to Phase 1** | [phase-1-ai-core](epics/phase-1-ai-core/) | 🔲 Not Started | ~30h | US-AI-031 to US-AI-033 |
| [EPIC-KIT-01](epics/phase-1-ai-core/EPIC-KIT-01/EPIC.md) | Listing Marketing Kits (multi-format batch · lifecycle · recurring content · compliance) — **promoted to Phase 1** | [phase-1-ai-core](epics/phase-1-ai-core/) | 🔲 Not Started | ~45h | US-KIT-001 to US-KIT-006 |
| [EPIC-LAUNCH-01](epics/phase-1-ai-core/EPIC-LAUNCH-01/EPIC.md) | Go-Live & Revenue Readiness (RazorPay live · email + password reset · legal pages · beta mode · metering) — **Phase 1 priority #1, added 2026-07-07** | [phase-1-ai-core](epics/phase-1-ai-core/) | 🔲 Not Started | ~20h + ops | US-LAUNCH-001 to US-LAUNCH-008 |

> **Priority order (re-ranked 2026-07-07 — launch-readiness assessment; see [ROADMAP.md](ROADMAP.md)):** ① Phase 0 close (3 HUMAN deploy tasks + staging QA — EPIC-INFRA-01). ② EPIC-LAUNCH-01 M-LAUNCH-01 (public beta: legal pages, email, password reset, beta flag) with EPIC-OBS-00 M-OBS-01 in parallel — beta goes live here. ③ US-AI-010/011 (deps) → EPIC-AI-06 (real-photo pipeline — the chargeability gate), with EPIC-LAUNCH-01 M-LAUNCH-02 prep (RazorPay live activation) in parallel. ④ Revenue-on flip: BETA_MODE off once AI-06 + M-LAUNCH-02 close. ⑤ EPIC-KIT-01. EPIC-AI-01 + EPIC-AI-02 remainder + EPIC-AI-03 follow in Phase 2; EPIC-AI-04/05 Month 6–12. Rationale: [docs/research/2026-07-03-V4-PIPELINE-FIX-AND-PRODUCT-STRATEGY.md](../research/2026-07-03-V4-PIPELINE-FIX-AND-PRODUCT-STRATEGY.md) + 2026-07-07 launch-readiness verdict.
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

---

## Folder Layout

```
docs/agile/
  AGILE_INDEX.md            ← you are here
  PHASE_TRACKER.md          ← executive phase progress view
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
    phase-1-ai-core/        ← EPIC-AI-01, EPIC-AI-02 (post-launch)
    phase-2-ai-refine/      ← EPIC-AI-03 (month 3–6)
    phase-3-ai-advanced/    ← EPIC-AI-04, EPIC-AI-05 (month 6–12)
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

Domain prefixes: `DESIGN` · `PAY` · `AUTH` · `EDIT` · `AI` · `USAGE` · `INFRA` · `ORG` · `KIT` (listing kits) · `GEN` (generation quality) · `LAUNCH` (go-live & revenue readiness)

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
