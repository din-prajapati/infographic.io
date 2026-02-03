import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/services/prisma.service';

export interface MonthlyUsageData {
  month: string;
  count: number;
  costUsd: number;
}

export interface CostBreakdown {
  aiModel: string;
  count: number;
  totalCostUsd: number;
  averageCostUsd: number;
}

export interface UsageHistoryItem {
  date: string;
  count: number;
  costUsd: number;
  aiModel: string;
}

@Injectable()
export class UsageAnalyticsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get monthly usage chart data
   */
  async getMonthlyUsage(userId: string, organizationId: string, months: number = 6): Promise<MonthlyUsageData[]> {
    if (!this.prisma?.usageRecord) {
      return [];
    }
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    startDate.setDate(1); // Start of month
    startDate.setHours(0, 0, 0, 0);

    const usageRecords = await this.prisma.usageRecord.findMany({
      where: {
        userId,
        organizationId,
        createdAt: {
          gte: startDate,
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Group by month
    const monthlyData: Record<string, { count: number; costUsd: number }> = {};

    usageRecords.forEach((record) => {
      const monthKey = new Date(record.createdAt).toISOString().substring(0, 7); // YYYY-MM
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { count: 0, costUsd: 0 };
      }
      monthlyData[monthKey].count += record.creditsUsed;
      monthlyData[monthKey].costUsd += record.costUsd;
    });

    // Convert to array and format
    return Object.entries(monthlyData)
      .map(([month, data]) => ({
        month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        count: data.count,
        costUsd: parseFloat(data.costUsd.toFixed(2)),
      }))
      .sort((a, b) => {
        const dateA = new Date(a.month);
        const dateB = new Date(b.month);
        return dateA.getTime() - dateB.getTime();
      });
  }

  /**
   * Get cost breakdown by AI model
   */
  async getCostBreakdown(userId: string, organizationId: string): Promise<CostBreakdown[]> {
    if (!this.prisma?.usageRecord) {
      return [];
    }
    const usageRecords = await this.prisma.usageRecord.findMany({
      where: {
        userId,
        organizationId,
      },
    });

    // Group by AI model
    const breakdown: Record<string, { count: number; totalCostUsd: number }> = {};

    usageRecords.forEach((record) => {
      if (!breakdown[record.aiModel]) {
        breakdown[record.aiModel] = { count: 0, totalCostUsd: 0 };
      }
      breakdown[record.aiModel].count += record.creditsUsed;
      breakdown[record.aiModel].totalCostUsd += record.costUsd;
    });

    // Convert to array and calculate averages (guard against division by zero)
    return Object.entries(breakdown).map(([aiModel, data]) => ({
      aiModel,
      count: data.count,
      totalCostUsd: parseFloat(data.totalCostUsd.toFixed(2)),
      averageCostUsd:
        data.count > 0
          ? parseFloat((data.totalCostUsd / data.count).toFixed(4))
          : 0,
    }));
  }

  /**
   * Get historical usage reports
   */
  async getUsageHistory(
    userId: string,
    organizationId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<UsageHistoryItem[]> {
    const where: any = {
      userId,
      organizationId,
    };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = startDate;
      }
      if (endDate) {
        where.createdAt.lte = endDate;
      }
    }

    if (!this.prisma?.usageRecord) {
      return [];
    }
    const usageRecords = await this.prisma.usageRecord.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return usageRecords.map((record) => ({
      date: record.createdAt.toISOString(),
      count: record.creditsUsed,
      costUsd: parseFloat(record.costUsd.toFixed(2)),
      aiModel: record.aiModel,
    }));
  }

  /**
   * Export usage data to CSV format
   */
  async exportUsageDataCsv(userId: string, organizationId: string): Promise<string> {
    const history = await this.getUsageHistory(userId, organizationId);

    // CSV header
    const headers = ['Date', 'AI Model', 'Credits Used', 'Cost (USD)'];
    const rows = history.map((item) => [
      new Date(item.date).toISOString(),
      item.aiModel,
      item.count.toString(),
      item.costUsd.toString(),
    ]);

    // Combine headers and rows
    const csvRows = [headers.join(','), ...rows.map((row) => row.join(','))];
    return csvRows.join('\n');
  }

  /**
   * Export usage data to JSON format
   */
  async exportUsageDataJson(userId: string, organizationId: string): Promise<any> {
    const history = await this.getUsageHistory(userId, organizationId);
    const monthlyUsage = await this.getMonthlyUsage(userId, organizationId);
    const costBreakdown = await this.getCostBreakdown(userId, organizationId);

    return {
      exportedAt: new Date().toISOString(),
      monthlyUsage,
      costBreakdown,
      history,
    };
  }
}
