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
