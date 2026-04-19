'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Truck, MapPin, Clock, CheckCircle, XCircle, User, Filter, Search,
  RefreshCw, Navigation, Users, TrendingUp, Package, CheckSquare,
  UserPlus, Download, Eye, Edit, Trash2, Phone, Mail, Calendar,
  DollarSign, AlertTriangle, ChevronDown, ChevronUp, Star, Wifi,
  WifiOff, MoreVertical, ArrowRight, Activity, Shield, X
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Delivery {
  id: number;
  order_id: number;
  order_number: string;
  status: string;
  delivery_address: string;
  estimated_delivery_time: string;
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
  created_at: string;
  updated_at: string;
}

interface DeliveryStaff {
  id: number;
  name: string;
  email: string;
  phone: string;
  avatar: string | null;
  vehicle_type: string;
  vehicle_number: string;
  address: string;
  status: string;
  is_online: boolean;
  rating: number;
  total_deliveries: number;
  completed_deliveries: number;
  failed_deliveries: number;
  total_earnings: number;
  commission_rate: number;
  current_location: string | null;
  current_latitude: number | null;
  current_longitude: number | null;
  last_login_at: string | null;
}

interface Stats {
  total_deliveries: number;
  active_deliveries: number;
  completed_today: number;
  total_staff: number;
  online_staff: number;
  pending_assignments: number;
  success_rate: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const API = process.env.NEXT_PUBLIC_API_URL || '';

async function authFetch(path: string, opts: RequestInit = {}) {
  const token = localStorage.getItem('admin_token') || localStorage.getItem('token');
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    },
  });
  return res;
}

function extractArray(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') {
    const d = data as Record<string, unknown>;
    if (Array.isArray(d.data)) return d.data as unknown[];
    if (d.data && Array.isArray((d.data as any).data)) return (d.data as any).data;
    if (Array.isArray(d.items)) return d.items as unknown[];
  }
  return [];
}

const KES = (n: number) =>
  new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(n || 0);

const fmtDate = (s: string | null) => {
  if (!s) return '—';
  return new Date(s).toLocaleString('en-KE', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

// ─── Status config ─────────────────────────────────────────────────────────

const DELIVERY_STATUS: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  pending:          { label: 'Pending',          bg: 'bg-amber-50',   text: 'text-amber-700',  dot: 'bg-amber-400' },
  assigned:         { label: 'Assigned',         bg: 'bg-blue-50',    text: 'text-blue-700',   dot: 'bg-blue-500' },
  in_transit:       { label: 'In Transit',       bg: 'bg-violet-50',  text: 'text-violet-700', dot: 'bg-violet-500' },
  out_for_delivery: { label: 'Out for Delivery', bg: 'bg-orange-50',  text: 'text-orange-700', dot: 'bg-orange-500' },
  delivered:        { label: 'Delivered',        bg: 'bg-emerald-50', text: 'text-emerald-700',dot: 'bg-emerald-500' },
  failed:           { label: 'Failed',           bg: 'bg-red-50',     text: 'text-red-700',    dot: 'bg-red-500' },
  cancelled:        { label: 'Cancelled',        bg: 'bg-gray-100',   text: 'text-gray-600',   dot: 'bg-gray-400' },
  returned:         { label: 'Returned',         bg: 'bg-gray-100',   text: 'text-gray-600',   dot: 'bg-gray-400' },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = DELIVERY_STATUS[status] || { label: status, bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminDeliveriesPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'deliveries' | 'staff' | 'tracking'>('deliveries');
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [staff, setStaff] = useState<DeliveryStaff[]>([]);
  const [stats, setStats] = useState<Stats>({
    total_deliveries: 0, active_deliveries: 0, completed_today: 0,
    total_staff: 0, online_staff: 0, pending_assignments: 0, success_rate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [toast, setToast] = useState('');

  // Modals
  const [assignModal, setAssignModal] = useState<Delivery | null>(null);
  const [addStaffModal, setAddStaffModal] = useState(false);
  const [staffDetailModal, setStaffDetailModal] = useState<DeliveryStaff | null>(null);
  const [trackModal, setTrackModal] = useState<Delivery | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string[]>>({});

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

  // ── Data loading ────────────────────────────────────────────────────────
  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const token = localStorage.getItem('admin_token') || localStorage.getItem('token');
      if (!token) { router.push('/admin/login'); return; }

      const [dRes, sRes, stRes] = await Promise.all([
        authFetch('/admin/deliveries'),
        authFetch('/admin/delivery-staff'),
        authFetch('/admin/deliveries/stats'),
      ]);

      if (dRes.status === 401) { router.push('/admin/login'); return; }

      if (dRes.ok) {
        const d = await dRes.json();
        setDeliveries(extractArray(d) as Delivery[]);
      }

      if (sRes.ok) {
        const s = await sRes.json();
        const arr = extractArray(s) as DeliveryStaff[];
        setStaff(arr);
        setStats(prev => ({
          ...prev,
          total_staff: arr.length,
          online_staff: arr.filter(x => x.is_online).length,
        }));
        if ((s as any).stats) {
          const st = (s as any).stats;
          setStats(prev => ({ ...prev, total_staff: st.total_staff ?? prev.total_staff, online_staff: st.online_staff ?? prev.online_staff }));
        }
      }

      if (stRes.ok) {
        const st = await stRes.json();
        const d = st.data || st;
        setStats(prev => ({
          ...prev,
          total_deliveries: d.total_deliveries ?? prev.total_deliveries,
          active_deliveries: d.active_deliveries ?? prev.active_deliveries,
          completed_today: d.completed_today ?? prev.completed_today,
          pending_assignments: d.pending_assignments ?? prev.pending_assignments,
          success_rate: d.success_rate ?? prev.success_rate,
        }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { load(); }, [load]);

  // ── Filters ──────────────────────────────────────────────────────────────
  const filteredDeliveries = deliveries.filter(d => {
    const q = search.toLowerCase();
    const matchQ = d.order_number?.toLowerCase().includes(q) ||
                   d.delivery_address?.toLowerCase().includes(q) ||
                   (d.driver_name?.toLowerCase().includes(q) ?? false);
    const matchS = statusFilter === 'all' || d.status === statusFilter;
    return matchQ && matchS;
  });

  const filteredStaff = staff.filter(s => {
    const q = search.toLowerCase();
    const matchQ = s.name?.toLowerCase().includes(q) ||
                   s.email?.toLowerCase().includes(q) ||
                   s.vehicle_number?.toLowerCase().includes(q);
    if (statusFilter === 'online') return matchQ && s.is_online;
    if (statusFilter === 'offline') return matchQ && !s.is_online;
    if (statusFilter !== 'all') return matchQ && s.status === statusFilter;
    return matchQ;
  });

  const availableStaff = staff.filter(s => s.is_online && s.status === 'active');
  const pendingCount = deliveries.filter(d => !d.delivery_staff_id && d.status === 'pending').length;
  const activeDeliveries = deliveries.filter(d => ['in_transit', 'out_for_delivery', 'assigned'].includes(d.status));

  // ── Actions ──────────────────────────────────────────────────────────────
  const handleAssign = async (staffId: number) => {
    if (!assignModal) return;
    setSubmitting(true);
    try {
      const res = await authFetch('/admin/deliveries/assign', {
        method: 'POST',
        body: JSON.stringify({ delivery_id: assignModal.id, delivery_staff_id: staffId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Delivery assigned successfully');
        setAssignModal(null);
        load(true);
      } else {
        showToast(data.message || 'Failed to assign delivery');
      }
    } catch { showToast('Network error'); }
    finally { setSubmitting(false); }
  };

  const handleUpdateStatus = async (deliveryId: number, status: string) => {
    try {
      const res = await authFetch(`/admin/deliveries/${deliveryId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Status updated to ${status}`);
        load(true);
      } else {
        showToast(data.message || 'Failed to update status');
      }
    } catch { showToast('Network error'); }
  };

  const handleToggleOnline = async (staffId: number, isOnline: boolean) => {
    try {
      const res = await authFetch(`/admin/delivery-staff/${staffId}/toggle-online`, {
        method: 'PUT',
        body: JSON.stringify({ is_online: isOnline }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Staff set ${isOnline ? 'online' : 'offline'}`);
        load(true);
      } else {
        showToast(data.message || 'Failed to update status');
      }
    } catch { showToast('Network error'); }
  };

  const handleDeleteStaff = async (staffId: number) => {
    if (!confirm('Are you sure you want to remove this delivery staff member?')) return;
    try {
      const res = await authFetch(`/admin/delivery-staff/${staffId}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) { showToast('Staff removed'); load(true); }
      else showToast(data.message || 'Failed to remove staff');
    } catch { showToast('Network error'); }
  };

  const handleAddStaff = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormErrors({});
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const body: Record<string, string> = {};
    fd.forEach((v, k) => { body[k] = v as string; });
    try {
      const res = await authFetch('/admin/delivery-staff', { method: 'POST', body: JSON.stringify(body) });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Staff added successfully');
        setAddStaffModal(false);
        load(true);
      } else {
        if (data.errors) setFormErrors(data.errors);
        showToast(data.message || 'Failed to add staff');
      }
    } catch { showToast('Network error'); }
    finally { setSubmitting(false); }
  };

  const handleBulkAssign = async () => {
    if (pendingCount === 0) { showToast('No pending deliveries to assign'); return; }
    if (availableStaff.length === 0) { showToast('No available staff online'); return; }
    const unassigned = deliveries.filter(d => !d.delivery_staff_id && d.status === 'pending').slice(0, 5);
    const best = availableStaff.reduce((p, c) => (c.rating > p.rating ? c : p));
    try {
      const res = await authFetch('/admin/deliveries/bulk-assign', {
        method: 'POST',
        body: JSON.stringify({ delivery_ids: unassigned.map(d => d.id), delivery_staff_id: best.id }),
      });
      const data = await res.json();
      if (res.ok) { showToast(`Assigned ${data.data?.assigned?.length ?? unassigned.length} deliveries to ${best.name}`); load(true); }
      else showToast(data.message || 'Bulk assign failed');
    } catch { showToast('Network error'); }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading delivery data…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white px-5 py-3 rounded-xl shadow-2xl text-sm animate-fade-in">
          {toast}
        </div>
      )}

      <div className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Delivery Management</h1>
            <p className="text-gray-500 mt-1 text-sm">Manage deliveries, drivers and live tracking</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setAddStaffModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium transition-colors">
              <UserPlus className="w-4 h-4" /> Add Driver
            </button>
            <button onClick={handleBulkAssign}
              disabled={pendingCount === 0 || availableStaff.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium transition-colors">
              <CheckSquare className="w-4 h-4" /> Auto-Assign ({pendingCount})
            </button>
            <button onClick={() => load(true)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 bg-white rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors">
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {[
            { label: 'Total Deliveries', value: stats.total_deliveries, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Active Now',       value: stats.active_deliveries, icon: Truck,   color: 'text-orange-600', bg: 'bg-orange-50' },
            { label: 'Done Today',       value: stats.completed_today,   icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Total Drivers',    value: stats.total_staff,       icon: Users,   color: 'text-violet-600', bg: 'bg-violet-50' },
            { label: 'Online Now',       value: stats.online_staff,      icon: Activity, color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'Success Rate',     value: `${stats.success_rate}%`,icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <p className="text-xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* ── Tabs ── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
          <div className="flex border-b border-gray-200 overflow-x-auto">
            {[
              { id: 'deliveries', label: 'Deliveries', icon: Truck,     count: deliveries.length },
              { id: 'staff',      label: 'Drivers',    icon: Users,     count: staff.length },
              { id: 'tracking',   label: 'Live Track',  icon: Navigation,count: activeDeliveries.length },
            ].map(({ id, label, icon: Icon, count }) => (
              <button key={id} onClick={() => setActiveTab(id as typeof activeTab)}
                className={`flex items-center gap-2 px-5 py-4 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                  activeTab === id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}>
                <Icon className="w-4 h-4" />
                {label}
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  activeTab === id ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                }`}>{count}</span>
              </button>
            ))}
          </div>

          {/* Filters bar */}
          <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input type="text" placeholder={activeTab === 'staff' ? 'Search by name, email, vehicle…' : 'Search by order #, address, driver…'}
                value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white">
              <option value="all">All Status</option>
              {activeTab === 'staff' ? (
                <>
                  <option value="active">Active</option>
                  <option value="online">Online</option>
                  <option value="offline">Offline</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </>
              ) : (
                <>
                  <option value="pending">Pending</option>
                  <option value="assigned">Assigned</option>
                  <option value="in_transit">In Transit</option>
                  <option value="out_for_delivery">Out for Delivery</option>
                  <option value="delivered">Delivered</option>
                  <option value="failed">Failed</option>
                  <option value="cancelled">Cancelled</option>
                </>
              )}
            </select>
            {(search || statusFilter !== 'all') && (
              <button onClick={() => { setSearch(''); setStatusFilter('all'); }}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50">
                <X className="w-3.5 h-3.5" /> Clear
              </button>
            )}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            TAB: DELIVERIES
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'deliveries' && (
          <div className="space-y-4">
            {filteredDeliveries.length === 0 ? (
              <EmptyState icon={Truck} title="No deliveries found" desc="Adjust your filters or create new orders." />
            ) : (
              filteredDeliveries.map(delivery => (
                <div key={delivery.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    {/* Left info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="font-semibold text-gray-900">Order #{delivery.order_number}</span>
                        <StatusBadge status={delivery.status} />
                        {!delivery.delivery_staff_id && delivery.status === 'pending' && (
                          <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-medium">⚠ Unassigned</span>
                        )}
                      </div>
                      <div className="flex flex-col sm:flex-row gap-x-5 gap-y-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1.5 truncate">
                          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="truncate">{delivery.delivery_address || '—'}</span>
                        </span>
                        <span className="flex items-center gap-1.5 whitespace-nowrap">
                          <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                          ETA: {fmtDate(delivery.estimated_delivery_time)}
                        </span>
                      </div>
                      {/* Driver row */}
                      {delivery.driver_name ? (
                        <div className="flex items-center gap-2 mt-2 text-sm">
                          <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                            <User className="w-3.5 h-3.5 text-blue-600" />
                          </div>
                          <span className="font-medium text-gray-700">{delivery.driver_name}</span>
                          {delivery.driver_phone && (
                            <a href={`tel:${delivery.driver_phone}`} className="text-blue-600 hover:underline flex items-center gap-1">
                              <Phone className="w-3 h-3" /> {delivery.driver_phone}
                            </a>
                          )}
                          {delivery.vehicle_number && (
                            <span className="text-gray-400 text-xs">· {delivery.vehicle_type} {delivery.vehicle_number}</span>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 mt-2 italic">No driver assigned</p>
                      )}
                      {delivery.actual_delivery_time && (
                        <p className="text-xs text-emerald-600 mt-1 font-medium">
                          ✓ Delivered {fmtDate(delivery.actual_delivery_time)}
                        </p>
                      )}
                    </div>

                    {/* Right actions */}
                    <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-end">
                      <span className="text-sm font-semibold text-gray-900">{KES(delivery.delivery_fee)}</span>
                      <div className="flex gap-2">
                        {delivery.current_latitude && (
                          <button onClick={() => setTrackModal(delivery)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-violet-50 text-violet-700 border border-violet-200 rounded-lg hover:bg-violet-100 transition-colors">
                            <Navigation className="w-3.5 h-3.5" /> Track
                          </button>
                        )}
                        {(!delivery.delivery_staff_id || delivery.status === 'pending') && (
                          <button onClick={() => setAssignModal(delivery)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors">
                            <User className="w-3.5 h-3.5" /> {delivery.delivery_staff_id ? 'Re-assign' : 'Assign'}
                          </button>
                        )}
                        <StatusDropdown
                          current={delivery.status}
                          onChange={s => handleUpdateStatus(delivery.id, s)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB: STAFF
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'staff' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredStaff.length === 0 ? (
              <div className="col-span-full">
                <EmptyState icon={Users} title="No drivers found" desc="Add a new driver using the button above." />
              </div>
            ) : (
              filteredStaff.map(s => (
                <div key={s.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
                  {/* Top row */}
                  <div className="flex items-start gap-3 mb-4">
                    <div className="relative flex-shrink-0">
                      {s.avatar ? (
                        <img src={s.avatar} alt={s.name} className="w-12 h-12 rounded-full object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
                          <span className="text-white font-semibold text-lg">{s.name.charAt(0)}</span>
                        </div>
                      )}
                      <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${s.is_online ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{s.name}</p>
                      <p className="text-xs text-gray-500 truncate">{s.email}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          s.status === 'active' ? 'bg-emerald-50 text-emerald-700' :
                          s.status === 'suspended' ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-600'
                        }`}>{s.status}</span>
                        <span className={`text-xs flex items-center gap-1 ${s.is_online ? 'text-emerald-600' : 'text-gray-400'}`}>
                          {s.is_online ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                          {s.is_online ? 'Online' : 'Offline'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-3 gap-3 mb-4 text-center">
                    <div className="bg-gray-50 rounded-lg p-2">
                      <p className="text-base font-bold text-gray-900">{s.total_deliveries || 0}</p>
                      <p className="text-xs text-gray-500">Total</p>
                    </div>
                    <div className="bg-emerald-50 rounded-lg p-2">
                      <p className="text-base font-bold text-emerald-700">{s.completed_deliveries || 0}</p>
                      <p className="text-xs text-gray-500">Done</p>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-2">
                      <div className="flex items-center justify-center gap-0.5">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        <p className="text-base font-bold text-amber-700">{(s.rating || 0).toFixed(1)}</p>
                      </div>
                      <p className="text-xs text-gray-500">Rating</p>
                    </div>
                  </div>

                  {/* Contact row */}
                  <div className="flex gap-2 text-xs text-gray-500 mb-4">
                    <span className="flex items-center gap-1 truncate"><Phone className="w-3 h-3 flex-shrink-0" />{s.phone || '—'}</span>
                    <span className="text-gray-300">·</span>
                    <span className="flex items-center gap-1 truncate"><Truck className="w-3 h-3 flex-shrink-0" />{s.vehicle_type} {s.vehicle_number}</span>
                  </div>

                  {/* Earnings */}
                  <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-xs text-gray-500">Total Earnings</p>
                      <p className="font-semibold text-gray-900 text-sm">{KES(s.total_earnings || 0)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Commission</p>
                      <p className="font-semibold text-gray-900 text-sm">{s.commission_rate || 15}%</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button onClick={() => setStaffDetailModal(s)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <Eye className="w-3.5 h-3.5" /> View
                    </button>
                    <button onClick={() => handleToggleOnline(s.id, !s.is_online)}
                      className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                        s.is_online
                          ? 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                      }`}>
                      {s.is_online ? <><WifiOff className="w-3.5 h-3.5" /> Go Offline</> : <><Wifi className="w-3.5 h-3.5" /> Go Online</>}
                    </button>
                    <button onClick={() => handleDeleteStaff(s.id)}
                      className="p-2 text-gray-400 hover:text-red-600 border border-gray-200 rounded-lg hover:bg-red-50 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB: LIVE TRACKING
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'tracking' && (
          <div className="space-y-4">
            {/* Map placeholder / embed notice */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-2">
              <div className="flex items-center gap-3 mb-4">
                <Navigation className="w-5 h-5 text-blue-600" />
                <h2 className="font-semibold text-gray-900">Live Delivery Tracking</h2>
                <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                  {activeDeliveries.length} active
                </span>
              </div>

              {/* GPS map embed area */}
              <div className="w-full h-64 sm:h-96 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl flex flex-col items-center justify-center border-2 border-dashed border-blue-200 mb-4">
                <Navigation className="w-12 h-12 text-blue-400 mb-3" />
                <p className="text-blue-700 font-medium">Google Maps Integration</p>
                <p className="text-blue-500 text-sm mt-1 text-center px-4">
                  Connect your Google Maps API key to display live driver locations here.
                </p>
                <p className="text-xs text-blue-400 mt-2">Set <code className="bg-blue-100 px-1 rounded">NEXT_PUBLIC_GOOGLE_MAPS_KEY</code> in your .env</p>
              </div>

              {/* Online drivers */}
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Online Drivers ({staff.filter(s => s.is_online).length})</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {staff.filter(s => s.is_online).map(s => (
                  <div key={s.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="relative flex-shrink-0">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">{s.name.charAt(0)}</span>
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{s.name}</p>
                      <p className="text-xs text-gray-500">{s.vehicle_type} · {s.vehicle_number}</p>
                      {s.current_location && (
                        <p className="text-xs text-blue-600 truncate mt-0.5 flex items-center gap-1">
                          <MapPin className="w-3 h-3 flex-shrink-0" />{s.current_location}
                        </p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-medium text-gray-900">
                        {deliveries.filter(d => d.delivery_staff_id === s.id && ['assigned','in_transit','out_for_delivery'].includes(d.status)).length} active
                      </p>
                    </div>
                  </div>
                ))}
                {staff.filter(s => s.is_online).length === 0 && (
                  <div className="col-span-full text-center py-6 text-gray-500 text-sm">No drivers online right now</div>
                )}
              </div>
            </div>

            {/* Active delivery cards */}
            <h2 className="text-base font-semibold text-gray-800 px-1">Active Deliveries</h2>
            {activeDeliveries.length === 0 ? (
              <EmptyState icon={Truck} title="No active deliveries" desc="Deliveries in transit or out for delivery will appear here." />
            ) : (
              activeDeliveries.map(d => (
                <div key={d.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-semibold text-gray-900">#{d.order_number}</span>
                        <StatusBadge status={d.status} />
                      </div>
                      <p className="text-sm text-gray-500 truncate flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" />{d.delivery_address}
                      </p>
                      {d.driver_name && (
                        <p className="text-sm text-gray-600 mt-1 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 flex-shrink-0" />{d.driver_name}
                          {d.driver_phone && <a href={`tel:${d.driver_phone}`} className="text-blue-600 ml-1">· {d.driver_phone}</a>}
                        </p>
                      )}
                      {d.current_latitude && (
                        <p className="text-xs text-emerald-600 mt-1">
                          📍 GPS: {d.current_latitude.toFixed(4)}, {d.current_longitude?.toFixed(4)}
                          {d.location_updated_at && <span className="text-gray-400 ml-1">· updated {fmtDate(d.location_updated_at)}</span>}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setTrackModal(d)}
                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        <Navigation className="w-3.5 h-3.5" /> Open Map
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          MODAL: ASSIGN DRIVER
      ══════════════════════════════════════════════════════════════════ */}
      {assignModal && (
        <Modal title={`Assign Driver — Order #${assignModal.order_number}`} onClose={() => setAssignModal(null)}>
          <div className="p-4 bg-blue-50 rounded-lg mb-5">
            <p className="text-sm font-medium text-blue-900 flex items-center gap-2">
              <MapPin className="w-4 h-4" />{assignModal.delivery_address}
            </p>
            <p className="text-xs text-blue-600 mt-1">ETA: {fmtDate(assignModal.estimated_delivery_time)} · {KES(assignModal.delivery_fee)}</p>
          </div>

          <h4 className="text-sm font-semibold text-gray-700 mb-3">Available Drivers ({availableStaff.length})</h4>

          {availableStaff.length === 0 ? (
            <div className="text-center py-10">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No drivers are online and available right now.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto">
              {availableStaff.map(s => (
                <div key={s.id} className="border border-gray-200 rounded-xl p-4 hover:border-blue-400 hover:bg-blue-50 transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-semibold">{s.name.charAt(0)}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">{s.name}</p>
                      <p className="text-xs text-gray-500">{s.vehicle_type} · {s.vehicle_number}</p>
                    </div>
                    <div className="ml-auto text-right flex-shrink-0">
                      <div className="flex items-center gap-0.5 text-amber-500">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        <span className="text-xs font-medium text-gray-700">{(s.rating || 0).toFixed(1)}</span>
                      </div>
                      <p className="text-xs text-gray-500">{s.completed_deliveries || 0} done</p>
                    </div>
                  </div>
                  <button onClick={() => handleAssign(s.id)} disabled={submitting}
                    className="w-full py-2 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                    Assign to {s.name.split(' ')[0]}
                  </button>
                </div>
              ))}
            </div>
          )}

          {availableStaff.length > 1 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <button
                onClick={() => {
                  const best = availableStaff.reduce((p, c) => c.rating > p.rating ? c : p);
                  handleAssign(best.id);
                }}
                disabled={submitting}
                className="w-full py-2.5 text-sm font-semibold bg-violet-600 text-white rounded-xl hover:bg-violet-700 disabled:opacity-50 transition-colors">
                ✨ Auto-assign Best Driver
              </button>
            </div>
          )}
        </Modal>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          MODAL: ADD STAFF
      ══════════════════════════════════════════════════════════════════ */}
      {addStaffModal && (
        <Modal title="Add Delivery Driver" onClose={() => { setAddStaffModal(false); setFormErrors({}); }} wide>
          <form onSubmit={handleAddStaff} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { name: 'name',     label: 'Full Name *',       type: 'text',  placeholder: 'John Doe' },
                { name: 'email',    label: 'Email *',           type: 'email', placeholder: 'john@example.com' },
                { name: 'phone',    label: 'Phone *',           type: 'tel',   placeholder: '+254 7XX XXX XXX' },
                { name: 'password', label: 'Password *',        type: 'password', placeholder: 'Min 6 characters' },
                { name: 'vehicle_number', label: 'Vehicle Number *', type: 'text', placeholder: 'KBC 123A' },
                { name: 'license_number', label: 'License Number',  type: 'text', placeholder: 'Optional' },
              ].map(f => (
                <div key={f.name}>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{f.label}</label>
                  <input name={f.name} type={f.type} required={f.label.includes('*')} placeholder={f.placeholder}
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                  {formErrors[f.name] && <p className="text-red-500 text-xs mt-1">{formErrors[f.name][0]}</p>}
                </div>
              ))}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Vehicle Type *</label>
                <select name="vehicle_type" required
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white">
                  <option value="">Select type</option>
                  {['bike','car','scooter','motorcycle','van','truck'].map(v => (
                    <option key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</option>
                  ))}
                </select>
                {formErrors.vehicle_type && <p className="text-red-500 text-xs mt-1">{formErrors.vehicle_type[0]}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Commission Rate (%)</label>
                <input name="commission_rate" type="number" defaultValue="15" min="0" max="100" step="0.5"
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Address *</label>
                <textarea name="address" required rows={2} placeholder="Full physical address"
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none" />
                {formErrors.address && <p className="text-red-500 text-xs mt-1">{formErrors.address[0]}</p>}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button type="button" onClick={() => setAddStaffModal(false)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={submitting}
                className="px-5 py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2">
                {submitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                {submitting ? 'Adding…' : 'Add Driver'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          MODAL: STAFF DETAIL
      ══════════════════════════════════════════════════════════════════ */}
      {staffDetailModal && (
        <Modal title="Driver Profile" onClose={() => setStaffDetailModal(null)}>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-2xl">{staffDetailModal.name.charAt(0)}</span>
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">{staffDetailModal.name}</p>
                <p className="text-sm text-gray-500">{staffDetailModal.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${staffDetailModal.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                    {staffDetailModal.status}
                  </span>
                  <span className={`text-xs flex items-center gap-1 ${staffDetailModal.is_online ? 'text-emerald-600' : 'text-gray-400'}`}>
                    {staffDetailModal.is_online ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                    {staffDetailModal.is_online ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Phone', value: staffDetailModal.phone, icon: Phone },
                { label: 'Vehicle', value: `${staffDetailModal.vehicle_type} · ${staffDetailModal.vehicle_number}`, icon: Truck },
                { label: 'Total Deliveries', value: staffDetailModal.total_deliveries || 0, icon: Package },
                { label: 'Completed', value: staffDetailModal.completed_deliveries || 0, icon: CheckCircle },
                { label: 'Rating', value: `${(staffDetailModal.rating || 0).toFixed(1)} ★`, icon: Star },
                { label: 'Commission', value: `${staffDetailModal.commission_rate || 15}%`, icon: DollarSign },
                { label: 'Total Earnings', value: KES(staffDetailModal.total_earnings || 0), icon: DollarSign },
                { label: 'Last Login', value: fmtDate(staffDetailModal.last_login_at), icon: Calendar },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Icon className="w-3.5 h-3.5 text-gray-400" />
                    <p className="text-xs text-gray-500">{label}</p>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">{value}</p>
                </div>
              ))}
            </div>

            {staffDetailModal.address && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Address</p>
                <p className="text-sm text-gray-800">{staffDetailModal.address}</p>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          MODAL: TRACK DELIVERY (map link)
      ══════════════════════════════════════════════════════════════════ */}
      {trackModal && (
        <Modal title={`Tracking — Order #${trackModal.order_number}`} onClose={() => setTrackModal(null)}>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <StatusBadge status={trackModal.status} />
              {trackModal.driver_name && (
                <span className="text-sm text-gray-600 flex items-center gap-1.5">
                  <User className="w-4 h-4" />{trackModal.driver_name}
                </span>
              )}
            </div>

            <div className="p-3 bg-gray-50 rounded-lg text-sm">
              <p className="flex items-center gap-2 text-gray-700">
                <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                {trackModal.delivery_address}
              </p>
              <p className="flex items-center gap-2 text-gray-500 mt-2">
                <Clock className="w-4 h-4 flex-shrink-0" />
                ETA: {fmtDate(trackModal.estimated_delivery_time)}
              </p>
            </div>

            {trackModal.current_latitude ? (
              <>
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-700">
                  <p className="font-medium mb-1 flex items-center gap-1.5"><Navigation className="w-4 h-4" />Live GPS Position</p>
                  <p>Lat: {trackModal.current_latitude.toFixed(6)}</p>
                  <p>Lng: {(trackModal.current_longitude || 0).toFixed(6)}</p>
                  {trackModal.location_updated_at && (
                    <p className="text-xs text-blue-500 mt-1">Updated: {fmtDate(trackModal.location_updated_at)}</p>
                  )}
                </div>
                <a
                  href={`https://www.google.com/maps?q=${trackModal.current_latitude},${trackModal.current_longitude}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors">
                  <Navigation className="w-4 h-4" /> Open in Google Maps
                </a>
              </>
            ) : (
              <div className="text-center py-6 text-gray-400">
                <Navigation className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No GPS data available yet.<br />Location updates when driver goes active.</p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Modal({ title, onClose, children, wide }: {
  title: string; onClose: () => void; children: React.ReactNode; wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} my-auto`}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, title, desc }: { icon: React.ElementType; title: string; desc: string }) {
  return (
    <div className="bg-white rounded-xl border border-dashed border-gray-200 py-16 text-center">
      <Icon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
      <p className="font-medium text-gray-600">{title}</p>
      <p className="text-sm text-gray-400 mt-1">{desc}</p>
    </div>
  );
}

function StatusDropdown({ current, onChange }: { current: string; onChange: (s: string) => void }) {
  const [open, setOpen] = useState(false);
  const statuses = ['pending','assigned','in_transit','out_for_delivery','delivered','failed','cancelled'];
  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-gray-50 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
        <Edit className="w-3.5 h-3.5" /> Status <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-200 rounded-xl shadow-xl z-20 py-1 overflow-hidden">
          {statuses.map(s => (
            <button key={s} onClick={() => { onChange(s); setOpen(false); }}
              className={`w-full text-left px-4 py-2 text-xs hover:bg-gray-50 flex items-center gap-2 ${s === current ? 'font-semibold text-blue-600' : 'text-gray-700'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${DELIVERY_STATUS[s]?.dot || 'bg-gray-400'}`} />
              {DELIVERY_STATUS[s]?.label || s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
