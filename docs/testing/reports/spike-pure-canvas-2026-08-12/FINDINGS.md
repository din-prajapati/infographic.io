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

## Open questions for the next spike

1. **Can an LLM reliably author the layout spec?** This composite was hand-authored to prove the rendering path. The unproven half is GPT-4o emitting good `{panels, type scale, palette}` — including picking a scrim side that suits the photo's composition.
2. **What is the spec schema?** `ComposedTextElement` from US-AI-031b already models slot + geometry + style; it may be most of the answer.
3. **Contrast safety** — computing text contrast against underlying photo pixels, per the badge flaw above.
4. **How many templates?** Does the LLM compose freely, or select and parameterise from a curated set? The latter is more predictable and likely better-looking.
5. **Does the image model retain any role** — decorative textures, background extension for awkward aspect ratios (reframe is cheap and does not fabricate)?

---

*Third-party listing photo used for testing only; not a product asset.*
