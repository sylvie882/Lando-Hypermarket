'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Plus, Edit, Trash2, ChevronDown, ChevronRight, Image as ImageIcon, X } from 'lucide-react';

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  image: string | null;
  image_url: string | null;
  parent_id: number | null;
  is_active: boolean;
  order: number;
  children?: Category[];
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<number[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    parent_id: '',
    order: '0',
    is_active: true,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/categories/tree');
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      try {
        const response = await api.get('/categories/tree');
        setCategories(response.data);
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (id: number) => {
    setExpandedCategories(prev =>
      prev.includes(id) ? prev.filter(catId => catId !== id) : [...prev, id]
    );
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    console.log('File selected:', file?.name, file?.size, file?.type);
    
    if (file) {
      // Validate file size (2MB limit)
      if (file.size > 2 * 1024 * 1024) {
        alert('Image size must be less than 2MB');
        e.target.value = '';
        return;
      }
      
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        alert('Invalid image format. Please use JPEG, PNG, GIF, or WebP');
        e.target.value = '';
        return;
      }
      
      setImageFile(file);
      setRemoveImage(false);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        console.log('FileReader loaded, setting preview');
        setImagePreview(reader.result as string);
      };
      reader.onerror = () => {
        console.error('FileReader error:', reader.error);
        alert('Error loading image preview');
      };
      reader.readAsDataURL(file);
    } else {
      console.log('No file selected');
      setImageFile(null);
      setImagePreview(null);
    }
  };

  const handleRemoveImage = () => {
    console.log('Removing image - setting removeImage to true');
    setImageFile(null);
    setImagePreview(null);
    setRemoveImage(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (isSubmitting) return;
  
  setIsSubmitting(true);
  
  console.log('Submitting form with:', {
    editingCategoryId: editingCategory?.id,
    formData,
    hasImageFile: !!imageFile,
    imageFileName: imageFile?.name,
    imageFileSize: imageFile?.size,
    removeImage,
    isSubmitting
  });
  
  try {
    const formDataToSend = new FormData();
    
    // Append all text fields
    formDataToSend.append('name', formData.name);
    
    if (formData.slug) {
      formDataToSend.append('slug', formData.slug);
    }
    
    if (formData.description) {
      formDataToSend.append('description', formData.description);
    }
    
    formDataToSend.append('parent_id', formData.parent_id || '');
    formDataToSend.append('order', formData.order);
    formDataToSend.append('is_active', formData.is_active ? '1' : '0');
    
    // Handle image
    if (imageFile && imageFile.size > 0) {
      console.log('Adding new image file to FormData:', {
        name: imageFile.name,
        size: imageFile.size,
        type: imageFile.type
      });
      formDataToSend.append('image', imageFile);
      // Clear removeImage flag when uploading new image
      setRemoveImage(false);
    } else if (removeImage) {
      // Scenario 2: Remove existing image
      console.log('Setting remove_image flag to 1');
      formDataToSend.append('remove_image', '1');
    }
    // Scenario 3: No image change - don't send anything
    
    // Log FormData contents for debugging
    console.log('FormData contents:');
    const formDataEntries: {[key: string]: string} = {};
    for (let [key, value] of formDataToSend.entries()) {
      if (value instanceof File) {
        formDataEntries[key] = `${value.name} (${value.size} bytes)`;
      } else {
        formDataEntries[key] = value as string;
      }
    }
    console.log(formDataEntries);
    
    let response;
    if (editingCategory) {
      console.log('Updating category:', editingCategory.id);
      formDataToSend.append('_method', 'PUT');
      
      // DON'T set Content-Type header for FormData - let browser set it
      response = await api.post(`/admin/categories/${editingCategory.id}`, formDataToSend);
      alert('Category updated successfully');
    } else {
      console.log('Creating new category');
      
      // DON'T set Content-Type header for FormData - let browser set it
      response = await api.post('/admin/categories', formDataToSend);
      alert('Category created successfully');
    }
    
    console.log('Response:', response.data);
    resetForm();
    fetchCategories();
  } catch (error: any) {
    console.error('Full error:', error);
    console.error('Error response:', error.response?.data);
    
    // Check for network errors
    if (error.code === 'ERR_NETWORK' || error.message.includes('Failed to fetch') || error.message.includes('CONNECTION_REFUSED')) {
      alert(`Network Error: Cannot connect to the server. Please check:
1. The Laravel API server is running
2. The API URL is correct: ${process.env.NEXT_PUBLIC_API_URL}
3. CORS is properly configured
4. You have internet connection`);
    } else if (error.response?.data?.errors) {
      console.error('Validation errors:', error.response.data.errors);
      
      const errorMessages = Object.entries(error.response.data.errors)
        .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
        .join('\n');
      alert(`Validation errors:\n${errorMessages}`);
    } else if (error.response?.data?.message) {
      alert(error.response.data.message);
    } else if (error.message) {
      alert(error.message);
    } else {
      alert('Failed to save category. Please try again.');
    }
  } finally {
    setIsSubmitting(false);
  }
};

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    
    try {
      await api.delete(`/admin/categories/${id}`);
      alert('Category deleted successfully');
      fetchCategories();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete category');
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingCategory(null);
    setFormData({ 
      name: '', 
      slug: '', 
      description: '', 
      parent_id: '', 
      order: '0',
      is_active: true 
    });
    setImageFile(null);
    setImagePreview(null);
    setRemoveImage(false);
    setIsSubmitting(false);
  };

  const renderCategoryTree = (categories: Category[], level = 0) => {
    return categories.map(category => (
      <div key={category.id} className="mb-1">
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
          <div className="flex items-center flex-1">
            <button
              onClick={() => toggleCategory(category.id)}
              className="p-1 mr-2 hover:bg-gray-200 rounded"
            >
              {category.children && category.children.length > 0 ? (
                expandedCategories.includes(category.id) ? (
                  <ChevronDown size={16} />
                ) : (
                  <ChevronRight size={16} />
                )
              ) : (
                <span className="w-6" />
              )}
            </button>
            <div style={{ paddingLeft: level * 20 }} className="flex items-center gap-2">
              {category.image_url ? (
                <img 
                  src={category.image_url} 
                  alt={category.name}
                  className="w-8 h-8 rounded object-cover border border-gray-300"
                />
              ) : (
                <div className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded border border-gray-300">
                  <ImageIcon size={14} className="text-gray-400" />
                </div>
              )}
              <div>
                <span className={`px-2 py-1 text-xs rounded-full mr-2 ${
                  category.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {category.is_active ? 'Active' : 'Inactive'}
                </span>
                <span className="font-medium">{category.name}</span>
                {category.description && (
                  <span className="ml-2 text-sm text-gray-500">{category.description}</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => {
                setEditingCategory(category);
                setFormData({
                  name: category.name,
                  slug: category.slug,
                  description: category.description,
                  parent_id: category.parent_id?.toString() || '',
                  order: category.order.toString(),
                  is_active: category.is_active,
                });
                setImagePreview(category.image_url);
                setImageFile(null);
                setRemoveImage(false);
                setShowForm(true);
              }}
              className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
            >
              <Edit size={16} />
            </button>
            <button
              onClick={() => handleDelete(category.id)}
              className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
        {category.children && expandedCategories.includes(category.id) && (
          <div className="ml-8">
            {renderCategoryTree(category.children, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  return (
    <div>
      <div className="flex justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-gray-600">Manage your product categories</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          <Plus size={16} className="mr-2" />
          Add Category
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="p-6">
            {categories.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-gray-500">No categories found</p>
                <button
                  onClick={() => {
                    resetForm();
                    setShowForm(true);
                  }}
                  className="mt-4 text-blue-600 hover:text-blue-800"
                >
                  Create your first category
                </button>
              </div>
            ) : (
              renderCategoryTree(categories)
            )}
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div 
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
              onClick={resetForm}
            ></div>
            
            <div className="inline-block w-full max-w-md my-8 overflow-hidden text-left align-middle transition-all transform bg-white rounded-lg shadow-xl">
              <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingCategory ? 'Edit Category' : 'Add New Category'}
                </h3>
              </div>

              <form onSubmit={handleSubmit} className="px-6 py-4">
                <div className="space-y-4">
                  {/* Image Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Image (Optional - Max 2MB)
                    </label>
                    <div className="space-y-2">
                      {imagePreview ? (
                        <div className="relative">
                          <img 
                            src={imagePreview} 
                            alt="Preview" 
                            className="w-full h-32 object-cover rounded-lg border border-gray-300"
                          />
                          <button
                            type="button"
                            onClick={handleRemoveImage}
                            className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : editingCategory?.image_url && !removeImage ? (
                        <div className="relative">
                          <img 
                            src={editingCategory.image_url} 
                            alt="Current" 
                            className="w-full h-32 object-cover rounded-lg border border-gray-300"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center">
                            <div className="opacity-0 hover:opacity-100 flex gap-1">
                              <label className="cursor-pointer p-1.5 bg-white rounded-full hover:bg-gray-100">
                                <ImageIcon size={14} />
                                <input
                                  type="file"
                                  id="image-upload"
                                  accept="image/jpeg,image/png,image/jpg,image/gif,image/webp"
                                  onChange={handleImageChange}
                                  className="hidden"
                                />
                              </label>
                              <button
                                type="button"
                                onClick={handleRemoveImage}
                                className="p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 cursor-pointer">
                          <ImageIcon className="w-8 h-8 text-gray-400 mb-1" />
                          <span className="text-sm text-gray-500">
                            Click to upload image
                          </span>
                          <input
                            type="file"
                            id="image-upload"
                            accept="image/jpeg,image/png,image/jpg,image/gif,image/webp"
                            onChange={handleImageChange}
                            className="hidden"
                          />
                        </label>
                      )}
                      {removeImage && editingCategory?.image_url && (
                        <div className="text-xs text-red-500 p-2 bg-red-50 rounded">
                          Current image will be removed
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                      className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Slug</label>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => setFormData({...formData, slug: e.target.value})}
                      className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="auto-generates-if-empty"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      rows={3}
                      className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Parent Category</label>
                    <select
                      value={formData.parent_id}
                      onChange={(e) => setFormData({...formData, parent_id: e.target.value})}
                      className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={isSubmitting}
                    >
                      <option value="">No Parent (Top Level)</option>
                      {categories
                        .filter(cat => !editingCategory || cat.id !== editingCategory.id)
                        .map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))
                      }
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Order</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.order}
                      onChange={(e) => setFormData({...formData, order: e.target.value})}
                      className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      disabled={isSubmitting}
                    />
                    <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                      Active
                    </label>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {editingCategory ? 'Updating...' : 'Creating...'}
                      </span>
                    ) : (
                      editingCategory ? 'Update' : 'Create'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}