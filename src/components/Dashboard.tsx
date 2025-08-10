import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import clsx from 'clsx';
import AdaptiveHealthScore from './AdaptiveHealthScore.tsx';
import TestExplainer from './TestExplainer.tsx';

const Dashboard: React.FC = () => {
  const { data: status } = useQuery({
    queryKey: ['status'],
    queryFn: async () => {
      const res = await fetch('/api/status');
      return res.json();
    },
  });

  const { data: runs } = useQuery({
    queryKey: ['runs'],
    queryFn: async () => {
      const res = await fetch('/api/runs?limit=50');
      return res.json();
    },
  });

  const { data: sevenDayStats } = useQuery({
    queryKey: ['sevenDayStats'],
    queryFn: async () => {
      const res = await fetch('/api/stats/seven-day');
      return res.json();
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'GREEN': return 'bg-green-500';
      case 'YELLOW': return 'bg-yellow-500';
      case 'RED': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const latestRun = runs?.[0];

  const chartData = runs?.slice(0, 28).reverse().map((run: any) => ({
    timestamp: format(new Date(run.timestamp), 'MM/dd HH:mm'),
    correctness: run.correctness_score,
    ttftMedian: run.ttft_median,
    ttftP95: run.ttft_p95,
    tpsMedian: run.tokens_per_sec_median,
    tpsP95: run.tokens_per_sec_p95,
    outputTokens: run.output_tokens_median,
  })) || [];

  return (
    <div className="space-y-6">
      {/* Top Bar with clearer information */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">AI Model Performance Monitor</h1>
            <p className="text-blue-100">Tracking Claude Opus 4.1 capabilities over time</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-blue-100">Last tested</p>
            <p className="text-xl font-medium">
              {status?.lastRun ? format(new Date(status.lastRun), 'MMM dd, h:mm a') : 'Never'}
            </p>
            <button
              onClick={async () => {
                await fetch('/api/run', { method: 'POST' });
                alert('Test suite started - this will take 2-3 minutes');
              }}
              className="mt-2 px-6 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 font-medium"
            >
              Run Test Now
            </button>
          </div>
        </div>
      </div>
      
      {/* Health Score Card */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AdaptiveHealthScore
          current={{
            correctness: latestRun?.correctness_score || 0,
            ttft: latestRun?.ttft_median || 0,
            tokensPerSec: latestRun?.tokens_per_sec_median || 0,
            errorRate: latestRun?.error_rate || 0,
            outputTokens: latestRun?.output_tokens_median || 0,
          }}
          baseline={sevenDayStats}
          runCount={runs?.length || 0}
        />
        <TestExplainer />
      </div>

      {/* Simplified Metrics Cards */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold mb-4">Key Performance Metrics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <SimpleMetric
            title="Accuracy"
            value={`${latestRun?.correctness_score || 0}/4`}
            subtitle="correct answers"
            icon="🎯"
            good={latestRun?.correctness_score > 2}
            expected="3+/4"
          />
          <SimpleMetric
            title="Response Time"
            value={`${latestRun?.ttft_median?.toFixed(1) || '-'}s`}
            subtitle="to first word"
            icon="⚡"
            good={latestRun?.ttft_median < 2}
            expected="<2s"
          />
          <SimpleMetric
            title="Speed"
            value={`${latestRun?.tokens_per_sec_median?.toFixed(0) || '-'}`}
            subtitle="words/second"
            icon="🚀"
            good={latestRun?.tokens_per_sec_median > 5}
            expected="5+"
          />
          <SimpleMetric
            title="Reliability"
            value={`${((1 - (latestRun?.error_rate || 0)) * 100).toFixed(0)}%`}
            subtitle="success rate"
            icon="✅"
            good={latestRun?.error_rate === 0}
            expected="100%"
          />
        </div>
      </div>

      {/* Trend Charts */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold mb-2">Performance Trends</h3>
        <p className="text-sm text-gray-600 mb-4">
          Monitoring changes over time helps detect if the model's capabilities are degrading ("getting nerfed")
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ChartCard title="📊 Accuracy Over Time" subtitle="Higher is better (goal: 3+/4)">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" />
                <YAxis domain={[0, 4]} ticks={[0, 1, 2, 3, 4]} />
                <Tooltip />
                <Line type="monotone" dataKey="correctness" stroke="#10B981" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="⚡ Response Speed" subtitle="Lower is better (goal: <2 seconds)">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="ttftMedian" stroke="#3B82F6" strokeWidth={2} name="Response Time" dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>

      {/* Runs Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-medium">Recent Runs</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Correctness
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  TTFT
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  TPS
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Flags
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {runs?.slice(0, 10).map((run: any) => (
                <tr key={run.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {format(new Date(run.timestamp), 'MM/dd HH:mm')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={clsx(
                      'px-2 py-1 text-xs rounded-full text-white',
                      getStatusColor(run.status)
                    )}>
                      {run.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {run.correctness_score}/4
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {run.ttft_median?.toFixed(2)}s
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {run.tokens_per_sec_median?.toFixed(1)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {run.flags?.join(', ') || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <Link
                      to={`/run/${run.id}`}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const SimpleMetric: React.FC<{
  title: string;
  value: string;
  subtitle: string;
  icon: string;
  good: boolean;
  expected: string;
}> = ({ title, value, subtitle, icon, good, expected }) => {
  return (
    <div className="text-center">
      <div className="text-3xl mb-2">{icon}</div>
      <h4 className="font-medium text-gray-700">{title}</h4>
      <p className={clsx('text-2xl font-bold mt-1', good ? 'text-green-600' : 'text-orange-600')}>
        {value}
      </p>
      <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
      <p className="text-xs text-gray-400 mt-1">Expected: {expected}</p>
    </div>
  );
};

const MetricCard: React.FC<{
  title: string;
  current?: number;
  average?: number;
  suffix?: string;
  decimals?: number;
  multiplier?: number;
}> = ({ title, current, average, suffix = '', decimals = 0, multiplier = 1 }) => {
  const currentValue = current !== undefined ? (current * multiplier).toFixed(decimals) : '-';
  const avgValue = average !== undefined ? (average * multiplier).toFixed(decimals) : '-';
  
  const delta = current !== undefined && average !== undefined
    ? ((current - average) / average * 100).toFixed(1)
    : null;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      <p className="mt-2 text-3xl font-semibold text-gray-900">
        {currentValue}{suffix}
      </p>
      <p className="mt-2 text-sm text-gray-500">
        7-day avg: {avgValue}{suffix}
      </p>
      {delta !== null && (
        <p className={clsx(
          'mt-1 text-sm',
          parseFloat(delta) > 0 ? 'text-green-600' : 'text-red-600'
        )}>
          {parseFloat(delta) > 0 ? '+' : ''}{delta}%
        </p>
      )}
    </div>
  );
};

const ChartCard: React.FC<{ title: string; subtitle?: string; children: React.ReactNode }> = ({ title, subtitle, children }) => (
  <div>
    <h4 className="font-medium text-gray-700 mb-1">{title}</h4>
    {subtitle && <p className="text-xs text-gray-500 mb-3">{subtitle}</p>}
    {children}
  </div>
);

export default Dashboard;