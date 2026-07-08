---
name: harden
version: 1.0.0
description: >
  Audit AC type coverage for a story, fill missing typed ACs with a
  targeted LLM call, generate TC-ID rows, and lock the story as
  implement-ready. Replaces validate-story + adversarial-review +
  find-edge-cases.
triggers:
  - "harden story"
  - "harden"
  - "prepare story"
  - "certify story"
  - "ready for implementation"
  - "harden US-"
domains:
  - all
agents: []
---

# Skill: harden

## Purpose

Stage 3.5 of the AI-SDLC pipeline. Certify a story as implementation-ready by:

1. Auditing its Acceptance Criteria against the domain's required AC type set
2. Auto-filling any missing typed ACs with a single targeted LLM call (only when gaps exist)
3. Generating TC-ID rows from the final AC types
4. Writing the story lock — the binary gate that `implement-story` checks before running

Replaces three BMAD-derived skills: `validate-story`, `adversarial-review`, and `find-edge-cases`.

## Input

Required:
- **Story ID** (e.g., `US-AUTH-031`)

## Modules Used

Both modules are invoked algorithmically (no LLM) in Steps 1–2, 4, and 5:

| Module | Exports used |
|--------|-------------|
| `.orion/bin/lib/ac-coverage.js` | `parseAcTypes`, `checkCoverage`, `acTypesToTcRows` |
| `.orion/bin/lib/story-lock.js` | `computeSha`, `writeLock`, `readLock`, `checkLock`, `findStoryMd` |

## Protocol

### Step 1 — Load Story Context (no LLM)

Locate STORY.md using `findStoryMd(storyId, hostRoot)` from `story-lock.js`.

If STORY.md is not found:
```
⛔  STORY.md not found for US-{ID}.
    Run: orion run new-story to create it first.
```
Exit 1.

Read:
- `STORY.md` — the story to harden
- `PROJECT_CONTEXT.yaml` — to get `ac_coverage` requirements for the story's domain
- `.orion/state/locks/<story-id>.json` — check if already locked (via `checkLock`)

Extract the story domain from the story ID: `US-{DOMAIN}-{NN}` → `DOMAIN`.

Determine required AC types:
```
required = ac_coverage.default + ac_coverage.per_domain[DOMAIN]
```
If `per_domain[DOMAIN]` is absent, use only the `default` list. Warn if `per_domain` is
entirely empty:
```
⚠️  No per-domain coverage configured for domain '{DOMAIN}'.
    Only default types [happy-path, error-path] will be required.
    Add per_domain.{DOMAIN} to PROJECT_CONTEXT.yaml for stronger coverage.
```

**Already-locked fast path:** If `checkLock(storyId, storyMdContent, hostRoot).shaMatch === true`:
```
✅ US-{ID} is already hardened and up-to-date.

   Coverage: {lock.ac_types_covered joined as comma list}
   TC rows:  {lock.tc_rows_generated}
   Lock SHA: {lock.story_sha[:12]}...

   Nothing to do.
   Next: orion run implement-story US-{ID}
```
Exit 0.

---

### Step 1.5 — Auto-Type Untyped ACs (small LLM call, only if needed)

Call `parseAcTypes(storyMdContent)` from `ac-coverage.js`.

An AC is "untyped" when its `type` field is `null` — the label reads `**ACN:**` with no `[type]` tag.

**If zero untyped ACs:** Skip this step entirely — **no LLM call, no cost.**

**If untyped ACs exist:** Make a single LLM call. Pass:
- The full AC type library (from `AC_TYPES` in `ac-coverage.js`) with descriptions
- Each untyped AC's `acId` and `text`
- Instruction: "Classify each AC text into the closest matching type from the library.
  Return ONLY: `ACN → type-name` mappings, one per line."

Apply the returned mappings: for each untyped AC, update its line in STORY.md to insert the
`[type]` label before the colon. The colon stays **inside** the bold span:

Before: `- [ ] **AC3:** When rate limit is exceeded, return 429.`
After:  `- [ ] **AC3 [rate-limit]:** When rate limit is exceeded, return 429.`

Write the updated STORY.md.

Print:
```
Auto-typing untyped ACs:
  AC1 "When valid credentials are submitted..."  → [happy-path]   ✅ inferred
  AC3 "When rate limit is exceeded..."           → [rate-limit]   ✅ inferred

  2 ACs updated with inferred type labels.
```

---

### Step 2 — AC Coverage Audit (no LLM)

With all ACs now typed, call:
```js
const parsedAcs = parseAcTypes(storyMdContent);
const coverage  = checkCoverage(parsedAcs, required);
```

Print coverage summary:
```
Story:  US-{ID} — {title from STORY.md H1}
Domain: {DOMAIN}
Required types:  {required list}
Present:         {coverage.present list}
Missing:         {coverage.missing list or "(none)"}
```

If `coverage.missing` is non-empty, mark each missing type with `← missing`.

**If `coverage.complete === true`:** Skip Step 3 (no LLM needed). Go directly to Step 4.

---

### Step 3 — Targeted Gap-Fill (1 LLM call, only if gaps exist)

Call the LLM **once** with all missing types in a single request. Pass:
- Story title + description + existing ACs
- Primary files touched (from the "Primary Files Touched" section of STORY.md, if present)
- Domain: `{DOMAIN}`
- Missing types: `coverage.missing` (e.g., `["session-expiry"]`)
- AC writing rules:
  - File-specific: reference the exact file paths from "Primary Files Touched"
  - Format: Given/When/Then; the "When" clause begins with "When {trigger},"
  - **Colon inside bold**: the label ends `**ACN [type]:**` (colon BEFORE closing `**`)
  - Be specific: name the file, the return value, the error code

LLM generates ONLY the missing typed ACs — one AC per missing type.

Example generated AC for `session-expiry`:
```markdown
- [ ] **AC4 [session-expiry]:** When a JWT older than 1h arrives at any protected route,
      `src/auth/guards/jwt.guard.ts` rejects the request with HTTP 401
      and `{ code: "TOKEN_EXPIRED", expiredAt: "<iso-ts>" }`.
```

Append the generated ACs to the `## Acceptance Criteria` section of STORY.md, directly after
the last existing AC line.

Print:
```
Gap-fill complete:
  Added AC4 [session-expiry]: When a JWT older than 1h...

  1 AC added. Developer review recommended before proceeding.
```

> **Developer review note:** If the generated AC's file path or behaviour description is
> inaccurate, edit STORY.md now. After editing, re-run `harden` — it re-locks instantly
> (no LLM call needed when coverage is already complete).

---

### Step 4 — TC-ID Row Generation (no LLM)

Re-read the updated STORY.md (to include ACs added in Step 3, if any).

Call:
```js
const finalAcs = parseAcTypes(updatedStoryMdContent);
const tcRows   = acTypesToTcRows(storyId, finalAcs);
```

Locate the `## Test Cases` section in STORY.md. If absent, append:
```markdown
## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|----------|----------|--------|---------|
```

**Idempotency:** If TC rows already exist (i.e., rows starting with `| TC-` are present under
the Test Cases header), clear them before writing the new set. This ensures re-running `harden`
after a story edit produces a clean, up-to-date table.

Append each row from `tcRows` to the table. Example output for a 4-AC AUTH story:
```
| TC-AUTH-031-01 | Unit | P0 | happy-path:     Valid credentials → JWT returned           | 🔲 | |
| TC-AUTH-031-02 | Unit | P0 | error-path:     Invalid credentials → HTTP 401             | 🔲 | |
| TC-AUTH-031-03 | Unit | P1 | security:       10 failed attempts → rate-limiter blocks   | 🔲 | |
| TC-AUTH-031-04 | Unit | P1 | session-expiry: Expired JWT → TOKEN_EXPIRED response       | 🔲 | |
```

Write the updated STORY.md.

---

### Step 5 — Lock (no LLM)

Read the final STORY.md content (after all appended ACs and TC rows from Steps 3–4).

Compute the final coverage and write the lock:
```js
const finalContent  = readFileSync(storyMdPath, 'utf8');
const finalAcs      = parseAcTypes(finalContent);
const finalCoverage = checkCoverage(finalAcs, required);
finalCoverage.required        = required;
finalCoverage.tcRowsGenerated = tcRows.length;
writeLock(storyId, finalContent, finalCoverage, hostRoot);
```

The lock is written to `.orion/state/locks/{story-id}.json`.

---

### Step 6 — Report

**When gap-fill was needed:**
```
✅ US-{ID} hardened and locked.

   Coverage:
     ✅ happy-path     — AC1
     ✅ error-path     — AC2
     ✅ security       — AC3
     ✅ session-expiry — AC4  (added)

   TC rows generated: 4
   Lock SHA: {sha[:12]}...

   Story is now implement-ready.
   Next: orion run implement-story US-{ID}
```

**When coverage was already complete (no gap-fill):**
```
✅ US-{ID} hardened and locked.

   Coverage: all required types already present — no ACs added.
     ✅ happy-path     — AC1
     ✅ error-path     — AC2
     ✅ security       — AC3
     ✅ session-expiry — AC4

   TC rows generated: 4
   Lock SHA: {sha[:12]}...

   Story is now implement-ready.
   Next: orion run implement-story US-{ID}
```

## Edge Cases

| Situation | Rule |
|-----------|------|
| Already locked, story SHA unchanged | Report "already hardened, nothing to do" and exit 0 (Step 1 fast path) |
| Already locked, story SHA mismatch | Re-run all steps (1.5–5); the lock is stale and must be refreshed |
| STORY.md not found | STOP with error: "Story US-{ID} not found. Run `orion run new-story` to create it." |
| `PROJECT_CONTEXT.yaml` missing `ac_coverage` | Fall back to `default: [happy-path, error-path]`; warn about unconfigured domain |
| All ACs are untyped | Run Step 1.5 for all; single LLM call classifies them all at once |
| Story has zero ACs | STOP: "No ACs found in STORY.md. Run `orion run new-story` to populate it." |
| TC rows already exist | Clear existing TC rows before writing the new set (idempotency) |
| Required type list is empty | `coverage.complete === true` immediately; write lock; no gap-fill |
| TASKS.md absent (no "Primary Files Touched") | Proceed with gap-fill using story title + description only; note the absence |

## Anti-Patterns This Skill Prevents

- Running `implement-story` before ACs cover all required scenario types for the domain
- Manually labeling AC types (ORION auto-assigns; developer reviews, not authors)
- Generating test cases via a separate command after story creation
- Using a generic adversarial review that ignores the story's domain requirements
- Skipping coverage checks under deadline pressure (the lock gate is machine-enforced, not advisory)

---

*Skill version: 1.0.0 | Added: 2026-05-27 | ORION v0.4.0 — Phase 3 redesign*
