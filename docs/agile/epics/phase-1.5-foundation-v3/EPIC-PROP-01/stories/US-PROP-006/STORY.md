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

- [ ] **AC1 [happy-path]:** When a design with a non-null `propertyId` is opened, the client calls `GET /api/v1/properties/:propertyId` after `restoreCanvasData` runs, and on success overwrites the property fields in `usePropertyStore` with every `PROPERTY_PAYLOAD_FIELDS` field the server returns (`type, headline, price, beds, baths, sqft, address, description, features, locale`, plus `amount, currency, transaction, rentalPeriod` once US-PROP-002 has added them); canvas slots then reflect them.
- [ ] **AC2 [happy-path]:** While `usePropertyStore.activePropertyId` is non-null, any property-store change (typed in the Property tab or coming from a canvas slot edit) triggers a debounced `PUT /api/v1/properties/:activePropertyId` 800 ms after the last change; the local store updates immediately. Store changes made while a design is loading (`restoreCanvasData`, the AC1 overwrite) do not schedule a PUT.
- [ ] **AC10 [security]:** Every `POST`/`PUT /api/v1/properties` body is built by `toPropertyPayload(property)` in `client/src/lib/propertyPayload.ts`, which copies only `PROPERTY_PAYLOAD_FIELDS` (the fields the server DTOs whitelist) — never `id`, `organizationId`, `activePropertyId` or client-only keys such as `fieldOrigins`. The API runs `forbidNonWhitelisted: true` (`api/src/main.ts`), so any extra key would make the request fail with 400. Unit test: a store object with extra keys produces a payload with exactly the whitelisted keys.
- [ ] **AC11 [concurrent]:** Open design A (Property P1), then design B (Property P2) without reloading the page: no `PUT /api/v1/properties/P1` is sent after B starts loading, and B's facts are never written to P1. `setPropertyId(null)` runs before `restoreCanvasData`, and any pending debounced PUT for P1 is flushed or cancelled before the switch.
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

- **Branch:** `feat/prop/m-01-property-record`
- **PR:** #_____
- **Primary files touched:**
  - `client/src/lib/api.ts` — `PropertyRecord` type + `propertiesApi` (create, getAll, getOne, update)
  - `client/src/lib/storage.ts` — `propertyId?: string | null` on `DesignMetadata`
  - `client/src/hooks/usePropertyStore.ts` — `activePropertyId` + `setPropertyId`
  - `client/src/lib/propertyPayload.ts` — new: `PROPERTY_PAYLOAD_FIELDS` + `toPropertyPayload()`
  - `client/src/lib/__tests__/propertyPayload.spec.ts` — new
  - `client/src/components/editor/EditorLayout.tsx` — fetch on open, debounced save, lazy migration on save
  - `client/src/components/pages/MyPropertiesPage.tsx` — new (beside `MyDesignsPage.tsx`)
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
AC10: POST/PUT bodies come from toPropertyPayload() (client/src/lib/propertyPayload.ts), which copies only PROPERTY_PAYLOAD_FIELDS.
      The API rejects unknown keys (forbidNonWhitelisted) — never send id, organizationId, activePropertyId or fieldOrigins.
AC11: Opening design B after design A never sends a PUT to A's Property: setPropertyId(null) before restoreCanvasData, cancel/flush
      the pending debounce, and ignore store changes while loading.

Architecture notes:
- API pattern: getApiUrl('/properties') + apiRequest<T>() — follow designsApi in api.ts.
- EditorLayout loads via loadDesignById → restoreCanvasData (which calls applySavedListing + hydrateStoresFromCanvas). Do NOT call
  applySavedListing again after the fetch — it resets both stores; just setProperty() the server fields.
- resetProperty() keeps activePropertyId, and applySavedListing() calls it. That is why AC11 needs setPropertyId(null) FIRST and a
  loading guard (e.g. an isLoadingDesign ref checked by the subscription) around restoreCanvasData and the AC1 overwrite.
- Do NOT change captureCanvasData() in canvasState.ts.
- Route: follow the /my-designs pattern in App.tsx; the page lives in client/src/components/pages/ beside MyDesignsPage.tsx.

Out of Scope: property detail page · delete · pagination/search · captureCanvasData changes · US-PROP-002/003 work.

Primary files (do NOT touch others): client/src/lib/api.ts · client/src/lib/storage.ts · client/src/hooks/usePropertyStore.ts ·
client/src/lib/propertyPayload.ts (new) · client/src/lib/__tests__/propertyPayload.spec.ts (new) ·
client/src/components/editor/EditorLayout.tsx · client/src/components/pages/MyPropertiesPage.tsx (new) · client/src/App.tsx

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
| TC-PROP-006-08 | Manual | P0 | Given design A (Property P1) is open, when design B (Property P2) is opened from My Designs, then the network shows no `PUT /api/v1/properties/P1` after B starts loading, and P1's headline is unchanged when A is reopened | 🔲 | |
| TC-PROP-006-09 | Unit | P0 | `toPropertyPayload({ ...facts, id: 'x', organizationId: 'o', activePropertyId: 'p', fieldOrigins: {} })` returns exactly the `PROPERTY_PAYLOAD_FIELDS` keys — `propertyPayload.spec.ts` | 🔲 | |

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

### 2026-10-30 — Opus review of PR #83
- AC11 added: `resetProperty()` keeps `activePropertyId`, so opening design B after A would have PUT B's facts onto A's Property.
- AC10 added: the API runs `forbidNonWhitelisted: true`; sending the whole store would 400 every save and silently drop the AC4 link.
- AC1 now also loads the structured price fields once US-PROP-002 adds them. The page moves to `client/src/components/pages/`.

### 2026-10-29 — created by /new-story (split from US-PROP-001)
- Found against the code: the draft said edits save to the Property "not to the embedded listing". Wrong — `captureCanvasData()` always writes `listing`, and it must keep doing so as the fallback for legacy designs and failed fetches. The Property is written in addition.
- `applySavedListing` lives in `listingBindings.ts`, not `canvasState.ts`; the change belongs in its caller, `EditorLayout.tsx`.

---

*Story created: 2026-10-29*
