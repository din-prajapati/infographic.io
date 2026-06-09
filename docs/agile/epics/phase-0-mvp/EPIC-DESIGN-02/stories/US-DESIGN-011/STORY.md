# Story Card — US-DESIGN-011

> **Status:** 🔲 Not Started  
> **Feature:** F-DESIGN-11 — Component Visual Polish  
> **Epic:** [EPIC-DESIGN-02](../../EPIC.md)  
> **Milestone:** [M-DESIGN-05 — Component Visual Polish](../../milestones/M-DESIGN-05-component-polish.md)  
> **Linear:** LIN-XXX  
> **Created:** 2026-04-17 | **Closed:** —

---

## Story

*As a* real estate agent using the AI Chat panel to generate infographics  
*I want* the AI Chat panel to feel like a modern AI product (inspired by Lovart.ai's chat sidebar)  
*So that* the visual design reinforces the premium AI-native product positioning

---

## Acceptance Criteria

- [ ] **AC1:** Chat panel background uses `--chat-panel-bg` (white/near-white surface)
- [ ] **AC2:** AI message bubbles use `--chat-message-ai-bg` (warm grey `#f3f4f6`)
- [ ] **AC3:** User message bubbles use `--chat-message-user-bg` (brand blue `#0ca0eb`) with white text
- [ ] **AC4:** Promo/upgrade banner uses `--chat-promo-banner-bg` (lime `#e0ff66`) with dark text
- [ ] **AC5:** Chat input area uses `--chat-input-bg` and `--chat-input-border` tokens
- [ ] **AC6:** Bottom action chips (quick-reply / suggestion chips) use `--chat-action-chip-*` tokens
- [ ] **AC7:** No logic, routing, message sending, or state changes — only visual CSS/class updates
- [ ] **AC8:** Changes work in both Light and Dark modes
- [ ] **AC9:** `npm run check` passes — zero TypeScript errors
- [ ] **AC10:** `npm run test:unit` passes — no regressions

---

## Visual Reference

**Target:** `design-preview-canvas.html` (project root) → right panel AI Chat section — open in browser.

Key visual elements to match:
- Chat panel: white background, subtle left border separating from canvas
- AI bubble: warm grey pill on left, small avatar icon
- User bubble: brand blue pill on right, white text
- Promo banner: lime background `#e0ff66`, dark text, rounded corners
- Chat input: white bg, border, pill shape, send button with brand blue
- Action chips: outlined pill buttons with brand blue border and text

---

## Token References

| Element | Token | Value |
|---------|-------|-------|
| Chat panel bg | `--chat-panel-bg` | `#ffffff` |
| AI message bubble bg | `--chat-message-ai-bg` | `#f3f4f6` |
| User message bubble bg | `--chat-message-user-bg` | `#0ca0eb` |
| User message text | `--chat-message-user-text` | `#ffffff` |
| Promo banner bg | `--chat-promo-banner-bg` | `#e0ff66` |
| Promo banner text | `--chat-promo-banner-text` | `#0f1729` |
| Chat input bg | `--chat-input-bg` | `#ffffff` |
| Chat input border | `--chat-input-border` | `#e5e7eb` |
| Action chip bg | `--chat-action-chip-bg` | `transparent` |
| Action chip border | `--chat-action-chip-border` | `#0ca0eb` |
| Action chip text | `--chat-action-chip-text` | `#0ca0eb` |

---

## Out of Scope

- Chat message sending logic, WebSocket/Socket.io handling
- AI generation flow or prompt handling
- Conversation history loading or pagination
- Editor component changes (US-DESIGN-010)
- Adding new chat features (suggested prompts, typing indicators)

---

## Engineering / PR

- **Branch:** `feat/design-us-design-011-ai-chat-visual`
- **PR:** #_____
- **Primary files touched** (read first to identify exact paths):
  - `client/src/components/ai-chat/` — chat panel, message bubbles, input, action chips

---

## AI Implementation Prompt

> Copy this block into Claude Code to implement the story.

```
Context: InfographicAI SaaS — React frontend (Tailwind v4 + shadcn/ui).
See CLAUDE.md for architecture. Token reference: client/src/design-tokens.css
Visual target: design-preview-canvas.html right panel section (open in browser)

Story: US-DESIGN-011 — AI Chat panel visual refinement

Read client/src/components/ai-chat/ to identify:
1. Chat panel container
2. Message bubble components (AI vs user)
3. Promo/upgrade banner (if exists)
4. Chat input component
5. Action chips / quick-reply buttons

Then apply token styles:

1. Chat panel container:
   style={{ backgroundColor: 'var(--chat-panel-bg)' }}

2. AI message bubble:
   style={{ backgroundColor: 'var(--chat-message-ai-bg)' }}

3. User message bubble:
   style={{ backgroundColor: 'var(--chat-message-user-bg)', color: 'var(--chat-message-user-text)' }}

4. Promo/upgrade banner (if present):
   style={{ backgroundColor: 'var(--chat-promo-banner-bg)', color: 'var(--chat-promo-banner-text)' }}

5. Chat input:
   style={{ backgroundColor: 'var(--chat-input-bg)', borderColor: 'var(--chat-input-border)' }}

6. Action chips:
   style={{ backgroundColor: 'var(--chat-action-chip-bg)', borderColor: 'var(--chat-action-chip-border)', color: 'var(--chat-action-chip-text)' }}

Rules:
- Do NOT change message sending logic, WebSocket calls, or state
- Do NOT change input handlers or form submission
- Only update background colors, text colors, and border colors
- When done: confirm npm run check passes
```

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|----------|----------|--------|---------|
| TC-DS-011-01 | Manual | P0 | AI message bubbles are warm grey, not system default | 🔲 | |
| TC-DS-011-02 | Manual | P0 | User message bubbles are brand blue `#0ca0eb` with white text | 🔲 | |
| TC-DS-011-03 | Manual | P1 | Promo/upgrade banner is lime `#e0ff66` (if banner exists in UI) | 🔲 | |
| TC-DS-011-04 | Manual | P1 | Chat input has white bg with subtle border | 🔲 | |
| TC-DS-011-05 | Manual | P1 | Action chips have blue outlined pill style | 🔲 | |
| TC-DS-011-06 | Manual | P0 | Sending a message still works — AI generation triggers correctly | 🔲 | |
| TC-DS-011-07 | Manual | P1 | Dark mode: chat panel tokens coherent | 🔲 | |
| TC-DS-011-08 | Auto | P0 | `npm run check` — zero TypeScript errors | 🔲 | |
| TC-DS-011-09 | Auto | P0 | `npm run test:unit` — all unit tests pass | 🔲 | |

---

## Definition of Done

- [ ] All ACs checked ✅
- [ ] All test cases run and recorded
- [ ] `npm run check` passes
- [ ] `npm run test:unit` passes
- [ ] Manual smoke: AI Chat in Light + Dark — bubble colors, promo banner, input, chips
- [ ] Sending a message and receiving AI response still works end-to-end
- [ ] Visual match to `design-preview-canvas.html` right panel confirmed
- [ ] PR merged (PR #_____)
- [ ] TASKS.md task list fully checked

---

*Story created: 2026-04-17*
