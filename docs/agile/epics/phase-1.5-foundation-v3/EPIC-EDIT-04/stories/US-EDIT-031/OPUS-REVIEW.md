**Verdict: APPROVE (code), with runtime-evidence gaps that block a "Done" claim. SECURITY PASS.**

**AC conformance (code-verified)**
- **AC1/AC2:** Validation runs before the listing reset. `resetProperty`/`resetAgent` run immediately before `restoreCanvasData`. The stale generation check runs before restore. Network or validation failure never touches the stores. A `false` restore becomes a load error with Retry. While not `ready`, the canvas is unmounted.
- **AC3:** Apply text makes one `updateElement` call through `commitEdit`, with no extra push. The draft is keyed to `id:content`, so Undo resets it. The keyboard handler skips input, textarea, select and contenteditable targets, and no legacy hook is mounted.
- **AC4/AC5:** Metadata is spread from GET with `id`, `name`, `canvasData` and `thumbnail` stripped. `designsApi.save` serializes only the allowed fields, so absent fields stay omitted. A mismatched or non-canonical ack is rejected and the status stays Unsaved. There is no local fallback, and the regex gate runs before any GET.
- **AC6/AC7:** The revision fingerprint excludes zoom, pan, selection and timestamp. Saves are serialized by the `saving` flag. The initial ID is held in a ref. `onId` sets `requestedId` before `replaceState`, so wouter's re-render cannot reopen the session. `isOwnAdoption` covers the window before the router catches up.
- **AC8/AC9/AC11:** The existing `downloadCanvas` is used unchanged, and a false return or throw both lead to the error banner with retry. The legacy path in `App.tsx` is untouched and the V3 route sits under ProtectedRoute.

**Code findings (non-blocking)**
1. `useV3DesignSession.ts` save: an edit made while the thumbnail is rendering fails the whole save ("design changed…"). This is safe, but it differs from AC6's "ack A leaves B Unsaved" semantics within that window. Document it or accept it explicitly.
2. `V3Editor.tsx` keydown: Ctrl+S while not ready returns before `preventDefault`, so the browser's Save dialog opens. Call `preventDefault()` first.
3. Leaving via the Projects link has no unsaved-changes guard. That is outside the ACs, but it is a real data-loss path for testers.
4. The `queryClient` cache keeps full `canvasData` under `['v3-design', id]` after unmount. Consider `gcTime: 0`.
5. Trailing blank lines were added to `PROJECT_CONTEXT.yaml`, `PROJECT_CONTEXT.md` and `EPIC.md`. Drop them.

**Security:** Content is rendered as React text, the ID is validated before any request, the URL is built with the `URL` API, the auth boundary is unchanged and ownership enforcement stays on the backend. No issues found.

**Missing runtime evidence (not code defects)**
- The live smoke is only a `result.json` summary. It has no command, raw log, record ID or request trace, so it cannot independently show PUT-same-ID or reload. Attach the raw output.
- Gate 2: screenshots were captured but no human light/dark review is recorded.
- AC10: the e2e test uses a reimplemented luminance probe, not the existing `design-contrast.spec.ts` probe. It is equivalent in intent but not verified as the same.
- The full client run log tail shows 22 files and doesn't prove `v3DesignSession.spec.ts` was included; the scoped run (24 tests) does pass. The act() environment warnings are noise to clean up.
- `STORY.md` and `TASKS.md` checkboxes and the evidence log are not updated, so the DoD is incomplete.

## Preview amendment review — 2026-10-31

**Verdict: REQUEST CHANGES. SECURITY PASS.**

The AC1–AC11 core holds up. The Preview delta (AC12) has one probable code defect, and the docs make claims that the supplied evidence does not support.

**Verified in code (AC1–AC11)**
- Load path order is correct: validate, then stale-token check, then listing reset, then `restoreCanvasData`. A `false` restore becomes a load error, and the baseline is taken after hydration.
- Network and validation failures never touch the stores.
- Apply text is one `commitEdit` → `updateElement` call with no extra history push. The draft key `id:content` resets the draft after Undo.
- The revision fingerprint excludes zoom, pan, selection and timestamp. The `saving` flag serializes saves, and the generation token rejects old-session acknowledgements.
- `onId` sets `requestedId` before `replaceState`, so adopting a new ID cannot trigger a reopen. `isOwnAdoption` covers the gap before the router updates.
- Saved metadata is the GET record with `id`, `name`, `canvasData` and `thumbnail` removed, and `designsApi.save` serializes only allowed fields. Mismatched or non-canonical IDs fail as Save failed and show Unsaved.
- The legacy route and ProtectedRoute are unchanged.
- Preview keeps the inspector mounted (hidden), `selectedElementIds`, history and session state intact. Escape is handled before the field guard, P is field- and modifier-guarded, focus returns to the Preview button, and Preview is gated on `ready`.

**Code defects**
1. **Probable defect: manual zoom gets reset.** `V3Canvas.tsx` now calls `fitCanvasZoomToViewport` from a ResizeObserver on the `overflow-auto` viewport. With non-overlay scrollbars (Windows Chrome), zooming past the viewport adds scrollbars, which shrinks the content box. The observer then refits and discards the user's zoom, and this can oscillate. TC-14 only checks "Saved", not the zoom %, so it would not catch this. Fix: refit only on preview toggle, dimension change or window resize, and add an assertion that the zoom value persists.
2. **Still open from the prior review:** Ctrl+S while not ready returns before `preventDefault`, so the browser's Save dialog opens.
3. **Minor:** an unsupported ID renders "Unsupported design ID · Unsupported design ID". Save and load error banners are hidden during Preview with no indicator.

**Documentation that doesn't match the evidence**
4. STORY.md DoD has "All ACs checked" and "All test cases run" ticked, but AC12 and TC-12 are 🔲.
5. The TC-EDIT-031-12 ID collides. In STORY it means Preview; in the e2e spec it is the inspector-draft test, and the Preview tests are TC-20 and TC-21. TASKS still says "TC-12 asserts history.past +1". Renumber so each ID has one meaning.
6. The implementation log, PR_BODY and VERIFICATION cite "25 browser tests" and "Opus APPROVE". The spec now has 27 tests, and that approval predates the Preview code, so neither covers the current tree.

**Missing runtime evidence (not code defects)**
- No run output for TC-20 or TC-21.
- No comparison against EditorLayout's preview, which AC12 requires ("same composition"); EditorLayout was not supplied to this review.
- No Preview screenshots in light or dark.
- AC10 contrast uses a reimplemented probe, not the existing `design-contrast.spec.ts` probe. This deviation needs explicit owner acceptance.
- The full client run log doesn't show that `v3DesignSession.spec.ts` was included (only the scoped 24-test run does).
- Gate 2 is agent visual review only; no human sign-off is recorded.

**Security:** IDs are regex-validated before any request, the URL is built with the `URL` API, content renders as React text, the auth boundary is unchanged and ownership enforcement stays on the backend. The export filename is the user's own title. No issues.

Resolution: fixed scrollbar-driven zoom reset using stable viewport bounds and added persistence assertion. Updated AC12/test evidence, retained screenshot and clarified historical approvals. Existing not-ready Ctrl+S and duplicate unsupported-ID wording predate this amendment; follow-up items. Final independent re-review could not run: reviewer returned HTTP 429 usage_limit_reached. Preview approval remains pending; SECURITY PASS belongs to the completed review above. No formal Done/merge claimed.
