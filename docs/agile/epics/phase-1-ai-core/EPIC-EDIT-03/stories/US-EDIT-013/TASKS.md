---
title: PR Task List — US-EDIT-013
type: tasks
updated: 2026-10-24
---

# PR Task List — US-EDIT-013 — Lane 2 · cleanup

> **Story:** [STORY.md](./STORY.md)
> **Stage:** Lane 2 — parallel with US-EDIT-012
> **Branch:** `feat/edit/l2-chat-panel-dead-code` off the milestone branch
> **Worktree:** `../bg-cleanup`
> **Engine:** Claude (primary)
> **depends_on:** none — deletes only, compiles against nothing Foundation adds

---

## Four Pillars Pre-flight

- [x] **Brain** — STORY.md filled, 5 ACs, all file-specific
- [x] **Muscle** — T1-T4 below
- [x] **Map** — [ARCHITECTURE.mmd](../../ARCHITECTURE.mmd)
- [x] **Env** — no environment changes

---

## Why this lane has no handover

`AIChatBox.tsx` belongs to this story outright. It does **not** call `loadAiVariationToCanvas` —
the callers are `CenterCanvas.tsx:111` and `RightSidebar.tsx:566`, both Lane 1's — so nothing here
touches anything Lane 1 touches.

`EnhancedSuggestionsPanel` has exactly two importers, `AIChatBox.tsx` and the orphaned
`AIPropertyChatInput.tsx`. **Both are owned by this story**, so the deletion typechecks inside this
worktree with no cross-lane coordination. An earlier draft split them and needed an hour-5
handover; this split needs none.

---

## Pre-flight check (run before T1 — AC5)

```bash
for f in client/src/components/ai-chat/*.tsx; do
  b=$(basename "$f" .tsx)
  hits=$(grep -rln "\b$b\b" client/src --include=*.tsx --include=*.ts \
         | grep -v "ai-chat/$b.tsx" | grep -v "ai-chat/index.ts")
  [ -z "$hits" ] && echo "ORPHAN: $b ($(wc -l < "$f") lines)"
done

grep -n "showEnhancedSuggestions\|setShowEnhancedSuggestions" client/src/components/ai-chat/AIChatBox.tsx
```

Expect the six orphans listed in STORY.md, and **exactly two** hits for the suggestions state —
`useState(false)` at line 210 and the `isOpen` prop at line 1535, with the setter appearing only in
the panel's own `onClose`.

**A third hit means the feature is wired somewhere and it is not dead code — stop and report.**
Any file that has gained an importer since 2026-10-24 stays in place and is reported, not deleted.

---

## Task Breakdown

### T1 — Delete the six orphans
- **Files:** `AIPropertyChatInput.tsx` (362) · `AIChatInput.tsx` (74) · `TemplateQuickActions.tsx` (52) · `TemplateDropdown.tsx` (48) · `AIFloatingButton.tsx` (34) · `AIChatHeader.tsx` (23)
- **Type:** `chore` · **AC(s):** AC1, AC5
- Whole-file deletions. 593 lines.

### T2 — Unwire and delete the suggestions panel
- **File:** `client/src/components/ai-chat/AIChatBox.tsx` (import at :34, state at :210, mount at :1534), then delete `EnhancedSuggestionsPanel.tsx` (355)
- **Type:** `chore` · **AC(s):** AC2, AC3
- Remove the import, the `useState`, and the JSX. Then delete the component — T1 already removed
  its other importer, so nothing references it.

### T3 — Prune the barrel
- **File:** `client/src/components/ai-chat/index.ts`
- **Type:** `chore` · **AC(s):** AC1
- Remove the exports for all seven. `npm run check` is the proof.

### T4 — Confirm the stale string is gone
- **Type:** `chore` · **AC(s):** AC4
```bash
grep -rn "Real Estate Templates" client/src
```
- Only `client/src/pages/PricingPage.tsx:102` — a real pricing feature bullet — should remain.

---

## Files — exclusive ownership

**Owns:** `client/src/components/ai-chat/` — `AIChatBox.tsx`, `EnhancedSuggestionsPanel.tsx`, the six orphans, and `index.ts`

**May read:** the rest of `client/src/components/ai-chat/**`

**Forbidden:** `api/**` · `client/src/lib/**` · `client/src/hooks/**` · `client/src/components/editor/**`

---

## Anti-Patterns to Avoid

- Do **not** change panel behaviour. If deleting something changes what a user sees, it was not dead — revert and report.
- Do **not** re-enable enhanced suggestions, or "fix" it so it can open. Whether it should exist is a product question outside this story.
- Do **not** trust STORY.md's orphan list without re-running the scan — an import graph is a fact about today.
- Do **not** touch `ResultsVariations.tsx` or any surviving component.
- Do **not** touch `CenterCanvas.tsx` or `RightSidebar.tsx` — Lane 1 owns both.
- Do **not** refactor, rename or tidy while in the directory.
- Do **not** touch the duplicate generate path — that is layer C, a different day.

---

## Gates

- [x] Gate 1 — `npm run check`, `npm run test:unit:client`
- [x] Gate 2 — open the panel, send a prompt, attach a photo, generate, render variations. Behaviour identical.

---

*Tasks created: 2026-10-24 · re-cut to Lane 2 2026-10-24*
