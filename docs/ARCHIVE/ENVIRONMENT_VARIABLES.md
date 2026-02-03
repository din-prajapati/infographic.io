# Environment Variables Configuration Guide

This document explains how to configure environment variables for separate frontend and backend deployments.

## Architecture Overview

### Frontend (Client)
- **Location**: `client/` directory
- **Build-time variables**: Variables prefixed with `VITE_` are bundled into the JavaScript at build time
- **Public exposure**: All `VITE_*` variables are exposed to the browser (never include secrets!)
- **Files**: `client/.env.development`, `client/.env.production`

### Backend (API)
- **Location**: `api/` directory (NestJS)
- **Runtime variables**: Loaded when the server starts
- **Private**: All variables are server-side only (can include secrets)
- **Files**: Root `.env` or system environment variables

## Frontend Environment Variables

### Development (`client/.env.development`)
```env
VITE_API_URL=http://localhost:3001
VITE_API_BASE=/api/v1
VITE_CLIENT_URL=http://localhost:5173
VITE_RAZORPAY_KEY_ID=rzp_test_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### Production (`client/.env.production`)
```env
VITE_API_URL=https://api.yourdomain.com
VITE_API_BASE=/api/v1
VITE_CLIENT_URL=https://app.yourdomain.com
VITE_RAZORPAY_KEY_ID=rzp_live_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

### Available Frontend Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Full API server URL (for cross-origin) | `https://api.yourdomain.com` |
| `VITE_API_BASE` | API base path (for same-origin) | `/api/v1` |
| `VITE_CLIENT_URL` | Frontend application URL | `https://app.yourdomain.com` |
| `VITE_RAZORPAY_KEY_ID` | RazorPay publishable key | `rzp_test_...` |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | `pk_test_...` |

## Backend Environment Variables

### Root `.env` File
```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Server Configuration
API_PORT=3001
NODE_ENV=development
BASE_URL=http://localhost:5000
CLIENT_URL=http://localhost:5173

# Authentication
JWT_SECRET=your-secret-key-change-in-production

# AI Service API Keys (SECRET!)
OPENAI_API_KEY=sk-proj-...
IDEOGRAM_API_KEY=...

# Payment Provider Secrets (SECRET!)
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Deployment Scenarios

### Scenario 1: Separate Domains (Recommended)

**Frontend**: `https://app.yourdomain.com`  
**API**: `https://api.yourdomain.com`

**Frontend `.env.production`**:
```env
VITE_API_URL=https://api.yourdomain.com
VITE_API_BASE=/api/v1
```

**Backend `.env.production`**:
```env
BASE_URL=https://api.yourdomain.com
CLIENT_URL=https://app.yourdomain.com
```

### Scenario 2: Same Domain, Different Paths

**Frontend**: `https://yourdomain.com`  
**API**: `https://yourdomain.com/api`

**Frontend `.env.production`**:
```env
VITE_API_URL=  # Empty - use relative paths
VITE_API_BASE=/api/v1
```

**Backend**: No CORS needed (same origin)

### Scenario 3: Cloud Platform Deployment

#### Vercel (Frontend)
Set environment variables in Vercel dashboard:
```bash
VITE_API_URL=https://api.yourdomain.com
VITE_RAZORPAY_KEY_ID=rzp_live_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

#### Heroku/Railway/Render (Backend)
Set environment variables via CLI or dashboard:
```bash
DATABASE_URL=postgresql://...
JWT_SECRET=...
RAZORPAY_KEY_SECRET=...
```

## How It Works

### Frontend API Calls

The `client/src/lib/api.ts` file uses a helper function `getApiUrl()` that:
- Uses full URL (`VITE_API_URL + VITE_API_BASE + path`) when `VITE_API_URL` is set (cross-origin)
- Uses relative path (`VITE_API_BASE + path`) when `VITE_API_URL` is empty (same-origin)

### Development Proxy

During development, Vite proxies `/api/*` requests to the backend server configured in `VITE_API_URL`.

### CORS Configuration

The backend (`api/src/main.ts`) uses `CLIENT_URL` environment variable to configure CORS:
- Allows requests from the frontend domain
- Enables credentials for authenticated requests

## Security Best Practices

### ✅ Safe to Expose (Frontend)
- API URLs
- Publishable payment provider keys (`VITE_RAZORPAY_KEY_ID`, `VITE_STRIPE_PUBLISHABLE_KEY`)
- Feature flags
- Public configuration

### ❌ Never Expose (Frontend)
- Secret API keys (`RAZORPAY_KEY_SECRET`, `STRIPE_SECRET_KEY`)
- Database URLs
- JWT secrets
- Any credentials or tokens

## Setup Instructions

1. **Copy example files**:
   ```bash
   cp .env.example .env
   cp client/.env.example client/.env.development
   ```

2. **Fill in your values**:
   - Update `.env` with your database and API keys
   - Update `client/.env.development` with your frontend configuration

3. **For production**:
   - Create `client/.env.production` with production URLs
   - Set environment variables on your hosting platform

## Troubleshooting

### Frontend can't connect to API
- Check `VITE_API_URL` is set correctly
- Verify CORS is configured on backend (`CLIENT_URL`)
- Check browser console for CORS errors

### Environment variables not loading
- Ensure variable names start with `VITE_` for frontend
- Restart dev server after changing `.env` files
- Check file is in correct location (`client/.env.development`)

### Prisma conflicts
- Remove `api/.env` if it conflicts with root `.env`
- Use only root `.env` for backend variables
