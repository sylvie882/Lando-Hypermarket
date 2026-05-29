'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Package, Truck, Clock, CheckCircle, MapPin, Phone, Mail,
  RefreshCw, User, CreditCard, Edit, XCircle, ArrowLeft,
  Navigation, Printer, ChevronRight, AlertCircle, Star,
  DollarSign, Calendar, Activity, Shield, X, Loader2
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TrackHistory {
  id: number;
  status: string;
  title: string;
  description: string;
  location: string;
  icon: string;
  actual_date: string;
  user: { name: string; role: string } | null;
}

interface OrderDetail {
  id: number;
  order_number: string;
  tracking_number: string;
  status: string;
  payment_method: string;
  payment_status: string;
  total: number;
  subtotal: number;
  tax: number;
  shipping_fee: number;
  discount: number;
  notes: string | null;
  shipping_method: string | null;
  carrier: string | null;
  created_at: string;
  confirmed_at: string | null;
  processing_at: string | null;
  shipped_at: string | null;
  out_for_delivery_at: string | null;
  delivered_at: string | null;
  estimated_delivery: string | null;
  actual_delivery: string | null;

  user: { id: number; name: string; email: string; phone: string | null };

  address: {
    contact_name: string | null;
    address_line_1: string;
    address_line_2: string | null;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    phone: string | null;
  } | null;

  items: Array<{
    product: { id: number; name: string; thumbnail: string | null; sku: string };
    quantity: number;
    price: number;
    total: number;
  }>;

  delivery: {
    id: number;
    status: string;
    delivery_address: string;
    estimated_delivery_time: string | null;
    actual_delivery_time: string | null;
    delivery_staff_id: number | null;
    driver_name: string | null;
    driver_phone: string | null;
    vehicle_type: string | null;
    vehicle_number: string | null;
    delivery_fee: number;
    delivery_notes: string | null;
    current_latitude: number | null;
    current_longitude: number | null;
    location_updated_at: string | null;
    deliveryStaff: { name: string; phone: string; rating: number } | null;
  } | null;

  tracking_history: TrackHistory[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const API = process.env.NEXT_PUBLIC_API_URL || 'https://api.hypermarket.co.ke/api';

const KES = (n: number) =>
  new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(n || 0);

const fmtDate = (s: string | null | undefined, includeTime = true) => {
  if (!s) return '—';
  const date = new Date(s);
  if (isNaN(date.getTime())) return 'Invalid date';
  return new Intl.DateTimeFormat('en-KE', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...(includeTime && { hour: '2-digit', minute: '2-digit' })
  }).format(date);
};

const STATUS_ORDER_STEPS = [
  { key: 'pending',          label: 'Order Placed',      icon: Package },
  { key: 'confirmed',        label: 'Confirmed',         icon: CheckCircle },
  { key: 'processing',       label: 'Processing',        icon: Activity },
  { key: 'shipped',          label: 'Shipped',           icon: Truck },
  { key: 'out_for_delivery', label: 'Out for Delivery',  icon: Navigation },
  { key: 'delivered',        label: 'Delivered',         icon: CheckCircle },
];

const ORDER_STATUSES = ['pending','confirmed','processing','shipped','out_for_delivery','delivered','cancelled'];
const PAYMENT_STATUSES = ['pending','paid','failed','refunded'];

const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-blue-100 text-blue-800',
  processing: 'bg-violet-100 text-violet-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  out_for_delivery: 'bg-orange-100 text-orange-800',
  delivered: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-red-100 text-red-800',
  paid: 'bg-emerald-100 text-emerald-800',
  failed: 'bg-red-100 text-red-800',
  refunded: 'bg-purple-100 text-purple-800',
};

function StatusBadge({ status, className = '' }: { status: string; className?: string }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${STATUS_COLOR[status] || 'bg-gray-100 text-gray-700'} ${className}`}>
      {status?.replace(/_/g, ' ') || 'Unknown'}
    </span>
  );
}

function getStepDate(order: OrderDetail, key: string): string | null {
  const map: Record<string, string | null | undefined> = {
    pending:          order.created_at,
    confirmed:        order.confirmed_at,
    processing:       order.processing_at,
    shipped:          order.shipped_at,
    out_for_delivery: order.out_for_delivery_at,
    delivered:        order.delivered_at ?? order.actual_delivery,
  };
  return map[key] ?? null;
}

function getStepIndexOf(status: string) {
  return STATUS_ORDER_STEPS.findIndex(s => s.key === status);
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminOrderDetailPage() {
  const params   = useParams();
  const router   = useRouter();
  const [order, setOrder]         = useState<OrderDetail | null>(null);
  const [loading, setLoading]     = useState(true);
  const [updating, setUpdating]   = useState(false);
  const [editOpen, setEditOpen]   = useState(false);
  const [toast, setToast]         = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [formData, setFormData]   = useState({ status: '', payment_status: '', notes: '' });
  const [assigning, setAssigning] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchOrder = useCallback(async () => {
    const token = localStorage.getItem('admin_token') || localStorage.getItem('token');
    if (!token) { router.push('/admin/login'); return; }
    try {
      const res = await fetch(`${API}/admin/orders/${params.id}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          Accept: 'application/json' 
        },
      });
      if (res.status === 401) { router.push('/admin/login'); return; }
      if (res.ok) {
        const data = await res.json();
        // Handle different response formats
        const orderData = data.order || data.data || data;
        setOrder(orderData);
        setFormData({ 
          status: orderData.status || '', 
          payment_status: orderData.payment_status || '', 
          notes: orderData.notes || '' 
        });
      } else {
        showToast('Failed to fetch order details', 'error');
      }
    } catch (e) { 
      console.error(e);
      showToast('Network error', 'error');
    } finally { 
      setLoading(false); 
    }
  }, [params.id, router]);

  useEffect(() => { fetchOrder(); }, [fetchOrder]);

  const handleUpdate = async () => {
    if (!order) return;
    setUpdating(true);
    try {
      const token = localStorage.getItem('admin_token') || localStorage.getItem('token');
      const res = await fetch(`${API}/admin/orders/${order.id}/status`, {
        method: 'PUT',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json', 
          Accept: 'application/json' 
        },
        body: JSON.stringify({ status: formData.status, notes: formData.notes }),
      });
      if (res.ok) {
        showToast('Order updated successfully', 'success');
        setEditOpen(false);
        fetchOrder();
      } else {
        const data = await res.json();
        showToast(data.message || 'Update failed', 'error');
      }
    } catch { 
      showToast('Network error', 'error'); 
    } finally { 
      setUpdating(false); 
    }
  };

  const assignDelivery = async () => {
    if (!order) return;
    const staffId = prompt('Enter delivery staff ID:');
    if (!staffId) return;
    
    setAssigning(true);
    try {
      const token = localStorage.getItem('admin_token') || localStorage.getItem('token');
      const res = await fetch(`${API}/admin/orders/${order.id}/assign-delivery`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ delivery_staff_id: parseInt(staffId) }),
      });
      if (res.ok) {
        showToast('Delivery assigned successfully', 'success');
        fetchOrder();
      } else {
        const data = await res.json();
        showToast(data.message || 'Failed to assign delivery', 'error');
      }
    } catch (error) {
      showToast('Network error', 'error');
    } finally {
      setAssigning(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Order not found</h3>
          <p className="text-gray-500 mb-4">The order you're looking for doesn't exist or has been removed.</p>
          <Link href="/admin/orders" className="inline-flex items-center px-5 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  const currentStepIdx = getStepIndexOf(order.status);
  const addressFull = order.address
    ? [order.address.address_line_1, order.address.address_line_2, order.address.city, order.address.state, order.address.postal_code, order.address.country]
        .filter(Boolean).join(', ')
    : 'No address provided';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-2xl text-sm flex items-center gap-2 ${
          toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.message}
        </div>
      )}

      <div className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Header ── */}
        <div className="mb-6">
          <Link href="/admin/orders" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Orders
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-1">
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Order #{order.order_number}
                </h1>
                <StatusBadge status={order.status} />
                <StatusBadge status={order.payment_status} />
              </div>
              <p className="text-sm text-gray-500">
                Tracking: <span className="font-mono font-medium text-gray-700">{order.tracking_number || 'N/A'}</span>
                &nbsp;·&nbsp;Placed {fmtDate(order.created_at)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setEditOpen(!editOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 text-sm font-medium transition-all shadow-sm hover:shadow-md">
                <Edit className="w-4 h-4" /> Edit Order
              </button>
              <button onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 bg-white rounded-xl hover:bg-gray-50 text-sm font-medium transition-all">
                <Printer className="w-4 h-4" /> Print
              </button>
              <button onClick={() => fetchOrder()}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 bg-white rounded-xl hover:bg-gray-50 text-sm font-medium transition-all">
                <RefreshCw className="w-4 h-4" /> Refresh
              </button>
            </div>
          </div>
        </div>

        {/* ── Edit panel ── */}
        {editOpen && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-gray-900 text-lg">Update Order</h2>
              <button onClick={() => setEditOpen(false)} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-5">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Order Status</label>
                <select value={formData.status} onChange={e => setFormData(f => ({ ...f, status: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white">
                  {ORDER_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ').toUpperCase()}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Payment Status</label>
                <select value={formData.payment_status} onChange={e => setFormData(f => ({ ...f, payment_status: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white">
                  {PAYMENT_STATUSES.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Notes</label>
                <input type="text" value={formData.notes} onChange={e => setFormData(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Internal note…"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setEditOpen(false)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-xl hover:bg-gray-50 transition-all">Cancel</button>
              <button onClick={handleUpdate} disabled={updating}
                className="px-5 py-2 text-sm font-medium bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2 transition-all">
                {updating && <Loader2 className="w-4 h-4 animate-spin" />}
                {updating ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TRACKING PROGRESS BAR
        ══════════════════════════════════════════════════════════════════ */}
        {!['cancelled'].includes(order.status) && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5 sm:p-6 mb-6">
            <h2 className="font-semibold text-gray-900 mb-5 flex items-center gap-2">
              <Navigation className="w-4 h-4 text-blue-600" /> Order Progress
            </h2>
            <div className="relative">
              {/* Connecting line - desktop only */}
              <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 hidden sm:block" />
              <div
                className="absolute top-5 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-emerald-500 hidden sm:block transition-all duration-500"
                style={{ width: `${currentStepIdx >= 0 ? (currentStepIdx / (STATUS_ORDER_STEPS.length - 1)) * 100 : 0}%` }}
              />

              <div className="flex flex-col sm:flex-row gap-4 sm:gap-0 sm:justify-between relative">
                {STATUS_ORDER_STEPS.map((step, idx) => {
                  const completed = idx < currentStepIdx || order.status === step.key;
                  const current   = order.status === step.key;
                  const future    = idx > currentStepIdx;
                  const Icon      = step.icon;
                  const date      = getStepDate(order, step.key);

                  return (
                    <div key={step.key}
                      className={`flex sm:flex-col items-center sm:items-center gap-3 sm:gap-0 sm:flex-1 ${future ? 'opacity-40' : ''}`}>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 relative z-10 transition-all ${
                        current    ? 'bg-blue-600 text-white ring-4 ring-blue-100' :
                        completed  ? 'bg-emerald-500 text-white' :
                        'bg-gray-100 text-gray-400 border-2 border-gray-200'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="sm:text-center sm:mt-3">
                        <p className={`text-xs font-semibold ${current ? 'text-blue-700' : completed ? 'text-emerald-700' : 'text-gray-500'}`}>
                          {step.label}
                        </p>
                        {date && (
                          <p className="text-xs text-gray-400 mt-0.5 hidden sm:block">
                            {fmtDate(date, false)}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {order.estimated_delivery && (
              <div className="mt-5 pt-4 border-t border-gray-100 flex flex-wrap items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4 text-gray-400" />
                Estimated delivery: <span className="font-medium text-gray-900">{fmtDate(order.estimated_delivery, false)}</span>
                {order.actual_delivery && (
                  <><ChevronRight className="w-4 h-4 text-gray-300" />
                  Delivered: <span className="font-medium text-emerald-700">{fmtDate(order.actual_delivery)}</span></>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Main grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── LEFT: items + tracking history ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Order items */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                <h2 className="font-semibold text-gray-900">Order Items ({order.items?.length || 0})</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {order.items?.map((item, i) => (
                  <div key={i} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
                    {item.product.thumbnail ? (
                      <img src={item.product.thumbnail.startsWith('http') ? item.product.thumbnail : `${API}/storage/${item.product.thumbnail}`} 
                        alt={item.product.name}
                        className="w-14 h-14 rounded-xl object-cover flex-shrink-0 border border-gray-100"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <Package className="w-7 h-7 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <Link href={`/admin/products/${item.product.id}`}
                        className="font-medium text-blue-600 hover:text-blue-800 text-sm truncate block">
                        {item.product.name}
                      </Link>
                      <p className="text-xs text-gray-400 mt-0.5">SKU: {item.product.sku || 'N/A'}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{KES(item.price)} × {item.quantity}</p>
                    </div>
                    <p className="font-semibold text-gray-900 text-sm flex-shrink-0">{KES(item.total)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery info */}
            {order.delivery && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
                  <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Truck className="w-4 h-4 text-blue-600" /> Delivery
                  </h2>
                  <StatusBadge status={order.delivery.status} />
                </div>
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <p className="text-xs text-gray-500 mb-1 font-semibold uppercase tracking-wide">Delivery Address</p>
                      <p className="text-sm text-gray-800">{order.delivery.delivery_address || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1 font-semibold uppercase tracking-wide">ETA</p>
                      <p className="text-sm text-gray-800">{fmtDate(order.delivery.estimated_delivery_time)}</p>
                    </div>
                    {order.delivery.actual_delivery_time && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1 font-semibold uppercase tracking-wide">Delivered At</p>
                        <p className="text-sm text-emerald-700 font-medium">{fmtDate(order.delivery.actual_delivery_time)}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-gray-500 mb-1 font-semibold uppercase tracking-wide">Delivery Fee</p>
                      <p className="text-sm font-semibold text-gray-900">{KES(order.delivery.delivery_fee)}</p>
                    </div>
                  </div>

                  {/* Driver */}
                  {(order.delivery.deliveryStaff || order.delivery.driver_name) && (
                    <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900">
                          {order.delivery.deliveryStaff?.name || order.delivery.driver_name}
                        </p>
                        <p className="text-xs text-gray-500 flex flex-wrap items-center gap-2">
                          {(order.delivery.driver_phone || order.delivery.deliveryStaff?.phone) && (
                            <a href={`tel:${order.delivery.driver_phone || order.delivery.deliveryStaff?.phone}`}
                              className="flex items-center gap-1 text-blue-600 hover:underline">
                              <Phone className="w-3 h-3" />
                              {order.delivery.driver_phone || order.delivery.deliveryStaff?.phone}
                            </a>
                          )}
                          {order.delivery.vehicle_type && (
                            <span className="text-xs text-gray-500">{order.delivery.vehicle_type} · {order.delivery.vehicle_number}</span>
                          )}
                        </p>
                      </div>
                      {order.delivery.deliveryStaff?.rating && (
                        <div className="flex items-center gap-1 text-amber-500 flex-shrink-0">
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                          <span className="text-xs font-medium text-gray-700">{order.delivery.deliveryStaff.rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* GPS */}
                  {order.delivery.current_latitude ? (
                    <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-xl">
                      <p className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5 mb-2 uppercase tracking-wide">
                        <Navigation className="w-3.5 h-3.5" /> Live GPS Location
                      </p>
                      <p className="text-xs text-gray-600 font-mono">
                        {order.delivery.current_latitude.toFixed(6)}, {(order.delivery.current_longitude || 0).toFixed(6)}
                      </p>
                      {order.delivery.location_updated_at && (
                        <p className="text-xs text-gray-400 mt-0.5">Updated: {fmtDate(order.delivery.location_updated_at)}</p>
                      )}
                      <a
                        href={`https://www.google.com/maps?q=${order.delivery.current_latitude},${order.delivery.current_longitude}`}
                        target="_blank" rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800">
                        Open in Maps <ChevronRight className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" /> GPS tracking not yet active
                    </p>
                  )}

                  {!order.delivery.delivery_staff_id && order.status !== 'delivered' && (
                    <div className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-xl">
                      <p className="text-xs text-amber-700 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5" /> No driver assigned yet
                      </p>
                      <button onClick={assignDelivery} disabled={assigning}
                        className="text-xs font-medium text-blue-600 hover:underline flex items-center gap-1">
                        {assigning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Truck className="w-3.5 h-3.5" />}
                        Assign Now
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {!order.delivery && order.status !== 'cancelled' && (
              <div className="bg-white rounded-2xl shadow-lg border border-dashed border-gray-200 p-8 text-center">
                <Truck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500 mb-4">No delivery created for this order yet.</p>
                <button
                  onClick={assignDelivery}
                  disabled={assigning}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 transition-all shadow-sm"
                >
                  {assigning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Truck className="w-4 h-4" />}
                  {assigning ? 'Assigning...' : 'Assign Delivery'}
                </button>
              </div>
            )}

            {/* Tracking History */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" /> Tracking History
                </h2>
              </div>
              <div className="p-5">
                {!order.tracking_history || order.tracking_history.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-8">No tracking events yet.</p>
                ) : (
                  <div className="relative">
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-200 via-gray-200 to-gray-100" />
                    <div className="space-y-6">
                      {order.tracking_history.map((h, i) => {
                        const isGood = ['delivered', 'confirmed', 'processing', 'shipped', 'out_for_delivery'].includes(h.status);
                        const isBad  = ['cancelled', 'failed'].includes(h.status);
                        return (
                          <div key={h.id ?? i} className="flex items-start gap-4 relative">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 relative z-10 ${
                              isBad  ? 'bg-red-100' :
                              isGood ? 'bg-emerald-100' : 'bg-blue-100'
                            }`}>
                              {isBad   ? <XCircle className="w-4 h-4 text-red-600" /> :
                               isGood  ? <CheckCircle className="w-4 h-4 text-emerald-600" /> :
                                         <Package className="w-4 h-4 text-blue-600" />}
                            </div>
                            <div className="flex-1 min-w-0 pt-0.5">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <p className="text-sm font-semibold text-gray-900">{h.title}</p>
                                <p className="text-xs text-gray-400 flex-shrink-0">{fmtDate(h.actual_date)}</p>
                              </div>
                              {h.description && <p className="text-sm text-gray-600 mt-0.5">{h.description}</p>}
                              {h.location && (
                                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                  <MapPin className="w-3 h-3 flex-shrink-0" />{h.location}
                                </p>
                              )}
                              {h.user && (
                                <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                  <User className="w-3 h-3 flex-shrink-0" />
                                  {h.user.name} ({h.user.role})
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── RIGHT: sidebar ── */}
          <div className="space-y-5">

            {/* Customer */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-600" /> Customer
                </h2>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-semibold text-lg">{order.user.name?.charAt(0) || 'U'}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{order.user.name}</p>
                    <p className="text-xs text-gray-500">Customer ID #{order.user.id}</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <a href={`mailto:${order.user.email}`} className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors">
                    <Mail className="w-3.5 h-3.5 flex-shrink-0" /><span className="truncate">{order.user.email}</span>
                  </a>
                  {order.user.phone && (
                    <a href={`tel:${order.user.phone}`} className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors">
                      <Phone className="w-3.5 h-3.5 flex-shrink-0" />{order.user.phone}
                    </a>
                  )}
                  <div className="flex items-start gap-2 text-gray-600">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    <span className="text-xs">{addressFull}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment summary */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-blue-600" /> Payment
                </h2>
              </div>
              <div className="p-5 space-y-3 text-sm">
                {[
                  { label: 'Subtotal',  value: KES(order.subtotal || 0) },
                  { label: 'Tax',       value: KES(order.tax || 0) },
                  { label: 'Shipping',  value: KES(order.shipping_fee || 0) },
                  ...((order.discount || 0) > 0 ? [{ label: 'Discount', value: `-${KES(order.discount || 0)}` }] : []),
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between text-gray-600">
                    <span>{label}</span><span>{value}</span>
                  </div>
                ))}
                <div className="flex justify-between font-bold text-gray-900 pt-3 border-t border-gray-100 text-base">
                  <span>Total</span><span>{KES(order.total || 0)}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500 pt-1">
                  <span>Method</span>
                  <span className="capitalize">{order.payment_method?.replace(/_/g, ' ') || '—'}</span>
                </div>
                <div className="flex justify-between items-center text-xs pt-1">
                  <span className="text-gray-500">Status</span>
                  <StatusBadge status={order.payment_status} />
                </div>
              </div>
            </div>

            {/* Shipping */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-blue-600" /> Shipping
                </h2>
              </div>
              <div className="p-5 space-y-3 text-sm">
                {[
                  { label: 'Method',   value: order.shipping_method || 'Standard Shipping' },
                  { label: 'Carrier',  value: order.carrier || '—' },
                  { label: 'Tracking', value: order.tracking_number || 'N/A' },
                  { label: 'ETA',      value: fmtDate(order.estimated_delivery, false) },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-gray-500">{label}</span>
                    <span className="text-gray-900 font-medium text-right max-w-[60%] truncate" title={value}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick links */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Quick Links</p>
              <div className="space-y-1">
                <Link href="/admin/deliveries"
                  className="flex items-center justify-between px-3 py-2 text-sm text-gray-700 rounded-xl hover:bg-gray-50 transition-colors">
                  <span className="flex items-center gap-2"><Truck className="w-4 h-4 text-gray-400" />Delivery Management</span>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </Link>
                <Link href={`/admin/customers/${order.user.id}`}
                  className="flex items-center justify-between px-3 py-2 text-sm text-gray-700 rounded-xl hover:bg-gray-50 transition-colors">
                  <span className="flex items-center gap-2"><User className="w-4 h-4 text-gray-400" />Customer Profile</span>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </Link>
                <Link href="/admin/orders"
                  className="flex items-center justify-between px-3 py-2 text-sm text-gray-700 rounded-xl hover:bg-gray-50 transition-colors">
                  <span className="flex items-center gap-2"><Package className="w-4 h-4 text-gray-400" />All Orders</span>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </Link>
              </div>
            </div>

            {/* Notes */}
            {order.notes && (
              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-100 rounded-2xl p-4">
                <p className="text-xs font-semibold text-amber-700 mb-1.5 uppercase tracking-wide">Order Notes</p>
                <p className="text-sm text-amber-800">{order.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}