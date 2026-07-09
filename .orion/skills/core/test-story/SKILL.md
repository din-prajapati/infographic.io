---
name: test-story
version: 1.0.0
description: >
  Stage 5 of the AI-SDLC pipeline. Invoke qa-agent to plan tests, then unit-test-agent
  and e2e-test-agent to write them. Runs all applicable gates and produces a test
  evidence section for the eventual PR.
triggers:
  - "test story"
  - "write tests"
  - "test US-"
  - "add tests for"
  - "test coverage for"
domains:
  - all
agents:
  - qa-agent
  - unit-test-agent
  - e2e-test-agent
---

# Skill: test-story

## Purpose

Take an implemented story and produce the test coverage that proves it works. Splits work between unit and E2E based on which AC is best tested at which level.

## Input

Required:
- **Story ID**

Optional:
- **Test types:** `unit | e2e | both` (default `both`)
- **Skip plan:** boolean (default `false` — meaning invoke qa-agent first)

## Protocol

### Step 1 — Load Context

Read:
- STORY.md — for ACs
- PROJECT_CONTEXT.yaml — for `stack.testing` and gates
- Implementation files (referenced in TASKS.md "Primary files touched")

### Step 2 — Invoke qa-agent for Test Plan

Unless `skip_plan` is true, invoke qa-agent first:

```
qa-agent: produce test plan for US-{ID}

Inputs:
  - STORY.md
  - PROJECT_CONTEXT.yaml.stack.testing
  
Output:
  - Test cases (Given/When/Then format)
  - Type assignment (unit vs E2E vs manual)
  - Gate assignment
  - Risk matrix
  - Hand-off briefs for unit-test-agent + e2e-test-agent
```

Update STORY.md "Test Cases" table with the plan.

### Step 3 — Invoke unit-test-agent

Pass the qa-agent unit hand-off brief:

```
unit-test-agent: write unit tests for US-{ID}

Coverage: ACs assigned to unit testing
Framework: {stack.testing}
Pattern: contract-first (read contract-first-testing skill)
Negative tests required: {agent_flags.test_agents.require_negative_tests}
```

unit-test-agent writes the spec file(s) and confirms they pass.

### Step 4 — Invoke e2e-test-agent

Pass the qa-agent E2E hand-off brief:

```
e2e-test-agent: write E2E tests for US-{ID}

Coverage: ACs assigned to E2E
Framework: {stack.testing}  (Playwright/Cypress/etc.)
Selectors: data-testid first, role second, text last
```

e2e-test-agent writes the spec file(s) and confirms they pass.

### Step 5 — Run All Applicable Gates

After both test agents declare done, run:

```bash
# Gate 1 (always)
{gate-1-commands}

# Gate 3 (if E2E added)
{gate-3-commands}

# Gate 4 (if backend tests added)
{gate-4-commands}
```

Confirm all pass.

### Step 6 — Update STORY.md Test Cases

Mark each test case row with its result:
```
| TC-{ID} | Unit | P0 | Given X, when Y, then Z | ✅ Pass | |
| TC-{ID} | E2E  | P1 | Given X, when Y, then Z | ✅ Pass | |
```

### Step 7 — Print Summary

```
✅ Test Coverage Complete for US-{ID}

qa-agent test plan: ✅ ({N} cases planned)
unit-test-agent:    ✅ ({N} unit tests added, all green)
e2e-test-agent:     ✅ ({N} E2E tests added, all green)

Gates run:
  ✅ Gate 1: {commands} — passed
  ✅ Gate 3: {commands} — passed
  ✅ Gate 4: {commands} — passed

Total ACs covered by tests: {N}/{total}
{If gaps:} ⚠️ AC{N} not covered by automation — flagged for manual.

Next:
  /agile-pr US-{ID}    — open PR with test evidence
```

## Coverage Rules

For every AC, decide:
- **Unit-testable**: pure logic, single function, deterministic → unit
- **E2E-testable**: requires browser, full-stack flow, user-visible → E2E
- **Both**: critical flows often warrant both
- **Manual only**: subjective (look/feel, accessibility nuance) → flagged in STORY.md as `⚠️ Manual`

Never accept "covered manually" without explicit ⚠️ Manual mark + reason.

## Edge Cases

| Situation | Rule |
|-----------|------|
| Existing test file matches naming convention | Append new tests, don't create a duplicate file |
| New test framework needed (not in stack.testing) | STOP. Ask human to update PROJECT_CONTEXT.yaml |
| Test passes but covers wrong AC | Re-invoke contract-first-testing analysis |
| Flaky test (passes some, fails some) | Mark test as `⚠️ flaky` and add an investigation story |

---

*Skill version: 1.0.0 | Created: 2026-05-18*
