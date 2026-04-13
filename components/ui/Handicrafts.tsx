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

const HandicraftsPage: React.FC = () => {
  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [itemsPerRow, setItemsPerRow] = useState(4);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isHovering, setIsHovering] = useState(false);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const resizeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoPlayIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchHandicraftsCategory();
    
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

  useEffect(() => {
    if (category) {
      fetchProducts();
    }
  }, [category]);

  // Auto-scroll functionality
  useEffect(() => {
    if (isAutoPlaying && !isHovering && products.length > itemsPerRow * 2) {
      autoPlayIntervalRef.current = setInterval(() => {
        nextSlide();
      }, 5000);
    }
    
    return () => {
      if (autoPlayIntervalRef.current) {
        clearInterval(autoPlayIntervalRef.current);
      }
    };
  }, [isAutoPlaying, isHovering, products.length, itemsPerRow, currentSlide]);

  const scrollToSlide = (slideIndex: number) => {
    if (!scrollContainerRef.current || products.length === 0) return;
    
    const container = scrollContainerRef.current;
    const slideWidth = container.clientWidth;
    const scrollPosition = slideWidth * slideIndex;
    
    container.scrollTo({
      left: scrollPosition,
      behavior: 'smooth'
    });
    setCurrentSlide(slideIndex);
  };

  const nextSlide = () => {
    if (products.length <= itemsPerRow * 2) return;
    
    const totalSlides = Math.ceil(products.length / (itemsPerRow * 2));
    let nextIndex = currentSlide + 1;
    
    if (nextIndex >= totalSlides) {
      nextIndex = 0;
    }
    
    scrollToSlide(nextIndex);
  };

  const prevSlide = () => {
    if (products.length <= itemsPerRow * 2) return;
    
    const totalSlides = Math.ceil(products.length / (itemsPerRow * 2));
    let prevIndex = currentSlide - 1;
    
    if (prevIndex < 0) {
      prevIndex = totalSlides - 1;
    }
    
    scrollToSlide(prevIndex);
  };

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    
    const container = scrollContainerRef.current;
    const slideWidth = container.clientWidth;
    const scrollPosition = container.scrollLeft;
    const newSlide = Math.round(scrollPosition / slideWidth);
    
    if (newSlide !== currentSlide) {
      setCurrentSlide(Math.max(0, newSlide));
    }
  };

  const fetchHandicraftsCategory = async () => {
    try {
      setIsLoading(true);
      
      const response = await api.categories.getAll();
      const allCategories = response.data || [];
      
      const handicraftsCat = allCategories.find((cat: Category) => cat.id === 42);
      
      if (handicraftsCat) {
        setCategory(handicraftsCat);
      }
      
    } catch (error) {
      console.error('Error fetching handicrafts category:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      
      const params: any = {
        per_page: 100,
        category_id: 42,
      };
      
      const response = await api.products.getAll(params);
      
      let productsData = response.data?.data || response.data || [];
      
      // Sort by updated_at (if available) or created_at
      const sortedProducts = productsData.sort((a: Product, b: Product) => {
        const getLatestDate = (product: Product) => {
          const updated = product.updated_at ? new Date(product.updated_at) : null;
          const created = product.created_at ? new Date(product.created_at) : null;
          
          if (updated && created) {
            return updated > created ? updated : created;
          }
          return updated || created || new Date(0);
        };
        
        const dateA = getLatestDate(a);
        const dateB = getLatestDate(b);
        
        return dateB.getTime() - dateA.getTime();
      });
      
      setProducts(sortedProducts);
      
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

  // Split products into slides with 2 rows each
  const getSlides = () => {
    const slides = [];
    const itemsPerSlide = itemsPerRow * 2;
    
    for (let i = 0; i < products.length; i += itemsPerSlide) {
      const slideProducts = products.slice(i, i + itemsPerSlide);
      const row1 = slideProducts.slice(0, itemsPerRow);
      const row2 = slideProducts.slice(itemsPerRow, itemsPerRow * 2);
      slides.push({ row1, row2 });
    }
    
    return slides;
  };

  const slides = getSlides();
  const totalSlides = slides.length;

  // Loading Skeleton
  if (isLoading && !category) {
    return (
      <div className="bg-white py-8">
        <div className="mx-auto px-4 sm:px-6 lg:px-12 w-full">
          <div className="animate-pulse">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                <div className="h-8 w-48 bg-gray-200 rounded"></div>
              </div>
            </div>
            
            {/* 2 Rows of skeleton loaders */}
            <div className="space-y-4">
              {[1, 2].map((row) => (
                <div key={row} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
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

  return (
    <div className="bg-white py-8">
      <div className="mx-auto px-4 sm:px-6 lg:px-12 w-full">
        {/* Header with Title */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">
              {category?.name || 'Handicrafts & Artisan'}
            </h2>
          </div>
        </div>

        {/* Products 2-Row Horizontal Scroll Carousel */}
        {products.length > 0 ? (
          <div
            ref={scrollContainerRef}
            className="overflow-x-auto hide-scrollbar snap-x snap-mandatory"
            onScroll={handleScroll}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            style={{ scrollBehavior: 'smooth' }}
          >
            <div className="flex">
              {slides.map((slide, slideIndex) => (
                <div
                  key={slideIndex}
                  className="snap-start flex-none w-full"
                  style={{ width: '100%', minWidth: '100%' }}
                >
                  <div className="space-y-4">
                    {/* Row 1 */}
                    {slide.row1.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {slide.row1.map((product) => (
                          <div
                            key={product.id}
                            className="bg-white rounded-lg shadow-sm hover:shadow-md border border-gray-200 hover:border-orange-300 overflow-hidden transition-all duration-300"
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
                    
                    {/* Row 2 */}
                    {slide.row2.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {slide.row2.map((product) => (
                          <div
                            key={product.id}
                            className="bg-white rounded-lg shadow-sm hover:shadow-md border border-gray-200 hover:border-orange-300 overflow-hidden transition-all duration-300"
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
                </div>
              ))}
            </div>
          </div>
        ) : (
          !isLoading && (
            <div className="text-center py-12">
              <div className="bg-orange-50 rounded-2xl p-12">
                <p className="text-gray-600">
                  No products found in this category.
                </p>
              </div>
            </div>
          )
        )}
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

export default HandicraftsPage;