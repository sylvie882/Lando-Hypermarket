'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ShoppingBag, Star, Clock, Tag, Sparkles } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { api } from '@/lib/api';

interface Banner {
  id: number;
  title: string;
  subtitle: string | null;
  image: string;
  mobile_image: string | null;
  button_text: string | null;
  button_link: string | null;
  order: number;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  type: 'homepage' | 'category' | 'promotional' | 'sidebar';
  category_slug: string | null;
  clicks: number;
  impressions: number;
  created_at: string;
  updated_at: string;
  image_url?: string;
  mobile_image_url?: string;
}

interface FeaturedProduct {
  id: number;
  name: string;
  slug: string;
  price: number;
  discount_price?: number;
  main_image?: string;
  thumbnail?: string;
  rating: number;
  review_count: number;
  category_name?: string;
  is_featured: boolean;
  is_on_sale: boolean;
}

interface BannerCarouselProps {
  height?: {
    mobile?: string;
    desktop?: string;
  };
  rounded?: boolean;
  displayType?: 'banners' | 'featured' | 'mixed'; // Can show banners, featured products, or mixed
}

const BannerCarousel: React.FC<BannerCarouselProps> = ({
  height = {
    mobile: '340px',
    desktop: '420px'
  },
  rounded = true,
  displayType = 'mixed' // Default shows both
}) => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<FeaturedProduct[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [currentDisplayType, setCurrentDisplayType] = useState<'banners' | 'featured'>('banners');

  // Rotate between banners and featured products every 24 hours
  useEffect(() => {
    if (displayType === 'mixed') {
      // Check localStorage for last display type
      const lastDisplayType = localStorage.getItem('lastBannerDisplayType');
      const lastDisplayDate = localStorage.getItem('lastBannerDisplayDate');
      
      const today = new Date().toDateString();
      
      if (lastDisplayType && lastDisplayDate === today) {
        // Use saved display type for today
        setCurrentDisplayType(lastDisplayType as 'banners' | 'featured');
      } else {
        // Randomly choose or alternate
        const randomType = Math.random() > 0.5 ? 'banners' : 'featured';
        setCurrentDisplayType(randomType);
        
        // Save to localStorage
        localStorage.setItem('lastBannerDisplayType', randomType);
        localStorage.setItem('lastBannerDisplayDate', today);
      }
    } else {
      setCurrentDisplayType(displayType);
    }
  }, [displayType]);

  useEffect(() => {
    if (currentDisplayType === 'banners') {
      fetchBanners();
    } else {
      fetchFeaturedProducts();
    }
  }, [currentDisplayType]);

  const fetchBanners = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch('https://api.hypermarket.co.ke/api/banners/homepage');
      
      if (!response.ok) {
        throw new Error(`API responded with ${response.status}`);
      }
      
      const data = await response.json();
      
      let bannerData: Banner[] = [];
      
      if (Array.isArray(data)) {
        bannerData = data;
      } else if (data.data && Array.isArray(data.data)) {
        bannerData = data.data;
      } else if (data.success && Array.isArray(data.data)) {
        bannerData = data.data;
      } else if (data.banners && Array.isArray(data.banners)) {
        bannerData = data.banners;
      }
      
      // Filter active homepage banners only
      const activeHomepageBanners = bannerData
        .filter(banner => {
          const isActive = banner.is_active === true;
          const isHomepage = banner.type === 'homepage';
          const hasImage = banner.image || banner.image_url;
          const isCurrent = !banner.start_date || new Date(banner.start_date) <= new Date();
          const notExpired = !banner.end_date || new Date(banner.end_date) >= new Date();
          
          return isActive && isHomepage && hasImage && isCurrent && notExpired;
        })
        .sort((a, b) => (a.order || 0) - (b.order || 0));
      
      setBanners(activeHomepageBanners);
      
    } catch (error) {
      console.error('Failed to fetch banners:', error);
      setBanners([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFeaturedProducts = async () => {
    try {
      setIsLoading(true);
      
      // Fetch featured products from your API
      const response = await api.products.getFeatured();
      let productsData = response.data || [];
      
      // If no featured products, get some random products
      if (!productsData.length) {
        const allProducts = await api.products.getAll({ per_page: 10 });
        productsData = allProducts.data?.data || allProducts.data || [];
        
        // Mark some as featured
        productsData = productsData.slice(0, 5).map((product: any, index: number) => ({
          ...product,
          is_featured: true,
          is_on_sale: index % 2 === 0 // Make some on sale
        }));
      }
      
      setFeaturedProducts(productsData);
      
    } catch (error) {
      console.error('Failed to fetch featured products:', error);
      setFeaturedProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Get the correct image URL
  const getImageUrl = (item: Banner | FeaturedProduct, isMobile = false): string => {
    if ('image_url' in item && item.image_url) {
      return item.image_url;
    }
    
    if ('image' in item) {
      const imagePath = isMobile ? item.mobile_image || item.image : item.image;
      return api.getImageUrl(imagePath, '/images/placeholder.jpg');
    }
    
    if ('main_image' in item) {
      return api.getImageUrl(item.main_image || item.thumbnail, '/images/placeholder-product.jpg');
    }
    
    return '/images/placeholder.jpg';
  };

  const nextSlide = () => {
    const items = currentDisplayType === 'banners' ? banners : featuredProducts;
    if (items.length <= 1) return;
    setActiveIndex((prev) => (prev === items.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    const items = currentDisplayType === 'banners' ? banners : featuredProducts;
    if (items.length <= 1) return;
    setActiveIndex((prev) => (prev === 0 ? items.length - 1 : prev - 1));
  };

  // Auto-rotate slides
  useEffect(() => {
    const items = currentDisplayType === 'banners' ? banners : featuredProducts;
    if (items.length <= 1) return;
    
    const interval = setInterval(() => {
      nextSlide();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [banners.length, featuredProducts.length, activeIndex, currentDisplayType]);

  // Show loading skeleton
  if (isLoading) {
    return (
      <div 
        className={`relative ${rounded ? 'rounded-2xl' : ''} overflow-hidden bg-gradient-to-r from-green-50 to-lime-50 animate-pulse`}
        style={{ height: typeof window !== 'undefined' && window.innerWidth < 768 ? height.mobile : height.desktop }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        </div>
      </div>
    );
  }

  // Get current items based on display type
  const items = currentDisplayType === 'banners' ? banners : featuredProducts;
  
  // Return null if no items
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      {/* Display Type Badge */}
      <div className="absolute top-4 left-4 z-20">
        <div className="flex items-center gap-2">
          <div className={`px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-sm ${
            currentDisplayType === 'banners' 
              ? 'bg-gradient-to-r from-orange-500/90 to-orange-600/90 text-white' 
              : 'bg-gradient-to-r from-green-500/90 to-lime-600/90 text-white'
          }`}>
            {currentDisplayType === 'banners' ? (
              <div className="flex items-center gap-1">
                <Sparkles size={10} />
                <span>SPECIAL OFFER</span>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <Star size={10} className="fill-yellow-400" />
                <span>FEATURED PRODUCTS</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Carousel */}
      <div className={`relative overflow-hidden ${rounded ? 'rounded-2xl' : ''} shadow-xl`}>
        {/* Desktop View */}
        <div className="hidden md:block" style={{ height: height.desktop }}>
          {items.map((item, index) => {
            const isActive = index === activeIndex;
            const imageUrl = getImageUrl(item, false);
            
            if (!imageUrl) return null;
            
            return (
              <div
                key={currentDisplayType === 'banners' ? (item as Banner).id : (item as FeaturedProduct).id}
                className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                  isActive ? 'opacity-100 z-10 scale-100' : 'opacity-0 z-0 scale-105'
                }`}
              >
                {currentDisplayType === 'banners' ? (
                  <BannerSlide 
                    banner={item as Banner}
                    imageUrl={imageUrl}
                    isActive={isActive}
                  />
                ) : (
                  <FeaturedProductsSlide 
                    products={featuredProducts}
                    activeIndex={activeIndex}
                    index={index}
                    imageUrl={imageUrl}
                    isActive={isActive}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Mobile View */}
        <div className="md:hidden" style={{ height: height.mobile }}>
          {items.map((item, index) => {
            const isActive = index === activeIndex;
            const imageUrl = getImageUrl(item, true);
            
            if (!imageUrl) return null;
            
            return (
              <div
                key={currentDisplayType === 'banners' ? (item as Banner).id : (item as FeaturedProduct).id}
                className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                  isActive ? 'opacity-100 z-10 scale-100' : 'opacity-0 z-0 scale-105'
                }`}
              >
                {currentDisplayType === 'banners' ? (
                  <BannerSlide 
                    banner={item as Banner}
                    imageUrl={imageUrl}
                    isActive={isActive}
                    isMobile={true}
                  />
                ) : (
                  <div className="relative w-full h-full">
                    <Image
                      src={imageUrl}
                      alt={(item as FeaturedProduct).name}
                      fill
                      className="object-cover"
                      loading={isActive ? "eager" : "lazy"}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-bold">{(item as FeaturedProduct).name}</h3>
                        <div className="flex items-center">
                          <Star size={14} className="fill-yellow-400 text-yellow-400 mr-1" />
                          <span className="text-sm">{(item as FeaturedProduct).rating}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        {/* <div>
                          <p className="text-2xl font-bold">Ksh {((item as FeaturedProduct).price).toFixed(2)}</p>
                          {(item as FeaturedProduct).discount_price && (
                            <p className="text-sm line-through text-gray-300">
                              Ksh {((item as FeaturedProduct).discount_price).toFixed(2)}
                            </p>
                          )}
                        </div> */}
                        <Link
                          href={`/products/${(item as FeaturedProduct).slug}`}
                          className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
                        >
                          Shop Now
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Navigation Controls */}
        {items.length > 1 && (
          <>
            <button
              onClick={prevSlide}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full backdrop-blur-sm transition-all duration-300 z-20"
              aria-label="Previous slide"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full backdrop-blur-sm transition-all duration-300 z-20"
              aria-label="Next slide"
            >
              <ChevronRight size={24} />
            </button>
            
            {/* Dots Indicator */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-2 z-20">
              {items.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === activeIndex 
                      ? 'bg-white scale-125' 
                      : 'bg-white/50 hover:bg-white/70'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// Banner Slide Component
const BannerSlide: React.FC<{
  banner: Banner;
  imageUrl: string;
  isActive: boolean;
  isMobile?: boolean;
}> = ({ banner, imageUrl, isActive, isMobile = false }) => {
  const getBannerLink = (): string => {
    if (banner.button_link) {
      return banner.button_link.startsWith('/') ? banner.button_link : `/${banner.button_link}`;
    }
    if (banner.category_slug) {
      return `/categories/${banner.category_slug}`;
    }
    return '/products';
  };

  return (
    <Link
      href={getBannerLink()}
      className="absolute inset-0 w-full h-full block"
    >
      <Image
        src={imageUrl}
        alt={banner.title}
        fill
        className="object-cover"
        loading={isActive ? "eager" : "lazy"}
      />
      {/* Overlay with gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent" />
      
      {/* Content */}
      <div className="absolute inset-0 flex items-center">
        <div className={`text-white p-8 md:p-12 max-w-lg ${
          isMobile ? 'text-center' : 'ml-8 md:ml-12'
        }`}>
          {banner.subtitle && (
            <div className="flex items-center gap-2 mb-2">
              <Tag size={16} />
              <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                {banner.subtitle}
              </span>
            </div>
          )}
          <h2 className="text-2xl md:text-4xl font-bold mb-3 leading-tight">{banner.title}</h2>
          {banner.button_text && (
            <button className="mt-4 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl">
              {banner.button_text}
            </button>
          )}
        </div>
      </div>
    </Link>
  );
};

// Featured Products Slide Component (Desktop only - shows 3 products)
const FeaturedProductsSlide: React.FC<{
  products: FeaturedProduct[];
  activeIndex: number;
  index: number;
  imageUrl: string;
  isActive: boolean;
}> = ({ products, activeIndex, index, imageUrl, isActive }) => {
  // Get 3 products to display in this slide
  const startIndex = activeIndex * 3;
  const slideProducts = products.slice(startIndex, startIndex + 3);

  if (slideProducts.length === 0) return null;

  return (
    <div className="w-full h-full bg-gradient-to-br from-green-50 to-lime-50 p-8">
      <div className="flex flex-col h-full">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Featured Products</h2>
          <p className="text-gray-600">Discover our handpicked selection of premium products</p>
        </div>
        
        <div className="flex-1 grid grid-cols-3 gap-6">
          {slideProducts.map((product) => (
            <Link
              key={product.id}
              href={`/products/${product.slug}`}
              className="group bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className="relative h-48 bg-gradient-to-br from-green-100 to-lime-100">
                <Image
                  src={api.getImageUrl(product.main_image || product.thumbnail, '/images/placeholder-product.jpg')}
                  alt={product.name}
                  fill
                  className="object-contain p-4 group-hover:scale-110 transition-transform duration-300"
                />
                {product.is_on_sale && (
                  <div className="absolute top-3 left-3">
                    <span className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                      SALE
                    </span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 group-hover:text-orange-600 truncate">
                    {product.name}
                  </h3>
                  <div className="flex items-center">
                    <Star size={12} className="fill-yellow-400 text-yellow-400 mr-1" />
                    <span className="text-xs text-gray-600">{product.rating}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-bold text-orange-600">
                      Ksh {product.price.toFixed(2)}
                    </p>
                    {product.discount_price && (
                      <p className="text-sm text-gray-500 line-through">
                        Ksh {product.discount_price.toFixed(2)}
                      </p>
                    )}
                  </div>
                  <button className="px-3 py-1.5 bg-gradient-to-r from-green-500 to-lime-500 text-white text-sm rounded-lg hover:from-orange-500 hover:to-orange-600 transition-all">
                    <ShoppingBag size={16} />
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>
        
        <div className="mt-6 text-center">
          <Link
            href="/products?featured=true"
            className="inline-flex items-center text-orange-600 hover:text-orange-700 font-semibold"
          >
            View all featured products
            <ChevronRight size={18} className="ml-1" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BannerCarousel;