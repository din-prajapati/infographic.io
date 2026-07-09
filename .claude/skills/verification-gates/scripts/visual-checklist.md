# Gate 2 — Visual Verification Checklist

> **Skill:** verification-gates
> **When:** After any component, CSS, or token file change — before marking any story Done.
> **How:** Open the dev server (`npm run dev`), open browser, disable cache
> (DevTools → Network → ☑ Disable cache), then work through this list.
>
> Mark each item: ✅ Pass | ⚠️ Issue found | N/A Not applicable

---

## Setup

```bash
npm run dev
# Open: http://localhost:5000
# DevTools: Network → Disable cache (keep DevTools open)
# DevTools: Console ready to paste token spot checks
```

---

## Page 1 — Landing Page (`/`)

### Light Mode

**Background & Layout**
- [ ] Page background: warm cream tone (~`#f9f8f6`), no teal or blue tint
- [ ] Hero section heading: readable, accent word uses secondary (amber) color
- [ ] Section labels / eyebrows: use `text-primary/70` (blue tint), not teal

**Navigation**
- [ ] Nav "Get Started" button: blue background, white text, hover darkens slightly
- [ ] Nav logo / brand: renders correctly

**Buttons & Interactions**
- [ ] Primary CTA button: blue (`#0ca0eb`) background, white text
- [ ] Hover on primary CTA: slightly darker blue, text stays visible
- [ ] "Continue with Email" button: hover state — text remains visible (not invisible)
- [ ] All other buttons: no hardcoded teal, gray, or violet colors

**Dark-Background Sections**
- [ ] Pain point cards (on `bg-[#0a0a0a]`): dark glass (`bg-white/[0.06]`), NOT white glass
- [ ] Pain point card icons: use primary/secondary color, not teal
- [ ] Features grid cards (on dark section): dark glass, NOT white glass
- [ ] FAQ accordion items (on dark section): dark glass style
- [ ] FAQ trigger hover: text remains visible (uses `hover:text-white`)

**Light-Background Sections**
- [ ] Pricing cards: glass style on light background — this is correct, leave as is
- [ ] Pricing savings badge: blue/primary, not teal-600 or teal-50

**Other**
- [ ] Hero section template badge: uses primary (`bg-primary/90`), not teal-500
- [ ] Features section gradient: blue/primary family, not teal

### Dark Mode (toggle theme switch)

- [ ] Page background: warm near-black (~`#100f09`), not cool navy
- [ ] All text: readable against dark backgrounds
- [ ] Section cards: dark palette consistent
- [ ] Buttons: still visible in dark mode

---

## Page 2 — Templates Page (`/templates`)

### Light Mode
- [ ] Page/sidebar background: warm cream sidebar (`hsl(45 10% 95%)`)
- [ ] Template cards: correct border (`border-border`) and hover state
- [ ] Search / filter: input uses `bg-input-background`
- [ ] Primary actions: blue, not teal

### Dark Mode
- [ ] Sidebar: warm dark (`hsl(45 28% 5%)`), not navy
- [ ] Template card grid: dark palette
- [ ] Text remains readable

---

## Page 3 — Editor (`/editor`)

### Light Mode

**Toolbar**
- [ ] Toolbar background: `bg-sidebar` (warm)
- [ ] Toolbar buttons default: `text-muted-foreground`
- [ ] Toolbar buttons hover: `hover:bg-accent hover:text-accent-foreground` (no hardcoded gray)
- [ ] Toolbar active state: `bg-accent text-accent-foreground`
- [ ] Toolbar dividers: `bg-border` (not `bg-gray-200`)
- [ ] Radius label / value: semantic token colors (not hardcoded `text-gray-500/600`)

**Header & Navigation**
- [ ] Account menu trigger: visible in header
- [ ] Account dropdown: appears ABOVE ALL header content — not trapped behind glass
- [ ] Z-index check: open dropdown, it should float above template cards below

**Sidebars & Panels**
- [ ] Right sidebar: correct token usage
- [ ] Generate Template button: `bg-primary hover:bg-primary/90 text-primary-foreground` (not purple gradient)
- [ ] AI floating button (inactive): `bg-background border border-border`, sparkles icon is primary blue
- [ ] AI floating button (active): `bg-primary text-primary-foreground`
- [ ] Adjustments panel slider fill: blue (primary), not purple (`#A855F7`)
- [ ] Adjustments panel number input focus ring: blue (`ring`), not violet

**Components**
- [ ] NumberStepper (Beds / Baths): `[−][value][+]` layout, matches design system
- [ ] NumberStepper hover: `hover:bg-accent` on ± buttons
- [ ] NumberStepper at min: decrement button disabled (opacity-40)
- [ ] NumberStepper at max: increment button disabled (opacity-40)

**Overlays**
- [ ] Save dialog: appears above canvas and sidebars
- [ ] Any popover (color picker, etc.): appears above inline content
- [ ] Backdrop overlay: correct opacity when modal is open

### Dark Mode
- [ ] All editor panels: warm dark palette
- [ ] Toolbar: readable in dark mode
- [ ] No hardcoded light colors breaking dark mode

---

## Page 4 — Account Page (`/account`)

- [ ] Page layout: correct warm palette in both modes
- [ ] Buttons consistent with design system (blue primary)
- [ ] No teal remnants

---

## Page 5 — Pricing Page (`/pricing`)

- [ ] Pricing cards: glass style on correct background
- [ ] Plan tier badges / highlights: correct colors
- [ ] CTA buttons: blue primary
- [ ] "View all plans" link: `text-primary` (blue), not teal

---

## Token Spot Checks (DevTools Console)

Open DevTools → Console → paste each line and verify:

```javascript
// Light mode checks — toggle dark mode off first

// Should contain '207' (blue hue, not 174 teal)
getComputedStyle(document.documentElement).getPropertyValue('--primary').trim()

// Should contain '38' (amber hue)
getComputedStyle(document.documentElement).getPropertyValue('--secondary').trim()

// Should contain '45' (warm hue, not 220 cool grey)
getComputedStyle(document.documentElement).getPropertyValue('--background').trim()

// Should be rgba(12,...) NOT rgba(20,184,166,...)
getComputedStyle(document.documentElement).getPropertyValue('--glass-tint').trim()

// Should contain 'Outfit' or 'Inter'
getComputedStyle(document.documentElement).getPropertyValue('--font-display').trim()
```

```javascript
// Dark mode checks — toggle dark mode on first

// Should contain '45 30% 4%' (warm near-black, not 228 navy)
getComputedStyle(document.documentElement).getPropertyValue('--background').trim()

// Should contain '207' still (blue in dark mode)
getComputedStyle(document.documentElement).getPropertyValue('--primary').trim()
```

---

## Z-Index Spot Checks

| Element | Expected | How to test |
|---------|----------|-------------|
| Account dropdown | Above header glass and all content | Open dropdown → should not be hidden behind cards |
| Editor modals (Save dialog) | Above canvas | Trigger save → modal fully visible |
| Color picker popover | Above toolbar | Open color picker → not clipped |
| AI chat panel | Does not obscure main toolbar | Open chat → toolbar still accessible |

---

## Issue Logging

If an issue is found during this checklist:

```
⚠️ Issue: [description]
   Page: [page name]
   Element: [component:file:line if known]
   Mode: Light / Dark / Both
   Severity: P0 (blocks story) / P1 (fix before merge) / P2 (log as follow-up)
```

**Do NOT mark the story Done until all P0 and P1 issues are resolved.**
After fixing, re-run only the affected sections of this checklist.

---

*Checklist created: 2026-04-22 | Applies to: US-DESIGN-005 through US-DESIGN-011*
