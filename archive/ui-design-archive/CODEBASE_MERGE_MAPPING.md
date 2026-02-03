# Codebase Merge Mapping & MVP Plan

> **Analysis Date:** January 6, 2025  
> **Goal:** Merge Replit Backend/Payment codebase with UI Design codebase to create MVP in 1 week

---

## 📋 Executive Summary

### Codebase Overview

| Aspect                 | Replit Codebase (`06012026_Replit`)  | UI Design Codebase (`Infographic Editor UI Design (1)`) |
| ---------------------- | ------------------------------------ | ------------------------------------------------------- |
| **Primary Focus**      | Backend API + Payment Integration    | Frontend UI + Editor Components                         |
| **Backend Framework**  | NestJS + Express (hybrid)            | None (frontend-only)                                    |
| **Frontend Framework** | React + Wouter (routing)             | React (state-based routing)                             |
| **Database**           | Prisma + PostgreSQL                  | LocalStorage (no backend)                               |
| **Payment**            | ✅ RazorPay + Stripe (multi-provider) | ❌ No payment integration                                |
| **Authentication**     | ✅ JWT + NestJS Auth                  | ❌ No authentication                                     |
| **API Integration**    | ✅ Full REST API (`/api/v1/*`)        | ❌ No API calls                                          |
| **State Management**   | React Query + Zustand                | Zustand only                                            |
| **Build Tool**         | Vite (Replit-specific plugins)       | Vite (standard)                                         |

---

## 🔍 Detailed Component Mapping

### 1. Application Structure

#### Replit Codebase Structure
```
InfoGrafter/
├── api/                    # NestJS Backend
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/       # JWT authentication
│   │   │   ├── templates/  # Template CRUD
│   │   │   ├── infographics/ # Infographic generation
│   │   │   └── ai-generation/ # AI model integration
│   │   └── database/       # Prisma client
│   └── prisma/
│       └── schema.prisma   # Database schema
├── client/                 # React Frontend
│   └── src/
│       ├── pages/          # Route-based pages
│       ├── components/
│       │   ├── payments/   # Payment components
│       │   ├── editor/    # Basic editor
│       │   └── ai-chat/   # AI chat interface
│       └── lib/
│           ├── api.ts     # API client
│           └── auth.tsx   # Auth context
├── server/                 # Express server (proxy)
│   ├── routes.ts          # Payment routes
│   └── payments/          # Payment providers
└── shared/
    └── schema.ts          # Shared types
```

#### UI Design Codebase Structure
```
Infographic Editor UI Design (1)/
├── src/
│   ├── components/
│   │   ├── editor/        # Advanced editor components
│   │   ├── canvas/        # Canvas elements
│   │   ├── ai-chat/       # Enhanced AI chat (53 files!)
│   │   ├── account/       # Account screens
│   │   ├── ui/            # UI components (50 files)
│   │   └── payment/       # Empty directory
│   ├── lib/
│   │   ├── canvasState.ts # Canvas state management
│   │   ├── canvasExport.ts # Export functionality
│   │   └── storage.ts      # LocalStorage wrapper
│   └── hooks/
│       └── useCanvasStore.ts # Zustand store
```

---

## ⚠️ Critical Discrepancies

### 1. **Routing System Mismatch**

| Replit                                                              | UI Design                                   |
| ------------------------------------------------------------------- | ------------------------------------------- |
| **Wouter** (URL-based routing)                                      | **State-based** (no URL routing)            |
| Routes: `/dashboard`, `/editor`, `/pricing`                         | Pages: `templates`, `my-designs`, `account` |
| Protected routes with `ProtectedRoute`                              | No route protection                         |
| **Issue:** UI Design uses `activePage` state instead of URL routing |

**Impact:** 🔴 **CRITICAL** - Need to migrate UI Design to Wouter or implement URL routing

---

### 2. **Authentication System**

| Replit                          | UI Design             |
| ------------------------------- | --------------------- |
| ✅ JWT-based auth with NestJS    | ❌ No authentication   |
| ✅ `AuthProvider` context        | ❌ No auth context     |
| ✅ Protected routes              | ❌ No protection       |
| ✅ Token storage in localStorage | ❌ No token management |
| ✅ API calls with auth headers   | ❌ No API integration  |

**Impact:** 🔴 **CRITICAL** - UI Design needs full auth integration

**Files to Merge:**
- `client/src/lib/auth.tsx` → `src/lib/auth.tsx`
- `client/src/pages/auth-page.tsx` → `src/pages/AuthPage.tsx`
- Add auth guards to all protected pages

---

### 3. **API Integration**

| Replit                                                   | UI Design           |
| -------------------------------------------------------- | ------------------- |
| ✅ `lib/api.ts` with `apiRequest` helper                  | ❌ No API client     |
| ✅ React Query for data fetching                          | ❌ No data fetching  |
| ✅ API endpoints: `/api/v1/auth/*`, `/api/v1/templates/*` | ❌ No API calls      |
| ✅ Error handling & retries                               | ❌ No error handling |

**Impact:** 🔴 **CRITICAL** - UI Design needs API integration

**Files to Merge:**
- `client/src/lib/api.ts` → `src/lib/api.ts`
- `client/src/lib/queryClient.ts` → `src/lib/queryClient.ts`
- Update all components to use API instead of LocalStorage

---

### 4. **Payment Integration**

| Replit                          | UI Design                    |
| ------------------------------- | ---------------------------- |
| ✅ Multi-provider payment system | ❌ No payment integration     |
| ✅ RazorPay + Stripe support     | ❌ Empty `payment/` directory |
| ✅ Subscription management       | ❌ No billing screens         |
| ✅ Payment history               | ❌ No payment tracking        |
| ✅ Webhook handling              | ❌ No webhooks                |

**Impact:** 🟡 **HIGH** - Payment is critical for MVP but can be added incrementally

**Files to Merge:**
- `client/src/components/payments/*` → `src/components/payment/*`
- `client/src/pages/pricing-page.tsx` → `src/pages/PricingPage.tsx`
- `server/payments/*` → Backend (already exists)
- `shared/schema.ts` (payment types) → Shared types

---

### 5. **Database vs LocalStorage**

| Replit                     | UI Design                 |
| -------------------------- | ------------------------- |
| ✅ PostgreSQL + Prisma      | ❌ LocalStorage only       |
| ✅ User accounts            | ❌ No user persistence     |
| ✅ Template storage in DB   | ❌ Templates hardcoded     |
| ✅ Design persistence in DB | ❌ Designs in LocalStorage |
| ✅ Usage tracking           | ❌ No usage limits         |

**Impact:** 🔴 **CRITICAL** - Need to migrate from LocalStorage to API calls

**Migration Strategy:**
1. Keep LocalStorage as fallback/cache
2. Add API calls for save/load operations
3. Sync LocalStorage with backend on login
4. Gradually migrate all data operations

---

### 6. **Editor Component Differences**

| Replit                                 | UI Design                            |
| -------------------------------------- | ------------------------------------ |
| Basic editor (`InfographicCanvas.tsx`) | Advanced editor (`EditorLayout.tsx`) |
| Simple canvas                          | Rich canvas with layers, undo/redo   |
| Basic element types                    | Advanced element types with filters  |
| No export functionality                | ✅ Export to PNG (`canvasExport.ts`)  |
| No template loading                    | ✅ Template loading system            |

**Impact:** 🟢 **LOW** - UI Design has superior editor - use it!

**Action:** Keep UI Design editor, integrate with backend API

---

### 7. **State Management**

| Replit                       | UI Design             |
| ---------------------------- | --------------------- |
| React Query + Zustand        | Zustand only          |
| Server state via React Query | Client state only     |
| Optimistic updates           | No optimistic updates |

**Impact:** 🟡 **MEDIUM** - Need to add React Query for server state

**Action:** Add React Query, keep Zustand for client state

---

### 8. **Build Configuration**

| Replit                         | UI Design              |
| ------------------------------ | ---------------------- |
| Replit-specific Vite plugins   | Standard Vite config   |
| Path aliases: `@/`, `@shared/` | Path alias: `@/` only  |
| Build output: `dist/public`    | Build output: `build/` |
| Server proxy setup             | No server setup        |

**Impact:** 🟡 **MEDIUM** - Need to align build configs

---

## 🔄 Merge Strategy

### Phase 1: Foundation (Days 1-2)

#### Day 1: Setup & Authentication
1. **Copy Replit backend to UI Design project**
   ```bash
   # Create backend directory structure
   mkdir -p api/src/modules/{auth,templates,infographics,ai-generation}
   mkdir -p server/payments
   ```

2. **Merge authentication system**
   - Copy `client/src/lib/auth.tsx` → `src/lib/auth.tsx`
   - Copy `client/src/pages/auth-page.tsx` → `src/pages/AuthPage.tsx`
   - Add `AuthProvider` to `App.tsx`
   - Implement protected routes

3. **Add routing system**
   - Install Wouter: `npm install wouter`
   - Migrate from state-based to URL-based routing
   - Update `App.tsx` to use Wouter
   - Add route protection

**Files to Create/Modify:**
- `src/lib/auth.tsx` (new)
- `src/pages/AuthPage.tsx` (new)
- `src/App.tsx` (modify)
- `package.json` (add wouter)

---

#### Day 2: API Integration
1. **Add API client**
   - Copy `client/src/lib/api.ts` → `src/lib/api.ts`
   - Copy `client/src/lib/queryClient.ts` → `src/lib/queryClient.ts`
   - Add React Query: `npm install @tanstack/react-query`

2. **Create API service layer**
   - `src/lib/services/templates.ts` - Template API calls
   - `src/lib/services/infographics.ts` - Infographic API calls
   - `src/lib/services/auth.ts` - Auth API calls

3. **Update components to use API**
   - Replace LocalStorage calls with API calls
   - Add loading states
   - Add error handling

**Files to Create/Modify:**
- `src/lib/api.ts` (new)
- `src/lib/queryClient.ts` (new)
- `src/lib/services/*.ts` (new)
- `src/components/pages/TemplatesPage.tsx` (modify)
- `src/components/pages/MyDesignsPage.tsx` (modify)

---

### Phase 2: Core Features (Days 3-4)

#### Day 3: Template & Design Management
1. **Migrate template system**
   - Connect templates to backend API
   - Update template loading to use API
   - Add template caching

2. **Migrate design save/load**
   - Replace LocalStorage with API calls
   - Add sync mechanism
   - Handle offline mode

3. **Update canvas state management**
   - Integrate `useCanvasStore` with API
   - Add auto-save functionality
   - Add conflict resolution

**Files to Modify:**
- `src/components/pages/TemplatesPage.tsx`
- `src/components/editor/CenterCanvas.tsx`
- `src/hooks/useCanvasStore.ts`
- `src/lib/canvasState.ts`

---

#### Day 4: Payment Integration
1. **Add payment components**
   - Copy `client/src/components/payments/*` → `src/components/payment/*`
   - Copy `client/src/pages/pricing-page.tsx` → `src/pages/PricingPage.tsx`
   - Update imports and paths

2. **Integrate payment flow**
   - Add pricing page route
   - Connect subscription status to account page
   - Add payment history display

3. **Update account page**
   - Add billing screen integration
   - Show subscription status
   - Add upgrade/downgrade buttons

**Files to Create/Modify:**
- `src/components/payment/*` (copy from Replit)
- `src/pages/PricingPage.tsx` (new)
- `src/components/pages/AccountPage.tsx` (modify)
- `src/components/account/BillingScreen.tsx` (modify)

---

### Phase 3: Polish & Testing (Days 5-7)

#### Day 5: Error Handling & Loading States
1. **Add comprehensive error handling**
   - API error boundaries
   - Network error handling
   - User-friendly error messages

2. **Add loading states**
   - Skeleton loaders
   - Progress indicators
   - Optimistic updates

3. **Remove debug code**
   - Remove all `fetch('http://127.0.0.1:7243/...')` calls
   - Clean up console.logs
   - Remove test data

**Files to Modify:**
- `src/components/editor/CenterCanvas.tsx` (remove debug code)
- `src/App.tsx` (remove debug code)
- All components (add error handling)

---

#### Day 6: Testing & Bug Fixes
1. **End-to-end testing**
   - Test auth flow
   - Test template loading
   - Test design save/load
   - Test payment flow

2. **Cross-browser testing**
   - Chrome
   - Firefox
   - Safari

3. **Performance optimization**
   - Code splitting
   - Lazy loading
   - Image optimization

---

#### Day 7: Deployment Preparation
1. **Build configuration**
   - Update `vite.config.ts` for production
   - Configure environment variables
   - Set up build scripts

2. **Documentation**
   - Update README
   - Add deployment guide
   - Document API endpoints

3. **Final testing**
   - Production build test
   - Smoke tests
   - Performance check

---

## 📁 File Mapping Reference

### Authentication Files

| Replit Source                        | UI Design Destination         | Status           |
| ------------------------------------ | ----------------------------- | ---------------- |
| `client/src/lib/auth.tsx`            | `src/lib/auth.tsx`            | ⚠️ Need to create |
| `client/src/pages/auth-page.tsx`     | `src/pages/AuthPage.tsx`      | ⚠️ Need to create |
| `client/src/components/AuthForm.tsx` | `src/components/AuthForm.tsx` | ⚠️ Need to create |

### API Files

| Replit Source                   | UI Design Destination    | Status                         |
| ------------------------------- | ------------------------ | ------------------------------ |
| `client/src/lib/api.ts`         | `src/lib/api.ts`         | ⚠️ Need to create               |
| `client/src/lib/queryClient.ts` | `src/lib/queryClient.ts` | ⚠️ Need to create               |
| `client/src/lib/utils.ts`       | `src/lib/utils.ts`       | ✅ Exists (check compatibility) |

### Payment Files

| Replit Source                       | UI Design Destination       | Status           |
| ----------------------------------- | --------------------------- | ---------------- |
| `client/src/components/payments/*`  | `src/components/payment/*`  | ⚠️ Need to copy   |
| `client/src/pages/pricing-page.tsx` | `src/pages/PricingPage.tsx` | ⚠️ Need to create |
| `server/payments/*`                 | Backend (keep in Replit)    | ✅ Already exists |

### Editor Files

| UI Design Source              | Action | Notes                   |
| ----------------------------- | ------ | ----------------------- |
| `src/components/editor/*`     | ✅ Keep | Superior implementation |
| `src/lib/canvasState.ts`      | ✅ Keep | Advanced features       |
| `src/lib/canvasExport.ts`     | ✅ Keep | Export functionality    |
| `src/hooks/useCanvasStore.ts` | ✅ Keep | State management        |

---

## 🔧 Technical Implementation Details

### 1. Routing Migration

**Current (UI Design):**
```typescript
const [activePage, setActivePage] = useState<PageType>("templates");
```

**Target (Replit style):**
```typescript
import { Switch, Route, Redirect } from "wouter";

<Switch>
  <Route path="/templates" component={TemplatesPage} />
  <Route path="/my-designs" component={MyDesignsPage} />
  <Route path="/account" component={AccountPage} />
</Switch>
```

**Migration Steps:**
1. Install Wouter: `npm install wouter`
2. Replace state-based navigation with URL-based
3. Update `AppHeader` to use `useLocation` and `useRoute`
4. Add protected route wrapper

---

### 2. Authentication Integration

**Add AuthProvider:**
```typescript
// src/App.tsx
import { AuthProvider } from './lib/auth';

function App() {
  return (
    <AuthProvider>
      {/* Rest of app */}
    </AuthProvider>
  );
}
```

**Add Protected Routes:**
```typescript
function ProtectedRoute({ component: Component }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Component /> : <Redirect to="/auth" />;
}
```

---

### 3. API Integration Pattern

**Before (LocalStorage):**
```typescript
const designs = JSON.parse(localStorage.getItem('designs') || '[]');
```

**After (API):**
```typescript
const { data: designs, isLoading } = useQuery({
  queryKey: ['designs'],
  queryFn: () => infographicsApi.getAll(),
});
```

---

### 4. Payment Integration

**Add Payment Components:**
```typescript
// src/pages/PricingPage.tsx
import PricingPage from '@/pages/pricing-page'; // From Replit

// In router
<Route path="/pricing" component={PricingPage} />
```

**Update Account Page:**
```typescript
// src/components/pages/AccountPage.tsx
import { SubscriptionCard } from '@/components/payment';

<SubscriptionCard organization={organization} />
```

---

## 📊 Dependency Comparison

### Replit Dependencies (Backend)
```json
{
  "@nestjs/common": "^11.1.6",
  "@nestjs/jwt": "^11.0.1",
  "@prisma/client": "^6.17.1",
  "razorpay": "^2.9.6",
  "stripe": "^20.1.0",
  "bcrypt": "^6.0.0"
}
```

### Replit Dependencies (Frontend)
```json
{
  "wouter": "^3.3.5",
  "@tanstack/react-query": "^5.60.5",
  "axios": "^1.12.2"
}
```

### UI Design Dependencies
```json
{
  "zustand": "*",
  "html2canvas": "*",
  "react-rnd": "*",
  "motion": "*"
}
```

**Action:** Merge all dependencies, resolve conflicts

---

## 🚨 Critical Issues to Resolve

### 1. **Debug Code Removal**
**Location:** Multiple files in UI Design codebase  
**Issue:** Debug `fetch` calls to `http://127.0.0.1:7243/...`  
**Action:** Remove all debug code before merge

**Files:**
- `src/App.tsx` (line 27)
- `src/components/editor/CenterCanvas.tsx` (multiple lines)
- `src/components/editor/EditorLayout.tsx` (line 34)

---

### 2. **Path Alias Consistency**
**Issue:** Different path alias configurations  
**Replit:** `@/` → `client/src`, `@shared/` → `shared`  
**UI Design:** `@/` → `src`  

**Action:** Standardize on UI Design structure, update imports

---

### 3. **Build Output Directory**
**Issue:** Different build outputs  
**Replit:** `dist/public`  
**UI Design:** `build`  

**Action:** Standardize on `dist` for consistency

---

### 4. **Database Schema Mismatch**
**Issue:** Prisma schema vs Drizzle schema  
**Replit:** Uses Prisma  
**UI Design:** No database  

**Action:** Use Prisma schema from Replit, migrate data structure

---

## ✅ MVP Feature Checklist

### Core Features (Must Have)
- [ ] User authentication (login/register)
- [ ] Template browsing and loading
- [ ] Canvas editor with text/shape/image elements
- [ ] Design save/load (via API)
- [ ] Design export to PNG
- [ ] Payment integration (RazorPay)
- [ ] Subscription management
- [ ] Account page with billing

### Nice to Have (Post-MVP)
- [ ] AI chat integration
- [ ] Advanced filters
- [ ] Undo/redo
- [ ] Multi-select
- [ ] Layer management
- [ ] Stripe integration (if available)

---

## 📝 Environment Variables

### Required for MVP

```env
# Backend
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
OPENAI_API_KEY=sk-...
IDEOGRAM_API_KEY=...

# Payment
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=whsec_...
VITE_RAZORPAY_KEY_ID=rzp_test_...

# Optional (Stripe)
STRIPE_ENABLED=false
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Frontend
VITE_API_BASE_URL=http://localhost:3001/api/v1
```

---

## 🎯 Success Criteria

### Day 1-2: Foundation
- ✅ Authentication working
- ✅ Routing implemented
- ✅ API client integrated
- ✅ Basic API calls working

### Day 3-4: Core Features
- ✅ Templates load from API
- ✅ Designs save/load via API
- ✅ Payment flow integrated
- ✅ Account page functional

### Day 5-7: Polish
- ✅ Error handling complete
- ✅ Loading states added
- ✅ Debug code removed
- ✅ Production build working
- ✅ Cross-browser tested

---

## 🔗 Key Files Reference

### Backend API Endpoints (Replit)
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `GET /api/v1/templates` - List templates
- `GET /api/v1/templates/:id` - Get template
- `POST /api/v1/infographics/generate` - Generate infographic
- `GET /api/v1/infographics` - List user infographics
- `GET /api/v1/infographics/:id` - Get infographic

### Payment Endpoints (Replit)
- `GET /api/payments/provider-info` - Get payment provider
- `GET /api/payments/plans` - List subscription plans
- `POST /api/payments/create-subscription` - Create subscription
- `GET /api/payments/subscription` - Get current subscription
- `POST /api/payments/cancel` - Cancel subscription
- `GET /api/payments/history` - Payment history
- `POST /api/webhooks/:provider` - Webhook handler

---

## 📚 Additional Resources

### Documentation Files
- `PAYMENT_INTEGRATION_README.md` (Replit) - Payment setup guide
- `1_WEEK_LAUNCH_PLAN.md` (UI Design) - Launch checklist
- `APPROACH_COMPARISON.md` (UI Design) - Architecture decisions

### Migration Guides
- See `QUICK_MERGE_STEPS.md` for step-by-step merge guide
- See `PAYMENT_MERGE_GUIDE.md` for payment integration details

---

## 🚀 Quick Start Commands

### Setup Backend
```bash
cd api
npm install
npx prisma generate
npx prisma db push
npm run start:dev
```

### Setup Frontend
```bash
npm install
npm run dev
```

### Run Both
```bash
# From Replit root
./start-both.sh
```

---

## 📞 Support & Troubleshooting

### Common Issues

1. **"Module not found" errors**
   - Check path aliases in `vite.config.ts`
   - Verify imports use `@/` prefix

2. **Authentication not working**
   - Verify JWT_SECRET is set
   - Check token storage in localStorage
   - Verify API base URL

3. **Payment modal not opening**
   - Check `VITE_RAZORPAY_KEY_ID` is set
   - Verify RazorPay script is loaded in `index.html`

4. **API calls failing**
   - Check CORS configuration
   - Verify API base URL
   - Check network tab for errors

---

## ✅ Final Checklist Before MVP Launch

### Code Quality
- [ ] All debug code removed
- [ ] Error handling implemented
- [ ] Loading states added
- [ ] TypeScript errors resolved
- [ ] Linter warnings fixed

### Functionality
- [ ] Authentication flow works
- [ ] Templates load correctly
- [ ] Designs save/load via API
- [ ] Payment flow complete
- [ ] Export functionality works

### Testing
- [ ] Tested in Chrome
- [ ] Tested in Firefox
- [ ] Tested in Safari
- [ ] Mobile responsive
- [ ] Performance acceptable

### Deployment
- [ ] Environment variables set
- [ ] Database migrated
- [ ] Webhooks configured
- [ ] Production build tested
- [ ] Monitoring set up

---

**Last Updated:** January 6, 2025  
**Status:** Ready for Implementation  
**Estimated Time:** 7 days for MVP

