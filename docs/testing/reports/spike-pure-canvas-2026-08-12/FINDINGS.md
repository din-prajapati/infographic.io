# SPIKE — Pure canvas: never re-diffuse the photograph

> **Date:** 2026-08-12 · **Cost:** ~$0.06 (one Ideogram call, for the A2 test only)
> **Follows:** [OQ-2 findings](../oq2-image-weight-2026-08-12/FINDINGS.md) — remix cannot deliver fidelity and design
> **Verdict:** ✅ **Viable.** The photograph never enters a diffusion model; design and text are native canvas objects.

---

## The question

OQ-2 proved remix cannot preserve the property *and* compose a design. If the model must not touch the photo, where does the design come from? Two candidates:

- **A1** — an LLM emits a structured layout spec (panel rects, palette, type scale); our canvas renders it natively
- **A2** — the image model generates a design *frame* as a raster (no property imagery); we composite it over the photo

---

## Test 1 — will the model produce design furniture without fabricating a property? ✅ Yes

Prompted `/v1/ideogram-v4/generate` for an overlay frame: a navy left panel, a gold rule, a bottom bar, a circle outline, and an explicit instruction that the centre and right must be flat white and empty — no photograph, building, room, furniture, people or faces, and no text of any kind.

**Result:** [`01-design-frame-no-photo.png`](./01-design-frame-no-photo.png) — exactly that. **Zero fabrication.** No invented house, no synthetic face, no phantom phone number. Constrained to design furniture, the model complies precisely.

This is a genuinely useful finding: the fabrication documented in OQ-2 is **not inherent to the model**, it is what happens when the model is asked to depict a property.

### But it argues against A2

What came back was a rectangle, a line, a bar and a circle. Our canvas draws those natively, for free, in milliseconds — **as real objects rather than a flat raster**. A2 costs $0.06 per generation to obtain shapes we can render for nothing, delivers them un-editable, and returns them on an opaque white field (not transparent), so compositing would additionally require masking.

**A2 is technically viable and economically pointless.** Rejected.

---

## Test 2 — A1 composite ✅ Shippable

[`02-a1-composite.png`](./02-a1-composite.png) — the real Shela hall photograph, untouched, with design and copy rendered as native objects over it. Source markup: [`a1-composite.html`](./a1-composite.html).

**Nine independently editable layers:**

```
photo · scrim · badge · head · rule · price · addr · agent · stats
```

| Property | Result |
|---|---|
| Property fidelity | ✅ **Pixel-exact.** It is the original file. Fidelity is not "high", it is *identity*. |
| Text correctness | ✅ **Exact by construction.** We typeset it; no model rendered a glyph. |
| Editability | ✅ Nine real objects. Editable *by default* — it was never a raster. |
| Fabrication risk | ✅ **Zero.** No model draws a house, a face or a phone number. |
| Image-model cost | **$0.00** |

Against the OQ-2 `w=30` output — which remains the visual quality bar — this is less lavish. But that card depicted a **different building, a person who does not exist, and an invented phone number**. This one depicts the actual listing.

### Known flaw

The gold `FOR SALE` badge sits over a bright wall and reads poorly. This is exactly the class of problem a layout planner must own: badges belong over the scrim, or contrast must be computed against the underlying photo region. Worth an explicit AC — *every text run must meet a contrast ratio against the pixels beneath it*, which is checkable programmatically and is something neither remix nor a human template guarantees.

---

## Economics

| Approach | Image-model cost / generation | TEAM at cap (200/mo) |
|---|---|---|
| Current V4 generate (3 variations) | $0.18 | ~$36/mo |
| Remix (OQ-2, rejected) | $0.18 | ~$36/mo |
| Remix + layerize | $0.15–0.45 | ~$30–90/mo |
| **A1 pure canvas** | **$0.00** *(LLM layout spec only, ~$0.004)* | **< $1/mo** |

Provider spend on the critical path effectively disappears. The remaining cost is one LLM call to author the layout.

---

## What this changes

**Reframes the product** from *AI image generation* to **AI art-directed template generation**. The model decides layout, palette, hierarchy and typography; the canvas renders deterministically. Ideogram's role shrinks from "produces the artifact" to "optional decorative enrichment" — or disappears.

| Artifact | Effect |
|---|---|
| **US-AI-031** | Mechanism replaced. Photo becomes a canvas layer; remix is dropped. Needs rewrite. |
| **US-AI-031b** | **Largely obsolete.** Layer extraction existed to recover geometry from a raster. Under A1 we *authored* the geometry — there is nothing to recover. The block→field mapper may survive for imported/legacy designs only. |
| **US-AI-032** | **Strengthened.** Editable canvas is now the primary output path, not a post-process. |
| **US-AI-033** (B-18) | Risk drops to near zero on the generation path — no model depicts property or people. |
| **M-AI-17 / M-AI-18** | Both need re-scoping against this pipeline. |

> ⚠️ US-AI-031b is implemented, tested (19 passing cases) and merged on `feat/ai/m-17-real-photo-background`. Do **not** delete it reflexively — the adapter seam and the pure mapper are provider-free and may serve the "import an existing flat design" case. But it is no longer on the critical path.

---

---

## Test 3 — LLM layout planner ⚠️ Works mechanically, fails at pixel placement

Two GPT-4o vision runs against the same photo and listing data, ~$0.01 each. Full specs and renders committed alongside.

### What the LLM does well

It genuinely reasons about the image. Unprompted, v1 returned:

> *"The photo's visual subject is the seating area and stairs, so the scrim is placed on the left."*

That is correct, and it is the part that seemed hardest. Both runs produced valid, renderable specs with all 7 slots present exactly once, correct listing data, and 10–11 editable layers.

### What it cannot do

| Run | Type scale | Outcome | Evidence |
|---|---|---|---|
| **v1** — free composition | Far too small | Everything stacked in the top-left ~400px; huge dead zone across the scrim; text hugging the canvas edge | [`03-planner-v1-free.png`](./03-planner-v1-free.png) |
| **v2** — hard constraints on margins, type scale, vertical rhythm | Correct | **Headline and price render on top of each other — illegible** | [`04-planner-v2-constrained.png`](./04-planner-v2-constrained.png) |

**Root cause: the LLM cannot measure text.** v2 assigned the price an absolute `y` without knowing that a 120px headline at `maxWidth:800` wraps to two lines and occupies ~260px. It has no font metrics, so absolute-coordinate layout is guesswork that sometimes lands.

Adding constraints did not help because the deficiency is not judgment, it is **measurement**. No prompt fixes that — the information simply is not available to the model.

### Consequence for the design

**The planner must not emit coordinates.** It should emit *intent*:

```json
{ "template": "left-scrim-hero", "scrimSide": "left",
  "palette": { ... }, "emphasis": "price" }
```

…and the **renderer** measures and flows the text, exactly as any layout engine does. Choosing and parameterising a template is a task LLMs are reliably good at; placing pixels is not.

This also answers open question 4 empirically rather than by preference: **curated templates, parameterised by the LLM — not free composition.** It makes the planner cheaper, more predictable, and removes the entire class of overlap/overflow bugs.

---

## Open questions for the next spike

1. **~~Can an LLM author the layout spec?~~** ✅ Answered — yes for *intent*, no for *coordinates*. See Test 3.
2. **How many templates, and what parameterises them?** Needs a small curated set (3–5) with named regions and a flow renderer.
3. **What is the spec schema?** `ComposedTextElement` from US-AI-031b models slot + geometry + style — but geometry should now be renderer *output*, not planner input.
4. **Contrast safety** — computing text contrast against underlying photo pixels, per the badge flaw above. Both planner runs also placed text over busy photo regions with weak contrast, so this must be enforced by the renderer, not requested in a prompt.
5. **Does the image model retain any role** — decorative textures, or background extension for awkward aspect ratios (reframe is cheap and does not fabricate)?
6. **No-photo mode** — when no real photograph is supplied, the background layer is AI-generated imagery *with no text baked in*, and the same planner and renderer run unchanged. The user can later swap that background for a real photo. Both modes therefore emit `background + design + text` and differ only in the background's origin.

---

*Third-party listing photo used for testing only; not a product asset.*
