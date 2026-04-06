'use client';

import React from 'react';
import { MoreVertical, CheckCircle, XCircle, Clock } from 'lucide-react';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email?: string;
  total_amount?: number | string; // Could be string or number
  total?: number | string; // Could be string or number
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  payment_status: 'paid' | 'pending' | 'failed';
  items?: OrderItem[];
  created_at: string;
  updated_at?: string;
}

interface RecentOrdersProps {
  orders: Order[];
  maxItems?: number;
}

const RecentOrders: React.FC<RecentOrdersProps> = ({ orders, maxItems = 10 }) => {
  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'shipped':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
        return 'bg-orange-100 text-orange-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusIcon = (status: Order['payment_status']) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        return 'Today';
      } else if (diffDays === 1) {
        return 'Yesterday';
      } else if (diffDays < 7) {
        return `${diffDays} days ago`;
      } else {
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });
      }
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Helper function to get total amount safely with type conversion
  const getTotalAmount = (order: Order): number => {
    // Try total_amount first, then total, default to 0
    const amount = order.total_amount || order.total || 0;
    
    // Convert to number if it's a string
    if (typeof amount === 'string') {
      const parsed = parseFloat(amount);
      return isNaN(parsed) ? 0 : parsed;
    }
    
    // If it's already a number or undefined/null
    return Number(amount) || 0;
  };

  // Format currency safely
  const formatCurrency = (amount: number): string => {
    if (typeof amount !== 'number' || isNaN(amount)) {
      return '$0.00';
    }
    return `$${amount.toFixed(2)}`;
  };

  const displayedOrders = orders.slice(0, maxItems);

  if (displayedOrders.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No recent orders</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead>
          <tr className="bg-gray-50">
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Order #
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Customer
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Amount
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Payment
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {displayedOrders.map((order) => (
            <tr key={order.id} className="hover:bg-gray-50">
              <td className="px-4 py-3">
                <div className="text-sm font-medium text-blue-600">
                  #{order.order_number || 'N/A'}
                </div>
              </td>
              <td className="px-4 py-3">
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {order.customer_name || 'Anonymous'}
                  </div>
                  {order.customer_email && (
                    <div className="text-sm text-gray-500">
                      {order.customer_email}
                    </div>
                  )}
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="text-sm font-medium text-gray-900">
                  {formatCurrency(getTotalAmount(order))}
                </div>
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                    order.status || 'pending'
                  )}`}
                >
                  {(order.status || 'pending').charAt(0).toUpperCase() + (order.status || 'pending').slice(1)}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center space-x-1">
                  {getPaymentStatusIcon(order.payment_status || 'pending')}
                  <span className="text-sm text-gray-900 capitalize">
                    {order.payment_status || 'pending'}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="text-sm text-gray-500">
                  {formatDate(order.created_at)}
                </div>
              </td>
              <td className="px-4 py-3">
                <button
                  className="p-1 hover:bg-gray-100 rounded"
                  onClick={() => console.log('View order', order.id)}
                >
                  <MoreVertical className="w-5 h-5 text-gray-400" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RecentOrders;