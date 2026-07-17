# ROADMAP — Path to First Revenue and Beyond

> **Created:** 2026-07-07, from the launch-readiness assessment (code done, operations not; charging irresponsible until real-photo pipeline ships).
> **Governing principle:** Two launch moments, not one. **Beta live** (free, disclosed limitations) comes as fast as possible; **revenue on** waits for EPIC-AI-06 — you cannot sell real-estate marketing that can't depict the real estate.
> **See also:** [PHASE_TRACKER.md](PHASE_TRACKER.md) (executive view) · [AGILE_INDEX.md](AGILE_INDEX.md) (epic registry) · [LAUNCH_TIMELINE.md](LAUNCH_TIMELINE.md) (dated timeline: marketable beta in 1–2 days · deploy maturity ~2 wks parallel · revenue ~3–4 wks)

---

## The Ranked Sequence

| Rank | Work item | Why this rank | Effort | Blocks |
|------|-----------|---------------|--------|--------|
| **0** | **Phase 0 close** — 3 HUMAN deploy tasks (critical-path 10-flow manual test · Railway staging smoke · production go-live + Sentry verify) + US-DESIGN-003/004 staging QA | Everything else is theoretical without a production URL. | ~2–3 days (human) | Everything below |
| **1** | **[M-LAUNCH-01-public-beta](epics/phase-1-ai-core/EPIC-LAUNCH-01/milestones/M-LAUNCH-01-public-beta.md)** — US-LAUNCH-001 legal pages · US-LAUNCH-002 email foundation · US-LAUNCH-003 password reset · US-LAUNCH-004 beta mode | The "can't responsibly have users" gaps: no account recovery, no legal pages, and paid checkout must be cleanly off. Legal pages also unblock RazorPay activation review (rank 3). | ~10–12 h | Beta launch |
| **1∥** | **[M-OBS-01-sentry-integration](epics/phase-1-ai-core/EPIC-OBS-00/EPIC.md)** — US-OBS-001/002/003 | Runs parallel to rank 1. First beta user's bug must arrive via Sentry, not WhatsApp. | ~8 h | Beta quality |
| — | 🚀 **BETA LIVE** — free, open, synthetic-photo limitation disclosed via the US-LAUNCH-004 disclaimer | | | |
| **2** | **[EPIC-AI-02](epics/phase-1-ai-core/EPIC-AI-02/EPIC.md) deps** — US-AI-010 photo upload · US-AI-011 format selector | Hard dependencies of EPIC-AI-06. | ~10 h | Rank 3 |
| **3** | **[EPIC-AI-06](epics/phase-1-ai-core/EPIC-AI-06/EPIC.md)** — Hybrid Real-Photo Pipeline (US-AI-031/032/033) | **The chargeability gate.** Agents must market their actual listing photo, not an AI-invented house with a fake headshot. This is what makes the product defensibly paid. | ~30 h | Revenue |
| **3∥** | **[M-LAUNCH-02-revenue-on](epics/phase-1-ai-core/EPIC-LAUNCH-01/milestones/M-LAUNCH-02-revenue-on.md) prep** — US-LAUNCH-005 RazorPay live activation (KYC review has external latency — start early) · US-LAUNCH-006 receipt email · US-LAUNCH-007 BROKERAGE gate (PT-06) · US-LAUNCH-008 metering guard | Mostly ops + small PRs; runs parallel to rank 3. RazorPay activation review needs rank 1's legal pages live. | ~8–10 h + review latency | Revenue |
| — | 💰 **REVENUE ON** — `BETA_MODE=false` only when rank 3 **and** 3∥ are both closed; first real ₹ transaction verified end-to-end (checkout → webhook → ACTIVE → receipt → refund test) | | | |
| **4** | **[EPIC-KIT-01](epics/phase-1-ai-core/EPIC-KIT-01/EPIC.md)** — Listing Marketing Kits | Retention + price justification after revenue starts. | ~45 h | Phase 1 gate |
| **5** | **Phase 2** — EPIC-AI-01 conversational core · EPIC-AI-03 refine loop · EPIC-AI-02 remainder · EPIC-USAGE-01 · EPIC-PAY-02/03 | Polish and self-serve follow revenue. | ~60–80 h | — |

---

## Dependency Map

```
Phase 0 deploy (rank 0)
  ├─→ M-LAUNCH-01 public beta (rank 1) ──→ 🚀 BETA LIVE
  │       └─ US-LAUNCH-001 legal pages ──→ RazorPay activation review (US-LAUNCH-005)
  │       └─ US-LAUNCH-002 EmailService ──→ US-LAUNCH-003 reset · US-LAUNCH-006 receipts
  ├─→ M-OBS-01 Sentry (rank 1∥)
  └─→ US-AI-010/011 (rank 2) ──→ EPIC-AI-06 (rank 3) ──┐
          M-LAUNCH-02 prep (rank 3∥) ────────────────────┴─→ 💰 REVENUE ON ──→ EPIC-KIT-01 (rank 4)
```

---

## What Is Deliberately NOT Blocking

| Item | Why it doesn't block launch |
|------|------------------------------|
| BROKERAGE live plans | Tier gated behind "Contact us" (US-LAUNCH-007); build when the first brokerage asks |
| GST PDF invoicing | Receipt email suffices for launch; `Invoice` model exists for later |
| Stripe | EPIC-PAY-03, Phase 2 — India-first launch is RazorPay-only |
| Waitlist/invite system | Beta is open; FREE tier limit (3/mo) is the natural throttle |
| Usage dashboard, payment-method UI | Phase 2 — polish follows revenue |
| `brainwave_*` localStorage rename | Post-launch cleanup, invisible to users |

---

## Risk Register (launch-specific)

| Risk | Mitigation |
|------|-----------|
| RazorPay live activation review latency (external, days–weeks) | Start US-LAUNCH-005 KYC the moment legal pages are on production — it runs parallel to EPIC-AI-06 |
| Live plans mis-priced (test-mode PT-05 repeat) | US-LAUNCH-005 AC2 requires re-verifying ₹6,999/699900 paise in **live** dashboard |
| Prod accidentally on test keys after env churn | US-LAUNCH-005 AC4 startup assert fails the boot |
| Beta users publish synthetic-photo infographics for real listings | US-LAUNCH-004 disclaimer on every generation result; EPIC-AI-06 is the real fix |
| Email provider outage breaks auth/webhooks | US-LAUNCH-002 AC4 — EmailService never throws |

---

## Parallel Execution Matrix (added 2026-07-07)

> One Claude Code session per story, each in its own **git worktree** on its own branch. Two stories may run in parallel only if they share **no logical dependency AND no file-collision cluster**.

### File-collision clusters (never parallelize within a cluster — serialize by merge instead)

| Cluster | Shared files | Stories in cluster (merge in this order) |
|---------|-------------|------------------------------------------|
| C1 Pricing/routes | `PricingPage.tsx`, `App.tsx` | US-LAUNCH-001 → US-LAUNCH-004 → US-LAUNCH-007 |
| C2 Payments service | `payments.service.ts`, payments controller | US-LAUNCH-004 (guard) → US-LAUNCH-006 → US-LAUNCH-007 (400 path) |
| C3 Auth/App routes | auth module, `App.tsx`, `AuthPage.tsx` | US-LAUNCH-003 (also crosses C1 via App.tsx — merge after US-LAUNCH-001) |
| C4 AI chat panel | `AIChatBox.tsx`, generation request DTO | US-AI-010 → US-AI-011 |
| C5 Generation pipeline | `ai-orchestrator`, `ideogram.service`, prompt builder | US-AI-031 → US-AI-032 / US-AI-033 |

Safe anywhere (no production-code overlap): US-LAUNCH-002 (new module), US-LAUNCH-005 code part (`main.ts` assert), US-LAUNCH-008 (tests+docs only), US-OBS-001 (new interface).

### Waves — maximum safe parallelism (solo review bandwidth: 3–4 lanes)

| Wave | Lane A (frontend) | Lane B (backend) | Lane C (infra/obs) | Lane D (AI) | HUMAN lane |
|------|-------------------|------------------|--------------------|-------------|------------|
| **1** | US-LAUNCH-001 legal pages | US-LAUNCH-002 email module | US-OBS-001 telemetry interface (+US-LAUNCH-008 tests, tiny) | US-AI-010 photo upload | Phase 0 deploy tasks |
| **2** | US-LAUNCH-004 beta mode *(after 001 merges — C1)* | US-LAUNCH-003 password reset *(needs 002; App.tsx after 001)* | US-OBS-002 Sentry backend + US-OBS-003 Sentry frontend *(need 001-OBS)* | US-AI-011 format selector *(after 010 — C4)* | Submit RazorPay KYC *(needs legal pages live)* · beta QA |
| **3** | US-LAUNCH-007 BROKERAGE gate *(after 004 — C1+C2)* | US-LAUNCH-006 receipt email *(after 004 merges — C2; needs 002)* | US-LAUNCH-005 startup assert (tiny) | US-AI-031 real-photo background *(needs 010; L — the long pole)* | 🚀 Beta live announcement |
| **4** | — | — | US-OBS-004 AI metrics *(needs OBS-002)* | US-AI-032 hybrid render + US-AI-033 synthetic guard *(after 031 — C5; 032∥033 possible if 033 scopes to guard logic only)* | US-LAUNCH-005 ops: live plans, webhook, real ₹ test |
| **5** | US-KIT-002 kit UI *(after KIT-001)* | US-KIT-003 preview/finalize *(after KIT-001)* | — | US-KIT-001 orchestration *(needs AI-011)* → then US-KIT-004/005/006 | 💰 Revenue-on flip *(AI-06 + M-LAUNCH-02 both closed)* |

**Zero-dependency starters (Wave 1):** US-LAUNCH-001, US-LAUNCH-002, US-OBS-001, US-AI-010, US-LAUNCH-008 — five stories can begin the moment Phase 0 deploys, none blocks another.

### Worktree protocol

```bash
git worktree add ../ie-launch-001 -b feat/launch-us-launch-001-legal-pages
git worktree add ../ie-launch-002 -b feat/launch-us-launch-002-email-service
# … one per lane; open one Claude Code session per worktree,
# paste that story's "AI Implementation Prompt" from STORY.md
git worktree remove ../ie-launch-001   # after PR merges
```

Rules: one story = one session = one worktree = one PR · only one `npm run dev` at a time (ports 5000/3001) — other lanes verify via `npm run check` + `npm run test:unit`, manual flow checked serially after merge · rebase a lane before starting if its cluster predecessor merged.

---

*Maintained alongside PHASE_TRACKER.md. Update when a rank closes or the gate criteria change.*
