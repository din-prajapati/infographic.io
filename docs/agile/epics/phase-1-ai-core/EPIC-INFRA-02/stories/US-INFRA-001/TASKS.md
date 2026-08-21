---
title: PR Task List — US-INFRA-001
type: tasks
tags: [infra, storage, r2, nestjs]
updated: 2026-08-19
---

# PR Task List — US-INFRA-001

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

> Incomplete context = wasted AI session.

> **HUMAN PREREQUISITE — blocks this story starting:** Cloudflare R2 bucket + S3-compatible API
> token must be provisioned in the Cloudflare dashboard before implementation. Real credential
> values go into `.env` (gitignored, local) and Railway env vars (production) — never into a
> committed file. Do not check this Pre-flight complete until that's done.

---

## PR Scope Summary

**One-liner:** Add a `StorageService` (Cloudflare R2, S3-compatible) as a globally-injectable
NestJS provider, with `upload()` and `getPublicUrl()` methods, so future stories can persist
generated images and uploads outside third-party/ephemeral storage.

```
feat(infra): add R2-backed StorageService — US-INFRA-001
```

**Allowed `type` values:** `feat | fix | ops | test | chore | docs | refactor`

---

## Task Breakdown

### T1 — Add StorageService + StorageModule
- **File:** `api/src/modules/storage/services/storage.service.ts`, `api/src/modules/storage/storage.module.ts`
- **Type:** `feat`
- **AC(s) covered:** AC1, AC2, AC3, AC4
- **Changes:**
  - New `StorageService` wrapping `@aws-sdk/client-s3` `S3Client` pointed at the R2 endpoint (`https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`, `region: 'auto'`)
  - `upload(buffer, key, contentType?)` → `PutObjectCommand` → returns `getPublicUrl(key)`; re-throws on failure
  - `getPublicUrl(key)` → `${R2_PUBLIC_URL}/${key}`, synchronous, no network call
  - `StorageModule` decorated `@Global()`, provides + exports `StorageService`

**Commit:**
```bash
git add api/src/modules/storage/
git commit -m "feat(infra): add R2-backed StorageService — US-INFRA-001"
```

---

### T2 — Register StorageModule + add npm dependency
- **File:** `api/src/app.module.ts`, `api/package.json`
- **Type:** `feat`
- **AC(s) covered:** AC4
- **Changes:**
  - Add `@aws-sdk/client-s3` to `api/package.json` dependencies (`cd api && npm install @aws-sdk/client-s3`)
  - Import `StorageModule` in `app.module.ts`'s `imports` array

**Commit:**
```bash
git add api/src/app.module.ts api/package.json api/package-lock.json
git commit -m "feat(infra): register StorageModule in AppModule — US-INFRA-001"
```

---

### T3 — Document R2 env vars
- **File:** `.env.example`
- **Type:** `docs`
- **AC(s) covered:** AC5
- **Changes:**
  - Add placeholder entries for `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL`

**Commit:**
```bash
git add .env.example
git commit -m "docs(infra): document R2_* env vars — US-INFRA-001"
```

---

### T4 — Unit tests
- **File:** `api/tests/storage/storage.service.spec.ts`
- **Type:** `test`
- **AC(s) covered:** AC1, AC2, AC3
- **Changes:**
  - `vi.mock('@aws-sdk/client-s3')` — mock `S3Client.send`
  - Test: successful upload returns owned URL (TC-INFRA-001-01)
  - Test: upload failure re-throws (TC-INFRA-001-02)
  - Test: `getPublicUrl` is synchronous, no network call (TC-INFRA-001-03)
  - Test: `contentType` defaults to `application/octet-stream` (TC-INFRA-001-04)

**Commit:**
```bash
git add api/tests/storage/storage.service.spec.ts
git commit -m "test(infra): cover StorageService upload/getPublicUrl — US-INFRA-001"
```

---

## File-to-Task Mapping

| File | Task(s) | AC(s) | Notes |
|------|---------|-------|-------|
| `api/src/modules/storage/services/storage.service.ts` | T1 | AC1, AC2, AC3 | new |
| `api/src/modules/storage/storage.module.ts` | T1 | AC4 | new, `@Global()` |
| `api/src/app.module.ts` | T2 | AC4 | add import |
| `api/package.json` | T2 | — | new dep |
| `.env.example` | T3 | AC5 | placeholders only |
| `api/tests/storage/storage.service.spec.ts` | T4 | AC1, AC2, AC3, AC4 | new, mock-based |

---

## Exact Test Commands

```bash
# Gate 1 — mandatory
npm run check
cd api && npx vitest run tests/storage/storage.service.spec.ts --reporter=verbose

# Full unit suite (no regressions)
npm run test:unit

# Manual flow (requires real R2 credentials in .env — TC-INFRA-001-05)
npm run dev
curl http://localhost:5000/api/health
```

---

## Task Checklist

- [ ] T1 — StorageService + StorageModule (file: `api/src/modules/storage/`, type: `feat`)
- [ ] T2 — Register StorageModule + add dependency (file: `api/src/app.module.ts`, type: `feat`)
- [ ] T3 — Document R2 env vars (file: `.env.example`, type: `docs`)
- [ ] T4 — Unit tests (file: `api/tests/storage/storage.service.spec.ts`, type: `test`)
- [ ] Gate 1 passes ✅
- [ ] Manual test verified ✅ (TC-INFRA-001-05, once real R2 credentials exist)
- [ ] PR opened with story card as description ✅
- [ ] STORY.md ACs ticked off ✅
- [ ] EPIC.md "Implementation Update" log appended ✅ (by code-agent)

---

## Test Is Truth

> **Rule (non-negotiable):** Do not weaken, skip, or modify a failing test to make it pass. Fix the code. Do not open a PR until all commands in "Exact Test Commands" pass or are explicitly marked N/A with a written reason.

---

## Anti-Patterns to Avoid in This Story

- Do NOT wire `ideogram.service.ts`, `layer-extraction.service.ts`, or `infographics.controller.ts` to call `StorageService` — that's US-INFRA-002/003, not this story.
- Do NOT build a multi-provider abstraction (`IStorageProvider`, factory, DI token aliasing) — one concrete `StorageService`, R2 only.
- Do NOT add `delete()`/`list()` methods — only `upload()` and `getPublicUrl()` are in scope.
- Do NOT touch `api/prisma/schema.prisma` — no column-shape change belongs in this story.
- Do NOT commit real R2 credential values anywhere — `.env.example` gets placeholders only.

---

## PR Open Command

```bash
gh pr create \
  --title "[M-INFRA-01] Durable Asset Storage" \
  --label "epic:infra,type:feat,priority:P1" \
  --body-file docs/agile/epics/phase-1-ai-core/EPIC-INFRA-02/stories/US-INFRA-001/PR_BODY.md
```

---

*Tasks created: 2026-08-19*
