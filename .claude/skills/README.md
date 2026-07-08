# Engineering Skills — InfographicAI

> **What this is:** A library of repeatable engineering workflows born from the
> EPIC-DESIGN-02 retrospective. Each skill documents a class of problem, the exact
> steps to avoid it, and executable scripts to run those steps.
>
> **What this is not:** Product logic, story-specific code, or AI prompts.
> Skills are story-agnostic, model-agnostic, and domain-separated.

---

## Quick Reference

| Skill | When to reach for it | 30-second summary |
|-------|---------------------|-------------------|
| [runtime-first-implementation](#1-runtime-first-implementation) | Before touching any file that other files depend on | Trace the import chain. Confirm your edit will actually run in the browser/server. |
| [enumerate-and-confirm-scope](#2-enumerate-and-confirm-scope) | When the instruction says "all", "everywhere", "check the page" | Find every instance. Classify Fix/Skip/Review. Get confirmation. Then implement. |
| [contract-first-testing](#3-contract-first-testing) | Before writing any test | Write `expect()` first. Pin exact value + exact location. Then fill in the read path. |
| [verification-gates](#4-verification-gates) | Before marking any story Done or opening a PR | Run Gate 1 always. Gate 2 for UI. Gate 3 for CSS. Gate 4 for backend. |

---

## Why These Skills Exist

During M-DESIGN-03 (token foundation), four recurring problems caused multiple re-work cycles:

| Problem | Cost | Skill that prevents it |
|---------|------|------------------------|
| `globals.css` edited correctly — browser showed old tokens | 2 iteration cycles | `runtime-first-implementation` |
| "Fix all buttons" — 4 out of 12 missed | 1 screenshot round | `enumerate-and-confirm-scope` |
| E2E test false-positived on Tailwind utility class | 2 iterations | `contract-first-testing` |
| Visual regressions committed — found via screenshots | 3 screenshot rounds | `verification-gates` |

Total overhead added by these skills: **~11 minutes per story.**
Total iteration cycles eliminated: **~2–4 rounds per story.**

---

## Directory Structure

```
skills/
├── README.md                               ← you are here
├── SKILLS.md                               ← index: triggers, story map, authoring rules
│
├── runtime-first-implementation/
│   ├── SKILL.md                            ← full workflow documentation
│   └── scripts/
│       ├── trace-imports.sh                ← who imports this file?
│       └── trace-css-cascade.sh            ← CSS :root blocks + import chain audit
│
├── enumerate-and-confirm-scope/
│   ├── SKILL.md
│   └── scripts/
│       ├── find-pattern.sh                 ← search any pattern, file:line output
│       └── find-hardcoded-colors.sh        ← find all hardcoded hex/rgba/palette classes
│
├── contract-first-testing/
│   ├── SKILL.md
│   └── scripts/
│       ├── token-test-helpers.ts           ← Playwright helpers: getCSSToken, setTheme, etc.
│       └── e2e-test-template.ts            ← copy-paste E2E test file template
│
└── verification-gates/
    ├── SKILL.md
    └── scripts/
        ├── pre-commit-gate.sh              ← Gate 1: TypeScript + unit tests
        └── visual-checklist.md            ← Gate 2: 5-page browser checklist
```

---

## How to Invoke a Skill

### In a prompt to Claude

Name the skill explicitly at the start of your request:

```
Using runtime-first-implementation, implement the domain color token
migration in globals.css for US-DESIGN-007.
```

```
Using enumerate-and-confirm-scope, find all components that use
hardcoded teal colors and need updating for US-DESIGN-007.
```

```
Using contract-first-testing, write E2E tests for the TemplatesPage
token changes in US-DESIGN-009.
```

```
Using verification-gates, confirm US-DESIGN-010 is ready to close.
```

Claude auto-triggers on phrase patterns too — see [SKILLS.md](SKILLS.md) for the full trigger list.

### Running scripts directly

All shell scripts run from the **project root**:

```bash
# runtime-first-implementation
bash skills/runtime-first-implementation/scripts/trace-imports.sh globals.css
bash skills/runtime-first-implementation/scripts/trace-css-cascade.sh

# enumerate-and-confirm-scope
bash skills/enumerate-and-confirm-scope/scripts/find-pattern.sh "bg-teal" "*.tsx" "client/src"
bash skills/enumerate-and-confirm-scope/scripts/find-hardcoded-colors.sh client/src

# verification-gates — Gate 1
bash skills/verification-gates/scripts/pre-commit-gate.sh

# verification-gates — Gate 2 (open in editor/browser)
# See: skills/verification-gates/scripts/visual-checklist.md
```

---

## Skill 1 — runtime-first-implementation

**Problem:** You edit a file. Nothing changes in the browser.
The file is correct. The wiring is wrong. Nobody checked.

**The rule:** Before writing a single line of implementation, trace the runtime.

### Step-by-step

```
1. List the target files from the spec/task
2. Run trace-imports.sh — confirm the file is actually imported
3. Run trace-css-cascade.sh — confirm no later :root block overrides it
4. Answer: "Will my change actually run?" (yes = proceed, no = fix wiring first)
5. Implement
6. Verify in the browser/server that the change took effect
```

### Scripts

**`trace-imports.sh`** — finds every file that imports a given target:
```bash
bash skills/runtime-first-implementation/scripts/trace-imports.sh globals.css
bash skills/runtime-first-implementation/scripts/trace-imports.sh PaymentsService
bash skills/runtime-first-implementation/scripts/trace-imports.sh design-tokens
```

Output: TypeScript imports, CSS `@import`s, HTML references, NestJS module declarations.
**Red flag:** "WARNING: not imported by anything" → fix the import chain first.

---

**`trace-css-cascade.sh`** — audits all `:root` blocks and `@import` chains:
```bash
bash skills/runtime-first-implementation/scripts/trace-css-cascade.sh
```

Output:
- All `:root {}` blocks across `client/src` (last one wins — earlier ones overridden)
- `@import` order in `index.css`
- Whether `globals.css` and `design-tokens.css` are in the chain

**Red flag:** Your file's `:root` block appears before a later `:root` in `index.css`
→ the later block silently overrides your tokens.

### Domain notes

| Domain | What to trace |
|--------|--------------|
| **Frontend / CSS** | `@import` chain from `index.css`; `:root` block load order |
| **Frontend / Component** | Import chain from `main.tsx`; context providers in the tree |
| **Backend / NestJS** | `AppModule.imports` list; `@Global()` module providers |
| **Backend / Prisma** | Schema file; `npx prisma generate` after schema changes |

---

## Skill 2 — enumerate-and-confirm-scope

**Problem:** "Fix all button hover effects" → 8 fixed, 4 missed → found in screenshots.

**The rule:** Never do a silent partial sweep.
Enumerate → classify → confirm → implement.

### Step-by-step

```
1. Extract: what to find, where to look, what kind of change
2. Run find-pattern.sh or find-hardcoded-colors.sh to get the full list
3. Classify each match: Fix | Skip | Review
4. Present the classified table to the user — get confirmation
5. Implement the confirmed Fix list top-to-bottom
6. Report: "Fixed N/N. Skipped M. ⚠️ K need design review."
```

### Scripts

**`find-pattern.sh`** — finds all occurrences of a string pattern:
```bash
# All hover states in TSX files
bash skills/enumerate-and-confirm-scope/scripts/find-pattern.sh "hover:" "*.tsx" "client/src"

# All teal color usages (for US-DESIGN-007 migration)
bash skills/enumerate-and-confirm-scope/scripts/find-pattern.sh "bg-teal\|text-teal\|border-teal" "*.tsx" "client/src"

# All NumberStepper usages
bash skills/enumerate-and-confirm-scope/scripts/find-pattern.sh "<NumberStepper" "*.tsx" "client/src"

# All REST endpoints in backend
bash skills/enumerate-and-confirm-scope/scripts/find-pattern.sh "@Get\|@Post\|@Put\|@Delete" "*.ts" "api/src"
```

Output: matched lines with `file:line:content`, affected file list, total count.

---

**`find-hardcoded-colors.sh`** — comprehensive hardcoded color audit:
```bash
# Scan entire frontend
bash skills/enumerate-and-confirm-scope/scripts/find-hardcoded-colors.sh client/src

# Scan just one area
bash skills/enumerate-and-confirm-scope/scripts/find-hardcoded-colors.sh client/src/components/editor
```

Output: 5 sections — hex codes, rgba values, Tailwind palette classes, inline style colors, box shadows.
Use before any token migration story (US-DESIGN-007, 008, 009, 010, 011).

### Confirmation format (paste into chat)

```
I found N instances. Here's the plan:

Fix (N):
  - LandingPage.tsx:142 — bg-teal-500 → bg-primary
  - AppHeader.tsx:67    — no hover state → add hover:bg-accent

Skip (M):
  - PropertyPanel.tsx:89 — already uses bg-primary (correct)

Review (K):
  - RightSidebar.tsx:34 — design intent unclear (icon-only button variant)

Confirm scope or adjust?
```

---

## Skill 3 — contract-first-testing

**Problem:** Test scans all CSS rules for a banned string → false-positive on a Tailwind utility.

**The rule:** Every test must answer three questions before writing `expect()`:
1. **What** is the exact expected value?
2. **Where exactly** does that value live?
3. **How** do I read that specific location?

### Step-by-step

```
1. Write the contract: "When [condition], [location] equals [exact value]"
2. Identify the exact read path (getComputedStyle? HTTP response? DOM attribute?)
3. Write the expect() line first — then fill in the read path
4. Check for false-positive risk (would this pass if the feature was broken?)
5. Name the test with the contract: "TC-XXX-01 [P0] --primary contains 207 in light mode"
6. Add to the correct test suite
```

### Using token-test-helpers.ts

Import the helpers at the top of any E2E test file:

```typescript
import {
  getCSSToken,          // reads :root CSS custom property — use for all token tests
  getCSSTokens,         // reads multiple tokens at once
  getComputedStyleProp, // reads computed style of a DOM element
  setTheme,             // sets localStorage theme + reloads
  assertToken,          // assert token contains substring (descriptive errors)
  assertTokenNot,       // assert token does NOT contain substring
  assertElementVisible, // assert element visible with non-zero bounding box
} from '../skills/contract-first-testing/scripts/token-test-helpers';
```

**Common patterns:**

```typescript
// ✅ Test a specific CSS token
const primary = await getCSSToken(page, '--primary');
expect(primary).toContain('207'); // blue hue

// ✅ Test computed style of a button
const bg = await getComputedStyleProp(page, '[data-testid="cta-btn"]', 'background-color');
expect(bg).toBe('rgb(12, 160, 235)');

// ✅ Set theme before test
await setTheme(page, 'dark');
const bg = await getCSSToken(page, '--background');
expect(bg).toContain('45'); // warm hue

// ✅ Descriptive assertion
await assertToken(page, '--primary', '207', 'light mode primary must be blue hue 207');

// ❌ Never do this — scans ALL stylesheet rules, causes false positives
const rules = Array.from(document.styleSheets).flatMap(s => Array.from(s.cssRules));
const hasTeal = rules.some(r => r.cssText.includes('rgba(20,184,166'));
```

### Starting a new E2E test file

```bash
cp skills/contract-first-testing/scripts/e2e-test-template.ts \
   e2e/m-design-04-domain-colors.spec.ts
```

The template includes:
- Correct suite structure (describe → light → dark → behavior → human-skip)
- `setTheme` in `beforeEach` blocks
- TC ID naming convention
- `test.skip` pattern for manual-only tests

### Anti-patterns quick reference

| Do NOT | Do instead |
|--------|-----------|
| Scan all CSS rules for banned string | `getCSSToken(page, '--token-name')` |
| `expect(el.className).toContain('blue')` | `getComputedStyleProp(page, sel, 'background-color')` |
| `expect(res.body).toBeDefined()` | `expect(res.body.status).toBe('PENDING')` |
| Mock the service under test | Mock only its dependencies |
| Name test "primary token loads" | Name it "TC-01 [P0] --primary resolves to hue 207 in light mode" |

---

## Skill 4 — verification-gates

**Problem:** Story marked done → visual regressions committed → found in screenshots.

**The rule:** Run the applicable gates. Every time. No exceptions.

### Gate tiers

| Gate | What | Run when | Command |
|------|------|----------|---------|
| **1** | TypeScript + unit tests | Always, before every commit | `bash skills/verification-gates/scripts/pre-commit-gate.sh` |
| **2** | Visual browser checklist | Any UI / component / CSS change | Open `skills/verification-gates/scripts/visual-checklist.md` |
| **3** | Playwright E2E token tests | Any `index.css` / `globals.css` / token change | `npx playwright test e2e/<milestone>.spec.ts` |
| **4** | API smoke + integration | Any NestJS / Prisma / middleware change | `curl localhost:3001/api/v1/health` + `npm run test:integration` |

### Gate 1 — running the script

```bash
bash skills/verification-gates/scripts/pre-commit-gate.sh
```

Output shows each gate with a formatted pass/fail summary.
Exit code 0 = safe to commit. Exit code 1 = do not commit.

### Gate 2 — using the visual checklist

Open [skills/verification-gates/scripts/visual-checklist.md](verification-gates/scripts/visual-checklist.md).

Five pages to check: Landing, Templates, Editor, Account, Pricing.
Two modes each: Light + Dark.

**Minimum checks every run:**
- Background colors match warm palette (no teal, no navy)
- Primary buttons are blue `#0ca0eb`
- Hover states — text is always visible
- Dropdowns / modals appear ABOVE all content
- Dark-bg sections use dark glass (not white glass)
- DevTools Console token spot checks

### Gate 3 — running E2E tests

```bash
# Run existing milestone tests
npx playwright test e2e/m-design-03-token-foundation.spec.ts --reporter=list

# Run all E2E tests
npx playwright test --reporter=list

# Run a single test by name pattern
npx playwright test --grep "TC-DS-005-01"
```

Requires `npm run dev` to be running in another terminal.

### Gate 4 — API smoke

```bash
# Health check (always)
curl http://localhost:3001/api/v1/health

# Specific module unit test
cd api && npx vitest run tests/<module>/<service>.spec.ts --reporter=verbose

# Integration tests (requires .env.test with Neon DB URL)
npm run test:integration
```

### Pre-story Done checklist

Before closing any story, confirm in STORY.md:

```markdown
## Definition of Done
- [x] Gate 1: npm run check + npm run test:unit pass
- [x] Gate 2: Visual checklist — all pages light + dark  ← frontend stories
- [x] Gate 3: E2E token tests pass                       ← CSS/token stories
- [x] Gate 4: API smoke + integration pass               ← backend stories
- [x] PR opened and linked in STORY.md
```

---

## Adding a New Skill

When a new recurring problem is identified in a retrospective:

### 1. Create the directory

```bash
mkdir -p skills/<skill-name>/scripts
```

### 2. Create SKILL.md

Copy the structure:
```markdown
---
name: <skill-name>
version: 1.0.0
description: >
  One paragraph. What problem does this skill prevent?
domains:
  - frontend | backend | testing | all
triggers:
  - "trigger phrase 1"
  - "trigger phrase 2"
when_to_skip:
  - Scenario where this skill does not apply
---

# Skill: <skill-name>

## Problem
## When to Use
## Workflow
  ### [FRONTEND] steps
  ### [BACKEND] steps
## Applies to Future Stories
## Edge Cases
## Scripts
```

### 3. Add scripts

- Shell scripts: executable bash, run from project root
- TypeScript helpers: importable from test files
- No manual steps embedded in scripts — everything automated

### 4. Register in SKILLS.md

Add a row to the index table and the story applicability table.

### 5. Update CLAUDE.md (optional)

If the skill should be loaded into Claude's context automatically, reference it in `CLAUDE.md`.

---

## Applicable Stories

| Story | Milestone | Skills to invoke |
|-------|-----------|-----------------|
| US-DESIGN-005 | M-DESIGN-03 | `runtime-first-implementation`, `contract-first-testing`, `verification-gates` |
| US-DESIGN-006 | M-DESIGN-03 | `runtime-first-implementation`, `verification-gates` |
| US-DESIGN-007 | M-DESIGN-04 | `runtime-first-implementation`, `enumerate-and-confirm-scope`, `contract-first-testing` |
| US-DESIGN-008 | M-DESIGN-04 | `enumerate-and-confirm-scope`, `contract-first-testing`, `verification-gates` |
| US-DESIGN-009 | M-DESIGN-05 | `enumerate-and-confirm-scope`, `verification-gates` |
| US-DESIGN-010 | M-DESIGN-05 | `enumerate-and-confirm-scope`, `contract-first-testing`, `verification-gates` |
| US-DESIGN-011 | M-DESIGN-05 | `enumerate-and-confirm-scope`, `verification-gates` |

---

## Skill Authoring Rules (summary)

1. **Story-agnostic** — no hardcoded story IDs, component names, or token values
2. **Model-agnostic** — works with Claude Sonnet, Opus, or any AI assistant
3. **Domain-separated** — `[FRONTEND]` and `[BACKEND]` steps are explicitly labeled; never mixed
4. **Scripts over prose** — every workflow step has a runnable command; no "manually check" steps without a script
5. **Problem-led** — every SKILL.md starts with the real incident that caused the skill to be created

---

*Created: 2026-04-22 | Retrospective: EPIC-DESIGN-02 M-DESIGN-03*
