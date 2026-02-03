# Hybrid Cursor + Replit Setup Guide

This project is configured to work seamlessly in both **Cursor (local development)** and **Replit (cloud deployment)**. 

## 🎯 Architecture Overview

```
┌──────────────────┐         ┌──────────────────┐
│   Cursor IDE     │         │     Replit       │
│   (Windows Dev)  │  ⟷     │  (Linux Deploy)  │
│                  │         │                  │
│  - Edit code     │         │  - Test/Deploy   │
│  - Local testing │         │  - PostgreSQL    │
│  - Git commits   │         │  - Production    │
└──────────────────┘         └──────────────────┘
```

## 📁 Key Configuration Files

| File | Purpose | Platform |
|------|---------|----------|
| `.replit` | Replit runner config | Replit only |
| `replit.nix` | Replit dependencies | Replit only |
| `package.json` | Cross-platform scripts | Both |
| `server/index.ts` | Unified server (Windows/Linux) | Both |
| `api/src/main.ts` | NestJS API server | Both |

## 🚀 Running in Cursor (Windows)

### Quick Start
```bash
npm run dev
```

This will:
- ✅ Start Express server on port 5000 (frontend + proxy)
- ✅ Auto-start NestJS API on port 3001
- ✅ Launch Vite dev server with HMR
- ✅ Open browser to http://localhost:5000

### Manual Steps (if needed)
```bash
# 1. Install dependencies
npm install

# 2. Generate Prisma client
npm run prisma:generate

# 3. Start development server
npm run dev
```

### Environment Variables (Optional)
Create `.env` file:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/infographic_db
OPENAI_API_KEY=sk-proj-...
IDEOGRAM_API_KEY=...
JWT_SECRET=your-secret-key
PORT=5000
API_PORT=3001
```

## 🌐 Running in Replit

### Automatic Startup
Replit will automatically:
1. Install dependencies via `npm install`
2. Generate Prisma client
3. Start both servers via `npm run dev`
4. Expose port 5000 publicly

### Environment Variables (Replit Secrets)
Add these in Replit Secrets (🔒 icon in left sidebar):
```
DATABASE_URL        → From Replit PostgreSQL
OPENAI_API_KEY      → Your OpenAI API key
IDEOGRAM_API_KEY    → Your Ideogram API key
JWT_SECRET          → Random secure string
```

### Database Setup
```bash
# Replit automatically provides PostgreSQL
# Generate Prisma client:
npm run prisma:generate

# Push schema to database:
npx prisma db push --schema=api/prisma/schema.prisma
```

## 🔧 Cross-Platform Compatibility

### Server Spawn Logic
The server automatically detects the platform:

```typescript
// server/index.ts
const isWindows = process.platform === 'win32';
const command = isWindows ? 'npx.cmd' : 'npx';

const nestProcess = spawn(command, ['tsx', 'src/main.ts'], {
  cwd: path.join(__dirname, '..', 'api'),
  shell: true  // Required for Windows
});
```

### Database Connection
Graceful fallback when database is unavailable:

```typescript
// api/src/common/services/prisma.service.ts
async onModuleInit() {
  try {
    await this.$connect();
    this.isConnected = true;
    this.logger.log('✅ Database connected successfully');
  } catch (error) {
    this.isConnected = false;
    this.logger.warn('⚠️ Database connection failed - running in limited mode');
    // App continues without database
  }
}
```

## 📦 NPM Scripts (Cross-Platform)

| Script | Purpose | Works In |
|--------|---------|----------|
| `npm run dev` | Start dev servers | Both |
| `npm run build` | Build for production | Both |
| `npm start` | Start production | Both |
| `npm run check` | TypeScript check | Both |
| `npm run prisma:generate` | Generate Prisma client | Both |
| `npm run db:push` | Push DB schema | Both |

## 🎨 Development Workflow

### 1. Local Development (Cursor)
```bash
# Edit code in Cursor
git add .
git commit -m "feat: add new feature"
git push origin main
```

### 2. Test in Replit
- Push changes to GitHub
- Replit auto-syncs via Git
- Click "Run" to test
- Check live preview

### 3. Deploy
- Replit automatically deploys on run
- Public URL: `https://your-repl.repl.co`

## 🔍 Troubleshooting

### Issue: "tsx not found" in Cursor
**Solution**: Use `npx tsx` instead of `tsx`
```bash
# Server automatically handles this via:
const command = isWindows ? 'npx.cmd' : 'npx';
```

### Issue: Port 5000 already in use (Windows)
**Solution**: Kill the process
```powershell
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### Issue: Database connection failed
**Solution**: App runs without database
- Auth and infographic generation will be limited
- Some features require database setup
- Check `DATABASE_URL` in environment

### Issue: Prisma client not generated
**Solution**: Run generation command
```bash
npm run prisma:generate
```

## 🔐 Security Best Practices

### Local Development (Cursor)
- ✅ Use `.env` file (gitignored)
- ✅ Never commit API keys
- ✅ Use dummy values for testing

### Production (Replit)
- ✅ Use Replit Secrets for sensitive data
- ✅ Rotate JWT_SECRET regularly
- ✅ Enable rate limiting (already configured)
- ✅ Use environment-specific DATABASE_URL

## 📊 Platform Comparison

| Feature | Cursor (Local) | Replit (Cloud) |
|---------|----------------|----------------|
| **OS** | Windows 10/11 | Linux (NixOS) |
| **Node.js** | v20+ | v20 (managed) |
| **Database** | Optional | PostgreSQL 15 |
| **Hot Reload** | Yes (Vite HMR) | Yes |
| **Debugging** | Full VSCode tools | Console logs |
| **Speed** | Faster (local) | Network latency |
| **Access** | Localhost only | Public URL |
| **Cost** | Free | Free tier available |

## 🎯 Recommended Workflow

1. **Develop in Cursor**
   - Fast iteration with local tools
   - Full debugging capabilities
   - Offline development

2. **Test in Replit**
   - Verify Linux compatibility
   - Test with real PostgreSQL
   - Share preview with team

3. **Deploy from Replit**
   - One-click deployment
   - Automatic HTTPS
   - Built-in monitoring

## 📚 Additional Resources

- [Cursor Documentation](https://cursor.sh/docs)
- [Replit Documentation](https://docs.replit.com)
- [NestJS Documentation](https://docs.nestjs.com)
- [Prisma Documentation](https://www.prisma.io/docs)

## 🆘 Need Help?

1. Check the logs in terminal
2. Verify environment variables
3. Ensure dependencies are installed
4. Try restarting the development server

---

**Happy Coding! 🚀** Develop locally in Cursor, deploy globally on Replit.

