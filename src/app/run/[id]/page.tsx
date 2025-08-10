'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';

interface TestRun {
  id: string;
  anonymous_user_id: string;
  claude_version: string;
  test_score: number;
  total_tests: number;
  ttft_ms?: number;
  tokens_per_second?: number;
  avg_output_length?: number;
  error_rate?: number;
  region?: string;
  timestamp: string;
  test_details?: TestDetail[];
}

interface TestDetail {
  test_id: string;
  test_name: string;
  passed: boolean;
  response_time_ms?: number;
  output_quality?: number;
  error_message?: string;
}

export default function RunPage() {
  const params = useParams();
  const [run, setRun] = useState<TestRun | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRun();
  }, [params.id]);

  async function fetchRun() {
    try {
      const response = await fetch(`/api/run/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setRun(data);
      }
    } catch (error) {
      console.error('Failed to fetch run:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!run) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Test Run Not Found</h2>
          <p className="mt-2 text-gray-600">This test run may have been deleted or never existed.</p>
          <a href="/" className="mt-4 inline-block text-blue-600 hover:text-blue-700">
            ← Back to Dashboard
          </a>
        </div>
      </div>
    );
  }

  const successRate = (run.test_score / run.total_tests) * 100;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-start">
            <div>
              <a href="/" className="text-blue-600 hover:text-blue-700 text-sm mb-2 inline-block">
                ← Back to Dashboard
              </a>
              <h1 className="text-2xl font-bold text-gray-900">Test Run Details</h1>
              <p className="text-gray-600 mt-1">
                {format(new Date(run.timestamp), 'MMMM dd, yyyy HH:mm:ss')}
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-gray-900">
                {run.test_score}/{run.total_tests}
              </div>
              <p className="text-sm text-gray-600">{successRate.toFixed(0)}% success</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <MetricBox
            label="Response Time"
            value={run.ttft_ms ? `${(run.ttft_ms / 1000).toFixed(2)}s` : 'N/A'}
          />
          <MetricBox
            label="Tokens/sec"
            value={run.tokens_per_second?.toFixed(0) || 'N/A'}
          />
          <MetricBox
            label="Output Length"
            value={run.avg_output_length?.toString() || 'N/A'}
          />
          <MetricBox
            label="Error Rate"
            value={run.error_rate ? `${(run.error_rate * 100).toFixed(1)}%` : '0%'}
          />
        </div>

        {/* Test Details */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Individual Test Results</h2>
          </div>
          <div className="divide-y">
            {run.test_details?.map((test) => (
              <div key={test.test_id} className="px-6 py-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <span className={`text-2xl mr-3 ${test.passed ? '✅' : '❌'}`}>
                      {test.passed ? '✅' : '❌'}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900">
                        {test.test_name} ({test.test_id})
                      </p>
                      {test.error_message && (
                        <p className="text-sm text-red-600 mt-1">{test.error_message}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-600">
                    {test.response_time_ms && (
                      <p>{(test.response_time_ms / 1000).toFixed(2)}s</p>
                    )}
                    {test.output_quality !== undefined && (
                      <p>Quality: {test.output_quality}%</p>
                    )}
                  </div>
                </div>
              </div>
            )) || (
              <div className="px-6 py-8 text-center text-gray-500">
                No detailed test results available
              </div>
            )}
          </div>
        </div>

        {/* Metadata */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Test Environment</h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Claude Version</dt>
              <dd className="mt-1 text-sm text-gray-900">{run.claude_version}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Region</dt>
              <dd className="mt-1 text-sm text-gray-900">{run.region || 'Unknown'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Run ID</dt>
              <dd className="mt-1 text-sm text-gray-900 font-mono">{run.id}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">User ID</dt>
              <dd className="mt-1 text-sm text-gray-900 font-mono">
                {run.anonymous_user_id.substring(0, 16)}...
              </dd>
            </div>
          </dl>
        </div>

        {/* Share */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 mb-4">Share this test run:</p>
          <code className="bg-gray-100 px-4 py-2 rounded text-sm">
            {typeof window !== 'undefined' ? window.location.href : ''}
          </code>
        </div>
      </div>
    </div>
  );
}

function MetricBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <p className="text-sm text-gray-600">{label}</p>
      <p className="text-xl font-semibold text-gray-900 mt-1">{value}</p>
    </div>
  );
}