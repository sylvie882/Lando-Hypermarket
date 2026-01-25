'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
}

const BannerCarousel: React.FC<BannerCarouselProps> = ({
  height = {
    mobile: '280px',
    desktop: '380px'
  },
  rounded = true
}) => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      setIsLoading(true);
      
      // Fetch banners from your API
      const response = await fetch('https://api.hypermarket.co.ke/api/banners/homepage');
      
      if (!response.ok) {
        throw new Error(`API responded with ${response.status}`);
      }
      
      const data = await response.json();
      
      // Process the response based on your API structure
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
      // Set empty array instead of fallback banners
      setBanners([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Get the correct image URL
  const getImageUrl = (banner: Banner, isMobile = false): string => {
    // Use image_url from API if available
    if (!isMobile && banner.image_url) {
      return banner.image_url;
    }
    
    if (isMobile && banner.mobile_image_url) {
      return banner.mobile_image_url;
    }
    
    // Use mobile image for mobile, fallback to regular image
    const imagePath = isMobile ? banner.mobile_image || banner.image : banner.image;
    
    if (!imagePath) {
      return '';
    }
    
    // Check if already a full URL
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    // Construct full URL for relative paths
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

  // Get link for banner click
  const getBannerLink = (banner: Banner): string => {
    if (banner.button_link) {
      return banner.button_link.startsWith('/') ? banner.button_link : `/${banner.button_link}`;
    }
    if (banner.category_slug) {
      return `/categories/${banner.category_slug}`;
    }
    // Default to products page
    return '/products';
  };

  // Auto-rotate banners
  useEffect(() => {
    if (banners.length <= 1) return;
    
    const interval = setInterval(() => {
      nextSlide();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [banners.length, activeIndex]);

  // Show nothing if loading or no banners
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

  // Return null if no banners (component will be invisible)
  if (banners.length === 0) {
    return null;
  }

  return (
    <div className={`relative overflow-hidden ${rounded ? 'rounded-2xl' : ''} shadow-lg`}>
      {/* Desktop Banners */}
      <div className="hidden md:block" style={{ height: height.desktop }}>
        {banners.map((banner, index) => {
          const imageUrl = getImageUrl(banner, false);
          const isActive = index === activeIndex;
          const bannerLink = getBannerLink(banner);
          
          if (!imageUrl) return null;
          
          return (
            <div
              key={banner.id}
              className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                isActive ? 'opacity-100 z-10 scale-100' : 'opacity-0 z-0 scale-105'
              }`}
            >
              <a
                href={bannerLink}
                className="absolute inset-0 w-full h-full block"
              >
                <img
                  src={imageUrl}
                  alt={banner.title}
                  className="w-full h-full object-cover"
                  loading={isActive ? "eager" : "lazy"}
                />
                {/* Optional: Add text overlay if banner has title */}
                {banner.title && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
                    <h2 className="text-white text-2xl font-bold">{banner.title}</h2>
                    {banner.subtitle && (
                      <p className="text-white/90 mt-1">{banner.subtitle}</p>
                    )}
                  </div>
                )}
              </a>
            </div>
          );
        })}
      </div>

      {/* Mobile Banners */}
      <div className="md:hidden" style={{ height: height.mobile }}>
        {banners.map((banner, index) => {
          const mobileImageUrl = getImageUrl(banner, true);
          const isActive = index === activeIndex;
          const bannerLink = getBannerLink(banner);
          
          if (!mobileImageUrl) return null;
          
          return (
            <div
              key={banner.id}
              className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                isActive ? 'opacity-100 z-10 scale-100' : 'opacity-0 z-0 scale-105'
              }`}
            >
              <a
                href={bannerLink}
                className="absolute inset-0 w-full h-full block"
              >
                <img
                  src={mobileImageUrl}
                  alt={banner.title}
                  className="w-full h-full object-cover"
                  loading={isActive ? "eager" : "lazy"}
                />
                {/* Optional: Add text overlay for mobile */}
                {banner.title && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                    <h2 className="text-white text-lg font-bold">{banner.title}</h2>
                  </div>
                )}
              </a>
            </div>
          );
        })}
      </div>

      {/* Navigation Controls - Only show if more than 1 banner */}
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
  );
};

export default BannerCarousel;