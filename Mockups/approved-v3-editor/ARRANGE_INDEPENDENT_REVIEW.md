# Arrange independent review — 2026-11-07

Initial review target: `b69074b..3b8a150` on `codex/v3-arrange-opus`. Reviewer: fresh, read-only Codex reviewer agent, independent of the implementation agent. This is not represented as an Opus review. Contract: ARRANGE_VERIFICATION.md, including the recorded no-new-story-card exception and reference presentation contract. Main merge is explicitly prohibited.

## Initial verdict: Request Changes

The reviewer independently inspected code/geometry/UI and ran the two Arrange unit files:28/28 passed. It separately reproduced legacy-line failures with in-memory execution of the actual modules. Existing tests did not cover those regressions. No new security issue was found. The recorded1543-unit/17-browser evidence predates remediation and is not substituted for fresh checks.

| Finding | Severity | Initial source | Required resolution |
|---|---|---|---|
| R1 | Required | V3ArrangePanel.tsx:19 | Keyboard arrow/Home/End activates a tab but loses focus: asynchronous callback reads an expired React event and an unmounted tablist. Focus the replacement tab inside a retained editor scope. |
| R2 | Required | V3ArrangePanel.tsx:73; v3Arrange.ts:94 | Legacy line frame100/path10..90 displays100 while the commit uses span80. Retyping the displayed value resizes artwork and adds history. Share display/commit size semantics and skip unchanged spans before normalization. |
| R3 | Required | v3Arrange.ts:112 | Legacy X20 normalizes into X30 and changes frame dimensions. Numeric origin/rotation edits must honor stored values without incidental line normalization; retain defaults for other tools. |

Suggestion: JSX-valued tabs prop follows the current shell composition but conflicts with a general React rule. Treat a shared sidebar wrapper/children cleanup as separate work; it is not a correctness blocker or part of this focused repair.

The reviewer praised atomic complete-selection page alignment: all targets are validated and the batch creates one Undo entry.

## Remediation and re-review

All 3 required findings are repaired in the scoped T7 working-tree change against3b8a150. R1 captures the retained `.v3-editor` element before the tab change and focuses the new tab after render. R2 uses shared `v3EditableSize` for field display and numeric interpretation, and returns unchanged spans before normalization/history. R3 adds an explicit optional `normalizeLine` commit setting: default normalization remains for existing tools; only Arrange origin/rotation edits opt out. Selection, numeric/paint validation and history checks remain in the shared commit helper.

Contract-derived RED tests first reproduced the keyboard and legacy numeric defects. The implementation agent ran41focused tests after repair. Root independently ran the two real-browser regressions:2/2 passed, covering active-tab focus/continued keyboard access and a rotated legacy line's displayed spans, unchanged document, exact stored X/Y/rotation, save and three-step Undo restoration.

## Final independent verdict: APPROVE for repaired Arrange code

The same fresh read-only reviewer re-inspected the repaired source and independently ran all three affected unit files: **41/41 passed**. Required findings:0. Blockers:0. The composition suggestion remains nonblocking. No new security issue was found. The reviewer did not execute browser/full gates and did not edit or commit code. Root's fresh delivery gates are recorded separately in V3_DELIVERY_PACKET.md.

Approval is scoped to Arrange and its integration delta, including the reviewed legacy-geometry helper change. It does not approve all earlier main-to-candidate code, close US-EDIT-027's remaining route guard, authorize a PR/main merge, or certify production/database behavior. Fix commit identity and final full-run evidence are recorded in the delivery packet after checkpointing.

Reviewed repairs are checkpointed as `7ae0fe0`. That commit contains the same source and regressions reviewed above; no source was changed after the independent approval. Main remains unchanged; final gate outcomes are recorded in V3_DELIVERY_PACKET.md.

Root final gates on reviewed runtime `7ae0fe0`: frontend/API types and production build pass;1,550 unit passes with1 existing skip. Full browser132 passes/1 timeout plus isolated1/1 Preview rerun covers133 distinct contracts. The reviewer approval is independent of these coordinator-run gates; the full-run caveat is retained.
