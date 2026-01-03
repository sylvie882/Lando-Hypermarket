// app/profile/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  User, 
  ShoppingBag, 
  Heart, 
  MapPin, 
  CreditCard, 
  Package,
  MessageSquare,
  Settings,
  Edit,
  Calendar,
  Mail,
  Phone,
  MapPin as MapPinIcon,
  Star,
  Award,
  TrendingUp,
  Clock,
  Bell,
  Shield,
  Truck,
  Percent,
  Tag,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Eye,
  PackageOpen,
  CreditCard as CreditCardIcon,
  Settings as SettingsIcon,
  HelpCircle,
  FileText,
  LogOut
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

interface UserProfile {
  id: number;
  name: string;
  email: string;
  phone: string;
  avatar: string | null;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
  is_admin: boolean;
  referral_code?: string;
  loyalty_points?: number;
  membership_tier?: string;
}

interface Stats {
  total_orders: number;
  pending_orders: number;
  completed_orders: number;
  wishlist_count: number;
  saved_addresses: number;
  active_subscriptions: number;
  total_spent: number;
  review_count: number;
}

interface RecentOrder {
  id: number;
  order_number: string;
  status: string;
  total: number;
  created_at: string;
  items_count: number;
}

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  read_at: string | null;
  created_at: string;
}

// Helper function to format dates
const formatDate = (dateString: string, formatType: 'short' | 'long' | 'date-only' = 'short'): string => {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  
  if (isNaN(date.getTime())) return 'Invalid date';
  
  if (formatType === 'short') {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } else if (formatType === 'long') {
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } else {
    // date-only
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }
};

// Helper function to format time
const formatTime = (dateString: string): string => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  
  if (isNaN(date.getTime())) return '';
  
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

export default function ProfilePage() {
  const { user: authUser, isAuthenticated, logout } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'account'>('overview');

  useEffect(() => {
    if (isAuthenticated) {
      fetchProfileData();
    }
  }, [isAuthenticated]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      
      // Get user profile data
      const profileRes = await api.auth.getUser();
      setProfile(profileRes.data);
      
      // Fetch all data in parallel
      const [
        ordersRes, 
        wishlistRes, 
        addressesRes, 
        subscriptionsRes,
        recentOrdersRes,
        notificationsRes
      ] = await Promise.allSettled([
        api.orders.getAll({ per_page: 50 }),
        api.wishlist.getCount(),
        api.get('/addresses'),
        api.get('/subscriptions'),
        api.orders.getAll({ per_page: 5, sort: 'created_at', order: 'desc' }),
        api.notifications.getAll({ per_page: 5 })
      ]);

      // Calculate stats from responses
      const newStats: Stats = {
        total_orders: 0,
        pending_orders: 0,
        completed_orders: 0,
        wishlist_count: 0,
        saved_addresses: 0,
        active_subscriptions: 0,
        total_spent: 0,
        review_count: 0,
      };

      // Process orders
      if (ordersRes.status === 'fulfilled') {
        const ordersData = ordersRes.value.data;
        if (ordersData?.data && Array.isArray(ordersData.data)) {
          newStats.total_orders = ordersData.total || ordersData.data.length;
          
          // Count orders by status
          ordersData.data.forEach((order: any) => {
            if (['pending', 'processing', 'shipped'].includes(order.status)) {
              newStats.pending_orders++;
            }
            if (['delivered', 'completed'].includes(order.status)) {
              newStats.completed_orders++;
              newStats.total_spent += order.total || 0;
            }
          });
        }
      }

      // Process wishlist
      if (wishlistRes.status === 'fulfilled') {
        const wishlistData = wishlistRes.value.data;
        newStats.wishlist_count = wishlistData?.count || 0;
      }

      // Process addresses
      if (addressesRes.status === 'fulfilled') {
        const addressesData = addressesRes.value.data;
        if (addressesData?.data && Array.isArray(addressesData.data)) {
          newStats.saved_addresses = addressesData.total || addressesData.data.length;
        } else if (Array.isArray(addressesData)) {
          newStats.saved_addresses = addressesData.length;
        }
      }

      // Process subscriptions
      if (subscriptionsRes.status === 'fulfilled') {
        const subscriptionsData = subscriptionsRes.value.data;
        if (subscriptionsData?.data && Array.isArray(subscriptionsData.data)) {
          newStats.active_subscriptions = subscriptionsData.data.filter(
            (sub: any) => sub.status === 'active'
          ).length;
        } else if (Array.isArray(subscriptionsData)) {
          newStats.active_subscriptions = subscriptionsData.filter(
            (sub: any) => sub.status === 'active'
          ).length;
        }
      }

      // Process recent orders
      if (recentOrdersRes.status === 'fulfilled') {
        const recentOrdersData = recentOrdersRes.value.data;
        if (recentOrdersData?.data && Array.isArray(recentOrdersData.data)) {
          setRecentOrders(recentOrdersData.data.slice(0, 3).map((order: any) => ({
            id: order.id,
            order_number: order.order_number,
            status: order.status,
            total: order.total,
            created_at: order.created_at,
            items_count: order.items?.length || 0
          })));
        }
      }

      // Process notifications
      if (notificationsRes.status === 'fulfilled') {
        const notificationsData = notificationsRes.value.data;
        if (notificationsData?.data && Array.isArray(notificationsData.data)) {
          setNotifications(notificationsData.data);
        } else if (Array.isArray(notificationsData)) {
          setNotifications(notificationsData);
        }
      }

      setStats(newStats);
    } catch (error) {
      console.error('Failed to fetch profile data:', error);
      // Set default stats if API fails
      setStats({
        total_orders: 0,
        pending_orders: 0,
        completed_orders: 0,
        wishlist_count: 0,
        saved_addresses: 0,
        active_subscriptions: 0,
        total_spent: 0,
        review_count: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
      case 'shipped':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px] px-4 sm:px-6 lg:px-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="text-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
          <User className="w-12 h-12 text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Please Login</h2>
        <p className="text-gray-600 mb-6">You need to be logged in to view your profile.</p>
        <Link
          href="/auth/login"
          className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          Login to Continue
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 px-8 sm:px-8 lg:px-12">
      {/* Header with Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
            <p className="text-gray-600 mt-2">Welcome back, {profile?.name || authUser?.name}!</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/profile/edit"
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Profile
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 flex items-center"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </button>
          </div>
        </div>
        
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'orders'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Orders & History
          </button>
          <button
            onClick={() => setActiveTab('account')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'account'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Account Settings
          </button>
        </div>
      </div>

      {/* Profile Summary Card */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between">
          <div className="w-full lg:w-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4 sm:mb-2">
              <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                {profile?.avatar ? (
                  <img
                    src={profile.avatar}
                    alt={profile.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <User className="w-8 h-8" />
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold">{profile?.name || 'User'}</h2>
                <p className="text-blue-100">
                  {profile?.is_admin ? 'Administrator Account' : 'Premium Member'}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 sm:mt-6">
              <div>
                <p className="text-sm text-blue-200">Member Since</p>
                <p className="font-bold">
                  {profile?.created_at 
                    ? new Date(profile.created_at).getFullYear()
                    : 'N/A'
                  }
                </p>
              </div>
              <div>
                <p className="text-sm text-blue-200">Total Spent</p>
                <p className="font-bold">
                  {formatCurrency(stats?.total_spent || 0)}
                </p>
              </div>
              <div>
                <p className="text-sm text-blue-200">Loyalty Points</p>
                <p className="font-bold flex items-center gap-2">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  {profile?.loyalty_points || 0} points
                </p>
              </div>
            </div>
          </div>
          <div className="mt-6 lg:mt-0 lg:text-right w-full lg:w-auto">
            <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end gap-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/20 text-sm">
                {profile?.membership_tier || 'Silver'} Tier
                <Award className="w-4 h-4 ml-2" />
              </span>
              {profile?.referral_code && (
                <div className="mt-3 lg:mt-3">
                  <p className="text-sm text-blue-200">Your Referral Code</p>
                  <p className="font-mono font-bold text-lg">{profile.referral_code}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Link
          href="/profile/orders"
          className="bg-white rounded-xl shadow-lg p-4 sm:p-6 hover:shadow-xl transition-shadow group"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Orders</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">
                {stats?.total_orders || 0}
              </p>
              <div className="flex items-center gap-2 mt-2">
                {stats?.pending_orders && stats.pending_orders > 0 ? (
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-yellow-100 text-yellow-800">
                    <Clock className="w-3 h-3 mr-1" />
                    {stats.pending_orders} pending
                  </span>
                ) : (
                  <span className="text-xs text-green-600 font-medium">
                    <CheckCircle className="w-3 h-3 inline mr-1" />
                    All processed
                  </span>
                )}
              </div>
            </div>
            <div className="p-2 sm:p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
              <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            </div>
          </div>
        </Link>

        <Link
          href="/profile/wishlist"
          className="bg-white rounded-xl shadow-lg p-4 sm:p-6 hover:shadow-xl transition-shadow group"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Wishlist Items</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">
                {stats?.wishlist_count || 0}
              </p>
              <p className="text-xs text-gray-500 mt-2">Saved for later</p>
            </div>
            <div className="p-2 sm:p-3 bg-red-100 rounded-lg group-hover:bg-red-200 transition-colors">
              <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
            </div>
          </div>
        </Link>

        <Link
          href="/profile/addresses"
          className="bg-white rounded-xl shadow-lg p-4 sm:p-6 hover:shadow-xl transition-shadow group"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Saved Addresses</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">
                {stats?.saved_addresses || 0}
              </p>
              <p className="text-xs text-gray-500 mt-2">Delivery locations</p>
            </div>
            <div className="p-2 sm:p-3 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
              <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
            </div>
          </div>
        </Link>

        <Link
          href="/profile/subscriptions"
          className="bg-white rounded-xl shadow-lg p-4 sm:p-6 hover:shadow-xl transition-shadow group"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active Subscriptions</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">
                {stats?.active_subscriptions || 0}
              </p>
              <p className="text-xs text-gray-500 mt-2">Recurring orders</p>
            </div>
            <div className="p-2 sm:p-3 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
              <Package className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
            </div>
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Recent Orders Section */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h2 className="text-xl font-bold text-gray-900">Recent Orders</h2>
              <Link
                href="/profile/orders"
                className="text-primary-600 hover:text-primary-700 font-medium text-sm flex items-center"
              >
                View All Orders
                <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
            
            {recentOrders.length > 0 ? (
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <Link
                    key={order.id}
                    href={`/profile/orders/${order.id}`}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors group gap-4 sm:gap-0"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-gray-200">
                        <PackageOpen className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          Order #{order.order_number}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-2 py-1 rounded text-xs ${getStatusColor(order.status)}`}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                          <span className="text-sm text-gray-500">
                            {formatDate(order.created_at, 'short')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="font-bold text-gray-900">{formatCurrency(order.total)}</p>
                      <p className="text-sm text-gray-500">{order.items_count} items</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <ShoppingBag className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 mb-3">No orders yet</p>
                <Link
                  href="/products"
                  className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium"
                >
                  Start Shopping
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            )}
          </div>

          {/* Account Security Section */}
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mt-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Account Security</h2>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-lg border border-gray-200 gap-4 sm:gap-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Shield className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Email Verification</p>
                    <p className="text-sm text-gray-500">
                      {profile?.email_verified_at 
                        ? 'Verified on ' + formatDate(profile.email_verified_at, 'short')
                        : 'Not verified yet'
                      }
                    </p>
                  </div>
                </div>
                {!profile?.email_verified_at && (
                  <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 mt-2 sm:mt-0">
                    Verify Now
                  </button>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-lg border border-gray-200 gap-4 sm:gap-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CreditCardIcon className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Payment Methods</p>
                    <p className="text-sm text-gray-500">Manage saved payment options</p>
                  </div>
                </div>
                <Link
                  href="/profile/payments"
                  className="text-primary-600 hover:text-primary-700 font-medium text-sm mt-2 sm:mt-0"
                >
                  Manage
                </Link>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-lg border border-gray-200 gap-4 sm:gap-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Eye className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Login Activity</p>
                    <p className="text-sm text-gray-500">Review recent account access</p>
                  </div>
                </div>
                <button className="text-primary-600 hover:text-primary-700 font-medium text-sm mt-2 sm:mt-0">
                  View Logs
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Notifications */}
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">Notifications</h2>
              <Link
                href="/profile/notifications"
                className="text-primary-600 hover:text-primary-700 text-sm"
              >
                See All
              </Link>
            </div>
            
            <div className="space-y-3">
              {notifications.length > 0 ? (
                notifications.slice(0, 3).map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 rounded-lg ${notification.read_at ? 'bg-gray-50' : 'bg-blue-50'} border border-gray-200`}
                  >
                    <div className="flex items-start gap-2">
                      {!notification.read_at && (
                        <div className="w-2 h-2 mt-1 bg-blue-600 rounded-full"></div>
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-sm text-gray-900">{notification.title}</p>
                        <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                        <p className="text-xs text-gray-400 mt-2">
                          {formatDate(notification.created_at, 'short')} {formatTime(notification.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">No new notifications</p>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
            <h2 className="font-bold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <Link
                href="/profile/settings"
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-gray-200">
                    <SettingsIcon className="w-4 h-4 text-gray-600" />
                  </div>
                  <span className="text-sm text-gray-700">Account Settings</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </Link>

              <Link
                href="/support"
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200">
                    <HelpCircle className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="text-sm text-gray-700">Help & Support</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </Link>

              <Link
                href="/profile/reviews"
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200">
                    <Star className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-sm text-gray-700">My Reviews</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </Link>

              <Link
                href="/profile/preferences"
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200">
                    <Settings className="w-4 h-4 text-purple-600" />
                  </div>
                  <span className="text-sm text-gray-700">Preferences</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </Link>
            </div>
          </div>

          {/* Loyalty Program */}
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl shadow-lg p-4 sm:p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <Award className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="text-sm font-medium bg-white/20 px-2 py-1 rounded">
                {profile?.membership_tier || 'Silver'} Tier
              </span>
            </div>
            <h3 className="font-bold text-lg mb-2">Loyalty Program</h3>
            <p className="text-amber-100 text-sm mb-4">
              Earn points with every purchase and unlock exclusive benefits
            </p>
            <div className="bg-white/20 rounded-lg p-3">
              <div className="flex justify-between text-sm mb-1">
                <span>Current Points</span>
                <span className="font-bold">{profile?.loyalty_points || 0}</span>
              </div>
              <div className="w-full bg-white/30 rounded-full h-2">
                <div 
                  className="bg-white rounded-full h-2"
                  style={{ width: `${Math.min(((profile?.loyalty_points || 0) / 1000) * 100, 100)}%` }}
                ></div>
              </div>
              <p className="text-xs text-amber-100 mt-2">
                {1000 - (profile?.loyalty_points || 0)} points to Gold Tier
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}