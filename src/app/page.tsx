'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import dynamic from 'next/dynamic';

// Dynamic imports for charts
const PerformanceTrendChart = dynamic(
  () => import('@/components/PerformanceCharts').then(mod => mod.PerformanceTrendChart),
  { ssr: false }
);

const TestBreakdownChart = dynamic(
  () => import('@/components/PerformanceCharts').then(mod => mod.TestBreakdownChart),
  { ssr: false }
);

const PerformanceHeatmap = dynamic(
  () => import('@/components/PerformanceCharts').then(mod => mod.PerformanceHeatmap),
  { ssr: false }
);

const MovingAverageChart = dynamic(
  () => import('@/components/PerformanceCharts').then(mod => mod.MovingAverageChart),
  { ssr: false }
);

const DistributionHistogram = dynamic(
  () => import('@/components/PerformanceCharts').then(mod => mod.DistributionHistogram),
  { ssr: false }
);

interface PerformanceStats {
  current: {
    avgScore: number;
    testCount: number;
    percentile: number;
    trend: 'up' | 'down' | 'stable';
    changePercent: number;
  };
  historical: {
    yesterday: number;
    lastWeek: number;
    lastMonth: number;
  };
  timeline: Array<{
    date: string;
    avgScore: number;
    minScore: number;
    maxScore: number;
    count: number;
  }>;
  testBreakdown: Array<{
    testId: string;
    name: string;
    currentAvg: number;
    historicalAvg: number;
    change: number;
  }>;
  recentTests: Array<{
    id: string;
    timestamp: string;
    score: number;
    version: string;
    region: string;
  }>;
  distribution: Array<{
    range: string;
    current: number;
    historical: number;
  }>;
}

export default function PerformanceDashboard() {
  const [stats, setStats] = useState<PerformanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchStats();
    if (autoRefresh) {
      const interval = setInterval(fetchStats, 15000);
      return () => clearInterval(interval);
    }
  }, [timeRange, autoRefresh]);

  async function fetchStats() {
    try {
      const response = await fetch(`/api/stats/performance?range=${timeRange}`);
      const data = await response.json();
      
      if (response.ok) {
        setStats(data);
      } else {
        // Log the error details for debugging
        console.error('API returned error:', data);
        // Don't set stats to null, keep previous data if available
        if (!stats) {
          console.error('No cached stats available, API error:', data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading || !stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-pulse">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-xl">Analyzing Claude Performance...</p>
          </div>
        </div>
      </div>
    );
  }

  const performanceColor = stats.current.trend === 'up' ? 'text-green-400' : 
                          stats.current.trend === 'down' ? 'text-red-400' : 
                          'text-yellow-400';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      {/* Header */}
      <header className="bg-black/30 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-white flex items-center gap-3">
                🎯 Claude NerfDetector
                <span className="text-sm bg-blue-500/20 px-3 py-1 rounded-full border border-blue-500/50">
                  v3.0
                </span>
              </h1>
              <p className="text-gray-400 mt-2">Real-time Performance Monitoring</p>
            </div>
            <div className="flex items-center gap-4">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="bg-white/10 border border-white/20 text-white px-4 py-2 rounded-lg"
              >
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-4 py-2 rounded-lg transition-all ${
                  autoRefresh 
                    ? 'bg-green-500/20 border border-green-500/50 text-green-400' 
                    : 'bg-gray-500/20 border border-gray-500/50 text-gray-400'
                }`}
              >
                {autoRefresh ? '🔄 Live' : '⏸ Paused'}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Current Performance Hero Section */}
        <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-2xl p-8 mb-8 backdrop-blur-sm border border-white/10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Main Score */}
            <div className="text-center">
              <div className="text-sm text-gray-400 mb-2">Current Performance</div>
              <div className="text-6xl font-bold text-white">
                {stats.current.avgScore.toFixed(1)}
                <span className="text-2xl text-gray-400">/100</span>
              </div>
              <div className={`flex items-center justify-center gap-2 mt-2 ${performanceColor}`}>
                {stats.current.trend === 'up' ? '📈' : stats.current.trend === 'down' ? '📉' : '➡️'}
                <span className="text-lg font-semibold">
                  {stats.current.changePercent > 0 ? '+' : ''}{stats.current.changePercent.toFixed(1)}%
                </span>
                <span className="text-sm text-gray-400">vs yesterday</span>
              </div>
            </div>

            {/* Percentile */}
            <div className="text-center">
              <div className="text-sm text-gray-400 mb-2">Global Ranking</div>
              <div className="text-6xl font-bold text-white">
                {stats.current.percentile}
                <span className="text-2xl text-gray-400">th</span>
              </div>
              <div className="text-sm text-gray-400 mt-2">
                percentile ({stats.current.testCount} tests today)
              </div>
            </div>

            {/* Status Indicator */}
            <div className="text-center">
              <div className="text-sm text-gray-400 mb-2">System Status</div>
              <div className="text-4xl mb-2">
                {stats.current.avgScore >= 80 ? '✅' : 
                 stats.current.avgScore >= 70 ? '⚠️' : '🚨'}
              </div>
              <div className="text-lg text-white">
                {stats.current.avgScore >= 80 ? 'Optimal' : 
                 stats.current.avgScore >= 70 ? 'Degraded' : 'Critical'}
              </div>
            </div>
          </div>
        </div>

        {/* Historical Comparison Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-sm text-gray-400">vs Yesterday</div>
                <div className="text-2xl font-bold text-white mt-1">
                  {stats.historical.yesterday.toFixed(1)}
                </div>
              </div>
              <div className={`text-lg font-semibold ${
                stats.current.avgScore > stats.historical.yesterday ? 'text-green-400' : 
                stats.current.avgScore < stats.historical.yesterday ? 'text-red-400' : 
                'text-gray-400'
              }`}>
                {stats.current.avgScore > stats.historical.yesterday ? '↑' : 
                 stats.current.avgScore < stats.historical.yesterday ? '↓' : '='} 
                {Math.abs(stats.current.avgScore - stats.historical.yesterday).toFixed(1)}
              </div>
            </div>
          </div>

          <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-sm text-gray-400">vs Last Week</div>
                <div className="text-2xl font-bold text-white mt-1">
                  {stats.historical.lastWeek.toFixed(1)}
                </div>
              </div>
              <div className={`text-lg font-semibold ${
                stats.current.avgScore > stats.historical.lastWeek ? 'text-green-400' : 
                stats.current.avgScore < stats.historical.lastWeek ? 'text-red-400' : 
                'text-gray-400'
              }`}>
                {stats.current.avgScore > stats.historical.lastWeek ? '↑' : 
                 stats.current.avgScore < stats.historical.lastWeek ? '↓' : '='} 
                {Math.abs(stats.current.avgScore - stats.historical.lastWeek).toFixed(1)}
              </div>
            </div>
          </div>

          <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-sm text-gray-400">vs Last Month</div>
                <div className="text-2xl font-bold text-white mt-1">
                  {stats.historical.lastMonth.toFixed(1)}
                </div>
              </div>
              <div className={`text-lg font-semibold ${
                stats.current.avgScore > stats.historical.lastMonth ? 'text-green-400' : 
                stats.current.avgScore < stats.historical.lastMonth ? 'text-red-400' : 
                'text-gray-400'
              }`}>
                {stats.current.avgScore > stats.historical.lastMonth ? '↑' : 
                 stats.current.avgScore < stats.historical.lastMonth ? '↓' : '='} 
                {Math.abs(stats.current.avgScore - stats.historical.lastMonth).toFixed(1)}
              </div>
            </div>
          </div>
        </div>

        {/* Main Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Performance Timeline */}
          <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <h2 className="text-xl font-semibold text-white mb-4">Performance Timeline</h2>
            <PerformanceTrendChart data={stats.timeline} />
          </div>

          {/* Moving Average */}
          <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <h2 className="text-xl font-semibold text-white mb-4">7-Day Moving Average</h2>
            <MovingAverageChart data={stats.timeline} />
          </div>

          {/* Test-by-Test Breakdown */}
          <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <h2 className="text-xl font-semibold text-white mb-4">Test Performance Changes</h2>
            <TestBreakdownChart data={stats.testBreakdown} />
          </div>

          {/* Score Distribution */}
          <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <h2 className="text-xl font-semibold text-white mb-4">Score Distribution Shift</h2>
            <DistributionHistogram data={stats.distribution} />
          </div>
        </div>

        {/* Performance Heatmap */}
        <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-white/10 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Performance Heatmap (Last 30 Days)</h2>
          <PerformanceHeatmap data={stats.timeline} />
        </div>

        {/* Recent Tests Feed */}
        <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-white/10">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <span className="animate-pulse text-red-500">●</span> Live Test Feed
          </h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {stats.recentTests.map((test) => (
              <div key={test.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`text-3xl font-bold ${
                    test.score >= 80 ? 'text-green-400' : 
                    test.score >= 70 ? 'text-yellow-400' : 
                    'text-red-400'
                  }`}>
                    {test.score}
                  </div>
                  <div>
                    <div className="text-white">
                      {test.version} • {test.region}
                    </div>
                    <div className="text-xs text-gray-400">
                      {format(new Date(test.timestamp), 'HH:mm:ss')}
                    </div>
                  </div>
                </div>
                <a 
                  href={`/run/${test.id}`}
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                >
                  View →
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-8 text-center">
          <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl p-6 border border-white/20">
            <h3 className="text-xl font-semibold text-white mb-2">Test Claude Now</h3>
            <p className="text-gray-400 mb-4">Run the test in Claude Code to contribute to performance tracking</p>
            <code className="bg-black/50 px-4 py-2 rounded-lg text-blue-400 font-mono">
              npx claude-nerf-test@latest claude
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}