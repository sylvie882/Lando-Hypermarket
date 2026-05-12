// app/admin/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import DashboardCard from '@/components/admin/DashboardCard';
import RecentOrders from '@/components/admin/RecentOrders';
import SalesChart from '@/components/admin/SalesChart';
import {
  Users,
  Package,
  ShoppingCart,
  DollarSign,
  Loader2,
  TrendingUp,
  TrendingDown,
  Clock,
  Calendar,
  ArrowRight,
  CreditCard,
  Truck,
  Sparkles,
  Activity,
  Zap
} from 'lucide-react';
import toast from 'react-hot-toast';

interface DashboardStats {
  overview: {
    total_orders: number;
    total_revenue: number;
    total_customers: number;
    total_products: number;
    active_deliveries: number;
  };
  today: {
    orders: number;
    revenue: number;
    new_customers: number;
    deliveries_completed: number;
  };
  recent: {
    orders: any[];
    payments: any[];
    customers: any[];
  };
}

const defaultStats: DashboardStats = {
  overview: {
    total_orders: 0,
    total_revenue: 0,
    total_customers: 0,
    total_products: 0,
    active_deliveries: 0
  },
  today: {
    orders: 0,
    revenue: 0,
    new_customers: 0,
    deliveries_completed: 0
  },
  recent: {
    orders: [],
    payments: [],
    customers: []
  }
};

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>(defaultStats);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    // Set greeting based on time of day
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
    
    checkAuthAndFetchData();
  }, [router]);

  const checkAuthAndFetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      
      if (!token || !userStr) {
        toast.error('Please login to access admin dashboard');
        router.push('/admin/login');
        return;
      }
      
      let user;
      try {
        user = JSON.parse(userStr);
      } catch (e) {
        toast.error('Invalid user data. Please login again.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/admin/login');
        return;
      }
      
      const isAdmin = user.role === 'admin' || user.is_admin === true;
      if (!isAdmin) {
        toast.error('Access denied. Admin privileges required.');
        router.push('/');
        return;
      }
      
      await fetchDashboardStats();
    } catch (error) {
      console.error('Auth check error:', error);
      toast.error('Authentication failed. Please login again.');
      router.push('/admin/login');
    }
  };

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      
      let dashboardData;
      try {
        if (api.admin.getDashboardStats) {
          const response = await api.admin.getDashboardStats();
          dashboardData = response.data;
        } else {
          dashboardData = await fetchBasicDashboardData();
        }
      } catch (error) {
        dashboardData = await fetchBasicDashboardData();
      }
      
      if (dashboardData) {
        const mergedStats = {
          ...defaultStats,
          ...dashboardData,
          overview: { ...defaultStats.overview, ...(dashboardData.overview || {}) },
          today: { ...defaultStats.today, ...(dashboardData.today || {}) },
          recent: { ...defaultStats.recent, ...(dashboardData.recent || {}) }
        };
        setStats(mergedStats);
      } else {
        setStats(defaultStats);
      }
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        toast.error('Session expired. Please login again.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/admin/login');
        return;
      }
      setStats(defaultStats);
    } finally {
      setLoading(false);
    }
  };

  const fetchBasicDashboardData = async () => {
    try {
      const [productsRes, ordersRes, usersRes] = await Promise.allSettled([
        api.get('/products?per_page=1'),
        api.get('/orders?per_page=1'),
        api.get('/users?per_page=1')
      ]);
      
      return {
        overview: {
          total_orders: ordersRes.status === 'fulfilled' ? (ordersRes.value.data?.total || 0) : 0,
          total_revenue: 0,
          total_customers: usersRes.status === 'fulfilled' ? (usersRes.value.data?.total || 0) : 0,
          total_products: productsRes.status === 'fulfilled' ? (productsRes.value.data?.total || 0) : 0,
          active_deliveries: 0
        },
        today: {
          orders: 0,
          revenue: 0,
          new_customers: 0,
          deliveries_completed: 0
        },
        recent: {
          orders: [],
          payments: [],
          customers: []
        }
      };
    } catch (error) {
      return defaultStats;
    }
  };

  if (loading) {
    return (
      <div className="min-h-[600px] flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Zap className="h-6 w-6 text-blue-600 animate-pulse" />
            </div>
          </div>
          <p className="mt-4 text-gray-600 font-medium">Loading dashboard...</p>
          <p className="text-sm text-gray-400 mt-1">Fetching latest data</p>
        </div>
      </div>
    );
  }

  const StatCard = ({ title, value, icon: Icon, trend, trendPositive, color }: any) => (
    <div className="group relative overflow-hidden bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br opacity-5 rounded-full transform translate-x-16 -translate-y-16 group-hover:scale-150 transition-transform duration-500"
           style={{ background: `linear-gradient(135deg, ${color}, ${color}88)` }} />
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 rounded-xl" style={{ backgroundColor: `${color}15` }}>
            <Icon className="h-6 w-6" style={{ color }} />
          </div>
          {trend && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
              trendPositive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {trendPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {trend}
            </div>
          )}
        </div>
        <div>
          <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
          <p className="text-sm text-gray-600 font-medium">{title}</p>
        </div>
      </div>
    </div>
  );

  const MetricCard = ({ title, value, subtitle, icon: Icon, color }: any) => (
    <div className="bg-white rounded-xl p-5 border border-gray-100 hover:shadow-md transition-all duration-300">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
          <p className="text-xs text-gray-400">{subtitle}</p>
        </div>
        <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}10` }}>
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-gray-50 via-white to-gray-50 min-h-screen">
      {/* Welcome Section */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 md:p-8 text-white shadow-xl">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-5 w-5 text-yellow-300" />
                <span className="text-sm font-medium text-blue-100">Admin Dashboard</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">
                {greeting}, Admin! 👋
              </h1>
              <p className="text-blue-100 text-sm md:text-base max-w-md">
                Here's what's happening with your store today. Monitor sales, track orders, and manage your business.
              </p>
            </div>
            <div className="hidden md:block">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Stats Grid */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Today's Performance</h2>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock className="h-4 w-4" />
            <span>Real-time updates</span>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Today's Revenue"
            value={`$${(stats.today.revenue || 0).toLocaleString()}`}
            icon={DollarSign}
            trend="+12.5%"
            trendPositive={true}
            color="#3B82F6"
          />
          <StatCard
            title="Today's Orders"
            value={(stats.today.orders || 0).toString()}
            icon={ShoppingCart}
            trend="+8.2%"
            trendPositive={true}
            color="#10B981"
          />
          <StatCard
            title="New Customers"
            value={(stats.today.new_customers || 0).toString()}
            icon={Users}
            trend="+5.3%"
            trendPositive={true}
            color="#8B5CF6"
          />
          <StatCard
            title="Deliveries Completed"
            value={(stats.today.deliveries_completed || 0).toString()}
            icon={Truck}
            trend="-2.1%"
            trendPositive={false}
            color="#F59E0B"
          />
        </div>
      </div>

      {/* Charts and Recent Data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-300">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Sales Overview</h3>
                <p className="text-sm text-gray-500 mt-1">Weekly sales performance</p>
              </div>
              <Activity className="h-5 w-5 text-gray-400" />
            </div>
          </div>
          <div className="p-6">
            <SalesChart />
          </div>
        </div>
        
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-300">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
                <p className="text-sm text-gray-500 mt-1">Latest transactions</p>
              </div>
              <button 
                onClick={() => router.push('/admin/orders')}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                View all
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="p-6">
            <RecentOrders orders={stats.recent.orders || []} />
          </div>
        </div>
      </div>

      {/* Business Metrics Grid */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Business Metrics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Products"
            value={stats.overview.total_products || 0}
            subtitle="Available in catalog"
            icon={Package}
            color="#3B82F6"
          />
          <MetricCard
            title="Total Orders"
            value={stats.overview.total_orders || 0}
            subtitle="All time orders"
            icon={ShoppingCart}
            color="#10B981"
          />
          <MetricCard
            title="Total Customers"
            value={stats.overview.total_customers || 0}
            subtitle="Registered users"
            icon={Users}
            color="#8B5CF6"
          />
          <MetricCard
            title="Total Revenue"
            value={`$${(stats.overview.total_revenue || 0).toLocaleString()}`}
            subtitle="Lifetime sales"
            icon={CreditCard}
            color="#F59E0B"
          />
        </div>
      </div>

      {/* Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Customers */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Recent Customers</h3>
                <p className="text-sm text-gray-500 mt-1">Newest signups</p>
              </div>
              <Users className="h-5 w-5 text-gray-400" />
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {(stats.recent.customers || []).slice(0, 5).map((customer: any, idx: number) => (
              <div key={customer.id || idx} className="p-4 hover:bg-gray-50 transition-colors duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                      {(customer.name || customer.email || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{customer.name || 'Guest User'}</p>
                      <p className="text-sm text-gray-500">{customer.email}</p>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">
                    {customer.created_at ? new Date(customer.created_at).toLocaleDateString() : 'Just now'}
                  </div>
                </div>
              </div>
            ))}
            {(stats.recent.customers || []).length === 0 && (
              <div className="p-8 text-center text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No recent customers</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Payments */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Recent Payments</h3>
                <p className="text-sm text-gray-500 mt-1">Latest transactions</p>
              </div>
              <CreditCard className="h-5 w-5 text-gray-400" />
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {(stats.recent.payments || []).slice(0, 5).map((payment: any, idx: number) => (
              <div key={payment.id || idx} className="p-4 hover:bg-gray-50 transition-colors duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-gray-900">
                        Order #{payment.order?.order_number || payment.id}
                      </p>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        payment.status === 'completed' ? 'bg-green-100 text-green-700' :
                        payment.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {payment.status || 'Pending'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      Amount: ${payment.amount || '0'}
                    </p>
                  </div>
                  <div className="text-xs text-gray-400">
                    {payment.created_at ? new Date(payment.created_at).toLocaleDateString() : 'Recently'}
                  </div>
                </div>
              </div>
            ))}
            {(stats.recent.payments || []).length === 0 && (
              <div className="p-8 text-center text-gray-500">
                <CreditCard className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No recent payments</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Active Deliveries Section */}
      {stats.overview.active_deliveries > 0 && (
        <div className="mt-6 bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-6 border border-orange-100">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-100 rounded-xl">
                <Truck className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Active Deliveries</h3>
                <p className="text-sm text-gray-600">
                  {stats.overview.active_deliveries} delivery{stats.overview.active_deliveries !== 1 ? 'ies' : 'y'} currently in transit
                </p>
              </div>
            </div>
            <button className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors duration-200 text-sm font-medium">
              Track Deliveries
            </button>
          </div>
        </div>
      )}
    </div>
  );
}