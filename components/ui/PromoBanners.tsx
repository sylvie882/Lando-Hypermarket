'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Tag, Clock, Percent, Gift, Sparkles, Flame, Star, Zap } from 'lucide-react';
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
  /** Max banners to show (default: all active banners) */
  limit?: number;
  /** Section heading — leave empty to hide */
  heading?: string;
  /** Show as horizontal slider instead of grid */
  sliderMode?: boolean;
}

// Predefined style variants for different banner appearances
const bannerStyles = [
  { gradient: 'from-blue-900/90 to-purple-900/90', badge: '🔥 HOT', badgeColor: 'bg-red-500', icon: Flame },
  { gradient: 'from-green-900/90 to-emerald-900/90', badge: '🎁 SPECIAL', badgeColor: 'bg-green-500', icon: Gift },
  { gradient: 'from-orange-900/90 to-amber-900/90', badge: '⭐ FEATURED', badgeColor: 'bg-amber-500', icon: Star },
  { gradient: 'from-pink-900/90 to-rose-900/90', badge: '💝 EXCLUSIVE', badgeColor: 'bg-pink-500', icon: Sparkles },
  { gradient: 'from-indigo-900/90 to-violet-900/90', badge: '⚡ LIMITED', badgeColor: 'bg-indigo-500', icon: Zap },
  { gradient: 'from-cyan-900/90 to-teal-900/90', badge: '🎯 DEAL', badgeColor: 'bg-cyan-500', icon: Percent },
  { gradient: 'from-slate-900/90 to-gray-900/90', badge: '⏰ SALE', badgeColor: 'bg-slate-500', icon: Clock },
  { gradient: 'from-yellow-900/90 to-amber-900/90', badge: '🏷️ PROMO', badgeColor: 'bg-yellow-600', icon: Tag },
];

const PromoBanners: React.FC<PromoBannersProps> = ({
  limit = 0, // 0 means no limit
  heading = 'Special Offers',
  sliderMode = false,
}) => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

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
      const res = await api.banners.getAll({ type: 'promotional' });
      let data: Banner[] = [];
      if (res.data?.data) data = res.data.data;
      else if (Array.isArray(res.data)) data = res.data;

      const activePromos = data
        .filter((b) => b.is_active)
        .sort((a, b) => a.order - b.order);

      const finalBanners = limit > 0 ? activePromos.slice(0, limit) : activePromos;
      setBanners(finalBanners);

      // Track impressions
      finalBanners.forEach((b) => api.banners.trackImpression(b.id).catch(() => {}));
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

  const handleClick = (id: number) => {
    api.banners.trackClick(id).catch(() => {});
  };

  // Auto-slide for slider mode
  useEffect(() => {
    if (!sliderMode || banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [sliderMode, banners.length]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const goPrev = () => {
    setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const goNext = () => {
    setCurrentSlide((prev) => (prev + 1) % banners.length);
  };

  /* ── Loading skeleton ── */
  if (isLoading) {
    return (
      <section className="pb-section">
        {heading && (
          <div className="pb-header">
            <span className="pb-heading-skeleton" />
          </div>
        )}
        <div className="pb-skeleton-grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="pb-skeleton pb-skeleton--card" />
          ))}
        </div>
      </section>
    );
  }

  if (banners.length === 0) return null;

  /* ── Slider Mode ── */
  if (sliderMode) {
    const currentBanner = banners[currentSlide];
    const styleIndex = currentSlide % bannerStyles.length;
    const style = bannerStyles[styleIndex];
    const IconComponent = style.icon;

    return (
      <section className="pb-section pb-section--slider">
        {heading && (
          <div className="pb-header">
            <h2 className="pb-heading">{heading}</h2>
            {banners.length > 1 && (
              <div className="pb-slider-controls">
                <button onClick={goPrev} className="pb-slider-nav" aria-label="Previous">
                  ‹
                </button>
                <button onClick={goNext} className="pb-slider-nav" aria-label="Next">
                  ›
                </button>
              </div>
            )}
          </div>
        )}

        <div className="pb-slider-container">
          <div
            className="pb-slider-track"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {banners.map((banner, idx) => {
              const bannerStyle = bannerStyles[idx % bannerStyles.length];
              const BannerIcon = bannerStyle.icon;
              return (
                <div key={banner.id} className="pb-slide">
                  <Link
                    href={getLink(banner)}
                    onClick={() => handleClick(banner.id)}
                    className="pb-card pb-card--slider"
                  >
                    {getImageUrl(banner) && (
                      <Image
                        src={getImageUrl(banner)}
                        alt={banner.title}
                        fill
                        className="pb-img"
                        priority={idx === 0}
                      />
                    )}
                    <div className={`pb-overlay-slider bg-gradient-to-r ${bannerStyle.gradient}`}>
                      <div className="pb-content-slider">
                        <div className="flex items-center gap-2 mb-3">
                          <span className={`pb-badge ${bannerStyle.badgeColor}`}>
                            <BannerIcon className="w-3 h-3 inline mr-1" />
                            {bannerStyle.badge}
                          </span>
                        </div>
                        <h3 className="pb-title-slider">{banner.title}</h3>
                        {banner.subtitle && (
                          <p className="pb-subtitle-slider">{banner.subtitle}</p>
                        )}
                        {banner.button_text && (
                          <span className="pb-btn-slider">
                            {banner.button_text}
                            <ArrowRight className="w-4 h-4" />
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>

        {banners.length > 1 && (
          <div className="pb-dots">
            {banners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => goToSlide(idx)}
                className={`pb-dot ${idx === currentSlide ? 'pb-dot--active' : ''}`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        )}

        <style jsx global>{`
          .pb-section--slider {
            overflow: hidden;
          }
          .pb-slider-controls {
            display: flex;
            gap: 8px;
          }
          .pb-slider-nav {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background: white;
            border: 1px solid #e5e7eb;
            font-size: 24px;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
            color: #374151;
          }
          .pb-slider-nav:hover {
            background: #f3f4f6;
            border-color: #d1d5db;
          }
          .pb-slider-container {
            overflow: hidden;
            border-radius: 20px;
          }
          .pb-slider-track {
            display: flex;
            transition: transform 0.5s ease-out;
          }
          .pb-slide {
            flex: 0 0 100%;
            min-width: 0;
          }
          .pb-card--slider {
            position: relative;
            display: block;
            width: 100%;
            aspect-ratio: 21/9;
            overflow: hidden;
            border-radius: 20px;
          }
          .pb-overlay-slider {
            position: absolute;
            inset: 0;
            z-index: 1;
          }
          .pb-content-slider {
            position: absolute;
            z-index: 2;
            bottom: 0;
            left: 0;
            right: 0;
            padding: 24px;
            background: linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%);
          }
          .pb-title-slider {
            font-size: 1.5rem;
            font-weight: 800;
            color: white;
            margin: 0 0 8px;
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
          }
          .pb-subtitle-slider {
            font-size: 0.9rem;
            color: rgba(255,255,255,0.85);
            margin: 0 0 12px;
            max-width: 60%;
          }
          .pb-btn-slider {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: white;
            color: #1f2937;
            padding: 8px 20px;
            border-radius: 40px;
            font-weight: 600;
            font-size: 0.85rem;
            transition: all 0.2s;
          }
          .pb-btn-slider:hover {
            gap: 10px;
            transform: translateX(2px);
          }
          .pb-dots {
            display: flex;
            justify-content: center;
            gap: 8px;
            margin-top: 16px;
          }
          .pb-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #cbd5e1;
            cursor: pointer;
            transition: all 0.2s;
            border: none;
          }
          .pb-dot--active {
            width: 24px;
            border-radius: 4px;
            background: #004E9A;
          }
          @media (max-width: 768px) {
            .pb-card--slider { aspect-ratio: 4/3; }
            .pb-subtitle-slider { max-width: 100%; font-size: 0.75rem; }
            .pb-title-slider { font-size: 1.1rem; }
            .pb-content-slider { padding: 16px; }
          }
        `}</style>
      </section>
    );
  }

  /* ── Grid Mode with multiple styles ── */
  return (
    <section className="pb-section">
      {heading && (
        <div className="pb-header">
          <h2 className="pb-heading">{heading}</h2>
          <Link href="/promotions" className="pb-see-all">
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      <div className="pb-grid-multi">
        {banners.map((banner, index) => {
          const style = bannerStyles[index % bannerStyles.length];
          const IconComponent = style.icon;
          const size = index === 0 ? 'large' : index <= 2 ? 'medium' : 'small';
          
          return (
            <Link
              key={banner.id}
              href={getLink(banner)}
              onClick={() => handleClick(banner.id)}
              className={`pb-card-multi pb-card-multi--${size}`}
            >
              {getImageUrl(banner) && (
                <Image
                  src={getImageUrl(banner)}
                  alt={banner.title}
                  fill
                  className="pb-img-multi"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  priority={index < 3}
                />
              )}
              <div className={`pb-overlay-multi bg-gradient-to-tr ${style.gradient}`}>
                <div className="pb-content-multi">
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className={`pb-badge-multi ${style.badgeColor}`}>
                      <IconComponent className="w-3 h-3 inline mr-1" />
                      {style.badge}
                    </span>
                  </div>
                  <h3 className="pb-title-multi">{banner.title}</h3>
                  {banner.subtitle && size !== 'small' && (
                    <p className="pb-subtitle-multi">{banner.subtitle}</p>
                  )}
                  {banner.button_text && size !== 'small' && (
                    <span className="pb-btn-multi">
                      {banner.button_text}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <style jsx global>{`
        .pb-section {
          padding: 24px 16px 8px;
          max-width: 1400px;
          margin: 0 auto;
          width: 100%;
        }
        @media (min-width: 640px) {
          .pb-section { padding: 28px 24px 10px; }
        }
        @media (min-width: 1024px) {
          .pb-section { padding: 32px 48px 12px; }
        }

        .pb-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }
        .pb-heading {
          font-size: 1.3rem;
          font-weight: 800;
          color: #111827;
          letter-spacing: -0.02em;
          margin: 0;
        }
        @media (min-width: 768px) {
          .pb-heading { font-size: 1.6rem; }
        }
        .pb-heading-skeleton {
          display: block;
          width: 180px;
          height: 28px;
          border-radius: 6px;
          background: #e5e7eb;
        }
        .pb-see-all {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.85rem;
          font-weight: 600;
          color: #004E9A;
          text-decoration: none;
          transition: gap 0.18s;
        }
        .pb-see-all:hover { gap: 8px; }

        /* Multi-grid layout */
        .pb-grid-multi {
          display: grid;
          gap: 16px;
          grid-template-columns: 1fr;
        }
        @media (min-width: 640px) {
          .pb-grid-multi {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (min-width: 1024px) {
          .pb-grid-multi {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        @media (min-width: 1280px) {
          .pb-grid-multi {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        /* Card sizing */
        .pb-card-multi {
          position: relative;
          display: block;
          overflow: hidden;
          border-radius: 20px;
          text-decoration: none;
          cursor: pointer;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          box-shadow: 0 4px 14px rgba(0,0,0,0.1);
        }
        .pb-card-multi:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 30px -12px rgba(0,0,0,0.25);
        }
        .pb-card-multi--large {
          aspect-ratio: 16/9;
        }
        .pb-card-multi--medium {
          aspect-ratio: 4/3;
        }
        .pb-card-multi--small {
          aspect-ratio: 1/1;
        }
        @media (min-width: 768px) {
          .pb-card-multi--large { aspect-ratio: 16/10; }
          .pb-card-multi--medium { aspect-ratio: 5/4; }
        }

        .pb-img-multi {
          object-fit: cover;
          transition: transform 0.5s ease;
        }
        .pb-card-multi:hover .pb-img-multi {
          transform: scale(1.05);
        }

        .pb-overlay-multi {
          position: absolute;
          inset: 0;
          z-index: 1;
        }
        .pb-content-multi {
          position: absolute;
          z-index: 2;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 20px;
          background: linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%);
          border-radius: 20px;
        }
        .pb-card-multi--large .pb-content-multi {
          padding: 28px;
        }
        .pb-card-multi--small .pb-content-multi {
          padding: 12px;
          background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%);
        }

        .pb-badge-multi {
          display: inline-flex;
          align-items: center;
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: white;
          padding: 3px 8px;
          border-radius: 20px;
          gap: 3px;
        }
        .pb-title-multi {
          font-size: 1rem;
          font-weight: 800;
          color: white;
          line-height: 1.3;
          text-shadow: 0 1px 3px rgba(0,0,0,0.5);
          margin: 0 0 4px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .pb-card-multi--large .pb-title-multi {
          font-size: 1.35rem;
          margin-bottom: 6px;
        }
        .pb-card-multi--small .pb-title-multi {
          font-size: 0.85rem;
          -webkit-line-clamp: 2;
        }
        @media (min-width: 768px) {
          .pb-title-multi { font-size: 1.1rem; }
          .pb-card-multi--large .pb-title-multi { font-size: 1.5rem; }
        }

        .pb-subtitle-multi {
          font-size: 0.7rem;
          color: rgba(255,255,255,0.85);
          margin: 0 0 8px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        @media (min-width: 768px) {
          .pb-subtitle-multi { font-size: 0.8rem; }
        }

        .pb-btn-multi {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.7rem;
          font-weight: 600;
          color: white;
          background: rgba(255,255,255,0.2);
          backdrop-filter: blur(4px);
          padding: 5px 12px;
          border-radius: 30px;
          transition: all 0.2s;
        }
        .pb-btn-multi:hover {
          gap: 8px;
          background: rgba(255,255,255,0.3);
        }

        /* Skeleton */
        .pb-skeleton-grid {
          display: grid;
          gap: 16px;
          grid-template-columns: 1fr;
        }
        @media (min-width: 640px) {
          .pb-skeleton-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (min-width: 1024px) {
          .pb-skeleton-grid { grid-template-columns: repeat(3, 1fr); }
        }
        @media (min-width: 1280px) {
          .pb-skeleton-grid { grid-template-columns: repeat(4, 1fr); }
        }
        .pb-skeleton--card {
          aspect-ratio: 4/3;
          border-radius: 20px;
          background: linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%);
          background-size: 200% 100%;
          animation: pb-shimmer 1.4s infinite;
        }
        @keyframes pb-shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </section>
  );
};

export default PromoBanners;