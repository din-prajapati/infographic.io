---
title: Findings — Extract vs Compose Forward, and the Hybrid
type: prd-findings
domain: EDIT
created: 2026-08-26
status: for later evaluation — not scheduled
verified_against: main @ 81d4302
---

# Findings — Extract vs Compose Forward

> Captured so the compose-forward approach can be evaluated later without re-deriving any of it.
> Every claim was checked against the code on 2026-08-26; file references are inline.
> Visual companions: [`assets/compose-forward-decision.html`](./assets/compose-forward-decision.html),
> [`assets/editable-layers-flow.html`](./assets/editable-layers-flow.html).

---

## 1. Correction that reframed the whole comparison

An earlier draft argued compose-forward was needed because OCR could misread a price — a
compliance risk. **That was wrong.**

`api/src/modules/ai-generation/services/text-block.mapper.ts:13`:

> *"AC8: canonical values are NEVER sourced from model output. detectedText is used [only for
> matching] … the application's own listing record (the `canonical` parameter)."*

Extraction uses OCR to find **where** text sits and to match it to a field. The **content** is
re-rendered from our own listing record. Accuracy was solved by US-AI-046 AC8.

**Consequence:** compose-forward is a cost/latency optimisation, not a correctness fix. The
accuracy row is a tie.

---

## 2. The two mechanisms

**A — Extract backward (shipped).** Ideogram bakes text into the art → user clicks Edit →
`layerize-text` ($0.09, 15–90s, beta) returns per-block geometry → `mapBlocksToFields` pairs that
geometry with canonical values → editable canvas. Cached per variation (US-AI-048).

**B — Compose forward (proposed).** Ideogram renders scene only (`buildTextFreeImagePrompt`,
US-AI-051) → `LayoutPlannerService.planLayout()` decides where type can sit → `layoutEngine`
places canonical values → editable at first render, no extraction.

### Head to head

| Dimension | A · Extract | B · Compose forward |
|---|---|---|
| Cost per first edit | $0.09 | **$0** |
| Time to editable | 15–90s | **instant** |
| Text accuracy | exact (canonical) | exact (canonical) — **tie** |
| Visual quality | **AI-integrated typography** | engine-placed overlay |
| Layout variety | **unlimited** | 3 templates |
| Brand assets as layers | no | **yes** |
| Handles uploads | **yes** | no |
| Build state | **shipped** | ~2/3 built, unwired |

### Verdict recorded 2026-08-26

**Do not migrate wholesale.** The original case rested on an accuracy problem that does not
exist. What remains is real but modest, while the aesthetic downside — replacing model-composed
typography with three templates — is the hardest thing to reverse once users have seen it.

---

## 3. The hybrid — split by element, not by pipeline

The decisive finding, from `infographic-prompt.builder.ts`:

| Element | In the image prompt? | Evidence |
|---|---|---|
| Headline, price, address, facts | **yes** — rendered as art | `buildImagePrompt` lines 169–176 |
| Agent name, brokerage | **yes** — rendered as text | `agentLine`, line 169 |
| Brokerage logo | **no** | absent from the builder entirely |
| Agent headshot | **no** | absent |
| QR code, licence # | **no** | absent |

So brand furniture is **not baked into the raster — it is simply missing from the product.**
`useAgentStore` already holds `license` and `logoPreview`; neither ever reaches the canvas.

That removes the conflict. The two categories were never competing:

| Category | Owner | Why |
|---|---|---|
| **Typography** — headline, price, address, facts | **AI renders it; we extract geometry** | Integrated with the scene: weight, spacing and colour respond to the photo. This is a real part of why output looks professional. |
| **Brand furniture** — logo, headshot, QR, licence | **We compose forward** | An image model cannot render a real agent's face or a scannable QR. It does not even attempt these today. |

**Composing brand assets forward is pure addition — zero aesthetic risk, no competition with AI
typography, and it is the one thing that makes a design publishable as a specific agent's.**

### The second axis: *when*

| Layer | Composed | Cost |
|---|---|---|
| Brand furniture | at generation time | $0, always present |
| Text | lazily, on the Edit click | $0.09 once, then cached |

Which gives a natural progressive enhancement, and maps onto the business model:

1. Design arrives — photo + AI typography (flat) + **real brand layers, already editable**. Free.
2. User clicks Edit elements — text becomes editable too. Metered, cached.

### Natural first use for the idle planner

`LayoutPlannerService` (US-AI-044 — built, 49 tests, module-registered, **never invoked**) is a
lower-risk fit here than driving all layout: use it to reserve safe space for brand furniture,
leaving AI typography untouched.

---

## 4. If compose-forward is evaluated later

Do not decide from documents. The deciding evidence is **the same listing rendered both ways,
side by side**. Roughly a day of work.

Suggested shape:
- Flag it on the **photo path only** — `buildTextFreeImagePrompt` already exists there
  (`ai-orchestrator.service.ts:189-196`), currently gated on the `renderMode` toggle that
  US-EDIT-005's fix decoupled from the canvas control.
- Generate N real listings both ways; compare output directly.
- Watch specifically for: text leaking into "text-free" backgrounds (doubled copy), and
  variations converging because they share one text layout.

### Known blockers if it is pursued

| Gap | Detail |
|---|---|
| Text-free prompt is photo-path only | the no-photo V4 `json_prompt` branch always bakes text |
| Gated on `renderMode` | needs re-gating; that preference is being removed from the canvas control |
| `FIELD_TO_SLOT` is text-only | `connectLayout.ts:37` — no image slots, so no headshot/logo/QR |
| Only 3 layout templates | `lib/layout/templates.ts` — `left-scrim-hero`, `bottom-band`, `corner-card` |
| Palette hardcoded | `DEFAULT_PALETTE`, flagged in-code as "a later story" |
| No brand kit persistence | no `brandKit` model anywhere in `client/` or `api/` |

---

## 5. Recommended next move (independent of the above)

**Brand assets as real layers.** It is the clear win on either path: the elements are ours, the AI
never renders them, and adding them competes with nothing. It also converts several rows of the
Lovart comparison from aspiration into shipped behaviour.

Extraction stays the default for text — it works, it is cached, and it handles uploaded designs,
which compose-forward never will.
