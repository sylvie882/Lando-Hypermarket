// app/categories/[slug]/page.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, notFound, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Category, Product } from '@/types';
import ProductCard from '@/components/ui/ProductCard';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { ArrowLeft, ShoppingBag, ChevronRight, Home, RefreshCw, AlertCircle } from 'lucide-react';
import Link from 'next/link';

const CategoryPage = () => {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  
  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const fetchCategoryAndProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Add delay to avoid rate limiting
      if (retryCount > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
      }

      const categoriesRes = await api.categories.getAll();
      const allCategories = categoriesRes.data || [];
      
      // FIXED: Add type annotation
      let foundCategory = allCategories.find((cat: Category) => cat.slug === slug);
      
      if (!foundCategory && !isNaN(Number(slug))) {
        // FIXED: Add type annotation
        foundCategory = allCategories.find((cat: Category) => cat.id.toString() === slug);
      }
      
      if (!foundCategory) {
        notFound();
        return;
      }
      
      setCategory(foundCategory);
      
      try {
        const productsRes = await api.products.getAll({
          category_id: foundCategory.id,
          per_page: 50
        });
        
        const productsData = productsRes.data?.data || productsRes.data || [];
        setProducts(productsData);
      } catch (productError: any) {
        console.error('Error fetching products:', productError);
        setProducts([]);
        
        if (productError.response?.status === 429) {
          setError('Too many requests. Please wait a moment and try again.');
        }
      }
      
    } catch (error: any) {
      console.error('Error fetching category:', error);
      
      if (error.response?.status === 429) {
        setError('Too many requests to the server. Please wait a moment and try again.');
        setRetryCount(prev => prev + 1);
      } else if (error.response?.status === 404) {
        notFound();
      } else {
        setError('Failed to load category. Please check your connection and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [slug, retryCount]);

  useEffect(() => {
    if (slug) {
      fetchCategoryAndProducts();
    }
  }, [slug, fetchCategoryAndProducts]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    fetchCategoryAndProducts();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        {/* Breadcrumb */}
        <div className="border-b border-gray-100">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Link href="/" className="flex items-center gap-1 hover:text-orange-600">
                <Home size={14} />
                <span>Home</span>
              </Link>
              <ChevronRight size={14} />
              <Link href="/categories" className="hover:text-orange-600">
                Categories
              </Link>
              <ChevronRight size={14} />
              <span className="text-gray-900 font-medium truncate">Error</span>
            </div>
          </div>
        </div>

        {/* Error Message */}
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-lg mx-auto text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="text-red-600" size={32} />
            </div>
            
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Error Loading Category
            </h2>
            
            <p className="text-gray-600 mb-6">
              {error}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={handleRetry}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors"
              >
                <RefreshCw size={18} />
                <span>Try Again</span>
              </button>
              
              <Link
                href="/categories"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                <ArrowLeft size={18} />
                <span>Back to Categories</span>
              </Link>
            </div>
            
            {retryCount > 0 && (
              <div className="mt-4 text-sm text-gray-500">
                <p>Retry attempt: {retryCount}</p>
                <p className="mt-1">Waiting {retryCount} second{retryCount > 1 ? 's' : ''} before retry...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!category) {
    notFound();
  }

  const productCount = category.active_products_count || category.products_count || products.length;

  // Function to fix image URLs
  const getFixedImageUrl = (url: string) => {
    if (!url) return '';
    
    if (url.includes('localhost:8000')) {
      return url;
    }
    
    if (url.includes('localhost/storage/')) {
      return url.replace('localhost/storage/', 'api.hypermarket.co.ke/storage/');
    }
    
    if (url.startsWith('/storage/')) {
      return `https://api.hypermarket.co.ke${url}`;
    }
    
    if (!url.startsWith('http')) {
      return `https://api.hypermarket.co.ke/storage/${url.replace('storage/', '')}`;
    }
    
    return url;
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <div className="border-b border-gray-100">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Link href="/" className="flex items-center gap-1 hover:text-orange-600">
              <Home size={14} />
              <span>Home</span>
            </Link>
            <ChevronRight size={14} />
            <Link href="/categories" className="hover:text-orange-600">
              Categories
            </Link>
            <ChevronRight size={14} />
            <span className="text-gray-900 font-medium truncate">{category.name}</span>
          </div>
        </div>
      </div>

      {/* Category Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-start gap-6">
            <div className="md:w-1/4">
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl overflow-hidden border border-orange-200 shadow-sm">
                <div className="aspect-square flex items-center justify-center p-6">
                  {category.image_url || category.image ? (
                    <img
                      src={getFixedImageUrl(category.image_url || category.image || '')}
                      alt={category.name}
                      className="w-full h-full object-contain transition-transform duration-500 hover:scale-105"
                      onError={(e) => {
                        console.error('Image failed to load:', e.currentTarget.src);
                        e.currentTarget.src = 'https://api.hypermarket.co.ke/storage/default-category.jpg';
                        e.currentTarget.className = 'w-full h-full object-contain opacity-50';
                      }}
                      loading="lazy"
                    />
                  ) : (
                    <div className="text-5xl">
                      {category.name.includes('Fruit') ? '🍎' :
                       category.name.includes('Vegetable') ? '🥦' :
                       category.name.includes('Dairy') ? '🥛' :
                       category.name.includes('Meat') ? '🥩' :
                       category.name.includes('Fish') ? '🐟' :
                       category.name.includes('Poultry') ? '🍗' :
                       category.name.includes('Beverage') ? '🥤' :
                       category.name.includes('Snack') ? '🍪' :
                       category.name.includes('Household') ? '🏠' : '🛒'}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="md:w-3/4">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
                {category.name}
              </h1>
              
              {category.description && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-5">
                  <p className="text-gray-700">
                    {category.description}
                  </p>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 px-4 py-2 rounded-lg">
                  <ShoppingBag size={18} className="text-orange-600" />
                  <span className="font-medium text-gray-900">
                    {productCount} {productCount === 1 ? 'product' : 'products'}
                  </span>
                </div>
                
                <Link
                  href="/categories"
                  className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium text-sm bg-white border border-orange-200 hover:border-orange-300 px-4 py-2 rounded-lg transition-colors"
                >
                  <ArrowLeft size={16} />
                  <span>Back to categories</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div className="py-8">
        <div className="container mx-auto px-4">
          {products.length > 0 ? (
            <>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Products in this category
                  </h2>
                  <p className="text-gray-600 mt-1">
                    Discover our curated selection of {category.name.toLowerCase()}
                  </p>
                </div>
                <div className="text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg">
                  Showing {products.length} of {productCount}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {products.map((product) => (
                  <div key={product.id} className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100">
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <div className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-5">
                <ShoppingBag size={32} className="text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                No products available yet
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                This category doesn't have any products yet. Check back soon or browse other categories.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/categories"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors"
                >
                  <ArrowLeft size={18} />
                  <span>Browse other categories</span>
                </Link>
                <Link
                  href="/products"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  <ShoppingBag size={18} />
                  <span>View all products</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Related Categories */}
      {products.length > 0 && (
        <div className="py-8 bg-gradient-to-b from-white to-orange-50/30 border-t border-gray-100">
          <div className="container mx-auto px-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Related Categories
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {[
                { name: 'Fruits', slug: 'fruits', icon: '🍎', color: 'bg-red-50 border-red-100' },
                { name: 'Vegetables', slug: 'vegetables', icon: '🥦', color: 'bg-green-50 border-green-100' },
                { name: 'Dairy', slug: 'dairy-products', icon: '🥛', color: 'bg-blue-50 border-blue-100' },
                { name: 'Meat', slug: 'animal-products', icon: '🥩', color: 'bg-red-50 border-red-100' },
                { name: 'Seafood', slug: 'fish-seafood', icon: '🐟', color: 'bg-blue-50 border-blue-100' },
                { name: 'Grains', slug: 'grains-flour', icon: '🌾', color: 'bg-amber-50 border-amber-100' },
              ]
              .filter(cat => cat.slug !== category.slug)
              .slice(0, 4)
              .map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/categories/${cat.slug}`}
                  className={`${cat.color} rounded-xl border p-4 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 text-center group`}
                >
                  <div className="text-3xl mb-2 group-hover:scale-110 transition-transform duration-300">
                    {cat.icon}
                  </div>
                  <div className="text-sm font-medium text-gray-900 group-hover:text-orange-600 transition-colors">
                    {cat.name}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryPage;