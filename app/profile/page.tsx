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
  MapPin as MapPinIcon
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
}

interface Stats {
  total_orders: number;
  pending_orders: number;
  wishlist_count: number;
  saved_addresses: number;
  active_subscriptions: number;
}

export default function ProfilePage() {
  const { user: authUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const [profileRes, statsRes] = await Promise.all([
        api.auth.getUser(),
        api.get('/profile/stats')
      ]);
      
      setProfile(profileRes.data);
      
      if (statsRes.data) {
        setStats(statsRes.data);
      } else {
        // Fallback stats if API doesn't return them
        setStats({
          total_orders: 0,
          pending_orders: 0,
          wishlist_count: 0,
          saved_addresses: 0,
          active_subscriptions: 0,
        });
      }
    } catch (error) {
      console.error('Failed to fetch profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600 mt-2">Welcome back, {profile?.name || authUser?.name}!</p>
        </div>
        <Link
          href="/profile/edit"
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center"
        >
          <Edit className="w-4 h-4 mr-2" />
          Edit Profile
        </Link>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center mr-6">
            {profile?.avatar ? (
              <img
                src={profile.avatar}
                alt={profile.name}
                className="w-24 h-24 rounded-full object-cover"
              />
            ) : (
              <User className="w-12 h-12 text-primary-600" />
            )}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">{profile?.name || 'User'}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="flex items-center">
                <Mail className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{profile?.email || 'No email'}</p>
                </div>
              </div>
              <div className="flex items-center">
                <Phone className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium">{profile?.phone || 'No phone number'}</p>
                </div>
              </div>
              <div className="flex items-center">
                <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Member Since</p>
                  <p className="font-medium">
                    {profile?.created_at 
                      ? new Date(profile.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long'
                        })
                      : 'N/A'
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                <MapPinIcon className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Account Type</p>
                  <p className="font-medium">
                    {profile?.is_admin ? 'Administrator' : 'Standard User'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link
          href="/profile/orders"
          className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow group"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Orders</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats?.total_orders || 0}
              </p>
              {stats?.pending_orders && stats.pending_orders > 0 && (
                <p className="text-sm text-orange-600 mt-1">
                  {stats.pending_orders} pending
                </p>
              )}
            </div>
            <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
              <ShoppingBag className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Link>

        <Link
          href="/profile/wishlist"
          className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow group"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Wishlist</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats?.wishlist_count || 0}
              </p>
              <p className="text-sm text-gray-500 mt-1">Saved items</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg group-hover:bg-red-200 transition-colors">
              <Heart className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </Link>

        <Link
          href="/profile/addresses"
          className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow group"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Saved Addresses</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats?.saved_addresses || 0}
              </p>
              <p className="text-sm text-gray-500 mt-1">Delivery locations</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
              <MapPin className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Link>

        <Link
          href="/profile/subscriptions"
          className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow group"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Subscriptions</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats?.active_subscriptions || 0}
              </p>
              <p className="text-sm text-gray-500 mt-1">Active plans</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Link>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
          <Link
            href="/profile/orders"
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            View All →
          </Link>
        </div>
        <div className="space-y-4">
          {/* You can map through recent orders here */}
          <div className="text-center py-8 text-gray-500">
            <ShoppingBag className="w-12 h-12 mx-auto mb-3" />
            <p>No recent activity to display</p>
            <Link
              href="/products"
              className="text-primary-600 hover:text-primary-700 font-medium mt-2 inline-block"
            >
              Start Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}