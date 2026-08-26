---
title: Story Card — US-EDIT-007
type: story
tags: [orion, edit, canvas, brand, qr]
updated: 2026-08-26
---

# Story Card — US-EDIT-007

> **Status:** 🔲 Not Started
> **Epic:** [EPIC-EDIT-03](../../EPIC.md)
> **Milestone:** [M-EDIT-02-brand-layers](../../milestones/M-EDIT-02-brand-layers.md)
> **Size:** M
> **Depends on:** [US-EDIT-006](../US-EDIT-006/STORY.md) must be merged first — this story reuses
> its placement mechanism and `brand-` provenance convention.
> **Created:** 2026-08-26 | **Closed:** —

---

## Story

*As* a real-estate agent
*I want* my headshot and a scannable QR code on my listing designs
*So that* a buyer can see who they are dealing with and reach the listing from a printed flyer —
the two things a generated image can never provide on its own

---

## Context

US-EDIT-006 established that brand furniture is composed forward because an image model cannot
render it correctly. These two are the clearest cases of that: an AI-generated "headshot" is an
invented person — unusable and arguably misleading on a real listing — and an AI-drawn QR code
does not scan.

Unlike US-EDIT-006's assets, neither exists as data yet:

| Asset | Current state |
|---|---|
| Headshot | **no field** on `AgentInfo` (`useAgentStore.ts`) — needs capture + storage |
| QR code | **nothing anywhere** — needs a generator and a decision on what it encodes |

`AgentInfo.website` already exists and is the natural QR target.

---

## Acceptance Criteria

- [ ] **AC1 [happy-path]:** An agent can upload a headshot from the Agent tab; it persists across a
      page reload and renders on generated designs as a real, movable `ImageElement` with a
      `brand-headshot-` id.
- [ ] **AC2 [happy-path]:** When `AgentInfo.website` is a non-empty valid URL, a QR code encoding
      it is placed as a real `ImageElement` with a `brand-qr-` id, generated client-side (no
      network round trip, no third-party QR service).
- [ ] **AC3 [happy-path]:** The generated QR **actually scans** to the correct URL — verified with
      a real scanner/decoder, not by visual inspection of the image.
- [ ] **AC4 [edge-case]:** No headshot uploaded → nothing placed. `website` empty or not a valid
      URL → **no QR placed**, and no broken/dead QR is ever rendered.
- [ ] **AC5 [error-path]:** Upload rejects files over a stated size limit and non-image MIME types
      with a message that says what to do, not just that it failed.
- [ ] **AC6 [regression]:** US-EDIT-006's logo/licence placement and US-EDIT-005's extraction flow
      both still pass their live specs.

---

## Out of Scope

- **Durable server-side brand storage / a `brandKit` model.** If US-EDIT-006 left brand data in a
  client store, headshot persistence may need a real storage decision — flag it, do not silently
  build a new storage layer inside this story.
- **Background removal or cropping of the headshot.** Agents upload what they upload; a circular
  mask is a style choice for a later story.
- **QR analytics / tracking URLs.** Encoding a plain `website` value only. Redirects, UTM tagging
  and scan counts are a separate product concern.
- **Any change to the image prompt, extraction, compose caching, credits, or plan gating.**
- **Placement strategy.** Inherited from US-EDIT-006 T1 — do not re-litigate it here.

---

## Engineering / PR

- **Branch:** `feat/edit/m-02-brand-layers` (same milestone branch as US-EDIT-006)
- **PR:** #_____
- **Primary files touched:**
  - `client/src/hooks/useAgentStore.ts` — add `headshotPreview: string | null`
  - `client/src/components/editor/AgentInfoForm.tsx` — headshot upload control
  - `client/src/lib/canvasState.ts` — extend `placeBrandLayers()` with headshot + QR slots
  - `client/src/lib/qr.ts` (new) — client-side QR generation *(TBC — library choice)*
  - `e2e/us-edit-007-headshot-qr.spec.ts` (new)

---

## AI Implementation Prompt

> Paste this block into Claude Code to implement the story.

```
Project context: see PROJECT_CONTEXT.yaml at repo root.

Story: US-EDIT-007 — Agent headshot + QR code as canvas layers

DEPENDS ON US-EDIT-006 being merged. Reuse its placeBrandLayers() mechanism and the `brand-` id
provenance convention. Do not invent a second placement path.

As a real-estate agent, I want my headshot and a scannable QR code on my listing designs, so a
buyer can see who they're dealing with and reach the listing from a printed flyer.

VERIFIED CONTEXT (do not re-derive):
- AgentInfo (useAgentStore.ts) has NO headshot field today. It DOES have `website`, which is the
  natural QR target.
- No QR code generation exists anywhere in the repo.
- An image model cannot render a real face or a scannable QR — that is exactly why these are
  composed forward rather than prompted for.

Acceptance Criteria:
  AC1: headshot uploadable from the Agent tab, persists across reload, renders as a movable
       ImageElement with a `brand-headshot-` id.
  AC2: website non-empty and valid -> QR ImageElement with a `brand-qr-` id, generated
       CLIENT-SIDE (no network call, no third-party QR service).
  AC3: the QR must ACTUALLY SCAN to the correct URL. Verify by decoding, not by looking at it.
  AC4: no headshot -> nothing placed. website empty/invalid -> NO QR. Never render a dead QR.
  AC5: upload rejects oversized files and non-image MIME types with an actionable message.
  AC6: US-EDIT-006 and US-EDIT-005 live specs both still pass.

Out of Scope:
  Durable server-side brandKit storage (flag it if headshot persistence forces the question, do
  NOT build a new storage layer inside this story). Background removal / cropping / circular
  masks. QR analytics or tracking URLs. Any change to the image prompt, extraction, compose
  caching, credits, or plan gating. Placement strategy (inherited from US-EDIT-006 T1).

Primary files (do NOT touch others):
  client/src/hooks/useAgentStore.ts             (add headshotPreview)
  client/src/components/editor/AgentInfoForm.tsx (upload control)
  client/src/lib/canvasState.ts                 (extend placeBrandLayers)
  client/src/lib/qr.ts                          (new)
  e2e/us-edit-007-headshot-qr.spec.ts           (new)

Rules:
- Touch ONLY the files listed above
- Do NOT implement anything in Out of Scope
- Run verification gates (PROJECT_CONTEXT.yaml.gates) before declaring done
- When done: list files changed, ACs checked, test command output
```

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|:--------:|----------|:------:|---------|
| TC-EDIT-007-01 | E2E | P0 | Upload a headshot, reload the page, generate — headshot appears as a movable canvas element | 🔲 | |
| TC-EDIT-007-02 | E2E | P0 | With a valid `website`, generate — a QR element is placed | 🔲 | |
| TC-EDIT-007-03 | Manual | P0 | Decode the rendered QR with a real scanner — it resolves to the exact `website` value | 🔲 | |
| TC-EDIT-007-04 | E2E | P0 | Empty/invalid `website` → no QR element exists on the canvas | 🔲 | |
| TC-EDIT-007-05 | E2E | P1 | Oversized file and non-image MIME are both rejected with an actionable message | 🔲 | |
| TC-EDIT-007-06 | E2E | P1 | US-EDIT-006 logo/licence placement still works alongside headshot + QR | 🔲 | |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

---

## Definition of Done

- [ ] All ACs checked ✅
- [ ] All test cases run and recorded — including TC-03's real scan
- [ ] Gate 1 passes (`npm run check`, `npm run test:unit`)
- [ ] Gate 2 passes (frontend, browser-verified)
- [ ] PR merged
- [ ] No console errors for the changed flow
- [ ] [TASKS.md](./TASKS.md) task list fully checked
- [ ] STORY.md status updated to ✅ Done

---

*Story created: 2026-08-26*
