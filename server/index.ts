import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { createProxyMiddleware } from 'http-proxy-middleware';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load root .env so RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET etc. are in process.env
// before spawning the Nest API (Nest also loads this; this ensures the parent passes them to the child)
const rootEnv = path.join(__dirname, '..', '.env');
try {
  if (fs.existsSync(rootEnv)) {
    const content = fs.readFileSync(rootEnv, 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const eq = trimmed.indexOf('=');
        if (eq > 0) {
          const key = trimmed.slice(0, eq).trim();
          const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
          if (key && !process.env[key]) process.env[key] = value;
        }
      }
    }
  }
} catch (_) { /* ignore */ }


// Set up error handlers IMMEDIATELY, before anything else
let nestServer: ReturnType<typeof spawn> | null = null;
let isShuttingDown = false;

const cleanup = () => {
  isShuttingDown = true;
  console.log('Shutting down servers...');
  if (nestServer) {
    nestServer.kill();
  }
  process.exit(0);
};

// Handle uncaught errors - only exit on truly fatal issues
process.on('uncaughtException', (err: Error) => {
  if ((err as any).code === 'EADDRINUSE' || err.message.includes('EADDRINUSE')) {
    const portMatch = err.message.match(/:(\d+)/);
    const port = portMatch ? portMatch[1] : '5000';
    console.error(`❌ Port ${port} is already in use.`);
    cleanup();
    return;
  }
  console.error('Uncaught Exception (non-fatal):', err.message);
});

process.on('unhandledRejection', (reason: any) => {
  console.error('Unhandled Rejection:', reason?.message || reason);
});

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// Start NestJS API server as a child process with auto-restart
const startNestJSServer = () => {
  const isWindows = process.platform === 'win32';
  const command = isWindows ? 'npx.cmd' : 'npx';
  
  const nestProcess = spawn(command, ['tsx', 'src/main.ts'], {
    cwd: path.join(__dirname, '..', 'api'),
    env: {
      ...process.env,
      DATABASE_URL: process.env.DATABASE_URL,
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      IDEOGRAM_API_KEY: process.env.IDEOGRAM_API_KEY,
      JWT_SECRET: process.env.JWT_SECRET || 'infographic-jwt-secret',
      API_PORT: '3001',
      DEMO_MODE: process.env.DEMO_MODE || 'false',
      RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
      RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
      RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: true
  });

  nestProcess.stdout?.on('data', (data) => {
    console.log(`[NestJS] ${data.toString().trim()}`);
  });

  nestProcess.stderr?.on('data', (data) => {
    const msg = data.toString().trim();
    // Suppress Neon auto-pause reconnection noise
    if (msg.includes('E57P01') || msg.includes('terminating connection due to administrator command')) {
      return;
    }
    if (msg.length > 0) {
      console.error(`[NestJS] ${msg}`);
    }
  });

  nestProcess.on('close', (code) => {
    console.log(`[NestJS] Process exited with code ${code}`);
    nestServer = null;
    if (!isShuttingDown && code !== 0) {
      console.log('[NestJS] Auto-restarting in 3 seconds...');
      setTimeout(() => {
        if (!isShuttingDown) {
          nestServer = startNestJSServer();
        }
      }, 3000);
    }
  });

  return nestProcess;
};

// Server process starting

// Start NestJS server
nestServer = startNestJSServer();
log('🚀 Starting NestJS API server on port 3001...');

const app = express();

// Image proxy route - fetches external images server-side to bypass browser CORS
app.get('/api/proxy-image', async (req: Request, res: Response) => {
  const url = req.query.url as string;
  if (!url) {
    return res.status(400).json({ error: 'Missing url parameter' });
  }
  // Only allow Ideogram AI and other known image hosts
  const allowedHosts = ['ideogram.ai', 'ideogram.com', 'openai.com', 'oaidalleapiprodscus.blob.core.windows.net'];
  try {
    const parsed = new URL(url);
    if (!allowedHosts.some(h => parsed.hostname.endsWith(h))) {
      return res.status(403).json({ error: 'Host not allowed' });
    }
  } catch {
    return res.status(400).json({ error: 'Invalid URL' });
  }
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return res.status(response.status).json({ error: `Upstream error: ${response.statusText}` });
    }
    const contentType = response.headers.get('content-type') || 'image/png';
    const buffer = await response.arrayBuffer();
    res.setHeader('Content-Type', contentType);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.send(Buffer.from(buffer));
  } catch (error) {
    return res.status(502).json({ error: 'Failed to fetch image' });
  }
});

// Health check — proxies to NestJS; returns 503 if NestJS is down
app.get('/api/health', async (req: Request, res: Response) => {
  try {
    const resp = await fetch('http://localhost:3001/api/v1/health');
    const body = await resp.json();
    res.status(resp.ok ? 200 : 503).json(body);
  } catch {
    res.status(503).json({ status: 'error', db: 'unreachable' });
  }
});

// Proxy middleware MUST come before body parsers to avoid consuming request body
app.use('/api/v1', createProxyMiddleware({
  target: 'http://localhost:3001/api/v1',
  changeOrigin: true,
  pathRewrite: { '^/api/v1': '' },
  onProxyReq: (proxyReq: any, req: any) => {
    log(`Proxying: ${req.method} ${req.url} -> http://localhost:3001/api/v1${req.url}`);
  },
  onError: (err: any, req: any, res: any) => {
    log(`Proxy error: ${err.message}`);
    res.status(502).json({ 
      error: 'Backend API unavailable', 
      message: 'The NestJS API server is not running. Please start it with: ./start-nestjs.sh'
    });
  },
}) as any);

// Configure JSON parser with raw body preservation for webhook signature verification
app.use(express.json({
  verify: (req: any, _res, buf) => {
    // Store raw body for webhook signature verification
    if (req.url?.startsWith('/api/webhooks')) {
      req.rawBody = buf;
    }
  }
}));
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  
  // Attach error handler BEFORE calling listen() to catch synchronous errors
  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      log(`❌ Port ${port} is already in use.`);
      log(`💡 To fix this, run one of the following:`);
      log(`   Windows: netstat -ano | findstr :${port}  (then kill the PID)`);
      log(`   Or: Get-NetTCPConnection -LocalPort ${port} | Select-Object OwningProcess`);
      log(`   Then: taskkill /PID <PID> /F`);
      log(`   Or use a different port: PORT=5001 npm run dev`);
      cleanup();
    } else {
      log(`❌ Server error: ${err.message}`);
      cleanup();
    }
  });
  
  try {
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      log(`serving on port ${port}`);
    });
  } catch (err: any) {
    log(`❌ Failed to start server: ${err?.message || err}`);
    cleanup();
  }
})().catch((err) => {
  console.error('Failed to start server:', err);
  cleanup();
});
