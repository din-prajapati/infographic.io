---
name: enumerate-and-confirm-scope
version: 1.0.0
description: >
  When an instruction is broad ("fix all X", "check everywhere"), enumerate every
  matching instance in the codebase, present a classified list to the user, get
  scope confirmation, then implement. Never do a silent partial sweep.
domains:
  - frontend    # Component sweeps, CSS class migrations, hover states, color tokens
  - backend     # Endpoint audits, service method sweeps, Prisma query pattern updates
  - testing     # Test coverage gaps, missing spec files, assertion pattern updates
triggers:
  - "fix all"
  - "check all"
  - "update everywhere"
  - "across the page"
  - "throughout the app"
  - "any component that"
  - "all buttons"
  - "every hover"
  - "all endpoints"
  - "all tests"
  - "remove all"
  - "replace all"
  - "migrate all"
when_to_skip:
  - The instruction names a specific file and line number
  - The instruction names exactly one component or function
  - The scope is already a closed, explicit list ("fix these 3 files: A, B, C")
---

# Skill: enumerate-and-confirm-scope

## Problem

"Fix all button hover states" sounds like one task.
In reality it is 12+ components across 3 pages, 2 variant states each —
and some of them should NOT be changed because they already use semantic tokens.

Without enumeration:
- Some instances are fixed, others are silently missed
- User discovers gaps via screenshots 2 rounds later
- Re-do cycles waste time and trust

**Real example (M-DESIGN-03 testing):**
Instruction: "Check all button styling and hover effects."
Result: 8 components fixed, 4 missed. Found in the next screenshot round.
Root cause: No enumeration. Silent partial sweep. No confirmation step.

---

## When to Use

Trigger this skill when the instruction contains broad scope language:
`all`, `every`, `everywhere`, `across`, `throughout`, `any`, `check the page`

Or when you cannot list the exact instances from memory in 10 seconds.

This skill is especially important for:
- **US-DESIGN-007** — migrate ALL domain color token usages across components
- **US-DESIGN-008** — find ALL template cards that use tier-specific badge styles
- **US-DESIGN-009 / 010 / 011** — enumerate ALL components needing polish

---

## Workflow

### Step 1 — Extract the pattern from the instruction

Parse the instruction for:
- **What** to find (a CSS class, a component, a method, a pattern)
- **Where** to look (one page, all pages, one module, all modules)
- **What kind** of change (style fix, token replace, method rename, test add)

Example:
> "Fix button hover effects across the Landing Page"
- What: hover CSS on button elements
- Where: LandingPage.tsx and its child components
- Kind: CSS class / token replacement

---

### Step 2 — Search for all instances

Run `bash skills/enumerate-and-confirm-scope/scripts/find-pattern.sh <pattern> <glob> <path>`

#### [FRONTEND]
```bash
# Find by Tailwind class pattern
bash skills/enumerate-and-confirm-scope/scripts/find-pattern.sh "hover:" "*.tsx" "client/src"

# Find hardcoded colors to replace with tokens
bash skills/enumerate-and-confirm-scope/scripts/find-hardcoded-colors.sh client/src

# Find all usages of a specific component
bash skills/enumerate-and-confirm-scope/scripts/find-pattern.sh "<NumberStepper" "*.tsx" "client/src"

# Find token usages (for US-DESIGN-007 domain color migration)
bash skills/enumerate-and-confirm-scope/scripts/find-pattern.sh "bg-teal\|text-teal\|border-teal" "*.tsx" "client/src"
```

#### [BACKEND]
```bash
# Find all REST endpoints of a type
bash skills/enumerate-and-confirm-scope/scripts/find-pattern.sh "@Get\|@Post\|@Put\|@Delete" "*.ts" "api/src"

# Find all usages of a service or method
bash skills/enumerate-and-confirm-scope/scripts/find-pattern.sh "paymentsService\." "*.ts" "api/src"

# Find all Prisma queries for a model
bash skills/enumerate-and-confirm-scope/scripts/find-pattern.sh "prisma\.subscription\." "*.ts" "api/src"
```

#### [TESTING]
```bash
# Find all test files for a module
bash skills/enumerate-and-confirm-scope/scripts/find-pattern.sh "describe.*Payments\|describe.*Auth" "*.spec.ts" "api/tests"

# Find tests missing a specific assertion
bash skills/enumerate-and-confirm-scope/scripts/find-pattern.sh "expect(" "*.spec.ts" "api/tests"
```

---

### Step 3 — Classify each instance

For every match, assign one of three actions:

| Action | Meaning |
|--------|---------|
| **Fix** | Change needed — does not conform to target pattern |
| **Skip** | Already correct — changing it would be regression |
| **Review** | Ambiguous — needs design decision before touching |

Build a table:

| Instance | File : Line | Action | Reason |
|----------|-------------|--------|--------|
| Primary CTA | LandingPage.tsx:142 | Fix | Uses `bg-teal-500`, should be `bg-primary` |
| Nav button | AppHeader.tsx:67 | Fix | No hover state defined |
| Submit button | PropertyPanel.tsx:89 | Skip | Already uses `bg-primary hover:bg-primary/90` |
| Icon button | RightSidebar.tsx:34 | Review | Design intent unclear — icon-only vs labeled |

---

### Step 4 — Present the list and get confirmation

**Do not implement yet.** Present the classified table and ask:

> "I found N instances. Plan:
> **Fix (N):** [file:line list]
> **Skip (M):** [list + reason]
> **Review (K):** [list + question]
> Confirm scope or adjust before I proceed?"

Wait for explicit confirmation before Step 5.

---

### Step 5 — Implement in enumerated order

Work top-to-bottom through the confirmed Fix list.
After each file, note completion inline:

```
✅ LandingPage.tsx:142 — bg-teal-500 → bg-primary
✅ AppHeader.tsx:67 — added hover:bg-accent
⚠️ RightSidebar.tsx:34 — flagged for design review
```

---

### Step 6 — Completion report

After all changes:

> "Fixed N/N items. Skipped M (already correct). ⚠️ K items flagged for review:
> [list what needs a design decision]"

---

## Applies to Future Stories

| Story | Broad instruction risk | Pattern to enumerate |
|-------|----------------------|----------------------|
| US-DESIGN-007 | "Migrate all domain colors" | All `bg-teal-*`, `text-teal-*`, hardcoded hex values in components |
| US-DESIGN-008 | "Update all template badges" | All `<TemplateBadge>` usages and tier prop variants |
| US-DESIGN-009 | "Polish TemplatesPage" | All sub-components rendered on the templates page |
| US-DESIGN-010 | "Polish editor toolbar" | All toolbar buttons, dividers, icon states |
| US-DESIGN-011 | "Polish AI Chat" | All chat UI elements: bubbles, input, send button, scroll area |

---

## Edge Cases

| Scenario | Resolution |
|----------|------------|
| Search returns 50+ matches | Group by file/page, show summary counts, ask user to narrow scope first |
| Pattern appears in vendor/generated files | Auto-exclude, note in the skip list |
| User says "yes fix all" without reviewing the list | Proceed, but note in completion report every file changed |
| Fix in one place breaks a shared component | Flag immediately — do not silently revert |
| Pattern in test files too | Ask explicitly: "Do you want test files updated as well?" |
| Some instances require a new component (not a fix) | Flag as Review — scope expands, needs confirmation |

---

## Scripts

- [`scripts/find-pattern.sh`](scripts/find-pattern.sh) — search for any string pattern with file:line output and count
- [`scripts/find-hardcoded-colors.sh`](scripts/find-hardcoded-colors.sh) — find all hardcoded hex/rgb/hsl/Tailwind color classes that should be tokens

---

*Skill created: 2026-04-22*
