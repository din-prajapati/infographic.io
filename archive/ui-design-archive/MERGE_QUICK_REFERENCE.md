# Quick Merge Reference Guide

> **Quick action items for merging Replit backend with UI Design frontend**

## 🎯 Priority Actions

### 🔴 Critical (Do First)

1. **Remove Debug Code**
   ```bash
   # Search and remove all instances of:
   fetch('http://127.0.0.1:7243/...')
   ```
   **Files:** `App.tsx`, `CenterCanvas.tsx`, `EditorLayout.tsx`

2. **Add Authentication**
   - Copy `client/src/lib/auth.tsx` → `src/lib/auth.tsx`
   - Copy `client/src/pages/auth-page.tsx` → `src/pages/AuthPage.tsx`
   - Wrap App with `<AuthProvider>`

3. **Add Routing**
   ```bash
   npm install wouter
   ```
   - Replace state-based routing with Wouter
   - Add protected routes

4. **Add API Client**
   - Copy `client/src/lib/api.ts` → `src/lib/api.ts`
   - Copy `client/src/lib/queryClient.ts` → `src/lib/queryClient.ts`
   ```bash
   npm install @tanstack/react-query axios
   ```

### 🟡 High Priority (Day 2-3)

5. **Migrate Data Storage**
   - Replace LocalStorage with API calls
   - Keep LocalStorage as cache/fallback
   - Update `useCanvasStore` to use API

6. **Add Payment Components**
   - Copy `client/src/components/payments/*` → `src/components/payment/*`
   - Copy `client/src/pages/pricing-page.tsx` → `src/pages/PricingPage.tsx`
   - Add payment route

### 🟢 Medium Priority (Day 4-5)

7. **Update Build Config**
   - Align `vite.config.ts` paths
   - Update build output directory
   - Add environment variable support

8. **Error Handling**
   - Add error boundaries
   - Add loading states
   - Add user-friendly error messages

## 📋 File Copy Checklist

### From Replit → UI Design

```
✅ client/src/lib/auth.tsx → src/lib/auth.tsx
✅ client/src/lib/api.ts → src/lib/api.ts
✅ client/src/lib/queryClient.ts → src/lib/queryClient.ts
✅ client/src/pages/auth-page.tsx → src/pages/AuthPage.tsx
✅ client/src/pages/pricing-page.tsx → src/pages/PricingPage.tsx
✅ client/src/components/payments/* → src/components/payment/*
✅ client/src/components/AuthForm.tsx → src/components/AuthForm.tsx
```

### Keep from UI Design (Superior Implementation)

```
✅ src/components/editor/* (Advanced editor)
✅ src/lib/canvasState.ts (Canvas state)
✅ src/lib/canvasExport.ts (Export functionality)
✅ src/hooks/useCanvasStore.ts (State management)
```

## 🔧 Quick Fixes

### Fix Path Aliases

**vite.config.ts:**
```typescript
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
    '@shared': path.resolve(__dirname, '../shared'), // If using shared
  },
}
```

### Fix Imports

**Before:**
```typescript
import { something } from '@/components/...'
```

**After (if path changed):**
```typescript
import { something } from '@/components/...' // Same, just verify paths
```

### Add Environment Variables

Create `.env`:
```env
VITE_API_BASE_URL=http://localhost:3001/api/v1
VITE_RAZORPAY_KEY_ID=rzp_test_...
```

## 📦 Dependencies to Install

```bash
# Routing
npm install wouter

# API & State
npm install @tanstack/react-query axios

# Already in UI Design, verify versions:
# zustand, react, react-dom, etc.
```

## 🚀 Quick Start After Merge

1. **Start Backend** (from Replit codebase)
   ```bash
   cd api
   npm install
   npx prisma generate
   npx prisma db push
   npm run start:dev
   ```

2. **Start Frontend** (from UI Design codebase)
   ```bash
   npm install
   npm run dev
   ```

3. **Test Flow**
   - Register/Login
   - Load templates
   - Create design
   - Save design
   - Load design
   - Export design
   - Checkout payment

## ⚠️ Common Pitfalls

1. **Path Alias Mismatch**
   - Verify `@/` resolves correctly
   - Check `vite.config.ts` alias config

2. **CORS Issues**
   - Backend must allow frontend origin
   - Check NestJS CORS config

3. **Auth Token Not Sent**
   - Verify `apiRequest` adds Authorization header
   - Check token storage in localStorage

4. **Payment Modal Not Opening**
   - Verify RazorPay script in `index.html`
   - Check `VITE_RAZORPAY_KEY_ID` is set

## 📞 Need Help?

- See `CODEBASE_MERGE_MAPPING.md` for detailed analysis
- See `1_WEEK_LAUNCH_PLAN.md` for day-by-day checklist
- Check `PAYMENT_INTEGRATION_README.md` for payment setup

