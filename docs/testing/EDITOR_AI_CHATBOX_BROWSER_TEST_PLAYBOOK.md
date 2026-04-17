# Editor and AI ChatBox Browser Automation Test Playbook

**Purpose:** Cursor Browser Automation (cursor-ide-browser MCP) tests for the **Editor** and **AI ChatBox** modules. Append all findings to [docs/ISSUES_REPORT.md](../ISSUES_REPORT.md) under [Editor & AI ChatBox Browser Test Sessions](../ISSUES_REPORT.md#7-editor--ai-chatbox-browser-test-sessions).

**Related:** Deep UI checklist — [client/src/components/ai-chat/TESTING-GUIDE.md](../../client/src/components/ai-chat/TESTING-GUIDE.md).

---

## Prerequisites

| Requirement | Notes |
|-------------|--------|
| **App URL** | `http://localhost:5000` (e.g. `npm run dev` or `start-both.ps1` from repo root) |
| **Auth** | Editor and `/templates` are protected. Log in manually, or use credentials from root `.env`: `TEST_USER_EMAIL`, `TEST_USER_PASSWORD` (see [PAYMENT_TEST_CHECKLIST.md](../PAYMENT_TEST_CHECKLIST.md)) |
| **Browser** | Chrome; use MCP workflow: `browser_navigate` → `browser_lock` → interactions → `browser_unlock` |
| **Playwright (optional)** | Headed **system Chrome**, maximized: `npm run test:e2e:editor` (loads root `.env` for `TEST_USER_*` when `/auth` is shown). Headless CI: `CI=true npm run test:e2e:editor`. |
| **Snapshots** | Use `browser_snapshot` to obtain element **refs** before `browser_click` / `browser_type` / `browser_fill` |

---

## Execution Order

1. **Editor module** — navigation, toolbar, floating tools, layers, right sidebar, dialogs, canvas (DOM-level), zoom.
2. **AI ChatBox module** — only after editor is loaded; AI panel lives on the canvas ([CenterCanvas.tsx](../../client/src/components/editor/CenterCanvas.tsx), [AIChatBox.tsx](../../client/src/components/ai-chat/AIChatBox.tsx)).

---

## Cursor Browser MCP — Quick Reference

| Tool | Use |
|------|-----|
| `browser_navigate` | Open URL |
| `browser_tabs` | List tabs before lock |
| `browser_lock` | Lock tab before clicks (after navigate) |
| `browser_snapshot` | Accessibility tree + refs for targets |
| `browser_click` | Click by `ref` from snapshot |
| `browser_type` | Append text to input |
| `browser_fill` | Replace input / contenteditable |
| `browser_unlock` | When finished with the tab |

---

## Selector Reference (Editor)

Use snapshot **refs** when possible. Fallbacks are approximate text / structure.

| Area | How to locate |
|------|----------------|
| **Back** | Top toolbar, first control: `ArrowLeft` icon ([EditorToolbar.tsx](../../client/src/components/editor/EditorToolbar.tsx)) |
| **Save** | Button text **Save** (with Save icon) |
| **Export** | Button text **Export** |
| **Zoom** | Center toolbar cluster: minus/plus icons ([ZoomControls.tsx](../../client/src/components/editor/ZoomControls.tsx)) |
| **Floating tools (left)** | Fixed column left of canvas: Select, Hand, Undo/Redo, **+** menu for Text / Shapes / Image ([FloatingToolbar.tsx](../../client/src/components/editor/FloatingToolbar.tsx)); tooltips e.g. "Select (V)", "Add Text" |
| **Layers** | Top button in floating column, tooltip **Layers**; opens slide-out panel |
| **Right sidebar** | Tabs **Design** / **Property**; **Brand Styles** under Design ([RightSidebar.tsx](../../client/src/components/editor/RightSidebar.tsx)) |
| **Save dialog** | Title **Save Your Work**; label **Name \***; input `id="design-name"` ([SaveDialog.tsx](../../client/src/components/editor/SaveDialog.tsx)) |
| **Templates → editor** | Card button **Use Template** ([TemplatesPage.tsx](../../client/src/components/pages/TemplatesPage.tsx)); URL `/editor?templateId=...` or `/editor?designId=...` |
| **Canvas (empty area)** | Region `role="application"` **Design canvas** on the scrollable artboard ([CenterCanvas.tsx](../../client/src/components/editor/CenterCanvas.tsx)); use snapshot ref or `browser_scroll` + click inside when the MCP viewport is short |

---

## Selector Reference (AI ChatBox)

| Area | How to locate |
|------|----------------|
| **AI toggle** | Bottom-right purple round button, `aria-label="Open AI Chat"` ([CenterCanvas.tsx](../../client/src/components/editor/CenterCanvas.tsx)) |
| **Header** | Text **Real Estate Templates**; subtitle **Powered by AI** |
| **History** | Header control `title="Chat History"` (Clock icon) |
| **Close** | Header control `title="Close"` (X) |
| **Category chips** | Row of chips from [categoryChipsData.ts](../../client/src/components/ai-chat/categoryChipsData.ts): Property Listings, Open House, Just Sold, Agent Branding, Market Stats, Neighborhood |
| **Prompt input** | Large field; placeholder includes *Ask AI to create a stunning real estate infographic...* (until chip selected) |
| **Icon bar** | Lightbulb, Lightning, Palette, Paperclip, Upload, send — opens panels per [TESTING-GUIDE.md](../../client/src/components/ai-chat/TESTING-GUIDE.md) |
| **Suggestion cards** | After chip select: grid; selection may use `aria-label` like `Select {title}` ([MessageBubble.tsx](../../client/src/components/ai-chat/MessageBubble.tsx)) |

---

## Editor Module — Test Cases

**Key routes:** `/templates` → `/editor?templateId=...` or `/editor?designId=...`

### E1. Navigation

| Step | Action | Expected |
|------|--------|----------|
| E1.1 | `browser_navigate` to `http://localhost:5000` | Landing or redirect to `/auth` |
| E1.2 | If on `/auth`, sign in (email/password) or use stored session | User reaches app |
| E1.3 | `browser_navigate` to `/templates` | Template grid visible |
| E1.4 | `browser_click` **Use Template** on a card | URL contains `/editor` and `templateId` (or equivalent) |
| E1.5 | `browser_snapshot` | Dark top toolbar, canvas area, left floating tools, right sidebar |

### E2. Toolbar

| Step | Action | Expected |
|------|--------|----------|
| E2.1 | `browser_snapshot` | **Save**, **Export**, back control visible |
| E2.2 | `browser_click` back | Returns toward templates / previous route |
| E2.3 | Open editor again; `browser_click` **Save** | Dialog **Save Your Work** |
| E2.4 | Dismiss dialog; `browser_click` **Export** | Export/download flow starts (verify in snapshot) |

### E3. Left — Floating Toolbar & Layers

| Step | Action | Expected |
|------|--------|----------|
| E3.1 | `browser_snapshot` | Layers button, Select/Hand, + menu |
| E3.2 | Open **+** menu; choose **Text** (or equivalent) | Text element added / tool active |
| E3.3 | Open **+** menu; add **Shape** (rectangle/circle) | Shape added |
| E3.4 | `browser_click` **Layers** | Layers slide-out opens ([LayersPanel.tsx](../../client/src/components/editor/LayersPanel.tsx)) |

### E4. Right Sidebar — Design / Property / Brand

| Step | Action | Expected |
|------|--------|----------|
| E4.1 | `browser_snapshot` | **Design** / **Property** visible |
| E4.2 | `browser_click` **Property** | Property details form area |
| E4.3 | `browser_click` **Design** | Brand Styles / design content |

### E5. Dialogs

| Step | Action | Expected |
|------|--------|----------|
| E5.1 | `browser_click` **Save** | **Save Your Work** in snapshot |
| E5.2 | Cancel or close | Dialog gone |

### E6. Zoom Controls

| Step | Action | Expected |
|------|--------|----------|
| E6.1 | `browser_snapshot` | Zoom cluster in top bar |
| E6.2 | `browser_click` zoom in (+) | Zoom increases |
| E6.3 | `browser_click` zoom out (−) | Zoom decreases |

### E7. Canvas (DOM-level only)

| Step | Action | Expected |
|------|--------|----------|
| E7.1 | With text tool / add text | New text appears in layer list or canvas |
| E7.2 | Click empty canvas (if possible via ref) | Selection clears per app behavior |

**Automation:** Empty-area clicks bubble to the canvas wrapper; canvas elements use `stopPropagation` on select. Prefer targeting **Design canvas** (`role="application"`) after adding at least one element (E7.1). Short MCP viewports (~474px height) may still block `browser_click` on lower controls — use `browser_scroll` with `scrollIntoView` or a taller window, then re-snapshot.

**Note:** Drag, resize handles, and precise canvas coordinates may be flaky in automation — if E7.2 cannot be reached via MCP after the above, record **Partial** and confirm manually once.

---

## AI ChatBox Module — Test Cases

**Requires:** Editor loaded (complete at least **E1**).

### AC1. AI Button & Chat Open

| Step | Action | Expected |
|------|--------|----------|
| AC1.1 | `browser_snapshot` | Control with **Open AI Chat** (aria-label) bottom-right |
| AC1.2 | `browser_click` that control | Chat expands |
| AC1.3 | `browser_snapshot` | **Real Estate Templates**, input row, chips row |

### AC2. Category Chips

| Step | Action | Expected |
|------|--------|----------|
| AC2.1 | `browser_snapshot` | Six chips (Property Listings … Neighborhood) |
| AC2.2 | `browser_click` **Property Listings** | Chip selected; tag in input area |
| AC2.3 | `browser_snapshot` | Placeholder / tag reflects selection |

### AC3. Prompt Input

| Step | Action | Expected |
|------|--------|----------|
| AC3.1 | `browser_fill` or `browser_type` on prompt field | Visible text |

### AC4. Icon Bar — Panels

| Step | Action | Expected |
|------|--------|----------|
| AC4.1 | `browser_click` lightbulb | **AI Suggestions** (or similar) panel |
| AC4.2 | `browser_click` lightning | **Quick Actions** panel |
| AC4.3 | `browser_click` palette | **Style Presets** panel |
| AC4.4 | `browser_click` upload (if exposed) | **Upload Reference** panel |
| AC4.5 | Click outside / backdrop | Panel closes ([TESTING-GUIDE.md](../../client/src/components/ai-chat/TESTING-GUIDE.md) Test 22) |

### AC5. Prompt Suggestions Grid

| Step | Action | Expected |
|------|--------|----------|
| AC5.1 | After chip select, `browser_snapshot` | Grid of suggestion cards (~6) |
| AC5.2 | `browser_click` one card | Input populated |

### AC6. History View

| Step | Action | Expected |
|------|--------|----------|
| AC6.1 | `browser_click` Chat History (Clock, `title="Chat History"`) | History / conversation list UI |
| AC6.2 | Back or close history per UI | Returns to main chat |

### AC7. Close Chat

| Step | Action | Expected |
|------|--------|----------|
| AC7.1 | `browser_click` Close (`title="Close"`) | Chat collapses; AI button usable again |

---

## Reporting — Append to ISSUES_REPORT.md

1. **Pre-run:** Confirm app up, user logged in.
2. **Editor:** Run **E1–E7**; note pass/fail per step.
3. **AI ChatBox:** Run **AC1–AC7** after editor ready.
4. **Append:** Under [§7 Editor & AI ChatBox Browser Test Sessions](../ISSUES_REPORT.md#7-editor--ai-chatbox-browser-test-sessions), add a dated session and each issue using the template below.

### Issue template

```markdown
### Issue [ID] — [Short Title] ([Severity])

- **Type:** UI Bug | Layout | Interaction | Accessibility
- **Component:** `client/src/components/...`
- **Impact:** [Description]
- **Steps to Reproduce:**
  1. [Step]
  2. [Step]
- **Evidence:** [Snapshot ref or description]
- **Status:** Open | Pending | Resolved
```

### ID convention

| Prefix | Module |
|--------|--------|
| **ET-XX** | Editor / toolbar / canvas / dialogs / zoom |
| **AC-XX** | AI ChatBox |
| **PT-XX** | Payment (reserved; not this playbook) |

Optional session header:

```markdown
## Editor & AI ChatBox Browser Test Session — YYYY-MM-DD

**Session:** Cursor Browser Automation  
**Module:** Editor | AI ChatBox  
**URL:** [tested URL]

<!-- issues below -->
```

---

## Limitations (document when filing issues)

| Topic | Guidance |
|-------|----------|
| **Canvas / coordinates** | Prefer DOM clicks; drag/resize may need manual verification |
| **Iframes** | Razorpay and other iframes are **out of scope** for this playbook |
| **AI generation** | UI flow only; success depends on `OPENAI_API_KEY`, `IDEOGRAM_API_KEY`, backend |
| **Native dialogs** | MCP may auto-accept; use `browser_handle_dialog` if testing prompts |
| **Close chat (AC7)** | After **Close**, the panel unmounts from the DOM; if a snapshot still lists chat controls, take a fresh snapshot after a short wait — stale trees were reported on Mar 23; re-run 2026-04-04 showed a clean tree immediately after close |

---

## Source Files (maintenance)

| Module | Files |
|--------|--------|
| Editor shell | [EditorLayout.tsx](../../client/src/components/editor/EditorLayout.tsx), [EditorToolbar.tsx](../../client/src/components/editor/EditorToolbar.tsx), [CenterCanvas.tsx](../../client/src/components/editor/CenterCanvas.tsx) |
| Tools / layers | [FloatingToolbar.tsx](../../client/src/components/editor/FloatingToolbar.tsx), [LayersPanel.tsx](../../client/src/components/editor/LayersPanel.tsx) |
| Right panel | [RightSidebar.tsx](../../client/src/components/editor/RightSidebar.tsx) |
| Save | [SaveDialog.tsx](../../client/src/components/editor/SaveDialog.tsx) |
| Zoom | [ZoomControls.tsx](../../client/src/components/editor/ZoomControls.tsx) |
| Templates | [TemplatesPage.tsx](../../client/src/components/pages/TemplatesPage.tsx) |
| AI ChatBox | [AIChatBox.tsx](../../client/src/components/ai-chat/AIChatBox.tsx), [AIChatInputField.tsx](../../client/src/components/ai-chat/AIChatInputField.tsx) |
