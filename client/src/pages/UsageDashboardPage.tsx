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
import { AppHeader } from '../components/navigation/AppHeader';
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
    <div className="min-h-screen bg-[#0a0a0a]">
      <AppHeader />
      <div className="border-b border-white/10 bg-[#0a0a0a]">
        <div className="container flex h-14 items-center justify-between px-6 max-w-6xl mx-auto">
          <div className="flex items-center gap-4">
            <Link href="/account">
              <Button variant="ghost" size="sm" className="gap-2 text-gray-400 hover:text-white">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </Link>
            <h1 className="text-xl font-bold text-white">Usage Analytics</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="border-white/20 text-gray-300 hover:text-white hover:bg-white/5" onClick={() => handleExport('csv')}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="outline" size="sm" className="border-white/20 text-gray-300 hover:text-white hover:bg-white/5" onClick={() => handleExport('json')}>
              <Download className="h-4 w-4 mr-2" />
              Export JSON
            </Button>
          </div>
        </div>
      </div>

      <main className="container px-6 py-8 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/5 backdrop-blur-xl border-white/10">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Current Plan</p>
                  <p className="text-2xl font-bold text-white">{currentPlan}</p>
                </div>
                <CreditCard className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/5 backdrop-blur-xl border-white/10">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">This Month</p>
                  <p className="text-2xl font-bold text-white">{currentMonthUsage}</p>
                  <p className="text-xs text-gray-500">infographics</p>
                </div>
                <Zap className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 backdrop-blur-xl border-white/10">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Generated</p>
                  <p className="text-2xl font-bold text-white">{totalInfographics}</p>
                  <p className="text-xs text-gray-500">last {selectedPeriod} months</p>
                </div>
                <BarChart3 className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 backdrop-blur-xl border-white/10">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Cost</p>
                  <p className="text-2xl font-bold text-white">${totalCost.toFixed(2)}</p>
                  <p className="text-xs text-gray-500">AI generation cost</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="bg-white/5 backdrop-blur-xl border-white/10">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white">Monthly Usage</CardTitle>
                  <CardDescription className="text-gray-400">Infographics generated per month</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <select 
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(Number(e.target.value))}
                    className="text-sm border rounded px-2 py-1 bg-white/5 border-white/10 text-white"
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
                <div className="flex items-center justify-center h-48 text-gray-500">
                  No usage data yet. Generate your first infographic!
                </div>
              ) : (
                <div className="space-y-3">
                  {monthlyUsage.map((item, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <div className="w-20 text-sm text-gray-400 shrink-0">{item.month}</div>
                      <div className="flex-1">
                        <div className="h-8 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 rounded-full transition-all duration-500"
                            style={{ width: `${(item.count / maxCount) * 100}%` }}
                          />
                        </div>
                      </div>
                      <div className="w-16 text-right text-sm font-medium text-white">{item.count}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white/5 backdrop-blur-xl border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Cost Breakdown by AI Model</CardTitle>
              <CardDescription className="text-gray-400">Usage and cost per generation model</CardDescription>
            </CardHeader>
            <CardContent>
              {breakdownLoading ? (
                <div className="flex items-center justify-center h-48">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : costBreakdown.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-gray-500">
                  No cost data available
                </div>
              ) : (
                <div className="space-y-4">
                  {costBreakdown.map((item, index) => (
                    <div key={index} className="p-4 bg-white/5 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-white">{item.aiModel}</span>
                        <span className="text-sm text-gray-400">{item.count} generations</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Total: ${item.totalCostUsd.toFixed(2)}</span>
                        <span className="text-gray-400">Avg: ${item.averageCostUsd.toFixed(4)}/gen</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white/5 backdrop-blur-xl border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Recent Activity</CardTitle>
            <CardDescription className="text-gray-400">Your latest infographic generations</CardDescription>
          </CardHeader>
          <CardContent>
            {historyLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : usageHistory.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-gray-500">
                No recent activity
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Date</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">AI Model</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Credits</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usageHistory.map((item, index) => (
                      <tr key={index} className="border-b border-white/10 last:border-0">
                        <td className="py-3 px-4 text-sm text-gray-300">
                          {new Date(item.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-300">{item.aiModel}</td>
                        <td className="py-3 px-4 text-sm text-right text-gray-300">{item.count}</td>
                        <td className="py-3 px-4 text-sm text-right text-gray-300">${item.costUsd.toFixed(4)}</td>
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
            <Button variant="outline" className="gap-2 border-white/20 text-white hover:bg-white/5">
              <Users className="h-4 w-4" />
              Upgrade Plan for More Credits
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
