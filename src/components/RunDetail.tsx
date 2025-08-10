import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import clsx from 'clsx';

const RunDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ['run', id],
    queryFn: async () => {
      const res = await fetch(`/api/runs/${id}`);
      return res.json();
    },
    enabled: !!id,
  });

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!data) {
    return <div className="p-6">Run not found</div>;
  }

  const { run, testCases } = data;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'GREEN': return 'bg-green-500';
      case 'YELLOW': return 'bg-yellow-500';
      case 'RED': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const groupedCases = testCases.reduce((acc: any, tc: any) => {
    if (!acc[tc.prompt_id]) {
      acc[tc.prompt_id] = [];
    }
    acc[tc.prompt_id].push(tc);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Run Details</h2>
        <Link to="/" className="text-blue-600 hover:text-blue-900">
          ← Back to Dashboard
        </Link>
      </div>

      {/* Run Summary */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium mb-4">Run Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-500">Run ID</p>
            <p className="font-mono text-sm">{run.id}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Timestamp</p>
            <p className="text-sm">{format(new Date(run.timestamp), 'yyyy-MM-dd HH:mm:ss')}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Status</p>
            <span className={clsx(
              'px-2 py-1 text-xs rounded-full text-white',
              getStatusColor(run.status)
            )}>
              {run.status}
            </span>
          </div>
          <div>
            <p className="text-sm text-gray-500">Correctness Score</p>
            <p className="text-sm font-medium">{run.correctness_score}/4</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-500">Model</p>
            <p className="text-sm">{run.model_id}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Temperature</p>
            <p className="text-sm">{run.temperature}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Top P</p>
            <p className="text-sm">{run.top_p}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Suite Version</p>
            <p className="text-sm">{run.suite_version}</p>
          </div>
        </div>

        {run.flags && run.flags.length > 0 && (
          <div className="mt-4">
            <p className="text-sm text-gray-500">Flags</p>
            <div className="mt-1 flex flex-wrap gap-2">
              {run.flags.map((flag: string) => (
                <span key={flag} className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                  {flag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Performance Metrics */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium mb-4">Performance Metrics (P4)</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricDisplay label="TTFT Median" value={run.ttft_median} unit="s" />
          <MetricDisplay label="TTFT P95" value={run.ttft_p95} unit="s" />
          <MetricDisplay label="Latency Median" value={run.latency_median} unit="s" />
          <MetricDisplay label="Latency P95" value={run.latency_p95} unit="s" />
          <MetricDisplay label="TPS Median" value={run.tokens_per_sec_median} />
          <MetricDisplay label="TPS P95" value={run.tokens_per_sec_p95} />
          <MetricDisplay label="Output Tokens" value={run.output_tokens_median} />
          <MetricDisplay label="Error Rate" value={run.error_rate} unit="%" multiplier={100} />
        </div>
      </div>

      {/* Test Cases */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium mb-4">Test Cases</h3>
        <div className="space-y-4">
          {Object.entries(groupedCases).map(([promptId, cases]: [string, any]) => (
            <div key={promptId} className="border rounded-lg p-4">
              <h4 className="font-medium mb-2">{promptId}</h4>
              <div className="space-y-2">
                {cases.map((tc: any) => (
                  <div key={tc.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-4">
                      <span className="text-gray-500">Rep {tc.replicate_number}</span>
                      <span className={clsx(
                        'px-2 py-1 rounded text-xs',
                        tc.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      )}>
                        {tc.success ? 'Success' : 'Failed'}
                      </span>
                      <span>Score: {tc.score}</span>
                    </div>
                    <div className="flex items-center space-x-4 text-gray-500">
                      {tc.ttft && <span>TTFT: {tc.ttft.toFixed(2)}s</span>}
                      {tc.total_latency && <span>Latency: {tc.total_latency.toFixed(2)}s</span>}
                      {tc.output_tokens && <span>Tokens: {tc.output_tokens}</span>}
                      {tc.output_hash && (
                        <span className="font-mono text-xs" title={tc.output_hash}>
                          Hash: {tc.output_hash.substring(0, 8)}...
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const MetricDisplay: React.FC<{
  label: string;
  value?: number;
  unit?: string;
  multiplier?: number;
}> = ({ label, value, unit = '', multiplier = 1 }) => (
  <div>
    <p className="text-sm text-gray-500">{label}</p>
    <p className="text-sm font-medium">
      {value !== undefined ? `${(value * multiplier).toFixed(2)}${unit}` : '-'}
    </p>
  </div>
);

export default RunDetail;