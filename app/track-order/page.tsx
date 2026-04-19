'use client';

import React, { useState } from 'react';
import { Package, Search, AlertCircle, CheckCircle, Truck, Clock, MapPin } from 'lucide-react';
import Link from 'next/link';

interface TrackingResponse {
  success: boolean;
  message: string;
  data?: {
    order_summary?: {
      order_number: string;
      tracking_number: string;
      status: string;
      status_formatted: string;
      created_at: string;
      total: string;
    };
    tracking_info?: {
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
    items?: Array<{
      name: string;
      quantity: number;
      price: string;
    }>;
    delivery_details?: {
      delivery_address: string;
      estimated_delivery_time: string | null;
      driver: {
        name: string;
        phone: string;
      } | null;
    };
    order?: {
      order_number: string;
      tracking_number: string;
      status: string;
      created_at: string;
      total: string;
      status_label?: string;
    };
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

  // FIX: validate that at least one identifier is provided before submitting
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setTrackingData(null);

    if (!formData.tracking_number.trim() && !formData.order_number.trim()) {
      setError('Please enter a Tracking Number or an Order Number.');
      return;
    }

    if (!formData.email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);

    try {
      const payload: Record<string, string> = { email: formData.email.trim() };
      if (formData.tracking_number.trim()) payload.tracking_number = formData.tracking_number.trim();
      if (formData.order_number.trim()) payload.order_number = formData.order_number.trim();

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/track-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      if (data.success) {
        setTrackingData(data);
      } else {
        setError(data.message || 'Failed to track order');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to connect to tracking service';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending:          'bg-yellow-100 text-yellow-800',
      confirmed:        'bg-blue-100 text-blue-800',
      processing:       'bg-purple-100 text-purple-800',
      shipped:          'bg-indigo-100 text-indigo-800',
      out_for_delivery: 'bg-orange-100 text-orange-800',
      delivered:        'bg-green-100 text-green-800',
      cancelled:        'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    const icons: Record<string, React.ReactNode> = {
      pending:          <Clock className="w-5 h-5" />,
      confirmed:        <CheckCircle className="w-5 h-5" />,
      processing:       <Package className="w-5 h-5" />,
      shipped:          <Truck className="w-5 h-5" />,
      out_for_delivery: <Truck className="w-5 h-5" />,
      delivered:        <CheckCircle className="w-5 h-5" />,
    };
    return icons[status] || <Package className="w-5 h-5" />;
  };

  const getOrderData = () => {
    if (!trackingData?.data) return null;

    if (trackingData.data.order) {
      return {
        order_number:     trackingData.data.order.order_number,
        tracking_number:  trackingData.data.order.tracking_number,
        status:           trackingData.data.order.status,
        status_formatted: trackingData.data.order.status_label || trackingData.data.order.status,
        created_at:       trackingData.data.order.created_at,
        total:            trackingData.data.order.total,
        items:            trackingData.data.items || [],
        tracking_info:    trackingData.data.tracking_info,
        delivery_details: trackingData.data.delivery_details,
      };
    } else if (trackingData.data.order_summary) {
      return {
        ...trackingData.data.order_summary,
        items:            trackingData.data.items || [],
        tracking_info:    trackingData.data.tracking_info,
        delivery_details: trackingData.data.delivery_details,
      };
    }

    return null;
  };

  const orderData = getOrderData();

  return (
    <div className="min-h-screen bg-gray-50 py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
            Track Your Order
          </h1>
          <p className="text-base sm:text-lg text-gray-600 px-4">
            Enter your tracking number or order number to check the status of your order
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          {/* Search Form */}
          <div className="bg-white rounded-lg shadow-lg p-5 sm:p-6 mb-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label htmlFor="tracking_number" className="block text-sm font-medium text-gray-700 mb-2">
                    Tracking Number
                  </label>
                  <input
                    type="text"
                    id="tracking_number"
                    value={formData.tracking_number}
                    onChange={(e) => setFormData({ ...formData, tracking_number: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                    placeholder="ORD-20240101-XYZ789"
                  />
                </div>
              </div>

              {/* FIX: show helper text so users know at least one identifier is required */}
              <p className="text-xs text-gray-500 -mt-3">
                Enter at least one of the above identifiers.
              </p>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                  placeholder="you@example.com"
                />
                <p className="mt-1.5 text-xs text-gray-500">
                  Enter the email address used to place the order
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-sm sm:text-base"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
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
                  href="/auth/login"
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-center text-sm sm:text-base"
                >
                  Sign in for more details
                </Link>
              </div>
            </form>

            {error && (
              <div className="mt-5 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-400 mr-2 flex-shrink-0" />
                  <span className="text-red-700 text-sm">{error}</span>
                </div>
              </div>
            )}
          </div>

          {/* Tracking Results */}
          {trackingData && orderData && (
            <div className="space-y-6 sm:space-y-8">
              {/* Order Summary */}
              <div className="bg-white rounded-lg shadow-lg p-5 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 sm:mb-6 gap-3">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">
                      Order #{orderData.order_number}
                    </h2>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Package className="w-4 h-4 mr-1.5" />
                        <span>Tracking: {orderData.tracking_number}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1.5" />
                        <span>Placed {new Date(orderData.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="self-start sm:self-auto">
                    <span className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium ${getStatusColor(orderData.status)}`}>
                      {orderData.status_formatted}
                    </span>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-5 sm:pt-6">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Order Items</h3>
                  <div className="space-y-2.5 sm:space-y-3">
                    {orderData.items && orderData.items.length > 0 ? (
                      orderData.items.map((item, index) => (
                        <div key={index} className="flex justify-between items-center py-1.5">
                          <span className="text-gray-700 text-sm sm:text-base">{item.name} × {item.quantity}</span>
                          <span className="font-medium text-sm sm:text-base">{item.price}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-sm">No items found</p>
                    )}
                    <div className="flex justify-between items-center pt-3 sm:pt-4 border-t border-gray-200">
                      <span className="font-semibold text-gray-900">Total</span>
                      <span className="font-bold text-base sm:text-lg">{orderData.total}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tracking Timeline */}
              {orderData.tracking_info && (
                <div className="bg-white rounded-lg shadow-lg p-5 sm:p-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-5 sm:mb-6">Order Timeline</h2>

                  <div className="relative">
                    <div className="absolute left-7 sm:left-8 top-0 bottom-0 w-0.5 bg-gray-200">
                      {orderData.tracking_info.timeline && orderData.tracking_info.timeline.length > 0 && (
                        <div
                          className="absolute top-0 left-0 w-0.5 bg-green-500 transition-all duration-500"
                          style={{
                            height: `${
                              (orderData.tracking_info.timeline.filter((s) => s.completed).length /
                                orderData.tracking_info.timeline.length) *
                              100
                            }%`,
                          }}
                        />
                      )}
                    </div>

                    <div className="space-y-6 sm:space-y-8 relative">
                      {orderData.tracking_info.timeline && orderData.tracking_info.timeline.length > 0 ? (
                        orderData.tracking_info.timeline.map((step, index) => (
                          <div key={index} className="flex items-start">
                            <div className="relative z-10 flex-shrink-0">
                              <div
                                className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center ${
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

                            <div className="ml-4 sm:ml-6 flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                                <h3
                                  className={`text-base sm:text-lg font-semibold ${
                                    step.completed || step.current ? 'text-gray-900' : 'text-gray-500'
                                  }`}
                                >
                                  {step.title}
                                </h3>
                                {step.date && (
                                  <span className="text-xs sm:text-sm text-gray-500 flex-shrink-0">
                                    {new Date(step.date).toLocaleDateString()}
                                  </span>
                                )}
                              </div>

                              <p className="mt-1 text-gray-600 text-sm">{step.description}</p>

                              {step.current && (
                                <div className="mt-2 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  Current Status
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 text-sm">No tracking information available</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Delivery Information */}
              {orderData.delivery_details && (
                <div className="bg-white rounded-lg shadow-lg p-5 sm:p-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-5 sm:mb-6">Delivery Information</h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-xs sm:text-sm font-medium text-gray-500 mb-1.5 sm:mb-2">Delivery Address</h3>
                        <div className="flex items-start">
                          <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
                          <p className="text-gray-900 text-sm sm:text-base">{orderData.delivery_details.delivery_address}</p>
                        </div>
                      </div>

                      {orderData.delivery_details.estimated_delivery_time && (
                        <div>
                          <h3 className="text-xs sm:text-sm font-medium text-gray-500 mb-1.5 sm:mb-2">Estimated Delivery</h3>
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 mr-2 sm:mr-3 flex-shrink-0" />
                            <p className="text-gray-900 text-sm sm:text-base">
                              {new Date(orderData.delivery_details.estimated_delivery_time).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {orderData.delivery_details.driver && (
                      <div>
                        <h3 className="text-xs sm:text-sm font-medium text-gray-500 mb-1.5 sm:mb-2">Delivery Driver</h3>
                        <div className="flex items-center">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-100 flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
                            <span className="text-blue-600 font-medium text-base sm:text-lg">
                              {orderData.delivery_details.driver.name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm sm:text-base">{orderData.delivery_details.driver.name}</p>
                            <p className="text-xs sm:text-sm text-gray-500">{orderData.delivery_details.driver.phone}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Shipping Details */}
              {orderData.tracking_info && (
                <div className="bg-white rounded-lg shadow-lg p-5 sm:p-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-5 sm:mb-6">Shipping Details</h2>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
                    <div>
                      <h3 className="text-xs sm:text-sm font-medium text-gray-500 mb-1 sm:mb-2">Shipping Method</h3>
                      <p className="text-gray-900 text-sm sm:text-base">{orderData.tracking_info.shipping_method || 'Standard Shipping'}</p>
                    </div>

                    {orderData.tracking_info.carrier && (
                      <div>
                        <h3 className="text-xs sm:text-sm font-medium text-gray-500 mb-1 sm:mb-2">Carrier</h3>
                        <p className="text-gray-900 text-sm sm:text-base">{orderData.tracking_info.carrier}</p>
                      </div>
                    )}

                    <div>
                      <h3 className="text-xs sm:text-sm font-medium text-gray-500 mb-1 sm:mb-2">Last Updated</h3>
                      <p className="text-gray-900 text-sm sm:text-base">
                        {orderData.tracking_info.last_updated || new Date().toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Need Help */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-blue-900 mb-3 sm:mb-4">Need Help with Your Order?</h3>
                <p className="text-blue-700 mb-4 text-sm sm:text-base">
                  {orderData.tracking_info?.status_description ||
                    'If you have any questions about your order, our support team is here to help.'}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <Link
                    href="/support"
                    className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center text-sm sm:text-base"
                  >
                    Contact Support
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Success but no data */}
          {trackingData && trackingData.success && !orderData && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-5 sm:p-6">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-yellow-400 mr-2 flex-shrink-0" />
                <span className="text-yellow-700 text-sm">
                  Order found but detailed information is not available. Please try again later or contact support.
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
