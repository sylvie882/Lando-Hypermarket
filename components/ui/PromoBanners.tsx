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
  /** Auto-scroll speed in milliseconds (default: 5000) */
  autoScrollInterval?: number;
}

const PromoBanners: React.FC<PromoBannersProps> = ({
  limit = 5,
  autoScrollInterval = 5000,
}) => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const autoScrollTimerRef = useRef<NodeJS.Timeout | null>(null);

  const getLink = (banner: Banner): string => {
    if (banner.button_link) return banner.button_link;
    if (banner.category_slug) return `/categories/${banner.category_slug}`;
    return '/products';
  };

  const getImageUrl = (banner: Banner): string => banner.image_url || '';

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

  // Auto-advance
  useEffect(() => {
    if (banners.length <= 1 || isPaused) return;

    autoScrollTimerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev === banners.length - 1 ? 0 : prev + 1));
    }, autoScrollInterval);

    return () => {
      if (autoScrollTimerRef.current) clearInterval(autoScrollTimerRef.current);
    };
  }, [banners.length, autoScrollInterval, isPaused, currentIndex]);

  const handleClick = (id: number) => {
    api.banners.trackClick(id).catch(() => {});
  };

  const goTo = (index: number) => setCurrentIndex(index);
  const goToPrevious = () =>
    setCurrentIndex((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
  const goToNext = () =>
    setCurrentIndex((prev) => (prev === banners.length - 1 ? 0 : prev + 1));

  if (isLoading) {
    return (
      <section className="pb-section">
        <div className="pb-skeleton" />
        <style jsx global>{`
          .pb-section { padding: 24px 16px; max-width: 1400px; margin: 0 auto; }
          @media (min-width: 1024px) { .pb-section { padding: 32px 48px; } }
          .pb-skeleton {
            height: 40vh;
            min-height: 200px;
            border-radius: 24px;
            background: linear-gradient(90deg, #1c1d24 25%, #26272f 50%, #1c1d24 75%);
            background-size: 200% 100%;
            animation: pb-shimmer 1.4s infinite;
          }
          @keyframes pb-shimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}</style>
      </section>
    );
  }

  if (banners.length === 0) return null;

  const banner = banners[currentIndex];
  const imageUrl = getImageUrl(banner);
  const link = getLink(banner);

  return (
    <section
      className="pb-section"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="pb-stage">
        {/* Story-style progress track */}
        {banners.length > 1 && (
          <div className="pb-progress-track" role="tablist" aria-label="Promotions">
            {banners.map((b, i) => (
              <button
                key={b.id}
                className="pb-progress-seg"
                role="tab"
                aria-selected={i === currentIndex}
                aria-label={`Show promotion ${i + 1}`}
                onClick={() => goTo(i)}
              >
                <span
                  className={`pb-progress-fill ${
                    i < currentIndex ? 'pb-progress-fill--done' : ''
                  } ${i === currentIndex ? 'pb-progress-fill--active' : ''}`}
                  style={
                    i === currentIndex
                      ? ({
                          animationDuration: `${autoScrollInterval}ms`,
                          animationPlayState: isPaused ? 'paused' : 'running',
                        } as React.CSSProperties)
                      : undefined
                  }
                  key={`${b.id}-${currentIndex === i ? 'active' : 'idle'}`}
                />
              </button>
            ))}
          </div>
        )}

        <Link href={link} onClick={() => handleClick(banner.id)} className="pb-card">
          {imageUrl && (
            <Image
              key={banner.id}
              src={imageUrl}
              alt={banner.title}
              fill
              className="pb-img"
              sizes="100vw"
              priority
              unoptimized={imageUrl.startsWith('http')}
            />
          )}
        </Link>

        {banners.length > 1 && (
          <>
            <button
              className="pb-nav pb-nav--prev"
              onClick={(e) => {
                e.preventDefault();
                goToPrevious();
              }}
              aria-label="Previous promotion"
            >
              <ChevronLeft size={20} strokeWidth={2.5} />
            </button>
            <button
              className="pb-nav pb-nav--next"
              onClick={(e) => {
                e.preventDefault();
                goToNext();
              }}
              aria-label="Next promotion"
            >
              <ChevronRight size={20} strokeWidth={2.5} />
            </button>
          </>
        )}
      </div>

      <style jsx global>{`
        .pb-section {
          padding: 24px 16px;
          max-width: 1400px;
          margin: 0 auto;
          width: 100%;
        }
        @media (min-width: 640px)  { .pb-section { padding: 28px 24px; } }
        @media (min-width: 1024px) { .pb-section { padding: 36px 48px; } }

        .pb-stage {
          position: relative;
        }

        /* ─── Story-style progress track ─── */
        .pb-progress-track {
          display: flex;
          gap: 6px;
          margin-bottom: 12px;
          padding: 0 2px;
        }
        .pb-progress-seg {
          flex: 1;
          height: 3px;
          background: rgba(255, 255, 255, 0.15);
          border: none;
          border-radius: 999px;
          padding: 0;
          cursor: pointer;
          overflow: hidden;
          position: relative;
        }
        .pb-progress-fill {
          display: block;
          height: 100%;
          width: 0%;
          background: #fff;
          border-radius: 999px;
        }
        .pb-progress-fill--done { width: 100%; }
        .pb-progress-fill--active {
          animation-name: pb-fill;
          animation-timing-function: linear;
          animation-fill-mode: forwards;
        }
        @keyframes pb-fill {
          from { width: 0%; }
          to { width: 100%; }
        }

        /* ─── Card ─── */
        .pb-card {
          position: relative;
          display: block;
          width: 100%;
          height: 50vh;
          min-height: 200px;
          max-height: 500px;
          border-radius: 24px;
          overflow: hidden;
          text-decoration: none;
          background: #14151a;
          box-shadow: 0 20px 50px -20px rgba(0, 0, 0, 0.5);
        }

        .pb-img {
          object-fit: cover;
          animation: pb-kenburns 12s ease-out infinite alternate;
          width: 100% !important;
          height: 100% !important;
        }
        @keyframes pb-kenburns {
          from { transform: scale(1); }
          to   { transform: scale(1.08); }
        }

        /* ─── Prev/Next nav ─── */
        .pb-nav {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.25);
          background: rgba(20, 21, 26, 0.45);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          opacity: 0;
          transition: opacity 0.25s ease, background 0.25s ease, transform 0.2s ease;
          z-index: 3;
        }
        .pb-stage:hover .pb-nav { opacity: 1; }
        .pb-nav:hover { background: rgba(255, 255, 255, 0.15); transform: translateY(-50%) scale(1.06); }
        .pb-nav--prev { left: 16px; }
        .pb-nav--next { right: 16px; }

        @media (hover: none) {
          .pb-nav { display: none; }
        }
      `}</style>
    </section>
  );
};

export default PromoBanners;