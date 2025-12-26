'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // ADD THIS
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
  Gauge // Changed from Speedometer to Gauge
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

export default function AdminDeliveriesPage() {
  const router = useRouter(); // ADD THIS
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showLiveTracking, setShowLiveTracking] = useState<number | null>(null);

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const fetchDeliveries = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/deliveries`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDeliveries(data.data || data);
      }
    } catch (error) {
      console.error('Failed to fetch deliveries:', error);
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
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const toggleLiveTracking = (deliveryId: number) => {
    if (showLiveTracking === deliveryId) {
      setShowLiveTracking(null);
    } else {
      setShowLiveTracking(deliveryId);
    }
  };

  const handleAssignDriver = (deliveryId: number) => {
    // Implement driver assignment
    console.log('Assign driver to delivery:', deliveryId);
  };

  const handleUpdateStatus = async (deliveryId: number, newStatus: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/deliveries/${deliveryId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchDeliveries();
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleViewOrder = (orderId: number) => {
    router.push(`/admin/orders/${orderId}`);
  };

  const filteredDeliveries = deliveries.filter(delivery => {
    const matchesSearch = 
      delivery.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      delivery.delivery_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (delivery.driver_name && delivery.driver_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || delivery.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Deliveries Management</h1>
                <p className="text-gray-600 mt-2">Track and manage all deliveries</p>
              </div>
              
              <div className="mt-4 md:mt-0 flex space-x-3">
                <button 
                  onClick={fetchDeliveries}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Assign Delivery
                </button>
                <button 
                  onClick={fetchDeliveries}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </button>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search deliveries..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
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
              
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  {filteredDeliveries.length} deliveries
                </div>
                <div className="flex items-center space-x-2">
                  <button className="p-2 text-gray-400 hover:text-gray-600">
                    <Filter className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Deliveries Grid */}
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
                          onClick={() => handleViewOrder(delivery.order_id)}
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
                            onClick={() => toggleLiveTracking(delivery.id)}
                            className="text-xs text-blue-600 hover:text-blue-900"
                          >
                            {showLiveTracking === delivery.id ? 'Hide' : 'Show'}
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {delivery.delivery_attempt > 1 && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 text-yellow-600 mr-2" />
                          <span className="text-sm text-yellow-800">
                            Delivery attempt: {delivery.delivery_attempt}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="flex space-x-3">
                      <button
                        onClick={() => handleAssignDriver(delivery.id)}
                        className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                      >
                        Assign Driver
                      </button>
                      
                      <select
                        value={delivery.status}
                        onChange={(e) => handleUpdateStatus(delivery.id, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 text-sm rounded-lg bg-white"
                      >
                        <option value="pending">Pending</option>
                        <option value="assigned">Assigned</option>
                        <option value="in_transit">In Transit</option>
                        <option value="out_for_delivery">Out for Delivery</option>
                        <option value="delivered">Delivered</option>
                        <option value="failed">Failed</option>
                      </select>
                      
                      <button 
                        onClick={() => handleViewOrder(delivery.order_id)}
                        className="px-3 py-2 border border-gray-300 text-sm rounded-lg hover:bg-gray-50"
                      >
                        View
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading deliveries...</p>
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredDeliveries.length === 0 && (
            <div className="text-center py-12">
              <Truck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No deliveries found</h3>
              <p className="text-gray-600">Try changing your search or filter criteria</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}