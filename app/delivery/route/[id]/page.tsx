'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  MapPin, 
  Navigation, 
  ArrowLeft, 
  Clock, 
  Phone, 
  Mail, 
  Package,
  CheckCircle,
  AlertCircle,
  Share2,
  Download,
  Printer,
  Truck
} from 'lucide-react';

interface DeliveryRoute {
  delivery_id: number;
  destination: {
    address: string;
    latitude: number;
    longitude: number;
  };
  current_location: {
    latitude: number;
    longitude: number;
    updated_at: string;
  } | null;
}

export default function DeliveryRoutePage() {
  const router = useRouter();
  const params = useParams();
  const deliveryId = params.id;
  
  const [route, setRoute] = useState<DeliveryRoute | null>(null);
  const [loading, setLoading] = useState(true);
  const [deliveryDetails, setDeliveryDetails] = useState<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    fetchRouteData();
  }, [deliveryId]);

  const fetchRouteData = async () => {
    try {
      const token = localStorage.getItem('delivery_token');
      
      if (!token) {
        router.push('/delivery/login');
        return;
      }

      // Fetch route data
      const routeResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/delivery-staff/deliveries/${deliveryId}/route`,
        {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          },
        }
      );

      if (routeResponse.ok) {
        const routeData = await routeResponse.json();
        if (routeData.success && routeData.data) {
          setRoute(routeData.data);
        }
      }

      // Fetch delivery details
      const deliveriesResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/delivery-staff/deliveries`,
        {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          },
        }
      );

      if (deliveriesResponse.ok) {
        const deliveriesData = await deliveriesResponse.json();
        if (deliveriesData.success && deliveriesData.data) {
          const delivery = Array.isArray(deliveriesData.data) 
            ? deliveriesData.data.find((d: any) => d.id.toString() === deliveryId)
            : deliveriesData.data;
          setDeliveryDetails(delivery);
        }
      }

      setMapLoaded(true);
    } catch (error) {
      console.error('Failed to fetch route data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDirections = () => {
    if (!route) return;
    
    const destination = `${route.destination.latitude},${route.destination.longitude}`;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`;
    
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading route...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Dashboard
            </button>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={getDirections}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Navigation className="h-4 w-4 mr-2" />
                Get Directions
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <Share2 className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Delivery Route</h2>
                <p className="text-sm text-gray-600">
                  {route?.destination.address || 'Loading address...'}
                </p>
              </div>
              
              {/* Map Container */}
              <div className="h-96 bg-gray-100 relative">
                {mapLoaded ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    {/* This would be replaced with a real map component like Google Maps */}
                    <div className="text-center">
                      <div className="w-64 h-64 bg-gradient-to-br from-blue-100 to-green-100 rounded-lg flex items-center justify-center mb-4">
                        <div className="text-center">
                          <MapPin className="h-12 w-12 text-red-500 mx-auto mb-2" />
                          <p className="text-sm font-medium text-gray-700">Destination</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">
                        Map integration requires Google Maps API key
                      </p>
                      <button
                        onClick={getDirections}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center"
                      >
                        <Navigation className="h-4 w-4 mr-2" />
                        Open in Google Maps
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                )}
              </div>

              {/* Map Controls */}
              <div className="p-4 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    {route?.current_location ? (
                      <span>Location updated: {new Date(route.current_location.updated_at).toLocaleTimeString()}</span>
                    ) : (
                      <span>Location not available</span>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button className="p-2 text-gray-400 hover:text-gray-600">
                      <Download className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600">
                      <Printer className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Details */}
          <div className="space-y-6">
            {/* Delivery Info Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Delivery Information</h3>
              
              {deliveryDetails && (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Order Number</h4>
                    <p className="font-medium text-gray-900">#{deliveryDetails.order_number}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Status</h4>
                    <div className="flex items-center">
                      {deliveryDetails.status === 'delivered' ? (
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      ) : deliveryDetails.status === 'failed' ? (
                        <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                      ) : (
                        <Package className="h-4 w-4 text-blue-500 mr-2" />
                      )}
                      <span className="capitalize">{deliveryDetails.status.replace('_', ' ')}</span>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Estimated Delivery</h4>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 text-gray-400 mr-2" />
                      <span>{new Date(deliveryDetails.estimated_delivery_time).toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Delivery Fee</h4>
                    <p className="font-medium text-green-600">${deliveryDetails.delivery_fee?.toFixed(2) || '0.00'}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Customer Info Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h3>
              
              {deliveryDetails && (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Name</h4>
                    <p className="font-medium text-gray-900">{deliveryDetails.customer_name || 'Not specified'}</p>
                  </div>
                  
                  {deliveryDetails.customer_phone && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Phone</h4>
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 text-gray-400 mr-2" />
                        <a 
                          href={`tel:${deliveryDetails.customer_phone}`}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          {deliveryDetails.customer_phone}
                        </a>
                      </div>
                    </div>
                  )}
                  
                  {deliveryDetails.customer_email && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Email</h4>
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 text-gray-400 mr-2" />
                        <a 
                          href={`mailto:${deliveryDetails.customer_email}`}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          {deliveryDetails.customer_email}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Delivery Notes Card */}
            {deliveryDetails?.delivery_notes && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Delivery Notes</h3>
                <p className="text-gray-600">{deliveryDetails.delivery_notes}</p>
              </div>
            )}

            {/* Actions Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={getDirections}
                  className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Navigation className="h-5 w-5 mr-2" />
                  Start Navigation
                </button>
                
                <button
                  onClick={() => {
                    if (deliveryDetails?.customer_phone) {
                      window.open(`tel:${deliveryDetails.customer_phone}`, '_blank');
                    }
                  }}
                  disabled={!deliveryDetails?.customer_phone}
                  className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Phone className="h-5 w-5 mr-2" />
                  Call Customer
                </button>
                
                <button
                  onClick={() => router.push(`/delivery/dashboard`)}
                  className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  <Truck className="h-5 w-5 mr-2" />
                  Back to Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}