'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Truck,
  Package,
  Clock,
  DollarSign,
  MapPin,
  Navigation,
  Battery,
  Wifi,
  Bell,
  User,
  LogOut,
  Menu,
  X,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  BarChart3,
  Settings,
  Calendar,
  Star,
  Shield,
  RefreshCw,
  Phone,
  Mail,
  Map,
  CheckSquare,
  AlertTriangle
} from 'lucide-react';

interface Delivery {
  id: number;
  order_id: number;
  order_number: string;
  status: 'pending' | 'assigned' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'failed' | 'cancelled' | 'returned';
  delivery_address: string;
  customer_name?: string;
  customer_phone?: string;
  estimated_delivery_time: string;
  actual_delivery_time: string | null;
  delivery_fee: number;
  delivery_notes?: string;
  created_at: string;
  current_latitude?: number;
  current_longitude?: number;
  latitude?: number;
  longitude?: number;
}

interface DeliveryStats {
  total_deliveries: number;
  completed_deliveries: number;
  pending_deliveries: number;
  cancelled_deliveries: number;
  total_earnings: number;
  average_rating: number;
  on_time_deliveries: number;
}

interface DeliveryStaff {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  rating: number;
  is_online: boolean;
  vehicle_type: string;
  vehicle_number: string;
}

export default function DeliveryStaffDashboard() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [deliveryStaff, setDeliveryStaff] = useState<DeliveryStaff | null>(null);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [stats, setStats] = useState<DeliveryStats>({
    total_deliveries: 0,
    completed_deliveries: 0,
    pending_deliveries: 0,
    cancelled_deliveries: 0,
    total_earnings: 0,
    average_rating: 0,
    on_time_deliveries: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [onlineStatus, setOnlineStatus] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'pending' | 'completed'>('active');
  const [showUpdateStatusModal, setShowUpdateStatusModal] = useState<number | null>(null);
  const [showOTPModal, setShowOTPModal] = useState<number | null>(null);
  const [otp, setOtp] = useState('');
  const [statusUpdateNotes, setStatusUpdateNotes] = useState('');

  useEffect(() => {
    checkAuth();
    fetchData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkAuth = () => {
    const userStr = localStorage.getItem('delivery_user');
    const token = localStorage.getItem('delivery_token');
    
    if (!userStr || !token) {
      router.push('/delivery/login');
      return;
    }
    
    try {
      const user = JSON.parse(userStr);
      setDeliveryStaff(user);
      setOnlineStatus(user.is_online ?? true);
    } catch (error) {
      router.push('/delivery/login');
    }
  };

  const fetchData = async () => {
    try {
      setRefreshing(true);
      const token = localStorage.getItem('delivery_token');
      
      if (!token) {
        router.push('/delivery/login');
        return;
      }

      // Fetch stats
      const statsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/delivery-staff/stats`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
      });
      
      if (statsResponse.status === 401) {
        // Token expired or invalid
        localStorage.removeItem('delivery_token');
        localStorage.removeItem('delivery_user');
        router.push('/delivery/login');
        return;
      }
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        if (statsData.success && statsData.data) {
          setStats(statsData.data.stats);
          setDeliveryStaff(statsData.data.user);
        }
      }

      // Fetch deliveries
      const deliveriesResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/delivery-staff/deliveries`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
      });
      
      if (deliveriesResponse.ok) {
        const deliveriesData = await deliveriesResponse.json();
        if (deliveriesData.success) {
          setDeliveries(deliveriesData.data || deliveriesData);
        }
      }

    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('delivery_token');
    localStorage.removeItem('delivery_user');
    router.push('/delivery/login');
  };

  const updateOnlineStatus = async (status: boolean) => {
    try {
      const token = localStorage.getItem('delivery_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/delivery-staff/online-status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_online: status }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setOnlineStatus(status);
          // Update local storage user data
          const userStr = localStorage.getItem('delivery_user');
          if (userStr) {
            const user = JSON.parse(userStr);
            user.is_online = status;
            localStorage.setItem('delivery_user', JSON.stringify(user));
            setDeliveryStaff(user);
          }
        }
      }
    } catch (error) {
      console.error('Failed to update online status:', error);
    }
  };

  const updateDeliveryStatus = async (deliveryId: number, status: string) => {
    try {
      const token = localStorage.getItem('delivery_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/delivery-staff/deliveries/${deliveryId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status,
          notes: statusUpdateNotes 
        }),
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        // Refresh data
        fetchData();
        setShowUpdateStatusModal(null);
        setStatusUpdateNotes('');
        
        // If marking as delivered, show OTP modal
        if (status === 'delivered') {
          setShowOTPModal(deliveryId);
        }
      } else {
        alert(data.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Failed to update delivery status:', error);
      alert('Failed to update delivery status');
    }
  };

  const verifyDeliveryOTP = async (deliveryId: number) => {
    try {
      const token = localStorage.getItem('delivery_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/delivery-staff/deliveries/${deliveryId}/verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ otp }),
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        alert('Delivery verified successfully!');
        setShowOTPModal(null);
        setOtp('');
        fetchData();
      } else {
        alert(data.message || 'Invalid OTP');
      }
    } catch (error) {
      console.error('Failed to verify delivery:', error);
      alert('Failed to verify delivery');
    }
  };

  const updateDeliveryLocation = async (deliveryId: number) => {
    // Get current location using browser geolocation
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const token = localStorage.getItem('delivery_token');
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/delivery-staff/deliveries/${deliveryId}/location`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            }),
          });

          const data = await response.json();
          
          if (response.ok && data.success) {
            alert('Location updated successfully!');
            fetchData();
          } else {
            alert(data.message || 'Failed to update location');
          }
        } catch (error) {
          console.error('Failed to update location:', error);
          alert('Failed to update location');
        }
      },
      (error) => {
        alert('Unable to get your location: ' + error.message);
      }
    );
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      assigned: 'bg-blue-100 text-blue-800',
      in_transit: 'bg-purple-100 text-purple-800',
      out_for_delivery: 'bg-orange-100 text-orange-800',
      delivered: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
      returned: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="w-4 h-4" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4" />;
      case 'in_transit':
        return <Navigation className="w-4 h-4" />;
      case 'out_for_delivery':
        return <Truck className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredDeliveries = deliveries.filter(delivery => {
    switch (activeTab) {
      case 'active':
        return ['assigned', 'in_transit', 'out_for_delivery'].includes(delivery.status);
      case 'pending':
        return delivery.status === 'pending';
      case 'completed':
        return ['delivered', 'failed', 'cancelled'].includes(delivery.status);
      default:
        return true;
    }
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              >
                <Menu className="h-6 w-6" />
              </button>
              <div className="flex items-center">
                <Truck className="h-8 w-8 text-blue-600" />
                <div className="ml-3">
                  <h1 className="text-lg font-semibold text-gray-900">Delivery Dashboard</h1>
                  <p className="text-sm text-gray-500">
                    Welcome back, {deliveryStaff?.name || 'Driver'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Online Status Toggle */}
              <div className="hidden md:flex items-center space-x-2">
                <div className={`h-3 w-3 rounded-full ${onlineStatus ? 'bg-green-400' : 'bg-gray-400'}`}></div>
                <span className="text-sm text-gray-600">
                  {onlineStatus ? 'Online' : 'Offline'}
                </span>
                <button
                  onClick={() => updateOnlineStatus(!onlineStatus)}
                  className={`px-3 py-1 text-sm rounded-full ${onlineStatus ? 'bg-red-50 text-red-700 hover:bg-red-100' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}
                >
                  {onlineStatus ? 'Go Offline' : 'Go Online'}
                </button>
              </div>

              {/* Refresh Button */}
              <button
                onClick={fetchData}
                disabled={refreshing}
                className="p-2 text-gray-400 hover:text-gray-500"
                title="Refresh"
              >
                <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>

              {/* Notifications */}
              <button className="p-2 text-gray-400 hover:text-gray-500 relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
              </button>

              {/* User Menu */}
              <div className="relative">
                <button className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100">
                  <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  <span className="hidden md:inline text-sm font-medium text-gray-700">
                    {deliveryStaff?.name}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Deliveries</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_deliveries}</p>
              </div>
              <Package className="w-8 h-8 text-blue-500" />
            </div>
            <div className="mt-2">
              <span className="text-sm text-green-600">
                +{stats.completed_deliveries} completed
              </span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending Deliveries</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pending_deliveries}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-500" />
            </div>
            <div className="mt-2">
              <span className="text-sm text-blue-600">
                {filteredDeliveries.length} active now
              </span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Earnings</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${stats.total_earnings.toFixed(2)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
            <div className="mt-2">
              <span className="text-sm text-gray-500">
                Avg. ${stats.total_deliveries > 0 ? (stats.total_earnings / stats.total_deliveries).toFixed(2) : '0.00'}/delivery
              </span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Your Rating</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.average_rating.toFixed(1)}/5.0
                </p>
              </div>
              <Star className="w-8 h-8 text-yellow-500" />
            </div>
            <div className="mt-2">
              <span className="text-sm text-gray-500">
                Based on {stats.completed_deliveries} deliveries
              </span>
            </div>
          </div>
        </div>

        {/* Vehicle Info */}
        {deliveryStaff?.vehicle_type && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Vehicle Information</h3>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <Truck className="w-5 h-5 text-gray-400 mr-2" />
                    <span className="text-gray-700">
                      {deliveryStaff.vehicle_type.charAt(0).toUpperCase() + deliveryStaff.vehicle_type.slice(1)}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Shield className="w-5 h-5 text-gray-400 mr-2" />
                    <span className="text-gray-700">{deliveryStaff.vehicle_number}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <Battery className="w-5 h-5 text-green-500 mr-2" />
                  <span className="text-sm text-gray-600">Good</span>
                </div>
                <div className="flex items-center">
                  <Wifi className="w-5 h-5 text-blue-500 mr-2" />
                  <span className="text-sm text-gray-600">Connected</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Deliveries Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Your Deliveries</h2>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => updateOnlineStatus(!onlineStatus)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${onlineStatus ? 'bg-red-50 text-red-700 hover:bg-red-100' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}
                  >
                    {onlineStatus ? 'Go Offline' : 'Go Online'}
                  </button>
                  <button
                    onClick={fetchData}
                    disabled={refreshing}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
                  >
                    <RefreshCw className={`w-4 h-4 inline mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="mt-4 flex space-x-4">
                <button
                  onClick={() => setActiveTab('active')}
                  className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'active' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Active ({deliveries.filter(d => ['assigned', 'in_transit', 'out_for_delivery'].includes(d.status)).length})
                </button>
                <button
                  onClick={() => setActiveTab('pending')}
                  className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'pending' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Pending ({deliveries.filter(d => d.status === 'pending').length})
                </button>
                <button
                  onClick={() => setActiveTab('completed')}
                  className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'completed' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Completed ({deliveries.filter(d => ['delivered', 'failed', 'cancelled'].includes(d.status)).length})
                </button>
              </div>
            </div>
          </div>

          {/* Deliveries List */}
          <div className="divide-y divide-gray-200">
            {filteredDeliveries.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No {activeTab} deliveries
                </h3>
                <p className="text-gray-600">
                  {activeTab === 'active' 
                    ? 'You have no active deliveries at the moment.' 
                    : activeTab === 'pending'
                    ? 'You have no pending deliveries.'
                    : 'You have no completed deliveries yet.'}
                </p>
              </div>
            ) : (
              filteredDeliveries.map((delivery) => (
                <div key={delivery.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-full ${getStatusColor(delivery.status)}`}>
                          {getStatusIcon(delivery.status)}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-medium text-gray-900">
                              Order #{delivery.order_number}
                            </h3>
                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(delivery.status)}`}>
                              {delivery.status.replace('_', ' ').toUpperCase()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            <MapPin className="w-4 h-4 inline mr-1" />
                            {delivery.delivery_address}
                          </p>
                          {delivery.customer_name && (
                            <p className="text-sm text-gray-500 mt-1">
                              <User className="w-4 h-4 inline mr-1" />
                              {delivery.customer_name}
                              {delivery.customer_phone && ` • ${delivery.customer_phone}`}
                            </p>
                          )}
                          <p className="text-sm text-gray-500 mt-1">
                            <Clock className="w-4 h-4 inline mr-1" />
                            Estimated: {formatDate(delivery.estimated_delivery_time)}
                          </p>
                          {delivery.delivery_fee > 0 && (
                            <p className="text-sm text-green-600 mt-1">
                              <DollarSign className="w-4 h-4 inline mr-1" />
                              Fee: ${delivery.delivery_fee.toFixed(2)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                      {delivery.status === 'assigned' && (
                        <>
                          <button
                            onClick={() => updateDeliveryStatus(delivery.id, 'in_transit')}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                          >
                            Start Delivery
                          </button>
                          <button
                            onClick={() => setShowUpdateStatusModal(delivery.id)}
                            className="px-3 py-1 border border-gray-300 text-sm rounded-lg hover:bg-gray-50"
                          >
                            Update
                          </button>
                        </>
                      )}
                      
                      {delivery.status === 'in_transit' && (
                        <>
                          <button
                            onClick={() => updateDeliveryStatus(delivery.id, 'out_for_delivery')}
                            className="px-3 py-1 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700"
                          >
                            Out for Delivery
                          </button>
                          <button
                            onClick={() => updateDeliveryLocation(delivery.id)}
                            className="px-3 py-1 border border-gray-300 text-sm rounded-lg hover:bg-gray-50"
                          >
                            Update Location
                          </button>
                        </>
                      )}
                      
                      {delivery.status === 'out_for_delivery' && (
                        <>
                          <button
                            onClick={() => setShowUpdateStatusModal(delivery.id)}
                            className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                          >
                            Mark Delivered
                          </button>
                          <button
                            onClick={() => updateDeliveryLocation(delivery.id)}
                            className="px-3 py-1 border border-gray-300 text-sm rounded-lg hover:bg-gray-50"
                          >
                            Update Location
                          </button>
                        </>
                      )}
                      
                      {['delivered', 'failed', 'cancelled'].includes(delivery.status) && (
                        <span className="text-sm text-gray-500">
                          {delivery.actual_delivery_time && `Delivered: ${formatDate(delivery.actual_delivery_time)}`}
                        </span>
                      )}
                      
                      <button
                        onClick={() => router.push(`/delivery/route/${delivery.id}`)}
                        className="p-2 text-gray-400 hover:text-gray-600"
                        title="View Route"
                      >
                        <Navigation className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  
                  {delivery.delivery_notes && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">
                        <AlertTriangle className="w-4 h-4 inline mr-1" />
                        Notes: {delivery.delivery_notes}
                      </p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Profile Info */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Personal Details</h4>
              <div className="space-y-2">
                <div className="flex items-center">
                  <User className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-gray-900">{deliveryStaff?.name}</span>
                </div>
                <div className="flex items-center">
                  <Mail className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-gray-900">{deliveryStaff?.email}</span>
                </div>
                <div className="flex items-center">
                  <Phone className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-gray-900">{deliveryStaff?.phone}</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Performance</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">On-time Delivery Rate</span>
                  <span className="font-medium text-green-600">
                    {stats.total_deliveries > 0 
                      ? Math.round((stats.on_time_deliveries / stats.total_deliveries) * 100)
                      : 0}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Success Rate</span>
                  <span className="font-medium text-green-600">
                    {stats.total_deliveries > 0 
                      ? Math.round((stats.completed_deliveries / stats.total_deliveries) * 100)
                      : 0}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Customer Rating</span>
                  <span className="font-medium text-yellow-600">
                    {stats.average_rating.toFixed(1)} ⭐
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Update Status Modal */}
      {showUpdateStatusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Update Delivery Status</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Status
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    onChange={(e) => {
                      if (e.target.value) {
                        updateDeliveryStatus(showUpdateStatusModal, e.target.value);
                      }
                    }}
                  >
                    <option value="">Select status</option>
                    <option value="in_transit">In Transit</option>
                    <option value="out_for_delivery">Out for Delivery</option>
                    <option value="delivered">Delivered</option>
                    <option value="failed">Failed</option>
                    <option value="returned">Returned</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={statusUpdateNotes}
                    onChange={(e) => setStatusUpdateNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Add any notes about the delivery..."
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowUpdateStatusModal(null);
                    setStatusUpdateNotes('');
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowUpdateStatusModal(null)}
                  className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
                >
                  Update Status
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* OTP Verification Modal */}
      {showOTPModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Verify Delivery</h3>
              <p className="text-sm text-gray-600 mb-4">
                Enter the 6-digit OTP provided by the customer to complete delivery verification.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    OTP Code
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-center text-2xl tracking-widest focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="000000"
                    maxLength={6}
                  />
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500">
                    Haven't received OTP?{' '}
                    <button className="text-blue-600 hover:text-blue-800">
                      Request new OTP
                    </button>
                  </p>
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowOTPModal(null);
                    setOtp('');
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => verifyDeliveryOTP(showOTPModal)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Verify & Complete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)}></div>
          <div className="absolute inset-y-0 left-0 w-64 bg-white shadow-xl">
            <div className="p-4">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center">
                  <Truck className="h-8 w-8 text-blue-600" />
                  <span className="ml-3 text-lg font-semibold text-gray-900">Delivery</span>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <nav className="space-y-2">
                <button className="w-full flex items-center p-3 rounded-lg bg-blue-50 text-blue-700">
                  <Package className="h-5 w-5 mr-3" />
                  Dashboard
                </button>
                <button className="w-full flex items-center p-3 rounded-lg text-gray-700 hover:bg-gray-100">
                  <Calendar className="h-5 w-5 mr-3" />
                  Schedule
                </button>
                <button className="w-full flex items-center p-3 rounded-lg text-gray-700 hover:bg-gray-100">
                  <BarChart3 className="h-5 w-5 mr-3" />
                  Analytics
                </button>
                <button className="w-full flex items-center p-3 rounded-lg text-gray-700 hover:bg-gray-100">
                  <Settings className="h-5 w-5 mr-3" />
                  Settings
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center p-3 rounded-lg text-red-600 hover:bg-red-50 mt-8"
                >
                  <LogOut className="h-5 w-5 mr-3" />
                  Logout
                </button>
              </nav>
              
              <div className="mt-8 pt-8 border-t border-gray-200">
                <div className="flex items-center">
                  <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{deliveryStaff?.name}</p>
                    <p className="text-xs text-gray-500">{deliveryStaff?.role || 'Delivery Staff'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}