'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';

interface RouteDelivery {
  id: number; order_number: string; status: string;
  delivery_address: string; customer_name?: string; customer_phone?: string;
  estimated_delivery_time: string; actual_delivery_time?: string;
  delivery_fee: number; delivery_notes?: string;
  current_latitude?: number; current_longitude?: number;
  latitude?: number; longitude?: number;
}

const API = process.env.NEXT_PUBLIC_API_URL || '';
async function api(path: string, opts: RequestInit = {}) {
  const token = localStorage.getItem('delivery_token');
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json', Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  return res.json();
}

const STEPS = [
  { key: 'assigned',         label: 'Assigned',          icon: '📋', desc: 'Head to pickup' },
  { key: 'in_transit',       label: 'Picked Up',          icon: '🏪', desc: 'En route to customer' },
  { key: 'out_for_delivery', label: 'At Destination',     icon: '📍', desc: 'Find & verify customer' },
  { key: 'delivered',        label: 'Delivered',          icon: '✅', desc: 'Completed' },
];

export default function DeliveryRoutePage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [delivery, setDelivery] = useState<RouteDelivery | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [tracking, setTracking] = useState(false);
  const [otp,      setOtp]      = useState('');
  const [showOtp,  setShowOtp]  = useState(false);
  const [busy,     setBusy]     = useState(false);
  const [toast,    setToast]    = useState('');
  const watchRef = useRef<number | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3200); };

  const load = useCallback(async () => {
    try {
      const d = await api(`/delivery-staff/deliveries/${id}`);
      if (d.success) setDelivery(d.data);
    } catch {} finally { setLoading(false); }
  }, [id]);

  useEffect(() => {
    if (!localStorage.getItem('delivery_token')) { router.push('/delivery/login'); return; }
    load();
    const iv = setInterval(load, 20000);
    return () => { clearInterval(iv); if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current); };
  }, [load, router]);

  const startTracking = () => {
    if (!navigator.geolocation) { showToast('Geolocation not supported'); return; }
    setTracking(true);
    watchRef.current = navigator.geolocation.watchPosition(
      async ({ coords }) => {
        try {
          await api(`/delivery-staff/deliveries/${id}/location`, {
            method: 'POST',
            body: JSON.stringify({ latitude: coords.latitude, longitude: coords.longitude, accuracy: coords.accuracy }),
          });
        } catch {}
      },
      () => { setTracking(false); showToast('Location access denied'); },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );
    showToast('📍 Live tracking started');
  };

  const stopTracking = () => {
    if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
    watchRef.current = null; setTracking(false); showToast('Tracking stopped');
  };

  const doStatus = async (status: string) => {
    setBusy(true);
    try {
      const r = await api(`/delivery-staff/deliveries/${id}/status`, {
        method: 'PUT', body: JSON.stringify({ status }),
      });
      if (r.success) { showToast('✅ Status updated!'); load(); }
      else showToast('❌ ' + (r.message || 'Error'));
    } catch { showToast('❌ Network error'); }
    finally { setBusy(false); }
  };

  const doVerify = async () => {
    if (otp.length < 4) return;
    setBusy(true);
    try {
      const r = await api(`/delivery-staff/deliveries/${id}/verify`, {
        method: 'POST', body: JSON.stringify({ otp }),
      });
      if (r.success) { showToast('🎉 Delivery completed!'); setTimeout(() => router.push('/delivery/dashboard'), 1500); }
      else showToast('❌ ' + (r.message || 'Invalid OTP'));
    } catch { showToast('❌ Network error'); }
    finally { setBusy(false); }
  };

  const openMaps = () => {
    if (!delivery?.latitude || !delivery?.longitude) { showToast('No coordinates available'); return; }
    const url = `https://www.google.com/maps/dir/?api=1&destination=${delivery.latitude},${delivery.longitude}&travelmode=driving`;
    window.open(url, '_blank');
  };

  const callCustomer = () => {
    if (delivery?.customer_phone) window.open(`tel:${delivery.customer_phone}`);
    else showToast('No phone number available');
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#080808' }}>
      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl animate-pulse"
        style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}>🗺️</div>
    </div>
  );

  if (!delivery) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4" style={{ background: '#080808' }}>
      <p className="text-white">Delivery not found</p>
      <button onClick={() => router.push('/delivery/dashboard')}
        className="px-6 py-3 rounded-xl text-sm font-bold text-black"
        style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}>← Dashboard</button>
    </div>
  );

  const stepIdx = STEPS.findIndex(s => s.key === delivery.status);
  const d = delivery;

  return (
    <div className="min-h-screen" style={{ background: '#080808', color: '#fff', fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif" }}>

      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-sm shadow-2xl"
          style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', whiteSpace: 'nowrap', zIndex: 9999 }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-4 h-16"
        style={{ background: 'rgba(8,8,8,.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #1a1a1a' }}>
        <button onClick={() => router.push('/delivery/dashboard')}
          className="flex items-center gap-2 text-sm font-semibold" style={{ color: '#10b981' }}>
          ← Dashboard
        </button>
        <span className="font-bold text-sm">#{d.order_number}</span>
        <button onClick={tracking ? stopTracking : startTracking}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
          style={{
            background: tracking ? 'rgba(239,68,68,.12)' : 'rgba(16,185,129,.12)',
            border: `1px solid ${tracking ? 'rgba(239,68,68,.3)' : 'rgba(16,185,129,.3)'}`,
            color: tracking ? '#f87171' : '#10b981',
          }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{
            background: tracking ? '#ef4444' : '#10b981',
            animation: tracking ? 'pulse 1s infinite' : 'none',
          }} />
          {tracking ? 'Stop' : 'Track Me'}
        </button>
      </header>

      <div className="px-4 py-5 max-w-xl mx-auto pb-8">

        {/* Progress */}
        <div className="rounded-2xl p-5 mb-4" style={{ background: '#111', border: '1px solid #1f1f1f' }}>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">Progress</p>
          <div className="relative flex items-start justify-between">
            {/* Track line */}
            <div className="absolute top-4 left-4 right-4 h-0.5" style={{ background: '#2a2a2a' }} />
            <div className="absolute top-4 left-4 h-0.5 transition-all duration-500"
              style={{ background: 'linear-gradient(90deg,#10b981,#059669)', width: `${Math.max(0, stepIdx / (STEPS.length - 1)) * 100}%`, right: 'auto' }} />
            {STEPS.map((step, i) => {
              const done = i < stepIdx, active = i === stepIdx;
              return (
                <div key={step.key} className="relative flex flex-col items-center gap-2 flex-1">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all z-10"
                    style={{
                      background: done ? '#10b981' : active ? '#111' : '#1a1a1a',
                      border: `2px solid ${done || active ? '#10b981' : '#2a2a2a'}`,
                      boxShadow: active ? '0 0 16px rgba(16,185,129,.4)' : 'none',
                      color: done ? '#000' : '#fff',
                    }}>
                    {done ? '✓' : step.icon}
                  </div>
                  <p className="text-center leading-tight" style={{ color: done || active ? '#e5e7eb' : '#4b5563', fontSize: '10px', fontWeight: active ? 700 : 400 }}>
                    {step.label}
                  </p>
                </div>
              );
            })}
          </div>
          {stepIdx >= 0 && (
            <div className="mt-4 px-3 py-2.5 rounded-xl text-xs font-medium"
              style={{ background: 'rgba(16,185,129,.08)', border: '1px solid rgba(16,185,129,.15)', color: '#10b981' }}>
              📌 {STEPS[stepIdx]?.desc}
            </div>
          )}
        </div>

        {/* Map placeholder */}
        <div className="rounded-2xl overflow-hidden mb-4 relative" style={{ background: '#111', border: '1px solid #1f1f1f', height: '200px' }}>
          <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#0d1a0f,#111)' }}>
            <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 400 200" preserveAspectRatio="none">
              {Array.from({ length: 10 }).map((_, i) => (
                <React.Fragment key={i}>
                  <line x1={`${i * 11}%`} y1="0" x2={`${i * 11}%`} y2="100%" stroke="#10b981" strokeWidth="0.5" />
                  <line x1="0" y1={`${i * 11}%`} x2="100%" y2={`${i * 11}%`} stroke="#10b981" strokeWidth="0.5" />
                </React.Fragment>
              ))}
            </svg>
            {/* Route line */}
            <svg className="absolute inset-0 w-full h-full">
              <defs>
                <marker id="arrow" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
                  <circle cx="4" cy="4" r="2" fill="#10b981" />
                </marker>
              </defs>
              <path d="M 60 170 Q 150 130 200 100 Q 260 70 330 50"
                stroke="#10b981" strokeWidth="2.5" fill="none" strokeDasharray="8 5" strokeLinecap="round"
                style={{ filter: 'drop-shadow(0 0 6px #10b981)' }} />
              <circle cx="60" cy="170" r="7" fill="#f97316" style={{ filter: 'drop-shadow(0 0 8px #f97316)' }} />
              <circle cx="330" cy="50" r="7" fill="#10b981" style={{ filter: 'drop-shadow(0 0 8px #10b981)' }} />
            </svg>
            <div className="text-center z-10">
              <p className="text-3xl mb-2">🗺️</p>
              <p className="text-sm font-semibold text-white">Route Overview</p>
              {d.latitude && d.longitude && (
                <p className="text-xs mt-1" style={{ color: '#4b5563' }}>{d.latitude.toFixed(4)}, {d.longitude.toFixed(4)}</p>
              )}
            </div>
          </div>
          {/* Open in Maps button */}
          <button onClick={openMaps}
            className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold"
            style={{ background: 'rgba(16,185,129,.9)', color: '#000' }}>
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
            Open in Maps
          </button>
        </div>

        {/* Destination card */}
        <div className="rounded-2xl p-5 mb-4" style={{ background: '#111', border: '1px solid #1f1f1f' }}>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Delivery To</p>
          <p className="font-semibold mb-1">{d.customer_name || 'Customer'}</p>
          <p className="text-sm text-gray-400 mb-3 leading-snug">📍 {d.delivery_address}</p>
          {d.delivery_notes && (
            <div className="px-3 py-2 rounded-xl text-xs mb-3"
              style={{ background: 'rgba(245,158,11,.06)', border: '1px solid rgba(245,158,11,.15)', color: '#f59e0b' }}>
              ⚠️ {d.delivery_notes}
            </div>
          )}
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-600">
              🕐 {new Date(d.estimated_delivery_time).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}
            </span>
            {d.delivery_fee > 0 && (
              <span className="text-xs font-bold" style={{ color: '#10b981' }}>+KES {d.delivery_fee}</span>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <button onClick={callCustomer}
            className="flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-bold"
            style={{ background: 'rgba(59,130,246,.1)', border: '1px solid rgba(59,130,246,.2)', color: '#3b82f6' }}>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
            </svg>
            Call Customer
          </button>
          <button onClick={openMaps}
            className="flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-bold"
            style={{ background: 'rgba(16,185,129,.1)', border: '1px solid rgba(16,185,129,.2)', color: '#10b981' }}>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
            Navigate
          </button>
        </div>

        {/* Status action buttons */}
        <div className="flex flex-col gap-3">
          {d.status === 'assigned' && (
            <button onClick={() => doStatus('in_transit')} disabled={busy}
              className="w-full py-4 rounded-2xl text-sm font-bold text-black disabled:opacity-50 transition-all"
              style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}>
              {busy ? '⏳ Updating...' : '🚗 Start Delivery — I\'ve Picked Up'}
            </button>
          )}
          {d.status === 'in_transit' && (
            <button onClick={() => doStatus('out_for_delivery')} disabled={busy}
              className="w-full py-4 rounded-2xl text-sm font-bold text-black disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }}>
              {busy ? '⏳ Updating...' : '📦 I\'ve Arrived — Out for Delivery'}
            </button>
          )}
          {d.status === 'out_for_delivery' && !showOtp && (
            <button onClick={() => setShowOtp(true)}
              className="w-full py-4 rounded-2xl text-sm font-bold text-black"
              style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}>
              ✅ Complete Delivery — Enter OTP
            </button>
          )}

          {/* OTP Entry */}
          {showOtp && (
            <div className="rounded-2xl p-5" style={{ background: '#111', border: '1px solid #1f1f1f' }}>
              <p className="font-bold mb-1">Enter Customer OTP</p>
              <p className="text-xs text-gray-500 mb-5">Ask the customer for their delivery confirmation code</p>
              <div className="flex gap-2 justify-center mb-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="w-10 h-12 rounded-xl flex items-center justify-center text-lg font-bold"
                    style={{ background: '#1a1a1a', border: `2px solid ${i < otp.length ? '#10b981' : '#2a2a2a'}` }}>
                    {otp[i] || ''}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {['1','2','3','4','5','6','7','8','9','A','0','⌫'].map(k => (
                  <button key={k} onClick={() => {
                    if (k === '⌫') setOtp(p => p.slice(0, -1));
                    else if (otp.length < 6) setOtp(p => p + k);
                  }} className="py-3.5 rounded-xl text-base font-bold text-gray-200 transition-all"
                    style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#222')}
                    onMouseLeave={e => (e.currentTarget.style.background = '#1a1a1a')}>
                    {k}
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setShowOtp(false); setOtp(''); }}
                  className="flex-1 py-3.5 rounded-xl text-sm font-semibold text-gray-400"
                  style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}>
                  Cancel
                </button>
                <button onClick={doVerify} disabled={otp.length < 4 || busy}
                  className="flex-1 py-3.5 rounded-xl text-sm font-bold text-black disabled:opacity-40"
                  style={{ background: otp.length >= 4 ? 'linear-gradient(135deg,#10b981,#059669)' : '#1a1a1a', color: otp.length >= 4 ? '#000' : '#4b5563' }}>
                  {busy ? '⏳ Verifying...' : '✅ Confirm'}
                </button>
              </div>
            </div>
          )}

          {/* Report issue */}
          {!['delivered', 'failed', 'cancelled'].includes(d.status) && (
            <button onClick={() => doStatus('failed')} disabled={busy}
              className="w-full py-3.5 rounded-2xl text-sm font-semibold"
              style={{ background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', color: '#f87171' }}>
              ❌ Report Delivery Issue
            </button>
          )}

          {['delivered', 'failed', 'cancelled'].includes(d.status) && (
            <div className="rounded-2xl p-4 text-center"
              style={{ background: d.status === 'delivered' ? 'rgba(16,185,129,.08)' : 'rgba(239,68,68,.08)', border: `1px solid ${d.status === 'delivered' ? 'rgba(16,185,129,.2)' : 'rgba(239,68,68,.2)'}` }}>
              <p className="text-lg font-bold" style={{ color: d.status === 'delivered' ? '#10b981' : '#f87171' }}>
                {d.status === 'delivered' ? '✅ Delivery Completed' : '❌ Delivery ' + d.status}
              </p>
              {d.actual_delivery_time && (
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(d.actual_delivery_time).toLocaleString('en-KE')}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
    </div>
  );
}