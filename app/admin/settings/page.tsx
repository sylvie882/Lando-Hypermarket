// app/admin/settings/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Save, Settings as SettingsIcon, Mail, Bell, Shield, Store, CreditCard, Truck } from 'lucide-react';

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [settings, setSettings] = useState({
    store: {
      name: 'Lando Ranch',
      email: 'info@landoranch.com',
      phone: '+254 712 345 678',
      address: '123 Business Street, Nairobi, Kenya',
      currency: 'KES',
      timezone: 'Africa/Nairobi',
    },
    notifications: {
      email_notifications: true,
      push_notifications: true,
      order_updates: true,
      promotion_notifications: true,
      low_stock_alerts: true,
    },
    security: {
      two_factor_auth: false,
      session_timeout: 30,
      ip_whitelist: '',
    },
    payment: {
      stripe_enabled: true,
      stripe_public_key: '',
      stripe_secret_key: '',
      mpesa_enabled: true,
      mpesa_consumer_key: '',
      mpesa_consumer_secret: '',
      cash_on_delivery: true,
    },
    shipping: {
      free_shipping_threshold: 50,
      shipping_fee: 5,
      delivery_days: '3-5',
      same_day_delivery: true,
    },
  });

  useEffect(() => {
    // Load saved settings
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // This would load settings from API
      // For now, we'll use the default settings
      console.log('Loading settings...');
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const handleChange = (section: string, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    try {
      setSaveStatus('saving');
      
      // Save settings to API
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }
  };

  const renderSaveButton = () => {
    switch (saveStatus) {
      case 'saving':
        return (
          <button
            disabled
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-400 rounded-lg"
          >
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Saving...
          </button>
        );
      case 'saved':
        return (
          <button
            disabled
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg"
          >
            <Save size={16} className="mr-2" />
            Saved Successfully
          </button>
        );
      case 'error':
        return (
          <button
            onClick={handleSave}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
          >
            <Save size={16} className="mr-2" />
            Error - Try Again
          </button>
        );
      default:
        return (
          <button
            onClick={handleSave}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            <Save size={16} className="mr-2" />
            Save Changes
          </button>
        );
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Configure your store settings</p>
      </div>

      <div className="space-y-6">
        {/* Store Settings */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <div className="flex items-center">
              <Store className="w-5 h-5 text-blue-500 mr-3" />
              <h2 className="text-lg font-semibold text-gray-900">Store Information</h2>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Store Name
                </label>
                <input
                  type="text"
                  value={settings.store.name}
                  onChange={(e) => handleChange('store', 'name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Store Email
                </label>
                <input
                  type="email"
                  value={settings.store.email}
                  onChange={(e) => handleChange('store', 'email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={settings.store.phone}
                  onChange={(e) => handleChange('store', 'phone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Currency
                </label>
                <select
                  value={settings.store.currency}
                  onChange={(e) => handleChange('store', 'currency', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="KES">Kenyan Shilling (KES)</option>
                  <option value="USD">US Dollar (USD)</option>
                  <option value="EUR">Euro (EUR)</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Store Address
                </label>
                <textarea
                  value={settings.store.address}
                  onChange={(e) => handleChange('store', 'address', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <div className="flex items-center">
              <Bell className="w-5 h-5 text-purple-500 mr-3" />
              <h2 className="text-lg font-semibold text-gray-900">Notification Settings</h2>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {Object.entries(settings.notifications).map(([key, value]) => (
                <div key={key} className="flex items-center">
                  <input
                    type="checkbox"
                    id={key}
                    checked={value as boolean}
                    onChange={(e) => handleChange('notifications', key, e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor={key} className="ml-3 text-sm text-gray-700">
                    {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Payment Settings */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <div className="flex items-center">
              <CreditCard className="w-5 h-5 text-green-500 mr-3" />
              <h2 className="text-lg font-semibold text-gray-900">Payment Settings</h2>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="stripe_enabled"
                  checked={settings.payment.stripe_enabled}
                  onChange={(e) => handleChange('payment', 'stripe_enabled', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="stripe_enabled" className="ml-3 text-sm font-medium text-gray-700">
                  Enable Stripe Payments
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="mpesa_enabled"
                  checked={settings.payment.mpesa_enabled}
                  onChange={(e) => handleChange('payment', 'mpesa_enabled', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="mpesa_enabled" className="ml-3 text-sm font-medium text-gray-700">
                  Enable M-Pesa Payments
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="cash_on_delivery"
                  checked={settings.payment.cash_on_delivery}
                  onChange={(e) => handleChange('payment', 'cash_on_delivery', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="cash_on_delivery" className="ml-3 text-sm font-medium text-gray-700">
                  Enable Cash on Delivery
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Shipping Settings */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <div className="flex items-center">
              <Truck className="w-5 h-5 text-orange-500 mr-3" />
              <h2 className="text-lg font-semibold text-gray-900">Shipping Settings</h2>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Free Shipping Threshold ($)
                </label>
                <input
                  type="number"
                  value={settings.shipping.free_shipping_threshold}
                  onChange={(e) => handleChange('shipping', 'free_shipping_threshold', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Standard Shipping Fee ($)
                </label>
                <input
                  type="number"
                  value={settings.shipping.shipping_fee}
                  onChange={(e) => handleChange('shipping', 'shipping_fee', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delivery Days
                </label>
                <input
                  type="text"
                  value={settings.shipping.delivery_days}
                  onChange={(e) => handleChange('shipping', 'delivery_days', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 3-5 business days"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="same_day_delivery"
                  checked={settings.shipping.same_day_delivery}
                  onChange={(e) => handleChange('shipping', 'same_day_delivery', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="same_day_delivery" className="ml-3 text-sm font-medium text-gray-700">
                  Enable Same Day Delivery
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <div className="flex items-center">
              <Shield className="w-5 h-5 text-red-500 mr-3" />
              <h2 className="text-lg font-semibold text-gray-900">Security Settings</h2>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="two_factor_auth"
                  checked={settings.security.two_factor_auth}
                  onChange={(e) => handleChange('security', 'two_factor_auth', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="two_factor_auth" className="ml-3 text-sm font-medium text-gray-700">
                  Enable Two-Factor Authentication
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Session Timeout (minutes)
                </label>
                <input
                  type="number"
                  value={settings.security.session_timeout}
                  onChange={(e) => handleChange('security', 'session_timeout', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          {renderSaveButton()}
        </div>
      </div>
    </div>
  );
}