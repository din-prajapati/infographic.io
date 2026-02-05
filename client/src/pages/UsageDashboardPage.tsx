import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { 
  BarChart3, 
  TrendingUp, 
  Download, 
  Calendar, 
  ArrowLeft,
  Loader2,
  CreditCard,
  Users,
  Zap
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { usageAnalyticsApi, paymentsApi } from '../lib/api';

interface MonthlyUsageData {
  month: string;
  count: number;
  costUsd: number;
}

interface CostBreakdown {
  aiModel: string;
  count: number;
  totalCostUsd: number;
  averageCostUsd: number;
}

interface UsageHistoryItem {
  date: string;
  count: number;
  costUsd: number;
  aiModel: string;
}

export default function UsageDashboardPage() {
  const [selectedPeriod, setSelectedPeriod] = useState<number>(6);

  const { data: monthlyData, isLoading: monthlyLoading } = useQuery({
    queryKey: ['/api/v1/payments/usage/monthly', selectedPeriod],
    queryFn: () => usageAnalyticsApi.getMonthlyUsage(selectedPeriod),
  });

  const { data: breakdownData, isLoading: breakdownLoading } = useQuery({
    queryKey: ['/api/v1/payments/usage/cost-breakdown'],
    queryFn: () => usageAnalyticsApi.getCostBreakdown(),
  });

  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['/api/v1/payments/usage/history'],
    queryFn: () => usageAnalyticsApi.getUsageHistory(),
  });

  const { data: subscriptionData } = useQuery({
    queryKey: ['/api/v1/payments/subscription'],
    queryFn: () => paymentsApi.getSubscription(),
  });

  const currentPlan = subscriptionData?.subscription?.planTier || 'FREE';
  const monthlyUsage = monthlyData?.data || [];
  const costBreakdown = breakdownData?.data || [];
  const usageHistory = (historyData?.data || []).slice(0, 10);

  const totalInfographics = monthlyUsage.reduce((sum, m) => sum + m.count, 0);
  const totalCost = monthlyUsage.reduce((sum, m) => sum + m.costUsd, 0);
  const currentMonthUsage = monthlyUsage.length > 0 ? monthlyUsage[monthlyUsage.length - 1]?.count || 0 : 0;

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      const data = await usageAnalyticsApi.exportUsageData(format);
      const blob = new Blob([typeof data === 'string' ? data : JSON.stringify(data, null, 2)], {
        type: format === 'csv' ? 'text/csv' : 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `usage-report.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const maxCount = Math.max(...monthlyUsage.map(m => m.count), 1);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between px-6 max-w-6xl mx-auto">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </Link>
            <h1 className="text-xl font-bold">Usage Analytics</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport('json')}>
              <Download className="h-4 w-4 mr-2" />
              Export JSON
            </Button>
          </div>
        </div>
      </nav>

      <main className="container px-6 py-8 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Current Plan</p>
                  <p className="text-2xl font-bold">{currentPlan}</p>
                </div>
                <CreditCard className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">This Month</p>
                  <p className="text-2xl font-bold">{currentMonthUsage}</p>
                  <p className="text-xs text-gray-400">infographics</p>
                </div>
                <Zap className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Generated</p>
                  <p className="text-2xl font-bold">{totalInfographics}</p>
                  <p className="text-xs text-gray-400">last {selectedPeriod} months</p>
                </div>
                <BarChart3 className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Cost</p>
                  <p className="text-2xl font-bold">${totalCost.toFixed(2)}</p>
                  <p className="text-xs text-gray-400">AI generation cost</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Monthly Usage</CardTitle>
                  <CardDescription>Infographics generated per month</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <select 
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(Number(e.target.value))}
                    className="text-sm border rounded px-2 py-1"
                  >
                    <option value={3}>Last 3 months</option>
                    <option value={6}>Last 6 months</option>
                    <option value={12}>Last 12 months</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {monthlyLoading ? (
                <div className="flex items-center justify-center h-48">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : monthlyUsage.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-gray-400">
                  No usage data yet. Generate your first infographic!
                </div>
              ) : (
                <div className="space-y-3">
                  {monthlyUsage.map((item, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <div className="w-20 text-sm text-gray-600 shrink-0">{item.month}</div>
                      <div className="flex-1">
                        <div className="h-8 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 rounded-full transition-all duration-500"
                            style={{ width: `${(item.count / maxCount) * 100}%` }}
                          />
                        </div>
                      </div>
                      <div className="w-16 text-right text-sm font-medium">{item.count}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cost Breakdown by AI Model</CardTitle>
              <CardDescription>Usage and cost per generation model</CardDescription>
            </CardHeader>
            <CardContent>
              {breakdownLoading ? (
                <div className="flex items-center justify-center h-48">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : costBreakdown.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-gray-400">
                  No cost data available
                </div>
              ) : (
                <div className="space-y-4">
                  {costBreakdown.map((item, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{item.aiModel}</span>
                        <span className="text-sm text-gray-500">{item.count} generations</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Total: ${item.totalCostUsd.toFixed(2)}</span>
                        <span className="text-gray-600">Avg: ${item.averageCostUsd.toFixed(4)}/gen</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest infographic generations</CardDescription>
          </CardHeader>
          <CardContent>
            {historyLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : usageHistory.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-gray-400">
                No recent activity
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Date</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">AI Model</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Credits</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usageHistory.map((item, index) => (
                      <tr key={index} className="border-b last:border-0">
                        <td className="py-3 px-4 text-sm">
                          {new Date(item.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="py-3 px-4 text-sm">{item.aiModel}</td>
                        <td className="py-3 px-4 text-sm text-right">{item.count}</td>
                        <td className="py-3 px-4 text-sm text-right">${item.costUsd.toFixed(4)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-8 flex justify-center">
          <Link href="/pricing">
            <Button variant="outline" className="gap-2">
              <Users className="h-4 w-4" />
              Upgrade Plan for More Credits
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
