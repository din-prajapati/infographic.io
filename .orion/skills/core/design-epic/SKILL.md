---
name: design-epic
version: 2.0.0
description: >
  Stage 2 of the AI-SDLC pipeline. Invoke architect-agent to fill the
  ARCHITECTURE.mmd diagram (with classDef styling), ENV.yaml requirements
  (real entries, not stubs), technical risk matrix, effort estimate, and
  "Files Touched (predicted)" table inside EPIC.md.
triggers:
  - "design epic"
  - "architecture for"
  - "design architecture"
  - "tech approach for"
  - "design EPIC-"
domains:
  - all
agents:
  - architect-agent
---

# Skill: design-epic

## Purpose

Take an Epic that was scaffolded by `/new-epic` or `/prd-to-roadmap` (with stubs only) and produce the full architectural design: diagram with classDef styling, env vars, risks, effort estimate, and a predicted Files-Touched table.

## Input

Required:
- **Epic ID**

Optional:
- **Focus areas** (e.g., "focus on auth boundary risks")

## Protocol

### Step 1 — Load Context

Read:
- `{paths.epics}/{phase}/{EPIC-ID}/EPIC.md` — the goal and outcome
- `{paths.epics}/{phase}/{EPIC-ID}/ARCHITECTURE.mmd` — current stub
- `{paths.epics}/{phase}/{EPIC-ID}/ENV.yaml` — current stub
- `PROJECT_CONTEXT.yaml` — stack, paths, rules
- Codebase context: existing services in the same domain (grep for module names from EPIC.md goal)

### Step 2 — Invoke architect-agent

```
architect-agent: design EPIC-{ID}

Pre-loaded:
  - EPIC.md goal + features + milestones
  - PROJECT_CONTEXT.yaml stack
  - Existing related files (read first)

Produce:
  1. ARCHITECTURE.mmd — Mermaid flowchart with classDef styling (good/bad/new/ext) for visual differentiation
  2. Technical Impact Analysis — files by layer, env vars, risks, effort
  3. ENV.yaml — POPULATED with required vars (not empty `required: []`)
  4. "Files Touched (predicted)" table appended to EPIC.md "Files touched (inventory)" section
```

### Step 3 — Update Files

architect-agent writes:
- **ARCHITECTURE.mmd** — replace the stub with the real diagram. Must include the four classDef declarations (`good`, `bad`, `new`, `ext`) and use them on every node.
- **ENV.yaml** — replace the empty `required: []` with actual vars. Each entry must have `name`, `description`, `example`, `set_in`, `sensitive`.
- **EPIC.md** — append a "Technical Impact" section with the analysis, AND populate the "Files touched (inventory)" table with predicted rows (one row per file architect plans to touch, with Owner Story = TBD if stories not yet assigned).

### Step 4 — Validate

Confirm:
- Mermaid renders (no syntax errors)
- `classDef good`, `classDef bad`, `classDef new`, `classDef ext` all present
- Every node has a class applied (`:::good`, `:::new`, etc.)
- ENV.yaml `required` list is non-empty OR architect explicitly marked "no env vars needed"
- Every env var has a description + example
- Effort estimate has a confidence level (High/Medium/Low)
- Risk matrix has ≥ 1 risk with a mitigation
- EPIC.md "Files touched (inventory)" table has ≥ 1 row

### Step 5 — Surface Split Recommendation

If architect identified that the epic should be split, surface that to the human:

```
⚠️ Architect recommends splitting EPIC-{ID}:

Reason: {e.g., touches 3 distinct subsystems with no shared logic}

Suggested split:
  - EPIC-{DOMAIN}-{NN+1}: {what}
  - EPIC-{DOMAIN}-{NN+2}: {what}

Confirm to proceed with split, or accept design as-is for the original epic?
```

### Step 6 — Print Summary

```
✅ Epic Design Complete: EPIC-{ID}

Files updated:
  ✅ ARCHITECTURE.mmd — {N} subgraphs, {N} components, classDef styling applied
  ✅ ENV.yaml — {N} env vars required (was empty stub)
  ✅ EPIC.md — Technical Impact section added, Files Touched table populated with {N} rows

Effort estimate: {N}–{M}h ({confidence} confidence)

Risks identified: {N}
  🔴 High: {N}
  🟡 Medium: {N}
  🟢 Low: {N}

Next:
  /new-story     — write stories per milestone
  Or: review the ARCHITECTURE.mmd in your editor's Mermaid preview
```

## Universal Design Rules architect-agent Applies

(Documented here for reference — see architect-agent.md for full list)

1. Single source of truth for schema
2. No business logic in proxy/gateway layers
3. Auth at the boundary
4. Sensitive data never in logs
5. Idempotency for write operations
6. Raw body preservation for webhooks
7. Database connection lifecycle for serverless DBs

## Edge Cases

| Situation | Rule |
|-----------|------|
| ARCHITECTURE.mmd was already filled by `/prd-to-roadmap` | Treat as starting point; refine, don't overwrite |
| Epic has no clear domain owner | architect-agent flags and asks |
| Required external API/service not yet decided | Document as `[DECISION NEEDED]` in EPIC.md |
| Effort estimate exceeds 8 weeks | architect-agent recommends epic split |
| EPIC.md "Files touched (inventory)" table already populated | Architect appends; never overwrites |

---

*Skill version: 2.0.0 | Updated: 2026-05-21 | Changes: ORION v0.2.0 — classDef enforcement, ENV.yaml population requirement, Files Touched table append*
