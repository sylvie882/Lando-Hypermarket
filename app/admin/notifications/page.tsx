// app/admin/notifications/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Bell, CheckCircle, XCircle, Mail, AlertCircle, Filter, Search, Trash2 } from 'lucide-react';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  user?: {
    name: string;
    email: string;
  };
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<any>(null);
  const [filters, setFilters] = useState({
    type: '',
    is_read: '',
    search: '',
  });

  useEffect(() => {
    fetchNotifications();
    fetchSettings();
  }, [filters]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.notifications.getAll(filters);
      setNotifications(response.data);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await api.notifications.getSettings();
      setSettings(response.data);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      await api.notifications.markAsRead(id);
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, is_read: true } : n
      ));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.notifications.markAllAsRead();
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
      alert('All notifications marked as read');
    } catch (error) {
      alert('Failed to mark all as read');
    }
  };

  const deleteNotification = async (id: number) => {
    try {
      await api.notifications.delete(id);
      setNotifications(notifications.filter(n => n.id !== id));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const clearAll = async () => {
    if (!confirm('Are you sure you want to clear all notifications?')) return;
    
    try {
      await api.notifications.clearAll();
      setNotifications([]);
      alert('All notifications cleared');
    } catch (error) {
      alert('Failed to clear notifications');
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'order': return <Bell className="text-blue-500" />;
      case 'promotion': return <Mail className="text-purple-500" />;
      case 'alert': return <AlertCircle className="text-red-500" />;
      case 'info': return <Bell className="text-green-500" />;
      default: return <Bell className="text-gray-500" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'order': return 'bg-blue-100 text-blue-800';
      case 'promotion': return 'bg-purple-100 text-purple-800';
      case 'alert': return 'bg-red-100 text-red-800';
      case 'info': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        <p className="text-gray-600">Manage system notifications</p>
      </div>

      {/* Stats and Actions */}
      <div className="grid grid-cols-1 gap-6 mb-8 sm:grid-cols-2 lg:grid-cols-4">
        <div className="p-6 bg-white rounded-lg shadow">
          <div className="flex items-center">
            <Bell className="w-8 h-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Notifications</p>
              <p className="text-2xl font-semibold text-gray-900">{notifications.length}</p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white rounded-lg shadow">
          <div className="flex items-center">
            <CheckCircle className="w-8 h-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Read</p>
              <p className="text-2xl font-semibold text-gray-900">
                {notifications.filter(n => n.is_read).length}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white rounded-lg shadow">
          <div className="flex items-center">
            <XCircle className="w-8 h-8 text-yellow-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Unread</p>
              <p className="text-2xl font-semibold text-gray-900">
                {notifications.filter(n => !n.is_read).length}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white rounded-lg shadow">
          <div className="flex items-center">
            <AlertCircle className="w-8 h-8 text-red-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Alerts</p>
              <p className="text-2xl font-semibold text-gray-900">
                {notifications.filter(n => n.type === 'alert').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      <div className="flex justify-between mb-6">
        <div className="flex space-x-3">
          <button
            onClick={markAllAsRead}
            className="px-4 py-2 text-sm font-medium text-green-700 bg-green-100 border border-green-300 rounded-lg hover:bg-green-200"
          >
            Mark All as Read
          </button>
          <button
            onClick={clearAll}
            className="px-4 py-2 text-sm font-medium text-red-700 bg-red-100 border border-red-300 rounded-lg hover:bg-red-200"
          >
            Clear All
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
                onChange={(e) => setFilters({...filters, search: e.target.value})}
                placeholder="Title or message"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={filters.type}
              onChange={(e) => setFilters({...filters, type: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Types</option>
              <option value="order">Order</option>
              <option value="promotion">Promotion</option>
              <option value="alert">Alert</option>
              <option value="info">Info</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.is_read}
              onChange={(e) => setFilters({...filters, is_read: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Status</option>
              <option value="true">Read</option>
              <option value="false">Unread</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={fetchNotifications}
              className="inline-flex items-center w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              <Filter size={16} className="mr-2" />
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-lg shadow">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {notifications.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-gray-500">No notifications found</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-6 ${!notification.is_read ? 'bg-blue-50' : ''}`}
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      {getTypeIcon(notification.type)}
                    </div>
                    <div className="flex-1 ml-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <h3 className="text-sm font-medium text-gray-900">
                            {notification.title}
                          </h3>
                          <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(notification.type)}`}>
                            {notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}
                          </span>
                          {!notification.is_read && (
                            <span className="ml-2 px-2 py-1 text-xs font-medium text-white bg-blue-500 rounded-full">
                              New
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          {!notification.is_read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="text-sm text-blue-600 hover:text-blue-800"
                            >
                              Mark as read
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="p-1 text-gray-400 hover:text-red-500"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-gray-600">
                        {notification.message}
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        {new Date(notification.created_at).toLocaleString()}
                        {notification.user && (
                          <span className="ml-2">• For: {notification.user.name}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}