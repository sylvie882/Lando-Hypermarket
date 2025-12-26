// app/admin/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import DashboardCard from '@/components/admin/DashboardCard';
import RecentOrders from '@/components/admin/RecentOrders';
import SalesChart from '@/components/admin/SalesChart';
import StatCard from '@/components/admin/StatCard';
import {
  Users,
  Package,
  ShoppingCart,
  DollarSign,
  Loader2,
  AlertCircle,
  Truck,
  CreditCard
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

// Add a default stats structure to prevent undefined errors
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
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    checkAuthAndFetchData();
  }, [router]); // Add router to dependency array

  const checkAuthAndFetchData = async () => {
    try {
      // 1. Check if user is authenticated
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
        console.error('Failed to parse user data:', e);
        toast.error('Invalid user data. Please login again.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/admin/login');
        return;
      }
      
      // Check if user has admin role (check both 'role' and 'is_admin' properties)
      const isAdmin = user.role === 'admin' || user.is_admin === true;
      if (!isAdmin) {
        toast.error('Access denied. Admin privileges required.');
        router.push('/');
        return;
      }
      
      // 2. Set auth as checked
      setAuthChecked(true);
      
      // 3. Fetch dashboard stats
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
      
      // Try to fetch dashboard stats - handle if endpoint doesn't exist
      let dashboardData;
      try {
        // Check if the dashboard stats endpoint exists in your API
        if (api.admin.getDashboardStats) {
          const response = await api.admin.getDashboardStats();
          dashboardData = response.data;
        } else {
          // If endpoint doesn't exist, fetch basic data from other endpoints
          console.log('Dashboard stats endpoint not found, fetching basic data...');
          dashboardData = await fetchBasicDashboardData();
        }
      } catch (error) {
        console.log('Dashboard stats endpoint failed, using basic data:', error);
        dashboardData = await fetchBasicDashboardData();
      }
      
      if (dashboardData) {
        // Merge with default stats to ensure all properties exist
        const mergedStats = {
          ...defaultStats,
          ...dashboardData,
          overview: { ...defaultStats.overview, ...(dashboardData.overview || {}) },
          today: { ...defaultStats.today, ...(dashboardData.today || {}) },
          recent: { ...defaultStats.recent, ...(dashboardData.recent || {}) }
        };
        setStats(mergedStats);
      } else {
        // Use default stats if no data available
        setStats(defaultStats);
      }
    } catch (err: any) {
      console.error('Dashboard fetch error:', err);
      
      // Handle specific error cases
      if (err.response?.status === 401 || err.response?.status === 403) {
        toast.error('Session expired. Please login again.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/admin/login');
        return;
      }
      
      const errorMessage = err.response?.data?.message || 
                          err.message || 
                          'Failed to load dashboard stats. Displaying basic data.';
      
      toast.error(errorMessage);
      
      // Set default stats on error
      setStats(defaultStats);
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch basic dashboard data if the dedicated endpoint doesn't exist
  const fetchBasicDashboardData = async () => {
    try {
      // Fetch basic counts from different endpoints
      const [productsRes, ordersRes, usersRes] = await Promise.allSettled([
        api.get('/products?per_page=1'), // Just to get total count
        api.get('/orders?per_page=1'),   // Just to get total count
        api.get('/users?per_page=1')     // Just to get total count
      ]);
      
      const basicStats: DashboardStats = {
        overview: {
          total_orders: ordersRes.status === 'fulfilled' ? (ordersRes.value.data?.total || 0) : 0,
          total_revenue: 0, // Would need order details to calculate
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
      
      return basicStats;
    } catch (error) {
      console.error('Failed to fetch basic dashboard data:', error);
      return defaultStats;
    }
  };

  // Redirect to login if auth fails
  if (!authChecked && !loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-600">Welcome back! Here's what's happening with your store today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 mb-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <StatCard
          title="Today's Revenue"
          value={`$${(stats.today.revenue || 0).toLocaleString()}`}
          icon={DollarSign}
          trend="+12.5%"
          trendPositive={true}
          description="From yesterday"
        />
        <StatCard
          title="Today's Orders"
          value={(stats.today.orders || 0).toString()}
          icon={ShoppingCart}
          trend="+8.2%"
          trendPositive={true}
          description="From yesterday"
        />
        <StatCard
          title="Total Customers"
          value={(stats.overview.total_customers || 0).toString()}
          icon={Users}
          trend="+5.3%"
          trendPositive={true}
          description="All time"
        />
        <StatCard
          title="Active Deliveries"
          value={(stats.overview.active_deliveries || 0).toString()}
          icon={Truck}
          trend="-2.1%"
          trendPositive={false}
          description="Currently in transit"
        />
      </div>

      {/* Charts and Recent Data */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DashboardCard title="Sales Overview">
          <SalesChart />
        </DashboardCard>
        
        <DashboardCard title="Recent Orders">
          <RecentOrders orders={stats.recent.orders || []} />
        </DashboardCard>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 gap-6 mt-6 md:grid-cols-2">
        <DashboardCard title="Recent Customers">
          <div className="space-y-4">
            {(stats.recent.customers || []).slice(0, 5).map((customer: any) => (
              <div key={customer.id || customer.email} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{customer.name || customer.email}</p>
                  <p className="text-sm text-gray-500">{customer.email}</p>
                </div>
                <div className="text-sm text-gray-500">
                  {customer.created_at ? new Date(customer.created_at).toLocaleDateString() : 'Recently'}
                </div>
              </div>
            ))}
            {(stats.recent.customers || []).length === 0 && (
              <p className="text-gray-500 text-center py-4">No recent customers</p>
            )}
          </div>
        </DashboardCard>

        <DashboardCard title="Recent Payments">
          <div className="space-y-4">
            {(stats.recent.payments || []).slice(0, 5).map((payment: any) => (
              <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">
                    Order #{payment.order?.order_number || payment.id}
                  </p>
                  <p className="text-sm text-gray-500">
                    ${payment.amount || '0'} • {payment.status || 'Pending'}
                  </p>
                </div>
                <div className="text-sm text-gray-500">
                  {payment.created_at ? new Date(payment.created_at).toLocaleDateString() : 'Recently'}
                </div>
              </div>
            ))}
            {(stats.recent.payments || []).length === 0 && (
              <p className="text-gray-500 text-center py-4">No recent payments</p>
            )}
          </div>
        </DashboardCard>
      </div>

      {/* Total Products Card - Added as it's missing but part of overview */}
      <div className="mt-6">
        <DashboardCard title="Product Summary">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center">
                <Package className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Products</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.overview.total_products || 0}</p>
                </div>
              </div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center">
                <ShoppingCart className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.overview.total_orders || 0}</p>
                </div>
              </div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center">
                <CreditCard className="h-8 w-8 text-purple-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">${(stats.overview.total_revenue || 0).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </DashboardCard>
      </div>
    </div>
  );
}