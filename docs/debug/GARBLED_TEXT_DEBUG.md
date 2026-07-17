# Garbled Text Bug — Debug Context

**Product:** InfographicAI (Real Estate SaaS)
**Branch:** `test/phase-0.5`
**Stack:** NestJS + React + OpenAI GPT-4o + Ideogram API
**Status:** Bug persists after multiple fixes. Needs fresh investigation in new session.

---

## The Problem

Infographics generated via the app contain **garbled, unreadable text** — nonsense strings like
`3, 30IOS`, `PROICE`, `Soloc 125 Mrdery Oolse`, etc. instead of the actual property details.

**The same prompt pasted directly into the Ideogram web UI produces a perfect, legible result.**
This means the prompt content is not the cause — something in how the app calls the API is wrong.

---

## Generation Flow Comparison

### Ideogram Web UI (works perfectly)

```
User types plain prompt in browser
        │
        ▼
Ideogram Web UI
        │  POST https://api.ideogram.ai/v1/ideogram-v4/generate
        │  Magic Prompt: AUTO (web UI default)
        │  Model: Ideogram 4 (selected in UI)
        │
        ▼
Ideogram renders image with clean, accurate text
```

**Prompt used in web UI that worked:**
```
Professional real estate listing infographic:
- Headline: "Chic Modern Oasis"
- Address: 123 Main St
- Price: $520K
- Details: 3 BED | 2 BATH
- Agent: John Smith, RE/MAX Gold
- Color scheme: use charcoal black, gold, white as the primary colors throughout the design
- Style: modern luxury real estate marketing, photo-overlay layout, editorial typography
- Layout: property photo as full background, text elements overlaid with strong hierarchy
- Render every text element accurately and legibly
```

Result: gold serif headline, clean address, price, stats bar, agent panel — all legible.

---

### Our App Flow (garbled text)

```
User types natural language in AI Chat
"Just listed at 123 Main St, $520K — 3BR/2BA. Agent: John Smith, RE/MAX Gold."
        │
        ▼
[1] PromptExtractorService.extractPropertyData()
    └── GPT-4o call → extracts structured JSON
        { address, price, beds, baths, agent, ... }
        │
        ▼
[2] OpenAiService.analyzeProperty()           ← SKIP if user provided headline in Property Form
    └── GPT-4o call → generates short headline (max 30 chars)
        e.g. "Sun-Drenched Family Home"
        │
        ▼
[3] Routing check: is model ideogram-4?
    │
    ├── YES → buildV4JsonPrompt()             ← NEW (this session)
    │         Pure function, no LLM
    │         Returns V4JsonPrompt object with elements[]
    │         → IdeogramService.generateImageV4()
    │           POST /v1/ideogram-v4/generate
    │           multipart/form-data
    │           json_prompt = JSON.stringify(V4JsonPrompt)
    │           rendering_speed = TURBO
    │           resolution = 2560x1440
    │
    └── NO  → generateImagePrompt()           ← existing path (V3/V2 fallback)
              Pure function, no LLM
              Returns flat text prompt string
              → IdeogramService.generateImage()
                POST /v1/ideogram-v3/generate
                multipart/form-data
                prompt = <text string>
                magic_prompt = OFF
                aspect_ratio = 16x9
                style_type = DESIGN
                rendering_speed = TURBO
```

---

## What Was Changed This Session (All Files)

### `api/src/modules/ai-generation/services/ideogram.service.ts`
**Complete rewrite.** Was using old `/generate` endpoint (V2 JSON only). Now has two paths:

| Method | Endpoint | Format | When |
|--------|----------|--------|------|
| `generateImage()` | `/v1/ideogram-v3/generate` | multipart/form-data | V3 models + V2 legacy fallback |
| `generateImageV4()` | `/v1/ideogram-v4/generate` | multipart/form-data | V4 models only |

Key field changes from old → new:
- `magic_prompt_option: 'OFF'` (old JSON field) → `magic_prompt: 'OFF'` (V3 form field)
- `aspect_ratio: 'ASPECT_16_9'` → `aspect_ratio: '16x9'` (V3 format)
- V4 uses `resolution: '2560x1440'` instead of aspect_ratio
- V4 uses `json_prompt` (JSON string) instead of `prompt` — magic prompt OFF by design

### `api/src/config/image-generation.config.ts`
- Added `orientationToIdeogramAspectV3()` → returns `'16x9'` / `'9x16'` / `'1x1'`
- Added `ORIENTATION_TO_IDEOGRAM_ASPECT_V3` map
- `normalizeImageModel()` defaults changed: `ideogram-4-turbo` → `ideogram-3`
- `nano-banana-pro` → `ideogram-4` (V4 path)
- `ideogram-turbo` → `ideogram-3` (V3 path)

### `api/src/modules/ai-generation/services/openai.service.ts`
- Added `buildV4JsonPrompt(propertyData, headline)` — pure function, builds V4JsonPrompt
  - `high_level_description`: overall design intent + color scheme
  - `compositional_deconstruction.background`: property photo description
  - `compositional_deconstruction.elements[]`: each text as `{type, text, desc}` — no bbox (optional)
- Fixed `generateImagePrompt()`: `- Brand palette:` → `- Color scheme: use X as primary colors` (was causing Ideogram to render color swatches)
- Fixed `generateImagePrompt()`: removed dead `location` variable

### `api/src/modules/ai-generation/services/ai-orchestrator.service.ts`
- Added `isV4 = imageModel.startsWith('ideogram-4')` routing
- V4 path: `buildV4JsonPrompt()` → `generateImageV4()` (no text prompt, no magic prompt)
- V3 path: `generateImagePrompt()` → `generateImage()` (text prompt, magic_prompt: OFF)
- Headline skip: if `propertyData.headline` exists → use directly, skip `analyzeProperty()` LLM call
- Fixed variation prompt concatenation: was `${imagePrompt} Variation 1:...` → now `${imagePrompt}\n- Variation style: ...`

### Frontend changes
- `usePropertyStore.ts` — Added `headline: string` field
- `PropertyDetailsForm.tsx` — Added Headline input (max 35 chars, "Leave blank for AI")
- `AIChatBox.tsx` — Imports `usePropertyStore`, passes `headline` in generation request
- `api.ts` — Added `headline?` to `GenerateFromChatInput`; updated model enum

### Backend DTO + service changes
- `generate-from-chat.dto.ts` — Added `headline?: string`; updated model enum
- `generations.service.ts` — Passes `dto.headline?.trim() || undefined` into `propertyData`

---

## Root Causes Already Confirmed (Previous Attempts)

| # | Root Cause | Fix Applied | Status |
|---|-----------|-------------|--------|
| 1 | `magic_prompt_option: 'AUTO'` was rewriting structured prompt into a "brand identity moodboard" concept, garbling exact strings like `$520K`, `3 BED\|2 BATH` | Changed to `'OFF'` | ✅ Applied but reverted twice by unknown process |
| 2 | `- Brand palette: charcoal black, gold` caused Ideogram to render actual color swatch blocks instead of text | Changed to `- Color scheme: use X as primary colors throughout` | ✅ Fixed |
| 3 | Old endpoint `/generate` only supports V1/V2 model enums. `V_4_TURBO`, `V_4`, `V_3_TURBO` all return HTTP 400 | Migrated to `/v1/ideogram-v3/generate` (V3) and `/v1/ideogram-v4/generate` (V4) | ✅ Fixed this session |
| 4 | Variation prompt appended without newline: `${imagePrompt} Variation 1:` broke last instruction line | Fixed with `\n- Variation style:` | ✅ Fixed |

---

## What Still Needs Investigation

### Hypothesis 1: V3 `magic_prompt: 'OFF'` is not being sent correctly (most likely)
The new V3 path uses native `FormData` + axios 1.13.2 in Node.js 20. The field is:
```typescript
form.append('magic_prompt', 'OFF');
```
**Possible failure:** axios may not be serializing native `FormData` as true multipart. If the request
falls back to JSON or URL-encoded, Ideogram may ignore `magic_prompt` and use AUTO default.

**How to verify:** Add a `console.log` of `response.config.headers` or use Wireshark / request
interceptor to inspect the actual HTTP body being sent. Check if `Content-Type: multipart/form-data; boundary=...`
appears in the outgoing request headers.

**Alternative fix:** Use the `form-data` npm package instead of native FormData:
```typescript
import FormData from 'form-data';
// form.getHeaders() gives axios the correct Content-Type with boundary
const response = await axios.post(url, form, {
  headers: { 'Api-Key': this.apiKey, ...form.getHeaders() }
});
```

### Hypothesis 2: The V3 endpoint itself still has magic prompt issues
Even with `magic_prompt: 'OFF'`, V3 may still rewrite some parts of the prompt.
**Test:** Log the `data[0].prompt` field from the V3 response — if it differs from what was sent,
magic prompt rewrote it regardless of the OFF setting.

### Hypothesis 3: V4 `json_prompt` is not being parsed correctly by Ideogram
The V4 path sends `form.append('json_prompt', JSON.stringify(v4JsonPrompt))`.
If Ideogram receives it as a plain string (not JSON), it may fall back to text_prompt behavior
(which re-enables magic prompt).
**Test:** Log the full V4 response body including `data[0].prompt` to see what Ideogram actually processed.

### Hypothesis 4: The model being used is not what we think
The `aiModel` field from the frontend may not be reaching the V4 routing check correctly.
Check: `console.log('[Orchestrator] imageModel=', imageModel, 'isV4=', isV4)` — verify `isV4` is `true`
when `nano-banana-pro` or `ideogram-4` is selected.

---

## Key Files for Next Session

```
api/src/modules/ai-generation/services/ideogram.service.ts      ← API calls (V3/V4 endpoints)
api/src/modules/ai-generation/services/openai.service.ts        ← buildV4JsonPrompt(), generateImagePrompt()
api/src/modules/ai-generation/services/ai-orchestrator.service.ts ← routing logic, headline skip
api/src/config/image-generation.config.ts                       ← normalizeImageModel(), aspect ratio maps
api/src/modules/infographics/dto/generate-from-chat.dto.ts      ← DTO with headline field
```

---

## Immediate Next Debug Step

**Add this log to `ideogram.service.ts` (V3 path, after the axios call):**
```typescript
console.log('[Ideogram V3] Request Content-Type:', response.config?.headers?.['Content-Type']);
console.log('[Ideogram V3] Response prompt (what Ideogram used):', response.data?.data?.[0]?.prompt);
```

If `response.data.data[0].prompt` differs from what we sent → magic prompt is still active.
If Content-Type is not `multipart/form-data; boundary=...` → FormData serialization is failing.

**Same for V4 path (`generateImageV4`):**
```typescript
console.log('[IdeogramV4] Response prompt used:', response.data?.data?.[0]?.prompt);
```

If this returns a rewritten prompt → `json_prompt` was not parsed as structured JSON by Ideogram.
