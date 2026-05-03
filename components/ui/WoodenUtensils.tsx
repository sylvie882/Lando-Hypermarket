'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Product } from '@/types';
import ProductCard from '@/components/ui/ProductCard';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  image_url: string;
  parent_id: number | null;
  children?: Category[];
  active_products_count?: string;
}

const WoodenUtensils: React.FC = () => {
  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerRow, setItemsPerRow] = useState(6);
  
  const resizeTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchWoodenUtensilsCategory();
    
    const handleResize = () => {
      if (resizeTimerRef.current) {
        clearTimeout(resizeTimerRef.current);
      }
      
      resizeTimerRef.current = setTimeout(() => {
        const width = window.innerWidth;
        
        if (width < 640) {
          setItemsPerRow(2);
        } else {
          setItemsPerRow(6);
        }
      }, 150);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (category) {
      fetchProducts();
    }
  }, [category]);

  const fetchWoodenUtensilsCategory = async () => {
    try {
      setIsLoading(true);
      
      const response = await api.categories.getAll();
      const allCategories = response.data || [];
      
      const woodenUtensilsCat = allCategories.find((cat: Category) => cat.id === 63);
      
      if (woodenUtensilsCat) {
        setCategory(woodenUtensilsCat);
      }
      
    } catch (error) {
      console.error('Error fetching wooden utensils category:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      
      const params: any = {
        per_page: 20,
        category_id: 63,
        sort: 'sold_count',
        order: 'desc'
      };
      
      const response = await api.products.getAll(params);
      
      const productsData = response.data?.data || response.data || [];
      setProducts(productsData);
      
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const trackProductView = async (productId: number) => {
    try {
      await api.products.trackView(productId);
    } catch (error) {
      console.error('Failed to track product view:', error);
    }
  };

  // Calculate products per page (itemsPerRow * 2 rows)
  const productsPerPage = itemsPerRow * 2;
  const totalPages = Math.ceil(products.length / productsPerPage);
  
  // Get current page products
  const currentProducts = products.slice(
    currentPage * productsPerPage,
    (currentPage + 1) * productsPerPage
  );
  
  // Split current products into two rows
  const firstRowProducts = currentProducts.slice(0, itemsPerRow);
  const secondRowProducts = currentProducts.slice(itemsPerRow, productsPerPage);

  const nextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    } else {
      setCurrentPage(0); // Loop back to first page
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    } else {
      setCurrentPage(totalPages - 1); // Loop to last page
    }
  };

  // Dynamic grid class based on items per row
  const getGridClass = () => {
    if (itemsPerRow === 2) {
      return "grid grid-cols-2 gap-4";
    } else {
      return "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4";
    }
  };

  // Loading Skeleton
  if (isLoading && !category) {
    return (
      <div className="bg-white">
        <div className="px-4 sm:px-6 lg:px-12 py-8">
          <div className="mx-auto px-4 sm:px-6 lg:px-12 w-full">
            <div className="animate-pulse">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                  <div className="h-8 w-48 bg-gray-200 rounded"></div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                </div>
              </div>
              {/* Two rows of skeleton loaders */}
              <div className="space-y-4">
                {[1, 2].map((row) => (
                  <div key={row} className={getGridClass()}>
                    {[...Array(itemsPerRow)].map((_, i) => (
                      <div 
                        key={i} 
                        className="animate-pulse bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
                      >
                        <div className="bg-gray-200 h-48"></div>
                        <div className="p-4">
                          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                          <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
                          <div className="h-8 bg-gray-200 rounded"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white">
      <div className="mx-auto px-4 sm:px-6 lg:px-12 w-full py-8">
        {/* Header with Title and Navigation Icons */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">
              {category?.name || 'Wooden Utensils'}
            </h2>
          </div>
          
          {/* Navigation Icons */}
          {totalPages > 1 && (
            <div className="flex items-center space-x-2">
              <button
                onClick={prevPage}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                  currentPage === 0
                    ? 'bg-[#004E9A] text-white hover:bg-[#003E9A]'
                    : 'bg-white text-gray-600 hover:bg-amber-50 border border-gray-200'
                }`}
                aria-label="Previous products"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={nextPage}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                  currentPage === totalPages - 1
                    ? 'bg-[#004E9A] text-white hover:bg-[#003E9A]'
                    : 'bg-white text-gray-600 hover:bg-amber-50 border border-gray-200'
                }`}
                aria-label="Next products"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </div>
        
        {/* Products Grid - Two Rows */}
        {products.length > 0 ? (
          <div className="space-y-4">
            {/* First Row */}
            {firstRowProducts.length > 0 && (
              <div className={getGridClass()}>
                {firstRowProducts.map((product) => (
                  <div
                    key={product.id}
                    className="h-full bg-white rounded-lg shadow-sm hover:shadow-md border border-gray-200 hover:border-amber-300 overflow-hidden transition-all duration-300"
                  >
                    <ProductCard
                      product={product}
                      onViewTrack={trackProductView}
                      hideFeaturedBadge={true}
                    />
                  </div>
                ))}
              </div>
            )}
            
            {/* Second Row */}
            {secondRowProducts.length > 0 && (
              <div className={getGridClass()}>
                {secondRowProducts.map((product) => (
                  <div
                    key={product.id}
                    className="h-full bg-white rounded-lg shadow-sm hover:shadow-md border border-gray-200 hover:border-amber-300 overflow-hidden transition-all duration-300"
                  >
                    <ProductCard
                      product={product}
                      onViewTrack={trackProductView}
                      hideFeaturedBadge={true}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          !isLoading && (
            <div className="text-center py-12">
              <div className="bg-amber-50 rounded-2xl p-12">
                <p className="text-gray-600">
                  No products found in this category.
                </p>
              </div>
            </div>
          )
        )}

        {/* Page Indicators */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-6 gap-2">
            {Array.from({ length: totalPages }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentPage(idx)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  currentPage === idx
                    ? 'bg-[#004E9A] w-8'
                    : 'bg-gray-300 w-2 hover:bg-gray-400'
                }`}
                aria-label={`Go to page ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WoodenUtensils;