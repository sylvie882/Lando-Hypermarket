'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { api } from '@/lib/api';

interface Promotion {
  id: number;
  code: string;
  name: string;
  description: string;
  type: string;
  discount_type: string;
  discount_value: number;
  min_order_amount: number | null;
  max_discount_amount: number | null;
  start_date: string;
  end_date: string;
  is_active: boolean;
  usage_limit: number | null;
  used_count: number;
}

interface PromotionFormProps {
  promotion?: Promotion | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PromotionForm({ promotion, onClose, onSuccess }: PromotionFormProps) {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    type: 'percentage' as 'percentage' | 'fixed_amount' | 'free_shipping' | 'buy_one_get_one',
    discount_value: 0,
    minimum_order_amount: '',
    max_discount_amount: '',
    usage_limit: '',
    valid_from: new Date().toISOString().split('T')[0],
    valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    is_active: true,
  });

  useEffect(() => {
    if (promotion) {
      setFormData({
        code: promotion.code,
        name: promotion.name,
        description: promotion.description,
        type: (promotion.type || promotion.discount_type) as any,
        discount_value: promotion.discount_value,
        minimum_order_amount: promotion.min_order_amount?.toString() || '',
        max_discount_amount: promotion.max_discount_amount?.toString() || '',
        usage_limit: promotion.usage_limit?.toString() || '',
        valid_from: promotion.start_date.split('T')[0],
        valid_until: promotion.end_date.split('T')[0],
        is_active: promotion.is_active,
      });
    }
  }, [promotion]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const data: any = {
        ...formData,
        discount_value: parseFloat(formData.discount_value.toString()),
      };

      // Only send fields that have values
      if (formData.minimum_order_amount) {
        data.minimum_order_amount = parseFloat(formData.minimum_order_amount);
      }

      if (formData.max_discount_amount) {
        data.max_discount_amount = parseFloat(formData.max_discount_amount);
      }

      if (formData.usage_limit) {
        data.usage_limit = parseInt(formData.usage_limit);
      }

      if (promotion) {
        await api.admin.updatePromotion(promotion.id, data);
      } else {
        await api.admin.createPromotion(data);
      }
      
      onSuccess();
      onClose();
    } catch (error: any) {
      if (error.response?.data?.errors) {
        // Format Laravel validation errors
        const formattedErrors: Record<string, string> = {};
        const errors = error.response.data.errors;
        
        Object.keys(errors).forEach(key => {
          formattedErrors[key] = errors[key][0];
        });
        
        setErrors(formattedErrors);
      } else {
        alert(error.response?.data?.message || 'Failed to save promotion');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              {promotion ? 'Edit Promotion' : 'Create Promotion'}
            </h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              type="button"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Code *
              </label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                required
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.code ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="SUMMER2024"
              />
              {errors.code && (
                <p className="mt-1 text-sm text-red-600">{errors.code}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Summer Sale"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Description of the promotion"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type *
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.type ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="percentage">Percentage</option>
                <option value="fixed_amount">Fixed Amount</option>
                <option value="free_shipping">Free Shipping</option>
                <option value="buy_one_get_one">Buy One Get One</option>
              </select>
              {errors.type && (
                <p className="mt-1 text-sm text-red-600">{errors.type}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Discount Value *
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="discount_value"
                  value={formData.discount_value}
                  onChange={handleChange}
                  required
                  min="0"
                  step={formData.type === 'percentage' ? '1' : '0.01'}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.discount_value ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder={formData.type === 'percentage' ? '10' : '50.00'}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <span className="text-gray-500">
                    {formData.type === 'percentage' ? '%' : '$'}
                  </span>
                </div>
              </div>
              {errors.discount_value && (
                <p className="mt-1 text-sm text-red-600">{errors.discount_value}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Order Amount
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="minimum_order_amount"
                  value={formData.minimum_order_amount}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <span className="text-gray-500">$</span>
                </div>
              </div>
            </div>

            {formData.type === 'percentage' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Maximum Discount Amount
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="max_discount_amount"
                    value={formData.max_discount_amount}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <span className="text-gray-500">$</span>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Usage Limit
              </label>
              <input
                type="number"
                name="usage_limit"
                value={formData.usage_limit}
                onChange={handleChange}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Unlimited"
              />
              <p className="mt-1 text-xs text-gray-500">
                Leave empty for unlimited usage
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date *
              </label>
              <input
                type="date"
                name="valid_from"
                value={formData.valid_from}
                onChange={handleChange}
                required
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.valid_from ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.valid_from && (
                <p className="mt-1 text-sm text-red-600">{errors.valid_from}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date *
              </label>
              <input
                type="date"
                name="valid_until"
                value={formData.valid_until}
                onChange={handleChange}
                required
                min={formData.valid_from}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.valid_until ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.valid_until && (
                <p className="mt-1 text-sm text-red-600">{errors.valid_until}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Active (promotion will be available for use)
                </span>
              </label>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {promotion ? 'Updating...' : 'Creating...'}
                </span>
              ) : promotion ? 'Update Promotion' : 'Create Promotion'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}