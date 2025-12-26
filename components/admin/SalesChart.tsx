// components/admin/SalesChart.tsx
'use client';

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';

interface SalesChartProps {
  data?: Array<{
    date: string;
    sales: number;
    orders: number;
    revenue: number;
  }>;
}

const SalesChart: React.FC<SalesChartProps> = ({ data }) => {
  // Mock data for the chart
  const chartData = data || [
    { date: 'Jan', sales: 4000, orders: 2400, revenue: 2400 },
    { date: 'Feb', sales: 3000, orders: 1398, revenue: 2210 },
    { date: 'Mar', sales: 2000, orders: 9800, revenue: 2290 },
    { date: 'Apr', sales: 2780, orders: 3908, revenue: 2000 },
    { date: 'May', sales: 1890, orders: 4800, revenue: 2181 },
    { date: 'Jun', sales: 2390, orders: 3800, revenue: 2500 },
    { date: 'Jul', sales: 3490, orders: 4300, revenue: 2100 },
  ];

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="date" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#6b7280', fontSize: 12 }}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#6b7280', fontSize: 12 }}
            tickFormatter={(value) => `$${value}`}
          />
          <Tooltip 
            formatter={(value) => [`$${value}`, 'Revenue']}
            labelStyle={{ color: '#374151' }}
            contentStyle={{ 
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#3b82f6"
            fill="url(#colorRevenue)"
            strokeWidth={2}
          />
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
          </defs>
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SalesChart;