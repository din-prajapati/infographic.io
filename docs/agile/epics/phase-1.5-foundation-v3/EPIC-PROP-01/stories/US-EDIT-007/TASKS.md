---
title: Tasks — US-EDIT-007
type: tasks
tags: [orion, edit, canvas, brand, qr]
updated: 2026-08-26
---

# Tasks — US-EDIT-007

> **Story:** [US-EDIT-007](./STORY.md) — Agent headshot + QR code
> **Branch:** `feat/edit/m-02-brand-layers`
> **PR:** #_____
> **Depends on:** [US-EDIT-006](../US-EDIT-006/STORY.md) merged.
> **PR scope:** Add headshot capture and client-side QR generation, placed through US-EDIT-006's
> existing brand-layer mechanism.

---

## Four-Pillars Pre-flight

- [ ] **Brain** — read US-EDIT-006's `placeBrandLayers()` and its T1 placement decision. This
      story extends that mechanism; it does not add a second one.
- [ ] **Muscle** — confirm `AgentInfo.website` is populated in the running app before building QR
      generation against it.
- [ ] **Map** — decide where the headshot is stored. If US-EDIT-006 left brand data in a
      client-side Zustand store, persistence across devices is an open question — **flag it, do
      not silently build a storage layer.**
- [ ] **Env** — `npm run dev` up; a QR decoder available for TC-03 (phone camera is fine).

---

## Tasks

### T1 — Headshot capture + persistence

- [ ] Add `headshotPreview: string | null` to `AgentInfo` and its default.
- [ ] Upload control in `AgentInfoForm.tsx`; mirror the existing logo upload pattern rather than
      inventing a new one.
- [ ] Size + MIME validation with an actionable message (AC5).
- [ ] Confirm it survives a reload (AC1). If it does not, stop and raise the storage question.

**Effort:** M

---

### T2 — Client-side QR generation

- [ ] Add `client/src/lib/qr.ts`. Generate locally — **no third-party QR service**, no network
      call (AC2).
- [ ] Encode `AgentInfo.website` verbatim.
- [ ] Return null for empty/invalid URLs so nothing is placed (AC4).

**Effort:** S

---

### T3 — Extend `placeBrandLayers()`

- [ ] Headshot → `brand-headshot-` id; QR → `brand-qr-` id (AC1, AC2).
- [ ] Absent/invalid inputs place nothing (AC4).
- [ ] Reuse US-EDIT-006's placement seam — do not add a parallel path.

**Effort:** S

---

### T4 — Verify

- [ ] E2E: `e2e/us-edit-007-headshot-qr.spec.ts` — TC-01/02/04/05/06.
- [ ] **Manual: TC-03 — decode the rendered QR with a real scanner.** Do not mark this passed on
      visual inspection; a QR that looks right and does not scan is the whole failure mode.
- [ ] Regression: US-EDIT-006 and US-EDIT-005 live specs.
- [ ] Record results in STORY.md's test-case table.

**Effort:** S

---

## File → Task Map

| File | Task | Change type |
|---|:--:|---|
| `client/src/hooks/useAgentStore.ts` | T1 | add field |
| `client/src/components/editor/AgentInfoForm.tsx` | T1 | upload control |
| `client/src/lib/qr.ts` | T2 | new |
| `client/src/lib/canvasState.ts` | T3 | extend `placeBrandLayers()` |
| `e2e/us-edit-007-headshot-qr.spec.ts` | T4 | new |

---

## Test Commands

```bash
npm run check
npm run test:unit
PLAYWRIGHT_BASE_URL=http://localhost:5000 npx playwright test e2e/us-edit-007-headshot-qr.spec.ts --project=chrome-headed
PLAYWRIGHT_BASE_URL=http://localhost:5000 npx playwright test e2e/us-edit-006-brand-layers.spec.ts --project=chrome-headed
```

---

## Anti-patterns for this story

- **Never render a QR that does not scan.** A dead QR printed on an open-house flyer is worse
  than no QR at all. AC3 is verified by decoding, never by looking.
- **Do not call a third-party QR service.** It puts an agent's listing URL through someone else's
  server and adds a network dependency to a path that has no business having one.
- **Do not build a new storage layer** if headshot persistence turns out to need one. Flag it and
  let it be scoped properly — that is a brand-kit decision, not a side effect of this story.
- **Do not add a second placement path.** Extend US-EDIT-006's; two placement mechanisms will
  diverge, which is the exact failure pattern US-EDIT-005 was created to unwind.

---

*Tasks created: 2026-08-26*
