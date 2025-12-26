// app/admin/analytics/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { BarChart3, TrendingUp, Users, DollarSign, ShoppingCart, Calendar, Filter } from 'lucide-react';

export default function AnalyticsPage() {
  const [salesReport, setSalesReport] = useState<any>(null);
  const [productPerformance, setProductPerformance] = useState<any[]>([]);
  const [customerInsights, setCustomerInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    period: 'monthly',
    start_date: '',
    end_date: '',
  });

  useEffect(() => {
    fetchAnalyticsData();
  }, [filters]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Fetch all analytics data - using available methods
      const [salesData, productsData, customersData] = await Promise.all([
        api.admin.getAnalytics(filters), // Changed from getSalesReport
        api.admin.getProducts({ limit: 10, sortBy: 'sales' }), // Using getProducts with sorting
        api.admin.getCustomers({ limit: 10, sortBy: 'total_spent' }), // Using getCustomers with sorting
      ]);

      setSalesReport(salesData.data);
      setProductPerformance(productsData.data?.products || []);
      setCustomerInsights({
        total_customers: customersData.data?.total || 0,
        active_customers: customersData.data?.active || customersData.data?.total || 0,
        avg_orders_per_customer: salesData.data?.summary?.avg_order_value || 0,
        top_customers: customersData.data?.customers || []
      });
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
        <p className="text-gray-600">Business insights and performance metrics</p>
      </div>

      {/* Filters */}
      <div className="p-4 mb-6 bg-white rounded-lg shadow">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
            <select
              value={filters.period}
              onChange={(e) => setFilters({...filters, period: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={filters.start_date}
              onChange={(e) => setFilters({...filters, start_date: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={filters.end_date}
              onChange={(e) => setFilters({...filters, end_date: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={fetchAnalyticsData}
              className="inline-flex items-center w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              <Filter size={16} className="mr-2" />
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {/* Sales Summary */}
          {salesReport && (
            <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-3">
              <div className="p-6 bg-white rounded-lg shadow">
                <div className="flex items-center">
                  <DollarSign className="w-8 h-8 text-green-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      ${salesReport.summary?.total_revenue?.toLocaleString() || 
                        salesReport.total_revenue?.toLocaleString() || 
                        '0'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-white rounded-lg shadow">
                <div className="flex items-center">
                  <ShoppingCart className="w-8 h-8 text-blue-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Orders</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {salesReport.summary?.total_orders?.toLocaleString() || 
                        salesReport.total_orders?.toLocaleString() || 
                        '0'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-white rounded-lg shadow">
                <div className="flex items-center">
                  <TrendingUp className="w-8 h-8 text-purple-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      ${salesReport.summary?.avg_order_value?.toFixed(2) || 
                        salesReport.avg_order_value?.toFixed(2) || 
                        '0.00'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Top Products */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Top Products</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {productPerformance.length > 0 ? (
                    productPerformance.slice(0, 5).map((product, index) => (
                      <div key={product.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <span className="w-6 h-6 flex items-center justify-center bg-blue-100 text-blue-600 rounded-full text-sm font-medium mr-3">
                            {index + 1}
                          </span>
                          <div>
                            <div className="font-medium text-gray-900">{product.name || product.title}</div>
                            <div className="text-sm text-gray-500">{product.category?.name || product.category}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-gray-900">
                            {product.quantity_sold || product.sales_count || 0} sold
                          </div>
                          <div className="text-sm text-gray-500">
                            ${product.revenue || product.total_sales || 0} revenue
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No product data available
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Customer Insights */}
            {customerInsights && (
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b">
                  <h3 className="text-lg font-semibold text-gray-900">Customer Insights</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <div className="text-sm font-medium text-blue-700">Total Customers</div>
                        <div className="text-2xl font-bold text-blue-900">
                          {customerInsights.total_customers?.toLocaleString() || '0'}
                        </div>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg">
                        <div className="text-sm font-medium text-green-700">Active Customers</div>
                        <div className="text-2xl font-bold text-green-900">
                          {customerInsights.active_customers?.toLocaleString() || '0'}
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-2">Avg Orders per Customer</div>
                      <div className="text-3xl font-bold text-gray-900">
                        {customerInsights.avg_orders_per_customer?.toFixed(1) || '0.0'}
                      </div>
                    </div>

                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-3">Top Customers</div>
                      <div className="space-y-3">
                        {customerInsights.top_customers && customerInsights.top_customers.length > 0 ? (
                          customerInsights.top_customers.slice(0, 3).map((customer: any) => (
                            <div key={customer.id} className="flex items-center justify-between">
                              <div className="flex items-center">
                                <Users size={16} className="text-gray-400 mr-2" />
                                <span className="font-medium text-gray-900">
                                  {customer.name || customer.full_name || customer.email}
                                </span>
                              </div>
                              <div className="text-right">
                                <div className="font-medium text-gray-900">
                                  ${customer.total_spent?.toFixed(2) || customer.orders_sum_total?.toFixed(2) || '0.00'}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {customer.order_count || customer.orders_count || 0} orders
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-4 text-gray-500">
                            No customer data available
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sales Chart */}
          {salesReport?.data && salesReport.data.length > 0 && (
            <div className="mt-6 bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Sales Trend</h3>
              </div>
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orders</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Order Value</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {salesReport.data.slice(0, 10).map((item: any, index: number) => (
                        <tr key={item.date || index}>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {item.date ? new Date(item.date).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">{item.order_count || item.count || 0}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            ${item.revenue?.toFixed(2) || item.total?.toFixed(2) || '0.00'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            ${item.avg_order_value?.toFixed(2) || '0.00'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}