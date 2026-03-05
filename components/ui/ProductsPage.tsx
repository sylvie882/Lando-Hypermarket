'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import ProductCard from '@/components/ui/ProductCard';
import { Product, Category } from '@/types';
import { api } from '@/lib/api';
import { ChevronRight, Home, ShoppingBag, AlertCircle, RefreshCw } from 'lucide-react';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

interface ProductsPageProps {
  categoryId?: number;
  title?: string;
}

const ProductsPage: React.FC<ProductsPageProps> = ({
  categoryId,
  title = 'Shop your Favourites'
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('offers');
  const [categories, setCategories] = useState<Category[]>([]);

  const tabs = [
    { id: 'offers', label: 'Offers' },
    { id: 'fruits', label: 'Fruits', categoryId: 45 },
    { id: 'vegetables', label: 'Vegetables', categoryId: 46 },
  ];

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (activeTab) {
      fetchProducts();
    }
  }, [activeTab]);

  const fetchCategories = async () => {
    try {
      const response = await api.categories.getAll();
      const categoriesData = response.data || [];
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      
      // Update tab category IDs if needed
      const fruitsCat = categoriesData.find((c: Category) => 
        c.name.toLowerCase().includes('fruit') || c.slug?.includes('fruit')
      );
      const vegCat = categoriesData.find((c: Category) => 
        c.name.toLowerCase().includes('vegetable') || c.slug?.includes('vegetable')
      );
      
      if (fruitsCat) {
        tabs[1].categoryId = fruitsCat.id;
      }
      if (vegCat) {
        tabs[2].categoryId = vegCat.id;
      }
      
      console.log('Categories loaded:', categoriesData);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let response;
      console.log(`Fetching products for tab: ${activeTab}`);

      const currentTab = tabs.find(tab => tab.id === activeTab);
      
      if (activeTab === 'offers') {
        // Try multiple endpoints for offers
        try {
          // First try getDiscounted
          response = await api.products.getDiscounted({ per_page: 20 });
          console.log('Discounted products response:', response);
        } catch (err) {
          console.log('getDiscounted failed, trying getAll with params');
          // Fallback: try to get all products with discount filter
          response = await api.products.getAll({ 
            per_page: 20 
          });
          // Filter products with discount on frontend if needed
          if (response?.data) {
            const productsData = response.data.data || response.data;
            const discountedProducts = Array.isArray(productsData) 
              ? productsData.filter((p: Product) => p.discount_percentage > 0 || p.sale_price)
              : [];
            setProducts(discountedProducts);
            setLoading(false);
            return;
          }
        }
      } else if (currentTab?.categoryId) {
        console.log(`Fetching products for category ID: ${currentTab.categoryId}`);
        response = await api.products.getByCategory(currentTab.categoryId, { 
          per_page: 20
        });
        console.log('Category products response:', response);
      }

      if (response?.data) {
        const productsData = response.data.data || response.data;
        setProducts(Array.isArray(productsData) ? productsData : []);
      } else {
        setProducts([]);
      }
    } catch (error: any) {
      console.error('Error fetching products:', error);
      setError(error?.message || 'Failed to load products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const getFixedImageUrl = (url: string) => {
    if (!url) return '/images/placeholder.jpg';
    
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

  const handleRetry = () => {
    fetchProducts();
  };

  if (loading && products.length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

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
            <span className="text-gray-900 font-medium">Products</span>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {title}
          </h1>
          <Link
            href="/products"
            className="text-sm text-gray-700 underline underline-offset-2 hover:text-gray-900 transition-colors"
          >
            View all products
          </Link>
        </div>

        {/* Pill Tabs */}
        <div className="flex gap-3 mb-8 overflow-x-auto hide-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                px-5 py-2 rounded-full text-sm font-medium border transition-all whitespace-nowrap
                ${activeTab === tab.id
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-gray-500'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="w-full">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-100 aspect-square rounded-2xl mb-3"></div>
                  <div className="h-4 bg-gray-100 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-100 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="text-red-600" size={32} />
              </div>
              <p className="text-red-500 mb-4">{error}</p>
              <button
                onClick={handleRetry}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors"
              >
                <RefreshCw size={18} />
                <span>Try Again</span>
              </button>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-5">
                <ShoppingBag size={32} className="text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                No products found
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                No products available in this category at the moment.
              </p>
              <button
                onClick={() => setActiveTab('offers')}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors"
              >
                View offers instead
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-sm transition-shadow duration-200"
                >
                  <ProductCard
                    product={{
                      ...product,
                      image: product.image ? getFixedImageUrl(product.image) : 
                             product.images?.[0] ? getFixedImageUrl(product.images[0]) : 
                             '/images/placeholder.jpg'
                    }}
                    onViewTrack={(id) => console.log('Viewing:', id)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default ProductsPage;