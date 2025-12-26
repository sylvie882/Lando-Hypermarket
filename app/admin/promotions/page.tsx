'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import PromotionForm from '@/components/admin/PromotionForm';
import { Plus, Edit, Trash2, Calendar, Percent, Tag, Filter, Search } from 'lucide-react';

interface Promotion {
  id: number;
  code: string;
  name: string;
  description: string;
  type: string;
  discount_value: number;
  minimum_order_amount: number | null;
  min_order_amount: number | null;
  max_discount_amount: number | null;
  usage_limit: number | null;
  valid_from: string;
  valid_until: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  used_count: number;
}

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    type: '',
    page: 1,
  });
  const [pagination, setPagination] = useState({
    current_page: 1,
    total: 0,
    per_page: 20,
    last_page: 1,
  });

  useEffect(() => {
    fetchPromotions();
  }, [filters]);

  const fetchPromotions = async () => {
    try {
      setLoading(true);
      console.log('Fetching promotions with filters:', filters);
      
      let response;
      try {
        response = await api.admin.getAllPromotions(filters);
        console.log('API Response:', response);
        console.log('Response data structure:', response.data);
      } catch (apiError: any) {
        console.error('API call failed:', apiError);
        // Try without filters as fallback
        response = await api.admin.getAllPromotions();
        console.log('Fallback API Response:', response);
      }

      const responseData = response?.data;
      console.log('Raw response data:', responseData);

      if (!responseData) {
        console.error('No data in response');
        setPromotions([]);
        return;
      }

      // Check if response is paginated
      if (responseData.data && Array.isArray(responseData.data)) {
        console.log('Processing paginated data:', responseData.data);
        setPromotions(responseData.data);
        setPagination({
          current_page: responseData.current_page || 1,
          total: responseData.total || 0,
          per_page: responseData.per_page || 20,
          last_page: responseData.last_page || 1,
        });
      } 
      // Check if response is direct array
      else if (Array.isArray(responseData)) {
        console.log('Processing direct array data:', responseData);
        setPromotions(responseData);
        setPagination({
          current_page: 1,
          total: responseData.length,
          per_page: 20,
          last_page: 1,
        });
      }
      else {
        console.error('Unexpected response format:', responseData);
        setPromotions([]);
      }
      
      console.log('Final promotions state:', promotions.length, 'promotions');
      console.log('Sample promotion:', promotions[0]);
    } catch (error: any) {
      console.error('Failed to fetch promotions:', error);
      alert(`Failed to load promotions: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this promotion?')) return;
    
    try {
      await api.admin.deletePromotion(id);
      alert('Promotion deleted successfully');
      fetchPromotions();
    } catch (error) {
      alert('Failed to delete promotion');
    }
  };

  const togglePromotionStatus = async (promotion: Promotion) => {
    try {
      await api.admin.updatePromotion(promotion.id, { 
        is_active: !promotion.is_active 
      });
      alert(`Promotion ${promotion.is_active ? 'deactivated' : 'activated'}`);
      fetchPromotions();
    } catch (error) {
      alert('Failed to update promotion status');
    }
  };

  const formatDiscount = (promotion: Promotion) => {
    const type = promotion.type;
    const value = promotion.discount_value;
    
    if (type === 'percentage') {
      return `${value}%`;
    } else if (type === 'fixed_amount') {
      return `$${value.toFixed(2)}`;
    } else if (type === 'free_shipping') {
      return 'Free Shipping';
    } else if (type === 'buy_one_get_one') {
      return 'Buy One Get One';
    }
    return `${value}`;
  };

  const getPromotionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      percentage: 'Percentage',
      fixed_amount: 'Fixed Amount',
      free_shipping: 'Free Shipping',
      buy_one_get_one: 'BOGO',
    };
    return labels[type] || type;
  };

  const isExpired = (endDate: string) => {
    return new Date(endDate) < new Date();
  };

  const isUpcoming = (startDate: string) => {
    return new Date(startDate) > new Date();
  };

  const getStatus = (promotion: Promotion) => {
    if (isExpired(promotion.valid_until || promotion.end_date)) return 'Expired';
    if (isUpcoming(promotion.valid_from || promotion.start_date)) return 'Upcoming';
    if (!promotion.is_active) return 'Inactive';
    return 'Active';
  };

  const handleFormSuccess = () => {
    fetchPromotions();
    setShowForm(false);
    setEditingPromotion(null);
  };

  // Safely get date for display
  const getDateDisplay = (promotion: Promotion) => {
    const startDate = promotion.valid_from || promotion.start_date;
    const endDate = promotion.valid_until || promotion.end_date;
    
    return {
      start: startDate ? new Date(startDate).toLocaleDateString() : 'N/A',
      end: endDate ? new Date(endDate).toLocaleDateString() : 'N/A'
    };
  };

  return (
    <div className="p-6">
      <div className="flex justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Promotions</h1>
          <p className="text-gray-600">Manage discount codes and promotions</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          <Plus size={16} className="mr-2" />
          Create Promotion
        </button>
      </div>

      {/* Debug Info */}
      <div className="mb-4 p-4 bg-gray-100 rounded-lg text-sm">
        <div className="flex items-center justify-between">
          <div>
            <span className="font-semibold">Debug Info:</span>
            <span className="ml-2">Loading: {loading ? 'Yes' : 'No'}</span>
            <span className="ml-4">Promotions Count: {promotions.length}</span>
          </div>
          <button
            onClick={fetchPromotions}
            className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 mb-6 bg-white rounded-lg shadow">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value, page: 1})}
                placeholder="Code, name or description"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value, page: 1})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="expired">Expired</option>
              <option value="upcoming">Upcoming</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={filters.type}
              onChange={(e) => setFilters({...filters, type: e.target.value, page: 1})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Types</option>
              <option value="percentage">Percentage</option>
              <option value="fixed_amount">Fixed Amount</option>
              <option value="free_shipping">Free Shipping</option>
              <option value="buy_one_get_one">Buy One Get One</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setFilters({ status: '', search: '', type: '', page: 1 });
                fetchPromotions();
              }}
              className="inline-flex items-center w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Promotions Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading promotions...</p>
          </div>
        </div>
      ) : promotions.length > 0 ? (
        <>
          <div className="mb-4 text-sm text-gray-600">
            Showing {promotions.length} of {pagination.total} promotions
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {promotions.map((promotion) => {
              const dates = getDateDisplay(promotion);
              return (
                <div key={promotion.id} className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
                  <div className="px-6 py-4 border-b">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Tag className="text-blue-500 mr-2" size={20} />
                        <div>
                          <div className="font-bold text-lg text-gray-900">{promotion.code}</div>
                          <div className="text-sm text-gray-600">{promotion.name}</div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          getStatus(promotion) === 'Active' 
                            ? 'bg-green-100 text-green-800'
                            : getStatus(promotion) === 'Expired'
                            ? 'bg-red-100 text-red-800'
                            : getStatus(promotion) === 'Upcoming'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {getStatus(promotion)}
                        </span>
                        <span className="mt-1 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                          {getPromotionTypeLabel(promotion.type)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="px-6 py-4">
                    <div className="space-y-4">
                      <div>
                        <div className="text-sm text-gray-600">Description</div>
                        <div className="text-gray-900 line-clamp-2">{promotion.description || 'No description'}</div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-gray-600">Discount</div>
                          <div className="flex items-center font-bold text-lg text-gray-900">
                            {promotion.type === 'percentage' ? (
                              <Percent size={16} className="mr-1" />
                            ) : promotion.type === 'fixed_amount' ? (
                              <span className="mr-1">$</span>
                            ) : null}
                            {formatDiscount(promotion)}
                          </div>
                        </div>

                        <div>
                          <div className="text-sm text-gray-600">Usage</div>
                          <div className="font-medium text-gray-900">
                            {promotion.used_count} / {promotion.usage_limit || '∞'}
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="text-sm text-gray-600">Validity Period</div>
                        <div className="flex items-center text-gray-900">
                          <Calendar size={14} className="mr-2 text-gray-400" />
                          {dates.start} - {dates.end}
                        </div>
                      </div>

                      {promotion.minimum_order_amount && (
                        <div>
                          <div className="text-sm text-gray-600">Minimum Order</div>
                          <div className="font-medium text-gray-900">
                            ${promotion.minimum_order_amount.toFixed(2)}
                          </div>
                        </div>
                      )}

                      {promotion.max_discount_amount && promotion.type === 'percentage' && (
                        <div>
                          <div className="text-sm text-gray-600">Max Discount</div>
                          <div className="font-medium text-gray-900">
                            ${promotion.max_discount_amount.toFixed(2)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="px-6 py-4 border-t bg-gray-50">
                    <div className="flex justify-between">
                      <button
                        onClick={() => togglePromotionStatus(promotion)}
                        className={`px-3 py-1 text-sm rounded ${
                          promotion.is_active && !isExpired(promotion.valid_until || promotion.end_date) && !isUpcoming(promotion.valid_from || promotion.start_date)
                            ? 'text-yellow-700 bg-yellow-100 hover:bg-yellow-200'
                            : 'text-green-700 bg-green-100 hover:bg-green-200'
                        }`}
                      >
                        {promotion.is_active && !isExpired(promotion.valid_until || promotion.end_date) && !isUpcoming(promotion.valid_from || promotion.start_date) 
                          ? 'Deactivate' 
                          : 'Activate'}
                      </button>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setEditingPromotion(promotion);
                            setShowForm(true);
                          }}
                          className="p-1 text-blue-600 hover:text-blue-800"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(promotion.id)}
                          className="p-1 text-red-600 hover:text-red-800"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="py-12 text-center bg-white rounded-lg shadow">
          <Tag size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 text-lg mb-2">No promotions found</p>
          <p className="text-gray-400 text-sm mb-4">Create your first promotion to get started</p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            <Plus size={16} className="mr-2" />
            Create Promotion
          </button>
        </div>
      )}

      {/* Pagination */}
      {pagination.total > pagination.per_page && (
        <div className="mt-6 flex justify-center">
          <nav className="flex items-center space-x-2">
            <button
              onClick={() => {
                if (pagination.current_page > 1) {
                  setFilters(prev => ({ ...prev, page: pagination.current_page - 1 }));
                }
              }}
              disabled={pagination.current_page === 1}
              className="px-3 py-1 rounded border disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-3 py-1">
              Page {pagination.current_page} of {pagination.last_page}
            </span>
            <button
              onClick={() => {
                if (pagination.current_page < pagination.last_page) {
                  setFilters(prev => ({ ...prev, page: pagination.current_page + 1 }));
                }
              }}
              disabled={pagination.current_page === pagination.last_page}
              className="px-3 py-1 rounded border disabled:opacity-50"
            >
              Next
            </button>
          </nav>
        </div>
      )}

      {/* Promotion Form Modal */}
      {showForm && (
        <PromotionForm
          promotion={editingPromotion}
          onClose={() => {
            setShowForm(false);
            setEditingPromotion(null);
          }}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  );
}