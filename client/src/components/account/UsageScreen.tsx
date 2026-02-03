import { useState, useEffect } from "react";
import { Download, TrendingUp, FileText, Image, Users, Calendar, Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { usageAnalyticsApi, type MonthlyUsageData, type CostBreakdown, type UsageHistoryItem } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const usageMetrics = [
  { 
    label: "Total Projects", 
    value: "148", 
    change: "+12%", 
    positive: true,
    icon: FileText,
    color: "#3b82f6"
  },
  { 
    label: "Total Exports", 
    value: "480", 
    change: "+18%", 
    positive: true,
    icon: Download,
    color: "#10b981"
  },
  { 
    label: "Storage Used", 
    value: "34.4 GB", 
    change: "+8%", 
    positive: true,
    icon: Image,
    color: "#8b5cf6"
  },
  { 
    label: "Team Members", 
    value: "8", 
    change: "+2", 
    positive: true,
    icon: Users,
    color: "#f59e0b"
  },
];

const creditUsageData = [
  { id: 1, type: "Used", date: "Nov 29, 04:45:49 PM", tool: "Hifi Standard Design", amount: 6, purchased: 0, plan: 0 },
  { id: 2, type: "Used", date: "Nov 29, 04:40:08 PM", tool: "Hifi Standard Design", amount: 6, purchased: 0, plan: 6 },
  { id: 3, type: "Used", date: "Nov 28, 01:45:33 PM", tool: "Hifi Standard Design", amount: 6, purchased: 0, plan: 12 },
  { id: 4, type: "Used", date: "Nov 28, 01:39:31 PM", tool: "Heatmap", amount: 2, purchased: 0, plan: 18 },
  { id: 5, type: "Used", date: "Nov 28, 01:38:39 PM", tool: "UX Review", amount: 1, purchased: 0, plan: 20 },
  { id: 6, type: "Used", date: "Nov 27, 05:51:08 PM", tool: "Hifi Standard Design", amount: 6, purchased: 0, plan: 21 },
  { id: 7, type: "Used", date: "Nov 27, 05:38:42 PM", tool: "Hifi Standard Design", amount: 6, purchased: 0, plan: 27 },
  { id: 8, type: "Used", date: "Nov 27, 05:33:20 PM", tool: "Hifi Standard Design", amount: 6, purchased: 0, plan: 33 },
  { id: 9, type: "Used", date: "Nov 27, 04:11:45 PM", tool: "Hifi Standard Design", amount: 6, purchased: 0, plan: 39 },
];

export function UsageScreen() {
  const [entriesPerPage, setEntriesPerPage] = useState("10");
  const { toast } = useToast();

  // Fetch real usage data
  const { data: monthlyUsageData, isLoading: isLoadingMonthly } = useQuery({
    queryKey: ['/api/v1/payments/usage/monthly'],
    queryFn: () => usageAnalyticsApi.getMonthlyUsage(6),
  });

  const { data: costBreakdownData, isLoading: isLoadingCost } = useQuery({
    queryKey: ['/api/v1/payments/usage/cost-breakdown'],
    queryFn: () => usageAnalyticsApi.getCostBreakdown(),
  });

  const { data: usageHistoryData, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['/api/v1/payments/usage/history'],
    queryFn: () => usageAnalyticsApi.getUsageHistory(),
  });

  // Transform API data for charts
  const usageData = monthlyUsageData?.data || [];
  const costBreakdown = costBreakdownData?.data || [];
  const usageHistory = usageHistoryData?.data || [];

  // Calculate totals for metrics
  const totalInfographics = usageHistory.reduce((sum, item) => sum + item.count, 0);
  const totalCost = usageHistory.reduce((sum, item) => sum + item.costUsd, 0);
  const totalByModel = costBreakdown.reduce((sum, item) => sum + item.count, 0);

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      const data = await usageAnalyticsApi.exportUsageData(format);
      const blob = format === 'csv' 
        ? new Blob([data as string], { type: 'text/csv' })
        : new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `usage-export-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({
        title: "Export Successful",
        description: `Usage data exported as ${format.toUpperCase()}`,
      });
    } catch (error: any) {
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export usage data",
        variant: "destructive",
      });
    }
  };

  const usageMetrics = [
    { 
      label: "Total Infographics", 
      value: totalInfographics.toString(), 
      change: "+12%", 
      positive: true,
      icon: FileText,
      color: "#3b82f6"
    },
    { 
      label: "Total Cost", 
      value: `$${totalCost.toFixed(2)}`, 
      change: "+18%", 
      positive: true,
      icon: Download,
      color: "#10b981"
    },
    { 
      label: "AI Models Used", 
      value: costBreakdown.length.toString(), 
      change: "+8%", 
      positive: true,
      icon: Image,
      color: "#8b5cf6"
    },
    { 
      label: "Total Credits", 
      value: totalByModel.toString(), 
      change: "+2", 
      positive: true,
      icon: Users,
      color: "#f59e0b"
    },
  ];

  // Transform usage history for table
  const creditUsageData = usageHistory.slice(0, parseInt(entriesPerPage)).map((item, index) => ({
    id: index + 1,
    type: "Used",
    date: new Date(item.date).toLocaleString(),
    tool: item.aiModel,
    amount: item.count,
    purchased: 0,
    plan: usageHistory.slice(0, index + 1).reduce((sum, i) => sum + i.count, 0),
  }));

  if (isLoadingMonthly || isLoadingCost || isLoadingHistory) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Usage Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {usageMetrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <div 
              key={index}
              className="bg-white border border-gray-200 rounded-lg p-5"
            >
              <div className="flex items-start justify-between mb-4">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${metric.color}15` }}
                >
                  <Icon className="w-5 h-5" style={{ color: metric.color }} />
                </div>
                <span 
                  className="text-xs font-semibold px-2 py-1 rounded"
                  style={{ 
                    backgroundColor: metric.positive ? "#dcfce7" : "#fee2e2",
                    color: metric.positive ? "#16a34a" : "#dc2626"
                  }}
                >
                  {metric.change}
                </span>
              </div>
              <p className="text-2xl font-semibold mb-1">
                {metric.value}
              </p>
              <p className="text-sm text-gray-600">{metric.label}</p>
            </div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Projects Chart */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Project Activity</h3>
                <p className="text-sm text-gray-500 mt-1">Projects created over time</p>
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
          </div>
          <div className="p-6">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={usageData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    fontSize: "14px"
                  }}
                  cursor={{ fill: '#f9fafb' }}
                />
                <Bar 
                  dataKey="projects" 
                  fill="#3b82f6" 
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Exports Chart */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Export Activity</h3>
                <p className="text-sm text-gray-500 mt-1">Total exports per month</p>
              </div>
              <Download className="w-5 h-5 text-green-500" />
            </div>
          </div>
          <div className="p-6">
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={usageData}>
                <defs>
                  <linearGradient id="colorExports" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    fontSize: "14px"
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="exports" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  fill="url(#colorExports)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Storage Usage Chart */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Storage Usage</h3>
                <p className="text-sm text-gray-500 mt-1">Storage consumption trend</p>
              </div>
              <Image className="w-5 h-5 text-purple-500" />
            </div>
          </div>
          <div className="p-6">
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={usageData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  axisLine={false}
                  tickLine={false}
                  label={{ value: 'GB', angle: -90, position: 'insideLeft', style: { fill: '#6b7280', fontSize: 12 } }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    fontSize: "14px"
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="storage" 
                  stroke="#8b5cf6" 
                  strokeWidth={2}
                  dot={{ fill: "#8b5cf6", r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Usage Chart */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Monthly Usage</h3>
                <p className="text-sm text-gray-500 mt-1">Infographics generated per month</p>
              </div>
              <TrendingUp className="w-5 h-5 text-amber-500" />
            </div>
          </div>
          <div className="p-6">
            {usageData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={usageData}>
                  <defs>
                    <linearGradient id="colorCredits" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    axisLine={{ stroke: '#e5e7eb' }}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: "14px"
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#f59e0b" 
                    strokeWidth={2}
                    fill="url(#colorCredits)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-240 text-gray-500">
                No usage data available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cost Breakdown by AI Model */}
      {costBreakdown.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Cost Breakdown by AI Model</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>
                  Export CSV
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleExport('json')}>
                  Export JSON
                </Button>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {costBreakdown.map((item) => (
                <div key={item.aiModel} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{item.aiModel}</p>
                    <p className="text-sm text-gray-600">{item.count} infographics</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${item.totalCostUsd.toFixed(2)}</p>
                    <p className="text-sm text-gray-600">${item.averageCostUsd.toFixed(4)} avg</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Credit Usage Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="font-semibold">Usage History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tool
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Purchased Credits
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plan Credits
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {creditUsageData.length > 0 ? (
                creditUsageData.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100">
                        {row.type}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm text-gray-600">{row.date}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">{row.tool}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm text-gray-900">{row.amount}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm text-gray-600">{row.purchased}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm text-gray-600">{row.plan}</p>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No usage history available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Show:</span>
            <Select value={entriesPerPage} onValueChange={setEntriesPerPage}>
              <SelectTrigger className="w-20 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-sm text-gray-500">
            {creditUsageData.length > 0 ? `Showing 1 - ${creditUsageData.length} of ${usageHistory.length}` : 'No data'}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled>
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
