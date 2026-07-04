# M-GEN-01 — V4 Magic-Prompt Pipeline

> **Epic:** [EPIC-GEN-01](../EPIC.md) · **Status:** 🟡 In Progress · **Target:** 2026-07-05

## Scope
Fix garbled V4 text by adopting Ideogram's reference flow (text prompt → magic-prompt-v4 → verified generation), restructure the generation pipeline into a modular cost-transparent architecture, and cover the new pure-function layer with unit tests.

## Stories
| Story | Title | Status |
|-------|-------|--------|
| US-GEN-001 | V4 magic-prompt pipeline — modular restructure with verified exact text | 🟡 Implemented — PR pending |
| US-GEN-002 | Unit tests for prompt builder + verify/repair | 🔲 |

## Definition of Done
- [x] Root cause proven by isolation experiment (docs/testing/reports/ideogram-v4-experiment-2026-07-03/)
- [x] E2E app verification: exact strings, zero garble (generation cmr515lmh0006gp10cg3sphwi)
- [ ] Unit tests for `verifyAndRepairV4JsonPrompt` + `buildImagePrompt`
- [ ] PR merged; STORY.md statuses ✅
- [ ] `V4_MAGIC_PROMPT_COST` verified against first invoice

*Created: 2026-07-03*
