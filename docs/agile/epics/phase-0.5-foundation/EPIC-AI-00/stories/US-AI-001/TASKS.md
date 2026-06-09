# PR Task List — US-AI-001

> **Story:** [STORY.md](./STORY.md)
> **Branch:** `fix/ai-us-ai-001-socket-gateway`
> **PR:** #_____ (fill when opened)
> **Linear:** LIN-US-AI-001
> **Type:** fix

---

## Three Pillars Pre-flight

- [ ] **Brain** — STORY.md ACs written ✅
- [ ] **Muscle** — This TASKS.md has file list + ordered tasks + exact test commands ✅
- [ ] **Map** — [ARCHITECTURE.mmd](../../ARCHITECTURE.mmd) exists ✅
- [ ] **Env** — Run `npm run dev` and confirm NestJS starts on :3001

---

## PR Scope Summary

**One-liner:** Wire GenerationProgressGateway into NestJS module so Socket.io progress events reach the browser
```
fix(ai): register GenerationProgressGateway in module providers — US-AI-001
```

---

## Task Breakdown

### T1 — Find GenerationProgressGateway file
**File:** search `api/src/`
**AC(s) covered:** AC1
**Changes:**
- Run: `grep -r "WebSocketGateway" api/src/ --include="*.ts" -l` to find the gateway file path
- Note the file path for T2

### T2 — Register gateway in module providers
**File:** `api/src/modules/infographics/infographics.module.ts`
**AC(s) covered:** AC1
**Changes:**
- Import `GenerationProgressGateway` at top of file
- Add `GenerationProgressGateway` to the `providers` array in `@Module({})`

**Commit:**
```bash
git add api/src/modules/infographics/infographics.module.ts
git commit -m "fix(ai): register GenerationProgressGateway in InfographicsModule — US-AI-001"
```

### T3 — Verify AppModule imports InfographicsModule
**File:** `api/src/app.module.ts`
**AC(s) covered:** AC1, AC2
**Changes:**
- Confirm `InfographicsModule` is in `AppModule` imports (read-only verification, no change if already there)

---

## File-to-Task Mapping

| File | Task(s) | AC(s) | Notes |
|------|---------|-------|-------|
| `api/src/modules/infographics/infographics.module.ts` | T2 | AC1 | add to providers |
| `api/src/app.module.ts` | T3 | AC1 | verify only |

---

## Exact Test Commands

```bash
# 1. TypeScript check — must pass before PR
npm run check

# 2. Unit tests — must pass before PR
npm run test:unit

# 3. Manual flow
# Start: npm run dev
# Open localhost:5000 → start an infographic generation
# Open browser DevTools → Network → WS tab → look for "generation:progress" frames
# Progress steps should appear in the AI chat panel
```

---

## Task Checklist

- [ ] T1 — Find GenerationProgressGateway file path
- [ ] T2 — Register gateway in InfographicsModule providers
- [ ] T3 — Verify AppModule imports InfographicsModule
- [ ] `npm run check` passes ✅
- [ ] `npm run test:unit` passes ✅
- [ ] Manual test: Socket.io progress events visible in WS tab ✅
- [ ] PR opened with story card as description ✅
- [ ] STORY.md ACs updated ✅

---

## Anti-Patterns to Avoid in This Story

- Do NOT change the gateway event payload structure or event names
- Do NOT refactor the gateway class logic
- Do NOT add new Socket.io events

---

## PR Open Command

```bash
gh pr create \
  --title "[US-AI-001] Wire Socket.io Gateway to AppModule" \
  --label "epic:ai,type:fix,priority:P0" \
  --body "$(cat docs/agile/epics/phase-0.5-foundation/EPIC-AI-00/stories/US-AI-001/STORY.md)"
```

---

*Tasks created: 2026-04-28*
