# InfographicAI — North Star Document

> **This is the single entry point for everything.** Read the status block, pick your next action, and drill down only as far as you need.
> Last synced: 2026-04-13

---

## What Is This Product?

**InfographicAI** is a real-estate infographic SaaS. Users describe a property or campaign and the app generates a branded infographic (OpenAI GPT-4o + Ideogram image). Subscriptions are managed via RazorPay (INR). The canvas editor lets users also build designs manually. Target users: solo agents → brokerages → API consumers.

---

## Current Status — At a Glance

| Signal | Value |
|--------|-------|
| **MVP completion** | ~98% — code and payments complete |
| **Blocking human tasks** | 3 (critical-path smoke test · staging deploy · prod go-live) |
| **Known deferred issue** | PT-06: BROKERAGE plan IDs not configured in RazorPay |
| **Payments signed off** | SOLO + TEAM monthly/annual — checklist closed 2026-04-10 |
| **CI/CD** | Railway configured, Sentry DSN set |
| **Post-MVP phase** | Phase 1 (usage analytics) starts after production go-live |

**3 actions to launch MVP:**
1. Run critical-path 10-flow manual test → [docs/testing/MVP_CRITICAL_PATH_QA.md](testing/MVP_CRITICAL_PATH_QA.md)
2. Staging smoke test (Railway) → [docs/setup/COMPLETE_SETUP_GUIDE.md](setup/COMPLETE_SETUP_GUIDE.md)
3. Production go-live + Sentry verify → same guide

**Detailed status tracking:** [docs/MVP_LAUNCH_TRACKER.md](MVP_LAUNCH_TRACKER.md)

---

## Documentation Map — Drill Down From Here

### Where Are We Going?
| Document | What's Inside |
|----------|---------------|
| [roadmap/PRODUCT_ROADMAP.md](roadmap/PRODUCT_ROADMAP.md) | Phase 0 (MVP) through Phase 6 — all releases, effort, timelines |
| [roadmap/POST_MVP_BACKLOG.md](roadmap/POST_MVP_BACKLOG.md) | Feature backlog: team workspace, PDF export, invite flow, analytics |
| [roadmap/ORGANIZATION_INVITE_FLOW.md](roadmap/ORGANIZATION_INVITE_FLOW.md) | Full org invite spec (token link, new users, email) — post-MVP |

### What Is the Current Status?
| Document | What's Inside |
|----------|---------------|
| [MVP_LAUNCH_TRACKER.md](MVP_LAUNCH_TRACKER.md) | Phase-by-phase task tracker, known issues (PT-xx), testing matrix |

### Executive & Phase View
| Document | What's Inside |
|----------|---------------|
| [agile/PHASE_TRACKER.md](agile/PHASE_TRACKER.md) | **Phase 0–6 progress** — % complete, business outcomes, phase gates (executive view) |
| [agile/TEAM_STATUS.md](agile/TEAM_STATUS.md) | **Per-domain board** — PAY / DESIGN / AUTH / EDIT / AI / INFRA / ORG: now, next, blocked |

### How Do We Build?
| Document | What's Inside |
|----------|---------------|
| [agile/HOW_TO_USE.md](agile/HOW_TO_USE.md) | **Start here** — step-by-step guide for the full hybrid workflow |
| [agile/AGILE_INDEX.md](agile/AGILE_INDEX.md) | Master index — hierarchy navigation, quick-start, active epics |
| [agile/GIT_STRATEGY.md](agile/GIT_STRATEGY.md) | Branch naming, commit format, PR template, Linear/GitHub labels |
| [agile/LINEAR_GITHUB.md](agile/LINEAR_GITHUB.md) | Linear + GitHub integration setup and day-to-day workflow |
| [workflow/AGILE_AI_WORKFLOW.md](workflow/AGILE_AI_WORKFLOW.md) | How to run PR-based Agile with AI assistants (vibe coding discipline) |
| [workflow/AGILE_QA_WORKFLOW.md](workflow/AGILE_QA_WORKFLOW.md) | Epic → Feature → Story → TC hierarchy, DoD template |

### How Do We Test?
| Document | What's Inside |
|----------|---------------|
| [payments/PAYMENT_TEST_CHECKLIST.md](payments/PAYMENT_TEST_CHECKLIST.md) | 40-row checklist — SOLO/TEAM × monthly/annual, webhooks, signed off Apr 2026 |
| [payments/PAYMENT_AUTOMATED_TESTING.md](payments/PAYMENT_AUTOMATED_TESTING.md) | Automated payment test runbook (`npm run test:payment`) |
| [testing/MVP_CRITICAL_PATH_QA.md](testing/MVP_CRITICAL_PATH_QA.md) | 10 critical-path flows to run before production |
| [testing/INFOGRAPHIC_AI_TEST_PLAYBOOK.md](testing/INFOGRAPHIC_AI_TEST_PLAYBOOK.md) | NestJS/React/Prisma-specific test playbook (821 lines) |
| [testing/SAAS_TEST_PLAYBOOK_GENERAL.md](testing/SAAS_TEST_PLAYBOOK_GENERAL.md) | Reusable SaaS test patterns (auth, billing, usage limits) |

### How Is It Built?
| Document | What's Inside |
|----------|---------------|
| [architecture/CODEBASE_CONTEXT.md](architecture/CODEBASE_CONTEXT.md) | Full system map: modules, flows, env vars, file index (434 lines) |
| [architecture/ARCHITECTURE_RECOMMENDATIONS.md](architecture/ARCHITECTURE_RECOMMENDATIONS.md) | Tech debt notes and improvement recommendations |
| [CLAUDE.md](../CLAUDE.md) | Commands, module map, payment flow — written for AI assistants |

### How Do I Set It Up?
| Document | What's Inside |
|----------|---------------|
| [setup/COMPLETE_SETUP_GUIDE.md](setup/COMPLETE_SETUP_GUIDE.md) | Full local + Railway deployment setup |
| [setup/ENV_SINGLE_SOURCE_OF_TRUTH.md](setup/ENV_SINGLE_SOURCE_OF_TRUTH.md) | Every env var explained, required vs optional |
| [setup/HYBRID_SETUP.md](setup/HYBRID_SETUP.md) | Cursor + Replit hybrid dev setup (historical context) |

### How Do Payments Work?
| Document | What's Inside |
|----------|---------------|
| [payments/PAYMENT_INTEGRATION.md](payments/PAYMENT_INTEGRATION.md) | Multi-provider architecture (RazorPay primary, Stripe secondary) |
| [payments/RAZORPAY_SETUP_GUIDE.md](payments/RAZORPAY_SETUP_GUIDE.md) | RazorPay account, plans, key configuration |
| [payments/RAZORPAY_WEBHOOK_SETUP_GUIDE.md](payments/RAZORPAY_WEBHOOK_SETUP_GUIDE.md) | Webhook setup: tunnel, events, signature verification |

### Business Context
| Document | What's Inside |
|----------|---------------|
| [business/BUSINESS_FEASIBILITY_REPORT.md](business/BUSINESS_FEASIBILITY_REPORT.md) | C-suite feasibility analysis, unit economics |
| [business/COMPREHENSIVE_PRICING_ANALYSIS.md](business/COMPREHENSIVE_PRICING_ANALYSIS.md) | Pricing strategy and competitive analysis |
| [business/GAP_CLOSING_STRATEGY.md](business/GAP_CLOSING_STRATEGY.md) | Competitive gap analysis and closure plan |

### Design System
| Document | What's Inside |
|----------|---------------|
| [design/DESIGN_GUIDELINES.md](design/DESIGN_GUIDELINES.md) | Color palette, typography, glassmorphism system, component specs |

---

## Plan Tiers (Quick Reference)

| Tier | Limit/mo | Price |
|------|----------|-------|
| FREE | 3 | — |
| SOLO | 50 | ₹2,499/mo |
| TEAM | 200 | ₹6,999/mo |
| BROKERAGE | 1,000 | TBD (PT-06) |
| API_STARTER | 5,000 | — |
| API_GROWTH | 20,000 | — |
| API_ENTERPRISE | unlimited | — |

---

## Active Stories

| Story | Status | Focus |
|-------|--------|-------|
| [US-DESIGN-001](agile/epics/EPIC-DESIGN-01/stories/US-DESIGN-001/STORY.md) | 🟡 AC4–7 ✅, AC1–3 🔲 human | Theme system — manual walk-through pending |
| [US-DESIGN-002](agile/epics/EPIC-DESIGN-01/stories/US-DESIGN-002/STORY.md) | 🔲 Ready to start | Editor token replacement — next AI session |
| [US-DESIGN-003](agile/epics/EPIC-DESIGN-01/stories/US-DESIGN-003/STORY.md) | 🟡 Blocked | AI Generation QA — blocked on live Ideogram API + US-DESIGN-002 |
| [US-DESIGN-004](agile/epics/EPIC-DESIGN-01/stories/US-DESIGN-004/STORY.md) | 🟡 AC1,5 ✅, AC2–4,6 🔲 human | Page consistency — human spot-checks pending |

**Epic:** [EPIC-DESIGN-01 — MVP UI Design Consistency](agile/epics/EPIC-DESIGN-01/EPIC.md)  
**Legacy combined story card:** [stories/DESIGN-001_ui-design-consistency.md](stories/DESIGN-001_ui-design-consistency.md) (archived — individual stories above are canonical)

---

## Archived Material

Historical phase-completion logs, fix notes, and superseded trackers are in [ARCHIVE/](ARCHIVE/). They are not needed for day-to-day work. Do not delete — they contain git-traceable decisions.

---

*To update this document: edit the "Current Status" block and the 3-action list whenever a milestone changes. Everything else in this file should stay stable.*
