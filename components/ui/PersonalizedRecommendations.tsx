'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { api } from '@/lib/api';
import { Product } from '@/types';
import ProductCard from '@/components/ui/ProductCard';
import { Sparkles, ChevronLeft, ChevronRight, User, ShoppingBag } from 'lucide-react';

interface PersonalizedRecommendationsProps {
  title?: string;
  limit?: number;
  showHeader?: boolean;
  showStrategy?: boolean;
  className?: string;
  showAuthBadge?: boolean;
}

interface ProductWithMetadata extends Product {
  metadata?: {
    relevance_score?: number;
    recommendation_type?: string;
  };
  recommendation_type?: string;
  relevance_score?: number;
}

const PersonalizedRecommendations: React.FC<PersonalizedRecommendationsProps> = ({
  title = "Recommended For You",
  limit = 12,
  showHeader = true,
  showStrategy = false,
  className = "",
  showAuthBadge = true
}) => {
  const [recommendations, setRecommendations] = useState<ProductWithMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visibleCards, setVisibleCards] = useState(4);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [recommendationStrategy, setRecommendationStrategy] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const resizeTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Check authentication status
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      setIsAuthenticated(!!token);
    };
    checkAuth();
    
    // Listen for auth changes
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, []);

  useEffect(() => {
    fetchRecommendations();

    const handleResize = () => {
      if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current);
      resizeTimerRef.current = setTimeout(() => {
        const width = window.innerWidth;
        setIsMobile(width < 640);
        setIsTablet(width >= 640 && width < 1024);
        if (width < 640) setVisibleCards(2);
        else if (width < 768) setVisibleCards(2);
        else if (width < 1024) setVisibleCards(3);
        else setVisibleCards(4);
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
    const gap = 16;
    container.scrollTo({ left: (cardWidth + gap) * index, behavior: 'smooth' });
    setCurrentIndex(index);
  };

  const scrollNext = () => {
    if (recommendations.length <= visibleCards) return;
    let next = currentIndex + visibleCards;
    if (next >= recommendations.length) next = 0;
    scrollToIndex(next);
  };

  const scrollPrev = () => {
    if (recommendations.length <= visibleCards) return;
    let prev = currentIndex - visibleCards;
    if (prev < 0) prev = Math.max(0, recommendations.length - visibleCards);
    scrollToIndex(prev);
  };

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const cardElements = container.children;
    if (cardElements.length === 0) return;
    const cardWidth = cardElements[0].clientWidth || 256;
    const gap = 16;
    const newIndex = Math.round(container.scrollLeft / (cardWidth + gap));
    if (newIndex !== currentIndex) setCurrentIndex(Math.max(0, newIndex));
  };

  // Fetch recommendations without requiring authentication
  const fetchRecommendations = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      let recommendationsData: ProductWithMetadata[] = [];
      let strategyUsed = '';

      // Try personalized recommendations endpoint (works for both guest and logged-in users)
      try {
        const response = await api.products.getPersonalizedRecommendations({ 
          limit, 
          strategy: 'hybrid' 
        });
        
        if (response?.success && Array.isArray(response?.recommendations) && response.recommendations.length > 0) {
          recommendationsData = response.recommendations;
          strategyUsed = response.strategy_used || 'personalized';
          console.log('Recommendations loaded:', {
            count: recommendationsData.length,
            strategy: strategyUsed,
            isAuthenticated: response.is_authenticated
          });
        } else if (response?.recommendations && Array.isArray(response.recommendations)) {
          recommendationsData = response.recommendations;
          strategyUsed = response.strategy_used || 'fallback';
        }
      } catch (personalizedError) {
        console.log('Personalized recommendations unavailable, using fallback:', personalizedError);
      }

      // If no recommendations from personalized endpoint, try popular products
      if (recommendationsData.length === 0) {
        try {
          const fallbackResponse = await api.products.getAll({ 
            per_page: limit, 
            sort: 'sold_count', 
            order: 'desc',
            is_active: true,
            in_stock: true
          });
          
          const items = fallbackResponse?.data || [];
          if (items.length > 0) {
            recommendationsData = items;
            strategyUsed = 'popular_products';
            console.log('Using popular products as fallback:', items.length);
          }
        } catch (fallbackError) {
          console.error('Fallback products also failed:', fallbackError);
        }
      }

      // If still no products, try featured products as last resort
      if (recommendationsData.length === 0) {
        try {
          const featuredResponse = await api.products.getFeatured();
          if (featuredResponse && Array.isArray(featuredResponse)) {
            recommendationsData = featuredResponse;
            strategyUsed = 'featured_products';
            console.log('Using featured products as last resort:', featuredResponse.length);
          }
        } catch (featuredError) {
          console.error('Featured products failed:', featuredError);
        }
      }

      // Transform products to expected format
      if (recommendationsData.length > 0) {
        const transformed = recommendationsData.map((rec: any) => {
          const finalPrice = rec.discounted_price || rec.price;
          let thumbnail = (rec.thumbnail || '').replace(/\\\//g, '/');
          let main_image = (rec.main_image || rec.thumbnail || '').replace(/\\\//g, '/');
          
          if (thumbnail.startsWith('/')) thumbnail = thumbnail.substring(1);
          if (main_image.startsWith('/')) main_image = main_image.substring(1);

          // Ensure thumbnail has proper URL structure
          if (thumbnail && !thumbnail.startsWith('http') && !thumbnail.startsWith('/storage')) {
            thumbnail = `/storage/${thumbnail}`;
          }
          if (main_image && !main_image.startsWith('http') && !main_image.startsWith('/storage')) {
            main_image = `/storage/${main_image}`;
          }

          return {
            id: rec.id,
            name: rec.name,
            slug: rec.slug,
            description: rec.description || '',
            price: parseFloat(rec.price) || 0,
            discounted_price: rec.discounted_price ? parseFloat(rec.discounted_price) : undefined,
            final_price: parseFloat(finalPrice) || 0,
            thumbnail,
            main_image,
            sku: rec.sku || '', // Add SKU property
            category_id: rec.category_id || null, // Add category_id property
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
            } : undefined,
            vendor: rec.vendor ? {
              id: rec.vendor.id,
              name: rec.vendor.name,
              email: rec.vendor.email || '',
              phone: rec.vendor.phone || '',
              is_active: true,
              created_at: rec.vendor.created_at || new Date().toISOString(),
              updated_at: rec.vendor.updated_at || new Date().toISOString(),
              role: rec.vendor.role || 'user', // Default role if not provided
              loyalty_points: rec.vendor.loyalty_points || 0 // Default loyalty points if not provided
            } : undefined,
            rating: parseFloat(rec.rating) || 0,
            review_count: parseInt(rec.review_count) || 0,
            stock_quantity: parseInt(rec.stock_quantity) || 0,
            is_in_stock: (parseInt(rec.stock_quantity) || 0) > 0,
            is_active: rec.is_active !== undefined ? rec.is_active : true,
            is_featured: rec.is_featured || false,
            views: parseInt(rec.views) || 0,
            sold_count: parseInt(rec.sold_count) || 0,
            created_at: rec.created_at,
            updated_at: rec.updated_at || rec.created_at,
            images: rec.images || [],
            metadata: { 
              relevance_score: rec.relevance_score || rec.metadata?.relevance_score || 0, 
              recommendation_type: rec.recommendation_type || rec.metadata?.recommendation_type || strategyUsed 
            },
            recommendation_type: rec.recommendation_type || strategyUsed,
            relevance_score: rec.relevance_score || 0
          };
        });
        
        setRecommendations(transformed);
        setRecommendationStrategy(strategyUsed);
      } else {
        setError('No products available');
      }
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      setError('Failed to load recommendations');
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  const trackProductView = async (productId: number) => {
    try {
      // This endpoint now works for both guest and authenticated users
      await api.products.trackView(productId);
    } catch (error) {
      // Silently fail - view tracking is not critical
      console.debug('View tracking failed:', error);
    }
  };

  const getRecommendationTypeLabel = (type: string) => {
    switch (type) {
      case 'preference_based':
        return 'Based on your preferences';
      case 'purchase_based':
        return 'Based on your purchases';
      case 'view_based':
        return 'Based on your views';
      case 'session_based':
        return 'Based on your session';
      case 'popular':
        return 'Trending now';
      case 'popular_products':
        return 'Popular products';
      case 'featured_products':
        return 'Featured products';
      default:
        return 'Recommended for you';
    }
  };

  const totalSlides = Math.ceil(recommendations.length / visibleCards);
  const currentSlide = Math.floor(currentIndex / visibleCards);

  if (isLoading) {
    return (
      <div className={`bg-white py-8 ${className}`}>
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-12 w-full">
          {showHeader && (
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-1 h-7 bg-gradient-to-b from-yellow-400 to-orange-500 rounded-full" />
                <div className="h-7 bg-gray-200 rounded w-52 animate-shimmer" />
              </div>
              <div className="flex gap-2">
                <div className="w-9 h-9 bg-gray-200 rounded-full animate-shimmer" />
                <div className="w-9 h-9 bg-gray-200 rounded-full animate-shimmer" />
              </div>
            </div>
          )}
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: visibleCards }).map((_, i) => (
              <div key={i} className="flex-none w-[44vw] sm:w-[45vw] lg:w-[23vw] rounded-xl overflow-hidden border border-gray-100">
                <div className="bg-gray-100 h-44 animate-shimmer" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-gray-100 rounded animate-shimmer w-3/4" />
                  <div className="h-3 bg-gray-100 rounded animate-shimmer w-1/2" />
                  <div className="h-8 bg-gray-100 rounded animate-shimmer mt-3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) return null;

  if (error && recommendations.length === 0) return null;

  return (
    <div className={`bg-white py-8 ${className}`}>
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-12 w-full">
        {showHeader && (
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-1 h-7 bg-gradient-to-b from-yellow-400 to-orange-500 rounded-full" />
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">{title}</h2>
              
              {/* Show recommendation strategy badge */}
              {showStrategy && recommendationStrategy && (
                <span className="hidden sm:inline-flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                  <Sparkles size={11} />
                  {getRecommendationTypeLabel(recommendationStrategy)}
                </span>
              )}
              
              {/* Show authentication status badge */}
              {showAuthBadge && (
                <span className={`hidden sm:inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                  isAuthenticated 
                    ? 'text-emerald-600 bg-emerald-50 border border-emerald-200'
                    : 'text-blue-600 bg-blue-50 border border-blue-200'
                }`}>
                  {isAuthenticated ? <User size={11} /> : <ShoppingBag size={11} />}
                  {isAuthenticated ? 'Personalized' : 'Guest Mode'}
                </span>
              )}
            </div>

            {recommendations.length > visibleCards && (
              <div className="flex items-center gap-2">
                <button
                  onClick={scrollPrev}
                  className="w-9 h-9 rounded-full flex items-center justify-center border border-gray-200 bg-white hover:bg-emerald-50 hover:border-emerald-300 text-gray-500 hover:text-emerald-600 transition-all duration-200 shadow-sm"
                  aria-label="Previous"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={scrollNext}
                  className="w-9 h-9 rounded-full flex items-center justify-center border border-gray-200 bg-white hover:bg-emerald-50 hover:border-emerald-300 text-gray-500 hover:text-emerald-600 transition-all duration-200 shadow-sm"
                  aria-label="Next"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </div>
        )}

        <div
          ref={scrollContainerRef}
          className="flex overflow-x-auto gap-4 pb-2 hide-scrollbar snap-x snap-mandatory"
          onScroll={handleScroll}
          style={{ scrollBehavior: 'smooth' }}
        >
          {recommendations.map((product) => (
            <div
              key={product.id}
              className="snap-start flex-none transition-transform duration-300 hover:scale-[1.02]"
              style={{
                width: isMobile ? '44vw' : isTablet ? '45vw' : '23vw',
                minWidth: isMobile ? '44vw' : isTablet ? '45vw' : '23vw',
              }}
            >
              <div className="h-full bg-white rounded-xl shadow-sm hover:shadow-md border border-gray-100 hover:border-emerald-200 overflow-hidden transition-all duration-300">
                <ProductCard
                  product={product}
                  onViewTrack={trackProductView}
                  hideFeaturedBadge={true}
                />
                {/* Show recommendation type on product card (optional) */}
                {showStrategy && product.recommendation_type && product.recommendation_type !== 'popular' && (
                  <div className="px-3 pb-2">
                    <span className="text-xs text-gray-400">
                      {getRecommendationTypeLabel(product.recommendation_type)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {recommendations.length > visibleCards && (
          <div className="flex justify-center gap-1.5 mt-4">
            {Array.from({ length: totalSlides }).map((_, i) => (
              <button
                key={i}
                onClick={() => scrollToIndex(i * visibleCards)}
                className={`rounded-full transition-all duration-300 ${
                  i === currentSlide
                    ? 'w-5 h-1.5 bg-emerald-500'
                    : 'w-1.5 h-1.5 bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
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
        @keyframes shimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }
        .animate-shimmer {
          background: linear-gradient(
            90deg,
            #f0f0f0 25%,
            #e0e0e0 50%,
            #f0f0f0 75%
          );
          background-size: 1000px 100%;
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
};

export default PersonalizedRecommendations;