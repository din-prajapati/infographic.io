---
name: runtime-first-implementation
version: 1.0.0
description: >
  Trace the runtime dependency chain before implementing any spec change.
  The spec describes intent. The runtime is what the browser or server actually
  executes. Always verify they agree before writing a single line of code.
domains:
  - frontend    # CSS cascade, component tree, import chain, Vite entry
  - backend     # NestJS module graph, DI container, middleware chain, Prisma
  - testing     # Test setup chain, fixture resolution, mock boundaries
triggers:
  - "implement"
  - "add feature"
  - "edit file"
  - "change X in"
  - "update globals.css"
  - "edit the CSS"
  - "modify the config"
  - "add endpoint"
  - "add module"
  - "inject service"
  - "update token"
  - "migrate color"
when_to_skip:
  - Trivial one-liner in a self-contained file with no importers
  - Documentation-only changes (md, comments)
  - Adding a brand-new file that nothing depends on yet
---

# Skill: runtime-first-implementation

## Problem

The spec says "edit file X."
You edit file X correctly.
The change has no visible effect because:

- File X is never imported by the entry point
- A later file overrides what X sets (CSS cascade, provider re-declaration)
- The runtime resolves a different version or module

This is the single largest source of invisible bugs in this codebase.
The code is correct. The wiring is wrong. Nobody checked the wiring.

**Real example (M-DESIGN-03):**
Story said "edit `globals.css` to update `:root` tokens."
`globals.css` was edited correctly. Browser showed no change.
Root cause: `index.css` had its own `:root {}` block that loaded after
`globals.css` and overrode every token. The file was never imported anyway.
Two full iteration cycles wasted. A 60-second `grep` would have caught it.

---

## When to Use

Invoke this skill **before writing any implementation** when:
- You are editing a CSS / token / config file
- You are adding a new NestJS module, service, or provider
- You are changing something that other files depend on
- The story says "edit file X" without explaining how X connects to the runtime
- You are migrating tokens (US-DESIGN-007, US-DESIGN-008) — critical here

---

## Workflow

### Step 0 — List target files from the spec

Write out every file the story/task mentions. Do not start implementing yet.

---

### Step 1 — Trace who imports the target file

Run `bash skills/runtime-first-implementation/scripts/trace-imports.sh <target-file>`

#### [FRONTEND]
```bash
grep -rn "import.*<filename>\|@import.*<filename>" \
  client/src --include="*.ts" --include="*.tsx" --include="*.css"
```
**Key question:** Is the target file reachable from `client/src/main.tsx` or `client/src/index.css`?

#### [BACKEND]
```bash
grep -rn "import.*<ClassName>" api/src --include="*.ts"
grep -n "imports:" api/src/app.module.ts
```
**Key question:** Is the module registered in `AppModule.imports` or a sub-module's imports?

---

### Step 2 — Trace what the target file imports

#### [FRONTEND — CSS]
```bash
grep -n "@import\|url(" client/src/styles/<target>.css
```
**Key question:** Does your file rely on variables defined in a file that loads after it?

#### [FRONTEND — Component]
Read the component's import block. Confirm all hooks, stores, and contexts
are provided higher in the component tree.

#### [BACKEND]
```bash
# Check module dependencies
grep -n "imports:\|providers:\|exports:" api/src/<module>/<module>.module.ts
# Check for circular dependency risk
grep -rn "forwardRef" api/src --include="*.ts"
```

---

### Step 3 — Identify load order and override risk

Run `bash skills/runtime-first-implementation/scripts/trace-css-cascade.sh`

#### [FRONTEND — CSS]
- Find every `:root {}` block across all CSS files
- The **last** `:root` in load order wins — earlier ones are silently overridden
- Confirm your file's tokens are not overridden by `index.css` or a later import
- Check `index.css` for a pre-generated `:root {}` block from shadcn/Tailwind init

#### [BACKEND]
- `@Global()` modules provide to all modules — check if they redeclare your provider
- `DatabaseModule` is `@Global()` — do not re-provide `PrismaService`
- Middleware order in `api/src/main.ts` determines execution sequence

---

### Step 4 — Answer: "Will my change actually run?"

| Question | Frontend check | Backend check |
|----------|---------------|---------------|
| Is the file imported? | In import chain from `main.tsx` / `index.css` | Module in `AppModule.imports` |
| Will it be overridden? | No later `:root {}` block wins | No duplicate provider |
| Is runtime current? | Dev server running latest | NestJS restarted after module change |

If **any** answer is "no" or "unsure" — fix the wiring first, then implement.

---

### Step 5 — Implement

Only after Steps 1–4 are fully clear. Edit the target file with confidence.

---

### Step 6 — Verify the change took effect in the runtime

#### [FRONTEND — CSS tokens]
```javascript
// Browser console or Playwright test
getComputedStyle(document.documentElement).getPropertyValue('--primary')
// Must return your expected value, not Tailwind defaults like "0 0% 12%"
```

#### [FRONTEND — Component]
Open the page. Inspect the element in DevTools → Computed tab.
Confirm the prop or style is actually applied.

#### [BACKEND]
```bash
curl http://localhost:3001/api/v1/health
# Or call the specific endpoint and confirm the new behavior
```

---

## Applies to Future Stories

| Story | Risk | What to trace |
|-------|------|---------------|
| US-DESIGN-007 | Domain color tokens applied via CSS variables | CSS cascade — same risk as M-DESIGN-03 |
| US-DESIGN-008 | Template badge component uses tier prop | Component tree — confirm prop flows to correct element |
| US-DESIGN-009 | TemplatesPage polish — token usage | Computed styles — confirm tokens apply in page context |
| US-DESIGN-010 | Editor toolbar token migration | Multiple components share toolbar context — trace all |
| US-DESIGN-011 | AI Chat styling | Panel z-index, backdrop-filter stacking context risk |

---

## Edge Cases

| Scenario | Resolution |
|----------|------------|
| CSS file exists but is never imported | Add `@import` to `index.css`. Never assume a file loads. |
| Module declared but not in AppModule | Add to `AppModule.imports`. |
| Token defined in two files | Determine load order. Delete the duplicate in the lower-priority file. |
| Dev server caches old CSS | Hard reload (Ctrl+Shift+R) or restart `npm run dev`. |
| NestJS module circular dependency | Use `forwardRef()` — do not restructure the graph without mapping it first. |
| Tailwind JIT skips a utility class | Class must appear in a content file. Add to `index.css` directly as a static rule. |

---

## Scripts

- [`scripts/trace-imports.sh`](scripts/trace-imports.sh) — find all files that import a given file or module
- [`scripts/trace-css-cascade.sh`](scripts/trace-css-cascade.sh) — audit all `:root` blocks, `@import` chains, and load order

---

*Skill created: 2026-04-22*
