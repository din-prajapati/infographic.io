---
title: PRD — {Product or Feature Name}
type: template
tags: [orion, template]
updated: 2026-05-20
---

# PRD — {Product or Feature Name}

> **Author:** {name} · **Date:** YYYY-MM-DD · **Version:** 1.0
> **Status:** 📝 Draft | 👀 Review | ✅ Approved
> **For AI-SDLC consumption:** save this file to `docs/agile/PRD/{slug}.md` and run `/prd-to-roadmap`.

---

## 1. Problem & Opportunity

**Problem we're solving:** {1–3 sentences describing the user pain or business gap}

**Why now:** {Trigger or urgency — market signal, customer ask, regulation, cost pressure, etc.}

**Cost of not doing this:** {What happens if we ship nothing}

---

## 2. Target Users (Personas)

> List every persona the PRD touches. Be concrete. "User" is not a persona.

| Persona ID | Role | Context | Goals | Pain points |
|------------|------|---------|-------|-------------|
| P1 | {e.g., "Solo real estate agent on Free tier"} | {when/where they use the product} | {what they're trying to achieve} | {what blocks them today} |
| P2 | {e.g., "Brokerage admin on TEAM plan"} | | | |

---

## 3. Goals & Non-Goals

### Goals (in this PRD)
- {Specific outcome 1 — measurable}
- {Specific outcome 2 — measurable}
- {Specific outcome 3 — measurable}

### Explicit Non-Goals (NOT in this PRD)
- {Adjacent feature that we are NOT building}
- {Future enhancement deferred to a later PRD}
- {Technical refactor not driven by this PRD}

> **Why this matters for AI-SDLC:** "Out of Scope" propagates from PRD → Epic → Feature → Story. Be ruthless here — every non-goal saves hours of misdirected AI implementation later.

---

## 4. Features

> Group features by business capability. Each feature becomes a candidate `F-{DOMAIN}-{NN}`.
> Mark priority: P0 (launch blocker) · P1 (post-launch) · P2 (nice to have).

### 4.1 Feature: {Name}
**Priority:** P0 | P1 | P2
**Persona:** P1, P2
**Description:** {What users can do when this ships, end-to-end, in one sentence}

**User stories (rough — story-writer will refine):**
- As a {persona}, I want {capability} so that {outcome}
- As a {persona}, I want {capability} so that {outcome}

**Constraints / requirements:**
- {Hard requirement — must be true}
- {Performance / quality threshold}
- {Plan-tier gating, if any}

**Out of scope (for this feature):**
- {Related thing not in this feature}

---

### 4.2 Feature: {Name}
{repeat structure}

---

## 5. Success Metrics

> How will we know this PRD delivered value?

| Metric | Baseline | Target | Measured how |
|--------|----------|--------|--------------|
| {e.g., "Monthly active paid users"} | {current} | {goal} | {analytics source} |
| {e.g., "Generation success rate"} | | | |
| {e.g., "Time to first design"} | | | |

---

## 6. Constraints

### Technical
- {e.g., "Must work on existing Neon free tier — no new infra cost"}
- {e.g., "Must not break the existing /api/v1/* contract"}

### Product / Business
- {e.g., "Launch before Q3 marketing campaign"}
- {e.g., "RazorPay-only — Stripe is post-launch"}

### Regulatory / Compliance
- {e.g., "PII handling per India DPDP Act"}
- {e.g., "No PHI / payment card data stored"}

---

## 7. Dependencies & Risks

### Dependencies
| Type | Description | Owner | Status |
|------|-------------|-------|--------|
| External API | {service or vendor} | {who} | 🔲 / 🟡 / ✅ |
| Internal team | {what we need from another team} | {who} | |
| Design asset | {mockups, brand kit} | {who} | |

### Risks
| Risk | Likelihood | Impact | Mitigation |
|------|:----------:|:------:|------------|
| {what could go wrong} | High/Med/Low | High/Med/Low | {how we reduce it} |

---

## 8. Phasing Hint (Optional)

> If you have an opinion on how this should break into phases/releases, note it here. The `pm-agent` will use this as a starting point but may suggest a different structure.

- **Phase X (v1.0):** {what ships first — the MVP slice}
- **Phase X+1 (v1.1):** {next slice}
- **Phase X+2 (v1.2):** {further refinement}

---

## 9. Open Questions

> Items where the team needs to decide before AI-SDLC can fully decompose.

- [ ] {Question 1 — owner: {name}}
- [ ] {Question 2 — owner: {name}}

---

## 10. Approval

| Role | Name | Approved on |
|------|------|-------------|
| Product | | |
| Engineering | | |
| Design | | |

---

## How to Use This PRD with AI-SDLC

```bash
# 1. Save this PRD to:
#    {paths.prd_inbox}/{slug}.md   (default: docs/agile/PRD/{slug}.md)

# 2. From Claude Code:
/prd-to-roadmap

# 3. Paste this file's content (or just the path) when prompted.
# 4. Review the generated ROADMAP.md and folder tree.
# 5. Iterate — refine ACs via story-writer, design via architect-agent.
```

---

*PRD format version: 1.0 | Loaded by `/prd-to-roadmap`*
