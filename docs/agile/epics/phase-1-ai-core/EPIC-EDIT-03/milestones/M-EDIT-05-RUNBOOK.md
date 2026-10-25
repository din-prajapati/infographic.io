---
title: M-EDIT-05 — Execution Runbook (agent prompts + Chrome verification)
type: runbook
domain: EDIT
created: 2026-10-25
---

# M-EDIT-05 — Execution Runbook

One source of truth for listing facts. Copy-paste prompts per stage, designed so an agent
**interrupts only on a decision** — every known mechanical blocker carries its fix inline.

> **Milestone:** M-EDIT-05-one-source-of-truth (scaffolded in Stage 1 below)
> **Epic:** [EPIC-EDIT-03](../EPIC.md)
> **Branch:** `feat/edit/m-05-one-source-of-truth`
> **Operating model:** all implementation is Claude; verification is **Claude in Chrome**, in the
> user's real browser, against a real dev server.
> **Source spec:** `buildographic-canvas-bl27-ux-implementation-spec.md` §5, §9, §10.1 — the only
> sections of that spec not already built. §6 and §7 shipped; see Stage 0.

---

## Why this milestone, in one paragraph

The screenshot defect — Property panel says `₹85,00,000`, canvas says `From ₹1.18 Cr` — is not
drift between two copies of a value. It is **two different forms, stacked in the same sidebar tab,
wired to two different stores.** `RightSidebar.tsx:1355-1367` renders `TemplateSection`
(writes canvas elements through `templateSlots.ts`) and then `PropertyDetailsForm` (writes
`usePropertyStore`, which no canvas element ever reads). The Agent tab does the same at `:1369-1381`.
Nothing is broken; nobody ever decided which form owns a fact. This milestone decides, and deletes
the loser.

**The enabling fact:** the write-through already exists. `updateSlot()` (`templateSlots.ts:52`)
already fans a value out to every element carrying that slot tag, in **one** `pushToHistory` entry.
That is the spec's §5.3 binding rule, already implemented and live. What is missing is a caller.

---

## Stage 0 — Land M-EDIT-04 first. Non-negotiable. — ✅ DONE 2026-10-25

> M-EDIT-04 merged in #64 (rebase-and-merge), closed in #65, verified on staging and production. Gate 2 surfaced and fixed BL-41/42/43/44/45/46 along the way (#62, #63, #66, #67, #69, #70, #71).

**Do not scaffold M-EDIT-05 while `feat/edit/m-04-ai-composition-over-template` is unmerged.**

As of 2026-10-25 that branch holds six commits, Gate 1 green, a cross-model SHIP verdict — and
zero open PRs, three story cards still reading 🔲 Not Started, and Gate 2 never run. BL-27 is
therefore still open in production. Every hour M-EDIT-05 spends being planned is an hour BL-27
stays shipped.

This is the loop-breaker. Adopt it as a standing rule:

> **No new milestone scaffolding while a milestone branch is unmerged.** A new spec lands in
> `docs/thoughts/` and is triaged into `BACKLOG.md` — never directly into `milestones/`.

Stage 0 is M-EDIT-04's own Gate 2, run through Chrome using the procedure in **Stage 5** below.
Its five steps are in
[M-EDIT-04-ai-composition-over-template.md](./M-EDIT-04-ai-composition-over-template.md#gate-2--by-hand-and-the-step-that-decides-ship-or-hold).
Then:

```bash
orion run close-story US-EDIT-011     # then 012, 013
gh pr create --base main --title "[M-EDIT-04] AI composition over a template"
# rebase-and-merge (milestone branch — per AGILE git standards)
```

Only after that merge lands does Stage 1 begin.

---

## Decisions — ✅ APPROVED by Dinesh, 2026-10-25

Stages 1 and 2 do not depend on these. **Lane A and Lane B do.** Settle them at the Stage 2/3
boundary at the latest.

| | Question | Proposed answer |
|---|---|---|
| **D1** | Which side owns a listing fact? | **The stores.** `usePropertyStore` / `useAgentStore` are canonical; slot-tagged canvas text is a projection of them |
| **D2** | What happens to the duplicate `TemplateSection` fields in the Property and Agent tabs? | **The duplicates are removed** — every Template Content field that also exists in `PropertyDetailsForm` / `AgentInfoForm`. **Fields with no form counterpart stay** in Template Content: `openHouse.*` and `report.*` (removing them would delete the only editor for those templates). `BRAND_SLOT_FIELDS` stays in the Design tab — brand logo/accent/name are styling, not listing facts |
| **D3** | A user edits a bound text layer directly on the canvas | **Writes back to the field.** Detaching to freeform is a later explicit action, not an accident |
| **D4** | Migration for the 181 saved designs | **None.** On load, hydrate the stores *from* the canvas's existing slot values. Saved designs already carry `slot` tags; nothing changes shape |
| **D5** | `property.facts` vs `property.specs` — the two maps disagree | **One map, `property.specs`.** Both ids stay in `SLOT_IDS` for back-compat, **and `stats` writes to and reads from both** — verified 2026-10-25: *Premium Listing — Story* tags its facts `property.facts`, *MLS Listing Sheet* uses `property.specs`. Writing only one id would silently stop the store reaching the other template |

### Why D1 = the stores

Three reasons, in order of force. A fact must survive a canvas that has no text layer for it — an
AI poster bakes the price into pixels, and the price still has to exist for the next export.
Export preflight (spec §11.2) validates *fields*, not pixels, and cannot be written against a
canvas. And spec §5.4 says it directly: "Do not treat the rendered text string as the
authoritative property value."

### Why D4 avoids a migration entirely

The 2026-10-21 review named migration as "the most likely source of a data-loss bug in the whole
proposal," and the M-EDIT-04 milestone doc named `restoreCanvasData`'s five call sites as the
specific hazard: it serves **both** template-load and saved-design-restore, so any rule that
treats unedited slot content as disposable will treat a reopened customer design the same way.

Hydrating *from* the canvas dissolves that. Both cases do the same thing — read whatever slot
values are present into the stores — so the two call paths need not be distinguished at all. The
one rule they need is a placeholder filter:

```ts
// A bracketed placeholder is BL-40's convention for "no real value here".
// It hydrates as empty, never as the literal string "[Price]".
//
// [\s\S] not . — one real placeholder contains a newline ("[Property\nname]"),
// and `.` would not match it. Verified 2026-10-25: 52 bracketed placeholders
// across the five templates, 21 distinct strings.
const isPlaceholder = (v: string) => /^\[[\s\S]+\]$/.test(v.trim());
```

A fresh template hydrates to empty fields. A reopened customer design hydrates to that customer's
own values. No migration, no schema change, no distinction to get wrong.

### Why D3 writes back rather than detaching

A layer that silently stops being bound because the user typed into it is the spec's §10.1
prohibition — "A layer should not silently switch from bound to freeform because an operation
fails." Write-back is also what makes the sidebar trustworthy: if canvas edits did not reach the
store, this milestone would ship the same two-sources defect with the arrow pointing the other way.

---

## The contract (publish before any lane forks)

```ts
// client/src/lib/listingBindings.ts  — NEW, Foundation owns it

/** The single map. Replaces LISTING_FIELD_TO_SLOT (canvasState.ts:591)
 *  and FIELD_TO_SLOT (connectLayout.ts:33), which already disagree. */
export const FIELD_TO_SLOT: Readonly<Record<ListingField, SlotId>>;
export const SLOT_TO_FIELD: Readonly<Record<SlotId, ListingField>>;

/** store -> canvas. Wraps the existing updateSlot() fan-out; one history entry. */
export function writeFieldToCanvas(field: ListingField, value: string): void;

/** canvas -> store. Called from TextElement commit (D3). */
export function writeCanvasToField(slot: SlotId, value: string): void;

/** canvas -> stores, on design load (D4). Bracketed placeholders hydrate as ''. */
export function hydrateStoresFromCanvas(): void;
```

Every symbol is **additive**. Nothing existing changes signature, so a lane that forked early
still compiles after a rebase.

---

## Stage 1 — Scaffold and harden the four stories

Run in the main checkout, on `main`, after Stage 0 merges.

```bash
git switch main && git pull
git switch -c feat/edit/m-05-one-source-of-truth
orion run new-milestone M-EDIT-05-one-source-of-truth
orion run new-story US-EDIT-014   # then 015, 016, 017
```

Paste the ownership block below into each `STORY.md`'s yaml fence before hardening — this is what
makes the lanes safe to run concurrently, and it is the step M-EDIT-04 got right.

<details>
<summary><b>US-EDIT-014</b> — Foundation: the binding contract — <b>M</b></summary>

```yaml
depends_on: []
owns:
  - client/src/lib/listingBindings.ts        # new
  - client/src/lib/slotIds.ts
  - client/src/lib/templateSlots.ts
  - client/src/lib/canvasState.ts            # delete local LISTING_FIELD_TO_SLOT, import instead
  - client/src/lib/layout/connectLayout.ts   # delete local FIELD_TO_SLOT, import instead
  - client/src/hooks/usePropertyStore.ts
  - client/src/hooks/useAgentStore.ts
  - client/src/lib/__tests__/**
may_read:
  - client/src/components/editor/TemplateSlotSection.tsx   # the slot catalogues
forbidden:
  - client/src/components/**                 # Lanes A and B
  - api/**                                   # no backend change in this milestone
verification:
  - npm run check
  - npm run test:unit:client
risk: medium        # two call sites stop owning their own map
```

Acceptance shape — write these as typed ACs, then `orion harden`:
1. `FIELD_TO_SLOT` exists once; `canvasState.ts` and `connectLayout.ts` both import it.
2. The `stats` divergence is resolved to `property.specs`; `property.facts` stays in `SLOT_IDS`.
3. `writeFieldToCanvas` produces exactly **one** `pushToHistory` entry per call.
4. `hydrateStoresFromCanvas` maps `[Anything]` to `''` and a real value to itself.
5. `hydrateStoresFromCanvas` on a canvas with no slot tags is a no-op, not a reset.
6. No component file is touched.
</details>

<details>
<summary><b>US-EDIT-015</b> — Lane A: one form per fact — <b>M</b></summary>

```yaml
depends_on: [US-EDIT-014]      # merged, not promised
owns:
  - client/src/components/editor/RightSidebar.tsx
  - client/src/components/editor/PropertyDetailsForm.tsx
  - client/src/components/editor/AgentInfoForm.tsx
  - client/src/components/editor/TemplateSlotSection.tsx
may_read:
  - client/src/lib/listingBindings.ts
forbidden:
  - client/src/lib/**                        # Foundation
  - client/src/components/canvas/**          # Lane B
  - client/src/components/editor/CustomizePanel.tsx   # Lane C deletes it
verification:
  - npm run check
  - npm run test:unit:client
risk: medium        # user-visible sidebar change
```

Acceptance shape:
1. The Property tab renders **one** price input, not two (`RightSidebar.tsx:1355-1367`).
2. The Agent tab renders **one** agent-name input (`:1369-1381`).
3. `PropertyDetailsForm` / `AgentInfoForm` writes reach the canvas through `writeFieldToCanvas`.
4. `BRAND_SLOT_FIELDS` still renders in the Design tab and still writes slots directly.
5. The fabricated placeholder strings are gone from `TemplateSlotSection.tsx:50-66`
   (`Aisha Sharma`, `From ₹1.18 Cr`, `Skyline Signature Residences`, the sample RERA id) —
   BL-40 removed them from the rendered templates; these are the last copies.
6. A template with no slot tags degrades to today's behaviour, not to an empty tab.
</details>

<details>
<summary><b>US-EDIT-016</b> — Lane B: canvas edits reach the field — <b>M</b></summary>

```yaml
depends_on: [US-EDIT-014]
owns:
  - client/src/components/canvas/TextElement.tsx
  - client/src/components/canvas/__tests__/**
may_read:
  - client/src/lib/listingBindings.ts
  - client/src/hooks/useCanvasStore.ts
forbidden:
  - client/src/lib/**
  - client/src/components/editor/**          # Lane A
  - client/src/hooks/useCanvasStore.ts       # read only — Foundation owns writes
verification:
  - npm run check
  - npm run test:unit:client
risk: medium
```

Acceptance shape:
1. Committing an edit on a **slot-tagged** text element (`TextElement.tsx:46`) also writes the
   field via `writeCanvasToField`.
2. Committing an edit on an **untagged** text element writes only the element — no store write.
3. One edit produces one history entry, not two.
4. An element whose slot is not in `SLOT_TO_FIELD` (e.g. `report.kpis`) commits normally and
   writes no field — unknown slots must not throw.
5. A `composed-*` element from the extraction pipeline behaves as the same rule, not a special case.
</details>

<details>
<summary><b>US-EDIT-017</b> — Lane C: delete the orphaned CustomizePanel — <b>S</b></summary>

```yaml
depends_on: []                 # independent — start at Stage 0, in parallel with everything
owns:
  - client/src/components/editor/CustomizePanel.tsx    # delete, 266 lines
may_read:
  - client/src/components/editor/TemplateSlotSection.tsx
forbidden:
  - client/src/lib/**
  - client/src/components/editor/RightSidebar.tsx
verification:
  - npm run check
  - npm run test:unit:client
risk: low           # nothing imports it
```

Acceptance shape:
1. `grep -rn "CustomizePanel" client/src/` returns **only** comment references after the delete.
2. Those stale comments in `slotIds.ts:3` and `templateSlots.ts:6,10` are corrected, not left
   pointing at a deleted file.
3. No behaviour changes. If removing something changes what a user sees, it was not dead —
   revert that part and report it.
</details>

Then harden all four:

```bash
orion run harden US-EDIT-014   # then 015, 016, 017
```

`harden` is a hard block on `implement-story` — a lane cannot start against an unlocked story.

---

## Stage 2 — Foundation · US-EDIT-014

Main checkout, on `feat/edit/m-05-one-source-of-truth`. Interactive `claude`. Sequential — it
publishes the types both lanes compile against, and a type agreed in conversation but not merged
is a promise, not a contract.

```
Implement US-EDIT-014 (Foundation) for milestone M-EDIT-05.

READ FIRST, in this order:
  docs/agile/epics/phase-1-ai-core/EPIC-EDIT-03/stories/US-EDIT-014/STORY.md
  docs/agile/epics/phase-1-ai-core/EPIC-EDIT-03/stories/US-EDIT-014/TASKS.md
  docs/agile/epics/phase-1-ai-core/EPIC-EDIT-03/milestones/M-EDIT-05-RUNBOOK.md  (Decisions + Contract)

The STORY.md yaml block is binding: implement only what `owns:` lists, read `may_read:`
freely, never touch `forbidden:`.

CONTEXT YOU DO NOT NEED TO REDISCOVER:
- templateSlots.ts:52 updateSlot() ALREADY fans a value out to every element carrying the slot
  and ALREADY pushes one history entry. writeFieldToCanvas wraps it. Do not reimplement it.
- There are TWO existing field->slot maps and they ALREADY DISAGREE: canvasState.ts:591 maps
  stats -> 'property.specs', connectLayout.ts:33 maps stats -> 'property.facts'. Both comments
  say "keep in sync". D5 resolves to 'property.specs'. Keep 'property.facts' in SLOT_IDS —
  templates may still carry it.
- usePropertyStore holds: type, headline, price, beds, baths, sqft, address, description,
  features, locale. useAgentStore holds: name, phone, email, license, brokerage, website,
  logoPreview. Not every field has a slot and not every slot has a field. Partial by design —
  do not invent slots to make the map total.
- D4 means NO migration and NO Prisma change. Hydration reads the canvas that already loaded.
- Bracketed placeholders are BL-40's deliberate convention: 52 of them across the five templates,
  21 distinct strings, test-pinned. They are correct. hydrateStoresFromCanvas maps them to '' —
  it does not delete them from the canvas. One of them ("[Property\nname]") contains a newline,
  so match with [\s\S], not . — see the Decisions section.

SELF-SERVICE — fix these yourself, do not ask:
- node_modules missing -> `npm install`
- `orion lock-status US-EDIT-014` says unlocked -> `orion lock-write US-EDIT-014`
- A line number has drifted -> locate by symbol name, proceed, note it in your report

STOP AND ASK ONLY IF:
- Removing the local map from canvasState.ts or connectLayout.ts requires touching a file
  outside `owns:`.
- The two maps turn out to disagree on more than `stats`.

WHEN DONE, report in this exact shape and nothing longer:
  Files changed:      <list>
  ACs satisfied:      AC1..ACn, each with the line that satisfies it
  Commands run:       <verbatim> -> <actual result, pass/fail counts>
  Map divergence:     <every key where the two old maps disagreed, and what you chose>
  Deviations:         <anything you did differently from TASKS.md, and why>
  Ready to fork:      YES/NO

GATES — run them, paste real output, never claim a pass you did not see:
  npm run check
  npm run test:unit:client
```

**After it reports `Ready to fork: YES`:**

```bash
npm run check && npm run test:unit:client
git commit -am "feat(edit): T1-T5 one binding contract for listing facts — US-EDIT-014"

# Reuse the M-EDIT-04 worktrees — their lane branches are already squash-merged.
git -C ../bg-canvas  switch -C feat/edit/m05-la-sidebar  feat/edit/m-05-one-source-of-truth
git -C ../bg-cleanup switch -C feat/edit/m05-lb-canvas   feat/edit/m-05-one-source-of-truth
git worktree add ../bg-deadcode -b feat/edit/m05-lc-customize-panel feat/edit/m-05-one-source-of-truth
```

---

## Stage 3 — Lanes, in parallel

Three terminals, three worktrees, three `claude` sessions. **Lane C needs no Foundation and can
run from Stage 0 onward.** Lanes A and B need D1–D3 settled.

Each lane prompt is the Foundation prompt with its own story id, plus the lane-specific block below.
Every lane carries this shared preamble:

```
The STORY.md yaml block is binding. If a change you need falls outside `owns:`, STOP and report —
do not reach into another lane's file "while you are here". If you must ask, batch every question
into ONE message.

SELF-SERVICE:
- node_modules missing -> `npm install`   (worktrees share .git, not ignored files)
- unlocked -> `orion lock-write <id>`
- `grep -n "writeFieldToCanvas" client/src/lib/listingBindings.ts` finds nothing -> this worktree
  predates Foundation. Run `git rebase feat/edit/m-05-one-source-of-truth`, then re-check.
  Only if it is still absent, stop.
```

### Lane A · US-EDIT-015 · `../bg-canvas` — supervised

This is the only lane whose output a user sees immediately.

```
D1 = stores are canonical. D2 = remove the duplicate TemplateSection property/agent fields.

CONTEXT YOU DO NOT NEED TO REDISCOVER:
- The duplication is literal and stacked: RightSidebar.tsx:1355-1367 renders <TemplateSection
  fields={PROPERTY_SLOT_FIELDS}> and then <PropertyDetailsForm /> in the SAME ScrollArea.
  :1369-1381 does the same with AGENT_SLOT_FIELDS and <AgentInfoForm />. That is the bug.
- BRAND_SLOT_FIELDS is NOT part of this. Brand logo / accent colour / agency name are styling.
  They stay where they are and keep writing slots directly.
- PROPERTY_SLOT_FIELDS also carries openHouse.* and report.* entries with no store field behind
  them. Those have no form to merge into. Keep them rendering through TemplateSection — removing
  them would delete the only editor for a Market Report template.
- `activeSlots.size > 0` currently gates TemplateSection. Whatever replaces it must degrade the
  same way on a canvas with no slots: today's behaviour, not an empty tab.

STOP AND ASK:
1. A field in PropertyDetailsForm has no slot counterpart AND no clear home (not openHouse/report).
2. Satisfying "one input per fact" would require changing listingBindings.ts.
```

### Lane B · US-EDIT-016 · `../bg-cleanup`

```
D3 = a canvas edit on a slot-tagged layer writes back to the field.

CONTEXT YOU DO NOT NEED TO REDISCOVER:
- The commit point is ONE line: client/src/components/canvas/TextElement.tsx:46
  `updateElement(element.id, { content: editValue })`. That is the whole surface.
- This file is in components/canvas/, NOT components/editor/. Lane A is entirely in editor/.
  You share no file with any other lane.
- Not every slot has a field. SLOT_TO_FIELD lookup returning undefined is the NORMAL case for
  report.* and openHouse.* — commit the element and write nothing. Never throw.
- Beware the double history push: updateElement may already push. One user edit = one undo press.
  Verify this, do not assume it.

STOP AND ASK:
1. updateElement's history behaviour cannot be made to produce exactly one entry without
   changing useCanvasStore.ts, which is read-only for you.
```

### Lane C · US-EDIT-017 · `../bg-deadcode` — start immediately

```
This story DELETES unreachable code and changes no behaviour.

CONTEXT YOU DO NOT NEED TO REDISCOVER:
- CustomizePanel.tsx (266 lines) has NO importer. `grep -rn "CustomizePanel" client/src/`
  returns only its own file plus comment mentions in slotIds.ts:3 and templateSlots.ts:6,10.
- Its live twin is TemplateSlotSection.tsx, which IS imported by RightSidebar.tsx:31. Do not
  confuse them. Deleting the wrong one removes the entire slot-editing UI.
- Fix the stale comments. A comment pointing at a deleted file is the defect class that produced
  the two out-of-sync maps Foundation just merged.

STOP AND ASK:
1. The grep shows CustomizePanel HAS gained an importer since 2026-10-25. Leave it, report it.
```

---

## Stage 4 — Integration

```bash
git switch feat/edit/m-05-one-source-of-truth
git merge --squash feat/edit/m05-lc-customize-panel && git commit   # inert deletions first
git merge --squash feat/edit/m05-la-sidebar        && git commit
git merge --squash feat/edit/m05-lb-canvas         && git commit
npm run check && npm run test:unit
```

Lane C first this time — unlike M-EDIT-04, its deletions touch a file no other lane reads, so
landing it first shrinks the surface the other two merge into.

---

## Stage 5 — Verification with Claude in Chrome

Unit tests cannot see this milestone's defect. BL-20 records that no React component test harness
exists in this repo, and the thing under test is *"the number in the sidebar equals the number on
the canvas"* — a rendered-DOM fact. Chrome drives the user's real browser with their real
logged-in session, which is also why it beats Playwright here: no auth fixture to build.

### Setup

```bash
npm run dev          # Express :5000 + NestJS :3001 + Vite
```

> **Backend edits need a full restart** — only Vite hot-reloads in this project. This milestone is
> client-only, so a single `npm run dev` lasts the whole session.

Then, in one `ToolSearch` call — batching matters, each separate call is a wasted round trip:

```
select:mcp__claude-in-chrome__tabs_context_mcp,mcp__claude-in-chrome__tabs_create_mcp,
mcp__claude-in-chrome__navigate,mcp__claude-in-chrome__computer,mcp__claude-in-chrome__read_page,
mcp__claude-in-chrome__find,mcp__claude-in-chrome__form_input,
mcp__claude-in-chrome__read_console_messages,mcp__claude-in-chrome__gif_creator
```

Call `tabs_context_mcp` **first** to see the user's existing tabs, then `tabs_create_mcp` for a new
one. Never reuse a tab id from an earlier session. `localhost:5000` needs site permission granted
once in the extension.

### MV-05-01 · The defect itself — one fact, one value

The whole milestone in one check.

1. `navigate` → `http://localhost:5000/editor`
2. Load a premium template (one with a `property.price` slot — not *MLS Listing Sheet*, which has
   no price element, and not *Market Report — Email Header*, which carries only `report.*`).
3. `read_page` the Property tab. **Assert: exactly one price input.** Two is the defect.
4. `form_input` the price → `₹85,00,000`
5. `read_page` the canvas. **Assert: the canvas price text reads `₹85,00,000`.**
6. **Assert: no element anywhere renders `[Price]` or `From ₹1.18 Cr`.**

### MV-05-02 · Canvas → sidebar (D3)

7. Double-click the canvas headline, type a new value, commit.
8. `read_page` the Property tab. **Assert: the Headline input shows what you typed.**
9. Press Undo once. **Assert: both the canvas and the input return together.** One press, not two.

### MV-05-03 · Reopened designs survive (D4) — the data-loss check

10. Save the design. Reload the page. Reopen it from My Designs.
11. **Assert: the sidebar shows the customer's values, not blanks and not `[Price]`.**
12. Load a *fresh* template in a new design. **Assert: the sidebar shows empty fields** — the
    bracketed placeholders hydrate as empty, and no fabricated value appears anywhere.

### MV-05-04 · The export is the truth, not the preview

13. Export the design. `downloadCanvas` (`canvasExport.ts:625`) writes
    `<filename>.<format>` to the Downloads folder.
14. **`Read` the downloaded PNG directly** and inspect it.

> Step 14 is non-negotiable and is why this stage exists. [BL-09](../../../../BACKLOG.md) records
> that the editable-canvas export does not match the composed preview at full resolution — padding,
> `object-fit`, crop and font-readiness all differ between the DOM renderer and `canvasExport.ts`.
> A clean preview is not evidence of a clean export. Opening the file is.

### MV-05-05 · Regression — M-EDIT-04 still holds

15. Generate **with** a photo → place → **assert one price on the canvas**.
16. Generate **without** a photo → place → **assert one price on the canvas**.

### Evidence and hygiene

- Record MV-05-01 and MV-05-03 with `gif_creator`, named `m-edit-05-<check>.gif`. Capture frames
  before and after each action so playback is readable.
- `read_console_messages` with `pattern` set, not unfiltered — this app is chatty.
- **Do not trigger `alert`/`confirm`/`prompt`.** A browser modal blocks every subsequent extension
  command and the session has to be rescued by hand.
- If a tool errors twice on the same step, stop and report. Do not explore.

### Complementary Playwright run

The existing specs are a useful regression net, but:

```bash
PLAYWRIGHT_BASE_URL=http://localhost:5000 npx playwright test e2e/qa-canvas-editor.spec.ts
```

**Always set `PLAYWRIGHT_BASE_URL` explicitly.** With no override this repo's config points at
deployed **staging**, so a green run would be testing code that is not this branch.

---

## Stage 6 — Human approval and PR

```bash
orion run close-story US-EDIT-014     # then 015, 016, 017
gh pr create --base main --title "[M-EDIT-05] One source of truth for listing facts"
# rebase-and-merge
```

PR body: the milestone doc, the closed-stories table, Gate 1 output, and the MV-05 GIFs plus the
exported PNG from step 14.

---

## What this milestone deliberately does NOT do

The source spec is 916 lines. This milestone implements §5, §9 and §10.1 and stops.

| Deferred | Why |
|---|---|
| §8 — rename/consolidate/dock the AI assistant | Production holds 7 users and 2 generations ever. The 2026-10-21 review's own test applies: redesigning an interface nobody has used spends weeks to learn nothing — the same reasoning that put founding pricing on hold |
| §9.1 — rename the tabs to Style & Brand / Property / Contact | Cosmetic. It can ride along with §8 when §8 earns its trigger |
| §11 — export preflight validation | Blocked on BL-09. Validating an export that does not match its preview validates the wrong artifact |
| §5.5 — "verified" registration data | A RERA lookup integration, a verification state machine and an expiry policy, hidden in one table cell. Its own epic, with its own business case |
| Full-composition mode changes | Already shipped as M-EDIT-04. Do not re-litigate it here |

---

## Lessons from M-EDIT-04 (2026-10-25)

- **Generate with the seeded unlimited QA account** (`api/prisma/seed.ts`, `unlimited@test.infographai.com`). The dev account is Free (3/month) and ran out mid-Gate 2 — the panel then looked like it did nothing (BL-45).
- **An export check only counts on a placed design.** Undo, re-place, then export and open the file.
- **Attach a photo in Chrome by setting the file input from a script** (`DataTransfer` + a bundled `client/public/template-assets/*.jpg`); clicking it opens a native picker the browser tool cannot drive.
- **Check which pipeline a model really takes before measuring it.** `ideogram-turbo` (Standard) is normalized to `ideogram-4`, the magic-prompt JSON path — not V3.
- **The Gemini verifier's pinned strong model returns 429 on the free tier**; a flash-model verdict is weaker evidence than this runbook assumed. Chrome checks are the primary verification.
- **Template data changes need `seed-premium-templates.ts --refresh`** on each database after merge (dry-run first). Dev and staging share one database (BL-37).

---

## Known mechanical blockers, and why they are not questions in the prompts

| Blocker | Fix baked into the prompt |
|---|---|
| Worktree has no `.orion/state/locks/` — gitignored, so a fresh checkout has none and `implement-story` hard-blocks | `orion lock-write <id>` |
| Worktree has no `node_modules` — worktrees share `.git`, not ignored files | `npm install` |
| Lane forked before Foundation merged | `git rebase feat/edit/m-05-one-source-of-truth` |
| Line numbers drift as files change | locate by symbol, proceed, note it |
| Lock SHAs differ between checkouts (CRLF vs LF) | expected; each lock fingerprints its own checkout |
| Playwright silently tests staging | `PLAYWRIGHT_BASE_URL=http://localhost:5000` |
| Backend edits do not hot-reload | client-only milestone; one `npm run dev` for the session |

---

*Runbook created: 2026-10-25*
