'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Package, Truck, Clock, CheckCircle, MapPin, Download,
  Share2, User, CreditCard, MessageSquare, ArrowLeft,
  ShoppingBag, AlertCircle, ExternalLink, Navigation,
  Phone, RefreshCw, ChevronRight, Star, Shield, Printer,
  Activity
} from 'lucide-react';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrderDetail {
  id: number;
  order_number: string;
  tracking_number: string;
  status: string;
  payment_method: string;
  payment_status: string;
  total: any;
  subtotal: any;
  tax: any;
  shipping_fee: any;
  discount: any;
  created_at: string;
  confirmed_at: string | null;
  processing_at: string | null;
  shipped_at: string | null;
  out_for_delivery_at: string | null;
  delivered_at: string | null;
  estimated_delivery: string | null;
  actual_delivery: string | null;
  notes: string;
  shipping_method: string;
  carrier: string;
  user?: { id: number; name: string; email: string; phone: string };
  address?: {
    full_address?: string;
    address_line_1?: string;
    city: string;
    state: string;
    zip_code?: string;
    postal_code?: string;
    country: string;
  };
  items?: Array<{
    product: {
      id: number; name: string; thumbnail: string | null;
      image?: string | null; sku: string; price: any;
      category?: { name: string };
    };
    quantity: number; price: any; total: any;
  }>;
  delivery?: {
    id: number; status: string; delivery_address: string;
    estimated_delivery_time: string | null; actual_delivery_time: string | null;
    driver_name: string | null; driver_phone: string | null;
    vehicle_type: string | null; vehicle_number: string | null;
    delivery_notes: string | null;
    current_latitude: number | null; current_longitude: number | null;
    location_updated_at: string | null;
    deliveryStaff?: { name: string; phone: string; rating: number; avatar?: string | null } | null;
    delivery_fee?: number;
  } | null;
  tracking_history?: Array<{
    id: number; status: string; title: string;
    description: string; location: string; icon: string; actual_date: string;
  }>;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STEPS = [
  { key: 'pending',          label: 'Order Placed',      short: 'Placed',   icon: Package,    color: '#f59e0b' },
  { key: 'confirmed',        label: 'Confirmed',          short: 'Confirmed',icon: CheckCircle,color: '#3b82f6' },
  { key: 'processing',       label: 'Processing',         short: 'Packing',  icon: Activity,   color: '#8b5cf6' },
  { key: 'shipped',          label: 'Shipped',            short: 'Shipped',  icon: Truck,      color: '#6366f1' },
  { key: 'out_for_delivery', label: 'Out for Delivery',   short: 'On Way',   icon: Navigation, color: '#f97316' },
  { key: 'delivered',        label: 'Delivered',          short: 'Done',     icon: CheckCircle,color: '#10b981' },
];

const CANCELLED = ['cancelled', 'returned', 'refunded'];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const parseNum = (v: any): number => {
  if (v == null) return 0;
  const n = typeof v === 'string' ? parseFloat(v) : Number(v);
  return isNaN(n) ? 0 : n;
};

const KES = (v: any) => {
  const n = parseNum(v);
  return `KSh ${n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
};

const fmtDate = (s: string | null | undefined, short = false) => {
  if (!s) return 'N/A';
  try {
    const d = new Date(s);
    if (isNaN(d.getTime())) return 'N/A';
    if (short) return d.toLocaleDateString('en-KE', { month: 'short', day: 'numeric', year: 'numeric' });
    return d.toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return 'N/A'; }
};

const imgUrl = (thumb: string | null | undefined) => {
  if (!thumb) return '/images/placeholder-product.jpg';
  if (thumb.startsWith('http')) return thumb;
  if (thumb.includes('/storage/')) return `https://api.hypermarket.co.ke${thumb.startsWith('/') ? '' : '/'}${thumb}`;
  return `https://api.hypermarket.co.ke/storage/${thumb}`;
};

function getStepDate(order: OrderDetail, key: string): string | null {
  const map: Record<string, string | null | undefined> = {
    pending: order.created_at,
    confirmed: order.confirmed_at,
    processing: order.processing_at,
    shipped: order.shipped_at,
    out_for_delivery: order.out_for_delivery_at,
    delivered: order.delivered_at ?? order.actual_delivery,
  };
  return map[key] ?? null;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-800 border-amber-200',
    confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
    processing: 'bg-violet-100 text-violet-800 border-violet-200',
    shipped: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    out_for_delivery: 'bg-orange-100 text-orange-800 border-orange-200',
    delivered: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    cancelled: 'bg-red-100 text-red-800 border-red-200',
    returned: 'bg-gray-100 text-gray-700 border-gray-200',
    refunded: 'bg-purple-100 text-purple-800 border-purple-200',
    paid: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    failed: 'bg-red-100 text-red-800 border-red-200',
  };
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border capitalize ${map[status] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrder = useCallback(async (quiet = false) => {
    try {
      quiet ? setRefreshing(true) : setLoading(true);
      setError(null);
      const response = await api.orders.getById(parseInt(params.id as string));
      const d = response.data;
      const orderData = d?.order ?? d?.data ?? d;
      if (orderData) setOrder(orderData);
      else setError('Order not found');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to load order');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [params.id]);

  useEffect(() => { fetchOrder(); }, [fetchOrder]);

  // auto-refresh every 30s when out for delivery
  useEffect(() => {
    if (!order) return;
    if (!['out_for_delivery', 'shipped', 'in_transit'].includes(order.status)) return;
    const iv = setInterval(() => fetchOrder(true), 30000);
    return () => clearInterval(iv);
  }, [order?.status, fetchOrder]);

  const handleCancel = async () => {
    if (!order) return;
    if (!confirm('Are you sure you want to cancel this order?')) return;
    try {
      await api.orders.cancel(order.id);
      toast.success('Order cancelled');
      fetchOrder();
    } catch { toast.error('Failed to cancel order'); }
  };

  const handleInvoice = async () => {
    if (!order) return;
    try {
      const r = await api.get(`/orders/${order.id}/invoice`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([r.data]));
      const a = document.createElement('a');
      a.href = url; a.setAttribute('download', `invoice-${order.order_number}.pdf`);
      document.body.appendChild(a); a.click(); a.remove();
      toast.success('Invoice downloaded');
    } catch { toast.error('Failed to download invoice'); }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: `Order #${order?.order_number}`, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied!');
    }
  };

  // ── Loading / Error ───────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <LoadingSpinner size="lg" />
    </div>
  );

  if (error || !order) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="text-center max-w-sm">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <AlertCircle className="w-10 h-10 text-red-500" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Order Not Found</h1>
        <p className="text-gray-500 text-sm mb-6">{error || 'This order does not exist or you do not have permission to view it.'}</p>
        <div className="flex flex-col gap-3">
          <button onClick={() => router.push('/orders')} className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-medium text-sm hover:bg-emerald-700">View All Orders</button>
          <button onClick={() => router.push('/')} className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-50">Continue Shopping</button>
        </div>
      </div>
    </div>
  );

  const stepIdx = STEPS.findIndex(s => s.key === order.status);
  const isCancelled = CANCELLED.includes(order.status);
  const isDelivered = order.status === 'delivered';
  const isActive = ['shipped', 'out_for_delivery'].includes(order.status);
  const driver = order.delivery?.deliveryStaff || (order.delivery?.driver_name ? { name: order.delivery.driver_name, phone: order.delivery.driver_phone || '', rating: 0, avatar: null } : null);
  const hasGPS = !!(order.delivery?.current_latitude && order.delivery?.current_longitude);

  return (
    <div className="min-h-screen bg-gray-50 pb-12">

      {/* ── Top header bar ── */}
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-sm border-b border-gray-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/orders" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-emerald-600 transition-colors font-medium">
            <ArrowLeft className="w-4 h-4" /> Orders
          </Link>
          <div className="flex items-center gap-2">
            {refreshing && <RefreshCw className="w-4 h-4 text-gray-400 animate-spin" />}
            <button onClick={() => fetchOrder(true)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors" title="Refresh">
              <RefreshCw className="w-4 h-4 text-gray-500" />
            </button>
            <button onClick={handleShare} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <Share2 className="w-4 h-4 text-gray-500" />
            </button>
            <button onClick={() => window.print()} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <Printer className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-6">

        {/* ── Page title ── */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Order #{order.order_number}</h1>
            <p className="text-sm text-gray-500 mt-1">Placed {fmtDate(order.created_at)}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusPill status={order.status} />
            <StatusPill status={order.payment_status} />
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            TRACKING HERO — progress stepper + live driver card
        ══════════════════════════════════════════════════════════════════ */}
        {!isCancelled && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">

            {/* Animated banner for active deliveries */}
            {isActive && (
              <div className="px-5 py-3 flex items-center gap-3"
                style={{ background: 'linear-gradient(135deg, #064e3b, #065f46)' }}>
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-300" />
                </span>
                <p className="text-sm font-semibold text-emerald-100">
                  {order.status === 'out_for_delivery' ? '🚚 Your order is on its way!' : '📦 Your order has been shipped'}
                </p>
                <span className="ml-auto text-xs text-emerald-300">Live updates every 30s</span>
              </div>
            )}
            {isDelivered && (
              <div className="px-5 py-3 flex items-center gap-3 bg-emerald-600">
                <CheckCircle className="w-4 h-4 text-white" />
                <p className="text-sm font-semibold text-white">✅ Order delivered successfully!</p>
                {order.delivered_at && <span className="ml-auto text-xs text-emerald-200">{fmtDate(order.delivered_at, true)}</span>}
              </div>
            )}

            {/* Progress stepper */}
            <div className="px-5 py-6">
              <div className="relative">
                {/* Track line bg */}
                <div className="absolute top-5 left-5 right-5 h-0.5 bg-gray-100 hidden sm:block" />
                {/* Track line fill */}
                {!isCancelled && stepIdx >= 0 && (
                  <div className="absolute top-5 left-5 h-0.5 bg-emerald-500 hidden sm:block transition-all duration-700"
                    style={{ width: `${(stepIdx / (STEPS.length - 1)) * (100 - 100 / STEPS.length)}%` }} />
                )}

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 relative">
                  {STEPS.map((step, i) => {
                    const done    = i < stepIdx || isDelivered;
                    const current = i === stepIdx && !isDelivered;
                    const future  = i > stepIdx;
                    const Icon    = step.icon;
                    const date    = getStepDate(order, step.key);

                    return (
                      <div key={step.key} className={`flex flex-col items-center gap-2 ${future ? 'opacity-35' : ''}`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 relative z-10 transition-all duration-500 ${
                          done    ? 'bg-emerald-500 shadow-lg shadow-emerald-200'  :
                          current ? 'bg-white border-2 border-emerald-500 shadow-lg shadow-emerald-100' :
                          'bg-gray-100 border border-gray-200'
                        }`}
                        style={current ? { boxShadow: '0 0 0 6px rgba(16,185,129,0.12)' } : {}}>
                          {done
                            ? <CheckCircle className="w-5 h-5 text-white" />
                            : <Icon className={`w-4 h-4 ${current ? 'text-emerald-600' : 'text-gray-400'}`} />
                          }
                        </div>
                        <div className="text-center">
                          <p className={`text-xs font-semibold leading-tight ${
                            done || current ? 'text-gray-900' : 'text-gray-400'
                          }`}>
                            <span className="sm:hidden">{step.short}</span>
                            <span className="hidden sm:block">{step.label}</span>
                          </p>
                          {date && (
                            <p className="text-xs text-gray-400 mt-0.5 hidden sm:block">
                              {new Date(date).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' })}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ETA row */}
              {order.estimated_delivery && !isDelivered && (
                <div className="mt-5 pt-4 border-t border-gray-50 flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>Estimated delivery: </span>
                  <span className="font-semibold text-gray-900">{fmtDate(order.estimated_delivery, true)}</span>
                </div>
              )}
            </div>

            {/* ── Live Driver Card (when out for delivery) ── */}
            {order.delivery && driver && ['out_for_delivery', 'shipped', 'assigned', 'in_transit'].includes(order.delivery.status) && (
              <div className="mx-5 mb-5 rounded-xl overflow-hidden border border-gray-100">
                {/* Map visual */}
                <div className="relative h-36 overflow-hidden"
                  style={{ background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 50%, #a7f3d0 100%)' }}>
                  {/* Grid lines */}
                  <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 400 144" preserveAspectRatio="none">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <React.Fragment key={i}>
                        <line x1={`${i * 14.3}%`} y1="0" x2={`${i * 14.3}%`} y2="100%" stroke="#10b981" strokeWidth="0.5" />
                        <line x1="0" y1={`${i * 14.3}%`} x2="100%" y2={`${i * 14.3}%`} stroke="#10b981" strokeWidth="0.5" />
                      </React.Fragment>
                    ))}
                  </svg>
                  {/* Animated route */}
                  <svg className="absolute inset-0 w-full h-full">
                    <defs>
                      <filter id="glow">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                      </filter>
                    </defs>
                    <path d="M 40 120 Q 100 90 160 70 Q 230 48 320 28"
                      stroke="#10b981" strokeWidth="2.5" fill="none" strokeDasharray="8 4"
                      strokeLinecap="round" filter="url(#glow)" opacity="0.8" />
                    {/* Delivery truck marker */}
                    <circle cx="160" cy="70" r="10" fill="#10b981" filter="url(#glow)" opacity="0.9" />
                    <text x="160" y="74" textAnchor="middle" fontSize="10" fill="white">🚚</text>
                    {/* Destination pin */}
                    <circle cx="320" cy="28" r="8" fill="#f97316" opacity="0.9" />
                    <text x="320" y="32" textAnchor="middle" fontSize="9" fill="white">📍</text>
                    {/* You are here */}
                    <circle cx="40" cy="120" r="6" fill="#6366f1" opacity="0.8" />
                    <text x="40" y="124" textAnchor="middle" fontSize="8" fill="white">🏠</text>
                  </svg>

                  {/* GPS badge */}
                  {hasGPS ? (
                    <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2.5 py-1 bg-white/90 backdrop-blur rounded-full shadow text-xs font-medium text-emerald-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Live GPS
                    </div>
                  ) : (
                    <div className="absolute top-2 left-2 px-2.5 py-1 bg-white/80 backdrop-blur rounded-full text-xs text-gray-500">
                      Tracking map
                    </div>
                  )}

                  {/* Open Maps button */}
                  {hasGPS && (
                    <a href={`https://www.google.com/maps?q=${order.delivery.current_latitude},${order.delivery.current_longitude}`}
                      target="_blank" rel="noopener noreferrer"
                      className="absolute bottom-2 right-2 flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg shadow hover:bg-emerald-700 transition-colors">
                      <Navigation className="w-3 h-3" /> Open Maps
                    </a>
                  )}
                </div>

                {/* Driver info row */}
                <div className="flex items-center gap-4 p-4 bg-white">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {driver.avatar ? (
                      <img src={driver.avatar} alt={driver.name} className="w-12 h-12 rounded-full object-cover border-2 border-emerald-100" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow">
                        <span className="text-white font-bold text-lg">{driver.name.charAt(0)}</span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">{driver.name}</p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                      {order.delivery.vehicle_type && (
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Truck className="w-3 h-3" />
                          {order.delivery.vehicle_type} · {order.delivery.vehicle_number}
                        </span>
                      )}
                      {driver.rating > 0 && (
                        <span className="text-xs text-amber-600 flex items-center gap-0.5">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          {driver.rating.toFixed(1)}
                        </span>
                      )}
                    </div>
                    {order.delivery.location_updated_at && hasGPS && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        Updated {new Date(order.delivery.location_updated_at).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                  </div>

                  {/* Call button */}
                  {(driver.phone || order.delivery.driver_phone) && (
                    <a href={`tel:${driver.phone || order.delivery.driver_phone}`}
                      className="flex-shrink-0 flex items-center justify-center w-11 h-11 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-colors">
                      <Phone className="w-5 h-5 text-emerald-600" />
                    </a>
                  )}
                </div>

                {/* Delivery notes warning */}
                {order.delivery.delivery_notes && (
                  <div className="px-4 pb-3">
                    <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-lg">
                      <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-700">{order.delivery.delivery_notes}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Delivered summary */}
            {isDelivered && order.delivery && (
              <div className="mx-5 mb-5 p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-emerald-800 text-sm">Delivered successfully</p>
                  <p className="text-xs text-emerald-600 mt-0.5">{fmtDate(order.delivery.actual_delivery_time)}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Cancelled banner */}
        {isCancelled && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="font-bold text-red-800">Order {order.status.charAt(0).toUpperCase() + order.status.slice(1)}</p>
              <p className="text-sm text-red-600 mt-0.5">This order has been {order.status}. Contact support if you have questions.</p>
            </div>
          </div>
        )}

        {/* ── Main grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── LEFT column ── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Tracking timeline */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
                <h2 className="font-bold text-gray-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-600" /> Tracking Timeline
                </h2>
                {order.tracking_number && (
                  <span className="font-mono text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-lg">{order.tracking_number}</span>
                )}
              </div>
              <div className="p-5">
                {order.tracking_history && order.tracking_history.length > 0 ? (
                  <div className="relative">
                    <div className="absolute left-4 top-0 bottom-0 w-px bg-gradient-to-b from-emerald-300 to-gray-100" />
                    <div className="space-y-5">
                      {order.tracking_history.map((h, i) => {
                        const isGood = ['delivered','confirmed','processing','shipped','out_for_delivery','order_created'].includes(h.status);
                        const isBad  = ['cancelled','failed'].includes(h.status);
                        return (
                          <div key={h.id ?? i} className="flex gap-4">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 relative z-10 ring-4 ring-white ${
                              isBad  ? 'bg-red-100'     :
                              isGood ? 'bg-emerald-100' : 'bg-blue-100'
                            }`}>
                              {isBad   ? <AlertCircle  className="w-4 h-4 text-red-500" /> :
                               isGood  ? <CheckCircle  className="w-4 h-4 text-emerald-600" /> :
                                         <Package      className="w-4 h-4 text-blue-600" />}
                            </div>
                            <div className="flex-1 min-w-0 pt-0.5 pb-2">
                              <div className="flex flex-wrap items-center justify-between gap-1">
                                <p className="text-sm font-semibold text-gray-900">{h.title}</p>
                                <p className="text-xs text-gray-400">{fmtDate(h.actual_date, true)}</p>
                              </div>
                              {h.description && <p className="text-sm text-gray-500 mt-0.5">{h.description}</p>}
                              {h.location && (
                                <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                  <MapPin className="w-3 h-3 flex-shrink-0" />{h.location}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <Clock className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">No tracking events yet</p>
                    <p className="text-xs text-gray-400 mt-1">Updates will appear here as your order progresses</p>
                  </div>
                )}
              </div>
            </div>

            {/* Order items */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="px-5 py-4 border-b border-gray-50">
                <h2 className="font-bold text-gray-900 flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-emerald-600" />
                  Items ({order.items?.length || 0})
                </h2>
              </div>
              <div className="divide-y divide-gray-50">
                {order.items && order.items.length > 0 ? order.items.map((item, i) => (
                  <div key={i} className="flex items-center gap-4 px-5 py-4">
                    <div className="relative flex-shrink-0">
                      <img
                        src={imgUrl(item.product?.thumbnail || item.product?.image)}
                        alt={item.product?.name}
                        className="w-16 h-16 rounded-xl object-cover border border-gray-100"
                        onError={e => { (e.currentTarget as HTMLImageElement).src = '/images/placeholder-product.jpg'; }}
                      />
                      {item.product?.category?.name && (
                        <span className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full leading-none">
                          {item.product.category.name.slice(0,3)}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link href={`/products/${item.product?.id}`} className="font-semibold text-sm text-gray-900 hover:text-emerald-600 truncate block transition-colors">
                        {item.product?.name || 'Product'}
                      </Link>
                      <p className="text-xs text-gray-400 mt-0.5">SKU: {item.product?.sku || '—'}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{KES(item.price)} × {item.quantity}</p>
                    </div>
                    <p className="font-bold text-gray-900 text-sm flex-shrink-0">{KES(item.total)}</p>
                  </div>
                )) : (
                  <div className="text-center py-8 text-gray-400 text-sm">No items found</div>
                )}

                {/* Totals */}
                <div className="px-5 py-4 space-y-2">
                  {[
                    { label: 'Subtotal',  val: order.subtotal },
                    { label: 'Shipping',  val: order.shipping_fee },
                    { label: 'Tax',       val: order.tax },
                    ...(parseNum(order.discount) > 0 ? [{ label: 'Discount', val: -parseNum(order.discount) }] : []),
                  ].map(({ label, val }) => (
                    <div key={label} className="flex justify-between text-sm text-gray-500">
                      <span>{label}</span>
                      <span className={parseNum(val) < 0 ? 'text-emerald-600 font-medium' : ''}>{KES(val)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-bold text-gray-900 text-base pt-3 border-t border-gray-100">
                    <span>Total</span>
                    <span className="text-emerald-600">{KES(order.total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT sidebar ── */}
          <div className="space-y-5">

            {/* Delivery info */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="px-5 py-4 border-b border-gray-50">
                <h2 className="font-bold text-gray-900 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-600" /> Delivery
                </h2>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <p className="text-xs font-medium text-gray-400 mb-1.5">Shipping Address</p>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {order.address?.full_address || order.address?.address_line_1 || 'No address provided'}
                      </p>
                      {order.address && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {[order.address.city, order.address.state, order.address.postal_code || order.address.zip_code, order.address.country].filter(Boolean).join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-gray-400 mb-1.5">Shipping Method</p>
                  <p className="text-sm text-gray-900 capitalize">
                    {order.shipping_method || 'Standard'} Shipping
                    {order.carrier && <span className="text-gray-500"> · {order.carrier}</span>}
                  </p>
                </div>

                {order.estimated_delivery && (
                  <div>
                    <p className="text-xs font-medium text-gray-400 mb-1.5">Estimated Delivery</p>
                    <p className="text-sm text-gray-900 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-emerald-500" />
                      {fmtDate(order.estimated_delivery, true)}
                    </p>
                  </div>
                )}

                {order.tracking_number && (
                  <div>
                    <p className="text-xs font-medium text-gray-400 mb-1.5">Tracking Number</p>
                    <div className="bg-gray-50 rounded-xl p-3">
                      <code className="font-mono text-sm font-bold text-gray-900 break-all">{order.tracking_number}</code>
                      <Link href="/track-order" className="mt-2 flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 font-medium">
                        Track on tracking page <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Payment */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="px-5 py-4 border-b border-gray-50">
                <h2 className="font-bold text-gray-900 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-600" /> Payment
                </h2>
              </div>
              <div className="p-5 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Method</span>
                  <span className="text-gray-900 capitalize font-medium">{(order.payment_method || 'cod').replace(/_/g, ' ')}</span>
                </div>
                <div className="flex justify-between text-sm items-center">
                  <span className="text-gray-500">Status</span>
                  <StatusPill status={order.payment_status} />
                </div>
                {order.notes && (
                  <div className="pt-3 border-t border-gray-50">
                    <p className="text-xs font-medium text-gray-400 mb-1.5">Notes</p>
                    <p className="text-sm text-gray-700 bg-amber-50 border border-amber-100 rounded-lg p-3">{order.notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-3">
              <button onClick={() => router.push('/support')}
                className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white rounded-xl font-semibold text-sm hover:bg-emerald-700 transition-colors">
                <MessageSquare className="w-4 h-4" /> Contact Support
              </button>

              <button onClick={handleInvoice}
                className="w-full flex items-center justify-center gap-2 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-50 transition-colors">
                <Download className="w-4 h-4" /> Download Invoice
              </button>

              <Link href="/orders"
                className="w-full flex items-center justify-center gap-2 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-50 transition-colors">
                <ShoppingBag className="w-4 h-4" /> All My Orders
              </Link>

              {order.status === 'pending' && (
                <button onClick={handleCancel}
                  className="w-full flex items-center justify-center gap-2 py-3 border border-red-200 text-red-600 rounded-xl font-medium text-sm hover:bg-red-50 transition-colors">
                  <AlertCircle className="w-4 h-4" /> Cancel Order
                </button>
              )}
            </div>

            {/* Trust badges */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-5">
              <div className="space-y-3">
                {[
                  { icon: Shield, label: 'Secure & Protected', sub: '256-bit SSL encryption' },
                  { icon: RefreshCw, label: 'Easy Returns',     sub: 'Within 7 days of delivery' },
                  { icon: Phone,  label: '24/7 Support',       sub: 'We\'re always here for you' },
                ].map(({ icon: Icon, label, sub }) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-emerald-900">{label}</p>
                      <p className="text-xs text-emerald-600">{sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
