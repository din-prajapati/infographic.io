---
name: runtime-first-implementation
version: 1.0.0
description: >
  Trace the runtime dependency chain before implementing any spec change.
  The spec describes intent. The runtime is what the browser or server actually executes.
  Always verify they agree before writing a single line of code.
triggers:
  - "implement"
  - "edit file"
  - "add feature"
  - "fix this"
  - "change this"
domains:
  - all
---

# Skill: runtime-first-implementation

## Problem

A spec says "change the color of X to blue." You edit `tokens.css` and set `--btn-primary: blue`. The browser still shows green. Why?

Because somewhere downstream, another file overrides the value. Or the runtime loads a different file. Or a higher-specificity selector wins. Or the build is cached.

**The spec describes intent. The runtime is what actually executes.** Always trace which file the runtime actually reads before editing.

## Protocol

### Step 1 — Identify the Runtime Path

For the thing you're about to change, ask:

1. **What file does the runtime actually load?** (not what file looks correct)
2. **What is the load order?** (multiple files may define the same thing)
3. **What is the final computed value?** (after cascade, after override, after merge)

### Step 2 — Verify Before Editing

Use the appropriate runtime inspection:

| Domain | How to verify |
|--------|--------------|
| Frontend CSS | Open DevTools → inspect element → Computed tab → see actual value + source file |
| Frontend JS | Console: `getComputedStyle(el).getPropertyValue('--token')` |
| Backend route | Hit the endpoint, log the file/handler |
| Database | Query the actual DB, not the schema file |
| Config | Print the loaded config object at runtime |

### Step 3 — Edit the Source the Runtime Reads

Edit only the file that the runtime confirms it loaded. If two files exist with similar names and the runtime loads neither, find why before editing either.

### Step 4 — Re-verify After Edit

Repeat Step 2. Confirm the runtime now reads the new value.

### Step 5 — Run Verification Gates

Once the runtime confirms the change, run `/verification-gates` to confirm no regression elsewhere.

## Common Pitfalls

| Pitfall | Trace |
|---------|-------|
| Edited the spec file, not the runtime file | Check imports/load order |
| Two files with same name | Check tsconfig paths, build config |
| CSS cascade overrides | Open DevTools, find higher-specificity rule |
| Cached build | Restart dev server, hard reload |
| Wrong environment | Check NODE_ENV / env var differences |
| Edit not yet hot-reloaded | Wait for HMR or full reload |
| Test was using a mock | Check test file's mock setup |

## Hand-off

This skill is read by `code-agent` before every implementation. Code-agent always verifies runtime before editing.

---

*Skill version: 1.0.0 | Created: 2026-05-18*
