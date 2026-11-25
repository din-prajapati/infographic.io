# V3 listing workflow — real-backend E2E, R2 media storage and the Horizon sample template

Date: 2026-11-13. Branch `codex/v3-listing-responsive-handoff` (uncommitted). Scope lock: US-EDIT-022 / US-EDIT-025 `TASKS.md` § T5.

## What was asked

Create a sample template from the user's reference image ("The Horizon Residences — Elevated Urban Living"), then test the full listing flow with linked fields against the **development database** (real NestJS API + Prisma, not mocked HTTP). Use ORION and its custom agents where applicable; do not use agile commands (new story/epic). During the run the user added a second requirement: **image data must be stored in the Cloudflare R2 bucket**.

## Defect found and fixed

**Real backend rejected design/template saves above ~100 kB** with `500 "request entity too large"`. Nest's default JSON parser applied to `/designs` and `/canvas-templates`. Only `/properties` and `/listing-profiles` had the route-scoped 12 MB parser. Every V3 save sends a 320×320 PNG thumbnail, so any photographic design failed to save.

- Probe before the fix: a 300 kB design POST returned 500. After the fix it returns 201.
- Fix: `api/src/modules/properties/properties.module.ts` extends the existing route-scoped 12 MB parser to `/api/v1/designs` and `/api/v1/canvas-templates`. The default limit stays in force everywhere else; this is proved by `api/tests/properties/properties.http.spec.ts`, where an unrelated route still returns 413.

## Image storage moved to R2

- **New endpoint:** `POST /api/v1/media` (`api/src/modules/storage/controllers/media.controller.ts`, registered in the global `StorageModule`).
  - Requires JWT, checked before multer reads the body.
  - Throttled to 20/min.
  - Accepts JPEG/PNG/WebP/GIF/AVIF only, checked by magic bytes (Nest 11 `FileTypeValidator`). SVG and HTML are rejected.
  - 10 MB maximum, enforced by multer limits (413).
  - Keys are `design-media/<organization>/<uuid>.<ext>`, built server-side.
  - Returns 503 before writing if R2 or `R2_PUBLIC_URL` is unavailable.
  - Logs structured JSON with `userId`.
  - Returns `{ url, key, contentType, size }`.
- **Client:** `client/src/lib/v3MediaUpload.ts`.
  - Decodes the file locally first, then uploads it. Accepts only an `https` URL back and never falls back to an inline data URL. The request times out after 60 s.
  - Used by all four V3 image entry points: element **Replace**, the **Uploads** panel, Listing photo / agent portrait / brand logo (`V3ListingPanel`), and Template Fields **Customize this design** photo.
- **Export:** R2 images reach the PNG renderer through the existing `/api/proxy-image` (R2 host allowlisted from `R2_PUBLIC_URL`, BL-41). The real-backend spec samples the exported PNG's hero region to prove the photo rendered.
- **Behaviour change:** image **Replace** no longer accepts SVG files. An SVG in a public bucket is an XSS vehicle. Two mocked toolbar E2E contracts were moved to raster fixtures with a `/media` stub.

### Decisions and known follow-ups (not fixed here)

| Topic | Current state | Follow-up |
|---|---|---|
| Public-read bucket | The bucket is public-read, as `StorageService` documents. Customer listing photos, portraits and logos are readable by anyone holding the URL; random UUID keys make URLs unguessable but not private. | Decide in an ADR whether to keep public-read or move to signed URLs. |
| Orphaned objects | `StorageService` has no delete. Replaced or abandoned uploads, and test uploads, stay in R2. | Add a cleanup job or lifecycle rule plus a per-plan storage quota (new story). |
| Pre-auth JSON parsing | The 12 MB route parser runs as middleware, before the JWT guard, on four route families. This follows the existing properties precedent. | Track as known DoS surface. |
| Legacy editor uploads | The legacy (non-V3) editor still embeds data URLs. | Out of scope (V3 only). |
| Thumbnails | The design thumbnail is still an inline PNG data URL (it fits the 12 MB limit). | Optional: store it in R2 or switch to JPEG. |

## Horizon sample template

- **Seed:** `e2e/fixtures/horizon/build-seed.cjs` builds 25 elements with the app's own factories (`createTextElement`, `createShapeElement`, `createPropertyIcon`, `createImageElement`), loaded through Vite in the running page. The canvas is square, 1080×1080.
  - Navy gradient background.
  - Hero photo (`hero-building.jpg`): a crop of the building side of the user's reference, which has no baked-in text.
  - Gradient blend into the photo.
  - Gold logo (`logo-horizon.png`): an original drawing, not traced.
  - "THE HORIZON" / "RESIDENCES" wordmark.
  - Playfair Display headline, gold divider, subheading.
  - Four ringed amenity icons with labels and separators.
  - Outlined "BOOK A PRIVATE TOUR →" CTA.
  - Both images are uploaded to R2 through `/media` before the design is saved.
- **Linked fields** (set through the UI by the spec):
  - Headline → `property.headline`
  - Subheading → `property.description`
  - Brand name → `brand.name`
  - Logo → `brand.logo`
  - CTA → `agent.cta` (canonical owner `brand.tagline`)
  - Hero → `property.heroImage`
  - Amenity labels stay independent.
- **Sample snapshot:** `e2e/fixtures/horizon/horizon-seed.sample.json`. It references R2 URLs owned by the dev test account.

## Real-backend journey — `e2e/v3-listing-real-backend.spec.ts`

Config `e2e/v3-real-backend.config.ts` has no webServer, never defaults to staging, uses 1242×668 and runs one worker. It runs against `http://localhost:5000` (Express → NestJS → Prisma dev DB → R2), with **no mocked `/api`**. It authenticates by API login as a dev-only test account (`e2e-listing-*@test.local`). The credentials are in the gitignored `.agent-logs/real-backend/account.json`.

1. **R2 storage:** a direct `/media` upload returns 201 with an https URL, and a public GET returns 200 `image/jpeg`.
2. **Open seed:** the design is opened, and fields are linked via toolbar **Link field** → Template Fields. **Link field** is absent for a shape.
3. **Show links:** badges appear for all six links and none for the amenity labels.
4. **Save as Template:** the template is fetched by API. Linked text is a placeholder, there is no `v3Listing`, and independent text is unchanged.
5. **Listing → Enter manually → Save property:** the real `POST /properties` returns 201. The canvas is unchanged and shows a pending update.
6. **Agent / Brand:** `PUT /listing-profiles` returns 200. The brand logo upload goes through `/media` (201), and the saved profile logo is an https R2 URL.
7. **Listing photo:** uploaded via Uploads to R2 (no `data:` source), then assigned to the hero with **Customize this design** before Apply. A linked property photo resolves empty by design (manual photo assignment).
8. **Apply to design → Undo last apply → Apply:** the canvas shows the listing values, and the amenity labels are unchanged.
9. **Save as Design → reload:** the applied text and link badges survive. The API GET confirms `v3Listing.applied`, at least 6 bindings, and no `data:` element or listing-photo sources.
10. **Template → Replace canvas:** a new design is created from the pending listing, and the original design is unchanged (API GET).
11. **Review & export:** automated checks pass, the acknowledgement is ticked, and the downloaded PNG is 1080×1080. The hero region has photographic detail (luminance standard deviation above 15).

The first runs found export review correctly blocking a headline that overflowed the template frame ("Skyline living, reimagined" wraps to three lines at 92 pt). The test now uses "Skyline Urban Living", which fits the frame like the reference headline. That finding is evidence the checker works, not a defect.

Screenshots: `.e2e-artifacts/v3-real-backend/shots/` (00–10, including `08b-reloaded-links-dark.png`). These are git-ignored; rerun the spec to regenerate them.

## Other findings during the run

- **Fixed (regression from the earlier header changes):** at 1242px with a long design title, the logo text overlapped Projects. The header now keeps brand, Projects, status and actions at full size and truncates only the title.
- **Reported, not fixed (existing behaviour):**
  - **Misleading save banner:** right after Apply, an autosave racing the edit shows "Save failed · The design changed while preparing its preview". The guard is correct (no stale thumbnail is saved), and the next save succeeds, but the wording overstates a routine retry (`client/src/hooks/useV3DesignSession.ts`).
- **From the qa-agent plan, not changed here:**
  - **Canvas undo:** canvas Undo/Redo after Apply can turn linked text into custom values.
  - **Unsaved work on template use:** *Use template* navigates without the unsaved-changes guard.
  - **Template dialog wording:** the confirm dialog still says "replace current canvas", although a separate Design is created.
  - **Hero skip after Apply:** if the hero is customized *after* Apply, `skipped` is not cleared and export stays blocked.

## Test data left in the shared dev/staging database and R2

There are no DELETE routes for designs, templates or properties. Everything below belongs to the dev test account's own organization, and names are prefixed `E2E-HZN-*`. The full ledger, including R2 keys, is in `.agent-logs/real-backend/created.txt`.

- **Designs:** one body-limit probe, the Horizon seed, and per run one original plus one created from a template. Six E2E runs reached the template step.
- **Templates:** one per run.
- **Properties:** one probe plus one per run.
- **R2:** `design-media/<test-org>/…`, about four objects per run plus the seed and probe uploads.

## Gate results (2026-11-13, final run)

| Gate | Result |
|---|---|
| Gate 1 — `npm run check` | exit 0 |
| Gate 1 — backend unit | 848/848 (65 files) |
| Gate 1 — client unit | 815 passed, 1 skipped (69 files) |
| Mocked V3 E2E regression (responsive, layers, shell, paints, toolbars, …) | 124/124 |
| Listing E2E (mocked API) | 8/8 |
| `npm run build` | OK |
| Gate 4 — `npm run smoke:boot` + `/api/v1/health` | BOOT OK, media route mapped; health 200 |
| Real-backend journey (`v3-real-backend.config.ts`) | Pass (latest run `E2E-HZN-mwf9pf8r`, ~37 s) |

ORION agents used (all with `model: opus`; reported model ID `claude-opus-5-5`): qa-agent (test plan), e2e-test-agent (first draft of the real-backend spec, completed by the root session after the agent stalled), reviewer-agent (P0/P1 findings addressed: SVG rejection, raster fixtures, call-site tests, 503 before write, friendly validation messages).

**Visibility note:** all records above belong to the dev test account's own organization. They do not appear when signed in as another user. To see them, sign in on `localhost:5000` (from this worktree) with the account in `.agent-logs/real-backend/account.json`.

## V3 deep links (2026-11-14, US-EDIT-022 T6)

| URL | Behaviour |
|---|---|
| `?editor=v3&designId=<id>` | Opens the saved design (unchanged) |
| `?editor=v3&templateId=<id>` | Saved or curated template (API, ownership enforced) or built-in starter: saves a separate design with links kept, then replaces the URL with `designId` |
| `?editor=v3&templateId=<…_var_N>` | Refused: "AI designs open from the AI Assistant…" |
| `?editor=v3&width=W&height=H` | Blank design at W×H (64–8000 px) |
| Missing or not-shared template | One neutral message; nothing is created |

Precedence: designId > templateId > width/height. A deep link still loading when the user leaves (or starts editing) does not navigate. Callers (Templates, My Designs, Format Picker) still open the legacy editor until cutover.
