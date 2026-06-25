# PR Task List — US-AI-002

> **Story:** [STORY.md](./STORY.md)
> **Branch:** `fix/ai-us-ai-002-gpt-model-id`
> **PR:** #_____ (fill when opened)
> **Linear:** LIN-US-AI-002
> **Type:** fix

---

## PR Scope Summary

**One-liner:** Replace non-existent gpt-5 model ID with gpt-4o in OpenAI service and config
```
fix(ai): replace gpt-5 with gpt-4o in openai.service.ts and ai-models.config.ts — US-AI-002
```

---

## Task Breakdown

### T1 — Fix model ID in openai.service.ts
**File:** `api/src/modules/ai-generation/services/openai.service.ts`
**AC(s) covered:** AC1
**Changes:**
- Replace every occurrence of `'gpt-5'` with `'gpt-4o'`
- Typical location: `model: 'gpt-5'` inside OpenAI chat completion calls

**Commit:**
```bash
git add api/src/modules/ai-generation/services/openai.service.ts
git commit -m "fix(ai): replace gpt-5 with gpt-4o in openai.service.ts — US-AI-002"
```

### T2 — Update ai-models.config.ts
**File:** `api/src/config/ai-models.config.ts`
**AC(s) covered:** AC2
**Changes:**
- Rename `gpt5PerRequest` → `gpt4oPerRequest` (keep value $0.004)
- Update any references to this key in other files (grep: `gpt5PerRequest`)

**Commit:**
```bash
git add api/src/config/ai-models.config.ts
git commit -m "fix(ai): rename gpt5PerRequest to gpt4oPerRequest in config — US-AI-002"
```

---

## Exact Test Commands

```bash
# 1. Verify no gpt-5 remains
grep -r "gpt-5" api/src/ --include="*.ts"
# Expected: zero results

# 2. TypeScript check
npm run check

# 3. Unit tests
npm run test:unit
```

---

## Task Checklist

- [ ] T1 — Replace gpt-5 with gpt-4o in openai.service.ts
- [ ] T2 — Rename config key in ai-models.config.ts + update references
- [ ] `grep -r "gpt-5" api/src/` returns zero results ✅
- [ ] `npm run check` passes ✅
- [ ] `npm run test:unit` passes ✅
- [ ] PR opened with story card as description ✅
- [ ] STORY.md ACs updated ✅

---

*Tasks created: 2026-04-28*
