// Add 'use client' directive at the top
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Package,
  Truck,
  Clock,
  CheckCircle,
  MapPin,
  Download,
  Printer,
  Share2,
  User,
  CreditCard,
  MessageSquare,
  ArrowLeft,
  ShoppingBag,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';

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
  estimated_delivery: string | null;
  actual_delivery: string | null;
  notes: string;
  shipping_method: string;
  carrier: string;
  
  user?: {
    id: number;
    name: string;
    email: string;
    phone: string;
  };
  
  address?: {
    full_address: string;
    city: string;
    state: string;
    zip_code: string;
    country: string;
  };
  
  items?: Array<{
    product: {
      id: number;
      name: string;
      thumbnail: string;
      sku: string;
      price: any;
      category?: {
        name: string;
      };
    };
    quantity: number;
    price: any;
    total: any;
  }>;
  
  delivery?: {
    id: number;
    status: string;
    delivery_address: string;
    estimated_delivery_time: string;
    actual_delivery_time: string | null;
    driver_name: string | null;
    driver_phone: string | null;
    vehicle_type: string | null;
    vehicle_number: string | null;
    delivery_notes: string | null;
  } | null;
  
  tracking_history?: Array<{
    id: number;
    status: string;
    title: string;
    description: string;
    location: string;
    icon: string;
    actual_date: string;
  }>;
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Make sure we have params and id before fetching
    if (params && params.id) {
      console.log('Order ID from params:', params.id);
      fetchOrderDetails();
    } else {
      setError('Order ID not found');
      setLoading(false);
    }
  }, [params.id]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching order details for ID:', params.id);
      // Use the orders.getById method from the API service
      const response = await api.orders.getById(parseInt(params.id as string));
      
      console.log('API Response:', response);
      console.log('API Response data:', response.data);
      
      // Handle different response structures
      let orderData = null;
      if (response.data) {
        // Check for different possible response structures
        if (response.data.order) {
          orderData = response.data.order;
        } else if (response.data.data) {
          orderData = response.data.data;
        } else {
          orderData = response.data;
        }
      }
      
      console.log('Processed order data:', orderData);
      
      if (orderData) {
        setOrder(orderData);
      } else {
        setError('Order data not found in response');
      }
    } catch (err: any) {
      console.error('Failed to fetch order details:', err);
      console.error('Error response:', err.response);
      setError(err.response?.data?.message || err.message || 'Failed to load order details');
      toast.error('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to safely convert to number
  const parseNumber = (value: any): number => {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? 0 : parsed;
    }
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  };

  // Helper function to safely format currency
  const formatCurrency = (value: any): string => {
    const amount = parseNumber(value);
    return `$${amount.toFixed(2)}`;
  };

  // Helper function to get proper image URL for product thumbnails
  const getProductImageUrl = (thumbnail: string | null | undefined): string => {
    if (!thumbnail) {
      return '/images/placeholder-product.jpg';
    }
    
    // Clean any leading slash
    const cleanThumbnail = thumbnail.replace(/^\//, '');
    
    // Just add the thumbnail to the base storage URL
    return `http://localhost:8000/storage/${cleanThumbnail}`;
  };

  const getStatusColor = (status: string = 'pending') => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      processing: 'bg-purple-100 text-purple-800',
      shipped: 'bg-indigo-100 text-indigo-800',
      out_for_delivery: 'bg-orange-100 text-orange-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string = 'pending') => {
    const icons: Record<string, React.ReactNode> = {
      pending: <Clock className="w-5 h-5" />,
      confirmed: <CheckCircle className="w-5 h-5" />,
      processing: <Package className="w-5 h-5" />,
      shipped: <Truck className="w-5 h-5" />,
      out_for_delivery: <Truck className="w-5 h-5" />,
      delivered: <CheckCircle className="w-5 h-5" />,
      cancelled: <AlertCircle className="w-5 h-5" />,
    };
    return icons[status.toLowerCase()] || <Package className="w-5 h-5" />;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid date';
    }
  };

  // Function to handle image error
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = '/images/placeholder-product.jpg';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h1>
          <p className="text-gray-600 mb-4">
            {error || 'The order you are looking for does not exist or you do not have permission to view it.'}
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => router.push('/orders')}
              className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700"
            >
              View All Orders
            </button>
            <button
              onClick={() => router.push('/')}
              className="border-2 border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  console.log('Rendering order:', order);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/orders"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Orders
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Order #{order.order_number || `ORD-${order.id}`}
              </h1>
              <p className="text-gray-600 mt-2">
                Placed on {formatDate(order.created_at)}
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <span className={`px-4 py-2 rounded-full text-sm font-medium flex items-center ${getStatusColor(order.status)}`}>
                {getStatusIcon(order.status)}
                <span className="ml-2 capitalize">{(order.status || 'pending').replace('_', ' ')}</span>
              </span>
              
              <div className="hidden md:flex gap-2">
                <button 
                  onClick={() => window.print()}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  title="Print Order"
                >
                  <Printer className="w-5 h-5 text-gray-600" />
                </button>
                <button 
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: `Order #${order.order_number}`,
                        text: `Check out my order details for Order #${order.order_number}`,
                        url: window.location.href,
                      });
                    } else {
                      navigator.clipboard.writeText(window.location.href);
                      toast.success('Link copied to clipboard!');
                    }
                  }}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  title="Share Order"
                >
                  <Share2 className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Order Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Order Summary */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>
              
              {order.items && order.items.length > 0 ? (
                <>
                  <div className="space-y-4">
                    {order.items.map((item, index) => {
                      const imageUrl = getProductImageUrl(item.product?.thumbnail);
                      return (
                        <div key={index} className="flex items-center justify-between pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                          <div className="flex items-start flex-1">
                            <div className="relative">
                              <img
                                src={imageUrl}
                                alt={item.product?.name || 'Product'}
                                className="w-20 h-20 rounded-lg object-cover mr-4 border border-gray-200"
                                onError={handleImageError}
                              />
                              {item.product?.category?.name && (
                                <span className="absolute -top-2 -right-2 bg-orange-100 text-orange-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                                  {item.product.category.name}
                                </span>
                              )}
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h3 className="font-bold text-gray-900 mb-1">
                                    {item.product?.name || 'Product'}
                                  </h3>
                                  <p className="text-sm text-gray-600 mb-1">SKU: {item.product?.sku || 'N/A'}</p>
                                  <div className="flex items-center space-x-4">
                                    <p className="text-sm text-gray-600">
                                      Qty: <span className="font-semibold">{item.quantity || 0}</span>
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      Price: <span className="font-semibold">{formatCurrency(item.price || 0)}</span>
                                    </p>
                                  </div>
                                </div>
                                <Link 
                                  href={`/products/${item.product?.id}`}
                                  className="ml-2 p-1 hover:bg-gray-100 rounded"
                                  title="View Product"
                                >
                                  <ExternalLink className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                                </Link>
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right pl-4">
                            <p className="font-bold text-lg text-gray-900">
                              {formatCurrency(item.total || 0)}
                            </p>
                            <p className="text-sm text-gray-500">
                              {item.quantity || 0} × {formatCurrency(item.price || 0)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Totals */}
                  <div className="mt-8 pt-6 border-t border-gray-200">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="font-medium">{formatCurrency(order.subtotal)}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-600">Shipping</span>
                        <span className="font-medium">{formatCurrency(order.shipping_fee)}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tax</span>
                        <span className="font-medium">{formatCurrency(order.tax)}</span>
                      </div>
                      
                      {parseNumber(order.discount) > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Discount</span>
                          <span className="font-bold">-{formatCurrency(order.discount)}</span>
                        </div>
                      )}
                      
                      <div className="flex justify-between text-xl font-bold text-gray-900 pt-3 border-t border-gray-200">
                        <span>Total</span>
                        <span>{formatCurrency(order.total)}</span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No items found in this order</p>
                </div>
              )}
            </div>

            {/* Tracking History */}
           {/* Tracking History */}
<div className="bg-white rounded-xl shadow-lg p-6">
  <h2 className="text-xl font-bold text-gray-900 mb-6">Order Status</h2>
  
  <div className="space-y-6">
    {order.tracking_history && order.tracking_history.length > 0 ? (
      order.tracking_history.map((history, index) => (
        <div key={index} className="flex">
          <div className="flex flex-col items-center mr-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              history.status === 'delivered' ? 'bg-green-100 text-green-600' :
              history.status === 'cancelled' ? 'bg-red-100 text-red-600' :
              'bg-blue-100 text-blue-600'
            }`}>
              {history.icon === '📝' && <Package className="w-5 h-5" />}
              {history.icon === '✅' && <CheckCircle className="w-5 h-5" />}
              {history.icon === '⚙️' && <Package className="w-5 h-5" />}
              {history.icon === '🚚' && <Truck className="w-5 h-5" />}
              {history.icon === '🎉' && <CheckCircle className="w-5 h-5" />}
              {history.icon === '❌' && <AlertCircle className="w-5 h-5" />}
            </div>
            {/* FIXED: Added optional chaining */}
            {index < (order.tracking_history?.length || 0) - 1 && (
              <div className="w-0.5 h-full bg-gray-200 mt-2"></div>
            )}
          </div>
          
          <div className="flex-1 pb-6 last:pb-0">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-gray-900">{history.title || 'Status Update'}</h3>
              <span className="text-sm text-gray-500">
                {formatDate(history.actual_date)}
              </span>
            </div>
            
            <p className="text-gray-600 mb-2">{history.description || 'Status updated'}</p>
            
            {history.location && (
              <div className="flex items-center text-sm text-gray-500">
                <MapPin className="w-4 h-4 mr-2" />
                {history.location}
              </div>
            )}
          </div>
        </div>
      ))
    ) : (
      <div className="text-center py-8">
        <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">No tracking history available yet</p>
      </div>
    )}
  </div>
</div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-8">
            {/* Delivery Information */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Delivery Information</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Shipping Address</h3>
                  <div className="flex items-start">
                    <MapPin className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">
                        {order.address?.full_address || 'No address provided'}
                      </p>
                      {order.address && (
                        <>
                          <p className="text-sm text-gray-600">
                            {order.address.city}, {order.address.state} {order.address.zip_code}
                          </p>
                          <p className="text-sm text-gray-600">{order.address.country}</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Shipping Method</h3>
                  <div className="flex items-center">
                    <Truck className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900 capitalize">
                        {(order.shipping_method || 'standard')} Shipping
                      </p>
                      <p className="text-sm text-gray-600">{order.carrier || 'Standard Carrier'}</p>
                    </div>
                  </div>
                </div>
                
                {order.estimated_delivery && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Estimated Delivery</h3>
                    <div className="flex items-center">
                      <Clock className="w-5 h-5 text-gray-400 mr-3" />
                      <p className="font-medium text-gray-900">{formatDate(order.estimated_delivery)}</p>
                    </div>
                  </div>
                )}
                
                {order.tracking_number && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Tracking Number</h3>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <code className="font-mono text-lg font-bold text-gray-900">
                        {order.tracking_number}
                      </code>
                      <button 
                        onClick={() => {
                          if (order.tracking_number) {
                            window.open(`https://track24.net/?code=${order.tracking_number}`, '_blank');
                          }
                        }}
                        className="mt-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
                      >
                        Track Package →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Information */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Payment Information</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Payment Method</h3>
                  <div className="flex items-center">
                    <CreditCard className="w-5 h-5 text-gray-400 mr-3" />
                    <p className="font-medium text-gray-900 capitalize">
                      {(order.payment_method || 'cod').replace('_', ' ')}
                    </p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Payment Status</h3>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    order.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                    order.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {(order.payment_status || 'pending').charAt(0).toUpperCase() + (order.payment_status || 'pending').slice(1)}
                  </span>
                </div>
                
                {order.notes && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Order Notes</h3>
                    <p className="text-gray-900 bg-gray-50 rounded-lg p-3">{order.notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Need Help?</h2>
              
              <div className="space-y-3">
                <button 
                  onClick={() => router.push('/support')}
                  className="w-full px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium flex items-center justify-center"
                >
                  <MessageSquare className="w-5 h-5 mr-3" />
                  Contact Support
                </button>
                
                <button 
                  onClick={async () => {
                    try {
                      // Generate invoice download
                      const response = await api.get(`/orders/${order.id}/invoice`, {
                        responseType: 'blob'
                      });
                      
                      const url = window.URL.createObjectURL(new Blob([response.data]));
                      const link = document.createElement('a');
                      link.href = url;
                      link.setAttribute('download', `invoice-${order.order_number}.pdf`);
                      document.body.appendChild(link);
                      link.click();
                      link.remove();
                      
                      toast.success('Invoice downloaded successfully');
                    } catch (error) {
                      toast.error('Failed to download invoice');
                    }
                  }}
                  className="w-full px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium flex items-center justify-center"
                >
                  <Download className="w-5 h-5 mr-3" />
                  Download Invoice
                </button>
                
                <Link
                  href="/orders"
                  className="w-full px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium flex items-center justify-center"
                >
                  <ShoppingBag className="w-5 h-5 mr-3" />
                  View All Orders
                </Link>
                
                {order.status === 'pending' && (
                  <button 
                    onClick={async () => {
                      if (confirm('Are you sure you want to cancel this order?')) {
                        try {
                          await api.orders.cancel(order.id);
                          toast.success('Order cancelled successfully');
                          fetchOrderDetails(); // Refresh order data
                        } catch (error) {
                          toast.error('Failed to cancel order');
                        }
                      }
                    }}
                    className="w-full px-4 py-3 border-2 border-red-300 text-red-600 rounded-lg hover:bg-red-50 font-medium flex items-center justify-center"
                  >
                    <AlertCircle className="w-5 h-5 mr-3" />
                    Cancel Order
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}