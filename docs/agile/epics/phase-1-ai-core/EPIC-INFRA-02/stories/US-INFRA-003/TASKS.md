---
title: PR Task List — US-INFRA-003
type: tasks
tags: [infra, storage, photo-upload]
updated: 2026-08-19
---

# PR Task List — US-INFRA-003

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

> **Depends on:** US-INFRA-001 merged (StorageService must exist as a `@Global()` provider).

---

## PR Scope Summary

**One-liner:** Route property-photo uploads through R2 (durable) with a tmp-dir fallback for
reads, preserving the existing hard-fail-on-unreadable and path-traversal-guard behaviour from
US-AI-031.

```
feat(infra): durable source-photo uploads via R2 — US-INFRA-003
```

**Allowed `type` values:** `feat | fix | ops | test | chore | docs | refactor`

---

## Task Breakdown

### T1 — Extend StorageService with `download()`
- **File:** `api/src/modules/storage/services/storage.service.ts`
- **Type:** `feat`
- **AC(s) covered:** AC2, AC3
- **Changes:**
  - Add `download(key: string): Promise<Buffer>` using `GetObjectCommand`, stream-to-buffer; throws if the key doesn't exist or the download fails (only if not already added by US-INFRA-001/002)

**Commit:**
```bash
git add api/src/modules/storage/services/storage.service.ts
git commit -m "feat(infra): add StorageService.download() — US-INFRA-003"
```

---

### T2 — Upload source photo to R2 on the upload endpoint
- **File:** `api/src/modules/infographics/controllers/infographics.controller.ts`
- **Type:** `feat`
- **AC(s) covered:** AC1
- **Changes:**
  - Inject `StorageService`
  - In `uploadPhoto()`, after the existing tmp write, call `await storageService.upload(file.buffer, 'source-photos/' + photoId)` before returning `{ photoId, photoUrl }`

**Commit:**
```bash
git add api/src/modules/infographics/controllers/infographics.controller.ts
git commit -m "feat(infra): upload source photo to R2 before responding — US-INFRA-003"
```

---

### T3 — R2-first, tmp-fallback read path with preserved guards
- **File:** `api/src/modules/ai-generation/services/ideogram.service.ts`
- **Type:** `fix`
- **AC(s) covered:** AC2, AC3, AC4
- **Changes:**
  - Inject `StorageService`
  - `readSourcePhoto()`: validate `photoPath` against `/^[\w-]+\.(jpg|jpeg|png)$/i` first (throw 400 on mismatch) — before any R2/filesystem access
  - Attempt R2 `download('source-photos/' + photoPath)`; fall back to existing `fs.readFileSync` from `PHOTO_UPLOADS_DIR`
  - If both fail, throw the existing `HttpException(422, ...'re-upload'...)` — unchanged text/status

**Commit:**
```bash
git add api/src/modules/ai-generation/services/ideogram.service.ts
git commit -m "fix(infra): read source photos from R2 with tmp fallback — US-INFRA-003"
```

---

### T4 — Unit tests
- **File:** `api/tests/infra/us-infra-003.spec.ts`
- **Type:** `test`
- **AC(s) covered:** AC1, AC2, AC3, AC4, AC5
- **Changes:**
  - TC-INFRA-003-01: upload happy path (R2 called before response)
  - TC-INFRA-003-02: path-traversal guard fires before any R2/fs call
  - TC-INFRA-003-03: R2-sourced buffer returned when tmp file absent
  - TC-INFRA-003-04: 422 + "re-upload" when both R2 and tmp fail

**Commit:**
```bash
git add api/tests/infra/us-infra-003.spec.ts
git commit -m "test(infra): cover durable photo upload + read fallback — US-INFRA-003"
```

---

## File-to-Task Mapping

| File | Task(s) | AC(s) | Notes |
|------|---------|-------|-------|
| `api/src/modules/storage/services/storage.service.ts` | T1 | AC2, AC3 | extend, don't duplicate if US-INFRA-002 already added `download()` |
| `api/src/modules/infographics/controllers/infographics.controller.ts` | T2 | AC1 | |
| `api/src/modules/ai-generation/services/ideogram.service.ts` | T3 | AC2, AC3, AC4 | preserve exact 422 message + path-traversal regex |
| `api/tests/infra/us-infra-003.spec.ts` | T4 | AC1–AC5 | new, mock-based |

---

## Exact Test Commands

```bash
# Gate 1 — mandatory
npm run check
cd api && npx vitest run tests/infra/us-infra-003.spec.ts --reporter=verbose

# Full unit suite (no regressions)
npm run test:unit

# Manual flow (TC-INFRA-003-05, TC-INFRA-003-06)
npm run dev
# 1. Upload a photo via POST /api/v1/infographics/upload-photo
# 2. Manually delete the file from os.tmpdir()/ai-infographic-uploads
# 3. Call generate with the returned photoId — confirm generation still succeeds
# 4. Call generate with photoReference: "../etc/passwd" — confirm HTTP 400
```

---

## Task Checklist

- [ ] T1 — StorageService.download() (file: `api/src/modules/storage/services/storage.service.ts`, type: `feat`)
- [ ] T2 — Upload source photo to R2 (file: `infographics.controller.ts`, type: `feat`)
- [ ] T3 — R2-first read with tmp fallback (file: `ideogram.service.ts`, type: `fix`)
- [ ] T4 — Unit tests (file: `api/tests/infra/us-infra-003.spec.ts`, type: `test`)
- [ ] Gate 1 passes ✅
- [ ] Manual test verified ✅ (TC-INFRA-003-05, TC-INFRA-003-06)
- [ ] PR opened with story card as description ✅
- [ ] STORY.md ACs ticked off ✅
- [ ] EPIC.md "Implementation Update" log appended ✅ (by code-agent)

---

## Test Is Truth

> **Rule (non-negotiable):** Do not weaken, skip, or modify a failing test to make it pass. Fix the code. Do not open a PR until all commands in "Exact Test Commands" pass or are explicitly marked N/A with a written reason.

---

## Anti-Patterns to Avoid in This Story

- Do NOT change the existing 422 error message text or status code — dashboards/tests may depend on the exact `"re-upload"` substring (US-AI-031 AC4).
- Do NOT weaken or reorder the path-traversal guard — it must fire before any R2 key or filesystem path is constructed, not after.
- Do NOT touch `Infographic.imageUrl`, `layer-extraction.service.ts`, or the `composedDesigns` cache — that's US-INFRA-002.
- Do NOT add a cleanup/lifecycle policy for old R2 source photos — not in scope here.
- Do NOT touch any frontend file — the `photoId`/`photoUrl` response contract is unchanged.

---

## PR Open Command

```bash
gh pr create \
  --title "[M-INFRA-01] Durable Asset Storage" \
  --label "epic:infra,type:feat,priority:P1" \
  --body-file docs/agile/epics/phase-1-ai-core/EPIC-INFRA-02/stories/US-INFRA-003/PR_BODY.md
```

---

*Tasks created: 2026-08-19*
