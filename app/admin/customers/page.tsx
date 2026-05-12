// app/admin/customers/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { 
  Search, 
  Filter, 
  Mail, 
  Phone, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Users,
  DollarSign,
  ShoppingBag,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Download,
  UserCheck,
  UserX,
  Eye,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Customer {
  id: number;
  name: string;
  email: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
  orders_count?: number;
  total_spent?: number;
  avatar?: string;
  last_login?: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomers, setSelectedCustomers] = useState<number[]>([]);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [filters, setFilters] = useState({
    search: '',
    is_active: '',
    sort_by: 'created_at',
    sort_order: 'desc' as 'asc' | 'desc',
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    perPage: 20,
    total: 0,
    lastPage: 1,
    from: 0,
    to: 0
  });

  useEffect(() => {
    fetchCustomers();
  }, [filters, pagination.currentPage]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      
      const params: any = {
        role: 'customer',
        page: pagination.currentPage,
        per_page: pagination.perPage,
        sort: filters.sort_by,
        order: filters.sort_order,
      };
      
      if (filters.search) params.search = filters.search;
      if (filters.is_active) params.is_active = filters.is_active === 'true';
      
      console.log('Fetching customers with params:', params);
      
      const response = await api.admin.getUsers(params);
      
      console.log('Raw API response:', response);
      console.log('Response data structure:', response.data);
      
      // Handle different response formats
      let customersArray: Customer[] = [];
      let totalCount = 0;
      let currentPage = 1;
      let lastPage = 1;
      let perPage = pagination.perPage;
      let from = 0;
      let to = 0;
      
      // Case 1: Laravel paginated response with data property
      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        customersArray = response.data.data;
        totalCount = response.data.total || 0;
        currentPage = response.data.current_page || 1;
        lastPage = response.data.last_page || 1;
        perPage = response.data.per_page || pagination.perPage;
        from = response.data.from || 0;
        to = response.data.to || 0;
        console.log('Case 1: Paginated response with data array');
      }
      // Case 2: Direct array response
      else if (Array.isArray(response.data)) {
        customersArray = response.data;
        totalCount = response.data.length;
        currentPage = 1;
        lastPage = 1;
        from = 1;
        to = response.data.length;
        console.log('Case 2: Direct array response');
      }
      // Case 3: Response data is an object with users or customers property
      else if (response.data && response.data.users && Array.isArray(response.data.users)) {
        customersArray = response.data.users;
        totalCount = response.data.total || response.data.users.length;
        console.log('Case 3: Response with users property');
      }
      else if (response.data && response.data.customers && Array.isArray(response.data.customers)) {
        customersArray = response.data.customers;
        totalCount = response.data.total || response.data.customers.length;
        console.log('Case 4: Response with customers property');
      }
      // Case 4: Response data itself is the customers array (no wrapper)
      else if (response.data && typeof response.data === 'object') {
        // Try to find any array property
        for (const key in response.data) {
          if (Array.isArray(response.data[key])) {
            customersArray = response.data[key];
            totalCount = customersArray.length;
            console.log(`Case 5: Found array in property '${key}'`);
            break;
          }
        }
      }
      
      console.log('Processed customers array:', customersArray);
      console.log('Total count:', totalCount);
      
      // Update pagination state
      setPagination({
        currentPage,
        perPage,
        total: totalCount,
        lastPage,
        from,
        to
      });
      
      setCustomers(customersArray);
      
      if (customersArray.length === 0 && !loading) {
        console.log('No customers found in response');
      }
      
    } catch (error: any) {
      console.error('Failed to fetch customers:', error);
      console.error('Error details:', error.response?.data);
      
      let errorMessage = 'Failed to fetch customers';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const updateCustomerStatus = async (customerId: number, isActive: boolean) => {
    try {
      const response = await api.admin.updateUser(customerId, { is_active: isActive });
      
      if (response.data) {
        setCustomers(customers.map(c => 
          c.id === customerId ? { ...c, is_active: isActive } : c
        ));
        toast.success(`Customer ${isActive ? 'activated' : 'deactivated'} successfully`);
      }
    } catch (error: any) {
      console.error('Failed to update customer status:', error);
      toast.error(error.response?.data?.message || 'Failed to update customer status');
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedCustomers.length === 0) {
      toast.error('Please select customers first');
      return;
    }
    
    if (!confirm(`Are you sure you want to ${action} ${selectedCustomers.length} customer(s)?`)) return;

    try {
      const isActive = action === 'activate';
      
      // Update each customer individually
      const results = await Promise.allSettled(
        selectedCustomers.map(id => api.admin.updateUser(id, { is_active: isActive }))
      );

      const successfulUpdates = results.filter(result => result.status === 'fulfilled').length;

      if (successfulUpdates > 0) {
        toast.success(`Successfully updated ${successfulUpdates} out of ${selectedCustomers.length} customers`);
        fetchCustomers();
        setSelectedCustomers([]);
      } else {
        throw new Error('All updates failed');
      }
    } catch (error) {
      console.error(`Failed to ${action} customers:`, error);
      toast.error(`Failed to ${action} customers`);
    }
  };

  const handleSelectAll = () => {
    if (selectedCustomers.length === customers.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(customers.map(c => c.id));
    }
  };

  const handleSelectCustomer = (id: number) => {
    if (selectedCustomers.includes(id)) {
      setSelectedCustomers(selectedCustomers.filter(cid => cid !== id));
    } else {
      setSelectedCustomers([...selectedCustomers, id]);
    }
  };

  const exportCustomers = () => {
    if (customers.length === 0) {
      toast.error('No customers to export');
      return;
    }
    
    const csvData = customers.map(c => ({
      Name: c.name,
      Email: c.email,
      Phone: c.phone || '',
      Status: c.is_active ? 'Active' : 'Inactive',
      'Orders Count': c.orders_count || 0,
      'Total Spent': c.total_spent || 0,
      'Joined Date': new Date(c.created_at).toLocaleDateString()
    }));
    
    const headers = Object.keys(csvData[0]);
    const csvRows = [
      headers.join(','),
      ...csvData.map(row => headers.map(h => JSON.stringify(row[h as keyof typeof row] || '')).join(','))
    ];
    
    const csv = csvRows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `customers_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Export started');
  };

  const goToPage = (page: number) => {
    if (page < 1 || page > pagination.lastPage) return;
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      is_active: '',
      sort_by: 'created_at',
      sort_order: 'desc',
    });
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  // Stats calculation
  const activeCustomers = customers.filter(c => c.is_active).length;
  const totalOrders = customers.reduce((sum, c) => sum + (c.orders_count || 0), 0);
  const totalRevenue = customers.reduce((sum, c) => sum + (c.total_spent || 0), 0);

  const StatCard = ({ title, value, icon: Icon, color, trend }: any) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-300">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
          {trend && <p className="text-xs text-green-600 mt-1">{trend}</p>}
        </div>
        <div className="p-3 rounded-lg" style={{ backgroundColor: `${color}10` }}>
          <Icon className="h-6 w-6" style={{ color }} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 p-4 md:p-6 bg-gradient-to-br from-gray-50 via-white to-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Customer Management</h1>
          </div>
          <p className="text-gray-600">Manage your customer accounts, track activity, and analyze behaviour</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={fetchCustomers}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200"
          >
            <RefreshCw size={16} className="mr-2" />
            Refresh
          </button>
          <button
            onClick={exportCustomers}
            disabled={customers.length === 0}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-all duration-200"
          >
            <Download size={16} className="mr-2" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Customers"
          value={pagination.total || customers.length}
          icon={Users}
          color="#3B82F6"
          trend={`${activeCustomers} active`}
        />
        <StatCard
          title="Active Customers"
          value={activeCustomers}
          icon={UserCheck}
          color="#10B981"
        />
        <StatCard
          title="Total Orders"
          value={totalOrders}
          icon={ShoppingBag}
          color="#8B5CF6"
        />
        <StatCard
          title="Total Revenue"
          value={totalRevenue}
          icon={DollarSign}
          color="#F59E0B"
        />
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
              placeholder="Search by name, email, or phone..."
              className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>
          <select
            value={filters.is_active}
            onChange={(e) => setFilters({...filters, is_active: e.target.value})}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          <select
            value={filters.sort_by}
            onChange={(e) => setFilters({...filters, sort_by: e.target.value})}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="created_at">Joined Date</option>
            <option value="name">Name</option>
            <option value="email">Email</option>
            <option value="orders_count">Orders Count</option>
            <option value="total_spent">Total Spent</option>
          </select>
          <button
            onClick={() => setFilters({...filters, sort_order: filters.sort_order === 'desc' ? 'asc' : 'desc'})}
            className="px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {filters.sort_order === 'desc' ? '↓ Desc' : '↑ Asc'}
          </button>
          <button
            onClick={fetchCustomers}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all duration-200"
          >
            <Filter size={16} className="mr-2" />
            Apply Filters
          </button>
          <button
            onClick={resetFilters}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all duration-200"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedCustomers.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-blue-900">
                {selectedCustomers.length} customer{selectedCustomers.length !== 1 ? 's' : ''} selected
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleBulkAction('activate')}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-green-700 bg-green-100 rounded-lg hover:bg-green-200 transition-colors"
              >
                <UserCheck size={14} className="mr-1" />
                Activate
              </button>
              <button
                onClick={() => handleBulkAction('deactivate')}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200 transition-colors"
              >
                <UserX size={14} className="mr-1" />
                Deactivate
              </button>
              <button
                onClick={() => setSelectedCustomers([])}
                className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customers Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="relative">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <Loader2 className="absolute inset-0 m-auto h-5 w-5 text-blue-600 animate-pulse" />
            </div>
            <p className="mt-4 text-gray-600 font-medium">Loading customers...</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="text-center py-16">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No customers found</h3>
            <p className="text-gray-500">Try adjusting your filters or search criteria</p>
            <button
              onClick={resetFilters}
              className="mt-4 inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <RefreshCw size={14} className="mr-2" />
              Reset Filters
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left">
                      <input
                        type="checkbox"
                        checked={selectedCustomers.length === customers.length && customers.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orders</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Spent</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {customers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50 transition-colors duration-200 group">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedCustomers.includes(customer.id)}
                          onChange={() => handleSelectCustomer(customer.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                            {customer.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{customer.name || 'N/A'}</div>
                            <div className="text-xs text-gray-500">ID: #{customer.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center text-sm text-gray-600">
                            <Mail size={14} className="mr-2 text-gray-400" />
                            {customer.email || 'N/A'}
                          </div>
                          {customer.phone && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Phone size={14} className="mr-2 text-gray-400" />
                              {customer.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <ShoppingBag size={14} className="text-purple-500" />
                          <span className="font-semibold text-gray-900">{customer.orders_count || 0}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <DollarSign size={14} className="text-green-500" />
                          <span className="font-semibold text-gray-900">
                            ${customer.total_spent ? customer.total_spent.toFixed(2) : '0.00'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {customer.is_active ? (
                            <CheckCircle className="text-green-500" size={16} />
                          ) : (
                            <XCircle className="text-red-500" size={16} />
                          )}
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                            customer.is_active 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {customer.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Calendar size={14} className="text-gray-400" />
                          {customer.created_at ? new Date(customer.created_at).toLocaleDateString() : 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <select
                            value={customer.is_active ? 'active' : 'inactive'}
                            onChange={(e) => updateCustomerStatus(customer.id, e.target.value === 'active')}
                            className="text-sm border border-gray-200 rounded-lg px-2 py-1 focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                          </select>
                          <button
                            onClick={() => {
                              setSelectedCustomer(customer);
                              setShowDetailsModal(true);
                            }}
                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <Eye size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.lastPage > 1 && (
              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="text-sm text-gray-600">
                    Showing {pagination.from || 1} to {pagination.to || customers.length} of {pagination.total} results
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => goToPage(pagination.currentPage - 1)}
                      disabled={pagination.currentPage === 1}
                      className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <div className="flex gap-1">
                      {Array.from({ length: Math.min(5, pagination.lastPage) }, (_, i) => {
                        let pageNum;
                        if (pagination.lastPage <= 5) {
                          pageNum = i + 1;
                        } else if (pagination.currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (pagination.currentPage >= pagination.lastPage - 2) {
                          pageNum = pagination.lastPage - 4 + i;
                        } else {
                          pageNum = pagination.currentPage - 2 + i;
                        }
                        return (
                          <button
                            key={pageNum}
                            onClick={() => goToPage(pageNum)}
                            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                              pagination.currentPage === pageNum
                                ? 'bg-blue-600 text-white'
                                : 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-700'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      onClick={() => goToPage(pagination.currentPage + 1)}
                      disabled={pagination.currentPage === pagination.lastPage}
                      className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Customer Details Modal */}
      {showDetailsModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-100">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">Customer Details</h2>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedCustomer(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XCircle size={20} />
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                  {selectedCustomer.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedCustomer.name || 'N/A'}</h3>
                  <p className="text-gray-500">Customer since {selectedCustomer.created_at ? new Date(selectedCustomer.created_at).toLocaleDateString() : 'N/A'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">Email</div>
                  <div className="font-medium text-gray-900">{selectedCustomer.email || 'N/A'}</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">Phone</div>
                  <div className="font-medium text-gray-900">{selectedCustomer.phone || 'Not provided'}</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">Orders</div>
                  <div className="font-medium text-gray-900">{selectedCustomer.orders_count || 0}</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">Total Spent</div>
                  <div className="font-medium text-gray-900">${selectedCustomer.total_spent ? selectedCustomer.total_spent.toFixed(2) : '0.00'}</div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    updateCustomerStatus(selectedCustomer.id, !selectedCustomer.is_active);
                    setShowDetailsModal(false);
                  }}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedCustomer.is_active
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  {selectedCustomer.is_active ? 'Deactivate Customer' : 'Activate Customer'}
                </button>
                <button
                  onClick={() => {
                    window.location.href = `mailto:${selectedCustomer.email}`;
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Send Email
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}