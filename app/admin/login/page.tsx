'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, Mail, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

export default function AdminLoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.auth.adminLogin({ 
        email: formData.email, 
        password: formData.password 
      });
      
      const { user, token } = response.data;
      
      // Verify admin status
      const isAdmin = user.is_admin === true || 
                      user.is_admin === 1 || 
                      user.role === 'admin' ||
                      user.role === 'ADMIN';
      
      if (!isAdmin) {
        setError('Access denied. Admin privileges required.');
        toast.error('Access denied. Admin privileges required.');
        setLoading(false);
        return;
      }

      // Save auth data
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify({
        ...user,
        isAdmin: true,
        is_admin: true
      }));
      
      document.cookie = `token=${token}; path=/; max-age=86400; SameSite=Lax`;
      document.cookie = `user=${encodeURIComponent(JSON.stringify(user))}; path=/; max-age=86400; SameSite=Lax`;

      toast.success('Login successful! Redirecting...');
      
      // Redirect to admin dashboard
      setTimeout(() => {
        router.push('/admin');
        router.refresh();
      }, 1000);
      
    } catch (err: any) {
      // Handle specific error cases
      let errorMessage = 'Login failed. Please check your credentials.';
      
      if (err.response?.status === 422) {
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo and Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg mb-6">
            <Lock className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900">
            Admin Portal
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Secure access for authorized personnel only
          </p>
        </div>

        {/* Login Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4 animate-in fade-in duration-200">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">{error}</h3>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="admin@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-lg placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-slate-600 transition-colors duration-200"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <input
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
              />
              <span className="ml-2 text-sm text-slate-600">
                Remember me
              </span>
            </label>

            <button
              type="button"
              onClick={() => toast('Contact system administrator for password reset.')}
              className="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors duration-200"
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin h-4 w-4 mr-2" />
                Authenticating...
              </>
            ) : (
              'Sign In as Admin'
            )}
          </button>

          <div className="text-center">
            <p className="text-sm text-slate-600">
              Regular user?{' '}
              <Link href="/auth/login" className="font-medium text-blue-600 hover:text-blue-500 transition-colors duration-200">
                Go to user login
              </Link>
            </p>
          </div>
        </form>

        {/* Security Footer */}
        <div className="mt-8 pt-6 border-t border-slate-200">
          <div className="text-center space-y-2">
            <p className="text-xs text-slate-500">
              <span className="font-medium">🔒 Security Notice:</span> This portal is restricted to authorized personnel only.
            </p>
            <p className="text-xs text-slate-400">
              Unauthorized access attempts will be logged and monitored.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}