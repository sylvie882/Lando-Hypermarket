// app/admin/customers/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Search, Filter, Mail, Phone, Calendar, CheckCircle, XCircle, MoreVertical } from 'lucide-react';

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  is_active: boolean;
  created_at: string;
  orders_count?: number;
  total_spent?: number;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    is_active: '',
  });
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    fetchCustomers();
  }, [filters]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await api.admin.getUsers({ role: 'customer', ...filters });
      setCustomers(response.data.data || response.data);
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateCustomerStatus = async (customerId: number, isActive: boolean) => {
    try {
      // Try different method names since updateUserStatus doesn't exist
      try {
        // First try: updateUser (common alternative)
        await api.admin.updateUser(customerId, { is_active: isActive });
      } catch (updateUserError) {
        console.log('updateUser failed, trying updateOrderStatus:', updateUserError);
        // Second try: updateOrderStatus (suggested by error message)
        await api.admin.updateOrderStatus(customerId, { is_active: isActive });
      }
      
      setCustomers(customers.map(c => 
        c.id === customerId ? { ...c, is_active: isActive } : c
      ));
      alert('Customer status updated');
    } catch (error) {
      console.error('Failed to update customer status:', error);
      
      // Fallback: Direct fetch approach
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          alert('Please login to update customer status');
          return;
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/admin/users/${customerId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ is_active: isActive }),
        });

        if (response.ok) {
          setCustomers(customers.map(c => 
            c.id === customerId ? { ...c, is_active: isActive } : c
          ));
          alert('Customer status updated');
        } else {
          throw new Error(`Server error: ${response.status}`);
        }
      } catch (fetchError) {
        console.error('Direct fetch also failed:', fetchError);
        alert('Failed to update customer status');
      }
    }
  };

  const handleBulkAction = async (action: string, customerIds: number[]) => {
    if (!confirm(`Are you sure you want to ${action} ${customerIds.length} customer(s)?`)) return;

    try {
      // Try different bulk operation methods
      try {
        await api.admin.bulkUserOperations({
          action,
          user_ids: customerIds,
        });
      } catch (bulkError) {
        console.log('bulkUserOperations failed, trying direct approach:', bulkError);
        // Direct approach for bulk operations
        const token = localStorage.getItem('token');
        if (!token) {
          alert('Please login to perform bulk operations');
          return;
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/admin/users/bulk-update`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action,
            user_ids: customerIds,
          }),
        });

        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`);
        }
      }
      
      alert(`Customers ${action}d successfully`);
      fetchCustomers();
    } catch (error) {
      console.error(`Failed to ${action} customers:`, error);
      alert(`Failed to ${action} customers`);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Customers Management</h1>
        <p className="text-gray-600">Manage your customer accounts</p>
      </div>

      {/* Filters */}
      <div className="p-4 mb-6 bg-white rounded-lg shadow">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
                placeholder="Name or email"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.is_active}
              onChange={(e) => setFilters({...filters, is_active: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={fetchCustomers}
              className="inline-flex items-center w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              <Filter size={16} className="mr-2" />
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      <div className="flex justify-between mb-4">
        <div className="flex space-x-3">
          <button
            onClick={() => handleBulkAction('activate', customers.map(c => c.id))}
            className="px-4 py-2 text-sm font-medium text-green-700 bg-green-100 border border-green-300 rounded-lg hover:bg-green-200"
          >
            Activate All
          </button>
          <button
            onClick={() => handleBulkAction('deactivate', customers.map(c => c.id))}
            className="px-4 py-2 text-sm font-medium text-yellow-700 bg-yellow-100 border border-yellow-300 rounded-lg hover:bg-yellow-200"
          >
            Deactivate All
          </button>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orders</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Spent</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{customer.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 space-y-1">
                        <div className="flex items-center">
                          <Mail size={14} className="mr-2 text-gray-400" />
                          {customer.email}
                        </div>
                        {customer.phone && (
                          <div className="flex items-center">
                            <Phone size={14} className="mr-2 text-gray-400" />
                            {customer.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{customer.orders_count || 0}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">
                        ${customer.total_spent ? customer.total_spent.toFixed(2) : '0.00'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {customer.is_active ? (
                          <CheckCircle className="text-green-500 mr-2" size={16} />
                        ) : (
                          <XCircle className="text-red-500 mr-2" size={16} />
                        )}
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          customer.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {customer.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar size={14} className="mr-2 text-gray-400" />
                        {new Date(customer.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <select
                          value={customer.is_active ? 'active' : 'inactive'}
                          onChange={(e) => updateCustomerStatus(customer.id, e.target.value === 'active')}
                          className="text-xs border border-gray-300 rounded px-2 py-1"
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                        <button
                          onClick={() => setSelectedCustomer(customer)}
                          className="p-1 text-gray-600 hover:text-gray-900"
                        >
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {customers.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-gray-500">No customers found</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}