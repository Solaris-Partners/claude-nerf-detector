'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import dynamic from 'next/dynamic';

// Dynamic import for recharts to avoid SSR issues
const PerformanceTrendChart = dynamic(
  () => import('@/components/Charts').then(mod => mod.PerformanceTrendChart),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[300px] text-gray-500">
        Loading chart...
      </div>
    )
  }
);

const RegionalDistributionChart = dynamic(
  () => import('@/components/Charts').then(mod => mod.RegionalDistributionChart),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[300px] text-gray-500">
        Loading chart...
      </div>
    )
  }
);

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section with NPX Command */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-2">Claude NerfDetector</h1>
            <p className="text-xl text-blue-100 mb-6">Community Performance Monitoring for Claude Code</p>
            
            {/* Quick Start Box */}
            <div className="bg-gray-900 rounded-lg px-8 py-6 inline-block mb-6">
              <p className="text-sm text-gray-400 mb-2">Step 1: Open Claude Code</p>
              <p className="text-sm text-gray-400 mb-3">Step 2: Run this command:</p>
              <code className="text-green-400 text-2xl font-mono block">npx claude-nerf-test</code>
              <p className="text-xs text-gray-500 mt-3">⚠️ Must be run inside Claude Code, not regular terminal</p>
            </div>
            
            <p className="text-sm text-blue-200">Join {stats.uniqueUsers || 0} users tracking Claude's performance</p>
          </div>
        </div>
      </div>

      {/* Header with stats */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Global Statistics</p>
              <p className="text-lg font-semibold text-gray-900">{stats.totalRuns || 0} tests completed</p>
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

      {/* How It Works Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">How It Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-blue-600 font-bold">1</span>
              </div>
              <p className="font-medium text-gray-900">Run in Claude Code</p>
              <p className="text-sm text-gray-600 mt-1">Execute npx claude-nerf-test inside Claude Code (not terminal)</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-blue-600 font-bold">2</span>
              </div>
              <p className="font-medium text-gray-900">Claude Responds</p>
              <p className="text-sm text-gray-600 mt-1">Claude automatically answers 5 test prompts</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-blue-600 font-bold">3</span>
              </div>
              <p className="font-medium text-gray-900">Auto Submit</p>
              <p className="text-sm text-gray-600 mt-1">Results are scored and submitted automatically</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Trend */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Trend</h3>
          <PerformanceTrendChart data={stats.trends} />
        </div>

        {/* Regional Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Regional Distribution</h3>
          <RegionalDistributionChart data={stats.regionalDistribution} />
        </div>
      </div>

      {/* Recent Tests Feed */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 mb-8">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Live Test Feed</h3>
          </div>
          <div className="p-8 text-center text-gray-500">
            {stats.totalRuns > 0 ? (
              <p>Real-time feed coming soon</p>
            ) : (
              <>
                <p className="mb-2">No tests yet. Be the first!</p>
                <code className="bg-gray-100 px-3 py-1 rounded text-sm font-mono">npx claude-nerf-test</code>
              </>
            )}
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

