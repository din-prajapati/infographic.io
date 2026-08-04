# PR Task List — US-AI-003

> **Story:** [STORY.md](./STORY.md)
> **Branch:** `fix/ai-us-ai-003-nano-banana-flash`
> **PR:** #_____ (fill when opened)
> **Linear:** LIN-US-AI-003
> **Type:** fix

---

## PR Scope Summary

**One-liner:** Replace Ideogram Turbo with Nano Banana Flash for FREE/SOLO image generation tier
```
fix(ai): replace Ideogram Turbo with Nano Banana Flash for FREE/SOLO tier — US-AI-003
```

---

## Task Breakdown

### T1 — Add Nano Banana Flash config entry
**File:** `api/src/config/ai-models.config.ts`
**AC(s) covered:** AC3
**Changes:**
- Add `'nano-banana-flash': { name: 'Quick Generate', costPerImage: 0.016 }` entry
- Keep existing entries temporarily until US-AI-004 removes the last Ideogram entry

**Commit:**
```bash
git add api/src/config/ai-models.config.ts
git commit -m "fix(ai): add nano-banana-flash model config entry — US-AI-003"
```

### T2 — Route FREE/SOLO tier to Nano Banana Flash
**File:** `api/src/modules/ai-generation/services/image-generation.service.ts`
**AC(s) covered:** AC1, AC4
**Changes:**
- Add tier detection: if plan is FREE or SOLO → use Nano Banana Flash API
- Add `NanoBananaFlashClient` (or reuse Google AI SDK) to call Gemini 2.5 Flash Image
- Ensure model name is NOT returned in any response payload

**Commit:**
```bash
git add api/src/modules/ai-generation/services/image-generation.service.ts
git commit -m "fix(ai): route FREE/SOLO generation to Nano Banana Flash — US-AI-003"
```

### T3 — Add env var to .env.example
**File:** `.env.example`
**AC(s) covered:** AC1
**Changes:**
- Add line: `NANO_BANANA_API_KEY=your-google-ai-api-key`

**Commit:**
```bash
git add .env.example
git commit -m "fix(ai): add NANO_BANANA_API_KEY env var template — US-AI-003"
```

---

## File-to-Task Mapping

| File | Task(s) | AC(s) | Notes |
|------|---------|-------|-------|
| `api/src/config/ai-models.config.ts` | T1 | AC3 | add nano-banana-flash entry |
| `api/src/modules/ai-generation/services/image-generation.service.ts` | T2 | AC1, AC4 | plan-tier routing |
| `.env.example` | T3 | AC1 | env var template |

---

## Exact Test Commands

```bash
# 1. TypeScript check
npm run check

# 2. Unit tests
npm run test:unit

# 3. Manual flow
# Start: npm run dev
# Set NANO_BANANA_API_KEY in .env
# Trigger a FREE plan generation
# Check server logs — should show Nano Banana call, NOT Ideogram
# Verify image appears in the result panel
```

---

## Task Checklist

- [ ] T1 — Add nano-banana-flash to ai-models.config.ts
- [ ] T2 — Route FREE/SOLO tier to Nano Banana Flash in image-generation.service.ts
- [ ] T3 — Add NANO_BANANA_API_KEY to .env.example
- [ ] `npm run check` passes ✅
- [ ] `npm run test:unit` passes ✅
- [ ] Manual test: FREE plan generates image via Nano Banana (confirmed in server logs) ✅
- [ ] PR opened ✅
- [ ] STORY.md ACs updated ✅

---

*Tasks created: 2026-04-28*
