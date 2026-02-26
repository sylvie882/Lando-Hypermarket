'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { api } from '@/lib/api';
import { Product } from '@/types';
import ProductCard from '@/components/ui/ProductCard';
import { Sparkles, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';

interface PersonalizedRecommendationsProps {
  title?: string;
  limit?: number;
  showHeader?: boolean;
  showStrategy?: boolean;
  className?: string;
}

// Extend Product type to include metadata
interface ProductWithMetadata extends Product {
  metadata?: {
    relevance_score?: number;
    recommendation_type?: string;
  };
}

const PersonalizedRecommendations: React.FC<PersonalizedRecommendationsProps> = ({
  title = "Recommended For You",
  limit = 12,
  showHeader = true,
  showStrategy = false,
  className = ""
}) => {
  const [recommendations, setRecommendations] = useState<ProductWithMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visibleCards, setVisibleCards] = useState(4);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const resizeTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchRecommendations();
    
    const handleResize = () => {
      if (resizeTimerRef.current) {
        clearTimeout(resizeTimerRef.current);
      }
      
      resizeTimerRef.current = setTimeout(() => {
        const width = window.innerWidth;
        setIsMobile(width < 640);
        setIsTablet(width >= 640 && width < 1024);
        
        if (width < 640) {
          setVisibleCards(1);
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
    if (!scrollContainerRef.current || recommendations.length === 0) return;
    
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
    if (recommendations.length <= visibleCards) return;
    
    let nextIndex = currentIndex + 1;
    
    if (nextIndex > recommendations.length - visibleCards) {
      nextIndex = 0;
    }
    
    scrollToIndex(nextIndex);
  };

  const scrollPrev = () => {
    if (recommendations.length <= visibleCards) return;
    
    let prevIndex = currentIndex - 1;
    
    if (prevIndex < 0) {
      prevIndex = Math.max(0, recommendations.length - visibleCards);
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

  const fetchRecommendations = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Fetching recommendations with limit:', limit);
      
      const response = await api.products.getPersonalizedRecommendations({
        limit,
        strategy: 'hybrid'
      });
      
      console.log('API response received:', response);
      
      if (response.success && Array.isArray(response.recommendations)) {
        const transformedProducts: ProductWithMetadata[] = response.recommendations.map((rec: any) => {
          const finalPrice = rec.discounted_price || rec.price;
          
          let thumbnail = rec.thumbnail || '';
          let main_image = rec.main_image || rec.thumbnail || '';
          
          if (thumbnail.includes('\\/')) {
            thumbnail = thumbnail.replace(/\\\//g, '/');
          }
          if (main_image.includes('\\/')) {
            main_image = main_image.replace(/\\\//g, '/');
          }
          
          if (thumbnail.startsWith('/')) {
            thumbnail = thumbnail.substring(1);
          }
          if (main_image.startsWith('/')) {
            main_image = main_image.substring(1);
          }
          
          return {
            id: rec.id,
            name: rec.name,
            slug: rec.slug,
            description: rec.description || '',
            price: rec.price,
            discounted_price: rec.discounted_price,
            final_price: finalPrice,
            thumbnail: thumbnail,
            main_image: main_image,
            category: rec.category ? {
              id: rec.category.id,
              name: rec.category.name,
              slug: rec.category.slug,
              description: rec.category.description || '',
              image: rec.category.image || '',
              is_active: true,
              order: 0,
              created_at: rec.category.created_at || new Date().toISOString(),
              updated_at: rec.category.updated_at || new Date().toISOString()
            } : null,
            vendor: rec.vendor ? {
              id: rec.vendor.id,
              name: rec.vendor.name,
              email: rec.vendor.email || '',
              phone: rec.vendor.phone || '',
              is_active: true,
              created_at: rec.vendor.created_at || new Date().toISOString(),
              updated_at: rec.vendor.updated_at || new Date().toISOString()
            } : null,
            rating: rec.rating || 0,
            review_count: rec.review_count || 0,
            stock_quantity: rec.stock_quantity || 0,
            is_in_stock: (rec.stock_quantity || 0) > 0,
            is_active: rec.is_active !== undefined ? rec.is_active : true,
            is_featured: rec.is_featured || false,
            views: rec.views || 0,
            sold_count: rec.sold_count || 0,
            created_at: rec.created_at,
            updated_at: rec.updated_at || rec.created_at,
            images: [],
            metadata: {
              relevance_score: rec.relevance_score || 0,
              recommendation_type: rec.recommendation_type || 'popular'
            }
          };
        });
        
        console.log('Transformed products count:', transformedProducts.length);
        console.log('Sample transformed product:', transformedProducts[0]);
        
        setRecommendations(transformedProducts);
      } else {
        console.error('Invalid response structure:', response);
        setError(response.message || 'Failed to load recommendations');
      }
    } catch (err: any) {
      console.error('Error fetching recommendations:', err);
      console.error('Error details:', err.response?.data || err.message);
      setError(`Failed to load personalized recommendations: ${err.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  const trackProductView = async (productId: number) => {
    try {
      await api.products.trackView(productId);
    } catch (error) {
      console.error('Failed to track product view:', error);
    }
  };

  const totalSlides = Math.ceil(recommendations.length / visibleCards);
  const currentSlide = Math.floor(currentIndex / visibleCards);

  // Loading Skeleton
  if (isLoading) {
    return (
      <div className={`bg-white ${className}`}>
        <div className="px-4 sm:px-6 md:px-8 lg:px-12">
          {showHeader && (
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg">
                  <Sparkles size={20} className="text-white" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">{title}</h2>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
              </div>
            </div>
          )}
          <div className="flex overflow-x-hidden space-x-4 pb-4">
            {Array.from({ length: Math.min(limit, 4) }).map((_, index) => (
              <div 
                key={index} 
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
    );
  }

  if (error && recommendations.length === 0) {
    return (
      <div className={`bg-white ${className}`}>
        <div className="px-4 sm:px-6 md:px-8 lg:px-12">
          {showHeader && (
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <h2 className="text-xl md:text-2xl font-bold text-emerald-600">{title}</h2>
              </div>
            </div>
          )}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <AlertCircle className="mx-auto text-yellow-500 mb-3" size={48} />
            <p className="text-yellow-800 mb-4">{error}</p>
            <button
              onClick={fetchRecommendations}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white ${className}`}>
      <div className="px-4 sm:px-6 md:px-8 lg:px-12">
        {showHeader && (
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <h2 className="text-xl md:text-2xl font-bold text-emerald-600">{title}</h2>
            </div>
            
            {/* Navigation Icons */}
            {recommendations.length > visibleCards && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={scrollPrev}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                    currentSlide === 0
                      ? 'bg-yellow-600 text-white hover:bg-yellow-700'
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
                      ? 'bg-yellow-600 text-white hover:bg-yellow-700'
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

        {recommendations.length > 0 ? (
          <>
            {/* Horizontal Scrollable Products Row */}
            <div
              ref={scrollContainerRef}
              className="flex overflow-x-auto space-x-4 pb-2 hide-scrollbar snap-x snap-mandatory"
              onScroll={handleScroll}
              style={{ scrollBehavior: 'smooth' }}
            >
              {recommendations.map((product, index) => (
                <div 
                  key={product.id} 
                  className="snap-start flex-none"
                  style={{
                    width: isMobile ? '85vw' : 
                           isTablet ? '45vw' : 
                           '23vw',
                    minWidth: isMobile ? '85vw' : 
                             isTablet ? '45vw' : 
                             '23vw',
                  }}
                >
                  <div className="h-full bg-white rounded-lg shadow-sm hover:shadow-md border border-gray-200 hover:border-yellow-300 overflow-hidden transition-all duration-300">
                    <ProductCard 
                      product={product} 
                      onViewTrack={trackProductView}
                      hideFeaturedBadge={true}
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Sparkles size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No recommendations yet
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Start browsing products and making purchases to get personalized recommendations.
            </p>
          </div>
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

export default PersonalizedRecommendations;