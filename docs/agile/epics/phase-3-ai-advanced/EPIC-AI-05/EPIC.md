# EPIC-AI-05 — Intelligence Enrichment

> **Phase:** Phase 3 — Production Tools (Month 6–12, parallel with EPIC-AI-04)
> **Status:** 🔲 Not Started
> **Depends on:** EPIC-AI-01 + EPIC-AI-02 complete
> **Linear Project:** LIN-EPIC-AI-05
> **Target date:** 2027-03-31
> **Owner:** Dinesh

---

## Goal

**Outcome:** The AI automatically enriches infographics with real market data (walk score, school ratings, DOM), persists agent profiles so they never re-enter their info, adapts tone to listing status, and provides in-chat search to find past conversations.

**Why now:** These features make the product more intelligent without requiring more user input — increasing perceived value without friction. Brokerage and API plans benefit most.

**Success metric:** Market Data toggle pulls live walk score and adds to infographic copy. Agent profile auto-fills on every generation without prompting. "Sold" listings auto-get celebration tone. In-chat search finds "The Oak Street listing" across all conversations.

---

## Milestones

| Milestone | Scope | Target | Status |
|-----------|-------|--------|--------|
| [M-AI-15-market-data](milestones/M-AI-15-market-data.md) | Market data enrichment + Agent profile persistence | 2027-02-28 | 🔲 |
| [M-AI-16-status-search](milestones/M-AI-16-status-search.md) | Listing status tone routing + In-chat search | 2027-03-31 | 🔲 |

---

## Stories in this Epic

| Story ID | Title | Milestone | Status | PR |
|----------|-------|-----------|--------|----|
| [US-AI-027](stories/US-AI-027/STORY.md) | Market data enrichment toggle (CAP-21) | M-AI-15 | 🔲 | — |
| [US-AI-028](stories/US-AI-028/STORY.md) | Agent profile persistence (CAP-22) | M-AI-15 | 🔲 | — |
| [US-AI-029](stories/US-AI-029/STORY.md) | Listing status-aware tone routing (CAP-23) | M-AI-16 | 🔲 | — |
| [US-AI-030](stories/US-AI-030/STORY.md) | In-chat search (CAP-24) | M-AI-16 | 🔲 | — |

---

## Features in this Epic

| Feature ID | Scope | Stories |
|------------|-------|---------|
| F-AI-05-01 | Market intelligence — live data in copy | US-AI-027 |
| F-AI-05-02 | Brand kit — agent profile auto-fill | US-AI-028 |
| F-AI-05-03 | Context-aware tone routing | US-AI-029 |
| F-AI-05-04 | Conversation retrieval / search | US-AI-030 |

---

## Out of Scope (Epic Level)

- BullMQ horizontal scaling (Phase 4)
- Multi-device session enforcement (Phase 4)
- White-label deployment (Phase 4)

---

## Definition of Done (Epic)

- [ ] All milestones closed
- [ ] Market Data toggle adds walk score and school rating to generated infographic copy
- [ ] Agent profile (name, brokerage, colors) auto-fills without prompting after first setup
- [ ] "Just Sold" listing type auto-applies celebration tone and visual treatment
- [ ] In-chat search returns correct conversations for property queries
- [ ] `npm run check` + `npm run test:unit` passing
- [ ] AGILE_INDEX.md epic row updated to ✅ Done

---

## Architecture Notes

See [ARCHITECTURE.mmd](./ARCHITECTURE.mmd).

Key files relevant to this epic:
```
- api/src/modules/users/ (agent profile storage)
- api/src/modules/conversations/ (search index)
- api/src/modules/ai-generation/services/openai.service.ts (tone routing in system prompt)
- client/src/components/ai-chat/AIChatBox.tsx (market data toggle, search UI)
```

---

*Epic created: 2026-04-28 | Last updated: 2026-04-28*
