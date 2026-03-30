'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Mail, Phone, Lock, Eye, EyeOff, Loader2, MessageCircle, ArrowRight, ShoppingBag } from 'lucide-react';
import toast from 'react-hot-toast';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: '', phone: '', password: '' });
  const [loginType, setLoginType] = useState<'email' | 'phone'>('email');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    const errors: Record<string, string> = {};
    if (loginType === 'email' && !formData.email.trim()) errors.email = 'Email is required';
    else if (loginType === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = 'Enter a valid email';
    if (loginType === 'phone' && !formData.phone.trim()) errors.phone = 'Phone number is required';
    if (!formData.password) errors.password = 'Password is required';
    if (Object.keys(errors).length) { setFormErrors(errors); toast.error(Object.values(errors)[0]); return; }

    setIsLoggingIn(true);
    try {
      const credentials = { password: formData.password, ...(loginType === 'email' ? { email: formData.email } : { phone: formData.phone }) };
      const response = await api.auth.login(credentials);
      if (response.data.token && response.data.user) {
        const { token, user } = response.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        if (rememberMe) { localStorage.setItem('remember_me', 'true'); localStorage.setItem('email', formData.email); }
        else { localStorage.removeItem('remember_me'); localStorage.removeItem('email'); }
        toast.success('Welcome back!');
        if (user.role === 'admin') router.push('/admin/dashboard');
        else router.push('/');
        router.refresh();
      } else { toast.error('Invalid response from server'); }
    } catch (error: any) {
      if (error.response?.status === 422) {
        const ve = error.response.data.errors;
        const mapped: Record<string, string> = {};
        Object.keys(ve).forEach(k => { mapped[k] = ve[k][0]; });
        setFormErrors(mapped);
        toast.error(Object.values(mapped)[0] as string);
      } else if (error.response?.data?.message) { toast.error(error.response.data.message); }
      else { toast.error('Login failed. Please try again.'); }
    } finally { setIsLoggingIn(false); }
  };

  const handleGoogleLogin = async () => {
    try { const r = await api.auth.getGoogleAuthUrl(); window.location.href = r.data.url; }
    catch { toast.error('Failed to initiate Google login'); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo + heading */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-5">
            <Image src="/logo10.png" alt="Lando Ranch" width={160} height={58} className="mx-auto object-contain h-14 w-auto" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in to your Lando Ranch account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-black/5 border border-gray-100 p-6 md:p-8">

          {/* Toggle */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-6 gap-1">
            {(['email', 'phone'] as const).map(type => (
              <button key={type} type="button" onClick={() => setLoginType(type)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-all ${loginType === type ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                {type === 'email' ? <Mail size={15} /> : <Phone size={15} />}
                {type === 'email' ? 'Email' : 'Phone'}
              </button>
            ))}
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Email or Phone */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                {loginType === 'email' ? 'Email Address' : 'Phone Number'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  {loginType === 'email' ? <Mail size={16} className="text-gray-400" /> : <Phone size={16} className="text-gray-400" />}
                </div>
                <input
                  name={loginType === 'email' ? 'email' : 'phone'}
                  type={loginType === 'email' ? 'email' : 'tel'}
                  autoComplete={loginType === 'email' ? 'email' : 'tel'}
                  value={loginType === 'email' ? formData.email : formData.phone}
                  onChange={handleChange}
                  placeholder={loginType === 'email' ? 'you@example.com' : '0712 345 678'}
                  className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl text-sm transition-all focus:outline-none bg-gray-50 focus:bg-white ${formErrors[loginType === 'email' ? 'email' : 'phone'] ? 'border-red-300 focus:border-red-400' : 'border-gray-200 focus:border-emerald-400'}`}
                />
              </div>
              {formErrors[loginType === 'email' ? 'email' : 'phone'] && (
                <p className="mt-1.5 text-xs text-red-600">{formErrors[loginType === 'email' ? 'email' : 'phone']}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-semibold text-gray-700">Password</label>
                <Link href="/auth/forgot-password" className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">Forgot password?</Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock size={16} className="text-gray-400" />
                </div>
                <input name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password"
                  value={formData.password} onChange={handleChange} placeholder="••••••••"
                  className={`w-full pl-10 pr-12 py-3 border-2 rounded-xl text-sm transition-all focus:outline-none bg-gray-50 focus:bg-white ${formErrors.password ? 'border-red-300 focus:border-red-400' : 'border-gray-200 focus:border-emerald-400'}`} />
                <button type="button" onClick={() => setShowPassword(s => !s)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {formErrors.password && <p className="mt-1.5 text-xs text-red-600">{formErrors.password}</p>}
            </div>

            {/* Remember me */}
            <div className="flex items-center gap-2">
              <input id="remember_me" type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500" />
              <label htmlFor="remember_me" className="text-sm text-gray-600 cursor-pointer">Remember me</label>
            </div>

            {/* Submit */}
            <button type="submit" disabled={isLoggingIn}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-md shadow-emerald-200 hover:shadow-emerald-300">
              {isLoggingIn ? <><Loader2 size={16} className="animate-spin" /> Signing in…</> : <>Sign In <ArrowRight size={15} /></>}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
            <div className="relative flex justify-center"><span className="px-3 bg-white text-xs text-gray-400 font-medium">Or continue with</span></div>
          </div>

          {/* Google */}
          <button onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          {/* WhatsApp Help */}
          <div className="mt-5 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
            <div className="flex items-start gap-3">
              <MessageCircle size={18} className="text-emerald-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-emerald-800 mb-0.5">Need help logging in?</p>
                <p className="text-xs text-emerald-600 mb-2">Our support team is available 24/7</p>
                <a href="https://wa.me/+254716354589?text=Hello!%20I%20need%20help%20with%20login."
                  target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-semibold rounded-lg transition-colors">
                  <MessageCircle size={12} /> Chat on WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 mt-5">
          Don&apos;t have an account?{' '}
          <Link href="/auth/register" className="font-bold text-emerald-600 hover:text-emerald-700">Create account</Link>
        </p>
      </div>
    </div>
  );
}
