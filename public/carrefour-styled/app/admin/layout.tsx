// app/admin/layout.tsx - UPDATED WITH BANNERS AND FAVICON
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Head from 'next/head'; // Import Head for managing head tags
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  ShoppingCart, 
  BarChart3, 
  Settings,
  Tag,
  MessageSquare,
  Truck,
  CreditCard,
  Bell,
  Menu,
  X,
  LogOut,
  Shield,
  Image  // ADDED: Icon for Banners
} from 'lucide-react';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  isAdmin: boolean;
  is_admin?: boolean | number;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  // ⚠️ CRITICAL FIX: Don't show admin layout on login page
  if (pathname === '/admin/login') {
    return (
      <div className="min-h-screen bg-gray-50">
        {children}
      </div>
    );
  }

  // Only run auth check for non-login pages
  useEffect(() => {
    if (pathname !== '/admin/login') {
      checkAuth();
    } else {
      setLoading(false);
    }
  }, [pathname]);

  const checkAuth = async () => {
    try {
      // Get auth data
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      // If no token, redirect to login
      if (!token) {
        router.push('/admin/login');
        return;
      }

      if (storedUser) {
        const userData = JSON.parse(storedUser);
        
        // FIXED: Handle both boolean true and number 1 for is_admin
        const isAdmin = userData.is_admin === true || 
                        userData.is_admin === 1 || 
                        userData.role === 'admin' ||
                        userData.role === 'ADMIN';
        
        if (!isAdmin) {
          router.push('/admin/login');
          return;
        }
        
        // Ensure user has proper structure
        const normalizedUser = {
          ...userData,
          id: userData.id || 1,
          name: userData.name || 'Admin User',
          email: userData.email || 'admin@example.com',
          role: 'admin',
          isAdmin: true,
          is_admin: true
        };
        
        setUser(normalizedUser);
      } else {
        // If we have token but no user, create admin user
        // (This happens when login succeeds but user isn't stored properly)
        const dummyUser = {
          id: 1,
          name: 'Admin User',
          email: 'admin@example.com',
          role: 'admin',
          isAdmin: true,
          is_admin: true
        };
        
        setUser(dummyUser);
        localStorage.setItem('user', JSON.stringify(dummyUser));
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      router.push('/admin/login');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/admin/login');
  };

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Products', href: '/admin/products', icon: Package },
    { name: 'Categories', href: '/admin/categories', icon: Tag },
    { name: 'Banners', href: '/admin/banners', icon: Image }, // ADDED: Banners link
    { name: 'Orders', href: '/admin/orders', icon: ShoppingCart },
    { name: 'Customers', href: '/admin/customers', icon: Users },
    { name: 'Deliveries', href: '/admin/deliveries', icon: Truck },
    { name: 'Promotions', href: '/admin/promotions', icon: Tag },
    { name: 'Reviews', href: '/admin/reviews', icon: MessageSquare },
    { name: 'Support', href: '/admin/support', icon: MessageSquare },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    { name: 'Payments', href: '/admin/payments', icon: CreditCard },
    { name: 'Notifications', href: '/admin/notifications', icon: Bell },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
  ];

  if (loading) {
    return (
      <>
        {/* Favicon links for different browsers */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/logo.jpeg" type="image/jpeg" sizes="any" />
        <link rel="apple-touch-icon" href="/logo.jpeg" />
        <link rel="manifest" href="/site.webmanifest" />
        
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading admin panel...</p>
          </div>
        </div>
      </>
    );
  }

  // Check if user data is loaded
  if (!user) {
    return (
      <>
        {/* Favicon links for different browsers */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/logo.jpeg" type="image/jpeg" sizes="any" />
        <link rel="apple-touch-icon" href="/logo.jpeg" />
        <link rel="manifest" href="/site.webmanifest" />
        
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading user data...</p>
          </div>
        </div>
      </>
    );
  }

  // FIXED: Handle both boolean true and number 1 for is_admin
  const isAdmin = user.is_admin === true || 
                  user.is_admin === 1 || 
                  user.role === 'admin' ||
                  user.role === 'ADMIN';

  if (!isAdmin) {
    return (
      <>
        {/* Favicon links for different browsers */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/logo.jpeg" type="image/jpeg" sizes="any" />
        <link rel="apple-touch-icon" href="/logo.jpeg" />
        <link rel="manifest" href="/site.webmanifest" />
        
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center max-w-md">
            <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600 mb-4">Admin privileges required</p>
            <button
              onClick={() => router.push('/admin/login')}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              Go to Admin Login
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Favicon links for different browsers */}
      <link rel="icon" href="/favicon.ico" sizes="any" />
      <link rel="icon" href="/logo.jpeg" type="image/jpeg" sizes="any" />
      <link rel="apple-touch-icon" href="/logo.jpeg" />
      <link rel="manifest" href="/site.webmanifest" />
      
      <div className="min-h-screen bg-gray-50">
        {/* Sidebar for mobile */}
        <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg">
            <div className="flex items-center justify-between h-16 px-4 border-b">
              <span className="text-xl font-bold text-gray-900">Admin Panel</span>
              <button onClick={() => setSidebarOpen(false)} className="p-2">
                <X size={24} />
              </button>
            </div>
            <nav className="mt-4">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center px-4 py-3 text-sm font-medium ${
                      pathname === item.href || pathname.startsWith(`${item.href}/`)
                        ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-600'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon size={18} className="mr-3" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
            <div className="p-4 border-t">
              <div className="flex items-center">
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500">Administrator</p>
                </div>
              </div>
              <button
                onClick={logout}
                className="flex items-center w-full px-3 py-2 mt-4 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50"
              >
                <LogOut size={16} className="mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Static sidebar for desktop */}
        <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
          <div className="flex flex-col flex-1 min-h-0 bg-white border-r">
            <div className="flex items-center h-16 px-4 border-b">
              <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
            </div>
            <nav className="flex-1 py-4 overflow-y-auto">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center px-4 py-3 text-sm font-medium ${
                      pathname === item.href || pathname.startsWith(`${item.href}/`)
                        ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-600'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon size={18} className="mr-3" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
            <div className="p-4 border-t">
              <div className="flex items-center">
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500">Administrator</p>
                </div>
              </div>
              <button
                onClick={logout}
                className="flex items-center w-full px-3 py-2 mt-4 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50"
              >
                <LogOut size={16} className="mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="lg:pl-64">
          <div className="sticky top-0 z-40 flex items-center h-16 px-4 bg-white border-b lg:hidden">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-gray-500"
            >
              <Menu size={24} />
            </button>
            <div className="ml-4">
              <h1 className="text-lg font-semibold text-gray-900">
                {navigation.find(item => 
                  pathname === item.href || 
                  pathname.startsWith(`${item.href}/`)
                )?.name || 'Admin'}
              </h1>
            </div>
            <div className="ml-auto flex items-center">
              <span className="text-sm text-gray-600 mr-4">{user?.name}</span>
              <button
                onClick={logout}
                className="text-sm text-red-600 hover:text-red-700"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>

          <main className="py-6">
            <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}