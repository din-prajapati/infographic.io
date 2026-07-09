---
name: annotate-prd
version: 1.0.0
description: >
  Insert <!-- orion:phase=N --> lens markers into a large PRD so that
  prd-to-roadmap can process one phase at a time without losing context.
  Detects natural phase boundaries, inserts markers, validates coverage,
  and writes the annotated file in-place.
triggers:
  - "annotate prd"
  - "annotate this prd"
  - "prepare prd for roadmap"
  - "mark prd phases"
  - "prd too large"
  - "prd is long"
  - "add lens markers"
domains:
  - all
agents: []
---

# Skill: annotate-prd  (`orion annotate-prd`)

## Purpose

When a PRD exceeds ~1000 lines, processing it in a single `prd-to-roadmap` run risks
context loss and shallow story generation. `annotate-prd` inserts `<!-- orion:phase=N -->`
lens markers at natural phase boundaries so that `prd-to-roadmap` can load and process each
phase independently — with full context depth on each pass.

After annotation:
- `orion run prd-to-roadmap --prd={path} --phase=1` → loads only Phase 1 content
- `orion run prd-to-roadmap --prd={path} --phase=2` → loads only Phase 2 content
- `orion run prd-to-roadmap --prd={path}` (no `--phase`) → processes all phases sequentially

## Input

Required (one of):
- **File path** — `orion run annotate-prd --prd=docs/PRD.md`
- **Pasted content** — paste the PRD text in chat (outputs annotated content to chat)

Optional:
- `--phases=N` — hint: how many phases to detect (default: auto-detect, 2–6)
- `--dry-run` — write to `{basename}.annotated.md` instead of in-place

---

## Annotation Format

Markers are standard HTML comments — invisible to Markdown renderers:

```markdown
<!-- orion:phase=1 name="Foundation" -->

## Phase 1: Foundation
...phase 1 content...

<!-- orion:phase=2 name="Core Features" -->

## Phase 2: Core Features
...phase 2 content...

<!-- orion:prd-end -->
```

**Marker rules:**
- One `<!-- orion:phase=N -->` marker per phase, on its own line immediately before the phase section heading
- A blank line separates the marker from the heading
- Phases are numbered 1, 2, 3 ... (no gaps, no skips)
- `name` attribute is a short slug (2–4 words) used in `prd-to-roadmap` output
- `<!-- orion:prd-end -->` placed at the very end of the document marks explicit EOF
- Content before `<!-- orion:phase=1 -->` is **preamble** (executive summary, context) — not assigned to any phase, not processed as a lens

---

## Protocol

### Step 1 — Load PRD  *(no LLM)*

Read PRD content from the file path or pasted text.

```
lines     = content.split('\n').length
annotated = /<!-- orion:phase=\d+/.test(content)
```

**If already annotated:**
Show the current phase map (each marker, line number, name attribute):
```
ℹ️  This PRD already has {N} phase markers:
    Line  42: <!-- orion:phase=1 name="Foundation" -->
    Line 381: <!-- orion:phase=2 name="Core Features" -->
    Line 811: <!-- orion:phase=3 name="Advanced" -->
Re-annotate from scratch? [Y/n]
```
If yes: strip all existing `<!-- orion:phase= -->` and `<!-- orion:prd-end -->` markers,
then continue. If no: exit 0.

**If < 500 lines:**
```
ℹ️  This PRD is {lines} lines — annotation is optional for PRDs this short.
    prd-to-roadmap can process it in one pass without a lens.
    Continue anyway? [Y/n]
```

### Step 2 — Detect Phase Boundaries  *(1 LLM call)*

Pass the full PRD text with this prompt:

> "Identify the {N} major **release phases** in this PRD. Each phase must:
> - Represent a distinct, shippable product increment with a clear business outcome
> - Map to a section or cluster of sections already present in the PRD
> - Be large enough for meaningful story generation (≥ 10% of document content)
>
> Return a JSON array exactly like this:
> ```json
> [
>   {
>     "phase": 1,
>     "name": "Foundation",
>     "heading": "## Phase 1: Foundation",
>     "rationale": "Establishes core auth and pipeline setup — first shippable slice"
>   }
> ]
> ```
> Use the **exact heading text** as it appears in the PRD."

**Constraints for the LLM:**
- 2–6 phases (never 1, never > 6)
- Each phase covers at least 10% of the PRD content
- Use the existing section heading structure — never invent new boundaries
- Prefer headings that match `## Phase N`, `## Release N`, or `## Milestone N` patterns
- If `--phases=N` was provided, use that as a strong hint but override if the PRD structure clearly suggests a different count

### Step 3 — Insert Markers  *(no LLM)*

For each detected phase boundary, find the exact heading line in the content and insert
the marker (plus a blank line) on the line immediately before it.

**Algorithm:**
```
annotatedLines = []
for each line in content (index i):
  if line.trim() == detectedHeadings[phaseIndex]:
    annotatedLines.push(`<!-- orion:phase=${phase} name="${name}" -->`)
    annotatedLines.push('')          // blank separator line
    phaseIndex++
  annotatedLines.push(line)
annotatedLines.push('')
annotatedLines.push('<!-- orion:prd-end -->')
```

If the PRD has no `##`-level heading that matches the detected boundary, insert the
marker at the line where the LLM indicated the section begins (by approximate position).

### Step 4 — Validate Coverage  *(no LLM)*

Walk the annotated content line by line to compute coverage:

```
preambleLines = 0
phaseLinesMap = {}    // { 1: count, 2: count, ... }
currentPhase  = null

for each line in annotatedLines:
  if line matches /<!-- orion:phase=(\d+)/:
    currentPhase = parseInt(match[1])
    phaseLinesMap[currentPhase] = 0
  elif line matches /<!-- orion:prd-end -->/:
    break
  elif currentPhase === null:
    preambleLines++
  else:
    phaseLinesMap[currentPhase]++
```

**Emit warnings:**

| Condition | Warning |
|-----------|---------|
| `preambleLines > 30` | `[⚠️ Pre-phase content: {N} lines — not processed by any lens]` |
| Any phase has < 20 content lines | `[⚠️ Phase {N} is very short ({N} lines) — may not generate useful stories]` |
| Phase numbers are not 1,2,3,... | `[❌ Non-sequential phase numbers: {list}]` — abort |
| `phaseLinesMap` has 0 entries | `[❌ No markers were inserted]` — abort |

### Step 5 — Write + Report  *(no LLM)*

Write the annotated content:
- **Default (in-place):** overwrite the source file with the annotated version
- **`--dry-run`:** write to `{basename}.annotated.md` in the same directory
- **Pasted input (no file path):** print annotated content to chat; user copies manually

Print the summary:

```
✅ annotate-prd complete — {filename}
   Phases marked: {N}
   ─────────────────────────────────────────────────────
   Phase 1  "Foundation"          →  lines   43–380  (338 lines)
   Phase 2  "Core Features"       →  lines  381–810  (430 lines)
   Phase 3  "Analytics"           →  lines  811–1248 (438 lines)
   ─────────────────────────────────────────────────────
   Preamble: 42 lines  (not covered by any lens)
   Total:  1248 lines

   Next — process phases one at a time (recommended for PRDs > 800 lines):
     orion run prd-to-roadmap --prd={path} --phase=1
     orion run prd-to-roadmap --prd={path} --phase=2
     orion run prd-to-roadmap --prd={path} --phase=3

   Or process all phases in one pass:
     orion run prd-to-roadmap --prd={path}
```

---

## Edge Cases

| Situation | Rule |
|-----------|------|
| PRD has no `##` headings at all | Error: "Cannot detect phase boundaries — PRD has no section headings. Add `##` headings and retry." |
| All content is one blob under a single heading | LLM uses paragraph breaks and topic shifts as implicit boundaries; inserts markers at strongest split points |
| Already annotated | Strip existing markers, re-annotate after user confirmation |
| `--phases=4` hint but LLM finds 3 natural boundaries | Prefer LLM analysis; note the discrepancy: `[ℹ️ Detected 3 natural phases; --phases=4 hint overridden]` |
| `--dry-run` output file already exists | Ask before overwriting |
| Pasted content (no file path) | Print annotated content to chat — user copies it manually |
| PRD < 500 lines and user chooses to annotate anyway | Proceed normally; no annotation is ever invalid |

---

*Skill version: 1.0.0 | Added: 2026-05-27 | ORION v0.4.0 — Phase 4: annotate-prd + lens loading*
