# Ideogram V4 Text-Quality Isolation Experiment — 2026-07-03

**Goal:** Identify why our app's V4 generations have garbled text while the same content pasted into the Ideogram web UI renders cleanly.

**Constant across all runs:** identical property data (headline "Sleek Contemporary Oasis", 123 Main St, $520K, 3 BED | 2 BATH, John Smith / RE/MAX Gold, charcoal-gold-white palette), resolution 2560x1440, endpoint `/v1/ideogram-v4/generate`.

| Run | Prompt source | Speed | Result |
|-----|--------------|-------|--------|
| E1 `E1-static-json_TURBO.png` | Our static `buildV4JsonPrompt()` output | TURBO | Specified text renders **correctly**; model invents extra filler panels full of garbled pseudo-text ("BISTHO", "SLUNDENERY", fake spec tables) |
| E2 `E2-static-json_DEFAULT.png` | Same static JSON | DEFAULT | Same failure — **more** invented garbled panels. Rendering speed is NOT the cause |
| E3 `E3-magicprompt-json_DEFAULT.png` | `magic-prompt-v4(textPrompt)` → JSON | DEFAULT | **Flawless.** Zero garbled text, professional editorial layout, exact strings, brand palette respected |
| E4 `E4-exact-text-override_DEFAULT.png` | E3 JSON + naive regex text override | DEFAULT | Near-flawless; one artifact — agent line duplicated ("John Smith, RE/MAX Gold" + "RE/MAX GOLD") because the override merged fields the conversion had split |

## Root cause (confirmed)

The garbled text does **not** come from our specified strings — those render correctly even at TURBO. It comes from the model **inventing filler content** to occupy space our sparse hand-built `json_prompt` leaves undescribed. The static JSON describes 5 text snippets and nothing else; V4 fills the void with plausible-looking infographic furniture containing pseudo-text.

## Why the reference flow wins (E3 converted JSON, see `E3-converted-json-prompt.json`)

`magic-prompt-v4` returns a fully *art-directed* composition:
- **obj elements first** — panels, hairline rules, accent marks, cards — the layout scaffolding our static JSON never declares, so nothing is left for the model to improvise
- **Exact hex colors** (#B8924A gold, #F2EDE4 off-white, #1A1A1A charcoal), opacity, alignment, font style per element
- Text split into semantic units (agent name and brokerage as separate elements, `\n` line breaks in headline)
- Descriptions are *visual specs*, not instructions ("Render every text element accurately" style imperatives are gone)
- Our exact strings were preserved faithfully by the conversion — no override was actually needed for this input

## Decision

Adopt: `buildImagePrompt(propertyData)` → `magic-prompt-v4` → **verify/repair** text elements against expected values (repair only on mismatch — not blanket regex replace, see E4 artifact) → `generate-v4` with model-mapped rendering_speed.

Latency cost: +1 API call (~2–4s) per generation. E1 took 10s, E2–E4 ~14s each.
