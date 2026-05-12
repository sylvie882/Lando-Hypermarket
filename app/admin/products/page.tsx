'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type { Product } from '@/types';
import ProductTable from '@/components/admin/ProductTable';
import ProductForm from '@/components/admin/ProductForm';
import BulkUpload from '@/components/admin/BulkUpload';
import { 
  Plus, 
  Upload, 
  Search, 
  Filter,
  Download,
  RefreshCw,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Image as ImageIcon,
  Grid,
  List,
  ExternalLink,
  X,
  CheckCircle,
  AlertCircle,
  Package,
  DollarSign,
  Tag,
  Layers
} from 'lucide-react';
import debounce from 'lodash/debounce';
import Image from 'next/image';
import toast from 'react-hot-toast';

// Image compression utility
const compressImage = async (file: File, maxWidth: number = 1200, maxSizeKB: number = 500): Promise<File> => {
  return new Promise((resolve, reject) => {
    if (file.size <= maxSizeKB * 1024) {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = document.createElement('img');
      img.onload = () => {
        const canvas = document.createElement('canvas');
        
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Canvas to Blob conversion failed'));
              return;
            }
            
            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '') + '.jpg', {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            
            console.log(`Compressed ${file.name}: ${(file.size / 1024).toFixed(2)}KB -> ${(blob.size / 1024).toFixed(2)}KB`);
            resolve(compressedFile);
          },
          'image/jpeg',
          0.8
        );
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsDataURL(file);
  });
};

// Validate image file
const validateImage = (file: File): { valid: boolean; message?: string } => {
  const maxSize = 10 * 1024 * 1024;
  const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'];
  
  if (file.size > maxSize) {
    return { 
      valid: false, 
      message: `Image too large. Max 10MB. Current: ${(file.size / 1024 / 1024).toFixed(2)}MB` 
    };
  }
  
  if (!validTypes.includes(file.type.toLowerCase())) {
    return { 
      valid: false, 
      message: `Invalid type. Allowed: JPEG, PNG, GIF, WebP` 
    };
  }
  
  return { valid: true };
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [filters, setFilters] = useState({
    category: '',
    status: '',
    minPrice: '',
    maxPrice: '',
    vendor: '',
    stockStatus: '',
    sort: 'created_at',
    order: 'desc' as 'asc' | 'desc',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [deletingImage, setDeletingImage] = useState<{ productId: number, imageIndex: number } | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  const [pagination, setPagination] = useState({
    currentPage: 1,
    perPage: 20,
    total: 0,
    lastPage: 1,
    from: 0,
    to: 0
  });
  
  const [showAll, setShowAll] = useState(false);

  const fetchProducts = useCallback(async (page = 1, showAllProducts = showAll) => {
    try {
      setLoading(true);
      setError(null);
      
      const params: any = {};
      
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (filters.category) params.category_id = filters.category;
      if (filters.vendor) params.vendor_id = filters.vendor;
      
      if (filters.status === 'active') {
        params.is_active = '1';
      } else if (filters.status === 'inactive') {
        params.is_active = '0';
      }
      
      if (filters.stockStatus === 'in_stock') {
        params.stock_status = 'in_stock';
      } else if (filters.stockStatus === 'out_of_stock') {
        params.stock_status = 'out_of_stock';
      }
      
      if (filters.minPrice) params.min_price = parseFloat(filters.minPrice);
      if (filters.maxPrice) params.max_price = parseFloat(filters.maxPrice);
      
      params.sort = filters.sort;
      params.order = filters.order;
      
      if (showAllProducts) {
        params.per_page = 1000;
      } else {
        params.page = page;
        params.per_page = pagination.perPage;
      }

      const response = await api.get('/admin/products', { params });
      const data = response.data;
      
      let productsArray: Product[] = [];
      let totalProducts = 0;
      
      if (data && data.data) {
        productsArray = data.data;
        
        if (data.meta) {
          totalProducts = data.meta.total;
          setPagination(prev => ({
            ...prev,
            currentPage: data.meta.current_page,
            perPage: data.meta.per_page,
            total: data.meta.total,
            lastPage: data.meta.last_page,
            from: data.meta.from || 0,
            to: data.meta.to || 0
          }));
        }
      } else if (Array.isArray(data)) {
        productsArray = data;
        totalProducts = data.length;
      }
      
      // Normalize products with proper image URLs
      const normalizedProducts = productsArray.map(product => ({
        ...product,
        gallery: (Array.isArray(product.gallery) ? product.gallery : []).map((item: any) => {
          if (typeof item === 'string') return item;
          if (item && typeof item === 'object' && item.url) return item.url;
          return String(item);
        }),
        thumbnail: product.thumbnail || product.main_image || '',
        main_image: product.main_image || product.thumbnail || '',
        is_active: Boolean(product.is_active),
      }));
      
      setProducts(normalizedProducts);
      
      if (showAllProducts) {
        setPagination(prev => ({
          ...prev,
          total: normalizedProducts.length,
          perPage: normalizedProducts.length,
        }));
      }
      
    } catch (error: any) {
      console.error('Failed to fetch products:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch products';
      setError(errorMessage);
      toast.error(errorMessage);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filters, pagination.perPage, showAll]);

  useEffect(() => {
    fetchProducts(1, showAll);
  }, [fetchProducts]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchProducts(pagination.currentPage, showAll);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, filters, showAll, pagination.currentPage, fetchProducts]);

  const goToPage = (page: number) => {
    if (page < 1 || page > pagination.lastPage) return;
    fetchProducts(page, false);
  };

  const handleShowAll = () => {
    setShowAll(true);
    fetchProducts(1, true);
  };

  const handleShowPaginated = () => {
    setShowAll(false);
    fetchProducts(1, false);
  };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to deactivate this product?')) return;

    try {
      await api.delete(`/admin/products/${id}`);
      setProducts(products.map(p => p.id === id ? { ...p, is_active: false } : p));
      toast.success('Product deactivated successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to deactivate product');
    }
  };

  const handleDeleteGalleryImage = async (productId: number, imageIndex: number) => {
    if (!confirm('Delete this gallery image?')) return;
    
    try {
      setDeletingImage({ productId, imageIndex });
      await api.delete(`/products/${productId}/gallery/${imageIndex}`);
      
      setProducts(products.map(product => {
        if (product.id === productId) {
          const newGallery = [...(product.gallery || [])];
          newGallery.splice(imageIndex, 1);
          return { ...product, gallery: newGallery };
        }
        return product;
      }));
      
      toast.success('Gallery image deleted');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete image');
    } finally {
      setDeletingImage(null);
    }
  };

  const handleFormSubmit = async (formData: FormData) => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    setError(null);
    setUploadProgress(0);
    
    try {
      if (selectedProduct && !formData.has('_method')) {
        formData.append('_method', 'PUT');
      }
      
      setUploadProgress(30);
      
      const endpoint = selectedProduct 
        ? `/admin/products/${selectedProduct.id}`
        : '/admin/products';
      
      const response = await api.post(endpoint, formData, {
        onUploadProgress: (progressEvent) => {
          const total = progressEvent.total || 1;
          const loaded = progressEvent.loaded;
          const percent = Math.round((loaded * 100) / total);
          setUploadProgress(30 + (percent * 0.7));
        }
      });
      
      setUploadProgress(100);
      toast.success(selectedProduct ? 'Product updated!' : 'Product created!');
      
      setTimeout(() => {
        setShowForm(false);
        setSelectedProduct(null);
        fetchProducts(pagination.currentPage, showAll);
      }, 500);
      
    } catch (error: any) {
      console.error('Error:', error);
      
      if (error.response?.status === 422) {
        const errors = error.response.data.errors;
        let errorMessage = 'Validation errors:\n';
        Object.entries(errors).forEach(([field, messages]: [string, any]) => {
          if (Array.isArray(messages)) {
            messages.forEach(msg => errorMessage += `• ${field}: ${msg}\n`);
          }
        });
        toast.error(errorMessage);
        setError(errorMessage);
      } else {
        const message = error.response?.data?.message || error.message || 'Operation failed';
        toast.error(message);
        setError(message);
      }
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const handleBulkUpload = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      await api.post('/admin/products/bulk-upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      toast.success('Products uploaded successfully');
      setShowBulkUpload(false);
      fetchProducts(pagination.currentPage, showAll);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to upload products');
    }
  };

  const exportProducts = async () => {
    try {
      const response = await api.get('/admin/products/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `products_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Export started');
    } catch (error: any) {
      toast.error('Failed to export products');
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setFilters({
      category: '',
      status: '',
      minPrice: '',
      maxPrice: '',
      vendor: '',
      stockStatus: '',
      sort: 'created_at',
      order: 'desc',
    });
    setShowFilters(false);
  };

  // Helper to get image URL
  const getImageUrl = (path: string) => {
    if (!path) return '/images/default-product.png';
    if (path.startsWith('http')) return path;
    if (path.startsWith('/storage/')) return path;
    return `/storage/${path}`;
  };

  // Grid View Component
  const ProductGrid = ({ products, onEdit, onDelete }: any) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product: Product) => (
        <div key={product.id} className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">
          {/* Image Container */}
          <div className="relative h-48 bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
            <img
              src={getImageUrl(product.main_image || product.thumbnail || (product.gallery?.[0]))}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/images/default-product.png';
              }}
            />
            <div className="absolute top-2 right-2 flex gap-1">
              <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                product.is_active 
                  ? 'bg-green-500 text-white' 
                  : 'bg-gray-500 text-white'
              }`}>
                {product.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            {product.discounted_price && (
              <div className="absolute bottom-2 left-2 bg-red-500 text-white px-2 py-1 rounded-lg text-xs font-semibold">
                SALE
              </div>
            )}
          </div>
          
          {/* Content */}
          <div className="p-4">
            <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{product.name}</h3>
            <p className="text-xs text-gray-500 mb-2">SKU: {product.sku}</p>
            
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-lg font-bold text-blue-600">${product.price}</span>
                {product.discounted_price && (
                  <span className="ml-2 text-xs text-gray-400 line-through">${product.discounted_price}</span>
                )}
              </div>
              <div className="text-xs text-gray-500">
                Stock: {product.stock_quantity || 0}
              </div>
            </div>
            
            {/* Gallery Preview */}
            {product.gallery && product.gallery.length > 0 && (
              <div className="flex gap-1 mb-3">
                {product.gallery.slice(0, 3).map((img, idx) => (
                  <img
                    key={idx}
                    src={getImageUrl(img)}
                    alt=""
                    className="w-8 h-8 rounded object-cover border"
                  />
                ))}
                {product.gallery.length > 3 && (
                  <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-xs text-gray-500">
                    +{product.gallery.length - 3}
                  </div>
                )}
              </div>
            )}
            
            {/* Actions */}
            <div className="flex gap-2 pt-3 border-t border-gray-100">
              <button
                onClick={() => onEdit(product)}
                className="flex-1 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => onDelete(product.id)}
                className="flex-1 px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
              >
                {product.is_active ? 'Deactivate' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6 p-4 md:p-6 bg-gradient-to-br from-gray-50 via-white to-gray-50 min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Package className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Products Management</h1>
          </div>
          <p className="text-gray-600">Manage your product catalog, inventory, and pricing</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={exportProducts}
            disabled={products.length === 0}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-all duration-200"
          >
            <Download size={16} className="mr-2" />
            Export
          </button>
          <button
            onClick={() => setShowBulkUpload(true)}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200"
          >
            <Upload size={16} className="mr-2" />
            Bulk Upload
          </button>
          <button
            onClick={() => {
              setSelectedProduct(null);
              setShowForm(true);
            }}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-sm"
          >
            <Plus size={16} className="mr-2" />
            Add Product
          </button>
        </div>
      </div>

      {/* Upload Progress */}
      {uploadProgress > 0 && uploadProgress < 100 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Uploading product...</span>
            <span className="text-sm font-medium text-blue-600">{Math.round(uploadProgress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-blue-600 to-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-gray-500">Processing images, please wait...</p>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products by name, description, or SKU..."
              className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center px-4 py-2 rounded-lg transition-all duration-200 ${
                showFilters 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Filter size={16} className="mr-2" />
              Filters
            </button>
            <div className="flex rounded-lg bg-gray-100 p-1">
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                  viewMode === 'table' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <List size={16} />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                  viewMode === 'grid' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Grid size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-100 animate-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <select
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <select
                value={filters.stockStatus}
                onChange={(e) => setFilters({...filters, stockStatus: e.target.value})}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Stock</option>
                <option value="in_stock">In Stock</option>
                <option value="out_of_stock">Out of Stock</option>
              </select>
              <input
                type="number"
                placeholder="Min Price"
                value={filters.minPrice}
                onChange={(e) => setFilters({...filters, minPrice: e.target.value})}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="number"
                placeholder="Max Price"
                value={filters.maxPrice}
                onChange={(e) => setFilters({...filters, maxPrice: e.target.value})}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={filters.sort}
                onChange={(e) => setFilters({...filters, sort: e.target.value})}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="created_at">Date Created</option>
                <option value="name">Name</option>
                <option value="price">Price</option>
                <option value="stock_quantity">Stock</option>
              </select>
              <div className="flex gap-2">
                <button
                  onClick={() => fetchProducts(1, showAll)}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Apply
                </button>
                <button
                  onClick={resetFilters}
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* View Controls Bar */}
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div className="flex gap-2">
          <button
            onClick={handleShowPaginated}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
              !showAll 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Paginated View
          </button>
          <button
            onClick={handleShowAll}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
              showAll 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Show All ({pagination.total})
          </button>
        </div>
        
        {!showAll && pagination.total > 0 && (
          <div className="text-sm text-gray-600">
            Showing <span className="font-medium">{pagination.from || 1}</span> to{' '}
            <span className="font-medium">{pagination.to || products.length}</span> of{' '}
            <span className="font-medium">{pagination.total}</span> results
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Products Display */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12">
          <div className="flex flex-col items-center justify-center">
            <div className="relative">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <Loader2 className="absolute inset-0 m-auto h-5 w-5 text-blue-600 animate-pulse" />
            </div>
            <p className="mt-4 text-gray-600 font-medium">Loading products...</p>
          </div>
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-500 mb-4">Get started by adding your first product</p>
          <button
            onClick={() => {
              setSelectedProduct(null);
              setShowForm(true);
            }}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            <Plus size={16} className="mr-2" />
            Add Product
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <ProductGrid
          products={products}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gallery</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors duration-200">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={getImageUrl(product.main_image || product.thumbnail)}
                          alt={product.name}
                          className="h-12 w-12 rounded-lg object-cover border"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/images/default-product.png';
                          }}
                        />
                        <div>
                          <div className="font-medium text-gray-900">{product.name}</div>
                          <div className="text-sm text-gray-500 line-clamp-1">{product.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{product.sku}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-gray-900">${product.price}</div>
                      {product.discounted_price && (
                        <div className="text-xs text-gray-400 line-through">${product.discounted_price}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        (product.stock_quantity || 0) > 0 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {(product.stock_quantity || 0)} units
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1">
                        {product.gallery && product.gallery.slice(0, 3).map((img, idx) => (
                          <div key={idx} className="relative group/img">
                            <img
                              src={getImageUrl(img)}
                              alt=""
                              className="h-8 w-8 rounded object-cover border"
                            />
                            <button
                              onClick={() => handleDeleteGalleryImage(product.id, idx)}
                              className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover/img:opacity-100 transition-opacity"
                            >
                              <X size={10} />
                            </button>
                          </div>
                        ))}
                        {product.gallery && product.gallery.length > 3 && (
                          <div className="h-8 w-8 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-500">
                            +{product.gallery.length - 3}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        product.is_active 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {product.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(product)}
                          className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          {product.is_active ? 'Deactivate' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {!showAll && pagination.lastPage > 1 && (
        <div className="flex items-center justify-between bg-white px-4 py-3 rounded-xl shadow-sm border border-gray-100">
          <div className="text-sm text-gray-600">
            Page {pagination.currentPage} of {pagination.lastPage}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => goToPage(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                        : 'hover:bg-gray-100 text-gray-700'
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
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-100">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">
                  {selectedProduct ? 'Edit Product' : 'Add New Product'}
                </h2>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setSelectedProduct(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              <ProductForm
                product={selectedProduct}
                onClose={() => {
                  setShowForm(false);
                  setSelectedProduct(null);
                }}
                onSubmit={handleFormSubmit}
                isSubmitting={isSubmitting}
              />
            </div>
          </div>
        </div>
      )}

      {showBulkUpload && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-100">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">Bulk Upload Products</h2>
                <button
                  onClick={() => setShowBulkUpload(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="p-6">
              <BulkUpload
                onUpload={handleBulkUpload}
                onClose={() => setShowBulkUpload(false)}
              />
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}