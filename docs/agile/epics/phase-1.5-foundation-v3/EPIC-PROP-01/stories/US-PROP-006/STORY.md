---
title: Story Card — US-PROP-006
type: story
tags: [orion, story, phase-1.5]
updated: 2026-10-29
---

# Story Card — US-PROP-006 — Property as a saved record (client)

> **Status:** 🔲 Not Started — hardened 2026-10-29 by /new-story
> **Feature:** EPIC-PROP-01 — Property & Brand Foundation
> **Epic:** [EPIC-PROP-01](../../EPIC.md)
> **Milestone:** [M-PROP-01-property-record](../../milestones/M-PROP-01-property-record.md)
> **Linear:** LIN-XXX
> **Size:** M *(split from the original US-PROP-001 L card)*
> **Depends on:** [US-PROP-001](../US-PROP-001/STORY.md) must be merged first.
> **Created:** 2026-10-29 | **Closed:** —
> **Source:** Phase 1.5 restructure — [ADR-003](../../../../../decisions/ADR-003-phase-1-close-and-phase-1.5.md)

---

## Story

*As a* real-estate agent
*I want* the editor to load listing facts from the saved Property and save my edits back to it
*So that* two designs for the same flat always show the same price, and I can see all my listings in one place

---

## Acceptance Criteria

- [ ] **AC1 [happy-path]:** When a design with a non-null `propertyId` is opened, the client calls `GET /api/v1/properties/:propertyId` after `restoreCanvasData` runs, and on success overwrites the property fields in `usePropertyStore` (`type, headline, price, beds, baths, sqft, address, description, features, locale`) with the server values; canvas slots then reflect them.
- [ ] **AC2 [happy-path]:** While `usePropertyStore.activePropertyId` is non-null, any property-store change (typed in the Property tab or coming from a canvas slot edit) triggers a debounced `PUT /api/v1/properties/:activePropertyId` 800 ms after the last change; the local store updates immediately.
- [ ] **AC3 [rollback]:** A design with no `propertyId` opens exactly as before (`applySavedListing` + `hydrateStoresFromCanvas` via `restoreCanvasData`); no Property request is sent and `activePropertyId` stays null.
- [ ] **AC4 [rollback]:** The first explicit save of a legacy design (no `propertyId`) calls `POST /api/v1/properties` with the current property store, then includes the returned `propertyId` in the design save; a later `GET /api/v1/designs/:id` returns it. If the Property create fails, the design still saves without `propertyId`.
- [ ] **AC5 [concurrent]:** With designs A and B sharing one `propertyId`, a price change saved from A shows in B's Property tab the next time B is opened.
- [ ] **AC6 [happy-path]:** `/my-properties` (Wouter route, protected, with the app header like `/my-designs`) lists Properties from `GET /api/v1/properties`; each card shows `headline` (or "Untitled Property") and `address`, plus a **New design** button.
- [ ] **AC7 [happy-path]:** **New design** puts that Property's facts into `usePropertyStore`, sets `activePropertyId`, and navigates to `/editor`, so the first edit already saves to that Property (AC2).
- [ ] **AC8 [mobile]:** `/my-properties` has no horizontal scroll at 375 px and shows at least 2 columns at 1440 px.
- [ ] **AC9 [error-path]:** If `GET /api/v1/properties/:propertyId` fails on open, a toast reads "Could not load property — using saved values." and the editor keeps the values from the design's embedded listing.

---

## Out of Scope

- A Property detail/edit page — facts are edited in the editor's Property tab
- Deleting a Property from the UI
- Pagination or search on `/my-properties`
- Changing `captureCanvasData()` — the embedded `listing` keeps being written on every save as the fallback
- Structured price (US-PROP-002) and Auto-Fill (US-PROP-003)

---

## Engineering / PR

- **Branch:** `feat/prop/m-prop-01-property-record`
- **PR:** #_____
- **Primary files touched:**
  - `client/src/lib/api.ts` — `PropertyRecord` type + `propertiesApi` (create, getAll, getOne, update)
  - `client/src/lib/storage.ts` — `propertyId?: string | null` on `DesignMetadata`
  - `client/src/hooks/usePropertyStore.ts` — `activePropertyId` + `setPropertyId`
  - `client/src/components/editor/EditorLayout.tsx` — fetch on open, debounced save, lazy migration on save
  - `client/src/pages/MyPropertiesPage.tsx` — new
  - `client/src/App.tsx` — `/my-properties` route

---

## AI Implementation Prompt

> Paste this block into Claude Code to implement the story.

```
Context: Buildographic (code name InfographicAI) — React 18 + Vite, Wouter (never React Router), Zustand + React Query, shadcn/ui.
Prerequisite: US-PROP-001 merged — GET/POST/PUT /api/v1/properties exist; GET /api/v1/designs returns propertyId.

Story: US-PROP-006 — Property as a saved record (client half)

Acceptance Criteria:
AC1: On open of a design with propertyId: after restoreCanvasData, GET /api/v1/properties/:id and overwrite the property fields in
     usePropertyStore with the server values.
AC2: While activePropertyId is set, any property-store change → debounced (800 ms) PUT /api/v1/properties/:id; store updates immediately.
AC3: Design without propertyId opens exactly as today; no Property request; activePropertyId null.
AC4: First save of a legacy design → POST /api/v1/properties with the current store → include propertyId in the design save.
     If the create fails, save the design anyway without propertyId.
AC5: Two designs sharing a property: a saved change in A is visible when B is next opened.
AC6: /my-properties page (protected, app header, like /my-designs): cards with headline or "Untitled Property", address, New design.
AC7: New design → set store facts + activePropertyId → navigate('/editor').
AC8: No horizontal scroll at 375 px; ≥ 2 columns at 1440 px.
AC9: Fetch failure → toast "Could not load property — using saved values." and keep embedded values.

Architecture notes:
- API pattern: getApiUrl('/properties') + apiRequest<T>() — follow designsApi in api.ts.
- EditorLayout loads via loadDesignById → restoreCanvasData (which calls applySavedListing + hydrateStoresFromCanvas). Do NOT call
  applySavedListing again after the fetch — it resets both stores; just setProperty() the server fields.
- Do NOT change captureCanvasData() in canvasState.ts.
- Route: follow the /my-designs pattern in App.tsx.

Out of Scope: property detail page · delete · pagination/search · captureCanvasData changes · US-PROP-002/003 work.

Primary files (do NOT touch others): client/src/lib/api.ts · client/src/lib/storage.ts · client/src/hooks/usePropertyStore.ts ·
client/src/components/editor/EditorLayout.tsx · client/src/pages/MyPropertiesPage.tsx (new) · client/src/App.tsx

Rules: touch only these files; run `npm run check` and `npm run test:unit`; report files changed, ACs checked, test output.
```

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|:--------:|----------|:------:|---------|
| TC-PROP-006-01 | Manual | P0 | Given a design with a `propertyId` whose Property has headline "3BHK Bandra", when it is opened, then the Property tab shows "3BHK Bandra" within 2 s | 🔲 | |
| TC-PROP-006-02 | Manual | P0 | Given a legacy design (no `propertyId`), when it is opened, then it loads as before and the network shows no `GET /api/v1/properties` request | 🔲 | |
| TC-PROP-006-03 | Manual | P0 | Given designs A and B on one Property, when A's price is changed and the debounced save fires, then opening B shows the new price | 🔲 | |
| TC-PROP-006-04 | Manual | P1 | Given `activePropertyId` is set, when a new price is typed, then one `PUT /api/v1/properties/:id` fires within 2 s with that price | 🔲 | |
| TC-PROP-006-05 | Manual | P1 | Given a legacy design, when Save is clicked, then `POST /api/v1/properties` fires before the design save and the design then has a `propertyId` | 🔲 | |
| TC-PROP-006-06 | Manual | P1 | Given 2 Properties, when `/my-properties` loads at 375 px, then 2 cards with New design buttons show and there is no horizontal scroll | 🔲 | |
| TC-PROP-006-07 | Manual | P1 | Given `GET /api/v1/properties/:id` returns 500 on open, then the toast "Could not load property — using saved values." shows and the embedded values load | 🔲 | |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

---

## Definition of Done

- [ ] All ACs checked ✅ · all test cases run and recorded
- [ ] `npm run check` · `npm run test:unit` pass
- [ ] Gate 2 — browser checks (local, then staging)
- [ ] PR merged (PR #_____)
- [ ] [TASKS.md](./TASKS.md) fully checked ✅ · STORY.md status `✅ Done`

---

## Implementation Update (log)

> Appended by code-agent during/after implementation. Newest entries on top.

### 2026-10-29 — created by /new-story (split from US-PROP-001)
- Found against the code: the draft said edits save to the Property "not to the embedded listing". Wrong — `captureCanvasData()` always writes `listing`, and it must keep doing so as the fallback for legacy designs and failed fetches. The Property is written in addition.
- `applySavedListing` lives in `listingBindings.ts`, not `canvasState.ts`; the change belongs in its caller, `EditorLayout.tsx`.

---

*Story created: 2026-10-29*
