'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import dynamic from 'next/dynamic';

// Dynamic imports for charts
const PerformanceTrendChart = dynamic(
  () => import('./EnhancedCharts').then(mod => mod.PerformanceTrendChart),
  { ssr: false }
);

const ScoreDistributionChart = dynamic(
  () => import('./EnhancedCharts').then(mod => mod.ScoreDistributionChart),
  { ssr: false }
);

const TestBreakdownChart = dynamic(
  () => import('./EnhancedCharts').then(mod => mod.TestBreakdownChart),
  { ssr: false }
);

const HeatmapChart = dynamic(
  () => import('./EnhancedCharts').then(mod => mod.HeatmapChart),
  { ssr: false }
);

interface RecentTest {
  id: string;
  timestamp: string;
  score: number;
  region: string;
  version: string;
  details: {
    P1: number;
    P2: number;
    P3: number;
    P4: number;
    P5: number;
  };
}

interface GlobalStats {
  totalRuns: number;
  uniqueUsers: number;
  avgScore: number;
  recentTests: RecentTest[];
  scoreDistribution: Array<{
    range: string;
    count: number;
  }>;
  testBreakdown: Array<{
    test: string;
    avgScore: number;
    passRate: number;
  }>;
  hourlyActivity: Array<{
    hour: number;
    day: string;
    count: number;
  }>;
}

export default function EnhancedDashboard() {
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchStats();
    if (autoRefresh) {
      const interval = setInterval(fetchStats, 10000); // Update every 10 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  async function fetchStats() {
    try {
      const response = await fetch('/api/stats/enhanced');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading || !stats) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4">Loading performance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
                Claude NerfDetector
              </h1>
              <p className="text-gray-400 mt-1">Community Performance Monitoring</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-4 py-2 rounded-lg ${
                  autoRefresh ? 'bg-green-600' : 'bg-gray-600'
                } hover:opacity-80 transition-opacity`}
              >
                {autoRefresh ? '🔄 Auto-refresh ON' : '⏸️ Auto-refresh OFF'}
              </button>
              <div className="text-sm text-gray-400">
                {stats.totalRuns.toLocaleString()} tests • {stats.uniqueUsers.toLocaleString()} users
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="text-sm text-gray-400">Global Average Score</div>
            <div className="text-3xl font-bold mt-2">
              {(stats.avgScore * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500 mt-1">Out of 100 points</div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="text-sm text-gray-400">Tests Today</div>
            <div className="text-3xl font-bold mt-2">
              {stats.recentTests.filter(t => 
                new Date(t.timestamp).toDateString() === new Date().toDateString()
              ).length}
            </div>
            <div className="text-xs text-gray-500 mt-1">Last 24 hours</div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="text-sm text-gray-400">Best Score Today</div>
            <div className="text-3xl font-bold mt-2">
              {Math.max(...stats.recentTests.map(t => t.score), 0).toFixed(0)}%
            </div>
            <div className="text-xs text-gray-500 mt-1">Highest achievement</div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="text-sm text-gray-400">Active Regions</div>
            <div className="text-3xl font-bold mt-2">
              {new Set(stats.recentTests.map(t => t.region)).size}
            </div>
            <div className="text-xs text-gray-500 mt-1">Geographic diversity</div>
          </div>
        </div>

        {/* Live Feed of Recent Tests */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-8">
          <h2 className="text-xl font-semibold mb-4">🔴 Live Test Results</h2>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {stats.recentTests.slice(0, 10).map((test) => (
              <div key={test.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className={`text-2xl ${test.score >= 80 ? 'text-green-500' : test.score >= 60 ? 'text-yellow-500' : 'text-red-500'}`}>
                    {test.score}%
                  </div>
                  <div>
                    <div className="text-sm">
                      P1:{test.details.P1} P2:{test.details.P2} P3:{test.details.P3} P4:{test.details.P4} P5:{test.details.P5}
                    </div>
                    <div className="text-xs text-gray-400">
                      {test.region} • {format(new Date(test.timestamp), 'HH:mm:ss')}
                    </div>
                  </div>
                </div>
                <a 
                  href={`/run/${test.id}`}
                  className="text-blue-400 hover:text-blue-300 text-sm"
                >
                  View →
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Score Distribution */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-semibold mb-4">Score Distribution</h2>
            <ScoreDistributionChart data={stats.scoreDistribution} />
          </div>

          {/* Test Breakdown */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-semibold mb-4">Test Performance Breakdown</h2>
            <TestBreakdownChart data={stats.testBreakdown} />
          </div>

          {/* Performance Trend */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-semibold mb-4">24-Hour Performance Trend</h2>
            <PerformanceTrendChart data={stats.recentTests} />
          </div>

          {/* Activity Heatmap */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-semibold mb-4">Weekly Activity Heatmap</h2>
            <HeatmapChart data={stats.hourlyActivity} />
          </div>
        </div>

        {/* Test Difficulty Analysis */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mt-8">
          <h2 className="text-xl font-semibold mb-4">Test Difficulty Analysis</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {['P1', 'P2', 'P3', 'P4', 'P5'].map((test, idx) => {
              const testData = stats.testBreakdown[idx];
              return (
                <div key={test} className="text-center">
                  <div className="text-lg font-semibold">{test}</div>
                  <div className="text-3xl font-bold mt-2 mb-1">
                    {testData ? `${testData.avgScore}%` : '0%'}
                  </div>
                  <div className="text-xs text-gray-400">
                    {test === 'P1' && 'Algorithm'}
                    {test === 'P2' && 'Parsing'}
                    {test === 'P3' && 'Bug Fix'}
                    {test === 'P4' && 'CLI Gen'}
                    {test === 'P5' && 'Math'}
                  </div>
                  <div className="mt-2 h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${
                        testData?.avgScore >= 70 ? 'bg-green-500' :
                        testData?.avgScore >= 40 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${testData?.avgScore || 0}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mt-8">
          <h2 className="text-xl font-semibold mb-4">🏆 Today's Top Performers</h2>
          <div className="space-y-2">
            {stats.recentTests
              .filter(t => new Date(t.timestamp).toDateString() === new Date().toDateString())
              .sort((a, b) => b.score - a.score)
              .slice(0, 5)
              .map((test, idx) => (
                <div key={test.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="text-2xl">
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                    </div>
                    <div>
                      <div className="font-semibold">{test.score}% Score</div>
                      <div className="text-xs text-gray-400">
                        {test.region} • {format(new Date(test.timestamp), 'HH:mm')}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-400">
                    v{test.version}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}