'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, Mail, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '@/lib/api'; // Import your API service
import toast from 'react-hot-toast';

export default function AdminLoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: 'admin@example.com',
    password: 'Admin@123',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [debugInfo, setDebugInfo] = useState({
    token: '',
    hasUser: false,
    userRole: '',
    isAdmin: false,
  });

  useEffect(() => {
    // Clear any old auth data when login page loads
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    
    // Update debug info after component mounts
    updateDebugInfo();
  }, []);

  const updateDebugInfo = () => {
    const token = localStorage.getItem('token') || '';
    const userStr = localStorage.getItem('user');
    let user = null;
    let isAdmin = false;
    let userRole = '';

    if (userStr) {
      try {
        user = JSON.parse(userStr);
        userRole = user?.role || '';
        isAdmin = user?.role === 'admin' || user?.is_admin === true || user?.isAdmin === true;
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }

    setDebugInfo({
      token: token ? token.substring(0, 20) + '...' : 'None',
      hasUser: !!user,
      userRole: userRole,
      isAdmin: isAdmin,
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Use your API service for admin login
      const response = await api.auth.adminLogin({ 
        email: formData.email, 
        password: formData.password 
      });
      
      const { user, token, message } = response.data;
      
      // Verify admin status
      const isAdmin = user.is_admin === true || 
                      user.is_admin === 1 || 
                      user.role === 'admin' ||
                      user.role === 'ADMIN';
      
      if (!isAdmin) {
        setError('Access denied. Admin privileges required.');
        toast.error('Access denied. Admin privileges required.');
        return;
      }

      // ✅ SAVE AUTH DATA PROPERLY
      // 1. Store in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify({
        ...user,
        isAdmin: true,
        is_admin: true
      }));
      
      // 2. Store in cookies for middleware (if needed)
      document.cookie = `token=${token}; path=/; max-age=86400; SameSite=Lax`;
      document.cookie = `user=${encodeURIComponent(JSON.stringify(user))}; path=/; max-age=86400; SameSite=Lax`;

      console.log('✅ Admin login successful!');
      console.log('Token saved:', token.substring(0, 20) + '...');
      console.log('User saved:', user);
      
      setSuccess('Login successful! Redirecting...');
      toast.success('Admin login successful! Redirecting...');
      updateDebugInfo();
      
      // ✅ Redirect to admin dashboard
      setTimeout(() => {
        router.push('/admin/dashboard');
        router.refresh();
      }, 1000);
      
    } catch (err: any) {
      console.error('Admin login error:', err);
      
      // Handle specific error cases
      let errorMessage = 'Login failed. Please check your credentials.';
      
      if (err.response?.status === 422) {
        // Validation errors
        const errors = err.response.data.errors;
        if (errors) {
          const firstError = Object.values(errors)[0];
          if (Array.isArray(firstError)) {
            errorMessage = firstError[0];
          } else if (typeof firstError === 'string') {
            errorMessage = firstError;
          }
        } else {
          errorMessage = err.response.data.message || errorMessage;
        }
      } else if (err.response?.status === 401) {
        errorMessage = 'Invalid email or password';
      } else if (err.response?.status === 403) {
        errorMessage = 'Access denied. Admin privileges required.';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message === 'Network Error') {
        errorMessage = 'Network error. Please check your connection.';
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Debug functions
  const logDebugInfo = () => {
    console.log('=== DEBUG INFO ===');
    console.log('Current pathname:', window.location.pathname);
    console.log('LocalStorage token:', localStorage.getItem('token')?.substring(0, 20) + '...');
    console.log('LocalStorage user:', localStorage.getItem('user'));
    console.log('Cookies:', document.cookie);
    console.log('Form data:', formData);
    console.log('=== END DEBUG ===');
  };

  const clearLocalStorage = () => {
    localStorage.clear();
    document.cookie.split(';').forEach(c => {
      document.cookie = c.replace(/^ +/, '').replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
    });
    updateDebugInfo();
    setSuccess('Storage cleared!');
    toast.success('Storage cleared!');
    setTimeout(() => setSuccess(''), 2000);
  };

  const testAdminAccess = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('No token found. Please login first.');
        return;
      }

      // Use your API service to test admin access
      const response = await api.admin.getDashboardStats();
      
      if (response.data) {
        toast.success('✅ Admin access successful! You have access to admin dashboard.');
        console.log('Admin dashboard stats:', response.data);
      }
    } catch (err: any) {
      console.error('Admin access test error:', err);
      
      if (err.response?.status === 401 || err.response?.status === 403) {
        toast.error('❌ Access denied. You do not have admin privileges.');
      } else {
        toast.error('❌ Admin access test failed!');
      }
    }
  };

  const checkCurrentAuth = () => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    let user = null;
    if (userStr) {
      try {
        user = JSON.parse(userStr);
      } catch (e) {
        console.error('Error parsing user:', e);
      }
    }

    toast(
      `Current Auth Status:\n\n` +
      `Token: ${token ? 'Present ✓' : 'Missing ✗'}\n` +
      `User: ${user ? 'Present ✓' : 'Missing ✗'}\n` +
      `Role: ${user?.role || 'None'}\n` +
      `Is Admin: ${user?.role === 'admin' ? 'Yes ✓' : 'No ✗'}\n` +
      `Email: ${user?.email || 'None'}`,
      {
        duration: 5000,
      }
    );
  };

  const autoLogin = async () => {
    setFormData({ email: 'admin@example.com', password: 'Admin@123' });
    
    // Small delay to allow state update
    setTimeout(() => {
      handleSubmit(new Event('submit') as any);
    }, 100);
  };

  const testApiConnection = async () => {
    try {
      // Test basic API connection
      const response = await api.get('/api-status');
      toast.success(`✅ API Connection Successful!\nStatus: ${response.data.status}\nVersion: ${response.data.version}`);
      console.log('API Test Response:', response.data);
    } catch (err: any) {
      console.error('API Test Error:', err);
      
      if (err.response) {
        toast.error(`❌ API Error: ${err.response.status} - ${err.response.statusText}`);
      } else if (err.request) {
        toast.error('❌ No response from server. Check if backend is running.');
      } else {
        toast.error('❌ API Connection Failed! Check console for details.');
      }
    }
  };

  const testAdminLoginEndpoint = async () => {
    try {
      const response = await api.auth.adminLogin({ 
        email: 'admin@example.com', 
        password: 'Admin@123' 
      });
      
      toast.success(`✅ Admin Login Endpoint Test:\nStatus: Success\nToken: ${response.data.token ? 'Received ✓' : 'Missing ✗'}`);
      console.log('Admin login endpoint test:', response.data);
    } catch (err: any) {
      console.error('Admin endpoint test error:', err);
      
      if (err.response) {
        toast.error(`❌ Admin Endpoint Error: ${err.response.status} - ${err.response.data?.message || err.response.statusText}`);
      } else {
        toast.error('❌ Admin endpoint test failed!');
      }
    }
  };

  const goToDashboard = () => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (!token || !userStr) {
      toast.error('Please login first!');
      return;
    }
    
    try {
      const user = JSON.parse(userStr);
      if (user.role !== 'admin') {
        toast.error('Access denied. Admin privileges required.');
        return;
      }
      
      router.push('/admin');
    } catch (e) {
      toast.error('Invalid user data. Please login again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-blue-100 mb-4">
            <Lock className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">
            Admin Portal
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Restricted access to authorized personnel only
          </p>
        </div>

        {/* Debug Panel */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-medium text-blue-800 mb-2 flex items-center">
            <AlertCircle className="h-4 w-4 mr-2" />
            Debug Panel
          </h3>
          <div className="text-sm text-blue-700 space-y-1 mb-3">
            <p className="font-medium">Default Credentials:</p>
            <p>Email: admin@example.com</p>
            <p>Password: Admin@123</p>
          </div>
          <div className="text-xs text-blue-600 space-y-1 mb-3">
            <p>Token: {debugInfo.token}</p>
            <p>User Role: {debugInfo.userRole || 'None'}</p>
            <p>Is Admin: {debugInfo.isAdmin ? 'Yes ✓' : 'No ✗'}</p>
            <p>Has User: {debugInfo.hasUser ? 'Yes ✓' : 'No ✗'}</p>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              onClick={autoLogin}
              disabled={loading}
              className="px-3 py-2 text-xs bg-green-100 hover:bg-green-200 rounded border border-green-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Auto Login
            </button>
            <button
              onClick={testApiConnection}
              className="px-3 py-2 text-xs bg-teal-100 hover:bg-teal-200 rounded border border-teal-200"
            >
              Test API
            </button>
            <button
              onClick={testAdminLoginEndpoint}
              className="px-3 py-2 text-xs bg-purple-100 hover:bg-purple-200 rounded border border-purple-200"
            >
              Test Admin Login
            </button>
            <button
              onClick={testAdminAccess}
              className="px-3 py-2 text-xs bg-indigo-100 hover:bg-indigo-200 rounded border border-indigo-200"
            >
              Test Admin Access
            </button>
            <button
              onClick={logDebugInfo}
              className="px-3 py-2 text-xs bg-gray-100 hover:bg-gray-200 rounded border border-gray-200"
            >
              Log Debug
            </button>
            <button
              onClick={clearLocalStorage}
              className="px-3 py-2 text-xs bg-red-100 hover:bg-red-200 rounded border border-red-200"
            >
              Clear Storage
            </button>
            <button
              onClick={goToDashboard}
              className="col-span-2 px-3 py-2 text-xs bg-blue-100 hover:bg-blue-200 rounded border border-blue-200"
            >
              Go to Dashboard
            </button>
          </div>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">{error}</h3>
                </div>
              </div>
            </div>
          )}

          {success && (
            <div className="rounded-md bg-green-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">{success}</h3>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="appearance-none rounded-none relative block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Email address"
                />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="appearance-none rounded-none relative block w-full px-3 py-3 pl-10 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <button
                type="button"
                onClick={() => alert('Contact system administrator for password reset.')}
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Forgot password?
              </button>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  Authenticating...
                </>
              ) : (
                'Sign in as Admin'
              )}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Regular user?{' '}
              <Link href="/auth/login" className="font-medium text-blue-600 hover:text-blue-500">
                Go to user login
              </Link>
            </p>
          </div>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="text-center">
            <p className="text-xs text-gray-500">
              <span className="font-medium">Security Notice:</span> This portal is restricted to authorized personnel only.
              Unauthorized access attempts will be logged and may be subject to legal action.
            </p>
            <p className="mt-2 text-xs text-gray-400">
              System Version: 1.0.0 • Last Updated: {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}