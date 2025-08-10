import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const AdminPanel: React.FC = () => {
  const queryClient = useQueryClient();
  const [config, setConfig] = useState({
    cacheBusting: false,
    storeRawOutputs: false,
    scheduleTimes: '09:00,21:00',
    timezone: 'America/Chicago',
    temperature: 0.1,
    topP: 0.3,
    maxTokensP4: 1200,
  });

  const { data: serverConfig } = useQuery({
    queryKey: ['config'],
    queryFn: async () => {
      const res = await fetch('/api/config');
      return res.json();
    },
  });

  useEffect(() => {
    if (serverConfig) {
      setConfig(serverConfig);
    }
  }, [serverConfig]);

  const updateConfig = useMutation({
    mutationFn: async (updates: any) => {
      const res = await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config'] });
      alert('Configuration updated successfully');
    },
  });

  const handleSave = () => {
    updateConfig.mutate(config);
  };

  const triggerRun = async () => {
    const res = await fetch('/api/run', { method: 'POST' });
    const data = await res.json();
    alert(data.message);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Admin Panel</h2>

      {/* Configuration Form */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium mb-4">Configuration</h3>
        
        <div className="space-y-4">
          {/* Cache Busting */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900">Cache Busting</label>
              <p className="text-sm text-gray-500">Add random nonce to prompts to prevent caching</p>
            </div>
            <button
              onClick={() => setConfig({ ...config, cacheBusting: !config.cacheBusting })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                config.cacheBusting ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                  config.cacheBusting ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Store Raw Outputs */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900">Store Raw Outputs</label>
              <p className="text-sm text-gray-500">Save full LLM outputs (increases storage usage)</p>
            </div>
            <button
              onClick={() => setConfig({ ...config, storeRawOutputs: !config.storeRawOutputs })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                config.storeRawOutputs ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                  config.storeRawOutputs ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Schedule Times */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Schedule Times (comma-separated)
            </label>
            <input
              type="text"
              value={config.scheduleTimes}
              onChange={(e) => setConfig({ ...config, scheduleTimes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="09:00,21:00"
            />
          </div>

          {/* Timezone */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Timezone
            </label>
            <select
              value={config.timezone}
              onChange={(e) => setConfig({ ...config, timezone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="America/Chicago">America/Chicago</option>
              <option value="America/New_York">America/New_York</option>
              <option value="America/Los_Angeles">America/Los_Angeles</option>
              <option value="Europe/London">Europe/London</option>
              <option value="Europe/Paris">Europe/Paris</option>
              <option value="Asia/Tokyo">Asia/Tokyo</option>
            </select>
          </div>

          {/* Temperature */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Temperature
            </label>
            <input
              type="number"
              value={config.temperature}
              onChange={(e) => setConfig({ ...config, temperature: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              min="0"
              max="1"
              step="0.1"
            />
          </div>

          {/* Top P */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Top P
            </label>
            <input
              type="number"
              value={config.topP}
              onChange={(e) => setConfig({ ...config, topP: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              min="0"
              max="1"
              step="0.1"
            />
          </div>

          {/* Max Tokens P4 */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Max Tokens for P4 (Long-form)
            </label>
            <input
              type="number"
              value={config.maxTokensP4}
              onChange={(e) => setConfig({ ...config, maxTokensP4: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              min="100"
              max="4000"
              step="100"
            />
          </div>
        </div>

        <div className="mt-6 flex space-x-4">
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Save Configuration
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium mb-4">Actions</h3>
        <div className="space-y-4">
          <button
            onClick={triggerRun}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Trigger Manual Run
          </button>
        </div>
      </div>

      {/* Alert Thresholds Info */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium mb-4">Alert Thresholds</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Quality Regression:</span>
            <span className="font-mono">Correctness -2 pts vs 7-day mean</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Performance (TPS):</span>
            <span className="font-mono">Median TPS &lt; 50% of 7-day mean</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Performance (Latency):</span>
            <span className="font-mono">P95 latency &gt; 2x 7-day mean</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Output Cap:</span>
            <span className="font-mono">Median tokens &lt; 75% of 7-day mean</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Status RED:</span>
            <span className="font-mono">≥2 flags triggered</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Status YELLOW:</span>
            <span className="font-mono">1 flag triggered</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;