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

  // Define tabs with default slugs
  const [tabs, setTabs] = useState([
    { id: 'offers', label: 'Offers', slug: null },
    { id: 'fruits', label: 'Fruits', slug: 'fruits' },
    { id: 'vegetables', label: 'Vegetables', slug: 'vegetables' },
  ]);

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
      
      // Find fruit and vegetable categories dynamically by slug
      const fruitsCat = categoriesData.find((c: Category) => 
        c.slug?.toLowerCase().includes('fruit') || 
        c.name?.toLowerCase().includes('fruit')
      );
      
      const vegCat = categoriesData.find((c: Category) => 
        c.slug?.toLowerCase().includes('vegetable') || 
        c.name?.toLowerCase().includes('vegetable')
      );
      
      // Update tabs with found category slugs
      setTabs(prev => [
        prev[0], // Keep offers tab as is
        { ...prev[1], slug: fruitsCat?.slug || 'fruits' },
        { ...prev[2], slug: vegCat?.slug || 'vegetables' },
      ]);
      
      console.log('Categories loaded:', categoriesData);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  // Helper function to check if a product is discounted
  const isProductDiscounted = (product: Product): boolean => {
    const hasDiscountedPrice = product.discounted_price !== undefined && 
                               product.discounted_price !== null && 
                               product.discounted_price > 0 && 
                               product.discounted_price < product.price;
    
    const hasDiscountPercentage = product.discount_percentage !== undefined && 
                                  product.discount_percentage !== null && 
                                  product.discount_percentage > 0;
    
    const hasSalePrice = product.sale_price !== undefined && 
                         product.sale_price !== null && 
                         product.sale_price > 0 && 
                         product.sale_price < product.price;
    
    const hasFinalPrice = product.final_price !== undefined && 
                          product.final_price !== null && 
                          Number(product.final_price) < product.price;
    
    return hasDiscountedPrice || hasDiscountPercentage || hasSalePrice || hasFinalPrice;
  };

  // Helper function to get the best available price
  const getProductPrice = (product: Product): number => {
    if (product.sale_price && product.sale_price < product.price) {
      return product.sale_price;
    }
    if (product.discounted_price && product.discounted_price < product.price) {
      return product.discounted_price;
    }
    if (product.final_price && Number(product.final_price) < product.price) {
      return Number(product.final_price);
    }
    return product.price;
  };

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let response;
      console.log(`Fetching products for tab: ${activeTab}`);

      const currentTab = tabs.find(tab => tab.id === activeTab);
      
      if (activeTab === 'offers') {
        // For offers, use getAll and filter on frontend
        console.log('Fetching all products and filtering for offers');
        response = await api.products.getAll({ per_page: 50 });
        
        if (response?.data) {
          const productsData = response.data.data || response.data;
          const allProducts = Array.isArray(productsData) ? productsData : [];
          
          // Filter products that have discounts
          const discountedProducts = allProducts.filter(isProductDiscounted);
          
          console.log(`Found ${discountedProducts.length} discounted products out of ${allProducts.length}`);
          setProducts(discountedProducts);
          setLoading(false);
          return;
        }
      } else if (currentTab?.slug) {
        console.log(`Fetching products for category slug: ${currentTab.slug}`);
        
        // Use getByCategory with the slug (string) - this matches your API signature
        response = await api.products.getByCategory(currentTab.slug);
        
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
    
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    if (url.startsWith('/storage/')) {
      return `https://api.hypermarket.co.ke${url}`;
    }
    
    return `https://api.hypermarket.co.ke/storage/${url}`;
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
      {/* Header */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-emerald-600">
            {title}
          </h1>
          <Link
            href="/products"
            className="text-sm text-emerald-600 underline underline-offset-2 hover:text-gray-900 transition-colors"
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
                  ? 'bg-emerald-600 text-white border-emerald-600'
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
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
              >
                <RefreshCw size={18} />
                <span>Try Again</span>
              </button>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-5">
                <ShoppingBag size={32} className="text-emerald-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                No products found
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                No products available in this category at the moment.
              </p>
              <button
                onClick={() => setActiveTab('offers')}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
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
                      price: getProductPrice(product)
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