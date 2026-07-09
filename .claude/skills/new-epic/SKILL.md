---
name: new-epic
version: 1.0.0
description: >
  Create a fully-structured Epic folder from scratch: EPIC.md, ARCHITECTURE.mmd stub,
  ENV.yaml stub, features/ and milestones/ and stories/ directories. Invoke after
  /prd-to-roadmap has defined the epic, or standalone for ad-hoc epic creation.
triggers:
  - "create epic"
  - "new epic"
  - "add epic"
  - "scaffold epic"
domains:
  - all
agents:
  - pm-agent        # For decomposing scope into features/milestones if not yet done
  - architect-agent # For ARCHITECTURE.mmd and ENV.yaml
---

# Skill: new-epic

## Purpose

Scaffold one complete Epic with all supporting structure. Run this after `/prd-to-roadmap`
has defined the epic ID and scope, or standalone when adding an epic mid-roadmap.

---

## Input

Required (ask if not provided):
- **Epic ID:** `EPIC-{DOMAIN}-{NN}` (check AGILE_INDEX.md for next available)
- **Epic title:** Short descriptive name
- **Phase:** Which phase folder (e.g., `phase-1-ai-core`)
- **Goal:** One-sentence business outcome

Optional (can leave as stubs):
- Feature names (if already known from PRD or pm-agent)
- Milestone names
- Story count estimate

---

## Protocol

### Step 1 — Validate ID

Before creating anything:
1. Read `docs/agile/AGILE_INDEX.md`
2. Confirm the Epic ID does not already exist
3. Confirm the phase folder exists at `docs/agile/epics/{phase}/`
4. Read `docs/agile/PROJECT_CONTEXT.md` to get current Next Epic # for the domain

### Step 2 — Create Folder Structure

```
docs/agile/epics/{phase}/{EPIC-ID}/
  EPIC.md                 ← populated from template
  ARCHITECTURE.mmd        ← Mermaid stub
  ENV.yaml                ← env var stub
  features/               ← empty dir (add .gitkeep)
  milestones/             ← empty dir (add .gitkeep)
  stories/                ← empty dir (add .gitkeep)
```

### Step 3 — Populate EPIC.md

Copy from `docs/agile/templates/EPIC.md` and replace ALL placeholders:

| Placeholder | Value |
|-------------|-------|
| `{DOMAIN}` | Domain prefix (e.g., `AI`, `DESIGN`) |
| `{NN}` | 2-digit epic number |
| `{Short Epic Title}` | Epic title |
| `{N}` / `{Phase name}` | Phase number and name |
| `{Linear Project}` | Leave as `LIN-EPIC-XXX` if unknown |
| `{YYYY-MM-DD}` | Target date if known, else leave |
| `{name}` | Owner (default: Dinesh) |
| Outcome sentence | One sentence describing user impact |
| Why now | Business reason driving this work |
| Success metric | How to know it's done (e.g., "works E2E on staging") |
| Milestone table rows | At least one row per known milestone |
| Story table rows | Leave as `—` if stories not yet defined |
| Feature table rows | List features if known |
| Out of scope | At least 2 explicit exclusions |
| DoD checkboxes | Keep as-is from template |
| Architecture section | Reference to ARCHITECTURE.mmd |
| Key files | List 3–5 files this epic is most likely to touch |

### Step 4 — Create ARCHITECTURE.mmd

If the architect-agent has already produced a diagram, paste it.
Otherwise create a minimal stub:

```
flowchart LR
  subgraph Inputs["User / External"]
    A["[describe main trigger]"]
  end
  subgraph Domain["{Domain}: {Epic title}"]
    B["[key file 1 — TBC]"]:::good
    C["[key file 2 — TBC]"]:::good
  end
  A --> B --> C
  classDef good fill:#0b3b2e,stroke:#14532d,color:#ecfdf5;
  classDef new  fill:#1e3a5f,stroke:#2563eb,color:#eff6ff;
```

### Step 5 — Create ENV.yaml

```yaml
# Environment variables required by {EPIC-ID}
# Update this file as you discover required env vars during implementation.
# Production values set in Railway dashboard.

epic: {EPIC-ID}

required: []
  # Uncomment and fill as needed:
  # - name: VARIABLE_NAME
  #   description: "What this variable does"
  #   example: "example-value"
  #   set_in: ".env (local) | Railway env vars (production)"
```

### Step 6 — Update AGILE_INDEX.md

Add the new epic to the correct phase table:
```
| [EPIC-{DOMAIN}-{NN}](epics/{phase}/{EPIC-ID}/EPIC.md) | {title} | 🔲 Not Started | 0 stories | — |
```

### Step 7 — Update PROJECT_CONTEXT.md

Increment the "Next Epic #" for the relevant domain.

### Step 8 — Print Summary

```
Epic created: {EPIC-ID}
  Phase: {phase}
  Path: docs/agile/epics/{phase}/{EPIC-ID}/
  Files: EPIC.md · ARCHITECTURE.mmd · ENV.yaml
  AGILE_INDEX.md: updated
  PROJECT_CONTEXT.md: Next Epic # incremented to {NN+1}

Next steps:
  1. Deep-fill ARCHITECTURE.mmd → invoke architect-agent
  2. Add features → /new-story or fill FEATURE.md stubs
  3. Create git branch → git checkout -b feat/{domain}-epic-{nn}-setup
```

---

## Edge Cases

| Situation | Rule |
|-----------|------|
| Domain doesn't exist in PROJECT_CONTEXT.md | Add it first: ask user for domain prefix, add row to PROJECT_CONTEXT.md |
| Phase folder doesn't exist | Create it with a README.md (copy from nearest existing phase README) |
| Epic already exists | Stop. Do not create duplicate. Ask user if they want to extend the existing epic instead |
| No milestone names yet | Create placeholder: `M-{DOMAIN}-{NN}-tbd.md` with a note "Milestone scope TBD" |

---

*Skill version: 1.0.0 | Created: 2026-05-18*
