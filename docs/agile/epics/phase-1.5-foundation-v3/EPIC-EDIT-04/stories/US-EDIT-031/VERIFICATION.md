# US-EDIT-031 — local verification, 2026-10-31

The opt-in V3 slice is implemented locally. This is not a full-editor replacement or a formal story closeout. No main merge or production deployment has occurred.

## Result

| Check | Actual result |
|---|---|
| TypeScript | `npm run check`: exit 0, frontend and API |
| Backend units | `npm run test:unit:backend -- --maxWorkers=1 --minWorkers=1`: exit 0, 60 files / 811 tests passed |
| Client units | `npm run test:unit:client -- --maxWorkers=1 --minWorkers=1`: exit 0, 22 files / 399 tests passed, 1 pre-existing skip |
| V3 units within the client run | 24 tests passed, including StrictMode, stale responses, create-ID adoption, thumbnail revision rejection and listing-reset ordering |
| Browser integration | `node node_modules/@playwright/test/cli.js test --config=e2e/v3-slice.config.ts`: exit 0, 25 tests passed |
| Additional visual check | Same runner with `--grep 'shell contrast and geometry'`: exit 0, 4 tests passed after adding painted-artboard pixel verification |
| Production build | `npm run build`: exit 0; new V3 chunk is lazy-loaded. Existing large-chunk warning remains |
| Real backend/browser/database | Authenticated GET → edit → Undo/Redo → PUT → independent GET/database assertion → full reload → PNG download passed; disposable account, organization and design removed |
| Independent review | Claude Opus: APPROVE (code), SECURITY PASS; review asks for durable runtime evidence, supplied in this package |

The initial unbounded unit invocation exhausted machine memory. Both complete suites were subsequently run with one worker and `NODE_OPTIONS=--max-old-space-size=4096`; no tests were removed or filtered. The existing client skip was retained.

## Evidence and authorship

The separate `v3_tests` agent wrote the initial contracts before the production implementation: missing-module unit RED and missing-V3-heading browser RED were recorded. `v3_code` owned the six production files; the coordinator added the review regressions and fixes. Both agents used Codex. This is independence by agent, not a claim that the initial test author used Sonnet or that Codex reviewed its own code as the final independent engine. Opus performed architecture/hardening review and independent code/security review.

- [Opus review](OPUS-REVIEW.md)
- [Browser run](evidence/browser-run.log)
- [Unit/build/typecheck summaries](evidence/gates.log)
- [Authenticated smoke request trace and database proof](evidence/live-smoke.json)
- [Raw authenticated smoke output and cleanup](evidence/live-smoke.log)
- [Light screenshot](evidence/v3-light.png), [dark screenshot](evidence/v3-dark.png), [real PNG export](evidence/v3-live-export.png)

The coordinator inspected the actual light/dark screenshots at 1440px. New controls and inspector are readable and do not overlap; the artboard visibly contains its text, shape and image. Browser checks also cover 1280px, enabled-control keyboard access, runtime theme switching and WCAG text contrast >=4.5:1. This is agent visual review, not product-owner signoff. The scoped contrast helper uses the same WCAG luminance/compositing approach as the existing test, with browser-canvas CSS Color 4 parsing; it is not a verbatim import of the existing page-wide probe.

Browser integration uses mocked HTTP boundaries and actual UI, renderer, history, serializer and exporter. The real smoke uses the unchanged NestJS backend on local port 3181, a real authenticated session and the existing development database; its request trace records the same canonical ID on PUT and reload GET. No migrations or seed refresh were run. The 800×600 smoke design exported at the existing renderer's 2× scale (1600×1200). The separate browser fixture decodes PNG pixels inside the text area and confirms nonblank text.

## Pilot limits and remaining delivery steps

- Manual save only. Property/Contact, AI Assistant, Brand, extraction, autosave and full tool parity remain separate work.
- Server-saved canonical IDs are supported. Local-only IDs show a clear error and remain usable in the default editor.
- A canvas mutation while a thumbnail is being prepared rejects that save before any request; retry saves the newer canvas. Once the request is in flight, a newer revision remains Unsaved after the older acknowledgement.
- Existing adapter limits remain: an indeterminate first POST may create a duplicate if retried; a successful PUT response without a raw ID cannot be distinguished by the existing adapter. No API change was made.
- Navigating away has no unsaved-changes guard. Apply and Save before leaving the pilot.
- Gemini whole-milestone verification is pending: the configured CLI is unavailable on this host. Milestone PR/main merge and human approval are still pending; no Done status is claimed.

## Preview

Start the isolated Vite preview on 5181 with its API proxy targeting 3181, sign in normally, then open `/editor?editor=v3`. For an existing server-saved design use `/editor?editor=v3&designId=<id>`. The ordinary `/editor` route continues to select the existing editor.

Final local file-scope check passed: 30 changed files, all covered by US-EDIT-031 or allowed agile documentation. The checker also reads the milestone note mentioning US-EDIT-024 and warns that its older main card lacks a file list; no runtime scope was taken from that card.

## Preview repair — 2026-10-31

User requested the old canvas Preview approach. Compared runtime EditorLayout/CenterCanvas: hide editor chrome and selection controls, expand the canvas workspace, and use Escape to return. V3 now follows that composition with its existing theme tokens and adds an explicit Exit preview button. The same mounted canvas and inspector retain applied content, selection and unapplied drafts. P enters outside fields; Preview makes no API write. Manual zoom survives scrollbar changes; entering/exiting Preview refits the available space.

Final scoped browser run: **27 passed**, including AC12 cases TC-20/TC-21 and persistent zoom. [Run output](evidence/preview-browser.log) and [Preview screenshot](evidence/v3-preview.png). Agent visual inspection confirms a centered artboard, readable Exit control and no blue native text selection or editing controls. The open in-app V3 tab was also checked for entering and exiting Preview without modifying its document.

The original 25-test evidence and Opus APPROVE above describe the earlier slice. The Preview amendment has separate review evidence; formal milestone approval/merge remains pending. Gate 4 is not triggered by this amendment: no backend changes. Existing authenticated persistence evidence remains applicable.

Final Preview Gate 1 passed: TypeScript, 811 backend tests and 399 client tests (1 existing skip). Production build completed with existing warnings. See evidence/preview-gates.log. Independent re-review is pending because the configured reviewer reached its usage limit; see OPUS-REVIEW.md. The earlier Preview review's zoom finding was fixed and regression-tested.
