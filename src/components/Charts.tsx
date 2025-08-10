'use client';

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
import { format } from 'date-fns';

interface TrendData {
  timestamp: string;
  avgScore: number;
  avgTtft: number;
  totalRuns: number;
}

interface RegionalData {
  region: string;
  count: number;
  percentage: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export function PerformanceTrendChart({ data }: { data: TrendData[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-gray-500">
        No trend data available yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="timestamp"
          tickFormatter={(value) => {
            try {
              return format(new Date(value), 'MMM dd');
            } catch {
              return '';
            }
          }}
        />
        <YAxis />
        <Tooltip 
          labelFormatter={(value) => {
            try {
              return format(new Date(value as string), 'MMM dd HH:mm');
            } catch {
              return '';
            }
          }}
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
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function RegionalDistributionChart({ data }: { data: RegionalData[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-gray-500">
        No regional data available yet
      </div>
    );
  }

  const chartData = data.slice(0, 5);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ region, percentage }) => {
            if (!region || percentage === undefined) return '';
            return `${region} (${percentage.toFixed(0)}%)`;
          }}
          outerRadius={80}
          fill="#8884d8"
          dataKey="count"
        >
          {chartData.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}