'use client';

import React, { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { Product } from '@/types';
import ProductCard from '@/components/ui/ProductCard';
import { Clock4, ChevronLeft, ChevronRight } from 'lucide-react';

interface NewArrivalsProps {
  limit?: number;
  showHeader?: boolean;
  className?: string;
  compact?: boolean;
  title?: string;
}

const NewArrivals: React.FC<NewArrivalsProps> = ({
  limit = 36,
  showHeader = true,
  className = '',
  compact = true,
  title = "New Arrivals"
}) => {
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerRow, setItemsPerRow] = useState(4);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  
  const resizeTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchNewArrivals();
    
    const handleResize = () => {
      if (resizeTimerRef.current) {
        clearTimeout(resizeTimerRef.current);
      }
      
      resizeTimerRef.current = setTimeout(() => {
        const width = window.innerWidth;
        setIsMobile(width < 640);
        setIsTablet(width >= 640 && width < 1024);
        
        if (width < 640) {
          setItemsPerRow(2);
        } else if (width < 768) {
          setItemsPerRow(2);
        } else if (width < 1024) {
          setItemsPerRow(3);
        } else {
          setItemsPerRow(4);
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

  const fetchNewArrivals = async () => {
    try {
      setIsLoading(true);
      
      const newArrivalsRes = await api.products.getAll({ 
        per_page: limit,
        sort: 'created_at', 
        order: 'desc' 
      });
      
      let newArrivalsData = newArrivalsRes.data?.data || newArrivalsRes.data || [];
      
      if (newArrivalsData.length > limit) {
        newArrivalsData = newArrivalsData.slice(0, limit);
      }
      
      setNewArrivals(newArrivalsData);

    } catch (error) {
      console.error('Failed to fetch new arrivals:', error);
      setNewArrivals([]);
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
  const totalPages = Math.ceil(newArrivals.length / productsPerPage);
  
  // Get current page products
  const currentProducts = newArrivals.slice(
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

  if (isLoading) {
    return (
      <div className={`bg-white ${className}`}>
        <div className="mx-auto px-4 sm:px-6 lg:px-12 w-full">
          <div className="animate-pulse">
            {showHeader && (
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                  <div className="h-8 w-40 bg-gray-200 rounded"></div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                </div>
              </div>
            )}
            {/* Two rows of skeleton loaders */}
            <div className="space-y-4">
              {[1, 2].map((row) => (
                <div key={row} className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
    );
  }

  if (newArrivals.length === 0) {
    return null;
  }

  return (
    <div className={`bg-white ${className}`}>
      <div className="mx-auto px-4 sm:px-6 lg:px-12 w-full py-8">
        {showHeader && (
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">{title}</h2>
            </div>
            
            {/* Navigation Icons */}
            {totalPages > 1 && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={prevPage}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                    currentPage === 0
                      ? 'bg-[#004E9A] text-white hover:bg-[#003E9A]'
                      : 'bg-white text-gray-600 hover:bg-[#004E9A] hover:text-white border border-gray-200'
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
                      : 'bg-white text-gray-600 hover:bg-[#004E9A] hover:text-white border border-gray-200'
                  }`}
                  aria-label="Next products"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </div>
        )}
        
        {/* Products Grid - Two Rows */}
        <div className="space-y-4">
          {/* First Row */}
          {firstRowProducts.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {firstRowProducts.map((product) => (
                <div
                  key={product.id}
                  className="h-full bg-white rounded-lg shadow-sm hover:shadow-md border border-gray-200 hover:border-emerald-300 overflow-hidden transition-all duration-300"
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
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {secondRowProducts.map((product) => (
                <div
                  key={product.id}
                  className="h-full bg-white rounded-lg shadow-sm hover:shadow-md border border-gray-200 hover:border-emerald-300 overflow-hidden transition-all duration-300"
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

export default NewArrivals;