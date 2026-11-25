# V3 release hardening and tracker reconciliation — 2026-11-14

Branch: `codex/v3-listing-responsive-handoff`. Audited Opus baseline: `3e95a40` (includes `0282a8d` and `75c5aee`). Remote fetched before work; no newer branch update was reported. Scope: user-approved standup points2/3. Font/typography annotations remain with the user; no CSS/font redesign, Assistant, provider integration, default-route cutover, merge or deployment is included.

## Status definitions and phase accounting

Implementation/AC completion is not formal Done. Formal Done still requires the applicable review, accepted UI and milestone PR merge. No story is being closed through a bookkeeping-only sweep.

Phase 1.5 has 42 cards: EPIC-EDIT-04 has 25, EPIC-PROP-01 has 12, EPIC-OBS-00 has 5. Formal closure remains 1/42 stories and 1/12 milestone documents (US-EDIT-009 / M-EDIT-03). The original 27-story phase count omitted later splits and the V3 vertical slice.

| Milestone | Implementation position | Formal closure |
|---|---|---|
| M-EDIT-11 | US-EDIT-031–044:14 locally implemented cards;49 ACs were checked before this pass | Review/merge/UI acceptance pending |
| M-EDIT-09 | US-EDIT-024/025/027:3 implementation candidates | Review/merge pending |
| M-EDIT-06 | US-EDIT-020/021:2 implementation candidates | Review/merge pending |
| M-EDIT-07 | US-EDIT-022:1 implementation candidate | Review/merge pending |
| M-PROP-01 | US-PROP-001/002 delivered within reconciled contracts;003/006/007 require separate contract audit | Not closed |
| M-PROP-03 | US-PROP-004 delivered;005 version/proven flag not certified | Not closed |
| M-PROP-02 | Personal agent/brand persistence exists under001; onboarding/brand-layer/QR cards are not certified by that overlap | Not closed |
| M-EDIT-08 / M-EDIT-10 | Assistant / poster extraction deferred | Not started |
| M-OBS-01 / M-OBS-02 | Existing observability/operator work remains outside this repair | Open |

## Story evidence map

Reconcile the seven stale cards against their **current reconciled ACs**, not the older draft scope: US-EDIT-020/021/022/025 and US-PROP-001/002/004. Preserve uncertified sibling cards as open rather than double-counting overlapping functionality.

| Story | Observable coverage / relevant evidence |
|---|---|
| US-EDIT-020 | Template Fields compatibility/selection/customization, overlay and toolbar entry: V3TemplateFields/V3ElementToolbar/V3LinkOverlay units and Listing browser journeys |
| US-EDIT-021 | Findings, stale render rejection, actual reviewed PNG and accessible review dialog: v3ExportReview/V3ExportReview units, Listing and real-backend export journeys |
| US-EDIT-022 | Fact-stripped reusable Templates, independent Designs, pending/applied persistence, deep links and protected template navigation: template/session units, shell/Listing/deep-link journeys |
| US-EDIT-025 | Intake, reviewed paste, saved catalogue, Property/Agent/Brand forms and media: V3ListingPanel units, Listing browser and real-backend R2 journeys |
| US-PROP-001 | Prisma Property/profile ownership/version/validation and large-body boundaries: properties service/controller/HTTP units plus earlier real isolation audit and current dev journey |
| US-PROP-002 | Shared validation, exact pricing/intent/rental periods and reviewed import conflicts/staleness: api/tests/listing/listing-workflow.spec.ts, Listing extraction browser case |
| US-PROP-004 | Pending/applied snapshots, atomic Apply/customization/undo/history and serialization: workflow/store/session units and Listing save/reopen journeys |

Historical sources: `2026-11-13-V3-LISTING-IMPLEMENTATION.md`, `2026-11-13-V3-MOCKUP-FIDELITY-MATRIX.md`, `2026-11-13-V3-REAL-BACKEND-E2E.md`. Their results retain their original dates; fresh results below supersede only the checks actually rerun.

## Release repair ledger

| Finding | Required disposition | State |
|---|---|---|
| Template use bypasses unsaved-work guard | Confirm before creating a server Design; cancel must not write or navigate; later edits/navigation must not be discarded by a late response | Fixed and verified |
| Template confirmation describes replacement | Explain that a separate Design is created; retain fallback wording only for actual replacement | Fixed and verified |
| Preview revision change is reported as Save failed | Treat a superseded preview as retry of the latest revision; retain real-error/manual-retry policy and acknowledgement correctness | Fixed and verified |
| Canvas Undo/Redo after Apply invents custom values | Keep workflow metadata coherent with artwork history while preserving live pending source facts and intentional overrides | Fixed and verified |
| Valid custom photo leaves old missing-photo block | Clear that resolved skipped finding only; retain other unresolved-image findings | Fixed and verified |
| Historical 39-case browser fixture mismatch | Modern canonical fixture and current Save/review semantics, retained legacy-hydration assertions; no skipped/weakened cases | Fixed and verified |

## Verification

| Fresh check | Result / evidence |
|---|---|
| Frontend/API TypeScript | PASS: `release-2026-11-14-final-check.log` |
| Full backend units | 853/853 PASS,65 files: `release-2026-11-14-backend.log` |
| Full frontend units, latest source | 837 PASS +1 existing skip,70 files: `release-2026-11-14-final-client.log` |
| Production build | PASS: `release-2026-11-14-build.log`; existing Browserslist/PostCSS/chunk-size warnings retained |
| Full V3 browser run | 166/167 PASS; first Preview case timed out before the Design title appeared on initial page load: `release-2026-11-14-v3-browser.log` |
| Complete historical suite rerun | 39/39 PASS, including that Preview case, with no source change or timeout increase: `release-2026-11-14-historical-rerun.log` |
| Current Listing browser suite | 9/9 PASS: `release-2026-11-14-listing-browser.log` |
| Real API/Prisma/R2/browser | 6/6 PASS (5 deep-link cases plus full Listing save/reopen/template/upload/PNG journey): `release-2026-11-14-real-backend.log` |
| Local API health | HTTP200; no backend source or schema changes in this repair |
| Visual checks | Fresh dark375px sheet and light768px screenshots inspected; full browser suite covers phone/tablet/desktop and both themes. This is not user font acceptance or physical-device testing. |

Totals:1,690 passing unit tests and1 existing skip. All182 distinct browser scenarios have passing coverage across the full run and bounded rerun; **not a single all-green167-case invocation**. The initial startup timeout is retained as an infrastructure/readiness finding, not hidden by changed assertions, removed tests or retries configured in the suite. Browser rerun was serialized after CPU-heavy unit/build work completed.

All logs above are under `.agent-logs/` and ignored. The frontend final run includes the additional deferred-gallery-fetch regression (the earlier intermediate run had836 passes). Fresh live checks use the existing development test account and create isolated `E2E-HZN-*` records/R2 objects; their existing ledger is `.agent-logs/real-backend/created.txt`. Those disposable artifacts remain in that test organization under the existing no-DELETE-route convention. No existing user designs were intentionally altered by verification.

## Acceptance and explicitly open items

- User is reviewing further UI/UX/font annotations. They remain pending even if the functional checks pass.
- Physical iOS/Android hardware acceptance cannot be completed by desktop viewport emulation; retain it as a manual release check.
- V3 remains opt-in; Templates/My Designs/Format Picker cutover is separate authorization/scope.
- Operator proof of alert delivery and Railway billing alerts (US-OBS-005 T5 / BL-34), plus observability reconciliation, remain open phase gates.
- Existing public-read R2 policy, media cleanup and legacy uploads are separately documented decisions, not silently changed here.
- ORION audit warns that PROP has no per-domain AC-coverage override. Existing default happy/error requirements pass; PROP-004 additionally has regression/edge-case ACs. No coverage policy was weakened to silence that warning.
- Final code review, formal story/milestone closure, PR/main merge and deployment require their actual outcomes. They are not implied by local verification.

## Independent functional review — 2026-11-14

The independent reviewer initially requested changes for a paused manual retry that was superseded during thumbnail rendering, and for URL-template startup after intervening pending/background/geometry edits. Both were repaired with regression coverage. A further gallery-fetch race across Design navigation was also repaired and covered by a deferred-response unit test. Final verdict: **Approve with verification limits**; no remaining concrete P0/P1/P2 findings in the bounded session/template repair. This is not whole-milestone UI/physical-device approval.

Root separately traced the Listing workflow's history pairing against useCanvasStore Undo/Redo and full document restoration. Apply creates distinct element-array history entries; pending source stays current, applied/binding/override metadata follows history, and full document restoration resets the pairings. Dimension-only changes remain outside existing canvas Undo semantics; Undo last apply correctly refuses to discard later resizing. The five reported workflow regressions were reproduced before the fix and pass afterward.

Source files in this repair contain no CSS/font changes. Further user font/UI annotations remain pending and must be reviewed separately before release acceptance.
## Delivery position

Automatable standup points2/3 are complete for this bounded repair: story/AC/task/scaffold records and applicable epic/milestone/phase/team/index/roadmap summaries reconciled; reported functional issues repaired; historical fixtures reconciled; independent functional review approved. User UI/font annotations, physical devices, existing operational phase gates, actual milestone PR/merge and deployment remain separate and open.
