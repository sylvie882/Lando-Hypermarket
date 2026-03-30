'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { api } from '@/lib/api';
import { Product } from '@/types';
import ProductCard from '@/components/ui/ProductCard';
import { Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';

interface PersonalizedRecommendationsProps {
  title?: string;
  limit?: number;
  showHeader?: boolean;
  showStrategy?: boolean;
  className?: string;
}

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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visibleCards, setVisibleCards] = useState(4);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const resizeTimerRef = useRef<NodeJS.Timeout | null>(null);

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
    let next = currentIndex + 1;
    if (next > recommendations.length - visibleCards) next = 0;
    scrollToIndex(next);
  };

  const scrollPrev = () => {
    if (recommendations.length <= visibleCards) return;
    let prev = currentIndex - 1;
    if (prev < 0) prev = Math.max(0, recommendations.length - visibleCards);
    scrollToIndex(prev);
  };

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const cardElements = container.children;
    if (cardElements.length === 0) return;
    const cardWidth = cardElements[0].clientWidth || 256;
    const newIndex = Math.round(container.scrollLeft / (cardWidth + 16));
    if (newIndex !== currentIndex) setCurrentIndex(Math.max(0, newIndex));
  };

  // Fetch WITHOUT requiring authentication — no token check, uses public/popular fallback
  const fetchRecommendations = useCallback(async () => {
    try {
      setIsLoading(true);

      let response: any = null;

      // Try personalized endpoint first (works for logged-in users too)
      try {
        response = await api.products.getPersonalizedRecommendations({ limit, strategy: 'hybrid' });
      } catch {
        response = null;
      }

      // If personalized failed or returned nothing, fall back to popular products
      if (!response?.success || !Array.isArray(response?.recommendations) || response.recommendations.length === 0) {
        try {
          const fallback = await api.products.getAll({ per_page: limit, sort: 'sold_count', order: 'desc' });
          const items = fallback.data || [];
          response = { success: true, recommendations: items };
        } catch {
          response = { success: true, recommendations: [] };
        }
      }

      if (response.success && Array.isArray(response.recommendations)) {
        const transformed: ProductWithMetadata[] = response.recommendations.map((rec: any) => {
          const finalPrice = rec.discounted_price || rec.price;
          let thumbnail = (rec.thumbnail || '').replace(/\\\//g, '/');
          let main_image = (rec.main_image || rec.thumbnail || '').replace(/\\\//g, '/');
          if (thumbnail.startsWith('/')) thumbnail = thumbnail.substring(1);
          if (main_image.startsWith('/')) main_image = main_image.substring(1);

          return {
            id: rec.id,
            name: rec.name,
            slug: rec.slug,
            description: rec.description || '',
            price: rec.price,
            discounted_price: rec.discounted_price,
            final_price: finalPrice,
            thumbnail,
            main_image,
            category: rec.category ? { id: rec.category.id, name: rec.category.name, slug: rec.category.slug, description: rec.category.description || '', image: rec.category.image || '', is_active: true, order: 0, created_at: rec.category.created_at || new Date().toISOString(), updated_at: rec.category.updated_at || new Date().toISOString() } : null,
            vendor: rec.vendor ? { id: rec.vendor.id, name: rec.vendor.name, email: rec.vendor.email || '', phone: rec.vendor.phone || '', is_active: true, created_at: rec.vendor.created_at || new Date().toISOString(), updated_at: rec.vendor.updated_at || new Date().toISOString() } : null,
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
            metadata: { relevance_score: rec.relevance_score || 0, recommendation_type: rec.recommendation_type || 'popular' }
          };
        });
        setRecommendations(transformed);
      }
    } catch (err) {
      console.error('Error fetching recommendations:', err);
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  const trackProductView = async (productId: number) => {
    try { await api.products.trackView(productId); } catch {}
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
            {Array.from({ length: 4 }).map((_, i) => (
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

  return (
    <div className={`bg-white py-8 ${className}`}>
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-12 w-full">
        {showHeader && (
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-1 h-7 bg-gradient-to-b from-yellow-400 to-orange-500 rounded-full" />
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">{title}</h2>
              <span className="hidden sm:inline-flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                <Sparkles size={11} />
                Trending
              </span>
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
              className="snap-start flex-none"
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
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .snap-x { -webkit-overflow-scrolling: touch; }
        .snap-mandatory { scroll-snap-type: x mandatory; }
        .snap-start { scroll-snap-align: start; }
      `}</style>
    </div>
  );
};

export default PersonalizedRecommendations;
