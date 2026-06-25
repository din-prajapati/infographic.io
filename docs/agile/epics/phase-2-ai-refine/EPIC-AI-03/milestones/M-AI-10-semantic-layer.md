# M-AI-10-semantic-layer — Semantic Layer Split + R2 Asset Storage

> **Epic:** [EPIC-AI-03](../EPIC.md)
> **Status:** 🔲 Not Started
> **Target date:** 2026-10-15

---

## Goal

Generated images are stored durably in Cloudflare R2 (accessible 30 days after creation) and the infographic's semantic structure (background / agent block / headline / price) is tracked so element-level editing can target specific areas.

---

## Stories in this Milestone

| Story | Title | Status | PR |
|-------|-------|--------|----|
| [US-AI-019](../stories/US-AI-019/STORY.md) | Infographic semantic layer split (CAP-15) | 🔲 | — |
| [US-AI-020](../stories/US-AI-020/STORY.md) | Cloudflare R2 asset storage + signed URLs | 🔲 | — |

---

## Acceptance (Milestone Done When…)

- [ ] Generated images stored in Cloudflare R2 — accessible via signed URL 30 days after creation
- [ ] Image URLs do not expire within 30 days (verified by checking URL from prior test generation)
- [ ] Semantic layer metadata (element bounding boxes) stored with each generation record
- [ ] Semantic layer data used by Element Edit Mode to target specific regions
- [ ] All stories above have status ✅ Done

---

## Notes / Blockers

- R2 setup requires Cloudflare account + `CLOUDFLARE_R2_*` env vars
- US-AI-020 (R2 storage, 10h) should be done before US-AI-019 (semantic layer, 20h) — storage must be in place before semantic layer metadata is durably saved

---

*Milestone created: 2026-04-28*
