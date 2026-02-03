import {
  Controller,
  Get,
  Query,
  UseGuards,
  Req,
  Inject,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiSecurity, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { UsageAnalyticsService } from '../services/usage-analytics.service';

@ApiTags('payments-usage')
@Controller('payments/usage')
export class UsageAnalyticsController {
  constructor(
    @Inject(UsageAnalyticsService) private readonly usageAnalyticsService: UsageAnalyticsService,
  ) {}

  @Get('monthly')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get monthly usage chart data' })
  @ApiQuery({ name: 'months', required: false, description: 'Number of months to retrieve (default: 6)' })
  async getMonthlyUsage(@Req() req: any, @Query('months') months?: string) {
    const userId = req.user.id;
    const organizationId = req.user.organizationId || req.user.id;
    const monthsCount = months ? parseInt(months, 10) : 6;
    const data = await this.usageAnalyticsService.getMonthlyUsage(userId, organizationId, monthsCount);
    return { data };
  }

  @Get('cost-breakdown')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get cost breakdown by AI model' })
  async getCostBreakdown(@Req() req: any) {
    const userId = req.user.id;
    const organizationId = req.user.organizationId || req.user.id;
    const data = await this.usageAnalyticsService.getCostBreakdown(userId, organizationId);
    return { data };
  }

  @Get('history')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get historical usage reports' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (ISO string)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (ISO string)' })
  async getUsageHistory(
    @Req() req: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const userId = req.user.id;
    const organizationId = req.user.organizationId || req.user.id;
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    const data = await this.usageAnalyticsService.getUsageHistory(userId, organizationId, start, end);
    return { data };
  }

  @Get('export')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Export usage data (CSV or JSON)' })
  @ApiQuery({ name: 'format', required: false, description: 'Export format: csv or json (default: json)' })
  async exportUsageData(
    @Req() req: any,
    @Res() res: Response,
    @Query('format') format: string = 'json',
  ) {
    const userId = req.user.id;
    const organizationId = req.user.organizationId || req.user.id;

    if (format === 'csv') {
      const csv = await this.usageAnalyticsService.exportUsageDataCsv(userId, organizationId);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="usage-export-${Date.now()}.csv"`);
      return res.send(csv);
    } else {
      const json = await this.usageAnalyticsService.exportUsageDataJson(userId, organizationId);
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="usage-export-${Date.now()}.json"`);
      return res.json(json);
    }
  }
}
