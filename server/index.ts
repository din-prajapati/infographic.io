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


// #region agent log
const debugLog = (location: string, message: string, data: any, hypothesisId: string) => {
  const logEntry = {location,message,data,timestamp:Date.now(),sessionId:'debug-session',runId:'run3',hypothesisId};
  const logPath = 'd:\\Dinesh\\DCloud\\GITDrive\\Work\\Products\\InfographicEditor-Unified\\.cursor\\debug.log';
  try { fs.appendFileSync(logPath, JSON.stringify(logEntry) + '\n'); } catch(e) { console.error('Log error:', e); }
  fetch('http://127.0.0.1:7244/ingest/8efc90dd-6123-4218-ac73-6942740927b9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logEntry)}).catch(()=>{});
};
// #endregion

// Set up error handlers IMMEDIATELY, before anything else
let nestServer: ReturnType<typeof spawn> | null = null;

const cleanup = () => {
  // #region agent log
  debugLog('server/index.ts:cleanup', 'Cleanup called', {nestServerExists:!!nestServer}, 'E');
  // #endregion
  console.log('Shutting down servers...');
  if (nestServer) {
    nestServer.kill();
  }
  process.exit(0);
};

// Handle uncaught errors
process.on('uncaughtException', (err: Error) => {
  console.error('Uncaught Exception:', err);
  if (err.message.includes('EADDRINUSE') || (err as any).code === 'EADDRINUSE') {
    const portMatch = err.message.match(/:(\d+)/);
    const port = portMatch ? portMatch[1] : '5000';
    console.error(`❌ Port ${port} is already in use.`);
    console.error(`💡 To fix this, run:`);
    console.error(`   Get-NetTCPConnection -LocalPort ${port} | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }`);
    console.error(`   Or use a different port: PORT=5001 npm run dev`);
  }
  cleanup();
});

process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// Start NestJS API server as a child process
const startNestJSServer = () => {
  // Use npx tsx for cross-platform compatibility (Windows/Linux/Mac)
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
    console.error(`[NestJS Error] ${data.toString().trim()}`);
  });

  nestProcess.on('close', (code) => {
    console.log(`[NestJS] Process exited with code ${code}`);
  });

  return nestProcess;
};

// Server process starting

// Start NestJS server
nestServer = startNestJSServer();
log('🚀 Starting NestJS API server on port 3001...');

const app = express();

// Proxy middleware MUST come before body parsers to avoid consuming request body
app.use('/api/v1', createProxyMiddleware({
  target: 'http://localhost:3001/api/v1',
  changeOrigin: true,
  pathRewrite: { '^/api/v1': '' },
  onProxyReq: (proxyReq: any, req: any) => {
    // #region agent log
    const logData = {method:req.method,url:req.url,path:req.path,bodySize:req.body?.length,hasBody:!!req.body};
    fetch('http://127.0.0.1:7244/ingest/8efc90dd-6123-4218-ac73-6942740927b9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'server/index.ts:72',message:'Proxy request',data:logData,timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    log(`Proxying: ${req.method} ${req.url} -> http://localhost:3001/api/v1${req.url}`);
  },
  onError: (err: any, req: any, res: any) => {
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/8efc90dd-6123-4218-ac73-6942740927b9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'server/index.ts:75',message:'Proxy error',data:{errorMessage:err?.message,errorCode:err?.code,url:req?.url,method:req?.method},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
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
  // #region agent log
  debugLog('server/index.ts:132', 'Server initialization started', {processId:process.pid,port:process.env.PORT}, 'A');
  // #endregion
  
  const server = await registerRoutes(app);
  
  // #region agent log
  debugLog('server/index.ts:137', 'Routes registered, setting up server', {processId:process.pid}, 'A');
  // #endregion

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
  
  // #region agent log
  debugLog('server/index.ts:156', 'Attempting to bind port', {port,host:'0.0.0.0',reusePort:true,processId:process.pid}, 'B');
  // #endregion
  
  // Attach error handler BEFORE calling listen() to catch synchronous errors
  server.on('error', (err: NodeJS.ErrnoException) => {
    // #region agent log
    debugLog('server/index.ts:162', 'Port bind error', {port,errorCode:err.code,errorMessage:err.message,errno:err.errno,syscall:err.syscall,processId:process.pid}, 'B');
    // #endregion
    
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
      // #region agent log
      debugLog('server/index.ts:177', 'Port bound successfully', {port,processId:process.pid}, 'B');
      // #endregion
      log(`serving on port ${port}`);
    });
  } catch (err: any) {
    // #region agent log
    debugLog('server/index.ts:183', 'Listen call exception', {port,errorMessage:err?.message,errorName:err?.name,processId:process.pid}, 'B');
    // #endregion
    log(`❌ Failed to start server: ${err?.message || err}`);
    cleanup();
  }
})().catch((err) => {
  // #region agent log
  debugLog('server/index.ts:189', 'Async function error', {errorMessage:err?.message,errorName:err?.name,errorStack:err?.stack?.substring(0,500),processId:process.pid}, 'D');
  // #endregion
  console.error('Failed to start server:', err);
  cleanup();
});
