import { PrismaClient } from '@prisma/client';

// Create a global Prisma client instance with optimized connection pooling for Replit
export const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

prisma.$connect().catch(() => {
  // Initial connect may fail if DB is cold (e.g. Neon); first query will retry in JWT strategy
});

// Graceful shutdown
process.on('beforeExit', async () => {
  try {
    console.log('⏳ Prisma disconnecting...');
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Failed to disconnect Prisma:', error);
  }
});
