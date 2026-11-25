# V3 real-backend save/reopen verification — 2026-11-08

**Result: PASS on the local V3 branch.** The actual editor is connected to the real NestJS API and Prisma/PostgreSQL database. Earlier mocked-browser evidence described the test harness, not the product's persistence implementation.

Branch: `codex/v3-arrange-opus`; runtime checkpoint: `01b6b49` (documentation checkpoint `6dc5f70`). Frontend origin: `http://127.0.0.1:5000`. The served V3 navigation module was checked for the current reload-safe implementation before testing.

## What was exercised

1. Created a uniquely marked disposable organization and verified account in the configured database, then authenticated through the real `/api/v1/auth/login` endpoint. Browser credentials came from that real login. No API routes were intercepted or fulfilled with mocks.
2. Opened a blank V3 editor, used Text → Add text, edited its content/title and clicked Save. The browser sent a real POST, received HTTP 201 and adopted a canonical design ID.
3. Independently fetched the design over authenticated HTTP and queried its `Infographic` row through Prisma. The row belonged to the disposable user/organization, had `aiModel=canvas-editor`, and its `propertyData.canvasDesign` matched the editor's actual saved artwork and title.
4. Reopened the design in a completely fresh browser context, containing only real authentication/theme initialization. No local recovery draft, previous Zustand state or React Query cache could supply the design. Its real authenticated GET returned 200; restored artwork matched the saved/API/database document.
5. Edited the reopened title without clicking Save. The real idle autosave PUT succeeded, the database title changed under the same ID and the account still had exactly one design row.
6. Repeated save/database/fresh-context/pixel checks on a richer specimen: rotated/underlined/tracked text, gradient/opacity/dashed border/shadow shape, embedded flipped image with filters/overlay, curved dotted arrow, hidden locked layer, background paint and unrendered Property/Agent facts. This specimen was initially created through the real API, then text-edited and saved through the V3 UI.
7. Both designs appeared in the authenticated real designs-list API. No uncaught browser exceptions occurred. Disposable users, organization and their designs were removed after the audit; existing user designs were untouched.

The audit reads `captureCanvasData()` for comparison but never injects a canvas/store state. Document comparisons exclude only capture timestamp and viewport zoom; all elements, paint, dimensions, background and listing facts are compared exactly. Read-only capture is the same serializer used by the real session save path.

## Exact pixel comparison

Images were decoded to RGBA and compared at zero tolerance, with no masks. Artboard screenshots use the live editor's Preview mode to exclude transient selection/caret/sidebar chrome. Both sessions use Chrome, the same installed fonts, 1440×1000 viewport, device scale 1 and light theme; font loading and artboard fitting settle before capture.

| Round trip | Image | Dimensions | Differing pixels |
|---|---|---|---:|
| UI-created design | Live editor artboard before / reopened | 1200×800 | **0 / 960,000** |
| UI-created design | Downloaded PNG before / reopened | 2400×1600 | **0 / 3,840,000** |
| Rich specimen | Live editor artboard before / reopened | 800×600 | **0 / 480,000** |
| Rich specimen | Downloaded PNG before / reopened | 1600×1200 | **0 / 1,920,000** |

Visual inspection confirmed the rich artboard contains its text, image, gradient/shadow card and curved arrow; the matching screenshots are not empty canvases.

[Sanitized API/database/pixel proof](evidence/persistence-2026-11-08/result.json)

[UI-created before](evidence/persistence-2026-11-08/ui-created-before-editor.png) · [UI-created reopened](evidence/persistence-2026-11-08/ui-created-reopened-editor.png)

[Rich before](evidence/persistence-2026-11-08/rich-design-before-editor.png) · [Rich reopened](evidence/persistence-2026-11-08/rich-design-reopened-editor.png)

## Practical limits and existing routing

- This proves exact save/reopen fidelity for the two tested designs under the same browser/font environment. It does not guarantee identical rasterization on every device/font installation, every historical design, or future external image URLs that expire or change. The image fixture is embedded and self-contained.
- The editable design is stored as structured canvas data, not only a flattened screenshot. Both document equality and actual rendering/export equality were checked.
- **My Designs/Projects still opens `/editor?designId=…`, which selects the legacy editor.** This is established by the current `App.tsx` MyDesignsPageWrapper handler. The V3 round trips above use `/editor?editor=v3&designId=…` explicitly. No production-default routing switch was authorized or made; the gallery card click path itself was not exercised in this audit.
- Real AI generation/extraction, arbitrary-photo upload, cross-device fonts, dark theme and a deployed production environment were not exercised by this persistence audit. It does not implement any of US-EDIT-020/021/022/023/025/026 or replace whole-candidate review.

## Reproduce and verification evidence

From the V3 worktree, using the existing configured environment without copying or printing secrets:

```powershell
node --env-file=../../.env scripts/v3-persistence-smoke.mjs
```

The current frontend/API must be available at port 5000; `V3_SMOKE_ORIGIN` can point at the intended local frontend. Requires existing listing template, configured database, Prisma client and Chrome/Playwright. The runner generates unique disposable fixtures and cleans only records proven to belong to them.

- The first audit attempt stopped because its script omitted the Add text action; it never reached a design save. This was a runner selector error, not a persistence failure. Its disposable account was cleaned and raw failed result retained at `.e2e-artifacts/v3-persistence-live-2026-11-08/result-attempt1.json`.
- The corrected real audit passed all checks; sanitized proof and before/after artboards are preserved above. Raw exports/results are in `.e2e-artifacts/v3-persistence-live-2026-11-08`.
- Mandatory frontend/API type checks passed. Mandatory unit run: 811 backend + 751 client passes, one existing client skip. Logs: `check.log` and `units.log` in the same artifact directory.
- No runtime source, backend module or database schema changed. The live audit supplies the requested browser and API/database smoke; no unrelated full browser sweep or build/deploy was performed.
- No merge, push, PR, default-editor rollout or formal story closure. Main remains protected.
