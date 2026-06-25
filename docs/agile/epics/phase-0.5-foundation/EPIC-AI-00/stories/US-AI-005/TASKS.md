# PR Task List — US-AI-005

> **Story:** [STORY.md](./STORY.md)
> **Branch:** `fix/ai-us-ai-005-persist-extraction`
> **PR:** #_____ (fill when opened)
> **Linear:** LIN-US-AI-005
> **Type:** fix

---

## PR Scope Summary

**One-liner:** Call prisma.extraction.create() after GPT extraction so regeneration flows don't 404
```
fix(ai): persist extraction to DB after GPT parse — US-AI-005
```

---

## Task Breakdown

### T1 — Add prisma.extraction.create() call in prompt-extractor.service.ts
**File:** `api/src/modules/infographics/services/prompt-extractor.service.ts`
**AC(s) covered:** AC1, AC2, AC3
**Changes:**
- Import `prisma` from singleton: `import { prisma } from '../../../database/prisma.client'`
- After the GPT extraction response is parsed, add:
  ```typescript
  await prisma.extraction.create({
    data: {
      conversationId: conversationId,
      propertyAddress: extractedData.address ?? '',
      extractedData: extractedData as any,
    },
  });
  ```
- Placement: before image generation is triggered (so extraction is saved even if image fails)

**Commit:**
```bash
git add api/src/modules/infographics/services/prompt-extractor.service.ts
git commit -m "fix(ai): persist extraction to DB after GPT parse — US-AI-005"
```

---

## File-to-Task Mapping

| File | Task(s) | AC(s) | Notes |
|------|---------|-------|-------|
| `api/src/modules/infographics/services/prompt-extractor.service.ts` | T1 | AC1, AC2, AC3 | add create() call |

---

## Exact Test Commands

```bash
# 1. TypeScript check
npm run check

# 2. Unit tests
npm run test:unit

# 3. Manual verification
# npx prisma studio --schema=api/prisma/schema.prisma
# Run a generation on localhost:5000
# Open Prisma Studio → Extraction table → verify new row appears
```

---

## Task Checklist

- [ ] T1 — Add prisma.extraction.create() in prompt-extractor.service.ts
- [ ] `npm run check` passes ✅
- [ ] `npm run test:unit` passes ✅
- [ ] Extraction table has new row after generation (Prisma Studio) ✅
- [ ] Regeneration returns 200 not 404 ✅
- [ ] PR opened ✅
- [ ] STORY.md ACs updated ✅

---

## Anti-Patterns to Avoid in This Story

- Do NOT change the GPT extraction prompt or response parsing logic
- Do NOT refactor the service class structure
- Do NOT add a try/catch that silently swallows the DB error

---

*Tasks created: 2026-04-28*
