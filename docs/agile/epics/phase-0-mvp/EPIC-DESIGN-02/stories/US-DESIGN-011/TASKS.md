# PR Task List — US-DESIGN-011

> **Story:** [STORY.md](./STORY.md)  
> **Branch:** `feat/design-us-design-011-ai-chat-visual`  
> **PR:** #_____  
> **Linear:** LIN-XXX  
> **Type:** feat

---

## Three Pillars Pre-flight

- [ ] **Brain** — STORY.md ACs written, out-of-scope listed, AI prompt ready ✅
- [ ] **Muscle** — This TASKS.md has file list + ordered tasks + exact test commands ✅
- [ ] **Map** — `design-preview-canvas.html` right panel + `design-tokens.css` §Chat Panel tokens
- [ ] **Env** — Read `client/src/components/ai-chat/` first to identify exact component files

---

## PR Scope Summary

**One-liner:**
```
feat(design): AI chat panel visual polish — bubble colors, promo banner, input, chips — US-DESIGN-011
```

---

## Pre-implementation Step

Before starting tasks, read `client/src/components/ai-chat/` to identify:
- Which file is the chat panel container
- Which files render AI vs user message bubbles
- Whether a promo/upgrade banner exists and which file
- Which file is the chat input
- Which files render action chips / quick-reply buttons

---

## Task Breakdown

### T1 — Apply chat panel and message bubble token styles
**File:** `client/src/components/ai-chat/[CHAT_PANEL_FILE]`, `[MESSAGE_BUBBLE_FILE]`  
**AC(s) covered:** AC1, AC2, AC3  
**Changes:** Panel bg → `--chat-panel-bg`; AI bubble → `--chat-message-ai-bg`; user bubble → `--chat-message-user-bg` + `--chat-message-user-text`.

```bash
git add client/src/components/ai-chat/[FILES]
git commit -m "feat(design): T1 apply chat panel and message bubble token styles — US-DESIGN-011"
```

---

### T2 — Apply promo banner and chat input token styles
**File:** `client/src/components/ai-chat/[PROMO_FILE]`, `[INPUT_FILE]`  
**AC(s) covered:** AC4, AC5  
**Changes:** Promo banner → `--chat-promo-banner-bg` + `--chat-promo-banner-text`; input → `--chat-input-bg` + `--chat-input-border`.

```bash
git add client/src/components/ai-chat/[FILES]
git commit -m "feat(design): T2 apply promo banner and input token styles — US-DESIGN-011"
```

---

### T3 — Apply action chip token styles
**File:** `client/src/components/ai-chat/[CHIPS_FILE]`  
**AC(s) covered:** AC6  
**Changes:** Action chips → `--chat-action-chip-bg`, `--chat-action-chip-border`, `--chat-action-chip-text`.

```bash
git add client/src/components/ai-chat/[FILES]
git commit -m "feat(design): T3 apply action chip token styles — US-DESIGN-011"
```

---

## File-to-Task Mapping

| File | Task(s) | AC(s) | Notes |
|------|---------|-------|-------|
| Chat panel container | T1 | AC1 | Identify path before starting |
| Message bubble component(s) | T1 | AC2, AC3 | May be one or two files |
| Promo/upgrade banner | T2 | AC4 | Skip T2 part if banner doesn't exist in UI |
| Chat input component | T2 | AC5 | |
| Action chips component | T3 | AC6 | May be inline in panel or separate file |

---

## Exact Test Commands

```bash
# 1. TypeScript check — must pass before PR
npm run check

# 2. Unit tests — must pass before PR
npm run test:unit

# 3. Manual verification
# Open localhost:5000 → /editor (AI Chat panel should be visible)
# Compare right panel to design-preview-canvas.html
# → AI message: warm grey bubble on left
# → User message: brand blue (#0ca0eb) bubble on right, white text
# → Promo banner (if visible): lime (#e0ff66) with dark text
# → Chat input: white bg, grey border
# → Action chips: blue outlined pills
# → Send a message: AI generation triggers correctly (no regression)
# → Toggle Dark mode: chat panel tokens coherent
```

---

## Task Checklist

- [ ] AI chat component files identified
- [ ] T1 — Chat panel and message bubble styles applied
- [ ] T2 — Promo banner and input styles applied
- [ ] T3 — Action chip styles applied
- [ ] `npm run check` passes ✅
- [ ] `npm run test:unit` passes ✅
- [ ] Manual smoke: AI Chat Light + Dark ✅
- [ ] Message sending + AI response still works ✅
- [ ] Visual match to `design-preview-canvas.html` right panel confirmed ✅
- [ ] PR opened with story card as description ✅
- [ ] STORY.md ACs updated ✅

---

## Anti-Patterns to Avoid

- Do NOT change message sending, WebSocket/Socket.io event handling
- Do NOT change prompt input form submission or keyboard handlers
- Do NOT change conversation loading, history, or pagination
- Do NOT add new chat features (typing indicator, timestamps, etc.)

---

## PR Open Command

```bash
gh pr create \
  --title "[US-DESIGN-011] AI Chat panel visual polish — bubble colors, promo banner, chips" \
  --label "epic:design,type:feat,priority:P2" \
  --body "$(cat docs/agile/epics/EPIC-DESIGN-02/stories/US-DESIGN-011/STORY.md)"
```

---

*Tasks created: 2026-04-17*
