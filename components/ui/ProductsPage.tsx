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

  // Define tabs with default category IDs
  const [tabs, setTabs] = useState([
    { id: 'offers', label: 'Offers', categoryId: null },
    { id: 'fruits', label: 'Fruits', categoryId: 45 },
    { id: 'vegetables', label: 'Vegetables', categoryId: 46 },
  ]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (activeTab) {
      fetchProducts();
    }
  }, [activeTab, categories]);

  const fetchCategories = async () => {
    try {
      const response = await api.categories.getAll();
      const categoriesData = response.data || [];
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      
      // Find fruit and vegetable categories dynamically
      const fruitsCat = categoriesData.find((c: Category) => 
        c.name?.toLowerCase().includes('fruit') || c.slug?.toLowerCase().includes('fruit')
      );
      const vegCat = categoriesData.find((c: Category) => 
        c.name?.toLowerCase().includes('vegetable') || c.slug?.toLowerCase().includes('vegetable')
      );
      
      // Update tabs with found category IDs
      setTabs(prev => [
        prev[0], // Keep offers tab as is
        { ...prev[1], categoryId: fruitsCat?.id || 45 },
        { ...prev[2], categoryId: vegCat?.id || 46 },
      ]);
      
      console.log('Categories loaded:', categoriesData);
      console.log('Fruits category:', fruitsCat);
      console.log('Vegetables category:', vegCat);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  // Helper function to check if a product is discounted based on your Product type
  const isProductDiscounted = (product: Product): boolean => {
    // Check if discounted_price exists and is less than price
    const hasDiscountedPrice = product.discounted_price !== undefined && 
                               product.discounted_price !== null && 
                               product.discounted_price > 0 && 
                               product.discounted_price < product.price;
    
    // Check if discount_percentage exists and is greater than 0
    const hasDiscountPercentage = product.discount_percentage !== undefined && 
                                  product.discount_percentage !== null && 
                                  product.discount_percentage > 0;
    
    // Check if sale_price exists and is less than price
    const hasSalePrice = product.sale_price !== undefined && 
                         product.sale_price !== null && 
                         product.sale_price > 0 && 
                         product.sale_price < product.price;
    
    // Check if there's a final_price that's different from price
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
          
          // Filter products that have discounts using our helper function
          const discountedProducts = allProducts.filter(isProductDiscounted);
          
          console.log(`Found ${discountedProducts.length} discounted products out of ${allProducts.length}`);
          if (allProducts.length > 0) {
            console.log('Sample product structure:', allProducts[0]);
          }
          setProducts(discountedProducts);
          setLoading(false);
          return;
        }
      } else if (currentTab?.categoryId) {
        console.log(`Fetching products for category ID: ${currentTab.categoryId}`);
        
        // Try to get products by category
        try {
          response = await api.products.getByCategory(currentTab.categoryId, { 
            per_page: 20
          });
          console.log('Category products response:', response);
        } catch (err) {
          console.log('getByCategory failed, trying getAll with category filter');
          // Fallback: try to get all products with category filter
          response = await api.products.getAll({ 
            category_id: currentTab.categoryId,
            per_page: 20 
          });
        }
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
    
    // If it's already a full URL, return it
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    // Handle storage paths
    if (url.startsWith('/storage/')) {
      return `https://api.hypermarket.co.ke${url}`;
    }
    
    // Handle relative paths
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
                      image: product.thumbnail ? getFixedImageUrl(product.thumbnail) : 
                             product.images?.[0] ? getFixedImageUrl(product.images[0]) : 
                             '/images/placeholder.jpg',
                      // Ensure ProductCard gets the correct price
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