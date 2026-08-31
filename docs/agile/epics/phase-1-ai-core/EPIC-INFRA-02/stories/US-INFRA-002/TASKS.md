---
title: PR Task List — US-INFRA-002
type: tasks
tags: [infra, storage, ai-generation]
updated: 2026-08-19
---

# PR Task List — US-INFRA-002

> **Story:** [STORY.md](./STORY.md)
> **Milestone branch:** `feat/infra/m-01-durable-asset-storage`
> **PR:** #_____ (milestone PR — see AGILE.md §"Git Standards")
> **Linear:** LIN-XXX

---

## Four Pillars Pre-flight

- [ ] **Brain** — STORY.md is filled: ACs written, out-of-scope listed, AI Implementation Prompt ready
- [ ] **Muscle** — This TASKS.md has T1..Tn (one per AC × file) + exact test commands
- [ ] **Map** — [ARCHITECTURE.mmd](../../ARCHITECTURE.mmd) exists for this epic
- [ ] **Env** — [ENV.yaml](../../ENV.yaml) loaded (paths not guessed)

> **Depends on:** US-INFRA-001 merged (`StorageService` must exist as a `@Global()` provider).

---

## PR Scope Summary

**One-liner:** Copy every Ideogram-generated image and erased-text background into R2 via
`StorageService` immediately after generation, with a fail-safe fallback to the original
Ideogram URL if the upload fails — so the DB never stores a broken reference and a generation
already paid for is never lost.

```
feat(ai): persist generated images to owned R2 storage — US-INFRA-002
```

**Allowed `type` values:** `feat | fix | ops | test | chore | docs | refactor`

---

## Task Breakdown

### T1 — `uploadAndFallback` helper + wire into `generateInfographic()`
- **File:** `api/src/modules/ai-generation/services/ai-orchestrator.service.ts`
- **Type:** `feat`
- **AC(s) covered:** AC1, AC2, AC4
- **Changes:**
  - Inject `StorageService`
  - Add private `uploadAndFallback(ideogramUrl, storageKey, generationId): Promise<string>` — downloads the Ideogram image, uploads via `StorageService.upload()`, returns the owned URL; on any failure, logs `warn`/`storage:upload:warn` and returns the original Ideogram URL unchanged (never throws)
  - After `imageUrls` is fully populated (both photo-remix and no-photo branches) and before it's used to build `imageUrl`/`updatedPropertyData.variations`, replace every entry via `uploadAndFallback`

**Commit:**
```bash
git add api/src/modules/ai-generation/services/ai-orchestrator.service.ts
git commit -m "feat(ai): upload generated images to R2 with Ideogram-URL fallback — US-INFRA-002"
```

---

### T2 — Wire `uploadAndFallback` into `composeDesignForEdit()`
- **File:** `api/src/modules/ai-generation/services/ai-orchestrator.service.ts`
- **Type:** `feat`
- **AC(s) covered:** AC3, AC5
- **Changes:**
  - After `extractionResult` is confirmed non-null and before building the `ComposedDesign` result, replace `backgroundUrl` via `uploadAndFallback` (storage key derived from `composeCacheKey(imageUrl)`)

**Commit:**
```bash
git add api/src/modules/ai-generation/services/ai-orchestrator.service.ts
git commit -m "feat(ai): persist composed-design background to R2 — US-INFRA-002"
```

---

### T3 — Same treatment for the legacy Bull queue path
- **File:** `api/src/modules/ai-generation/services/infographic.processor.ts`
- **Type:** `fix`
- **AC(s) covered:** AC1, AC4
- **Changes:**
  - Inject `StorageService` via `@Inject()` (matches existing `OpenAiService`/`IdeogramService` pattern)
  - After `imageUrl = await this.ideogramService.generateImage(...)`, upload-and-fallback before the `prisma.infographic.update` write, key `infographics/${infographicId}/image-v0.jpg`

**Commit:**
```bash
git add api/src/modules/ai-generation/services/infographic.processor.ts
git commit -m "fix(ai): persist queue-path generated images to R2 — US-INFRA-002"
```

---

### T4 — Module wiring (if needed)
- **File:** `api/src/modules/ai-generation/ai-generation.module.ts`
- **Type:** `chore`
- **AC(s) covered:** — (compile prerequisite for AC1–AC5)
- **Changes:**
  - Add `StorageModule` to `imports` only if TypeScript reports the DI token unresolved without it (skip this commit entirely if `@Global()` registration in `AppModule` already resolves it)

**Commit:**
```bash
git add api/src/modules/ai-generation/ai-generation.module.ts
git commit -m "chore(ai): import StorageModule where DI requires it — US-INFRA-002"
```

---

### T5 — Unit tests
- **File:** `api/tests/ai-generation/image-persistence.spec.ts`
- **Type:** `test`
- **AC(s) covered:** AC1, AC2, AC3, AC4, AC5
- **Changes:**
  - TC-INFRA-002-01: upload failure during `generateInfographic()` → falls back to Ideogram URL, `status: 'completed'`, never throws
  - TC-INFRA-002-02: upload failure during `composeDesignForEdit()` → falls back to original background URL, never throws
  - TC-INFRA-002-03: upload success → `imageUrl` is the owned URL, not `ideogram.ai`
  - TC-INFRA-002-04: upload success → `ComposedDesign.backgroundUrl` is the owned URL, not `ideogram.ai`

**Commit:**
```bash
git add api/tests/ai-generation/image-persistence.spec.ts
git commit -m "test(ai): cover R2 persistence + fallback-on-failure — US-INFRA-002"
```

---

## File-to-Task Mapping

| File | Task(s) | AC(s) | Notes |
|------|---------|-------|-------|
| `api/src/modules/ai-generation/services/ai-orchestrator.service.ts` | T1, T2 | AC1–AC5 | core change |
| `api/src/modules/ai-generation/services/infographic.processor.ts` | T3 | AC1, AC4 | legacy queue path |
| `api/src/modules/ai-generation/ai-generation.module.ts` | T4 | — | only if DI requires it |
| `api/tests/ai-generation/image-persistence.spec.ts` | T5 | AC1–AC5 | new, mock-based |

---

## Exact Test Commands

```bash
# Gate 1 — mandatory
npm run check
cd api && npx vitest run tests/ai-generation/image-persistence.spec.ts --reporter=verbose

# Full unit suite (no regressions)
npm run test:unit

# Manual flow
npm run dev
# 1. Generate an infographic end-to-end
# 2. Open Prisma Studio (npx prisma studio) — confirm Infographic.imageUrl begins with
#    R2_PUBLIC_URL and contains no "ideogram.ai" substring
# 3. Confirm the image still renders in the browser after ignoring the original Ideogram URL
```

---

## Task Checklist

- [x] T1 — `uploadAndFallback` + wire into `generateInfographic()` (file: `ai-orchestrator.service.ts`, type: `feat`)
- [x] T2 — Wire into `composeDesignForEdit()` (file: `ai-orchestrator.service.ts`, type: `feat`)
- [x] T3 — Legacy Bull queue path (file: `infographic.processor.ts`, type: `fix`)
- [x] T4 — Module wiring if needed (file: `ai-generation.module.ts`, type: `chore`)
- [x] T5 — Unit tests (file: `api/tests/ai-generation/image-persistence.spec.ts`, type: `test`)
- [x] Gate 1 passes ✅
- [ ] Manual test verified ✅
- [ ] PR opened with story card as description ✅
- [ ] STORY.md ACs ticked off ✅
- [ ] EPIC.md "Implementation Update" log appended ✅ (by code-agent)

---

## Test Is Truth

> **Rule (non-negotiable):** Do not weaken, skip, or modify a failing test to make it pass. Fix the code. Do not open a PR until all commands in "Exact Test Commands" pass or are explicitly marked N/A with a written reason.

---

## Anti-Patterns to Avoid in This Story

- Do NOT let a `StorageService.upload()` failure mark the generation `failed` or throw out of `generateInfographic()`/`composeDesignForEdit()` — the AI cost is already spent; fall back to the Ideogram URL and log a warning instead (AC4/AC5 are the highest-risk cases here).
- Do NOT add retry logic or a background job queue for failed uploads — out of scope for this pass.
- Do NOT touch `infographics.controller.ts` or the source-photo upload path — that's US-INFRA-003.
- Do NOT change `Infographic.imageUrl`'s column type in `schema.prisma`.
- Do NOT backfill existing rows.

---

## PR Open Command

```bash
gh pr create \
  --title "[M-INFRA-01] Durable Asset Storage" \
  --label "epic:infra,type:feat,priority:P1" \
  --body-file docs/agile/epics/phase-1-ai-core/EPIC-INFRA-02/stories/US-INFRA-002/PR_BODY.md
```

---

*Tasks created: 2026-08-19*
