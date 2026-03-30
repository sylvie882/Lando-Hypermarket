'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface Driver {
  id: number; name: string; email: string; phone: string;
  role: string; rating: number; is_online: boolean;
  vehicle_type?: string; vehicle_number?: string;
}
interface Stats {
  total_deliveries: number; completed_deliveries: number;
  pending_deliveries: number; active_deliveries: number;
  total_earnings: number; today_earnings: number; week_earnings: number;
  average_rating: number; on_time_deliveries: number;
}
interface Delivery {
  id: number; order_id: number; order_number: string;
  status: string; delivery_address: string;
  customer_name?: string; customer_phone?: string;
  estimated_delivery_time: string; actual_delivery_time?: string;
  delivery_fee: number; delivery_notes?: string; created_at: string;
  current_latitude?: number; current_longitude?: number;
  latitude?: number; longitude?: number;
}

const STATUS: Record<string, {label:string;dot:string;bg:string;text:string}> = {
  pending:          {label:'Pending',         dot:'#f59e0b',bg:'rgba(245,158,11,.1)', text:'#f59e0b'},
  assigned:         {label:'Assigned',        dot:'#3b82f6',bg:'rgba(59,130,246,.1)', text:'#3b82f6'},
  in_transit:       {label:'In Transit',      dot:'#8b5cf6',bg:'rgba(139,92,246,.1)', text:'#8b5cf6'},
  out_for_delivery: {label:'Out for Delivery',dot:'#f97316',bg:'rgba(249,115,22,.1)', text:'#f97316'},
  delivered:        {label:'Delivered',       dot:'#10b981',bg:'rgba(16,185,129,.1)', text:'#10b981'},
  failed:           {label:'Failed',          dot:'#ef4444',bg:'rgba(239,68,68,.1)',  text:'#ef4444'},
  cancelled:        {label:'Cancelled',       dot:'#6b7280',bg:'rgba(107,114,128,.1)',text:'#6b7280'},
  returned:         {label:'Returned',        dot:'#ef4444',bg:'rgba(239,68,68,.1)',  text:'#ef4444'},
};

const ICON: Record<string,string> = {
  pending:'⏳', assigned:'📋', in_transit:'🚗', out_for_delivery:'📦',
  delivered:'✅', failed:'❌', cancelled:'🚫', returned:'↩️'
};

const API = process.env.NEXT_PUBLIC_API_URL || '';

async function api(path: string, opts: RequestInit = {}) {
  const token = localStorage.getItem('delivery_token');
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json', Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    },
  });
  if (res.status === 401) throw new Error('UNAUTH');
  return res.json();
}

const KES = (n: number) =>
  new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 0 }).format(n || 0);

export default function DeliveryDashboard() {
  const router = useRouter();
  const [driver,     setDriver]     = useState<Driver | null>(null);
  const [stats,      setStats]      = useState<Stats | null>(null);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab,        setTab]        = useState<'active'|'pending'|'history'>('active');
  const [view,       setView]       = useState<'home'|'earnings'|'profile'>('home');
  const [menuOpen,   setMenuOpen]   = useState(false);
  const [statusModal,setStatusModal]= useState<Delivery|null>(null);
  const [otpModal,   setOtpModal]   = useState<Delivery|null>(null);
  const [otp,        setOtp]        = useState('');
  const [busy,       setBusy]       = useState<number|null>(null);
  const [toast,      setToast]      = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(()=>setToast(''), 3200); };

  const logout = () => {
    localStorage.removeItem('delivery_token');
    localStorage.removeItem('delivery_user');
    router.push('/delivery/login');
  };

  const load = useCallback(async (quiet = false) => {
    quiet ? setRefreshing(true) : setLoading(true);
    try {
      const [s, d] = await Promise.all([
        api('/delivery-staff/stats'),
        api('/delivery-staff/deliveries?per_page=50'),
      ]);
      if (s.success) { setStats(s.data.stats); setDriver(s.data.user); }
      if (d.success) {
        const list = d.data?.data || d.data || [];
        setDeliveries(Array.isArray(list) ? list : []);
      }
    } catch (e: unknown) {
      if ((e as Error).message === 'UNAUTH') logout();
    } finally {
      setLoading(false); setRefreshing(false);
    }
  }, []); // eslint-disable-line

  useEffect(() => {
    if (!localStorage.getItem('delivery_token')) { router.push('/delivery/login'); return; }
    try { const u = localStorage.getItem('delivery_user'); if (u) setDriver(JSON.parse(u)); } catch {}
    load();
    const iv = setInterval(() => load(true), 30000);
    return () => clearInterval(iv);
  }, [load, router]);

  const toggleOnline = async () => {
    if (!driver) return;
    const next = !driver.is_online;
    setDriver(d => d ? { ...d, is_online: next } : d);
    try { await api('/delivery-staff/online-status', { method: 'PUT', body: JSON.stringify({ is_online: next }) }); }
    catch { setDriver(d => d ? { ...d, is_online: !next } : d); }
    showToast(next ? '🟢 You are now Online' : '⚫ You are now Offline');
  };

  const doStatus = async (delivery: Delivery, status: string) => {
    setBusy(delivery.id);
    try {
      const r = await api(`/delivery-staff/deliveries/${delivery.id}/status`, {
        method: 'PUT', body: JSON.stringify({ status }),
      });
      if (r.success) { showToast(`✅ ${STATUS[status]?.label || status}`); setStatusModal(null); load(true); }
      else showToast('❌ ' + (r.message || 'Error'));
    } catch { showToast('❌ Network error'); }
    finally { setBusy(null); }
  };

  const doOTP = async () => {
    if (!otpModal || otp.length < 4) return;
    setBusy(otpModal.id);
    try {
      const r = await api(`/delivery-staff/deliveries/${otpModal.id}/verify`, {
        method: 'POST', body: JSON.stringify({ otp }),
      });
      if (r.success) { showToast('🎉 Delivery completed!'); setOtpModal(null); setOtp(''); load(true); }
      else showToast('❌ ' + (r.message || 'Invalid OTP'));
    } catch { showToast('❌ Network error'); }
    finally { setBusy(null); }
  };

  const sendLocation = (delivery: Delivery) => {
    if (!navigator.geolocation) { showToast('❌ Geolocation not supported'); return; }
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      try {
        await api(`/delivery-staff/deliveries/${delivery.id}/location`, {
          method: 'POST',
          body: JSON.stringify({ latitude: coords.latitude, longitude: coords.longitude }),
        });
        showToast('📍 Location updated');
      } catch { showToast('❌ Location update failed'); }
    }, () => showToast('❌ Location access denied'));
  };

  const filtered = deliveries.filter(d => {
    if (tab==='active')  return ['assigned','in_transit','out_for_delivery'].includes(d.status);
    if (tab==='pending') return d.status==='pending';
    return ['delivered','failed','cancelled','returned'].includes(d.status);
  });
  const counts = {
    active:  deliveries.filter(d=>['assigned','in_transit','out_for_delivery'].includes(d.status)).length,
    pending: deliveries.filter(d=>d.status==='pending').length,
    history: deliveries.filter(d=>['delivered','failed','cancelled','returned'].includes(d.status)).length,
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{background:'#080808'}}>
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl animate-pulse"
        style={{background:'linear-gradient(135deg,#10b981,#059669)'}}>🚚</div>
      <p className="text-sm text-gray-500">Loading dashboard...</p>
    </div>
  );

  /* ── helpers ── */
  const online = driver?.is_online;

  return (
    <div className="min-h-screen" style={{background:'#080808',color:'#fff',fontFamily:"'Plus Jakarta Sans',system-ui,sans-serif",paddingBottom:'72px'}}>

      {/* TOAST */}
      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-sm shadow-2xl"
          style={{background:'#1a1a1a',border:'1px solid #2a2a2a',whiteSpace:'nowrap'}}>
          {toast}
        </div>
      )}

      {/* HEADER */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-4 h-16"
        style={{background:'rgba(8,8,8,.9)',backdropFilter:'blur(12px)',borderBottom:'1px solid #1a1a1a'}}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
            style={{background:'linear-gradient(135deg,#10b981,#059669)'}}>🚚</div>
          <div>
            <p className="font-bold text-sm leading-none">{driver?.name?.split(' ')[0] || 'Driver'}</p>
            <p className="text-xs leading-none mt-0.5" style={{color:'#4b5563'}}>
              {driver?.vehicle_type ? `${driver.vehicle_type} · ${driver.vehicle_number}` : 'Delivery Driver'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Online pill */}
          <button onClick={toggleOnline}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
            style={{
              background: online ? 'rgba(16,185,129,.12)' : 'rgba(107,114,128,.12)',
              border: `1px solid ${online ? 'rgba(16,185,129,.3)' : '#2a2a2a'}`,
              color: online ? '#10b981' : '#6b7280',
            }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{
              background: online ? '#10b981' : '#6b7280',
              boxShadow: online ? '0 0 6px #10b981' : 'none',
            }}/>
            {online ? 'Online' : 'Offline'}
          </button>
          {/* Refresh */}
          <button onClick={()=>load(true)} disabled={refreshing}
            className="p-2 rounded-xl transition-colors" style={{color:'#4b5563'}}>
            <svg className={`w-4 h-4 ${refreshing?'animate-spin':''}`} fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>
            </svg>
          </button>
          {/* Menu */}
          <button onClick={()=>setMenuOpen(true)} className="p-2" style={{color:'#4b5563'}}>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
            </svg>
          </button>
        </div>
      </header>

      {/* SLIDE MENU */}
      {menuOpen && (
        <>
          <div onClick={()=>setMenuOpen(false)} className="fixed inset-0 z-50" style={{background:'rgba(0,0,0,.6)'}}/>
          <div className="fixed right-0 top-0 bottom-0 w-72 z-50 flex flex-col p-6 gap-2"
            style={{background:'#111',borderLeft:'1px solid #1f1f1f'}}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold text-black"
                style={{background:'linear-gradient(135deg,#10b981,#059669)'}}>
                {driver?.name?.[0]||'?'}
              </div>
              <div>
                <p className="font-bold">{driver?.name}</p>
                <p className="text-xs text-gray-500">⭐ {(driver?.rating||4.8).toFixed(1)} rating</p>
              </div>
            </div>
            {[
              {icon:'📊',label:'Dashboard',action:()=>{setView('home');setMenuOpen(false);}},
              {icon:'💰',label:'Earnings',action:()=>{setView('earnings');setMenuOpen(false);}},
              {icon:'👤',label:'Profile',action:()=>{setView('profile');setMenuOpen(false);}},
              {icon:'🗺️',label:'Current Route',action:()=>{
                const a=deliveries.find(d=>['in_transit','out_for_delivery'].includes(d.status));
                if(a) router.push(`/delivery/route/${a.id}`);
                else showToast('No active delivery');
                setMenuOpen(false);
              }},
            ].map(item=>(
              <button key={item.label} onClick={item.action}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors text-left"
                style={{color:'#e5e7eb'}}
                onMouseEnter={e=>(e.currentTarget.style.background='#1a1a1a')}
                onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
                <span className="text-xl">{item.icon}</span>{item.label}
              </button>
            ))}
            <div className="flex-1"/>
            <button onClick={logout}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold"
              style={{background:'rgba(239,68,68,.08)',border:'1px solid rgba(239,68,68,.2)',color:'#f87171'}}>
              <span className="text-xl">🚪</span>Sign Out
            </button>
          </div>
        </>
      )}

      {/* ── HOME VIEW ── */}
      {view==='home' && (
        <div className="px-4 py-5 max-w-xl mx-auto">
          {/* Stat cards */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            {[
              {label:"Today's Earnings",val:KES(stats?.today_earnings||0),icon:'💰',color:'#10b981'},
              {label:'Active Now',      val:`${stats?.active_deliveries||0}`,icon:'📦',color:'#3b82f6'},
              {label:'Completed',       val:`${stats?.completed_deliveries||0}`,icon:'✅',color:'#10b981'},
              {label:'Your Rating',     val:`${(stats?.average_rating||driver?.rating||4.8).toFixed(1)} ⭐`,icon:'⭐',color:'#f59e0b'},
            ].map(c=>(
              <div key={c.label} className="rounded-2xl p-4" style={{background:'#111',border:'1px solid #1f1f1f'}}>
                <span className="text-2xl mb-2 block">{c.icon}</span>
                <p className="text-xl font-bold" style={{color:c.color}}>{c.val}</p>
                <p className="text-xs text-gray-600 mt-0.5">{c.label}</p>
              </div>
            ))}
          </div>

          {/* Week banner */}
          <div className="rounded-2xl p-5 flex items-center justify-between mb-5"
            style={{background:'linear-gradient(135deg,rgba(16,185,129,.1),rgba(5,150,105,.05))',border:'1px solid rgba(16,185,129,.2)'}}>
            <div>
              <p className="text-xs font-bold mb-1" style={{color:'#10b981',letterSpacing:'.05em'}}>WEEK TOTAL</p>
              <p className="text-3xl font-bold">{KES(stats?.week_earnings||0)}</p>
            </div>
            <button onClick={()=>setView('earnings')}
              className="px-4 py-2 rounded-xl text-xs font-bold transition-all"
              style={{background:'rgba(16,185,129,.15)',border:'1px solid rgba(16,185,129,.3)',color:'#10b981'}}>
              Details →
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-1 rounded-xl mb-4" style={{background:'#111'}}>
            {(['active','pending','history'] as const).map(t=>(
              <button key={t} onClick={()=>setTab(t)}
                className="flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all capitalize"
                style={{
                  background: tab===t ? '#fff' : 'transparent',
                  color: tab===t ? '#000' : '#6b7280',
                }}>
                {t} ({counts[t]})
              </button>
            ))}
          </div>

          {/* Delivery cards */}
          <div className="flex flex-col gap-3">
            {filtered.length===0 ? (
              <div className="rounded-2xl p-10 text-center" style={{background:'#111',border:'1px solid #1f1f1f'}}>
                <p className="text-4xl mb-3">{tab==='active'?'🛵':tab==='pending'?'📋':'📂'}</p>
                <p className="text-sm text-gray-500">No {tab} deliveries</p>
              </div>
            ) : filtered.map(d=>(
              <Card key={d.id} d={d} busy={busy===d.id}
                onStatus={()=>setStatusModal(d)}
                onVerify={()=>{setOtpModal(d);setOtp('');}}
                onLocation={()=>sendLocation(d)}
                onRoute={()=>router.push(`/delivery/route/${d.id}`)}
                onStart={()=>doStatus(d,'in_transit')}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── EARNINGS VIEW ── */}
      {view==='earnings' && <EarningsView stats={stats} deliveries={deliveries} onBack={()=>setView('home')}/>}

      {/* ── PROFILE VIEW ── */}
      {view==='profile' && <ProfileView driver={driver} stats={stats} onBack={()=>setView('home')} onLogout={logout}/>}

      {/* BOTTOM NAV */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex"
        style={{background:'rgba(8,8,8,.95)',backdropFilter:'blur(12px)',borderTop:'1px solid #1a1a1a',paddingBottom:'env(safe-area-inset-bottom,8px)'}}>
        {[
          {icon:'🏠',label:'Home',    v:'home'},
          {icon:'💰',label:'Earnings',v:'earnings'},
          {icon:'👤',label:'Profile', v:'profile'},
        ].map(n=>(
          <button key={n.v} onClick={()=>setView(n.v as typeof view)}
            className="flex-1 flex flex-col items-center gap-1 py-3"
            style={{color:view===n.v?'#10b981':'#4b5563'}}>
            <span className="text-2xl" style={{filter:view===n.v?'none':'grayscale(1)'}}>{n.icon}</span>
            <span className="text-xs font-semibold">{n.label}</span>
          </button>
        ))}
      </nav>

      {/* STATUS MODAL */}
      {statusModal && (
        <Sheet onClose={()=>setStatusModal(null)} title="Update Status">
          <p className="text-xs text-gray-500 mb-4">Order #{statusModal.order_number}</p>
          <div className="flex flex-col gap-2.5">
            {[
              {s:'in_transit',       label:'🚗 Start Delivery',    show:statusModal.status==='assigned'},
              {s:'out_for_delivery', label:'📦 Out for Delivery',   show:['assigned','in_transit'].includes(statusModal.status)},
              {s:'delivered',        label:'✅ Mark as Delivered',  show:statusModal.status==='out_for_delivery'},
              {s:'failed',           label:'❌ Delivery Failed',    show:!['delivered','cancelled'].includes(statusModal.status)},
              {s:'returned',         label:'↩️ Return to Sender',   show:!['delivered','cancelled'].includes(statusModal.status)},
            ].filter(o=>o.show).map(o=>(
              <button key={o.s} onClick={()=>doStatus(statusModal,o.s)} disabled={!!busy}
                className="w-full p-4 rounded-xl text-sm font-semibold text-left transition-all disabled:opacity-50"
                style={{background:'#1a1a1a',border:'1px solid #2a2a2a',color:'#e5e7eb'}}
                onMouseEnter={e=>(e.currentTarget.style.background='#222')}
                onMouseLeave={e=>(e.currentTarget.style.background='#1a1a1a')}>
                {o.label}
              </button>
            ))}
          </div>
        </Sheet>
      )}

      {/* OTP MODAL */}
      {otpModal && (
        <Sheet onClose={()=>{setOtpModal(null);setOtp('');}} title="Verify Delivery">
          <p className="text-xs text-gray-500 mb-1">Ask the customer for their OTP.</p>
          <p className="text-xs mb-6" style={{color:'#374151'}}>Order #{otpModal.order_number}</p>
          {/* OTP display */}
          <div className="flex gap-2 justify-center mb-5">
            {Array.from({length:6}).map((_,i)=>(
              <div key={i} className="w-10 h-12 rounded-xl flex items-center justify-center text-lg font-bold transition-all"
                style={{background:'#1a1a1a',border:`2px solid ${i<otp.length?'#10b981':'#2a2a2a'}`}}>
                {otp[i]||''}
              </div>
            ))}
          </div>
          {/* Keypad */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {['1','2','3','4','5','6','7','8','9','A','0','⌫'].map(k=>(
              <button key={k} onClick={()=>{
                if(k==='⌫') setOtp(p=>p.slice(0,-1));
                else if(otp.length<6) setOtp(p=>p+k);
              }} className="py-3.5 rounded-xl text-base font-bold transition-all"
                style={{background:'#1a1a1a',border:'1px solid #2a2a2a',color:'#e5e7eb'}}
                onMouseEnter={e=>(e.currentTarget.style.background='#222')}
                onMouseLeave={e=>(e.currentTarget.style.background='#1a1a1a')}>
                {k}
              </button>
            ))}
          </div>
          <button onClick={doOTP} disabled={otp.length<4||!!busy}
            className="w-full py-4 rounded-xl text-sm font-bold transition-all disabled:opacity-40"
            style={{background:otp.length>=4?'linear-gradient(135deg,#10b981,#059669)':'#1a1a1a',color:otp.length>=4?'#000':'#6b7280'}}>
            {busy?'⏳ Verifying...':'✅ Confirm Delivery'}
          </button>
        </Sheet>
      )}
    </div>
  );
}

/* ── Delivery Card ── */
function Card({d,busy,onStatus,onVerify,onLocation,onRoute,onStart}:{
  d:Delivery; busy:boolean;
  onStatus:()=>void; onVerify:()=>void; onLocation:()=>void; onRoute:()=>void; onStart:()=>void;
}) {
  const sc = STATUS[d.status] || {label:d.status,dot:'#888',bg:'rgba(136,136,136,.1)',text:'#888'};
  return (
    <div className="rounded-2xl overflow-hidden" style={{background:'#111',border:'1px solid #1f1f1f',borderLeft:`3px solid ${sc.dot}`}}>
      <div className="p-4 flex gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="font-bold text-sm">{ICON[d.status]} #{d.order_number}</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold"
              style={{background:sc.bg,color:sc.text}}>
              {sc.label}
            </span>
          </div>
          <p className="text-xs text-gray-400 mb-1 leading-snug line-clamp-2">📍 {d.delivery_address}</p>
          {d.customer_name && <p className="text-xs text-gray-600 mb-1">👤 {d.customer_name}{d.customer_phone?` · ${d.customer_phone}`:''}</p>}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs text-gray-600">🕐 {new Date(d.estimated_delivery_time).toLocaleTimeString('en-KE',{hour:'2-digit',minute:'2-digit'})}</span>
            {d.delivery_fee>0&&<span className="text-xs font-semibold" style={{color:'#10b981'}}>+KES {d.delivery_fee}</span>}
          </div>
        </div>
        <button onClick={onRoute}
          className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center self-start"
          style={{background:'rgba(59,130,246,.1)',border:'1px solid rgba(59,130,246,.2)'}}>
          <svg className="w-4 h-4" style={{color:'#3b82f6'}} fill="currentColor" viewBox="0 0 24 24">
            <path d="M13.49 5.48c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-3.6 13.9 1-4.4 2.1 2v6h2v-7.5l-2.1-2 .6-3c1.3 1.5 3.3 2.5 5.5 2.5v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1l-5.2 2.2v4.7h2v-3.4l1.8-.7-1.6 8.1-4.9-1-.4 2 7 1.4z"/>
          </svg>
        </button>
      </div>

      {d.delivery_notes && (
        <div className="mx-4 mb-3 px-3 py-2 rounded-xl text-xs"
          style={{background:'rgba(245,158,11,.06)',border:'1px solid rgba(245,158,11,.15)',color:'#f59e0b'}}>
          ⚠️ {d.delivery_notes}
        </div>
      )}

      {/* Actions */}
      <div className="px-4 pb-4 flex gap-2 flex-wrap">
        {d.status==='assigned' && (<>
          <Btn color="#10b981" dark label={busy?'…':'🚗 Start Delivery'} onClick={onStart}/>
          <Btn color="#3b82f6" label="📍 Location" onClick={onLocation}/>
        </>)}
        {d.status==='in_transit' && (<>
          <Btn color="#f97316" dark label={busy?'…':'📦 Out for Delivery'} onClick={onStatus}/>
          <Btn color="#3b82f6" label="📍 Location" onClick={onLocation}/>
        </>)}
        {d.status==='out_for_delivery' && (<>
          <Btn color="#10b981" dark label="✅ Complete & Verify" onClick={onVerify}/>
          <Btn color="#6b7280" label="⚠️ Report Issue" onClick={onStatus}/>
          <Btn color="#3b82f6" label="📍 Location" onClick={onLocation}/>
        </>)}
        {d.status==='pending' && <Btn color="#3b82f6" dark label="📋 Update Status" onClick={onStatus}/>}
        {['delivered','failed','cancelled','returned'].includes(d.status) && d.actual_delivery_time && (
          <span className="text-xs text-gray-600 py-1">
            Completed {new Date(d.actual_delivery_time).toLocaleDateString('en-KE',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}
          </span>
        )}
      </div>
    </div>
  );
}

function Btn({color,label,onClick,dark=false}:{color:string;label:string;onClick:()=>void;dark?:boolean}) {
  const isDark = color==='#10b981'||color==='#f97316';
  return (
    <button onClick={onClick}
      className="px-3.5 py-2 rounded-xl text-xs font-bold transition-all"
      style={{
        background: dark ? color : `${color}18`,
        border: `1px solid ${dark ? color : `${color}44`}`,
        color: dark ? (isDark?'#000':'#fff') : color,
      }}>
      {label}
    </button>
  );
}

function Sheet({onClose,title,children}:{onClose:()=>void;title:string;children:React.ReactNode}) {
  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-50" style={{background:'rgba(0,0,0,.7)'}}/>
      <div className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl max-h-[85vh] overflow-y-auto"
        style={{background:'#111',border:'1px solid #1f1f1f',padding:'24px',animation:'slideUp .25s ease'}}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold">{title}</h3>
          <button onClick={onClose} className="text-gray-500 text-xl leading-none">✕</button>
        </div>
        {children}
      </div>
      <style>{`@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
    </>
  );
}

function EarningsView({stats,deliveries,onBack}:{stats:Stats|null;deliveries:Delivery[];onBack:()=>void}) {
  const done = deliveries.filter(d=>d.status==='delivered');
  const KES = (n:number) => new Intl.NumberFormat('en-KE',{style:'currency',currency:'KES',minimumFractionDigits:0}).format(n||0);
  return (
    <div className="px-4 py-5 max-w-xl mx-auto">
      <button onClick={onBack} className="text-sm font-semibold mb-5 block" style={{color:'#10b981'}}>← Back</button>
      <h2 className="text-2xl font-bold mb-5">💰 Earnings</h2>
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          {label:'Today',    val:KES(stats?.today_earnings||0),color:'#10b981'},
          {label:'This Week',val:KES(stats?.week_earnings||0), color:'#3b82f6'},
          {label:'All Time', val:KES(stats?.total_earnings||0),color:'#f59e0b'},
        ].map(e=>(
          <div key={e.label} className="rounded-2xl p-4 text-center" style={{background:'#111',border:'1px solid #1f1f1f'}}>
            <p className="text-base font-bold mb-1" style={{color:e.color}}>{e.val}</p>
            <p className="text-xs text-gray-600">{e.label}</p>
          </div>
        ))}
      </div>
      <p className="text-xs font-semibold uppercase tracking-widest text-gray-600 mb-3">Recent Completed</p>
      <div className="flex flex-col gap-2.5">
        {done.slice(0,20).map(d=>(
          <div key={d.id} className="rounded-2xl p-4 flex justify-between items-center"
            style={{background:'#111',border:'1px solid #1f1f1f'}}>
            <div>
              <p className="font-bold text-sm">#{d.order_number}</p>
              <p className="text-xs text-gray-600 truncate max-w-[200px] mt-0.5">{d.delivery_address}</p>
              {d.actual_delivery_time && (
                <p className="text-xs mt-0.5" style={{color:'#374151'}}>
                  {new Date(d.actual_delivery_time).toLocaleDateString('en-KE',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}
                </p>
              )}
            </div>
            <p className="font-bold text-base" style={{color:'#10b981'}}>
              {d.delivery_fee>0?`+KES ${d.delivery_fee}`:'—'}
            </p>
          </div>
        ))}
        {done.length===0 && (
          <div className="rounded-2xl p-10 text-center" style={{background:'#111',border:'1px solid #1f1f1f'}}>
            <p className="text-4xl mb-3">📭</p>
            <p className="text-sm text-gray-500">No completed deliveries yet</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ProfileView({driver,stats,onBack,onLogout}:{driver:Driver|null;stats:Stats|null;onBack:()=>void;onLogout:()=>void}) {
  const KES=(n:number)=>new Intl.NumberFormat('en-KE',{style:'currency',currency:'KES',minimumFractionDigits:0}).format(n||0);
  const rate = stats&&stats.total_deliveries>0
    ? Math.round((stats.completed_deliveries/stats.total_deliveries)*100) : 0;
  return (
    <div className="px-4 py-5 max-w-xl mx-auto">
      <button onClick={onBack} className="text-sm font-semibold mb-5 block" style={{color:'#10b981'}}>← Back</button>
      <div className="text-center mb-8">
        <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold text-black mx-auto mb-4"
          style={{background:'linear-gradient(135deg,#10b981,#059669)'}}>
          {driver?.name?.[0]||'?'}
        </div>
        <h2 className="text-2xl font-bold">{driver?.name}</h2>
        <p className="text-sm text-gray-500 mt-1">{driver?.email}</p>
        <div className="inline-flex items-center gap-2 mt-3 px-4 py-1.5 rounded-full"
          style={{background:'rgba(16,185,129,.1)',border:'1px solid rgba(16,185,129,.2)'}}>
          <span>⭐</span>
          <span className="font-bold" style={{color:'#10b981'}}>{(driver?.rating||4.8).toFixed(1)}</span>
          <span className="text-xs text-gray-500">rating</span>
        </div>
      </div>
      <div className="flex flex-col gap-2.5 mb-6">
        {[
          {label:'Phone',  val:driver?.phone||'—',  icon:'📞'},
          {label:'Vehicle',val:driver?.vehicle_type?`${driver.vehicle_type} · ${driver.vehicle_number}`:'—',icon:'🚗'},
          {label:'Role',   val:(driver?.role||'delivery_staff').replace('_',' '),icon:'👔'},
        ].map(item=>(
          <div key={item.label} className="flex items-center gap-4 p-4 rounded-2xl"
            style={{background:'#111',border:'1px solid #1f1f1f'}}>
            <span className="text-2xl">{item.icon}</span>
            <div>
              <p className="text-xs text-gray-600">{item.label}</p>
              <p className="text-sm font-semibold mt-0.5">{item.val}</p>
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs font-semibold uppercase tracking-widest text-gray-600 mb-3">Performance</p>
      <div className="grid grid-cols-2 gap-2.5 mb-6">
        {[
          {label:'Total Deliveries',val:`${stats?.total_deliveries||0}`,icon:'📦'},
          {label:'Success Rate',    val:`${rate}%`,                     icon:'🎯'},
          {label:'Total Earned',    val:KES(stats?.total_earnings||0),  icon:'💰'},
          {label:'This Week',       val:KES(stats?.week_earnings||0),   icon:'📅'},
        ].map(p=>(
          <div key={p.label} className="p-4 rounded-2xl" style={{background:'#111',border:'1px solid #1f1f1f'}}>
            <span className="text-2xl block mb-2">{p.icon}</span>
            <p className="font-bold text-lg">{p.val}</p>
            <p className="text-xs text-gray-600 mt-0.5">{p.label}</p>
          </div>
        ))}
      </div>
      <button onClick={onLogout}
        className="w-full py-4 rounded-2xl text-sm font-bold"
        style={{background:'rgba(239,68,68,.08)',border:'1px solid rgba(239,68,68,.2)',color:'#f87171'}}>
        🚪 Sign Out
      </button>
    </div>
  );
}