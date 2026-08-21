# Sample Template Photo Prompts — Missing Format Coverage

> **Context:** 5 sample templates exist today (Premium Listing — Story, Luxury Home Showcase, Open
> House Flyer, Market Report — Email Header, MLS Listing Sheet), covering 5 of the 23 formats in
> `client/src/lib/formatTaxonomy.ts`. This file provides the photo prompts needed to cover the
> other 18 — generated externally (e.g. Gemini free tier) since this doesn't need Ideogram's
> API-integration path, just static images dropped into `client/public/template-assets/`.
>
> **Strategy:** a small reusable photo library, not one photo per format — real estate photos crop
> cleanly across formats via `objectFit: cover` (already set on every image element in this app's
> canvas renderer), so the same photo serves multiple templates at different aspect ratios.

---

## Formats needing NO new photo (3)

These are text/logo/contact-driven by convention (real yard signs, business cards, and door
hangers are typically bold text + branding, not a property photo). Reuse what's already in
`client/public/template-assets/`: `logo-placeholder.svg` + one of `agent-1.jpg` / `agent-2.jpg` /
`agent-3.jpg`.

| Format | Dimensions | Notes |
|---|---|---|
| Business Card | 1050×600 landscape | Agent photo + logo + contact info |
| Yard Sign | 1800×1350 landscape | "FOR SALE" text + logo, no photo |
| Door Hanger | 1275×3300 portrait | Mostly text/contact; photo optional, skip for v1 |

---

## Already-generated photos being reused (3)

No new generation needed — these already exist and cover several more formats via crop:

| File | Orientation | Reused for |
|---|---|---|
| `ps-hero.jpg` | Portrait (9:16) | Listing Story, Facebook Story, WhatsApp Status, Instagram Reel Cover |
| `oh-hero.jpg` | Landscape (16:9) | Postcard, Facebook Cover |
| `ml-gallery.jpg` | Landscape (16:9, kitchen interior) | Interior variety wherever a second image is wanted |

---

## New photos to generate (7) — the actual prompt list

Each prompt below is written the same way the Ideogram prompts were: literal, specific,
photorealistic, explicitly no people/text/watermark unless noted. Pick the closest aspect ratio
option in whatever tool you use; exact pixels don't matter, cropping handles the rest.

### 1. `warm-daytime-square.jpg` — Square (1:1)
```
Inviting single-family home exterior, bright clear daytime, warm natural light, green manicured
lawn, welcoming curb appeal, professional real estate photography, centered composition with open
sky space at top for text overlay, no people, no text, no watermark
```
**Used by:** Open House (For you), WhatsApp Business Post, Facebook Post

### 2. `celebratory-sold-square.jpg` — Square (1:1)
```
Charming single-family home exterior, bright cheerful daytime lighting, tidy front lawn, diagonal
open sky area in upper-right corner reserved for a "SOLD" banner overlay, professional real estate
photography, celebratory warm tone, no people, no text, no watermark
```
**Used by:** Just Sold (For you)

### 3. `professional-market-square.jpg` — Square (1:1)
```
Clean modern suburban neighborhood street view at golden hour, well-maintained homes, professional
architectural photography, polished and credible tone suitable for market data context, no people,
no text, no watermark
```
**Used by:** LinkedIn Post

### 4. `twilight-cover-landscape.jpg` — Landscape (16:9 or wider)
```
Upscale modern house exterior at dusk, warm interior lights glowing through windows, dramatic
twilight sky, premium architectural photography, wide horizontal composition, no people, no text,
no watermark
```
**Used by:** Facebook Cover (alt to `oh-hero.jpg` if a more premium tone is wanted)

### 5. `bright-living-room.jpg` — Landscape (16:9 or 4:3)
```
Bright modern living room interior, large windows with natural daylight, neutral tasteful
furnishings, clean staged real estate interior photography, no people, no text, no watermark
```
**Used by:** Just Listed (For you), Property Flyer (For you) — interior variety alongside exterior heroes

### 6. `luxury-portrait-alt.jpg` — Portrait (9:16)
```
Contemporary luxury home exterior, blue-hour lighting, glass and clean architectural lines,
aspirational upscale real estate photography, vertical composition, no people, no text, no
watermark
```
**Used by:** Instagram Reel Cover (as a visual alternate to reusing `ps-hero.jpg` if you want variety
rather than exact reuse)

### 7. `neighborhood-community.jpg` — Landscape (16:9)
```
Aerial-style view of a well-maintained suburban neighborhood at golden hour, tree-lined street,
sense of community and desirability, professional real estate photography, no people, no text, no
watermark
```
**Used by:** Market Report (For you) — as a background/context image if a photo is wanted instead of
the existing data-card-only approach

---

## Full mapping — all 18 missing formats accounted for

| Format | Platform | Dimensions | Photo source |
|---|---|---|---|
| Just Listed | For you | 1080×1350 portrait | `bright-living-room.jpg` (+ existing exterior heroes) |
| Open House | For you | 1080×1080 square | `warm-daytime-square.jpg` |
| Just Sold | For you | 1080×1080 square | `celebratory-sold-square.jpg` |
| Listing Story | For you | 1080×1920 portrait | `ps-hero.jpg` (reuse) |
| Property Flyer | For you | 1240×1754 portrait | Same dims as existing Feature Sheet — consider reusing MLS Listing Sheet's layout+photos entirely rather than new assets |
| Market Report | For you | 1080×1350 portrait | `neighborhood-community.jpg` (optional; existing template's data-card-only approach also works without a photo) |
| Instagram Reel Cover | Instagram | 1080×1920 portrait | `ps-hero.jpg` (reuse) or `luxury-portrait-alt.jpg` for variety |
| Facebook Post | Facebook | 1200×1200 square | `warm-daytime-square.jpg` |
| Facebook Cover | Facebook | 1200×628 landscape | `oh-hero.jpg` (reuse) or `twilight-cover-landscape.jpg` |
| Facebook Story | Facebook | 1080×1920 portrait | `ps-hero.jpg` (reuse) |
| WhatsApp Status | WhatsApp | 1080×1920 portrait | `ps-hero.jpg` (reuse) |
| WhatsApp Business Post | WhatsApp | 1080×1080 square | `warm-daytime-square.jpg` |
| Postcard | Printables | 1800×1200 landscape | `oh-hero.jpg` (reuse) |
| Open House Sign | Printables | 1200×1800 portrait | `warm-daytime-square.jpg` cropped, or `luxury-portrait-alt.jpg` |
| Yard Sign | Printables | 1800×1350 landscape | none — text/logo only |
| Door Hanger | Printables | 1275×3300 portrait | none — text/logo only (v1) |
| Business Card | Printables | 1050×600 landscape | none — agent photo + logo only |
| LinkedIn Post | Other | 1200×1200 square | `professional-market-square.jpg` |

---

## Once you have the files

Drop them into `client/public/template-assets/`, then extend
`api/scripts/update-template-images.ts`'s mapping the same way it's already structured — this time
you'll also need to actually build each new template's canvas layout (element positions, text
slots) before these photos have anywhere to go. That's a separate, larger piece of work than the
photo sourcing itself; happy to scope that as a proper story when you're ready.

---

*Written: 2026-08-20*
