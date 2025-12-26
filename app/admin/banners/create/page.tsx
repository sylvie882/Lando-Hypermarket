'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ArrowLeft, 
  Save, 
  Upload, 
  Eye, 
  EyeOff, 
  Calendar, 
  AlertCircle, 
  FileWarning,
  CheckCircle,
  XCircle,
  Loader2,
  Info
} from 'lucide-react';
import toast from 'react-hot-toast';

interface BannerFormData {
  title: string;
  subtitle: string;
  description: string;
  button_text: string;
  button_link: string;
  order: number;
  is_active: boolean;
  start_date: string;
  end_date: string;
  type: 'homepage' | 'category' | 'promotional' | 'sidebar';
  category_slug: string;
}

// Helper function to get authentication token
const getAuthToken = (): string | null => {
  // Try to get token from localStorage
  if (typeof window !== 'undefined') {
    // Check localStorage
    const token = localStorage.getItem('token');
    if (token) return token;
    
    // Check cookies
    const cookies = document.cookie.split('; ');
    const tokenCookie = cookies.find(row => row.startsWith('token='));
    if (tokenCookie) {
      return tokenCookie.split('=')[1];
    }
    
    // Check for token in sessionStorage
    const sessionToken = sessionStorage.getItem('token');
    if (sessionToken) return sessionToken;
  }
  
  return null;
};

// Helper function to get CSRF token (if using Laravel Sanctum with CSRF)
const getCsrfToken = (): string | null => {
  if (typeof window !== 'undefined') {
    const cookies = document.cookie.split('; ');
    const csrfCookie = cookies.find(row => row.startsWith('XSRF-TOKEN='));
    if (csrfCookie) {
      return decodeURIComponent(csrfCookie.split('=')[1]);
    }
  }
  return null;
};

// Image compression function
const compressImage = async (file: File, maxWidth = 1920, quality = 0.8): Promise<File> => {
  return new Promise((resolve, reject) => {
    // Skip compression for small files (< 2MB)
    if (file.size < 2 * 1024 * 1024) {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        // Calculate new dimensions
        let { width, height } = img;
        
        if (width > maxWidth) {
          const ratio = maxWidth / width;
          width = maxWidth;
          height = height * ratio;
        }
        
        canvas.width = width;
        canvas.height = height;

        // Draw image
        ctx.drawImage(img, 0, 0, width, height);

        // Adjust quality based on file size
        let finalQuality = quality;
        const fileSizeMB = file.size / (1024 * 1024);
        
        if (fileSizeMB > 10) finalQuality = 0.5;
        else if (fileSizeMB > 5) finalQuality = 0.6;
        else if (fileSizeMB > 2) finalQuality = 0.7;

        // Convert to JPEG for better compression
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Compression failed'));
              return;
            }

            const compressedFile = new File(
              [blob], 
              file.name.replace(/\.[^/.]+$/, "") + '.jpg',
              {
                type: 'image/jpeg',
                lastModified: Date.now(),
              }
            );

            console.log(`Compressed: ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
            resolve(compressedFile);
          },
          'image/jpeg',
          finalQuality
        );
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = event.target?.result as string;
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

// Alternative simpler compression function (fallback)
const compressImageSimple = async (file: File, maxSizeMB = 5): Promise<File> => {
  return new Promise((resolve, reject) => {
    if (file.size <= maxSizeMB * 1024 * 1024) {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        // Set canvas size (reduce dimensions for compression)
        const maxDimension = 1200;
        let width = img.width;
        let height = img.height;
        
        if (width > height && width > maxDimension) {
          height = (height * maxDimension) / width;
          width = maxDimension;
        } else if (height > maxDimension) {
          width = (width * maxDimension) / height;
          height = maxDimension;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // Lower quality for larger files
        let quality = 0.7;
        if (file.size > 10 * 1024 * 1024) quality = 0.5;
        if (file.size > 20 * 1024 * 1024) quality = 0.3;
        
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Compression failed'));
              return;
            }
            
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            
            resolve(compressedFile);
          },
          'image/jpeg',
          quality
        );
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = event.target?.result as string;
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

export default function CreateBannerPage() {
  const router = useRouter();
  
  const [saving, setSaving] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [error, setError] = useState('');
  const [serverLimits, setServerLimits] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  
  const [formData, setFormData] = useState<BannerFormData>({
    title: '',
    subtitle: '',
    description: '',
    button_text: '',
    button_link: '',
    order: 0,
    is_active: true,
    start_date: '',
    end_date: '',
    type: 'homepage',
    category_slug: '',
  });

  const [image, setImage] = useState<File | null>(null);
  const [mobileImage, setMobileImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [mobileImagePreview, setMobileImagePreview] = useState<string>('');

  // Check authentication and server limits
  useEffect(() => {
    const checkAuthAndLimits = async () => {
      try {
        // Check if user is authenticated
        const token = getAuthToken();
        if (!token) {
          toast.error('Please login to create banners');
          setTimeout(() => router.push('/login'), 2000);
          return;
        }
        
        setIsAuthenticated(true);
        
        // Check server upload limits
        const response = await fetch('http://localhost:8000/api/upload-limits', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setServerLimits(data);
          console.log('Server upload limits:', data);
        } else if (response.status === 401) {
          toast.error('Session expired. Please login again.');
          setIsAuthenticated(false);
          setTimeout(() => router.push('/login'), 2000);
        }
      } catch (error) {
        console.log('Could not fetch server limits:', error);
      }
    };
    
    checkAuthAndLimits();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'desktop' | 'mobile') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 50MB as per your .htaccess)
    const MAX_FILE_SIZE = 50 * 1024 * 1024;
    
    if (file.size > MAX_FILE_SIZE) {
      toast.error(
        <div>
          <p className="font-medium">File too large!</p>
          <p className="text-sm">{(file.size / (1024 * 1024)).toFixed(2)}MB exceeds 50MB limit.</p>
        </div>
      );
      return;
    }

    // Check file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      toast.error('Invalid file type. Please upload JPEG, PNG, WEBP, or GIF image.');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      if (type === 'desktop') {
        setImagePreview(reader.result as string);
        setImage(file);
      } else {
        setMobileImagePreview(reader.result as string);
        setMobileImage(file);
      }
    };
    reader.readAsDataURL(file);
  };

  const clearImage = (type: 'desktop' | 'mobile') => {
    if (type === 'desktop') {
      setImage(null);
      setImagePreview('');
    } else {
      setMobileImage(null);
      setMobileImagePreview('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check authentication
    const token = getAuthToken();
    if (!token) {
      toast.error('Please login to create banners');
      router.push('/login');
      return;
    }

    // Validation
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }

    if (!image) {
      toast.error('Desktop image is required');
      return;
    }

    if (formData.order < 0) {
      toast.error('Display order cannot be negative');
      return;
    }

    if (formData.type === 'category' && !formData.category_slug.trim()) {
      toast.error('Category slug is required for category banners');
      return;
    }

    try {
      setSaving(true);
      setCompressing(true);
      setError('');

      // Step 1: Compress images
      toast.loading('Optimizing images for upload...', { id: 'compression', duration: 5000 });
      
      let processedImage = image;
      let processedMobileImage = mobileImage;

      try {
        // Try advanced compression first
        processedImage = await compressImage(image, 1920, 0.8);
        if (mobileImage) {
          processedMobileImage = await compressImage(mobileImage, 768, 0.8);
        }
        toast.success('Images optimized!', { id: 'compression' });
      } catch (compressionError) {
        console.warn('Advanced compression failed, trying simple compression:', compressionError);
        try {
          // Fallback to simple compression
          processedImage = await compressImageSimple(image, 5);
          if (mobileImage) {
            processedMobileImage = await compressImageSimple(mobileImage, 5);
          }
          toast.success('Images optimized!', { id: 'compression' });
        } catch (simpleError) {
          console.warn('All compression failed, using originals:', simpleError);
          toast.error('Could not compress images, uploading originals', { id: 'compression' });
        }
      }

      setCompressing(false);

      // Step 2: Prepare FormData
      const formDataToSend = new FormData();
      
      // Add text fields
      formDataToSend.append('title', formData.title.trim());
      if (formData.subtitle.trim()) formDataToSend.append('subtitle', formData.subtitle.trim());
      if (formData.description.trim()) formDataToSend.append('description', formData.description.trim());
      if (formData.button_text.trim()) formDataToSend.append('button_text', formData.button_text.trim());
      if (formData.button_link.trim()) formDataToSend.append('button_link', formData.button_link.trim());
      formDataToSend.append('order', String(formData.order));
      formDataToSend.append('is_active', formData.is_active ? '1' : '0');
      
      if (formData.start_date) formDataToSend.append('start_date', formData.start_date);
      if (formData.end_date) formDataToSend.append('end_date', formData.end_date);
      
      formDataToSend.append('type', formData.type);
      if (formData.category_slug.trim()) {
        formDataToSend.append('category_slug', formData.category_slug.trim());
      }

      // Add images
      formDataToSend.append('image', processedImage);
      if (processedMobileImage) {
        formDataToSend.append('mobile_image', processedMobileImage);
      }

      // Log sizes
      console.log('Upload sizes:', {
        desktop: `${(processedImage.size / 1024 / 1024).toFixed(2)}MB`,
        mobile: processedMobileImage ? `${(processedMobileImage.size / 1024 / 1024).toFixed(2)}MB` : 'none',
        total: `${((processedImage.size + (processedMobileImage?.size || 0)) / 1024 / 1024).toFixed(2)}MB`
      });

      // Step 3: Prepare headers with authentication
      const headers: HeadersInit = {
        'Accept': 'application/json',
      };

      // Add authorization token
      headers['Authorization'] = `Bearer ${token}`;

      // Add CSRF token if available (for Laravel Sanctum)
      const csrfToken = getCsrfToken();
      if (csrfToken) {
        headers['X-XSRF-TOKEN'] = csrfToken;
      }

      // Step 4: Upload using fetch with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minutes timeout

      try {
        const response = await fetch('http://localhost:8000/api/admin/banners', {
          method: 'POST',
          headers: headers,
          body: formDataToSend,
          signal: controller.signal,
          credentials: 'include', // Include cookies for session-based auth
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Unauthorized. Please login again.');
          } else if (response.status === 403) {
            throw new Error('Access denied. Admin privileges required.');
          } else if (response.status === 413) {
            throw new Error('File too large. Server limit is 50MB. Try smaller images.');
          } else if (response.status === 422) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Validation failed');
          } else {
            throw new Error(`Server error: ${response.status}`);
          }
        }

        const result = await response.json();
        toast.success('Banner created successfully!');
        
        setTimeout(() => {
          router.push('/admin/banners');
          router.refresh();
        }, 1500);

      } catch (fetchError: any) {
        if (fetchError.name === 'AbortError') {
          throw new Error('Upload timeout. Try smaller files.');
        }
        throw fetchError;
      }

    } catch (error: any) {
      console.error('Upload error:', error);
      setError(error.message || 'An unexpected error occurred');
      toast.error(error.message || 'Failed to create banner');
      
      // If unauthorized, redirect to login
      if (error.message.includes('Unauthorized') || error.message.includes('login')) {
        setTimeout(() => router.push('/login'), 2000);
      }
    } finally {
      setSaving(false);
      setCompressing(false);
    }
  };

  const totalFileSize = (image?.size || 0) + (mobileImage?.size || 0);
  const totalSizeMB = (totalFileSize / 1024 / 1024).toFixed(2);

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto mb-4" size={40} />
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <Link
                href="/admin/banners"
                className="flex items-center text-gray-600 hover:text-gray-900 mb-2"
              >
                <ArrowLeft size={20} className="mr-2" />
                Back to Banners
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">Create New Banner</h1>
              <p className="text-gray-600 mt-1">Add a new banner to your website</p>
            </div>
          </div>

          {/* Server Limits Info */}
          {serverLimits && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <Info className="text-green-600 mr-2" size={18} />
                <p className="text-sm text-green-700">
                  Server configured for: <span className="font-semibold">{serverLimits.upload_max_filesize}</span> max file uploads
                </p>
              </div>
            </div>
          )}

          {/* Status Messages */}
          {compressing && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center">
                <Loader2 className="animate-spin text-blue-600 mr-3" size={20} />
                <div>
                  <p className="text-blue-800 font-medium">Optimizing Images</p>
                  <p className="text-sm text-blue-700">Compressing images for faster upload...</p>
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start">
                <AlertCircle className="text-red-500 mr-3 mt-0.5" size={20} />
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-red-800 font-medium">Upload Error</p>
                      <p className="text-red-700 mt-1">{error}</p>
                    </div>
                    <button
                      onClick={() => setError('')}
                      className="text-red-500 hover:text-red-700"
                    >
                      <XCircle size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Upload Guidelines */}
          <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start">
              <FileWarning className="text-blue-600 mr-3 mt-0.5" size={20} />
              <div>
                <p className="text-blue-800 font-medium">Upload Guidelines</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
                  <div className="bg-white p-3 rounded-lg border border-blue-100">
                    <p className="text-sm font-medium text-gray-700">Max File Size</p>
                    <p className="text-xs text-gray-600 mt-1">50MB per image</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-blue-100">
                    <p className="text-sm font-medium text-gray-700">Desktop Image</p>
                    <p className="text-xs text-gray-600 mt-1">1920×600px (recommended)</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-blue-100">
                    <p className="text-sm font-medium text-gray-700">Mobile Image</p>
                    <p className="text-xs text-gray-600 mt-1">768×400px (recommended)</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-blue-100">
                    <p className="text-sm font-medium text-gray-700">Auto Compression</p>
                    <p className="text-xs text-gray-600 mt-1">Files over 2MB are auto-compressed</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Basic Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Banner Details Card */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Banner Details</h2>
                
                <div className="space-y-4">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter banner title"
                    />
                  </div>

                  {/* Subtitle */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subtitle
                    </label>
                    <input
                      type="text"
                      name="subtitle"
                      value={formData.subtitle}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter banner subtitle"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter banner description"
                    />
                  </div>

                  {/* Button Settings */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Button Text
                      </label>
                      <input
                        type="text"
                        name="button_text"
                        value={formData.button_text}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., Shop Now"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Button Link
                      </label>
                      <input
                        type="text"
                        name="button_link"
                        value={formData.button_link}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., /category/vegetables"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Display Settings Card */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Display Settings</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Banner Type *
                    </label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="homepage">Homepage Banner</option>
                      <option value="category">Category Banner</option>
                      <option value="promotional">Promotional Banner</option>
                      <option value="sidebar">Sidebar Banner</option>
                    </select>
                  </div>

                  {/* Display Order */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Display Order *
                    </label>
                    <input
                      type="number"
                      name="order"
                      value={formData.order}
                      onChange={handleChange}
                      min="0"
                      required
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Lower numbers appear first
                    </p>
                  </div>

                  {/* Category Slug */}
                  <div className={formData.type === 'category' ? '' : 'opacity-50'}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category Slug
                      {formData.type === 'category' && ' *'}
                    </label>
                    <input
                      type="text"
                      name="category_slug"
                      value={formData.category_slug}
                      onChange={handleChange}
                      disabled={formData.type !== 'category'}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed"
                      placeholder="e.g., vegetables"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Required for category banners
                    </p>
                  </div>

                  {/* Active Status */}
                  <div className="flex items-center">
                    <label className="flex items-center cursor-pointer">
                      <div className="relative">
                        <input
                          type="checkbox"
                          name="is_active"
                          checked={formData.is_active}
                          onChange={handleChange}
                          className="sr-only"
                        />
                        <div className={`block w-14 h-8 rounded-full ${formData.is_active ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${formData.is_active ? 'transform translate-x-6' : ''}`}></div>
                      </div>
                      <div className="ml-3 text-gray-700 font-medium">
                        {formData.is_active ? (
                          <span className="flex items-center text-green-600">
                            <Eye size={16} className="mr-1" /> Active
                          </span>
                        ) : (
                          <span className="flex items-center text-gray-600">
                            <EyeOff size={16} className="mr-1" /> Inactive
                          </span>
                        )}
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Schedule Card */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Schedule</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="date"
                        name="start_date"
                        value={formData.start_date}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="date"
                        name="end_date"
                        value={formData.end_date}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 text-sm text-gray-500">
                  <p>Leave dates empty to show banner indefinitely.</p>
                  <p>End date must be after start date if both are provided.</p>
                </div>
              </div>
            </div>

            {/* Right Column - Images */}
            <div className="space-y-6">
              {/* Desktop Image Card */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Desktop Image *</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload Image (Required)
                    </label>
                    <div className="flex items-center justify-center w-full">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-8 h-8 mb-2 text-gray-500" />
                          <p className="mb-1 text-sm text-gray-500">
                            <span className="font-semibold">Click to upload</span>
                          </p>
                          <p className="text-xs text-gray-500">JPEG, PNG, WEBP, GIF (Max 50MB)</p>
                          <p className="text-xs text-gray-400 mt-1">Recommended: 1920×600px</p>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageChange(e, 'desktop')}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {imagePreview ? (
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Preview
                        </label>
                        <button
                          type="button"
                          onClick={() => clearImage('desktop')}
                          className="text-sm text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="relative h-48 w-full bg-gray-100 rounded-lg overflow-hidden">
                        <Image
                          src={imagePreview}
                          alt="Banner preview"
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 50vw"
                        />
                      </div>
                      {image && (
                        <div className="mt-2 text-xs text-gray-600">
                          <p>{image.name}</p>
                          <p>Size: {(image.size / 1024 / 1024).toFixed(2)} MB</p>
                          {image.size > 2 * 1024 * 1024 && (
                            <p className="text-yellow-600 mt-1">
                              ⚡ Will be compressed for faster upload
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                      <p>No image uploaded</p>
                      <p className="text-sm mt-1">Desktop image is required</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Mobile Image Card */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Mobile Image</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload Mobile Image (Optional)
                    </label>
                    <div className="flex items-center justify-center w-full">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-8 h-8 mb-2 text-gray-500" />
                          <p className="mb-1 text-sm text-gray-500">
                            <span className="font-semibold">Click to upload</span>
                          </p>
                          <p className="text-xs text-gray-500">JPEG, PNG, WEBP, GIF (Max 50MB)</p>
                          <p className="text-xs text-gray-400 mt-1">Uses desktop image if not provided</p>
                          <p className="text-xs text-gray-400">Recommended: 768×400px</p>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageChange(e, 'mobile')}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {mobileImagePreview ? (
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Mobile Preview
                        </label>
                        <button
                          type="button"
                          onClick={() => clearImage('mobile')}
                          className="text-sm text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="relative h-32 w-full bg-gray-100 rounded-lg overflow-hidden">
                        <Image
                          src={mobileImagePreview}
                          alt="Mobile banner preview"
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 50vw"
                        />
                      </div>
                      {mobileImage && (
                        <div className="mt-2 text-xs text-gray-600">
                          <p>{mobileImage.name}</p>
                          <p>Size: {(mobileImage.size / 1024 / 1024).toFixed(2)} MB</p>
                          {mobileImage.size > 2 * 1024 * 1024 && (
                            <p className="text-yellow-600 mt-1">
                              ⚡ Will be compressed for faster upload
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                      <p>No mobile image uploaded</p>
                      <p className="text-sm mt-1">Desktop image will be used for mobile</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Create Card */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Create Banner</h2>
                
                <div className="space-y-4">
                  <div className="text-sm text-gray-600">
                    <p>Review all details before creating the banner.</p>
                    <p className="mt-1">Required fields are marked with *</p>
                  </div>

                  {image && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm font-medium text-blue-800 mb-2">Upload Summary</p>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Desktop:</span>
                          <span>{(image.size / 1024 / 1024).toFixed(2)} MB</span>
                        </div>
                        {mobileImage && (
                          <div className="flex justify-between">
                            <span>Mobile:</span>
                            <span>{(mobileImage.size / 1024 / 1024).toFixed(2)} MB</span>
                          </div>
                        )}
                        <div className="flex justify-between pt-1 border-t border-blue-200">
                          <span className="font-medium">Total:</span>
                          <span className="font-medium">{totalSizeMB} MB</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex flex-col space-y-3">
                      <button
                        type="submit"
                        disabled={saving || compressing || !image || (formData.type === 'category' && !formData.category_slug.trim())}
                        className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {compressing ? (
                          <>
                            <Loader2 className="animate-spin" size={18} />
                            Compressing Images...
                          </>
                        ) : saving ? (
                          <>
                            <Loader2 className="animate-spin" size={18} />
                            Creating Banner...
                          </>
                        ) : (
                          <>
                            <Save size={18} />
                            Create Banner
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => router.push('/admin/banners')}
                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                    
                    {!image && (
                      <p className="text-red-500 text-sm mt-3">
                        Desktop image is required to create banner
                      </p>
                    )}
                    
                    {formData.type === 'category' && !formData.category_slug.trim() && (
                      <p className="text-red-500 text-sm mt-3">
                        Category slug is required for category banners
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}