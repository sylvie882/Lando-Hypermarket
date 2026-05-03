'use client';

import React, { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { Product } from '@/types';
import ProductCard from '@/components/ui/ProductCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
  const [itemsPerRow, setItemsPerRow] = useState(6);
  
  const resizeTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchNewArrivals();
    
    const handleResize = () => {
      if (resizeTimerRef.current) {
        clearTimeout(resizeTimerRef.current);
      }
      
      resizeTimerRef.current = setTimeout(() => {
        const width = window.innerWidth;
        
        if (width < 640) {
          setItemsPerRow(2);
        } else if (width < 768) {
          setItemsPerRow(3);
        } else if (width < 1024) {
          setItemsPerRow(4);
        } else if (width < 1280) {
          setItemsPerRow(5);
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

  const productsPerPage = itemsPerRow * 2;
  const totalPages = Math.ceil(newArrivals.length / productsPerPage);
  
  const currentProducts = newArrivals.slice(
    currentPage * productsPerPage,
    (currentPage + 1) * productsPerPage
  );

  const nextPage = () => {
    setCurrentPage(prev => (prev < totalPages - 1 ? prev + 1 : 0));
  };

  const prevPage = () => {
    setCurrentPage(prev => (prev > 0 ? prev - 1 : totalPages - 1));
  };

  const gridClass = "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 auto-rows-fr";

  if (isLoading) {
    return (
      <div className={`bg-white ${className}`}>
        <div className="mx-auto px-4 sm:px-6 lg:px-12 w-full">
          <div className="animate-pulse">
            {showHeader && (
              <div className="flex items-center justify-between mb-6">
                <div className="h-8 w-40 bg-gray-200 rounded"></div>
                <div className="flex items-center space-x-2">
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                </div>
              </div>
            )}
            <div className={gridClass}>
              {[...Array(itemsPerRow * 2)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
                >
                  <div className="bg-gray-200 h-40"></div>
                  <div className="p-3">
                    <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 mb-3"></div>
                    <div className="h-7 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (newArrivals.length === 0) return null;

  return (
    <div className={`bg-white ${className}`}>
      <div className="mx-auto px-4 sm:px-6 lg:px-12 w-full py-8">
        {showHeader && (
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">{title}</h2>
            
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
        
        {/* Products Grid */}
        <div className={gridClass}>
          {currentProducts.map((product) => (
            <div
              key={product.id}
              className="flex flex-col h-full bg-white rounded-lg shadow-sm hover:shadow-md border border-gray-200 hover:border-emerald-300 overflow-hidden transition-all duration-300"
            >
              <div className="flex flex-col h-full">
                <ProductCard 
                  product={product} 
                  onViewTrack={trackProductView}
                  hideFeaturedBadge={true}
                />
              </div>
            </div>
          ))}
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