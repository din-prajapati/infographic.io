---
title: M-EDIT-04 — Execution Runbook (agent prompts)
type: runbook
domain: EDIT
created: 2026-10-24
---

# M-EDIT-04 — Execution Runbook

Copy-paste prompts for each stage. Designed so an agent **interrupts only on a decision**, never on
a mechanical blocker — every known blocker below carries its own fix inline.

> **Milestone:** [M-EDIT-04-ai-composition-over-template](./M-EDIT-04-ai-composition-over-template.md)
> **Operating model:** all implementation is Claude; Gemini verifies read-only after integration.

---

## Decisions — settled 2026-10-24

| | Decision | Answer |
|---|---|---|
| **D1** | What "replace" means when an AI *poster* is placed | **(a)** discard template-owned slot-tagged layers — regardless of whether the user edited them |
| **D2** | Undo scope | **(a)** layer discard only; no property-store write |
| **D3** | Warn at generate time vs apply time | Deferred — copy change, not architecture |
| **D4** | What a text-free background is with no user photo | Answered by running M-EDIT-03 Gate 2 step 5 with a real photo (also closes BL-26) |
| **D5** | Persistence vehicle | `propertyData` JSON — no migration |

**Why D1 = (a).** Slot tags *are* the property-fact vocabulary — `property.price`, `agent.rera`,
`property.headline`. An AI poster already renders those facts into pixels, so any slot-tagged layer
over a poster is a duplicate by construction. That is exactly the set to discard and nothing more.
A user's own text box carries no slot tag precisely because it is not a listing fact, so (b) is
collateral damage; (c) leaves two prices on screen and does not fix the defect.

**Not "only unfilled placeholders."** Tempting now that `[Price]` is visibly fake, and wrong: if the
user typed ₹1.85 Cr and the poster carries ₹1.9 Cr, keeping the edited layer reproduces the bug
exactly. **Edit state is not the discriminator — poster-vs-background is.**

**Why D2 = (a).** The user's typed facts are not at risk: a value typed into the sidebar lives in
`usePropertyStore`, which the canvas discard never touches, and a value typed onto the canvas is
restored by the existing `pushToHistory` snapshot in one Undo press. (b) would make `canvasState`
the **first writer across the `usePropertyStore` seam** — that is the binding layer, out of scope
and needing a migration plan for 181 saved designs. The failure modes are also asymmetric: (a)
fails as "press Undo"; (b) fails as "Undo restores the layers and silently keeps the overwritten
price", because `pushToHistory` records canvas elements only. An Undo that lies is worse than no
feature.

---

## Stage 1 — Foundation · US-EDIT-011

Run in the **main checkout**, on `feat/edit/m-04-ai-composition-over-template`. Interactive `claude`.

```
Implement US-EDIT-011 (Foundation) for milestone M-EDIT-04.

READ FIRST, in this order:
  docs/agile/epics/phase-1-ai-core/EPIC-EDIT-03/stories/US-EDIT-011/STORY.md
  docs/agile/epics/phase-1-ai-core/EPIC-EDIT-03/stories/US-EDIT-011/TASKS.md
  docs/agile/epics/phase-1-ai-core/EPIC-EDIT-03/milestones/M-EDIT-04-ai-composition-over-template.md

The STORY.md yaml block is binding: implement only what `owns:` lists, read `may_read:`
freely, never touch `forbidden:`. TASKS.md T1-T5 is the work.

CONTEXT YOU DO NOT NEED TO REDISCOVER:
- ai-orchestrator.service.ts:274 already computes `useTextFree` and discards it. Reuse that
  variable; do not recompute the condition.
- Infographic.propertyData is already Json. D5 = JSON, so there is NO Prisma migration.
- Both new fields are OPTIONAL. Absent means a legacy row, which the canvas reads as
  'background'. Making either required breaks 181 saved designs.
- T4 is a VERIFICATION pass, not a tagging job. Do not blind-tag property.price on all five:
  Market Report has no listing price by design, MLS Listing Sheet has no price element at all.
  Tag only fact-bearing elements that genuinely lack a slot; report product gaps, change nothing.
- BL-40 replaced fabricated values with bracketed placeholders ([Price], [Property name] — 37,
  test-pinned). They are correct. Keep them.

SELF-SERVICE — fix these yourself, do not ask:
- Tests fail to run / node_modules missing  -> run `npm install`
- `orion lock-status US-EDIT-011` says unlocked -> run `orion lock-write US-EDIT-011`
- A line number in TASKS.md has drifted -> locate by symbol name and proceed; note it in your report

STOP AND ASK ONLY IF:
- propertyData turns out to be written only on generation success, and writing it at creation
  would require restructuring the service beyond this story's files (AC3 depends on this).
- Any change you need falls outside `owns:`.

WHEN DONE, report in this exact shape and nothing longer:
  Files changed:      <list>
  ACs satisfied:      AC1..AC7, each with the line that satisfies it
  Commands run:       <verbatim> -> <actual result, pass/fail counts>
  Deviations:         <anything you did differently from TASKS.md, and why>
  Ready to fork:      YES/NO

GATES before you declare done — run them, paste real output, never claim a pass you did not see:
  npm run check
  npm run test:unit:backend
```

**After it reports `Ready to fork: YES`:**

```bash
npm run check && npm run test:unit:backend
git commit -am "feat(edit): T1-T4 persist the AI composition flag — US-EDIT-011"

# the lanes were forked before the contract existed — rebase them onto it now
git -C ../bg-canvas  rebase feat/edit/m-04-ai-composition-over-template
git -C ../bg-cleanup rebase feat/edit/m-04-ai-composition-over-template
```

---

## Stage 2a — Lane 1 · US-EDIT-012 · `../bg-canvas`

Interactive `claude`, **supervised**. This is the only lane that can destroy a saved design.

```
Implement US-EDIT-012 (Lane 1, canvas) for milestone M-EDIT-04.

D1 = (a) When composition === 'poster', discard template-owned slot-tagged layers —
     REGARDLESS of whether the user edited them. Edit state is not the discriminator.
     Layers with no slot tag (a user's own text box, sticker, note) SURVIVE untouched:
     they are not listing facts and do not duplicate anything in the poster.
D2 = (a) Layer discard only. Do NOT write to usePropertyStore. The existing
     pushToHistory(snapshot.elements) at canvasState.ts:441 already makes the discard
     undoable in one press, and a value typed into the sidebar form is untouched because
     it lives in usePropertyStore, which you are not modifying. T4 is canvas-only.

READ FIRST:
  docs/agile/epics/phase-1-ai-core/EPIC-EDIT-03/stories/US-EDIT-012/STORY.md
  docs/agile/epics/phase-1-ai-core/EPIC-EDIT-03/stories/US-EDIT-012/TASKS.md

The STORY.md yaml block is binding. TASKS.md T0-T5 is the work; T0 is already answered by the
D1/D2 values above — record them in STORY.md §Decisions and move on.

CONTEXT YOU DO NOT NEED TO REDISCOVER:
- The two live callers of loadAiVariationToCanvas are CenterCanvas.tsx:111 and
  RightSidebar.tsx:566. NOT ResultsVariations.tsx, which only raises onUseVariation.
- ImageElement.aiComposition is already DECLARED by Foundation in canvasTypes.ts. Assign it;
  do not redeclare it. canvasTypes.ts is read-only for you.
- splitElementsForAiBackground is pure and already unit-tested. Keep it pure — take composition
  as a parameter, never read a store inside it.
- pushToHistory (canvasState.ts:441) records canvas elements ONLY. If D2 = (b), the history
  entry must carry both stores or the Undo silently keeps an overwritten price.
- Absent composition means 'background'. Never 'poster'.
- loadComposedDesignToCanvas is a second canvas route missing the same undo push (BL-23).
  OUT OF SCOPE. Do not fix it even while you are in the file.

SELF-SERVICE — fix these yourself, do not ask:
- node_modules missing -> `npm install`
- unlocked -> `orion lock-write US-EDIT-012`
- `grep -n "AiComposition" client/src/lib/api.ts client/src/lib/canvasTypes.ts` finds nothing
  -> this worktree predates Foundation. Run:
     git rebase feat/edit/m-04-ai-composition-over-template
  then re-check. Only if it is still absent, stop.
- A line number has drifted -> locate by symbol and proceed; note it in your report.

STOP AND ASK — these are the only ones:
1. restoreCanvasData cannot distinguish template-load from saved-design-restore.
   It has five call sites (EditorLayout.tsx:86/97/120, TemplatesPanel.tsx:149,
   CenterCanvas.tsx:135) sharing one function. If the two cases are indistinguishable at that
   boundary, STOP. Do not adapt the rule to work around it — that is how a reopened customer
   design gets its content marked as placeholder and deleted. Report and wait.
2. Satisfying AC5 (one undo) under D2 would require changing the history system beyond
   canvasState.ts.
3. Any change you need falls outside `owns:`.

If you must ask, batch every question into ONE message.

WHEN DONE, report in this exact shape:
  Files changed:      <list>
  ACs satisfied:      AC1..AC7, each with the line that satisfies it
  Commands run:       <verbatim> -> <actual result>
  D1/D2 as applied:   <how the decisions shaped the code>
  Deviations:         <and why>
  Risks for review:   <anything the Gemini verifier should look hardest at>

GATES — run them, paste real output:
  npm run check
  npm run test:unit:client
```

---

## Stage 2b — Lane 2 · US-EDIT-013 · `../bg-cleanup`

Runs in parallel with Lane 1. Independent of Foundation — safe to start immediately.

```
Implement US-EDIT-013 (Lane 2, cleanup) for milestone M-EDIT-04.

READ FIRST:
  docs/agile/epics/phase-1-ai-core/EPIC-EDIT-03/stories/US-EDIT-013/STORY.md
  docs/agile/epics/phase-1-ai-core/EPIC-EDIT-03/stories/US-EDIT-013/TASKS.md

The STORY.md yaml block is binding. TASKS.md T1-T4 is the work.

This story DELETES unreachable code and changes no behaviour. If removing something changes
what a user sees, it was not dead — revert that part and report it.

CONTEXT YOU DO NOT NEED TO REDISCOVER:
- EnhancedSuggestionsPanel is mounted as isOpen={showEnhancedSuggestions}; that state is
  useState(false) at AIChatBox.tsx:210 and its setter is called only from the panel's own
  onClose. It can never open.
- Its only two importers, AIChatBox.tsx and the orphaned AIPropertyChatInput.tsx, are BOTH
  yours. Delete T1's orphans first, then unwire and delete the panel — it typechecks here
  with no cross-lane coordination.
- AIChatBox.tsx does NOT call loadAiVariationToCanvas. It is entirely yours; there is no
  handover with Lane 1.
- AIChatHeader.tsx still contains the old "Real Estate Templates" string. That is the point
  of T4: a grep for a fixed defect must stop finding it.

SELF-SERVICE — fix these yourself, do not ask:
- node_modules missing -> `npm install`
- unlocked -> `orion lock-write US-EDIT-013`

STOP AND ASK — these are the only ones:
1. The orphan re-scan (TASKS.md pre-flight) shows a file has GAINED an importer since
   2026-10-24. Leave that file in place, finish the others, and report which.
2. `grep -n "showEnhancedSuggestions" AIChatBox.tsx` returns MORE than the two expected hits
   (useState at :210, isOpen at :1535). A third hit means the feature is wired somewhere and
   it is not dead code.

WHEN DONE, report in this exact shape:
  Files deleted:      <list with line counts>
  Lines removed:      <total>
  ACs satisfied:      AC1..AC5
  Commands run:       <verbatim> -> <actual result>
  Behaviour check:    <what you did to confirm the panel is unchanged>

GATES — run them, paste real output:
  npm run check
  npm run test:unit:client
```

---

## Stage 3 — Integration

```bash
git switch feat/edit/m-04-ai-composition-over-template
git merge --squash feat/edit/l1-canvas-layer-rule  && git commit
git merge --squash feat/edit/l2-chat-panel-dead-code && git commit
npm run check && npm run test:unit
```

Lane 1 first — Lane 2's deletions are inert, so a conflict there is cheaper to resolve second.

---

## Stage 4 — Gemini verification · read-only

**Pin a strong model.** An unpinned run defaulted to `gemini-3.1-flash-lite`; a verifier weaker
than the implementer produces a green tick that means nothing. Gemini needs no worktree and no
hooks — it only reads.

```bash
cd D:/Dinesh/DCloud/GITDrive/Work/Products/InfographicEditor-Unified
S=docs/agile/epics/phase-1-ai-core/EPIC-EDIT-03/stories

gemini --model=<STRONG-MODEL> -p "$(cat <<EOF
You are an independent verifier. You did not write this code. Report findings only — make no
edits, propose no refactors, and do not review anything outside the diff below.

=== ACCEPTANCE CRITERIA (the only standard that applies) ===
$(cat $S/US-EDIT-011/STORY.md)
$(cat $S/US-EDIT-012/STORY.md)
$(cat $S/US-EDIT-013/STORY.md)

=== DIFF UNDER REVIEW ===
$(git diff main...HEAD)

=== TEST OUTPUT ===
$(npm run test:unit 2>&1 | tail -60)

=== WHAT TO LOOK HARDEST AT, in order ===
1. US-EDIT-012 AC3 — an absent \`composition\` must behave as 'background', never 'poster'.
   Find any path where undefined falls through to the poster branch.
2. US-EDIT-012 AC6 — a design saved before this milestone must reopen unchanged. restoreCanvasData
   serves BOTH template-load and saved-design-restore from five call sites. Find any rule that
   treats a reopened customer design's content as a discardable placeholder.
3. US-EDIT-012 AC5 — pushToHistory records canvas elements only. If the code writes to
   usePropertyStore, prove the undo restores both or report that it does not.
4. Repeated placement must not accumulate duplicate AI background layers (AC7).
5. US-EDIT-013 — anything deleted that was actually reachable.

=== ADVERSARIAL TESTS ===
Propose concrete failing test cases for assumptions the implementation encoded but did not test.
Give each as a Given/When/Then plus the file it belongs in. Do not write them to disk.

=== OUTPUT FORMAT ===
BLOCKING:   <findings that must be fixed before merge, each with file:line and why>
NON-BLOCK:  <findings worth knowing>
MISSING TESTS: <the adversarial cases, highest value first>
VERDICT:    SHIP / HOLD, one sentence
EOF
)"
```

---

## Stage 5 — Human approval

Gate 2 by hand, from the milestone doc. **Step 5 is non-negotiable: open the exported file, not
the editor preview** — BL-09 records that the two disagree at full resolution.

```bash
orion run close-story US-EDIT-011     # then 012, 013
gh pr create --base main --title "[M-EDIT-04] AI composition over a template"
```

---

## Known mechanical blockers, and why they are not in the prompts as questions

Each of these cost an interruption during planning. They are now self-service lines above.

| Blocker | Fix baked into the prompt |
|---|---|
| Worktree has no `.orion/state/locks/` — it is gitignored, so a fresh checkout has none, and `implement-story` hard-blocks on it | `orion lock-write <id>` |
| Worktree has no `node_modules` — worktrees share `.git`, not ignored files, so every gate fails | `npm install` |
| Lane forked before Foundation merged, so `AiComposition` does not resolve | `git rebase feat/edit/m-04-...` |
| Line numbers drift as files change | locate by symbol, proceed, note it |
| Lock SHAs differ between checkouts (CRLF vs LF) | expected; each lock fingerprints its own checkout |

---

*Runbook created: 2026-10-24*
