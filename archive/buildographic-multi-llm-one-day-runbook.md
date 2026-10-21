# Buildographic: One-Day Multi-LLM Implementation Runbook

**Purpose:** Coordinate Claude Code, Codex, and Gemini from a terminal
in VS Code or Cursor to address the Buildographic canvas workflow issues
safely.

**Target:** A one-day, correctness-first MVP fix---not a full editor
redesign.

**Status:** Planning document. Estimates are targets, not guarantees.
Inspect the repository before committing to the schedule.

------------------------------------------------------------------------

## 1. Objectives

### P0 --- Must address

1.  **BL-27: AI composition/background layering**
    -   Prevent duplicated headlines, prices, amenities, and agent
        footers when an AI-generated image is applied.
    -   Preserve existing user work and property/agent data.
    -   Preserve Undo/Redo behaviour.
2.  **Template data integrity**
    -   Remove fabricated property prices, agent names, phone numbers,
        RERA IDs, and other factual claims from active templates.
    -   Keep illustrative sample artwork only where it is clearly a
        gallery preview and cannot be mistaken for a real listing.
3.  **Property/agent field consistency**
    -   Establish or reuse a canonical source of truth for property and
        agent details.
    -   Ensure supported template text slots reflect the correct values.
4.  **Regression verification**
    -   Test template loading, field synchronization, AI application,
        Undo/Redo, save/reopen, and export.

### P1 --- Minimal usability improvement

-   Make the AI workflow easier to understand without redesigning the
    entire editor.
-   Clarify the difference between property facts and optional visual
    instructions.
-   Prefer background generation as the default workflow.
-   Make the actions **Generate**, **Preview**, **Use as Background**,
    and **Generate Another** unambiguous where supported by existing
    components.

### Explicitly out of scope for day one

-   Full canvas-editor redesign.
-   Replacing the AI image-generation provider.
-   Rewriting the canvas state architecture unless investigation proves
    it is necessary.
-   Supporting every possible workflow involving a complete AI-generated
    poster.
-   Unrelated refactors, dependency upgrades, or styling cleanups.

------------------------------------------------------------------------

## 2. Recommended Multi-LLM Roles

Use one integration owner and isolate implementation work by Git
worktree or branch.

  ------------------------------------------------------------------------
  Agent                   Primary responsibility  Ownership
  ----------------------- ----------------------- ------------------------
  Claude Code             Investigate and         Canvas state, layer
                          implement BL-27         insertion/application,
                          canvas/layer behaviour  related tests

  Codex                   Audit template defaults Template definitions,
                          and property/agent      data mapping, related
                          bindings; add           tests
                          data-integrity tests    

  Gemini                  Review the current AI   UX analysis first;
                          panel and propose a     implementation only
                          minimal UX change       after explicit
                                                  assignment

  Human integrator        Set contracts, review   Integration branch and
                          diffs, resolve          release decision
                          conflicts, run the full 
                          verification            
  ------------------------------------------------------------------------

These are proposed work assignments, not claims that one model is
inherently best at a task. Evaluate the actual code and test results.

**Important:** Do not let multiple agents edit the same files
simultaneously. If the work cannot be cleanly separated, make one agent
advisory rather than allowing competing implementations.

------------------------------------------------------------------------

## 3. First Hour: Repository Reconnaissance

Before any implementation agent edits code, identify the actual
repository structure and current behaviour.

### Human/integrator checklist

-   [ ] Confirm the current branch and working-tree status.
-   [ ] Confirm the app starts and identify the documented test/build
    commands.
-   [ ] Locate `canvasState.ts` and trace the AI image-application path.
-   [ ] Locate the five production templates and identify their semantic
    slot tags.
-   [ ] Trace where property and agent form values are stored and how
    they update canvas text.
-   [ ] Identify Undo/Redo and save/reopen behaviour.
-   [ ] Identify the Describe Listing panel and Quick Generate entry
    points.
-   [ ] Record baseline test results before changes.

Useful read-only commands (adapt to the repository):

``` bash
git status --short
git branch --show-current
git log -5 --oneline
find . -name "canvasState.ts" -o -iname "*template*" | head -100
```

Use the repository's documented package manager and scripts. Do not
assume the project uses npm, pnpm, yarn, bun, Vitest, or Playwright
until confirmed.

### Architecture note to establish before implementation

Decide and document what the "Apply" action means:

-   **Background mode (default):** replace the intended background asset
    while retaining editable template text and user data.
-   **Complete-design mode (if already supported):** explicitly replace
    or transform the composition, with a preview and a recoverable Undo
    action. Do not treat a complete composition as a background by
    accident.

For the one-day scope, prioritize reliable **Background mode**. Defer
complete-design mode if it requires significant architecture work.

------------------------------------------------------------------------

## 4. Git Isolation and Integration

Use separate worktrees when supported by your local setup. Each worktree
is a separate checkout, so agents do not overwrite one another's working
files.

Example branch/worktree commands:

``` bash
# Run from the main repository directory.
git status --short
git worktree add ../buildographic-bl27 -b fix/bl27-canvas
git worktree add ../buildographic-template-data -b fix/template-data
git worktree add ../buildographic-ai-ux -b review/ai-ux
```

Open each worktree in a separate VS Code/Cursor window or terminal
session. Start the assigned agent in the matching directory.

Before creating worktrees, ensure the working tree is clean or safely
committed/stashed. Do not discard existing user changes.

### Integration sequence

1.  Review each agent's plan before approving implementation.
2.  Ask each agent to report files it intends to change.
3.  Keep Gemini advisory until its proposed UI change is agreed.
4.  Review diffs and tests in each worktree.
5.  Merge the smallest safe changes into a dedicated integration branch.
6.  Resolve conflicts manually; do not accept an automatic merge without
    reviewing it.
7.  Run the complete relevant test/build suite after integration.
8.  Inspect actual canvas output and exported images.

Example integration branch:

``` bash
git switch -c integrate/one-day-canvas-fix
```

Merge only branches whose changes and test results have been reviewed.
Adapt branch names and merge order to the repository's dependencies.

------------------------------------------------------------------------

## 5. Agent Prompt A --- Claude Code: BL-27 Canvas Fix

Copy the following prompt into Claude Code from the assigned canvas
worktree.

> # Task: Fix Buildographic BL-27
>
> ## Ask
>
> Inspect and fix the bug where an AI-generated complete composition is
> inserted underneath existing template text, causing duplicate
> headlines, prices, amenities, and agent footers.
>
> ## Context
>
> Buildographic is a real-estate marketing canvas editor. Template text
> elements carry semantic slot tags such as `property.price`.
> AI-generated images may contain text baked into the pixels. Current
> image insertion places the AI image below existing layers.
>
> ## Constraints
>
> -   Inspect the existing architecture and trace the flow before
>     editing.
> -   Treat background generation as the default supported workflow.
> -   Applying a background must replace only the intended background
>     asset and preserve editable text, property data, and contact data.
> -   Do not clear all slot-tagged layers indiscriminately.
> -   Preserve Undo/Redo semantics.
> -   Do not silently overwrite the user's canvas while generation is in
>     progress.
> -   Prevent repeated application from accumulating duplicate
>     background/image layers.
> -   Keep changes isolated to canvas behaviour and related tests.
> -   Do not rewrite unrelated components or introduce dependencies
>     without justification.
>
> ## Acceptance criteria
>
> 1.  Applying an AI background does not duplicate existing text or
>     footers.
> 2.  Undo restores the previous background and relevant canvas state.
> 3.  Existing property and agent values survive generation and
>     application.
> 4.  Repeated generation/application does not accumulate duplicate
>     layers.
> 5.  Existing background/image workflows remain functional.
>
> ## Verification and reporting
>
> Run relevant tests and add regression tests. Report changed files,
> test commands and actual results, remaining risks, and assumptions. Do
> not claim tests passed unless they were run. If the architecture
> cannot satisfy an acceptance criterion safely, explain why rather than
> using a workaround that loses user data.
>
> **Before coding:** return a brief implementation plan, the files you
> expect to change, and any integration contract needed by other agents.
> Wait for approval if the plan requires broad refactoring or overlaps
> the template-data work.

------------------------------------------------------------------------

## 6. Agent Prompt B --- Codex: Template Data Integrity

Copy the following prompt into Codex from the assigned template-data
worktree.

> # Task: Fix Buildographic template data integrity
>
> ## Ask
>
> Audit the five production real-estate templates and correct fabricated
> listing and contact information.
>
> ## Context
>
> Templates may display sample property names, prices, agent names,
> phone numbers, RERA identifiers, amenities, distances, and possession
> dates. Some values appear on the canvas even when corresponding
> sidebar fields are blank or contain different values.
>
> ## Constraints
>
> -   Inspect all five actual template definitions and trace how values
>     reach the canvas.
> -   Do not guess field mappings or invent replacement facts.
> -   Preserve gallery preview artwork where sample content is
>     intentionally illustrative, provided it cannot be mistaken for a
>     live listing.
> -   Active editable templates must not silently publish sample facts
>     as real listing data.
> -   Ensure bound text uses the canonical property/contact data model
>     where available.
> -   Missing optional facts must not be replaced with fabricated
>     claims.
> -   Keep changes isolated to template definitions, data mapping, and
>     related tests.
> -   Do not edit the canvas-layer implementation owned by the other
>     agent. If an interface change is needed, document it and
>     coordinate first.
>
> ## Acceptance criteria
>
> 1.  No fabricated property price, agent identity, phone number, or
>     registration identifier is silently used as real listing data.
> 2.  Changing a property/agent field updates its linked canvas element
>     for supported slots.
> 3.  Missing optional facts do not appear as fabricated claims.
> 4.  Required missing data is clearly identified before final export,
>     using existing validation patterns where possible.
> 5.  Tests cover all five templates and relevant mappings.
>
> ## Verification and reporting
>
> Run relevant tests and report changed files, assumptions, actual test
> results, and unresolved data-model inconsistencies. Do not mark tests
> as passing unless they were actually run.
>
> **Before coding:** return a brief plan and list the files you expect
> to change. Flag any dependency on the BL-27 branch before implementing
> it.

------------------------------------------------------------------------

## 7. Agent Prompt C --- Gemini: AI Panel UX Review

Start with a review, not an independent rewrite. If Gemini can access
the repository and make changes in an isolated worktree, implementation
should begin only after the integrator approves the proposed scope.

> # Task: Simplify Buildographic's AI design workflow
>
> ## Ask
>
> Review the current editor UI and propose the smallest safe change that
> makes the AI workflow understandable to first-time users.
>
> ## Context
>
> The editor currently has a Quick Generate button and a floating
> Describe Listing AI composer. Users may confuse listing facts with
> visual design instructions. The canvas contains editable property and
> agent text.
>
> ## Proposed direction
>
> -   Establish one clear **Create with AI** entry point where practical
>     with existing components.
> -   Use existing property and contact details as structured context.
> -   Treat the prompt as optional visual instructions rather than the
>     source of truth for listing facts.
> -   Make background generation the default.
> -   Clearly distinguish Generate, Preview, Use as Background, and
>     Generate Another where supported.
> -   Keep the canvas visible and avoid losing prompt text.
> -   Preserve the editor's core layout and controls.
>
> ## Constraints
>
> -   Do not redesign the entire editor.
> -   Do not introduce a new image-generation service.
> -   Do not change canvas state management or template data ownership.
> -   Prefer reuse of existing components.
> -   Identify loading, empty, error, cancellation, and unsaved-change
>     states.
>
> ## Deliverable
>
> Provide a minimal implementation plan, likely components to change,
> acceptance criteria, potential regressions, and an estimate. Do not
> independently refactor shared architecture. Wait for approval before
> making code changes.

------------------------------------------------------------------------

## 8. Shared Contract Between Agents

Give this contract to all implementation agents.

1.  **Canonical data:** Property and agent facts should come from the
    existing canonical state/store, not from text inferred from an
    AI-generated image.
2.  **Background application:** Replace the intended background asset;
    preserve editable text and structured property/agent data.
3.  **Semantic slots:** Slot tags distinguish template-bound content,
    but do not by themselves prove whether a user has edited a field.
    Preserve user edits unless an explicit, tested rule says otherwise.
4.  **Undo/Redo:** Applying an AI result must be a reversible canvas
    operation.
5.  **No silent loss:** Generation, cancellation, or failure must not
    silently destroy existing work.
6.  **No fake facts:** Blank or missing data must not be filled with
    invented prices, names, phone numbers, registration IDs, amenities,
    or legal claims.
7.  **Export safety:** Validate required fields and prevent known
    placeholder data from silently reaching final exports.
8.  **Scope control:** Prefer the smallest safe change. Explain required
    architectural changes before undertaking them.

------------------------------------------------------------------------

## 9. One-Day Schedule

Use this as a target schedule. Reprioritize if repository findings
reveal deeper architectural problems.

  -----------------------------------------------------------------------
  Target time                         Work
  ----------------------------------- -----------------------------------
  09:00--10:00                        Reconnaissance, baseline tests,
                                      file ownership, agree on the
                                      interface contract

  10:00--12:30                        Parallel implementation: BL-27,
                                      template data/tests, UX review

  12:30--14:00                        Review diffs, integrate compatible
                                      changes, resolve dependencies

  14:00--16:00                        Apply the approved minimal UX
                                      change and run targeted tests

  16:00--18:00                        End-to-end verification, visual
                                      inspection, save/reopen and export
                                      checks
  -----------------------------------------------------------------------

These time blocks are targets, not guarantees. If a critical test fails,
prioritize correctness and defer the UI polish.

### Stop/go checkpoints

-   **At 10:00:** If the architecture is unclear, do not authorize broad
    edits. Ask for a dependency map.
-   **At 12:30:** If agent changes overlap, pause and assign one owner
    to the shared subsystem.
-   **At 14:00:** If BL-27 is not safe, prioritize the canvas fix over
    visual redesign.
-   **At 16:00:** Freeze feature work and focus on regression tests and
    export validation.
-   **At release:** Do not ship if exported images can still silently
    contain fabricated listing or agent facts.

------------------------------------------------------------------------

## 10. Release Checklist

### Functional

-   [ ] All five production templates load safely.
-   [ ] No fictional property price, agent identity, phone number, or
    RERA ID is silently presented as real.
-   [ ] Property field changes update linked canvas text.
-   [ ] Agent field changes update linked canvas text.
-   [ ] Missing optional facts do not produce invented claims.
-   [ ] Required missing information is surfaced before export.

### Canvas and AI

-   [ ] Applying an AI background does not duplicate headlines, prices,
    or footers.
-   [ ] Existing property and agent data survive generation and
    application.
-   [ ] Repeated applications do not accumulate duplicate layers.
-   [ ] Undo restores the previous background/state.
-   [ ] Cancellation and generation failure do not destroy the existing
    canvas.
-   [ ] The prompt and current canvas are preserved as intended.

### Persistence and export

-   [ ] Save and reopen preserve the correct canvas and data.
-   [ ] Exported images are inspected, not just the editor preview.
-   [ ] No unexpected placeholder, overlapping text, missing field, or
    overflow remains.
-   [ ] Relevant automated tests and production build commands pass.

### Release decision

-   [ ] All P0 acceptance criteria are verified.
-   [ ] Remaining limitations are documented.
-   [ ] Changes are reviewed and committed to the intended branch.

------------------------------------------------------------------------

## 11. Final Report Template

At the end of the workday, record:

``` text
Buildographic One-Day Fix — Report

Repository/branch:
Commit:
Agents used:

BL-27:
- Implemented:
- Tests run and results:
- Known limitations:

Template data integrity:
- Templates audited:
- Fields corrected:
- Tests run and results:

AI panel UX:
- Changes implemented:
- Deferred items:

End-to-end verification:
- Template load:
- Property/agent sync:
- AI application:
- Undo/Redo:
- Save/reopen:
- Export:

Unresolved risks:
Release decision: SHIP / HOLD
```

## 12. Definition of Success

The day is successful if the critical data-integrity and canvas-layer
problems are fixed, verified, and safe to release---even if the UI
polish is deferred.

**Priority order:** correctness and user-data preservation → regression
coverage → minimal UX improvement → visual polish.
