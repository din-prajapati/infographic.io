# Agile AI-Assisted Development Workflow

> **Problem this solves:** Vibe coding with AI generates code fast but leaves you with an unclear codebase, undocumented decisions, and no traceability between intent and code. This guide injects Agile discipline into that loop — so every AI session produces a shippable, reviewable PR tied to a clear user story.

---

## Core Principle: Scope Before You Prompt

> Define the PR before you write the prompt. The AI implements; you define scope and acceptance.

The discipline has two halves:
1. **Before the session** — write a User Story + Acceptance Criteria (takes 5 min)
2. **During/after the session** — AI codes, you review the PR against those ACs

This produces a project where every feature is traceable from `git log` back to a user story.

---

## The Session Protocol (Step-by-Step)

### Step 1 — Pick ONE story from the backlog

From [agile/AGILE_INDEX.md](../agile/AGILE_INDEX.md), find the next active epic and pick the top `🔲 Not Started` story. Each story should be completable in **one AI session** (≤ 2–4 hours of AI coding time). If it feels bigger, split it.

Alternate backlog source: [roadmap/POST_MVP_BACKLOG.md](../roadmap/POST_MVP_BACKLOG.md)

**Rule:** Never mix two features in one session. The moment scope creeps, stop and create a new story for the second thing.

---

### Step 2 — Write the Story Card (before opening the AI chat)

Use this template — it takes 5 minutes but saves hours:

```markdown
## Story: <AREA>-<NNN> — <Short title>

**As a** <persona (e.g. "solo real estate agent")>
**I want** <one clear capability>
**So that** <the outcome / why it matters>

**Acceptance Criteria**
- [ ] AC1: <specific, testable condition>
- [ ] AC2: ...
- [ ] AC3: ...

**Out of scope (do NOT implement)**
- X
- Y

**Test plan**
- Manual: <what to click/verify>
- Automated: <test file or `npm run` command to add/update>

**Files likely touched**
- `api/src/modules/...`
- `client/src/...`
```

The "Out of scope" section is critical — it tells the AI what to ignore and prevents feature drift.

---

### Step 3 — Write the AI Prompt from the Story Card

Open a new Claude Code / Cursor session and paste:

```
Context: InfographicAI SaaS — NestJS API (port 3001) + React frontend (port 5000 via Express proxy).
See CLAUDE.md for architecture.

Story: <paste story card>

Implementation rules:
- One PR worth of changes only — do NOT implement anything in "Out of scope"
- Keep each changed file focused; do not refactor surrounding code
- Add/update the test plan items in the story card
- When done, summarize: files changed, ACs checked, test command to run
```

---

### Step 4 — Review Against ACs (not against "does it look right")

When the AI finishes, go through each AC checkbox one by one:
- **Pass**: mark ✅ in the story card
- **Fail**: tell the AI exactly which AC failed and what you observed — one fix at a time
- **Blocked**: note why (missing env var, external dependency) and defer

Do **not** approve the work because it "looks done." ACs are the exit condition.

---

### Step 5 — Commit as a PR

> **Full branch + commit conventions:** [agile/GIT_STRATEGY.md](../agile/GIT_STRATEGY.md)  
> Branch: `feat/{domain}-{story-slug}` · Commit: `feat(scope): what — US-{DOMAIN}-{NNN}`

```bash
git checkout -b feat/<domain>-<story-slug>     # e.g. feat/design-us-design-002-editor-tokens
git add <specific files>     # never git add -A — stage by file name
git commit -m "feat(<area>): <what and why> — US-<DOMAIN>-<NNN>"
# Push and open PR
gh pr create --title "[US-<DOMAIN>-<NNN>] <story title>" --body "$(cat <<'EOF'
## Story
<paste story card>

## ACs
- [x] AC1
- [x] AC2

## Test
`npm run test:unit` — all passing
Manual: verified <flow> in localhost:5000

🤖 AI-assisted via Claude Code
EOF
)"
```

The PR description **is** the story card. Anyone reading git history will understand exactly what was built and why.

---

### Step 6 — Update Trackers

After the PR is merged, update:
1. [docs/MVP_LAUNCH_TRACKER.md](../MVP_LAUNCH_TRACKER.md) — tick the task, note the PR number
2. [docs/NORTH_STAR.md](../NORTH_STAR.md) — update "Current Status" if a milestone changed

---

## Session Anti-Patterns to Avoid

| Anti-pattern | What happens | Fix |
|---|---|---|
| "Just add X while you're there" | Scope creep; untestable PR | Create a new story for X |
| Starting without ACs | AI guesses intent; you can't review | Write 3 ACs before prompting |
| `git add -A` | Accidentally commits `.env`, large files, unrelated changes | Always stage by file name |
| Running a full session without tests | Feature works today, broken in 2 PRs | Add one test per AC minimum |
| Asking AI to "fix the bug" without reading the error | AI guesses; wastes 3 iterations | Read error → diagnose → give AI the diagnosis |
| One giant PR for a feature | Unreviable; hard to roll back | Max one user story per PR |

---

## Backlog Grooming with AI

Before sprint planning, use this prompt to decompose a large feature into PR-sized slices:

```
Feature: <feature name from POST_MVP_BACKLOG.md>
Current state: <what exists today in code>
Target state: <what the user should be able to do>

Break this into PR-sized user stories. Each story should:
- Be completable in one AI coding session (2–4 hours)
- Have 2–4 acceptance criteria
- Touch ≤ 5 files
- Be independently mergeable (no story depends on an unmerged story)

Output as a list of story cards using the template above.
```

Paste the output into [roadmap/POST_MVP_BACKLOG.md](../roadmap/POST_MVP_BACKLOG.md) as the sprint backlog.

---

## Definition of Done (Every Story)

- [ ] All ACs checked ✅ in the story card
- [ ] `npm run test:unit` passes
- [ ] Manual test of the changed flow done on `localhost:5000`
- [ ] PR description contains story card + AC checklist
- [ ] [MVP_LAUNCH_TRACKER.md](../MVP_LAUNCH_TRACKER.md) updated (task ticked, PR linked)
- [ ] No console errors in browser for the changed flow
- [ ] No TypeScript errors (`npm run check`)

---

## Cadence Suggestion (for solo/small team)

| Rhythm | Activity |
|--------|----------|
| **Start of work** | Read NORTH_STAR.md → pick top story from backlog |
| **Per story** | Write card → AI session → review ACs → PR |
| **End of work** | Update tracker, note any blockers |
| **Weekly** | Groom backlog with AI (decompose next 3 features into stories) |

---

## Story ID Naming Convention

`<DOMAIN>-<NNN>` — examples:

| Domain | Prefix | Example |
|--------|--------|---------|
| Payments | PAY | PAY-001 |
| Auth / Users | AUTH | AUTH-001 |
| Canvas Editor | EDIT | EDIT-001 |
| AI Generation | AI | AI-001 |
| Analytics / Usage | USAGE | USAGE-001 |
| Infrastructure | INFRA | INFRA-001 |
| Team / Org | ORG | ORG-001 |

Store active story cards in `docs/agile/epics/{EPIC-ID}/stories/{US-ID}/STORY.md`.  
Full folder hierarchy and git strategy: [agile/AGILE_INDEX.md](../agile/AGILE_INDEX.md) · [agile/GIT_STRATEGY.md](../agile/GIT_STRATEGY.md)

> **Legacy:** `docs/stories/` had a flat layout. New work uses the hierarchical `docs/agile/epics/` structure above.
