# [M-EDIT-11] Opt-in V3 editor vertical slice

Agents can open a server-saved design in a fresh V3 workspace, edit text, use Undo/Redo, save to the same server record, reload and export PNG. The shell reuses the existing canvas elements, store, serializer, API and exporter. The editor=v3 query selects the pilot; the ordinary editor remains the default.

Save errors retain edits, loading and invalid IDs cannot overwrite a design, and an older save acknowledgement cannot mark newer edits Saved. This slice is desktop-only and uses manual save. Property/Contact, Brand, Assistant, autosave and full tool parity remain separate work.

Validation: TypeScript and production build pass; 811 backend and 399 client unit tests pass (one existing skip); 25 browser tests pass, plus four painted-artboard/contrast checks. Authenticated real-backend save/reload, direct database assertion, PNG download and fixture cleanup pass. Opus review: code APPROVE, SECURITY PASS.

[Story and scope](STORY.md) · [Verification and evidence](VERIFICATION.md)

Delivery remains pending Gemini whole-milestone verification (CLI unavailable on this host) and human approval for main merge. No production deployment or default switch has occurred.
Preview amendment (2026-10-31): canvas-only Preview now hides editing panels, fits the artboard and restores drafts through Exit/Escape. The scoped browser suite now passes 27 tests; see VERIFICATION.md for amendment evidence and review status.
