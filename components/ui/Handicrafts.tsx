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

const HandicraftsPage: React.FC = () => {
  const [category, setCategory]   = useState<Category | null>(null);
  const [products, setProducts]   = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [itemsPerRow, setItemsPerRow]   = useState(6);
  const [isHovering, setIsHovering]     = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const resizeTimerRef     = useRef<NodeJS.Timeout | null>(null);
  const autoPlayRef        = useRef<NodeJS.Timeout | null>(null);

  // ── Responsive columns ── Show exactly 6 on desktop, 2 on mobile
  useEffect(() => {
    const handleResize = () => {
      if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current);
      resizeTimerRef.current = setTimeout(() => {
        const w = window.innerWidth;
        if (w < 640) {
          setItemsPerRow(2);  // Mobile: 2 items per row
        } else {
          setItemsPerRow(6);  // Desktop: 6 items per row
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

  // ── Fetch category then products ─────────────────────────────────────────
  useEffect(() => { fetchHandicraftsCategory(); }, []);
  useEffect(() => { if (category) fetchProducts(); }, [category]);

  const fetchHandicraftsCategory = async () => {
    try {
      const res = await api.categories.getAll();
      const cat = (res.data || []).find((c: Category) => c.id === 42);
      if (cat) setCategory(cat);
    } catch (e) {
      console.error('Error fetching category:', e);
    }
  };

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const res  = await api.products.getAll({ per_page: 100, category_id: 42 });
      const data = res.data?.data || res.data || [];
      const sorted = (Array.isArray(data) ? data : []).sort((a: Product, b: Product) => {
        const d = (p: Product) => new Date(p.updated_at || p.created_at || 0);
        return d(b).getTime() - d(a).getTime();
      });
      setProducts(sorted);
    } catch (e) {
      console.error('Error fetching products:', e);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const trackProductView = async (productId: number) => {
    try { await api.products.trackView(productId); } catch {}
  };

  // ── Slide helpers ────────────────────────────────────────────────────────
  const itemsPerSlide = itemsPerRow * 2;
  const totalSlides   = Math.max(1, Math.ceil(products.length / itemsPerSlide));

  const scrollToSlide = (idx: number) => {
    if (!scrollContainerRef.current) return;
    const target = ((idx % totalSlides) + totalSlides) % totalSlides;
    scrollContainerRef.current.scrollTo({
      left: scrollContainerRef.current.clientWidth * target,
      behavior: 'smooth',
    });
    setCurrentSlide(target);
  };

  const nextSlide = () => scrollToSlide(currentSlide + 1);
  const prevSlide = () => scrollToSlide(currentSlide - 1);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const idx = Math.round(
      scrollContainerRef.current.scrollLeft / scrollContainerRef.current.clientWidth
    );
    if (idx !== currentSlide) setCurrentSlide(Math.max(0, idx));
  };

  // ── Auto-play ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    if (!isHovering && totalSlides > 1) {
      autoPlayRef.current = setInterval(nextSlide, 5000);
    }
    return () => { if (autoPlayRef.current) clearInterval(autoPlayRef.current); };
  }, [isHovering, totalSlides, currentSlide]);

  // ── Build slides ─────────────────────────────────────────────────────────
  const slides = Array.from({ length: totalSlides }, (_, s) => {
    const chunk = products.slice(s * itemsPerSlide, (s + 1) * itemsPerSlide);
    return {
      row1: chunk.slice(0, itemsPerRow),
      row2: chunk.slice(itemsPerRow),
    };
  });

  // Dynamic grid class based on items per row
  const getGridClass = () => {
    if (itemsPerRow === 2) {
      return "grid gap-3 sm:gap-4 grid-cols-2";
    } else {
      return "grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6";
    }
  };

  // ── Skeleton ─────────────────────────────────────────────────────────────
  if (isLoading && !category) {
    return (
      <div className="bg-white py-8">
        <div className="mx-auto px-4 sm:px-6 lg:px-12 w-full animate-pulse">
          <div className="flex items-center justify-between mb-6">
            <div className="h-8 w-48 bg-gray-200 rounded"></div>
            {totalSlides > 1 && (
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 bg-gray-200 rounded-full"></div>
                <div className="h-2 w-24 bg-gray-200 rounded-full"></div>
                <div className="h-9 w-9 bg-gray-200 rounded-full"></div>
              </div>
            )}
          </div>
          <div className="space-y-4">
            {[1, 2].map((r) => (
              <div key={r} className={getGridClass()}>
                {[...Array(itemsPerRow)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="bg-gray-200 h-40"></div>
                    <div className="p-3">
                      <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white py-8">
      <div className="mx-auto px-4 sm:px-6 lg:px-12 w-full">

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">
            {category?.name || 'Handicrafts & Artisan'}
          </h2>

          {/* Prev + dot scroller + Next - only show if more than 1 slide */}
          {totalSlides > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={prevSlide}
                className="w-9 h-9 rounded-full flex items-center justify-center border border-gray-200 bg-white text-gray-600 hover:bg-[#004E9A] hover:text-white hover:border-[#004E9A] transition-all duration-300 flex-shrink-0"
                aria-label="Previous"
              >
                <ChevronLeft size={18} />
              </button>

              <div
                className="flex items-center gap-1.5 overflow-x-auto max-w-[120px] sm:max-w-[180px]"
                style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}
              >
                {Array.from({ length: totalSlides }).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => scrollToSlide(idx)}
                    className={`h-2 rounded-full flex-shrink-0 transition-all duration-300 ${
                      currentSlide === idx ? 'bg-[#004E9A] w-6' : 'bg-gray-300 w-2 hover:bg-gray-400'
                    }`}
                    aria-label={`Slide ${idx + 1}`}
                  />
                ))}
              </div>

              <button
                onClick={nextSlide}
                className="w-9 h-9 rounded-full flex items-center justify-center border border-gray-200 bg-white text-gray-600 hover:bg-[#004E9A] hover:text-white hover:border-[#004E9A] transition-all duration-300 flex-shrink-0"
                aria-label="Next"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>

        {/* ── Carousel ── */}
        {products.length > 0 ? (
          <div
            ref={scrollContainerRef}
            className="overflow-x-auto snap-x snap-mandatory"
            style={{
              scrollBehavior: 'smooth',
              WebkitOverflowScrolling: 'touch',
              msOverflowStyle: 'none',
              scrollbarWidth: 'none',
            }}
            onScroll={handleScroll}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            <div className="flex" style={{ width: `${totalSlides * 100}%` }}>
              {slides.map((slide, si) => (
                <div
                  key={si}
                  className="snap-start flex-none space-y-3 sm:space-y-4"
                  style={{ width: `${100 / totalSlides}%` }}
                >
                  {slide.row1.length > 0 && (
                    <div className={getGridClass()}>
                      {slide.row1.map((product) => (
                        <div key={product.id} className="flex flex-col h-full">
                          <ProductCard
                            product={product}
                            onViewTrack={trackProductView}
                            hideFeaturedBadge={true}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                  {slide.row2.length > 0 && (
                    <div className={getGridClass()}>
                      {slide.row2.map((product) => (
                        <div key={product.id} className="flex flex-col h-full">
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
              ))}
            </div>
          </div>
        ) : (
          !isLoading && (
            <div className="text-center py-12">
              <div className="bg-orange-50 rounded-2xl p-12">
                <p className="text-gray-600">No products found in this category.</p>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default HandicraftsPage;