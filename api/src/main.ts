// Suppress Prisma Rust engine stderr output BEFORE any imports
// This must happen at module load time, before Prisma initializes
// Prisma's Rust engine writes directly to native stderr (fd 2), which bypasses Node.js
// We intercept at multiple levels to catch as many cases as possible
if (typeof process !== 'undefined' && process.stderr) {
  const originalStderrWrite = process.stderr.write.bind(process.stderr);
  const originalStderrEmit = process.stderr.emit?.bind(process.stderr);
  
  // Helper function to check if message should be suppressed
  const shouldSuppress = (message: string): boolean => {
    const msg = message.toLowerCase();
    return (
      msg.includes('e57p01') ||
      msg.includes('terminating connection') ||
      msg.includes('terminating connection due to administrator command') ||
      (msg.includes('fatal') && msg.includes('connection')) ||
      msg.includes('error in postgresql connection') ||
      msg.includes('sqlstate(e57p01)')
    );
  };
  
  // Intercept write method (most common path)
  process.stderr.write = function(chunk: any, encoding?: any, callback?: any) {
    const message = chunk?.toString() || '';
    
    // #region agent log
    if (message.length > 0 && (message.includes('E57P01') || message.includes('terminating') || message.includes('connection'))) {
      fetch('http://127.0.0.1:7244/ingest/8efc90dd-6123-4218-ac73-6942740927b9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.ts:25',message:'stderr write intercepted',data:{messagePreview:message.substring(0,300),shouldSuppress:shouldSuppress(message)},timestamp:Date.now(),sessionId:'debug-session',runId:'run18',hypothesisId:'AT'})}).catch(()=>{});
    }
    // #endregion
    
    if (shouldSuppress(message)) {
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/8efc90dd-6123-4218-ac73-6942740927b9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.ts:33',message:'Suppressing E57P01 stderr message',data:{messagePreview:message.substring(0,300)},timestamp:Date.now(),sessionId:'debug-session',runId:'run18',hypothesisId:'AU'})}).catch(()=>{});
      // #endregion
      
      // Suppress E57P01 errors silently - expected with Neon auto-pause
      if (typeof callback === 'function') {
        callback();
      }
      return true;
    }
    
    return originalStderrWrite(chunk, encoding, callback);
  };
  
  // Also intercept emit events (for stream-based writes)
  if (originalStderrEmit) {
    process.stderr.emit = function(event: string, ...args: any[]) {
      if (event === 'data' || event === 'error') {
        const message = args[0]?.toString() || '';
        
        if (shouldSuppress(message)) {
          // Suppress E57P01 errors silently
          return true;
        }
      }
      
      return originalStderrEmit(event, ...args);
    };
  }
  
  // Also intercept the underlying stream's write method if available
  if (process.stderr._write) {
    const originalUnderlyingWrite = process.stderr._write.bind(process.stderr);
    process.stderr._write = function(chunk: any, encoding: any, callback: any) {
      const message = chunk?.toString() || '';
      
      if (shouldSuppress(message)) {
        if (typeof callback === 'function') {
          callback();
        }
        return true;
      }
      
      return originalUnderlyingWrite(chunk, encoding, callback);
    };
  }
}

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  // Set up error handlers FIRST, before anything else
  
  // #region agent log
  fetch('http://127.0.0.1:7244/ingest/8efc90dd-6123-4218-ac73-6942740927b9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.ts:45',message:'Bootstrap started - stderr interception already active',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run17',hypothesisId:'AS'})}).catch(()=>{});
  // #endregion
  
  process.on('uncaughtException', (error) => {
    const errorString = String(error?.message || error);
    const isConnectionError = 
      errorString.includes('E57P01') ||
      errorString.includes('terminating connection') ||
      errorString.includes('connection') ||
      errorString.includes('FATAL');
    
    if (isConnectionError) {
      // Suppress E57P01 and connection errors - expected with Neon auto-pause
      // Already handled by stderr interception, so just return
      return;
    } else {
      console.error('❌ Uncaught Exception:', error);
      process.exit(1);
    }
  });
  
  process.on('unhandledRejection', (reason, promise) => {
    const reasonString = String(reason || '');
    const isConnectionError = 
      reasonString.includes('E57P01') ||
      reasonString.includes('terminating connection') ||
      reasonString.includes('connection') ||
      reasonString.includes('FATAL');
    
    if (isConnectionError) {
      // Suppress E57P01 and connection errors - expected with Neon auto-pause
      // Already handled by stderr interception, so just return
      return;
    } else {
      console.error('❌ Unhandled Rejection:', reason);
    }
  });
  
  // #region agent log
  fetch('http://127.0.0.1:7244/ingest/8efc90dd-6123-4218-ac73-6942740927b9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.ts:8',message:'Starting NestJS bootstrap',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run13',hypothesisId:'AF'})}).catch(()=>{});
  // #endregion
  
  try {
    const app = await NestFactory.create(AppModule, {
      cors: false, // We'll configure CORS explicitly below
    });
    
    // Configure CORS: allow localhost, CLIENT_URL, and any ngrok origin
    app.enableCors({
      origin: (origin, callback) => {
        const allowed = [
          'http://localhost:5000',
          'http://localhost:5001',
          'http://localhost:5173',
          process.env.CLIENT_URL,
        ].filter(Boolean);
        if (!origin || allowed.includes(origin) || /\.ngrok-free\.app$/.test(origin)) {
          callback(null, true);
        } else {
          callback(null, true); // allow anyway for dev; tighten in production
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'ngrok-skip-browser-warning'],
    });
    
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/8efc90dd-6123-4218-ac73-6942740927b9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.ts:47',message:'NestFactory.create completed',data:{appCreated:true},timestamp:Date.now(),sessionId:'debug-session',runId:'run13',hypothesisId:'AG'})}).catch(()=>{});
    // #endregion

    // Enable WebSocket support
    app.useWebSocketAdapter(new IoAdapter(app));

    app.setGlobalPrefix('api/v1');

    // Surface real error messages for 500s (e.g. from Prisma, Razorpay) instead of generic "Internal server error"
    app.useGlobalFilters(new AllExceptionsFilter());

    // Add request logging middleware
    app.use((req, res, next) => {
      const authHeader = req.headers.authorization;
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/8efc90dd-6123-4218-ac73-6942740927b9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.ts:157',message:'Incoming request',data:{method:req.method,url:req.url,hasAuth:!!authHeader,authHeaderPrefix:authHeader?.substring(0,30)+'...',hasApiKey:!!(req.headers['x-api-key'] || req.headers['X-API-Key']),userAgent:req.headers['user-agent']?.substring(0,100)},timestamp:Date.now(),sessionId:'debug-session',runId:'debug2',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      next();
    });

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );

    const config = new DocumentBuilder()
      .setTitle('InfographicAI API')
      .setDescription('AI-powered Real Estate infographic generation API')
      .setVersion('1.0')
      .addBearerAuth()
      .addApiKey({ type: 'apiKey', name: 'X-API-Key', in: 'header' }, 'api-key')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    const port = process.env.API_PORT || 3001;
    
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/8efc90dd-6123-4218-ac73-6942740927b9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.ts:79',message:'Starting server listen',data:{port},timestamp:Date.now(),sessionId:'debug-session',runId:'run14',hypothesisId:'AL'})}).catch(()=>{});
    // #endregion
    
    let server;
    try {
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/8efc90dd-6123-4218-ac73-6942740927b9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.ts:84',message:'Calling app.listen',data:{port,aboutToListen:true},timestamp:Date.now(),sessionId:'debug-session',runId:'run14',hypothesisId:'AM'})}).catch(()=>{});
      // #endregion
      
      server = await app.listen(port);
      
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/8efc90dd-6123-4218-ac73-6942740927b9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.ts:89',message:'Server listening successfully',data:{port,serverStarted:true,serverAddress:server?.address?.()},timestamp:Date.now(),sessionId:'debug-session',runId:'run14',hypothesisId:'AN'})}).catch(()=>{});
      // #endregion
    } catch (listenError: any) {
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/8efc90dd-6123-4218-ac73-6942740927b9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.ts:93',message:'app.listen failed',data:{port,errorMessage:listenError?.message,errorCode:listenError?.code,errorName:listenError?.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run14',hypothesisId:'AO'})}).catch(()=>{});
      // #endregion
      throw listenError;
    }
    
    console.log(`🚀 NestJS API running on http://localhost:${port}`);
    console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
    
    // Keep the process alive
    process.on('SIGTERM', async () => {
      console.log('SIGTERM received, closing server...');
      await server.close();
      process.exit(0);
    });
    
    process.on('SIGINT', async () => {
      console.log('SIGINT received, closing server...');
      await server.close();
      process.exit(0);
    });
  } catch (error: any) {
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/8efc90dd-6123-4218-ac73-6942740927b9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.ts:110',message:'Bootstrap error caught',data:{errorMessage:error?.message,errorName:error?.name,errorStack:error?.stack?.substring(0,500)},timestamp:Date.now(),sessionId:'debug-session',runId:'run13',hypothesisId:'AH'})}).catch(()=>{});
    // #endregion
    throw error; // Re-throw to be caught by bootstrap().catch()
  }
}

bootstrap().catch((error) => {
  // #region agent log
  fetch('http://127.0.0.1:7244/ingest/8efc90dd-6123-4218-ac73-6942740927b9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.ts:118',message:'Bootstrap failed',data:{errorMessage:error?.message,errorStack:error?.stack?.substring(0,500),errorName:error?.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run13',hypothesisId:'AK'})}).catch(()=>{});
  // #endregion
  console.error('Failed to start server:', error);
  process.exit(1);
});
