# EPIC-AI-04 — Production Tools

> **Phase:** Phase 3 — Production Tools (Month 6–12)
> **Status:** 🔲 Not Started
> **Depends on:** EPIC-AI-02 + EPIC-AI-03 complete
> **Linear Project:** LIN-EPIC-AI-04
> **Target date:** 2027-03-31
> **Owner:** Dinesh

---

## Goal

**Outcome:** Brokerage-grade production features — Campaign Mode generates full 4-piece marketing sets from one request, mockups show infographics in real scenes (yard signs, phone screens), outpainting adapts formats, and photo cleanup removes unwanted elements from property photos.

**Why now:** Unlocks the BROKERAGE plan ($301/mo) as a compelling offering and enables API revenue streams (PropTech integrations). Expected MRR doubles vs end of Phase 2.

**Success metric:** Campaign Mode generates 4 visually consistent infographics from one request. Mockup works for yard sign and phone screen scene types. Photo cleanup (object removal) processes in <10 seconds. Format Expand adapts an Instagram infographic to a Facebook Cover.

---

## Milestones

| Milestone | Scope | Target | Status |
|-----------|-------|--------|--------|
| [M-AI-12-mockup-expand](milestones/M-AI-12-mockup-expand.md) | Mockup generator + Format Expand / Outpainting | 2027-01-31 | 🔲 |
| [M-AI-13-photo-cleanup](milestones/M-AI-13-photo-cleanup.md) | Photo Cleanup (object removal) | 2027-02-28 | 🔲 |
| [M-AI-14-campaign-backend](milestones/M-AI-14-campaign-backend.md) | Campaign Mode full 4-piece backend generation | 2027-03-31 | 🔲 |

---

## Stories in this Epic

| Story ID | Title | Milestone | Status | PR |
|----------|-------|-----------|--------|----|
| [US-AI-023](stories/US-AI-023/STORY.md) | Real estate mockup generator (CAP-18) | M-AI-12 | 🔲 | — |
| [US-AI-024](stories/US-AI-024/STORY.md) | Format Expand / Outpainting (CAP-19) | M-AI-12 | 🔲 | — |
| [US-AI-025](stories/US-AI-025/STORY.md) | Property photo cleanup — object removal (CAP-20) | M-AI-13 | 🔲 | — |
| [US-AI-026](stories/US-AI-026/STORY.md) | Campaign Mode — full 4-piece generation backend (CAP-09 backend) | M-AI-14 | 🔲 | — |

---

## Features in this Epic

| Feature ID | Scope | Stories |
|------------|-------|---------|
| F-AI-04-01 | Scene mockups (yard sign, phone, billboard) | US-AI-023 |
| F-AI-04-02 | Format expansion / outpainting | US-AI-024 |
| F-AI-04-03 | Object removal from property photos | US-AI-025 |
| F-AI-04-04 | Full campaign generation (4-piece set) | US-AI-026 |

---

## Out of Scope (Epic Level)

- Market data enrichment (EPIC-AI-05)
- Agent profile persistence (EPIC-AI-05)
- In-chat search (EPIC-AI-05)
- BullMQ horizontal scaling (EPIC-INFRA-03 / Phase 4)

---

## Definition of Done (Epic)

- [ ] All milestones closed
- [ ] Campaign Mode generates 4 visually consistent infographics from one request
- [ ] Mockup works for yard sign and phone screen scene types
- [ ] Object removal processes in <10 seconds
- [ ] Format Expand adapts 1:1 Instagram to 1.91:1 Facebook
- [ ] `npm run check` + `npm run test:unit` passing
- [ ] AGILE_INDEX.md epic row updated to ✅ Done

---

## Architecture Notes

See [ARCHITECTURE.mmd](./ARCHITECTURE.mmd).

Key files relevant to this epic:
```
- api/src/modules/ai-generation/ (new CampaignOrchestrator, MockupService, PhotoEnhancementService)
- client/src/components/ai-chat/AIChatBox.tsx (Campaign Mode backend wiring)
- api/src/config/ai-models.config.ts (add mockup / outpaint model entries)
```

---

*Epic created: 2026-04-28 | Last updated: 2026-04-28*
