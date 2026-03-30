'use client';

import React, { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { Product } from '@/types';
import ProductCard from '@/components/ui/ProductCard';
import { Flame, ChevronLeft, ChevronRight } from 'lucide-react';

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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visibleCards, setVisibleCards] = useState(4);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const resizeTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchFeaturedProducts();
    
    const handleResize = () => {
      if (resizeTimerRef.current) {
        clearTimeout(resizeTimerRef.current);
      }
      
      resizeTimerRef.current = setTimeout(() => {
        const width = window.innerWidth;
        setIsMobile(width < 640);
        setIsTablet(width >= 640 && width < 1024);
        
        if (width < 640) {
          setVisibleCards(2); // Changed from 1 to 2
        } else if (width < 768) {
          setVisibleCards(2);
        } else if (width < 1024) {
          setVisibleCards(3);
        } else {
          setVisibleCards(4);
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
            order: 'desc' 
          });
          const moreProducts = moreProductsRes.data?.data || moreProductsRes.data || [];
          featuredData = [...featuredData, ...moreProducts];
        } catch (error) {
          console.error('Error fetching additional products:', error);
        }
      }
      
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

  const scrollToIndex = (index: number) => {
    if (!scrollContainerRef.current || featuredProducts.length === 0) return;
    
    const container = scrollContainerRef.current;
    const cardElements = container.children;
    if (cardElements.length === 0) return;
    
    const cardWidth = cardElements[0].clientWidth || 256;
    const gap = 16; // space-x-4 = 16px
    const scrollPosition = (cardWidth + gap) * index;
    
    container.scrollTo({
      left: scrollPosition,
      behavior: 'smooth'
    });
    setCurrentIndex(index);
  };

  const scrollNext = () => {
    if (featuredProducts.length <= visibleCards) return;
    
    let nextIndex = currentIndex + 1;
    
    if (nextIndex > featuredProducts.length - visibleCards) {
      nextIndex = 0;
    }
    
    scrollToIndex(nextIndex);
  };

  const scrollPrev = () => {
    if (featuredProducts.length <= visibleCards) return;
    
    let prevIndex = currentIndex - 1;
    
    if (prevIndex < 0) {
      prevIndex = Math.max(0, featuredProducts.length - visibleCards);
    }
    
    scrollToIndex(prevIndex);
  };

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    
    const container = scrollContainerRef.current;
    const cardElements = container.children;
    if (cardElements.length === 0) return;
    
    const cardWidth = cardElements[0].clientWidth || 256;
    const gap = 16;
    const scrollPosition = container.scrollLeft;
    const newIndex = Math.round(scrollPosition / (cardWidth + gap));
    
    if (newIndex !== currentIndex) {
      setCurrentIndex(Math.max(0, newIndex));
    }
  };

  const totalSlides = Math.ceil(featuredProducts.length / visibleCards);
  const currentSlide = Math.floor(currentIndex / visibleCards);

  if (isLoading) {
    return (
      <div className={`${compact ? 'compact-section' : 'py-8'} bg-white ${className}`}>
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-12 w-full">
          <div className="animate-pulse">
            {showHeader && (
              <div className="flex items-center justify-between mb-6">
                <div className="h-8 w-48 bg-gray-200 rounded"></div>
                <div className="flex space-x-2">
                  <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                  <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                </div>
              </div>
            )}
            <div className="flex space-x-4 overflow-x-hidden pb-4">
              {[...Array(Math.min(limit, 4))].map((_, i) => (
                <div 
                  key={i} 
                  className="flex-none w-64 animate-pulse bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
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
    <section className={`${compact ? 'compact-section' : 'py-8'} bg-white ${className}`}>
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-12 w-full">
        {showHeader && (
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              {/* <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg">
                <Flame size={20} className="text-white" />
              </div> */}
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">{title}</h2>
            </div>
            
            {/* Navigation Icons at Top Right */}
            {featuredProducts.length > visibleCards && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={scrollPrev}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                    currentSlide === 0
                      ? 'bg-orange-600 text-white hover:bg-orange-700'
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                  }`}
                  aria-label="Previous products"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={scrollNext}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                    currentSlide === totalSlides - 1
                      ? 'bg-orange-600 text-white hover:bg-orange-700'
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                  }`}
                  aria-label="Next products"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </div>
        )}
        
        {/* Products Row */}
        <div
          ref={scrollContainerRef}
          className="flex overflow-x-auto space-x-4 pb-2 hide-scrollbar snap-x snap-mandatory"
          onScroll={handleScroll}
          style={{ scrollBehavior: 'smooth' }}
        >
          {featuredProducts.map((product, index) => (
            <div 
              key={product.id} 
              className="snap-start flex-none"
              style={{
                width: isMobile ? '44vw' : // Changed from 85vw to 44vw for 2 items
                       isTablet ? '45vw' : 
                       '23vw',
                minWidth: isMobile ? '44vw' : // Changed from 85vw to 44vw
                         isTablet ? '45vw' : 
                         '23vw',
              }}
            >
              <div className="h-full bg-white rounded-lg shadow-sm hover:shadow-md border border-gray-200 hover:border-orange-200 overflow-hidden transition-all duration-300">
                <ProductCard 
                  product={product} 
                  onViewTrack={trackProductView}
                  hideFeaturedBadge={true}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx global>{`
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        
        .snap-x {
          -webkit-overflow-scrolling: touch;
        }
        
        .snap-mandatory {
          scroll-snap-type: x mandatory;
        }
        
        .snap-start {
          scroll-snap-align: start;
        }
      `}</style>
    </section>
  );
};

export default FeaturedProducts;