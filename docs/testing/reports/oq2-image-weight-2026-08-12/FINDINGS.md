# OQ-2 — `image_weight` calibration: remix cannot do fidelity *and* design

> **Date:** 2026-08-12 · **Cost:** ~$0.36 (6 live Ideogram calls)
> **Closes:** SPIKE-031 open question OQ-2
> **Verdict:** ❌ **No viable `image_weight` exists.** US-AI-031's core premise is disproven.

---

## Method

One real listing photo — an **interior** (living hall, 3 BHK villa, Shela Ahmedabad, 800×533), sourced from a live resale listing. One fixed prompt containing all six canonical listing fields plus the AC2 clean-typography instruction. Six calls to `POST /v1/ideogram-v4/remix` at `rendering_speed=DEFAULT`, `resolution=2560x1440`, varying only `image_weight`.

`w=75` ran through the **actual application pipeline** (upload → generate → poll → variations) to confirm the plumbing; the rest went direct to the provider for speed.

Source: [`00-source-real-hall.jpg`](./00-source-real-hall.jpg)

---

## Results

| `image_weight` | Property fidelity | Design output | Evidence |
|---|---|---|---|
| **75** *(shipped default)* | ✅ **Near-photographic.** Same sofa, staircase, dining set, ceiling fans, floor. Reframed 3:2 → 16:9 by outpainting. | ❌ **None.** No headline, price, address, stats or agent. Just the photo. | [`01-w75-pipeline.png`](./01-w75-pipeline.png) |
| **65** | ✅ Exact — all distinctive furniture preserved | ❌ **Garbled.** Headline `SPACIOUS / VILLK ⋅ 2`; stats `3 Beds \| 491 (250 2qft`; price rendered **`R 35,5,0,000`** instead of `1,85,00,000`. Illegible, tiny, factually wrong. | [`02-w65.png`](./02-w65.png) |
| **60** | — | — | [`02-w60.png`](./02-w60.png) |
| **50** | ⚠️ **Room altered.** Purple fabric sofa replaced by grey concrete seating; staircase changed; a window/outdoor view invented. Coffee table and fans survive. | ✅ Good — all six fields legible and correct | [`02-w50.png`](./02-w50.png) |
| **30** | ❌ **Entirely different building.** Input was an *interior*; output is a villa *exterior* with garden and driveway. Zero relationship to the source. | ✅ Excellent — professional, well-composed | [`02-w30.png`](./02-w30.png) |
| **15** | ❌ (fully synthetic) | ✅ | [`02-w15.png`](./02-w15.png) |

---

## Finding 1 — the tradeoff is the mechanism, not a tuning parameter

Fidelity and design move in strict opposition, and **the middle is degenerate rather than optimal**. `w=65` is the worst result in the set: a real photograph carrying illegible text and a wrong price. That is worse than either extreme, because it *looks* like a product while being unusable and factually false.

There is no weight at which remix delivers both. This is not a calibration failure; it is what remix does. Ideogram's own docs describe `image_weight` as controlling "how strongly the output should resemble the input" — resemblance and re-composition are the same axis, and design lives at the far end from fidelity.

**US-AI-031 AC1 ("the resulting composition contains the recognizable actual property") and the epic's design requirement cannot both be satisfied by this mechanism.**

## Finding 2 — fabrication is the default, not an edge case

At every weight that produced a usable design (50 and below), the model generated:

- a **photorealistic agent headshot** of a person who does not exist
- the phone number **`+91 98765 43210`**, which appears nowhere in the prompt

The prompt supplied a name and brokerage. The model invented a face and a contact number and presented them as listing facts.

This is exactly the scenario **US-AI-033 (Synthetic-Content Guard)** describes. That story was moved to the Phase 4 backlog as B-18 on 2026-08-11 on the reasoning that no user had asked for it. This evidence shows it describes the **default behaviour of the shipped pipeline**, not a speculative future risk. The move should be reconsidered.

> Note: under the locked architecture, layerize would strip the fabricated *phone number* (it is text) and our canonical value would replace it. The fabricated *face* is pixels and would survive into the final design.

## Finding 3 — interiors are the harder case, and they are common

The source was an interior because that is what resale listings actually contain. At `w=30` the model did not merely restyle the room — it substituted an exterior. Any approach relying on the model to "keep the property" must hold for interiors, not just hero exteriors.

---

## What this invalidates

| Artifact | Status |
|---|---|
| US-AI-031 AC1 | ❌ Not achievable via remix at any weight |
| `REMIX_IMAGE_WEIGHT = 75` | Confirmed unusable — produces zero design |
| SPIKE-031 recommendation (remix as composition engine) | ❌ Superseded by this evidence |
| M-AI-17 DoD "background is recognizably that photo" | Achievable only by *not* re-diffusing the photo |
| US-AI-033 backlog move (B-18) | Should be reconsidered — fabrication is default behaviour |

What survives untouched: **US-AI-031b** (layer extraction + the pure block→field mapper) and **US-AI-032** (editable canvas). Both operate on a composition regardless of how it was produced, and the mapper is provider-free by construction.

---

## Recommended direction — never re-diffuse the photo

The mechanism must change so the photograph is **never passed through a diffusion model**. It stays a canvas layer we own; the model contributes design, not pixels over the property.

```
Real photo ──────────────────────────────┐  (never re-diffused)
                                         │
Listing data ──► Design planner (LLM) ───┤
                 layout spec: panel rects,│
                 palette, type scale      │
                                         ▼
                              Canvas compositor
                       photo layer + panels + canonical text
                                         │
                                         ▼
                            Editable listing design
```

Two variants worth costing:

- **(a) Pure canvas.** No image model at all. The LLM emits a structured layout spec; our renderer draws panels, gradients and type. Cost collapses to the LLM call alone (~$0.004 vs $0.06 — **15× cheaper**), fidelity is pixel-exact by construction, and output is editable by default because it was never a raster.
- **(b) Hybrid.** Image model generates decorative furniture only (panels, gradients) on transparent ground, composited over the untouched photo. Richer visuals, retains an image cost, still fidelity-safe.

**(a) reframes the product** from "AI image generation" to "AI art-directed template generation" — the model decides layout, palette and typography; the canvas renders deterministically. Fabrication risk goes to zero because the model never draws a house or a face.

Plan-tier economics under (a), at cap: TEAM drops from ~$36/mo to well under $1/mo.

---

## Open questions for the next spike

1. Can an LLM-authored layout spec + our canvas renderer reach the visual quality of the `w=30` output? That output is the quality bar to beat.
2. What does the layout spec schema need to carry — and does US-AI-031b's `ComposedTextElement` already model most of it?
3. Does the image model still earn a role under variant (b), or is pure canvas sufficient?

---

*Evidence produced 2026-08-12. Third-party listing photo used for testing only; not committed as a product asset.*
