# EPIC-AI-09 — Sample Template Format Expansion (Phase 4 Backlog)

> **Phase:** Phase 4 Backlog — likely prerequisite/trigger-adjacent to EPIC-KIT-01, not a hard gate
> **Status:** 🔲 Not Started
> **Depends on:** none technically — the 5 existing templates + photo library already exist. Product-relevant to EPIC-KIT-01 (see "Relationship to EPIC-KIT-01" below).
> **Owner:** Dinesh
> **Backlog ref:** [Phase 4 Backlog B-19](../../phase-4-backlog/README.md#b-19--epic-ai-09--sample-template-format-expansion)

---

## Goal

**Outcome:** Every format in `client/src/lib/formatTaxonomy.ts` (23 total) has a real, browsable
admin_curated canvas template — not just the 5 that exist today (Instagram Story, Instagram Post,
Print Flyer, Email Header, Feature Sheet). A user picking any platform/format in the app finds a
populated starting point, not an empty gallery.

**Why now (deferred):** A 2026-08-20 audit found the 5 existing templates cover only 5 of 23
taxonomy formats. The other 18 — including every Facebook, WhatsApp, and LinkedIn format, plus
5 of 7 Printables formats — have zero template rows. This was likely *why* the Format Picker
dialog's template-suggestion step was removed in an earlier story (its own code comment says
picking a format there "meant rendering a grid that was empty for every format, which flashed a
skeleton and then vanished") — that fix papered over the real gap rather than closing it.

**Success metric:** All 23 formats in `FORMAT_TAXONOMY` resolve to at least one admin_curated
template via `canvasTemplatesApi.getAdminCurated()`. The Format Picker's Library step can be
re-enabled without hitting the empty-grid problem that got it removed.

---

## Root Cause / Pre-Story Analysis

- **Observed problem:** `TemplatesPanel.tsx` / `TemplatesPage.tsx` show 5 templates; the app defines
  23 possible formats. 18 formats have no template to show, ever, regardless of what a user does.
- **Underlying cause:** The 5 templates were built once (US-AI-037 migration, US-AI-040 tag polish)
  as a fixed set and never revisited as the format taxonomy grew to 23 entries.
- **Constraints we must respect:** New templates must follow the same `canvasDesign` JSON shape as
  the existing 5 (`propertyData.canvasDesign.canvasData.elements[]`), the same tag/badge rules from
  US-AI-040 (no raw geometry in copy or tags — `BADGE_TO_FORMAT_TAG` mapping in
  `seed-premium-templates.ts` is the reference), and reuse the photo library already sourced in
  [`docs/design/SAMPLE_TEMPLATE_PHOTO_PROMPTS.md`](../../../design/SAMPLE_TEMPLATE_PHOTO_PROMPTS.md)
  rather than commissioning one photo per format.
- **What success looks like:** Every platform group in the Format Picker has at least one populated
  template card behind it.

---

## Relationship to EPIC-KIT-01

**Not a verified hard code dependency** — `EPIC-KIT-01` hasn't been built yet (0/6 stories,
`infographic-prompt.builder.ts` doesn't yet reference format/orientation logic), so there's nothing
to confirm a runtime dependency against. Kit's architecture notes describe AI-orchestrated
per-format *generation* (prompt variants keyed to format dimensions), which doesn't strictly
require a pre-built canvas template to exist for a format to be generated.

**But it's a real product-level coupling, not a stretch:** EPIC-KIT-01's own Goal statement names
its deliverable formats explicitly — *"Instagram post (1:1), Instagram story (9:16), A4 flyer
(print-ready), **WhatsApp card**, and email header."* WhatsApp has zero template today. If Kit's UX
ends up wanting a template starting point per format (consistent with how the other 4 named formats
already work), this epic is what supplies it.

**Recommendation:** sequence this epic's WhatsApp + Instagram + Print Flyer/Feature-Sheet-adjacent
work *before or alongside* EPIC-KIT-01 kickoff; the remaining formats (Facebook, LinkedIn, most
Printables) can trail after, since Kit's own goal doesn't name them.

---

## Milestones

| Milestone | Scope | Target | Status |
|-----------|-------|--------|--------|
| [M-AI-19-format-expansion](milestones/M-AI-19-format-expansion.md) | Design + build canvas templates for all 18 missing formats | after Phase 3 gate, or pulled forward alongside EPIC-KIT-01 | 🔲 |

---

## Stories in this Epic

> Not drafted yet — per 2026-08-20 direction, this epic is scoped at the epic/milestone level only.
> Story breakdown (grouped by platform, ~5–6 stories per the earlier XL-size split analysis) comes
> later, closer to when this is pulled off the backlog.

| Story ID | Title | Milestone | Status |
|----------|-------|-----------|--------|
| — | *TBD — draft when pulled from backlog* | M-AI-19 | 🔲 |

---

## Out of Scope (Epic Level)

- Business Card, Yard Sign, Door Hanger — these 3 formats need no new photo (text/logo-driven by
  convention) but still need a canvas layout designed; layout work for them is in scope, new photo
  sourcing is not.
- Video/Reels format content — Instagram Reel *Cover* (a static image) is in scope; actual video is not.
- Any change to `EPIC-KIT-01`'s own AI-orchestration/prompt-builder code — this epic only builds the
  canvas-template gallery layer.
- Re-enabling the Format Picker's Library step — that's a separate frontend story that *consumes*
  this epic's output; not built here.
- Localized/regional photo variants beyond what's already been sourced (`client/public/template-assets/{us,in}/`)
  — if more regions are wanted, that's an extension of the existing photo-sourcing work, not new
  scope for this epic.

---

## Definition of Done (Epic)

- [ ] All milestones closed
- [ ] All stories have PR merged and STORY.md status = ✅ Done
- [ ] `canvasTemplatesApi.getAdminCurated()` returns at least one template per `FORMAT_TAXONOMY` entry
- [ ] Verified on staging environment
- [ ] `npm run check` + `npm run test:unit` passing
- [ ] AGILE_INDEX.md epic row and Phase 4 Backlog README updated to ✅ Done

---

## Architecture Notes (inline)

- **Entry points:** `api/scripts/seed-premium-templates.ts` (original migration pattern) and
  `api/scripts/update-template-images.ts` (image-wiring pattern) — new templates should follow the
  same `Infographic` row shape (`aiModel: 'canvas-template'`, `propertyData.canvasDesign`), not a
  new table or model.
- **Key abstractions:** `DesignsService.findAdminCuratedTemplates()` /
  `DesignsService.findOne()` — both read `propertyData.canvasDesign.thumbnail` for the gallery
  card image (not `Infographic.imageUrl` — a real bug found and fixed 2026-08-20 while wiring the
  first 5 templates' images; any new template-creation script must set both fields, or just
  `canvasDesign.thumbnail`, correctly from the start).
- **Data contracts:** `BADGE_TO_FORMAT_TAG` / `FORMAT_TAG_LABEL` in `seed-premium-templates.ts` are
  the canonical badge↔format-tag mapping — extend these tables rather than inventing new tag
  conventions per new template.
- **Patterns to follow:** US-AI-040's "no geometry in copy" rule (descriptions and tags never
  contain raw ratios/pixel dimensions — see `DESCRIPTION_REWRITES` for the existing examples).
- **Photo asset source:** [`docs/design/SAMPLE_TEMPLATE_PHOTO_PROMPTS.md`](../../../design/SAMPLE_TEMPLATE_PHOTO_PROMPTS.md)
  — 7 new photos + reuse mapping across all 18 missing formats, already sourced as of 2026-08-20
  (`client/public/template-assets/`).

For the visual diagram see [ARCHITECTURE.mmd](./ARCHITECTURE.mmd).

---

## Implementation Update (log)

### 2026-08-20 — Epic scaffolded, no stories yet
- **Trigger:** Format-coverage audit while wiring real images into the 5 existing sample templates
  found 18 of 23 taxonomy formats have zero template. Photo-sourcing prompt file already delivered
  ([`SAMPLE_TEMPLATE_PHOTO_PROMPTS.md`](../../../design/SAMPLE_TEMPLATE_PHOTO_PROMPTS.md)); several
  of those photos already generated and organized into region folders
  (`client/public/template-assets/{us,in}/`) ahead of this epic being picked up.
- **Notes:** Placed in Phase 4 Backlog per user direction, cross-referenced to EPIC-KIT-01 as a
  likely-but-unverified prerequisite (Kit isn't built yet). Stories deliberately not drafted —
  epic/milestone scaffolding only, per explicit instruction.

---

*Epic created: 2026-08-20 | Last updated: 2026-08-20*
