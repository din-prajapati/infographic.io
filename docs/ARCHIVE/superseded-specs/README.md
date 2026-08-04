# Superseded specs — preserved, not executed

Files here are kept as a record. The `.superseded` suffix keeps them out of
Playwright's `e2e/**/*.spec.ts` glob, so nothing in this directory runs.

## us-ai-038-format-picker.spec.ts.superseded

713 lines, 9 tests, written 2026-07-31. It existed only inside an agent
worktree and was never committed anywhere.

It targets the **pre-US-AI-039** Format Picker — the 3-step wizard with a
"Continue" button and a library step. US-AI-039 replaced that with a persistent
rail and made format selection create the canvas immediately, so most of these
tests describe behaviour that no longer exists:

| Test | Fate |
|---|---|
| TC-038-01 no pixel/ratio numbers | **ported** → TC-AI-039-07 (AC7) |
| TC-038-02 opens from /templates too | **ported** → TC-AI-039-05 (AC8) |
| TC-038-07 reopen pre-highlights format | **ported** → TC-AI-039-06 (AC5) |
| TC-038-03 / 04 / 09 | dead — all test the removed library step |
| TC-038-05 | partly covered by TC-AI-039-03 |
| TC-038-06 | duplicated by TC-AI-039-04 |
| TC-038-08 | duplicated by US-AI-040 TC-02 |

The three ported tests covered acceptance criteria that had **no** automated
coverage before, which is why the file was worth reading rather than deleting.

Kept because the assertions and setup helpers may be useful reference if the
library step ever returns in another form. Do not re-add it to `e2e/` as-is —
it would fail on the first selector.
