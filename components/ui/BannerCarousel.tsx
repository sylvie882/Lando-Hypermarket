'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight, AlertCircle } from 'lucide-react';
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

const BannerCarousel: React.FC = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Fetching banners...');
      const response = await api.banners.getHomepage();
      
      let bannerData: Banner[] = [];
      
      // Handle different response formats
      if (response.data) {
        if (Array.isArray(response.data)) {
          bannerData = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          bannerData = response.data.data;
        } else if (response.data.success && Array.isArray(response.data.data)) {
          bannerData = response.data.data;
        } else if (typeof response.data === 'object') {
          bannerData = [response.data];
        }
      }
      
      // Filter active homepage banners
      const homepageBanners = bannerData
        .filter(banner => 
          banner.is_active && 
          banner.type === 'homepage' &&
          (banner.image || banner.image_url)
        )
        .sort((a, b) => a.order - b.order);
      
      console.log('Loaded banners:', homepageBanners);
      setBanners(homepageBanners);
      
    } catch (error: any) {
      console.error('Failed to fetch banners:', error);
      setError(error.message || 'Failed to load banners');
    } finally {
      setIsLoading(false);
    }
  };

  // Simple, direct image URL construction
  const getImageUrl = (banner: Banner, isMobile = false): string => {
    // Priority 1: Use the URL fields from API
    if (!isMobile && banner.image_url) {
      return banner.image_url;
    }
    
    if (isMobile && banner.mobile_image_url) {
      return banner.mobile_image_url;
    }
    
    // Priority 2: Construct from image paths
    const imagePath = isMobile ? banner.mobile_image || banner.image : banner.image;
    
    if (!imagePath) {
      return '/default-banner.jpg'; // Make sure this file exists in public folder
    }
    
    // If it's already a full URL, return it
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    // Clean the path
    let cleanPath = imagePath;
    if (cleanPath.startsWith('/')) {
      cleanPath = cleanPath.substring(1);
    }
    
    // Direct URL construction - based on your working example
    const baseUrl = 'https://api.hypermarket.co.ke';
    const finalUrl = `${baseUrl}/storage/${cleanPath}`;
    
    console.log('Generated banner URL:', finalUrl);
    return finalUrl;
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

  // Auto-rotate slides
  useEffect(() => {
    if (banners.length <= 1) return;
    
    const interval = setInterval(() => {
      nextSlide();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [banners.length]);

  if (isLoading) {
    return (
      <div className="h-[400px] md:h-[600px] bg-gradient-to-r from-gray-100 to-gray-200 animate-pulse">
        <div className="container mx-auto px-4 h-full flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Loading banners...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[400px] md:h-[600px] bg-gradient-to-r from-red-50 to-red-100 border border-red-200">
        <div className="container mx-auto px-4 h-full flex items-center justify-center">
          <div className="text-center max-w-md">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-xl font-bold text-red-800 mb-2">Error Loading Banners</h2>
            <p className="text-red-600 mb-6">{error}</p>
            <button
              onClick={fetchBanners}
              className="bg-orange-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-orange-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (banners.length === 0) {
    return (
      <div className="h-[400px] md:h-[600px] bg-gradient-to-r from-orange-500 to-orange-600">
        <div className="container mx-auto px-4 h-full flex items-center">
          <div className="max-w-2xl text-white">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Welcome to Lando Ranch</h1>
            <p className="text-xl mb-8">Fresh farm products delivered to your doorstep</p>
            <a
              href="/products"
              className="inline-flex items-center bg-white text-orange-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-300"
            >
              Shop Now
              <ArrowRight className="ml-2" size={20} />
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden group">
      {/* Desktop Banners */}
      <div className="hidden md:block h-[600px]">
        {banners.map((banner, index) => {
          const imageUrl = getImageUrl(banner, false);
          
          return (
            <div
              key={banner.id}
              className={`absolute inset-0 transition-all duration-500 ease-in-out ${
                index === activeIndex 
                  ? 'opacity-100 z-10 translate-x-0' 
                  : 'opacity-0 z-0 translate-x-full'
              }`}
            >
              {/* Background Image */}
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: `url(${imageUrl})`,
                }}
              />
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-black/20" />
              
              {/* Content */}
              <div className="relative h-full flex items-center">
                <div className="container mx-auto px-4">
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
                        target={banner.button_link.startsWith('http') ? '_blank' : '_self'}
                        rel="noopener noreferrer"
                        className="inline-flex items-center bg-white text-orange-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-all duration-300 hover:scale-105"
                      >
                        {banner.button_text}
                        <ArrowRight className="ml-2" size={20} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile Banners */}
      <div className="md:hidden h-[400px]">
        {banners.map((banner, index) => {
          const mobileImageUrl = getImageUrl(banner, true);
          
          return (
            <div
              key={banner.id}
              className={`absolute inset-0 transition-all duration-500 ease-in-out ${
                index === activeIndex 
                  ? 'opacity-100 z-10 translate-x-0' 
                  : 'opacity-0 z-0 translate-x-full'
              }`}
            >
              {/* Background Image */}
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: `url(${mobileImageUrl})`,
                }}
              />
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
              
              {/* Content */}
              <div className="relative h-full flex items-end pb-8">
                <div className="container mx-auto px-4">
                  <div className="text-white">
                    <h2 className="text-2xl font-bold mb-2">
                      {banner.title}
                    </h2>
                    {banner.subtitle && (
                      <p className="text-base mb-4 opacity-90">{banner.subtitle}</p>
                    )}
                    {banner.button_text && banner.button_link && (
                      <a
                        href={banner.button_link}
                        onClick={() => handleBannerClick(banner.id)}
                        target={banner.button_link.startsWith('http') ? '_blank' : '_self'}
                        rel="noopener noreferrer"
                        className="inline-flex items-center bg-white text-orange-600 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-gray-100 transition-colors duration-300"
                      >
                        {banner.button_text}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation Controls */}
      {banners.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full backdrop-blur-sm transition-all duration-300 z-20 opacity-0 group-hover:opacity-100 hover:scale-110"
            aria-label="Previous slide"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full backdrop-blur-sm transition-all duration-300 z-20 opacity-0 group-hover:opacity-100 hover:scale-110"
            aria-label="Next slide"
          >
            <ChevronRight size={24} />
          </button>
          
          {/* Indicators */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-2 z-20">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveIndex(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === activeIndex 
                    ? 'bg-white scale-125' 
                    : 'bg-white/50 hover:bg-white/80'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default BannerCarousel;