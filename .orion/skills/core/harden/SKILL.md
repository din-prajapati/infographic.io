---
name: harden
version: 2.0.0
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
requires_cli:
  - ac-audit
  - tc-rows
  - lock-write
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

## Commands Used

Every deterministic step is an `orion` CLI call. Run them from the host project
directory — the CLI resolves the project root itself by walking up from the
working directory to the nearest `.orion/orion.yaml`, and reads
`PROJECT_CONTEXT.yaml`, `STORY.md` and `.orion/state/locks/` relative to that
root.

| Command | Replaces | What it does |
|---------|----------|--------------|
| `orion ac-audit <id> --format=json` | Steps 1–2 | Locates STORY.md, resolves required AC types, reports present/missing/untyped + the AC type library + lock state |
| `orion tc-rows <id> --write` | Step 4 | Regenerates the Test Cases table from the current typed ACs |
| `orion lock-write <id>` | Step 5 | Recomputes coverage and writes `.orion/state/locks/<id>.json` |

> **Never import framework internals.** Do not `import`, `require`, or read
> `ac-coverage.js`, `story-lock.js`, or anything else under `.orion/bin/` — and
> do not try to reach them through `node_modules/@orion-ai/orion/`.
>
> `orion init` installs only `skills/`, `agents/` and `hooks/` into a host
> project; the runtime deliberately stays inside the installed package, so
> `.orion/bin/` does not exist in the project you are working in. Reaching into
> the package instead is worse, not better: under `npm link` or a workspace
> hoist, `node_modules/@orion-ai/orion` resolves back into the framework's own
> checkout, so you would be reading the framework's files while believing you
> were acting on the host project. The CLI is the only supported entry point,
> and it is the one that gets the host path right.
>
> Prior to v0.7.1 this file instructed exactly those imports, which made this
> skill undeliverable in every installation. If you find yourself about to
> construct a path to a `.js` file, stop — there is a CLI verb for it.

## Protocol

### Step 1 — Audit (no LLM)

```bash
orion ac-audit US-{ID} --format=json
```

If the command exits non-zero, stop and relay its message. The two failure
modes it reports are *STORY.md not found* (run `orion run new-story` first) and
*zero ACs in the story* (populate the Acceptance Criteria section first).

The JSON result carries everything the rest of this protocol needs:

| Field | Use |
|-------|-----|
| `story_md` | Absolute path to edit in Steps 1.5 / 3 |
| `domain`, `required`, `defaults`, `per_domain` | The resolved coverage requirement |
| `present`, `missing`, `complete` | The audit verdict |
| `acs[]` | Every parsed AC: `{ ac_id, type, text }` |
| `untyped[]` | ACs with no `[type]` label, each with a `suggested_type` |
| `ac_types` | The full type library with priority / test type / description |
| `lock` | `{ locked, sha_match, locked_at }` |
| `warnings[]` | Coverage-configuration warnings — always relay these |

**Always print `warnings[]`.** A `per-domain-gap` warning means the project
configured `ac_coverage.per_domain` for other domains but not this story's, so
the story is being certified against the default types alone. That is a real
weakening of the gate and the developer needs to see it, even on a successful run.

**Already-locked fast path.** If `lock.locked && lock.sha_match`:

```
✅ US-{ID} is already hardened and up-to-date.

   Coverage: {present joined as comma list}
   Lock SHA: {from orion lock-status, first 12 chars}

   Nothing to do.
   Next: orion run implement-story US-{ID}
```

Exit 0.

---

### Step 1.5 — Type the Untyped ACs (small LLM call, only if needed)

An AC is "untyped" when it appears in `untyped[]` — the label reads `**ACN:**`
with no `[type]` tag.

**If `untyped` is empty:** skip this step entirely — **no LLM call, no cost.**

**If `untyped` is non-empty:** make a single LLM call covering all of them at
once. You already have the type library in `ac_types` and a deterministic
keyword-based `suggested_type` for each untyped AC; treat the suggestion as a
prior, not as an answer — override it when the AC text clearly means something
else.

Instruction: "Classify each AC text into the closest matching type from the
library. Return ONLY: `ACN → type-name` mappings, one per line."

Apply the mappings by editing `story_md`: insert the `[type]` label before the
colon. The colon stays **inside** the bold span:

Before: `- [ ] **AC3:** When rate limit is exceeded, return 429.`
After:  `- [ ] **AC3 [rate-limit]:** When rate limit is exceeded, return 429.`

Print:
```
Auto-typing untyped ACs:
  AC1 "When valid credentials are submitted..."  → [happy-path]   ✅ inferred
  AC3 "When rate limit is exceeded..."           → [rate-limit]   ✅ inferred

  2 ACs updated with inferred type labels.
```

Then **re-run `orion ac-audit US-{ID} --format=json`** — the coverage verdict
must be recomputed against the newly typed ACs. Use that fresh result for Step 2.

---

### Step 2 — Read the Verdict (no LLM)

Print the coverage summary from the latest audit result:

```
Story:  US-{ID} — {title}
Domain: {domain}
Required types:  {required}
Present:         {present}
Missing:         {missing, or "(none)"}
```

Mark each entry of `missing` with `← missing`.

**If `complete === true`:** skip Step 3 — no LLM needed. Go to Step 4.

---

### Step 3 — Targeted Gap-Fill (1 LLM call, only if gaps exist)

Call the LLM **once** with all missing types in a single request. Pass:
- Story title + description + existing ACs (from `acs[]`)
- Primary files touched (from the "Primary Files Touched" section of STORY.md, if present)
- Domain: `{domain}`
- Missing types: `missing` (e.g., `["session-expiry"]`), with their descriptions from `ac_types`
- AC writing rules:
  - File-specific: reference the exact file paths from "Primary Files Touched"
  - Format: Given/When/Then; the "When" clause begins with "When {trigger},"
  - **Colon inside bold**: the label ends `**ACN [type]:**` (colon BEFORE closing `**`)
  - Be specific: name the file, the return value, the error code

Generate ONLY the missing typed ACs — one AC per missing type.

Example generated AC for `session-expiry`:
```markdown
- [ ] **AC4 [session-expiry]:** When a JWT older than 1h arrives at any protected route,
      `src/auth/guards/jwt.guard.ts` rejects the request with HTTP 401
      and `{ code: "TOKEN_EXPIRED", expiredAt: "<iso-ts>" }`.
```

Append the generated ACs to the `## Acceptance Criteria` section of `story_md`,
directly after the last existing AC line.

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

```bash
orion tc-rows US-{ID} --write
```

This re-reads STORY.md (picking up anything Steps 1.5 and 3 added), regenerates
the rows from the current typed ACs, and rewrites the `## Test Cases` table —
creating the section if it is absent.

**It is not destructive.** Status (✅/❌/⚠️) and Finding cells recorded by
`test-story` are carried forward by TC ID, so re-hardening a story never
discards test results. The command reports which IDs it preserved.

Untyped ACs produce no rows. If the command warns that some were skipped, go
back to Step 1.5 rather than proceeding.

---

### Step 5 — Lock (no LLM)

```bash
orion lock-write US-{ID}
```

Recomputes coverage from the final STORY.md — so the SHA fingerprints exactly
what is on disk after Steps 1.5, 3 and 4 — and writes
`.orion/state/locks/{story-id}.json` under the host project.

**If it exits non-zero with "Coverage incomplete":** the gate is doing its job.
Do not pass `--force`. Return to Step 3 and close the missing types, or report
the gap to the developer. `--force` exists for a developer's deliberate
override, not for the agent to unblock itself.

---

### Step 6 — Report

`orion lock-write` prints the authoritative summary — coverage, required types,
TC row count, lock SHA and lock path. Relay it, plus any `warnings[]` from the
audit, and close with the next command.

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
| STORY.md not found | `ac-audit` exits 1 — relay it: "Run `orion run new-story` to create it." |
| Story has zero ACs | `ac-audit` exits 1 — relay it; do not proceed to any later step |
| `PROJECT_CONTEXT.yaml` missing `ac_coverage` | `ac-audit` falls back to `[happy-path, error-path]` and emits a `no-ac-coverage` warning — relay it |
| `per_domain` configured, but not for this domain | `ac-audit` emits a `per-domain-gap` warning — relay it; the story is certified against defaults alone |
| `per_domain` empty for every domain | `ac-audit` emits a `per-domain-empty` warning — relay it |
| `per_domain.{DOMAIN}` is an explicit `[]` | Deliberate default-only choice; no warning, nothing to relay |
| All ACs are untyped | Run Step 1.5 for all; single LLM call classifies them at once |
| TC rows already exist | `tc-rows --write` regenerates them and preserves Status/Finding by TC ID |
| Required type list is empty | `complete === true` immediately; write the lock; no gap-fill |
| TASKS.md absent (no "Primary Files Touched") | Proceed with gap-fill using story title + description only; note the absence |
| `orion` not on PATH | Stop and report — the protocol cannot run. `orion doctor` diagnoses it. |

## Anti-Patterns This Skill Prevents

- Running `implement-story` before ACs cover all required scenario types for the domain
- Manually labeling AC types (ORION auto-assigns; developer reviews, not authors)
- Generating test cases via a separate command after story creation
- Using a generic adversarial review that ignores the story's domain requirements
- Skipping coverage checks under deadline pressure (the lock gate is machine-enforced, not advisory)
- Re-implementing coverage/lock logic in prose, where it cannot be unit-tested and drifts from the CLI

---

*Skill version: 2.0.0 | Added: 2026-05-27 | Rewritten: 2026-09-01 (ORION v0.7.1 — CLI-backed protocol)*
