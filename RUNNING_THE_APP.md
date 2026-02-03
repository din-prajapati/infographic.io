# How to Run the Infographic Editor App

> 🔄 **Using Cursor + Replit?** See [HYBRID_SETUP.md](HYBRID_SETUP.md) for the complete hybrid development guide.

## Quick Start Guide

### Prerequisites

1. **Node.js** (v18 or higher)
   - Check version: `node --version`
   - Download from: https://nodejs.org/

2. **PostgreSQL Database** (optional for basic testing)
   - The app can run without a database, but some features require it
   - Install PostgreSQL: https://www.postgresql.org/download/

3. **npm** (comes with Node.js)
   - Check version: `npm --version`

### Step 1: Install Dependencies

```bash
npm install
```

This will install all required packages for both frontend and backend.

### Step 2: Set Up Environment Variables (Optional)

Create a `.env` file in the root directory:

```env
# Database (optional - app can run without it)
DATABASE_URL=postgresql://user:password@localhost:5432/infographic_db

# JWT Secret (required for authentication)
JWT_SECRET=your-secret-key-change-in-production

# AI Services (optional - for AI features)
OPENAI_API_KEY=your-openai-key
IDEOGRAM_API_KEY=your-ideogram-key

# Payment Providers (optional - for payment features)
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-secret
STRIPE_SECRET_KEY=your-stripe-secret
STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key

# Server Ports (defaults shown)
PORT=5000
API_PORT=3001
```

**Note:** The app will work without most of these variables, but some features may be limited.

### Step 3: Set Up Database (Optional)

If you want to use the database features:

```bash
# Navigate to API directory
cd api

# Generate Prisma client
npx prisma generate

# Push schema to database (if DATABASE_URL is set)
npx prisma db push

# Return to root
cd ..
```

### Step 4: Run the Application

#### Option A: Development Mode (Recommended)

```bash
npm run dev
```

This will:
- Start the NestJS API server on port **3001**
- Start the Express proxy server on port **5000**
- Start the Vite dev server for the React frontend
- Automatically open your browser to `http://localhost:5000`

**What happens:**
- The Express server (`server/index.ts`) automatically starts the NestJS API as a child process
- The frontend is served through Vite with hot module replacement (HMR)
- All API requests are proxied to the NestJS backend

#### Option B: Using the Shell Script (Linux/Mac/Git Bash)

```bash
# Make script executable (first time only)
chmod +x start-both.sh

# Run the script
./start-both.sh
```

#### Option C: Production Mode

```bash
# Build the application
npm run build

# Start production server
npm start
```

This will:
- Build the frontend and backend
- Start the production server on port 5000

### Step 5: Access the Application

Once running, open your browser and navigate to:

- **Frontend:** http://localhost:5000
- **API:** http://localhost:3001 (direct API access)

## Project Structure

```
InfographicEditor-Unified/
├── api/              # NestJS Backend API
│   └── src/
│       └── main.ts   # API entry point
├── client/           # React Frontend
│   └── src/
├── server/           # Express Proxy Server
│   └── index.ts     # Main server (starts NestJS + serves frontend)
└── shared/          # Shared types and schemas
```

## How It Works

1. **Express Server** (`server/index.ts`):
   - Starts NestJS API as a child process
   - Proxies API requests to NestJS
   - Serves the React frontend (in dev mode via Vite, in prod via static files)

2. **NestJS API** (`api/src/main.ts`):
   - Handles all backend logic
   - Authentication, database operations, AI services
   - Runs on port 3001

3. **React Frontend** (`client/src/`):
   - Built with Vite + React
   - Uses Wouter for routing
   - Communicates with API through Express proxy

## Troubleshooting

### Port Already in Use

If port 5000 or 3001 is already in use:

```bash
# Windows: Find and kill process on port 5000
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac: Find and kill process
lsof -ti:5000 | xargs kill -9
```

Or change the port in `.env`:
```env
PORT=5001
API_PORT=3002
```

### Database Connection Issues

If you see database errors:
- The app can run without a database for basic features
- Check your `DATABASE_URL` in `.env`
- Ensure PostgreSQL is running
- Run `npx prisma generate` in the `api/` directory

### Module Not Found Errors

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

### Build Errors

```bash
# Check TypeScript errors
npm run check

# Rebuild
npm run build
```

## Available Scripts

- `npm run dev` - Start development server (frontend + backend)
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run check` - Type check TypeScript files
- `npm run db:push` - Push database schema changes

## Development Tips

1. **Hot Reload**: Changes to frontend code will automatically reload in the browser
2. **API Changes**: Restart the dev server if you modify NestJS API code
3. **Database Changes**: Run `npx prisma db push` in `api/` directory after schema changes
4. **Environment Variables**: Changes to `.env` require restarting the server

## Next Steps

- Check the [README.md](README.md) for detailed feature documentation
- See [PRODUCTION_ROADMAP.md](PRODUCTION_ROADMAP.md) for roadmap
- Review [docs/](docs/) for additional guides

