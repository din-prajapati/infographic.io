# Infographic Editor - Unified Project

This is the unified project combining the UI Design frontend with the Replit backend and payment integration.

## Project Structure

```
InfographicEditor-Unified/
├── api/                    # NestJS Backend
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/       # Authentication
│   │   │   ├── infographics/ # AI-generated infographics
│   │   │   ├── templates/  # Template management
│   │   │   ├── designs/    # Canvas designs API (NEW)
│   │   │   └── ai-generation/ # AI services
│   │   └── main.ts
│   └── prisma/
│       └── schema.prisma
├── client/                 # React Frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── pages/          # Page components
│   │   ├── lib/            # Utilities & API clients
│   │   └── hooks/           # React hooks
│   └── index.html
├── server/                 # Express Proxy Server
│   ├── index.ts            # Main server
│   ├── routes.ts           # Payment routes
│   └── payments/           # Payment providers
├── shared/                 # Shared Types & Schemas
│   └── schema.ts
├── package.json
└── vite.config.ts
```

## Features Implemented

### ✅ Completed

1. **Project Setup**
   - Unified project structure created
   - Backend (api/, server/, shared/) copied from Replit
   - Frontend (client/) copied from UI Design

2. **Authentication System**
   - AuthProvider with JWT token management
   - AuthPage with login/register forms
   - Protected routes using Wouter
   - User context integration

3. **API Integration**
   - API client with authentication headers
   - React Query for data fetching
   - Templates API integration
   - Infographics API integration
   - Designs API (NEW - for canvas designs)

4. **Routing**
   - Migrated from state-based to URL-based routing (Wouter)
   - Routes: `/`, `/auth`, `/templates`, `/my-designs`, `/account`, `/editor`, `/pricing`
   - Protected route wrapper

5. **Payment Integration**
   - Payment components (SubscriptionCard, PaymentHistory)
   - Pricing page with multi-provider support (RazorPay/Stripe)
   - Billing screen integration in Account page
   - Payment API routes

6. **Canvas Store Integration**
   - Updated storage.ts to use API calls when authenticated
   - Falls back to LocalStorage for offline/unauthenticated users
   - Async save/load functions
   - Design and template management

7. **Backend API Endpoints**
   - `/api/v1/designs` - CRUD operations for canvas designs
   - `/api/v1/canvas-templates` - CRUD operations for canvas templates
   - Uses Infographic model with `aiModel: 'canvas-editor'` to distinguish

8. **Configuration**
   - Updated vite.config.ts with correct path aliases
   - Merged package.json dependencies
   - Removed debug code

## Setup Instructions

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- npm or yarn

### Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/infographic_db

# JWT
JWT_SECRET=your-secret-key-change-in-production

# AI Services
OPENAI_API_KEY=your-openai-key
IDEOGRAM_API_KEY=your-ideogram-key

# Payment Providers
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-secret
RAZORPAY_WEBHOOK_SECRET=your-webhook-secret
VITE_RAZORPAY_KEY_ID=your-razorpay-key-id

# Stripe (Optional)
STRIPE_SECRET_KEY=your-stripe-secret
STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret

# Server
PORT=5000
API_PORT=3001
```

### Installation

```bash
# Install dependencies
npm install

# Setup database
cd api
npx prisma generate
npx prisma db push

# Return to root
cd ..
```

### Development

```bash
# Start development server (runs both frontend and backend)
npm run dev
```

The server will:
- Start NestJS API on port 3001
- Start Express proxy on port 5000
- Start Vite dev server for frontend

### Production Build

```bash
# Build frontend and backend
npm run build

# Start production server
npm start
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user

### Templates
- `GET /api/v1/templates` - Get all templates
- `GET /api/v1/templates/:id` - Get template by ID

### Infographics (AI-generated)
- `POST /api/v1/infographics/generate` - Generate infographic
- `GET /api/v1/infographics` - Get user infographics
- `GET /api/v1/infographics/:id` - Get infographic by ID

### Designs (Canvas Editor)
- `POST /api/v1/designs` - Create new design
- `PUT /api/v1/designs/:id` - Update design
- `GET /api/v1/designs` - Get all user designs
- `GET /api/v1/designs/:id` - Get design by ID
- `DELETE /api/v1/designs/:id` - Delete design

### Canvas Templates
- `POST /api/v1/canvas-templates` - Create template
- `PUT /api/v1/canvas-templates/:id` - Update template
- `GET /api/v1/canvas-templates` - Get all user templates
- `GET /api/v1/canvas-templates/:id` - Get template by ID
- `DELETE /api/v1/canvas-templates/:id` - Delete template

### Payments
- `GET /api/payments/provider-info` - Get payment provider info
- `GET /api/payments/plans` - Get subscription plans
- `POST /api/payments/create-subscription` - Create subscription
- `GET /api/payments/subscription` - Get current subscription
- `POST /api/payments/cancel` - Cancel subscription
- `GET /api/payments/history` - Get payment history
- `POST /api/webhooks/:provider` - Webhook handler

## Storage Strategy

The storage system uses a hybrid approach:

1. **When Authenticated**: 
   - Saves to backend API (`/api/v1/designs` or `/api/v1/canvas-templates`)
   - Also caches in LocalStorage for offline access

2. **When Not Authenticated**:
   - Uses LocalStorage only
   - Data persists locally until user logs in

3. **Auto-save Drafts**:
   - Always uses LocalStorage (not synced to backend)

## Testing Checklist

- [ ] User registration and login
- [ ] Template loading from API
- [ ] Creating new design in editor
- [ ] Saving design (should sync to API if authenticated)
- [ ] Loading saved design
- [ ] Deleting design
- [ ] Template creation and loading
- [ ] Payment flow (subscription creation)
- [ ] Payment history display
- [ ] Account page with billing integration

## Notes

- Canvas designs are stored in the `Infographic` model with `aiModel: 'canvas-editor'` to distinguish from AI-generated infographics
- The `propertyData` JSON field stores the canvas design data
- LocalStorage is used as a fallback and cache layer
- Payment integration supports both RazorPay (India) and Stripe (International)

## Documentation

### Core Documentation
- **[Production Roadmap](PRODUCTION_ROADMAP.md)** - Complete roadmap with phases, milestones, and technical details
- **[Design Guidelines](docs/design-guidelines.md)** - Design system, color palette, typography, and component specifications
- **[Payment Integration](docs/payments/PAYMENT_INTEGRATION.md)** - Complete guide for RazorPay and Stripe integration

### Development Guides
- **[Quick Start Prompts](docs/QUICK_START_PROMPTS.md)** - AI-assisted development prompts for rapid feature building
- **[AI-Assisted Rebuild Guide](docs/AI_ASSISTED_REBUILD_GUIDE.md)** - Guide for rebuilding MVP with payment integration
- **[Copy-Paste Setup](docs/COPY_PASTE_SETUP.md)** - Step-by-step setup guide for payment integration

### Implementation References
- **[1 Week Launch Plan](docs/implementation/1_WEEK_LAUNCH_PLAN.md)** - Detailed daily checklist for MVP launch
- **[MVP Implementation Guide](docs/implementation/MVP_IMPLEMENTATION_GUIDE.md)** - Implementation guide for MVP features
- **[Phase Completion Docs](docs/implementation/)** - Phase 1 and Phase 2 completion documentation

### Archived Documentation
Historical documentation from the merge process is archived in:
- `archive/ui-design-archive/` - UI Design project merge documentation
- `archive/replit-archive/` - Replit project historical documentation

## Troubleshooting

### API calls failing
- Check that NestJS API is running on port 3001
- Verify authentication token is present in localStorage
- Check browser console for CORS errors

### Designs not saving
- Verify user is authenticated
- Check backend logs for errors
- Verify database connection

### Payment not working
- Ensure payment provider keys are set in .env
- Check webhook endpoints are configured
- Verify payment provider dashboard settings
- See [Payment Integration Guide](docs/payments/PAYMENT_INTEGRATION.md) for detailed troubleshooting

