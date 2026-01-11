'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';
import Image from 'next/image';

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

interface BannerCarouselProps {
  height?: {
    mobile?: string;
    desktop?: string;
  };
  rounded?: boolean;
  showTitle?: boolean;
}

const BannerCarousel: React.FC<BannerCarouselProps> = ({
  height = {
    mobile: '280px',
    desktop: '380px'
  },
  rounded = true,
  showTitle = true
}) => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setImageErrors(new Set());
      
      console.log('🚀 Fetching banners from API...');
      
      // Try multiple endpoints
      let response;
      try {
        response = await api.banners.getHomepage();
      } catch (apiError) {
        console.log('Trying alternative endpoint...');
        // Fallback: try a direct fetch
        response = await fetch('https://api.hypermarket.co.ke/api/banners/homepage');
        if (!response.ok) throw new Error(`API responded with ${response.status}`);
        response = await response.json();
      }
      
      console.log('📦 API Response:', response);
      
      let bannerData: Banner[] = [];
      
      // Handle different response formats
      if (response.data) {
        if (Array.isArray(response.data)) {
          bannerData = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          bannerData = response.data.data;
        } else if (response.data.success && Array.isArray(response.data.data)) {
          bannerData = response.data.data;
        } else if (response.data.banners && Array.isArray(response.data.banners)) {
          bannerData = response.data.banners;
        }
      } else if (Array.isArray(response)) {
        bannerData = response;
      }
      
      console.log(`✅ Processed ${bannerData.length} banners`);
      
      // Filter active homepage banners
      const homepageBanners = bannerData
        .filter(banner => {
          const isActive = banner.is_active === true || banner.is_active === undefined;
          const isHomepage = banner.type === 'homepage' || !banner.type;
          const hasImage = banner.image || banner.image_url;
          return isActive && hasImage;
        })
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .slice(0, 5); // Limit to 5 banners
      
      console.log(`🎯 ${homepageBanners.length} active homepage banners found`);
      
      if (homepageBanners.length === 0) {
        // Create fallback banners if no banners are returned
        console.log('⚠️ No banners found, creating fallback banners');
        setBanners([
          {
            id: 1,
            title: "Fresh Farm Produce",
            subtitle: "Organic vegetables delivered to your doorstep",
            image: "https://images.unsplash.com/photo-1542838132-92c53300491e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80",
            mobile_image: "https://images.unsplash.com/photo-1542838132-92c53300491e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            button_text: "Shop Now",
            button_link: "/products",
            order: 1,
            is_active: true,
            start_date: null,
            end_date: null,
            type: 'homepage',
            category_slug: null,
            clicks: 0,
            impressions: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 2,
            title: "Free Delivery",
            subtitle: "On orders over KES 2,000",
            image: "https://images.unsplash.com/photo-1561715276-a2d087060f1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80",
            mobile_image: "https://images.unsplash.com/photo-1561715276-a2d087060f1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            button_text: "View Products",
            button_link: "/products?category=vegetables",
            order: 2,
            is_active: true,
            start_date: null,
            end_date: null,
            type: 'homepage',
            category_slug: null,
            clicks: 0,
            impressions: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ]);
      } else {
        setBanners(homepageBanners);
      }
      
    } catch (error: any) {
      console.error('❌ Failed to fetch banners:', error);
      setError(error.message || 'Failed to load banners');
      
      // Even on error, set some fallback banners
      setBanners([
        {
          id: 999,
          title: "Welcome to Lando Ranch",
          subtitle: "Fresh farm products delivered daily",
          image: "https://images.unsplash.com/photo-1542838132-92c53300491e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80",
          mobile_image: "https://images.unsplash.com/photo-1542838132-92c53300491e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
          button_text: "Start Shopping",
          button_link: "/products",
          order: 1,
          is_active: true,
          start_date: null,
          end_date: null,
          type: 'homepage',
          category_slug: null,
          clicks: 0,
          impressions: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Get the correct image URL with fallback
  const getImageUrl = (banner: Banner, isMobile = false): string => {
    // Try image_url from API first
    if (!isMobile && banner.image_url) {
      return banner.image_url;
    }
    
    if (isMobile && banner.mobile_image_url) {
      return banner.mobile_image_url;
    }
    
    // Use image path
    const imagePath = isMobile ? banner.mobile_image || banner.image : banner.image;
    
    if (!imagePath) {
      console.warn(`No image path for banner ${banner.id}, using fallback`);
      return isMobile 
        ? "https://images.unsplash.com/photo-1542838132-92c53300491e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
        : "https://images.unsplash.com/photo-1542838132-92c53300491e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80";
    }
    
    // Check if already a full URL
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    // Construct full URL
    const baseUrl = 'https://api.hypermarket.co.ke';
    let cleanPath = imagePath;
    
    // Remove leading slashes or storage/ prefix
    if (cleanPath.startsWith('/')) cleanPath = cleanPath.substring(1);
    if (cleanPath.startsWith('storage/')) cleanPath = cleanPath.replace('storage/', '');
    
    return `${baseUrl}/storage/${cleanPath}`;
  };

  const nextSlide = () => {
    if (banners.length <= 1) return;
    setActiveIndex((prev) => (prev === banners.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    if (banners.length <= 1) return;
    setActiveIndex((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
  };

  const handleBannerClick = async (bannerId: number) => {
    try {
      await api.banners.trackClick(bannerId);
    } catch (error) {
      console.error('Failed to track banner click:', error);
    }
  };

  const handleImageError = (bannerId: number) => {
    console.error(`Image failed to load for banner ${bannerId}`);
    setImageErrors(prev => new Set(prev).add(bannerId));
  };

  // Auto-rotate banners
  useEffect(() => {
    if (banners.length <= 1) return;
    
    const interval = setInterval(() => {
      nextSlide();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [banners.length, activeIndex]);

  if (isLoading) {
    return (
      <div 
        className={`relative ${rounded ? 'rounded-2xl' : ''} overflow-hidden bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse`}
        style={{ height: typeof window !== 'undefined' && window.innerWidth < 768 ? height.mobile : height.desktop }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
            <p className="mt-4 text-gray-600 font-medium">Loading banners...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && banners.length === 0) {
    return (
      <div 
        className={`relative ${rounded ? 'rounded-2xl' : ''} overflow-hidden bg-gradient-to-r from-emerald-500 to-emerald-600`}
        style={{ height: typeof window !== 'undefined' && window.innerWidth < 768 ? height.mobile : height.desktop }}
      >
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <div className="text-center text-white max-w-md">
            <h2 className="text-2xl font-bold mb-4">Unable to Load Banners</h2>
            <p className="mb-6">{error}</p>
            <button
              onClick={fetchBanners}
              className="inline-flex items-center gap-2 bg-white text-emerald-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              <RefreshCw size={18} />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${rounded ? 'rounded-2xl' : ''} shadow-lg`}>
      {/* Desktop Banners */}
      <div className="hidden md:block" style={{ height: height.desktop }}>
        {banners.map((banner, index) => {
          const imageUrl = getImageUrl(banner, false);
          const isActive = index === activeIndex;
          const hasImageError = imageErrors.has(banner.id);
          
          return (
            <div
              key={banner.id}
              className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                isActive ? 'opacity-100 z-10 scale-100' : 'opacity-0 z-0 scale-105'
              }`}
            >
              {hasImageError ? (
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-emerald-600 flex items-center justify-center">
                  <div className="text-white text-center p-8 max-w-2xl">
                    <h1 className="text-4xl font-bold mb-4">{banner.title}</h1>
                    {banner.subtitle && (
                      <p className="text-xl mb-8">{banner.subtitle}</p>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  {/* Background Image */}
                  <img
                    src={imageUrl}
                    alt={banner.title}
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={() => handleImageError(banner.id)}
                    loading={isActive ? "eager" : "lazy"}
                  />
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent" />
                  
                  {/* Content */}
                  <div className="relative h-full flex items-center">
                    <div className="container mx-auto px-8">
                      {showTitle && (
                        <div className="max-w-2xl text-white">
                          <h1 className="text-4xl md:text-5xl font-bold mb-4">
                            {banner.title}
                          </h1>
                          {banner.subtitle && (
                            <p className="text-xl mb-8">{banner.subtitle}</p>
                          )}
                          {banner.button_text && banner.button_link && (
                            <a
                              href={banner.button_link}
                              onClick={() => handleBannerClick(banner.id)}
                              className="inline-flex items-center bg-white text-emerald-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-all duration-300 hover:scale-105 shadow-lg"
                            >
                              {banner.button_text}
                              <ArrowRight className="ml-2" size={20} />
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile Banners */}
      <div className="md:hidden" style={{ height: height.mobile }}>
        {banners.map((banner, index) => {
          const mobileImageUrl = getImageUrl(banner, true);
          const isActive = index === activeIndex;
          const hasImageError = imageErrors.has(banner.id);
          
          return (
            <div
              key={banner.id}
              className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                isActive ? 'opacity-100 z-10 scale-100' : 'opacity-0 z-0 scale-105'
              }`}
            >
              {hasImageError ? (
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-emerald-600 flex items-end pb-8">
                  <div className="text-white p-6">
                    <h2 className="text-2xl font-bold mb-2">{banner.title}</h2>
                    {banner.subtitle && (
                      <p className="text-base mb-4">{banner.subtitle}</p>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  {/* Background Image */}
                  <img
                    src={mobileImageUrl}
                    alt={banner.title}
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={() => handleImageError(banner.id)}
                    loading={isActive ? "eager" : "lazy"}
                  />
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent" />
                  
                  {/* Content */}
                  {showTitle && (
                    <div className="relative h-full flex items-end pb-6 px-6">
                      <div className="text-white">
                        <h2 className="text-2xl font-bold mb-2">
                          {banner.title}
                        </h2>
                        {banner.subtitle && (
                          <p className="text-base mb-4">{banner.subtitle}</p>
                        )}
                        {banner.button_text && banner.button_link && (
                          <a
                            href={banner.button_link}
                            onClick={() => handleBannerClick(banner.id)}
                            className="inline-flex items-center bg-white text-emerald-600 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-gray-100 transition-colors duration-300"
                          >
                            {banner.button_text}
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Navigation Controls */}
      {banners.length > 1 && (
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
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveIndex(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === activeIndex 
                    ? 'bg-white scale-125 shadow-lg' 
                    : 'bg-white/50 hover:bg-white/70'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
      
      {/* Error Display */}
      {error && banners.length > 0 && (
        <div className="absolute top-4 right-4 z-30">
          <div className="bg-red-500/90 text-white px-4 py-2 rounded-lg text-sm backdrop-blur-sm">
            Using cached banners
          </div>
        </div>
      )}
    </div>
  );
};

export default BannerCarousel;