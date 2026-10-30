---
title: Tasks — US-PROP-006
type: tasks
tags: [orion, prop, phase-1.5]
updated: 2026-10-29
---

# Tasks — US-PROP-006

> **Story:** [US-PROP-006](./STORY.md) — Property as a saved record (client)
> **Branch:** `feat/prop/m-01-property-record`
> **PR:** #_____
> **PR scope:** `propertiesApi`; `activePropertyId` in the store; Property fetch on open, debounced save, lazy migration in `EditorLayout`; `MyPropertiesPage` + route. No NestJS, Prisma or migration files.

---

## Four-Pillars Pre-flight

- [ ] **Brain** — Read `listingBindings.ts`: `applySavedListing()` resets both stores before filling them; `hydrateStoresFromCanvas()` runs after it. The server values must be applied *after* `restoreCanvasData`, with `setProperty` only.
- [ ] **Muscle** — In `EditorLayout.tsx` trace `loadDesignById(designId)` → `restoreCanvasData(design.canvasData)`; confirm `DesignMetadata` (in `storage.ts`) has no `propertyId` yet.
- [ ] **Map** — With US-PROP-001 merged, `GET /api/v1/designs/:id` locally returns `propertyId: null`; `propertiesApi` and `/my-properties` don't exist yet.
- [ ] **Env** — `npm run dev` clean; the `Property` table exists in the dev DB; one design and one Property can be created through the API.

---

## Tasks

### T1 — `propertiesApi` in `api.ts` + `propertyPayload.ts`
- [ ] `PropertyRecord` interface mirroring the server response.
- [ ] `propertiesApi.create / getAll / getOne / update`, same `getApiUrl` + `apiRequest<T>` pattern as `designsApi`.
- [ ] `client/src/lib/propertyPayload.ts`: `PROPERTY_PAYLOAD_FIELDS` (the create/update DTO fields — US-PROP-001's list plus US-PROP-002's `amount`, `currency`, `transaction`, `rentalPeriod`) and `toPropertyPayload(p)` that copies only those keys, skipping `undefined`. `create`/`update` take its result, never the raw store.
- [ ] `client/src/lib/__tests__/propertyPayload.spec.ts` — TC-PROP-006-09.

**ACs:** AC1, AC2, AC4, AC6, AC9, AC10 · **Effort:** S

### T2 — `DesignMetadata.propertyId` + store link
- [ ] `storage.ts`: `propertyId?: string | null` on `DesignMetadata`.
- [ ] `usePropertyStore.ts`: `activePropertyId` (default null) + `setPropertyId`; `resetProperty()` must not clear it.

**ACs:** AC2, AC3, AC7 · **Effort:** XS

### T3 — Fetch on open (`EditorLayout.tsx`)
- [ ] **Before** `restoreCanvasData`: cancel (or flush) any pending debounced PUT, `setPropertyId(null)`, and set an `isLoadingDesign` ref to `true`.
- [ ] After `restoreCanvasData`: if `design.propertyId`, `getOne` → `setProperty(server fields)` + `setPropertyId`; on error, the AC9 toast and leave `activePropertyId` null. Clear `isLoadingDesign` only after this overwrite.
- [ ] No `propertyId` → `activePropertyId` stays null; nothing else changes. Templates never fetch a Property.

**ACs:** AC1, AC3, AC9, AC11 · **Effort:** S

### T4 — Debounced save + lazy migration (`EditorLayout.tsx`)
- [ ] Subscribe to `usePropertyStore`; ignore changes while `isLoadingDesign` is true; when `activePropertyId` is set, debounce 800 ms → `propertiesApi.update(id, toPropertyPayload(property))`, capturing the id at schedule time. Clean up timer and subscription on unmount.
- [ ] In the save handler: legacy design with no `activePropertyId` → `create(toPropertyPayload(property))` → `setPropertyId` → include `propertyId` in the design save; on failure log and save without it. Otherwise include the existing `activePropertyId`.

**ACs:** AC2, AC4, AC5, AC10, AC11 · **Effort:** M

### T5 — `MyPropertiesPage` + route
- [ ] React Query `['properties']` → `propertiesApi.getAll`; loading and empty states like `MyDesignsPage`.
- [ ] Card: headline or "Untitled Property", address, New design → set store + `activePropertyId` → `navigate('/editor')`.
- [ ] Grid `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`.
- [ ] `App.tsx`: `/my-properties` following the `/my-designs` wrapper pattern.

**ACs:** AC6, AC7, AC8 · **Effort:** S

### T6 — Verify
- [ ] `npm run check`, `npm run test:unit`.
- [ ] TC-PROP-006-01 to -08 in the browser (TC-09 is the unit test); record in STORY.md. No console errors.

---

## File → Task Map

| File | Task | Change type |
|---|:--:|---|
| `client/src/lib/api.ts` | T1 | type + API object |
| `client/src/lib/propertyPayload.ts` | T1 | new — whitelisted payload builder |
| `client/src/lib/__tests__/propertyPayload.spec.ts` | T1 | new |
| `client/src/lib/storage.ts` | T2 | `propertyId` on `DesignMetadata` |
| `client/src/hooks/usePropertyStore.ts` | T2 | `activePropertyId` + setter |
| `client/src/components/editor/EditorLayout.tsx` | T3, T4 | fetch, load guard, debounce save, lazy migration |
| `client/src/components/pages/MyPropertiesPage.tsx` | T5 | new |
| `client/src/App.tsx` | T5 | route |

---

## Test Commands

```bash
npm run check
npm run test:unit
PLAYWRIGHT_BASE_URL=http://localhost:5000 npx playwright test   # only if an E2E is added; defaults to staging otherwise
```

---

## Anti-patterns for this story

- **Changing `captureCanvasData()`.** The embedded `listing` is the fallback for legacy designs (AC3) and failed fetches (AC9).
- **Calling `applySavedListing` again after the fetch.** It resets both stores and would wipe the agent fields.
- **Blocking the design save when the Property create fails.** Losing a design is data loss; losing the link is recoverable on the next save.
- **Sending the store object as the request body.** The API rejects unknown keys with 400; always go through `toPropertyPayload()`.
- **Reading `activePropertyId` when the debounce fires.** Capture it when the PUT is scheduled, or a design switch redirects the write to the wrong Property.

---

*Tasks created: 2026-10-29*
