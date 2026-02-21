// Suppress Prisma Rust engine E57P01 stderr output (Neon auto-pause reconnections)
if (typeof process !== 'undefined' && process.stderr) {
  const originalStderrWrite = process.stderr.write.bind(process.stderr);

  const isNeonReconnectNoise = (msg: string): boolean => {
    const lower = msg.toLowerCase();
    return (
      lower.includes('e57p01') ||
      lower.includes('terminating connection due to administrator command') ||
      lower.includes('sqlstate(e57p01)') ||
      (lower.includes('error in postgresql connection') && lower.includes('fatal'))
    );
  };

  process.stderr.write = function (chunk: any, encoding?: any, callback?: any) {
    const message = chunk?.toString() || '';
    if (isNeonReconnectNoise(message)) {
      if (typeof callback === 'function') callback();
      return true;
    }
    return originalStderrWrite(chunk, encoding, callback);
  };
}

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  process.on('uncaughtException', (error) => {
    const msg = String(error?.message || error).toLowerCase();
    if (msg.includes('e57p01') || msg.includes('terminating connection due to administrator command')) {
      return; // Expected with Neon auto-pause
    }
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason) => {
    const msg = String(reason || '').toLowerCase();
    if (msg.includes('e57p01') || msg.includes('terminating connection due to administrator command')) {
      return;
    }
    console.error('❌ Unhandled Rejection:', reason);
  });

  const app = await NestFactory.create(AppModule, { cors: false });

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
        callback(null, true); // permissive in dev
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'ngrok-skip-browser-warning'],
  });

  app.useWebSocketAdapter(new IoAdapter(app));
  app.setGlobalPrefix('api/v1');
  app.useGlobalFilters(new AllExceptionsFilter());

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
  const server = await app.listen(port);

  console.log(`🚀 NestJS API running on http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);

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
}

bootstrap().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
