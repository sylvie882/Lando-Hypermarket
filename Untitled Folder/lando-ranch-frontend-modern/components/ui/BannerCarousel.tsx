'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
    mobile: '20vh',
    desktop: '20vh'
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
  const [mounted, setMounted] = useState(false);
  const [windowWidth, setWindowWidth] = useState(0);
  const [isZoomingOut, setIsZoomingOut] = useState(false);

  useEffect(() => {
    setMounted(true);
    setWindowWidth(window.innerWidth);
    
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchBanners = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await api.banners.getHomepage();
      
      let bannerData: Banner[] = [];
      
      if (response.data?.data) {
        bannerData = response.data.data;
      } else if (Array.isArray(response.data)) {
        bannerData = response.data;
      }
      
      const activeBanners = bannerData
        .filter(banner => banner.is_active === true)
        .sort((a, b) => a.order - b.order);
      
      setBanners(activeBanners);
      setActiveIndex(0);
      
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
    
    // Start zoom out animation
    setIsZoomingOut(true);
    setIsAnimating(true);
    
    // After zoom out, change slide
    setTimeout(() => {
      setActiveIndex((prev) => (prev + 1) % banners.length);
      setIsZoomingOut(false);
      
      if (banners[activeIndex]) {
        api.banners.trackClick(banners[activeIndex].id).catch(console.error);
      }
      
      setTimeout(() => setIsAnimating(false), 300);
    }, 700);
  }, [banners.length, isAnimating, banners, activeIndex]);

  const prevSlide = useCallback(() => {
    if (banners.length <= 1 || isAnimating) return;
    
    // Start zoom out animation
    setIsZoomingOut(true);
    setIsAnimating(true);
    
    // After zoom out, change slide
    setTimeout(() => {
      setActiveIndex((prev) => (prev - 1 + banners.length) % banners.length);
      setIsZoomingOut(false);
      
      if (banners[activeIndex]) {
        api.banners.trackClick(banners[activeIndex].id).catch(console.error);
      }
      
      setTimeout(() => setIsAnimating(false), 300);
    }, 700);
  }, [banners.length, isAnimating, banners, activeIndex]);

  const handleBannerClick = useCallback((bannerId: number) => {
    api.banners.trackClick(bannerId).catch(console.error);
  }, []);

  const goToSlide = (index: number) => {
    if (index === activeIndex || isAnimating) return;
    
    // Start zoom out animation
    setIsZoomingOut(true);
    setIsAnimating(true);
    
    // After zoom out, change slide
    setTimeout(() => {
      setActiveIndex(index);
      setIsZoomingOut(false);
      setTimeout(() => setIsAnimating(false), 300);
    }, 700);
  };

  useEffect(() => {
    if (!autoPlay || isHovering || banners.length <= 1 || isAnimating) return;
    
    const intervalId = setInterval(() => {
      nextSlide();
    }, interval);
    
    return () => clearInterval(intervalId);
  }, [banners.length, autoPlay, isHovering, interval, nextSlide, isAnimating]);

  // Get current height based on window width (only on client side)
  const getCurrentHeight = () => {
    if (!mounted) return '20vh';
    const isMobile = windowWidth < 768;
    return isMobile ? height.mobile : height.desktop;
  };

  if (isLoading) {
    return (
      <div 
        className={`relative overflow-hidden bg-gradient-to-r from-[#E67E22]/20 via-[#F8FAF5] to-[#E67E22]/20 animate-pulse ${rounded ? 'rounded-xl md:rounded-2xl' : ''}`}
        style={{ height: '20vh', minHeight: '150px', maxHeight: '300px' }}
      />
    );
  }

  if (banners.length === 0) {
    return null;
  }

  if (!mounted) {
    return (
      <div 
        className={`relative overflow-hidden bg-gradient-to-r from-[#E67E22]/20 via-[#F8FAF5] to-[#E67E22]/20 ${rounded ? 'rounded-xl md:rounded-2xl' : ''}`}
        style={{ height: '20vh', minHeight: '150px', maxHeight: '300px' }}
      />
    );
  }

  const isMobile = windowWidth < 768;

  return (
    <div 
      className="relative group"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className={`relative overflow-hidden shadow-xl ${rounded ? 'rounded-xl md:rounded-2xl' : ''}`}>
        <div style={{ 
          height: getCurrentHeight(),
          minHeight: '300px',
          maxHeight: '600px'
        }}>
          {/* Current Banner - Zooms out when transitioning */}
          {banners.map((banner, index) => {
            const isActive = index === activeIndex;
            const isNext = index === (activeIndex + 1) % banners.length;
            const isPrev = index === (activeIndex - 1 + banners.length) % banners.length;
            
            // Only show current, next, and previous banners
            if (!isActive && !isNext && !isPrev) return null;
            
            let opacity = 0;
            let scale = 1;
            let zIndex = 0;
            
            if (isActive) {
              // Current banner - zooms out when transitioning
              opacity = isZoomingOut ? 0 : 1;
              scale = isZoomingOut ? 1.1 : 1;
              zIndex = 20;
            } else if (isNext || isPrev) {
              // Next/Previous banner - fades in
              opacity = isZoomingOut ? 1 : 0;
              scale = isZoomingOut ? 1 : 0.95;
              zIndex = 10;
            }
            
            return (
              <div
                key={banner.id}
                className="absolute inset-0 transition-all duration-700 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]"
                style={{ 
                  opacity, 
                  transform: `scale(${scale})`,
                  zIndex,
                  pointerEvents: isActive ? 'auto' : 'none'
                }}
              >
                <BannerSlide 
                  banner={banner}
                  imageUrl={getImageUrl(banner, isMobile)}
                  isActive={isActive}
                  onTrackClick={handleBannerClick}
                />
              </div>
            );
          })}
        </div>

        {banners.length > 1 && (
          <>
            <button
              onClick={prevSlide}
              disabled={isAnimating}
              className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-30 p-1.5 md:p-2 rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white/40 transition-all duration-300 opacity-0 group-hover:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Previous slide"
            >
              <ChevronLeft size={20} className="md:w-6 md:h-6" />
            </button>
            <button
              onClick={nextSlide}
              disabled={isAnimating}
              className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-30 p-1.5 md:p-2 rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white/40 transition-all duration-300 opacity-0 group-hover:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Next slide"
            >
              <ChevronRight size={20} className="md:w-6 md:h-6" />
            </button>
          </>
        )}

        {banners.length > 1 && (
          <div className="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 flex space-x-2 md:space-x-3 z-30">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
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
        )}
      </div>
    </div>
  );
};

// Banner Slide Component - Only Image, No Text with fixed height
const BannerSlide: React.FC<{
  banner: Banner;
  imageUrl: string;
  isActive: boolean;
  onTrackClick: (id: number) => void;
}> = ({ banner, imageUrl, isActive, onTrackClick }) => {
  
  const getBannerLink = (): string => {
    if (banner.button_link) {
      return banner.button_link;
    }
    if (banner.category_slug) {
      return `/categories/${banner.category_slug}`;
    }
    return '/products';
  };

  const imagePriority = isActive;

  return (
    <Link
      href={getBannerLink()}
      onClick={() => onTrackClick(banner.id)}
      className="absolute inset-0 w-full h-full block group/slide"
    >
      <div className="relative w-full h-full">
        <Image
          src={imageUrl}
          alt={banner.title}
          fill
          className="object-cover transition-transform duration-700 group-hover/slide:scale-105"
          priority={imagePriority}
          sizes="100vw"
          quality={90}
          style={{ 
            objectFit: 'cover',
            width: '100%',
            height: '100%'
          }}
        />
      </div>
    </Link>
  );
};

export default BannerCarousel;