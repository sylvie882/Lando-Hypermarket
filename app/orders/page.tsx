'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Package, Truck, CheckCircle, Clock, Search, Filter } from 'lucide-react';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

interface Order {
  id: number;
  order_number: string;
  status: string;
  total: any; // Changed to any to handle different types
  created_at: string;
  estimated_delivery: string | null;
  item_count: number;
}

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await api.orders.getAll();
      console.log('API Response:', response.data); // Debug log
      
      // Handle different response formats
      const ordersData = response.data.data || response.data.orders || response.data;
      console.log('Orders data:', ordersData); // Debug log
      
      setOrders(Array.isArray(ordersData) ? ordersData : []);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to safely convert to number
  const parseNumber = (value: any): number => {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? 0 : parsed;
    }
    // Try to convert any other type
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  };

  // Helper function to safely format currency
  const formatCurrency = (value: any): string => {
    const amount = parseNumber(value);
    return `$${amount.toFixed(2)}`;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      processing: 'bg-purple-100 text-purple-800',
      shipped: 'bg-indigo-100 text-indigo-800',
      out_for_delivery: 'bg-orange-100 text-orange-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    const icons: Record<string, React.ReactNode> = {
      pending: <Clock className="w-4 h-4" />,
      processing: <Package className="w-4 h-4" />,
      shipped: <Truck className="w-4 h-4" />,
      delivered: <CheckCircle className="w-4 h-4" />,
      cancelled: <Clock className="w-4 h-4" />,
    };
    return icons[status] || <Package className="w-4 h-4" />;
  };

  const filteredOrders = orders.filter(order => {
    if (filter !== 'all' && order.status !== filter) return false;
    if (search && !order.order_number?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Orders</h1>
          <p className="text-gray-600">View and track your recent orders</p>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by order number..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-500" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">All Orders</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Orders List */}
        {filteredOrders.length > 0 ? (
          <div className="space-y-4">
            {filteredOrders.map((order, index) => {
              console.log(`Order ${index}:`, order); // Debug each order
              console.log(`Order ${index} total:`, order.total, 'type:', typeof order.total); // Debug total
              
              return (
                <div
                  key={order.id}
                  onClick={() => router.push(`/orders/${order.id}`)}
                  className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-200 cursor-pointer"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-lg text-gray-900">
                          Order #{order.order_number || `ORD-${order.id}`}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${getStatusColor(order.status || 'pending')}`}>
                          {getStatusIcon(order.status || 'pending')}
                          <span className="capitalize">{(order.status || 'pending').replace('_', ' ')}</span>
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <ShoppingBag className="w-4 h-4 mr-2" />
                          <span>{order.item_count || 0} items</span>
                        </div>
                        
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-2" />
                          <span>
                            Placed {order.created_at ? new Date(order.created_at).toLocaleDateString() : 'Unknown date'}
                          </span>
                        </div>
                        
                        {order.estimated_delivery && (
                          <div className="flex items-center">
                            <Truck className="w-4 h-4 mr-2" />
                            <span>
                              Est. delivery {new Date(order.estimated_delivery).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900 mb-1">
                        {formatCurrency(order.total)}
                      </div>
                      <button className="text-primary-600 hover:text-primary-700 font-medium">
                        View Details →
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-600 mb-6">
              {search || filter !== 'all' 
                ? 'No orders match your search criteria'
                : 'You haven\'t placed any orders yet'}
            </p>
            <button
              onClick={() => router.push('/products')}
              className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 font-medium"
            >
              Start Shopping
            </button>
          </div>
        )}
      </div>
    </div>
  );
}