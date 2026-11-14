# Simplified V3 saving — proposal only

Status: **Not implemented.** Requested in browser comment5, 2026-11-14. Current Save as Template / Save as Design controls and persistence semantics are retained until the user approves a flow.

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

Use a compact naming dialog only when creating a new record or copy. Show its destination clearly: “Save new Design” or “Create reusable Template”. After success, show an acknowledged status with an **Open** action for a newly created Template; keep the current Design open unless the user explicitly chooses Open. A saved Design copy can open directly after navigation consent.

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
