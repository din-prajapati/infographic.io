---
title: Review — "Redesign the Buildographic workflow around one source of truth"
type: review
date: 2026-10-21
reviewer: Claude (Opus 5)
doc_version: pasted in session, 2026-10-21
tags: [review, bl-27, canvas, ai, product]
---

# Workflow Redesign Proposal — Review

## Verdict

**The diagnosis is right and the prescription is roughly twice the size it needs to be.** The document correctly identifies that BL-27 is a symptom of a missing data contract rather than a layering bug, and §6's data/rendering table is the most valuable thing written about this product's canvas in a while. But it proposes a full AI-workflow redesign for a product with **two generations ever recorded in production**, it misdiagnoses the form/canvas relationship in a way that changes the work, and its single most important recommendation — "AI generates a background without text" — **is already built and shipping**, gated behind one condition the author appears not to know about.

Act on §1, §6 and the Phase 1 correctness items. Defer §3, §4, §5 and §7 until there is usage to design against.

---

## What it gets right

- **The core principle is correct and well-stated.** "AI creates the visual, Buildographic manages the facts" is the right architecture for real-estate marketing, and the reasoning given for it (application-rendered text stays editable and tied to the correct record) is the actual reason, not a rationalisation.
- **§6's data contract table is the real deliverable.** Naming a source of truth per element — and explicitly separating *bound* slots from *freeform* text boxes — is precisely the missing rule that BL-27 exposed. The observation that "a slot tag alone is not sufficient" is correct and non-obvious; I reached the same conclusion from the code and the author reached it from screenshots.
- **It correctly refuses to treat BL-27 as a layering bug.** "Never silently stack the two compositions" identifies the real defect: nobody ever decided what an AI image *is*.
- **The placeholder rules (§6) are the right shape.** Distinguishing gallery thumbnails from editable canvases, hiding unsupplied optional facts, and blocking export of unresolved sample data are three separate correct ideas.
- **Phase 1 is correctly prioritised as "correctness and safety".** The instinct to put fabricated-identity removal above UX polish is right.

---

## Critical gaps

### 1. The redesign is being specified before there is any usage to justify it

Production currently holds **7 users, 8 infographics, and 2 generations ever**. This document proposes consolidating AI entry points, renaming panels, re-docking the prompt composer, adding a validation/preview stage, and introducing a bound-field data model — on the evidence of one screenshot.

This contradicts the author's own reasoning applied elsewhere. Founding pricing was held on 2026-10-21 specifically because discounting before evidence of willingness-to-pay "gives away margin without learning anything." The same logic applies with more force here: **redesigning an interface nobody has used yet spends weeks to learn nothing.**

The correctness problems in §1 are real and should be fixed now — they are hours of work. The workflow redesign in §3–§7 should wait for the same trigger the pricing decision waits for.

**Why it matters:** the two halves of this document have wildly different cost and wildly different evidence behind them, and bundling them means the urgent half waits for the speculative half.

### 2. "The canvas and form disagree" is the wrong diagnosis — there is no binding at all

The document frames Problem 1 as a synchronisation failure: the form says ₹85,00,000, the canvas says ₹1.18 Cr, therefore they have drifted apart.

They never agreed. `usePropertyStore` has exactly three consumers: `PropertyDetailsForm` writes to it, `AIChatBox` reads one field (`property.headline`), and `RightSidebar` reads the whole object to build a generation request. **Nothing anywhere writes a property value into a canvas text element.** The form is an input to AI generation. It is not, and has never been, an input to the canvas.

**Why it matters:** "fix the sync" and "build a binding layer that does not exist" are different projects. The second is the actual Phase 1 item and it is considerably larger than the sentence in §8 implies. It also means there is no legacy binding behaviour to preserve — a genuine advantage the document does not claim because it does not know it has it.

### 3. The central recommendation already exists in the codebase, gated on one condition

§5 proposes that "Use as background" become the default, generating "a visual without intentional text, prices, logos or contact details."

This is **US-AI-051**, shipped. `infographic-prompt.builder.ts:300` is `buildTextFreeImagePrompt()`, which instructs *"property photo as full background, clean composition without text overlay."* The gate is at `ai-orchestrator.service.ts:274`:

```ts
const useTextFree =
  typeof photoReference === 'string' && photoReference.length > 0;
```

Text-free generation happens **only when the user uploads their own listing photograph.** With no photo, generation falls through to the composed prompt that bakes in a headline and price — which is how BL-27's "₹1.9 Cr in the image" got there.

So the recommendation is not "build a background mode." It is **"widen one boolean,"** plus deciding what a text-free background should look like when there is no user photo to build it from — which is the genuinely hard part and the document does not address it. An AI asked for "a clean composition without text" with no source photograph produces generic stock imagery, which may be worse than what exists.

**Also worth knowing before relying on this path:** per BL-26, the Gate 2 test that is supposed to verify "a real listing photo must generate an unmarked background" **never uploads a photo**. The feature this proposal would make the product's default has never been verified end to end.

**Why it matters:** the cost estimate in §8 is wrong by an order of magnitude in one direction (the mode exists) and understated in another (the no-photo case is undesigned and the existing path is untested).

### 4. The proposal ignores the extraction pipeline, which embodies the opposite philosophy

There is a third path the document never mentions: `loadComposedDesignToCanvas`. It takes an AI-generated poster and **extracts its text back out into slot-tagged, editable canvas layers** — the `composed-` elements that `splitElementsForAiBackground` already handles specially. This is the "Edit elements" / editable-compose flow, and it represents real investment across US-AI-032, US-AI-047, US-AI-049, US-AI-053 and US-EDIT-009, plus a measured ~30s compose step and its own progress affordance (BL-21).

That pipeline exists precisely *because* someone decided AI should produce complete compositions and the product should make them editable afterwards. This document proposes the inverse: AI should never produce text, and the application should render all facts.

Both are defensible. They are not compatible, and **the document adopts one without acknowledging the other exists.** Implementing §5 as written would leave the extraction pipeline orphaned — still in the codebase, still costing a credit per compose, no longer on any primary path.

**Why it matters:** this is the single largest unstated decision in the proposal. It should be made explicitly, with the sunk investment named, not absorbed silently into a default.

### 5. "Verified registration data" hides an entire compliance feature in a table cell

§6 lists the RERA ID's source of truth as *"User-provided, verified registration data"* and instructs "never fabricate; omit or flag missing information."

"User-provided" is a text field — fine. "**Verified**" is a RERA lookup integration, a verification state machine, a re-verification policy when registrations expire, and a decision about what the product does when verification fails. None of that exists and none is scoped anywhere in the document.

**Why it matters:** the removal of fabricated RERA numbers from templates is genuinely urgent and genuinely small. Verification is neither. Conflating them in one row risks the urgent fix inheriting the large one's timeline.

### 6. No migration path for existing saved designs

Introducing bound fields changes what a canvas element is. Production holds 8 saved infographics and the dev/staging database holds 173. The document does not say what happens to a design saved under the current model when the binding layer arrives — whether existing text becomes freeform, gets retro-bound by slot tag, or breaks.

`restoreCanvasData` is used for **both** template loading and saved-design restoration (`EditorLayout.tsx:86` vs `:97`/`:120`, `TemplatesPanel.tsx:149`, `CenterCanvas.tsx:135`). Any "flag template placeholders on load" rule has to distinguish those two cases or it will mark a user's saved work as placeholder content and then delete it.

**Why it matters:** this is the most likely source of a data-loss bug in the whole proposal, and it is unmentioned.

### 7. The positioning consequence is not examined

If AI produces only backgrounds, the product's output is a template plus a photo plus typed fields. There are currently **5 templates across 9 categories** — a "just sold" post has exactly one option, and the team's own monetisation note targets 30–40 and argues that visibly repetitive output is negative marketing.

Removing AI-composed posters without first increasing template depth could leave the product with no visual differentiation at all.

**Why it matters:** §5 is framed as a safety decision, but it is also a positioning decision, and it should be argued on both grounds or sequenced behind template depth.

---

## Minor issues

- **"If usability testing shows those labels are easier"** — there is no usability testing and no users. Either decide the naming or leave it; a conditional on a process that does not exist will never resolve.
- **The "Quality: Standard · Premium" control in §4's mock reintroduces cost-tier language.** M-PAY-04's accepted criteria explicitly require "no Ideogram/GPT/API cost language anywhere on the page," and that was closed on 2026-10-21. Surfacing a quality/cost tier in the editor re-opens the same question in a different surface.
- **Phase 1 bundles work of wildly different sizes.** "Remove fabricated details from 5 templates" is a seed-script change measurable in hours. "Establish the property/contact field bindings" is the largest single item in the document. They should not share a bullet.
- **§9's definition of done is good but untestable as written.** "AI-generated text does not become the authoritative source for property facts" is a principle, not an assertion a test can make. The other seven items are checkable; this one needs restating as an observable behaviour.
- **"Never silently stack the two compositions" needs a decision about the pre-existing case.** Designs already saved with stacked compositions exist. The rule governs new applications; it says nothing about what the editor does when it opens one of those.

---

## Recommendations (ranked)

1. **Split this document in two, and ship only the first half now.** Everything in §1 Problems 1, 2 and 4 plus §6's placeholder rules is correctness work that stands on its own merit regardless of what the AI workflow becomes. Everything in §3, §4, §5 and §7 is interface redesign that should wait for usage.

2. **Remove the fabricated agent identity from the 5 production templates this week.** Name, phone, and RERA registration number are the urgent item — reachable today with no AI involved, by loading a template and exporting. This is a seed-data change plus a re-run, not a feature.

3. **Decide the composed-vs-background question explicitly, as a written decision.** Does an AI image carry text or not? Name the extraction pipeline's sunk cost in the decision. Everything in §5 and §6 depends on the answer, and leaving it implicit is how BL-27 happened in the first place.

4. **Fix BL-27 narrowly first, under the existing model.** Drop or hide unedited slot-tagged placeholders when a composed AI image becomes the background, with the existing history push making it undoable. This removes the three-prices defect in hours, works whichever way recommendation 3 goes, and does not depend on the binding layer.

5. **Before committing to background-only, answer the no-photo case.** Text-free generation currently requires a user-uploaded photograph. Decide what a text-free background is without one, and verify the existing path actually works — BL-26 says its test never uploaded a photo.

6. **Scope the binding layer separately, with a migration plan.** One story for the data model, one for the template-vs-saved-design distinction in `restoreCanvasData`, one for existing saved designs. Do not fold it into a phase bullet.

7. **Split RERA verification out of RERA storage.** Store and display a user-supplied registration number now; treat verification as its own epic with its own business case.

8. **Sequence template depth before narrowing AI output.** If AI stops producing complete compositions, template variety becomes the only differentiator, and there are currently five.

---

## Questions for the author

1. **Is the extraction/editable-compose pipeline being deliberately retired?** §5 implies it, but the document never names it. If yes, that is a significant write-off and should be stated. If no, how do the two models coexist?

2. **What is a text-free background when the user has not uploaded a photo?** This is the gap between the proposal and the shipped US-AI-051 behaviour, and it determines whether "background-only" is viable as a default.

3. **What triggers the §3–§7 redesign?** Founding pricing has an explicit trigger (payment traction). This redesign has none stated. Given two generations ever in production, what evidence would tell you the current workflow is actually the problem?
