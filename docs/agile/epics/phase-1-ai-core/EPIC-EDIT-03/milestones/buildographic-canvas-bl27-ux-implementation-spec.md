# Buildographic Canvas Editor: BL-27 Fix and UX Redesign Specification

**Document type:** Product + engineering implementation specification\
**Scope:** BL-27 AI composition/layering bug, template data safety,
Describe Listing AI assistant, right sidebar, canvas workflow,
validation, and regression testing\
**Audience:** Product, design, frontend, backend/AI integration, QA\
**Priority:** P0 for data correctness and unsafe template content; P1
for AI workflow and sidebar usability

------------------------------------------------------------------------

## 1. Executive Summary

Buildographic's canvas editor currently allows three representations of
a listing to disagree:

1.  Structured Property and Agent form values.
2.  Text and other layers already rendered on the canvas by a template.
3.  Text and layout baked into an AI-generated image.

This causes duplicated headlines, conflicting prices, and multiple agent
footers when a complete AI composition is inserted beneath existing
template layers. The same underlying data inconsistency is visible
before AI is used: the Property form may show one price while the canvas
displays another.

The fix is not simply to delete text layers. Buildographic needs
explicit asset-placement behaviour, one source of truth for listing
facts, safe template defaults, and a clearer AI workflow.

### Product principles

-   **Facts come from structured data, not pixels.** Property and Agent
    fields are authoritative.
-   **One field, one source of truth.** Linked canvas text reflects the
    relevant field.
-   **AI generation must not silently destroy or duplicate user work.**
-   **Background generation is the default.** Generated visuals should
    not contain intentional text, logos, prices, phone numbers, or
    registration IDs.
-   **Complete-composition replacement must be explicit and undoable.**
-   **Templates must not publish fictional listing or agent details.**
-   **Saving a draft is permissive; publishing/exporting is validated.**
-   **The canvas remains the primary workspace.** AI controls should not
    obscure it unnecessarily.

## 2. Scope

### In scope

-   Fix BL-27 layer ordering and composition replacement behaviour.
-   Define explicit AI asset modes: background and complete composition.
-   Keep Property and Agent data separate from visual canvas layers.
-   Bind template text slots to structured data.
-   Replace fabricated template data with safe placeholders or empty
    optional fields.
-   Redesign "Describe Listing" as an AI Design Assistant.
-   Consolidate duplicate AI entry points such as "Quick Generate" and
    the floating Describe Listing button.
-   Clarify and simplify the right sidebar.
-   Define save, undo, apply, validation, and export behaviour.
-   Add unit, integration, and end-to-end regression tests.

### Out of scope for the first implementation

-   A complete rewrite of the canvas rendering engine.
-   Removing freeform text editing from the editor.
-   Guaranteeing that image models never produce accidental text; the
    system must tolerate such output.
-   Automatically verifying a real estate agent's regulatory credentials
    against external registries unless a separate verification service
    is already available.
-   A full new design system or wholesale toolbar redesign.

## 3. Current Problems and Evidence

The provided screenshots show these issues:

1.  The Property panel price is `₹85,00,000`, while the canvas displays
    `From ₹1.18 Cr`.
2.  The Headline field is empty, while the canvas displays
    `Skyline Signature Residences`.
3.  The canvas includes other fixed claims such as
    `42 curated amenities`, `2 mins to ORR`, and `Possession Dec 2027`.
4.  The Template Agent card displays `Aisha Sharma`, while Agent
    Information shows `John Doe` as the empty-field placeholder.
5.  The canvas includes a phone number and RERA identifier that may be
    fictional.
6.  "Quick Generate" and the floating "Describe Listing" affordance
    create ambiguity about whether the user is entering listing facts,
    generating a visual, or replacing the whole design.
7.  The Describe Listing composer covers a substantial portion of the
    canvas.
8.  The existing image insertion behaviour intentionally places AI
    images below existing layers. That prevents destructive replacement
    of the canvas but is incorrect when the image itself is a complete
    poster.

These are both a rendering bug and a data-model/workflow problem. The
implementation must address both.

------------------------------------------------------------------------

## 4. Target User Workflow

Support template-first and AI-first entry, but converge on the same
editor and listing data model.

``` mermaid
flowchart TD
    A[Create a design] --> B{Starting point}
    B --> C[Choose template]
    B --> D[Create with AI]
    C --> E[Open canvas with safe defaults]
    D --> E
    E --> F[Add or confirm property details]
    F --> G[Add or select agent/contact profile]
    G --> H[Edit style, layout and content]
    H --> I{Need AI visuals?}
    I -- Yes --> J[Generate background options]
    J --> K[Preview result]
    K --> L{Apply?}
    L -- No --> J
    L -- Yes --> M[Replace background in one undoable operation]
    I -- No --> N[Continue editing]
    M --> N
    N --> O[Preview and validate]
    O --> P{Required data valid?}
    P -- No --> Q[Show actionable validation errors]
    Q --> F
    P -- Yes --> R[Export or publish]
    N --> S[Save draft at any time]
```

### Workflow requirements

-   Users may save a draft with incomplete information.
-   Users must not be forced to complete every field before exploring
    templates or generating a background.
-   Required fields must be clearly identified.
-   AI generation must use current structured data as context where
    relevant, but must not invent facts.
-   The generated image must not silently become the source of truth for
    property or agent information.
-   Applying an AI result is a user action, separate from generating it.
-   Users can undo an applied asset and restore the exact previous
    canvas state.

------------------------------------------------------------------------

## 5. Data Model and Source-of-Truth Rules

### 5.1 Separate listing data from canvas presentation

Keep structured listing data independent of visual layers. Reuse
existing types where possible; do not introduce a second parallel data
model if an equivalent already exists.

Illustrative TypeScript shape (adapt names to the actual codebase):

``` ts
type ListingData = {
  property: {
    type?: string;
    headline?: string;
    price?: number;
    currency?: string;
    address?: string;
    bedrooms?: number;
    bathrooms?: number;
    area?: number;
    areaUnit?: string;
    amenities?: string[];
    possessionDate?: string;
    projectName?: string;
    registrationId?: string;
  };
  agent: {
    name?: string;
    phone?: string;
    email?: string;
    photoUrl?: string;
    agencyName?: string;
    registrationId?: string;
    ctaText?: string;
  };
};
```

This is a conceptual contract, not a requirement to copy the exact
shape. Confirm whether property and agent data already exist in
application state or persistence before changing schemas.

### 5.2 Semantic layer metadata

Each data-driven text layer should identify its role and binding.

``` ts
type LayerRole =
  | "background"
  | "decoration"
  | "data-bound-text"
  | "freeform-text"
  | "image"
  | "logo";

type DataSlot =
  | "property.headline"
  | "property.price"
  | "property.address"
  | "property.bedrooms"
  | "property.bathrooms"
  | "property.area"
  | "property.amenities"
  | "property.possessionDate"
  | "agent.name"
  | "agent.phone"
  | "agent.ctaText"
  | "agent.registrationId";

type CanvasLayer = {
  id: string;
  role: LayerRole;
  slot?: DataSlot;
  // Existing position, size, style, visibility and rendering fields remain.
};
```

Adapt this to the actual layer schema. Existing slot tags such as
`property.price` should be retained and normalized rather than
duplicated with competing metadata.

### 5.3 Binding rules

-   A data-bound layer renders from its associated field.
-   Editing a data-bound text element updates the underlying field, and
    all linked instances update.
-   A freeform text layer remains independent unless the user explicitly
    converts it to a bound field.
-   If a bound field is empty, render a safe placeholder in the editor
    or hide an optional element according to template configuration.
-   Never silently substitute sample data for a missing value.
-   Use one canonical formatter for price, area units, phone display,
    and other repeated values.
-   If a user changes the price in the sidebar, every bound price label
    updates in the same state transaction.
-   If a user edits a bound label on the canvas, the sidebar reflects
    the change.

### 5.4 Avoid two sources of truth

Do not treat the rendered text string as the authoritative property
value. The source field is authoritative; the layer contains
presentation settings and a slot reference.

For freeform text, the layer text is its own source of truth.

### 5.5 Missing and unverified values

-   Empty optional fields should not render fabricated claims.
-   Required fields should be flagged in the editor and validation
    report.
-   Registration IDs must only be displayed when supplied by the user or
    otherwise obtained from a verified source. Do not label a value
    "verified" unless verification actually occurred.
-   Template demo content may appear in a clearly labelled gallery
    preview, but must not silently become live listing data when a user
    opens the template.
-   Keep placeholder values visibly distinct from real values in the
    editor and exclude them from final exports.

------------------------------------------------------------------------

## 6. BL-27: AI Asset Application Behaviour

### 6.1 Define explicit asset modes

``` ts
type GeneratedAssetMode =
  | "background"
  | "full-composition";
```

#### Background mode --- default

Expected behaviour:

-   AI output is treated as a visual asset, not a complete listing.
-   Replace the existing background layer only.
-   Preserve all property text, agent/contact layers, logos,
    decorations, and freeform user layers.
-   Preserve structured property and agent values.
-   Do not add a second full-canvas image behind or over the existing
    design.
-   Prompt the image model to avoid text, logos, watermarks, prices,
    contact information, and registration identifiers.
-   If the model returns accidental text, allow the user to
    reject/regenerate the result; do not assume the prompt guarantees
    perfect output.

#### Full-composition mode --- advanced/optional

If this feature is retained:

-   Label it explicitly as "Replace complete design."
-   Explain that existing visible layers will be replaced before the
    operation is applied.
-   Show a preview before applying.
-   On apply, perform a single atomic, undoable operation.
-   Remove or hide conflicting template presentation layers, including
    data-bound text that overlaps the baked-in composition.
-   Preserve structured listing data separately so it can be reused when
    switching back to a structured template.
-   Do not silently preserve old headline, price, or contact layers over
    the full-composition image.
-   Do not silently discard user-created freeform layers. Either include
    them in the replacement confirmation or preserve them in the undo
    snapshot.
-   The generated image is still not authoritative data; its baked-in
    facts may be inaccurate.
-   Clearly warn that text baked into an image is not individually
    editable.

**Recommendation:** Ship background mode as the primary/default path.
Keep full-composition mode only if there is a strong product need and
sufficient UX/QA coverage.

### 6.2 Fix the layer-placement logic

Current code reportedly adds the AI image below all existing layers so
overlays remain visible. Keep that behaviour only for the correct asset
mode.

Avoid a generic "insert generated image" function whose behaviour is
ambiguous. Use explicit application operations, for example:

``` ts
applyGeneratedBackground(asset)
replaceWithFullComposition(asset, options)
```

These names are illustrative. Follow the repository's naming
conventions.

Pseudo-logic:

``` ts
function applyGeneratedBackground(asset: GeneratedAsset) {
  // Validate that the asset is usable.
  // Create one undo snapshot.
  // Replace the existing background layer (do not append a second background).
  // Preserve all non-background layers and structured data.
  // Commit the operation atomically.
}

function replaceWithFullComposition(
  asset: GeneratedAsset,
  options: { confirmed: boolean }
) {
  // Require explicit user confirmation.
  // Create one undo snapshot containing layers and relevant canvas state.
  // Replace the visible composition as one atomic operation.
  // Preserve listing data outside the visual layer tree.
  // Commit only after confirmation.
}
```

These are implementation sketches, not drop-in code. Integrate with the
actual state manager, history stack, asset representation, and async
generation lifecycle.

### 6.3 Never rely solely on slot tags to decide what to delete

Slot tags identify semantic content, but do not tell the whole story
about user intent.

For a full-composition replacement, all conflicting old visual layers
must stop rendering, whether or not they were edited. However, their
underlying data and undo snapshot should be retained.

For background replacement, no property/agent text layer should be
removed merely because it has a slot tag.

### 6.4 Atomicity and undo

Applying a generated asset must be one undoable transaction:

1.  Capture the previous background/composition and any relevant canvas
    state.
2.  Apply the selected asset.
3.  Preserve all unaffected layers and listing data.
4.  Commit one history entry.
5.  Undo restores the exact previous visual state.
6.  Redo reapplies the same asset and changes.

Generation itself must not mutate the canvas. Only the explicit "Use as
background" or "Replace complete design" action changes the canvas.

### 6.5 Async and stale-result safety

-   Keep generated results in a preview/result state until the user
    applies one.
-   If the user changes the canvas while generation is running, do not
    overwrite those changes when the result arrives.
-   Applying a result must use the current canvas state and create a
    fresh undo snapshot.
-   Handle cancellation, failed generation, duplicate clicks, and retry
    without creating duplicate layers.
-   Use the existing request cancellation/versioning pattern if one
    exists.

------------------------------------------------------------------------

## 7. Template Safety and Initialization

### 7.1 Audit every production template

Audit all five identified production templates and any other published
templates.

For every layer, classify it as:

-   Static design/decorative element.
-   Data-bound property field.
-   Data-bound agent/contact field.
-   Optional user-created content.
-   Gallery/demo-only content.

Identify all hardcoded property facts, prices, project names, dates,
amenities, agent names, phone numbers, agency names, logos, and
registration IDs.

### 7.2 Template loading rules

When a user opens a template for a new listing:

-   Keep the visual structure, theme, decorative shapes, and intended
    layout.
-   Initialize structured listing data from the current listing or
    selected profile, if one is explicitly chosen.
-   Otherwise use empty values or clearly visible editing placeholders.
-   Do not populate real-looking sample facts as if they were user data.
-   Hide optional claims when the relevant data is missing.
-   Retain a separate, clearly labelled preview fixture for
    template-gallery thumbnails if needed.

### 7.3 Template editor versus template instance

Saving a design as a reusable template must not accidentally persist
private property/agent details as defaults.

Define whether the user is saving:

-   A reusable layout/style template, with data slots reset to
    placeholders; or
-   A duplicate listing design, with data preserved intentionally.

The UI should make this distinction clear.

------------------------------------------------------------------------

## 8. Describe Listing Redesign

### 8.1 Rename and clarify the purpose

Rename "Describe Listing" to **"AI Design Assistant"** or **"Create with
AI."**

The current label implies the user should describe factual listing
information. The prompt shown in the screenshots---"Create a luxury
waterfront property listing"---is primarily a visual design instruction.

The revised assistant should help users describe visual direction, while
the Property and Agent panels remain responsible for factual listing
data.

### 8.2 Consolidate entry points

The current interface exposes "Quick Generate" at the top of the sidebar
and a floating Describe Listing button near the canvas. Consolidate
these into one coherent assistant flow:

-   Primary entry: "Create with AI" or "AI Design Assistant."
-   Empty prompt: generate from current listing context and selected
    style defaults.
-   Non-empty prompt: add user-defined visual direction.
-   Results: preview generated assets before application.
-   Main action: "Use as background."
-   Secondary action: "Generate another."
-   Optional advanced action: "Replace complete design," only if
    supported.

Do not maintain separate AI flows that differ in hidden ways regarding
data use, layer replacement, or quality selection.

### 8.3 Panel placement

Preferred layout:

-   Use a docked right-side panel that shares the existing sidebar area.
-   Keep the canvas visible during prompting and preview.
-   Provide a close/collapse control.
-   Preserve prompt text when the user closes and reopens the panel.
-   Use a responsive drawer or modal on narrow screens, with a clear
    return-to-canvas action.
-   Do not use a large overlay that obscures the composition on desktop
    unless the user explicitly enters a focused mode.

### 8.4 Proposed UI content

``` text
AI Design Assistant

Create visuals for your current listing.

What should the design look like?
[Describe style, mood, colours, setting and visual direction...]

Try a style:
[Luxury] [Minimal] [Modern] [Family-friendly]

Canvas format:
[Use current format ▼]

Quality:
[Standard] [Premium]  (optional/advanced)

[Generate background]

Results
[Preview 1] [Preview 2] [Preview 3]

[Use as background]  [Generate another]
```

The above is a wireframe description. Follow existing Buildographic UI
components and design tokens rather than copying it literally.

### 8.5 Prompt construction

Construct the image-generation prompt from distinct inputs:

-   Visual prompt entered by the user.
-   Selected style/theme.
-   Current canvas dimensions/aspect ratio.
-   Relevant property context (e.g., property type or broad setting)
    where helpful.
-   Explicit negative constraints: no text, logos, watermarks, phone
    numbers, prices, registration identifiers, or UI elements.
-   Composition instructions to leave suitable negative space for
    editable text overlays.

Do not pass untrusted prompt content as instructions that can override
application safety or data rules. Do not imply that image generation can
guarantee factual accuracy.

### 8.6 Listing facts and AI-generated copy

If Buildographic also offers AI-written headlines or descriptions, keep
that as a separate content-suggestion action:

1.  Generate copy from known listing data.
2.  Mark the result as a suggestion.
3.  Let the user review and accept it.
4.  Update the corresponding structured field.
5.  Render it through the linked canvas layer.

Never infer price, amenities, possession dates, distances, legal
registration details, or other factual claims solely to fill visual
space.

------------------------------------------------------------------------

## 9. Right Sidebar Redesign

Keep the three main tabs, but make their purpose and data ownership
explicit.

### 9.1 Suggested tab structure

#### Style & Brand (currently Design)

-   Template/layout selection.
-   Brand logo.
-   Accent colour and theme.
-   Typography and visual styles.
-   Decorative design options.
-   Controls that affect styling rather than listing facts.

#### Property

-   Property type (required where applicable).
-   Headline.
-   Price.
-   Address.
-   Beds and baths.
-   Square feet/area and unit.
-   Amenities.
-   Possession date/project name, if applicable.
-   Other supported listing fields.

Rules:

-   A field change updates every linked layer immediately.
-   Price formatting is centralized.
-   Empty optional fields do not display fabricated text.
-   Required fields have clear validation states.
-   Do not show one value in the form and another on the canvas.

#### Contact (currently Agent)

-   Select or edit an agent/contact profile.
-   Name.
-   Phone.
-   Agency details.
-   Photo/logo.
-   CTA text.
-   Registration details, where applicable.

Rules:

-   The template must not maintain a separate conflicting "Template
    Agent" identity.
-   A saved profile may be selected explicitly.
-   If no profile is selected, use the current draft's agent data or
    empty values.
-   Contact details on all linked canvas elements must update together.
-   Do not present a placeholder like "John Doe" as real data.

### 9.2 Avoid excessive tab switching

-   Preserve the selected tab during ordinary editing.
-   Make missing required fields discoverable without forcing a tab
    switch.
-   If the user selects a missing-data warning on the canvas, open the
    relevant tab and focus the corresponding field.
-   If the user selects a bound text layer, show its linked field and
    presentation controls.
-   Keep advanced typography/position controls contextual to the
    selected layer rather than mixing them into the Property and Contact
    data forms.

### 9.3 "Template Agent" card

Decide what this card is intended to do. Recommended behaviour:

-   If it selects a saved profile, label it "Select contact profile."
-   If it configures a template's default styling or placement, move
    those controls to Style & Brand.
-   Avoid maintaining duplicate values for the same person in the card
    and Agent Information section.

There should be one canonical contact record, with layout and styling
settings separate from identity data.

------------------------------------------------------------------------

## 10. Canvas Editing Rules

### 10.1 Bound and freeform text

-   Bound text edits the underlying field.
-   Freeform text remains independent.
-   The editor should visually distinguish linked content from
    independent text only where that helps users understand the
    behaviour.
-   A layer should not silently switch from bound to freeform because an
    operation fails.
-   Duplicate/copy operations must have documented semantics for bound
    fields. Prefer copying the presentation while retaining the same
    binding, or offer "duplicate as independent text" explicitly.

### 10.2 Layer operations

-   Background replacement targets the background role, not arbitrary
    lowest-index layers.
-   Adding a photo should not replace the background unless the action
    explicitly says so.
-   Reordering layers should not change their semantic data binding.
-   Deleting a bound text layer should remove the visual layer, not
    silently erase the underlying property data. Offer a way to restore
    the field/layer.
-   Deleting a field value from the sidebar should update or hide all
    associated bound layers according to the slot's required/optional
    configuration.
-   Full-composition replacement must not silently destroy independent
    user content.

### 10.3 Responsive and visual behaviour

-   Keep canvas zoom and selection behaviour stable when the assistant
    opens or closes.
-   Avoid moving the canvas unexpectedly when a panel opens.
-   Preserve selection and scroll position when practical.
-   Make the main apply action visually clear, but avoid multiple
    competing primary buttons.

------------------------------------------------------------------------

## 11. Save, Export, and Validation

### 11.1 Save draft

-   Allow saving incomplete drafts.
-   Preserve structured fields, layer bindings, asset references, and
    undo-compatible state according to existing persistence
    capabilities.
-   Show save state clearly.
-   Avoid silently converting placeholders into saved real data.

### 11.2 Export preflight

Before final export, validate:

-   Required property fields.
-   Required agent/contact fields for the selected template/use case.
-   Unresolved template placeholders.
-   Mismatch between bound values and rendered content.
-   Text overflow/clipping.
-   Missing or invalid assets.
-   Any explicitly required legal/registration fields for the user's
    configured use case.
-   Accidental use of known demo data in a live listing.

Do not claim that a RERA identifier is legally valid unless a
verification step actually checks it.

### 11.3 Error presentation

Errors should be actionable, not generic:

-   "Add a property price to continue."
-   "Add an agent phone number or remove the contact footer."
-   "This template still contains sample text."
-   "The headline is clipped. Shorten it or adjust the text box."

Allow the user to jump directly to the relevant field or layer.

------------------------------------------------------------------------

## 12. Suggested Implementation Sequence

### Phase 1 --- Data correctness and safety (P0)

1.  Audit the actual state model, `canvasState.ts`, layer schema,
    template fixtures, and AI image insertion path.
2.  Reproduce BL-27 with a production template and generated full
    composition.
3.  Audit all production templates for hardcoded facts and contact
    details.
4.  Establish or confirm canonical structured Property and Agent state.
5.  Ensure slot-tagged layers render from structured values.
6.  Fix mismatched field/canvas rendering.
7.  Implement explicit background replacement.
8.  Make apply atomic and undoable.
9.  Add regression tests for layer duplication and stale values.

### Phase 2 --- AI assistant and sidebar usability (P1)

1.  Consolidate "Quick Generate" and "Describe Listing" entry points.
2.  Rename the AI panel to "AI Design Assistant" or "Create with AI."
3.  Dock the assistant on desktop; use a responsive drawer on smaller
    screens.
4.  Separate visual prompts from factual property fields.
5.  Show generated results in preview before applying.
6.  Keep background generation as the default.
7.  Simplify the right sidebar into Style & Brand, Property, and
    Contact.
8.  Remove duplicate Template Agent identity data.
9.  Ensure prompt state and canvas state survive closing/reopening the
    assistant.

### Phase 3 --- Validation and polish (P1/P2)

1.  Add export preflight checks.
2.  Add missing-data warnings and direct navigation to fields.
3.  Add overflow detection and responsive layout checks.
4.  Add analytics events for assistant opened, generation
    started/failed/completed, result applied/rejected, undo, validation
    failure, and export. Follow existing privacy and consent practices.
5.  Conduct usability testing with new and experienced users.
6.  Review usage data before adding more AI controls or advanced modes.

------------------------------------------------------------------------

## 13. Regression Test Plan

### 13.1 Unit tests

**Data bindings** - Updating `property.price` updates every linked price
layer. - Updating `agent.name` updates all linked agent-name layers. -
Empty optional values do not fall back to fictional sample values. -
Freeform text does not mutate structured fields. - Formatting is
consistent across multiple linked instances.

**Background application** - Replaces the existing background rather
than appending a duplicate. - Preserves all non-background layers. -
Preserves property and agent data. - Creates one undo history entry. -
Undo restores the prior background; redo reapplies the chosen asset.

**Full-composition application (if supported)** - Requires explicit
confirmation. - Does not leave old conflicting template layers
visible. - Preserves structured data. - Captures a complete undo
snapshot. - Does not silently discard independent user layers.

### 13.2 Integration tests

-   Opening a template initializes safe values.
-   Switching templates retains the user's listing data where intended.
-   Sidebar edits and canvas edits stay synchronized.
-   Closing/reopening the AI panel preserves the prompt.
-   Generation does not mutate the canvas before the user applies a
    result.
-   A generation result arriving late does not overwrite edits made
    while it was running.
-   Save/reload preserves field bindings and asset placement.
-   Export validation identifies unresolved sample content.

### 13.3 End-to-end scenarios

1.  Open a template with no listing data; verify there are no fabricated
    live facts.
2.  Enter `₹85,00,000`; verify every price layer displays the correct
    formatted amount.
3.  Enter a real headline; verify it replaces the placeholder.
4.  Enter contact details; verify the canvas footer and sidebar match.
5.  Generate a background; apply it; verify the old headline, price and
    contact elements remain exactly once.
6.  Undo and redo the background replacement.
7.  Generate another image while changing the canvas; verify the late
    result does not overwrite the change.
8.  Attempt export with missing required fields; verify actionable
    errors.
9.  Fill the required fields; verify export preflight passes.
10. If full-composition mode exists, apply it and verify no old text or
    footer remains layered on top.
11. Save and reopen a draft; verify property facts, contact data, and
    layer bindings remain consistent.
12. Save as Template; verify personal listing/contact details are not
    unintentionally saved as reusable defaults.

### 13.4 Acceptance criteria

The work is done when:

-   No production template silently introduces fictional property,
    agent, contact, or registration details into an editable live
    listing.
-   All linked text layers render from canonical data fields.
-   Background application does not duplicate or delete unrelated
    layers.
-   Full-composition replacement, if supported, is explicit, atomic, and
    undoable.
-   Generation does not change the canvas until the user applies a
    result.
-   Property and Agent fields never contradict their linked canvas
    labels.
-   Draft saving remains available with incomplete data.
-   Export validation flags unresolved placeholders and required-field
    errors.
-   The AI assistant no longer obscures most of the canvas on desktop.
-   The primary AI action and its effect are understandable without
    explaining hidden implementation details.

------------------------------------------------------------------------

## 14. Engineering Investigation Checklist

Before changing implementation, inspect the repository and confirm:

-   The actual state owner for Property and Agent forms.
-   Whether form values are persisted independently from canvas layers.
-   How slot tags are currently represented and interpreted.
-   Whether template fixtures contain literal text, defaults, or
    generated placeholder data.
-   How `canvasState.ts` inserts and orders generated images.
-   How undo/redo snapshots are created and whether state operations are
    atomic.
-   How image generation returns assets and whether it supports
    transparent or text-free output.
-   Whether the AI flow has separate code paths for Quick Generate and
    Describe Listing.
-   How save/reload serializes layers and data bindings.
-   How export renders canvas state and whether validation exists.
-   Existing component library, design tokens, responsive breakpoints,
    and testing conventions.

Do not assume the illustrative TypeScript shapes or function names in
this document exactly match the repository. Adapt the design to existing
architecture and avoid introducing duplicate state or abstractions.

## 15. Final Product Decision

**Default behaviour:** AI generates a visual background. Property and
Agent facts remain structured, editable, and authoritative.

**When the user applies a background:** Replace only the background
layer, preserve the rest of the canvas, and create one undo step.

**If complete AI compositions are retained:** Make replacement an
explicit advanced action, remove conflicting visual layers atomically,
preserve the structured data, and support Undo.

**Template behaviour:** Never silently publish demo property facts or
fabricated identities.

**AI assistant:** One clear entry point, one prompt for visual
direction, preview before apply, and no hidden changes to the canvas.

**Sidebar:** Separate styling, property facts, and contact data. Each
fact has one source of truth.

This approach fixes BL-27 while establishing a general workflow contract
for the Buildographic canvas editor, reducing future layering bugs and
making the product easier to understand.
