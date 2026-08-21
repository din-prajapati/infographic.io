# M-AI-19-format-expansion — Sample Template Format Expansion

> **Epic:** [EPIC-AI-09](../EPIC.md)
> **Status:** 🔲 Not Started
> **Target date:** TBD — pull from backlog per trigger below

---

## Goal

All 23 formats in `client/src/lib/formatTaxonomy.ts` have a real, browsable admin_curated canvas
template. Today only 5 do (Instagram Story, Instagram Post, Print Flyer, Email Header, Feature
Sheet); this milestone builds the other 18.

---

## Scope at a glance

| Bucket | Formats | New photo needed? |
|---|---|---|
| No photo needed (text/logo-driven) | Business Card, Yard Sign, Door Hanger | No — reuse existing agent-photo/logo assets |
| Covered by reusing existing photos | Listing Story, Facebook Story, WhatsApp Status, Instagram Reel Cover, Postcard, Facebook Cover | No — `ps-hero.jpg` / `oh-hero.jpg` already generated |
| Needs one of the 7 new photos | Just Listed, Open House, Just Sold, Property Flyer, Market Report, Facebook Post, WhatsApp Business Post, Open House Sign, LinkedIn Post | Photos already sourced, see below |

Full per-format mapping and the 7 prompts already written:
[`docs/design/SAMPLE_TEMPLATE_PHOTO_PROMPTS.md`](../../../../design/SAMPLE_TEMPLATE_PHOTO_PROMPTS.md).
Several of those 7 are already generated and sitting in
`client/public/template-assets/{us,in}/` as of 2026-08-20 — this milestone's real remaining work is
the **canvas layout design**, not photo sourcing (see EPIC.md's "Why now" section for why those are
different-sized problems).

---

## Stories in this Milestone

> Not drafted — per 2026-08-20 direction, this milestone is scoped only. When story-writing
> resumes, split by platform group (the earlier size analysis called this XL — ~27-36h total,
> "must split before development starts" per this project's own sizing rules):

- Instagram + Facebook batch (Reel Cover, Post, Cover, Story)
- WhatsApp + LinkedIn batch (Status, Business Post, Post)
- Printables batch (Postcard, Open House Sign, Yard Sign, Door Hanger, Business Card)
- "For You" curated-job batch (Just Listed, Open House, Just Sold, Listing Story, Property Flyer, Market Report)
- Verification/QA pass — confirm all 23 formats resolve via `getAdminCurated()`, Format Picker
  Library step re-enable is a separate follow-on decision, not bundled here

---

## Acceptance (Milestone Done When…)

- [ ] All 18 missing formats have at least one admin_curated `Infographic` row
- [ ] Every new row follows the existing shape: `aiModel: 'canvas-template'`,
      `propertyData.canvasDesign.{thumbnail,canvasData,tags,badge,description}` — both `thumbnail`
      and `canvasData.elements[].src` set correctly (not just one, per the 2026-08-20 bug found on
      the first 5 templates)
- [ ] Tags/badges follow the `BADGE_TO_FORMAT_TAG` convention — no raw geometry in user-visible copy
- [ ] `canvasTemplatesApi.getAdminCurated()` returns a non-empty result for every `FORMAT_TAXONOMY` id
- [ ] All stories above have status ✅ Done
- [ ] Verification gates pass (Gate 1 mandatory)

---

## Notes / Blockers

- **Not currently blocked on anything** — the photo library exists (partially generated already),
  the existing 5 templates are a working reference pattern to copy.
- **Sequencing suggestion, not a hard rule:** if `EPIC-KIT-01` gets pulled forward first, prioritize
  the WhatsApp + Instagram Reel Cover formats within this milestone, since Kit's own stated goal
  names "WhatsApp card" as a deliverable and currently has nothing to point at.
- **Property Flyer vs. Feature Sheet:** flagged in the photo-prompt file — these two "For You" /
  Printables formats share identical dimensions (1240×1754). Confirm during story-writing whether
  "Property Flyer" needs its own new template at all, or can just re-tag the existing MLS Listing
  Sheet template under both format ids.

---

*Milestone created: 2026-08-20*
