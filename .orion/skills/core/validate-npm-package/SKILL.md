# Skill: validate-npm-package

**Trigger:** `/validate-npm-package`  
**Agent:** reviewer-agent (Lin)  
**Tools:** Read · Grep · Glob · Bash  
**When to run:** Before every `npm publish`, after any rename/delete/restructure of `bin/` or `lib/`.

---

## Purpose

Run a structured pre-publish checklist against an npm CLI package.  
Every check below maps to a documented failure mode in `NPM_CLI_RULES.md`.  
Report ✅ / ❌ / ⚠️ for each item. Exit with a clear PASS or FAIL summary.

---

## Inputs

Read these files before starting:
- `package.json` (required)
- `.gitattributes` (may be absent — that is itself a failure)
- Every file listed in `package.json` → `bin{}`
- Every file listed in `package.json` → `scripts{}`

---

## Checklist

Work through each section in order. Run the verification command shown.  
Never skip a section — report ⚠️ (warning) for items that don't apply rather than omitting them.

---

### Section 1 — package.json fields

| # | Check | How to verify |
|---|-------|--------------|
| 1.1 | `name` uses scoped format `@org/package` | Read `package.json` → `name` field |
| 1.2 | `version` is not `0.0.0` or unchanged from a previous identical release | Read `version`; check `git log --oneline -5` for version bump commit |
| 1.3 | `main` field file exists on disk | `Glob` the path in `main` |
| 1.4 | `engines.node` is present | Read `engines` field |
| 1.5 | `files[]` lists `bin/` if any bin entry files live there | Cross-reference `bin{}` paths with `files[]` |
| 1.6 | Every path in `files[]` actually exists on disk | `Glob` each entry |
| 1.7 | `scripts.lint`, `scripts.test`, and any other scripts reference files that exist | `Grep` each script value for a file path; `Glob` to verify existence |

---

### Section 2 — Binary entry correctness

For each entry in `package.json` → `bin{}`:

| # | Check | How to verify |
|---|-------|--------------|
| 2.1 | Path does **not** start with a hidden directory (`.`) | Inspect the path string |
| 2.2 | File has `.mjs`, `.js`, or `.cjs` extension | Inspect the path string |
| 2.3 | File exists on disk | `Glob` the path |
| 2.4 | First line is `#!/usr/bin/env node` | Read first line of the file |
| 2.5 | Git file mode is `100755` (executable) | Run `git ls-files --stage <path>` and check the leading mode |

---

### Section 3 — Cross-platform: ESM imports

Read every file in `bin/` and `.orion/bin/`:

| # | Check | How to verify |
|---|-------|--------------|
| 3.1 | No `import(join(...))` or `import(resolve(...))` calls that pass a raw Windows path | `Grep` pattern `import\(.*join\|import\(.*resolve` in bin files |
| 3.2 | Any computed absolute path passed to `import()` is wrapped in `pathToFileURL(...).href` | `Grep` for `import(path` — confirm `pathToFileURL` is present nearby |
| 3.3 | No `../../` import that escapes the package root (i.e. goes above `node_modules/<pkg>/`) | From each file's location, count `../` depth; flag if it exceeds the package root |

---

### Section 4 — Cross-platform: line endings and execute bits

| # | Check | How to verify |
|---|-------|--------------|
| 4.1 | `.gitattributes` exists | `Glob ".gitattributes"` |
| 4.2 | `.gitattributes` has `* text=auto eol=lf` or equivalent | Read `.gitattributes`; confirm LF rules for `*.mjs`, `*.js`, `*.sh` |
| 4.3 | All `bin/` files: git mode `100755` | `Bash: git ls-files --stage bin/` |
| 4.4 | All `.sh` hook scripts: git mode `100755` | `Bash: git ls-files --stage .orion/hooks/*.sh` (or equivalent hooks path) |

---

### Section 5 — Runtime vs content separation

Read `lib/init.js` (or the equivalent scaffold/init command):

| # | Check | How to verify |
|---|-------|--------------|
| 5.1 | `init` does NOT call `copyDirRecursive` with the full framework root as source | `Grep "copyDirRecursive"` in init file; confirm it enumerates content dirs (`skills`, `agents`, `hooks`, `rules`) individually, not the whole root |
| 5.2 | `bin/` and `lib/` are never listed as copy targets into the host project | `Grep` init file for any path containing `bin` or `lib` in a copy destination |
| 5.3 | `runOrionInstall` (or equivalent) invokes the binary from `frameworkRoot` / `PKG_ROOT`, not from a path inside `targetDir` | Read the install helper function |

---

### Section 6 — Single binary

| # | Check | How to verify |
|---|-------|--------------|
| 6.1 | `package.json` `bin{}` has exactly one entry (or deliberate multiple with non-overlapping responsibilities) | Count keys in `bin{}` |
| 6.2 | No two bin entry files handle the same top-level verb (e.g. both handle `init`) | Read the `switch` or verb dispatch in each bin file |

---

## Output format

Print a results table:

```
Section 1 — package.json fields
  ✅ 1.1  name is scoped: @orion-ai/orion
  ✅ 1.2  version: 0.4.0 (bumped in last 3 commits)
  ✅ 1.3  main: bin/orion.mjs — exists
  ✅ 1.4  engines.node: >=18.0.0
  ✅ 1.5  files[] includes bin/
  ✅ 1.6  all files[] paths exist
  ✅ 1.7  scripts reference existing files

Section 2 — Binary entries
  ✅ 2.1  bin/orion.mjs — not hidden
  ✅ 2.2  bin/orion.mjs — .mjs extension
  ✅ 2.3  bin/orion.mjs — exists
  ✅ 2.4  bin/orion.mjs — shebang #!/usr/bin/env node
  ✅ 2.5  bin/orion.mjs — 100755

...

──────────────────────────────────────────
PASS  22/22 checks passed.
──────────────────────────────────────────
```

Or on failure:

```
  ❌ 2.1  .orion/bin/orion.mjs — starts with hidden dir; pacote will strip it
          Fix: move to bin/orion.mjs and use a thin delegator
  ❌ 4.1  .gitattributes missing
          Fix: create with * text=auto eol=lf + explicit *.mjs *.sh rules
  ❌ 4.3  bin/orion.mjs — 100644 (not executable)
          Fix: git update-index --chmod=+x bin/orion.mjs

──────────────────────────────────────────
FAIL  3 issues found. Fix before publishing.
──────────────────────────────────────────
```

---

## Auto-fixable items

If the user asks to fix after a FAIL report, apply these automatically:

| Issue | Auto-fix |
|-------|---------|
| Missing `.gitattributes` | Create with the standard template from `NPM_CLI_RULES.md` |
| `100644` on bin or `.sh` files | `git update-index --chmod=+x <file>` for each |
| `scripts.lint` references missing file | Update to the correct binary path |
| `main` references missing file | Update to the correct path |

**Do NOT auto-fix:**
- Restructuring `bin{}` paths (needs human decision)
- Changing `files[]` (risk of omitting content)
- Rewriting ESM imports (risk of logic errors)

---

## Reference

`NPM_CLI_RULES.md` — full rationale for every rule above.
