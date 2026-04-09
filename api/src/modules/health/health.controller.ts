import { Controller, Get, HttpCode, Inject } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';

@Controller('health')
export class HealthController {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  @Get()
  @HttpCode(200)
  async check() {
    await this.prisma.$queryRaw`SELECT 1`;
    return { status: 'ok', db: 'connected', uptime: process.uptime() };
  }
}
