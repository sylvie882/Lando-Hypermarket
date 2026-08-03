'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Package,
  Truck,
  Clock,
  CheckCircle,
  MapPin,
  Phone,
  Mail,
  Download,
  Printer,
  Share2,
  RefreshCw,
  Navigation,
  Battery,
  Gauge
} from 'lucide-react';
import Link from 'next/link';

interface OrderDetail {
  id: number;
  order_number: string;
  tracking_number: string;
  status: string;
  total: number;
  subtotal: number;
  tax: number;
  shipping_fee: number;
  discount: number;
  created_at: string;
  estimated_delivery: string | null;
  actual_delivery: string | null;
  address: {
    full_address: string;
    city: string;
    state: string;
    zip_code: string;
    phone: string;
  };
  items: Array<{
    product: {
      id: number;
      name: string;
      thumbnail: string;
      price: number;
    };
    quantity: number;
    price: number;
    total: number;
  }>;
  delivery: {
    status: string;
    delivery_address: string;
    estimated_delivery_time: string;
    driver_name: string;
    driver_phone: string;
    vehicle_type: string;
    vehicle_number: string;
    current_location: {
      latitude: number;
      longitude: number;
      updated_at: string;
    } | null;
  } | null;
  tracking_info: {
    timeline: Array<{
      status: string;
      title: string;
      description: string;
      icon: string;
      completed: boolean;
      current: boolean;
      date: string | null;
    }>;
    current_status: string;
    status_description: string;
    last_updated: string;
  };
}

interface LiveTrackingData {
  is_active: boolean;
  current_location: {
    latitude: number;
    longitude: number;
    address: string;
    updated_at: string;
    time_ago: string | null;
  };
  driver_info: {
    name: string;
    phone: string;
    photo: string | null;
    vehicle: {
      type: string;
      number: string;
    };
    rating: number;
  } | null;
  delivery_progress: number;
  eta: {
    time: string;
    minutes: number;
    distance: string;
  } | null;
  tracking_points: Array<{
    latitude: number;
    longitude: number;
    timestamp: string;
    speed: number;
  }>;
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [liveTracking, setLiveTracking] = useState<LiveTrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLiveTracking, setShowLiveTracking] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchOrderDetails();
  }, [params.id]);

  const fetchOrderDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/orders/${params.id}/tracking`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setOrder(data.data?.order || data.order);
        
        // Fetch live tracking if order is out for delivery
        if (data.data?.order?.status === 'out_for_delivery' || 
            data.data?.order?.delivery?.status === 'out_for_delivery') {
          fetchLiveTracking();
          setShowLiveTracking(true);
        }
      }
    } catch (error) {
      console.error('Failed to fetch order details:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLiveTracking = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/orders/${params.id}/live-tracking`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setLiveTracking(data.data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch live tracking:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchOrderDetails();
    if (showLiveTracking) {
      await fetchLiveTracking();
    }
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      processing: 'bg-purple-100 text-purple-800',
      shipped: 'bg-indigo-100 text-indigo-800',
      out_for_delivery: 'bg-orange-100 text-orange-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const handleCancelOrder = async () => {
    if (!confirm('Are you sure you want to cancel this order?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/orders/${params.id}/cancel`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        alert('Order cancelled successfully');
        fetchOrderDetails();
      }
    } catch (error) {
      console.error('Failed to cancel order:', error);
      alert('Failed to cancel order');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Order not found</h3>
          <Link
            href="/account/orders"
            className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Order #{order.order_number}</h1>
              <div className="flex items-center space-x-4 mt-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                  {order.status.replace('_', ' ')}
                </span>
                <span className="text-gray-500">Tracking: {order.tracking_number}</span>
              </div>
            </div>
            
            <div className="mt-4 md:mt-0 flex space-x-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </button>
              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center">
                <Printer className="w-4 h-4 mr-2" />
                Print
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Timeline */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Order Timeline</h2>
                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="w-4 h-4 mr-2" />
                  Last updated: {order.tracking_info.last_updated}
                </div>
              </div>
              
              <div className="space-y-6">
                {order.tracking_info.timeline.map((step, index) => (
                  <div key={index} className="flex items-start">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 ${
                      step.completed ? 'bg-green-100 text-green-600' :
                      step.current ? 'bg-blue-100 text-blue-600' :
                      'bg-gray-100 text-gray-400'
                    }`}>
                      {step.icon === '📝' && <Package className="w-5 h-5" />}
                      {step.icon === '✅' && <CheckCircle className="w-5 h-5" />}
                      {step.icon === '⚙️' && <Package className="w-5 h-5" />}
                      {step.icon === '🚚' && <Truck className="w-5 h-5" />}
                      {step.icon === '🎉' && <CheckCircle className="w-5 h-5" />}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className={`font-medium ${
                          step.completed || step.current ? 'text-gray-900' : 'text-gray-500'
                        }`}>
                          {step.title}
                        </h3>
                        {step.date && (
                          <span className="text-sm text-gray-500">
                            {new Date(step.date).toLocaleString()}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 mt-1">{step.description}</p>
                      
                      {step.current && (
                        <div className="mt-2 inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          Current Status
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Tracking */}
            {showLiveTracking && liveTracking && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Live Tracking</h2>
                  <div className="flex items-center text-sm text-green-600">
                    <Navigation className="w-4 h-4 mr-2" />
                    Active
                  </div>
                </div>
                
                <div className="space-y-6">
                  {/* Driver Info */}
                  {liveTracking.driver_info && (
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                          {liveTracking.driver_info.photo ? (
                            <img
                              src={liveTracking.driver_info.photo}
                              alt={liveTracking.driver_info.name}
                              className="w-16 h-16 rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-blue-600 font-medium text-xl">
                              {liveTracking.driver_info.name.charAt(0)}
                            </span>
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{liveTracking.driver_info.name}</h3>
                          <p className="text-gray-600">Delivery Driver</p>
                          <div className="flex items-center space-x-4 mt-2">
                            <div className="flex items-center text-sm">
                              <Truck className="w-4 h-4 mr-1 text-gray-400" />
                              <span>{liveTracking.driver_info.vehicle.type} • {liveTracking.driver_info.vehicle.number}</span>
                            </div>
                            <div className="flex items-center text-sm">
                              <Gauge className="w-4 h-4 mr-1 text-gray-400" />
                              <span>{liveTracking.driver_info.rating}/5</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Current Location */}
                  {liveTracking.current_location && (
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900 mb-3">Current Location</h3>
                      <div className="flex items-start">
                        <MapPin className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-gray-900">{liveTracking.current_location.address}</p>
                          <p className="text-sm text-gray-500 mt-1">
                            Updated {liveTracking.current_location.time_ago}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ETA */}
                  {liveTracking.eta && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h3 className="font-medium text-green-900 mb-2">Estimated Arrival</h3>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-2xl font-bold text-green-900">{liveTracking.eta.time}</p>
                          <p className="text-sm text-green-700">{liveTracking.eta.minutes} minutes • {liveTracking.eta.distance}</p>
                        </div>
                        <div className="w-24 h-24 relative">
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center">
                              <div className="text-3xl font-bold text-green-600">{liveTracking.delivery_progress}%</div>
                              <div className="text-xs text-green-700 mt-1">Complete</div>
                            </div>
                          </div>
                          <svg className="w-full h-full" viewBox="0 0 100 100">
                            <circle
                              cx="50"
                              cy="50"
                              r="45"
                              fill="none"
                              stroke="#d1fae5"
                              strokeWidth="8"
                            />
                            <circle
                              cx="50"
                              cy="50"
                              r="45"
                              fill="none"
                              stroke="#10b981"
                              strokeWidth="8"
                              strokeLinecap="round"
                              strokeDasharray={`${liveTracking.delivery_progress * 2.83} 283`}
                              transform="rotate(-90 50 50)"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Order Items */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Order Items</h2>
              
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div key={index} className="flex items-center border-b border-gray-100 pb-4">
                    {item.product.thumbnail ? (
                      <img
                        src={item.product.thumbnail}
                        alt={item.product.name}
                        className="w-16 h-16 rounded object-cover mr-4"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded bg-gray-100 flex items-center justify-center mr-4">
                        <Package className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                    
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{item.product.name}</h3>
                      <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-medium text-gray-900">${item.total.toFixed(2)}</p>
                      <p className="text-sm text-gray-500">${item.price.toFixed(2)} each</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="space-y-6">
            {/* Order Summary */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">${order.subtotal.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium">${order.shipping_fee.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-medium">${order.tax.toFixed(2)}</span>
                </div>
                
                {order.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-${order.discount.toFixed(2)}</span>
                  </div>
                )}
                
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-900">Total</span>
                    <span className="text-2xl font-bold text-gray-900">${order.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Shipping Address</h2>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <MapPin className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <p className="text-gray-900">{order.address.full_address}</p>
                    <p className="text-gray-600">
                      {order.address.city}, {order.address.state} {order.address.zip_code}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Phone className="w-5 h-5 text-gray-400 mr-3" />
                  <span className="text-gray-900">{order.address.phone}</span>
                </div>
              </div>
            </div>

            {/* Delivery Information */}
            {order.delivery && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Delivery Information</h2>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Estimated Delivery</h3>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-gray-900">
                        {new Date(order.delivery.estimated_delivery_time).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  
                  {order.delivery.driver_name && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Driver</h3>
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                          <span className="text-blue-600 font-medium text-sm">
                            {order.delivery.driver_name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="text-gray-900">{order.delivery.driver_name}</p>
                          <p className="text-sm text-gray-500">{order.delivery.driver_phone}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {order.delivery.vehicle_type && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Vehicle</h3>
                      <div className="flex items-center">
                        <Truck className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-gray-900">
                          {order.delivery.vehicle_type} • {order.delivery.vehicle_number}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Actions</h2>
              
              <div className="space-y-3">
                <button className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center">
                  <Download className="w-5 h-5 mr-2" />
                  Download Invoice
                </button>
                
                <Link
                  href={`/track-order?order_number=${order.order_number}`}
                  className="w-full px-4 py-3 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 flex items-center justify-center"
                >
                  <Truck className="w-5 h-5 mr-2" />
                  Track Order
                </Link>
                
                {order.status === 'pending' && (
                  <button
                    onClick={handleCancelOrder}
                    className="w-full px-4 py-3 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 flex items-center justify-center"
                  >
                    Cancel Order
                  </button>
                )}
                
                <Link
                  href="/contact"
                  className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center justify-center"
                >
                  <Mail className="w-5 h-5 mr-2" />
                  Contact Support
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}