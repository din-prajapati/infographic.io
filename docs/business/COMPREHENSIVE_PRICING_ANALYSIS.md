# 💰 Comprehensive Pricing Analysis & Optimization Strategy

> **Purpose:** Complete financial analysis including all AI models, cost optimization, revenue strategies, and free trial recommendations  
> **Last Updated:** June 2026 (see June 2026 Audit section — supersedes original cost figures)  
> **Currency Base:** USD ($) with regional pricing

---

---

## 🔄 June 2026 — Cost Audit, Bug Fixes & Model Update

> **Status:** Two billing bugs discovered and fixed. Default model upgraded to V4 Turbo. Pricing tiers reviewed.  
> **Action required:** Revisit BROKERAGE and API plan pricing if Nano Banana (V4 Default) is adopted as default model.

### Bugs Found & Fixed (June 2026)

| Bug | What code did | What Ideogram actually charges | Effect |
|---|---|---|---|
| Wrong price | $0.025/image | $0.05/image (V2 Turbo actual) | 2× undercount |
| Wrong count | 1 image tracked per event | 3 images called per event (3 variations) | 3× undercount |
| **Combined** | $0.025/event tracked | $0.154/event actual | **6.1× undercount** |

Discovered by reconciling Ideogram dashboard tooltip (66 calls on Jun 16) against DB records (22 usage rows × 3 images = 66 — exact match).

**Fixes applied in `api/src/config/ai-models.config.ts` and `api/src/modules/ai-generation/services/ai-orchestrator.service.ts`.**

---

### Verified Ideogram API Pricing (June 2026 — from official pricing page)

#### Standard Generation Models

| Model | API key | Price/image |
|---|---|---|
| 4.0 Turbo | `V_4_TURBO` | **$0.03** ← new default |
| 4.0 Default | `V_4` | $0.06 |
| 4.0 Quality | `V_4_QUALITY` | $0.10 |
| 3.0 Flash | `V_3_FLASH` | $0.03 |
| 3.0 Turbo | `V_3_TURBO` | $0.03 |
| 3.0 Default | `V_3` | $0.06 |
| 3.0 Quality | `V_3_QUALITY` | $0.09 |
| **2.0 Turbo** | `V_2_TURBO` | **$0.05** (was previous default) |
| **2.0 Default** | `V_2` | **$0.08** (was "Balanced") |
| 2a Turbo | `V_2A_TURBO` | $0.025 (legacy — original wrong price came from here) |
| 2a Default | `V_2A` | $0.04 |
| 1.0 Turbo | `V_1_TURBO` | $0.02 |

#### Nano Banana Clarification

The January 2025 doc listed "Nano Banana Pro 2K/4K" as a Google product at $0.134–$0.240.

**Actual situation (June 2026):**
- The Ideogram pricing page lists **"Generate with Google Gemini"** at $0.20/image (1K/2K) and $0.36/image (4K) — this is the correct spec for that feature.
- The codebase has an internal alias `nano-banana-pro` in `image-generation.config.ts` that currently routes to **`ideogram-4` (V4 Default = $0.06/image)** — it is NOT connected to Google Gemini yet.
- If the Google Gemini integration were wired up, cost would be $0.20–$0.36/image, which is 3–6× more expensive than V4 Default. That would require a complete pricing tier overhaul before enabling.

For all margin calculations below, **"Nano Banana" = `ideogram-4` = V4 Default = $0.06/image**.

---

### Model Change Applied

Default model switched from V2 Turbo → **V4 Turbo** in `api/src/config/image-generation.config.ts`.

| | Old default (V2 Turbo) | New default (V4 Turbo) |
|---|---|---|
| API key | `V_2_TURBO` | `V_4_TURBO` |
| Price/image | $0.05 | **$0.03** |
| Quality | Good | Better (newer model) |
| Cost/event (3 imgs + GPT) | $0.154 | **$0.094** |
| Cost saving | — | **39% cheaper** |

All V3 and V4 model variants also added to `ai-models.config.ts` and `ideogram.service.ts` model map.

---

### Revised Full-Utilisation Margin by Plan

Exchange rate: ₹85 = $1

| Plan | Price INR→USD | Events/mo | V4 Turbo COGS | V4 Turbo Margin | Nano Banana COGS | Nano Banana Margin |
|---|---|---|---|---|---|---|
| FREE | ₹0 | 3 | $0.28 | -$0.28 (acquisition) | $0.55 | -$0.55 |
| SOLO | ₹2,999 → $35 | 50 | $4.70 | **$30.30 (86%)** | $9.20 | $25.80 (73%) |
| TEAM | ₹6,999 → $82 | 200 | $18.80 | **$63.20 (77%)** | $36.80 | $45.20 (55%) |
| BROKERAGE | ₹24,999 → $294 | 1,000 | $94 | **$200 (68%)** | $184 | $110 (37%) ⚠️ |
| API_STARTER | ₹82,999 → $976 | 5,000 | $470 | **$506 (52%)** | $920 | $56 (6%) ⚠️ |
| API_GROWTH | ₹2,49,999 → $2,941 | 20,000 | $1,880 | **$1,061 (36%)** | $3,680 | **-$739 LOSS** ❌ |

> Note: API_GROWTH with the old V2 Turbo default was already at -$139/mo loss at full utilization. The V4 Turbo switch fixed this to +$1,061/mo.

---

### Pricing Revision Required?

**With V4 Turbo (current default) — no price changes needed.** All plans are profitable at full utilization.

**With Nano Banana (V4 Default, $0.06/image) as universal default — the following plans need repricing:**

| Plan | Issue | Required price for 60% margin |
|---|---|---|
| TEAM | 55% margin — borderline | ₹8,999/mo (+₹2,000) |
| BROKERAGE | 37% margin — too thin | ₹39,999/mo (+₹15,000) |
| API_STARTER | 6% margin — near-breakeven | ₹1,99,999/mo (+₹1,17,000) |
| API_GROWTH | -25% — active loss ❌ | ₹7,49,999/mo (3× current) — not viable |

**Recommendation:** Do NOT use Nano Banana as the universal default. Instead:

| Plan | Model | Rationale |
|---|---|---|
| FREE | V4 Turbo only | Minimize acquisition loss |
| SOLO | V4 Turbo only | 86% margin — no risk |
| TEAM | V4 Turbo default; Nano Banana as opt-in quality toggle | Quality as a feature |
| BROKERAGE | User choice: V4 Turbo / Nano Banana / V4 Quality | Full model access |
| API_STARTER | V4 Turbo only | Economics only work at $0.03 |
| API_GROWTH | V4 Turbo only | Nano Banana would lose $739/mo at full util |

**Alternative — "Nano Banana" as a standalone mid-tier plan:**
- Price: ₹14,999/mo (~$176)
- Events: 100/mo
- Model: V4 Default ($0.06/image)
- COGS: 100 × $0.184 = $18.40
- Margin: $157.60 (89%) — excellent
- Positioning: "Studio quality for power agents" — between TEAM and BROKERAGE

---

### Billing Discrepancy to Investigate

Actual Ideogram billing reconciled to ~$0.065/Turbo image vs official $0.05 (V2 Turbo). Likely causes:
1. `magic_prompt_option: 'AUTO'` in API call may add processing cost
2. 16:9 aspect ratio may carry a resolution surcharge vs 1:1 baseline
3. Account may be on a legacy rate card

**Action:** Check Ideogram dashboard → Usage → click a single call to see the per-image line item breakdown.

---

## 📊 Executive Summary

### Key Findings
- ✅ **Current Pricing:** Highly sustainable with 67-73% profit margins
- ✅ **Cost per Infographic:** $0.033 (Budget) to $0.248 (Ultra-Premium)
- ✅ **AI Model Strategy:** Multi-tier approach optimizes costs and revenue
- 🎯 **Recommendation:** Implement tiered AI model access + free trial strategy

### Profitability Status
| Plan          | Monthly Margin | Annual (15% off) | Annual (20% off) | Status      |
| ------------- | -------------- | ---------------- | ---------------- | ----------- |
| **SOLO**      | 73.4%          | 68.7%            | 66.7%            | ✅ Excellent |
| **TEAM**      | 70.2%          | 64.9%            | 62.7%            | ✅ Excellent |
| **BROKERAGE** | 67.0%          | 61.2%            | 58.8%            | ✅ Excellent |

---

## 🤖 Complete AI Model Cost Analysis

### Available AI Models & Pricing

#### Text Models (Property Analysis)

| Model                 | Provider  | Cost/Request     | Context | Best For                                 | Score    |
| --------------------- | --------- | ---------------- | ------- | ---------------------------------------- | -------- |
| **GPT-5**             | OpenAI    | $0.004           | 128K    | Property analysis, structured extraction | 9.5/10 ⭐ |
| **Claude 3.5 Sonnet** | Anthropic | $0.003-0.015     | 200K    | Long context, safety-focused             | 8.5/10   |
| **GPT-4o**            | OpenAI    | $0.01-0.06       | 128K    | Multimodal, general purpose              | 8.0/10   |
| **Gemini 1.5 Pro**    | Google    | $0.00125-0.005   | 1M+     | Very long documents                      | 7.5/10   |
| **Llama 3.1 405B**    | Meta      | Free (self-host) | 128K    | Customization, privacy                   | 6.0/10   |

**Recommendation:** ✅ **GPT-5** - Best balance of cost, quality, and speed

---

#### Image Generation Models

| Model                  | Provider | Cost/Image | Resolution | Speed  | Quality   | Best For                  |
| ---------------------- | -------- | ---------- | ---------- | ------ | --------- | ------------------------- |
| **Ideogram Turbo**     | Ideogram | $0.025     | 1024×1024  | 5-10s  | Excellent | Budget, high-volume ⭐     |
| **Ideogram V2**        | Ideogram | $0.080     | 1024×1024  | 10-15s | Premium   | Professional quality      |
| **Nano Banana Pro 2K** | Google   | $0.134     | 2048×2048  | 15-20s | Ultra     | Print materials           |
| **Nano Banana Pro 4K** | Google   | $0.240     | 4096×4096  | 20-30s | Maximum   | Billboards, large format  |
| **Gemini Imagen 3**    | Google   | $0.020     | 1024×1024  | 8-12s  | Good      | Alternative budget option |

**Note:** Gemini Imagen 3 is cheaper but has inferior text rendering compared to Ideogram Turbo.

---

### Complete Cost Breakdown by AI Stack

#### Stack 1: Budget (Default - 90% of use cases)
```
Text: GPT-5 ($0.004)
Image: Ideogram Turbo ($0.025)
Total: $0.033/infographic
```
- **Best for:** Free, Solo, Team tiers
- **Monthly cost (1000 infos):** $33
- **Quality:** Excellent for web/social media
- **Speed:** Fastest (5-10 seconds)

#### Stack 2: Standard (Premium Option)
```
Text: GPT-5 ($0.004)
Image: Ideogram V2 ($0.080)
Total: $0.088/infographic
```
- **Best for:** Team, Brokerage tiers (premium quality)
- **Monthly cost (1000 infos):** $88
- **Quality:** Premium, professional presentations
- **Speed:** Moderate (10-15 seconds)

#### Stack 3: Premium (High-Resolution)
```
Text: GPT-5 ($0.004)
Image: Nano Banana Pro 2K ($0.134)
Total: $0.142/infographic
```
- **Best for:** Brokerage tier, print materials
- **Monthly cost (1000 infos):** $142
- **Quality:** Ultra-high resolution (2K)
- **Speed:** Slower (15-20 seconds)

#### Stack 4: Ultra-Premium (Maximum Quality)
```
Text: GPT-5 ($0.004)
Image: Nano Banana Pro 4K ($0.240)
Total: $0.248/infographic
```
- **Best for:** Enterprise, billboards, large format
- **Monthly cost (1000 infos):** $248
- **Quality:** Maximum resolution (4K)
- **Speed:** Slowest (20-30 seconds)

#### Stack 5: Alternative Budget (Gemini)
```
Text: Gemini 1.5 Pro ($0.00125-0.005)
Image: Gemini Imagen 3 ($0.020)
Total: $0.021-0.025/infographic
```
- **Best for:** Cost optimization, backup option
- **Monthly cost (1000 infos):** $21-25
- **Quality:** Good (but inferior text rendering)
- **Speed:** Moderate (8-12 seconds)
- **⚠️ Limitation:** Poor text legibility compared to Ideogram

---

## 💵 Current Plan Profitability (All AI Models)

### Assumptions
- **Exchange Rate:** ₹83 = $1 USD
- **Operating Costs:** 20% of revenue
- **Payment Processing:** 2% of revenue (RazorPay)

### SOLO Plan Analysis

#### Using Budget Stack ($0.033/infographic)
| Metric             | Monthly   | Annual (15% off) | Annual (20% off) |
| ------------------ | --------- | ---------------- | ---------------- |
| **Price**          | ₹2,999    | ₹30,588          | ₹28,790          |
| **Limit**          | 50 infos  | 600 infos        | 600 infos        |
| **Direct Cost**    | ₹137      | ₹1,644           | ₹1,644           |
| **Operating Cost** | ₹600      | ₹6,118           | ₹5,758           |
| **Payment Fees**   | ₹60       | ₹612             | ₹576             |
| **Total Cost**     | ₹797      | ₹8,374           | ₹7,978           |
| **Profit**         | ₹2,202    | ₹1,752/month     | ₹1,601/month     |
| **Margin**         | **73.4%** | **68.7%**        | **66.7%**        |

#### Using Standard Stack ($0.088/infographic) - Premium Option
| Metric          | Monthly   | Annual (15% off) |
| --------------- | --------- | ---------------- |
| **Price**       | ₹2,999    | ₹30,588          |
| **Direct Cost** | ₹365      | ₹4,380           
| **Total Cost**  | ₹1,025    | ₹10,570          |
| **Profit**      | ₹1,974    | ₹1,502/month     |
| **Margin**      | **65.8%** | **60.1%**        |

**⚠️ Risk:** If customers use premium models, margins drop significantly.

---

### TEAM Plan Analysis

#### Using Budget Stack ($0.033/infographic)
| Metric          | Monthly   | Annual (15% off) |
| --------------- | --------- | ---------------- |
| **Price**       | ₹6,999    | ₹71,388          |
| **Limit**       | 200 infos | 2,400 infos      |
| **Direct Cost** | ₹548      | ₹6,576           |
| **Total Cost**  | ₹2,088    | ₹22,282          |
| **Profit**      | ₹4,911    | ₹3,861/month     |
| **Margin**      | **70.2%** | **64.9%**        |

#### Using Standard Stack ($0.088/infographic) - Premium Option
| Metric          | Monthly   | Annual (15% off) |
| --------------- | --------- | ---------------- |
| **Direct Cost** | ₹1,460    | ₹17,520          |
| **Total Cost**  | ₹2,998    | ₹35,982          |
| **Profit**      | ₹4,001    | ₹2,961/month     |
| **Margin**      | **57.2%** | **51.2%**        |

**⚠️ Risk:** Premium model usage reduces margins by 13-14 percentage points.

---

### BROKERAGE Plan Analysis

#### Using Budget Stack ($0.033/infographic)
| Metric          | Monthly     | Annual (15% off) |
| --------------- | ----------- | ---------------- |
| **Price**       | ₹24,999     | ₹254,988         |
| **Limit**       | 1,000 infos | 12,000 infos     |
| **Direct Cost** | ₹2,740      | ₹32,880          |
| **Total Cost**  | ₹8,240      | ₹88,978          |
| **Profit**      | ₹16,759     | ₹13,009/month    |
| **Margin**      | **67.0%**   | **61.2%**        |

#### Using Premium Stack ($0.142/infographic) - Expected for Brokerage
| Metric          | Monthly   | Annual (15% off) |
| --------------- | --------- | ---------------- |
| **Direct Cost** | ₹11,786   | ₹141,432         |
| **Total Cost**  | ₹17,286   | ₹197,530         |
| **Profit**      | ₹7,713    | ₹4,763/month     |
| **Margin**      | **30.9%** | **25.4%**        |

**⚠️ Critical:** Premium model usage reduces margins to 25-31% - still profitable but risky.

---

## 🎯 Cost Optimization Strategy

### Strategy 1: Tiered AI Model Access

**Problem:** Customers using premium models reduce margins significantly.

**Solution:** Restrict AI model access by plan tier.

| Plan Tier     | Default Model  | Premium Models Available    | Additional Cost |
| ------------- | -------------- | --------------------------- | --------------- |
| **FREE**      | Ideogram Turbo | None                        | -               |
| **SOLO**      | Ideogram Turbo | Ideogram V2                 | +₹500/month     |
| **TEAM**      | Ideogram Turbo | Ideogram V2, Nano Banana 2K | +₹1,000/month   |
| **BROKERAGE** | Ideogram Turbo | All models                  | Included        |

**Benefits:**
- ✅ Protects margins on lower tiers
- ✅ Creates upsell opportunity
- ✅ Premium tiers get value-add
- ✅ Reduces unexpected cost spikes

---

### Strategy 2: Usage-Based Premium Model Pricing

**Alternative Approach:** Charge per premium generation.

| Model              | Cost/Image | Charge to Customer | Margin |
| ------------------ | ---------- | ------------------ | ------ |
| **Ideogram Turbo** | $0.033     | Included in plan   | 73%    |
| **Ideogram V2**    | $0.088     | +₹5 per image      | 94%    |
| **Nano Banana 2K** | $0.142     | +₹15 per image     | 90%    |
| **Nano Banana 4K** | $0.248     | +₹25 per image     | 90%    |

**Benefits:**
- ✅ Customers pay for what they use
- ✅ High margins on premium models
- ✅ No unexpected cost spikes
- ✅ Clear value proposition

---

### Strategy 3: Model Selection by Use Case

**Smart Defaults:** Automatically select model based on use case.

| Use Case             | Recommended Model | Cost   | Rationale                        |
| -------------------- | ----------------- | ------ | -------------------------------- |
| **Web/Social Media** | Ideogram Turbo    | $0.033 | Sufficient quality, fastest      |
| **Email Marketing**  | Ideogram Turbo    | $0.033 | Good quality, cost-effective     |
| **Print Materials**  | Nano Banana 2K    | $0.142 | High resolution needed           |
| **Billboards**       | Nano Banana 4K    | $0.248 | Maximum resolution               |
| **Presentations**    | Ideogram V2       | $0.088 | Premium quality, reasonable cost |

**Implementation:**
- Detect use case from user input
- Suggest optimal model
- Allow override for premium tiers

---

### Strategy 4: Gemini as Backup/Cost Optimization

**Use Gemini When:**
- ✅ Ideogram API is down
- ✅ Cost optimization needed (20% cheaper)
- ✅ Non-critical text rendering
- ✅ High-volume batch processing

**Limitations:**
- ⚠️ Inferior text legibility
- ⚠️ Not recommended for property listings
- ⚠️ Use only as backup

---

## 💰 Revenue & Sales Optimization Matrix

### Optimization Strategy Matrix

| Strategy                        | Impact on Revenue     | Impact on Costs        | Implementation Effort | Priority |
| ------------------------------- | --------------------- | ---------------------- | --------------------- | -------- |
| **Tiered AI Model Access**      | +15-20%               | -10-15%                | Medium                | 🔴 High   |
| **Usage-Based Premium Pricing** | +10-15%               | -5-10%                 | Medium                | 🔴 High   |
| **Free Trial (7 days)**         | +25-30% conversion    | +5% (acquisition cost) | Low                   | 🔴 High   |
| **Annual Discount (15%)**       | +20% retention        | -15% revenue           | Low                   | 🟡 Medium |
| **Freemium Credits**            | +40% signups          | +10% (free users)      | Low                   | 🟡 Medium |
| **Upsell Premium Models**       | +5-10% ARPU           | +0% (customer pays)    | Low                   | 🟢 Low    |
| **Regional Pricing**            | +30-50% (new markets) | +0%                    | High                  | 🟡 Medium |
| **Referral Program**            | +15-20% growth        | -5% (discounts)        | Medium                | 🟢 Low    |

---

### Revenue Optimization Strategies

#### 1. Free Trial Period Strategy

**Option A: 7-Day Free Trial (Recommended)**
- **Duration:** 7 days
- **Credits:** 10 infographics
- **No Credit Card Required:** Yes (for maximum signups)
- **Conversion Rate:** 25-30% (industry average)
- **Cost per Trial:** ₹27.40 (10 × ₹2.74)
- **LTV Impact:** +₹30,000-50,000 per converted customer

**Option B: 14-Day Free Trial**
- **Duration:** 14 days
- **Credits:** 20 infographics
- **Conversion Rate:** 30-35% (higher engagement)
- **Cost per Trial:** ₹54.80
- **LTV Impact:** +₹35,000-60,000 per converted customer

**Option C: 30-Day Free Trial**
- **Duration:** 30 days
- **Credits:** 30 infographics
- **Conversion Rate:** 35-40% (highest engagement)
- **Cost per Trial:** ₹82.20
- **LTV Impact:** +₹40,000-70,000 per converted customer

**Recommendation:** ✅ **7-Day Free Trial with 10 Credits**
- Best balance of conversion rate and cost
- Low barrier to entry
- Sufficient to demonstrate value

---

#### 2. Freemium Plan Optimization

**Current FREE Plan:**
- **Credits:** 3 infographics/month
- **Cost:** ₹8.22/month
- **Purpose:** Customer acquisition

**Recommended FREE Plan Options:**

| Option       | Credits    | Duration         | Cost/Month | Conversion Rate | Recommendation   |
| ------------ | ---------- | ---------------- | ---------- | --------------- | ---------------- |
| **Current**  | 3/month    | Unlimited        | ₹8.22      | 5-10%           | ⚠️ Low conversion |
| **Option A** | 5/month    | Unlimited        | ₹13.70     | 8-12%           | ✅ Better         |
| **Option B** | 10/month   | First month only | ₹27.40     | 15-20%          | ✅ Best           |
| **Option C** | 10 credits | One-time         | ₹27.40     | 12-18%          | ✅ Good           |

**Recommendation:** ✅ **Option B - 10 Credits First Month Only**
- Higher conversion rate (15-20%)
- Lower long-term cost (only first month)
- Creates urgency to upgrade
- Better value demonstration

---

#### 3. Annual Discount Strategy

**Current Recommendation:** 15% annual discount (standard)

**Impact Analysis:**

| Discount | Revenue Impact | Margin Impact | Customer Value | Recommendation    |
| -------- | -------------- | ------------- | -------------- | ----------------- |
| **10%**  | -10%           | -3-4%         | Low            | ⚠️ Not competitive |
| **15%**  | -15%           | -4-5%         | Good           | ✅ Standard        |
| **20%**  | -20%           | -6-8%         | High           | ⚠️ Use sparingly   |
| **25%**  | -25%           | -8-10%        | Very High      | ❌ Too aggressive  |

**Implementation:**
- **Standard:** 15% for all annual subscriptions
- **Premium:** 20% for 2+ year commitments
- **Enterprise:** Custom pricing (negotiated)

---

#### 4. Upsell & Cross-Sell Opportunities

**Premium Model Upsell:**
- **Target:** SOLO and TEAM tiers
- **Offer:** Access to Ideogram V2 or Nano Banana Pro
- **Pricing:** +₹500-1,000/month or pay-per-use
- **Revenue Impact:** +5-10% ARPU

**Feature Upsells:**
- **Advanced Analytics:** +₹500/month
- **Priority Support:** +₹300/month
- **Custom Branding:** +₹1,000/month
- **API Access:** Upgrade to API tier

**Bundle Offers:**
- **Annual + Premium Models:** 20% discount + free premium access
- **Team + API:** Combined discount
- **Brokerage + Enterprise Support:** Custom package

---

#### 5. Referral Program

**Structure:**
- **Referrer Gets:** 1 month free (or ₹2,000 credit)
- **Referee Gets:** 20% off first month
- **Cost:** ₹2,000-3,000 per referral
- **LTV:** ₹30,000-50,000 per customer
- **ROI:** 10-15x return

**Implementation:**
- Track referrals via unique codes
- Automatic credit application
- Dashboard for referrers
- Leaderboard for top referrers

---

## 🎁 Free Trial & Freemium Recommendations

### Recommended Free Trial Structure

#### Primary Recommendation: 7-Day Free Trial

**Structure:**
- **Duration:** 7 days
- **Credits:** 10 infographics
- **Access:** Full features (all templates, all models)
- **No Credit Card:** Required for signup
- **Auto-Convert:** To FREE plan after trial ends
- **Upgrade Prompt:** Day 5, 6, 7 (gentle reminders)

**Cost Analysis:**
- **Cost per Trial:** ₹27.40 (10 × ₹2.74)
- **Expected Conversion:** 25-30%
- **Cost per Conversion:** ₹91-110
- **LTV per Customer:** ₹30,000-50,000
- **ROI:** 270-550x

**Benefits:**
- ✅ Low barrier to entry
- ✅ Sufficient to demonstrate value
- ✅ Industry-standard duration
- ✅ High conversion potential

---

### Freemium Plan Recommendations

#### Option 1: Enhanced FREE Plan (Recommended)

**Structure:**
- **Credits:** 5 infographics/month (up from 3)
- **Duration:** Unlimited
- **Features:** Basic templates, email support
- **AI Model:** Ideogram Turbo only
- **Cost:** ₹13.70/month

**Rationale:**
- Better value demonstration
- Higher conversion rate (8-12%)
- Still manageable cost
- Creates upgrade incentive

---

#### Option 2: First Month Boost

**Structure:**
- **First Month:** 10 infographics
- **Subsequent Months:** 3 infographics/month
- **Duration:** Unlimited
- **Cost:** ₹27.40 (first month) + ₹8.22/month (ongoing)

**Rationale:**
- Higher initial engagement
- Better conversion (15-20%)
- Lower long-term cost
- Creates urgency

---

#### Option 3: One-Time Credits

**Structure:**
- **One-Time:** 10 credits (no expiration)
- **No Monthly Credits:** After initial 10
- **Cost:** ₹27.40 one-time

**Rationale:**
- Lowest long-term cost
- Good for testing
- Clear upgrade path
- Simple to understand

---

### Final Recommendation: Hybrid Approach

**Combination Strategy:**

1. **Free Trial:** 7 days, 10 credits, no credit card
2. **Freemium Plan:** 5 credits/month (after trial)
3. **Upgrade Incentives:** 
   - 20% off first month
   - Bonus 10 credits on upgrade
   - Access to premium templates

**Benefits:**
- ✅ Maximum signups (no credit card barrier)
- ✅ Good value demonstration (10 credits)
- ✅ Ongoing engagement (5/month)
- ✅ Clear upgrade path

---

## 📊 Complete Pricing Recommendation Matrix

### India (Primary Market)

| Plan          | Monthly | Annual (15% off) | Free Trial          | Freemium        | Status     |
| ------------- | ------- | ---------------- | ------------------- | --------------- | ---------- |
| **FREE**      | ₹0      | N/A              | N/A                 | 5 credits/month | ✅ Enhanced |
| **SOLO**      | ₹2,999  | ₹30,588          | 7 days, 10 credits  | N/A             | ✅ Optimal  |
| **TEAM**      | ₹6,999  | ₹71,388          | 7 days, 10 credits  | N/A             | ✅ Optimal  |
| **BROKERAGE** | ₹24,999 | ₹254,988         | 14 days, 20 credits | N/A             | ✅ Optimal  |

---

### International Markets

#### United States
| Plan          | Monthly | Annual (15% off) | Free Trial          |
| ------------- | ------- | ---------------- | ------------------- |
| **FREE**      | $0      | N/A              | 7 days, 10 credits  |
| **SOLO**      | $49     | $499             | 7 days, 10 credits  |
| **TEAM**      | $99     | $1,009           | 7 days, 10 credits  |
| **BROKERAGE** | $299    | $3,049           | 14 days, 20 credits |

#### United Kingdom
| Plan          | Monthly | Annual (15% off) | Free Trial          |
| ------------- | ------- | ---------------- | ------------------- |
| **FREE**      | £0      | N/A              | 7 days, 10 credits  |
| **SOLO**      | £39     | £398             | 7 days, 10 credits  |
| **TEAM**      | £79     | £806             | 7 days, 10 credits  |
| **BROKERAGE** | £239    | £2,438           | 14 days, 20 credits |

#### European Union
| Plan          | Monthly | Annual (15% off) | Free Trial          |
| ------------- | ------- | ---------------- | ------------------- |
| **FREE**      | €0      | N/A              | 7 days, 10 credits  |
| **SOLO**      | €45     | €459             | 7 days, 10 credits  |
| **TEAM**      | €89     | €908             | 7 days, 10 credits  |
| **BROKERAGE** | €269    | €2,743           | 14 days, 20 credits |

---

## 🎯 Implementation Priority Matrix

### High Priority (Implement Immediately)

1. **✅ Free Trial (7 days, 10 credits)**
   - Impact: +25-30% conversion
   - Effort: Low
   - Cost: ₹27.40 per trial

2. **✅ Enhanced FREE Plan (5 credits/month)**
   - Impact: +8-12% conversion
   - Effort: Low
   - Cost: ₹13.70/month per free user

3. **✅ Tiered AI Model Access**
   - Impact: +15-20% revenue, -10-15% costs
   - Effort: Medium
   - Cost: Development time

---

### Medium Priority (Implement in Q1)

4. **🟡 Usage-Based Premium Pricing**
   - Impact: +10-15% revenue
   - Effort: Medium
   - Cost: Development time

5. **🟡 Annual Discount (15% standard)**
   - Impact: +20% retention
   - Effort: Low
   - Cost: -15% revenue

6. **🟡 Referral Program**
   - Impact: +15-20% growth
   - Effort: Medium
   - Cost: ₹2,000-3,000 per referral

---

### Low Priority (Future Enhancements)

7. **🟢 Regional Pricing**
   - Impact: +30-50% (new markets)
   - Effort: High
   - Cost: Market research, localization

8. **🟢 Advanced Upsells**
   - Impact: +5-10% ARPU
   - Effort: Medium
   - Cost: Feature development

---

## 📈 Revenue Projections

### Scenario 1: Current Pricing (No Changes)

**Assumptions:**
- 100 customers/month growth
- 70% SOLO, 20% TEAM, 10% BROKERAGE
- 5% monthly churn
- No free trial

**Year 1 Revenue:**
- Month 12: ₹2,099,300/month
- Annual: ₹25,191,600
- Average Margin: 70%

---

### Scenario 2: With Free Trial + Enhanced FREE

**Assumptions:**
- 150 customers/month growth (+50%)
- 25% conversion from free trial
- 10% conversion from freemium
- 70% SOLO, 20% TEAM, 10% BROKERAGE
- 4% monthly churn (improved retention)

**Year 1 Revenue:**
- Month 12: ₹3,148,950/month
- Annual: ₹37,787,400
- Average Margin: 68% (slightly lower due to free users)
- **Increase:** +50% revenue

---

### Scenario 3: With All Optimizations

**Assumptions:**
- 200 customers/month growth (+100%)
- Free trial + freemium + tiered AI access
- Premium model upsells (+10% ARPU)
- Referral program (+20% growth)
- 3% monthly churn

**Year 1 Revenue:**
- Month 12: ₹4,198,600/month
- Annual: ₹50,383,200
- Average Margin: 65% (lower due to optimizations)
- **Increase:** +100% revenue

---

## ✅ Final Recommendations

### Immediate Actions (Week 1)

1. **✅ Implement 7-Day Free Trial**
   - 10 credits, no credit card required
   - Auto-convert to FREE plan
   - Upgrade prompts on days 5-7

2. **✅ Enhance FREE Plan**
   - Increase to 5 credits/month
   - Keep Ideogram Turbo only
   - Basic templates

3. **✅ Standardize Annual Discount**
   - 15% for all annual subscriptions
   - 20% for 2+ year commitments only

---

### Short-Term Actions (Month 1)

4. **🟡 Implement Tiered AI Model Access**
   - FREE/SOLO: Ideogram Turbo only
   - TEAM: + Ideogram V2 option (+₹500/month)
   - BROKERAGE: All models included

5. **🟡 Add Usage-Based Premium Pricing**
   - Pay-per-use for premium models
   - Clear pricing display
   - Usage tracking dashboard

---

### Medium-Term Actions (Quarter 1)

6. **🟡 Launch Referral Program**
   - 1 month free for referrer
   - 20% off for referee
   - Tracking dashboard

7. **🟡 Regional Pricing Implementation**
   - US, UK, EU markets
   - Localized payment methods
   - Currency conversion

---

## 📝 Cost Monitoring & Optimization

### Monthly Metrics to Track

1. **Cost per Infographic by Model**
   - Ideogram Turbo: Target $0.033
   - Ideogram V2: Target $0.088
   - Nano Banana: Target $0.142-0.248

2. **Model Usage Distribution**
   - % using Turbo vs Premium models
   - Cost impact of premium usage
   - Revenue from premium upsells

3. **Free Trial Metrics**
   - Signup rate
   - Conversion rate
   - Cost per conversion
   - LTV of trial customers

4. **Freemium Metrics**
   - Free user count
   - Conversion rate to paid
   - Cost per free user
   - Time to conversion

---

## 🎯 Success Metrics

### Key Performance Indicators (KPIs)

| Metric                              | Current | Target (3 months) | Target (6 months) |
| ----------------------------------- | ------- | ----------------- | ----------------- |
| **Monthly Recurring Revenue (MRR)** | -       | ₹2,000,000        | ₹4,000,000        |
| **Customer Acquisition Cost (CAC)** | -       | ₹500              | ₹400              |
| **Lifetime Value (LTV)**            | -       | ₹40,000           | ₹50,000           |
| **LTV:CAC Ratio**                   | -       | 80:1              | 125:1             |
| **Monthly Churn Rate**              | -       | 4%                | 3%                |
| **Free Trial Conversion**           | -       | 25%               | 30%               |
| **Freemium Conversion**             | -       | 10%               | 12%               |
| **Average Margin**                  | 70%     | 68%               | 65%               |

---

## 📚 Appendix: AI Model Decision Tree

### When to Use Which Model?

```
Start
  │
  ├─ Web/Social Media Use?
  │   └─ YES → Ideogram Turbo ($0.033) ✅
  │
  ├─ Print Materials Needed?
  │   └─ YES → Nano Banana 2K ($0.142) ✅
  │
  ├─ Billboards/Large Format?
  │   └─ YES → Nano Banana 4K ($0.248) ✅
  │
  ├─ Professional Presentation?
  │   └─ YES → Ideogram V2 ($0.088) ✅
  │
  └─ Default → Ideogram Turbo ($0.033) ✅
```

---

**Status:** ✅ **Comprehensive Analysis Complete**

**Next Steps:**
1. Review and approve recommendations
2. Implement free trial (Week 1)
3. Enhance FREE plan (Week 1)
4. Implement tiered AI access (Month 1)
5. Monitor metrics and optimize

---

*Originally written: January 2025 — cost figures in the body below the June 2026 section are SUPERSEDED*  
*June 2026 update: default model = V4 Turbo ($0.03/image); cost per event (3 variations) = $0.094*  
*Exchange Rate used in June 2026 analysis: ₹85 = $1 USD*
