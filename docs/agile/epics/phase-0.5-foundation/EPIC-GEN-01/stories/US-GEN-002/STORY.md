# US-GEN-002 — Unit Tests for Prompt Builder + Verify/Repair

> **Epic:** [EPIC-GEN-01](../../EPIC.md) · **Milestone:** [M-GEN-01](../../milestones/M-GEN-01-v4-magic-prompt-pipeline.md)
> **Size:** S · **Status:** 🔲 Not Started

---

## Story

As a **developer changing the generation pipeline**, I want **unit coverage on the pure prompt-builder functions**, so that **regressions in prompt text or the repair logic are caught before they cost real image-generation money**.

## Acceptance Criteria

- [ ] **AC1** — `buildImagePrompt`: snapshot/contract tests for full property data, minimal data (no agent/price), placeholder agent name excluded
- [ ] **AC2** — `buildExpectedTexts`: emits only present fields; headline truncation at 32 chars
- [ ] **AC3** — `verifyAndRepairV4JsonPrompt`: faithful conversion → zero repairs (E3 case); split fields (name/brokerage separate, `\n` headline) → still zero repairs; drifted price → targeted overwrite only; missing element → append with neutral desc (E4 regression cases)
- [ ] **AC4** — `formatPriceShort` / `formatSqft` edge cases (string input, 0, ≥1M)
- [ ] **AC5** — All tests mock-free (pure functions), run in `npm run test:unit`

## Out of Scope

- Integration tests hitting the Ideogram API
- Orchestrator flow tests (would need service mocks — separate story if wanted)

## Test Notes

New file: `api/tests/ai-generation/infographic-prompt.builder.spec.ts`. Use the real E3 converted JSON from `docs/testing/reports/ideogram-v4-experiment-2026-07-03/E3-converted-json-prompt.json` as a fixture.

---

*Created: 2026-07-03*
