'use client';

import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';

// Performance Timeline with min/max bands
export function PerformanceTrendChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis 
          dataKey="date" 
          stroke="#9ca3af"
          tick={{ fontSize: 12 }}
          tickFormatter={(value) => new Date(value).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
        />
        <YAxis stroke="#9ca3af" domain={[0, 100]} />
        <Tooltip
          contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
          labelStyle={{ color: '#9ca3af' }}
          formatter={(value: any) => [`${value.toFixed(1)}`, '']}
        />
        <Area
          type="monotone"
          dataKey="maxScore"
          stroke="none"
          fill="#10b981"
          fillOpacity={0.2}
          stackId="1"
        />
        <Area
          type="monotone"
          dataKey="minScore"
          stroke="none"
          fill="#ef4444"
          fillOpacity={0.2}
          stackId="2"
        />
        <Line
          type="monotone"
          dataKey="avgScore"
          stroke="#3b82f6"
          strokeWidth={3}
          dot={false}
        />
        <ReferenceLine y={80} stroke="#10b981" strokeDasharray="5 5" />
        <ReferenceLine y={70} stroke="#f59e0b" strokeDasharray="5 5" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// Moving Average Chart
export function MovingAverageChart({ data }: { data: any[] }) {
  // Calculate 7-day moving average
  const movingAvgData = data.map((item, index) => {
    const start = Math.max(0, index - 6);
    const subset = data.slice(start, index + 1);
    const avg = subset.reduce((sum, d) => sum + d.avgScore, 0) / subset.length;
    return {
      ...item,
      movingAvg: avg,
    };
  });

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={movingAvgData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis 
          dataKey="date" 
          stroke="#9ca3af"
          tick={{ fontSize: 12 }}
          tickFormatter={(value) => new Date(value).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
        />
        <YAxis stroke="#9ca3af" domain={[60, 100]} />
        <Tooltip
          contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
          labelStyle={{ color: '#9ca3af' }}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="avgScore"
          stroke="#6b7280"
          strokeWidth={1}
          dot={false}
          name="Daily Average"
          strokeDasharray="3 3"
        />
        <Line
          type="monotone"
          dataKey="movingAvg"
          stroke="#3b82f6"
          strokeWidth={3}
          dot={false}
          name="7-Day Average"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// Test Breakdown Comparison
export function TestBreakdownChart({ data }: { data: any[] }) {
  const chartData = data.map(item => ({
    test: item.name || item.testId,
    Current: item.currentAvg,
    Historical: item.historicalAvg,
    change: item.change,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis dataKey="test" stroke="#9ca3af" />
        <YAxis stroke="#9ca3af" domain={[0, 100]} />
        <Tooltip
          contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
          labelStyle={{ color: '#9ca3af' }}
        />
        <Legend />
        <Bar dataKey="Historical" fill="#6b7280" />
        <Bar dataKey="Current" fill="#3b82f6">
          {chartData.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={entry.change > 0 ? '#10b981' : entry.change < 0 ? '#ef4444' : '#3b82f6'} 
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// Score Distribution Histogram
export function DistributionHistogram({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis dataKey="range" stroke="#9ca3af" />
        <YAxis stroke="#9ca3af" />
        <Tooltip
          contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
          labelStyle={{ color: '#9ca3af' }}
        />
        <Legend />
        <Bar dataKey="historical" fill="#6b7280" name="Historical" />
        <Bar dataKey="current" fill="#3b82f6" name="Current" />
      </BarChart>
    </ResponsiveContainer>
  );
}

// Performance Heatmap
export function PerformanceHeatmap({ data }: { data: any[] }) {
  // Transform data for heatmap visualization
  const heatmapData = data.map(item => {
    const score = item.avgScore;
    const color = score >= 80 ? '#10b981' : 
                  score >= 70 ? '#f59e0b' : 
                  score >= 60 ? '#fb923c' : '#ef4444';
    return {
      date: new Date(item.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
      score,
      color,
      count: item.count,
    };
  });

  return (
    <div className="w-full">
      <div className="flex gap-1 flex-wrap">
        {heatmapData.map((day, idx) => (
          <div
            key={idx}
            className="relative group"
            style={{ width: '30px', height: '30px' }}
          >
            <div
              className="w-full h-full rounded"
              style={{ backgroundColor: day.color, opacity: day.count > 0 ? 1 : 0.2 }}
            />
            <div className="absolute hidden group-hover:block z-10 bg-gray-900 text-white text-xs p-2 rounded shadow-lg -top-12 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
              {day.date}: {day.score.toFixed(1)} ({day.count} tests)
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-4 text-xs text-gray-400">
        <span>← Older</span>
        <div className="flex gap-4">
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded"></div> ≥80
          </span>
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div> 70-79
          </span>
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 bg-orange-500 rounded"></div> 60-69
          </span>
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500 rounded"></div> &lt;60
          </span>
        </div>
        <span>Newer →</span>
      </div>
    </div>
  );
}

// Comparison Chart for vs Historical
export function ComparisonChart({ current, historical }: { current: number, historical: number }) {
  const data = [
    { name: 'Current', value: current },
    { name: 'Historical', value: historical },
  ];

  const diff = current - historical;
  const color = diff > 0 ? '#10b981' : diff < 0 ? '#ef4444' : '#3b82f6';

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} layout="horizontal">
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis type="number" domain={[0, 100]} stroke="#9ca3af" />
        <YAxis type="category" dataKey="name" stroke="#9ca3af" />
        <Tooltip
          contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
          labelStyle={{ color: '#9ca3af' }}
        />
        <Bar dataKey="value" fill={color}>
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={index === 0 ? color : '#6b7280'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// Performance Gauge
export function PerformanceGauge({ score, label }: { score: number, label: string }) {
  const angle = (score / 100) * 180 - 90;
  const color = score >= 80 ? '#10b981' : 
                score >= 70 ? '#f59e0b' : 
                score >= 60 ? '#fb923c' : '#ef4444';

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-16">
        <svg viewBox="0 0 200 100" className="w-full h-full">
          {/* Background arc */}
          <path
            d="M 20 80 A 60 60 0 0 1 180 80"
            fill="none"
            stroke="#374151"
            strokeWidth="10"
          />
          {/* Score arc */}
          <path
            d={`M 20 80 A 60 60 0 ${score > 50 ? 1 : 0} 1 ${
              100 + 80 * Math.cos((angle * Math.PI) / 180)
            } ${80 - 80 * Math.sin((angle * Math.PI) / 180)}`}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
          />
          {/* Center text */}
          <text
            x="100"
            y="75"
            textAnchor="middle"
            className="text-2xl font-bold fill-current"
            style={{ fill: color }}
          >
            {score.toFixed(0)}
          </text>
        </svg>
      </div>
      <span className="text-xs text-gray-400 mt-1">{label}</span>
    </div>
  );
}