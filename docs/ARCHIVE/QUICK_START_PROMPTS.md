# ⚡ Quick Start Prompts for AI-Assisted IDEs

> **Copy-paste these prompts directly into Lovable.dev or Replit AI**

---

## 🎯 Project Setup (First Prompt)

```
Create a React + TypeScript + Tailwind CSS project for an infographic editor.

Project structure:
- React 18 + TypeScript
- Tailwind CSS v4
- React Router v6
- Zustand for state management
- Radix UI components (shadcn/ui style)
- Vite as build tool

Dependencies to install:
- react, react-dom, react-router-dom
- typescript, @types/react, @types/react-dom
- tailwindcss, autoprefixer, postcss
- @radix-ui/react-dialog, @radix-ui/react-dropdown-menu, @radix-ui/react-select, @radix-ui/react-tabs, @radix-ui/react-popover, @radix-ui/react-slider, @radix-ui/react-toggle, @radix-ui/react-tooltip
- zustand
- react-rnd
- html2canvas
- lucide-react
- sonner
- motion
- @stripe/stripe-js
- @supabase/supabase-js
- react-hook-form
- zod

Create package.json, tsconfig.json, tailwind.config.js, and vite.config.ts.
Set up folder structure: src/components, src/lib, src/hooks, src/types, src/styles.
```

---

## 💳 Stripe Payment Setup

### Prompt 1: Stripe Client
```
Create a Stripe client utility:

File: src/lib/stripe.ts

Initialize Stripe with publishable key from environment variable VITE_STRIPE_PUBLISHABLE_KEY.

Functions needed:
1. loadStripe() - Initialize Stripe
2. createCheckoutSession(priceId: string) - Create checkout session for Pro plan ($19/month)
3. redirectToCheckout(sessionId: string) - Redirect to Stripe Checkout
4. getCustomerPortalUrl(customerId: string) - Get portal URL for subscription management

Handle errors gracefully. Add TypeScript types.
```

### Prompt 2: Pricing Modal
```
Create a pricing modal component:

File: src/components/payment/PricingModal.tsx

Show Free vs Pro plan comparison:
- Free: $0/month, 5 exports/month, 10 saved designs, basic features
- Pro: $19/month, unlimited exports, unlimited designs, AI features, priority support

Features:
- Clean pricing table with feature comparison
- "Upgrade to Pro" button that opens Stripe Checkout
- Handle success/cancel URLs
- Show loading state during checkout
- Use Radix UI Dialog component
- Match design system: neutral colors, Inter font, clean layout
```

### Prompt 3: Usage Tracking
```
Create usage tracking system:

File: src/lib/usage.ts

Functions:
- getUserPlan(): 'free' | 'pro'
- getExportCount(): number (exports this month)
- incrementExportCount(): void
- canExport(): boolean (free: max 5/month)
- getDesignCount(): number
- canSaveDesign(): boolean (free: max 10 designs)
- resetMonthlyUsage(): void (reset on new month)

Storage: Use LocalStorage for now.
Structure: { plan: 'free'|'pro', exportsThisMonth: number, periodStart: Date, designsCount: number }

Add TypeScript types. Handle edge cases.
```

---

## 🗄️ Supabase Backend Setup

### Prompt 1: Supabase Client
```
Create Supabase client:

File: src/lib/supabase.ts

Initialize Supabase client with:
- VITE_SUPABASE_URL (environment variable)
- VITE_SUPABASE_ANON_KEY (environment variable)

Export client instance and helper functions:
- getCurrentUser()
- signIn(email, password)
- signUp(email, password)
- signOut()
- getSession()

Add TypeScript types. Handle errors.
```

### Prompt 2: Database Schema
```
Create SQL migration for Supabase:

Tables needed:

1. users (extends auth.users)
   - id uuid primary key
   - email text
   - plan text ('free'|'pro')
   - stripe_customer_id text nullable
   - stripe_subscription_id text nullable
   - created_at timestamp
   - updated_at timestamp

2. designs
   - id uuid primary key
   - user_id uuid references users(id)
   - name text
   - thumbnail text
   - canvas_data jsonb
   - category text nullable
   - tags text[] nullable
   - is_template boolean default false
   - created_at timestamp
   - updated_at timestamp

3. usage_tracking
   - id uuid primary key
   - user_id uuid references users(id)
   - period_start date
   - exports_count integer default 0
   - designs_count integer default 0
   - created_at timestamp
   - updated_at timestamp

Add indexes, RLS policies, and triggers for updated_at.
```

### Prompt 3: Data Access Layer
```
Create database access functions:

File: src/lib/database.ts

Functions for designs:
- saveDesign(design: Design): Promise<Design>
- getDesigns(userId: string): Promise<Design[]>
- getDesignById(id: string): Promise<Design | null>
- updateDesign(id: string, updates: Partial<Design>): Promise<Design>
- deleteDesign(id: string): Promise<void>

Functions for usage:
- getUsage(userId: string): Promise<UsageStats>
- incrementExportCount(userId: string): Promise<void>
- incrementDesignCount(userId: string): Promise<void>
- resetMonthlyUsage(userId: string): Promise<void>

Functions for users:
- getUserPlan(userId: string): Promise<'free'|'pro'>
- updateUserPlan(userId: string, plan: 'free'|'pro'): Promise<void>

Use Supabase client. Add TypeScript types. Handle errors.
```

---

## 🎨 Canvas System

### Prompt 1: Canvas Store
```
Create Zustand store for canvas:

File: src/hooks/useCanvasStore.ts

State:
- elements: CanvasElement[]
- selectedElementIds: string[]
- canvasWidth: 1200
- canvasHeight: 800
- backgroundColor: '#FFFFFF'
- zoom: 1
- canvasPanX: 0
- canvasPanY: 0
- activeTool: 'select' | 'text' | 'image' | 'rectangle' | 'circle' | 'hand'
- history: { past: CanvasState[], future: CanvasState[] }

Actions:
- addElement(type: 'text'|'shape'|'image', props: Partial<CanvasElement>): string
- updateElement(id: string, updates: Partial<CanvasElement>): void
- deleteElement(id: string): void
- selectElement(id: string, multiSelect?: boolean): void
- clearSelection(): void
- setBackgroundColor(color: string): void
- setZoom(level: number): void
- setPan(x: number, y: number): void
- undo(): void
- redo(): void
- loadCanvas(data: CanvasData): void
- captureCanvasData(): CanvasData

Types:
- CanvasElement: { id: string, type: 'text'|'shape'|'image', x: number, y: number, width: number, height: number, ... }
- TextElement: extends CanvasElement with text properties
- ShapeElement: extends CanvasElement with shape properties
- ImageElement: extends CanvasElement with image properties

Add TypeScript types for everything.
```

### Prompt 2: Canvas Elements
```
Create canvas element components:

File: src/components/canvas/TextElement.tsx
- Render text with react-rnd for drag/resize
- Support inline editing (double-click)
- Show selection box when selected
- Apply properties: font, size, color, bold, italic, underline, alignment

File: src/components/canvas/ShapeElement.tsx
- Render rectangle or circle
- Support drag/resize with react-rnd
- Apply properties: fill, stroke, strokeWidth, opacity, cornerRadius
- Show selection box when selected

File: src/components/canvas/ImageElement.tsx
- Render image with react-rnd
- Apply filters: brightness, contrast, blur, saturation
- Support corner radius
- Show selection box when selected

All components:
- Use Zustand store for state
- Handle selection properly
- Support multi-select
- Use existing UI design system
- Match current UI styling
```

### Prompt 3: Main Canvas Component
```
Create main canvas component:

File: src/components/editor/CenterCanvas.tsx

Features:
- Render canvas container (1200x800px, centered, with shadow)
- Render all elements from Zustand store
- Handle canvas click (deselect)
- Handle element selection (single and multi-select with Shift)
- Show empty state when no elements
- Support panning (hand tool)
- Support zoom
- Show dot grid background
- Render contextual toolbar above selected element
- Render dimensions display below selected element

Layout:
- Centered canvas with rounded corners
- Dot grid background pattern
- Transform support (pan/zoom)
- Responsive container

Use existing design system. Match current UI exactly.
```

---

## 🛠️ Toolbar Components

```
Create contextual toolbar components:

File: src/components/editor/toolbar/TextToolbar.tsx
- Font family dropdown (Inter, Arial, Georgia, Roboto, etc.)
- Font size input with +/- buttons (12-72px)
- Bold, Italic, Underline toggle buttons
- Color picker (text color)
- Alignment buttons (left, center, right)

File: src/components/editor/toolbar/ShapeToolbar.tsx
- Fill color picker
- Stroke color picker
- Stroke width slider (0-20px)
- Opacity slider (0-100%)
- Corner radius slider (0-50px, rectangles only)

File: src/components/editor/toolbar/ImageToolbar.tsx
- Opacity slider (0-100%)
- Corner radius slider (0-50px)
- Brightness slider (0-200%)
- Contrast slider (0-200%)
- Blur slider (0-20px)
- Saturation slider (0-200%)
- Reset filters button

File: src/components/editor/toolbar/DefaultToolbar.tsx
- Show when nothing selected
- Display canvas info or helpful tips

All toolbars:
- Update element properties in Zustand store immediately
- Use Radix UI components (Select, Slider, Toggle, Popover)
- Match existing design system
- Be responsive
- Show in top toolbar area
```

---

## 💾 Save/Load System

```
Create save/load system:

File: src/lib/canvasState.ts

Functions:
1. captureCanvasData(): CanvasData
   - Get all elements from Zustand store
   - Include canvas metadata (width, height, background, zoom)
   - Return serializable JSON structure

2. restoreCanvasData(data: CanvasData): void
   - Restore elements to Zustand store
   - Restore canvas metadata
   - Handle all element types (text, shape, image)
   - Validate data structure

3. generateThumbnail(): Promise<string>
   - Capture canvas as image
   - Resize to 320x180px
   - Return base64 data URL
   - Use html2canvas or native Canvas API

4. saveDesign(name: string, category?: string): Promise<void>
   - Capture canvas data
   - Generate thumbnail
   - Save to Supabase (or LocalStorage fallback)
   - Update usage tracking
   - Show success toast

5. loadDesign(id: string): Promise<void>
   - Fetch design from Supabase
   - Restore canvas data
   - Show loading state
   - Handle errors

Add TypeScript types. Handle errors gracefully.
```

---

## 📤 Export System

```
Create export functionality:

File: src/lib/canvasExport.ts

Function: exportToPNG(options?: ExportOptions): Promise<void>

Features:
1. Check usage limits before export (use lib/usage.ts)
2. If limit reached, show PricingModal
3. If allowed, proceed:
   - Deselect all elements
   - Capture canvas using html2canvas or native Canvas API
   - Apply options: resolution (1x, 2x, 3x), format (PNG/JPG), background
   - Convert to blob
   - Trigger download
   - Increment export count
   - Show success toast

Options:
- resolution: 1 | 2 | 3 (default: 2)
- format: 'png' | 'jpg' (default: 'png')
- background: 'white' | 'transparent' (default: 'white')
- filename?: string (default: 'design-{timestamp}')

Handle errors. Show loading state. Use existing toast system (sonner).
```

---

## 🔐 Authentication (Optional for MVP)

```
Create authentication system:

File: src/lib/auth.ts
- signIn(email, password)
- signUp(email, password)
- signOut()
- getCurrentUser()
- onAuthStateChange(callback)

File: src/components/auth/LoginForm.tsx
- Email/password form
- Sign in button
- Sign up link
- Error handling
- Use react-hook-form + zod

File: src/components/auth/SignUpForm.tsx
- Email/password form
- Sign up button
- Sign in link
- Error handling

File: src/components/auth/AuthGuard.tsx
- Protect routes requiring auth
- Redirect to login if not authenticated
- Show loading state

For MVP, make auth optional (allow guest users with LocalStorage).
```

---

## 🧩 Integration Prompts

### Connect Save to Backend
```
Update save functionality to use Supabase:

In components/editor/EditorLayout.tsx or SaveDialog.tsx:

1. When user clicks Save:
   - Capture canvas data (use lib/canvasState.ts)
   - Generate thumbnail
   - Check usage limits (use lib/usage.ts)
   - If limit reached, show PricingModal
   - If allowed, save to Supabase (use lib/database.ts)
   - Update usage tracking
   - Show success toast

2. Handle errors:
   - Network errors → show retry option
   - Validation errors → show specific message
   - Quota errors → show upgrade prompt

3. Add loading state during save
4. Update My Designs page after save
```

### Connect Export to Usage
```
Update export button to check usage limits:

In components/editor/EditorToolbar.tsx:

1. Before export:
   - Check canExport() from lib/usage.ts
   - If false, show PricingModal
   - If true, proceed with export

2. After successful export:
   - Increment export count (use lib/usage.ts)
   - Show success toast
   - Update usage display

3. Show usage indicator:
   - "X/5 exports used" for free users
   - "Unlimited" for pro users
   - Show upgrade prompt when near limit (4/5)
```

### Connect Payment Flow
```
Wire up payment flow:

1. In PricingModal.tsx:
   - On "Upgrade to Pro" click:
     - Call lib/stripe.createCheckoutSession('pro_price_id')
     - Redirect to Stripe Checkout
     - Handle success URL: /account?upgraded=true
     - Handle cancel URL: /account

2. On success redirect:
   - Update user plan in Supabase
   - Update LocalStorage
   - Show success toast
   - Refresh usage limits

3. In BillingScreen.tsx:
   - Show current plan
   - Show usage stats
   - "Manage Subscription" button → Stripe Customer Portal
   - "Upgrade to Pro" button → PricingModal

Use existing components. Match current UI design.
```

---

## 🧪 Testing Prompt

```
Create a comprehensive test plan:

Test these user flows:

1. Create Design:
   - Open editor
   - Add text, shape, image
   - Edit properties
   - Save design
   - Verify saved in My Designs

2. Load Design:
   - Go to My Designs
   - Click design
   - Verify loads correctly
   - Make changes
   - Save changes
   - Verify updated

3. Template:
   - Go to Templates
   - Click "Use Template"
   - Verify loads in editor
   - Edit and save

4. Export:
   - Create design
   - Click Export
   - Verify PNG downloads
   - Check quality

5. Payment:
   - Try to export (free user)
   - Hit limit (5 exports)
   - See upgrade prompt
   - Complete Stripe checkout (test mode)
   - Verify plan updated
   - Verify unlimited exports

6. Usage:
   - Check export count
   - Check design count
   - Verify limits enforced

Create test checklist. Fix any bugs found.
```

---

## 🚀 Deployment Prompt

```
Set up deployment configuration:

For Vercel:
1. Create vercel.json:
   - Build command: npm run build
   - Output directory: dist
   - Framework: vite

2. Environment variables needed:
   - VITE_SUPABASE_URL
   - VITE_SUPABASE_ANON_KEY
   - VITE_STRIPE_PUBLISHABLE_KEY
   - VITE_OPENAI_API_KEY (optional)

3. Add redirect rules for SPA:
   - All routes → /index.html

For Netlify:
1. Create netlify.toml with same settings
2. Add environment variables in dashboard

Create .env.example file with all variables (no values).
Add .env.local to .gitignore.
```

---

## 📝 Quick Copy Checklist

Use these prompts in order:

1. ✅ Project Setup
2. ✅ Stripe Client
3. ✅ Pricing Modal
4. ✅ Usage Tracking
5. ✅ Supabase Client
6. ✅ Database Schema
7. ✅ Data Access Layer
8. ✅ Canvas Store
9. ✅ Canvas Elements
10. ✅ Main Canvas Component
11. ✅ Toolbar Components
12. ✅ Save/Load System
13. ✅ Export System
14. ✅ Connect Save to Backend
15. ✅ Connect Export to Usage
16. ✅ Connect Payment Flow
17. ✅ Testing
18. ✅ Deployment

---

**Tip:** Copy each prompt one at a time, let AI complete it, then move to the next. Don't rush - let AI do the work! 🚀

