# Design Token Diff — Current vs New

**Current source:** `client/src/styles/globals.css`  
**New source:** `client/src/design-tokens.css`  
**Generated:** 2026-04-13

---

## Executive Summary

| Metric | Current (`globals.css`) | New (`design-tokens.css`) |
|---|---|---|
| Token groups | 1 (shadcn HSL only) | 9 distinct groups |
| Total CSS variables | ~35 | ~220+ |
| Semantic text/bg/border tokens | ❌ None | ✅ 20 tokens |
| Component-specific tokens | ❌ None | ✅ 35 tokens |
| Category / domain color system | ❌ None (hardcoded in `.ts` files) | ✅ 18 tokens |
| Badge tier tokens | ❌ None (hardcoded Tailwind classes) | ✅ 10 tokens |
| Primitive palette (raw values) | ❌ None | ✅ 80+ tokens |
| Typography tokens (scale, weights, display font) | Partial (no scale, no Outfit) | ✅ Complete |
| Motion / animation tokens | ❌ None | ✅ 13 tokens |
| Z-index stack | ❌ None | ✅ 9 tokens |
| Dark mode coverage | Partial | ✅ Complete for all groups |
| Hardcoded colors in components | **249 occurrences across 41 files** | Mapped to tokens |

---

## 1. Core Color Tokens (shadcn / Tailwind HSL)

These live in `:root` and are consumed via `hsl(var(--token))`.

### 1.1 Primary Color — **CHANGED**

| Token | Current | New | Visual |
|---|---|---|---|
| `--primary` | `174 72% 40%` — **Teal** | `207 90% 49%` — **Blue `#0ca0eb`** | 🟦 |
| `--ring` | `174 72% 40%` — Teal | `207 90% 49%` — Blue | 🟦 |
| `--sidebar-primary` | `174 72% 40%` — Teal | `207 90% 49%` — Blue | 🟦 |
| `--accent` | `174 72% 95%` — pale teal | `207 90% 95%` — pale blue | 🟦 |
| `--accent-foreground` | `174 72% 25%` | `207 90% 35%` | |

**Why:** Teal (`174°`) reads as "health/wellness/fintech". Electric blue (`207°`) is the exact hue used by Lovart.ai (`#0ca0eb`) — tech-forward, creative-tool energy, and matches our existing `templateData.ts` category color for Listing Announcements (`#3B82F6`).

---

### 1.2 Secondary Color — **CHANGED**

| Token | Current | New | Visual |
|---|---|---|---|
| `--secondary` | `239 84% 67%` — **Purple-blue** | `38 93% 66%` — **Amber `#f9b959`** | 🟡 |
| `--secondary-foreground` | `0 0% 100%` — white | `45 30% 6%` — dark (on amber) | |

**Why:** Purple-blue secondary clashed visually with the purple AI accent (`--color-accent-purple: #722ed1`). Amber creates warm contrast, works as a secondary CTA, and is Lovart.ai's signature accent color. AI/flow features keep purple exclusively.

---

### 1.3 Background — **CHANGED**

| Token | Current | New | Visual |
|---|---|---|---|
| `--background` | `220 20% 97%` — cool blue-grey | `45 13% 97%` — **warm cream** `#f9f8f6` | 🟤 |
| `--sidebar` | `220 20% 95%` — cool grey | `45 10% 95%` — warm grey | 🟤 |
| `--muted` | `220 15% 92%` — cool | `45 10% 92%` — warm | |
| `--muted-foreground` | `220 10% 42%` | `45 5% 48%` | |
| `--card` | `0 0% 100%` | `0 0% 100%` | ✅ Unchanged |
| `--border` | `220 15% 88%` | `45 10% 88%` | |
| `--input` | `220 15% 85%` | `45 10% 85%` | |

**Why:** Cool blue-grey backgrounds feel corporate/SaaS-generic. Both reference sites (Lovart, FillinForm) use warm off-whites. Shifting hue from `220°` (cool blue) to `45°` (warm cream) is subtle but transforms the overall warmth of the UI.

---

### 1.4 Foreground — **MINOR CHANGE**

| Token | Current | New | Visual |
|---|---|---|---|
| `--foreground` | `222 47% 11%` — cool navy `#0f1729` | `45 30% 6%` — **warm near-black** `#100f09` | |
| `--card-foreground` | `222 47% 11%` | `45 30% 6%` | |
| `--popover-foreground` | `222 47% 11%` | `45 30% 6%` | |

**Why:** Lovart's text color is `#100f09` — a warm near-black with a subtle brown undertone. On warm backgrounds, warm text creates more cohesion. Cool navy text on warm cream creates micro-contrast fatigue.

---

### 1.5 Dark Mode — **SIGNIFICANTLY CHANGED**

| Token | Current | New |
|---|---|---|
| `--background` | `228 20% 6%` — **cool dark navy** | `45 30% 4%` — **warm near-black** |
| `--foreground` | `0 0% 95%` — near white | `45 20% 96%` — warm near-white |
| `--card` | `228 15% 10%` — cool dark | `45 25% 7%` — warm dark |
| `--sidebar` | `228 18% 8%` — cool | `45 28% 5%` — warm |
| `--muted` | `228 12% 14%` | `45 15% 12%` |
| `--accent` | `174 50% 12%` — dark teal | `207 50% 14%` — dark blue |
| `--primary` | `174 72% 45%` — teal | `207 90% 55%` — blue |
| `--secondary` | `239 60% 55%` — purple-blue | `38 80% 50%` — amber |

**Why:** Current dark mode uses a cool dark navy (`228°`) that feels like GitHub/VS Code. Lovart's canvas dark is a warm near-black (`#100f09` ≈ `45° 30% 4%`). Warm darks reduce eye strain for long creative sessions and feel more distinct from generic dev tools.

---

### 1.6 Chart Colors — **CHANGED**

| Token | Current | New |
|---|---|---|
| `--chart-1` | `174 72% 40%` — teal | `207 90% 49%` — blue |
| `--chart-2` | `239 84% 67%` — purple | `38 93% 60%` — amber |
| `--chart-3` | `38 92% 50%` — orange | `142 71% 40%` — green |
| `--chart-4` | `280 65% 60%` — purple | `285 60% 50%` — purple (minor) |
| `--chart-5` | `340 75% 55%` — pink | `340 75% 55%` — pink ✅ |

---

## 2. Typography — **EXTENDED**

| Token | Current | New |
|---|---|---|
| `--font-sans` | `Inter, -apple-system, ...` | `Inter, -apple-system, ...` ✅ Same |
| `--font-display` | ❌ **Does not exist** | ✅ `Outfit, Inter, sans-serif` |
| `--font-mono` | `"SF Mono", Monaco, ...` | `"SF Mono", Monaco, ...` ✅ Same |
| `--font-size` | `16px` | `16px` ✅ Same |
| Font size scale (`--font-size-11` → `--font-size-48`) | ❌ None | ✅ 9 steps added |
| Line height scale | ❌ None | ✅ 5 steps added |
| `--font-weight-normal` | `400` ✅ Same | `400` |
| `--font-weight-medium` | `500` ✅ Same | `500` |
| `--font-weight-semibold` | ❌ None | ✅ `600` added |
| `--font-weight-bold` | ❌ None | ✅ `700` added |

**Impact:** Both Lovart.ai and FillinForm use **Outfit** as their display/heading font. Currently `globals.css` only defines `Inter`. Headings like `h1` on the Templates page and landing page should use `var(--font-display)` once the font is loaded.

---

## 3. Border Radius — **EXTENDED**

| Token | Current | New |
|---|---|---|
| `--radius` | `0.75rem` (12px) | `0.75rem` ✅ Same |
| `--radius-sm` | `calc(var(--radius) - 4px)` = 8px | `6px` (direct) |
| `--radius-md` | `calc(var(--radius) - 2px)` = 10px | `8px` (direct) |
| `--radius-lg` | `var(--radius)` = 12px | `12px` ✅ Same value |
| `--radius-xl` | `calc(var(--radius) + 4px)` = 16px | `16px` ✅ Same value |
| `--radius-xs` | ❌ None | ✅ `4px` — tags, badges |
| `--radius-2xl` | ❌ None | ✅ `24px` — pill cards |
| `--radius-full` | ❌ None | ✅ `9999px` — avatars, pills |

---

## 4. Shadows — **REVISED**

| Token | Current | New | Change |
|---|---|---|---|
| `--shadow-sm` | `0px 2px 4px -1px rgba(0,0,0,.06), 0px 4px 8px...` | `0px 1px 2px rgba(0,0,0,.05), 0px 1px 3px rgba(0,0,0,.10)` | Lighter |
| `--shadow` | `same as shadow-sm` | Removed (use `--shadow-md`) | Consolidated |
| `--shadow-lg` | `0px 8px 16px -4px rgba(0,0,0,.10), 0px 16px 32px...` | `0px 8px 16px -4px rgba(0,0,0,.10), 0px 2px 2px rgba(0,0,0,.04)` | Lighter |
| `--shadow-2xl` | `0px 32px 64px -16px rgba(0,0,0,.25)` | `0px 32px 64px -16px rgba(0,0,0,.18)` | Lighter |
| `--shadow-xs` | ❌ None | ✅ Added — `0px 1px 2px rgba(0,0,0,.04)` | New |
| `--shadow-md` | ❌ None | ✅ Added — `0px 4px 20px rgba(0,0,0,.08)` | New |
| `--shadow-xl` | ❌ None | ✅ Added — `0px 16px 40px rgba(193,193,193,.25)` | New |

**Why:** Both reference sites use feather-light shadows (max `0.08–0.10` opacity). Current shadows go up to `0.25` on `shadow-2xl`, which feels dated (Material v2 era).

---

## 5. Glassmorphism — **REFINED**

| Token | Current | New | Change |
|---|---|---|---|
| `--glass-bg` (light) | `rgba(255,255,255, 0.88)` | `rgba(255,255,255, 0.88)` ✅ Same |
| `--glass-border` (light) | `rgba(180,200,220, 0.55)` | `rgba(180,200,220, 0.45)` | Softer |
| `--glass-blur` | `28px` | `24px` | Less blur |
| `--glass-tint` | `rgba(20,184,166, 0.03)` — teal | `rgba(12,160,235, 0.02)` — blue | Matches new primary |
| `--glass-bg` (dark) | `rgba(15,23,32, 0.85)` — cool | `rgba(16,15,9, 0.85)` — warm | Matches warm dark |
| `--glass-shadow` (dark) | `0 8px 32px rgba(0,0,0,.40)` | `0 8px 32px rgba(0,0,0,.50)` | Deeper on dark |
| `--surface-panel-95` | ❌ None | ✅ `rgba(255,255,255, 0.95)` — toolbar | New |
| `--surface-panel-90` | ❌ None | ✅ `rgba(255,255,255, 0.90)` — sidebars | New |
| `--surface-panel-85` | ❌ None | ✅ `rgba(255,255,255, 0.85)` — hover cards | New |
| `--surface-chatbox` | ❌ None | ✅ `rgba(0,0,0, 0.40)` — AI input | New |

---

## 6. NEW — Semantic Token Layer

> **These do not exist at all in `globals.css`.** They are an additional layer on top of the shadcn HSL tokens that give intent-based names for direct use in component CSS.

### Background tokens
| Token | Value (light) | Value (dark) |
|---|---|---|
| `--bg-base-default` | `#f9f8f6` | `#100f09` |
| `--bg-base-secondary` | `#f2f1ee` | `#1a1a14` |
| `--bg-base-tertiary` | `#eae9e6` | `#222219` |
| `--bg-input` | `#ffffff` | `#1a1a14` |
| `--bg-invert` | `#100f09` | `#f5f4ef` |
| `--bg-overlay-l1/l2/l3` | 5% / 10% / 15% dark | 5% / 10% / 15% light |

### Text tokens
| Token | Value (light) | Value (dark) |
|---|---|---|
| `--text-default` | `#100f09` | `#f5f4ef` |
| `--text-secondary` | `#525251` | `#a4a09b` |
| `--text-tertiary` | `#7c7c79` | `#6b6762` |
| `--text-disabled` | `#7c7c79` | `#6b6762` |
| `--text-invert` | `#f5f4ef` | `#100f09` |
| `--text-link` | `#0ca0eb` | `#3db5f5` |

### Border tokens
| Token | Value (light) | Value (dark) |
|---|---|---|
| `--border-subtle` | `rgba(26,26,25, 0.06)` | `rgba(245,244,239, 0.06)` |
| `--border-default` | `rgba(26,26,25, 0.12)` | `rgba(245,244,239, 0.12)` |
| `--border-strong` | `rgba(26,26,25, 0.18)` | `rgba(245,244,239, 0.20)` |
| `--border-focus` | `#0ca0eb` | `#3db5f5` |

### Icon tokens (mirrors text, for `color:` on `<svg>`)
`--icon-default` / `--icon-secondary` / `--icon-tertiary` / `--icon-brand` — 4 tokens, no equivalent in current system.

---

## 7. NEW — Component-Specific Tokens

> **None of these exist in `globals.css`.** Currently every component hardcodes its own colors.

### Template cards (FillinForm pattern)
```
--card-bg, --card-border, --card-shadow, --card-shadow-hover
--card-radius, --card-header-min-height, --card-header-icon-bg
```

### Floating toolbar (Lovart dark pill)
```
--toolbar-floating-bg:     #2c2c2c
--toolbar-floating-text:   #ffffff
--toolbar-floating-shadow: (multi-layer)
--toolbar-floating-radius: 9999px (pill)
```

### Sidebar panels
```
--sidebar-panel-bg, --sidebar-panel-border
--sidebar-panel-item-bg-hover, --sidebar-panel-item-bg-active
--sidebar-panel-item-text, --sidebar-panel-item-text-active
```

### AI chat panel
```
--chat-panel-bg, --chat-message-ai-bg, --chat-message-user-bg
--chat-input-bg, --chat-input-border
--chat-promo-banner-bg: #e0ff66 (Lovart lime)
```

### Navigation bar
```
--navbar-bg, --navbar-border, --navbar-height: 56px
--navbar-link-text, --navbar-link-text-active
```

### Buttons (CTA system)
```
--btn-cta-bg:       #0f1729  (FillinForm dark navy — "Use Template")
--btn-cta-text:     #ffffff
--btn-primary-bg:   #0ca0eb  (brand blue — primary actions)
--btn-primary-text: #ffffff
```

### Search bar
```
--search-bg, --search-border, --search-shadow, --search-radius
```

### Canvas
```
--canvas-bg:               #f5f5f5
--canvas-grid-dot:         #cfcfcf
--canvas-selection-stroke: #3b82f6
--canvas-selection-fill:   rgba(17,176,255, 0.10)
```

### Avatars, badges, filter pills
```
--avatar-size-sm/md/lg, --avatar-bg
--badge-bg, --badge-text, --badge-radius
--filter-pill-active-bg, --filter-pill-inactive-bg, --filter-pill-radius
```

---

## 8. NEW — Real Estate Category Color System

> **Currently hardcoded in `.ts` data files and Tailwind utility classes.**  
> The new system creates a single source of truth in CSS.

### Template categories (`templateData.ts` — currently hardcoded hex)

| Token | Old value (hardcoded in `.ts`) | New token | Color |
|---|---|---|---|
| `--category-listing-announcements` | `'#3B82F6'` (JS string) | CSS variable | 🔵 Blue |
| `--category-property-features` | `'#8B5CF6'` (JS string) | CSS variable | 🟣 Purple |
| `--category-status-updates` | `'#10B981'` (JS string) | CSS variable | 🟢 Emerald |
| `--category-agent-branding` | `'#F59E0B'` (JS string) | CSS variable | 🟡 Amber |

### AI chat chips (`categoryChipsData.ts` — currently hardcoded hex)

| Token | Old value (hardcoded in `.ts`) | New token | Color |
|---|---|---|---|
| `--chip-property-listings` | `'#FF8C00'` | CSS variable | 🔵 Blue (aligned) |
| `--chip-open-house` | `'#4CAF50'` | `#F97316` (changed to Orange) | 🟠 Orange |
| `--chip-just-sold` | `'#2196F3'` | `#10B981` (changed to Emerald) | 🟢 Emerald |
| `--chip-agent-branding` | `'#9C27B0'` | `#F59E0B` (changed to Amber) | 🟡 Amber |
| `--chip-market-stats` | `'#FF5722'` | `#6366F1` (changed to Indigo) | 🔷 Indigo |
| `--chip-neighborhood` | `'#00BCD4'` | `#14B8A6` (changed to Teal) | 🩵 Teal |

**Alignment fix:** The old `categoryChipsData.ts` and `templateData.ts` used completely different colors for the same conceptual category (e.g., agent-branding was `#9C27B0` in chips but `#F59E0B` in templates). The new tokens unify them.

### Category surface tints (NEW — for icon containers)
7 tokens at 12% opacity — no equivalent exists currently.

---

## 9. NEW — Template Badge Tier Tokens

> **Currently: raw Tailwind classes scattered in component code.**

| Badge | Current (in `TemplatesPage.tsx`) | New token | Notes |
|---|---|---|---|
| Luxury | `bg-foreground/90 text-background` | `--badge-luxury-bg: #92400E` + `--badge-luxury-text: #FEF3C7` | Deep amber-brown |
| Standard | `bg-muted-foreground/80 text-background` | `--badge-standard-bg: #1E3A5F` + `--badge-standard-text: #DBEAFE` | Deep navy |
| Budget | `bg-primary/80 text-primary-foreground` | `--badge-budget-bg: #14532D` + `--badge-budget-text: #DCFCE7` | Deep green |
| Custom | `bg-purple-600 text-white` (hardcoded) | `--badge-custom-bg: #4C1D95` + `--badge-custom-text: #EDE9FE` | Deep purple |
| API | `bg-blue-600 text-white` (hardcoded) | `--badge-api-bg: #0C3461` + `--badge-api-text: #E0F2FE` | Deep sky blue |

---

## 10. NEW — Motion / Animation Tokens

> **None exist in `globals.css`.**

```css
--duration-instant: 50ms   | --duration-fast:   100ms
--duration-normal:  200ms  | --duration-slow:   350ms
--duration-slower:  500ms

--ease-default:  cubic-bezier(0.4, 0, 0.2, 1)
--ease-in:       cubic-bezier(0.4, 0, 1, 1)
--ease-out:      cubic-bezier(0, 0, 0.2, 1)
--ease-spring:   cubic-bezier(0.34, 1.56, 0.64, 1)   ← overshoot/bounce
--ease-smooth:   cubic-bezier(0.25, 0.46, 0.45, 0.94)

--transition-base:      (color + bg + border + opacity)
--transition-shadow:    box-shadow
--transition-transform: transform with spring easing
```

---

## 11. NEW — Z-Index Stack

> **None exist in `globals.css`.** Currently components use arbitrary hardcoded `z-50`, `z-[9999]` etc.

```
--z-below:    -1   | --z-base:     0
--z-raised:   10   | --z-dropdown: 100
--z-sticky:   200  | --z-overlay:  300
--z-modal:    400  | --z-popover:  500
--z-toast:    600  | --z-max:      9999
```

---

## 12. NEW — Primitive Palette

> **Does not exist in `globals.css`.** Raw named values. Never use in components — reference via semantic tokens.

Full scales (100–1000 steps) added for:
`blue` · `amber` · `neutral` (warm) · `green` · `red` · `purple` · `cyan`

Translucent scales added:
`--primitive-white-5` through `--primitive-white-95` (9 steps)  
`--primitive-dark-5` through `--primitive-dark-95` (9 steps)

---

## 13. Hardcoded Values That Need Token Migration

The diff above covers the CSS token layer. There are **249 occurrences across 41 files** of hardcoded Tailwind color classes (`bg-blue-*`, `text-gray-*`, `bg-purple-*`) and inline hex values that bypass the token system entirely. The most critical ones:

| File | Issue | Replacement token |
|---|---|---|
| `TemplatesPage.tsx:143` | `bg-purple-600 text-white` (Custom badge) | `--badge-custom-bg/text` |
| `TemplatesPage.tsx:153` | `bg-blue-600 text-white` (API badge) | `--badge-api-bg/text` |
| `TemplatesPage.tsx:275` | `bg-purple-500 text-white` (Custom badge again) | `--badge-custom-bg/text` |
| `TemplateCategoryView.tsx:40–89` | All `text-gray-*`, `bg-gray-*`, `border-gray-*` | Semantic tokens |
| `categoryChipsData.ts:13–43` | 6 hardcoded hex values | `--chip-*` tokens |
| `templateData.ts:16–40` | 4 hardcoded hex values | `--category-*` tokens |
| `sidebar/ToolsTab.tsx:21` | `bg-blue-50 text-blue-600` | `--sidebar-panel-item-bg-active` |
| `sidebar/LayerItem.tsx:46` | `bg-blue-50 border-blue-200` | `--sidebar-panel-item-bg-active` |
| `editor/DimensionsDisplay.tsx:26` | `bg-blue-600 dark:bg-blue-700` | `--btn-primary-bg` |

> **Note:** Token migration of component files is the next phase — this document covers only the token definition layer.

---

## 14. Page Background — CHANGED

| | Current | New |
|---|---|---|
| `--page-bg` (light) | `linear-gradient(135deg, hsl(220 20% 97%) 0%, hsl(174 30% 96%) 50%, hsl(220 20% 97%) 100%)` — cool teal hint | `linear-gradient(135deg, hsl(45 15% 97%) 0%, hsl(210 18% 97%) 50%, hsl(45 12% 97%) 100%)` — warm cream |
| `--page-bg` (dark) | `linear-gradient(135deg, hsl(220 25% 5%) 0%, hsl(200 30% 7%) 30%, hsl(174 20% 6%) 60%, ...)` — teal-blue | `linear-gradient(135deg, hsl(45 30% 4%) 0%, hsl(220 20% 6%) 40%, hsl(45 25% 5%) 100%)` — warm dark |

---

## Quick Application Checklist

To apply the new tokens to the app:

- [ ] **Replace** `:root` and `.dark` blocks in `globals.css` with the HSL tokens from `design-tokens.css`
- [ ] **Add** `@import './design-tokens.css'` at top of `globals.css` (or copy the `:root` blocks over)
- [ ] **Add** `<link rel="preconnect">` + Google Fonts import for **Outfit** in `index.html`
- [ ] **Update** `tailwind.config.ts` to register `fontFamily.display: ['Outfit', 'Inter']`
- [ ] **Migrate** `categoryChipsData.ts` — replace 6 hex strings with `getComputedStyle` reads or CSS variable references
- [ ] **Migrate** `templateData.ts` — replace 4 hex strings with token-aligned values
- [ ] **Migrate** `TemplatesPage.tsx` — replace `badgeColor` strings with token-based classes
- [ ] **Migrate** `TemplateCategoryView.tsx` — replace all `text-gray-*`/`bg-gray-*` with semantic tokens
- [ ] **Migrate** `ToolsTab.tsx` + `LayerItem.tsx` — replace `bg-blue-50 text-blue-600` with `--sidebar-panel-item-bg-active`
