# PR Task List — US-AI-004

> **Story:** [STORY.md](./STORY.md)
> **Branch:** `fix/ai-us-ai-004-nano-banana-pro`
> **PR:** #_____ (fill when opened)
> **Linear:** LIN-US-AI-004
> **Type:** fix

---

## PR Scope Summary

**One-liner:** Replace Ideogram V2 with Nano Banana Pro for TEAM/BROKERAGE and fully retire Ideogram
```
fix(ai): replace Ideogram V2 with Nano Banana Pro for TEAM/BROKERAGE, retire Ideogram — US-AI-004
```

---

## Task Breakdown

### T1 — Add Nano Banana Pro config entry + remove Ideogram entries
**File:** `api/src/config/ai-models.config.ts`
**AC(s) covered:** AC3, AC4
**Changes:**
- Add `'nano-banana-pro': { name: 'Campaign Quality', costPerImage: 0.10 }` entry
- Remove all `ideogram-*` entries

**Commit:**
```bash
git add api/src/config/ai-models.config.ts
git commit -m "fix(ai): add nano-banana-pro config, remove Ideogram entries — US-AI-004"
```

### T2 — Route TEAM/BROKERAGE to Nano Banana Pro + remove Ideogram
**File:** `api/src/modules/ai-generation/services/image-generation.service.ts`
**AC(s) covered:** AC1, AC4, AC5
**Changes:**
- Add TEAM/BROKERAGE → Nano Banana Pro routing
- Remove all `IdeogramClient` imports, calls, and error handling
- Remove `IDEOGRAM_API_KEY` references from this file

**Commit:**
```bash
git add api/src/modules/ai-generation/services/image-generation.service.ts
git commit -m "fix(ai): route TEAM/BROKERAGE to Nano Banana Pro, remove Ideogram client — US-AI-004"
```

### T3 — Remove IDEOGRAM_API_KEY from env template
**File:** `.env.example`
**AC(s) covered:** AC4
**Changes:**
- Remove `IDEOGRAM_API_KEY` line (Ideogram is retired)

**Commit:**
```bash
git add .env.example
git commit -m "fix(ai): remove IDEOGRAM_API_KEY from env template — US-AI-004"
```

---

## Exact Test Commands

```bash
# 1. Verify Ideogram fully removed
grep -r "ideogram" api/src/ --include="*.ts" -i
# Expected: zero results

# 2. TypeScript check
npm run check

# 3. Unit tests
npm run test:unit

# 4. Manual flow
# Generate on TEAM plan → verify server logs show Nano Banana Pro
# Generate on FREE plan (from US-AI-003) → verify still uses Nano Banana Flash
```

---

## Task Checklist

- [ ] T1 — Add nano-banana-pro config, remove Ideogram entries from config
- [ ] T2 — Route TEAM/BROKERAGE to Nano Banana Pro, remove Ideogram client code
- [ ] T3 — Remove IDEOGRAM_API_KEY from .env.example
- [ ] `grep -r "ideogram" api/src/` returns zero results ✅
- [ ] `npm run check` passes ✅
- [ ] `npm run test:unit` passes ✅
- [ ] Manual test: TEAM plan uses Pro, FREE plan uses Flash ✅
- [ ] PR opened ✅
- [ ] STORY.md ACs updated ✅

---

*Tasks created: 2026-04-28*
