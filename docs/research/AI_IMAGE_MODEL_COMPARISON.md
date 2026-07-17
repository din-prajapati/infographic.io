# AI Image Generation Model Comparison — InfographicAI

> **Purpose:** Strategic model selection and pricing model review for InfographicAI (real estate infographic SaaS)
> **Scope:** Image generation models only — video generation is out of scope for now
> **Date:** 2026-06-17
> **Author:** Dinesh
> **Context:** We currently use Ideogram Turbo ($0.025/img) and Ideogram V2 ($0.080/img). US-AI-003/004 plan a model swap. This document evaluates all options before committing.

---

## Table of Contents

1. [Our Use Case Requirements](#1-our-use-case-requirements)
2. [Model Comparison Matrix](#2-model-comparison-matrix)
3. [Model Deep Dives — Strengths & Weaknesses](#3-model-deep-dives)
4. [Cost Analysis at Scale](#4-cost-analysis-at-scale)
5. [Competitor Pricing Analysis](#5-competitor-pricing-analysis)
6. [Our Current Pricing Model](#6-our-current-pricing-model)
7. [Pricing Model Recommendation](#7-pricing-model-recommendation)
8. [Model Recommendation for InfographicAI](#8-model-recommendation)
9. [Migration Roadmap](#9-migration-roadmap)

---

## 1. Our Use Case Requirements

Before comparing models, define what InfographicAI specifically needs. Not all models serve all use cases equally.

### Hard requirements (must have)

| Requirement | Why |
|-------------|-----|
| **Programmatic API access** | Fully automated generation pipeline — no manual UI |
| **Text-in-image quality** | Infographics contain headline, price, address, agent name — text must be legible |
| **Reliable prompt following** | Property data (beds, sqft, price) must appear accurately |
| **Landscape + Portrait + Square orientations** | Different social media formats |
| **Response URL (not base64)** | We store image URL, not binary data |
| **< 15s generation time** | User-visible progress bar; anything longer increases abandonment |
| **Per-image API pricing** | SaaS billing model; subscription-per-seat for the provider is problematic at scale |

### Desired (nice to have)

| Requirement | Why |
|-------------|-----|
| Brand color application | Agent palette selection feature |
| Style consistency across variations | 3 variations should feel like a family |
| Inpainting / element replacement | Phase 2 — allow editing specific regions |
| Commercial-safe training data | Enterprise clients need IP indemnity |
| Batch requests | Phase 3 — high-volume brokerage API tier |

### Our generation cost structure

Every generation = 1 LLM call + N image calls (N = number of variations, typically 3):

```
Total cost = GPT-4o analysis ($0.004 flat) + imageModel × N variations
```

| Model | Cost per image | 3-variation cost | 1-month cost @50 gen |
|-------|---------------|-----------------|----------------------|
| Ideogram Turbo (current) | $0.025 | $0.079 | $3.95 |
| Ideogram V2 (current premium) | $0.080 | $0.244 | $12.20 |
| Target with cheap model | $0.003 | $0.013 | $0.65 |

---

## 2. Model Comparison Matrix

> Ratings: ★★★★★ (excellent) → ★☆☆☆☆ (poor) for InfographicAI use case

| Model | Provider | Text-in-Image | Prompt Accuracy | Photo Quality | Cost (per img) | API Available | Speed | Overall |
|-------|----------|:-------------:|:---------------:|:-------------:|:--------------:|:-------------:|:-----:|:-------:|
| **Ideogram V2 Turbo** | Ideogram | ★★★★★ | ★★★★☆ | ★★★☆☆ | $0.025 | ✅ Yes | Fast | ★★★★☆ |
| **Ideogram V2** | Ideogram | ★★★★★ | ★★★★★ | ★★★★☆ | $0.080 | ✅ Yes | Medium | ★★★★☆ |
| **DALL-E 3** | OpenAI | ★★★★☆ | ★★★★★ | ★★★☆☆ | $0.040–$0.120 | ✅ Yes | Medium | ★★★☆☆ |
| **FLUX.1 Schnell** | Black Forest Labs | ★★★☆☆ | ★★★★☆ | ★★★★★ | $0.003 | ✅ Yes (fal.ai) | Very Fast | ★★★☆☆ |
| **FLUX.1 Pro** | Black Forest Labs | ★★★★☆ | ★★★★★ | ★★★★★ | $0.055 | ✅ Yes | Medium | ★★★★☆ |
| **Stable Diffusion 3** | Stability AI | ★★★☆☆ | ★★★☆☆ | ★★★☆☆ | $0.003–$0.006 | ✅ Yes | Fast | ★★★☆☆ |
| **Amazon Nova Canvas** | AWS | ★★★☆☆ | ★★★☆☆ | ★★★☆☆ | $0.006–$0.012 | ✅ Yes (AWS) | Medium | ★★☆☆☆ |
| **Google Imagen 3** | Google Vertex AI | ★★★☆☆ | ★★★★☆ | ★★★★★ | $0.020–$0.040 | ✅ Yes (GCP) | Medium | ★★★☆☆ |
| **Recraft V3** | Recraft | ★★★★☆ | ★★★★☆ | ★★★☆☆ | $0.040 | ✅ Yes | Medium | ★★★★☆ |
| **Adobe Firefly** | Adobe | ★★★☆☆ | ★★★☆☆ | ★★★☆☆ | Enterprise only | ✅ Limited | Slow | ★★☆☆☆ |
| **Midjourney V6** | Midjourney | ★★☆☆☆ | ★★★☆☆ | ★★★★★ | N/A | ❌ No API | Medium | ★☆☆☆☆ |
| **Kling AI (Kwai)** | Kuaishou | ★★★☆☆ | ★★★☆☆ | ★★★★☆ | $0.014–$0.035 | ✅ Limited | Medium | ★★☆☆☆ |
| **Seedance** | ByteDance | N/A (video) | N/A (video) | N/A | N/A | ❌ Image API | — | ❌ N/A |

---

## 3. Model Deep Dives

### 3.1 Ideogram V2 / V2 Turbo (Current)

**Who:** Ideogram AI (founded 2023, ex-Google Brain team)

| Attribute | Detail |
|-----------|--------|
| Current usage | ✅ Active — Turbo (FREE/SOLO), V2 (TEAM/BROKERAGE) |
| Text rendering | Industry-leading. Specifically trained to embed readable text into images |
| Real estate fit | Excellent — headline, price, address render crisply |
| Style range | Moderate — photorealistic and graphic design styles both solid |
| API reliability | High — stable uptime, predictable latency |

**Strengths:**
- Best-in-class text-in-image rendering — critical for infographics with headlines, prices, addresses
- Purpose-built for marketing and design use cases
- Simple REST API with URL response — fits our architecture exactly
- No setup overhead beyond an API key

**Weaknesses:**
- Closed model — no fine-tuning, no custom weights
- Turbo has noticeably lower quality than V2; visible to discerning users
- More expensive than FLUX alternatives for photorealism
- No inpainting or image-to-image in standard API

**Verdict:** Best current option for InfographicAI. The text rendering advantage is decisive for infographics. Keep as primary model until a cheaper alternative matches its text quality.

---

### 3.2 DALL-E 3 / DALL-E 4 (OpenAI)

**Who:** OpenAI

| Attribute | Detail |
|-----------|--------|
| API | Via OpenAI `images/generate` endpoint — same vendor as our LLM |
| Text rendering | Very good — second only to Ideogram for legibility |
| Real estate fit | Good — accurate property descriptions, architectural styles |
| Integration complexity | Low — same API key as GPT-4o |

**Strengths:**
- Extremely accurate prompt following — reproduces specific property details reliably
- Good text rendering (not as precise as Ideogram, but acceptable)
- Single vendor (OpenAI) simplifies billing and API management
- Native `gpt-4o` → `dall-e-3` pipeline: can pass structured JSON layout directly
- Will support DALL-E 4 when released — likely major quality jump

**Weaknesses:**
- More expensive: $0.04 (standard 1024×1024), $0.12 (HD 1024×1792) — 1.6–4.8× pricier than Ideogram Turbo
- Portrait/landscape aspect ratio support less flexible than Ideogram
- Style is more "illustrated" than photorealistic by default
- Safety filters more aggressive — real estate terms sometimes trigger false positives

**Verdict:** Strong fallback option if Ideogram has outages. Same vendor as our LLM reduces integration overhead. Not cost-competitive at scale.

---

### 3.3 FLUX.1 (Black Forest Labs)

**Who:** Black Forest Labs (founded by former Stability AI researchers, 2024)

| Attribute | Detail |
|-----------|--------|
| Variants | Schnell (fastest, open weights), Dev (balanced), Pro (best quality, API only) |
| API providers | fal.ai, Replicate, Together AI, BFL direct API |
| Text rendering | Improving rapidly — Pro is good, Schnell is inconsistent |
| Real estate fit | Good for photorealistic property renders; weaker on infographic text |

**Strengths:**
- **Schnell**: $0.003/image — cheapest viable quality option
- **Pro**: Best photorealism of any API model, beats Midjourney in architectural renders
- Open weights (Schnell/Dev) — can fine-tune on branded styles
- Speed: Schnell generates in 1–3 seconds (Ideogram takes 8–15s)
- Active development — new versions quarterly
- Good at real estate photography style (interior design, architecture)

**Weaknesses:**
- Text-in-image quality significantly below Ideogram — suitable for background images but not text-overlay infographics
- Multi-API-provider ecosystem: latency and pricing vary by provider
- Schnell (open) has inconsistent output quality without fine-tuning
- No native aspect ratio parameter on some providers — requires workarounds

**Verdict:** Excellent for Phase 2 — when we decompose infographics into "AI-generated background image + canvas text elements" (GAP-02). At that point, FLUX.1 Schnell as background image layer at $0.003/image becomes very attractive. Not suitable as a direct Ideogram replacement today because our infographic includes embedded text.

---

### 3.4 Stable Diffusion 3 (Stability AI)

**Who:** Stability AI

| Attribute | Detail |
|-----------|--------|
| Variants | SD3, SD3.5 Large, SD3.5 Medium, SD3.5 Turbo |
| API | Stability AI API (`stability.ai/v2beta/stable-image/generate`) |
| Text rendering | SD3+ improved significantly; still below Ideogram and DALL-E |
| Real estate fit | Adequate with prompt engineering; requires more iteration |

**Strengths:**
- Cheapest stable API: $0.003–0.006/image (SD3.5 Turbo/Medium)
- Open weights available for self-hosting (eliminates per-image cost entirely)
- Supports inpainting, outpainting, image-to-image — useful for Phase 2 canvas editing
- Multiple aspect ratios natively supported

**Weaknesses:**
- Stability AI has had ongoing financial/organizational turbulence — reliability risk
- Quality requires significant prompt engineering to match Ideogram
- Text rendering notably inferior to Ideogram for infographic use
- Self-hosting requires GPU infrastructure — adds DevOps overhead

**Verdict:** Best choice for high-volume API tier (API_GROWTH, API_ENTERPRISE) if price sensitivity dominates over quality. Not recommended as primary model given organizational risk and text quality gap.

---

### 3.5 Amazon Nova Canvas

**Who:** Amazon (AWS)

| Attribute | Detail |
|-----------|--------|
| API | Via AWS Bedrock — `amazon.nova-canvas-v1:0` |
| Cost | $0.006 (512px), $0.012 (1024px) — 2–4× cheaper than Ideogram Turbo |
| Text rendering | Basic — acceptable for simple overlays, not complex infographic text |
| Setup | Requires AWS account, Bedrock access, IAM setup |

**Strengths:**
- Very low cost — best price-per-image among commercially available models
- Native inpainting/outpainting/image conditioning
- AWS ecosystem — fits organizations already on AWS
- Color conditioning — can specify dominant colors (aligns with brand palette feature!)
- Commercial-safe (Amazon's training data agreements)

**Weaknesses:**
- Significantly lower visual quality than Ideogram/FLUX Pro
- AWS setup overhead — adds infrastructure complexity
- Text rendering quality poor for complex infographic layouts
- Not suitable for India-first users without GCP/AWS region consideration

**Verdict:** Compelling for API_STARTER/GROWTH tiers where cost is paramount and clients care more about volume than individual image quality. Not suitable as primary SaaS model for direct real estate agents.

---

### 3.6 Google Imagen 3 (Vertex AI)

**Who:** Google DeepMind

| Attribute | Detail |
|-----------|--------|
| API | Via Google Cloud Vertex AI |
| Cost | $0.02–$0.04/image |
| Text rendering | Moderate — improved in Imagen 3, but not Ideogram-level |
| Real estate fit | Good photorealism for property photography style |

**Strengths:**
- Best photorealism of the Google ecosystem
- Strong prompt coherence — follows complex descriptions accurately
- Hindi/multilingual text support — relevant for Indian real estate market
- Integrates with Gemini for end-to-end generation (Gemini analyzes → Imagen generates)

**Weaknesses:**
- GCP dependency — adds vendor lock-in (we're on Railway/Neon)
- No simpler API route — must provision Vertex AI project
- Text-in-image quality below Ideogram
- Latency higher than alternatives

**Verdict:** Interesting for future Indian market expansion (multilingual text). Not an immediate replacement for Ideogram given GCP overhead and cost parity.

---

### 3.7 Recraft V3

**Who:** Recraft AI

| Attribute | Detail |
|-----------|--------|
| Cost | ~$0.04/image |
| Specialty | Vector-friendly, design-first, brand consistency |
| Text rendering | Good — competitive with DALL-E 3 for design contexts |
| Real estate fit | Good for clean marketing graphics; less photorealistic |

**Strengths:**
- Designed for design workflows — brand kit support, consistent style families
- Good text rendering for marketing collateral
- Vector and SVG output mode (unique feature)
- Style lock — can maintain brand visual consistency across variations

**Weaknesses:**
- More expensive than Ideogram Turbo for similar quality
- Smaller model ecosystem and community
- Less photorealistic than FLUX/Midjourney for property photography

**Verdict:** Worth evaluating for the Design tab "Brand Styles" feature in Phase 2 — Recraft's style consistency might complement our palette system. Not replacing Ideogram as primary generator now.

---

### 3.8 Midjourney V6 / V7

**Who:** Midjourney Inc.

| Attribute | Detail |
|-----------|--------|
| API | ❌ **No public API** — Discord-only |
| Quality | Best artistic quality available; widely used in luxury real estate marketing |
| Cost | $10–$60/month subscription (shared Discord bot) |

**Strengths:**
- Best visual quality by consensus — luxury real estate firms use it for hero images
- Massive community; prompt patterns are well-documented
- V6/V7 significantly improved text rendering

**Weaknesses:**
- **No API** — fully manual, Discord UI only. Cannot automate.
- Cannot integrate into our backend pipeline.
- Would require a third-party unofficial API wrapper (fragile, ToS violation risk)
- Subscription per user, not per generation — bad economics for SaaS

**Verdict:** Irrelevant to InfographicAI's automated pipeline. Excluded from consideration until official API launches.

---

### 3.9 Kling AI / Kwai-Kolors (ByteDance / Kuaishou)

**Who:** Kuaishou (ByteDance affiliate)

| Attribute | Detail |
|-----------|--------|
| Primary use | Video generation (Kling) + image (Kolors) |
| API | Available via Replicate and direct API |
| Cost | $0.014–$0.035/image |

**Strengths:**
- Strong photorealism for Asian markets
- Both image and video in one provider (future video generation story)
- Growing API ecosystem

**Weaknesses:**
- Western real estate style output inconsistent
- Less prompt-accurate than FLUX/Ideogram for marketing collateral
- Geopolitical consideration for some enterprise clients

**Verdict:** Monitor for video generation story (out of scope now). Not recommended for image generation given cost vs. quality ratio.

---

### 3.10 Seedance (ByteDance)

**Who:** ByteDance

| Attribute | Detail |
|-----------|--------|
| Primary use | **Video generation only** (text-to-video, image-to-video) |
| Image support | No standalone image generation API |

Seedance is a video-first model. ByteDance's image generation products (Kolors, SDXL-based) are separate. Including for completeness but **excluded from image model consideration**.

---

### 3.11 Adobe Firefly

**Who:** Adobe

| Attribute | Detail |
|-----------|--------|
| API | Available via Adobe Developer API (enterprise) |
| Cost | Enterprise licensing only — no public per-image pricing |
| Specialty | **Commercially safe** — trained exclusively on licensed and public domain content |

**Strengths:**
- Full IP indemnity — Adobe legally backs commercial use
- Integration with Adobe Creative Cloud (agents may already use Photoshop/Express)
- Brand kit features — palette, font matching

**Weaknesses:**
- Enterprise licensing model — not viable for per-generation SaaS
- Quality below Ideogram and FLUX
- Complex enterprise procurement

**Verdict:** Relevant only if a large brokerage/enterprise client demands IP safety as a contractual requirement. Deferred to Phase 3 enterprise tier.

---

## 4. Cost Analysis at Scale

> Assumes: 3 variations per generation, 1 GPT-4o call per generation ($0.004)

### Per-generation cost by model

| Model | Per image | 3-variation gen | Monthly cost @ 50 gen | Monthly cost @ 200 gen | Monthly cost @ 5,000 gen |
|-------|-----------|:---------------:|:---------------------:|:---------------------:|:------------------------:|
| Ideogram Turbo | $0.025 | $0.079 | $3.95 | $15.80 | $395 |
| Ideogram V2 | $0.080 | $0.244 | $12.20 | $48.80 | $1,220 |
| DALL-E 3 (standard) | $0.040 | $0.124 | $6.20 | $24.80 | $620 |
| FLUX.1 Schnell (fal.ai) | $0.003 | $0.013 | $0.65 | $2.60 | $65 |
| FLUX.1 Pro | $0.055 | $0.169 | $8.45 | $33.80 | $845 |
| Stable Diffusion 3.5 | $0.004 | $0.016 | $0.80 | $3.20 | $80 |
| Amazon Nova Canvas | $0.012 | $0.040 | $2.00 | $8.00 | $200 |
| Google Imagen 3 | $0.030 | $0.094 | $4.70 | $18.80 | $470 |

### Gross margin analysis by plan

> Revenue in USD (₹999 = ~$12, ₹6,999 = ~$84 at ₹83/$)

| Plan | Revenue | Gen limit | With Ideogram Turbo | With FLUX Schnell | Margin improvement |
|------|---------|:---------:|:-------------------:|:-----------------:|:-----------------:|
| SOLO ($12/mo) | $12 | 50 | $3.95 cost → **67% margin** | $0.65 → **95% margin** | +28% |
| TEAM ($84/mo) | $84 | 200 | $15.80 cost → **81% margin** | $2.60 → **97% margin** | +16% |
| BROKERAGE (~$240) | $240 | 1,000 | $79.00 cost → **67% margin** | $13.00 → **95% margin** | +28% |
| API_STARTER (~$50) | $50 | 5,000 | **LOSS: $395** ⚠️ | $65 → **-30% margin** ⚠️ | Still loss |

**Critical finding:** The API_STARTER tier at 5,000 generations is loss-making with any Ideogram model. FLUX.1 Schnell at $0.003/image barely breaks even. API tier pricing needs to be revisited urgently before launch of those tiers.

---

## 5. Competitor Pricing Analysis

### Reference: Ideogram Consumer Plans (from screenshot)

The attached screenshot shows Ideogram's own direct-to-consumer pricing. This is the upstream vendor pricing against which we position.

| Tier | Monthly Price | Credits (fast gen) | Est. Images | Effective price/image |
|------|:------------:|:------------------:|:-----------:|:---------------------:|
| **Starter** | $16/mo ($19 regular) | 2,000 | ~200 | $0.080 |
| **Basic** | $27/mo ($32 regular) | 5,000 | ~500 | $0.054 |
| **Pro** | $39/mo ($90 regular) | 9,000 | ~900 | $0.043 |
| **Ultimate** | $99/mo | 21,000 | ~2,100 | $0.047 |

> Note: Ideogram credits ≈ 10 credits/image for standard generation. Estimates above assume 10 credits/image.

**Key observations:**
1. Ideogram's consumer pricing reveals their per-image economics — they're profitable at $0.047–0.080/effective image, which is above our API rate of $0.025 (Turbo).
2. Ideogram Starter at $16/200 images = general purpose image generation; our SOLO at $12/50 infographics is actually defensible because we add:
   - GPT-4o property analysis
   - Real estate-specific prompt engineering
   - Canvas editor with templates
   - Brand palette application
   - Download + My Designs storage
3. Ideogram's massive discount on Pro ($39 vs $90 regular) signals a land-grab competitive strategy — they're buying users before others establish.

### Other competitor pricing benchmarks

| Product | Target | Price | Generations | Differentiator |
|---------|--------|:-----:|:-----------:|----------------|
| Canva Pro | General design | $15/mo | Unlimited (AI limited) | Template library, brand kit |
| Adobe Express | SMB marketing | $10/mo | ~25 AI gen | Adobe ecosystem |
| Jasper AI (image) | Marketing teams | $39/mo | Unlimited | Multi-content types |
| PhotoRoom | eCommerce product | $10/mo | Unlimited (background) | eCommerce specific |
| REimagineHome | Real estate AI | $29/mo | 20 renders | Direct competitor |
| BoxBrownie | Real estate editing | ~$1.50/render | Per image | Human + AI hybrid |

**Key competitive insight:**
- REimagineHome at $29/20 renders = $1.45/render is the direct pricing comp for real estate
- Our SOLO at $12/50 = $0.24/render is **6× cheaper than REimagineHome**
- We have significant pricing headroom; we are under-pricing relative to the real estate vertical

---

## 6. Our Current Pricing Model

```
FREE      3 gen/month      No payment
SOLO      ₹999/mo ($12)    50 gen/month
TEAM      ₹6,999/mo ($84)  200 gen/month    +user seats
BROKERAGE Custom           1,000 gen/month  +branding
API_STARTER  Custom        5,000 gen/month  API key access
API_GROWTH   Custom        20,000 gen/month
API_ENTERPRISE Custom      Unlimited
```

### Current pricing problems

| Problem | Impact |
|---------|--------|
| API tiers (5k, 20k gen) are loss-making at current image model costs | Launch blocker for those tiers |
| SOLO pricing (₹999/$12) significantly underprices real estate market | Leaves money on table |
| INR-only pricing excludes USD market entirely | Blocks international growth |
| No annual billing option | Reduces LTV, higher churn |
| No per-generation overage option | Users hit limit, churn |
| BROKERAGE plan pricing not configured (PT-06) | Can't sell the tier |

---

## 7. Pricing Model Recommendation

### Proposed pricing tiers

> Dual currency approach: INR for Indian market, USD for international. Exchange rates recalculate quarterly.

---

### Tier 1 — FREE

| Attribute | Value |
|-----------|-------|
| Price | Free forever |
| Generations | 3/month (watermarked) |
| Quality | Standard only |
| Canvas exports | PNG (watermarked) |
| Purpose | Lead magnet, trial, feedback loop |
| Change from current | Add watermark on free exports |

---

### Tier 2 — AGENT (rename from SOLO)

> **Rationale for rename:** "SOLO" is developer language. "AGENT" maps to the user's identity — a real estate agent.

| Attribute | Current SOLO | Proposed AGENT |
|-----------|:------------:|:--------------:|
| INR price | ₹999/mo | ₹1,499/mo |
| USD price | —  | $18/mo |
| Annual INR | — | ₹14,990/yr (save ₹2,998) |
| Generations | 50/mo | 75/mo |
| Quality | Standard + Premium | Standard + Premium |
| Exports | Unlimited (no watermark) | Unlimited (no watermark) |
| User seats | 1 | 1 |
| Brand palettes | Yes | Yes |
| Gross margin (Ideogram Turbo, 75 gen) | ~67% | ~75% |

**Reasoning:** REimagineHome charges $29/20 renders. Our $18/75 renders is still dramatically cheaper for more value. The ₹1,499 price (₹500 increase) is minor friction but adds 50% ARR per user. Annual billing at ₹14,990 removes monthly churn risk.

---

### Tier 3 — TEAM (unchanged name)

| Attribute | Current TEAM | Proposed TEAM |
|-----------|:------------:|:-------------:|
| INR price | ₹6,999/mo | ₹5,999/mo |
| USD price | — | $72/mo |
| Annual INR | — | ₹59,990/yr (save ₹11,998) |
| Generations | 200/mo | 300/mo |
| User seats | 5 | 10 |
| Team analytics | No | Yes — usage per agent |
| Branded exports | No | Yes — remove InfographicAI footer |

**Reasoning:** Slightly lower INR price (₹7k → ₹6k) to reduce TEAM friction; offset with more users (5→10) and branded exports. Team analytics is a Phase 1 story but should be gated here to justify the tier jump.

---

### Tier 4 — BROKERAGE

| Attribute | Current | Proposed |
|-----------|:-------:|:--------:|
| INR price | Unset (PT-06) | ₹19,999/mo |
| USD price | — | $240/mo |
| Annual INR | — | ₹1,99,990/yr |
| Generations | 1,000/mo | 1,500/mo |
| User seats | — | Unlimited |
| White-label | No | Yes — custom domain for `/editor` |
| Priority support | No | Yes — 24hr SLA |
| Dedicated onboarding | No | Yes — 2 onboarding calls |

---

### Tier 5 — API (restructured)

The API tiers need a fundamental economics fix before offering. At $0.029/generation (Ideogram Turbo), 5,000 generations costs us $145 — which is above any reasonable API_STARTER price.

**Required before launching API tiers:** Switch API tier image model to FLUX.1 Schnell or Amazon Nova Canvas ($0.003–0.006/image). At $0.007/generation total cost:

| Tier | Price | Gen limit | Cost (FLUX Schnell) | Margin |
|------|:-----:|:---------:|:-------------------:|:------:|
| API_STARTER | $49/mo | 3,000 gen | $21 | 57% |
| API_GROWTH | $149/mo | 15,000 gen | $105 | 30% |
| API_ENTERPRISE | $499/mo | 100,000 gen | $700 | **LOSS** |

> API_ENTERPRISE unlimited is not viable — must be truly enterprise contract (custom pricing, usage cap).

**Revised API model:**
- API_STARTER: $49/mo, 3,000 gen, FLUX Schnell quality
- API_GROWTH: $149/mo, 15,000 gen, FLUX Schnell quality
- API_PRO: $399/mo, 50,000 gen, Ideogram Turbo quality
- API_ENTERPRISE: Custom contract, dedicated SLA, Ideogram V2 quality

---

### Overage billing (new)

> Prevent churn when users hit limits. Offer pay-as-you-go for generations over the plan limit.

| Plan | Overage rate |
|------|:------------:|
| AGENT | ₹25/generation ($0.30) |
| TEAM | ₹20/generation ($0.24) |
| BROKERAGE | ₹15/generation ($0.18) |
| API tiers | ₹2–4/generation (volume-tiered) |

Overage is high-margin revenue. At ₹25/gen with Ideogram Turbo ($0.029 = ₹2.40 cost), margin is ~90%.

---

### Pricing summary — proposed

| Tier | INR/month | USD/month | Generations | User seats |
|------|:---------:|:---------:|:-----------:|:----------:|
| FREE | ₹0 | $0 | 3 | 1 |
| AGENT | ₹1,499 | $18 | 75 | 1 |
| TEAM | ₹5,999 | $72 | 300 | 10 |
| BROKERAGE | ₹19,999 | $240 | 1,500 | Unlimited |
| API_STARTER | — | $49 | 3,000 | API key |
| API_GROWTH | — | $149 | 15,000 | API key |
| API_PRO | — | $399 | 50,000 | API key |
| API_ENTERPRISE | Custom | Custom | Custom | Custom |

---

## 8. Model Recommendation for InfographicAI

### Primary recommendation (implement now — US-AI-003/004)

| Tier | Current model | Recommended model | Reason |
|------|:-------------:|:-----------------:|--------|
| FREE, AGENT | Ideogram Turbo | **Ideogram Turbo** (keep) | Acceptable quality, $0.025 manageable at 75 gen |
| TEAM, BROKERAGE | Ideogram V2 | **Ideogram V2** (keep) | Quality justified at premium tier |
| API_STARTER/GROWTH | Ideogram Turbo | **FLUX.1 Schnell or SD3.5 Turbo** | Economics only viable with cheap model |

> The original US-AI-003/004 stories plan to replace Ideogram with "Nano Banana Flash/Pro" — which in `image-generation.config.ts` currently routes to Ideogram. These stories need to wire to an actual different provider before they deliver value. FLUX.1 Schnell (via fal.ai) is the recommended replacement.

### Phase 2 model roadmap

| Phase | Trigger | Model change |
|-------|---------|-------------|
| Phase 2 — Canvas decomposition (GAP-02) | Background image separate from text layers | FLUX.1 Schnell for background; Ideogram for text overlays |
| Phase 2 — Brand consistency | 3 variations should feel like a family | Recraft V3 evaluation for style-locked variations |
| Phase 3 — Enterprise API | IP-safe requirement from enterprise client | Adobe Firefly evaluation |
| Phase 3 — Video story | Marketing video from infographic | Kling AI / Seedance evaluation |

### What NOT to switch to (ruled out)

| Model | Why eliminated |
|-------|----------------|
| Midjourney | No API. Period. |
| DALL-E 3 (as primary) | 1.6–4.8× more expensive than Ideogram for similar text quality |
| Google Imagen 3 | GCP dependency not worth it at current scale |
| Amazon Nova Canvas | Poor text rendering; AWS setup overhead |
| Adobe Firefly | Enterprise procurement only; quality below competitors |
| Seedance | Video-only; not applicable |

---

## 9. Migration Roadmap

### Immediate (this sprint — Phase 0.5 launch prep)
1. **Keep Ideogram Turbo + V2 as-is** — US-AI-003/004 are deferred until FLUX.1 wiring is confirmed working
2. **Fix API tier economics** before offering API_STARTER — switch to FLUX.1 Schnell via fal.ai
3. **Add overage billing** logic to `UsageLimitService` — currently hard-blocks; should offer to purchase overage

### Phase 1 (post-launch)
1. **US-AI-003 (revised):** Wire FLUX.1 Schnell via fal.ai for API tiers (not AGENT/TEAM)
2. **US-AI-004 (revised):** Evaluate Recraft V3 for style-locked variations on BROKERAGE tier
3. **Rename SOLO → AGENT** in all UI copy (pricing page, account page, emails)
4. **Add annual billing** option in RazorPay

### Phase 2 (after Phase 1 AI core)
1. **Background/foreground decomposition (GAP-02):** FLUX.1 Schnell for background, Ideogram text layers
2. **Multi-model routing** via TelemetryService (OTel) for cost-per-generation tracking per model

---

*Document created: 2026-06-17*
*Review by: Dinesh*
*Next review: Before API tier launch (Phase 1)*
