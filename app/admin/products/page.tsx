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
  Image as ImageIcon
} from 'lucide-react';
import debounce from 'lodash/debounce';

// Image compression utility - FIXED: Added width parameter to Image constructor
const compressImage = async (file: File, maxWidth: number = 1200, maxSizeKB: number = 500): Promise<File> => {
  return new Promise((resolve, reject) => {
    if (file.size <= maxSizeKB * 1024) {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      // FIX: Pass width parameter to Image constructor
      const img = new Image(maxWidth, maxWidth);
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
        
        let quality = 0.8;
        let attempts = 0;
        const maxAttempts = 5;
        
        const compressIteration = () => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Canvas to Blob conversion failed'));
                return;
              }
              
              const blobSizeKB = blob.size / 1024;
              
              if (blobSizeKB <= maxSizeKB || attempts >= maxAttempts) {
                const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '') + '.jpg', {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                
                console.log(`Compressed ${file.name}: ${(file.size / 1024).toFixed(2)}KB -> ${blobSizeKB.toFixed(2)}KB`);
                resolve(compressedFile);
              } else {
                quality *= 0.85;
                attempts++;
                setTimeout(compressIteration, 0);
              }
            },
            'image/jpeg',
            quality
          );
        };
        
        compressIteration();
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

// Alternative simpler compression function
const compressImageSimple = async (file: File, maxWidth: number = 1200, maxSizeKB: number = 500): Promise<File> => {
  return new Promise((resolve, reject) => {
    if (file.size <= maxSizeKB * 1024) {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      // Create image element
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
        
        // Convert to blob with quality
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

// Use the simple version to avoid Image constructor issues
const compressImageFinal = compressImageSimple;

// Validate image file
const validateImage = (file: File): { valid: boolean; message?: string } => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'];
  
  if (file.size > maxSize) {
    return { 
      valid: false, 
      message: `Image is too large. Maximum size is 10MB. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB` 
    };
  }
  
  if (!validTypes.includes(file.type.toLowerCase())) {
    return { 
      valid: false, 
      message: `Invalid image type. Allowed types: JPEG, PNG, GIF, WebP. Received: ${file.type}` 
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
  
  const [pagination, setPagination] = useState({
    currentPage: 1,
    perPage: 20,
    total: 0,
    lastPage: 1,
    from: 0,
    to: 0
  });
  
  const [showAll, setShowAll] = useState(false);

  // Helper function to extract path from URL
  const extractPathFromUrl = (url: string): string => {
    if (!url) return '';
    if (!url.includes('http')) return url; // Already a path
    
    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname;
      // Remove leading /storage/ or / if present
      return path.replace(/^\/storage\//, '').replace(/^\//, '');
    } catch (e) {
      console.error('Failed to parse URL:', url, e);
      return url;
    }
  };

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

      console.log('Fetching products with params:', params);
      
      // Use the admin endpoint
      const response = await api.get('/admin/products', { params });
      
      const data = response.data;
      console.log('Admin products response:', data);
      
      let productsArray: Product[] = [];
      let totalProducts = 0;
      
      if (data && data.data) {
        // Laravel paginated response
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
        // Non-paginated response
        productsArray = data;
        totalProducts = data.length;
        setPagination(prev => ({
          ...prev,
          total: data.length,
          perPage: data.length,
          currentPage: 1,
          lastPage: 1,
          from: 1,
          to: data.length
        }));
      } else {
        console.warn('Unexpected API response structure:', data);
        productsArray = [];
      }
      
      // Normalize products
      const normalizedProducts = productsArray.map(product => {
  // First normalize the gallery
  const gallery = (Array.isArray(product.gallery) ? product.gallery : []).map((item: any) => {
    if (typeof item === 'string') return item;
    if (item && typeof item === 'object' && item.url) return item.url;
    return String(item);
  });
  
  return {
    ...product,
    gallery: gallery,
    thumbnail: product.thumbnail || '',
    main_image: product.main_image || product.thumbnail || '',
    gallery_urls: product.gallery_urls || gallery,
    // Ensure is_active is boolean
    is_active: Boolean(product.is_active),
  };
});
      
      setProducts(normalizedProducts);
      
      if (showAllProducts) {
        setPagination(prev => ({
          ...prev,
          total: normalizedProducts.length,
          perPage: normalizedProducts.length,
          currentPage: 1,
          lastPage: 1,
          from: 1,
          to: normalizedProducts.length
        }));
      }
      
    } catch (error: any) {
      console.error('Failed to fetch products:', error);
      
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Failed to fetch products';
      setError(errorMessage);
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

  const debouncedSearch = useCallback(
    debounce((value: string) => {
      fetchProducts(1, showAll);
    }, 500),
    [fetchProducts, showAll]
  );

  useEffect(() => {
    if (searchQuery !== '') {
      debouncedSearch(searchQuery);
    }
  }, [searchQuery, debouncedSearch]);

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to deactivate this product? It will no longer be visible to customers.')) return;

    try {
      await api.delete(`/admin/products/${id}`);
      setProducts(products.map(p => 
        p.id === id ? { ...p, is_active: false } : p
      ));
      alert('Product deactivated successfully');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to deactivate product');
    }
  };

  // New function to delete gallery image
  const handleDeleteGalleryImage = async (productId: number, imageIndex: number) => {
    if (!confirm('Are you sure you want to delete this gallery image?')) return;
    
    try {
      setDeletingImage({ productId, imageIndex });
      await api.delete(`/products/${productId}/gallery/${imageIndex}`);
      
      // Update local state
      setProducts(products.map(product => {
        if (product.id === productId) {
          const newGallery = [...(product.gallery || [])];
          newGallery.splice(imageIndex, 1);
          return { ...product, gallery: newGallery };
        }
        return product;
      }));
      
      alert('Gallery image deleted successfully');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete gallery image');
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
    console.log('=== Starting Product Update ===');
    
    // Debug: Log the incoming FormData
    console.log('=== Incoming FormData Contents ===');
    for (let [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(`${key}: File (${value.name}, ${value.size} bytes, ${value.type})`);
      } else if (typeof value === 'string' && value.length > 50) {
        console.log(`${key}: "${value.substring(0, 50)}..." [${value.length} chars]`);
      } else {
        console.log(`${key}: "${value}"`);
      }
    }
    
    // Check if we have the required data
    const name = formData.get('name');
    const categoryId = formData.get('category_id');
    const description = formData.get('description');
    const sku = formData.get('sku');
    const attributes = formData.get('attributes');
    
    // Type-safe check for string values
    const isString = (value: FormDataEntryValue | null): value is string => {
      return typeof value === 'string';
    };
    
    console.log('Required fields check:', {
      name: name ? `"${isString(name) ? name : 'NOT A STRING'}" (${typeof name})` : 'MISSING',
      category_id: categoryId ? `"${isString(categoryId) ? categoryId : 'NOT A STRING'}" (${typeof categoryId})` : 'MISSING',
      description: description ? `"${isString(description) ? description.substring(0, 30) : 'NOT A STRING'}..."` : 'MISSING',
      sku: sku ? `"${isString(sku) ? sku : 'NOT A STRING'}"` : 'MISSING',
      attributes: attributes ? `"${isString(attributes) ? attributes : 'NOT A STRING'}"` : 'MISSING'
    });
    
    // If we're missing required data, the FormData wasn't passed correctly
    if (!name || !categoryId || !description || !sku || !attributes) {
      throw new Error('FormData is missing required fields. Check ProductForm component.');
    }
    
    // Also check that they are strings
    if (!isString(name) || !isString(categoryId) || !isString(description) || !isString(sku) || !isString(attributes)) {
      throw new Error('FormData contains non-string values for required fields.');
    }
    
    // For update, ensure _method=PUT is present
    if (selectedProduct && !formData.has('_method')) {
      formData.append('_method', 'PUT');
      console.log('Added _method=PUT for update');
    }
    
    setUploadProgress(30);
    
    // Send request
    const endpoint = selectedProduct 
      ? `/admin/products/${selectedProduct.id}`
      : '/admin/products';
    
    console.log(`Sending to: ${endpoint}`);
    
    const response = await api.post(endpoint, formData, {
      onUploadProgress: (progressEvent) => {
        const total = progressEvent.total || 1;
        const loaded = progressEvent.loaded;
        const percent = Math.round((loaded * 100) / total);
        setUploadProgress(30 + (percent * 0.7));
      }
    });
    
    console.log('Success! Response:', response.data);
    setUploadProgress(100);
    
    alert(selectedProduct ? 'Product updated successfully!' : 'Product created successfully!');
    
    // Close form and refresh
    setTimeout(() => {
      setShowForm(false);
      setSelectedProduct(null);
      fetchProducts(pagination.currentPage, showAll);
    }, 500);
    
  } catch (error: any) {
    console.error('=== ERROR DETAILS ===');
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Full response:', error.response.data);
      
      if (error.response.status === 422) {
        const errors = error.response.data.errors;
        
        if (errors) {
          console.error('Validation errors:', errors);
          
          let errorMessage = 'Please fix the following errors:\n\n';
          Object.entries(errors).forEach(([field, messages]: [string, any]) => {
            if (Array.isArray(messages)) {
              messages.forEach(msg => {
                errorMessage += `• ${field}: ${msg}\n`;
              });
            } else {
              errorMessage += `• ${field}: ${messages}\n`;
            }
          });
          
          alert(errorMessage);
          setError(errorMessage);
        } else {
          alert('Validation failed. Please check all fields.');
          setError('Validation failed');
        }
      } else {
        const message = error.response.data?.message || `Error ${error.response.status}`;
        alert(message);
        setError(message);
      }
    } else if (error.request) {
      console.error('No response:', error.request);
      alert('No response from server. Please check your connection.');
      setError('No server response');
    } else {
      console.error('Error:', error.message);
      alert(`Error: ${error.message}`);
      setError(error.message);
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
      
      const response = await api.post('/admin/products/bulk-upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      alert('Products uploaded successfully');
      setShowBulkUpload(false);
      fetchProducts(pagination.currentPage, showAll);
    } catch (error: any) {
      console.error('Bulk upload error:', error);
      
      if (error.response?.status === 422) {
        const validationErrors = error.response.data.errors;
        let errorMessage = 'Bulk upload failed:\n\n';
        
        if (Array.isArray(validationErrors)) {
          validationErrors.forEach((err: string) => {
            errorMessage += `• ${err}\n`;
          });
        } else {
          errorMessage = error.response.data.message || 'Failed to upload products';
        }
        
        alert(errorMessage);
      } else {
        alert(error.response?.data?.message || 'Failed to upload products');
      }
    }
  };

  const exportProducts = async () => {
    try {
      const response = await api.get('/admin/products/export', {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `products_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to export products');
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
  };

  // Update ProductTable to include gallery management
  const EnhancedProductTable = ({ products, onEdit, onDelete, onDeleteGalleryImage }: any) => {
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gallery</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map((product: Product) => (
              <tr key={product.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.id}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <img 
                    src={product.main_image || '/images/default-product.png'} 
                    alt={product.name}
                    className="h-12 w-12 object-cover rounded"
                  />
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">{product.name}</div>
                  <div className="text-sm text-gray-500 truncate max-w-xs">{product.description?.substring(0, 50)}...</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.sku}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ${product.price}
                  {product.discounted_price && (
                    <span className="ml-2 text-red-600 line-through">${product.discounted_price}</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.stock_quantity}</td>
                <td className="px-6 py-4">
                  <div className="flex gap-1">
                    {Array.isArray(product.gallery) && product.gallery.slice(0, 3).map((img: string, index: number) => (
                      <div key={index} className="relative">
                        <img 
                          src={img.includes('http') ? img : `/storage/${img}`} 
                          alt={`Gallery ${index + 1}`}
                          className="h-10 w-10 object-cover rounded border"
                        />
                        <button
                          onClick={() => onDeleteGalleryImage(product.id, index)}
                          disabled={deletingImage?.productId === product.id && deletingImage?.imageIndex === index}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 disabled:opacity-50"
                          style={{ width: '16px', height: '16px', fontSize: '10px' }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    {Array.isArray(product.gallery) && product.gallery.length > 3 && (
                      <div className="h-10 w-10 bg-gray-100 rounded border flex items-center justify-center text-xs text-gray-500">
                        +{product.gallery.length - 3}
                      </div>
                    )}
                    {(!product.gallery || product.gallery.length === 0) && (
                      <span className="text-xs text-gray-500">No gallery</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${product.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {product.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => onEdit(product)}
                    className="text-blue-600 hover:text-blue-900 mr-3"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(product.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    {product.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products Management</h1>
          <p className="text-gray-600">Manage your product catalog</p>
        </div>
        <div className="flex flex-wrap gap-3 mt-4 md:mt-0">
          <button
            onClick={exportProducts}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={products.length === 0}
          >
            <Download size={16} className="mr-2" />
            Export
          </button>
          <button
            onClick={() => setShowBulkUpload(true)}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Upload size={16} className="mr-2" />
            Bulk Upload
          </button>
          <button
            onClick={() => {
              setSelectedProduct(null);
              setShowForm(true);
            }}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700"
          >
            <Plus size={16} className="mr-2" />
            Add Product
          </button>
        </div>
      </div>

      {/* Upload Progress Bar */}
      {uploadProgress > 0 && uploadProgress < 100 && (
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Uploading...</span>
            <span className="text-sm font-medium text-blue-600">{Math.round(uploadProgress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Compressing and uploading images... Please wait.
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="p-4 bg-white rounded-lg shadow">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search Products
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, description, SKU..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stock Status
            </label>
            <select
              value={filters.stockStatus}
              onChange={(e) => setFilters({...filters, stockStatus: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Stock</option>
              <option value="in_stock">In Stock</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sort By
            </label>
            <select
              value={filters.sort}
              onChange={(e) => setFilters({...filters, sort: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="created_at">Date Created</option>
              <option value="name">Name</option>
              <option value="price">Price</option>
              <option value="stock_quantity">Stock Quantity</option>
              <option value="sold_count">Sold Count</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Order
            </label>
            <select
              value={filters.order}
              onChange={(e) => setFilters({...filters, order: e.target.value as 'asc' | 'desc'})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Min Price
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={filters.minPrice}
              onChange={(e) => setFilters({...filters, minPrice: e.target.value})}
              placeholder="$0.00"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Price
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={filters.maxPrice}
              onChange={(e) => setFilters({...filters, maxPrice: e.target.value})}
              placeholder="$1000.00"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category ID
            </label>
            <input
              type="text"
              value={filters.category}
              onChange={(e) => setFilters({...filters, category: e.target.value})}
              placeholder="Category ID"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vendor ID
            </label>
            <input
              type="text"
              value={filters.vendor}
              onChange={(e) => setFilters({...filters, vendor: e.target.value})}
              placeholder="Vendor ID"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* View Controls */}
        <div className="flex flex-wrap justify-between items-center mt-4 gap-3">
          <div className="flex gap-3">
            <button
              onClick={() => fetchProducts(pagination.currentPage, showAll)}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              <Filter size={16} className="mr-2" />
              {loading ? 'Loading...' : 'Apply Filters'}
            </button>
            <button
              onClick={resetFilters}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <RefreshCw size={16} className="mr-2" />
              Reset
            </button>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handleShowAll}
              className={`px-4 py-2 text-sm font-medium rounded-lg ${showAll 
                ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'}`}
            >
              Show All ({pagination.total})
            </button>
            <button
              onClick={handleShowPaginated}
              className={`px-4 py-2 text-sm font-medium rounded-lg ${!showAll 
                ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'}`}
            >
              Paginated View
            </button>
          </div>
        </div>
      </div>

      {/* Pagination Controls */}
      {!showAll && pagination.lastPage > 1 && (
        <div className="flex items-center justify-between bg-white px-4 py-3 rounded-lg shadow">
          <div className="text-sm text-gray-700">
            Showing <span className="font-medium">{pagination.from || 1}</span> to{' '}
            <span className="font-medium">{pagination.to || products.length}</span> of{' '}
            <span className="font-medium">{pagination.total}</span> results
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => goToPage(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
              className="px-3 py-1 rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={20} />
            </button>
            
            <div className="flex items-center space-x-1">
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
                    className={`px-3 py-1 rounded-md ${
                      pagination.currentPage === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
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
              className="px-3 py-1 rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <Loader2 className="animate-spin h-12 w-12 text-blue-600 mb-4" />
            <p className="text-gray-600">Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-2">No products found</p>
            <button
              onClick={() => {
                setSelectedProduct(null);
                setShowForm(true);
              }}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
            >
              <Plus size={16} className="mr-2" />
              Add your first product
            </button>
          </div>
        ) : (
          <EnhancedProductTable
            products={products}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onDeleteGalleryImage={handleDeleteGalleryImage}
          />
        )}
        
        {products.length > 0 && (
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">
                Showing {products.length} of {pagination.total} products
                {showAll ? ' (All products)' : ` (Page ${pagination.currentPage} of ${pagination.lastPage})`}
              </span>
              {!showAll && (
                <div className="text-sm text-gray-600">
                  Per page: 
                  <select 
                    value={pagination.perPage}
                    onChange={(e) => {
                      setPagination(prev => ({...prev, perPage: parseInt(e.target.value)}));
                      fetchProducts(1, false);
                    }}
                    className="ml-2 border border-gray-300 rounded px-2 py-1"
                  >
                    <option value="10">10</option>
                    <option value="20">20</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {selectedProduct ? 'Edit Product' : 'Add New Product'}
                </h2>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setSelectedProduct(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  <span className="text-2xl">×</span>
                </button>
              </div>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Bulk Upload Products</h2>
                <button
                  onClick={() => setShowBulkUpload(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <span className="text-2xl">×</span>
                </button>
              </div>
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