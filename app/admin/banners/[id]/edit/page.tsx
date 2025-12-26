'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { ArrowLeft, Save, Upload, Eye, EyeOff, Calendar, Trash2, Loader2, AlertTriangle } from 'lucide-react';
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

export default function EditBannerPage() {
  const router = useRouter();
  const params = useParams();
  const bannerId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [error, setError] = useState('');
  
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

  const [currentImage, setCurrentImage] = useState<string>('');
  const [currentMobileImage, setCurrentMobileImage] = useState<string>('');
  const [newImage, setNewImage] = useState<File | null>(null);
  const [newMobileImage, setNewMobileImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [mobileImagePreview, setMobileImagePreview] = useState<string>('');
  
  const [shouldRemoveDesktop, setShouldRemoveDesktop] = useState(false);
  const [shouldRemoveMobile, setShouldRemoveMobile] = useState(false);
  
  const desktopFileInputRef = useRef<HTMLInputElement>(null);
  const mobileFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (bannerId) {
      fetchBanner();
    }
  }, [bannerId]);

  const compressImage = async (file: File, maxWidth: number): Promise<File> => {
    // If file is too large, try to compress it more aggressively
    const maxSizeBeforeCompression = 20 * 1024 * 1024; // 20MB
    if (file.size <= maxSizeBeforeCompression) {
      // For smaller files, use normal compression
      return new Promise((resolve, reject) => {
        const img = new Image();
        const reader = new FileReader();
        
        reader.onload = (e) => {
          img.onload = () => {
            let width = img.width;
            let height = img.height;
            
            // Only resize if larger than max width
            if (width > maxWidth) {
              const scale = maxWidth / width;
              width = maxWidth;
              height = Math.round(height * scale);
            }
            
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              reject(new Error('Failed to get canvas context'));
              return;
            }
            
            // Fill with white background for transparent images
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, width, height);
            
            // Draw the image
            ctx.drawImage(img, 0, 0, width, height);
            
            // Determine quality based on file size
            let quality = 0.85; // Default quality
            if (file.size > 10 * 1024 * 1024) {
              quality = 0.75; // Lower quality for larger files
            }
            if (file.size > 50 * 1024 * 1024) {
              quality = 0.6; // Even lower quality for very large files
            }
            
            // Convert to blob
            canvas.toBlob(
              (blob) => {
                if (!blob) {
                  reject(new Error('Canvas to Blob conversion failed'));
                  return;
                }
                
                // Get original file extension
                const originalExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
                const mimeType = blob.type;
                const filename = `banner-${Date.now()}.${originalExt}`;
                
                // Create new File object
                const compressedFile = new File([blob], filename, {
                  type: mimeType,
                  lastModified: Date.now(),
                });
                
                const originalMB = (file.size / 1024 / 1024).toFixed(2);
                const compressedMB = (blob.size / 1024 / 1024).toFixed(2);
                const reduction = Math.round((1 - (blob.size / file.size)) * 100);
                
                console.log(`Image compressed: ${originalMB}MB → ${compressedMB}MB (${reduction}% reduction)`);
                console.log(`Quality used: ${quality * 100}%`);
                
                resolve(compressedFile);
              },
              'image/jpeg',
              quality
            );
          };
          
          img.onerror = () => reject(new Error('Failed to load image'));
          img.src = e.target?.result as string;
        };
        
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });
    } else {
      // For very large files, use a simpler approach
      return new Promise((resolve) => {
        // Create a copy of the file with a new name
        const filename = `banner-${Date.now()}.${file.name.split('.').pop() || 'jpg'}`;
        const newFile = new File([file], filename, {
          type: file.type,
          lastModified: Date.now(),
        });
        
        console.log(`Large file (${(file.size / 1024 / 1024).toFixed(2)}MB) - skipping compression to avoid memory issues`);
        toast.warning('Large image detected. Using original file (backend will optimize).');
        
        resolve(newFile);
      });
    }
  };

  const fetchBanner = async () => {
    try {
      setLoading(true);
      
      // Try direct fetch first
      try {
        const response = await api.admin.getBanner(parseInt(bannerId));
        const bannerData = response.data?.data || response.data;
        
        if (bannerData) {
          setFormData({
            title: bannerData.title || '',
            subtitle: bannerData.subtitle || '',
            description: bannerData.description || '',
            button_text: bannerData.button_text || '',
            button_link: bannerData.button_link || '',
            order: bannerData.order || 0,
            is_active: bannerData.is_active !== false,
            start_date: bannerData.start_date ? new Date(bannerData.start_date).toISOString().split('T')[0] : '',
            end_date: bannerData.end_date ? new Date(bannerData.end_date).toISOString().split('T')[0] : '',
            type: bannerData.type || 'homepage',
            category_slug: bannerData.category_slug || '',
          });
          
          if (bannerData.image) {
            setCurrentImage(bannerData.image);
            const imageUrl = bannerData.image_url || await getImageUrl(bannerData.image);
            setImagePreview(imageUrl);
          } else {
            setCurrentImage('');
            setImagePreview(getPlaceholderImage('desktop'));
          }
          
          if (bannerData.mobile_image) {
            setCurrentMobileImage(bannerData.mobile_image);
            const mobileImageUrl = bannerData.mobile_image_url || await getImageUrl(bannerData.mobile_image);
            setMobileImagePreview(mobileImageUrl);
          } else {
            setCurrentMobileImage('');
            setMobileImagePreview(getPlaceholderImage('mobile'));
          }
          
          setLoading(false);
          return;
        }
      } catch (directErr) {
        console.log('Direct fetch failed, trying list API:', directErr);
      }
      
      // Fallback to list API
      const response = await api.admin.getBanners();
      let bannersData: any[] = [];
      
      if (response.data?.data?.data) {
        bannersData = response.data.data.data;
      } else if (response.data?.data) {
        bannersData = response.data.data;
      } else if (Array.isArray(response.data)) {
        bannersData = response.data;
      }
      
      const bannerIdNum = parseInt(bannerId);
      const banner = bannersData.find((b: any) => 
        b.id === bannerIdNum || String(b.id) === bannerId
      );
      
      if (!banner) {
        setError('Banner not found');
        toast.error('Banner not found');
        setLoading(false);
        return;
      }

      setFormData({
        title: banner.title || '',
        subtitle: banner.subtitle || '',
        description: banner.description || '',
        button_text: banner.button_text || '',
        button_link: banner.button_link || '',
        order: banner.order || 0,
        is_active: banner.is_active !== false,
        start_date: banner.start_date ? new Date(banner.start_date).toISOString().split('T')[0] : '',
        end_date: banner.end_date ? new Date(banner.end_date).toISOString().split('T')[0] : '',
        type: banner.type || 'homepage',
        category_slug: banner.category_slug || '',
      });

      if (banner.image) {
        setCurrentImage(banner.image);
        const imageUrl = banner.image_url || await getImageUrl(banner.image);
        setImagePreview(imageUrl);
      } else {
        setCurrentImage('');
        setImagePreview(getPlaceholderImage('desktop'));
      }
      
      if (banner.mobile_image) {
        setCurrentMobileImage(banner.mobile_image);
        const mobileImageUrl = banner.mobile_image_url || await getImageUrl(banner.mobile_image);
        setMobileImagePreview(mobileImageUrl);
      } else {
        setCurrentMobileImage('');
        setMobileImagePreview(getPlaceholderImage('mobile'));
      }

    } catch (err: any) {
      console.error('Error fetching banner:', err);
      setError(err.message || 'Failed to load banner');
      toast.error('Failed to load banner');
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = async (imagePath: string): Promise<string> => {
    if (!imagePath) return getPlaceholderImage('desktop');
    
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    const cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    
    if (cleanPath.includes('storage/')) {
      return `${baseUrl}/${cleanPath}`;
    } else if (cleanPath.startsWith('banners/')) {
      return `${baseUrl}/storage/${cleanPath}`;
    } else {
      try {
        const testUrl = `${baseUrl}/storage/${cleanPath}`;
        const response = await fetch(testUrl, { method: 'HEAD' });
        if (response.ok) {
          return testUrl;
        }
      } catch (e) {
        console.log('Image not found at storage path:', cleanPath);
      }
      
      return getPlaceholderImage('desktop');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (name === 'order') {
      setFormData(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'desktop' | 'mobile') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (100MB limit)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      toast.error(`Image size should be less than 100MB (current: ${(file.size / 1024 / 1024).toFixed(2)}MB)`);
      e.target.value = '';
      return;
    }

    // Check file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a valid image (JPEG, PNG, WEBP, GIF, SVG)');
      e.target.value = '';
      return;
    }

    // Set preview immediately (but limit preview size for very large files)
    const reader = new FileReader();
    reader.onload = () => {
      if (type === 'desktop') {
        setImagePreview(reader.result as string);
        setShouldRemoveDesktop(false); // User uploaded new image, don't remove
      } else {
        setMobileImagePreview(reader.result as string);
        setShouldRemoveMobile(false); // User uploaded new image, don't remove
      }
    };
    
    // For very large files, warn the user
    if (file.size > 50 * 1024 * 1024) {
      toast.loading(`Processing large ${type} image (${(file.size / 1024 / 1024).toFixed(0)}MB)...`, {
        duration: 3000
      });
    }
    
    reader.readAsDataURL(file);

    try {
      setCompressing(true);
      const toastId = toast.loading(`Processing ${type} image (${(file.size / 1024 / 1024).toFixed(2)}MB)...`);
      
      const maxWidth = type === 'desktop' ? 1920 : 768;
      let processedFile;
      
      try {
        processedFile = await compressImage(file, maxWidth);
        
        const originalMB = (file.size / 1024 / 1024).toFixed(2);
        const processedMB = (processedFile.size / 1024 / 1024).toFixed(2);
        
        if (parseFloat(processedMB) < parseFloat(originalMB)) {
          toast.success(`Image compressed from ${originalMB}MB to ${processedMB}MB`, { 
            id: toastId,
            duration: 4000 
          });
        } else {
          toast.success(`Processing complete (${processedMB}MB)`, { 
            id: toastId,
            duration: 3000 
          });
        }
      } catch (compressErr) {
        console.error('Compression failed:', compressErr);
        processedFile = file;
        toast.success(`Using original image (${(file.size / 1024 / 1024).toFixed(2)}MB)`, { 
          id: toastId,
          duration: 3000 
        });
      }

      if (type === 'desktop') {
        setNewImage(processedFile);
      } else {
        setNewMobileImage(processedFile);
      }

    } catch (err: any) {
      console.error('Image processing error:', err);
      toast.error('Failed to process image');
      
      // Reset preview to original image
      if (type === 'desktop') {
        if (currentImage) {
          const url = await getImageUrl(currentImage);
          setImagePreview(url);
        } else {
          setImagePreview(getPlaceholderImage('desktop'));
        }
      } else {
        if (currentMobileImage) {
          const url = await getImageUrl(currentMobileImage);
          setMobileImagePreview(url);
        } else {
          setMobileImagePreview(getPlaceholderImage('mobile'));
        }
      }
      
      // Reset file input
      if (type === 'desktop' && desktopFileInputRef.current) {
        desktopFileInputRef.current.value = '';
      } else if (mobileFileInputRef.current) {
        mobileFileInputRef.current.value = '';
      }
    } finally {
      setCompressing(false);
    }
  };

  const clearDesktopImage = () => {
    setNewImage(null);
    setCurrentImage('');
    setImagePreview(getPlaceholderImage('desktop'));
    setShouldRemoveDesktop(true); // Mark for removal
    
    if (desktopFileInputRef.current) {
      desktopFileInputRef.current.value = '';
    }
    toast.success('Desktop image marked for removal');
  };

  const clearMobileImage = () => {
    setNewMobileImage(null);
    setCurrentMobileImage('');
    setMobileImagePreview(getPlaceholderImage('mobile'));
    setShouldRemoveMobile(true); // Mark for removal
    
    if (mobileFileInputRef.current) {
      mobileFileInputRef.current.value = '';
    }
    toast.success('Mobile image marked for removal');
  };

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  try {
    setSaving(true);
    setError('');

    // Validation
    if (!formData.title.trim()) {
      toast.error('Title is required');
      setSaving(false);
      return;
    }

    if (formData.order === null || formData.order === undefined) {
      toast.error('Display order is required');
      setSaving(false);
      return;
    }

    // Create FormData - MATCHING CREATE BANNER FORMAT
    const data = new FormData();
    
    // Add form fields (EXACTLY like create banner)
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        if (key === 'is_active') {
          data.append(key, value ? '1' : '0');
        } else if (key === 'order') {
          data.append(key, String(value));
        } else if (typeof value === 'boolean') {
          data.append(key, value.toString());
        } else {
          data.append(key, String(value));
        }
      }
    });

    // Handle desktop image
    if (newImage) {
      data.append('image', newImage);
      console.log(`Sending new desktop image: ${newImage.name} (${(newImage.size / 1024 / 1024).toFixed(2)}MB)`);
    } else if (shouldRemoveDesktop) {
      // If backend expects file deletion differently, adjust this
      // For now, send empty string like create banner does
      data.append('image', ''); // Or 'remove' flag if backend expects it
    } else {
      // Keep existing image - no image field sent
      console.log('Keeping existing desktop image');
    }

    // Handle mobile image - MATCH CREATE BANNER EXACTLY
    if (newMobileImage) {
      data.append('mobile_image', newMobileImage);
      console.log(`Sending new mobile image: ${newMobileImage.name} (${(newMobileImage.size / 1024 / 1024).toFixed(2)}MB)`);
    } else if (shouldRemoveMobile) {
      // Send empty string like create banner
      data.append('mobile_image', '');
      console.log('Sending empty mobile_image field');
    } else {
      // Keep existing mobile image - send empty string to match create banner
      data.append('mobile_image', '');
      console.log('Sending empty mobile_image (keep existing)');
    }

    // Log FormData for debugging
    console.log('Submitting FormData for edit:');
    for (let [key, value] of data.entries()) {
      console.log(`${key}:`, value instanceof File ? 
        `File: ${value.name} (${(value.size / 1024 / 1024).toFixed(2)}MB)` : 
        value);
    }

    // Send update request
    await api.admin.updateBanner(parseInt(bannerId), data);
    
    toast.success('Banner updated successfully!');
    
    // Clear new image states
    setNewImage(null);
    setNewMobileImage(null);
    setShouldRemoveDesktop(false);
    setShouldRemoveMobile(false);
    
    // Navigate back after a short delay
    setTimeout(() => {
      router.push('/admin/banners');
    }, 1500);
    
  } catch (err: any) {
    console.error('Update error:', err);
    console.error('Full error response:', err.response?.data);
    
    let errorMessage = 'Failed to update banner';
    
    if (err.response?.data?.message) {
      errorMessage = err.response.data.message;
    } else if (err.response?.data?.error) {
      errorMessage = err.response.data.error;
    } else if (err.response?.data?.errors) {
      const errors = err.response.data.errors;
      errorMessage = Object.values(errors)
        .flat()
        .join(', ');
    } else if (err.message) {
      errorMessage = err.message;
    }
    
    setError(errorMessage);
    toast.error(errorMessage);
  } finally {
    setSaving(false);
  }
};

  const getPlaceholderImage = (type: 'desktop' | 'mobile') => {
    const width = type === 'desktop' ? 1200 : 768;
    const height = type === 'desktop' ? 400 : 1024;
    return `https://placehold.co/${width}x${height}/f0f0f0/666666?text=Banner+Image&font=roboto`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading banner...</span>
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
              <h1 className="text-3xl font-bold text-gray-900">Edit Banner</h1>
              <p className="text-gray-600 mt-1">Update banner details and images</p>
            </div>
            <div className="text-sm text-gray-500">
              Banner ID: {bannerId}
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700">{error}</p>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Basic Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Banner Details Card */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Banner Details</h2>
                
                <div className="space-y-4">
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter banner title"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subtitle
                    </label>
                    <input
                      type="text"
                      name="subtitle"
                      value={formData.subtitle}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter banner subtitle"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter banner description"
                    />
                  </div>

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
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Shop Now"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Button Link
                      </label>
                      <input
                        type="url"
                        name="button_link"
                        value={formData.button_link}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="https://example.com or /category/vegetables"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Display Settings Card */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Display Settings</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Banner Type *
                    </label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="homepage">Homepage Banner</option>
                      <option value="category">Category Banner</option>
                      <option value="promotional">Promotional Banner</option>
                      <option value="sidebar">Sidebar Banner</option>
                    </select>
                  </div>

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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {formData.type === 'category' && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category Slug
                      </label>
                      <input
                        type="text"
                        name="category_slug"
                        value={formData.category_slug}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., vegetables"
                      />
                    </div>
                  )}

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
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Desktop Image *</h2>
                  <div className="flex items-center text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                    <AlertTriangle size={12} className="mr-1" />
                    Max 100MB
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="mb-4">
                    <div className="relative h-48 w-full bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={imagePreview}
                        alt="Banner preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = getPlaceholderImage('desktop');
                        }}
                      />
                      {imagePreview && !imagePreview.includes('placehold.co') && (
                        <button
                          type="button"
                          onClick={clearDesktopImage}
                          className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600"
                          title="Remove image"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                    {shouldRemoveDesktop && (
                      <p className="text-xs text-red-600 mt-1">
                        ⚠️ Desktop image will be removed
                      </p>
                    )}
                    {newImage && (
                      <p className="text-xs mt-1">
                        <span className="text-green-600">✓ New image ready:</span> {newImage.name} ({(newImage.size / 1024 / 1024).toFixed(2)} MB)
                        {newImage.size > 50 * 1024 * 1024 && (
                          <span className="text-amber-600 ml-1">(Large file)</span>
                        )}
                      </p>
                    )}
                    {currentImage && !newImage && !shouldRemoveDesktop && (
                      <p className="text-xs text-gray-500 mt-1">
                        Current image will be kept
                      </p>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-center w-full">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          {compressing ? (
                            <Loader2 className="w-8 h-8 mb-2 text-blue-500 animate-spin" />
                          ) : (
                            <Upload className="w-8 h-8 mb-2 text-gray-500" />
                          )}
                          <p className="mb-1 text-sm text-gray-500">
                            <span className="font-semibold">Click to upload</span>
                          </p>
                          <p className="text-xs text-gray-500">PNG, JPG, WEBP, GIF, SVG (Max 100MB)</p>
                          <p className="text-xs text-blue-500 mt-1">✓ Auto-resize to 1920px width</p>
                          <p className="text-xs text-amber-500 mt-1">✓ Large files supported</p>
                        </div>
                        <input
                          ref={desktopFileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageChange(e, 'desktop')}
                          className="hidden"
                          disabled={compressing}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile Image Card */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Mobile Image (Optional)</h2>
                  <div className="flex items-center text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                    <AlertTriangle size={12} className="mr-1" />
                    Max 100MB
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="mb-4">
                    <div className="relative h-32 w-full bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={mobileImagePreview}
                        alt="Mobile banner preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = getPlaceholderImage('mobile');
                        }}
                      />
                      {mobileImagePreview && !mobileImagePreview.includes('placehold.co') && (
                        <button
                          type="button"
                          onClick={clearMobileImage}
                          className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600"
                          title="Remove mobile image"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                    {shouldRemoveMobile && (
                      <p className="text-xs text-red-600 mt-1">
                        ⚠️ Mobile image will be removed
                      </p>
                    )}
                    {newMobileImage && (
                      <p className="text-xs mt-1">
                        <span className="text-green-600">✓ New image ready:</span> {newMobileImage.name} ({(newMobileImage.size / 1024 / 1024).toFixed(2)} MB)
                        {newMobileImage.size > 50 * 1024 * 1024 && (
                          <span className="text-amber-600 ml-1">(Large file)</span>
                        )}
                      </p>
                    )}
                    {currentMobileImage && !newMobileImage && !shouldRemoveMobile && (
                      <p className="text-xs text-gray-500 mt-1">
                        Current image will be kept
                      </p>
                    )}
                    {!currentMobileImage && !newMobileImage && !shouldRemoveMobile && (
                      <p className="text-xs text-gray-500 mt-2">
                        Will use desktop image on mobile if not specified
                      </p>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-center w-full">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          {compressing ? (
                            <Loader2 className="w-8 h-8 mb-2 text-blue-500 animate-spin" />
                          ) : (
                            <Upload className="w-8 h-8 mb-2 text-gray-500" />
                          )}
                          <p className="mb-1 text-sm text-gray-500">
                            <span className="font-semibold">Click to upload</span>
                          </p>
                          <p className="text-xs text-gray-500">PNG, JPG, WEBP, GIF, SVG (Max 100MB)</p>
                          <p className="text-xs text-blue-500 mt-1">✓ Auto-resize to 768px width</p>
                          <p className="text-xs text-amber-500 mt-1">✓ Large files supported</p>
                        </div>
                        <input
                          ref={mobileFileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageChange(e, 'mobile')}
                          className="hidden"
                          disabled={compressing}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Save Card */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Save Changes</h2>
                
                <div className="space-y-4">
                  <div className="text-sm text-gray-600">
                    <p>Review your changes before saving.</p>
                    <p className="mt-1">Required fields are marked with *</p>
                    <div className="mt-2 space-y-1">
                      <p className="text-green-600">✓ Images auto-resized (1920px desktop, 768px mobile)</p>
                      <p className="text-green-600">✓ Max file size: 100MB per image</p>
                      <p className="text-amber-600">⚠️ Large files may take longer to upload</p>
                      {shouldRemoveDesktop && <p className="text-red-600">⚠️ Desktop image will be removed</p>}
                      {shouldRemoveMobile && <p className="text-red-600">⚠️ Mobile image will be removed</p>}
                    </div>
                  </div>

                  <div className="flex space-x-4">
                    <button
                      type="submit"
                      disabled={saving || compressing}
                      className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          {newImage?.size > 50 * 1024 * 1024 || newMobileImage?.size > 50 * 1024 * 1024 ? 
                            'Uploading large files...' : 'Saving...'}
                        </>
                      ) : (
                        <>
                          <Save size={18} />
                          Save Changes
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => router.push('/admin/banners')}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                      disabled={saving || compressing}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Preview Section */}
        <div className="mt-8 bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Live Preview</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Desktop Preview</h3>
              <div className="bg-gray-100 rounded-lg overflow-hidden border border-gray-300">
                <div className="relative h-64 bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                  {imagePreview && !imagePreview.includes('placehold.co') ? (
                    <div className="absolute inset-0">
                      <img
                        src={imagePreview}
                        alt="Banner preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = getPlaceholderImage('desktop');
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent"></div>
                    </div>
                  ) : (
                    <div className="text-white text-center p-4">
                      <div className="text-lg font-bold mb-2">No Image Uploaded</div>
                      <p className="text-sm opacity-90">Upload an image to see preview</p>
                    </div>
                  )}
                  <div className="relative z-10 p-6 text-white">
                    <h4 className="text-xl font-bold mb-2">{formData.title || 'Banner Title'}</h4>
                    {formData.subtitle && (
                      <p className="text-sm opacity-90 mb-4">{formData.subtitle}</p>
                    )}
                    {formData.button_text && (
                      <button className="bg-white text-blue-600 px-4 py-2 rounded text-sm font-medium">
                        {formData.button_text}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Mobile Preview</h3>
              <div className="relative mx-auto w-64 bg-gray-100 rounded-2xl overflow-hidden border border-gray-300 shadow-lg">
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-24 h-6 bg-gray-800 rounded-b-lg z-20"></div>
                <div className="relative h-96">
                  {mobileImagePreview && !mobileImagePreview.includes('placehold.co') ? (
                    <div className="absolute inset-0">
                      <img
                        src={mobileImagePreview}
                        alt="Mobile banner preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = getPlaceholderImage('mobile');
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-transparent"></div>
                    </div>
                  ) : imagePreview && !imagePreview.includes('placehold.co') ? (
                    <div className="absolute inset-0">
                      <img
                        src={imagePreview}
                        alt="Mobile banner preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = getPlaceholderImage('mobile');
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-transparent"></div>
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-blue-400 to-purple-500">
                      <div className="text-white text-center p-4">
                        <div className="text-sm font-bold mb-1">No Image</div>
                        <p className="text-xs opacity-90">Upload image for preview</p>
                      </div>
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                    <h4 className="text-base font-bold mb-1 truncate">{formData.title || 'Title'}</h4>
                    {formData.subtitle && (
                      <p className="text-xs opacity-90 mb-3 truncate">{formData.subtitle}</p>
                    )}
                    {formData.button_text && (
                      <button className="bg-white text-blue-600 px-3 py-1.5 rounded text-xs font-medium">
                        {formData.button_text}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}