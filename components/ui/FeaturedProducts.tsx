'use client';

import React, { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { Product } from '@/types';
import ProductCard from '@/components/ui/ProductCard';
import Link from 'next/link';
import { Flame, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

interface FeaturedProductsProps {
  limit?: number;
  showHeader?: boolean;
  className?: string;
  compact?: boolean;
  title?: string;
}

const FeaturedProducts: React.FC<FeaturedProductsProps> = ({
  limit = 12,
  showHeader = true,
  className = '',
  compact = true,
  title = "Featured Products"
}) => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  useEffect(() => {
    const checkScroll = () => {
      if (scrollContainerRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
        setShowLeftArrow(scrollLeft > 0);
        setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
      }
    };

    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScroll);
      checkScroll();
      return () => container.removeEventListener('scroll', checkScroll);
    }
  }, [featuredProducts]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300;
      const newScrollLeft = direction === 'left' 
        ? scrollContainerRef.current.scrollLeft - scrollAmount
        : scrollContainerRef.current.scrollLeft + scrollAmount;
      
      scrollContainerRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
    }
  };

  const fetchFeaturedProducts = async () => {
    try {
      setIsLoading(true);
      
      // Fetch featured products
      const featuredRes = await api.products.getFeatured();
      let featuredData = featuredRes.data || [];
      
      // If we have less than needed featured products, fetch more
      if (featuredData.length < limit) {
        try {
          const moreProductsRes = await api.products.getAll({ 
            per_page: limit - featuredData.length,
            sort: 'featured',
            order: 'desc' 
          });
          const moreProducts = moreProductsRes.data?.data || moreProductsRes.data || [];
          featuredData = [...featuredData, ...moreProducts];
        } catch (error) {
          console.error('Error fetching additional products:', error);
        }
      }
      
      // Ensure we have exactly the limit of products
      if (featuredData.length > limit) {
        featuredData = featuredData.slice(0, limit);
      }
      
      setFeaturedProducts(featuredData);

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

  if (isLoading) {
    return (
      <div className={`${compact ? 'compact-section' : 'py-8'} bg-gradient-to-b from-gray-50 to-white px-4 sm:px-6 md:px-8 lg:px-12 ${className}`}>
        <div className="w-full">
          <div className="animate-pulse">
            {showHeader && (
              <div className="flex items-center justify-between mb-6">
                <div className="h-8 w-48 bg-gray-200 rounded"></div>
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                  <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                </div>
              </div>
            )}
            <div className="flex overflow-x-hidden space-x-4 pb-4">
              {[...Array(Math.min(limit, 12))].map((_, i) => (
                <div 
                  key={i} 
                  className="flex-none w-64 animate-pulse bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
                  style={{
                    animationDelay: `${i * 50}ms`
                  }}
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
          </div>
        </div>
      </div>
    );
  }

  if (featuredProducts.length === 0) {
    return null;
  }

  return (
    <section className={`${compact ? 'compact-section' : 'py-8'} bg-gradient-to-b from-gray-50 to-white px-4 sm:px-6 md:px-8 lg:px-12 ${className}`}>
      <div className="w-full">
        {showHeader && (
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg">
                <Flame size={20} className="text-white" />
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">{title}</h2>
            </div>
            
            {/* Scroll Controls at the Top */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => scroll('left')}
                disabled={!showLeftArrow}
                className={`p-2 rounded-full border transition-all duration-200 ${
                  showLeftArrow 
                    ? 'bg-white hover:bg-gray-50 border-gray-300 text-gray-700 cursor-pointer' 
                    : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                }`}
                aria-label="Scroll left"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={() => scroll('right')}
                disabled={!showRightArrow}
                className={`p-2 rounded-full border transition-all duration-200 ${
                  showRightArrow 
                    ? 'bg-white hover:bg-gray-50 border-gray-300 text-gray-700 cursor-pointer' 
                    : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                }`}
                aria-label="Scroll right"
              >
                <ChevronRight size={20} />
              </button>
              <Link 
                href="/products?featured=true" 
                className="ml-2 text-green-600 hover:text-green-700 font-medium flex items-center text-sm"
              >
                View All
                <ArrowRight size={14} className="ml-1" />
              </Link>
            </div>
          </div>
        )}
        
        {/* Products Row */}
        <div
          ref={scrollContainerRef}
          className="flex overflow-x-auto overflow-y-hidden space-x-4 pb-4 scrollbar-hide scroll-smooth"
          style={{
            scrollbarWidth: 'none', /* Firefox */
            msOverflowStyle: 'none', /* IE and Edge */
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {featuredProducts.map((product, index) => (
            <div 
              key={product.id} 
              className="flex-none w-64 md:w-72 scroll-hover bg-white rounded-lg shadow-sm hover:shadow-md border border-gray-200 hover:border-green-300 overflow-hidden transition-all duration-300"
              style={{
                animationDelay: `${index * 50}ms`
              }}
            >
              <ProductCard 
                product={product} 
                onViewTrack={trackProductView}
                hideFeaturedBadge={true}
              />
            </div>
          ))}
        </div>
      </div>

      <style jsx global>{`
        /* Hide scrollbar for Chrome, Safari and Opera */
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
};

export default FeaturedProducts;