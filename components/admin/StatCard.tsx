// components/admin/StatCard.tsx
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend: string;
  trendPositive: boolean;
  description: string;
}

export default function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  trendPositive,
  description,
}: StatCardProps) {
  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <div className="flex items-center">
        <div className="flex-shrink-0 p-3 bg-blue-100 rounded-lg">
          <Icon className="w-6 h-6 text-blue-600" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
        </div>
      </div>
      <div className="mt-4">
        <div className="flex items-center">
          <span className={`text-sm font-medium ${trendPositive ? 'text-green-600' : 'text-red-600'}`}>
            {trend}
          </span>
          <span className="ml-2 text-sm text-gray-500">{description}</span>
        </div>
      </div>
    </div>
  );
}