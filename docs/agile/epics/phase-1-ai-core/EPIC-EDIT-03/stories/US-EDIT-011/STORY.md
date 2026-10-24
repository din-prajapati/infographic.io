---
title: Story Card — US-EDIT-011
type: story
tags: [orion, edit, canvas, ai]
updated: 2026-10-24
---

# Story Card — US-EDIT-011 — Persist the AI composition flag end to end

> **Status:** 🔲 Not Started
> **Epic:** [EPIC-EDIT-03](../../EPIC.md)
> **Milestone:** [M-EDIT-04-ai-composition-over-template](../../milestones/M-EDIT-04-ai-composition-over-template.md)
> **Linear:** LIN-XXX
> **Size:** M
> **Stage:** **Foundation — sequential. Merges before either lane forks.**
> **Engine:** Claude (primary)
> **Created:** 2026-10-24 | **Closed:** —

```yaml
depends_on: []
owns:
  - api/src/modules/ai-generation/**
  - api/src/modules/infographics/**
  - api/scripts/data/premium-templates.data.ts
  - api/tests/**
  - client/src/lib/api.ts
  - client/src/lib/canvasTypes.ts
may_read:
  - client/src/lib/canvasState.ts
forbidden:
  - api/prisma/schema.prisma      # D5 — JSON, no migration
  - package.json
  - client/src/components/**
  - client/src/hooks/**
verification:
  - npm run check
  - npm run test:unit:backend
risk: low                          # additive, optional fields, no behaviour change
```

---

## Story

*As a* canvas that has just been handed an AI image
*I want* to be told whether the server produced a plain background or a finished poster
*So that* I can apply the right layer rule instead of guessing from the pixels.

---

## Context

`ai-orchestrator.service.ts:274` already computes this and throws it away:

```ts
const useTextFree = typeof photoReference === 'string' && photoReference.length > 0;
```

`useTextFree` is a local variable. Downstream, nothing can distinguish an AI background from an AI
poster — `isAiImport` is `true` on both paths — so the canvas treats a finished composition as
wallpaper and stacks the template's own text on top of it ([BL-27](../../../../../BACKLOG.md)).

This story names the decision and carries it to the client. It changes no rendering behaviour on
its own; US-EDIT-012 is what consumes it.

---

## Acceptance Criteria

- [ ] **AC1 [happy-path]:** When a generation is created with a non-empty `photoReference`,
      `ai-orchestrator.service.ts` persists `composition: 'background'` into the `Infographic`
      row's `propertyData` JSON.
- [ ] **AC2 [happy-path]:** When a generation is created without a `photoReference`,
      the same path persists `composition: 'poster'`.
- [ ] **AC3 [error-path]:** When a generation fails or is cancelled after creation, the persisted
      `composition` is still readable on the row — the value is written at creation, not on
      completion, so a failed run records what it attempted.
- [ ] **AC4 [happy-path]:** `GET /infographics/generations/:id/variations` returns `composition` on
      every item, and `ResultVariation` in `client/src/lib/api.ts:173` declares it as
      `composition?: AiComposition`.
- [ ] **AC5 [error-path]:** When a pre-existing generation row has no stored `composition`, the
      variations endpoint returns the field **absent** rather than defaulting or throwing. Absent is
      the legacy signal US-EDIT-012 reads as `'background'`.
- [ ] **AC6 [happy-path]:** `ImageElement` in `client/src/lib/canvasTypes.ts` declares
      `aiComposition?: AiComposition`. Declaring it here — not in the canvas lane — is what lets
      Lane 1 and Lane 2 fork without either owning a shared type.
- [ ] **AC7 [happy-path]:** Every text element in `api/scripts/data/premium-templates.data.ts` that
      renders a listing or agent fact carries a `slot` tag, so US-EDIT-012's discard rule can see
      all of them. Verified per template, not assumed: a template that legitimately has no price
      is not a gap.

      **Scope corrected 2026-10-24.** An earlier draft asserted `property.price` was missing on 2
      of 5 templates and required tagging there. That was wrong — *Market Report — Email Header*
      carries only `report.*` slots and has no listing price by design, and *MLS Listing Sheet* has
      no price element at all (it has `property.specs` and `property.description`). **There is no
      untagged price layer standing on any template.** This AC is therefore a verification pass
      that tags only genuine gaps. Whether MLS Listing Sheet *should* show a price is a product
      question for a separate story, not a BL-27 fix.

---

## Out of Scope

- **Any change to canvas behaviour.** This story *declares* `aiComposition` on `ImageElement` but reads it nowhere. `canvasState.ts` is untouched — that is US-EDIT-012.
- **Widening the structured passthrough.** Accepting the full property object on `GenerateFromChatInput` was cut from this story on 2026-10-24: it is unrelated to BL-27, and bundling it made the Foundation stage wider than the contract it exists to publish. Deferred to its own story.
- **A Prisma migration.** `Infographic.propertyData` is already `Json` (D5). Do not add a column.
- **`loadComposedDesignToCanvas`.** The composed path is explicitly deferred — see BL-23.
- **`canvasState.ts`, `usePropertyStore.ts`** — owned by US-EDIT-012.
- **Any file under `client/src/components/`** — owned by US-EDIT-012 and US-EDIT-013.

---

## Engineering / PR

- **Branch:** `feat/edit/m-04-ai-composition-over-template` — **the milestone branch itself.** Foundation is not a worktree; it merges before the lanes fork.
- **PR:** #_____ (milestone PR)
- **Primary files touched:**
  - `api/src/modules/ai-generation/services/ai-orchestrator.service.ts` — derive and pass `composition`
  - `api/src/modules/infographics/services/generations.service.ts` — persist at creation
  - `api/src/modules/infographics/controllers/generations.controller.ts` — return on variations
  - `client/src/lib/api.ts` — `AiComposition`, `ResultVariation.composition?`
  - `client/src/lib/canvasTypes.ts` — `ImageElement.aiComposition?` (AC6)
  - `api/scripts/data/premium-templates.data.ts` — verify slot coverage, tag only genuine gaps (AC7)
  - `api/tests/` — new specs

---

## Decisions

- **D5 — persistence vehicle: `propertyData` JSON, not a column.** `Infographic.propertyData` is
  already `Json`, so there is no migration and no coupling to Railway's `preDeployCommand` migration
  step. Promote to a real column later if it earns one.

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|:--------:|----------|:------:|---------|
| TC-EDIT-011-01 | Unit | P0 | Given a generate request with `photoReference`, When the orchestrator runs, Then `propertyData.composition === 'background'` | 🔲 | |
| TC-EDIT-011-02 | Unit | P0 | Given a generate request with no `photoReference`, When the orchestrator runs, Then `propertyData.composition === 'poster'` | 🔲 | |
| TC-EDIT-011-03 | Unit | P0 | Given a row whose `propertyData` has no `composition`, When variations are fetched, Then the field is absent and no error is thrown | 🔲 | |
| TC-EDIT-011-04 | Unit | P1 | Given a generation that fails after creation, When the row is read, Then `composition` is present | 🔲 | |
| TC-EDIT-011-05 | Unit | P1 | Given the five seeded templates, When every text element is enumerated, Then each one rendering a listing or agent fact carries a `slot` tag (a template with no such element is not a gap) | 🔲 | |
| TC-EDIT-011-06 | Unit | P0 | Given the merged Foundation, When `npm run check` runs across client and api, Then `AiComposition` resolves from both sides of the contract | 🔲 | |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

---

## Definition of Done

- [ ] All ACs checked ✅
- [ ] All test cases run and recorded
- [ ] Gate 1 passes (`npm run check`, `npm run test:unit:backend`)
- [ ] Gate 4 passes (backend story — integration suite against `.env.test`)
- [ ] PR merged (milestone PR #_____)
- [ ] [TASKS.md](./TASKS.md) task list fully checked
- [ ] STORY.md status updated to ✅ Done

---

*Story created: 2026-10-24*
