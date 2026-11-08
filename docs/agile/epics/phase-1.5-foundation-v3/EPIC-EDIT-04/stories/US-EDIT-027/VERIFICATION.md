# US-EDIT-027 implementation evidence — 2026-10-31

## Runtime and hardening

Read PROJECT_CONTEXT.yaml, EPIC-EDIT-04 ARCHITECTURE.mmd/ENV.yaml and all scaffold rules. Verified App lazy-loads V3Editor only for editor=v3; V3Editor imports useV3DesignSession, which directly owns v3DesignSession and calls existing designsApi. Legacy EditorLayout/useAutosave remain unchanged. The user-approved integration plan explicitly adds autosave to the retained slice.

Reconciled draft story's obsolete expected files to the actual V3 controller/hook, populated TASKS/scaffold before implementation. Public CLI `node D:/Dinesh/DCloud/GITDrive/Repos/orion-ai-sdlc/bin/orion.mjs`:

- `ac-audit US-EDIT-027 --format=json`: complete, happy-path/error-path required; eight typed ACs; warnings `[]`.
- `tc-rows US-EDIT-027 --write`: eight TC rows generated.
- `lock-write US-EDIT-027`: authoritative lock SHA prefix `57b94549fb6f` before runtime edits.

## Implementation

- Idle debounce is 2000ms after last canvas/title/listing mutation. New designs require acknowledged explicit first Save. Viewport-only mutations do not schedule writes.
- Existing canonical-ID, metadata, immutable capture, stale response and single-save guards preserved; slow saves queue the latest dirty revision after the debounce boundary. Errors pause automatic saving until explicit successful Save.
- lastSavedAt is actual acknowledged-write time. GET alone leaves it null, allowing cloud UI to avoid inventing a save time.
- Draft keys include authenticated user and current design ID/new. Storage errors are exposed separately; no legacy shared draft key used. The latest new-design draft is not removed until its adopted-ID replacement has been written.
- Recoverable drafts are offered without restoration/upload. Restore requires explicit Save before autosave resumes; Discard retains loaded server state. beforeunload guards dirty state; confirmNavigation exposes the same guard for shell Projects navigation.

## Checks

- `npm run check`: passed frontend and API after initial implementation. Root coordinator runs final Gate 1 after combined changes.
- Focused Vitest session/autosave tests: 42 passed (15 autosave and 27 retained/extended session contracts). Includes original slice contracts, timer/debounce/first-save/failure/manual-retry/races/stale-response/disposal/timestamp/recovery/isolation/quota/listing-only mutations, safe first-ID draft migration and hook beforeunload/confirmation.
- First sandboxed Vitest attempt failed with Node EPERM resolving C:/Users/dinpr; same command passed with approved escalation. This is recorded as environment failure, not a product failure.
- UI/browser and live-server smoke are coordinated in US-EDIT-024. No browser or API smoke is claimed by this file. No commits made by the session subtask; coordinator owns Gate 1 and task commit.

## Remaining delivery evidence

Cloud status/recovery message appearance and Projects confirmation need combined shell verification. Browser Back/Forward interception is not supplied by confirmNavigation; beforeunload covers document unload only. No retry loops, collaboration, conflict reconciliation, offline cloud publishing, encrypted local drafts or backend migrations introduced.

## Combined integration evidence — 2026-11-01

Final full type checks, backend811/client426 unit tests (one existing skip) and production build pass. Guarded existing-design autosave with the same PUT identity passes its browser contract. Fresh authenticated real-server save/independent GET/database/reload/PNG smoke passes with disposable data cleaned up. Full browser regression evidence is recorded in the approved bundle implementation report; formal review/PR/merge remain pending.


## Source/evidence reconciliation — 2026-11-07

Audited current useV3DesignSession/V3Editor runtime and session/autosave unit contracts. The old unchecked all-in-one T1 obscured already implemented work; TASKS now separates completed autosave/recovery/explicit confirmation from the open same-document route guard. AC4 and TC-EDIT-027-04 remain partial. The historical authenticated smoke above is not represented as newly rerun. Fresh delivery unit/browser run results are linked from the current V3 delivery packet; mocked browser persistence does not certify authenticated database behavior. No runtime changes, story closure or main merge occurred during this reconciliation.

Current candidate `7ae0fe0` fresh coordinator checks: frontend/API types;811 backend+739 client unit passes (1 existing skip); production build. Full133-browser execution132pass/1 timeout, with the unchanged Preview case1/1passing on rerun. These checks include retained autosave/session contracts; they do not implement or certify missing AC4 same-document interception.

## AC4 implementation and verification — 2026-11-08

Implemented on `codex/v3-arrange-opus`, after validating the existing harden lock SHA `74fc286d34c3` against STORY.md. Runtime chain verified: App Wouter useSearch/useLocation → opt-in V3Editor → useV3DesignSession → session dirty state. TASKS.md defines the exact expanded file scope and navigation/test contract before runtime edits.

`v3NavigationGuard.ts` initializes history tracking at App startup and consults only registered V3 sessions. Push/replace are checked before Wouter notifications. Capture-phase rejected popstate returns to the original indexed entry without replacing history or exposing a transient destination to the router. Native hash-created entries are indexed; anchor-only movement stays within the design. Public History.state and PopStateEvent.state retain caller values (null, primitives, arrays and objects), with private indexing in the browser's stored envelope. V3 session cleanup unregisters its predicate; global history tracking intentionally lasts for the document. `dispose` is isolated-test teardown, not a route/session lifecycle API. First-save ID adoption uses a synchronous internal bypass; subsequent navigation stays guarded. Logo and Projects use Wouter links and request consent once. Existing beforeunload and explicit confirmation API retained.

Contract tests were written before the module; the first executable run failed because the new module was absent, as expected. A preceding sandbox run failed from installed Node EPERM on C:/Users/dinpr; approved escalation allowed every required check. No unresolved approval rejection.

- Gate 1: `npm run check` passes frontend/API types. `npm run test:unit` passes 811 backend +750 client tests; one existing client skip. New guard unit file contains 11 contracts, including exact public state preservation and disposal. Existing session/autosave contracts pass.
- Gate 2: supported desktop 1280/1440 light/dark geometry, contrast and keyboard checks pass in the retained browser spec. No styling change. Separate manual/mobile visual review was not rerun: the referenced visual-checklist.md is absent and this task changes routing behavior only. Formal release review remains pending.
- Gate 3: `CI=true PLAYWRIGHT_BASE_URL=http://127.0.0.1:5000 npx playwright test e2e/us-edit-031-v3-slice.spec.ts --reporter=list --retries=0`: 37/37 pass. The subsequently added `--grep 'rapid traversals'` regression passes 1/1: 38 distinct browser contracts verified in total, including 10 new navigation cases. Rejected traversal assertions await the prompt and URL restoration. Tests cover accept/reject Back/Forward, multi-entry go, rapid double-Back, dirty design switches and legacy opt-out queries, accepted push/replace, native hash predecessor/editor hashes, single Projects prompt, detached clean navigation, first-save adoption without extra GET, save/recovery, legacy default and desktop themes.
- Gate 4: not applicable to this frontend-only change; no new authenticated API/database smoke claimed. Browser HTTP/auth boundaries are mocked, while real App/Wouter/session/canvas run. Full unrelated browser suites were not rerun for this bounded routing change.

AC4 and T2 are locally verified. Story/epic/milestone are not formally Done: independent review/PR/merge and wider V3 acceptance remain pending. No #4–#9 feature implementation, main merge, push, PR or deployment.
