'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { ShoppingBag, ArrowRight, TrendingUp, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';

interface CategoryData {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parent_id?: number;
  order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  products_count?: number;
}

interface TopCategoriesProps {
  limit?: number;
  showHeader?: boolean;
  className?: string;
  autoSlideInterval?: number;
}

const TopCategories: React.FC<TopCategoriesProps> = ({
  limit = 15,
  showHeader = true,
  className = '',
  autoSlideInterval = 5000, // 5 seconds default
}) => {
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visibleCards, setVisibleCards] = useState(6);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const autoSlideTimerRef = useRef<NodeJS.Timeout | null>(null);
  const resizeTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchCategories();
    
    // Set initial visible cards based on screen size
    const handleResize = () => {
      if (resizeTimerRef.current) {
        clearTimeout(resizeTimerRef.current);
      }
      
      resizeTimerRef.current = setTimeout(() => {
        const width = window.innerWidth;
        setIsMobile(width < 640);
        setIsTablet(width >= 640 && width < 1024);
        
        if (width < 640) {
          setVisibleCards(2);
        } else if (width < 768) {
          setVisibleCards(3);
        } else if (width < 1024) {
          setVisibleCards(4);
        } else {
          setVisibleCards(6);
        }
      }, 150); // Debounce resize
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current);
      stopAutoSlide();
    };
  }, []);

  // Start auto slide when component mounts or categories change
  useEffect(() => {
    if (categories.length > visibleCards && !isPaused && !isHovering) {
      startAutoSlide();
    }
    return () => stopAutoSlide();
  }, [categories.length, visibleCards, isPaused, isHovering, currentIndex]);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const categoriesRes = await api.categories.getAll();
      const allCategories = categoriesRes.data || [];
      
      // Filter active categories and sort by popularity
      const activeCategories = allCategories
        .filter((cat: CategoryData) => cat.is_active)
        .slice(0, limit);
      
      setCategories(activeCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getImageUrl = (path: string | null | undefined): string => {
    if (!path) return '';
    
    if (path.startsWith('http')) {
      return path;
    }
    
    let cleanPath = path;
    if (cleanPath.startsWith('/')) {
      cleanPath = cleanPath.substring(1);
    }
    
    if (cleanPath.startsWith('storage/')) {
      cleanPath = cleanPath.replace('storage/', '');
    }
    
    return `https://api.hypermarket.co.ke/storage/${cleanPath}`;
  };

  const scrollToIndex = useCallback((index: number) => {
    if (!scrollContainerRef.current || categories.length === 0) return;
    
    const container = scrollContainerRef.current;
    const cardElements = container.children;
    if (cardElements.length === 0) return;
    
    const cardWidth = cardElements[0].clientWidth || 120;
    const gap = parseInt(window.getComputedStyle(container).gap) || 12;
    const scrollPosition = (cardWidth + gap) * index;
    
    container.scrollTo({
      left: scrollPosition,
      behavior: 'smooth'
    });
    setCurrentIndex(index);
  }, [categories.length]);

  const scrollNext = useCallback(() => {
    if (categories.length <= visibleCards) return;
    
    let nextIndex = currentIndex + 1;
    
    // If we're at the end, loop back to start
    if (nextIndex > categories.length - visibleCards) {
      nextIndex = 0;
    }
    
    scrollToIndex(nextIndex);
  }, [currentIndex, categories.length, visibleCards, scrollToIndex]);

  const scrollPrev = useCallback(() => {
    if (categories.length <= visibleCards) return;
    
    let prevIndex = currentIndex - 1;
    
    // If we're at the start, go to end
    if (prevIndex < 0) {
      prevIndex = Math.max(0, categories.length - visibleCards);
    }
    
    scrollToIndex(prevIndex);
  }, [currentIndex, categories.length, visibleCards, scrollToIndex]);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    
    const container = scrollContainerRef.current;
    const cardElements = container.children;
    if (cardElements.length === 0) return;
    
    const cardWidth = cardElements[0].clientWidth || 120;
    const gap = parseInt(window.getComputedStyle(container).gap) || 12;
    const scrollPosition = container.scrollLeft;
    const newIndex = Math.round(scrollPosition / (cardWidth + gap));
    
    if (newIndex !== currentIndex) {
      setCurrentIndex(Math.max(0, newIndex));
    }
  };

  const startAutoSlide = () => {
    stopAutoSlide(); // Clear any existing timer
    
    autoSlideTimerRef.current = setInterval(() => {
      scrollNext();
    }, autoSlideInterval);
  };

  const stopAutoSlide = () => {
    if (autoSlideTimerRef.current) {
      clearInterval(autoSlideTimerRef.current);
      autoSlideTimerRef.current = null;
    }
  };

  const toggleAutoSlide = () => {
    setIsPaused(!isPaused);
  };

  const handleMouseEnter = () => {
    setIsHovering(true);
    stopAutoSlide();
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    if (!isPaused) {
      startAutoSlide();
    }
  };

  const showPrevButton = currentIndex > 0;
  const showNextButton = currentIndex < categories.length - visibleCards;
  const totalSlides = Math.ceil(categories.length / visibleCards);
  const currentSlide = Math.floor(currentIndex / visibleCards);

  if (isLoading) {
    return (
      <div className={`compact-section bg-white px-4 sm:px-6 md:px-8 lg:px-12 ${className}`}>
        <div className="w-full">
          <div className="animate-pulse">
            {showHeader && (
              <div className="flex items-center justify-between mb-6">
                <div className="h-8 w-48 bg-gray-200 rounded"></div>
                <div className="h-4 w-20 bg-gray-200 rounded"></div>
              </div>
            )}
            <div className="flex space-x-4 overflow-x-auto pb-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex-shrink-0 w-24 h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (categories.length === 0) {
    return null;
  }

  return (
    <section 
      className={`compact-section bg-white px-4 sm:px-6 md:px-8 lg:px-12 ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="w-full">
        {showHeader && (
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg">
                <TrendingUp size={20} className="text-white" />
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">Top Categories</h2>
            </div>
            <div className="flex items-center space-x-4">
              {/* Auto-slide toggle button */}
              <button
                onClick={toggleAutoSlide}
                className="text-green-600 hover:text-green-700 font-medium flex items-center text-sm"
                title={isPaused ? "Play auto-slide" : "Pause auto-slide"}
              >
                {isPaused ? (
                  <Play size={16} className="mr-1" />
                ) : (
                  <Pause size={16} className="mr-1" />
                )}
                <span className="hidden sm:inline">
                  {isPaused ? 'Play' : 'Pause'}
                </span>
              </button>
              
              <Link 
                href="/categories" 
                className="text-green-600 hover:text-green-700 font-medium flex items-center text-sm"
              >
                View All
                <ArrowRight size={14} className="ml-1" />
              </Link>
            </div>
          </div>
        )}
        
        {/* Carousel Container */}
        <div className="relative">
          {/* Navigation Buttons - Desktop Only */}
          {categories.length > visibleCards && !isMobile && (
            <>
              <button
                onClick={scrollPrev}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 sm:-translate-x-2 z-10 bg-white rounded-full shadow-lg p-2 hover:shadow-xl transition-all duration-300 hover:scale-110 border border-gray-100"
                aria-label="Previous categories"
              >
                <ChevronLeft size={20} className="text-green-600" />
              </button>
              
              <button
                onClick={scrollNext}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 sm:translate-x-2 z-10 bg-white rounded-full shadow-lg p-2 hover:shadow-xl transition-all duration-300 hover:scale-110 border border-gray-100"
                aria-label="Next categories"
              >
                <ChevronRight size={20} className="text-green-600" />
              </button>
            </>
          )}
          
          {/* Auto-slide status indicator */}
          {!isPaused && !isHovering && categories.length > visibleCards && (
            <div className="absolute top-2 right-2 z-10">
              <div className="flex items-center space-x-1 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 border border-gray-200">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-gray-600">Auto</span>
              </div>
            </div>
          )}
          
          {/* Scrollable Categories */}
          <div 
            ref={scrollContainerRef}
            className="flex space-x-3 md:space-x-4 overflow-x-auto pb-6 hide-scrollbar snap-x snap-mandatory"
            onScroll={handleScroll}
            style={{ scrollBehavior: 'smooth' }}
          >
            {categories.map((category, index) => (
              <div 
                key={category.id} 
                className="snap-start flex-shrink-0"
                style={{
                  width: isMobile ? '48vw' : 
                         isTablet ? '23vw' : 
                         '16vw',
                  minWidth: isMobile ? '48vw' : 
                           isTablet ? '23vw' : 
                           '16vw',
                }}
              >
                <Link
                  href={`/categories/${category.slug}`}
                  className="category-card bg-white rounded-xl p-3 hover:shadow-lg transition-all duration-300 text-center group border border-gray-100 hover:border-green-200 h-full block"
                >
                  <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-full flex items-center justify-center group-hover:from-green-100 group-hover:to-emerald-100 transition-all duration-300">
                    {category.image ? (
                      <img 
                        src={getImageUrl(category.image)} 
                        alt={category.name}
                        className="w-full h-full object-cover rounded-full p-1"
                        loading="lazy"
                      />
                    ) : (
                      <ShoppingBag size={24} className="text-green-600 group-hover:text-emerald-700" />
                    )}
                  </div>
                  <h3 className="font-medium text-gray-900 text-xs md:text-sm group-hover:text-green-600 line-clamp-2">
                    {category.name}
                  </h3>
                  {category.products_count && (
                    <p className="text-xs text-gray-500 mt-1">{category.products_count} items</p>
                  )}
                </Link>
              </div>
            ))}
          </div>
          
          {/* Dots Indicator */}
          {categories.length > visibleCards && (
            <div className="flex justify-center space-x-2 mt-4">
              {Array.from({ length: totalSlides }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => scrollToIndex(index * visibleCards)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentSlide
                      ? 'bg-green-600 w-4'
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          )}
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
        
        /* Touch scrolling improvements */
        .snap-x {
          -webkit-overflow-scrolling: touch;
        }
        
        .snap-mandatory {
          scroll-snap-type: x mandatory;
        }
        
        .snap-start {
          scroll-snap-align: start;
        }
        
        /* Auto-slide animation */
        @keyframes slidePulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
        
        .animate-pulse {
          animation: slidePulse 2s infinite;
        }
      `}</style>
    </section>
  );
};

export default TopCategories;