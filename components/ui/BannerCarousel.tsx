'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
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
      console.log('API Response:', response);
      
      let bannerData: Banner[] = [];
      
      // Handle different response formats
      if (response.data) {
        if (Array.isArray(response.data)) {
          bannerData = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          bannerData = response.data.data;
        } else if (response.data.success && Array.isArray(response.data.data)) {
          bannerData = response.data.data;
        }
      }
      
      console.log('Processed banners:', bannerData);
      
      // Filter active homepage banners
      const homepageBanners = bannerData
        .filter(banner => 
          banner.is_active && 
          banner.type === 'homepage' &&
          banner.image
        )
        .sort((a, b) => a.order - b.order);
      
      console.log('Homepage banners:', homepageBanners);
      setBanners(homepageBanners);
      
    } catch (error: any) {
      console.error('Failed to fetch banners:', error);
      setError(error.message || 'Failed to load banners');
    } finally {
      setIsLoading(false);
    }
  };

  // Get the correct image URL
  const getImageUrl = (banner: Banner, isMobile = false): string => {
    // Try image_url from API first
    if (!isMobile && banner.image_url) {
      console.log('Using image_url from API:', banner.image_url);
      return banner.image_url;
    }
    
    if (isMobile && banner.mobile_image_url) {
      console.log('Using mobile_image_url from API:', banner.mobile_image_url);
      return banner.mobile_image_url;
    }
    
    // Fallback: Construct URL from image path
    const imagePath = isMobile ? banner.mobile_image || banner.image : banner.image;
    
    if (!imagePath) {
      console.warn('No image path found for banner:', banner.id);
      return 'https://via.placeholder.com/1200x600/4F46E5/FFFFFF?text=No+Image';
    }
    
    // Check if already a full URL
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      console.log('Image is already full URL:', imagePath);
      return imagePath;
    }
    
    // Construct full URL - FIXED VERSION
    const baseUrl = 'https://api.hypermarket.co.ke';
    const cleanPath = imagePath.replace(/^\//, ''); // Remove leading slash
    
    // Check if path already includes 'storage'
    if (cleanPath.startsWith('storage/')) {
      const url = `${baseUrl}/${cleanPath}`;
      console.log('Constructed URL (with storage):', url);
      return url;
    }
    
    // Otherwise add storage prefix
    const url = `${baseUrl}/storage/${cleanPath}`;
    console.log('Constructed URL (added storage):', url);
    return url;
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

  // Debug: Log image URLs when banners change
  useEffect(() => {
    if (banners.length > 0) {
      console.log('=== DEBUG: Banner Image URLs ===');
      banners.forEach((banner, index) => {
        const desktopUrl = getImageUrl(banner, false);
        const mobileUrl = getImageUrl(banner, true);
        
        console.log(`Banner ${index} - ${banner.title}:`, {
          id: banner.id,
          image_field: banner.image,
          image_url_field: banner.image_url,
          desktopUrl,
          mobile_image_field: banner.mobile_image,
          mobile_image_url_field: banner.mobile_image_url,
          mobileUrl,
        });
      });
      console.log('=== END DEBUG ===');
    }
  }, [banners]);

  if (isLoading) {
    return (
      <div className="h-[400px] md:h-[600px] bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse">
        <div className="container mx-auto px-4 h-full flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
            <p className="mt-4 text-gray-600">Loading banners...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[400px] md:h-[600px] bg-gradient-to-r from-red-500 to-red-600">
        <div className="container mx-auto px-4 h-full flex items-center justify-center">
          <div className="text-center text-white">
            <h2 className="text-2xl font-bold mb-4">Error Loading Banners</h2>
            <p className="mb-4">{error}</p>
            <button
              onClick={fetchBanners}
              className="bg-white text-red-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-100"
            >
              Retry
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
    <div className="relative overflow-hidden">
      {/* Desktop Banners */}
      <div className="hidden md:block h-[600px]">
        {banners.map((banner, index) => {
          const imageUrl = getImageUrl(banner, false);
          
          return (
            <div
              key={banner.id}
              className={`absolute inset-0 transition-opacity duration-500 ${
                index === activeIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
              }`}
              style={{
                backgroundImage: `url(${imageUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-black/30" />
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
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center bg-white text-orange-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-300"
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
              className={`absolute inset-0 transition-opacity duration-500 ${
                index === activeIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
              }`}
              style={{
                backgroundImage: `url(${mobileImageUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/20" />
              <div className="relative h-full flex items-end pb-8">
                <div className="container mx-auto px-4">
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
                        target="_blank"
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
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-2 z-20">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveIndex(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === activeIndex ? 'bg-white scale-125' : 'bg-white/50'
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