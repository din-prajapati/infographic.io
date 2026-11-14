# Simplified V3 saving — proposal only

Status: **Design-mode flow approved, implemented and locally verified, 2026-11-14.** Save + dropdown, new Design/copy/Template creation dialogs and optional editable Design Tags are delivered. Explicit Template authoring remains deferred. See [implementation and verification](2026-11-14-V3-SAVE-FLOW-IMPLEMENTATION.md). The sketches below retain the approved specification, including clearly marked future flows.

## Recommendation

Use one primary **Save** button with a small adjacent dropdown arrow. Save always updates the document the user is currently editing. The dropdown contains deliberate copy/conversion actions; it does not ask the user to choose Design versus Template on every save.

Keep the cloud status beside the title and the current autosave behavior. Add a small document-type label in the title area or save menu: **Design** or **Template**. When useful, show “Based on [template name]” as provenance rather than implying the source template is being edited.

## Entry context determines the working document

| Where the user starts | Working document | Primary Save | Other relevant action |
|---|---|---|---|
| New design / blank canvas / chosen dimensions | New Design | First save requests a name and creates a Design; later saves update that same Design | Create reusable Template… |
| Templates → Customize / Use template | Separate Design based on the template | Updates the new Design; never overwrites the source Template | Create reusable Template…; Save a copy… |
| Designs → Edit / continue | Existing Design | Updates that exact Design | Save a copy…; Create reusable Template… |
| Designs → Duplicate / use as a starting point | Separate Design copy | Updates the copy | Create reusable Template… |
| Template library → New template (explicit authoring mode) | New Template | Names and creates a reusable Template | Create Design from this Template… |
| My Templates → Edit template (explicit owner/editor action) | Existing owned Template | Updates that Template, after explaining its reusable scope | Save a Template copy…; Create Design… |
| Deep link / browser refresh / restored session | Canonical existing document kind and ID | Same destination as before refresh | Context-appropriate copy actions |

“Customize” on a public/curated template should always mean creating a Design. Editing a Template must be an explicit separate action with permission checks. Do not infer update intent from a previous page URL, a button caption or an arbitrary templateId query parameter.

## Suggested menu

For a Design:

- **Save** — primary action; Ctrl/Cmd+S and autosave have the same destination.
- **Save a copy…** — a new Design with a new name/ID; retain the original.
- **Create reusable Template…** — create a Template copy without converting or replacing the open Design.

For explicit Template editing:

- **Save** — primary action updates the open Template.
- **Save a Template copy…** — creates a separate reusable Template.
- **Create Design…** — creates an independent Design from the Template and chosen pending Listing.

Use a compact naming dialog only when creating a new record or copy. Show its destination clearly: “Save new Design” or “Create reusable Template”. After success, show an acknowledged status with a **View in Templates** action for a newly created Template; keep the current Design open. This opens the template library rather than implying V3 already supports Template editing. A saved Design copy opens after the source-document save requirement described below is satisfied.

## Listing and Template safety

- Saving a Design stores the artwork currently applied to the canvas plus its separate pending Listing state. It does not silently Apply pending updates. A persistent “10 Listing updates pending” indicator explains the difference; Apply remains in Listing.
- Creating a reusable Template retains layout, styling, crop rules, field links and intentionally static independent content. Linked Property/Agent/Brand values, photographs and the current Listing association are cleared as in the existing template helper. The confirmation explains this before creation.
- Updating a Template never rewrites existing Designs. A broader template-version/proven policy belongs to US-PROP-005; this proposal does not certify or invent that capability.
- Creating a Design from a Template keeps the source Template and other Designs unchanged. Missing linked photos show Add image in the new Design.
- Unsaved navigation consent happens before creating a new record; cancellation creates nothing. Late responses cannot discard newer edits or redirect after leaving.
- Save failure keeps edits and retry available. Save must report success only after the server acknowledges the correct record; duplicate submissions remain disabled.

## What implementation would require

The current V3 session is a Design session. Template links already produce a separate Design, and the template API supports create/update, but that does **not** make the current editor a certified Template authoring mode.

Before implementing this proposal, reconcile US-EDIT-022 and the Template contract stories around:

1. An explicit launch intent and canonical document kind/ID, retained through refresh and recovery. The server’s ownership/permission checks remain authoritative.
2. A type-aware save destination and autosave/recovery keys so Template and Design IDs cannot be confused.
3. Defined source/provenance metadata and separate copy/update paths. Ordinary template use must never become an update of its source.
4. Tests for each entry in the table, refresh/recovery, repeated save, stale responses, failure/retry, pending Listing state and source-template isolation.

The first implementation can simplify Design mode to Save + dropdown while retaining Create reusable Template as a copy action. Explicit Template authoring can follow as a separately verified capability. This avoids introducing two different save destinations before the session model supports them safely.

## Dialog redesign — 2026-11-14 refinement

**Approved specification.** The user subsequently authorized Design-mode implementation, including optional Tags for Designs. Future explicit Template-authoring dialogs below remain proposals.

### How the existing dialog evolves

The legacy editor's `client/src/components/editor/SaveDialog.tsx` presents “Save Your Work”, a large preview, Name, a Design/Template toggle, template Category and Tags. It is used by `EditorLayout.tsx`. The actual V3 Editor does not currently open this dialog: Design Save uses the current session title, and Save as Template creates a sanitized template directly with that title and default metadata.

Legacy parity clarification: **Tags are available for both Designs and Templates; Category is only available for Templates.** Retain optional editable Tags in every Design creation/copy dialog below, including future Create design. Category remains Template-only. Regular Save preserves existing metadata without opening a dialog.

Evolve the interaction into **one shared V3 creation dialog with action-specific content**. The dropdown determines the destination; remove the Design/Template toggle from the dialog. Regular updates need no modal. Keep the legacy editor intact; introducing this in V3 does not require replacing its dialog globally.

| Action | Open a dialog? | Required input | Success |
|---|---|---|---|
| Save existing Design | No | None | Update current Design; show Saved |
| First Save of an unsaved Design | Yes: Save design | Name | Create and continue in that Design |
| Save a copy… | Yes: Save a copy | Name | Create and continue in the new Design copy |
| Create reusable template… | Yes: Create reusable template | Name | Create Template; stay in current Design |
| Save existing Template, future explicit authoring mode | No | None | Update current Template; show Saved |
| First Save in future New Template mode | Yes: Save template | Name | Create and continue editing that Template |
| Save a template copy…, future mode | Yes: Save a template copy | Name | Create and continue in Template copy |
| Create design…, future Template mode | Yes: Create design | Name | Create and continue in a separate Design |

Templates → Customize already establishes a Design session. If it already has a saved Design ID, Save updates that record without another creation dialog. Do not ask for the name twice. New blank sessions without an ID show the first-save dialog. An invalid/missing source document is a load error, not permission to create a replacement.

### Header and menu

Design session (first implementation):

```text
Oak Road       [Design]   Saved             [ Save | v ]
                                           +---------------------------+
                                           | Save a copy...            |
                                           | Create reusable template...|
                                           +---------------------------+
```

Future explicit Template authoring session:

```text
Modern Listing [Template]  Saved             [ Save | v ]
                                           +---------------------------+
                                           | Save a template copy...   |
                                           | Create design...          |
                                           +---------------------------+
```

Save is the primary half of the split button; the arrow only opens the menu. Menu actions show dialogs, so use ellipses. On phones, keep a compact Save icon and adjacent arrow with accessible labels; the same two menu actions apply. Avoid another duplicate Save submenu inside the general editor More menu.

### A. First Save — new Design

```text
+--------------------------------------------------+
| Save design                                  [x] |
| Keep this artwork in My Designs.                 |
|                                                  |
| Design name                                      |
| [ Oak Road - Instagram post                    ] |
|                                                  |
| > Tags (optional)                                |
|                                                  |
| Saves the current artwork and listing draft.     |
|                                                  |
|                         [Cancel]  [Save design]  |
+--------------------------------------------------+
```

Prefill from the editor title and select the name for quick replacement. Use “Untitled design” only when no meaningful title exists. Include a collapsed **Tags (optional)** section, preserving the legacy Design capability. No category, destination picker or type toggle. When Listing updates are pending, replace the helper with “Includes 10 pending listing updates. Apply them from Listing to update the artwork.” Saving does not apply them.

Expanded Design tags section (also used by Save a copy and future Create design):

```text
| v Tags (optional)                                |
| [ luxury  x ] [ listing  x ] [ Add a tag...      ] |
| Up to 5 tags                                    |
```

Retain the existing limit of five tags and 20 characters per tag unless the API contract is deliberately revised. Prefill existing tags and allow editing/removal; opening and canceling this section does not alter saved metadata.

### B. Save a copy — Design

```text
+--------------------------------------------------+
| Save a copy                                  [x] |
| Create a separate Design from this artwork.      |
|                                                  |
| Design name                                      |
| [ Oak Road - Copy                              ] |
|                                                  |
| > Tags (optional)                                |
|                                                  |
| You'll continue editing the new copy.            |
|                                                  |
|                         [Cancel]  [Save a copy]  |
+--------------------------------------------------+
```

Copy the current in-memory artwork, applied Listing and pending Listing draft. Preserve any existing category internally. Prefill tags in the optional section so users can keep or edit them without re-entering them; tag edits apply to the new copy only. The original record keeps its identity. If the original has unsaved changes, include the inline source-save choice below in this same dialog before creating or switching to the copy. Cancellation creates nothing.

### C. Create reusable template — from a Design

```text
+--------------------------------------------------+
| Create reusable template                     [x] |
| Reuse this layout for other properties.          |
|                                                  |
| Template name                                    |
| [ Modern property listing                      ] |
|                                                  |
| +----------------------------------------------+ |
| | Keeps layout, styling and field links.       | |
| | Clears linked listing facts and photos.     | |
| +----------------------------------------------+ |
| Independent text and images stay in the layout.  |
| Review them before reusing the template.         |
|                                                  |
| > Category and tags (optional)                   |
|                                                  |
|                  [Cancel]  [Create template]     |
+--------------------------------------------------+
```

The action is a copy into My Templates; it does not change the current document type. Category and tags help organize the library.

Expanded optional section:

```text
| v Category and tags (optional)                   |
| Category                                        |
| [ Real Estate - Property Listing             v ] |
| Tags                                            |
| [ luxury  x ] [ listing  x ] [ Add a tag...    ] |
```

Name is the only required input. Use an existing compatible category or an explicitly displayed suggested category, with a General fallback. Tags remain optional. Preserve established validation limits unless the API contract is deliberately revised. No sharing/publication/permissions or folder controls in this dialog; this action creates a personal reusable template. Publishing is a separate future capability.

On success close the dialog and show `Template created. [View in Templates]`. The Design stays open with its current save status; creating a Template does not claim the Design itself has been saved. If a preview is shown, it must render the sanitized template with linked content empty, not the populated property artwork. Omit the preview initially to keep this dialog short and avoid implying every independent image is removed.

### D. Future Template authoring — new Template and Template copy

Only expose these flows after the type-aware session, autosave, recovery and permission work is ready.

```text
+--------------------------------------------------+
| Save template                                [x] |
| Keep this reusable layout in My Templates.       |
|                                                  |
| Template name                                    |
| [ Modern property listing                      ] |
|                                                  |
| > Category and tags (optional)                   |
|                                                  |
|                       [Cancel]  [Save template]  |
+--------------------------------------------------+

+--------------------------------------------------+
| Save a template copy                         [x] |
| Create a separate reusable layout.               |
|                                                  |
| Template name                                    |
| [ Modern property listing - Copy               ] |
|                                                  |
| > Category and tags (optional)                   |
| You'll continue editing the new template copy.  |
|                                                  |
|                    [Cancel]  [Save a copy]       |
+--------------------------------------------------+
```

Existing owned Template → Save updates directly, with no repeated overwrite dialog. Keep an explicit Template badge/mode notice visible in the editor. Category/tags inherit from the source for copies. Apply the same reusable-content sanitation policy to all Template creation paths; do not introduce different policies through differently named buttons.

### E. Future Template authoring — Create Design

```text
+--------------------------------------------------+
| Create design                                [x] |
| Start a Design using this template's layout.     |
|                                                  |
| Design name                                      |
| [ Modern property listing - Design             ] |
|                                                  |
| > Tags (optional)                                |
|                                                  |
| Add property and agent details in the editor.    |
|                                                  |
|                       [Cancel]  [Create design]  |
+--------------------------------------------------+
```

Create from the reusable template snapshot, following the normal template-instantiation policy. Do not add a property picker, country connector or automatic Listing Apply to this naming dialog. Any Listing selected as part of an established entry flow remains pending until Apply. If the source Template has unsaved edits, resolve them through the inline source-save choice before creation/navigation.

### F. Unsaved source — inline, without another dialog

Keep the flow to **one creation dialog**. When Save a copy or Create design would leave a source with unsaved edits, show the following block inside the naming dialog, above its action row:

```text
| +----------------------------------------------+ |
| | Your unsaved edits will be in the new copy.  | |
| | The original keeps its last saved version.  | |
| |                                              | |
| | [ ] Also save these changes to the original  | |
| +----------------------------------------------+ |
|                         [Cancel]  [Save a copy]  |
```

The checkbox starts unchecked: Save a copy creates a separate record from the current draft. Its explanation and final action provide explicit consent to leave the original at its last saved version. Checking it saves the original first, waits for acknowledgment, then creates the copy. A failed source save or failed creation keeps the dialog and current draft intact. Cancellation creates nothing; if the user already requested and completed a source save before a later create failure, that acknowledged source save remains valid.

For an unsaved source with no ID, omit the checkbox and say “Creates a saved Design from this draft”; do not imply that a saved original exists. For future Template → Create design, use the same pattern with source-appropriate wording. Reconcile this explicit consent with the existing navigation/recovery contract rather than showing a second generic discard dialog or implementing another dirty-state mechanism. New source edits after submission invalidate earlier consent to leave; never navigate away silently from those newer edits.

Creating a reusable Template while remaining in the Design does not need this source-navigation choice.

### Theme, responsive layout and dialog states

- Use the actual V3 editor's light/dark surface, border, text and teal action tokens. The dialog portal must inherit the editor's theme. Use the same font, input treatment and focus ring as the refined Property/Agent panels; do not copy the legacy dialog's unrelated default styling.
- One column, about 440–480px wide on desktop, compact title/help text, 44px form controls and one primary teal action. Cancel is neutral; the close icon has an accessible name. No gradient dialog header or oversized preview.
- On phones use a full-width bottom sheet with a 16px side inset, bounded by the visible viewport. Body scrolls above the on-screen keyboard, actions stay reachable, and longer optional metadata can scroll. Use the same content/action order; avoid introducing another save flow for mobile.
- Enter submits from Name when valid; Enter in Tags adds a tag. Escape/Cancel dismiss before submission and return focus to the Save/menu trigger. Trap focus while open and announce errors/status changes. Canceling creation does not discard canvas edits.
- Disable submission for an empty/whitespace name or a request already in progress. Show the existing validated name limit beside the field when needed; no new arbitrary limit. Duplicate names may be allowed if the API permits them; never resolve a matching name by overwriting a different record.
- Keep entered values on failure. Put the error next to the form and change the primary action to Retry save / Retry creation. Do not show a success toast or close the dialog before acknowledgment. Preserve the established late-response and account/navigation guards.
- At submission capture the intended source revision. Edits made while saving remain dirty; a create response cannot silently switch away from newer source edits. Honor existing navigation/recovery rules and offer an explicit way to open the created record if automatic navigation is no longer safe.

Phone example:

```text
  +--------------------------------+
  | Create reusable template   [x] |
  | Reuse this layout.             |
  |                                |
  | Template name                  |
  | [ Modern property listing    ] |
  |                                |
  | Keeps layout and field links.  |
  | Clears linked facts/photos.    |
  |                                |
  | > Category and tags (optional) |
  +--------------------------------+
  | [Cancel]    [Create template]  |
  +--------------------------------+
```

Saving/error variants (same dialog, no second modal):

```text
|                         [Creating template...]  |

| Couldn't create the template. Your edits stay.  |
|                    [Cancel]  [Retry creation]    |
```

### Implementation order for this refinement

1. Approve the labels, sketches and entry-context table in this document.
2. Implement Design-mode Save + dropdown, first-save/copy/template creation dialogs and shared pending/error states using V3 theme primitives. Design dialogs include collapsed optional Tags; Template dialogs include collapsed optional Category and tags. Preserve existing metadata on regular Save.
3. Verify current Design identity, source isolation, sanitized Template content/preview, source-save choices, cancellation, stale responses, keyboard/focus, light/dark and phone/tablet layouts. Test the existing save/reload/recovery contract alongside the new dialog paths.
4. Introduce explicit Template authoring and its two extra creation flows separately, after its canonical save destination and permission model are ready.

The user authorized Design-mode implementation after reviewing this refinement. Its delivery and gate evidence are recorded in the implementation report. Explicit Template authoring/update/copy remains a separate future stage.
