'use client';

import React, { useState, useEffect } from 'react';
import { X, Upload, Image as ImageIcon, Loader2, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';

interface ProductFormProps {
  product?: any;
  onClose: () => void;
  onSubmit: (data: any) => void;
  isSubmitting?: boolean;
}

export default function ProductForm({ product, onClose, onSubmit, isSubmitting }: ProductFormProps) {
  const [formData, setFormData] = useState({
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
  const [thumbnail, setThumbnail] = useState<File | string | null>(null);
  const [gallery, setGallery] = useState<(File | string)[]>([]);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const [galleryToDelete, setGalleryToDelete] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  
  const API_BASE_URL = 'https://api.hypermarket.co.ke';
  const STORAGE_BASE_URL = 'https://api.hypermarket.co.ke/storage';

  // Initialize form with product data if editing
  useEffect(() => {
    fetchCategories();
    
    if (product) {
      console.log('Editing product:', product);
      setFormData({
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
        setThumbnail(product.thumbnail);
        generateThumbnailPreview(product.thumbnail);
      } else {
        // Set default image for NULL thumbnails
        setThumbnailPreview('/images/default-product.png');
      }

      // Set gallery if it exists
      if (product.gallery && Array.isArray(product.gallery)) {
        const galleryItems = product.gallery;
        setGallery(galleryItems);
        
        // Generate previews for gallery
        const previews = galleryItems.map((img: string) => {
          return generateImageUrl(img);
        }).filter(Boolean); // Filter out empty/null images
        setGalleryPreviews(previews);
      }
    }
  }, [product]);

  // Helper function to generate image URL
  const generateImageUrl = (imagePath: string): string => {
    if (!imagePath || imagePath === 'NULL') return '';
    
    if (imagePath.startsWith('http') || imagePath.startsWith('https')) {
      return imagePath;
    } else if (imagePath.startsWith('data:')) {
      return imagePath;
    } else if (imagePath.startsWith('/')) {
      return `${API_BASE_URL}${imagePath}`;
    } else {
      // Handle relative paths
      return `${STORAGE_BASE_URL}/${imagePath.replace(/^storage\//, '')}`;
    }
  };

  // Helper function to generate thumbnail preview
  const generateThumbnailPreview = (imagePath: string) => {
    const url = generateImageUrl(imagePath);
    setThumbnailPreview(url || '/images/default-product.png');
  };

  const fetchCategories = async () => {
    try {
      const response = await api.categories.getAll();
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: value === '' ? '' : parseFloat(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
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
      setThumbnail(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
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
  };

  const removeThumbnail = () => {
    if (typeof thumbnail === 'string' && product) {
      // For existing thumbnails, keep the path but set preview to default
      setThumbnail(product.thumbnail || '');
    } else {
      setThumbnail(null);
    }
    setThumbnailPreview('/images/default-product.png');
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
      
      if (path) {
        setGalleryToDelete(prev => [...prev, path]);
      }
    }
    
    const newGallery = gallery.filter((_, i) => i !== index);
    const newPreviews = galleryPreviews.filter((_, i) => i !== index);
    
    setGallery(newGallery);
    setGalleryPreviews(newPreviews);
  };

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};
    
    // For new products, thumbnail is required
    if (!product && !thumbnail) {
      newErrors.thumbnail = 'Main image is required for new products';
    }
    
    // Required fields
    if (!formData.name.trim()) newErrors.name = 'Product name is required';
    if (!formData.sku.trim()) newErrors.sku = 'SKU is required';
    if (!formData.category_id) newErrors.category_id = 'Category is required';
    if (!formData.price || parseFloat(formData.price) <= 0) newErrors.price = 'Valid price is required';
    if (!formData.stock_quantity || parseInt(formData.stock_quantity) < 0) newErrors.stock_quantity = 'Valid stock quantity is required';
    
    // Validate discounted price
    if (formData.discounted_price) {
      const price = parseFloat(formData.price) || 0;
      const discounted = parseFloat(formData.discounted_price);
      if (discounted >= price) {
        newErrors.discounted_price = 'Discounted price must be less than regular price';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      // Prepare data for submission
      const submitData: any = {
        ...formData,
        price: parseFloat(formData.price) || 0,
        discounted_price: formData.discounted_price ? parseFloat(formData.discounted_price) : null,
        stock_quantity: parseInt(formData.stock_quantity) || 0,
        min_stock_threshold: parseInt(formData.min_stock_threshold) || 10,
        category_id: parseInt(formData.category_id) || null,
        vendor_id: formData.vendor_id ? parseInt(formData.vendor_id) : null,
        weight: formData.weight ? parseFloat(formData.weight) : null,
      };
      
      // Handle thumbnail
      if (thumbnail instanceof File) {
        submitData.thumbnail = thumbnail;
      } else if (product && thumbnail) {
        // Keep existing thumbnail path for updates
        submitData.thumbnail = thumbnail;
      }
      
      // Handle gallery
      if (gallery.length > 0) {
        submitData.gallery = gallery;
      }
      
      // Handle gallery deletions
      if (galleryToDelete.length > 0) {
        submitData.delete_gallery_images = galleryToDelete;
      }
      
      // Handle attributes - ensure it's valid JSON
      try {
        if (formData.attributes && formData.attributes.trim() !== '') {
          const parsed = JSON.parse(formData.attributes);
          submitData.attributes = parsed; // Send as object, not string
        }
      } catch (e) {
        console.warn('Invalid attributes JSON, sending as-is:', formData.attributes);
        submitData.attributes = formData.attributes;
      }
      
      console.log('Submitting data:', {
        ...submitData,
        thumbnail: thumbnail instanceof File ? `File: ${thumbnail.name}` : thumbnail,
        gallery: gallery.map(item => item instanceof File ? `File: ${item.name}` : item),
        galleryToDelete
      });
      
      onSubmit(submitData);
    } catch (error) {
      console.error('Form preparation error:', error);
      setErrors({ form: 'Failed to prepare form data' });
    } finally {
      setLoading(false);
    }
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
                      value={formData.name}
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
                      value={formData.sku}
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
                    <select
                      name="category_id"
                      value={formData.category_id}
                      onChange={handleInputChange}
                      required
                      className={`w-full px-3 py-2 mt-1 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.category_id ? 'border-red-300' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select Category</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    {errors.category_id && (
                      <p className="mt-1 text-sm text-red-600">{errors.category_id}</p>
                    )}
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
                        value={formData.price}
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
                        value={formData.discounted_price}
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
                      value={formData.stock_quantity}
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
                      value={formData.min_stock_threshold}
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
                      value={formData.barcode}
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
                      value={formData.description}
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
                      <div className="flex items-center justify-center w-full px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
                        <div className="space-y-1 text-center">
                          {thumbnailPreview ? (
                            <div className="relative">
                              <img
                                src={thumbnailPreview}
                                alt="Thumbnail preview"
                                className="mx-auto h-32 w-32 object-cover rounded-lg"
                                onError={(e) => {
                                  e.currentTarget.src = '/images/default-product.png';
                                }}
                              />
                              <button
                                type="button"
                                onClick={removeThumbnail}
                                className="absolute top-0 right-0 p-1 text-white bg-red-500 rounded-full -translate-y-1/2 translate-x-1/2 hover:bg-red-600"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          ) : (
                            <>
                              <ImageIcon className="w-12 h-12 mx-auto text-gray-400" />
                              <div className="flex text-sm text-gray-600">
                                <label className="relative font-medium text-blue-600 rounded-md cursor-pointer hover:text-blue-500">
                                  <span>Upload thumbnail</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleThumbnailChange}
                                    className="sr-only"
                                    required={!product}
                                  />
                                </label>
                                <p className="pl-1">or drag and drop</p>
                              </div>
                              <p className="text-xs text-gray-500">
                                PNG, JPG, GIF, WebP up to 10MB
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                      {errors.thumbnail && (
                        <p className="mt-1 text-sm text-red-600">{errors.thumbnail}</p>
                      )}
                    </div>
                  </div>

                  {/* Gallery Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Gallery Images (Optional) - Max 10
                    </label>
                    <div className="mt-1">
                      <div className="flex items-center justify-center w-full px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
                        <div className="space-y-1 text-center">
                          <Upload className="w-12 h-12 mx-auto text-gray-400" />
                          <div className="flex text-sm text-gray-600">
                            <label className="relative font-medium text-blue-600 rounded-md cursor-pointer hover:text-blue-500">
                              <span>Upload gallery images</span>
                              <input
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={handleGalleryChange}
                                className="sr-only"
                                disabled={gallery.length >= 10}
                              />
                            </label>
                            <p className="pl-1">or drag and drop</p>
                          </div>
                          <p className="text-xs text-gray-500">
                            PNG, JPG, GIF, WebP up to 10MB each
                          </p>
                          <p className="text-xs text-gray-500">
                            {gallery.length}/10 images selected
                          </p>
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
                                onError={(e) => {
                                  e.currentTarget.src = '/images/default-product.png';
                                }}
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity rounded flex items-center justify-center">
                                <button
                                  type="button"
                                  onClick={() => removeGalleryImage(index)}
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
                        value={formData.weight}
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
                        value={formData.unit}
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
                    checked={formData.is_featured}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Featured Product</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
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
                  disabled={isSubmitting || loading}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-lg ${
                    isSubmitting || loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
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