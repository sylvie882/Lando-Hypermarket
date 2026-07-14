'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
  image_url: string;
  mobile_image_url: string | null;
}

interface PromoBannersProps {
  /** Max banners to show (default: 5) */
  limit?: number;
  /** Auto-scroll speed in milliseconds (default: 3000) */
  autoScrollInterval?: number;
}

const PromoBanners: React.FC<PromoBannersProps> = ({
  limit = 5,
  autoScrollInterval = 3000,
}) => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showWords, setShowWords] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const autoScrollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const wordTimerRef = useRef<NodeJS.Timeout | null>(null);

  const getLink = (banner: Banner): string => {
    if (banner.button_link) return banner.button_link;
    if (banner.category_slug) return `/categories/${banner.category_slug}`;
    return '/products';
  };

  const getImageUrl = (banner: Banner, isMobile = false): string => {
    if (isMobile && banner.mobile_image_url) return banner.mobile_image_url;
    return banner.image_url || '';
  };

  const fetchBanners = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await api.banners.getAll({ type: 'promotional', limit });
      let data: Banner[] = [];
      if (res.data?.data) data = res.data.data;
      else if (Array.isArray(res.data)) data = res.data;

      const promo = data
        .filter((b) => b.is_active)
        .sort((a, b) => a.order - b.order)
        .slice(0, limit);

      setBanners(promo);

      // Track impressions
      promo.forEach((b) => api.banners.trackImpression(b.id).catch(() => {}));
    } catch (e) {
      console.error('PromoBanners fetch error:', e);
      setBanners([]);
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  // Words appear and disappear together
  useEffect(() => {
    if (banners.length === 0 || !banners[currentIndex]) return;

    // Clear any existing timer
    if (wordTimerRef.current) {
      clearTimeout(wordTimerRef.current);
    }

    const animateWords = () => {
      // Show words
      setShowWords(true);
      
      // Wait, then hide words
      wordTimerRef.current = setTimeout(() => {
        setShowWords(false);
        
        // Wait, then show again
        wordTimerRef.current = setTimeout(() => {
          animateWords();
        }, 1000); // Hide for 1 second
      }, 2500); // Show for 2.5 seconds
    };

    // Start the animation
    const initialDelay = setTimeout(animateWords, 500);

    return () => {
      clearTimeout(initialDelay);
      if (wordTimerRef.current) {
        clearTimeout(wordTimerRef.current);
      }
    };
  }, [currentIndex, banners]);

  // Auto-scroll logic
  useEffect(() => {
    if (banners.length === 0 || isPaused) return;

    const startAutoScroll = () => {
      if (autoScrollTimerRef.current) {
        clearInterval(autoScrollTimerRef.current);
      }
      autoScrollTimerRef.current = setInterval(() => {
        setCurrentIndex((prevIndex) => 
          prevIndex === banners.length - 1 ? 0 : prevIndex + 1
        );
      }, autoScrollInterval);
    };

    startAutoScroll();

    return () => {
      if (autoScrollTimerRef.current) {
        clearInterval(autoScrollTimerRef.current);
      }
    };
  }, [banners.length, autoScrollInterval, isPaused]);

  // Scroll to current index
  useEffect(() => {
    if (scrollContainerRef.current && banners.length > 0) {
      const container = scrollContainerRef.current;
      const cardWidth = container.querySelector('.pb-card')?.clientWidth || 0;
      const gap = 12;
      const scrollPosition = currentIndex * (cardWidth + gap);
      container.scrollTo({
        left: scrollPosition,
        behavior: 'smooth',
      });
    }
  }, [currentIndex, banners.length]);

  const handleClick = (id: number) => {
    api.banners.trackClick(id).catch(() => {});
  };

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? banners.length - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === banners.length - 1 ? 0 : prevIndex + 1
    );
  };

  /* ── Loading skeleton ── */
  if (isLoading) {
    return (
      <section className="pb-section">
        <div className="pb-scroll-container pb-scroll-container--skeleton">
          {[1, 2, 3].map((i) => (
            <div key={i} className="pb-skeleton pb-skeleton--card" />
          ))}
        </div>
      </section>
    );
  }

  if (banners.length === 0) return null;

  return (
    <section 
      className="pb-section"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Controls */}
      {/* <div className="pb-controls-wrapper">
        <div className="pb-controls">
          <button 
            onClick={goToPrevious}
            className="pb-control-btn"
            aria-label="Previous banner"
          >
            <ChevronLeft size={24} />
          </button>
          <div className="pb-dots">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`pb-dot ${index === currentIndex ? 'pb-dot--active' : ''}`}
                aria-label={`Go to banner ${index + 1}`}
              />
            ))}
          </div>
          <button 
            onClick={goToNext}
            className="pb-control-btn"
            aria-label="Next banner"
          >
            <ChevronRight size={24} />
          </button>
        </div> 
      </div>*/}

      {/* Scrollable container */}
      <div 
        ref={scrollContainerRef}
        className="pb-scroll-container"
      >
        {banners.map((banner, index) => (
          <BannerCard
            key={banner.id}
            banner={banner}
            imageUrl={getImageUrl(banner)}
            link={getLink(banner)}
            onClick={handleClick}
            isActive={index === currentIndex}
            showWords={index === currentIndex ? showWords : false}
            words={banner.title.split(' ')}
          />
        ))}
      </div>

      <style jsx global>{`
        /* ─── Section ─── */
        .pb-section {
          padding: 24px 16px 8px;
          max-width: 1400px;
          margin: 0 auto;
          width: 100%;
          position: relative;
        }
        @media (min-width: 640px)  { .pb-section { padding: 28px 24px 10px; } }
        @media (min-width: 1024px) { .pb-section { padding: 32px 48px 12px; } }

        /* ─── Controls ─── */
        // .pb-controls-wrapper {
        //   display: flex;
        //   justify-content: flex-end;
        //   margin-bottom: 14px;
        // }
        
        // .pb-controls {
        //   display: flex;
        //   align-items: center;
        //   gap: 8px;
        // }
        // .pb-control-btn {
        //   display: flex;
        //   align-items: center;
        //   justify-content: center;
        //   width: 40px;
        //   height: 40px;
        //   border-radius: 50%;
        //   border: 2px solid #E67E22;
        //   background: rgba(255, 255, 255, 0.9);
        //   color: #E67E22;
        //   cursor: pointer;
        //   transition: all 0.2s ease;
        //   padding: 0;
        //   backdrop-filter: blur(4px);
        // }
        // .pb-control-btn:hover {
        //   background: #E67E22;
        //   color: #fff;
        //   transform: scale(1.05);
        //   box-shadow: 0 4px 12px rgba(230, 126, 34, 0.3);
        // }
        // .pb-control-btn:active {
        //   transform: scale(0.95);
        // }

        // .pb-dots {
        //   display: flex;
        //   gap: 8px;
        //   align-items: center;
        // }
        // .pb-dot {
        //   width: 10px;
        //   height: 10px;
        //   border-radius: 50%;
        //   border: none;
        //   background: rgba(209, 213, 219, 0.6);
        //   cursor: pointer;
        //   transition: all 0.3s ease;
        //   padding: 0;
        //   backdrop-filter: blur(4px);
        // }
        // .pb-dot:hover {
        //   background: #E67E22;
        //   transform: scale(1.2);
        // }
        // .pb-dot--active {
        //   background: #004E9A;
        //   width: 28px;
        //   border-radius: 5px;
        // }

        /* ─── Scroll Container ─── */
        .pb-scroll-container {
          display: flex;
          gap: 12px;
          overflow-x: auto;
          overflow-y: hidden;
          scroll-behavior: smooth;
          scroll-snap-type: x mandatory;
          -webkit-overflow-scrolling: touch;
          padding: 4px 2px 8px;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .pb-scroll-container::-webkit-scrollbar {
          display: none;
        }
        .pb-scroll-container--skeleton {
          gap: 12px;
        }

        /* ─── Skeleton ─── */
        .pb-skeleton--card {
          flex: 0 0 calc(100% - 4px);
          min-height: 200px;
          border-radius: 16px;
          background: linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%);
          background-size: 200% 100%;
          animation: pb-shimmer 1.4s infinite;
          scroll-snap-align: start;
        }
        @media (min-width: 640px) {
          .pb-skeleton--card { flex: 0 0 calc(50% - 6px); min-height: 240px; }
        }
        @media (min-width: 1024px) {
          .pb-skeleton--card { flex: 0 0 calc(33.333% - 8px); min-height: 280px; }
        }
        @keyframes pb-shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        /* ─── Banner Card ─── */
        .pb-card {
          position: relative;
          flex: 0 0 calc(100% - 4px);
          min-height: 300px;
          border-radius: 16px;
          overflow: hidden;
          text-decoration: none;
          cursor: pointer;
          background: #1a1a2e;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          scroll-snap-align: start;
          box-shadow: 0 2px 14px rgba(0,0,0,0.13);
        }
        .pb-card:hover {
          transform: scale(1.02);
          box-shadow: 0 14px 32px rgba(0,0,0,0.2);
          z-index: 99;
        }
        .pb-card:active { transform: scale(0.98); }

        @media (min-width: 640px) {
          .pb-card { 
            flex: 0 0 calc(50% - 6px);
            min-height: 240px;
          }
        }
        @media (min-width: 1024px) {
          .pb-card { 
            flex: 0 0 calc(33.333% - 8px);
            min-height: 320px;
          }
        }

        /* ─── Image ─── */
        .pb-img {
          object-fit: cover;
          transition: transform 0.5s ease;
        }
        .pb-card:hover .pb-img { transform: scale(1.08); }

        /* ─── Overlays ─── */
        .pb-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to top,
            rgba(0, 0, 0, 0.7) 0%,
            rgba(0, 0, 0, 0.2) 60%,
            rgba(0, 0, 0, 0.05) 100%
          );
          z-index: 1;
        }

        /* ─── Content ─── */
        .pb-content {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 2;
          padding: 20px;
          width: 90%;
          text-align: center;
        }

        /* Title - All words appear and disappear together */
        .pb-title-wrapper {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          align-items: center;
          gap: 4px 12px;
          min-height: 10rem;
          transition: all 0.5s ease;
        }

        .pb-word {
          font-size: 2.8rem;
          font-weight: 900;
          line-height: 1.2;
          letter-spacing: -0.02em;
          text-shadow: 0 4px 20px rgba(0, 0, 0, 0.6);
          opacity: 1;
          transform: scale(1);
          transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
          display: inline-block;
          position: relative;
        }
        
        /* Words alternate between orange and blue */
        .pb-word--orange {
          color: #E67E22;
        }
        
        .pb-word--blue {
          color: #004E9A;
        }

        /* When words are hidden */
        .pb-word--hidden {
          opacity: 0;
          transform: scale(0.5) rotate(-5deg);
        }

        /* When words are visible */
        .pb-word--visible {
          opacity: 1;
          transform: scale(1) rotate(0deg);
        }

        /* Glow effects for visible words */
        .pb-word--orange.pb-word--visible {
          text-shadow: 0 0 50px rgba(230, 126, 34, 0.5), 0 4px 20px rgba(0, 0, 0, 0.6);
        }
        
        .pb-word--blue.pb-word--visible {
          text-shadow: 0 0 50px rgba(0, 78, 154, 0.5), 0 4px 20px rgba(0, 0, 0, 0.6);
        }

        @media (min-width: 640px) {
          .pb-title-wrapper {
            min-height: 12rem;
          }
          .pb-word {
            font-size: 3.8rem;
          }
        }
        @media (min-width: 768px) {
          .pb-title-wrapper {
            min-height: 14rem;
          }
          .pb-word {
            font-size: 4.8rem;
          }
        }
        @media (min-width: 1024px) {
          .pb-title-wrapper {
            min-height: 10rem;
          }
          .pb-word {
            font-size: 5.8rem;
          }
        }
        @media (min-width: 1280px) {
          .pb-word {
            font-size: 6.8rem;
          }
        }
      `}</style>
    </section>
  );
};

/* ── Individual banner card ── */
interface BannerCardProps {
  banner: Banner;
  imageUrl: string;
  link: string;
  onClick: (id: number) => void;
  isActive: boolean;
  showWords: boolean;
  words: string[];
}

const BannerCard: React.FC<BannerCardProps> = ({ 
  banner, 
  imageUrl, 
  link, 
  onClick,
  isActive,
  showWords,
  words
}) => (
  <Link
    href={link}
    onClick={() => onClick(banner.id)}
    className="pb-card"
  >
    {/* Image */}
    {imageUrl && (
      <Image
        src={imageUrl}
        alt={banner.title}
        fill
        className="pb-img"
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        priority={isActive}
      />
    )}
    
    {/* Overlay */}
    <div className="pb-overlay" />
    
    {/* Content - Only animated words */}
    <div className="pb-content">
      <div className="pb-title-wrapper">
        {words.map((word, index) => {
          // Alternate colors: even index = orange, odd index = blue
          const colorClass = index % 2 === 0 ? 'pb-word--orange' : 'pb-word--blue';
          const visibilityClass = showWords ? 'pb-word--visible' : 'pb-word--hidden';
          
          return (
            <span 
              key={index}
              className={`pb-word ${colorClass} ${visibilityClass}`}
            >
              {word}
            </span>
          );
        })}
      </div>
    </div>
  </Link>
);

export default PromoBanners;