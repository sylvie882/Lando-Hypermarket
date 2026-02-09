'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

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
  autoPlay?: boolean;
  interval?: number;
}



const BannerCarousel: React.FC<BannerCarouselProps> = ({
  height = {
    mobile: '380px',
    desktop: '500px'
  },
  rounded = true,
  autoPlay = true,
  interval = 6000
}) => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isHovering, setIsHovering] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      setIsLoading(true);
      
      // For demo - using the provided API data directly
      const apiData = {
        "success":true,
        "data":[
          {
            "id":15,
            "title":"Fresh Farm Vegetables",
            "subtitle":"Naturally grown. Harvested with care.",
            "description":"Explore our wide selection of fresh, organic vegetables — from kales, cabbages, broccoli, sugarcane, garlic, onions, French beans, courgettes, asparagus, eggplants, pumpkins, baby veggies, herbs, leafy greens, and many more.",
            "image":"banners/banner-1770536616-69883ea884300.png",
            "mobile_image":"banners/banner-mobile-1770536616-69883ea88460d.png",
            "button_text":"Shop Vegetables",
            "button_link":"https://hypermarket.co.ke/categories",
            "order":"1",
            "is_active":true,
            "start_date":null,
            "end_date":null,
            "type":"homepage",
            "category_slug":null,
            "target_audience":[],
            "attributes":[],
            "clicks":5,
            "impressions":2322,
            "created_at":"2025-12-18T15:33:47.000000Z",
            "updated_at":"2026-02-09T05:56:50.000000Z",
            "deleted_at":null,
            "conversions":0,
            "image_url":"https://api.hypermarket.co.ke/storage/banners/banner-1770536616-69883ea884300.png",
            "mobile_image_url":"https://api.hypermarket.co.ke/storage/banners/banner-mobile-1770536616-69883ea88460d.png",
            "status":"active",
            "ctr":0.22,
            "conversion_rate":0
          },
          {
            "id":16,
            "title":"Fresh Seasonal Fruits",
            "subtitle":"Sweet, ripe, and handpicked from trusted farms.",
            "description":"Enjoy mangoes, bananas, apples, grapes, kiwi, pawpaw, jackfruit, soursop, peaches, pomegranate, tamarind, berries, star apple, sugar apple, plum, dragon fruit, and more.",
            "image":"banners/banner-1770533458-69883252c11d2.png",
            "mobile_image":"banners/banner-mobile-1770533458-69883252c15ab.png",
            "button_text":"Shop Fruits",
            "button_link":"https://hypermarket.co.ke/categories",
            "order":"2",
            "is_active":true,
            "start_date":null,
            "end_date":null,
            "type":"homepage",
            "category_slug":null,
            "target_audience":[],
            "attributes":[],
            "clicks":2,
            "impressions":2316,
            "created_at":"2025-12-18T15:38:16.000000Z",
            "updated_at":"2026-02-09T05:56:50.000000Z",
            "deleted_at":null,
            "conversions":0,
            "image_url":"https://api.hypermarket.co.ke/storage/banners/banner-1770533458-69883252c11d2.png",
            "mobile_image_url":"https://api.hypermarket.co.ke/storage/banners/banner-mobile-1770533458-69883252c15ab.png",
            "status":"active",
            "ctr":0.09,
            "conversion_rate":0
          },
          {
            "id":17,
            "title":"Premium Grains & Legumes",
            "subtitle":"Wholesome, nutritious staples for every kitchen.",
            "description":"Includes beans, green grams, black beans, nyayo beans, yellow beans, rosecoco, bambara nuts, maize, soya beans, sorghum, ndengu, yams, cassava, flour varieties, and more.",
            "image":"banners/banner-1770533806-698833ae5b622.png",
            "mobile_image":"banners/banner-mobile-1770533806-698833ae5ba32.png",
            "button_text":"Shop Grains",
            "button_link":"https://hypermarket.co.ke/categories",
            "order":"3",
            "is_active":true,
            "start_date":null,
            "end_date":null,
            "type":"homepage",
            "category_slug":null,
            "target_audience":[],
            "attributes":[],
            "clicks":1,
            "impressions":2312,
            "created_at":"2025-12-18T15:43:31.000000Z",
            "updated_at":"2026-02-09T05:56:50.000000Z",
            "deleted_at":null,
            "conversions":0,
            "image_url":"https://api.hypermarket.co.ke/storage/banners/banner-1770533806-698833ae5b622.png",
            "mobile_image_url":"https://api.hypermarket.co.ke/storage/banners/banner-mobile-1770533806-698833ae5ba32.png",
            "status":"active",
            "ctr":0.04,
            "conversion_rate":0
          },
          {
            "id":18,
            "title":"Healthy Nuts & Seeds",
            "subtitle":"Freshly harvested. Protein-rich. Naturally pure.",
            "description":"Choose from groundnuts (raw & roasted), simsim, cashew nuts, almonds, chia seeds, pumpkin seeds, and more protein-packed varieties.",
            "image":"banners/banner-1770534035-69883493ecfed.png",
            "mobile_image":"banners/banner-mobile-1770534035-69883493ed45f.png",
            "button_text":"Shop Nuts & Seeds",
            "button_link":"https://hypermarket.co.ke/categories",
            "order":"5",
            "is_active":true,
            "start_date":null,
            "end_date":null,
            "type":"homepage",
            "category_slug":null,
            "target_audience":[],
            "attributes":[],
            "clicks":4,
            "impressions":2310,
            "created_at":"2025-12-18T15:46:10.000000Z",
            "updated_at":"2026-02-09T05:56:50.000000Z",
            "deleted_at":null,
            "conversions":0,
            "image_url":"https://api.hypermarket.co.ke/storage/banners/banner-1770534035-69883493ecfed.png",
            "mobile_image_url":"https://api.hypermarket.co.ke/storage/banners/banner-mobile-1770534035-69883493ed45f.png",
            "status":"active",
            "ctr":0.17,
            "conversion_rate":0
          },
          {
            "id":21,
            "title":"Natural Tubers & Roots",
            "subtitle":"Traditional, nutritious, and filling.",
            "description":"Sweet potatoes, Irish potatoes, cassava, yams, arrowroot, turnips, beetroots, radish, ginger, turmeric, and more farm-fresh roots.",
            "image":"banners/banner-1767086467-695399837de4e.png",
            "mobile_image":"banners/banner-mobile-1767086467-695399837e1c6.png",
            "button_text":"Shop Tubers",
            "button_link":"https://hypermarket.co.ke/categories",
            "order":"5",
            "is_active":true,
            "start_date":null,
            "end_date":null,
            "type":"homepage",
            "category_slug":null,
            "target_audience":[],
            "attributes":[],
            "clicks":2,
            "impressions":2304,
            "created_at":"2025-12-18T15:55:42.000000Z",
            "updated_at":"2026-02-09T05:56:50.000000Z",
            "deleted_at":null,
            "conversions":0,
            "image_url":"https://api.hypermarket.co.ke/storage/banners/banner-1767086467-695399837de4e.png",
            "mobile_image_url":"https://api.hypermarket.co.ke/storage/banners/banner-mobile-1767086467-695399837e1c6.png",
            "status":"active",
            "ctr":0.09,
            "conversion_rate":0
          }
        ]
      };
      
      let bannerData: Banner[] = [];
      
      if (Array.isArray(apiData.data)) {
        // Parse and type-cast the banner data
        bannerData = apiData.data.map(banner => ({
          ...banner,
          order: parseInt(banner.order) || 0,
          type: banner.type as 'homepage' | 'category' | 'promotional' | 'sidebar',
          subtitle: banner.subtitle || null,
          mobile_image: banner.mobile_image || null,
          button_text: banner.button_text || null,
          button_link: banner.button_link || null,
          start_date: banner.start_date || null,
          end_date: banner.end_date || null,
          category_slug: banner.category_slug || null,
          clicks: banner.clicks || 0,
          impressions: banner.impressions || 0,
          created_at: banner.created_at,
          updated_at: banner.updated_at,
          image_url: banner.image_url || '',
          mobile_image_url: banner.mobile_image_url || ''
        }));
      }
      
      // Filter active banners and sort by order
      const activeBanners = bannerData
        .filter(banner => banner.is_active === true)
        .sort((a, b) => a.order - b.order);
      
      setBanners(activeBanners);
      
    } catch (error) {
      console.error('Failed to fetch banners:', error);
      setBanners([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getImageUrl = (banner: Banner, isMobile = false): string => {
    if (isMobile && banner.mobile_image_url) {
      return banner.mobile_image_url;
    }
    return banner.image_url || '/images/placeholder.jpg';
  };

  const nextSlide = () => {
    if (banners.length <= 1) return;
    setSlideDirection('right');
    setActiveIndex((prev) => (prev === banners.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    if (banners.length <= 1) return;
    setSlideDirection('left');
    setActiveIndex((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
  };

  // Auto-rotate slides
  useEffect(() => {
    if (!autoPlay || isHovering || banners.length <= 1) return;
    
    const intervalId = setInterval(() => {
      nextSlide();
    }, interval);
    
    return () => clearInterval(intervalId);
  }, [banners.length, activeIndex, autoPlay, isHovering, interval]);

  if (isLoading) {
    return (
      <div 
        className={`relative overflow-hidden bg-gradient-to-r from-green-50 via-lime-50 to-emerald-50 animate-pulse ${rounded ? 'rounded-3xl md:rounded-[2rem]' : ''}`}
        style={{ height: typeof window !== 'undefined' && window.innerWidth < 768 ? height.mobile : height.desktop }}
      />
    );
  }

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
      <div className={`relative overflow-hidden shadow-2xl group ${rounded ? 'rounded-3xl md:rounded-[2rem]' : ''}`}>
        
        {/* Desktop View */}
        <div className="hidden md:block" style={{ height: height.desktop }}>
          {banners.map((banner, index) => {
            const isActive = index === activeIndex;
            const isPrev = index === (activeIndex === 0 ? banners.length - 1 : activeIndex - 1);
            const isNext = index === (activeIndex === banners.length - 1 ? 0 : activeIndex + 1);
            
            let translateX = '0%';
            if (isActive) translateX = '0%';
            else if (isPrev) translateX = '-100%';
            else if (isNext) translateX = '100%';
            else translateX = '100%';
            
            return (
              <div
                key={banner.id}
                className={`absolute inset-0 transition-all duration-700 ease-in-out`}
                style={{
                  transform: `translateX(${translateX})`,
                  zIndex: isActive ? 20 : isPrev || isNext ? 10 : 0,
                  opacity: isActive || isPrev || isNext ? 1 : 0,
                }}
              >
                <BannerSlide 
                  banner={banner}
                  imageUrl={getImageUrl(banner, false)}
                  isActive={isActive}
                />
              </div>
            );
          })}
        </div>

        {/* Mobile View */}
        <div className="md:hidden" style={{ height: height.mobile }}>
          {banners.map((banner, index) => {
            const isActive = index === activeIndex;
            const isPrev = index === (activeIndex === 0 ? banners.length - 1 : activeIndex - 1);
            const isNext = index === (activeIndex === banners.length - 1 ? 0 : activeIndex + 1);
            
            let translateX = '0%';
            if (isActive) translateX = '0%';
            else if (isPrev) translateX = '-100%';
            else if (isNext) translateX = '100%';
            else translateX = '100%';
            
            return (
              <div
                key={banner.id}
                className={`absolute inset-0 transition-all duration-700 ease-in-out`}
                style={{
                  transform: `translateX(${translateX})`,
                  zIndex: isActive ? 20 : isPrev || isNext ? 10 : 0,
                  opacity: isActive || isPrev || isNext ? 1 : 0,
                }}
              >
                <BannerSlide 
                  banner={banner}
                  imageUrl={getImageUrl(banner, true)}
                  isActive={isActive}
                  isMobile={true}
                />
              </div>
            );
          })}
        </div>

        {/* Navigation Controls - Only show if there are multiple banners */}
        {banners.length > 1 && (
          <>
            <button
              onClick={prevSlide}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-3 rounded-full backdrop-blur-sm transition-all duration-300 z-30 shadow-xl hover:shadow-2xl hover:scale-110 opacity-0 group-hover:opacity-100"
              aria-label="Previous slide"
            >
              <ChevronLeft size={28} className="text-green-700" />
            </button>
            
            <button
              onClick={nextSlide}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-3 rounded-full backdrop-blur-sm transition-all duration-300 z-30 shadow-xl hover:shadow-2xl hover:scale-110 opacity-0 group-hover:opacity-100"
              aria-label="Next slide"
            >
              <ChevronRight size={28} className="text-green-700" />
            </button>
            
            {/* Dots Indicator */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-3 z-30">
              {banners.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setSlideDirection(index > activeIndex ? 'right' : 'left');
                    setActiveIndex(index);
                  }}
                  className={`transition-all duration-300 flex items-center`}
                  aria-label={`Go to slide ${index + 1}`}
                >
                  <div className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === activeIndex 
                      ? 'bg-green-400 scale-125 ring-4 ring-green-400/30' 
                      : 'bg-white/70 hover:bg-white'
                  }`} />
                </button>
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
      className="absolute inset-0 w-full h-full block group/slide"
    >
      <Image
        src={imageUrl}
        alt={banner.title}
        fill
        className="object-cover"
        priority={isActive}
        sizes="100vw"
      />
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/20 to-transparent" />
      
      {/* Content - Only Title and Button */}
      <div className="absolute inset-0 flex items-center justify-center md:justify-start">
        <div className={`text-white p-8 md:p-16 max-w-2xl transform transition-all duration-700 ${
          isActive ? 'translate-x-0 opacity-100' : 'opacity-0'
        } ${isMobile ? 'text-center' : 'ml-8 md:ml-16'}`}>
          
          {/* Title */}
          <h2 className={`font-bold leading-tight mb-6 md:mb-8 ${
            isMobile ? 'text-3xl md:text-4xl' : 'text-4xl md:text-5xl lg:text-6xl'
          }`}>
            {banner.title}
          </h2>
          
          {/* Button */}
          {banner.button_text && (
            <div className="mt-2">
              <button className="group/btn inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-500 hover:to-emerald-600 text-white font-bold rounded-xl shadow-2xl hover:shadow-green-500/30 transition-all duration-300 transform hover:-translate-y-1 hover:scale-105">
                <span className="text-lg">{banner.button_text}</span>
                <ArrowRight size={20} className="group-hover/btn:translate-x-2 transition-transform" />
              </button>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};


export default BannerCarousel;