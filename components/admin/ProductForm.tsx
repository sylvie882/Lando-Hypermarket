'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, Image as ImageIcon, Loader2, AlertCircle, Camera, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';

interface ProductFormProps {
  product?: any;
  onClose: () => void;
  onSubmit: (data: any) => void;
  isSubmitting?: boolean;
}

export default function ProductForm({ product, onClose, onSubmit, isSubmitting }: ProductFormProps) {
  const [formValues, setFormValues] = useState({
    name: '',
    description: '',
    price: '',
    discounted_price: '',
    stock_quantity: '',
    min_stock_threshold: '10',
    category_id: '',
    vendor_id: '',
    sku: '',
    barcode: '',
    weight: '',
    unit: 'piece',
    attributes: '{}',
    is_featured: false,
    is_active: true,
  });

  const [categories, setCategories] = useState<any[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [thumbnail, setThumbnail] = useState<File | string | null>(null);
  const [gallery, setGallery] = useState<(File | string)[]>([]);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const [galleryToDelete, setGalleryToDelete] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  
  const API_BASE_URL = 'https://api.hypermarket.co.ke';
  const STORAGE_BASE_URL = 'https://api.hypermarket.co.ke/storage';

  // Initialize form with product data if editing
  useEffect(() => {
    fetchCategories();
    
    if (product) {
      console.log('Editing product:', product);
      setFormValues({
        name: product.name || '',
        description: product.description || '',
        price: product.price?.toString() || '',
        discounted_price: product.discounted_price?.toString() || '',
        stock_quantity: product.stock_quantity?.toString() || '0',
        min_stock_threshold: product.min_stock_threshold?.toString() || '10',
        category_id: product.category_id?.toString() || '',
        vendor_id: product.vendor_id?.toString() || '',
        sku: product.sku || '',
        barcode: product.barcode || '',
        weight: product.weight?.toString() || '',
        unit: product.unit || 'piece',
        attributes: product.attributes ? JSON.stringify(product.attributes) : '{}',
        is_featured: product.is_featured || false,
        is_active: product.is_active !== undefined ? product.is_active : true,
      });

      // Set thumbnail if it exists
      if (product.thumbnail) {
        const thumbUrl = generateImageUrl(product.thumbnail);
        setThumbnail(product.thumbnail);
        setThumbnailPreview(thumbUrl);
      } else {
        // Set default image for NULL thumbnails
        setThumbnailPreview('/images/default-product.png');
      }

      // Set gallery if it exists
      if (product.gallery && Array.isArray(product.gallery)) {
        const galleryItems = product.gallery.filter((item: any) => item && item !== '');
        setGallery(galleryItems);
        
        // Generate previews for gallery
        const previews = galleryItems.map((img: string) => {
          return generateImageUrl(img);
        }).filter(Boolean); // Filter out empty/null images
        setGalleryPreviews(previews);
      }
    } else {
      // For new products, set default preview
      setThumbnailPreview('/images/default-product.png');
    }
  }, [product]);

  // Helper function to generate image URL
  const generateImageUrl = (imagePath: string): string => {
    if (!imagePath || imagePath === 'NULL' || imagePath === 'null' || imagePath === '') {
      return '/images/default-product.png';
    }
    
    if (imagePath.startsWith('http') || imagePath.startsWith('https')) {
      return imagePath;
    } else if (imagePath.startsWith('data:')) {
      return imagePath;
    } else if (imagePath.startsWith('/')) {
      return `${API_BASE_URL}${imagePath}`;
    } else {
      // Handle relative paths
      const cleanPath = imagePath.replace(/^storage\//, '');
      return `${STORAGE_BASE_URL}/${cleanPath}`;
    }
  };

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      console.log('Fetching categories...');
      
      const response = await api.categories.getAll();
      console.log('Categories API response:', response);
      
      // Handle different response structures
      let categoriesData = [];
      
      if (response.data && Array.isArray(response.data)) {
        categoriesData = response.data;
      } else if (Array.isArray(response)) {
        categoriesData = response;
      } else if (response && response.data && Array.isArray(response.data.data)) {
        // Laravel paginated response
        categoriesData = response.data.data;
      } else if (response && response.data && Array.isArray(response.data.categories)) {
        categoriesData = response.data.categories;
      }
      
      console.log('Categories data to set:', categoriesData);
      setCategories(categoriesData || []);
      
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      // Set empty array to prevent crash
      setCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormValues(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setFormValues(prev => ({ ...prev, [name]: value === '' ? '' : parseFloat(value) }));
    } else {
      setFormValues(prev => ({ ...prev, [name]: value }));
    }
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log('New thumbnail selected:', file.name, file.type, file.size);
      
      // Create a preview URL
      const previewUrl = URL.createObjectURL(file);
      setThumbnailPreview(previewUrl);
      
      // Set the file in state
      setThumbnail(file);
      
      // Clear thumbnail error
      if (errors.thumbnail) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.thumbnail;
          return newErrors;
        });
      }
    } else {
      console.log('No file selected for thumbnail');
    }
    
    // Reset the input so same file can be selected again
    if (thumbnailInputRef.current) {
      thumbnailInputRef.current.value = '';
    }
  };

  const triggerThumbnailUpload = () => {
    if (thumbnailInputRef.current) {
      thumbnailInputRef.current.click();
    }
  };

  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length > 0) {
      const newFiles = files.slice(0, 10 - gallery.length);
      
      newFiles.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const newGallery = [...gallery, file];
          setGallery(newGallery);
          setGalleryPreviews(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
    
    // Reset the input so same files can be selected again
    if (galleryInputRef.current) {
      galleryInputRef.current.value = '';
    }
  };

  const triggerGalleryUpload = () => {
    if (galleryInputRef.current) {
      galleryInputRef.current.click();
    }
  };

  const removeThumbnail = () => {
    console.log('Removing thumbnail, current thumbnail:', thumbnail);
    
    // Revoke object URL if it's a blob URL
    if (thumbnailPreview && thumbnailPreview.startsWith('blob:')) {
      URL.revokeObjectURL(thumbnailPreview);
    }
    
    if (thumbnail instanceof File) {
      // If it's a new file that hasn't been uploaded yet, just remove it
      setThumbnail(null);
      setThumbnailPreview('/images/default-product.png');
    } else if (typeof thumbnail === 'string' && product) {
      // For existing thumbnails, we need to handle deletion
      // Set thumbnail to null and the backend will handle it
      setThumbnail(null);
      setThumbnailPreview('/images/default-product.png');
    } else {
      // No thumbnail exists
      setThumbnail(null);
      setThumbnailPreview('/images/default-product.png');
    }
    
    // Clear thumbnail error
    if (errors.thumbnail) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.thumbnail;
        return newErrors;
      });
    }
  };

  const removeGalleryImage = (index: number) => {
    const itemToRemove = gallery[index];
    
    // If it's an existing image (string path), add to deletion list
    if (typeof itemToRemove === 'string' && itemToRemove) {
      let path = itemToRemove;
      if (path.startsWith(STORAGE_BASE_URL)) {
        path = path.replace(STORAGE_BASE_URL + '/', '');
      } else if (path.startsWith(API_BASE_URL)) {
        path = path.replace(API_BASE_URL + '/storage/', '');
      }
      
      if (path && path !== '') {
        console.log('Adding gallery image to delete list:', path);
        setGalleryToDelete(prev => [...prev, path]);
      }
    }
    
    const newGallery = gallery.filter((_, i) => i !== index);
    const newPreviews = galleryPreviews.filter((_, i) => i !== index);
    
    setGallery(newGallery);
    setGalleryPreviews(newPreviews);
  };

  const validateForm = (): boolean => {
    console.log('=== Validating Form ===');
    console.log('Product (editing?):', product ? 'YES' : 'NO');
    console.log('Thumbnail state:', thumbnail);
    console.log('Thumbnail preview exists:', !!thumbnailPreview);
    console.log('Is thumbnail a File?', thumbnail instanceof File);
    console.log('Is thumbnail a string?', typeof thumbnail === 'string');
    
    const newErrors: {[key: string]: string} = {};
    
    // For new products, thumbnail is required
    if (!product) {
      console.log('Checking thumbnail for new product...');
      console.log('- thumbnail state:', thumbnail);
      console.log('- thumbnailPreview:', thumbnailPreview);
      console.log('- thumbnailPreview is default?', thumbnailPreview === '/images/default-product.png');
      
      if (!thumbnail) {
        console.log('ERROR: No thumbnail found for new product');
        newErrors.thumbnail = 'Main image is required for new products';
      } else if (thumbnailPreview === '/images/default-product.png') {
        console.log('ERROR: Only default preview exists, no actual thumbnail');
        newErrors.thumbnail = 'Main image is required for new products';
      }
    }
    
    // Required fields
    if (!formValues.name.trim()) newErrors.name = 'Product name is required';
    if (!formValues.sku.trim()) newErrors.sku = 'SKU is required';
    if (!formValues.category_id) newErrors.category_id = 'Category is required';
    if (!formValues.price || parseFloat(formValues.price) <= 0) newErrors.price = 'Valid price is required';
    if (!formValues.stock_quantity || parseInt(formValues.stock_quantity) < 0) newErrors.stock_quantity = 'Valid stock quantity is required';
    
    // Validate discounted price
    if (formValues.discounted_price) {
      const price = parseFloat(formValues.price) || 0;
      const discounted = parseFloat(formValues.discounted_price);
      if (discounted >= price) {
        newErrors.discounted_price = 'Discounted price must be less than regular price';
      }
    }
    
    console.log('Validation errors:', newErrors);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('=== Form Submit Started ===');
    
    setLoading(true);
    setErrors({});

    if (!validateForm()) {
      console.log('Form validation failed');
      setLoading(false);
      return;
    }

    try {
      // Create FormData for file uploads
      const formData = new FormData();
      
      // Append all form values
      formData.append('name', formValues.name.trim());
      formData.append('description', formValues.description.trim());
      formData.append('price', parseFloat(formValues.price || '0').toString());
      
      if (formValues.discounted_price) {
        const discounted = parseFloat(formValues.discounted_price);
        if (!isNaN(discounted) && discounted > 0) {
          formData.append('discounted_price', discounted.toString());
        }
      }
      
      formData.append('stock_quantity', parseInt(formValues.stock_quantity || '0').toString());
      formData.append('min_stock_threshold', parseInt(formValues.min_stock_threshold || '10').toString());
      formData.append('category_id', parseInt(formValues.category_id || '0').toString());
      
      if (formValues.vendor_id) {
        formData.append('vendor_id', parseInt(formValues.vendor_id || '0').toString());
      }
      
      formData.append('sku', formValues.sku.trim());
      formData.append('barcode', formValues.barcode.trim());
      
      if (formValues.weight) {
        formData.append('weight', parseFloat(formValues.weight || '0').toString());
      }
      
      formData.append('unit', formValues.unit);
      formData.append('is_featured', formValues.is_featured ? '1' : '0');
      formData.append('is_active', formValues.is_active ? '1' : '0');
      
      // FIX FOR ATTRIBUTES FIELD: Send as valid JSON string
      try {
        let attributesValue = '{}'; // Default to empty object
        
        if (formValues.attributes && formValues.attributes.trim() !== '') {
          // Try to parse the JSON to validate it
          const parsed = JSON.parse(formValues.attributes);
          // Re-stringify to ensure valid JSON format
          attributesValue = JSON.stringify(parsed);
        }
        
        console.log('Attributes value being sent:', attributesValue);
        formData.append('attributes', attributesValue);
      } catch (e) {
        console.warn('Invalid JSON for attributes, using empty object');
        formData.append('attributes', '{}');
      }

      // Handle thumbnail - FIXED
      console.log('Processing thumbnail for submission:');
      console.log('- thumbnail type:', typeof thumbnail);
      console.log('- thumbnail instanceof File:', thumbnail instanceof File);
      console.log('- thumbnail value:', thumbnail);
      
      if (thumbnail instanceof File) {
        console.log('Appending new thumbnail file:', thumbnail.name);
        formData.append('thumbnail', thumbnail);
      } else if (thumbnail === null && product) {
        // Thumbnail was removed - send empty string
        console.log('Thumbnail was removed, sending empty string');
        formData.append('thumbnail', '');
      } else if (typeof thumbnail === 'string' && thumbnail) {
        // Keep existing thumbnail path
        console.log('Keeping existing thumbnail path:', thumbnail);
        formData.append('thumbnail', thumbnail);
      } else if (!product) {
        // This should not happen due to validation, but just in case
        console.error('No thumbnail for new product!');
        throw new Error('Thumbnail is required for new products');
      }

      // Handle gallery images - new files
      gallery.forEach((item, index) => {
        if (item instanceof File) {
          formData.append(`gallery[]`, item); // Use array notation for Laravel
        }
      });

      // Handle existing gallery images
      gallery.forEach((item, index) => {
        if (typeof item === 'string' && item) {
          formData.append(`existing_gallery[]`, item);
        }
      });

      // Handle gallery deletions
      if (galleryToDelete.length > 0) {
        galleryToDelete.forEach(path => {
          formData.append(`delete_gallery[]`, path);
        });
      }

      // For Laravel PUT method with FormData
      if (product) {
        formData.append('_method', 'PUT');
      }

      // Debug logging
      console.log('=== FINAL FormData Contents ===');
      for (let [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(`${key}: File - ${value.name} (${value.size} bytes, ${value.type})`);
        } else if (key === 'attributes') {
          console.log(`${key}: JSON string - ${value}`);
        } else if (typeof value === 'string' && value.length > 100) {
          console.log(`${key}: "${value.substring(0, 50)}..." [${value.length} chars]`);
        } else {
          console.log(`${key}: "${value}"`);
        }
      }

      // Call the onSubmit callback with FormData
      onSubmit(formData);
    } catch (error) {
      console.error('Form preparation error:', error);
      setErrors({ form: 'Failed to prepare form data' });
      setLoading(false);
    }
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>, type: 'thumbnail' | 'gallery') => {
    console.log('Image error for', type);
    e.currentTarget.src = '/images/default-product.png';
    if (type === 'thumbnail') {
      setThumbnailPreview('/images/default-product.png');
    }
  };

  const replaceThumbnail = () => {
    triggerThumbnailUpload();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>
        
        <div className="inline-block w-full max-w-4xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white rounded-lg shadow-xl">
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <h3 className="text-lg font-medium text-gray-900">
              {product ? 'Edit Product' : 'Add New Product'}
            </h3>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-gray-500"
              disabled={isSubmitting || loading}
            >
              <X size={24} />
            </button>
          </div>

          {/* Error Display */}
          {errors.form && (
            <div className="px-6 py-3 bg-red-50 border-b border-red-100">
              <div className="flex items-center text-red-700">
                <AlertCircle className="w-5 h-5 mr-2" />
                <span className="text-sm">{errors.form}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Left Column - Basic Information */}
                <div className="space-y-4">
                  {/* Product Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formValues.name}
                      onChange={handleInputChange}
                      required
                      className={`w-full px-3 py-2 mt-1 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.name ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                    )}
                  </div>

                  {/* SKU */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      SKU *
                    </label>
                    <input
                      type="text"
                      name="sku"
                      value={formValues.sku}
                      onChange={handleInputChange}
                      required
                      className={`w-full px-3 py-2 mt-1 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.sku ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="PROD-001"
                    />
                    {errors.sku && (
                      <p className="mt-1 text-sm text-red-600">{errors.sku}</p>
                    )}
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Category *
                    </label>
                    <div className="relative">
                      <select
                        name="category_id"
                        value={formValues.category_id}
                        onChange={handleInputChange}
                        required
                        disabled={loadingCategories}
                        className={`w-full px-3 py-2 mt-1 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.category_id ? 'border-red-300' : 'border-gray-300'
                        } ${loadingCategories ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                      >
                        <option value="">Select Category</option>
                        {categories.length > 0 ? (
                          categories.map(category => (
                            <option key={category.id || category._id} value={category.id || category._id}>
                              {category.name}
                            </option>
                          ))
                        ) : (
                          !loadingCategories && <option value="" disabled>No categories found</option>
                        )}
                      </select>
                      {loadingCategories && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                        </div>
                      )}
                    </div>
                    {loadingCategories ? (
                      <p className="mt-1 text-sm text-blue-600">Loading categories...</p>
                    ) : errors.category_id ? (
                      <p className="mt-1 text-sm text-red-600">{errors.category_id}</p>
                    ) : categories.length === 0 && !loadingCategories ? (
                      <p className="mt-1 text-sm text-yellow-600">
                        No categories found. Please add categories first or check your API.
                      </p>
                    ) : null}
                    <div className="mt-1 text-xs text-gray-500">
                      {categories.length > 0 ? `${categories.length} categories available` : ''}
                    </div>
                  </div>

                  {/* Price */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Price ($) *
                    </label>
                    <div className="relative mt-1">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <span className="text-gray-500">$</span>
                      </div>
                      <input
                        type="number"
                        name="price"
                        value={formValues.price}
                        onChange={handleInputChange}
                        required
                        min="0"
                        step="0.01"
                        className={`w-full pl-7 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.price ? 'border-red-300' : 'border-gray-300'
                        }`}
                      />
                    </div>
                    {errors.price && (
                      <p className="mt-1 text-sm text-red-600">{errors.price}</p>
                    )}
                  </div>

                  {/* Discounted Price */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Discounted Price ($)
                    </label>
                    <div className="relative mt-1">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <span className="text-gray-500">$</span>
                      </div>
                      <input
                        type="number"
                        name="discounted_price"
                        value={formValues.discounted_price}
                        onChange={handleInputChange}
                        min="0"
                        step="0.01"
                        className={`w-full pl-7 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.discounted_price ? 'border-red-300' : 'border-gray-300'
                        }`}
                      />
                    </div>
                    {errors.discounted_price && (
                      <p className="mt-1 text-sm text-red-600">{errors.discounted_price}</p>
                    )}
                  </div>

                  {/* Stock Quantity */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Stock Quantity *
                    </label>
                    <input
                      type="number"
                      name="stock_quantity"
                      value={formValues.stock_quantity}
                      onChange={handleInputChange}
                      required
                      min="0"
                      className={`w-full px-3 py-2 mt-1 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.stock_quantity ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {errors.stock_quantity && (
                      <p className="mt-1 text-sm text-red-600">{errors.stock_quantity}</p>
                    )}
                  </div>

                  {/* Min Stock Threshold */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Min Stock Threshold
                    </label>
                    <input
                      type="number"
                      name="min_stock_threshold"
                      value={formValues.min_stock_threshold}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Barcode */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Barcode
                    </label>
                    <input
                      type="text"
                      name="barcode"
                      value={formValues.barcode}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Right Column - Images and Description */}
                <div className="space-y-4">
                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formValues.description}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Thumbnail Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Main Image (Thumbnail) {!product && '*'}
                    </label>
                    <div className="mt-1">
                      <div 
                        className="relative flex items-center justify-center w-full px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
                        onClick={triggerThumbnailUpload}
                      >
                        {/* Hidden file input */}
                        <input
                          ref={thumbnailInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleThumbnailChange}
                          className="sr-only"
                          required={!product}
                        />
                        
                        <div className="space-y-1 text-center">
                          {thumbnailPreview ? (
                            <div className="relative">
                              <div className="relative group">
                                <img
                                  src={thumbnailPreview}
                                  alt="Thumbnail preview"
                                  className="mx-auto h-32 w-32 object-cover rounded-lg"
                                  onError={(e) => handleImageError(e, 'thumbnail')}
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity rounded-lg flex items-center justify-center">
                                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center space-y-2">
                                    <Camera className="w-6 h-6 text-white" />
                                    <span className="text-xs text-white font-medium">Replace Image</span>
                                  </div>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeThumbnail();
                                }}
                                className="absolute top-0 right-0 p-1 text-white bg-red-500 rounded-full -translate-y-1/2 translate-x-1/2 hover:bg-red-600 z-10"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          ) : (
                            <>
                              <ImageIcon className="w-12 h-12 mx-auto text-gray-400" />
                              <div className="flex flex-col items-center text-sm text-gray-600">
                                <span className="font-medium text-blue-600">Click to upload thumbnail</span>
                                <p className="mt-1">or drag and drop</p>
                              </div>
                              <p className="text-xs text-gray-500">
                                PNG, JPG, GIF, WebP up to 10MB
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                      {thumbnailPreview && (
                        <div className="mt-2 text-xs text-gray-500">
                          Click on the image to replace it
                        </div>
                      )}
                      {errors.thumbnail && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {errors.thumbnail}
                        </p>
                      )}
                      <div className="mt-1 text-xs text-gray-500">
                        {thumbnail instanceof File ? `Selected: ${thumbnail.name}` : ''}
                      </div>
                    </div>
                  </div>

                  {/* Gallery Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Gallery Images (Optional) - Max 10
                    </label>
                    <div className="mt-1">
                      <div 
                        className="flex items-center justify-center w-full px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
                        onClick={triggerGalleryUpload}
                      >
                        {/* Hidden file input */}
                        <input
                          ref={galleryInputRef}
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleGalleryChange}
                          className="sr-only"
                          disabled={gallery.length >= 10}
                        />
                        
                        <div className="space-y-1 text-center">
                          <Upload className="w-12 h-12 mx-auto text-gray-400" />
                          <div className="flex text-sm text-gray-600">
                            <label className="relative font-medium text-blue-600 rounded-md cursor-pointer hover:text-blue-500">
                              <span>Upload gallery images</span>
                            </label>
                            <p className="pl-1">or drag and drop</p>
                          </div>
                          <p className="text-xs text-gray-500">
                            PNG, JPG, GIF, WebP up to 10MB each
                          </p>
                          <p className="text-xs text-gray-500">
                            {gallery.length}/10 images selected
                          </p>
                          {gallery.length >= 10 && (
                            <p className="text-xs text-red-500">
                              Maximum 10 images reached
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Gallery Preview */}
                    {galleryPreviews.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Gallery Preview ({galleryPreviews.length} images):</h4>
                        <div className="grid grid-cols-4 gap-2">
                          {galleryPreviews.map((preview, index) => (
                            <div key={index} className="relative group">
                              <img
                                src={preview}
                                alt={`Gallery ${index + 1}`}
                                className="object-cover w-20 h-20 rounded"
                                onError={(e) => handleImageError(e, 'gallery')}
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity rounded flex items-center justify-center">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeGalleryImage(index);
                                  }}
                                  className="opacity-0 group-hover:opacity-100 p-1 text-white bg-red-500 rounded-full hover:bg-red-600 transition-opacity"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                              {typeof gallery[index] === 'string' && (
                                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs text-center py-0.5">
                                  Existing
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Additional Fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Weight
                      </label>
                      <input
                        type="number"
                        name="weight"
                        value={formValues.weight}
                        onChange={handleInputChange}
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Unit
                      </label>
                      <select
                        name="unit"
                        value={formValues.unit}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="piece">Piece</option>
                        <option value="kg">Kilogram</option>
                        <option value="g">Gram</option>
                        <option value="lb">Pound</option>
                        <option value="oz">Ounce</option>
                        <option value="liter">Liter</option>
                        <option value="ml">Milliliter</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Checkboxes */}
              <div className="flex space-x-6 mt-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_featured"
                    checked={formValues.is_featured}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Featured Product</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formValues.is_active}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Active Product</span>
                </label>
              </div>
            </div>

            <div className="px-6 py-4 border-t bg-gray-50">
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  disabled={isSubmitting || loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || loading || loadingCategories}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-lg ${
                    isSubmitting || loading || loadingCategories ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {isSubmitting || loading ? (
                    <span className="flex items-center">
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {product ? 'Updating...' : 'Creating...'}
                    </span>
                  ) : product ? (
                    'Update Product'
                  ) : (
                    'Create Product'
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}