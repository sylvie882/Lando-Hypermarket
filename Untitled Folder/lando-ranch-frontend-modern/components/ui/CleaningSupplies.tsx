'use client';

import React, { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { Product } from '@/types';
import ProductCard from '@/components/ui/ProductCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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

const CleaningSupplies: React.FC = () => {
  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visibleCards, setVisibleCards] = useState(4);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const resizeTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchCleaningCategory();
    
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

  useEffect(() => {
    if (category) {
      fetchProducts();
    }
  }, [category]);

  const scrollToIndex = (index: number) => {
    if (!scrollContainerRef.current || products.length === 0) return;
    
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
    if (products.length <= visibleCards) return;
    
    let nextIndex = currentIndex + 1;
    
    if (nextIndex > products.length - visibleCards) {
      nextIndex = 0;
    }
    
    scrollToIndex(nextIndex);
  };

  const scrollPrev = () => {
    if (products.length <= visibleCards) return;
    
    let prevIndex = currentIndex - 1;
    
    if (prevIndex < 0) {
      prevIndex = Math.max(0, products.length - visibleCards);
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

  const fetchCleaningCategory = async () => {
    try {
      setIsLoading(true);
      
      const response = await api.categories.getAll();
      const allCategories = response.data || [];
      
      const cleaningCat = allCategories.find((cat: Category) => cat.id === 73);
      
      if (cleaningCat) {
        setCategory(cleaningCat);
      }
      
    } catch (error) {
      console.error('Error fetching cleaning category:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      
      const params: any = {
        per_page: 20,
        category_id: 73,
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

  const totalSlides = Math.ceil(products.length / visibleCards);
  const currentSlide = Math.floor(currentIndex / visibleCards);

  // Loading Skeleton
  if (isLoading && !category) {
    return (
      <div className="bg-white">
        <div className="px-4 sm:px-6 lg:px-12 py-8">
          <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-12 w-full">
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
      </div>
    );
  }

  return (
    <div className="bg-white">
      <div className="px-4 sm:px-6 lg:px-12 py-8">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-12 w-full">
          {/* Header with Title and Navigation Icons */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <h2 className="text-xl md:text-2xl font-bold text-emerald-600">
                {category?.name || 'Cleaning Supplies'}
              </h2>
            </div>
            
            {/* Navigation Icons */}
            {products.length > visibleCards && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={scrollPrev}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                    currentSlide === 0
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-white text-gray-600 hover:bg-blue-50 border border-gray-200'
                  }`}
                  aria-label="Previous products"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={scrollNext}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                    currentSlide === totalSlides - 1
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-white text-gray-600 hover:bg-blue-50 border border-gray-200'
                  }`}
                  aria-label="Next products"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </div>
          
          {/* Products Row */}
          {products.length > 0 ? (
            <div
              ref={scrollContainerRef}
              className="flex overflow-x-auto space-x-4 pb-2 hide-scrollbar snap-x snap-mandatory"
              onScroll={handleScroll}
              style={{ scrollBehavior: 'smooth' }}
            >
              {products.map((product, index) => (
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
                  <div className="h-full bg-white rounded-lg shadow-sm hover:shadow-md border border-gray-200 hover:border-blue-300 overflow-hidden transition-all duration-300">
                    <ProductCard
                      product={product}
                      onViewTrack={trackProductView}
                      hideFeaturedBadge={true}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            !isLoading && (
              <div className="text-center py-12">
                <div className="bg-blue-50 rounded-2xl p-12">
                  <p className="text-gray-600">
                    No products found in this category.
                  </p>
                </div>
              </div>
            )
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
    </div>
  );
};

export default CleaningSupplies;