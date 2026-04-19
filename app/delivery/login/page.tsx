'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DeliveryLoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');
  const [showPw, setShowPw] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); 
    setError('');

    try {
      // FIXED: Changed from '/delivery-staff/login' to '/login'
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        // Handle both possible response formats
        const token = data.token || data.data?.token;
        const user = data.user || data.data?.staff || data.data?.user;
        
        if (token && user) {
          localStorage.setItem('delivery_token', token);
          localStorage.setItem('delivery_user', JSON.stringify(user));
          router.push('/delivery/dashboard');
        } else {
          setError('Invalid response format from server');
        }
      } else {
        setError(data.message || 'Invalid credentials');
      }
    } catch {
      setError('Connection failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{background:'#080808'}}>
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full" style={{background:'radial-gradient(circle,rgba(16,185,129,.15) 0%,transparent 70%)'}}/>
        <div className="absolute -bottom-40 -right-40 w-80 h-80 rounded-full" style={{background:'radial-gradient(circle,rgba(16,185,129,.08) 0%,transparent 70%)'}}/>
      </div>
      <div className="w-full max-w-sm relative">
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{background:'linear-gradient(135deg,#10b981,#059669)',boxShadow:'0 0 32px rgba(16,185,129,.35)'}}>
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9 1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Driver Portal</h1>
          <p className="text-sm mt-1 text-gray-500">Sign in to start delivering</p>
        </div>
        <div className="rounded-3xl p-8" style={{background:'#111',border:'1px solid #1f1f1f'}}>
          {error && (
            <div className="mb-5 p-3.5 rounded-xl flex items-center gap-3 text-sm"
              style={{background:'rgba(239,68,68,.08)',border:'1px solid rgba(239,68,68,.2)',color:'#f87171'}}>
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold mb-2 uppercase tracking-widest text-gray-500">Email</label>
              <div className="relative">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z"/>
                </svg>
                <input type="email" value={formData.email} onChange={e=>setFormData(p=>({...p,email:e.target.value}))}
                  placeholder="driver@example.com" required disabled={loading}
                  className="w-full pl-10 pr-4 py-3.5 rounded-xl text-sm text-white placeholder-gray-700 outline-none transition-all disabled:opacity-50"
                  style={{background:'#1a1a1a',border:'1px solid #2a2a2a'}}
                  onFocus={e=>(e.target.style.borderColor='#10b981')}
                  onBlur={e=>(e.target.style.borderColor='#2a2a2a')}/>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-2 uppercase tracking-widest text-gray-500">Password</label>
              <div className="relative">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                </svg>
                <input type={showPw?'text':'password'} value={formData.password} onChange={e=>setFormData(p=>({...p,password:e.target.value}))}
                  placeholder="••••••••" required disabled={loading}
                  className="w-full pl-10 pr-12 py-3.5 rounded-xl text-sm text-white placeholder-gray-700 outline-none transition-all disabled:opacity-50"
                  style={{background:'#1a1a1a',border:'1px solid #2a2a2a'}}
                  onFocus={e=>(e.target.style.borderColor='#10b981')}
                  onBlur={e=>(e.target.style.borderColor='#2a2a2a')}/>
                <button type="button" onClick={()=>setShowPw(p=>!p)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-600">
                  {showPw
                    ? <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
                    : <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M2.39 1.73 1 3.12l2.05 2.05C1.77 6.38.78 8.08.01 10c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l2.02 2.02 1.39-1.39L2.39 1.73zM12 17c-2.76 0-5-2.24-5-5 0-.77.18-1.5.49-2.14l1.57 1.57c-.03.18-.06.37-.06.57 0 1.66 1.34 3 3 3 .2 0 .38-.03.57-.07L14.14 16.51C13.5 16.82 12.77 17 12 17zm4.97-4.81-6.16-6.16C11.21 5.72 11.6 5.5 12 5.5c2.76 0 5 2.24 5 5 0 .4-.22.79-.03 1.19z"/></svg>}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-4 rounded-xl text-sm font-bold text-black tracking-tight transition-all disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
              style={{background:'linear-gradient(135deg,#10b981,#059669)'}}>
              {loading ? (<><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Signing in...</>) : 'Start Driving →'}
            </button>
          </form>
          <div className="flex items-center justify-between mt-6 pt-6" style={{borderTop:'1px solid #1f1f1f'}}>
            <Link href="/delivery/forgot-password" className="text-xs font-medium" style={{color:'#10b981'}}>Forgot password?</Link>
            <Link href="/" className="text-xs text-gray-600">← Main site</Link>
          </div>
        </div>
        <p className="text-center text-xs mt-6 text-gray-800">© {new Date().getFullYear()} Lando Ranch Delivery</p>
      </div>
    </div>
  );
}