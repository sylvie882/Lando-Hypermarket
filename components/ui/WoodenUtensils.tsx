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

const WoodenUtensils: React.FC = () => {
  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchWoodenUtensilsCategory();
  }, []);

  useEffect(() => {
    if (category) {
      fetchProducts();
    }
  }, [category]);

  useEffect(() => {
    const checkScroll = () => {
      if (scrollContainerRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
        setShowLeftArrow(scrollLeft > 0);
        setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
      }
    };

    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScroll);
      checkScroll();
      return () => container.removeEventListener('scroll', checkScroll);
    }
  }, [products]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300;
      const newScrollLeft = direction === 'left' 
        ? scrollContainerRef.current.scrollLeft - scrollAmount
        : scrollContainerRef.current.scrollLeft + scrollAmount;
      
      scrollContainerRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
    }
  };

  const fetchWoodenUtensilsCategory = async () => {
    try {
      setIsLoading(true);
      
      // Fetch all categories
      const response = await api.categories.getAll();
      const allCategories = response.data || [];
      
      // Find the Wooden Utensils category (ID: 63)
      const woodenUtensilsCat = allCategories.find((cat: Category) => cat.id === 63);
      
      if (woodenUtensilsCat) {
        setCategory(woodenUtensilsCat);
      }
      
    } catch (error) {
      console.error('Error fetching wooden utensils category:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      
      // Build query params
      const params: any = {
        per_page: 20,
        category_id: 63,
        sort: 'sold_count',
        order: 'desc'
      };
      
      const response = await api.products.getAll(params);
      
      // Handle paginated response
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

  // Loading Skeleton
  if (isLoading && !category) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white px-4 sm:px-6 md:px-8 lg:px-12 py-8">
        <div className="w-full">
          <div className="animate-pulse">
            <div className="flex items-center justify-between mb-6">
              <div className="h-8 w-48 bg-gray-200 rounded"></div>
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
              </div>
            </div>
            <div className="flex overflow-x-hidden space-x-4 pb-4">
              {[...Array(8)].map((_, i) => (
                <div 
                  key={i} 
                  className="flex-none w-64 animate-pulse bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
                  style={{
                    animationDelay: `${i * 50}ms`
                  }}
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
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white px-4 sm:px-6 md:px-8 lg:px-12 py-8">
      <div className="w-full">
        {/* Header with Title and Scroll Controls */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-gradient-to-r from-amber-500 to-amber-600 rounded-lg">
              <Sparkles size={20} className="text-white" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">
              {category?.name || 'Wooden Utensils'}
            </h2>
          </div>
          
          {/* Scroll Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => scroll('left')}
              disabled={!showLeftArrow}
              className={`p-2 rounded-full border transition-all duration-200 ${
                showLeftArrow 
                  ? 'bg-white hover:bg-amber-50 border-amber-300 text-amber-700 cursor-pointer' 
                  : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
              }`}
              aria-label="Scroll left"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => scroll('right')}
              disabled={!showRightArrow}
              className={`p-2 rounded-full border transition-all duration-200 ${
                showRightArrow 
                  ? 'bg-white hover:bg-amber-50 border-amber-300 text-amber-700 cursor-pointer' 
                  : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
              }`}
              aria-label="Scroll right"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
        
        {/* Products Row */}
        {products.length > 0 ? (
          <div
            ref={scrollContainerRef}
            className="flex overflow-x-auto overflow-y-hidden space-x-4 pb-4 scrollbar-hide scroll-smooth"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            {products.map((product, index) => (
              <div
                key={product.id}
                className="flex-none w-64 md:w-72 bg-white rounded-lg shadow-sm hover:shadow-md border border-gray-200 hover:border-amber-300 overflow-hidden transition-all duration-300 transform hover:-translate-y-1"
                style={{
                  animationDelay: `${index * 50}ms`
                }}
              >
                <ProductCard
                  product={product}
                  onViewTrack={trackProductView}
                />
              </div>
            ))}
          </div>
        ) : (
          !isLoading && (
            <div className="text-center py-12">
              <div className="bg-amber-50 rounded-2xl p-12">
                <p className="text-gray-600">
                  No products found in this category.
                </p>
              </div>
            </div>
          )
        )}
      </div>

      <style jsx global>{`
        /* Hide scrollbar for Chrome, Safari and Opera */
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default WoodenUtensils;