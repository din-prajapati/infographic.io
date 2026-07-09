---
name: enumerate-and-confirm-scope
version: 1.0.0
description: >
  When an instruction is broad ("fix all X", "check everywhere"), enumerate every
  matching instance in the codebase, present a classified list to the user, get
  scope confirmation, then implement. Never do a silent partial sweep.
triggers:
  - "fix all"
  - "check all"
  - "update everywhere"
  - "find all"
  - "replace all"
  - "audit all"
domains:
  - all
---

# Skill: enumerate-and-confirm-scope

## Problem

When the user says "fix all instances of X," the failure mode is doing some but not all, with no record of what was skipped. The user spots the gaps days later via screenshots.

## Protocol

### Step 1 — Enumerate Every Match

Use Grep/Glob to find every instance. Cast a wide net first, then narrow.

```
Glob for files: **/*.{ts,tsx,css,scss,md}
Grep for pattern: <the thing to fix>
```

### Step 2 — Classify the Results

Group findings into:
- **In scope** — instances that match the user's intent
- **Out of scope** — instances that match the pattern but the user probably doesn't mean them (test files, generated code, vendor, archived)
- **Ambiguous** — instances that need user judgment

### Step 3 — Present the List

```
Found {N} instances of "{pattern}":

IN SCOPE ({N}):
  - {file:line} — {1-line context}
  - {file:line} — {1-line context}

OUT OF SCOPE ({N}) — will NOT change:
  - {file:line} — test file
  - {file:line} — archived doc
  - {file:line} — vendor lib

AMBIGUOUS ({N}) — please confirm:
  - {file:line} — {why ambiguous}

Confirm: proceed with the IN SCOPE list? Want any AMBIGUOUS items moved IN/OUT?
```

### Step 4 — Wait for Confirmation

Do not start editing until the user confirms the IN SCOPE list. They may:
- Approve as-is
- Move some AMBIGUOUS items in or out
- Refine the pattern

### Step 5 — Execute with Tracking

For each in-scope item, edit and track which file/line was changed.

### Step 6 — Report Completion

```
Done. Changed {N} of {N} in-scope items:
  ✅ {file:line} — old → new
  ✅ {file:line} — old → new
  ...

Items intentionally skipped:
  ⏸ {file:line} — {reason}
```

## When to Apply

Any user instruction with a broad quantifier:
- "all"
- "every"
- "everywhere"
- "all the X"
- "anywhere we have Y"
- "fix the X situation"

## Counter-cases

Skip this skill when:
- The user explicitly names every file
- The change is to exactly one file
- The user has already enumerated the list themselves

---

*Skill version: 1.0.0 | Created: 2026-05-18*
