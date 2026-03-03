// app/profile/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  User, 
  ShoppingBag, 
  Heart, 
  MapPin, 
  Package,
  Edit,
  Calendar,
  Mail,
  Phone,
  Star,
  Award,
  Clock,
  Bell,
  Shield,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Eye,
  PackageOpen,
  CreditCard as CreditCardIcon,
  Settings as SettingsIcon,
  HelpCircle,
  FileText,
  LogOut,
  TrendingUp,
  Gift,
  Menu
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import Image from 'next/image';

interface UserProfile {
  id: number;
  name: string;
  email: string;
  phone: string;
  avatar: string | null;
  avatar_url?: string | null;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
  is_admin: boolean;
  role: string;
  referral_code?: string;
  loyalty_points?: number;
  membership_tier?: string;
  email_verified?: boolean;
  phone_verified?: boolean;
  date_of_birth?: string;
  gender?: string;
  bio?: string;
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
  loyalty_points?: number;
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

// Helper function to get storage URL
const getStorageUrl = (path: string | null | undefined): string => {
  if (!path) return '/images/avatar.jpeg';
  
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }
  
  if (path.startsWith('avatars/')) {
    return `https://api.hypermarket.co.ke/storage/${path}`;
  }
  
  return `https://api.hypermarket.co.ke/storage/${path}`;
};

export default function ProfilePage() {
  const { user: authUser, isAuthenticated, logout } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'account'>('overview');
  const [avatarError, setAvatarError] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchProfileData();
    }
  }, [isAuthenticated]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      
      // Get user profile data using the new user.getProfile method
      const profileResponse = await api.user.getProfile();
      
      if (profileResponse.data && profileResponse.data.user) {
        const profileData = profileResponse.data.user;
        setProfile(profileData);
      } else {
        // Fallback to auth user
        if (authUser) {
          setProfile({
            id: authUser.id,
            name: authUser.name || '',
            email: authUser.email || '',
            phone: authUser.phone || '',
            avatar: authUser.avatar || null,
            email_verified_at: authUser.email_verified_at || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            is_admin: authUser.role === 'admin',
            role: authUser.role || 'customer',
          });
        }
      }
      
      // Get user stats using the new user.getStats method
      try {
        const statsResponse = await api.user.getStats();
        setStats(statsResponse.data);
      } catch (statsError) {
        console.error('Failed to fetch stats:', statsError);
      }
      
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
        api.wishlist.getCount ? api.wishlist.getCount() : Promise.resolve({ data: { count: 0 } }),
        api.addresses.getAll(),
        api.subscriptions ? api.subscriptions.getAll() : Promise.resolve({ data: [] }),
        api.orders.getAll({ per_page: 5, sort: 'created_at', order: 'desc' }),
        api.notifications.getAll({ per_page: 5 })
      ]);

      // Create a stats object to merge with API stats
      const additionalStats: Partial<Stats> = {};

      // Process orders
      if (ordersRes.status === 'fulfilled') {
        const ordersData = ordersRes.value.data;
        if (ordersData?.data && Array.isArray(ordersData.data)) {
          additionalStats.total_orders = ordersData.total || ordersData.data.length;
          
          // Count orders by status if not already provided by API
          if (!stats?.pending_orders) {
            additionalStats.pending_orders = ordersData.data.filter(
              (order: any) => ['pending', 'processing', 'shipped'].includes(order.status)
            ).length;
          }
          
          if (!stats?.completed_orders) {
            additionalStats.completed_orders = ordersData.data.filter(
              (order: any) => ['delivered', 'completed'].includes(order.status)
            ).length;
          }
          
          if (!stats?.total_spent) {
            additionalStats.total_spent = ordersData.data
              .filter((order: any) => ['delivered', 'completed'].includes(order.status))
              .reduce((sum: number, order: any) => sum + (order.total || 0), 0);
          }
        }
      }

      // Process wishlist
      if (wishlistRes.status === 'fulfilled') {
        const wishlistData = wishlistRes.value.data;
        additionalStats.wishlist_count = wishlistData?.count || 0;
      }

      // Process addresses
      if (addressesRes.status === 'fulfilled') {
        const addressesData = addressesRes.value.data;
        if (addressesData?.data && Array.isArray(addressesData.data)) {
          additionalStats.saved_addresses = addressesData.total || addressesData.data.length;
        } else if (Array.isArray(addressesData)) {
          additionalStats.saved_addresses = addressesData.length;
        }
      }

      // Process subscriptions
      if (subscriptionsRes.status === 'fulfilled') {
        const subscriptionsData = subscriptionsRes.value.data;
        if (subscriptionsData?.data && Array.isArray(subscriptionsData.data)) {
          additionalStats.active_subscriptions = subscriptionsData.data.filter(
            (sub: any) => sub.status === 'active'
          ).length;
        } else if (Array.isArray(subscriptionsData)) {
          additionalStats.active_subscriptions = subscriptionsData.filter(
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

      // Merge stats
      setStats(prev => ({ ...prev, ...additionalStats } as Stats));
      
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
      
      // Use auth user as fallback
      if (authUser) {
        setProfile({
          id: authUser.id,
          name: authUser.name || '',
          email: authUser.email || '',
          phone: authUser.phone || '',
          avatar: authUser.avatar || null,
          email_verified_at: authUser.email_verified_at || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_admin: authUser.role === 'admin',
          role: authUser.role || 'customer',
        });
      }
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
        return 'bg-emerald-100 text-emerald-800';
      case 'pending':
        return 'bg-orange-100 text-orange-800';
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

  const getAvatarUrl = () => {
    if (avatarError) return '/images/avatar.jpeg';
    
    if (profile?.avatar_url) return profile.avatar_url;
    if (profile?.avatar) return getStorageUrl(profile.avatar);
    return '/images/avatar.jpeg';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px] px-4">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="text-center py-12 px-4">
        <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
          <User className="w-12 h-12 text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Please Login</h2>
        <p className="text-gray-600 mb-6">You need to be logged in to view your profile.</p>
        <Link
          href="/auth/login"
          className="inline-flex items-center px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          Login to Continue
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Mobile Header with Menu Button */}
      <div className="lg:hidden flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          <p className="text-sm text-gray-600 mt-1">Welcome back, {profile?.name?.split(' ')[0] || authUser?.name?.split(' ')[0]}</p>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 bg-orange-100 text-orange-600 rounded-lg"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white rounded-xl shadow-lg p-4 mb-4 border border-gray-200">
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 overflow-hidden">
                <img
                  src={getAvatarUrl()}
                  alt={profile?.name || 'User'}
                  className="w-full h-full object-cover"
                  onError={() => setAvatarError(true)}
                />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{profile?.name || 'User'}</p>
                <p className="text-xs text-gray-500">{profile?.email}</p>
              </div>
            </div>
            <button onClick={() => setMobileMenuOpen(false)} className="text-gray-500">
              ✕
            </button>
          </div>
          <div className="space-y-2">
            <Link
              href="/profile/edit"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-orange-50 text-gray-700"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Edit className="w-5 h-5 text-orange-500" />
              <span>Edit Profile</span>
            </Link>
            <button
              onClick={() => {
                handleLogout();
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-red-50 text-red-600 w-full text-left"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}

      {/* Desktop Header */}
      <div className="hidden lg:flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600 mt-2">Welcome back, {profile?.name || authUser?.name}!</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/profile/edit"
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center shadow-md"
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

      {/* Tabs - Mobile Scrollable */}
      <div className="border-b border-gray-200 overflow-x-auto hide-scrollbar">
        <div className="flex space-x-6 min-w-max px-1 pb-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'overview'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'orders'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Orders & History
          </button>
          <button
            onClick={() => setActiveTab('account')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'account'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Account Settings
          </button>
        </div>
      </div>

      {/* Profile Summary Card - Mobile Optimized */}
      <div className="bg-gradient-to-r from-emerald-500 to-orange-500 rounded-2xl shadow-lg p-5 text-white">
        <div className="flex flex-col gap-4">
          {/* Top Row with Avatar and Name */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0 overflow-hidden border-2 border-white/50">
              <img
                src={getAvatarUrl()}
                alt={profile?.name || 'User'}
                className="w-full h-full object-cover"
                onError={() => setAvatarError(true)}
              />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold">{profile?.name || 'User'}</h2>
              <p className="text-sm text-emerald-100">
                {profile?.is_admin ? 'Administrator' : profile?.role === 'vendor' ? 'Vendor' : 'Customer'}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="inline-flex items-center px-2 py-1 rounded-full bg-white/20 text-xs">
                  {profile?.membership_tier || 'Silver'} Tier
                  <Award className="w-3 h-3 ml-1" />
                </span>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div className="bg-white/10 rounded-lg p-3">
              <p className="text-xs text-emerald-100">Member Since</p>
              <p className="font-bold text-sm">
                {profile?.created_at 
                  ? new Date(profile.created_at).getFullYear()
                  : 'N/A'
                }
              </p>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <p className="text-xs text-emerald-100">Total Spent</p>
              <p className="font-bold text-sm">
                {formatCurrency(stats?.total_spent || 0)}
              </p>
            </div>
          </div>

          {/* Referral Code - If Available */}
          {profile?.referral_code && (
            <div className="bg-white/10 rounded-lg p-3">
              <p className="text-xs text-emerald-100 mb-1">Your Referral Code</p>
              <p className="font-mono font-bold text-base">{profile.referral_code}</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats Grid - Mobile Optimized */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/profile/orders"
          className="bg-white rounded-xl shadow p-4 hover:shadow-md transition-shadow group"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-500">Orders</p>
              <p className="text-xl font-bold text-gray-900 mt-1">{stats?.total_orders || 0}</p>
            </div>
            <div className="p-2 bg-emerald-100 rounded-lg group-hover:bg-emerald-200 transition-colors">
              <ShoppingBag className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          {stats?.pending_orders ? (
            <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-orange-100 text-orange-800 mt-2">
              <Clock className="w-3 h-3 mr-1" />
              {stats.pending_orders} pending
            </span>
          ) : (
            <span className="inline-flex items-center text-xs text-emerald-600 mt-2">
              <CheckCircle className="w-3 h-3 mr-1" />
              All processed
            </span>
          )}
        </Link>

        <Link
          href="/profile/wishlist"
          className="bg-white rounded-xl shadow p-4 hover:shadow-md transition-shadow group"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-500">Wishlist</p>
              <p className="text-xl font-bold text-gray-900 mt-1">{stats?.wishlist_count || 0}</p>
            </div>
            <div className="p-2 bg-red-100 rounded-lg group-hover:bg-red-200 transition-colors">
              <Heart className="w-4 h-4 text-red-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Saved items</p>
        </Link>

        <Link
          href="/profile/addresses"
          className="bg-white rounded-xl shadow p-4 hover:shadow-md transition-shadow group"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-500">Addresses</p>
              <p className="text-xl font-bold text-gray-900 mt-1">{stats?.saved_addresses || 0}</p>
            </div>
            <div className="p-2 bg-emerald-100 rounded-lg group-hover:bg-emerald-200 transition-colors">
              <MapPin className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Saved locations</p>
        </Link>

        <Link
          href="/profile/subscriptions"
          className="bg-white rounded-xl shadow p-4 hover:shadow-md transition-shadow group"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-500">Subscriptions</p>
              <p className="text-xl font-bold text-gray-900 mt-1">{stats?.active_subscriptions || 0}</p>
            </div>
            <div className="p-2 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
              <Package className="w-4 h-4 text-orange-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Active plans</p>
        </Link>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Recent Orders & Security */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Orders Section */}
          <div className="bg-white rounded-xl shadow-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Recent Orders</h2>
              <Link
                href="/profile/orders"
                className="text-orange-600 hover:text-orange-700 font-medium text-sm flex items-center"
              >
                View All
                <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
            
            {recentOrders.length > 0 ? (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <Link
                    key={order.id}
                    href={`/orders/${order.id}`}
                    className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <div className="p-2 bg-emerald-100 rounded-lg flex-shrink-0">
                      <PackageOpen className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-medium text-sm text-gray-900 truncate">
                          #{order.order_number}
                        </p>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500">
                          {formatDate(order.created_at, 'short')}
                        </span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500">{order.items_count} items</span>
                      </div>
                      <p className="text-sm font-bold text-gray-900 mt-2">{formatCurrency(order.total)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="w-16 h-16 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                  <ShoppingBag className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500 mb-3">No orders yet</p>
                <Link
                  href="/products"
                  className="inline-flex items-center text-orange-600 hover:text-orange-700 font-medium text-sm"
                >
                  Start Shopping
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            )}
          </div>

          {/* Account Security Section - Mobile Optimized */}
          <div className="bg-white rounded-xl shadow-lg p-5">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Account Security</h2>
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border border-gray-200 gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 rounded-lg flex-shrink-0">
                    <Shield className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-gray-900">Email Verification</p>
                    <p className="text-xs text-gray-500">
                      {profile?.email_verified || profile?.email_verified_at 
                        ? 'Verified ✓'
                        : 'Not verified'
                      }
                    </p>
                  </div>
                </div>
                {!profile?.email_verified && !profile?.email_verified_at && (
                  <button className="px-3 py-1.5 text-xs bg-orange-500 text-white rounded-lg hover:bg-orange-600 w-full sm:w-auto">
                    Verify Now
                  </button>
                )}
              </div>

              <Link
                href="/profile/payments"
                className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <CreditCardIcon className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-gray-900">Payment Methods</p>
                    <p className="text-xs text-gray-500">Manage saved cards</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </Link>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Mobile Optimized */}
        <div className="space-y-6">
          {/* Notifications */}
          <div className="bg-white rounded-xl shadow-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">Notifications</h2>
              <Link
                href="/profile/notifications"
                className="text-orange-600 hover:text-orange-700 text-sm"
              >
                See All
              </Link>
            </div>
            
            <div className="space-y-3">
              {notifications.length > 0 ? (
                notifications.slice(0, 3).map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 rounded-lg ${notification.read_at ? 'bg-gray-50' : 'bg-orange-50'} border border-gray-200`}
                  >
                    <div className="flex items-start gap-2">
                      {!notification.read_at && (
                        <div className="w-2 h-2 mt-1 bg-orange-500 rounded-full flex-shrink-0"></div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-xs text-gray-900">{notification.title}</p>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">{notification.message}</p>
                        <p className="text-xs text-gray-400 mt-2">
                          {formatDate(notification.created_at, 'short')}
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

          {/* Quick Actions - Mobile Optimized */}
          <div className="bg-white rounded-xl shadow-lg p-5">
            <h2 className="font-bold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/profile/edit"
                className="flex flex-col items-center p-3 rounded-lg border border-gray-200 hover:bg-orange-50 transition-colors"
              >
                <Edit className="w-5 h-5 text-orange-500 mb-2" />
                <span className="text-xs text-gray-700">Edit Profile</span>
              </Link>

              <Link
                href="/profile/settings"
                className="flex flex-col items-center p-3 rounded-lg border border-gray-200 hover:bg-emerald-50 transition-colors"
              >
                <SettingsIcon className="w-5 h-5 text-emerald-500 mb-2" />
                <span className="text-xs text-gray-700">Settings</span>
              </Link>

              <Link
                href="/support"
                className="flex flex-col items-center p-3 rounded-lg border border-gray-200 hover:bg-blue-50 transition-colors"
              >
                <HelpCircle className="w-5 h-5 text-blue-500 mb-2" />
                <span className="text-xs text-gray-700">Support</span>
              </Link>

              <Link
                href="/profile/reviews"
                className="flex flex-col items-center p-3 rounded-lg border border-gray-200 hover:bg-purple-50 transition-colors"
              >
                <Star className="w-5 h-5 text-purple-500 mb-2" />
                <span className="text-xs text-gray-700">Reviews</span>
              </Link>
            </div>
          </div>

          {/* Loyalty Program - Mobile Optimized */}
          <div className="bg-gradient-to-r from-emerald-500 to-orange-500 rounded-xl shadow-lg p-5 text-white">
            <div className="flex items-center justify-between mb-3">
              <Award className="w-5 h-5" />
              <span className="text-xs font-medium bg-white/20 px-2 py-1 rounded">
                {profile?.membership_tier || 'Silver'} Tier
              </span>
            </div>
            <h3 className="font-bold text-base mb-2">Loyalty Program</h3>
            <p className="text-emerald-100 text-xs mb-4">
              Earn points with every purchase
            </p>

            <div className="bg-white/20 rounded-lg p-3">
              <div className="flex justify-between text-xs mb-1">
                <span>Current Points</span>
                <span className="font-bold">{profile?.loyalty_points || stats?.loyalty_points || 0}</span>
              </div>
              <div className="w-full bg-white/30 rounded-full h-2">
                <div 
                  className="bg-white rounded-full h-2"
                  style={{ width: `${Math.min(((profile?.loyalty_points || 0) / 1000) * 100, 100)}%` }}
                ></div>
              </div>
              <p className="text-xs text-emerald-100 mt-2">
                {1000 - (profile?.loyalty_points || 0)} points to Gold
              </p>
            </div>
          </div>

          {/* Desktop Logout Button */}
          <div className="hidden lg:block">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 p-3 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Global Styles */}
      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}