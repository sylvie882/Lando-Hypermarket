'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { api } from '@/lib/api';

interface Banner {
  id: number;
  title: string;
  subtitle: string | null;
  description: string | null;
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
  image_url: string;
  mobile_image_url: string | null;
}

interface BannerCarouselProps {
  height?: {
    mobile?: string;
    desktop?: string;
  };
  rounded?: boolean;
  autoPlay?: boolean;
  interval?: number;
}

const BannerCarousel: React.FC<BannerCarouselProps> = ({
  height = {
    mobile: '280px',
    desktop: '400px'
  },
  rounded = true,
  autoPlay = true,
  interval = 6000
}) => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isHovering, setIsHovering] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState<'left' | 'right'>('right');

  // Fetch banners from the correct API endpoint
  const fetchBanners = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Use the specific homepage banners endpoint
      const response = await api.banners.getHomepage();
      
      // Extract data from the response
      let bannerData: Banner[] = [];
      
      if (response.data?.data) {
        bannerData = response.data.data;
      } else if (Array.isArray(response.data)) {
        bannerData = response.data;
      }
      
      // Filter active banners and sort by order
      const activeBanners = bannerData
        .filter(banner => banner.is_active === true)
        .sort((a, b) => a.order - b.order);
      
      setBanners(activeBanners);
      setActiveIndex(0);
      
      // Track impressions for each banner
      activeBanners.forEach(banner => {
        api.banners.trackImpression(banner.id).catch(console.error);
      });
      
    } catch (error) {
      console.error('Failed to fetch homepage banners:', error);
      setBanners([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  const getImageUrl = (banner: Banner, isMobile = false): string => {
    if (isMobile && banner.mobile_image_url) {
      return banner.mobile_image_url;
    }
    return banner.image_url || '/images/placeholder-banner.jpg';
  };

  const nextSlide = useCallback(() => {
    if (banners.length <= 1 || isAnimating) return;
    setIsAnimating(true);
    setDirection('right');
    setActiveIndex((prev) => (prev + 1) % banners.length);
    
    // Track click on next
    if (banners[activeIndex]) {
      api.banners.trackClick(banners[activeIndex].id).catch(console.error);
    }
    
    setTimeout(() => setIsAnimating(false), 700);
  }, [banners.length, isAnimating, banners, activeIndex]);

  const prevSlide = useCallback(() => {
    if (banners.length <= 1 || isAnimating) return;
    setIsAnimating(true);
    setDirection('left');
    setActiveIndex((prev) => (prev - 1 + banners.length) % banners.length);
    
    // Track click on prev
    if (banners[activeIndex]) {
      api.banners.trackClick(banners[activeIndex].id).catch(console.error);
    }
    
    setTimeout(() => setIsAnimating(false), 700);
  }, [banners.length, isAnimating, banners, activeIndex]);

  // Track click on active banner
  const handleBannerClick = useCallback((bannerId: number) => {
    api.banners.trackClick(bannerId).catch(console.error);
  }, []);

  // Auto-rotate slides
  useEffect(() => {
    if (!autoPlay || isHovering || banners.length <= 1 || isAnimating) return;
    
    const intervalId = setInterval(() => {
      nextSlide();
    }, interval);
    
    return () => clearInterval(intervalId);
  }, [banners.length, autoPlay, isHovering, interval, nextSlide, isAnimating]);

  // Loading skeleton
  if (isLoading) {
    return (
      <div 
        className={`relative overflow-hidden bg-gradient-to-r from-[#E67E22]/20 via-[#F8FAF5] to-[#E67E22]/20 animate-pulse ${rounded ? 'rounded-xl md:rounded-2xl' : ''}`}
        style={{ height: typeof window !== 'undefined' && window.innerWidth < 768 ? height.mobile : height.desktop }}
      />
    );
  }

  // No banners
  if (banners.length === 0) {
    return null;
  }

  return (
    <div 
      className="relative group"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Main Carousel Container */}
      <div className={`relative overflow-hidden shadow-xl ${rounded ? 'rounded-xl md:rounded-2xl' : ''}`}>
        
        {/* Desktop View - Infinite Carousel */}
        <div className="hidden md:block" style={{ height: height.desktop }}>
          {banners.map((banner, index) => {
            const isActive = index === activeIndex;
            
            let transform = '';
            let zIndex = 0;
            let opacity = 0;
            
            if (isActive) {
              transform = 'translateX(0)';
              zIndex = 20;
              opacity = 1;
            } else if (direction === 'right') {
              if (index === (activeIndex - 1 + banners.length) % banners.length) {
                transform = 'translateX(-100%)';
                zIndex = 10;
                opacity = 1;
              } else {
                transform = 'translateX(100%)';
                zIndex = 0;
                opacity = 0;
              }
            } else {
              if (index === (activeIndex + 1) % banners.length) {
                transform = 'translateX(100%)';
                zIndex = 10;
                opacity = 1;
              } else {
                transform = 'translateX(-100%)';
                zIndex = 0;
                opacity = 0;
              }
            }
            
            return (
              <div
                key={banner.id}
                className="absolute inset-0 transition-all duration-700 ease-in-out"
                style={{ transform, zIndex, opacity }}
              >
                <BannerSlide 
                  banner={banner}
                  imageUrl={getImageUrl(banner, false)}
                  isActive={isActive}
                  onTrackClick={handleBannerClick}
                />
              </div>
            );
          })}
        </div>

        {/* Mobile View - Infinite Carousel */}
        <div className="md:hidden" style={{ height: height.mobile }}>
          {banners.map((banner, index) => {
            const isActive = index === activeIndex;
            
            let transform = '';
            let zIndex = 0;
            let opacity = 0;
            
            if (isActive) {
              transform = 'translateX(0)';
              zIndex = 20;
              opacity = 1;
            } else if (direction === 'right') {
              if (index === (activeIndex - 1 + banners.length) % banners.length) {
                transform = 'translateX(-100%)';
                zIndex = 10;
                opacity = 1;
              } else {
                transform = 'translateX(100%)';
                zIndex = 0;
                opacity = 0;
              }
            } else {
              if (index === (activeIndex + 1) % banners.length) {
                transform = 'translateX(100%)';
                zIndex = 10;
                opacity = 1;
              } else {
                transform = 'translateX(-100%)';
                zIndex = 0;
                opacity = 0;
              }
            }
            
            return (
              <div
                key={banner.id}
                className="absolute inset-0 transition-all duration-700 ease-in-out"
                style={{ transform, zIndex, opacity }}
              >
                <BannerSlide 
                  banner={banner}
                  imageUrl={getImageUrl(banner, true)}
                  isActive={isActive}
                  isMobile={true}
                  onTrackClick={handleBannerClick}
                />
              </div>
            );
          })}
        </div>

        {/* Navigation Controls */}
        {banners.length > 1 && (
          <>
            <button
              onClick={prevSlide}
              disabled={isAnimating}
              className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-2 md:p-3 rounded-xl backdrop-blur-sm transition-all duration-300 z-30 shadow-lg hover:shadow-xl hover:scale-110 opacity-0 group-hover:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Previous slide"
            >
              <ChevronLeft size={20} className="md:w-6 md:h-6 text-[#E67E22]" />
            </button>
            
            <button
              onClick={nextSlide}
              disabled={isAnimating}
              className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-2 md:p-3 rounded-xl backdrop-blur-sm transition-all duration-300 z-30 shadow-lg hover:shadow-xl hover:scale-110 opacity-0 group-hover:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Next slide"
            >
              <ChevronRight size={20} className="md:w-6 md:h-6 text-[#E67E22]" />
            </button>
            
            {/* Dots Indicator */}
            <div className="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 flex space-x-2 md:space-x-3 z-30">
              {banners.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    if (isAnimating) return;
                    setIsAnimating(true);
                    setDirection(index > activeIndex ? 'right' : 'left');
                    setActiveIndex(index);
                    setTimeout(() => setIsAnimating(false), 700);
                  }}
                  className="transition-all duration-300 flex items-center"
                  aria-label={`Go to slide ${index + 1}`}
                >
                  <div className={`w-2 h-2 md:w-2.5 md:h-2.5 rounded-full transition-all duration-300 ${
                    index === activeIndex 
                      ? 'bg-[#E67E22] scale-125 ring-4 ring-[#E67E22]/30' 
                      : 'bg-white/70 hover:bg-white'
                  }`} />
                </button>
              ))}
            </div>

            {/* Slide Counter */}
            <div className="absolute bottom-4 md:bottom-6 right-4 md:right-6 z-30 bg-black/40 backdrop-blur-md text-white px-3 py-1.5 md:px-4 md:py-2 rounded-xl text-xs md:text-sm font-medium">
              {activeIndex + 1} / {banners.length}
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
  onTrackClick: (id: number) => void;
}> = ({ banner, imageUrl, isActive, isMobile = false, onTrackClick }) => {
  
  const getBannerLink = (): string => {
    if (banner.button_link) {
      return banner.button_link;
    }
    if (banner.category_slug) {
      return `/categories/${banner.category_slug}`;
    }
    return '/products';
  };

  return (
    <Link
      href={getBannerLink()}
      onClick={() => onTrackClick(banner.id)}
      className="absolute inset-0 w-full h-full block group/slide"
    >
      <Image
        src={imageUrl}
        alt={banner.title}
        fill
        className="object-cover transition-transform duration-700 group-hover/slide:scale-105"
        priority={isActive}
        sizes="100vw"
      />
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/30 to-transparent rounded-xl md:rounded-2xl" />
      
      {/* Content */}
      <div className="absolute inset-0 flex items-center justify-center md:justify-start">
        <div className={`text-white p-5 md:p-12 max-w-2xl transform transition-all duration-700 ${
          isActive ? 'translate-x-0 opacity-100' : '-translate-x-5 md:-translate-x-10 opacity-0'
        } ${isMobile ? 'text-center' : 'ml-4 md:ml-16'}`}>
          
          {/* Title */}
          <h2 className={`font-bold leading-tight mb-2 md:mb-4 ${
            isMobile ? 'text-xl md:text-2xl' : 'text-2xl md:text-3xl lg:text-4xl'
          }`}>
            <span className="bg-gradient-to-r from-white via-orange-100 to-[#E67E22]/30 bg-clip-text text-transparent">
              {banner.title}
            </span>
          </h2>
          
          {/* Subtitle */}
          {banner.subtitle && (
            <p className="text-xs md:text-sm text-white/90 mb-3 md:mb-4 max-w-lg">
              {banner.subtitle}
            </p>
          )}
          
          {/* Button - Warm Orange */}
          {banner.button_text && (
            <button className="group/btn inline-flex items-center gap-1.5 md:gap-2 px-4 py-2 md:px-6 md:py-3 bg-[#E67E22] hover:bg-[#D35400] text-white font-semibold rounded-lg md:rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 text-xs md:text-sm">
              <span>{banner.button_text}</span>
              <ArrowRight size={14} className="md:w-4 md:h-4 group-hover/btn:translate-x-1 transition-transform" />
            </button>
          )}
        </div>
      </div>
    </Link>
  );
};

export default BannerCarousel;