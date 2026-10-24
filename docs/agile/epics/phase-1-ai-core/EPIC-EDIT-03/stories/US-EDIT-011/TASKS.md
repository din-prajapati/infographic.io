---
title: PR Task List — US-EDIT-011
type: tasks
updated: 2026-10-24
---

# PR Task List — US-EDIT-011 — Foundation

> **Story:** [STORY.md](./STORY.md)
> **Stage:** Foundation — **sequential. Nothing forks until this merges.**
> **Branch:** `feat/edit/m-04-ai-composition-over-template` (the milestone branch; no worktree)
> **Engine:** Claude (primary)

---

## Four Pillars Pre-flight

- [ ] **Brain** — STORY.md filled, 7 ACs, all file-specific
- [ ] **Muscle** — T1-T5 below
- [ ] **Map** — [ARCHITECTURE.mmd](../../ARCHITECTURE.mmd)
- [ ] **Env** — no environment changes; no migration (D5)

---

## Why this is Foundation and not a lane

It publishes the contract both lanes compile against. A type agreed in conversation but not merged
is a promise, not a contract — so this stage ends with a merge, and only then do the lanes exist.

```
feat/edit/m-04-...  ──[Foundation merged]──┬── ../bg-canvas   US-EDIT-012
                                            └── ../bg-cleanup  US-EDIT-013
```

---

## Pre-flight check (run before T1)

```bash
grep -n "propertyData" api/src/modules/infographics/services/generations.service.ts
```

Confirm `propertyData` is written when the generation is **created**, not only on completion. If it
is written only on success, T1 must move or duplicate the write — otherwise AC3 fails and a retry
has no record of what the first attempt produced.

---

## Task Breakdown

### T1 — Derive and persist `composition`
- **File:** `api/src/modules/ai-generation/services/ai-orchestrator.service.ts` (line 274), `api/src/modules/infographics/services/generations.service.ts`
- **Type:** `feat` · **AC(s):** AC1, AC2, AC3
- `const composition: AiComposition = useTextFree ? 'background' : 'poster';` — reuse the existing
  `useTextFree`, do not recompute the condition. Write into `propertyData` at row creation.

### T2 — Publish the contract
- **File:** `api/src/modules/infographics/controllers/generations.controller.ts` (line 79), `client/src/lib/api.ts` (line 173), `client/src/lib/canvasTypes.ts`
- **Type:** `feat` · **AC(s):** AC4, AC5, AC6
- `export type AiComposition = 'background' | 'poster';`
- `ResultVariation.composition?: AiComposition` — **optional**; a legacy row returns it absent.
- `ImageElement.aiComposition?: AiComposition` — declared here so neither lane owns a shared type.

### T3 — Tests for the flag
- **File:** `api/tests/`
- **Type:** `test` · **AC(s):** AC1, AC2, AC3, AC5
- Three cases minimum: with photo, without photo, and a legacy row with no stored value.

### T4 — Close the slot-tag gaps
- **File:** `api/scripts/data/premium-templates.data.ts`
- **Type:** `fix` · **AC(s):** AC7
- `property.price` is tagged on 3 of 5 templates, `property.headline` on 4 of 5. Tag the rest.
- **This is a hard dependency of US-EDIT-012 AC1.** Without it the layer rule leaves an untagged
  price standing on two templates — the exact defect BL-27 describes.

### T5 — Merge, then fork
- **Type:** integration, no new code
- `npm run check` must resolve `AiComposition` from both sides of the contract (TC-EDIT-011-06).
- Only after this merges: create `../bg-canvas` and `../bg-cleanup`.

---

## Files — exclusive ownership

**Owns:** `api/src/modules/ai-generation/**` · `api/src/modules/infographics/**` · `api/scripts/data/premium-templates.data.ts` · `api/tests/**` · `client/src/lib/api.ts` · `client/src/lib/canvasTypes.ts`

**May read:** `client/src/lib/canvasState.ts`

**Forbidden:** `api/prisma/schema.prisma` · `package.json` · `client/src/components/**` · `client/src/hooks/**`

---

## Anti-Patterns to Avoid

- Do **not** add a Prisma column or migration — D5 says JSON.
- Do **not** make either new field required. Absent means legacy, and absent means `'background'`.
- Do **not** read or branch on the flag in rendering code — that is US-EDIT-012.
- Do **not** widen `GenerateFromChatInput`. Cut from this story on 2026-10-24; it is unrelated to BL-27.
- Do **not** touch `loadComposedDesignToCanvas` or BL-23.
- Do **not** let a lane start before this merges.

---

## Gates

- [ ] Gate 1 — `npm run check`, `npm run test:unit:backend`
- [ ] Gate 4 — `npm run test:integration` (needs `.env.test`)

---

*Tasks created: 2026-10-24 · re-cut to Foundation 2026-10-24*
