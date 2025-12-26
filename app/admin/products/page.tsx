'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
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
  ChevronRight
} from 'lucide-react';
import debounce from 'lodash/debounce';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  discounted_price?: number;
  stock_quantity: number;
  category_id?: number;
  vendor_id?: number;
  sku: string;
  thumbnail: string;
  gallery: string[];
  attributes?: any;
  weight?: number;
  unit?: string;
  is_featured: boolean;
  is_active: boolean;
  rating?: number;
  sold_count?: number;
  views?: number;
  created_at: string;
  updated_at: string;
  category?: {
    id: number;
    name: string;
  };
  vendor?: {
    id: number;
    name: string;
    email: string;
  };
}

// Image compression utility
const compressImage = async (file: File, maxWidth: number = 1200, maxSizeKB: number = 500): Promise<File> => {
  return new Promise((resolve, reject) => {
    // If file is already small, return as-is
    if (file.size <= maxSizeKB * 1024) {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        
        // Calculate new dimensions while maintaining aspect ratio
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
        
        // Draw image with higher quality for downscaling
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
        
        // Determine quality based on target size
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
                // Reduce quality and try again
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
    stockStatus: '', // FIXED: Changed from min_stock/max_stock to stock_status
    sort: 'created_at',
    order: 'desc' as 'asc' | 'desc',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  
  // NEW: Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    perPage: 100, // Increased from 20 to 100
    total: 0,
    lastPage: 1,
    from: 0,
    to: 0
  });
  
  // NEW: Show all products state
  const [showAll, setShowAll] = useState(true);

  // Fetch products with proper error handling - UPDATED
// Fetch products with proper error handling - UPDATED for admin endpoint
const fetchProducts = useCallback(async (page = 1, showAllProducts = showAll) => {
  try {
    setLoading(true);
    setError(null);
    
    // Build query params
    const params: any = {};
    
    if (searchQuery.trim()) params.search = searchQuery.trim();
    if (filters.category) params.category_id = filters.category;
    if (filters.vendor) params.vendor_id = filters.vendor;
    
    // Status filter
    if (filters.status === 'active') {
      params.is_active = '1';
    } else if (filters.status === 'inactive') {
      params.is_active = '0';
    }
    
    // FIXED: Stock status filter - use stock_status parameter
    if (filters.stockStatus === 'in_stock') {
      params.stock_status = 'in_stock';
    } else if (filters.stockStatus === 'out_of_stock') {
      params.stock_status = 'out_of_stock';
    }
    
    if (filters.minPrice) params.min_price = parseFloat(filters.minPrice);
    if (filters.maxPrice) params.max_price = parseFloat(filters.maxPrice);
    
    // Sort parameters
    params.sort = filters.sort;
    params.order = filters.order;
    
    // Set pagination - fetch ALL products or paginated
    if (showAllProducts) {
      params.per_page = 1000; // Fetch all products
    } else {
      params.page = page;
      params.per_page = pagination.perPage;
    }

    console.log('Fetching products with params:', params);
    
    const response = await api.admin.getProducts(params);
    
    // Handle admin endpoint response structure
    const data = response.data;
    console.log('Admin products response:', data);
    
    let productsArray: Product[] = [];
    let totalProducts = 0;
    
    if (data && data.products && data.products.data) {
      // Admin endpoint returns { products: { data: [], ...pagination } }
      productsArray = data.products.data;
      const paginationData = data.products;
      
      // Update pagination info
      totalProducts = paginationData.total;
      setPagination(prev => ({
        ...prev,
        currentPage: paginationData.current_page,
        perPage: paginationData.per_page,
        total: paginationData.total,
        lastPage: paginationData.last_page,
        from: paginationData.from || 0,
        to: paginationData.to || 0
      }));
      
      console.log(`Fetched ${productsArray.length} products, Total: ${totalProducts}, Page: ${paginationData.current_page}/${paginationData.last_page}`);
    } else if (data && data.data) {
      // Fallback for regular products endpoint structure
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
      } else if (data.total !== undefined) {
        totalProducts = data.total;
        setPagination(prev => ({
          ...prev,
          currentPage: page,
          total: data.total,
          lastPage: Math.ceil(data.total / params.per_page),
          from: (page - 1) * params.per_page + 1,
          to: Math.min(page * params.per_page, data.total)
        }));
      }
    } else if (Array.isArray(data)) {
      // Non-paginated response
      productsArray = data;
      totalProducts = data.length;
      console.log(`Fetched ${data.length} products (non-paginated)`);
    } else {
      console.warn('Unexpected API response structure:', data);
      productsArray = [];
    }
    
    // Ensure all products have proper gallery arrays
    const normalizedProducts = productsArray.map(product => ({
      ...product,
      gallery: Array.isArray(product.gallery) ? product.gallery : [],
      thumbnail: product.thumbnail || '/images/default-product.png'
    }));
    
    setProducts(normalizedProducts);
    
    // If showing all products, update pagination totals
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
    console.error('Error response:', error.response);
    
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


// Initial fetch - show ALL products by default
useEffect(() => {
  fetchProducts(1, true);
}, [fetchProducts]); // Add fetchProducts to dependency array



 // Re-fetch when filters change
useEffect(() => {
  const timeoutId = setTimeout(() => {
    fetchProducts(pagination.currentPage, showAll);
  }, 300);
  
  return () => clearTimeout(timeoutId);
}, [searchQuery, filters, showAll, pagination.currentPage, fetchProducts]);




  // Pagination handlers
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

  // Debounced search
  const debouncedSearch = useCallback(
    debounce((value: string) => {
      fetchProducts(1, showAll);
    }, 500),
    [fetchProducts, showAll]
  );

  // Apply search when query changes
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
      await api.admin.deleteProduct(id);
      // Update local state
      setProducts(products.map(p => 
        p.id === id ? { ...p, is_active: false } : p
      ));
      alert('Product deactivated successfully');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to deactivate product');
    }
  };

  const handleFormSubmit = async (formData: any) => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    setError(null);
    setUploadProgress(0);
    
    try {
      console.log('Form data received:', formData);
      
      // Validate discounted price
      const price = parseFloat(formData.price) || 0;
      const discountedPrice = parseFloat(formData.discounted_price);
      
      if (!isNaN(discountedPrice) && discountedPrice >= price) {
        alert('Discounted price must be less than regular price');
        setIsSubmitting(false);
        return;
      }
      
      // Create FormData
      const data = new FormData();
      
      // Helper function to append fields with proper type checking
      const appendField = (key: string, value: any) => {
        if (value !== undefined && value !== null && value !== '') {
          if (typeof value === 'boolean') {
            data.append(key, value ? '1' : '0');
          } else if (typeof value === 'number') {
            data.append(key, value.toString());
          } else if (typeof value === 'object' && !(value instanceof File)) {
            // Handle attributes properly
            if (key === 'attributes') {
              try {
                if (typeof value === 'string') {
                  const parsed = JSON.parse(value);
                  if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
                    data.append(key, JSON.stringify(parsed));
                  }
                } else if (value && typeof value === 'object' && Object.keys(value).length > 0) {
                  data.append(key, JSON.stringify(value));
                }
              } catch (e) {
                console.warn('Invalid attributes format:', value);
              }
            } else {
              data.append(key, JSON.stringify(value));
            }
          } else if (typeof value === 'string') {
            data.append(key, value.trim());
          } else {
            data.append(key, value);
          }
        }
      };
      
      // Helper function to check if a value is not empty
      const hasValue = (value: any): boolean => {
        if (value === undefined || value === null) return false;
        if (typeof value === 'string') return value.trim() !== '';
        if (typeof value === 'number') return !isNaN(value);
        return true;
      };
      
      // Required fields (based on Laravel validation)
      appendField('name', formData.name);
      appendField('description', formData.description);
      appendField('price', price);
      appendField('stock_quantity', parseInt(formData.stock_quantity) || 0);
      appendField('category_id', parseInt(formData.category_id));
      
      // Handle SKU - make sure it's unique
      if (hasValue(formData.sku)) {
        appendField('sku', formData.sku);
      } else {
        // Generate a unique SKU
        const uniqueSku = `PROD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        appendField('sku', uniqueSku);
      }
      
      // Optional fields with proper handling
      if (hasValue(formData.discounted_price)) {
        const discounted = parseFloat(formData.discounted_price);
        if (!isNaN(discounted) && discounted > 0 && discounted < price) {
          appendField('discounted_price', discounted);
        }
      }
      
      appendField('is_featured', formData.is_featured !== undefined ? formData.is_featured : false);
      appendField('is_active', formData.is_active !== undefined ? formData.is_active : true);
      
      // Additional optional fields
      if (hasValue(formData.min_stock_threshold)) {
        appendField('min_stock_threshold', parseInt(formData.min_stock_threshold));
      }
      
      if (hasValue(formData.barcode)) {
        appendField('barcode', formData.barcode);
      }
      
      if (hasValue(formData.weight)) {
        appendField('weight', parseFloat(formData.weight));
      }
      
      if (hasValue(formData.unit)) {
        appendField('unit', formData.unit);
      }
      
      // Handle attributes field - Laravel expects array or null
      if (formData.attributes && formData.attributes !== '{}') {
        try {
          const attributes = typeof formData.attributes === 'string' 
            ? JSON.parse(formData.attributes) 
            : formData.attributes;
          
          if (attributes && typeof attributes === 'object' && Object.keys(attributes).length > 0) {
            appendField('attributes', attributes);
          }
        } catch (e) {
          console.warn('Invalid attributes format:', formData.attributes);
        }
      }
      
      if (hasValue(formData.vendor_id)) {
        appendField('vendor_id', parseInt(formData.vendor_id));
      }
      
      // Handle thumbnail (main image)
      let hasThumbnail = false;
      if (formData.thumbnail) {
        console.log('Processing thumbnail:', formData.thumbnail);
        
        let thumbnailFile: File | null = null;
        
        if (formData.thumbnail instanceof File) {
          thumbnailFile = formData.thumbnail;
        } else if (typeof formData.thumbnail === 'string' && formData.thumbnail.startsWith('blob:')) {
          try {
            const response = await fetch(formData.thumbnail);
            const blob = await response.blob();
            const fileName = `thumbnail-${Date.now()}.jpg`;
            thumbnailFile = new File([blob], fileName, { type: 'image/jpeg' });
          } catch (error) {
            console.error('Failed to process thumbnail:', error);
            alert('Failed to process main image. Please try uploading again.');
            setIsSubmitting(false);
            return;
          }
        }
        
        if (thumbnailFile) {
          // Validate thumbnail
          const validation = validateImage(thumbnailFile);
          if (!validation.valid) {
            alert(validation.message);
            setIsSubmitting(false);
            return;
          }
          
          try {
            // Compress thumbnail to meet Laravel's 2MB limit
            console.log('Compressing thumbnail...');
            const compressedThumbnail = await compressImage(thumbnailFile, 800, 2000); // Max 800px width, 2MB
            data.append('thumbnail', compressedThumbnail);
            hasThumbnail = true;
            setUploadProgress(20);
            console.log('Thumbnail appended:', compressedThumbnail.name);
          } catch (error) {
            console.error('Failed to compress thumbnail:', error);
            // Fall back to original if compression fails
            data.append('thumbnail', thumbnailFile);
            hasThumbnail = true;
            setUploadProgress(20);
            console.log('Original thumbnail appended:', thumbnailFile.name);
          }
        } else if (typeof formData.thumbnail === 'string' && !selectedProduct) {
          // For existing thumbnails when editing, skip if it's already a URL
          console.log('Using existing thumbnail URL');
          hasThumbnail = true;
        }
      }
      
      // Handle gallery images - limit to 5 as per Laravel validation
      if (formData.gallery && formData.gallery.length > 0) {
        console.log('Processing gallery images:', formData.gallery.length);
        
        let galleryIndex = 0;
        let processedCount = 0;
        const totalGalleryImages = Math.min(formData.gallery.length, 5); // Limit to 5
        
        for (let i = 0; i < totalGalleryImages; i++) {
          const galleryImage = formData.gallery[i];
          
          // Skip existing images in update mode (URLs)
          if (selectedProduct && typeof galleryImage === 'string' && !galleryImage.startsWith('blob:')) {
            continue;
          }
          
          let galleryFile: File | null = null;
          
          if (galleryImage instanceof File) {
            galleryFile = galleryImage;
          } else if (typeof galleryImage === 'string' && galleryImage.startsWith('blob:')) {
            try {
              const response = await fetch(galleryImage);
              const blob = await response.blob();
              const fileName = `gallery-${i}-${Date.now()}.jpg`;
              galleryFile = new File([blob], fileName, { type: 'image/jpeg' });
            } catch (error) {
              console.error(`Failed to process gallery image ${i}:`, error);
              continue; // Skip this image but continue with others
            }
          }
          
          if (galleryFile) {
            // Validate gallery image
            const validation = validateImage(galleryFile);
            if (!validation.valid) {
              console.warn(`Gallery image ${i} validation failed:`, validation.message);
              continue;
            }
            
            try {
              // Compress gallery image to meet Laravel's 2MB limit
              console.log(`Compressing gallery image ${i}...`);
              const compressedGallery = await compressImage(galleryFile, 1200, 2000); // Max 1200px width, 2MB
              data.append(`gallery[${galleryIndex}]`, compressedGallery);
              galleryIndex++;
              console.log(`Gallery image ${i} appended:`, compressedGallery.name);
            } catch (error) {
              console.error(`Failed to compress gallery image ${i}:`, error);
              // Fall back to original
              data.append(`gallery[${galleryIndex}]`, galleryFile);
              galleryIndex++;
              console.log(`Original gallery image ${i} appended:`, galleryFile.name);
            }
          }
          
          processedCount++;
          // Update progress based on gallery processing
          setUploadProgress(20 + (processedCount / totalGalleryImages) * 50);
        }
        console.log(`Total gallery images appended: ${galleryIndex}`);
      } else if (selectedProduct) {
        // For update mode, explicitly send empty array if no gallery
        data.append('gallery', '[]');
      }
      
      // Validate we have required thumbnail for new products
      if (!selectedProduct && !hasThumbnail) {
        alert('Please upload a main product image (thumbnail).');
        setIsSubmitting(false);
        return;
      }
      
      // Debug FormData - but only show summary to avoid large logs
      console.log('FormData entries summary:');
      let totalSize = 0;
      for (let [key, value] of (data as any).entries()) {
        if (value instanceof File) {
          console.log(`${key}: File - ${value.name} (${(value.size / 1024).toFixed(2)}KB)`);
          totalSize += value.size;
        } else if (typeof value === 'string' && value.length > 100) {
          console.log(`${key}: [String length ${value.length}]`);
        } else {
          console.log(`${key}:`, value);
        }
      }
      console.log(`Total FormData size: ${(totalSize / 1024 / 1024).toFixed(2)}MB`);
      
      // Set final progress before upload
      setUploadProgress(80);
      
      let response;
      const headers = { 
        'Content-Type': 'multipart/form-data',
        'Accept': 'application/json'
      };
      
      if (selectedProduct) {
        // Update product - use POST with _method=PUT for Laravel
        const updateData = new FormData();
        updateData.append('_method', 'PUT');
        
        for (let [key, value] of (data as any).entries()) {
          updateData.append(key, value);
        }
        
        response = await api.post(`/admin/products/${selectedProduct.id}`, updateData, {
          headers,
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
            setUploadProgress(80 + (percentCompleted * 0.2)); // Last 20% for upload
          }
        }).catch(error => {
          console.log('Full update error:', error);
          console.log('Update error response:', error.response?.data);
          throw error;
        });
        
        console.log('Update response:', response.data);
        alert('Product updated successfully');
      } else {
        // Create product
        response = await api.post('/admin/products', data, {
          headers,
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
            setUploadProgress(80 + (percentCompleted * 0.2)); // Last 20% for upload
          }
        }).catch(error => {
          console.log('Full create error:', error);
          console.log('Create error response:', error.response?.data);
          throw error;
        });
        
        console.log('Create response:', response.data);
        alert('Product created successfully');
      }
      
      setUploadProgress(100);
      setTimeout(() => {
        setShowForm(false);
        setSelectedProduct(null);
        fetchProducts(pagination.currentPage, showAll);
      }, 500);
      
    } catch (error: any) {
      console.error('Form submission error:', error);
      console.error('Error response data:', error.response?.data);
      
      if (error.response?.status === 413) {
        const errorMessage = 'The data you are trying to upload is too large. Please reduce image sizes or upload fewer images.';
        alert(errorMessage);
        setError(errorMessage);
      } else if (error.response?.status === 422) {
        const validationErrors = error.response.data.errors;
        console.log('Full validation errors:', validationErrors);
        
        let errorMessage = 'Please fix the following errors:\n\n';
        
        if (validationErrors) {
          Object.keys(validationErrors).forEach(field => {
            if (Array.isArray(validationErrors[field])) {
              errorMessage += `• ${field}: ${validationErrors[field].join(', ')}\n`;
            }
          });
        } else {
          errorMessage = error.response.data.message || 'Validation failed';
        }
        
        alert(errorMessage);
        setError(errorMessage);
      } else if (error.response?.data?.message) {
        alert(error.response.data.message);
        setError(error.response.data.message);
      } else if (error.message) {
        alert(error.message);
        setError(error.message);
      } else {
        alert('Failed to save product');
        setError('Failed to save product');
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
      
      const response = await api.admin.bulkUploadProducts?.(formData);
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
      const response = await api.admin.exportProducts?.();
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
      stockStatus: '', // Fixed: use stockStatus instead of min_stock/max_stock
      sort: 'created_at',
      order: 'desc',
    });
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

        {/* NEW: View Controls */}
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

      {/* Pagination Controls (Only show when not showing all) */}
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
          <ProductTable
            products={products}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
        
        {/* Show total count at bottom */}
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
                    <option value="20">20</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                    <option value="200">200</option>
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
                onClose={() => setShowBulkUpload(false)}
                onUpload={handleBulkUpload}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}