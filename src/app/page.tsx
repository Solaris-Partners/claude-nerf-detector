'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface GlobalStats {
  totalRuns: number;
  uniqueUsers: number;
  avgScore: number;
  avgTtft: number;
  avgTokensPerSecond: number;
  avgErrorRate: number;
  trends: Array<{
    timestamp: string;
    avgScore: number;
    avgTtft: number;
    totalRuns: number;
  }>;
  regionalDistribution: Array<{
    region: string;
    count: number;
    percentage: number;
  }>;
}

export default function Dashboard() {
  const [stats, setStats] = useState<GlobalStats>({
    totalRuns: 0,
    uniqueUsers: 0,
    avgScore: 0,
    avgTtft: 0,
    avgTokensPerSecond: 0,
    avgErrorRate: 0,
    trends: [],
    regionalDistribution: []
  });
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('7d');
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [period]);

  async function fetchStats() {
    try {
      const response = await fetch(`/api/stats/global?period=${period}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading performance data...</p>
        </div>
      </div>
    );
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Claude NerfDetector</h1>
              <p className="text-gray-600 mt-1">Community Performance Monitoring</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Last updated</p>
              <p className="text-gray-900">{format(lastUpdate, 'HH:mm:ss')}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Period Selector */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
          {['24h', '7d', '30d'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                period === p
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              {p === '24h' ? '24 Hours' : p === '7d' ? '7 Days' : '30 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Tests"
            value={stats.totalRuns.toLocaleString()}
            subtitle={`${stats.uniqueUsers} unique users`}
            trend="+12%"
          />
          <MetricCard
            title="Average Score"
            value={`${stats.avgScore.toFixed(1)}/5`}
            subtitle={`${(stats.avgScore / 5 * 100).toFixed(0)}% success rate`}
            trend={stats.avgScore > 2.5 ? "+5%" : "-3%"}
          />
          <MetricCard
            title="Response Time"
            value={`${(stats.avgTtft / 1000).toFixed(1)}s`}
            subtitle="Time to first token"
            trend="-8%"
          />
          <MetricCard
            title="Generation Speed"
            value={`${stats.avgTokensPerSecond?.toFixed(0) || 'N/A'}`}
            subtitle="Tokens per second"
            trend="+15%"
          />
        </div>
      </div>

      {/* Charts */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Trend */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.trends || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="timestamp" 
                tickFormatter={(value) => value ? format(new Date(value), 'MMM dd') : ''}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(value) => value ? format(new Date(value as string), 'MMM dd HH:mm') : ''}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="avgScore" 
                stroke="#0088FE" 
                name="Avg Score"
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                dataKey="totalRuns" 
                stroke="#00C49F" 
                name="Total Runs"
                strokeWidth={2}
                yAxisId="right"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Regional Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Regional Distribution</h3>
          {stats.regionalDistribution && stats.regionalDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.regionalDistribution.slice(0, 5)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ region, percentage }) => `${region} (${percentage.toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {stats.regionalDistribution.slice(0, 5).map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              No regional data available yet
            </div>
          )}
        </div>
      </div>

      {/* Recent Tests Feed */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 mb-8">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Live Test Feed</h3>
          </div>
          <div className="divide-y">
            {/* This would be populated with real-time data via WebSocket */}
            <TestFeedItem
              time="2 minutes ago"
              score={3}
              region="United States"
              percentile={68}
            />
            <TestFeedItem
              time="5 minutes ago"
              score={4}
              region="Germany"
              percentile={85}
            />
            <TestFeedItem
              time="8 minutes ago"
              score={2}
              region="Japan"
              percentile={42}
            />
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-4">
              Join the Community Testing
            </h2>
            <p className="text-blue-100 mb-6">
              Run tests directly in Claude Code and contribute to global performance tracking
            </p>
            <code className="bg-gray-900 text-green-400 px-4 py-2 rounded font-mono text-lg">
              npx claude-nerf-test
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, subtitle, trend }: any) {
  const isPositive = trend?.startsWith('+');
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <p className="text-sm font-medium text-gray-600">{title}</p>
      <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
      <div className="flex justify-between items-end mt-2">
        <p className="text-sm text-gray-500">{subtitle}</p>
        {trend && (
          <span className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}

function TestFeedItem({ time, score, region, percentile }: any) {
  return (
    <div className="px-6 py-4 hover:bg-gray-50 transition-colors">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-gray-500">{time}</p>
          <p className="font-medium text-gray-900">
            Score: {score}/5 • Better than {percentile}% of users
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600">{region}</p>
        </div>
      </div>
    </div>
  );
}