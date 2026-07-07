# Session Log — Ideogram V4 Pipeline Fix + Product Strategy Findings

> **Date:** 2026-07-03
> **Branch:** `fix/ai-ideogram-v4-text-quality` (off main @ 2fa31f7, post PR #7–#11 merge)
> **Artifacts:** `docs/testing/reports/ideogram-v4-experiment-2026-07-03/` (4 experiment images + payloads + SUMMARY.md + E2E app-test image)

---

## Part 1 — The Garbled-Text Investigation

### Problem
App generations on Ideogram V4 produced garbled text; the same content pasted into the Ideogram web UI (V4, Magic Prompt OFF) rendered cleanly.

### Root cause (proven by 4-image isolation experiment, ~$0.20)
- **NOT rendering speed.** E1 (static JSON @ TURBO) and E2 (static JSON @ DEFAULT) both garbled.
- **The hand-built sparse `json_prompt` was the cause.** Our five specified strings rendered correctly even at TURBO — the garbling was in *filler panels the model invented* to occupy space the sparse JSON left undescribed (fake spec tables full of pseudo-text).
- **E3 (reference flow) was flawless**: our proven text prompt → Ideogram `magic-prompt-v4` endpoint → rich art-directed `json_prompt` (obj elements for panels/rules/cards, exact hex colors, per-element typography) → generate. This is what the web UI does internally; V4 has NO magic-prompt toggle on the API (`text_prompt` = MP forced ON, `json_prompt` = MP OFF).
- **E4 lesson**: blanket regex text-override after conversion corrupts faithful conversions (duplicated agent line). Repair must be conservative — verify first, touch only what drifted.

### Fix shipped (this branch)
```
textPrompt (proven builder, all models)
  → V4: magic-prompt-v4 conversion (💰 1 call/generation)
  → verifyAndRepairV4JsonPrompt (FREE — repairs only on drift)
  → generate-v4, rendering_speed mapped from model tier (never hardcoded TURBO)
  → fallback to proven V3 text path if conversion fails
V2/V3: text prompt path unchanged
```
New module `infographic-prompt.builder.ts` (pure functions, zero AI cost) is the single source of truth for prompt text. `openai.service.ts` now contains only paid LLM calls. Every 💰 AI call site is marked in code comments.

### E2E verification (app test, generation cmr515lmh0006gp10cg3sphwi)
Chat prompt → extraction (Gemini) → headline "Sleek Kitchen Pool Sanctuary" (Gemini, 8.7s) → prompt build (1ms) → magic-prompt (11.7s, **zero repairs needed**) → V4 DEFAULT (12.6s) → total 34.3s, $0.064. Output: every string exact, zero garble, brand navy honored, kitchen+pool imagery matching features. Saved as `APP-TEST-e2e-result.png`.

### Known follow-up issues
- Model invents a **synthetic agent headshot** (fake face) and **synthetic property photo** — a legal/liability problem for real listings (misrepresentation). → EPIC-AI-06.
- ~~`magic-prompt-v4` cost not on Ideogram pricing page — assumed $0, verify on first invoice (`V4_MAGIC_PROMPT_COST` TODO in ai-models.config.ts).~~ ✅ RESOLVED 2026-07-07: verified $0 empirically — 10 prompt-only calls produced zero credit-balance delta on the API dashboard.
- Default 3 variations/generation = 3× image cost but `creditsUsed: 1`.

---

## Part 2 — Unit Economics (verified 2026-07-03)

### Cost per generation (V4 Default path)
| AI call | Cost |
|---|---|
| Extraction (Gemini Flash) | ~$0.0006 |
| Headline (Gemini; $0 if user-typed) | ~$0.0006 |
| magic-prompt-v4 | $0 assumed (unverified; Describe = $0.01) |
| Image: V4 Turbo / Default / Quality | $0.03 / $0.06 / $0.10 per image |

**One "generation" = 3 variations by default ≈ $0.18 (~₹15.5). Single variation ≈ $0.06.**

### Gross margins at full utilization (3 variations, V4 Default)
| Plan | Revenue/mo | Max AI cost | Margin |
|---|---|---|---|
| FREE (3) | ₹0 | ₹46 | acquisition cost |
| SOLO ₹2,999 (50) | ₹2,999 | ~₹770 | ~74% |
| TEAM ₹6,999 (200) | ₹6,999 | ~₹3,080 | ~56% |
| BROKERAGE (1000, unpriced — PT-06) | ? | ~₹15,400 | needs ≥ ₹35,000 |

### Cost lever
Preview/finalize flow: 3 × Turbo previews ($0.09) → user picks → 1 × Default/Quality final ($0.06–0.10) ≈ $0.19 with a quality *upgrade* on the final asset vs $0.54 for 3 × Quality naively.

---

## Part 3 — Competitive Position (brutally honest)

### The threat
- **Ideogram direct**: Basic $8/mo (~₹680, 400 credits) + Magic Prompt + Prompt Builder + Image Studio component editing. ~4× cheaper than SOLO, currently more editable than our output.
- **Canva Pro** (~₹1,200/mo): thousands of RE templates, brand kit, scheduler, massive distribution; realtors already use it.
- Raw generation quality **is Ideogram's quality** — prompt engineering is not a moat.
- Single-supplier risk: entire image layer is one vendor's API.

### What is genuinely ours
1. **Workflow, not images** — listing text in → format-correct branded output in 34s; no prompting or design skill.
2. **Exact-text guarantee** — verify/repair layer programmatically promises price/address correctness. Wrong price in RE marketing = liability, not typo.
3. **Canvas editor + slots** (US-DESIGN-012) — foundation for editable hybrid output Ideogram structurally can't match for this vertical.
4. **B2B/brokerage surface** (roadmap) — brand-lock, seats, MLS/CRM integrations; Ideogram/Canva will never build these for RE.

### Verdict
Solo-consumer at ₹2,999 loses to Canva/Ideogram on price and distribution as an *image tool*. Path to significant revenue = TEAM/BROKERAGE + API, and repositioning SOLO around **listing kits** (see Part 4). Tech built this week matters as the *reliability layer* (exact text, verified output, cost control) a B2B buyer requires — not as pretty-image generation.

---

## Part 4 — Strategy: Overcoming the Weaknesses

### Reframe the unit of value: "listing marketing kit," not "image"
One listing in → complete kit out: IG post (1:1), IG story (9:16), A4 flyer (print-ready), WhatsApp card, email header — one extraction, one brand profile, exact text on every asset. ₹2,999 ÷ 10 kits = ₹300/listing against a commission worth lakhs. Same price, same COGS, different mental math. → **EPIC-KIT-01**

### What Canva & Ideogram structurally cannot offer a solo agent
1. **Real listing photos as background** — synthetic property photos are a legal liability; hybrid = agent's real photo + AI-directed layout + exact-text overlay. Biggest product gap AND biggest differentiator. → **EPIC-AI-06**
2. **Correctness as a promise** — "every number verified" is true and marketable.
3. **Compliance built-in** — RERA/MLS/brokerage rules, license numbers, equal-housing marks auto-inserted.
4. **Content between listings (churn killer)** — auto-generated monthly market updates, just-sold, festival posts, pushed proactively. Solo agents have 1–3 listings/mo; the other 27 days are why they cancel.
5. **Listing lifecycle** — Just Listed → Open House → Price Improved → Just Sold from one data entry.

### Priority order
1. Real-photo hybrid pipeline (EPIC-AI-06) — removes liability, creates moat
2. Listing kit product unit (EPIC-KIT-01) — reprice nothing, reframe everything
3. Recurring content engine — retention (feature inside EPIC-KIT-01)
4. Compliance/profile layer — sticky, cheap to build
5. Brokerage/API tier — the bigger revenue, after SOLO proves workflow

Distribution (agent communities, brokerage partnerships, WhatsApp-native sharing) remains the non-technical bottleneck.

---

*Session logged 2026-07-03. Related epics: EPIC-GEN-01 (Phase 0.5 — this session's pipeline fix), EPIC-AI-06, EPIC-KIT-01.*
