# SPIKE-031 — Which Ideogram capability puts the agent's real listing photo in the output

> **For:** [US-AI-031](stories/US-AI-031/STORY.md) · **Epic:** [EPIC-AI-06](EPIC.md) · **Milestone:** M-AI-17
> **Type:** Research spike — read-only. No application code written.
> **Run:** 2026-08-11 · **Constraint:** Ideogram account out of credit (see [US-AI-010 OPEN VERIFICATION](../EPIC-AI-02/stories/US-AI-010/STORY.md)) — **zero live generations were made.** Everything below is from primary Ideogram documentation + repo code reading.

---

## 1. Recommendation

**Use `POST https://api.ideogram.ai/v1/ideogram-v3/remix` with the uploaded listing photo as the `image` parameter, `magic_prompt=OFF`, `style_type=DESIGN`, and a high `image_weight`.** This is the only capability that both reproduces the actual photo (not a lookalike) and keeps a documented `magic_prompt=OFF` switch, which is the exact mechanism this codebase already relies on for verbatim text rendering — and it is priced at the same per-image tier as today's generate call, so photo-backed generation costs **no more than the current pipeline**.

Reject Instructional Edit (`/v1/edit`, $0.20 flat): at the default 3 variations per generation it costs $0.60/generation, which is **gross-margin negative on SOLO, TEAM and BROKERAGE**. Reject the current `style_reference_images` wiring: it transfers palette and mood, never the subject, and is not even a documented parameter on the V4 generate endpoint the code sends it to.

**Two consequences that must be actioned before TASKS.md is written:**
- **AC2 as drafted is not implementable.** No Ideogram endpoint accepts both `json_prompt` and an input image. AC2 must be rewritten.
- **AC3 as drafted is not satisfiable on any image-conditioned path.** `verifyAndRepairV4JsonPrompt` operates on a `json_prompt`; the recommended path has none. AC3 must be re-expressed as an outcome, not as a function call. See §4 — this is the make-or-break and it reshapes US-AI-032.

---

## 2. Options compared

Per-call cost is per **output image**. This pipeline generates **3 variations by default** (`api/src/modules/infographics/services/generations.service.ts:192` — `dto.variations || 3`), so per-*generation* cost is 3× the per-call figure. Per CLAUDE.md metering policy each generation still writes `creditsUsed: 1`; `costUsd` is true provider spend.

| # | Capability | Endpoint | Cost / output image | Satisfies AC1 (real photo visible)? | Preserves AC3 (`verifyAndRepairV4JsonPrompt` on `json_prompt`)? | Confidence + source |
|---|---|---|---|---|---|---|
| 0 | **Today: V4 generate + `style_reference_images`** | `POST /v1/ideogram-v4/generate` | $0.03 / $0.06 / $0.10 (turbo/default/quality) | **No — and the parameter is not documented on this endpoint at all.** V4 generate's documented params are `text_prompt`, `json_prompt`, `resolution`, `rendering_speed`, `enable_copyright_detection`. Nothing else. | Yes (this is the current path) | High for the param list, [generate-v4](https://developer.ideogram.ai/api-reference/api-reference/generate-v4). Whether the extra multipart field 400s or is silently dropped is **unconfirmed** — needs one live call |
| 1 | **Today's fallback: V3 generate + `style_reference_images`** | `POST /v1/ideogram-v3/generate` | $0.03–$0.09 | **No.** Style Reference transfers "colors, mood, texture" — an "aesthetic template for new creations", explicitly contrasted with Remix which "preserves structure" | N/A — text path, no `json_prompt` | High, [style-reference](https://docs.ideogram.ai/using-ideogram/features-and-tools/reference-features/style-reference), [generate-v3](https://developer.ideogram.ai/api-reference/api-reference/generate-v3) |
| 2 | **✅ V3 Remix** *(recommended)* | `POST /v1/ideogram-v3/remix` | $0.03 flash/turbo · $0.06 default · $0.09 quality — "priced per output image, same rates as Generate" | **Yes.** `image` is the source; `image_weight` = "how strongly the output should resemble the input image. Higher values keep the input image's structure" | **No `json_prompt`** — but keeps `magic_prompt` (OFF) + `style_type=DESIGN`, i.e. the verbatim-text mechanism already used at `ideogram.service.ts:116` | High, [remix-v3](https://developer.ideogram.ai/api-reference/api-reference/remix-v3), [api-pricing](https://ideogram.ai/api-pricing/) |
| 3 | V4 Remix | `POST /v1/ideogram-v4/remix` | $0.03 / $0.06 / $0.10 | **Yes**, same mechanism as #2 | No `json_prompt`. **And no documented `magic_prompt` param** — documented body is `image`, `text_prompt`, `image_weight`, `rendering_speed`, `resolution`. Per V4 generate's own doc, `text_prompt` implies magic-prompt ON → prompt gets rewritten → exact text at risk with no repair hook | Endpoint: high, [remix-v4](https://developer.ideogram.ai/api-reference/api-reference/remix-v4), [api-remix](https://ideogram.ai/api-remix/). Magic-prompt-forced-ON is **inferred, unconfirmed** |
| 4 | Instructional Edit | `POST /v1/edit` | **$0.20 flat** | **Yes — highest fidelity.** Maskless, natural-language edit; accepts up to **10** `images` plus `image_urls` from prior generations | No `json_prompt`. Params: `prompt`, `images`, `image_urls`, `num_images`, `seed`, `magic_prompt`, `resolution`, `aspect_ratio`, `transparent_background` | High, [edit-with-prompt](https://developer.ideogram.ai/api-reference/api-reference/edit-with-prompt), [api-pricing](https://ideogram.ai/api-pricing/) |
| 5 | Two-call: V4 `json_prompt` generate → `/v1/edit` photo transplant | `/v1/ideogram-v4/generate` then `/v1/edit` | $0.06 + $0.20 = **$0.26** | Probably — but the edit re-renders, so text is re-diffused and likely reflows | **Nominally yes** (call 1 is unchanged), but the guarantee is destroyed by call 2 re-rendering the pixels the verification signed off on | Endpoints high; text survival through a diffusion edit is **unconfirmed and doubtful** |
| 6 | V4 Describe → inject into `json_prompt` background | `POST /v1/ideogram-v4/describe` | Describe $0.01–$0.015 + generate | **No — actively harmful.** Returns a `V4JsonPrompt` *describing* the photo, so V4 renders a **lookalike** house. That is precisely the liability EPIC-AI-06 and US-AI-033 exist to eliminate | Yes | High, [describe-v4](https://developer.ideogram.ai/api-reference/api-reference/describe-v4) |
| 7 | Replace Background | `POST /v1/ideogram-v3/replace-background` | $0.03–$0.10 | **No — wrong direction.** Keeps the foreground *subject* and regenerates the background. We want the opposite | No | High, [replace-background-v3](https://developer.ideogram.ai/api-reference/api-reference/replace-background-v3) |
| 8 | Reframe *(supporting, not primary)* | `POST /v1/ideogram-v3/reframe` | $0.03–$0.10 | Aspect-ratio helper only — outpaints the photo to a target resolution, preserving original content | N/A | High, [reframe-v3](https://developer.ideogram.ai/api-reference/api-reference/reframe-v3) |
| 9 | Layerize Text *(not for 031 — see §4/US-AI-032)* | `POST /v1/ideogram-v3/layerize-text` | **$0.09 per input**; "Generate + Layerize $0.12–$0.18" | N/A | **Makes AC3 moot** — returns `base_image_url` (text erased) + `text_blocks[]` with `text`, `role`, `x/y/width/height/angle`, `font_name`, `font_size`, `line_height`, `alignment`, `color`, `formatting` | High, [layerize-text-v3](https://developer.ideogram.ai/api-reference/api-reference/layerize-text-v3), [api-pricing](https://ideogram.ai/api-pricing/) |

**Tiebreaker, #2 vs #3.** The two are functionally identical and identically priced. V4 has the better text-rendering baseline, but V3 Remix has a documented `magic_prompt=OFF` switch and `style_type=DESIGN`; V4 Remix documents neither. Every exact-text guarantee this codebase has ever shipped rests on "magic prompt off, prompt rendered verbatim" (`ideogram.service.ts:116`, `infographic-prompt.builder.ts` header comment, and the orchestrator's V3 fallback at `ai-orchestrator.service.ts:183`). Control over the text beats a better default renderer. **V3 Remix wins on determinism.** If a live test shows V4 Remix honours a verbatim prompt (or exposes `magic_prompt`), switching is a one-constant change — logged as OQ-3 in §7.

---

## 3. Why the current code cannot satisfy AC1

Two independent, compounding reasons. Both are code facts, not opinions.

**(a) `style_reference_images` is the wrong primitive, by design.** Ideogram's own docs draw the line explicitly: Style Reference is "an aesthetic template for new creations" — colors, mood, texture — while Remix "refresh[es] existing images while preserving their structure." AC1 requires the output to be *recognizably that house*. Structure preservation is the whole requirement, and style reference is definitionally not that. No `image_weight`, no composition transfer. There is no parameterisation of `style_reference_images` that makes the agent's actual building appear. **US-AI-010's wiring is necessary-but-insufficient**: it correctly moved the file from the browser to the Ideogram request boundary, and that plumbing is reusable verbatim. It attached it to the wrong parameter of the wrong endpoint.

**(b) On the V4 path — the default path — the field is probably a no-op.** `normalizeImageModel()` (`image-generation.config.ts:36`) returns `ideogram-4` for everything unrecognised, so production traffic lands in `generateImageV4()`. That method appends `style_reference_images` to the `/v1/ideogram-v4/generate` multipart body at `ideogram.service.ts:245`. The documented parameter set for that endpoint is `text_prompt`, `json_prompt`, `resolution`, `rendering_speed`, `enable_copyright_detection` — reference images are not among them. The code's own comment concedes this ("best-effort — V4 support TBD"). So today, on the default model, the uploaded photo most likely never influences the output at all. The V3 fallback at `ideogram.service.ts:128` does send it to a documented parameter — where it correctly does style transfer, which still is not AC1.

**(c) The failure is silent.** Both attach sites `catch` a missing file and log a warning, then proceed (`ideogram.service.ts:130-133` and `247-249`). A generation with a lost photo produces a fabricated house and reports success. That is the exact behaviour AC6 forbids, and it is live today.

This also supplies a cheaper hypothesis for the still-open TC-AI-010-02 failure than "Ideogram rejected the 1×1 PNG": on the V4 endpoint an unexpected multipart field may 400 the whole request regardless of the image's validity. Both hypotheses need the same single live call to separate. Photos are stored under `os.tmpdir()/ai-infographic-uploads` (`infographics.controller.ts:16`), which is process- and host-ephemeral — on Railway a redeploy between upload and generate loses the file, giving a third candidate cause.

---

## 4. AC3 regression risk — say it loudly

**The recommended path forecloses `json_prompt`. This is structural, not a limitation of our implementation.** Every image-conditioned endpoint Ideogram publishes — V3 Remix, V4 Remix, `/v1/edit`, Replace Background, Reframe — takes a **text** prompt. The only two endpoints that take `json_prompt` are `/v1/ideogram-v4/generate` and `/v1/ideogram-v4/magic-prompt`, and neither accepts an input image. There is no combination that gives you both.

Therefore `verifyAndRepairV4JsonPrompt()` **cannot run** on a photo-backed generation. AC3 as written ("`verifyAndRepairV4JsonPrompt` still passes on photo-backed generations") is unsatisfiable by construction and must be rewritten. Proposed split:

- **AC3a (regression, mechanical):** the no-photo path is untouched — V4 magic-prompt → `verifyAndRepairV4JsonPrompt` → V4 generate, byte-identical behaviour. Its unit tests (`api/tests/ai-generation/infographic-prompt.builder.spec.ts`) are pure-function tests and remain green regardless. This is cheap and should be asserted.
- **AC3b (outcome, the real criterion):** on a photo-backed generation, every string from `buildExpectedTexts()` — headline, address, price, stats, agent, brokerage — renders exactly and legibly. Verified **manually against the rendered image**, because no programmatic hook exists on the remix path.

**Confidence that AC3b holds:** moderate, not high. The V3 verbatim-text path with `magic_prompt=OFF` + `style_type=DESIGN` is described in this repo as "production-proven" for clean text. What is genuinely new is doing it *while* a high `image_weight` pulls the composition toward a photograph — the model must overlay legible typography on top of image structure it is being told to preserve. Nobody has evidence either way. **This is the single largest unknown in US-AI-031 and it needs a live generation to settle (OQ-1).**

### What this means for US-AI-032 — a design-changing finding

`POST /v1/ideogram-v3/layerize-text` ($0.09/input) takes a finished flat design and returns a **text-erased base image** plus `text_blocks[]` carrying, per block: `text`, `role` (e.g. "heading"), `x`, `y`, `width`, `height`, `angle`, `font_name`, `font_alternatives`, `font_size`, `line_height`, `alignment`, `color`, `formatting`.

US-AI-032 currently proposes deriving canvas slot placement from "the V4 json_prompt element descriptions" (AC2). Layerize gives **measured positions from the rendered pixels** instead of predicted positions from the pre-render JSON — strictly better data, and it works on remix output, which has no `json_prompt` to read. US-AI-032's AC1 ("background with NO text baked in") is literally what `base_image_url` returns.

**And it dissolves the AC3 problem entirely.** If the pipeline is `remix (real photo + design) → layerize → re-render text as canvas slots we control`, then exact text stops being something we hope the diffusion model gets right and becomes something we typeset ourselves. The remix call only has to produce good *layout and background*; the text can be imperfect because we replace it.

Caveat: layerize is **beta** and "works best with clear, straight text in standard typography. Curved, highly stylized, decorative, or graphic-embedded text may not be detected." Recovery of a stylised luxury-listing headline is not guaranteed. US-AI-032 should be re-specified against layerize-text with a json_prompt-derived fallback, not the reverse.

**Sequencing implication:** US-AI-031's exact-text risk (AC3b) is retired by US-AI-032. Consider landing 031 as "real photo, text quality accepted as-is", and treating AC3b as a *known-risk* rather than a hard gate, with 032 as the fix. Product-owner decision, flagged not taken.

---

## 5. Cost impact per plan tier

Monthly provider spend if a seat generates to its cap and **every** generation is photo-backed. Uses today's default of **3 variations per generation**. Revenue converted at ≈₹88/USD (approximate — plan prices are INR-native in `shared/schema.ts:160-192`).

| Path | $/image | $/generation (×3 var) | FREE 3/mo (₹0) | SOLO 50/mo (₹2,999 ≈ $34) | TEAM 200/mo (₹6,999 ≈ $80) | BROKERAGE 1000/mo (₹24,999 ≈ $284) |
|---|---|---|---|---|---|---|
| **Today (V4 default, no working photo)** | $0.06 | $0.18 | $0.54 | $9.00 (26% of rev) | $36.00 (45%) | $180.00 (63%) |
| **✅ V3 Remix default (recommended)** | $0.06 | $0.18 | $0.54 | $9.00 (26%) | **$36.00 (45%)** | $180.00 (63%) |
| ✅ V3 Remix turbo/flash | $0.03 | $0.09 | $0.27 | $4.50 (13%) | $18.00 (23%) | $90.00 (32%) |
| **✅ V3 Remix default, variations = 1** | $0.06 | **$0.06** | $0.18 | $3.00 (9%) | **$12.00 (15%)** | $60.00 (21%) |
| V4 Remix default | $0.06 | $0.18 | $0.54 | $9.00 | $36.00 | $180.00 |
| ❌ Instructional Edit `/v1/edit` | $0.20 | $0.60 | $1.80 | $30.00 (**88%**) | $120.00 (**150% — negative**) | $600.00 (**211% — negative**) |
| ❌ Two-call (V4 gen + `/v1/edit`) | $0.26 | $0.78 | $2.34 | $39.00 (**115%**) | $156.00 (**195%**) | $780.00 (**275%**) |
| ➕ Remix + Layerize (US-AI-032, 1 var) | $0.06 + $0.09 | $0.15 | $0.45 | $7.50 (22%) | $30.00 (38%) | $150.00 (53%) |

**Readings:**

1. **The recommended path is cost-neutral.** Remix is priced at generate rates, so switching a photo-backed generation from V4 generate to V3 Remix moves provider spend by $0.00. AC5's "reference/edit pricing differs from plain generate" turns out to be false for remix — that finding itself belongs in `ai-models.config.ts` with the source URL.
2. **Instructional Edit is disqualified on economics alone.** At TEAM it costs 1.5× the plan's entire revenue for a single seat at cap. Even the FREE tier leaks $1.80/signup. It stays on the shelf as a possible premium/one-off "perfect fidelity" upsell, never as the default.
3. **The biggest margin lever is variations, not endpoint choice.** Today's `variations || 3` triples every figure in this table. Photo-backed generations pin the background, so the three variations differ only in typographic styling — far less value than they deliver today, at exactly 3× the cost. **Defaulting photo mode to 1 variation cuts TEAM's worst case from $36 to $12/mo** — a bigger saving than any endpoint decision on this page.
4. **BROKERAGE is the exposure, not TEAM.** At 63% of revenue on provider cost at cap before any other COGS, BROKERAGE is the tier that breaks first. Combining flash rendering speed with variations=1 brings it to ~$30/mo (11%), which is healthy.

---

## 6. Files that will need to change

Repo-relative. This is the candidate file list for `US-AI-031/TASKS.md`.

| # | File | Why |
|---|---|---|
| 1 | `api/src/modules/ai-generation/services/ideogram.service.ts` | **Core.** Add `IDEOGRAM_V3_REMIX_URL = 'https://api.ideogram.ai/v1/ideogram-v3/remix'`. Add `remixImageWithPhoto(prompt, photoPath, model, orientation, generationId)` sending multipart `image` + `prompt` + `magic_prompt=OFF` + `style_type=DESIGN` + `aspect_ratio` + `rendering_speed` + `image_weight`. Extract the duplicated photo-read blocks (lines 122-134, 239-250) into one private helper that **throws** on unreadable file (AC6) instead of warn-and-continue. **Delete** the `style_reference_images` append in `generateImageV4` (lines 239-250) — undocumented on that endpoint (§3b). |
| 2 | `api/src/modules/ai-generation/services/ai-orchestrator.service.ts` | Branch at the STEP-3/STEP-4 boundary (lines ~142-191): `photoReference` present → skip V4 magic-prompt entirely, call `remixImageWithPhoto` per variation; absent → existing V4 `json_prompt` path **byte-identical** (AC4/AC3a). Photo-path errors must propagate, not fall back to a fabricated background (AC6) — note the existing `catch` at line 201 currently converts everything to a generic message. Cost accounting at line 209 must use the remix model key. |
| 3 | `api/src/config/ai-models.config.ts` | **AC5.** Add remix cost entries and a documented note that Remix/Edit/Reframe/Replace-Background are priced *at generate tier* per <https://ideogram.ai/api-pricing/>, and that Instructional Edit is $0.20 flat and deliberately not used. Same evidence style as the existing `V4_MAGIC_PROMPT_COST` comment. |
| 4 | `api/src/config/image-generation.config.ts` | Map the user's model choice → remix `rendering_speed` (TURBO/DEFAULT/QUALITY) and keep `orientationToIdeogramAspectV3` for the remix `aspect_ratio`. Add an `image_weight` constant with a comment recording the value chosen from live testing. |
| 5 | `api/src/modules/infographics/services/generations.service.ts` | Line 192 `variations: dto.variations || 3` — apply a photo-mode default of 1 (§5 lever 3). Confirm `photoReference` threading. |
| 6 | `api/src/modules/infographics/dto/generate-from-chat.dto.ts` | Verify `photoReference` shape and validation; likely no change. |
| 7 | `api/src/modules/infographics/controllers/infographics.controller.ts` | `PHOTO_UPLOADS_DIR` is `os.tmpdir()` (line 16) — process/host-ephemeral. Add existence validation so a lost photo produces a clear 4xx at generate time rather than a silent fabrication (AC6). |
| 8 | `client/src/components/ai-chat/AIChatBox.tsx` | AC6 error routing. US-AI-010 TC-02 recorded photo/generation errors being mis-routed through `isValidationError` → "Missing Information" instead of a generation error. AC6 cannot pass until `handleGenerationFailed` distinguishes them. |
| 9 | `api/tests/ai-generation/` (new spec) | Mock-based: photoReference present → remix branch selected and V4 magic-prompt **not** called; absent → V4 json_prompt branch unchanged; unreadable photo → throws, no image call; cost mapping resolves to the remix rate. |
| 10 | `docs/agile/epics/phase-1-ai-core/EPIC-AI-06/stories/US-AI-031/STORY.md` | **Blocking prerequisite.** Rewrite AC2 (no endpoint accepts `json_prompt` + image) and split AC3 into AC3a/AC3b per §4. TASKS.md must not be written against the current AC text. |
| 11 | `docs/agile/epics/phase-1-ai-core/EPIC-AI-06/stories/US-AI-032/STORY.md` | Re-specify AC1/AC2 against `/v1/ideogram-v3/layerize-text` (measured positions) with json_prompt-derived placement as fallback (§4). |
| 12 | `e2e/us-ai-010-photo-upload.spec.ts` | Swap the 1×1 px PNG fixture for a real listing photo from `public/assets/` — required to unblock TC-AI-010-02 and to test either failure hypothesis in §3c. |

---

## 7. Open questions — settleable only by a live generation

All gated on the Ideogram credit top-up. Each is a verification task, with its cost.

| ID | Question | How to settle | Cost | Blocks |
|---|---|---|---|---|
| **OQ-1** | **Does V3 Remix render our exact text legibly while `image_weight` is high?** The make-or-break for AC3b. | One remix call: real listing photo + `buildImagePrompt()` output, `magic_prompt=OFF`, `style_type=DESIGN`, `image_weight=75`. Read every string off the image against `buildExpectedTexts()`. | ~$0.06 | AC3b |
| **OQ-2** | **What `image_weight` balances "recognizably that house" (AC1) against room for legible typography?** | Sweep 40 / 60 / 75 / 90 on one photo, same prompt. Pick the lowest weight where the building is still identifiable. Record the constant in `image-generation.config.ts`. | ~$0.24 | AC1, file #4 |
| **OQ-3** | **Does V4 Remix honour a verbatim prompt, or does `text_prompt` force magic-prompt ON and rewrite it?** If it renders verbatim, V4 wins on quality at identical cost. | Same prompt to `/v1/ideogram-v4/remix`; compare rendered text against the V3 result from OQ-1. | ~$0.06 | §2 tiebreaker |
| **OQ-4** | **Does the extra `style_reference_images` field 400 the V4 generate endpoint, or is it silently ignored?** Separates the two competing root causes for TC-AI-010-02 (§3c) and confirms file #1's deletion is safe. | One `/v1/ideogram-v4/generate` call with the stray field, one without. Compare HTTP status. | ~$0.12 | TC-AI-010-02, file #1 |
| **OQ-5** | **How badly does remix crop a landscape listing photo into 9:16 portrait?** Docs state input images are cropped to the chosen aspect ratio before remixing. A 3:2 house photo → 9:16 is a severe crop. | Remix one landscape photo at `9x16`. If the house is cut, price a `/v1/ideogram-v3/reframe` pre-step (+$0.03–0.06/generation) vs client-side smart crop. | ~$0.06 (+$0.06 if reframe tested) | AC1 on portrait formats |
| **OQ-6** | **Does `/v1/ideogram-v3/layerize-text` recover text from *our* stylised output?** Beta; docs warn decorative/graphic-embedded text may not be detected. Determines whether US-AI-032 can be built on it. | Layerize one finished infographic; check `text_blocks[]` against `buildExpectedTexts()` and inspect `base_image_url` for erasure artefacts. | ~$0.09 | US-AI-032 design |
| **OQ-7** | **Is 1 variation acceptable UX for photo mode?** Product question, but cheap to inform: with the background pinned, how different are 3 variations? | Generate 3 remix variations from one photo and look. | ~$0.18 | §5 lever 3, file #5 |

**Total to close every open question: ≈ $0.81.** Recommend running OQ-1, OQ-2 and OQ-4 first — they gate the AC rewrite and the TASKS.md file list. OQ-6 can run alongside US-AI-032's own spike.

---

## Sources

- [Ideogram API Pricing](https://ideogram.ai/api-pricing/)
- [API Overview](https://developer.ideogram.ai/ideogram-api/api-overview)
- [Generate with Ideogram 4.0](https://developer.ideogram.ai/api-reference/api-reference/generate-v4)
- [Remix with Ideogram 4.0](https://developer.ideogram.ai/api-reference/api-reference/remix-v4)
- [Remix with Ideogram 3.0](https://developer.ideogram.ai/api-reference/api-reference/remix-v3)
- [Edit images with a prompt (`/v1/edit`)](https://developer.ideogram.ai/api-reference/api-reference/edit-with-prompt)
- [Edit (legacy, mask-based)](https://developer.ideogram.ai/api-reference/api-reference/edit)
- [Replace Background with Ideogram 3.0](https://developer.ideogram.ai/api-reference/api-reference/replace-background-v3)
- [Reframe with Ideogram 3.0](https://developer.ideogram.ai/api-reference/api-reference/reframe-v3)
- [Layerize Text](https://developer.ideogram.ai/api-reference/api-reference/layerize-text-v3)
- [Describe with Ideogram 4.0](https://developer.ideogram.ai/api-reference/api-reference/describe-v4)
- [Style Reference (product docs)](https://docs.ideogram.ai/using-ideogram/features-and-tools/reference-features/style-reference)
- [Ideogram API capability overview](https://ideogram.ai/api-learn/)
- [Remix capability page](https://ideogram.ai/api-remix/)

---

*Spike run 2026-08-11. No live API calls were made — account out of credit. All API facts are from primary Ideogram documentation; all code facts are from the repository at `main`.*
