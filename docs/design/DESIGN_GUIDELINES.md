# Design Guidelines: Brainwave-Inspired Editor UI

## Design Philosophy

**Reference-Based Design System**  
Primary inspiration: **Brainwave 3D Editor** - A minimalist, professional creative tool interface.

This design system prioritizes:
- **Clarity** - Clean visual hierarchy with maximum content focus
- **Efficiency** - Tools and controls accessible without visual clutter
- **Professionalism** - Neutral palette that lets user content shine
- **Consistency** - Unified spacing, typography, and component patterns

---

## Color Palette

### Light Mode (Primary)

| Token | HSL Value | Hex | Usage |
|-------|-----------|-----|-------|
| `--background` | 0 0% 99% | #FCFCFC | Page background |
| `--foreground` | 0 0% 7% | #121212 | Primary text |
| `--card` | 0 0% 100% | #FFFFFF | Card surfaces |
| `--card-foreground` | 0 0% 7% | #121212 | Card text |
| `--sidebar` | 0 0% 98% | #FAFAFA | Sidebar background |
| `--sidebar-foreground` | 0 0% 12% | #1F1F1F | Sidebar text |
| `--muted` | 0 0% 94% | #F0F0F0 | Muted backgrounds, disabled states |
| `--muted-foreground` | 0 0% 45% | #737373 | Secondary text, placeholders |
| `--border` | 0 0% 90% | #E5E5E5 | Borders, dividers |
| `--input` | 0 0% 85% | #D9D9D9 | Input borders |
| `--primary` | 0 0% 12% | #1F1F1F | Primary buttons, active states |
| `--primary-foreground` | 0 0% 100% | #FFFFFF | Text on primary |
| `--secondary` | 0 0% 96% | #F5F5F5 | Secondary buttons |
| `--secondary-foreground` | 0 0% 15% | #262626 | Text on secondary |
| `--accent` | 0 0% 94% | #F0F0F0 | Hover states, highlights |
| `--destructive` | 0 84% 48% | #DC2626 | Error states, delete actions |
| `--success` | 142 76% 36% | #16A34A | Success states, completed |
| `--warning` | 38 92% 50% | #F59E0B | Processing, caution |

### Dark Mode

| Token | HSL Value | Hex | Usage |
|-------|-----------|-----|-------|
| `--background` | 0 0% 8% | #141414 | Page background |
| `--foreground` | 0 0% 95% | #F2F2F2 | Primary text |
| `--card` | 0 0% 12% | #1F1F1F | Card surfaces |
| `--sidebar` | 0 0% 10% | #1A1A1A | Sidebar background |
| `--muted` | 0 0% 16% | #292929 | Muted backgrounds |
| `--muted-foreground` | 0 0% 60% | #999999 | Secondary text |
| `--border` | 0 0% 18% | #2E2E2E | Borders |
| `--primary` | 0 0% 95% | #F2F2F2 | Primary buttons |
| `--primary-foreground` | 0 0% 8% | #141414 | Text on primary |

---

## Typography

### Font Stack

```css
--font-sans: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
--font-display: Inter, -apple-system, BlinkMacSystemFont, sans-serif;
--font-mono: "SF Mono", Monaco, "Cascadia Code", monospace;
```

### Type Scale

| Name | Class | Size | Weight | Usage |
|------|-------|------|--------|-------|
| Hero | `text-2xl` | 24px | 600 | Page titles, empty states |
| Section | `text-lg` | 18px | 600 | Section headers |
| Title | `text-base` | 16px | 500 | Card titles, labels |
| Body | `text-sm` | 14px | 400 | Default body text |
| Caption | `text-xs` | 12px | 400 | Timestamps, hints, badges |
| Micro | `text-[10px]` | 10px | 500 | Keyboard shortcuts |

### Typography Rules

- Line height: 1.5 for body, 1.25 for headings
- Letter spacing: Normal (0) for all text
- Maximum line length: 65 characters for readability
- Use `font-medium` (500) for interactive elements
- Use `text-muted-foreground` for secondary information

---

## Layout System

### 3-Column Editor Layout

```
┌────────────────────────────────────────────────────────────────────┐
│  Toolbar (h-14, 56px)                                              │
├──────────┬───────────────────────────────────────────┬─────────────┤
│          │                                           │             │
│  Left    │           Center Canvas                   │   Right     │
│ Sidebar  │           (flex-1)                        │  Sidebar    │
│  (w-56)  │                                           │   (w-72)    │
│  224px   │    Content preview area                   │   288px     │
│          │    with dot-grid background               │             │
│          │                                           │             │
│          ├───────────────────────────────────────────┤             │
│          │  Bottom Input Bar (optional)              │             │
└──────────┴───────────────────────────────────────────┴─────────────┘
```

### Dimension Tokens

| Element | Width/Height | Tailwind Class |
|---------|--------------|----------------|
| Toolbar | 56px height | `h-14` |
| Left Sidebar | 224px width | `w-56` |
| Right Sidebar | 288px width | `w-72` |
| Bottom Bar | 72px height | `h-18` or `py-4` |
| Canvas | Fluid | `flex-1` |

### Responsive Breakpoints

- **Desktop**: Full 3-column layout (>=1024px)
- **Tablet**: Collapse sidebars to icons or hide (768-1023px)
- **Mobile**: Stack vertically, full-width sections (<768px)

---

## Spacing System

### Primitives

| Token | Value | Usage |
|-------|-------|-------|
| `space-1` | 4px | Tight gaps, icon margins |
| `space-2` | 8px | Default component gaps |
| `space-3` | 12px | Section padding |
| `space-4` | 16px | Card padding, major gaps |
| `space-6` | 24px | Section separations |
| `space-8` | 32px | Page margins |

### Application Rules

- **Component padding**: `p-3` (12px) or `p-4` (16px)
- **Sidebar padding**: `p-3` (12px)
- **Card padding**: `p-4` (16px)
- **Form field gaps**: `space-y-3` (12px)
- **Section gaps**: `space-y-6` (24px)
- **Button icon gap**: `gap-2` (8px)

---

## Component Specifications

### Toolbar

```
Height: h-14 (56px)
Background: bg-background
Border: border-b
Padding: px-4
Layout: flex items-center justify-between
```

**Toolbar Sections:**
- Left: Logo + Project name
- Center: Tool buttons in `bg-muted rounded-lg p-1` container
- Right: Export/Share buttons + User avatar

### Buttons

| Variant | Height | Padding | Border Radius |
|---------|--------|---------|---------------|
| Default | `h-9` (36px) | `px-4` | `rounded-md` |
| Small | `h-8` (32px) | `px-3` | `rounded-md` |
| Large | `h-10` (40px) | `px-6` | `rounded-lg` |
| Icon | `h-9 w-9` | - | `rounded-md` or `rounded-full` |
| Icon SM | `h-8 w-8` | - | `rounded-md` |

**Button Styles:**
- Primary: `bg-primary text-primary-foreground`
- Secondary: `bg-secondary text-secondary-foreground`
- Ghost: `bg-transparent hover:bg-muted`
- Outline: `border bg-transparent`

### Inputs

| Property | Value |
|----------|-------|
| Height | `h-9` (36px) |
| Border Radius | `rounded-lg` (8px) |
| Border | `border` or `border-0 bg-muted/50` |
| Focus | `focus:ring-1 focus:ring-ring` |
| Padding | `px-3` |

### Cards

```css
Background: bg-card
Border: border (optional, subtle)
Border Radius: rounded-lg (8px) or rounded-xl (12px)
Shadow: shadow-sm (optional)
Padding: p-4
```

### Sidebars

**Left Sidebar (History/Layers)**
```
Width: w-56 (224px)
Background: bg-sidebar
Border: border-r
Sections: Header (border-b), Scrollable content, Footer (border-t)
```

**Right Sidebar (Properties/Controls)**
```
Width: w-72 (288px)
Background: bg-sidebar
Border: border-l
Sections: Tab switcher, Scrollable content
```

### Tab Toggles

```css
Container: bg-muted rounded-lg p-1
Active Tab: bg-background shadow-sm rounded-md
Inactive Tab: text-muted-foreground
Height: h-8
```

### Badges

| Variant | Background | Text |
|---------|------------|------|
| Default | `bg-muted` | `text-foreground` |
| Success | `bg-green-100 dark:bg-green-900/30` | `text-green-700 dark:text-green-400` |
| Warning | `bg-amber-100 dark:bg-amber-900/30` | `text-amber-700 dark:text-amber-400` |
| Error | `bg-red-100 dark:bg-red-900/30` | `text-red-700 dark:text-red-400` |

### Color Swatches

```css
Size: w-8 h-8 (32px)
Border Radius: rounded-lg
Selected State: ring-2 ring-foreground ring-offset-2
Hover: scale-110 transition
```

---

## Canvas Area

### Background Pattern

```css
.dot-grid {
  background-image: radial-gradient(circle, hsl(0 0% 85%) 1px, transparent 1px);
  background-size: 24px 24px;
}

.dark .dot-grid {
  background-image: radial-gradient(circle, hsl(0 0% 25%) 1px, transparent 1px);
}
```

### Gradient Background (Alternative)

```css
.canvas-area {
  background: linear-gradient(180deg, hsl(var(--muted)) 0%, hsl(var(--background)) 100%);
}
```

### Preview Container

```css
Border Radius: rounded-2xl (16px)
Shadow: shadow-2xl
Max Width: max-w-4xl (landscape) or max-w-md (portrait)
Transform: scale based on zoom level
```

---

## Interaction Patterns

### Hover States

- Buttons: Subtle background elevation (`hover-elevate` utility)
- Cards: `hover:ring-1 hover:ring-border` or `hover:shadow-md`
- List items: `hover:bg-muted/50`
- Scale effects: `hover:scale-102` (max 2% scale increase)

### Active/Selected States

- List items: `ring-2 ring-foreground` or `bg-muted`
- Tabs: `bg-background shadow-sm`
- Toggle buttons: `toggle-elevated` class

### Loading States

- Skeleton: `animate-pulse bg-muted`
- Spinner: `animate-spin` on Loader2 icon
- Progress dots: 3 dots with staggered `animate-pulse`

### Transitions

```css
Default: transition-all duration-200
Fast: transition-colors duration-150
Scale: transition-transform duration-150
```

---

## CSS Variables Template

Copy this to your `index.css` `:root` block:

```css
:root {
  /* Colors - Light Mode */
  --background: 0 0% 99%;
  --foreground: 0 0% 7%;
  --card: 0 0% 100%;
  --card-foreground: 0 0% 7%;
  --sidebar: 0 0% 98%;
  --sidebar-foreground: 0 0% 12%;
  --muted: 0 0% 94%;
  --muted-foreground: 0 0% 45%;
  --accent: 0 0% 94%;
  --accent-foreground: 0 0% 20%;
  --border: 0 0% 90%;
  --input: 0 0% 85%;
  --ring: 0 0% 12%;
  --primary: 0 0% 12%;
  --primary-foreground: 0 0% 100%;
  --secondary: 0 0% 96%;
  --secondary-foreground: 0 0% 15%;
  --destructive: 0 84% 48%;
  --destructive-foreground: 0 0% 100%;
  --success: 142 76% 36%;
  --warning: 38 92% 50%;

  /* Typography */
  --font-sans: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --font-mono: "SF Mono", Monaco, monospace;
  
  /* Spacing */
  --radius: 0.5rem;
  
  /* Shadows */
  --shadow-sm: 0px 1px 2px rgba(0, 0, 0, 0.05);
  --shadow: 0px 2px 4px -1px rgba(0, 0, 0, 0.06), 0px 4px 8px -1px rgba(0, 0, 0, 0.10);
  --shadow-lg: 0px 8px 16px -4px rgba(0, 0, 0, 0.10), 0px 16px 32px -4px rgba(0, 0, 0, 0.15);
  --shadow-2xl: 0px 32px 64px -16px rgba(0, 0, 0, 0.25);
}

.dark {
  --background: 0 0% 8%;
  --foreground: 0 0% 95%;
  --card: 0 0% 12%;
  --card-foreground: 0 0% 92%;
  --sidebar: 0 0% 10%;
  --sidebar-foreground: 0 0% 90%;
  --muted: 0 0% 16%;
  --muted-foreground: 0 0% 60%;
  --accent: 0 0% 18%;
  --accent-foreground: 0 0% 85%;
  --border: 0 0% 18%;
  --input: 0 0% 30%;
  --ring: 0 0% 95%;
  --primary: 0 0% 95%;
  --primary-foreground: 0 0% 8%;
  --secondary: 0 0% 18%;
  --secondary-foreground: 0 0% 88%;
}
```

---

## AI Prompt Template

Use this prompt when generating new MVPs with this design system:

```
You are building a web application with a Brainwave-inspired editor interface. Follow these design principles:

## Design System
- **Color Scheme**: Near-white background (#FCFCFC), black text (#121212), minimal borders
- **Typography**: Inter font, 14px base size, 500 weight for interactive elements
- **Border Radius**: 8px for inputs/cards, 12px for panels, 16px for modals
- **Shadows**: Subtle, only on elevated surfaces (shadow-sm to shadow-lg)

## Layout
- **3-Column Editor**: Left sidebar (224px), fluid center canvas, right sidebar (288px)
- **Top Toolbar**: 56px height with logo left, tools center, actions right
- **Spacing**: 12px component padding, 16px section gaps, 24px major separations

## Components
- **Buttons**: 36px height, rounded-md, ghost variant for toolbars
- **Inputs**: 36px height, rounded-lg, subtle border or borderless with muted background
- **Cards**: White background, optional subtle border, 8-12px radius
- **Tab Toggles**: Pill-style with bg-muted container, active tab has bg-background + shadow

## Interactions
- **Hover**: Subtle background change, max 2% scale increase
- **Selected**: Ring-2 or darker background
- **Loading**: Pulse animation for skeletons, spin for loaders
- **Transitions**: 150-200ms duration, ease-out timing

## Visual Rules
- No heavy borders - use whitespace and subtle backgrounds to define sections
- Keep UI neutral - let content be the focus
- Use icons from Lucide React with consistent 16-20px sizing
- Apply data-testid attributes to all interactive elements

Build clean, professional interfaces that feel like creative tools.
```

---

## File Structure Reference

```
client/src/
├── components/
│   ├── editor/
│   │   ├── EditorLayout.tsx      # Main 3-column container
│   │   ├── EditorToolbar.tsx     # Top toolbar
│   │   ├── LeftSidebar.tsx       # History/layers panel
│   │   ├── CenterCanvas.tsx      # Preview area
│   │   ├── RightSidebar.tsx      # Properties/design controls
│   │   └── BottomInputBar.tsx    # AI input area (optional)
│   └── ui/                       # Shadcn components
├── pages/
│   └── dashboard-page.tsx        # Uses EditorLayout
└── index.css                     # Theme variables
```

---

## Accessibility Checklist

- [ ] WCAG AA contrast ratios (4.5:1 minimum for text)
- [ ] Focus indicators (2px ring) on all interactive elements
- [ ] Keyboard navigation follows visual hierarchy
- [ ] Screen reader labels on icon-only buttons
- [ ] Reduced motion support for animations
- [ ] Dark mode with appropriate contrast adjustments

---

**Document Version:** 1.0  
**Last Updated:** January 2026  
**Design System:** Brainwave-Inspired Editor UI

