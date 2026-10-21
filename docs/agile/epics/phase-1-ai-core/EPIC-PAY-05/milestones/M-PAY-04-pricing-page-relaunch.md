---
title: M-PAY-04-pricing-page-relaunch — Pricing Page Relaunch
type: milestone
tags: [orion, pay, pricing, ui]
updated: 2026-08-23
---

# M-PAY-04-pricing-page-relaunch — Pricing Page Relaunch

> **Epic:** [EPIC-PAY-05](../EPIC.md)
> **Feature:** F-PAY-04
> **Status:** ✅ **Done — closed 2026-10-21. 8/8 acceptance criteria.** Both stories (US-PAY-112,
> US-PAY-113) merged to `main`. The last open item was the mobile + desktop visual check, run
> 2026-10-21 against deployed staging *and* production: zero horizontal overflow at both widths,
> the comparison table confirmed scrolling inside its own 329px box, grids collapsing to a single
> column at 375px, and [[BL-32]] confirmed inapplicable by measurement (this page renders no
> `header` element). All three gates re-run rather than carried over — `npm run check` 0 errors,
> 726 backend tests, 278 frontend tests.
> **Target date:** TBD (deferred to V2 — see [EPIC.md](../EPIC.md) "Scope split")
> **Branch:** none — `feat/pay/m-01-pricing-relaunch` was never created; the stories landed on
> `main` directly and are traceable by `git log --grep "<US-ID>"`.
> **Version:** V2 — both stories deferred until after the first real ₹ transaction; also blocked
> on capturing per-tier "5–8 key features" content, which currently exists only as "see chat
> history" in the source PRD, not in any durable file

---

## Goal

A customer looking at the pricing page immediately understands the real-estate specialization, sees
the correct regular/founding price with the founding price displayed prominently and the regular
price kept visible as the anchor, and the page works on mobile and desktop without a 20-row feature
wall.

---

## Stories in this Milestone

| Order | Story | Title | Size | Blocked By | Status | PR |
|:-----:|-------|-------|:----:|------------|:------:|:--:|
| 1 | [US-PAY-112](../stories/US-PAY-112/STORY.md) | Pricing page redesign — cards, founding badge, toggle | L | US-PAY-102, US-PAY-106 | ✅ (code) | — |
| 2 | [US-PAY-113](../stories/US-PAY-113/STORY.md) | Responsive layout + comparison section + messaging | S | US-PAY-112 | ✅ (code) | — |

---

## Acceptance (Milestone Done When…)

- [x] Each plan card shows: name, target audience, regular price, founding price (when active),
      billing frequency, design allowance, editable allowance, key features (4-5 per tier — the
      "5–8" figure in the original PRD assumed a longer feature catalog that never materialized
      beyond `PLAN_CONFIG`'s existing lists; see Notes/Blockers below), CTA, badge
- [x] Pro is visibly marked "Most Popular"
- [x] Founding price is prominent; regular price stays visible as the anchor (strikethrough or
      equivalent) whenever a campaign is active
- [x] No fake scarcity or countdown — any claimed remaining-slots count is real backend data or not
      shown at all (none added; comparison table shows only `PLAN_CONFIG`-derived facts)
- [x] No Ideogram/GPT/API cost language anywhere on the page
- [x] Mobile and desktop layouts both verified, not just desktop — responsive markup done
      (`US-PAY-113`) — ✅ **verified 2026-10-21 against deployed staging and production, at both
      widths, by runtime measurement.**

      **Method.** `resize_window` reported success but the viewport stayed at 1536px (the window
      was maximized), so the 375px layout was measured by rendering `/pricing` in a **same-origin
      iframe fixed at 375px** — CSS media queries evaluate against the iframe's own viewport, so
      Tailwind's breakpoints fired at mobile width. Measurements are runtime `getBoundingClientRect`
      /`getComputedStyle` readings, not inferences from the markup.

      **Mobile — 375px (iframe viewport 370px, `clientWidth` 362px):**

      - **`scrollWidth - clientWidth` = 0** — the page does not scroll sideways.
      - **The comparison table scrolls inside its own box, confirmed at runtime:** a 720px table in
        a **329px** wrapper with computed `overflow-x: auto`. The 178 elements extending past the
        document width are all table descendants — correct behaviour for the contained-scroll
        pattern, not overflow.
      - **31 elements outside the table extend past the viewport, and all 31 are `animate-marquee`**
        — a deliberately over-wide infinite-scroll strip. The document still reports 0 overflow, so
        it is contained.
      - **Grids collapse correctly:** the plan-card grid computes to a single `360.8px` column, the
        format grid to `157.2px 157.2px`, the three-up grid to one `330.4px` column.
      - **`document.querySelectorAll('header').length` = 0** — [[BL-32]] cannot apply to this page.

      **Desktop — 1536px viewport:** `scrollWidth - clientWidth` = **0**; five plan cards render in
      a row; Pro carries the **⭐ MOST POPULAR** badge; the Monthly/Yearly toggle shows
      **Save 20%**, which is derived (`getAnnualSavings`: SOLO ₹65,988 list vs ₹52,999 annual =
      19.7% → 20%), not a hardcoded claim.

      **Every tier's rendered numbers, read off the live mobile DOM:**

      | Tier | Price | Design credits | Editable credits |
      |---|---|---|---|
      | Free | ₹0 | 3 | trial only — *“One free trial edit — no monthly editable allowance.”* |
      | Solo | ₹5,499 | 50 | **10** |
      | Pro | ₹10,999 | 100 | **25** |
      | Team | ₹21,999 | 200 | **60** |
      | Agency | ₹43,999 | 400 | **150** |

      Exact match to `PLAN_CONFIG` and the PRD pricing table. The editable allowance renders as
      *“N editable credits / mo — a separate allowance, spent when you open a design in the
      editor”* inside a **“Multi-layer Canvas Editor Included”** panel on each paid card.

      **Production checked too** (`app.buildographic.com/pricing`): zero overflow, the same five
      prices, **no test-mode banner and no test card** — the staging-only *“Test mode — Razorpay”*
      notice is correctly gated and does not leak to the live pricing page. Production and staging
      are both on `df332cd`, frontend and API agreeing.

      **One observation, not a defect:** several micro-labels compute to a **10px** font size
      (“WHAT YOU GET”, “⭐ MOST POPULAR”, the format chips). Legible, deliberate-looking, and
      consistent across breakpoints — flagged only so a later reader knows it was seen and judged,
      not missed.

- [x] All stories above have status ✅ Done

      **Traceability, verified 2026-10-21.** No milestone branch was created for this epic, so
      there is no milestone PR; every story landed on `main` piecemeal. The git standard's intended
      mechanism still works — each story resolves by `git log --grep "<US-ID>"`:

      | Story | Commits on `main` |
      |---|:--:|
      | [US-PAY-102](../stories/US-PAY-102/STORY.md) | 14 |
      | [US-PAY-106](../stories/US-PAY-106/STORY.md) | 5 |
      | [US-PAY-112](../stories/US-PAY-112/STORY.md) | 16 |
      | [US-PAY-113](../stories/US-PAY-113/STORY.md) | 5 |

      Epic DoD amended to match (see [EPIC.md](../EPIC.md)).
- [x] Verification gates pass (Gate 1 + Gate 2 frontend + manual visual check) —
      ✅ **all three pass as of 2026-10-21.** Gate 1: `npm run check` (0 errors) and
      `npm run test:unit:backend` (**726 passed / 52 files**). Gate 2: `npm run test:unit:client`
      (**278 passed, 1 skipped / 17 files**). Manual visual check: the mobile + desktop pass
      recorded above, run against deployed staging and production rather than a local dev server.
      All three re-run on 2026-10-21, not carried over from an earlier claim.

---

## Notes / Blockers

- Blocked on M-PAY-01 (needs real `PLAN_CONFIG` tiers) and `US-PAY-106` (needs the price-resolution
  service to actually render correct numbers) — don't start the visual redesign against
  placeholder/hardcoded prices.

---

*Milestone created: 2026-08-21*
