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
  User,
  CreditCard,
  MessageSquare,
  Bell,
  Edit,
  XCircle,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';

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
  created_at: string;
  estimated_delivery: string | null;
  actual_delivery: string | null;
  notes: string;
  
  user: {
    id: number;
    name: string;
    email: string;
    phone: string;
  };
  
  address: {
    full_address: string;
    city: string;
    state: string;
    zip_code: string;
    country: string;
  };
  
  items: Array<{
    product: {
      id: number;
      name: string;
      thumbnail: string;
      sku: string;
      price: number;
    };
    quantity: number;
    price: number;
    total: number;
  }>;
  
  delivery: {
    id: number;
    status: string;
    delivery_address: string;
    estimated_delivery_time: string;
    actual_delivery_time: string | null;
    delivery_staff_id: number | null;
    driver_name: string | null;
    driver_phone: string | null;
    vehicle_type: string | null;
    vehicle_number: string | null;
    delivery_notes: string | null;
    current_location: {
      latitude: number;
      longitude: number;
      updated_at: string;
    } | null;
  } | null;
  
  tracking_history: Array<{
    id: number;
    status: string;
    title: string;
    description: string;
    location: string;
    icon: string;
    actual_date: string;
    user: {
      name: string;
      role: string;
    } | null;
  }>;
}

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [formData, setFormData] = useState({
    status: '',
    payment_status: '',
    notes: '',
  });

  useEffect(() => {
    fetchOrderDetails();
  }, [params.id]);

  const fetchOrderDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/orders/${params.id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setOrder(data.order || data);
        setFormData({
          status: data.order?.status || data.status || '',
          payment_status: data.order?.payment_status || data.payment_status || '',
          notes: data.order?.notes || data.notes || '',
        });
      }
    } catch (error) {
      console.error('Failed to fetch order details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrder = async () => {
    if (!order) return;
    
    setUpdating(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/orders/${order.id}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        }
      );

      if (response.ok) {
        const updatedOrder = await response.json();
        setOrder(updatedOrder.order || updatedOrder);
        setShowUpdateForm(false);
        alert('Order updated successfully');
      }
    } catch (error) {
      console.error('Failed to update order:', error);
      alert('Failed to update order');
    } finally {
      setUpdating(false);
    }
  };

  const handleAssignDelivery = async () => {
    // Implement delivery assignment
    router.push(`/admin/deliveries/assign?order_id=${order?.id}`);
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

  const getPaymentStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-purple-100 text-purple-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
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
            href="/admin/orders"
            className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <Link
                  href="/admin/orders"
                  className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Orders
                </Link>
                <div className="flex items-center space-x-4">
                  <h1 className="text-3xl font-bold text-gray-900">Order #{order.order_number}</h1>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                    {order.status.replace('_', ' ')}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPaymentStatusColor(order.payment_status)}`}>
                    Payment: {order.payment_status}
                  </span>
                </div>
                <p className="text-gray-600 mt-2">
                  Tracking: {order.tracking_number} • Placed {new Date(order.created_at).toLocaleString()}
                </p>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowUpdateForm(!showUpdateForm)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Order
                </button>
                <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center">
                  <Printer className="w-4 h-4 mr-2" />
                  Print
                </button>
              </div>
            </div>
          </div>

          {/* Update Form */}
          {showUpdateForm && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Update Order</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="out_for_delivery">Out for Delivery</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payment Status</label>
                  <select
                    value={formData.payment_status}
                    onChange={(e) => setFormData({ ...formData, payment_status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="failed">Failed</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                  <input
                    type="text"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Add notes..."
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowUpdateForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateOrder}
                  disabled={updating}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {updating ? 'Updating...' : 'Update Order'}
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Order Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Order Items */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-bold text-gray-900">Order Items</h2>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex items-center border-b border-gray-100 pb-4 last:border-0">
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
                          <Link
                            href={`/admin/products/${item.product.id}`}
                            className="font-medium text-blue-600 hover:text-blue-900"
                          >
                            {item.product.name}
                          </Link>
                          <p className="text-sm text-gray-500">SKU: {item.product.sku}</p>
                          <p className="text-sm text-gray-500">Price: ${item.price.toFixed(2)} each</p>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-lg font-bold text-gray-900">${item.total.toFixed(2)}</div>
                          <div className="text-sm text-gray-500">Qty: {item.quantity}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Tracking History */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-bold text-gray-900">Tracking History</h2>
                </div>
                <div className="p-6">
                  <div className="space-y-6">
                    {order.tracking_history.map((history, index) => (
                      <div key={index} className="flex items-start">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 ${
                          history.status === 'delivered' ? 'bg-green-100 text-green-600' :
                          history.status === 'cancelled' ? 'bg-red-100 text-red-600' :
                          'bg-blue-100 text-blue-600'
                        }`}>
                          {history.icon === '📝' && <Package className="w-5 h-5" />}
                          {history.icon === '✅' && <CheckCircle className="w-5 h-5" />}
                          {history.icon === '⚙️' && <Package className="w-5 h-5" />}
                          {history.icon === '🚚' && <Truck className="w-5 h-5" />}
                          {history.icon === '🎉' && <CheckCircle className="w-5 h-5" />}
                          {history.icon === '❌' && <XCircle className="w-5 h-5" />}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium text-gray-900">{history.title}</h3>
                            <span className="text-sm text-gray-500">
                              {new Date(history.actual_date).toLocaleString()}
                            </span>
                          </div>
                          
                          <p className="text-gray-600 mt-1">{history.description}</p>
                          
                          {history.location && (
                            <div className="flex items-center text-sm text-gray-500 mt-2">
                              <MapPin className="w-4 h-4 mr-2" />
                              {history.location}
                            </div>
                          )}
                          
                          {history.user && (
                            <div className="flex items-center text-sm text-gray-500 mt-2">
                              <User className="w-4 h-4 mr-2" />
                              Updated by {history.user.name} ({history.user.role})
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-6">
              {/* Customer Information */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-bold text-gray-900">Customer Information</h2>
                </div>
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                      <User className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{order.user.name}</h3>
                      <p className="text-sm text-gray-500">Customer ID: #{order.user.id}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <Mail className="w-4 h-4 text-gray-400 mr-3" />
                      <span className="text-gray-900">{order.user.email}</span>
                    </div>
                    
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 text-gray-400 mr-3" />
                      <span className="text-gray-900">{order.user.phone}</span>
                    </div>
                    
                    <div className="flex items-start">
                      <MapPin className="w-4 h-4 text-gray-400 mr-3 mt-1" />
                      <div>
                        <p className="text-gray-900">{order.address.full_address}</p>
                        <p className="text-sm text-gray-500">
                          {order.address.city}, {order.address.state} {order.address.zip_code}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Summary */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-bold text-gray-900">Order Summary</h2>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
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
                    
                    <div className="border-t border-gray-200 pt-3">
                      <div className="flex justify-between">
                        <span className="font-semibold text-gray-900">Total</span>
                        <span className="text-2xl font-bold text-gray-900">${order.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment Method</span>
                      <span className="font-medium">{order.payment_method.replace('_', ' ')}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment Status</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getPaymentStatusColor(order.payment_status)}`}>
                        {order.payment_status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Delivery Information */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-900">Delivery Information</h2>
                    {!order.delivery || order.delivery.status === 'pending' ? (
                      <button
                        onClick={handleAssignDelivery}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                      >
                        Assign Driver
                      </button>
                    ) : (
                      <Link
                        href={`/admin/deliveries/${order.delivery.id}`}
                        className="px-3 py-1 border border-gray-300 text-sm rounded hover:bg-gray-50"
                      >
                        View Details
                      </Link>
                    )}
                  </div>
                </div>
                <div className="p-6">
                  {order.delivery ? (
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Status</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.delivery.status)}`}>
                          {order.delivery.status.replace('_', ' ')}
                        </span>
                      </div>
                      
                      {order.delivery.driver_name && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 mb-1">Driver</h3>
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                              <User className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{order.delivery.driver_name}</p>
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
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Estimated Delivery</h3>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-gray-900">
                            {new Date(order.delivery.estimated_delivery_time).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      
                      {order.delivery.actual_delivery_time && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 mb-1">Actual Delivery</h3>
                          <div className="flex items-center">
                            <CheckCircle className="w-4 h-4 text-green-400 mr-2" />
                            <span className="text-gray-900">
                              {new Date(order.delivery.actual_delivery_time).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {order.delivery.delivery_notes && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 mb-1">Delivery Notes</h3>
                          <p className="text-gray-900">{order.delivery.delivery_notes}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <Truck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No delivery information yet</p>
                      <button
                        onClick={handleAssignDelivery}
                        className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Assign Delivery
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-bold text-gray-900">Actions</h2>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center">
                      <Download className="w-4 h-4 mr-2" />
                      Download Invoice
                    </button>
                    
                    <button className="w-full px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 flex items-center justify-center">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Contact Customer
                    </button>
                    
                    <Link
                      href={`/track-order?order_number=${order.order_number}`}
                      className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center justify-center"
                    >
                      <Truck className="w-4 h-4 mr-2" />
                      Track Order
                    </Link>
                    
                    {order.status === 'pending' && (
                      <button className="w-full px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 flex items-center justify-center">
                        <XCircle className="w-4 h-4 mr-2" />
                        Cancel Order
                      </button>
                    )}
                    
                    <button className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center justify-center">
                      <Bell className="w-4 h-4 mr-2" />
                      Send Notification
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}