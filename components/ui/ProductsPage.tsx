'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import ProductCard from '@/components/ui/ProductCard';
import { Product } from '@/types';
import { api } from '@/lib/api';
import { ShoppingBag, AlertCircle, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

interface ProductsPageProps {
  title?: string;
}

const tabs = [
  { id: 'fruits',     label: '🍎 Fruits',     categoryId: 45 },
  { id: 'vegetables', label: '🥦 Vegetables', categoryId: 46 },
  { id: 'offers',     label: '🏷️ Offers',     categoryId: null },
];

/** Returns how many columns (= items per row) to show based on viewport */
function getColCount(width: number): number {
  if (width < 480) return 2;   // xs phones  → 2 cols
  if (width < 768) return 2;   // sm phones   → 2 cols
  if (width < 1024) return 3;  // tablets     → 3 cols
  return 4;                    // desktops    → 4 cols
}

const ROWS_PER_SLIDE = 3;

const ProductsPage: React.FC<ProductsPageProps> = ({ title = 'Shop your Favourites' }) => {
  const [products, setProducts]                         = useState<Product[]>([]);
  const [loading, setLoading]                           = useState(true);
  const [error, setError]                               = useState<string | null>(null);
  const [activeTab, setActiveTab]                       = useState('fruits');

  const [allDiscounted, setAllDiscounted]               = useState<Product[]>([]);
  const [discountedLoaded, setDiscountedLoaded]         = useState(false);

  const [currentSlide, setCurrentSlide]                 = useState(0);
  const [cols, setCols]                                 = useState(4);
  const [isHovering, setIsHovering]                     = useState(false);

  const scrollRef      = useRef<HTMLDivElement>(null);
  const resizeTimer    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoPlayTimer  = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Responsive column tracking ──────────────────────────────────────────
  useEffect(() => {
    const update = () => {
      if (resizeTimer.current) clearTimeout(resizeTimer.current);
      resizeTimer.current = setTimeout(() => setCols(getColCount(window.innerWidth)), 120);
    };
    update();
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('resize', update);
      if (resizeTimer.current) clearTimeout(resizeTimer.current);
    };
  }, []);

  // ── Slide helpers ────────────────────────────────────────────────────────
  const itemsPerSlide = cols * ROWS_PER_SLIDE;
  const totalSlides   = Math.max(1, Math.ceil(products.length / itemsPerSlide));

  const scrollToSlide = useCallback(
    (idx: number) => {
      if (!scrollRef.current) return;
      const target = Math.max(0, Math.min(idx, totalSlides - 1));
      scrollRef.current.scrollTo({ left: scrollRef.current.clientWidth * target, behavior: 'smooth' });
      setCurrentSlide(target);
    },
    [totalSlides],
  );

  const nextSlide = useCallback(() => scrollToSlide((currentSlide + 1) % totalSlides), [currentSlide, scrollToSlide, totalSlides]);
  const prevSlide = useCallback(() => scrollToSlide((currentSlide - 1 + totalSlides) % totalSlides), [currentSlide, scrollToSlide, totalSlides]);

  // ── Auto-play ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (autoPlayTimer.current) clearInterval(autoPlayTimer.current);
    if (totalSlides > 1 && !isHovering) {
      autoPlayTimer.current = setInterval(nextSlide, 5000);
    }
    return () => { if (autoPlayTimer.current) clearInterval(autoPlayTimer.current); };
  }, [totalSlides, isHovering, nextSlide]);

  // ── Reset on tab change ──────────────────────────────────────────────────
  useEffect(() => {
    setCurrentSlide(0);
    scrollRef.current?.scrollTo({ left: 0, behavior: 'instant' as ScrollBehavior });
  }, [activeTab]);

  // ── Data fetching ────────────────────────────────────────────────────────
  const isDiscounted = (p: Product) =>
    (p.discounted_price && +p.discounted_price > 0 && +p.discounted_price < +p.price) ||
    (p.sale_price       && +p.sale_price > 0       && +p.sale_price       < +p.price) ||
    (p.final_price      && +p.final_price > 0      && +p.final_price      < +p.price) ||
    !!(p.discount_percentage && +p.discount_percentage > 0);

  const fetchCategoryProducts = useCallback(async () => {
    const tab = tabs.find((t) => t.id === activeTab);
    if (!tab?.categoryId) { setProducts([]); setLoading(false); return; }

    setLoading(true);
    setError(null);
    try {
      const res = await api.products.getAll({ category_id: tab.categoryId, per_page: 100 });
      const data = (res?.data as any)?.data ?? res?.data ?? [];
      setProducts(Array.isArray(data) ? data : []);
    } catch (e: unknown) {
      setError((e as Error)?.message || 'Failed to load products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  const fetchDiscounted = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [fRes, vRes] = await Promise.all([
        api.products.getAll({ category_id: 45, per_page: 100 }),
        api.products.getAll({ category_id: 46, per_page: 100 }),
      ]);
      const extract = (r: unknown) => {
        const d = (r as any)?.data?.data ?? (r as any)?.data ?? [];
        return Array.isArray(d) ? d : [];
      };
      const combined = [...extract(fRes), ...extract(vRes)].filter(isDiscounted);
      setAllDiscounted(combined);
      setDiscountedLoaded(true);
      setProducts(combined);
    } catch (e: unknown) {
      setError((e as Error)?.message || 'Failed to load offers');
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (activeTab === 'offers') {
      if (!discountedLoaded) { fetchDiscounted(); }
      else { setProducts(allDiscounted); setLoading(false); }
    } else {
      fetchCategoryProducts();
    }
  }, [activeTab, discountedLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Scroll listener (sync indicator) ────────────────────────────────────
  const handleScroll = () => {
    if (!scrollRef.current) return;
    const idx = Math.round(scrollRef.current.scrollLeft / scrollRef.current.clientWidth);
    if (idx !== currentSlide) setCurrentSlide(Math.max(0, idx));
  };

  // ── Build slides ─────────────────────────────────────────────────────────
  const slides: Product[][][] = [];
  for (let s = 0; s < products.length; s += itemsPerSlide) {
    const slideItems = products.slice(s, s + itemsPerSlide);
    const rows: Product[][] = [];
    for (let r = 0; r < ROWS_PER_SLIDE; r++) {
      rows.push(slideItems.slice(r * cols, r * cols + cols));
    }
    slides.push(rows);
  }

  // ── Skeleton ─────────────────────────────────────────────────────────────
  const gridClass = `grid gap-3 sm:gap-4 ${
    cols === 2 ? 'grid-cols-2' : cols === 3 ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
  }`;

  if (loading && products.length === 0) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="bg-white w-full">
      <div className="mx-auto px-3 sm:px-4 lg:px-12 w-full">

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-4 sm:mb-6 gap-2">
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 leading-tight">{title}</h1>

          {/* Desktop prev / dots / next */}
          {totalSlides > 1 && (
            <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
              <button onClick={prevSlide} className="p-1.5 sm:p-2 rounded-full bg-white border border-gray-300 hover:border-[#004E9A] transition-all" aria-label="Previous">
                <ChevronLeft size={18} className="text-gray-700" />
              </button>

              <div className="flex items-center gap-1.5">
                {Array.from({ length: Math.min(totalSlides, 5) }).map((_, i) => {
                  let page = i;
                  if (totalSlides > 5) {
                    if (currentSlide <= 2) page = i;
                    else if (currentSlide >= totalSlides - 3) page = totalSlides - 5 + i;
                    else page = currentSlide - 2 + i;
                  }
                  return (
                    <button
                      key={page}
                      onClick={() => scrollToSlide(page)}
                      className={`h-2 rounded-full transition-all duration-200 ${currentSlide === page ? 'bg-[#004E9A] w-5' : 'bg-gray-300 hover:bg-gray-400 w-2'}`}
                      aria-label={`Slide ${page + 1}`}
                    />
                  );
                })}
              </div>

              <button onClick={nextSlide} className="p-1.5 sm:p-2 rounded-full bg-white border border-gray-300 hover:border-[#004E9A] transition-all" aria-label="Next">
                <ChevronRight size={18} className="text-gray-700" />
              </button>
            </div>
          )}
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-2 sm:gap-3 mb-5 sm:mb-8 overflow-x-auto pb-1" style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setError(null); }}
              disabled={loading}
              className={`px-3 sm:px-5 py-1.5 sm:py-2 rounded text-xs sm:text-sm font-medium border transition-all whitespace-nowrap flex-shrink-0
                ${activeTab === tab.id ? 'bg-[#004E9A] text-white border-[#004E9A]' : 'bg-white text-gray-700 border-gray-300 hover:border-gray-500'}
                ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Content ── */}
        {loading ? (
          // Loading skeleton: 3 rows × cols cards
          <div className="space-y-3 sm:space-y-4">
            {[1, 2, 3].map((r) => (
              <div key={r} className={gridClass}>
                {Array.from({ length: cols }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-gray-100 aspect-square rounded-xl mb-2" />
                    <div className="h-3 bg-gray-100 rounded w-3/4 mb-1.5" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12 sm:py-16">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="text-red-600" size={28} />
            </div>
            <p className="text-red-500 mb-4 text-sm sm:text-base">{error}</p>
            <button
              onClick={() => activeTab === 'offers' ? fetchDiscounted() : fetchCategoryProducts()}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#E67E22] hover:bg-[#D35400] text-white rounded-lg font-medium transition-colors text-sm"
            >
              <RefreshCw size={16} /> Try Again
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 sm:py-16">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
              <ShoppingBag size={28} className="text-blue-600" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">No products found</h3>
            <p className="text-gray-600 mb-5 sm:mb-6 max-w-md mx-auto text-sm sm:text-base px-4">
              {activeTab === 'offers'
                ? 'No discounted products available right now. Check back soon!'
                : `No products available in ${activeTab} at the moment.`}
            </p>
            {activeTab !== 'offers' && (
              <button
                onClick={() => setActiveTab('offers')}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#E67E22] text-white rounded-lg font-medium hover:bg-[#D35400] transition-colors text-sm"
              >
                View offers instead
              </button>
            )}
          </div>
        ) : (
          <>
            {/* ── Carousel ── */}
            <div
              ref={scrollRef}
              className="overflow-x-auto snap-x snap-mandatory"
              style={{ scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch', msOverflowStyle: 'none', scrollbarWidth: 'none' }}
              onScroll={handleScroll}
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
            >
              <div className="flex" style={{ width: `${slides.length * 100}%` }}>
                {slides.map((rows, si) => (
                  <div
                    key={si}
                    className="snap-start flex-none space-y-3 sm:space-y-4"
                    style={{ width: `${100 / slides.length}%` }}
                  >
                    {rows.map((row, ri) =>
                      row.length > 0 ? (
                        <div key={ri} className={gridClass}>
                          {row.map((product) => (
                            <div
                              key={product.id}
                              className="bg-white rounded-lg sm:rounded-xl shadow-sm hover:shadow-md border border-gray-100 hover:border-[#004E9A]/20 overflow-hidden transition-all duration-300"
                            >
                              <ProductCard
                                product={product}
                                onViewTrack={(id) => console.log('Viewing:', id)}
                              />
                            </div>
                          ))}
                        </div>
                      ) : null,
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* ── Mobile prev / dots / next ── */}
            {totalSlides > 1 && (
              <div className="flex sm:hidden items-center justify-center gap-3 mt-5">
                <button onClick={prevSlide} className="p-1.5 rounded-full bg-white border border-gray-300" aria-label="Previous">
                  <ChevronLeft size={16} className="text-gray-700" />
                </button>

                <div className="flex items-center gap-1.5">
                  {Array.from({ length: Math.min(totalSlides, 5) }).map((_, i) => {
                    let page = i;
                    if (totalSlides > 5) {
                      if (currentSlide <= 2) page = i;
                      else if (currentSlide >= totalSlides - 3) page = totalSlides - 5 + i;
                      else page = currentSlide - 2 + i;
                    }
                    return (
                      <button
                        key={page}
                        onClick={() => scrollToSlide(page)}
                        className={`h-1.5 rounded-full transition-all duration-200 ${currentSlide === page ? 'bg-[#004E9A] w-4' : 'bg-gray-300 w-1.5'}`}
                        aria-label={`Slide ${page + 1}`}
                      />
                    );
                  })}
                </div>

                <button onClick={nextSlide} className="p-1.5 rounded-full bg-white border border-gray-300" aria-label="Next">
                  <ChevronRight size={16} className="text-gray-700" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ProductsPage;
