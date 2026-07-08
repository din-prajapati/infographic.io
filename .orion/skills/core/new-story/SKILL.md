---
name: new-story
version: 1.0.0
description: >
  Create a fully-populated STORY.md and stub TASKS.md for one user story.
  Invokes story-writer agent for detailed AC writing. Updates parent milestone
  and epic story tables. Updates PROJECT_CONTEXT.yaml counters.
triggers:
  - "create story"
  - "new story"
  - "add story"
  - "write story card"
  - "scaffold story"
  - "write story for"
domains:
  - all
agents:
  - story-writer
  - qa-agent
---

# Skill: new-story

## Purpose

Create one implementation-ready story card. After this skill runs, an AI coding agent should be able to open the STORY.md + TASKS.md and implement the story in a single session.

## Input

Required:
- **Story context:** Title + persona + capability (As a / I want / So that)
- **Epic ID**
- **Milestone**

Optional: Feature ID, size estimate, primary files

## Protocol

### Step 1 — Validate

Read `PROJECT_CONTEXT.yaml` for next story # in the domain. Confirm parent epic and milestone exist.

### Step 2 — Write STORY.md (invoke story-writer)

Use `story-writer` agent. Returns:
- Story statement
- Typed acceptance criteria (see Phase 4 below — developer never labels ACs manually)
- Out-of-scope list (min 2 items)
- AI Implementation Prompt block
- Test Cases table (min 2 P0 + 2 P1)

If not invoking the agent, follow `{paths.templates}/STORY.md` manually.

**Non-negotiable rules:**
- Every AC is binary pass/fail
- Every AC references specific UI/API/DB
- "Out of scope" lists ≥ 2 items
- "Primary files touched" lists real paths (mark uncertain `(TBC)`)
- "AI Implementation Prompt" is paste-and-go

**[Phase 4 — Typed Acceptance Criteria generation]**

Read `PROJECT_CONTEXT.yaml.ac_coverage` to determine required AC types for this story's domain:

```
domain        = storyId.split('-')[1]           // "AUTH" from "US-AUTH-031"
requiredTypes = ac_coverage.per_domain[domain]
                ?? ac_coverage.default
                ?? ['happy-path', 'error-path']
```

Generate **exactly one AC per required type**, in `requiredTypes` order:

```markdown
- [ ] **AC{N} [{type}]:** <specific, binary, references a real file or endpoint>
```

**AC writing rules:**
- Format: colon is **inside** the bold span — `**AC1 [happy-path]:**` not `**AC1 [happy-path]**:`
- `happy-path` always first; `error-path` always second; remaining types follow `requiredTypes` order
- Reference actual source files or API paths — use `(TBC)` when the path is genuinely unknown
- No AC may read "the feature works correctly" — each must be a concrete, observable assertion

**Example** (domain AUTH, `requiredTypes: ['happy-path', 'error-path', 'security', 'session-expiry']`):

```markdown
- [ ] **AC1 [happy-path]:** When valid credentials are submitted,
      `src/auth/login.service.ts` returns a signed JWT with 1h expiry and HTTP 200.
- [ ] **AC2 [error-path]:** When credentials are invalid,
      `src/auth/login.controller.ts` returns HTTP 401 with `{ code: "INVALID_CREDENTIALS" }`.
- [ ] **AC3 [security]:** When the same IP submits 10 failed logins within 60s,
      `src/auth/rate-limiter.ts` blocks further attempts and returns HTTP 429.
- [ ] **AC4 [session-expiry]:** When a JWT older than 1h is sent,
      `src/auth/guards/jwt.guard.ts` returns HTTP 401 with `{ code: "TOKEN_EXPIRED" }`.
```

**Downstream effect on `harden`:** ACs written here are already fully typed.
- Step 1.5 (auto-type inference) is **skipped entirely**
- Step 2 (coverage audit) may already be **complete with no gaps**
- Best case: `harden` runs Steps 1 → 2 → 4 → 5 → 6 with **zero LLM calls**

### Step 3 — Create TASKS.md Stub

Copy from `{paths.templates}/TASKS.md`. Fill: Story ID, branch name, PR scope one-liner, task breakdown matching primary files, exact test commands from PROJECT_CONTEXT.yaml `gates`.

TASKS.md is a STUB — do not pre-fill line-level "Changes" subsections. Those are filled during implementation.

### Step 3.5 — Write per-story `scaffold.json`

Read `.orion/scaffold.json` (project-level) for the master `layers`+`techs` set.

From STORY.md "Primary files touched", infer which layers/techs this story actually crosses using the matching table in `story-writer.md` (path → layer/tech). Intersect with project scaffold's set — never include a tech the project doesn't have.

Compute `rules_loaded` = the four `always_load` paths + every `.orion/rules/{layer}/RULES.md` + `.orion/rules/{layer}/{tech}/RULES.md` matching the intersection.

Write the result to `{paths.epics}/{phase}/{EPIC-ID}/stories/{US-ID}/scaffold.json` using `templates/per-story-scaffold.json` as the shape.

If "Primary files touched" is empty or `(TBC)`-marked, leave `touches.layers`/`techs` empty arrays — agents will fall back to project scaffold (less efficient but safe).

### Step 4 — Update Parent Files

- Parent MILESTONE.md: add story row
- Parent EPIC.md: add story row
- Parent FEATURE.md (if feature level used): add story row

### Step 5 — Update PROJECT_CONTEXT.yaml

Increment the domain's `counters.story` value.

### Step 6 — Print Summary

```
Story created: {US-ID} — {title}
  Path: {paths.epics}/{phase}/{EPIC-ID}/stories/{US-ID}/
  Files: STORY.md · TASKS.md · scaffold.json
  Layers touched: {touches.layers}
  Rules loaded: {N} files
  Size: {size}
  Milestone: {M-ID}
  Trackers: updated

Next:
  git checkout -b feat/{domain}-us-{domain}-{nnn}-{slug}
  /implement-story {US-ID}
```

## Splitting Large Stories

If size is L or XL, split BEFORE writing the card:

**Split rule:** Divide along layer or AC boundary:
- Frontend vs backend → two stories
- Happy path vs error path → two stories
- Read vs write → two stories

Create two STORY.md files, each M size. Note dependency in both.

---

*Skill version: 1.1.0 | Updated: 2026-05-27 | Changes: ORION v0.4.0 — Phase 4: typed AC generation from ac_coverage in Step 2*
