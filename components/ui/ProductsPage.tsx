'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import ProductCard from '@/components/ui/ProductCard';
import { Product, Category } from '@/types';
import { api } from '@/lib/api';
import { ShoppingBag, AlertCircle, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

interface ProductsPageProps {
  title?: string;
}

interface PaginatedResponse {
  data: Product[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  next_page_url: string | null;
  prev_page_url: string | null;
}

const ProductsPage: React.FC<ProductsPageProps> = ({
  title = 'Shop your Favourites'
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('offers');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [perPage, setPerPage] = useState(20);
  
  // Store discounted products for offers tab
  const [allDiscountedProducts, setAllDiscountedProducts] = useState<Product[]>([]);
  const [discountedProductsLoaded, setDiscountedProductsLoaded] = useState(false);
  
  // Define tabs with their category IDs (from your data)
  const tabs = [
    { id: 'offers', label: 'Offers', categoryId: null },
    { id: 'fruits', label: 'Fruits', categoryId: 45 }, // ID 45 = Fresh Fruits
    { id: 'vegetables', label: 'Vegetables', categoryId: 46 }, // ID 46 = Fresh Vegetables
  ];

  // Fetch products based on active tab
  useEffect(() => {
    if (activeTab === 'offers') {
      // For offers, we need to load all discounted products first if not loaded
      if (!discountedProductsLoaded) {
        fetchAllDiscountedProducts();
      } else {
        // If already loaded, just update the current page
        updateCurrentPageProducts();
      }
    } else {
      // For category tabs, fetch paginated products
      fetchCategoryProducts(currentPage);
    }
  }, [activeTab, currentPage, discountedProductsLoaded]);

  // Reset pagination when tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  const fetchAllDiscountedProducts = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching all discounted products across all pages');
      
      // First, fetch the first page to get total pages
      const firstPageResponse = await api.products.getAll({ per_page: 100 });
      let allDiscounted: Product[] = [];
      
      if (firstPageResponse?.data) {
        // Handle pagination wrapper
        const paginatedData = firstPageResponse.data as any;
        const firstPageProducts = paginatedData.data || firstPageResponse.data;
        const totalPages = paginatedData.last_page || 1;
        
        console.log(`Total pages available: ${totalPages}`);
        
        // Process first page
        const firstPageArray = Array.isArray(firstPageProducts) ? firstPageProducts : [];
        const firstPageDiscounted = firstPageArray.filter(isProductDiscounted);
        allDiscounted = [...firstPageDiscounted];
        
        // Fetch remaining pages
        if (totalPages > 1) {
          const pagePromises = [];
          
          // Limit to 20 pages max for performance (or adjust as needed)
          const pagesToFetch = Math.min(totalPages, 20);
          
          for (let page = 2; page <= pagesToFetch; page++) {
            pagePromises.push(api.products.getAll({ per_page: 100, page }));
          }
          
          const remainingResponses = await Promise.all(pagePromises);
          
          remainingResponses.forEach(response => {
            if (response?.data) {
              const pageData = (response.data as any).data || response.data;
              if (Array.isArray(pageData)) {
                const pageDiscounted = pageData.filter(isProductDiscounted);
                allDiscounted = [...allDiscounted, ...pageDiscounted];
              }
            }
          });
        }
        
        console.log(`Total discounted products found: ${allDiscounted.length}`);
        
        // Store all discounted products
        setAllDiscountedProducts(allDiscounted);
        setDiscountedProductsLoaded(true);
        
        // Calculate pagination for offers
        const offersPerPage = 20;
        const offersLastPage = Math.ceil(allDiscounted.length / offersPerPage);
        setLastPage(offersLastPage);
        setTotalProducts(allDiscounted.length);
        setPerPage(offersPerPage);
        
        // Update current page products
        updateCurrentPageProducts(allDiscounted);
      }
    } catch (error: any) {
      console.error('Error fetching discounted products:', error);
      setError(error?.message || 'Failed to load offers');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategoryProducts = async (page: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const currentTab = tabs.find(tab => tab.id === activeTab);
      
      if (!currentTab?.categoryId) {
        setProducts([]);
        setLoading(false);
        return;
      }

      console.log(`Fetching products for category ID: ${currentTab.categoryId}, page: ${page}`);
      const response = await api.products.getAll({ 
        category_id: currentTab.categoryId,
        per_page: 20,
        page: page
      });
      
      if (response?.data) {
        // Handle paginated response
        const paginatedData = response.data as any;
        const categoryProducts = paginatedData.data || paginatedData;
        
        setProducts(Array.isArray(categoryProducts) ? categoryProducts : []);
        
        // Set pagination info
        setCurrentPage(paginatedData.current_page || page);
        setLastPage(paginatedData.last_page || 1);
        setTotalProducts(paginatedData.total || 0);
        setPerPage(paginatedData.per_page || 20);
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

  const updateCurrentPageProducts = (discountedList = allDiscountedProducts) => {
    const startIndex = (currentPage - 1) * perPage;
    const endIndex = startIndex + perPage;
    const pageProducts = discountedList.slice(startIndex, endIndex);
    setProducts(pageProducts);
    setLoading(false);
  };

  // FIXED: Ensure we always return a boolean
  const isProductDiscounted = (product: Product): boolean => {
    const hasDiscountedPrice = !!(product.discounted_price && 
                              Number(product.discounted_price) > 0 && 
                              Number(product.discounted_price) < Number(product.price));
    
    const hasSalePrice = !!(product.sale_price && 
                        Number(product.sale_price) > 0 && 
                        Number(product.sale_price) < Number(product.price));
    
    const hasFinalPrice = !!(product.final_price && 
                         Number(product.final_price) > 0 && 
                         Number(product.final_price) < Number(product.price));
    
    // Also check if there's a discount percentage
    const hasDiscountPercentage = !!(product.discount_percentage && 
                                   Number(product.discount_percentage) > 0);
    
    return hasDiscountedPrice || hasSalePrice || hasFinalPrice || hasDiscountPercentage;
  };

  const handleRetry = () => {
    if (activeTab === 'offers') {
      setDiscountedProductsLoaded(false);
      fetchAllDiscountedProducts();
    } else {
      fetchCategoryProducts(currentPage);
    }
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setError(null);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= lastPage) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Render pagination component
  const renderPagination = () => {
    if (lastPage <= 1) return null;

    const pageNumbers = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(lastPage, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <div className="flex items-center justify-center gap-2 mt-8 mb-4">
        {/* Previous button */}
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1 || loading}
          className={`p-2 rounded-lg border ${
            currentPage === 1 
              ? 'border-gray-200 text-gray-400 cursor-not-allowed' 
              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <ChevronLeft size={20} />
        </button>

        {/* First page if not visible */}
        {startPage > 1 && (
          <>
            <button
              onClick={() => handlePageChange(1)}
              className="w-10 h-10 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              1
            </button>
            {startPage > 2 && <span className="text-gray-500">...</span>}
          </>
        )}

        {/* Page numbers */}
        {pageNumbers.map((page) => (
          <button
            key={page}
            onClick={() => handlePageChange(page)}
            disabled={loading}
            className={`w-10 h-10 rounded-lg border ${
              currentPage === page
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {page}
          </button>
        ))}

        {/* Last page if not visible */}
        {endPage < lastPage && (
          <>
            {endPage < lastPage - 1 && <span className="text-gray-500">...</span>}
            <button
              onClick={() => handlePageChange(lastPage)}
              className="w-10 h-10 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              {lastPage}
            </button>
          </>
        )}

        {/* Next button */}
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === lastPage || loading}
          className={`p-2 rounded-lg border ${
            currentPage === lastPage 
              ? 'border-gray-200 text-gray-400 cursor-not-allowed' 
              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <ChevronRight size={20} />
        </button>
      </div>
    );
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
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
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
              onClick={() => handleTabChange(tab.id)}
              disabled={loading}
              className={`
                px-5 py-2 rounded-full text-sm font-medium border transition-all whitespace-nowrap
                ${activeTab === tab.id
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-gray-500'
                }
                ${loading ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {tab.label}
              {activeTab === tab.id && totalProducts > 0 && (
                <span className="ml-2 text-xs bg-white/20 px-2 py-0.5 rounded-full">
                  {totalProducts}
                </span>
              )}
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
                {activeTab === 'offers' 
                  ? 'No discounted products available at the moment. Check back later!' 
                  : `No products available in the ${activeTab} category at the moment.`}
              </p>
              {activeTab !== 'offers' && (
                <button
                  onClick={() => handleTabChange('offers')}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
                >
                  View offers instead
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Product count info */}
              <div className="flex justify-between items-center mb-4 text-sm text-gray-600">
                <span>
                  Showing {((currentPage - 1) * perPage) + 1} - {Math.min(currentPage * perPage, totalProducts)} of {totalProducts} products
                </span>
              </div>

              {/* Products grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-sm transition-shadow duration-200"
                  >
                    <ProductCard
                      product={product}
                      onViewTrack={(id) => console.log('Viewing:', id)}
                    />
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {renderPagination()}
            </>
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