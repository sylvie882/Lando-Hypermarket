'use client';

import React, { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { Product } from '@/types';
import ProductCard from '@/components/ui/ProductCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface FeaturedProductsProps {
  limit?: number;
  showHeader?: boolean;
  className?: string;
  compact?: boolean;
  title?: string;
}

const FeaturedProducts: React.FC<FeaturedProductsProps> = ({
  limit = 36,
  showHeader = true,
  className = '',
  compact = true,
  title = "Featured Products"
}) => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerRow, setItemsPerRow] = useState(6);

  const resizeTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchFeaturedProducts();

    const handleResize = () => {
      if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current);
      resizeTimerRef.current = setTimeout(() => {
        const width = window.innerWidth;
        if (width < 640)       setItemsPerRow(2);
        else if (width < 768)  setItemsPerRow(3);
        else if (width < 1024) setItemsPerRow(4);
        else if (width < 1280) setItemsPerRow(5);
        else                   setItemsPerRow(6);
      }, 150);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current);
    };
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      setIsLoading(true);

      const featuredRes = await api.products.getFeatured();
      let featuredData = featuredRes.data || [];

      if (featuredData.length < limit) {
        try {
          const moreProductsRes = await api.products.getAll({
            per_page: limit - featuredData.length,
            sort: 'featured',
            order: 'desc',
          });
          const moreProducts = moreProductsRes.data?.data || moreProductsRes.data || [];
          featuredData = [...featuredData, ...moreProducts];
        } catch (error) {
          console.error('Error fetching additional products:', error);
        }
      }

      const sortedProducts = featuredData.sort((a: Product, b: Product) => {
        const dateA = new Date(a.updated_at || a.created_at || 0);
        const dateB = new Date(b.updated_at || b.created_at || 0);
        return dateB.getTime() - dateA.getTime();
      });

      setFeaturedProducts(sortedProducts.slice(0, limit));
    } catch (error) {
      console.error('Failed to fetch featured products:', error);
      setFeaturedProducts([]);
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

  // 1 row per page so buttons are always active
  const productsPerPage = itemsPerRow;
  const totalPages      = Math.ceil(featuredProducts.length / productsPerPage);
  const currentProducts = featuredProducts.slice(
    currentPage * productsPerPage,
    (currentPage + 1) * productsPerPage
  );

  const nextPage = () => setCurrentPage(prev => (prev < totalPages - 1 ? prev + 1 : 0));
  const prevPage = () => setCurrentPage(prev => (prev > 0 ? prev - 1 : totalPages - 1));

  const gridClass = 'grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6';

  if (isLoading) {
    return (
      <div className={`${compact ? 'compact-section' : 'py-8'} bg-white ${className}`}>
        <div className="mx-auto px-4 sm:px-6 lg:px-12 w-full">
          <div className="animate-pulse">
            {showHeader && (
              <div className="flex items-center justify-between mb-6">
                <div className="h-8 w-48 bg-gray-200 rounded"></div>
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 bg-gray-200 rounded-full"></div>
                  <div className="h-2 w-24 bg-gray-200 rounded-full"></div>
                  <div className="h-9 w-9 bg-gray-200 rounded-full"></div>
                </div>
              </div>
            )}
            <div className={gridClass}>
              {[...Array(itemsPerRow)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
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

  if (featuredProducts.length === 0) return null;

  return (
    <section className={`${compact ? 'compact-section' : 'py-8'} bg-white ${className}`}>
      <div className="mx-auto px-4 sm:px-6 lg:px-12 w-full">

        {showHeader && (
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">{title}</h2>

            {/* Prev + dot scroller + Next — always visible, never disabled */}
            <div className="flex items-center gap-2">
              <button
                onClick={prevPage}
                className="w-9 h-9 rounded-full flex items-center justify-center border border-gray-200 bg-white text-gray-600 hover:bg-[#004E9A] hover:text-white hover:border-[#004E9A] transition-all duration-300 flex-shrink-0"
                aria-label="Previous products"
              >
                <ChevronLeft size={18} />
              </button>

              <div
                className="flex items-center gap-1.5 overflow-x-auto max-w-[120px] sm:max-w-[180px]"
                style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}
              >
                {Array.from({ length: totalPages }).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentPage(idx)}
                    className={`h-2 rounded-full flex-shrink-0 transition-all duration-300 ${
                      currentPage === idx
                        ? 'bg-[#004E9A] w-6'
                        : 'bg-gray-300 w-2 hover:bg-gray-400'
                    }`}
                    aria-label={`Go to page ${idx + 1}`}
                  />
                ))}
              </div>

              <button
                onClick={nextPage}
                className="w-9 h-9 rounded-full flex items-center justify-center border border-gray-200 bg-white text-gray-600 hover:bg-[#004E9A] hover:text-white hover:border-[#004E9A] transition-all duration-300 flex-shrink-0"
                aria-label="Next products"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* Products Grid */}
        <div className={gridClass}>
          {currentProducts.map((product) => (
            <div key={product.id} className="flex flex-col h-full">
              <ProductCard
                product={product}
                onViewTrack={trackProductView}
                hideFeaturedBadge={true}
              />
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default FeaturedProducts;