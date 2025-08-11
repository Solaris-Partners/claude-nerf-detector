'use client';

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  Area,
  AreaChart,
} from 'recharts';

// Color palette
const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6'];

// Score Distribution Chart
export function ScoreDistributionChart({ data }: { data: any[] }) {
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
        <Bar dataKey="count" fill="#3b82f6">
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// Test Breakdown Radar Chart
export function TestBreakdownChart({ data }: { data: any[] }) {
  const radarData = data.map(item => ({
    test: item.test,
    score: item.avgScore,
    fullMark: 100,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={radarData}>
        <PolarGrid stroke="#374151" />
        <PolarAngleAxis dataKey="test" stroke="#9ca3af" />
        <PolarRadiusAxis 
          angle={90} 
          domain={[0, 100]} 
          stroke="#9ca3af"
        />
        <Radar
          name="Average Score"
          dataKey="score"
          stroke="#3b82f6"
          fill="#3b82f6"
          fillOpacity={0.6}
        />
        <Tooltip
          contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
          labelStyle={{ color: '#9ca3af' }}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}

// Performance Trend Line Chart
export function PerformanceTrendChart({ data }: { data: any[] }) {
  // Group by hour and calculate averages
  const hourlyData = Array.from({ length: 24 }, (_, hour) => {
    const hourTests = data.filter(t => 
      new Date(t.timestamp).getHours() === hour
    );
    return {
      hour: `${hour}:00`,
      avgScore: hourTests.length > 0 
        ? hourTests.reduce((sum, t) => sum + t.score, 0) / hourTests.length 
        : null,
      count: hourTests.length,
    };
  }).filter(d => d.avgScore !== null);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={hourlyData}>
        <defs>
          <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis dataKey="hour" stroke="#9ca3af" />
        <YAxis stroke="#9ca3af" domain={[0, 100]} />
        <Tooltip
          contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
          labelStyle={{ color: '#9ca3af' }}
        />
        <Area
          type="monotone"
          dataKey="avgScore"
          stroke="#3b82f6"
          fillOpacity={1}
          fill="url(#colorScore)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// Activity Heatmap
export function HeatmapChart({ data }: { data: any[] }) {
  // Create a 7x24 grid for week heatmap
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const hours = Array.from({ length: 24 }, (_, i) => i);
  
  const heatmapData = days.flatMap((day, dayIndex) =>
    hours.map(hour => {
      const activity = data.find(d => d.day === day && d.hour === hour);
      return {
        day,
        hour,
        value: activity?.count || 0,
        x: hour,
        y: dayIndex,
      };
    })
  );

  const maxValue = Math.max(...heatmapData.map(d => d.value), 1);

  return (
    <div className="w-full h-[300px] relative">
      <div className="absolute inset-0 grid grid-cols-24 gap-1">
        {heatmapData.map((cell, idx) => (
          <div
            key={idx}
            className="relative group"
            style={{
              gridColumn: cell.x + 1,
              gridRow: cell.y + 1,
            }}
          >
            <div
              className="w-full h-8 rounded"
              style={{
                backgroundColor: cell.value === 0 
                  ? '#1f2937' 
                  : `rgba(59, 130, 246, ${cell.value / maxValue})`,
              }}
            />
            <div className="absolute hidden group-hover:block z-10 bg-gray-900 text-white text-xs p-2 rounded shadow-lg -top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
              {cell.day} {cell.hour}:00 - {cell.value} tests
            </div>
          </div>
        ))}
      </div>
      <div className="absolute -left-12 top-0 flex flex-col justify-between h-full text-xs text-gray-400">
        {days.map(day => (
          <div key={day} className="h-8 flex items-center">{day}</div>
        ))}
      </div>
      <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-400 mt-2">
        <span>00:00</span>
        <span>06:00</span>
        <span>12:00</span>
        <span>18:00</span>
        <span>23:00</span>
      </div>
    </div>
  );
}

// Real-time Performance Gauge
export function PerformanceGauge({ score }: { score: number }) {
  const angle = (score / 100) * 180 - 90;
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative w-48 h-24">
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
          className="text-3xl font-bold fill-current"
          style={{ fill: color }}
        >
          {score}%
        </text>
      </svg>
    </div>
  );
}

// Test Success Rate Pie Chart
export function SuccessRatePieChart({ data }: { data: any[] }) {
  const pieData = [
    { name: 'Passed', value: data.filter(d => d.passed).length },
    { name: 'Failed', value: data.filter(d => !d.passed).length },
  ];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={pieData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          <Cell fill="#10b981" />
          <Cell fill="#ef4444" />
        </Pie>
        <Tooltip
          contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
          labelStyle={{ color: '#9ca3af' }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

// Historical Comparison Chart
export function HistoricalComparisonChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis dataKey="date" stroke="#9ca3af" />
        <YAxis stroke="#9ca3af" domain={[0, 100]} />
        <Tooltip
          contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
          labelStyle={{ color: '#9ca3af' }}
        />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="claude35" 
          stroke="#3b82f6" 
          name="Claude 3.5"
          strokeWidth={2}
        />
        <Line 
          type="monotone" 
          dataKey="claude3" 
          stroke="#8b5cf6" 
          name="Claude 3"
          strokeWidth={2}
        />
        <Line 
          type="monotone" 
          dataKey="average" 
          stroke="#10b981" 
          name="Community Avg"
          strokeWidth={2}
          strokeDasharray="5 5"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}