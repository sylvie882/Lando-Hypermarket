'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Package, Search, AlertCircle, CheckCircle, Truck, Clock, MapPin } from 'lucide-react';
import Link from 'next/link';

interface TrackingResponse {
  success: boolean;
  message: string;
  data: {
    order_summary: {
      order_number: string;
      tracking_number: string;
      status: string;
      status_formatted: string;
      created_at: string;
      total: string;
    };
    tracking_info: {
      current_status: string;
      status_description: string;
      timeline: Array<{
        status: string;
        title: string;
        description: string;
        icon: string;
        completed: boolean;
        current: boolean;
        date: string | null;
      }>;
      last_updated: string;
      estimated_delivery: string | null;
      carrier: string | null;
      shipping_method: string;
    };
    items: Array<{
      name: string;
      quantity: number;
      price: string;
    }>;
    delivery_details: {
      delivery_address: string;
      estimated_delivery_time: string | null;
      driver: {
        name: string;
        phone: string;
      } | null;
    } | null;
  };
}

export default function TrackOrderPage() {
  const [trackingData, setTrackingData] = useState<TrackingResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    tracking_number: '',
    order_number: '',
    email: '',
  });
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setTrackingData(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/track-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setTrackingData(data);
      } else {
        setError(data.message || 'Failed to track order');
      }
    } catch (err) {
      setError('Failed to connect to tracking service');
      console.error('Tracking error:', err);
    } finally {
      setLoading(false);
    }
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

  const getStatusIcon = (status: string) => {
    const icons: Record<string, React.ReactNode> = {
      pending: <Clock className="w-5 h-5" />,
      confirmed: <CheckCircle className="w-5 h-5" />,
      processing: <Package className="w-5 h-5" />,
      shipped: <Truck className="w-5 h-5" />,
      out_for_delivery: <Truck className="w-5 h-5" />,
      delivered: <CheckCircle className="w-5 h-5" />,
    };
    return icons[status] || <Package className="w-5 h-5" />;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Track Your Order
          </h1>
          <p className="text-lg text-gray-600">
            Enter your tracking number or order number to check the status of your order
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          {/* Search Form */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="tracking_number" className="block text-sm font-medium text-gray-700 mb-2">
                    Tracking Number
                  </label>
                  <input
                    type="text"
                    id="tracking_number"
                    value={formData.tracking_number}
                    onChange={(e) => setFormData({ ...formData, tracking_number: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="TRK-20240101-ABC123"
                  />
                </div>
                <div>
                  <label htmlFor="order_number" className="block text-sm font-medium text-gray-700 mb-2">
                    Order Number
                  </label>
                  <input
                    type="text"
                    id="order_number"
                    value={formData.order_number}
                    onChange={(e) => setFormData({ ...formData, order_number: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="ORD-20240101-XYZ789"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="you@example.com"
                />
                <p className="mt-2 text-sm text-gray-500">
                  Enter the email address used to place the order
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Tracking...
                    </>
                  ) : (
                    <>
                      <Search className="w-5 h-5 mr-2" />
                      Track Order
                    </>
                  )}
                </button>
                <Link
                  href="/login"
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-center"
                >
                  Sign in for more details
                </Link>
              </div>
            </form>

            {error && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
                  <span className="text-red-700">{error}</span>
                </div>
              </div>
            )}
          </div>

          {/* Tracking Results */}
          {trackingData && (
            <div className="space-y-8">
              {/* Order Summary */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      Order #{trackingData.data.order_summary.order_number}
                    </h2>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Package className="w-4 h-4 mr-2" />
                        <span>Tracking: {trackingData.data.order_summary.tracking_number}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-2" />
                        <span>Placed {new Date(trackingData.data.order_summary.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 md:mt-0">
                    <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(trackingData.data.order_summary.status)}`}>
                      {trackingData.data.order_summary.status_formatted}
                    </span>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h3>
                  <div className="space-y-3">
                    {trackingData.data.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center py-2">
                        <span className="text-gray-700">{item.name} × {item.quantity}</span>
                        <span className="font-medium">{item.price}</span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                      <span className="font-semibold text-gray-900">Total</span>
                      <span className="font-bold text-lg">{trackingData.data.order_summary.total}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tracking Timeline */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Order Timeline</h2>
                
                <div className="relative">
                  {/* Progress bar */}
                  <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200">
                    <div
                      className="absolute top-0 left-0 w-0.5 bg-green-500 transition-all duration-500"
                      style={{
                        height: `${(trackingData.data.tracking_info.timeline.filter(s => s.completed).length / trackingData.data.tracking_info.timeline.length) * 100}%`,
                      }}
                    />
                  </div>

                  {/* Steps */}
                  <div className="space-y-8 relative">
                    {trackingData.data.tracking_info.timeline.map((step, index) => (
                      <div key={index} className="flex items-start">
                        <div className="relative z-10">
                          <div
                            className={`w-16 h-16 rounded-full flex items-center justify-center ${
                              step.completed
                                ? 'bg-green-100 border-2 border-green-500'
                                : step.current
                                ? 'bg-blue-100 border-2 border-blue-500'
                                : 'bg-gray-100 border-2 border-gray-300'
                            }`}
                          >
                            {getStatusIcon(step.status)}
                          </div>
                        </div>
                        
                        <div className="ml-6 flex-1">
                          <div className="flex items-center justify-between">
                            <h3
                              className={`text-lg font-semibold ${
                                step.completed || step.current
                                  ? 'text-gray-900'
                                  : 'text-gray-500'
                              }`}
                            >
                              {step.title}
                            </h3>
                            {step.date && (
                              <span className="text-sm text-gray-500">
                                {new Date(step.date).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          
                          <p className="mt-1 text-gray-600">{step.description}</p>
                          
                          {step.current && (
                            <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                              Current Status
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Delivery Information */}
              {trackingData.data.delivery_details && (
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Delivery Information</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-2">Delivery Address</h3>
                        <div className="flex items-start">
                          <MapPin className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                          <p className="text-gray-900">{trackingData.data.delivery_details.delivery_address}</p>
                        </div>
                      </div>
                      
                      {trackingData.data.delivery_details.estimated_delivery_time && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 mb-2">Estimated Delivery</h3>
                          <div className="flex items-center">
                            <Clock className="w-5 h-5 text-gray-400 mr-3" />
                            <p className="text-gray-900">
                              {new Date(trackingData.data.delivery_details.estimated_delivery_time).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {trackingData.data.delivery_details.driver && (
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 mb-2">Delivery Driver</h3>
                          <div className="flex items-center">
                            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                              <span className="text-blue-600 font-medium text-lg">
                                {trackingData.data.delivery_details.driver.name.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{trackingData.data.delivery_details.driver.name}</p>
                              <p className="text-sm text-gray-500">{trackingData.data.delivery_details.driver.phone}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Shipping Information */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Shipping Details</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Shipping Method</h3>
                    <p className="text-gray-900">{trackingData.data.tracking_info.shipping_method}</p>
                  </div>
                  
                  {trackingData.data.tracking_info.carrier && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Carrier</h3>
                      <p className="text-gray-900">{trackingData.data.tracking_info.carrier}</p>
                    </div>
                  )}
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Last Updated</h3>
                    <p className="text-gray-900">{trackingData.data.tracking_info.last_updated}</p>
                  </div>
                </div>
              </div>

              {/* Need Help Section */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-4">Need Help with Your Order?</h3>
                <p className="text-blue-700 mb-4">
                  {trackingData.data.tracking_info.status_description}
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    href="/contact"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center"
                  >
                    Contact Support
                  </Link>
                  <Link
                    href="/help/faq"
                    className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 text-center"
                  >
                    View FAQ
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}