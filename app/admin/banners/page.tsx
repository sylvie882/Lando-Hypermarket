'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import DashboardCard from '@/components/admin/DashboardCard';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  Calendar,
  Image as ImageIcon,
  Search,
  Filter,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Banner {
  id: number;
  title: string;
  subtitle: string | null;
  image: string;
  mobile_image: string | null;
  button_text: string | null;
  button_link: string | null;
  order: number;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  type: 'homepage' | 'category' | 'promotional' | 'sidebar';
  category_slug: string | null;
  clicks: number;
  impressions: number;
  created_at: string;
  updated_at: string;
}

export default function BannersPage() {
  const router = useRouter();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    total_clicks: 0,
    total_impressions: 0
  });

  useEffect(() => {
    fetchBanners();
  }, []);

  useEffect(() => {
    // Calculate stats from banners data when banners change
    if (banners.length > 0) {
      calculateStatsFromBanners();
    }
  }, [banners]);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const response = await api.banners.getAll();
      
      // Handle different response structures
      if (response.data && response.data.success) {
        setBanners(response.data.data || []);
      } else if (Array.isArray(response.data)) {
        setBanners(response.data);
      } else if (response.data?.data) {
        setBanners(response.data.data);
      } else {
        setBanners([]);
      }
    } catch (err: any) {
      console.error('Error fetching banners:', err);
      setError('Failed to load banners');
      toast.error('Failed to load banners');
    } finally {
      setLoading(false);
    }
  };

  const calculateStatsFromBanners = () => {
    try {
      const total = banners.length;
      const active = banners.filter(b => b.is_active).length;
      const total_clicks = banners.reduce((sum, b) => sum + (b.clicks || 0), 0);
      const total_impressions = banners.reduce((sum, b) => sum + (b.impressions || 0), 0);
      
      setStats({
        total,
        active,
        total_clicks,
        total_impressions
      });
    } catch (err) {
      console.error('Error calculating stats:', err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this banner?')) return;
    
    try {
      // Get authentication token
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login to delete banners');
        return;
      }

      // Try multiple API endpoints
      const endpoints = [
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/admin/banners/${id}`,
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/banners/${id}`,
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/banners/${id}/delete`
      ];

      let deleteSuccessful = false;
      let lastError: Error | null = null;

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json',
            },
            credentials: 'include',
          });

          if (response.ok) {
            deleteSuccessful = true;
            break;
          } else if (response.status === 404) {
            console.log(`Endpoint not found: ${endpoint}`);
            continue;
          } else {
            const errorText = await response.text();
            console.log(`Delete failed at ${endpoint}:`, response.status, errorText);
            continue;
          }
        } catch (endpointError) {
          console.log(`Error with endpoint ${endpoint}:`, endpointError);
          lastError = endpointError instanceof Error ? endpointError : new Error(String(endpointError));
          continue;
        }
      }

      if (deleteSuccessful) {
        setBanners(banners.filter(banner => banner.id !== id));
        toast.success('Banner deleted successfully');
      } else {
        throw new Error(lastError?.message || 'All delete endpoints failed');
      }

    } catch (err: any) {
      console.error('Delete error:', err);
      
      // Fallback: Remove from local state if server delete fails
      if (confirm('Server delete failed. Remove from local list anyway?')) {
        setBanners(banners.filter(banner => banner.id !== id));
        toast.success('Banner removed from list (server may still have it)');
      } else {
        setError('Failed to delete banner: ' + err.message);
        toast.error('Failed to delete banner');
      }
    }
  };

  const handleToggleStatus = async (id: number, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login to update banners');
        return;
      }

      // Direct fetch approach
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/admin/banners/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: !currentStatus }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      // Update local state
      setBanners(banners.map(banner => 
        banner.id === id ? { ...banner, is_active: !currentStatus } : banner
      ));
      toast.success('Banner status updated');
    } catch (err: any) {
      console.error('Toggle status error:', err);
      setError('Failed to update banner status');
      toast.error('Failed to update banner status');
    }
  };

  const getStatusColor = (banner: Banner) => {
    if (!banner.is_active) return 'bg-gray-100 text-gray-800';
    
    const now = new Date();
    const startDate = banner.start_date ? new Date(banner.start_date) : null;
    const endDate = banner.end_date ? new Date(banner.end_date) : null;
    
    if (startDate && now < startDate) return 'bg-blue-100 text-blue-800';
    if (endDate && now > endDate) return 'bg-red-100 text-red-800';
    return 'bg-green-100 text-green-800';
  };

  const getStatusText = (banner: Banner) => {
    if (!banner.is_active) return 'Inactive';
    
    const now = new Date();
    const startDate = banner.start_date ? new Date(banner.start_date) : null;
    const endDate = banner.end_date ? new Date(banner.end_date) : null;
    
    if (startDate && now < startDate) return 'Upcoming';
    if (endDate && now > endDate) return 'Expired';
    return 'Active';
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No date';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'homepage': return 'bg-purple-100 text-purple-800';
      case 'category': return 'bg-blue-100 text-blue-800';
      case 'promotional': return 'bg-green-100 text-green-800';
      case 'sidebar': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filterBanners = () => {
    let filtered = banners;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(banner => 
        banner.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (banner.subtitle && banner.subtitle.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(banner => banner.type === filterType);
    }

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(banner => {
        if (filterStatus === 'active') return banner.is_active;
        if (filterStatus === 'inactive') return !banner.is_active;
        if (filterStatus === 'expired') {
          const endDate = banner.end_date ? new Date(banner.end_date) : null;
          return banner.is_active && endDate && new Date() > endDate;
        }
        if (filterStatus === 'upcoming') {
          const startDate = banner.start_date ? new Date(banner.start_date) : null;
          return banner.is_active && startDate && new Date() < startDate;
        }
        return true;
      });
    }

    return filtered;
  };

  const filteredBanners = filterBanners();

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Banner Management</h1>
          <p className="text-gray-600">Manage homepage sliders, promotional banners, and sidebar ads</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => fetchBanners()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            title="Refresh"
          >
            <RefreshCw size={20} />
          </button>
          <button
            onClick={() => router.push('/admin/banners/create')}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Plus size={20} />
            Add New Banner
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 gap-6 mb-6 md:grid-cols-4">
        <DashboardCard 
          title="Total Banners" 
          value={stats.total.toString()} 
          icon={<ImageIcon className="text-blue-600" size={24} />}
        />
        <DashboardCard 
          title="Active Banners" 
          value={stats.active.toString()} 
          icon={<Eye className="text-green-600" size={24} />}
        />
        <DashboardCard 
          title="Total Clicks" 
          value={stats.total_clicks.toLocaleString()} 
          icon={<div className="text-purple-600 text-lg">👆</div>}
        />
        <DashboardCard 
          title="Total Impressions" 
          value={stats.total_impressions.toLocaleString()} 
          icon={<div className="text-yellow-600 text-lg">👁️</div>}
        />
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search banners by title or subtitle..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 md:gap-4">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="homepage">Homepage</option>
              <option value="category">Category</option>
              <option value="promotional">Promotional</option>
              <option value="sidebar">Sidebar</option>
            </select>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="expired">Expired</option>
              <option value="upcoming">Upcoming</option>
            </select>
            
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterType('all');
                setFilterStatus('all');
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Banners Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading banners...</p>
          </div>
        ) : filteredBanners.length === 0 ? (
          <div className="p-8 text-center">
            <ImageIcon className="mx-auto text-gray-400" size={48} />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No banners found</h3>
            <p className="mt-1 text-gray-600">
              {banners.length === 0 
                ? "Get started by creating your first banner." 
                : "No banners match your search criteria."}
            </p>
            <button
              onClick={() => router.push('/admin/banners/create')}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Create Banner
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Banner
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dates
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Performance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBanners.map((banner) => (
                  <tr key={banner.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-16 w-24 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                          <img
                            src={banner.image ? `/storage/${banner.image}` : '/images/placeholder-banner.jpg'}
                            alt={banner.title}
                            className="h-16 w-24 object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/images/placeholder-banner.jpg';
                            }}
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{banner.title}</div>
                          {banner.subtitle && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">{banner.subtitle}</div>
                          )}
                          <div className="text-xs text-gray-400">
                            Order: {banner.order} • ID: {banner.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(banner.type)}`}>
                        {banner.type.charAt(0).toUpperCase() + banner.type.slice(1)}
                      </span>
                      {banner.category_slug && (
                        <div className="text-xs text-gray-500 mt-1">
                          {banner.category_slug}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(banner)}`}>
                        {getStatusText(banner)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1">
                          <Calendar size={12} className="text-gray-400" />
                          <span>Start: {formatDate(banner.start_date)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar size={12} className="text-gray-400" />
                          <span>End: {formatDate(banner.end_date)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{banner.clicks || 0}</span>
                          <span className="text-xs text-gray-500">clicks</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{banner.impressions || 0}</span>
                          <span className="text-xs text-gray-500">views</span>
                        </div>
                        <div className="text-xs">
                          <span className="text-gray-500">CTR: </span>
                          <span className="font-medium">
                            {banner.impressions > 0 
                              ? ((banner.clicks / banner.impressions) * 100).toFixed(2) 
                              : '0.00'}%
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleToggleStatus(banner.id, banner.is_active)}
                          className={`p-1.5 rounded-full ${
                            banner.is_active 
                              ? 'text-green-600 hover:bg-green-50' 
                              : 'text-gray-400 hover:bg-gray-50'
                          }`}
                          title={banner.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {banner.is_active ? <Eye size={18} /> : <EyeOff size={18} />}
                        </button>
                        <button
                          onClick={() => router.push(`/admin/banners/${banner.id}/edit`)}
                          className="p-1.5 rounded-full text-blue-600 hover:bg-blue-50"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(banner.id)}
                          className="p-1.5 rounded-full text-red-600 hover:bg-red-50"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Summary */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                Showing {filteredBanners.length} of {banners.length} banners
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}