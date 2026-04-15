'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import ProductCard from '@/components/ui/ProductCard';
import { Product } from '@/types';
import { api } from '@/lib/api';
import { ShoppingBag, AlertCircle, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

interface ProductsPageProps {
  title?: string;
}

const ProductsPage: React.FC<ProductsPageProps> = ({
  title = 'Shop your Favourites'
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('offers');
  
  // Store discounted products for offers tab (only from fruits & vegetables)
  const [allDiscountedProducts, setAllDiscountedProducts] = useState<Product[]>([]);
  const [discountedProductsLoaded, setDiscountedProductsLoaded] = useState(false);
  
  // Carousel states
  const [currentSlide, setCurrentSlide] = useState(0);
  const [itemsPerView, setItemsPerView] = useState(4);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isHovering, setIsHovering] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const resizeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoPlayIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Define tabs - only Fruits and Vegetables categories
  const tabs = [
    { id: 'fruits', label: 'Fruits', categoryId: 45 },
    { id: 'vegetables', label: 'Vegetables', categoryId: 46 },
    { id: 'offers', label: 'Offers', categoryId: null },
  ];

  const allowedOfferCategories = [45, 46];

  // Handle responsive layout
  useEffect(() => {
    const handleResize = () => {
      if (resizeTimerRef.current) {
        clearTimeout(resizeTimerRef.current);
      }
      
      resizeTimerRef.current = setTimeout(() => {
        const width = window.innerWidth;
        setIsMobile(width < 640);
        setIsTablet(width >= 640 && width < 1024);
        
        if (width < 640) {
          setItemsPerView(2);
        } else if (width < 768) {
          setItemsPerView(2);
        } else if (width < 1024) {
          setItemsPerView(3);
        } else {
          setItemsPerView(4);
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

  // Auto-scroll functionality
  useEffect(() => {
    if (isAutoPlaying && !isHovering && products.length > itemsPerView * 3) {
      autoPlayIntervalRef.current = setInterval(() => {
        nextSlide();
      }, 5000);
    }
    
    return () => {
      if (autoPlayIntervalRef.current) {
        clearInterval(autoPlayIntervalRef.current);
      }
    };
  }, [isAutoPlaying, isHovering, products.length, itemsPerView, currentSlide]);

  // Scroll to specific slide
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
    setCurrentPage(slideIndex + 1);
  };

  const nextSlide = () => {
    if (products.length <= itemsPerView * 3) return;
    
    const totalSlides = Math.ceil(products.length / (itemsPerView * 3));
    let nextIndex = currentSlide + 1;
    
    if (nextIndex >= totalSlides) {
      nextIndex = 0;
    }
    
    scrollToSlide(nextIndex);
  };

  const prevSlide = () => {
    if (products.length <= itemsPerView * 3) return;
    
    const totalSlides = Math.ceil(products.length / (itemsPerView * 3));
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
      setCurrentPage(Math.max(0, newSlide) + 1);
    }
  };

  // Fetch products based on active tab
  useEffect(() => {
    if (activeTab === 'offers') {
      if (!discountedProductsLoaded) {
        fetchAllDiscountedProducts();
      } else {
        updateCurrentPageProducts();
      }
    } else {
      fetchCategoryProducts();
    }
  }, [activeTab, discountedProductsLoaded]);

  // Reset carousel when tab changes
  useEffect(() => {
    setCurrentSlide(0);
    setCurrentPage(1);
    setIsAutoPlaying(true);
  }, [activeTab]);

  const fetchAllDiscountedProducts = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const fruitsResponse = await api.products.getAll({ 
        category_id: 45,
        per_page: 100 
      });
      
      const vegetablesResponse = await api.products.getAll({ 
        category_id: 46,
        per_page: 100 
      });
      
      let allDiscounted: Product[] = [];
      
      if (fruitsResponse?.data) {
        const fruitsData = (fruitsResponse.data as any).data || fruitsResponse.data;
        if (Array.isArray(fruitsData)) {
          const fruitsDiscounted = fruitsData.filter(isProductDiscounted);
          allDiscounted = [...allDiscounted, ...fruitsDiscounted];
        }
      }
      
      if (vegetablesResponse?.data) {
        const vegetablesData = (vegetablesResponse.data as any).data || vegetablesResponse.data;
        if (Array.isArray(vegetablesData)) {
          const vegetablesDiscounted = vegetablesData.filter(isProductDiscounted);
          allDiscounted = [...allDiscounted, ...vegetablesDiscounted];
        }
      }
      
      setAllDiscountedProducts(allDiscounted);
      setDiscountedProductsLoaded(true);
      updateCurrentPageProducts(allDiscounted);
    } catch (error: any) {
      console.error('Error fetching discounted products:', error);
      setError(error?.message || 'Failed to load offers');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategoryProducts = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const currentTab = tabs.find(tab => tab.id === activeTab);
      
      if (!currentTab?.categoryId) {
        setProducts([]);
        setLoading(false);
        return;
      }

      const response = await api.products.getAll({ 
        category_id: currentTab.categoryId,
        per_page: 100
      });
      
      if (response?.data) {
        const productsData = (response.data as any).data || response.data;
        setProducts(Array.isArray(productsData) ? productsData : []);
      } else {
        setProducts([]);
      }
    } catch (error: any) {
      console.error('Error fetching products:', error);
      setError(error?.message || 'Failed to load products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const updateCurrentPageProducts = (discountedList = allDiscountedProducts) => {
    setProducts(discountedList);
    setLoading(false);
  };

  const isProductDiscounted = (product: Product): boolean => {
    const hasDiscountedPrice = !!(product.discounted_price && 
                              Number(product.discounted_price) > 0 && 
                              Number(product.discounted_price) < Number(product.price));
    
    const hasSalePrice = !!(product.sale_price && 
                        Number(product.sale_price) > 0 && 
                        Number(product.sale_price) < Number(product.price));
    
    const hasFinalPrice = !!(product.final_price && 
                         Number(product.final_price) > 0 && 
                         Number(product.final_price) < Number(product.price));
    
    const hasDiscountPercentage = !!(product.discount_percentage && 
                                   Number(product.discount_percentage) > 0);
    
    return hasDiscountedPrice || hasSalePrice || hasFinalPrice || hasDiscountPercentage;
  };

  const handleRetry = () => {
    if (activeTab === 'offers') {
      setDiscountedProductsLoaded(false);
      fetchAllDiscountedProducts();
    } else {
      fetchCategoryProducts();
    }
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setError(null);
    setCurrentSlide(0);
    setCurrentPage(1);
  };

  // Split products into rows (3 rows)
  const getRows = () => {
    const rows = [];
    const itemsPerRow = itemsPerView;
    
    for (let i = 0; i < products.length; i += itemsPerRow * 3) {
      const slideProducts = products.slice(i, i + itemsPerRow * 3);
      const row1 = slideProducts.slice(0, itemsPerRow);
      const row2 = slideProducts.slice(itemsPerRow, itemsPerRow * 2);
      const row3 = slideProducts.slice(itemsPerRow * 2, itemsPerRow * 3);
      rows.push({ row1, row2, row3 });
    }
    
    return rows;
  };

  const rows = getRows();
  const totalSlides = rows.length;

  // Update total pages whenever totalSlides changes
  useEffect(() => {
    setTotalPages(totalSlides);
  }, [totalSlides]);

  if (loading && products.length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto px-4 sm:px-6 lg:px-12 w-full">
        {/* Header with title and horizontal scroll controls */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">
            {title}
          </h1>
          
          {/* Horizontal Scroll Controls - Top Right */}
          {products.length > itemsPerView * 3 && (
            <div className="hidden sm:flex items-center gap-2">
              <button
                onClick={prevSlide}
                className="p-2 rounded-full bg-white border border-gray-300 hover:bg-gray-50 hover:border-[#004E9A] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Previous slide"
              >
                <ChevronLeft size={20} className="text-gray-700" />
              </button>
              
              {/* Pagination Dots */}
              <div className="flex items-center gap-1.5 mx-2">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNumber;
                  if (totalPages <= 5) {
                    pageNumber = i + 1;
                  } else if (currentPage <= 3) {
                    pageNumber = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNumber = totalPages - 4 + i;
                  } else {
                    pageNumber = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNumber}
                      onClick={() => scrollToSlide(pageNumber - 1)}
                      className={`h-2 rounded-full transition-all duration-200 ${
                        currentPage === pageNumber
                          ? 'bg-[#004E9A] w-6'
                          : 'bg-gray-300 hover:bg-gray-400 w-2'
                      }`}
                      aria-label={`Go to page ${pageNumber}`}
                    />
                  );
                })}
              </div>
              
              <button
                onClick={nextSlide}
                className="p-2 rounded-full bg-white border border-gray-300 hover:bg-gray-50 hover:border-[#004E9A] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Next slide"
              >
                <ChevronRight size={20} className="text-gray-700" />
              </button>
            </div>
          )}
        </div>

        {/* Pill Tabs */}
        <div className="flex gap-3 mb-8 overflow-x-auto hide-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              disabled={loading}
              className={`
                px-5 py-2 rounded text-sm font-medium border transition-all whitespace-nowrap
                ${activeTab === tab.id
                  ? 'bg-[#004E9A] text-white border-gray-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-gray-500'
                }
                ${loading ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Products Section */}
        <div>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((row) => (
                <div key={row} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {[...Array(itemsPerView)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="bg-gray-100 aspect-square rounded-2xl mb-3"></div>
                      <div className="h-4 bg-gray-100 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-gray-100 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="text-red-600" size={32} />
              </div>
              <p className="text-red-500 mb-4">{error}</p>
              <button
                onClick={handleRetry}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#E67E22] hover:bg-[#D35400] text-white rounded-lg font-medium transition-colors"
              >
                <RefreshCw size={18} />
                <span>Try Again</span>
              </button>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 rounded-full bg-[#004E9A] flex items-center justify-center mx-auto mb-5">
                <ShoppingBag size={32} className="text-emerald-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                No products found
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {activeTab === 'offers' 
                  ? 'No discounted products available for Fruits and Vegetables at the moment. Check back later!' 
                  : `No products available in the ${activeTab} category at the moment.`}
              </p>
              {activeTab !== 'offers' && (
                <button
                  onClick={() => handleTabChange('offers')}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#E67E22] text-white rounded-lg font-medium hover:bg-[#D35400] transition-colors"
                >
                  View offers instead
                </button>
              )}
            </div>
          ) : (
            <>
              {/* 3-Row Horizontal Scrollable Products Carousel */}
              <div
                ref={scrollContainerRef}
                className="overflow-x-auto hide-scrollbar snap-x snap-mandatory"
                onScroll={handleScroll}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
                style={{ scrollBehavior: 'smooth' }}
              >
                <div className="flex">
                  {rows.map((row, slideIndex) => (
                    <div
                      key={slideIndex}
                      className="snap-start flex-none w-full"
                      style={{ width: '100%', minWidth: '100%' }}
                    >
                      <div className="space-y-4">
                        {/* Row 1 */}
                        {row.row1.length > 0 && (
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                            {row.row1.map((product) => (
                              <div
                                key={product.id}
                                className="bg-white rounded-lg shadow-sm hover:shadow-md border border-gray-100 hover:border-[#004E9A]/20 overflow-hidden transition-all duration-300"
                              >
                                <ProductCard
                                  product={product}
                                  onViewTrack={(id) => console.log('Viewing:', id)}
                                />
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* Row 2 */}
                        {row.row2.length > 0 && (
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                            {row.row2.map((product) => (
                              <div
                                key={product.id}
                                className="bg-white rounded-lg shadow-sm hover:shadow-md border border-gray-100 hover:border-[#004E9A]/20 overflow-hidden transition-all duration-300"
                              >
                                <ProductCard
                                  product={product}
                                  onViewTrack={(id) => console.log('Viewing:', id)}
                                />
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* Row 3 */}
                        {row.row3.length > 0 && (
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                            {row.row3.map((product) => (
                              <div
                                key={product.id}
                                className="bg-white rounded-lg shadow-sm hover:shadow-md border border-gray-100 hover:border-[#004E9A]/20 overflow-hidden transition-all duration-300"
                              >
                                <ProductCard
                                  product={product}
                                  onViewTrack={(id) => console.log('Viewing:', id)}
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

              {/* Mobile Pagination - Bottom Center */}
              {products.length > itemsPerView * 3 && (
                <div className="flex sm:hidden items-center justify-center gap-3 mt-6">
                  <button
                    onClick={prevSlide}
                    className="p-2 rounded-full bg-white border border-gray-300 hover:bg-gray-50"
                    aria-label="Previous slide"
                  >
                    <ChevronLeft size={18} className="text-gray-700" />
                  </button>
                  
                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      let pageNumber;
                      if (totalPages <= 5) {
                        pageNumber = i + 1;
                      } else if (currentPage <= 3) {
                        pageNumber = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNumber = totalPages - 4 + i;
                      } else {
                        pageNumber = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNumber}
                          onClick={() => scrollToSlide(pageNumber - 1)}
                          className={`h-1.5 rounded-full transition-all duration-200 ${
                            currentPage === pageNumber
                              ? 'bg-[#004E9A] w-5'
                              : 'bg-gray-300 hover:bg-gray-400 w-1.5'
                          }`}
                          aria-label={`Go to page ${pageNumber}`}
                        />
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={nextSlide}
                    className="p-2 rounded-full bg-white border border-gray-300 hover:bg-gray-50"
                    aria-label="Next slide"
                  >
                    <ChevronRight size={18} className="text-gray-700" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <style jsx>{`
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

export default ProductsPage;