'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { ShoppingBag, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';

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
  autoSlideInterval = 5000,
}) => {
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visibleCards, setVisibleCards] = useState(6);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const autoSlideTimerRef = useRef<NodeJS.Timeout | null>(null);
  const resizeTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchCategories();
    
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
      }, 150);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current);
      if (autoSlideTimerRef.current) clearInterval(autoSlideTimerRef.current);
    };
  }, []);

  // Auto slide effect
  useEffect(() => {
    if (categories.length > visibleCards) {
      startAutoSlide();
    }
    return () => {
      if (autoSlideTimerRef.current) clearInterval(autoSlideTimerRef.current);
    };
  }, [categories.length, visibleCards, currentIndex]);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const categoriesRes = await api.categories.getAll();
      const allCategories = categoriesRes.data || [];
      
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
    
    if (nextIndex > categories.length - visibleCards) {
      nextIndex = 0;
    }
    
    scrollToIndex(nextIndex);
  }, [currentIndex, categories.length, visibleCards, scrollToIndex]);

  const scrollPrev = useCallback(() => {
    if (categories.length <= visibleCards) return;
    
    let prevIndex = currentIndex - 1;
    
    if (prevIndex < 0) {
      prevIndex = Math.max(0, categories.length - visibleCards);
    }
    
    scrollToIndex(prevIndex);
  }, [currentIndex, categories.length, visibleCards, scrollToIndex]);

  const startAutoSlide = () => {
    if (autoSlideTimerRef.current) clearInterval(autoSlideTimerRef.current);
    
    autoSlideTimerRef.current = setInterval(() => {
      scrollNext();
    }, autoSlideInterval);
  };

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

  const totalSlides = Math.ceil(categories.length / visibleCards);
  const currentSlide = Math.floor(currentIndex / visibleCards);

  if (isLoading) {
    return (
      <div className={`compact-section bg-white ${className}`}>
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
    <section className={`compact-section bg-white ${className}`}>
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-12 w-full">
        {showHeader && (
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <h2 className="text-xl md:text-2xl font-bold text-emerald-600">Top Categories</h2>
            </div>
            
            {/* Navigation Icons at Top Right */}
            {categories.length > visibleCards && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={scrollPrev}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                    currentSlide === 0
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                  }`}
                  aria-label="Previous categories"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={scrollNext}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                    currentSlide === totalSlides - 1
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                  }`}
                  aria-label="Next categories"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </div>
        )}
        
        {/* Carousel Container */}
        <div className="relative">
          {/* Scrollable Categories */}
          <div 
            ref={scrollContainerRef}
            className="flex space-x-3 md:space-x-4 overflow-x-auto pb-2 hide-scrollbar snap-x snap-mandatory"
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
                  className="category-card bg-white rounded-xl p-3 hover:shadow-lg transition-all duration-300 text-center group border border-gray-100 hover:border-emerald-200 h-full block"
                >
                  <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-3 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-full flex items-center justify-center group-hover:from-emerald-100 group-hover:to-emerald-200 transition-all duration-300">
                    {category.image ? (
                      <img 
                        src={getImageUrl(category.image)} 
                        alt={category.name}
                        className="w-full h-full object-cover rounded-full p-1"
                        loading="lazy"
                      />
                    ) : (
                      <ShoppingBag size={24} className="text-emerald-600 group-hover:text-emerald-700" />
                    )}
                  </div>
                  <h3 className="font-medium text-gray-900 text-xs md:text-sm group-hover:text-emerald-600 line-clamp-2">
                    {category.name}
                  </h3>
                  {category.products_count && (
                    <p className="text-xs text-gray-500 mt-1">{category.products_count} items</p>
                  )}
                </Link>
              </div>
            ))}
          </div>
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

export default TopCategories;