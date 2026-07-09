---
title: ORION Rules — INDEX
type: index
tags: [orion, rules]
updated: 2026-05-20
---

# Rules — INDEX

> Living team conventions. Edit as your practices emerge.
> **Load semantics:** agents read `.orion/scaffold.json` (project) or per-story `scaffold.json`, then load only the RULES.md files those declare. Cross-cutting rules in this directory's root files load always.

---

## Cross-cutting (always loaded)

| File | Scope |
|------|-------|
| [AGILE.md](AGILE.md) | Team workflow — sprint cadence, DoD, naming, estimation |
| [DOMAIN.md](DOMAIN.md) | Business rules — invariants that hold regardless of tech |
| [SECURITY.md](SECURITY.md) | Secrets handling, auth at boundaries, OWASP top-10 |
| [OBSERVABILITY.md](OBSERVABILITY.md) | Logging, metrics, tracing, error reporting |

---

## Layered (loaded per scaffold.json)

| Layer | Layer-wide rules | Tech sub-rules |
|-------|------------------|----------------|
| `frontend/` | `RULES.md` (a11y, perf budgets) | `react/`, `vue/`, `tailwind/` |
| `backend/` | `RULES.md` (idempotency, error contracts) | `nestjs/`, `fastapi/`, `express/` |
| `database/` | `RULES.md` (migrations, indexing) | `prisma/`, `drizzle/` |
| `testing/` | `RULES.md` (contract-first, no flakes) | `vitest/`, `playwright/` |
| `platform/` | `RULES.md` (deploy, runtime) | `railway/`, `vercel/` |
| `integrations/` | `RULES.md` (cross-vendor: webhook sigs, idempotency, raw body, no PII logs) | `razorpay/`, `stripe/`, `sentry/` |

---

## Authoring Conventions

1. **One-line rules** — action-oriented (verb-first). "Use Tanstack Query for all reads." Not paragraphs.
2. **Anti-patterns explicitly listed** — many rules are easier as "Don't X" than "Do Y."
3. **Link to ADRs** — if a rule has rationale, link the decision record. Don't re-explain.
4. **Prune relentlessly** — a stale rule is worse than no rule. Re-review monthly.
5. **Stay layer-pure** — frontend rules don't mention backend; cross-cutting rules belong in root files.

---

## How Agents Load Rules

```
agent invocation
  └─ reads scaffold.json (per-story if available, else project)
      └─ loads "always_load" + every file under loaded layer/tech paths
          └─ applies to this stage's output
```

Token cost: a typical React + NestJS + Prisma story loads ~9 rules files (~250 tokens). The same story without scaffold filtering would load 20+ (~600 tokens). **~60% reduction per implement-story call.**
