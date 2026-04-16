## US-DESIGN-002 — Editor + AI chat design tokens & dark-mode polish

**Story card:** `docs/agile/epics/EPIC-DESIGN-01/stories/US-DESIGN-002/STORY.md`

| Field | Link / value |
|-------|----------------|
| **Epic** | [EPIC-DESIGN-01](../../EPIC.md) |
| **Milestone** | [M-DESIGN-02](../../milestones/M-DESIGN-02-editor-tokens.md) |
| **Branch** | `feat/design-us-design-002-editor-tokens` |
| **Linear** | LIN-XXX (update if linked) |

### User outcome

Editor, AI chat, canvas selection, and shared dropdowns use **design tokens** (Light / Dark / System). Fixes invisible chat text, chip contrast, selection ring gap, and popover menus in dark mode. Quick Styles use canvas-aware contrast.

### What changed (high level)

- Editor: toolbars, sidebars, property/layers/adjustments, `CenterCanvas` chrome, `RightSidebar` (incl. Quick Styles + `getColorForStyle`), shared `FloatingToolbar` add menu.
- AI chat: panels, chips, bubbles, progress, inputs — token-based surfaces.
- Canvas elements: selection `outline` instead of `ring-offset` gap.
- **Shared UI:** `client/src/components/ui/dropdown-menu.tsx` — `bg-popover` / `text-popover-foreground` / `border-border`; `DropdownMenuSubContent` forwards props.

### Acceptance criteria

All ACs **1–32** in [`STORY.md`](./STORY.md) (Phases A–G). Reviewer: spot-check critical ACs (toolbar light/dark, chat input visible, add-element menu, Quick Styles on light + dark canvas).

**Note:** Post-merge grep: `ai-chat` has **no** `gray-*` / `zinc-*` / `bg-white` in `.tsx`; **editor** still has **residual** gray/white in secondary UI — see [`M-DESIGN-02`](../../milestones/M-DESIGN-02-editor-tokens.md). Optional follow-up.

### Tests

```bash
npm run check
npm run test:unit
```

Manual: `npm run dev` → editor → Light / Dark / System; AI chat; add text/shape; FloatingToolbar **+** menu; Quick Styles.

### Out of scope

See [`STORY.md` § Out of Scope](./STORY.md#out-of-scope).

### Also in this PR (process)

- GitHub PR templates (`.github/pull_request_template.md`, `.github/PULL_REQUEST_TEMPLATE/story.md`)
- `docs/agile/guides/STORY_PR_WORKFLOW.md`, `.cursor/rules/pr-workflow.mdc`, `.cursor/commands/pr-story-open.md`, `npm run pr:open:us-design-002`
