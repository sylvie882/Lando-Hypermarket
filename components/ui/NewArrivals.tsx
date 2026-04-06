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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visibleCards, setVisibleCards] = useState(4);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
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

  const scrollToIndex = (index: number) => {
    if (!scrollContainerRef.current || newArrivals.length === 0) return;
    
    const container = scrollContainerRef.current;
    const cardElements = container.children;
    if (cardElements.length === 0) return;
    
    const cardWidth = cardElements[0].clientWidth || 256;
    const gap = 16;
    const scrollPosition = (cardWidth + gap) * index;
    
    container.scrollTo({
      left: scrollPosition,
      behavior: 'smooth'
    });
    setCurrentIndex(index);
  };

  const scrollNext = () => {
    if (newArrivals.length <= visibleCards) return;
    
    let nextIndex = currentIndex + 1;
    
    if (nextIndex > newArrivals.length - visibleCards) {
      nextIndex = 0;
    }
    
    scrollToIndex(nextIndex);
  };

  const scrollPrev = () => {
    if (newArrivals.length <= visibleCards) return;
    
    let prevIndex = currentIndex - 1;
    
    if (prevIndex < 0) {
      prevIndex = Math.max(0, newArrivals.length - visibleCards);
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

  const totalSlides = Math.ceil(newArrivals.length / visibleCards);
  const currentSlide = Math.floor(currentIndex / visibleCards);

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
            <div className="flex overflow-x-hidden space-x-4 pb-4">
              {[...Array(4)].map((_, i) => (
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

  if (newArrivals.length === 0) {
    return null;
  }

  return (
    <div className={`bg-white ${className}`}>
      <div className="mx-auto px-4 sm:px-6 lg:px-12 w-full">
          {showHeader && (
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                {/* <div className="p-2 bg-gradient-to-r from-emerald-500 to-green-500 rounded-lg">
                  <Clock4 size={20} className="text-white" />
                </div> */}
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">{title}</h2>
              </div>
              
              {/* Navigation Icons */}
              {newArrivals.length > visibleCards && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={scrollPrev}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                      currentSlide === 0
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : 'bg-white text-gray-600 hover:bg-emerald-50 border border-gray-200'
                    }`}
                    aria-label="Previous products"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={scrollNext}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                      currentSlide === totalSlides - 1
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : 'bg-white text-gray-600 hover:bg-emerald-50 border border-gray-200'
                    }`}
                    aria-label="Next products"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              )}
            </div>
          )}
          
          {/* Horizontal Scrollable Products Row */}
          <div
            ref={scrollContainerRef}
            className="flex overflow-x-auto space-x-4 pb-2 hide-scrollbar snap-x snap-mandatory"
            onScroll={handleScroll}
            style={{ scrollBehavior: 'smooth' }}
          >
            {newArrivals.map((product, index) => (
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
                <div className="h-full bg-white rounded-lg shadow-sm hover:shadow-md border border-gray-200 hover:border-emerald-300 overflow-hidden transition-all duration-300">
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
      </div>
    );
    
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
  };

export default NewArrivals;