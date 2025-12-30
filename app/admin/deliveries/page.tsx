'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Truck,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  User,
  Filter,
  Search,
  Plus,
  RefreshCw,
  Navigation,
  Battery,
  Users,
  Shield,
  Award,
  TrendingUp,
  Package,
  AlertCircle,
  CheckSquare,
  UserPlus,
  Download,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Phone,
  Mail,
  Map,
  Calendar,
  BarChart3,
  DollarSign
} from 'lucide-react';

interface Delivery {
  id: number;
  order_id: number;
  order_number: string;
  status: string;
  delivery_address: string;
  estimated_delivery_time: string;
  actual_delivery_time: string | null;
  driver_name: string | null;
  driver_phone: string | null;
  vehicle_type: string | null;
  vehicle_number: string | null;
  current_location: {
    latitude: number;
    longitude: number;
    updated_at: string;
  } | null;
  delivery_attempt: number;
  delivery_notes: string | null;
}

interface DeliveryStaff {
  id: number;
  name: string;
  email: string;
  phone: string;
  avatar: string | null;
  vehicle_type: string;
  vehicle_number: string;
  status: 'active' | 'inactive' | 'suspended' | 'on_leave';
  is_online: boolean;
  rating: number;
  total_deliveries: number;
  completed_deliveries: number;
  total_earnings: number;
  current_location: string | null;
  last_login_at: string | null;
}

export default function AdminDeliveriesPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'deliveries' | 'staff' | 'assignments'>('deliveries');
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [deliveryStaff, setDeliveryStaff] = useState<DeliveryStaff[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showLiveTracking, setShowLiveTracking] = useState<number | null>(null);
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [stats, setStats] = useState({
    total_deliveries: 0,
    active_deliveries: 0,
    completed_today: 0,
    total_staff: 0,
    online_staff: 0,
    pending_assignments: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Fetch deliveries
      const deliveriesResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/deliveries`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (deliveriesResponse.ok) {
        const deliveriesData = await deliveriesResponse.json();
        setDeliveries(deliveriesData.data || deliveriesData);
      }

      // Fetch delivery staff
      const staffResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/delivery-staff`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (staffResponse.ok) {
        const staffData = await staffResponse.json();
        setDeliveryStaff(staffData.data || staffData);
      }

      // Fetch stats
      const statsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/deliveries/stats`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.data || statsData);
      }

    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      assigned: 'bg-blue-100 text-blue-800',
      in_transit: 'bg-purple-100 text-purple-800',
      out_for_delivery: 'bg-orange-100 text-orange-800',
      delivered: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      returned: 'bg-gray-100 text-gray-800',
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      suspended: 'bg-red-100 text-red-800',
      on_leave: 'bg-yellow-100 text-yellow-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const handleAssignDriver = (delivery: Delivery) => {
    setSelectedDelivery(delivery);
    setShowAssignModal(true);
  };

  const handleAssignDelivery = async (staffId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/deliveries/assign`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          delivery_id: selectedDelivery?.id,
          delivery_staff_id: staffId
        }),
      });

      if (response.ok) {
        fetchData();
        setShowAssignModal(false);
        setSelectedDelivery(null);
      }
    } catch (error) {
      console.error('Failed to assign delivery:', error);
    }
  };

  const handleAddStaff = async (staffData: any) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/delivery-staff`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(staffData),
      });

      if (response.ok) {
        fetchData();
        setShowAddStaffModal(false);
      }
    } catch (error) {
      console.error('Failed to add staff:', error);
    }
  };

  const handleToggleOnlineStatus = async (staffId: number, isOnline: boolean) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/delivery-staff/${staffId}/toggle-online`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_online: isOnline }),
      });

      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Failed to update online status:', error);
    }
  };

  const handleViewStaffDetails = (staffId: number) => {
    router.push(`/admin/delivery-staff/${staffId}`);
  };

  const filteredDeliveries = deliveries.filter(delivery => {
    const matchesSearch = 
      delivery.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      delivery.delivery_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (delivery.driver_name && delivery.driver_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || delivery.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const filteredStaff = deliveryStaff.filter(staff => {
    return staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           staff.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
           staff.vehicle_number?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Delivery Management</h1>
                <p className="text-gray-600 mt-2">Manage deliveries, staff, and assignments</p>
              </div>
              
              <div className="mt-4 md:mt-0 flex space-x-3">
                <button 
                  onClick={() => setShowAddStaffModal(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Staff
                </button>
                <button 
                  onClick={fetchData}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </button>
              </div>
            </div>
          </div>

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
                  +{stats.completed_today} today
                </span>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Delivery Staff</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total_staff}</p>
                </div>
                <Users className="w-8 h-8 text-green-500" />
              </div>
              <div className="mt-2">
                <span className="text-sm text-green-600">
                  {stats.online_staff} online
                </span>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Active Deliveries</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.active_deliveries}</p>
                </div>
                <Truck className="w-8 h-8 text-orange-500" />
              </div>
              <div className="mt-2">
                <span className="text-sm text-gray-500">
                  Pending assignments: {stats.pending_assignments}
                </span>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Success Rate</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.total_deliveries > 0 
                      ? Math.round((stats.total_deliveries - stats.active_deliveries) / stats.total_deliveries * 100)
                      : 0}%
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-500" />
              </div>
              <div className="mt-2">
                <span className="text-sm text-gray-500">
                  Overall performance
                </span>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                <button
                  onClick={() => setActiveTab('deliveries')}
                  className={`py-4 px-6 text-sm font-medium border-b-2 ${
                    activeTab === 'deliveries'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center">
                    <Truck className="w-4 h-4 mr-2" />
                    Deliveries ({deliveries.length})
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('staff')}
                  className={`py-4 px-6 text-sm font-medium border-b-2 ${
                    activeTab === 'staff'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-2" />
                    Delivery Staff ({deliveryStaff.length})
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('assignments')}
                  className={`py-4 px-6 text-sm font-medium border-b-2 ${
                    activeTab === 'assignments'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center">
                    <CheckSquare className="w-4 h-4 mr-2" />
                    Assignments
                  </div>
                </button>
              </nav>
            </div>

            {/* Filters */}
            <div className="p-6 border-b border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder={
                        activeTab === 'deliveries' 
                          ? "Search deliveries..." 
                          : "Search staff..."
                      }
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                {activeTab === 'deliveries' && (
                  <div>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="assigned">Assigned</option>
                      <option value="in_transit">In Transit</option>
                      <option value="out_for_delivery">Out for Delivery</option>
                      <option value="delivered">Delivered</option>
                      <option value="failed">Failed</option>
                    </select>
                  </div>
                )}
                
                {activeTab === 'staff' && (
                  <div>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="online">Online</option>
                      <option value="offline">Offline</option>
                    </select>
                  </div>
                )}
                
                <div className="flex items-center justify-end space-x-2">
                  <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center">
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                  </button>
                  {activeTab === 'staff' && (
                    <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center">
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Deliveries Tab Content */}
          {activeTab === 'deliveries' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDeliveries.map((delivery) => (
                <div key={delivery.id} className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="p-6">
                    {/* Delivery Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <Truck className="w-5 h-5 text-gray-400 mr-2" />
                        <div>
                          <button
                            onClick={() => router.push(`/admin/orders/${delivery.order_id}`)}
                            className="font-semibold text-blue-600 hover:text-blue-900 text-left"
                          >
                            Order #{delivery.order_number}
                          </button>
                          <p className="text-xs text-gray-500">Delivery #{delivery.id}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(delivery.status)}`}>
                        {delivery.status.replace('_', ' ')}
                      </span>
                    </div>

                    {/* Delivery Information */}
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-2">Delivery Address</h3>
                        <div className="flex items-start">
                          <MapPin className="w-4 h-4 text-gray-400 mr-2 mt-0.5" />
                          <p className="text-sm text-gray-900">{delivery.delivery_address}</p>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-2">Estimated Delivery</h3>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">
                            {new Date(delivery.estimated_delivery_time).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      
                      {delivery.driver_name && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 mb-2">Driver</h3>
                          <div className="flex items-center">
                            <User className="w-4 h-4 text-gray-400 mr-2" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">{delivery.driver_name}</p>
                              <p className="text-xs text-gray-500">{delivery.driver_phone}</p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {delivery.vehicle_type && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 mb-2">Vehicle</h3>
                          <div className="flex items-center">
                            <Truck className="w-4 h-4 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-900">
                              {delivery.vehicle_type} • {delivery.vehicle_number}
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {delivery.current_location && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 mb-2">Current Location</h3>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <Navigation className="w-4 h-4 text-green-500 mr-2" />
                              <span className="text-sm text-gray-900">Live tracking available</span>
                            </div>
                            <button
                              onClick={() => setShowLiveTracking(showLiveTracking === delivery.id ? null : delivery.id)}
                              className="text-xs text-blue-600 hover:text-blue-900"
                            >
                              {showLiveTracking === delivery.id ? 'Hide' : 'Show'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleAssignDriver(delivery)}
                          className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                        >
                          {delivery.driver_name ? 'Reassign' : 'Assign Driver'}
                        </button>
                        <button 
                          onClick={() => router.push(`/admin/orders/${delivery.order_id}`)}
                          className="px-3 py-2 border border-gray-300 text-sm rounded-lg hover:bg-gray-50"
                        >
                          View Order
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Staff Tab Content */}
          {activeTab === 'staff' && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Driver
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vehicle
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stats
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredStaff.map((staff) => (
                    <tr key={staff.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            {staff.avatar ? (
                              <img className="h-10 w-10 rounded-full" src={staff.avatar} alt="" />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <User className="h-6 w-6 text-blue-600" />
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{staff.name}</div>
                            <div className="text-sm text-gray-500">
                              Rating: {staff.rating.toFixed(1)} ⭐
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{staff.phone}</div>
                        <div className="text-sm text-gray-500">{staff.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {staff.vehicle_type.charAt(0).toUpperCase() + staff.vehicle_type.slice(1)}
                        </div>
                        <div className="text-sm text-gray-500">{staff.vehicle_number}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(staff.status)}`}>
                            {staff.status.replace('_', ' ')}
                          </span>
                          <div className={`h-2 w-2 rounded-full ${staff.is_online ? 'bg-green-400' : 'bg-gray-400'}`} />
                          <span className="text-xs text-gray-500">
                            {staff.is_online ? 'Online' : 'Offline'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <div className="flex items-center">
                            <Package className="w-4 h-4 text-gray-400 mr-1" />
                            <span>{staff.completed_deliveries} deliveries</span>
                          </div>
                          <div className="flex items-center mt-1">
                            <DollarSign className="w-4 h-4 text-gray-400 mr-1" />
                            <span>${staff.total_earnings.toFixed(2)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleViewStaffDetails(staff.id)}
                            className="text-blue-600 hover:text-blue-900"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleOnlineStatus(staff.id, !staff.is_online)}
                            className={`${staff.is_online ? 'text-orange-600 hover:text-orange-900' : 'text-green-600 hover:text-green-900'}`}
                            title={staff.is_online ? 'Set Offline' : 'Set Online'}
                          >
                            {staff.is_online ? 'Offline' : 'Online'}
                          </button>
                          <button className="text-gray-400 hover:text-gray-600">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Assignments Tab Content */}
          {activeTab === 'assignments' && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-center py-12">
                <CheckSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Assignments Management</h3>
                <p className="text-gray-600 mb-6">Manage delivery assignments and assignments history</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button 
                    onClick={() => setShowAssignModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Assignment
                  </button>
                  <button 
                    onClick={() => router.push('/admin/assignments/history')}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center"
                  >
                    {/* <History className="w-4 h-4 mr-2" /> */}
                    View History
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading data...</p>
            </div>
          )}

          {/* Empty States */}
          {!loading && activeTab === 'deliveries' && filteredDeliveries.length === 0 && (
            <div className="text-center py-12">
              <Truck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No deliveries found</h3>
              <p className="text-gray-600">Try changing your search or filter criteria</p>
            </div>
          )}

          {!loading && activeTab === 'staff' && filteredStaff.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No delivery staff found</h3>
              <p className="text-gray-600 mb-4">Add your first delivery staff member</p>
              <button 
                onClick={() => setShowAddStaffModal(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center mx-auto"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Add Staff
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add Staff Modal */}
      {showAddStaffModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900">Add Delivery Staff</h3>
                <button
                  onClick={() => setShowAddStaffModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                const data = Object.fromEntries(formData);
                handleAddStaff(data);
              }} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password *
                    </label>
                    <input
                      type="password"
                      name="password"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Vehicle Type *
                    </label>
                    <select
                      name="vehicle_type"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="bike">Bike</option>
                      <option value="scooter">Scooter</option>
                      <option value="motorcycle">Motorcycle</option>
                      <option value="car">Car</option>
                      <option value="van">Van</option>
                      <option value="truck">Truck</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Vehicle Number *
                    </label>
                    <input
                      type="text"
                      name="vehicle_number"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address *
                    </label>
                    <textarea
                      name="address"
                      required
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowAddStaffModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                  >
                    Add Staff
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Assign Delivery Modal */}
      {showAssignModal && selectedDelivery && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900">
                  Assign Delivery #{selectedDelivery.id}
                </h3>
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedDelivery(null);
                  }}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-start">
                  <Package className="w-5 h-5 text-blue-500 mr-3 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">Order #{selectedDelivery.order_number}</h4>
                    <p className="text-sm text-blue-700 mt-1">{selectedDelivery.delivery_address}</p>
                    <p className="text-xs text-blue-600 mt-1">
                      Estimated: {new Date(selectedDelivery.estimated_delivery_time).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Available Delivery Staff</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {deliveryStaff
                    .filter(staff => staff.status === 'active' && staff.is_online)
                    .map((staff) => (
                      <div key={staff.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0">
                              {staff.avatar ? (
                                <img className="h-10 w-10 rounded-full" src={staff.avatar} alt="" />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                  <User className="h-6 w-6 text-blue-600" />
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{staff.name}</div>
                              <div className="text-sm text-gray-500">
                                {staff.vehicle_type} • {staff.rating.toFixed(1)} ⭐
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-green-600">
                              {staff.completed_deliveries} deliveries
                            </div>
                            <button
                              onClick={() => handleAssignDelivery(staff.id)}
                              className="mt-2 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                            >
                              Assign
                            </button>
                          </div>
                        </div>
                        <div className="mt-3 text-xs text-gray-500">
                          <div className="flex items-center">
                            <MapPin className="w-3 h-3 mr-1" />
                            <span>{staff.current_location || 'Location not available'}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedDelivery(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // Implement auto-assign
                    const onlineStaff = deliveryStaff.filter(s => s.status === 'active' && s.is_online);
                    if (onlineStaff.length > 0) {
                      const bestStaff = onlineStaff.reduce((prev, current) => 
                        (prev.rating > current.rating) ? prev : current
                      );
                      handleAssignDelivery(bestStaff.id);
                    }
                  }}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700"
                >
                  Auto-Assign Best Driver
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}