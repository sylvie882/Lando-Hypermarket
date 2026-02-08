'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  slug: string;
  main_image: string;
}

interface ProductsCarouselProps {
  height?: {
    mobile?: string;
    desktop?: string;
  };
  rounded?: boolean;
}

const ProductsCarousel: React.FC<ProductsCarouselProps> = ({
  height = {
    mobile: '300px',
    desktop: '400px'
  },
  rounded = true,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      setIsLoading(true);
      
      // Fetch featured products from your API
      const response = await fetch('https://api.hypermarket.co.ke/api/products/featured');
      
      if (!response.ok) {
        throw new Error(`API responded with ${response.status}`);
      }
      
      const data = await response.json();
      
      // Process the response
      let productsData: Product[] = [];
      
      if (Array.isArray(data)) {
        productsData = data;
      } else if (data.data && Array.isArray(data.data)) {
        productsData = data.data;
      } else if (data.success && Array.isArray(data.data)) {
        productsData = data.data;
      }
      
      // Filter products with images
      const filteredProducts = productsData
        .filter(product => product.main_image)
        .slice(0, 5);
      
      setProducts(filteredProducts);
      
    } catch (error) {
      console.error('Failed to fetch featured products:', error);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const nextSlide = () => {
    if (products.length <= 1) return;
    setActiveIndex((prev) => (prev === products.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    if (products.length <= 1) return;
    setActiveIndex((prev) => (prev === 0 ? products.length - 1 : prev - 1));
  };

  // Auto-rotate products
  useEffect(() => {
    if (products.length <= 1) return;
    
    const interval = setInterval(() => {
      nextSlide();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [products.length, activeIndex]);

  if (isLoading) {
    return (
      <div 
        className={`relative ${rounded ? 'rounded-2xl' : ''} overflow-hidden bg-gray-100 animate-pulse`}
        style={{ height: typeof window !== 'undefined' && window.innerWidth < 768 ? height.mobile : height.desktop }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <div className={`relative overflow-hidden ${rounded ? 'rounded-2xl' : ''} shadow-lg`}>
      <div style={{ height: typeof window !== 'undefined' && window.innerWidth < 768 ? height.mobile : height.desktop }}>
        {products.map((product, index) => {
          const isActive = index === activeIndex;
          
          return (
            <div
              key={product.id}
              className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                isActive ? 'opacity-100 z-10 scale-100' : 'opacity-0 z-0 scale-105'
              }`}
            >
              {/* Full-width product image */}
              <div className="relative h-full w-full">
                <img
                  src={product.main_image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  loading={isActive ? "eager" : "lazy"}
                />
                
                {/* Shop Now Button - positioned on left side */}
                <div className="absolute left-8 bottom-8 md:left-12 md:bottom-12">
                  <Link
                    href={`/products/${product.id}`} 
                    className="inline-flex items-center gap-2 bg-white hover:bg-gray-100 text-emerald-600 px-6 py-3 md:px-8 md:py-4 rounded-lg font-bold text-base md:text-lg transition-all hover:scale-105 shadow-lg"
                  >
                    Shop Now
                    <ArrowRight size={18} className="md:w-5 md:h-5" />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {products.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-lg z-20"
            aria-label="Previous product"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-lg z-20"
            aria-label="Next product"
          >
            <ChevronRight size={24} />
          </button>
          
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-2 z-20">
            {products.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveIndex(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === activeIndex 
                    ? 'bg-white scale-125' 
                    : 'bg-white/50 hover:bg-white/70'
                }`}
                aria-label={`Go to product ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ProductsCarousel;