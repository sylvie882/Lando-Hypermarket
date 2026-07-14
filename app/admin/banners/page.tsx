'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  Calendar,
  Image as ImageIcon,
  Search,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Banner {
  id: number;
  title: string;
  subtitle: string | null;
  description: string | null;
  image: string;
  mobile_image: string | null;
  button_text: string | null;
  button_link: string | null;
  order: number;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  type: string;
  category_slug: string | null;
  clicks: number;
  impressions: number;
  created_at: string;
  updated_at: string;
  info?: string; // Optional info field
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
    if (banners.length > 0) {
      calculateStatsFromBanners();
    }
  }, [banners]);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Use the admin endpoint directly with fetch
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login first');
        setLoading(false);
        return;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.hypermarket.co.ke/api';
      
      // Try to get banners using the admin endpoint
      let response = await fetch(`${apiUrl}/admin/banners`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        credentials: 'include',
      });

      // If admin endpoint fails, try the public endpoint with all parameter
      if (response.status === 404 || response.status === 403) {
        console.log('Admin endpoint failed, trying public endpoint...');
        response = await fetch(`${apiUrl}/banners?type=all&limit=100`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
          credentials: 'include',
        });
      }

      if (!response.ok) {
        if (response.status === 401) {
          toast.error('Session expired. Please login again.');
          localStorage.removeItem('token');
          router.push('/login');
          setLoading(false);
          return;
        }
        throw new Error(`Failed to fetch banners: ${response.status}`);
      }

      const result = await response.json();
      console.log('Banners API response:', result);

      let bannersData: Banner[] = [];
      
      // Handle different response structures
      if (result.success) {
        if (result.data && result.data.data) {
          // Paginated response: { success: true, data: { data: [...], total, ... } }
          bannersData = result.data.data;
        } else if (Array.isArray(result.data)) {
          // Direct array response: { success: true, data: [...] }
          bannersData = result.data;
        } else if (result.data) {
          // Try to find any array property
          const possibleArrays = Object.values(result.data).filter(val => Array.isArray(val));
          if (possibleArrays.length > 0) {
            bannersData = possibleArrays[0];
          }
        }
      } else if (Array.isArray(result)) {
        // Response is directly the array
        bannersData = result;
      } else if (result.data && Array.isArray(result.data)) {
        bannersData = result.data;
      }

      console.log('Extracted banners:', bannersData);
      setBanners(bannersData);
      
      // if (bannersData.length === 0) {
      //   toast.info('No banners found in the database');
      // } else {
      //   const promoCount = bannersData.filter(b => b.type === 'promotional').length;
      //   const homepageCount = bannersData.filter(b => b.type === 'homepage').length;
      //   toast.success(`Loaded ${bannersData.length} banners (${homepageCount} homepage, ${promoCount} promotional)`);
      // }
      
    } catch (err: any) {
      console.error('Error fetching banners:', err);
      setError(err.message || 'Failed to load banners');
      toast.error(err.message || 'Failed to load banners');
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
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login to delete banners');
        return;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.hypermarket.co.ke/api';
      const response = await fetch(`${apiUrl}/admin/banners/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        setBanners(banners.filter(banner => banner.id !== id));
        toast.success('Banner deleted successfully');
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete banner');
      }

    } catch (err: any) {
      console.error('Delete error:', err);
      toast.error(err.message || 'Failed to delete banner');
    }
  };

  const handleToggleStatus = async (id: number, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login to update banners');
        return;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.hypermarket.co.ke/api';
      const response = await fetch(`${apiUrl}/admin/banners/${id}`, {
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

      setBanners(banners.map(banner => 
        banner.id === id ? { ...banner, is_active: !currentStatus } : banner
      ));
      toast.success('Banner status updated');
    } catch (err: any) {
      console.error('Toggle status error:', err);
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
    switch (type?.toLowerCase()) {
      case 'homepage': return 'bg-purple-100 text-purple-800';
      case 'category': return 'bg-blue-100 text-blue-800';
      case 'promotional': return 'bg-green-100 text-green-800';
      case 'sidebar': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getImageUrl = (banner: Banner) => {
    if (banner.image) {
      if (banner.image.startsWith('http')) return banner.image;
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.hypermarket.co.ke';
      // Remove /api from base URL for storage
      const baseUrl = apiUrl.replace(/\/api$/, '');
      return `${baseUrl}/storage/${banner.image}`;
    }
    return '/images/placeholder-banner.jpg';
  };

  const filterBanners = () => {
    let filtered = [...banners];

    if (filterType !== 'all') {
      filtered = filtered.filter(banner => banner.type?.toLowerCase() === filterType.toLowerCase());
    }

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

    if (searchTerm) {
      filtered = filtered.filter(banner => 
        banner.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (banner.subtitle && banner.subtitle.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    return filtered;
  };

  const filteredBanners = filterBanners();

  const typeCounts = banners.reduce((acc, b) => {
    const type = b.type || 'unknown';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Banner Management</h1>
          <p className="text-gray-600">Manage all banners including homepage, promotional, category, and sidebar</p>
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
          <button 
            onClick={() => fetchBanners()} 
            className="mt-2 text-sm text-blue-600 hover:text-blue-800"
          >
            Retry fetching banners
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 mb-6 md:grid-cols-4">
        {[
          { 
            title: "Total Banners", 
            value: stats.total.toString(), 
            icon: <ImageIcon className="text-blue-600" size={24} />,
            bgColor: "bg-blue-50"
          },
          { 
            title: "Active Banners", 
            value: stats.active.toString(), 
            icon: <Eye className="text-green-600" size={24} />,
            bgColor: "bg-green-50"
          },
          { 
            title: "Total Clicks", 
            value: stats.total_clicks.toLocaleString(), 
            icon: <div className="text-purple-600 text-lg">👆</div>,
            bgColor: "bg-purple-50"
          },
          { 
            title: "Total Impressions", 
            value: stats.total_impressions.toLocaleString(), 
            icon: <div className="text-yellow-600 text-lg">👁️</div>,
            bgColor: "bg-yellow-50"
          }
        ].map((stat, index) => (
          <div 
            key={index} 
            className={`bg-white rounded-lg border p-6 ${stat.bgColor}`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-medium text-gray-600">{stat.title}</div>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                {stat.icon}
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
          </div>
        ))}
      </div>

      {Object.keys(typeCounts).length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          <span className="text-sm text-gray-600 mr-2">Banner types:</span>
          {Object.entries(typeCounts).map(([type, count]) => (
            <span key={type} className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(type)}`}>
              {type}: {count}
            </span>
          ))}
        </div>
      )}

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
              <option value="all">All Types ({banners.length})</option>
              {Object.entries(typeCounts).map(([type, count]) => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)} ({count})
                </option>
              ))}
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
                ? "No banners found in the database. Create your first banner!" 
                : `${banners.length} banners found but none match your filters.`}
            </p>
            <div className="mt-4 space-x-4">
              <button
                onClick={() => router.push('/admin/banners/create')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Create Banner
              </button>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterType('all');
                  setFilterStatus('all');
                }}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
              >
                Show All Banners
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Banner</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBanners.map((banner) => (
                  <tr key={banner.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-16 w-24 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                          <img
                            src={getImageUrl(banner)}
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
                          <div className="text-xs text-gray-400">Order: {banner.order} • ID: {banner.id}</div>
                          {banner.type?.toLowerCase() === 'promotional' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 mt-1">
                              🌟 Promotional
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(banner.type)}`}>
                        {banner.type ? banner.type.charAt(0).toUpperCase() + banner.type.slice(1) : 'Unknown'}
                      </span>
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
            
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
              <div className="text-sm text-gray-600">
                Showing {filteredBanners.length} of {banners.length} banners
              </div>
              <div className="text-sm text-gray-600 flex gap-4">
                {Object.entries(typeCounts).map(([type, count]) => (
                  <span key={type}>
                    {type}: {count}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}